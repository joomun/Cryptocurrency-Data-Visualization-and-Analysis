const messages = document.getElementById('messages');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const submitBtn = document.getElementById('submitBtn');
const coinSelect = document.getElementById('coinSelect');

let socket;
// Global variable to hold the last X value from the synthetic data plot
let lastXValue;
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
            fetchPredictedData(yValues.slice(-100), xValues.slice(-100));
        }
        else   if (data.action && data.action === 'PredictionData') {
            messages.textContent += `[message] Predicted data received\n`;
            plotPredictionData(data.predictedPoints[0]);
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
        sendWebSocketMessage('getLatestPrice', selectedCoin);
        // Set a longer delay and request for prediction data
        setTimeout(() => sendWebSocketMessage('PredictionData', selectedCoin), 10); // Delay by 2 seconds
        // Set a delay and request for synthetic data
        setTimeout(() => sendWebSocketMessage('SyntheticData', selectedCoin), 10); // Delay by 1 second


    } else {
        messages.textContent += '[error] WebSocket is not connected.\n';
    }
}

// Helper function to send WebSocket messages and log the action
function sendWebSocketMessage(action, selectedCoin) {
    const message = { action: action, coin: selectedCoin };
    socket.send(JSON.stringify(message));
    messages.textContent += `[info] Requested ${action} for ${selectedCoin}\n`;
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
        ,name: 'Synthetic Data'
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
        // Return the last X value for later use
    lastXValue = xValues[xValues.length - 1];
    return lastXValue;
}


function fetchPredictedData(last50YValues, last50XValues) {
    // Ensure that your WebSocket is open before trying to send a message
    if (socket.readyState === WebSocket.OPEN) {
        // Prepare the message with the same structure you were using with fetch
        const message = {
            action: 'PredictionData',
            data: {
                instances: [
                    {
                        start: last50XValues[0],
                        target: last50YValues
                    }
                ],
                configuration: {
                    num_samples: 50, // Number of samples you want to predict
                    output_types: ["mean", "quantiles", "samples"],
                    quantiles: ["0.1", "0.9"]
                }
            }
        };

        // Send the message as a string over the WebSocket
        socket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open.');
    }
}


function plotPredictionData(predictedData) {
    // Extract the predicted values
    const predictedMean = predictedData.mean;
    const predictedQuantile0_1 = predictedData.quantiles["0.1"];
    const predictedQuantile0_9 = predictedData.quantiles["0.9"];
  
    // Generate the predicted x-axis values starting from the last x value + 1
    const lastXValue = parseInt(document.getElementById('Synthetic_Div').data.slice(-1)[0].x.slice(-1)) || xValues.length;
    const predictedXValues = Array.from({ length: predictedMean.length }, (_, i) => lastXValue + i + 1);
  
    // Mean prediction trace
    const meanTrace = {
      x: predictedXValues,
      y: predictedMean,
      type: 'scatter',
      mode: 'lines',
      line: {
        color: 'red',
        width: 2
      },
      name: 'Mean Prediction'
    };
  
    // 0.1 Quantile trace
    const quantile0_1Trace = {
      x: predictedXValues,
      y: predictedQuantile0_1,
      type: 'scatter',
      mode: 'lines',
      line: {
        color: 'blue',
        width: 2,
        dash: 'dot' // Different line style for differentiation
      },
      name: '0.1 Quantile'
    };
  
    // 0.9 Quantile trace
    const quantile0_9Trace = {
      x: predictedXValues,
      y: predictedQuantile0_9,
      type: 'scatter',
      mode: 'lines',
      line: {
        color: 'green',
        width: 2,
        dash: 'dash'
      },
      name: '0.9 Quantile'
    };
  
    // Add new traces to the plot
    Plotly.addTraces('Synthetic_Div', [meanTrace, quantile0_1Trace, quantile0_9Trace]);
  }