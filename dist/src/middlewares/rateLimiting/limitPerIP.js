"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRateLimited = isRateLimited;
const connectRedis_1 = require("../../services/redis/connectRedis");
async function isRateLimited(req, res, next) {
    const ip = req.ip;
    const key = `rate:${ip}`;
    const limit = 100;
    const windowSeconds = 60 * 60; // 1 hour
    // Use INCR and set expiry only if key is new
    const current = await connectRedis_1.redisClient?.incr(key);
    console.log(current);
    if (current === 1) {
        await connectRedis_1.redisClient?.expire(key, windowSeconds);
    }
    if (current && current < limit) {
        next();
    }
    else {
        res.status(400).json({
            message: "Too many requests. Please try after sometime"
        });
    }
}
