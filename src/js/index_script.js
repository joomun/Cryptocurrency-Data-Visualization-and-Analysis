const messages = document.getElementById('messages');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');

let socket;

// Event listeners for buttons
connectBtn.addEventListener('click', connect);
disconnectBtn.addEventListener('click', disconnect);

// Warn before closing the window
window.addEventListener('beforeunload', (event) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        event.preventDefault();
        event.returnValue = '';
        confirmDisconnect();
    }
});

function confirmDisconnect() {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to disconnect the WebSocket connection before leaving?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, disconnect'
    }).then((result) => {
        if (result.isConfirmed) {
            socket.close(1000, "Closing from client");
            window.close(); // This will not work for all browsers, as some don't allow scripts to close windows that were not opened by script
        }
    });
}
function connect() {
    // Replace with your WebSocket endpoint
    const websocketUrl = 'wss://nk7gy9nchi.execute-api.us-east-1.amazonaws.com/production/';

    socket = new WebSocket(websocketUrl);

    socket.onopen = function(event) {
        messages.textContent += '[open] Connection established\n';
        updateButtons(true);
    };

    socket.onmessage = function(event) {
        messages.textContent += `[message] Data received: ${event.data}\n`;
    };

    socket.onerror = function(event) {
        messages.textContent += `[error] ${JSON.stringify(event)}\n`;
    };

    socket.onclose = function(event) {
        if (event.wasClean) {
            messages.textContent += `[close] Connection closed cleanly\n`;
        } else {
            messages.textContent += '[close] Connection died\n';
        }
        updateButtons(false);
    };
}

function disconnect() {
    if (!socket) return;

    socket.close(1000, "Closing from client");
}

function updateButtons(connected) {
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
}
