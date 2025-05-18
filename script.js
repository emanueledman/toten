const BASE_URL = "https://fila-facilita2-0-4uzw.onrender.com/api/totem";
const TOTEM_TOKEN = "h0gmVAmsj5kyhyVIlkZFF3lG4GJiqomF";

let currentCategoryId = null;

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => screen.classList.add("hidden"));
    document.getElementById(screenId).classList.remove("hidden");
}

// Implementação de solução para o problema de CORS
async function makeApiRequest(url, method = "GET", body = null) {
    try {
        // Opções para fetch que ajudam a evitar problemas de CORS
        const options = {
            method: method,
            headers: {
                "Totem-Token": TOTEM_TOKEN,
                "Content-Type": "application/json",
                // Modo no-cors pode ajudar, mas limita o acesso ao conteúdo da resposta
                // "Mode": "no-cors" 
            },
            // Credentials podem ser necessários para cookies em requisições cross-origin
            credentials: "include"
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        // Usando try-catch para capturar erros específicos de CORS
        const response = await fetch(url, options);
        
        if (!response.ok) {
            console.error(`Erro na API: ${response.status}`);
            const errorText = await response.text();
            console.error(`Detalhes: ${errorText}`);
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }
        
        // Para resposta em formato blob (PDF)
        if (url.includes("/ticket") && method === "POST") {
            return await response.blob();
        }
        
        // Para respostas em formato JSON
        return await response.json();
    } catch (error) {
        console.error("Erro na requisição:", error);
        throw error;
    }
}

async function login() {
    const branchId = document.getElementById("branch-id").value.trim();
    const errorElement = document.getElementById("login-error");

    if (!branchId) {
        errorElement.textContent = "Digite o ID da filial.";
        return;
    }

    try {
        // Utilizando a nova função para requisições à API
        await makeApiRequest(`${BASE_URL}/branches/${branchId}/services`);
        localStorage.setItem("branchId", branchId);
        await loadCategories(branchId);
        showScreen("categories-screen");
        errorElement.textContent = "";
    } catch (error) {
        // Tratamento específico para erro de CORS
        if (error.message.includes("CORS") || error.name === "TypeError") {
            errorElement.textContent = "Erro de CORS. Tente usar uma extensão para desabilitar CORS ou um proxy local.";
            console.error("Erro de CORS:", error);
        } else {
            errorElement.textContent = error.message || "Erro desconhecido ao conectar à API.";
        }
    }
}

async function loadCategories(branchId) {
    const categoriesList = document.getElementById("categories-list");
    try {
        const data = await makeApiRequest(`${BASE_URL}/branches/${branchId}/services`);

        categoriesList.innerHTML = "";
        if (data.categories?.length) {
            data.categories.forEach(category => {
                const div = document.createElement("div");
                div.className = "category-item";
                div.textContent = category.category_name;
                div.onclick = () => loadServices(branchId, category.category_id, category.category_name);
                categoriesList.appendChild(div);
            });
        } else {
            categoriesList.textContent = "Sem categorias disponíveis.";
        }
    } catch (error) {
        categoriesList.innerHTML = `<div class="error-message">Erro ao carregar categorias: ${error.message}</div>`;
    }
}

async function loadServices(branchId, categoryId, categoryName) {
    currentCategoryId = categoryId;
    const servicesList = document.getElementById("services-list");
    try {
        const data = await makeApiRequest(`${BASE_URL}/branches/${branchId}/categories/${categoryId}/services`);

        document.getElementById("category-title").textContent = `Serviços - ${categoryName}`;
        servicesList.innerHTML = "";
        if (data.services?.length) {
            data.services.forEach(service => {
                const div = document.createElement("div");
                div.className = "service-item";
                div.textContent = `${service.service_name} (Espera: ${service.estimated_wait_time})`;
                div.onclick = () => generateTicket(branchId, service.service_id);
                servicesList.appendChild(div);
            });
        } else {
            servicesList.textContent = "Sem serviços disponíveis nesta categoria.";
        }
        showScreen("services-screen");
    } catch (error) {
        servicesList.innerHTML = `<div class="error-message">Erro ao carregar serviços: ${error.message}</div>`;
    }
}

async function generateTicket(branchId, serviceId) {
    try {
        const blob = await makeApiRequest(`${BASE_URL}/branches/${branchId}/services/${serviceId}/ticket`, "POST");
        
        const url = window.URL.createObjectURL(blob);
        document.getElementById("ticket-info").textContent = "Senha gerada com sucesso!";
        document.getElementById("ticket-download").href = url;
        document.getElementById("ticket-download").download = `ticket_${Date.now()}.pdf`;
        
        // Opcionalmente, podemos abrir o PDF em uma nova aba
        window.open(url, '_blank');
        
        showScreen("ticket-screen");
    } catch (error) {
        alert(`Erro ao gerar senha: ${error.message}`);
    }
}

function backToCategories() {
    showScreen("categories-screen");
}

function logout() {
    localStorage.removeItem("branchId");
    document.getElementById("branch-id").value = "";
    document.getElementById("login-error").textContent = "";
    showScreen("login-screen");
}

// Adiciona o polyfill para o método at() usado em algumas versões antigas de navegadores
if (!Array.prototype.at) {
    Array.prototype.at = function(index) {
        return index >= 0 ? this[index] : this[this.length + index];
    };
}

window.onload = () => {
    const branchId = localStorage.getItem("branchId");
    if (branchId) {
        document.getElementById("branch-id").value = branchId;
        login();
    }
    
    // Adiciona alternativa para caso o botão não funcione
    document.getElementById("login-button")?.addEventListener("click", login);
    
    // Adiciona eventos aos botões de navegação
    document.getElementById("back-button")?.addEventListener("click", backToCategories);
    document.getElementById("logout-button")?.addEventListener("click", logout);
    document.getElementById("ticket-done")?.addEventListener("click", backToCategories);
};