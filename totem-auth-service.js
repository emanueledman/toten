// API Base URL
const API_BASE = 'https://fila-facilita2-0-4uzw.onrender.com';

// Serviço de Autenticação para Totens
class TotemAuthService {
    constructor() {
        this.totem = null;
        this.setupAxiosInterceptors();
        
        // Verificar token válido na inicialização
        this.validateTokenOnStart();
    }
    
    validateTokenOnStart() {
        try {
            const token = this.getToken();
            if (!token) return;
            
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                console.warn("Token inválido encontrado. Removendo...");
                this.clearAuthData();
            }
        } catch (error) {
            console.error("Erro ao validar token inicial:", error);
            this.clearAuthData();
        }
    }

    setupAxiosInterceptors() {
        axios.interceptors.request.use(
            (config) => {
                const token = this.getToken();
                if (token) {
                    if (token.startsWith('Bearer ')) {
                        config.headers['Authorization'] = token;
                    } else {
                        config.headers['Authorization'] = `Bearer ${token}`;
                    }
                    
                    console.debug("Enviando requisição com token:", 
                                  config.headers['Authorization'].substring(0, 20) + "...");
                }
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
                    console.warn("Erro 401 - Redirecionando para login do totem");
                    this.clearAuthData();
                    window.location.href = '/index.html?expired=true';
                }
                return Promise.reject(error);
            }
        );
    }

    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    getToken() {
        return localStorage.getItem('totemToken') || sessionStorage.getItem('totemToken');
    }

    isAuthenticated() {
        const token = this.getToken();
        const branchId = localStorage.getItem('branchId') || sessionStorage.getItem('branchId');
        
        if (token && branchId) {
            console.debug("Totem autenticado com branchId:", branchId);
            return true;
        }
        
        console.debug("Totem não autenticado");
        return false;
    }

    storeAuthData(data, rememberMe) {
        if (!data || !data.token || !data.branch_id) {
            console.error("Dados de autenticação inválidos:", data);
            return false;
        }
        
        const storage = rememberMe ? localStorage : sessionStorage;
        
        this.clearAuthData();
        
        try {
            storage.setItem('totemToken', data.token);
            storage.setItem('branchId', data.branch_id);
            if (data.branch_name) storage.setItem('branchName', data.branch_name);
            
            console.info("Dados de autenticação do totem armazenados com sucesso");
            console.debug("Token:", data.token.substring(0, 15) + "...");
            console.debug("Branch ID:", data.branch_id);
            
            return true;
        } catch (error) {
            console.error("Erro ao armazenar dados de autenticação:", error);
            return false;
        }
    }

    getTotemInfo() {
        return {
            branchId: localStorage.getItem('branchId') || sessionStorage.getItem('branchId'),
            branchName: localStorage.getItem('branchName') || sessionStorage.getItem('branchName')
        };
    }

    setTotemInfoUI() {
        const info = this.getTotemInfo();
        
        if (document.getElementById('branch-name') && info.branchName) {
            document.getElementById('branch-name').textContent = info.branchName;
        }
        
        console.debug("Interface de totem atualizada com sucesso");
    }

    clearAuthData() {
        const keys = ['totemToken', 'branchId', 'branchName'];
        keys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        console.info("Dados de autenticação do totem limpos");
    }

    async login(branchId, password, rememberMe = false) {
        try {
            const sanitizedBranchId = this.sanitizeInput(branchId.trim());
            
            console.info(`Tentando login do totem para branchId ${sanitizedBranchId}`);
            
            const response = await axios.post(
                `${API_BASE}/api/totem/login`,
                { branch_id: sanitizedBranchId, password },
                {
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 15000,
                    withCredentials: true // Habilitar para suportar CORS com credenciais
                }
            );
            
            console.debug("Resposta de login recebida:", {
                status: response.status,
                data: response.data
            });
            
            const data = response.data;
            if (!data || typeof data !== 'object' || !data.success || !data.token) {
                console.error("Resposta inválida do servidor:", data);
                return {
                    success: false,
                    message: 'Erro no servidor: resposta inválida ou token não recebido'
                };
            }
            
            const stored = this.storeAuthData(data, rememberMe);
            if (!stored) {
                return {
                    success: false,
                    message: 'Erro ao armazenar credenciais no navegador'
                };
            }
            
            return {
                success: true,
                branchId: data.branch_id
            };
        } catch (error) {
            console.error('Erro detalhado de login do totem:', {
                message: error.message,
                code: error.code,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : null
            });
            
            let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
            
            if (error.response) {
                if (error.response.status === 400) {
                    errorMessage = 'Branch ID ou senha não fornecidos.';
                } else if (error.response.status === 401) {
                    errorMessage = 'Senha incorreta. Tente novamente.';
                } else if (error.response.status === 404) {
                    errorMessage = 'Filial não encontrada.';
                } else if (error.response.status >= 500) {
                    errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
                }
                
                if (error.response.data && error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Tempo limite de conexão excedido. Verifique sua internet.';
            } else if (error.code === 'ERR_NETWORK') {
                errorMessage = 'Falha na rede. Verifique sua conexão.';
            }
            
            return {
                success: false,
                message: errorMessage
            };
        }
    }

    async logout() {
        try {
            console.info("Iniciando logout do totem...");
            this.clearAuthData();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        } finally {
            console.info("Redirecionando para página de login do totem");
            window.location.href = '/index.html';
        }
    }

    redirectToTotemDashboard() {
        console.info("Redirecionando para dashboard do totem");
        window.location.href = '/totem-dashboard.html';
    }

    checkAuthAndRedirect() {
        if (!this.isAuthenticated()) {
            console.warn("Totem não autenticado, redirecionando para login");
            window.location.href = '/index.html';
            return false;
        }
        console.info("Verificação de autenticação: OK");
        return true;
    }
}

// Exportar instância única do serviço de autenticação do totem
const totemAuthService = new TotemAuthService();