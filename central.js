function showLoading(show = true) {
    const loadingEl = document.getElementById('loading-overlay');
    if (loadingEl) {
        loadingEl.classList.toggle('hidden', !show);
        console.debug(`Indicador de carregamento: ${show ? 'visível' : 'oculto'}`);
    } else {
        console.warn("Elemento de loading não encontrado");
    }
}

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