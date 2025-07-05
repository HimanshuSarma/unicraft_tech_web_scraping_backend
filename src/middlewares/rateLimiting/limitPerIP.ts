import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../../services/redis/connectRedis';

export async function isRateLimited(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip;
  const key = `rate:${ip}`;
  const limit = 100;
  const windowSeconds = 60 * 60; // 1 hour


  // Use INCR and set expiry only if key is new
  const current = await redisClient?.incr(key);
  console.log(current);

  if (current === 1) {
    await redisClient?.expire(key, windowSeconds);
  }

  if (current && current < limit) {
    next();
  } else {
    res.status(400).json({
      message: "Too many requests. Please try after sometime"
    });
  }
}
