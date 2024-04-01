import axios from 'axios';
import * as AWS from 'aws-sdk';
import * as dotenv from 'dotenv';

dotenv.config();
// Set the region programmatically
AWS.config.update({ region: 'us-east-1' });

// Initialize the DynamoDB Document Client
const documentClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'Cryto_Data_1'; // Replace with your DynamoDB table name
const apiKey = process.env.CRYPTOCOMPARE_API_KEY; // Ensure this matches the variable in your .env file
const coins = ['BTC', 'ETH', 'XRP', 'LTC', 'ADA']; // Your array of coins
const tsyms = 'USD';
const limit = 500; // Number of data points to retrieve

// Function to insert a single data point into DynamoDB
const insertHighLowToDynamoDB = async (coin: string, dataPoint: any) => {
  const params = {
    TableName: tableName,
    Item: {
      Coin: coin,
      PriceTimeStamp: dataPoint.time, 
      Currency: tsyms, 
      High: dataPoint.high,
      Low: dataPoint.low,
    },
  };

  try {
    await documentClient.put(params).promise();
    console.log(`Successfully inserted ${coin} high and low for time: ${dataPoint.time}`);
  } catch (error) {
    console.error(`Error inserting ${coin} data to DynamoDB`, error);
  }
};

// Function to fetch and store historical data for a single coin
const fetchAndStoreHistoricalData = async (coin: string) => {
  const url = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${coin}&tsym=${tsyms}&limit=${limit}&api_key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data.Data?.Data; // Array of historical data points
    for (const dataPoint of data) {
      await insertHighLowToDynamoDB(coin, dataPoint);
    }
  } catch (error) {
    console.error(`Error fetching historical data for ${coin}:`, error);
  }
};

// Function to iterate through coins and fetch/store data
const fetchAndStoreAllCoinsData = async () => {
  for (const coin of coins) {
    await fetchAndStoreHistoricalData(coin);
  }
};

// Start the process
fetchAndStoreAllCoinsData();
