import { RedisClient } from 'redis'

export interface RedisClientEnhance extends RedisClient {
    PromiseGet(key: string): Promise<string>
    PromiseSet(key: string, value: string, mode: string, duration: number): Promise<string>
}

function PromiseGet(key: string): Promise<string> {
    return new Promise((resolve, reject) => {
        this.GET(key, (err, reply) => {
            if (err) reject(err)
            else resolve(reply)
        })
    })
}

function PromiseSet(key: string, value: string, mode: string, duration: number): Promise<string> {
    return new Promise((resolve, reject) => {
        this.SET(key, value, mode, duration, (err, reply) => {
            if (err) reject(err)
            else resolve(reply)
        })
    })
}

export function WithPromise(client: RedisClient): RedisClientEnhance {
    const unwrapType = client as any
    unwrapType.PromiseGet = PromiseGet.bind(unwrapType)
    unwrapType.PromiseSet = PromiseSet.bind(unwrapType)
    return unwrapType as RedisClientEnhance
}


