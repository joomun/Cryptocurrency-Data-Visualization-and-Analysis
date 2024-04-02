const fs = require('fs');
const path = require('path');

// Set the NODE_PATH environment variable to include /opt/node_modules
process.env.NODE_PATH = `${process.env.NODE_PATH || ''}${path.delimiter}/opt/node_modules`;
require('module').Module._initPaths();

const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    const tableName = 'WebSocketClients'; // Replace with your DynamoDB table name

    const params = {
        TableName: tableName,
        Item: {
            'Connection_ID': connectionId // Ensure that 'Connection_ID' is the partition key in your DynamoDB table
        }
    };

    try {
        // Store the connection ID in the DynamoDB table
        await documentClient.put(params).promise();
        console.log(`Connection ID ${connectionId} added to the table.`);
        return { statusCode: 200, body: 'Connected.' };
    } catch (err) {
        console.error('Error adding connection ID to the table:', err);
        return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
    }
};
