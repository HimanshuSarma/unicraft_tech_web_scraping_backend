import Redis from 'ioredis';

let redisClient: Redis | null = null;

export async function getRedisClient(): Promise<any> {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || "", {
      tls: {} // Enables TLS for `rediss://`
    });

    redisClient.on('connect', () => {
      console.log('Redis connected');
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    return redisClient;
  } else {
    return redisClient;
  }
}

export {
  redisClient
};
