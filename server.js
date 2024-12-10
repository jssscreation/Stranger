const express = require('express');
const WebSocket = require('ws');
const app = express();
const server = require('http').createServer(app);

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('New user connected.');

    ws.on('message', (message) => {
        // Broadcast to all other clients
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => console.log('User disconnected.'));
});

app.use(express.static('public'));

server.listen(3000, () => console.log('Server running on port 3000'));
