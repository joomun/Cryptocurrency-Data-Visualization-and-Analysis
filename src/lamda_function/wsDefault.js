const fs = require('fs');
const path = require('path');

// Set the NODE_PATH environment variable to include /opt/node_modules
process.env.NODE_PATH = `${process.env.NODE_PATH || ''}${path.delimiter}/opt/node_modules`;
require('module').Module._initPaths();

const AWS = require('aws-sdk');

// Initialize the API Gateway management API
const apiGateway = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

exports.handler = async (event) => {
  console.log("Default route received a message:", event);

  // Log and return an error message to the client
  try {
    await apiGateway.postToConnection({
      ConnectionId: event.requestContext.connectionId,
      Data: "Error: No route found for the message."
    }).promise();
    console.log(`Error message sent to connection ID ${event.requestContext.connectionId}`);
  } catch (error) {
    console.error(`Error sending message to connection ID ${event.requestContext.connectionId}:`, error);
    // If there's an error, like the connection is no longer available, log it
  }

  return {
    statusCode: 200,
    body: "Message processed by wsDefault."
  };
};
