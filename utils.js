const API_BASE = 'https://fila-facilita2-0-4uzw.onrender.com';

function showLoading(show = true) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.toggle('hidden', !show);
        if (show) {
            setTimeout(() => {
                if (!loading.classList.contains('hidden')) {
                    loading.classList.add('hidden');
                }
            }, 5000);
        }
    }
}

function showMessage(message, type = 'success') {
    const container = document.createElement('div');
    container.className = 'fixed top-4 right-4 z-50';
    document.body.appendChild(container);
    
    const toast = document.createElement('div');
    toast.className = `p-3 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-100 text-green-800' :
        type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
    }`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => container.remove(), 300);
    }, 3000);
}