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
        const data = JSON.parse(event.data);
    
        // Check if the message contains 'allDataPoints'
        if (data.allDataPoints) {
            plotData(data.allDataPoints);
        }     // Check for 'syntheticData' in the message and plot them
        else if (data.target) { // Assuming 'target' contains the synthetic data
            // Prepare the xValues (time) and yValues (data points)
            const xValues = data.target.map((_, index) => index); // or use actual time if available
            const yValues = data.target;
    
            // Call a function to plot the synthetic data
            plotSyntheticData(xValues, yValues);
        }
        else {
            messages.textContent += `[message] Data received: ${event.data}\n`;
        }
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
        // Request for latest price data
        const priceMessage = { action: 'getLatestPrice', coin: selectedCoin };
        socket.send(JSON.stringify(priceMessage));
        messages.textContent += `[info] Requested latest price for ${selectedCoin}\n`;

        // Request for synthetic data
        const syntheticMessage = { action: 'SyntheticData', coin: selectedCoin };
        socket.send(JSON.stringify(syntheticMessage));
        messages.textContent += `[info] Requested synthetic data for ${selectedCoin}\n`;
    } else {
        messages.textContent += '[error] WebSocket is not connected.\n';
    }
}



function plotData(allDataPoints) {


    // Plotting data
    const trace = {
        x: allDataPoints.map(point => new Date(point.PriceTimeStamp * 1000)),
        close: allDataPoints.map(point => point.Close),
        high: allDataPoints.map(point => point.High),
        low: allDataPoints.map(point => point.Low),
        open: allDataPoints.map(point => point.Open),
        increasing: { line: { color: 'green' } },
        decreasing: { line: { color: 'red' } },
        type: 'ohlc',
        xaxis: 'x',
        yaxis: 'y'
    };

    const layout = {
        title: 'Data for Coin-3rd Party Data',
        dragmode: 'zoom',
        showlegend: false,
        xaxis: {
          autorange: true,
          title: 'Date',
           rangeselector: {
              x: 0,
              y: 1.2,
              xanchor: 'left',
              font: {size:8},
              buttons: [{
                  step: 'month',
                  stepmode: 'backward',
                  count: 1,
                  label: '1 month'
              }, {
                  step: 'month',
                  stepmode: 'backward',
                  count: 6,
                  label: '6 months'
              }, {
                  step: 'all',
                  label: 'All dates'
              }]
            }
        },
        yaxis: {
          autorange: true,
          title: 'Price in USD',
        }
    };
    
    Plotly.newPlot('myDiv', [trace], layout);
}

function plotSyntheticData(xValues, yValues) {
    const trace = {
        x: xValues,
        y: yValues,
        type: 'scatter',
        mode: 'lines+markers',
        marker: {
            color: 'blue', // Change as needed
            size: 8
        },
        line: {
            color: 'blue', // Change as needed
            width: 1
        }
    };

    const layout = {
        title: 'Synthetic Data ',
        xaxis: {
            autorange: true,
            title: 'Index',
             rangeselector: {
                x: 0,
                y: 1.2,
                xanchor: 'left',
                font: {size:8},
              }
          },
          yaxis: {
            autorange: true,
            title: 'Value',
          }
    };

    Plotly.newPlot('Synthetic_Div', [trace], layout);
}