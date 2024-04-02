const messages = document.getElementById('messages');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const submitBtn = document.getElementById('submitBtn');
const coinSelect = document.getElementById('coinSelect');

let socket;

// Event listeners for buttons
connectBtn.addEventListener('click', connect);
disconnectBtn.addEventListener('click', disconnect);
submitBtn.addEventListener('click', getLatestPrice);

// Automatically connect to the WebSocket
connect();

function connect() {
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
        messages.textContent += event.wasClean ? '[close] Connection closed cleanly\n' : '[close] Connection died\n';
        updateButtons(false);
    };

    // Add beforeunload event listener
    window.addEventListener('beforeunload', confirmClose);
}

function disconnect() {
    if (socket) {
        socket.close(1000, "Closing from client");
        messages.textContent += '[info] Disconnected by the client\n';
        updateButtons(false);
        window.removeEventListener('beforeunload', confirmClose);
    }
}

function confirmClose(event) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const leavePage = confirm('Do you want to close the connection?');
        if (leavePage) {
            disconnect();
        } else {
            event.preventDefault();
        }
    }
}

function updateButtons(connected) {
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
    submitBtn.disabled = !connected;
}

function getLatestPrice() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const selectedCoin = coinSelect.value;
        const message = { action: 'getLatestPrice', coin: selectedCoin };
        socket.send(JSON.stringify(message));
        messages.textContent += `[info] Requested latest price for ${selectedCoin}\n`;
    } else {
        messages.textContent += '[error] WebSocket is not connected.\n';
    }
}
