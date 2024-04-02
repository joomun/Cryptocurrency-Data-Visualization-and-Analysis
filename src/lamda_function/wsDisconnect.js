const fs = require('fs');
const path = require('path');

// Set the NODE_PATH environment variable to include /opt/node_modules
process.env.NODE_PATH = `${process.env.NODE_PATH || ''}${path.delimiter}/opt/node_modules`;
require('module').Module._initPaths();

const AWS = require('aws-sdk');

// Initialize DynamoDB document client
const documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log("Disconnect event:", event);

  // The connection ID of the client to disconnect
  const connectionId = event.requestContext.connectionId;

  // DynamoDB delete parameters
  const params = {
    TableName: "WebSocketClients",
    Key: {
      Connection_ID: connectionId
    }
  };

  try {
    // Delete the connection ID from the DynamoDB table
    await documentClient.delete(params).promise();
    console.log(`Connection ID ${connectionId} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting connection ID ${connectionId}:`, error);
    // Return a 500 error response to the client
    return {
      statusCode: 500,
      body: `Failed to disconnect: ${JSON.stringify(error)}`
    };
  }

  // Return a 200 OK response to the client
  return {
    statusCode: 200,
    body: `Disconnected connection ID ${connectionId}`
  };
};
