const BASE_URL = "https://fila-facilita2-0-4uzw.onrender.com/api/totem";
const TOTEM_TOKEN = "h0gmVAmsj5kyhyVIlkZFF3lG4GJiqomF";

let currentCategoryId = null;

// Função para alternar telas
function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => screen.classList.add("hidden"));
    document.getElementById(screenId).classList.remove("hidden");
}

// Função de login
async function login() {
    const branchId = document.getElementById("branch-id").value.trim();
    const errorElement = document.getElementById("login-error");

    if (!branchId) {
        errorElement.textContent = "Por favor, digite o ID da filial.";
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/branches/${branchId}/services`, {
            headers: { "Totem-Token": TOTEM_TOKEN }
        });

        if (response.ok) {
            localStorage.setItem("branchId", branchId);
            await loadCategories(branchId);
            showScreen("categories-screen");
        } else {
            errorElement.textContent = "ID da filial inválido ou erro na conexão.";
        }
    } catch (error) {
        errorElement.textContent = "Erro ao conectar com o servidor.";
        console.error(error);
    }
}

// Carregar categorias
async function loadCategories(branchId) {
    try {
        const response = await fetch(`${BASE_URL}/branches/${branchId}/services`, {
            headers: { "Totem-Token": TOTEM_TOKEN }
        });
        const data = await response.json();

        const categoriesList = document.getElementById("categories-list");
        categoriesList.innerHTML = "";

        if (data.categories && data.categories.length > 0) {
            data.categories.forEach(category => {
                const div = document.createElement("div");
                div.className = "category-item";
                div.textContent = category.category_name;
                div.onclick = () => loadServices(branchId, category.category_id, category.category_name);
                categoriesList.appendChild(div);
            });
        } else {
            categoriesList.textContent = "Nenhuma categoria disponível.";
        }
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}

// Carregar serviços de uma categoria
async function loadServices(branchId, categoryId, categoryName) {
    currentCategoryId = categoryId;
    try {
        const response = await fetch(`${BASE_URL}/branches/${branchId}/categories/${categoryId}/services`, {
            headers: { "Totem-Token": TOTEM_TOKEN }
        });
        const data = await response.json();

        document.getElementById("category-title").textContent = `Serviços - ${categoryName}`;
        const servicesList = document.getElementById("services-list");
        servicesList.innerHTML = "";

        if (data.services && data.services.length > 0) {
            data.services.forEach(service => {
                const div = document.createElement("div");
                div.className = "service-item";
                div.textContent = `${service.service_name} (Espera: ${service.estimated_wait_time})`;
                div.onclick = () => generateTicket(branchId, service.service_id);
                servicesList.appendChild(div);
            });
        } else {
            servicesList.textContent = "Nenhum serviço disponível.";
        }
        showScreen("services-screen");
    } catch (error) {
        console.error("Erro ao carregar serviços:", error);
    }
}

// Gerar senha
async function generateTicket(branchId, serviceId) {
    try {
        const response = await fetch(`${BASE_URL}/branches/${branchId}/services/${serviceId}/ticket`, {
            method: "POST",
            headers: { "Totem-Token": TOTEM_TOKEN }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const ticketInfo = document.getElementById("ticket-info");
            const ticketDownload = document.getElementById("ticket-download");

            ticketInfo.textContent = "Sua senha foi gerada com sucesso!";
            ticketDownload.href = url;
            ticketDownload.download = `ticket_${new Date().getTime()}.pdf`;
            showScreen("ticket-screen");
        } else {
            alert("Erro ao gerar senha. Tente novamente.");
        }
    } catch (error) {
        console.error("Erro ao gerar senha:", error);
        alert("Erro ao conectar com o servidor.");
    }
}

// Voltar para categorias
function backToCategories() {
    showScreen("categories-screen");
}

// Sair
function logout() {
    localStorage.removeItem("branchId");
    document.getElementById("branch-id").value = "";
    document.getElementById("login-error").textContent = "";
    showScreen("login-screen");
}

// Verificar login ao carregar a página
window.onload = () => {
    const branchId = localStorage.getItem("branchId");
    if (branchId) {
        document.getElementById("branch-id").value = branchId;
        login();
    }
};