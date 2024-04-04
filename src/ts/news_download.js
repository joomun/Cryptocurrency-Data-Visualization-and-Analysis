"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var AWS = require("aws-sdk");
var dotenv = require("dotenv");
dotenv.config();
var newsApiKey = process.env.NEWS_API_KEY;
if (!newsApiKey) {
    throw new Error('The NEWS_API_KEY environment variable is not set.');
}
// Initialize AWS DynamoDB DocumentClient
AWS.config.update({ region: 'us-east-1' });
var documentClient = new AWS.DynamoDB.DocumentClient();
var tableName = 'News_Log';
var fetchNewsArticles = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var url, params, response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = 'https://newsapi.org/v2/everything';
                params = {
                    q: query,
                    language: 'en',
                    apiKey: newsApiKey,
                    pageSize: 100,
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, axios_1.default.get(url, { params: params })];
            case 2:
                response = _a.sent();
                return [2 /*return*/, response.data.articles];
            case 3:
                error_1 = _a.sent();
                console.error("Error fetching news articles for \"".concat(query, "\":"), error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
var storeArticleInDynamoDB = function (article, coin) { return __awaiter(void 0, void 0, void 0, function () {
    var params, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                params = {
                    TableName: tableName,
                    Item: {
                        News_ID: article.url, // Assuming the article URL is unique and using it as News_ID
                        Coin: coin, // Storing the coin type associated with the article
                        Content: article
                    }
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, documentClient.put(params).promise()];
            case 2:
                _a.sent();
                console.log("Successfully stored article about ".concat(coin, " with URL: ").concat(article.url));
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.error("Error storing article about ".concat(coin, " with URL: ").concat(article.url), error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
var fetchAndAnalyzeNewsArticles = function () { return __awaiter(void 0, void 0, void 0, function () {
    var coins, delayBetweenRequests, _i, coins_1, coin, articles, _a, articles_1, article;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                coins = ['bitcoin', 'ethereum', 'ripple', 'litecoin', 'cardano'];
                delayBetweenRequests = 3000;
                _i = 0, coins_1 = coins;
                _b.label = 1;
            case 1:
                if (!(_i < coins_1.length)) return [3 /*break*/, 9];
                coin = coins_1[_i];
                console.log("Fetching news articles about ".concat(coin, "..."));
                return [4 /*yield*/, fetchNewsArticles(coin)];
            case 2:
                articles = _b.sent();
                _a = 0, articles_1 = articles;
                _b.label = 3;
            case 3:
                if (!(_a < articles_1.length)) return [3 /*break*/, 6];
                article = articles_1[_a];
                return [4 /*yield*/, storeArticleInDynamoDB(article, coin)];
            case 4:
                _b.sent(); // Pass the coin to the store function
                _b.label = 5;
            case 5:
                _a++;
                return [3 /*break*/, 3];
            case 6: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delayBetweenRequests); })];
            case 7:
                _b.sent();
                _b.label = 8;
            case 8:
                _i++;
                return [3 /*break*/, 1];
            case 9: return [2 /*return*/];
        }
    });
}); };
fetchAndAnalyzeNewsArticles();
fetchAndAnalyzeNewsArticles();
