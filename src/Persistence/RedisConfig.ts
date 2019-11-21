import * as redis from 'redis'
import { WithPromise } from './RedisClientEnhance';
const { Database: { Redis } } = require('../../app.json')
const client = redis.createClient(Redis)
    .once('ready', console.log.bind(console, 'Redis connected!'))

client.on('error', console.error.bind(console, 'Redis connection error:'));

// Extend GET/SET
export default WithPromise(client)
