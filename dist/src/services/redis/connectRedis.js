"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.getRedisClient = getRedisClient;
const ioredis_1 = __importDefault(require("ioredis"));
let redisClient = null;
exports.redisClient = redisClient;
async function getRedisClient() {
    if (!redisClient) {
        exports.redisClient = redisClient = new ioredis_1.default(process.env.REDIS_URL || "", {
            tls: {} // Enables TLS for `rediss://`
        });
        redisClient.on('connect', () => {
            console.log('Redis connected');
        });
        redisClient.on('error', (err) => {
            console.error('Redis error:', err);
        });
        return redisClient;
    }
    else {
        return redisClient;
    }
}
