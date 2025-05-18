const BASE_URL = "https://fila-facilita2-0-4uzw.onrender.com/api/totem";
const TOTEM_TOKEN = "h0gmVAmsj5kyhyVIlkZFF3lG4GJiqomF";

let currentCategoryId = null;

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => screen.classList.add("hidden"));
    document.getElementById(screenId).classList.remove("hidden");
}

async function login() {
    const branchId = document.getElementById("branch-id").value.trim();
    const errorElement = document.getElementById("login-error");

    if (!branchId) {
        errorElement.textContent = "Digite o ID da filial.";
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/branches/${branchId}/services`, {
            method: "GET",
            headers: { "Totem-Token": TOTEM_TOKEN }
        });

        if (response.ok) {
            localStorage.setItem("branchId", branchId);
            await loadCategories(branchId);
            showScreen("categories-screen");
            errorElement.textContent = "";
        } else {
            const errorData = await response.json().catch(() => ({}));
            errorElement.textContent = errorData.error || `Erro ${response.status}`;
        }
    } catch (error) {
        errorElement.textContent = "Erro de conexão (provavelmente CORS). Verifique o servidor.";
        console.error("Erro:", error);
    }
}

async function loadCategories(branchId) {
    const categoriesList = document.getElementById("categories-list");
    try {
        const response = await fetch(`${BASE_URL}/branches/${branchId}/services`, {
            headers: { "Totem-Token": TOTEM_TOKEN }
        });
        if (!response.ok) throw new Error(`Erro ${response.status}`);
        const data = await response.json();

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
            categoriesList.textContent = "Sem categorias.";
        }
    } catch (error) {
        categoriesList.textContent = "Erro ao carregar categorias.";
        console.error(error);
    }
}

async function loadServices(branchId, categoryId, categoryName) {
    currentCategoryId = categoryId;
    const servicesList = document.getElementById("services-list");
    try {
        const response = await fetch(`${BASE_URL}/branches/${branchId}/categories/${categoryId}/services`, {
            headers: { "Totem-Token": TOTEM_TOKEN }
        });
        if (!response.ok) throw new Error(`Erro ${response.status}`);
        const data = await response.json();

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
            servicesList.textContent = "Sem serviços.";
        }
        showScreen("services-screen");
    } catch (error) {
        servicesList.textContent = "Erro ao carregar serviços.";
        console.error(error);
    }
}

async function generateTicket(branchId, serviceId) {
    try {
        const response = await fetch(`${BASE_URL}/branches/${branchId}/services/${serviceId}/ticket`, {
            method: "POST",
            headers: { "Totem-Token": TOTEM_TOKEN }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            document.getElementById("ticket-info").textContent = "Senha gerada com sucesso!";
            document.getElementById("ticket-download").href = url;
            document.getElementById("ticket-download").download = `ticket_${Date.now()}.pdf`;
            showScreen("ticket-screen");
        } else {
            alert(`Erro ao gerar senha: ${await response.text()}`);
        }
    } catch (error) {
        alert("Erro de conexão ao gerar senha.");
        console.error(error);
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

window.onload = () => {
    const branchId = localStorage.getItem("branchId");
    if (branchId) {
        document.getElementById("branch-id").value = branchId;
        login();
    }
};