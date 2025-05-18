document.addEventListener('DOMContentLoaded', () => {
    console.info("Inicializando página de login do totem...");

    // Verificar se estamos na página de login do totem
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        console.debug("Página de login do totem detectada");

        // Verificar se o totem já está autenticado
        if (totemAuthService.isAuthenticated()) {
            console.info("Totem já autenticado, redirecionando...");
            totemAuthService.redirectToTotemDashboard();
            return;
        }

        const loginForm = document.getElementById('totem-login-form');

        // Se o formulário existir, configurar handler
        if (loginForm) {
            console.debug("Formulário de login do totem encontrado, configurando handlers");

            // Verificar se há um parâmetro de sessão expirada
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('expired') === 'true') {
                showMessage('Sua sessão expirou. Por favor, faça login novamente.', 'error');
            }

            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Mostrar indicador de carregamento
                showLoading(true);

                const branchId = document.getElementById('branch-id').value;
                const password = document.getElementById('password').value;
                const rememberMe = document.getElementById('remember-me')?.checked || false;

                console.info(`Tentativa de login do totem para branchId ${branchId} (lembrar: ${rememberMe})`);

                try {
                    const result = await totemAuthService.login(branchId, password, rememberMe);

                    console.debug("Resultado do login:", result);

                    if (result.success) {
                        console.info("Login do totem bem-sucedido!");
                        // Limpar senha do formulário por segurança
                        document.getElementById('password').value = '';

                        // Mostrar mensagem de sucesso breve
                        showMessage('Login bem-sucedido! Redirecionando...', 'success');

                        // Aguardar um momento para mostrar mensagem de sucesso
                        setTimeout(() => {
                            // Redirecionar para o dashboard do totem
                            totemAuthService.redirectToTotemDashboard();
                        }, 1000);
                    } else {
                        console.warn("Falha no login do totem:", result.message);
                        // Exibir mensagem de erro
                        showMessage(result.message, 'error');
                    }
                } catch (error) {
                    console.error("Erro inesperado ao processar login do totem:", error);
                    showMessage('Erro inesperado. Verifique sua conexão e tente novamente.', 'error');
                } finally {
                    // Sempre esconder o indicador de carregamento
                    showLoading(false);
                }
            });

            // Adicionar event listener para tecla Enter no campo de senha
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        loginForm.dispatchEvent(new Event('submit'));
                    }
                });
            }
        } else {
            console.warn("Formulário de login do totem não encontrado!");
        }
    }
});