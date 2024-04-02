import axios from 'axios';
import * as AWS from 'aws-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const newsApiKey = process.env.NEWS_API_KEY;
if (!newsApiKey) {
  throw new Error('The NEWS_API_KEY environment variable is not set.');
}

// Initialize AWS DynamoDB DocumentClient
AWS.config.update({ region: 'us-east-1' });
const documentClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'News_Log';

const fetchNewsArticles = async (query: string) => {
  const url = 'https://newsapi.org/v2/everything';
  const params = {
    q: query,
    language: 'en',
    apiKey: newsApiKey,
    pageSize: 100,
  };

  try {
    const response = await axios.get(url, { params });
    return response.data.articles;
  } catch (error) {
    console.error(`Error fetching news articles for "${query}":`, error);
    throw error;
  }
};

const storeArticleInDynamoDB = async (article: any) => {
  const params = {
    TableName: tableName,
    Item: {
      News_ID: article.url, // Assuming the article URL is unique and using it as News_ID
      Content: article
    }
  };

  try {
    await documentClient.put(params).promise();
    console.log(`Successfully stored article with URL: ${article.url}`);
  } catch (error) {
    console.error(`Error storing article with URL: ${article.url}`, error);
  }
};

const fetchAndAnalyzeNewsArticles = async () => {
  const coins = ['bitcoin', 'ethereum', 'ripple', 'litecoin', 'cardano'];
  const delayBetweenRequests = 3000; // Delay to avoid hitting the rate limit

  for (const coin of coins) {
    console.log(`Fetching news articles about ${coin}...`);
    const articles = await fetchNewsArticles(coin);

    for (const article of articles) {
      await storeArticleInDynamoDB(article);
    }
    
    await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
  }
};

fetchAndAnalyzeNewsArticles();
