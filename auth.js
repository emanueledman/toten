class AuthService {
    constructor() {
        this.token = 'h0gmVAmsj5kyhyVIlkZFF3lG4GJiqomF';
    }

    getBranchInfo() {
        return {
            branchId: localStorage.getItem('branchId'),
            branchName: localStorage.getItem('branchName')
        };
    }

    setBranchInfo(branchId, branchName) {
        localStorage.setItem('branchId', branchId);
        localStorage.setItem('branchName', branchName);
    }

    clearBranchInfo() {
        localStorage.removeItem('branchId');
        localStorage.removeItem('branchName');
    }

    isAuthenticated() {
        return !!this.getBranchInfo().branchId;
    }

    async login(branchId, password) {
        try {
            const response = await axios.post(`${API_BASE}/api/totem/login`, { branch_id: branchId, password });
            const { success, branch_id, branch_name } = response.data;
            if (success) {
                this.setBranchInfo(branch_id, branch_name);
                return { success: true };
            }
            return { success: false, message: 'Credenciais inválidas' };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error || 'Erro ao fazer login'
            };
        }
    }

    logout() {
        this.clearBranchInfo();
        window.location.href = 'index.html';
    }
}

const authService = new AuthService();