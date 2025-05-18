document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        if (authService.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return;
        }

        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoading(true);

                const branchId = document.getElementById('branch-id').value;
                const password = document.getElementById('password').value;

                const result = await authService.login(branchId, password);
                showLoading(false);

                if (result.success) {
                    document.getElementById('password').value = '';
                    showMessage('Login bem-sucedido!', 'success');
                    setTimeout(() => window.location.href = 'dashboard.html', 1000);
                } else {
                    showMessage(result.message, 'error');
                }
            });
        }
    }
});