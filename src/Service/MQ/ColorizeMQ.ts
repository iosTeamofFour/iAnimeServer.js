import * as amqp from 'amqplib/callback_api'
import AppConfig = require('../../../app.json')
import { Replies } from 'amqplib/callback_api';

let __conn: amqp.Connection, __channel: amqp.Channel


const connectAsync = () => new Promise<amqp.Connection>((resolve, reject) => {
    if (__conn) {
        resolve(__conn)
    }
    else {
        amqp.connect(AppConfig.Database.RabbitMQ, (err, conn) => {
            if (err) reject(err)
            else {
                __conn = conn
                resolve(conn)
            }
        })
    }
})

export const getChannelAsync = () => new Promise<amqp.Channel>(async (resolve, reject) => {
    if (__channel) {
        resolve(__channel)
    }
    else {
        const conn = await connectAsync()
        conn.createChannel((err, channel) => {
            if (err) reject(err)
            else {
                __channel = channel
                resolve(__channel)
            }
        })
    }
})

export const assertQueueAsync = (channel: amqp.Channel, queueName: string, options: amqp.Options.AssertQueue) => new Promise<Replies.AssertQueue>((resolve, reject) => {
    channel.assertQueue(queueName, options, (err, q) => {
        if (err) reject(err)
        else resolve(q)
    })
})

