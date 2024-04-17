const fs = require('fs');
const path = require('path');

// Set the NODE_PATH environment variable to include /opt/node_modules
process.env.NODE_PATH = `${process.env.NODE_PATH || ''}${path.delimiter}/opt/node_modules`;
require('module').Module._initPaths();

const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const sagemaker = new AWS.SageMakerRuntime({ region: 'us-east-1' });
const documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    try {
        const message = JSON.parse(event.body);
        const action = message.action;
        const selectedCoin = message.coin.toUpperCase();

        const coinMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'XRP': 'ripple',
            'LTC': 'litecoin',
            'ADA': 'cardano'
        };

        const coinName = coinMap[selectedCoin] || selectedCoin;

        console.log('Received WebSocket message:', message);
        console.log('Parsed message:', { action, coin: coinName });

        // Setting up the connection ID and API Management instance
        const connectionId = event.requestContext.connectionId;
        const domainName = event.requestContext.domainName;
        const stage = event.requestContext.stage;
        const apiGwManagementApi = new AWS.ApiGatewayManagementApi({
            apiVersion: '2018-11-29',
            endpoint: `${domainName}/${stage}`
        });

        switch (action) {
            case 'Fetch_sentiment':
                const scanParams = {
                    TableName: 'News_Log',
                    FilterExpression: '#coin = :coin',
                    ExpressionAttributeNames: {
                        '#coin': 'Coin',
                    },
                    ExpressionAttributeValues: {
                        ':coin': coinName,
                    },
                };

                const scanResult = await documentClient.scan(scanParams).promise();
                if (scanResult.Items.length === 0) {
                    return sendResponse(404, `No news items found for coin: ${coinName}`);
                }

                const combinedDataPromises = scanResult.Items.map(async (item) => {
                    const sentimentResult = await documentClient.get({
                        TableName: 'Sentiment_Results',
                        Key: { News_ID: item.News_ID },
                    }).promise();

                    const publishedDate = item.publishedAt ? new Date(item.publishedAt) : new Date();
                    return sentimentResult.Item ? {
                        newsID: sentimentResult.Item.News_ID,
                        sentimentScore: sentimentResult.Item.SentimentScore,
                        timestamps: publishedDate.toISOString(),
                    } : null;
                });

                const combinedData = (await Promise.all(combinedDataPromises)).filter(Boolean);
                const responsePayload = {
                    action: 'Fetch_sentiment',
                    sentimentData: combinedData
                };

                console.log('Sending back to client:', responsePayload);
                await apiGwManagementApi.postToConnection({
                    ConnectionId: connectionId,
                    Data: JSON.stringify(responsePayload),
                }).promise();

                return { statusCode: 200, body: 'Data sent to the client.' };

            default:
                return sendResponse(400, 'Unsupported action');
        }
    } catch (error) {
        console.error('Error:', error);
        return sendResponse(500, 'An error occurred');
    }
};

function sendResponse(statusCode, message) {
    return {
        statusCode: statusCode,
        body: JSON.stringify({ error: message }),
    };
}