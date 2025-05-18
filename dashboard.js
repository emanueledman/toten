document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        if (!authService.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        const { branchName } = authService.getBranchInfo();
        const branchNameEl = document.getElementById('branch-name');
        if (branchNameEl && branchName) {
            branchNameEl.textContent = branchName;
        }

        document.getElementById('logout').addEventListener('click', () => authService.logout());

        async function loadServices() {
            showLoading(true);
            try {
                const { branchId } = authService.getBranchInfo();
                const response = await axios.get(`${API_BASE}/api/totem/branches/${branchId}/services`, {
                    headers: { 'Totem-Token': authService.token }
                });
                const { categories } = response.data;

                const services = document.getElementById('services');
                services.innerHTML = '';

                if (categories?.length) {
                    categories.forEach(category => {
                        const div = document.createElement('div');
                        div.className = 'mb-4';
                        div.innerHTML = `<h3 class="text-md font-medium">${category.category_name}</h3>`;
                        
                        category.services.forEach(service => {
                            const button = document.createElement('button');
                            button.className = 'w-full bg-indigo-500 text-white py-2 px-3 rounded-md hover:bg-indigo-600 mb-2 text-left';
                            button.textContent = `${service.service_name} (Espera: ${service.estimated_wait_time})`;
                            button.addEventListener('click', () => generateTicket(branchId, service.service_id));
                            div.appendChild(button);
                        });
                        
                        services.appendChild(div);
                    });
                } else {
                    services.innerHTML = '<p class="text-gray-600">Nenhum serviço disponível.</p>';
                }
            } catch (error) {
                showMessage('Erro ao carregar serviços', 'error');
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
                    { headers: { 'Totem-Token': authService.token }, responseType: 'blob' }
                );

                if (response.headers['content-type'] !== 'application/pdf') {
                    throw new Error('Não é um PDF');
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

                showMessage('Ticket gerado!', 'success');
            } catch (error) {
                showMessage('Erro ao gerar ticket', 'error');
            } finally {
                showLoading(false);
            }
        }

        loadServices();
    }
});