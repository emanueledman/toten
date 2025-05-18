document.addEventListener('DOMContentLoaded', () => {
    console.info("Inicializando página do totem...");
    
    if (window.location.pathname.includes('totem-dashboard.html')) {
        if (!totemAuthService.checkAuthAndRedirect()) {
            console.warn("Verificação de autenticação falhou");
            return;
        }
        
        totemAuthService.setTotemInfoUI();
        
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            console.debug("Botão de logout encontrado, configurando handler");
            logoutBtn.addEventListener('click', () => {
                console.info("Logout do totem iniciado pelo usuário");
                totemAuthService.logout();
            });
        } else {
            console.warn("Botão de logout não encontrado!");
        }
        
        async function loadServices() {
            showLoading(true);
            try {
                const totemInfo = totemAuthService.getTotemInfo();
                const branchId = totemInfo.branchId;
                
                if (!branchId) {
                    console.error("Branch ID não encontrado.");
                    showMessage("Erro: Filial não identificada.", "error");
                    return;
                }
                
                const response = await axios.get(`${API_BASE}/api/totem/branches/${branchId}/services`);
                const data = response.data;
                
                const servicesList = document.getElementById('services-list');
                if (!servicesList) {
                    console.error("Elemento services-list não encontrado.");
                    showMessage("Erro: Contêiner de serviços não encontrado.", "error");
                    return;
                }
                
                servicesList.innerHTML = '';
                
                if (data.categories && data.categories.length > 0) {
                    data.categories.forEach(category => {
                        const categoryDiv = document.createElement('div');
                        categoryDiv.className = 'mb-6';
                        categoryDiv.innerHTML = `<h3 class="text-lg font-medium mb-2">${category.category_name}</h3>`;
                        
                        category.services.forEach(service => {
                            const serviceButton = document.createElement('button');
                            serviceButton.className = 'w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 mb-2 text-left';
                            serviceButton.innerText = `${service.service_name} (Espera: ${service.estimated_wait_time})`;
                            serviceButton.addEventListener('click', () => generateTicket(branchId, service.service_id));
                            categoryDiv.appendChild(serviceButton);
                        });
                        
                        servicesList.appendChild(categoryDiv);
                    });
                } else {
                    servicesList.innerHTML = '<p class="text-gray-600">Nenhum serviço disponível no momento.</p>';
                    showMessage("Nenhum serviço disponível no momento.", "info");
                }
            } catch (error) {
                console.error("Erro ao carregar serviços:", error);
                showMessage("Erro ao carregar serviços. Tente novamente.", "error");
            } finally {
                showLoading(false);
            }
        }
        
        async function generateTicket(branchId, serviceId) {
            showLoading(true);
            try {
                const response = await axios.post(
                    `${API_BASE}/api/totem/branches/${branchId}/services/${serviceId}/ticket`,
                    {},
                    { responseType: 'blob' }
                );
                
                if (response.headers['content-type'] !== 'application/pdf') {
                    throw new Error("Resposta não é um PDF válido");
                }
                
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `ticket_${serviceId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                showMessage("Ticket gerado com sucesso!", "success");
            } catch (error) {
                console.error("Erro ao gerar ticket:", error);
                showMessage("Erro ao gerar ticket. Tente novamente.", "error");
            } finally {
                showLoading(false);
            }
        }
        
        loadServices();
        console.info("Página do totem carregada com sucesso");
    }
});