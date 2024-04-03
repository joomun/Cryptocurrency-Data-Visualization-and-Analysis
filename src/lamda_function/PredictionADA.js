const fs = require('fs');
const path = require('path');

// Set the NODE_PATH environment variable to include /opt/node_modules
process.env.NODE_PATH = `${process.env.NODE_PATH || ''}${path.delimiter}/opt/node_modules`;
require('module').Module._initPaths();

const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const sagemaker = new AWS.SageMakerRuntime({ region: 'us-east-1' });


function convertDataForSageMaker(items) {
    console.log('Converting data for SageMaker...');
    // Ensure there's enough data
    if (items.length < 100) {
        throw new Error('Insufficient data for prediction. Expected 100 data points.');
    }

    // Sort items by timestamp in case they are not already
    items.sort((a, b) => b.PriceTimeStamp - a.PriceTimeStamp);

    // Convert the timestamp to ISO without timezone and format the targets array
    const startISO = new Date(items[0].PriceTimeStamp * 1000).toISOString().split('.')[0].replace('T', ' ');
    const targets = items.map(item => item.Close); // Assuming Close is what you want to predict

    return {
        start: startISO,
        target: targets
    };
    
}

async function getLatestDataPoints(tableName, coinType) {
    console.log(`Getting the latest data points for ${coinType}...`);
    const params = {
        TableName: tableName,
        IndexName: 'Coin-PriceTimeStamp-index',
        KeyConditionExpression: 'Coin = :coinType',
        ExpressionAttributeValues: {
            ':coinType': coinType
        },
        ExpressionAttributeNames: {
            "#P": "PriceTimeStamp",
            "#C": "Close",
            "#H": "High",
            "#L": "Low",
            "#O": "Open"
        },
        ProjectionExpression: "#P, #C, #H, #L, #O",
        ScanIndexForward: false, // This will sort the results in descending order
        Limit: 100 // Only take the latest 100 items
    };

    console.log(`Querying table ${tableName} with params:`, params);

    try {
        const data = await dynamodb.query(params).promise();
        console.log(`Queried ${data.Count} items for coin type ${coinType}`);
        if (data.Items.length < 100) {
            throw new Error('Insufficient data points retrieved from DynamoDB');
        }
        return data.Items;
    } catch (error) {
        console.error(`Error querying table ${tableName} for coin type ${coinType}:`, error);
        throw error;
    }
}



async function getPredictionsForPriceType(priceTypeData, endpointName) {
    console.log(`Getting predictions for price type from the endpoint ${endpointName}...`);
    // Check if data is in the expected format
    if (!priceTypeData || priceTypeData.target.length !== 100) {
        console.error('Data is not in the expected format:', priceTypeData);
        throw new Error('Data is not in the expected format.');
    }

    const endpointData = {
        instances: [priceTypeData]
    };

    const params = {
        EndpointName: endpointName,
        Body: JSON.stringify(endpointData),
        ContentType: 'application/json'
    };

    try {
        const response = await sagemaker.invokeEndpoint(params).promise();
        return JSON.parse(response.Body.toString()).predictions.map(prediction => prediction.mean);
    } catch (error) {
        console.error('Error invoking SageMaker endpoint:', error);
        throw error;
    }
}

exports.handler = async (event) => {
    if (event.coin === 'ADA' && event.action === 'ADAPredictionData') {
        try {
            console.log('Defining SageMaker endpoint names...');
            // Define your SageMaker endpoint names for each price type
            const priceTypes = {
                'Low': 'LowADA-v1',
                'High': 'HighADA-v1',
                'Open': 'Open-Ada',
                'Close': 'CloseADA-v1'
            };
            
            console.log('Retrieving latest data points...');
            const latestDataPoints = await getLatestDataPoints('Cryto_Data_1', 'ADA');

            console.log('Formatting data for SageMaker...');
            const formattedData = convertDataForSageMaker(latestDataPoints);

            console.log('Collecting predictions...');
            const predictions = {};

            // Get predictions for each price type
            for (const [type, endpointName] of Object.entries(priceTypes)) {
                console.log(`Processing type: ${type}`);
                predictions[type] = await getPredictionsForPriceType(formattedData, endpointName);
                console.log(`Predictions for ${type}:`, predictions[type]);
            }
            console.log('All predictions collected:', predictions);
            return {
                statusCode: 200,
                body: JSON.stringify(predictions)
            };

        } catch (error) {
            console.error('Error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error processing your request' })
            };
        }
    }
};