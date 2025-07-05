import Redis from 'ioredis';
declare let redisClient: Redis | null;
export declare function getRedisClient(): Promise<any>;
export { redisClient };
