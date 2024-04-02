const fs = require('fs');
const path = require('path');

// Set the NODE_PATH environment variable to include /opt/node_modules
process.env.NODE_PATH = `${process.env.NODE_PATH || ''}${path.delimiter}/opt/node_modules`;
require('module').Module._initPaths();

const AWS = require('aws-sdk');
const axios = require('axios');

// Configure AWS
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    for (const record of event.Records) {
        if (record.eventName === 'INSERT') {
            const newImage = record.dynamodb.NewImage;
            if (newImage && newImage.Content && newImage.Content.M && newImage.Content.M.content) {
                const articleId = newImage.News_ID.S;
                const articleText = newImage.Content.M.content.S;

                const options = {
                    method: 'POST',
                    url: 'https://sentiment-analysis9.p.rapidapi.com/sentiment',
                    headers: {
                        'content-type': 'application/json',
                        Accept: 'application/json',
                        'X-RapidAPI-Key': process.env.SENTIMENT_ANALYSIS_API_KEY,
                        'X-RapidAPI-Host': 'sentiment-analysis9.p.rapidapi.com'
                    },
                    data: JSON.stringify([
                        {
                            id: articleId,
                            language: 'en', // Assuming all texts are in English; adjust as needed
                            text: articleText
                        }
                    ])
                };

                try {
                    const response = await axios.request(options);
                    const result = response.data[0]; // Assuming the response has the required data in the first element
                    const sentiment = result.predictions[0].prediction; // Adjust according to the actual response structure
                    const probability = result.predictions[0].probability; // Adjust according to the actual response structure

                    console.log(`Sentiment for article ID ${articleId}: ${sentiment} with probability ${probability}`);

                    const sentimentUpdateParams = {
                        TableName: 'Sentiment_Results',
                        Item: {
                            News_ID: articleId,
                            Sentiment: sentiment,
                            SentimentScore: probability,
                        },
                    };

                    await documentClient.put(sentimentUpdateParams).promise();
                } catch (error) {
                    console.error(`Error analyzing sentiment for article ID ${articleId}:`, error);
                }
            } else {
                console.log('No content to analyze for sentiment.');
            }
        }
    }
};
