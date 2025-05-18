// Esta é uma solução alternativa para o problema de CORS
// Este arquivo deve ser usado como um proxy local para evitar problemas de CORS

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = 3000;

// Configurações do aplicativo
app.use(cors()); // Habilita CORS para todas as rotas
app.use(express.json());
app.use(express.static('public')); // Serve arquivos estáticos da pasta 'public'

// Configurações da API
const BASE_URL = "https://fila-facilita2-0-4uzw.onrender.com";
const TOTEM_TOKEN = "h0gmVAmsj5kyhyVIlkZFF3lG4GJiqomF";

// Rota para buscar serviços de uma filial
app.get('/api/branches/:branchId/services', async (req, res) => {
    try {
        const { branchId } = req.params;
        const response = await axios.get(`${BASE_URL}/branches/${branchId}/services`, {
            headers: { 'Totem-Token': TOTEM_TOKEN }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao buscar serviços:', error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || 'Erro ao buscar serviços'
        });
    }
});

// Rota para buscar serviços de uma categoria
app.get('/api/branches/:branchId/categories/:categoryId/services', async (req, res) => {
    try {
        const { branchId, categoryId } = req.params;
        const response = await axios.get(`${BASE_URL}/branches/${branchId}/categories/${categoryId}/services`, {
            headers: { 'Totem-Token': TOTEM_TOKEN }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao buscar serviços da categoria:', error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || 'Erro ao buscar serviços da categoria'
        });
    }
});

// Rota para gerar ticket
app.post('/api/branches/:branchId/services/:serviceId/ticket', async (req, res) => {
    try {
        const { branchId, serviceId } = req.params;
        const response = await axios.post(
            `${BASE_URL}/branches/${branchId}/services/${serviceId}/ticket`, 
            {}, 
            {
                headers: { 'Totem-Token': TOTEM_TOKEN },
                responseType: 'arraybuffer' // Importante para receber o PDF corretamente
            }
        );
        
        // Configurar os cabeçalhos para enviar o PDF
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=ticket_${serviceId}.pdf`,
            'Content-Length': response.data.length
        });
        
        // Enviar o PDF como resposta
        res.send(response.data);
    } catch (error) {
        console.error('Erro ao gerar ticket:', error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || 'Erro ao gerar ticket'
        });
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor proxy rodando na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT} para usar o totem`);
    console.log('Para iniciar, coloque os arquivos HTML e JS na pasta "public"');
});

/*
INSTRUÇÕES DE USO:

1. Instale o Node.js se ainda não tiver: https://nodejs.org/
2. Crie uma pasta para o projeto
3. Salve este arquivo como "server.js"
4. Crie uma pasta chamada "public" no mesmo diretório
5. Coloque o index.html e script.js na pasta "public"
6. Abra o terminal na pasta do projeto e execute:
   - npm init -y
   - npm install express cors axios
   - node server.js
7. Acesse http://localhost:3000 no navegador

Agora o totem deve funcionar sem problemas de CORS!
*/