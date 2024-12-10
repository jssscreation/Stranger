const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let waitingUser = null;

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        if (waitingUser === socket) {
            waitingUser = null;
        }
    });

    // When a user is ready to connect
    socket.on('ready', () => {
        if (waitingUser) {
            // Connect the two users
            socket.emit('offer', { offerTo: waitingUser.id });
            waitingUser.emit('offer', { offerTo: socket.id });
            waitingUser = null;
        } else {
            waitingUser = socket;
        }
    });

    // Forward WebRTC signaling data
    socket.on('signal', (data) => {
        io.to(data.to).emit('signal', {
            from: socket.id,
            signal: data.signal,
        });
    });
});

server.listen(5555, () => {
    console.log('Server is running on http://localhost:5555');
});
