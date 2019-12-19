import * as fs from 'fs'
import AppConfig = require('../../../app.json')
import { WorkImageType } from '../Illustration/BaseIllustrationService'
import { promisify } from 'util'
import { TaskPool } from '../../Persistence/Model/TaskPool'
import moment = require('moment');
import { getChannelAsync, assertQueueAsync } from '../MQ/ColorizeMQ'
import { GenerateTaskExistsFilePath, GenerateTaskTempFilePath } from '../Config/FileResolver'
import { Replies, Message } from 'amqplib';
import { Channel } from 'amqplib/callback_api'
const writeFileAsync = promisify(fs.writeFile)
const existsAsync = promisify(fs.exists)

async function SendColorizeRequestToMQ(
    channel: Channel,
    q: Replies.AssertQueue,
    ImageBase64String: string,
    PointsData: [[number]],
    Receipt: string) {
}
async function ReceiveColorizeResultFromMQ(msg: Message) {
    const jsonStr = msg.content.toString('utf-8')
    const Result = JSON.parse(jsonStr)
    if (Result.StatusCode === 0) {
        const ResultImage = Buffer.from(Result.image, 'base64')
        const ResultFileName = `${Result.receipt}.jpg`
        const fp = await GenerateTaskExistsFilePath(WorkImageType.Colorization, ResultFileName)
        console.log(fp)
        try {
            await writeFileAsync(fp, ResultImage)
            await TaskPool.update({ Status: 0, ColorizedFile: ResultFileName }, { where : { Receipt : Result.receipt }})
        }
        catch (WriteFileErr) {
            console.error('持久化上色结果失败!', WriteFileErr)
        }
        console.log("完成对任务",Result.receipt,"的上色工作.")
    }
    else {
        console.error("出现上色失败!", moment().toNow())
    }
}

export async function SaveSketchForFurtherColorization(ImageBase64String: string, PointsData: [[number]]) {
    const ImageBytes = Buffer.from(ImageBase64String, 'base64')
    const [FilePath, GeneratedReceipt, FileName] = await GenerateTaskTempFilePath(WorkImageType.Sketch, 'png')
    const [JsonPath] = await GenerateTaskTempFilePath(WorkImageType.Points, 'json')

    try {
        await writeFileAsync(FilePath, ImageBytes)
        // TODO: Save an item to database.
        await writeFileAsync(JsonPath, JSON.stringify({
            points: PointsData
        }))
    }
    catch (WriteFileErr) {
        console.error(WriteFileErr)
        return {
            StatusCode: -3
        }
    }


    const channel = await getChannelAsync()

    const q = await assertQueueAsync(channel, 'iAnimeColorizationResultQueue', { exclusive: true })
    channel.consume(q.queue, ReceiveColorizeResultFromMQ, { noAck: true });
    const SendToQueueOK = channel.sendToQueue('iAnimeColorizationQueue', Buffer.from(JSON.stringify({
        image: ImageBase64String,
        points: PointsData,
        receipt: GeneratedReceipt
    })), { correlationId: GeneratedReceipt, replyTo: q.queue })

    if (!SendToQueueOK) {
        return {
            StatusCode: -1
        }
    }

    try {
        const UpsertResult = await TaskPool.upsert({
            Receipt: GeneratedReceipt,
            OriginalSketchFile: FileName,
            ColorizedFile: '',
            Status: 2,
            CreatedAt: moment().unix()
        } as TaskPool)
        console.log("Upsert Result:", UpsertResult)

        return {
            StatusCode: 0,
            Receipt: GeneratedReceipt
        }
    }
    catch (InsertToDBError) {
        console.error(InsertToDBError)
        return {
            StatusCode: -2
        }
    }
}
// 定义内部Status 
// 2 Pending 正在排队等待上色
// 1 Colorizing 正在上色
// 0 Finished 完成上色
export async function QueryColorizationStatus(Receipt: string) {
    const task = await TaskPool.findOne({ where: { Receipt: Receipt } })
    if (!task) {
        return {
            StatusCode: -1
        }
    }
    let StatusResult = {}
    StatusResult['StatusCode'] = task.Status

    if (task.Status === 0) {
        StatusResult['Receipt'] = Receipt
    }
    return StatusResult
}

export async function QueryColorizationResult(Receipt: string) {
    const task = await TaskPool.findOne({ where: { Receipt: Receipt } })
    if (task && task.Status === 0 && task.ColorizedFile) {
        // 开始构造文件流
        const path = GenerateTaskExistsFilePath(WorkImageType.Colorization, task.ColorizedFile)
        return fs.createReadStream(path).on('error', console.error)
    }
    console.error("Currently queried task haven't been finish. => ", task)
    return null
}