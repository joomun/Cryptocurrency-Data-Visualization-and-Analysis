const fs = require('fs');
const path = require('path');

// Set the NODE_PATH environment variable to include /opt/node_modules
process.env.NODE_PATH = `${process.env.NODE_PATH || ''}${path.delimiter}/opt/node_modules`;
require('module').Module._initPaths();

const AWS = require('aws-sdk');

const sagemaker = new AWS.SageMakerRuntime({
    region: 'us-east-1' // Make sure this is the correct region for your SageMaker endpoint
});

exports.handler = async (event) => {
    try {
        console.log(event)
        const body = JSON.parse(event.body);
        const dataPayload = body.data;
        
        const endpointData = {
            instances: dataPayload.instances.map(instance => {
                // Base date is 2024-03-11 20:00:00, which needs to be adjusted by the 'start' hours
                const baseDateTime = new Date(Date.UTC(2024, 2, 11, 20, 0, 0)); // Note: Month is 0-indexed (0 = January)
                // Calculate new start date by adding 'start' value in hours
                const newStartDate = new Date(baseDateTime.getTime() + instance.start * 3600 * 1000);
                return {
                    start: newStartDate.toISOString().replace('.000Z', ''), // Remove milliseconds and timezone 'Z'
                    target: instance.target
                };
            }),
            configuration: dataPayload.configuration
        };


        const params = {
            EndpointName: 'SyntheticDataEndPoint',
            Body: JSON.stringify(endpointData),
            ContentType: 'application/json'
        };

        const responseFromSageMaker = await sagemaker.invokeEndpoint(params).promise();
        const predictions = JSON.parse(responseFromSageMaker.Body.toString());

        const responseBody = {
            action: 'PredictionData',
            predictedPoints: predictions.predictions.map(prediction => prediction.mean)
        };

        const apigwManagementApi = new AWS.ApiGatewayManagementApi({
            apiVersion: '2018-11-29',
            endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`
        });

        await apigwManagementApi.postToConnection({
            ConnectionId: event.requestContext.connectionId,
            Data: JSON.stringify(responseBody)
        }).promise();

        return { statusCode: 200, body: 'Data sent.' };

    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error processing your request' }) };
    }
};
