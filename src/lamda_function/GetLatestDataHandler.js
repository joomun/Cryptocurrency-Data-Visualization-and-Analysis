const fs = require('fs');
const path = require('path');

// Set the NODE_PATH environment variable to include /opt/node_modules
process.env.NODE_PATH = `${process.env.NODE_PATH || ''}${path.delimiter}/opt/node_modules`;
require('module').Module._initPaths();

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    // Logging the event is good for debugging
    console.log("Event: ", JSON.stringify(event, null, 2));

    // The connection ID and the domain name are part of the event object
    const connectionId = event.requestContext.connectionId;
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const endpoint = `${domainName}/${stage}`;

    // Parse the coin from the body
    const body = JSON.parse(event.body);
    const coin = body.coin;

    try {
        const latestPriceTimestamp = await getLatestPriceTimestampForCoin(coin);
        await sendToClient(connectionId, latestPriceTimestamp, endpoint);
    } catch (error) {
        console.error(error);
        await sendToClient(connectionId, { error: "Failed to retrieve data." }, endpoint);
    }

    return { statusCode: 200, body: 'Data request processed.' };
};

async function getLatestPriceTimestampForCoin(coin) {
    // Removed ScanIndexForward, not applicable to scan
    const params = {
        TableName: 'Cryto_Data_1',
        FilterExpression: 'Coin = :coin',
        ExpressionAttributeValues: { ':coin': coin },
    };

    const result = await ddb.scan(params).promise();
    // Assuming PriceTimeStamp is a number, otherwise you may need to parse or convert
    const sortedItems = result.Items.sort((a, b) => b.PriceTimeStamp - a.PriceTimeStamp);
    return sortedItems[0]; // Return the latest item
}

async function sendToClient(connectionId, data, endpoint) {
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: endpoint // Correctly set endpoint
    });

    return apigwManagementApi.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(data),
    }).promise();
}
