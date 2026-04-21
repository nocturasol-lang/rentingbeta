import { Queue } from 'bullmq'
import { createRedisConnection } from '../redis'

export const emailQueue = new Queue('email', { connection: createRedisConnection() })
