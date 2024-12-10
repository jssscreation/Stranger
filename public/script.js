const socket = io();
const connectButton = document.getElementById('connectButton');
const statusDiv = document.getElementById('status');
const audio = document.getElementById('audio');

let peerConnection;
let localStream;

// WebRTC Configuration
const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
    ],
};

// Start the connection process
connectButton.addEventListener('click', async () => {
    connectButton.disabled = true;
    statusDiv.textContent = 'Connecting...';

    // Get audio stream
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    socket.emit('ready');
});

// Handle signaling offer
socket.on('offer', async (data) => {
    peerConnection = new RTCPeerConnection(config);

    // Add local stream to the connection
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        audio.srcObject = event.streams[0];
        audio.style.display = 'block';
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', {
                to: data.offerTo,
                signal: { candidate: event.candidate },
            });
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit('signal', {
        to: data.offerTo,
        signal: { description: peerConnection.localDescription },
    });

    statusDiv.textContent = 'Connected!';
});

// Handle signaling data
socket.on('signal', async (data) => {
    if (data.signal.description) {
        await peerConnection.setRemoteDescription(data.signal.description);
        if (data.signal.description.type === 'offer') {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('signal', {
                to: data.from,
                signal: { description: peerConnection.localDescription },
            });
        }
    } else if (data.signal.candidate) {
        await peerConnection.addIceCandidate(data.signal.candidate);
    }
});
