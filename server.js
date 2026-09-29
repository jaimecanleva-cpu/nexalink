const WebSocket = require('ws');

// Inicia o servidor WebSocket na porta 8080
const wss = new WebSocket.Server({ port: 8080 });

// Mapeamento para guardar os clientes ativos: id -> socket
const clientes = new Map();

console.log('Servidor WebSocket NexaLink a rodar na porta 8080...');

wss.on('connection', (ws) => {
  let meuId = null;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.tipo) {
        case 'REGISTAR':
          meuId = data.id;
          clientes.set(meuId, ws);
          console.log(`[CONECTADO] Dispositivo registado: ${meuId}`);
          break;
          
        case 'INICIAR_ENVIO':
        case 'PEDACO_FICHEIRO':
        case 'CONCLUIR_ENVIO':
          encaminharMensagem(data);
          break;
          
        default:
          console.log('Tipo de mensagem desconhecido:', data.tipo);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error.message);
    }
  });
  
  ws.on('close', () => {
    if (meuId) {
      clientes.delete(meuId);
      console.log(`[DESCONECTADO] Dispositivo removido: ${meuId}`);
    }
  });
  
  // Função auxiliar para redirecionar dados para o destinatário
  function encaminharMensagem(payload) {
    const destinoSocket = clientes.get(payload.destinoId);
    
    if (destinoSocket && destinoSocket.readyState === WebSocket.OPEN) {
      destinoSocket.send(JSON.stringify(payload));
    } else {
      ws.send(JSON.stringify({
        tipo: 'ERRO',
        mensagem: `O dispositivo ${payload.destinoId} não está online.`
      }));
    }
  }
});