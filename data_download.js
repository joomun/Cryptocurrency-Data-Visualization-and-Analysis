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
// Set the region programmatically
AWS.config.update({ region: 'us-east-1' });
// Initialize the DynamoDB Document Client
var documentClient = new AWS.DynamoDB.DocumentClient();
var tableName = 'Cryto_Data_1'; // Replace with your DynamoDB table name
var apiKey = process.env.CRYPTOCOMPARE_API_KEY; // Ensure this matches the variable in your .env file
var coins = ['BTC', 'ETH', 'XRP', 'LTC', 'ADA']; // Your array of coins
var tsyms = 'USD';
var limit = 500; // Number of data points to retrieve
// Function to insert a single data point into DynamoDB
var insertHighLowToDynamoDB = function (coin, dataPoint) { return __awaiter(void 0, void 0, void 0, function () {
    var params, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                params = {
                    TableName: tableName,
                    Item: {
                        Coin: coin,
                        PriceTimeStamp: dataPoint.time,
                        Currency: tsyms,
                        High: dataPoint.high,
                        Low: dataPoint.low,
                    },
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, documentClient.put(params).promise()];
            case 2:
                _a.sent();
                console.log("Successfully inserted ".concat(coin, " high and low for time: ").concat(dataPoint.time));
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error("Error inserting ".concat(coin, " data to DynamoDB"), error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
// Function to fetch and store historical data for a single coin
var fetchAndStoreHistoricalData = function (coin) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response, data, _i, data_1, dataPoint, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                url = "https://min-api.cryptocompare.com/data/v2/histoday?fsym=".concat(coin, "&tsym=").concat(tsyms, "&limit=").concat(limit, "&api_key=").concat(apiKey);
                _b.label = 1;
            case 1:
                _b.trys.push([1, 7, , 8]);
                return [4 /*yield*/, axios_1.default.get(url)];
            case 2:
                response = _b.sent();
                data = (_a = response.data.Data) === null || _a === void 0 ? void 0 : _a.Data;
                _i = 0, data_1 = data;
                _b.label = 3;
            case 3:
                if (!(_i < data_1.length)) return [3 /*break*/, 6];
                dataPoint = data_1[_i];
                return [4 /*yield*/, insertHighLowToDynamoDB(coin, dataPoint)];
            case 4:
                _b.sent();
                _b.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6: return [3 /*break*/, 8];
            case 7:
                error_2 = _b.sent();
                console.error("Error fetching historical data for ".concat(coin, ":"), error_2);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
// Function to iterate through coins and fetch/store data
var fetchAndStoreAllCoinsData = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _i, coins_1, coin;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _i = 0, coins_1 = coins;
                _a.label = 1;
            case 1:
                if (!(_i < coins_1.length)) return [3 /*break*/, 4];
                coin = coins_1[_i];
                return [4 /*yield*/, fetchAndStoreHistoricalData(coin)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}); };
// Start the process
fetchAndStoreAllCoinsData();
