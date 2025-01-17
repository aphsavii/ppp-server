import { createClient } from "redis";

const REDIS_USERNAME = process.env.REDIS_USERNAME;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_DB_NUMBER = process.env.REDIS_DB_NUMBER;

const uri = `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/#${REDIS_DB_NUMBER}`;

// REDIS CONNECTION
const redisClient = createClient({
    url: 'redis://127.0.0.1:6379',
});
const verifyOTP = async (otp: string, email: string) => {
    const storedOTP = await redisClient.get(`otp:${email}`);
    if (!storedOTP) return false;
    if (otp.toString() != storedOTP) return false;
    return true;
}


export { redisClient, verifyOTP };