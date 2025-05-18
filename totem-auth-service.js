// API Base URL
const API_BASE = 'https://fila-facilita2-0-4uzw.onrender.com';

// Token fixo (mover para variável de ambiente em produção)
const TOTEM_TOKEN = 'h0gmVAmsj5kyhyVIlkZFF3lG4GJiqomF';

// Função para exibir indicador de carregamento
function showLoading(show = true) {
    const loadingEl = document.getElementById('loading-overlay');
    if (loadingEl) {
        loadingEl.classList.toggle('hidden', !show);
        console.debug(`Indicador de carregamento: ${show ? 'visível' : 'oculto'}`);
    } else {
        console.warn("Elemento de loading não encontrado");
    }
}

// Função para exibir mensagens de toast
function showMessage(message, type = 'success') {
    console.debug(`Exibindo mensagem (${type}): ${message}`);
    
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-lg shadow-lg transition-all duration-300 ${
        type === 'success' ? 'bg-green-100 text-green-800' :
        type === 'error' ? 'bg-red-100 text-red-800' : 
        'bg-blue-100 text-blue-800'
    }`;
    
    toast.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <span class="font-medium">${message}</span>
            </div>
            <button class="ml-4 text-gray-400 hover:text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    toast.querySelector('button').addEventListener('click', () => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    });
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('opacity-0');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Serviço de Autenticação para Totens
class TotemAuthService {
    constructor() {
        this.API_BASE = API_BASE;
        this.setupAxiosInterceptors();
    }

    setupAxiosInterceptors() {
        axios.interceptors.request.use(
            (config) => {
                // Adicionar token fixo ao cabeçalho Totem-Token
                config.headers['Totem-Token'] = TOTEM_TOKEN;
                console.debug("Enviando requisição com Totem-Token:", 
                              TOTEM_TOKEN.substring(0, 20) + "...");
                return config;
            },
            (error) => {
                console.error("Erro no interceptor de requisição:", error);
                return Promise.reject(error);
            }
        );

        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error("Erro na resposta:", error.response?.status, error.message);
                
                if (error.response && error.response.status === 401) {
                    console.warn("Erro 401 - Token de totem inválido");
                    showMessage('Token inválido. Contate o administrador.', 'error');
                    // Redirecionar para página de configuração
                    window.location.href = '/index.html?error=invalid-token';
                } else if (error.response && error.response.status === 404) {
                    console.warn("Erro 404 - Recurso não encontrado");
                    showMessage('Filial ou recurso não encontrado. Verifique a configuração.', 'error');
                } else if (error.response && error.response.status >= 500) {
                    console.warn("Erro 500 - Erro no servidor");
                    showMessage('Erro no servidor. Tente novamente mais tarde.', 'error');
                } else if (error.code === 'ECONNABORTED') {
                    console.warn("Erro de timeout na requisição");
                    showMessage('Tempo limite de conexão excedido. Tente novamente.', 'error');
                } else if (error.code === 'ERR_NETWORK') {
                    console.warn("Erro de rede");
                    showMessage('Falha na conexão com o servidor. Verifique sua rede.', 'error');
                }
                return Promise.reject(error);
            }
        );
    }

    isConfigured() {
        const branchId = localStorage.getItem('branchId');
        if (branchId) {
            console.debug("Totem configurado com branchId:", branchId);
            return true;
        }
        console.debug("Totem não configurado");
        return false;
    }

    setBranchId(branchId, branchName) {
        try {
            const sanitizedBranchId = this.sanitizeInput(branchId.trim());
            localStorage.setItem('branchId', sanitizedBranchId);
            if (branchName) localStorage.setItem('branchName', this.sanitizeInput(branchName.trim()));
            console.info("Dados de configuração do totem armazenados com sucesso");
            console.debug("Branch ID:", sanitizedBranchId);
            return true;
        } catch (error) {
            console.error("Erro ao armazenar dados de configuração:", error);
            return false;
        }
    }

    getTotemInfo() {
        return {
            branchId: localStorage.getItem('branchId'),
            branchName: localStorage.getItem('branchName')
        };
    }

    setTotemInfoUI() {
        const info = this.getTotemInfo();
        if (document.getElementById('branch-name') && info.branchName) {
            document.getElementById('branch-name').textContent = info.branchName;
        }
        console.debug("Interface de totem atualizada com sucesso");
    }

    clearConfigData() {
        const keys = ['branchId', 'branchName'];
        keys.forEach(key => {
            localStorage.removeItem(key);
        });
        console.info("Dados de configuração do totem limpos");
    }

    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    redirectToTotemDashboard() {
        console.info("Redirecionando para dashboard do totem");
        window.location.href = '/totem-dashboard.html';
    }

    checkAuthAndRedirect() {
        if (!this.isConfigured()) {
            console.warn("Totem não configurado, redirecionando para configuração");
            window.location.href = '/index.html';
            return false;
        }
        console.info("Verificação de configuração: OK");
        return true;
    }

    async makeAuthenticatedRequest(config) {
        if (!this.isConfigured()) {
            throw new Error('Totem não configurado');
        }
        return axios(config);
    }
}

// Exportar instância única do serviço
const totemAuthService = new TotemAuthService();

// Inicialização da página
document.addEventListener('DOMContentLoaded', () => {
    console.info("Inicializando página do totem...");

    // Verificar se estamos na página de configuração
    if (window.location.pathname.includes('index.html')) {
        console.debug("Página de configuração do totem detectada");

        const configForm = document.getElementById('totem-config-form');
        if (configForm) {
            console.debug("Formulário de configuração encontrado, configurando handlers");

            // Verificar se há erro de token inválido
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('error') === 'invalid-token') {
                showMessage('Token inválido. Contate o administrador.', 'error');
            }

            configForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.debug("Evento de submissão do formulário de configuração disparado");

                showLoading(true);

                const branchId = document.getElementById('branch-id').value;
                const branchName = document.getElementById('branch-name')?.value || '';

                console.info(`Tentativa de configuração do totem para branchId ${branchId}`);

                try {
                    const success = totemAuthService.setBranchId(branchId, branchName);
                    if (success) {
                        console.info("Configuração do totem bem-sucedida!");
                        showMessage('Configuração salva com sucesso! Redirecionando...', 'success');
                        setTimeout(() => {
                            totemAuthService.redirectToTotemDashboard();
                        }, 1000);
                    } else {
                        console.warn("Falha ao salvar configuração do totem");
                        showMessage('Erro ao salvar configuração. Tente novamente.', 'error');
                    }
                } catch (error) {
                    console.error("Erro inesperado ao processar configuração do totem:", error);
                    showMessage('Erro inesperado. Verifique os dados e tente novamente.', 'error');
                } finally {
                    console.debug("Escondendo indicador de carregamento");
                    showLoading(false);
                }
            });

            const branchIdInput = document.getElementById('branch-id');
            if (branchIdInput) {
                branchIdInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        console.debug("Tecla Enter pressionada no campo de branchId");
                        configForm.dispatchEvent(new Event('submit'));
                    }
                });
            }
        } else {
            console.warn("Formulário de configuração do totem não encontrado!");
        }
    } else if (totemAuthService.isConfigured()) {
        console.info("Totem configurado, redirecionando para o dashboard...");
        totemAuthService.redirectToTotemDashboard();
    } else {
        console.warn("Totem não configurado, redirecionando para página de configuração...");
        window.location.href = '/index.html';
    }
});