"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRateLimited = isRateLimited;
const connectRedis_1 = require("../redis/connectRedis");
async function isRateLimited(ip) {
    const key = `rate:${ip}`;
    const limit = 100;
    const windowSeconds = 60 * 60; // 1 hour
    // Use INCR and set expiry only if key is new
    const current = await connectRedis_1.redisClient?.incr(key);
    if (current === 1) {
        await connectRedis_1.redisClient?.expire(key, windowSeconds);
    }
    if (current) {
        return current > limit;
    }
    else {
        return true;
    }
}
