const fs = require('fs');
const path = require('path');

// Set the NODE_PATH environment variable to include /opt/node_modules
process.env.NODE_PATH = `${process.env.NODE_PATH || ''}${path.delimiter}/opt/node_modules`;
require('module').Module._initPaths();


const AWS = require('aws-sdk');
const axios = require('axios');

// URL where student data is available
const url = 'https://y2gtfx0jg3.execute-api.us-east-1.amazonaws.com/prod/M00830556';

exports.handler = async (event) => {
    // Get connection ID from the WebSocket connection event
    const connectionId = event.requestContext.connectionId;

    // Fetch synthetic data
    try {
        const response = await axios.get(url);
        const syntheticData = response.data;

        // Initialize the API Gateway management API
        const endpoint = event.requestContext.domainName + '/' + event.requestContext.stage;
        const apigwManagementApi = new AWS.ApiGatewayManagementApi({
            endpoint: endpoint
        });

        // Send the data back to the client through WebSocket
        await apigwManagementApi.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(syntheticData)
        }).promise();

        return { statusCode: 200, body: 'Data sent to client.' };
    } catch (err) {
        console.error('Error fetching synthetic data:', err);
        return { statusCode: 500, body: 'Error fetching synthetic data' };
    }
};