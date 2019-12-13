import * as fs from 'fs'
import AppConfig = require('../../../app.json')
import { WorkImageType } from '../Illustration/BaseIllustrationService'
import { promisify } from 'util'
import { TaskPool } from '../../Persistence/Model/TaskPool'
import moment = require('moment');
import {GenerateTaskExistsFilePath, GenerateTaskTempFilePath} from '../Config/FileResolver'
const writeFileAsync = promisify(fs.writeFile)
const existsAsync = promisify(fs.exists)


export async function SaveSketchForFurtherColorization(ImageBase64String: string, PointsData : [[number]]) {
    const ImageBytes = Buffer.from(ImageBase64String,'base64')
    const [FilePath,GeneratedReceipt, FileName] = await GenerateTaskTempFilePath(WorkImageType.Sketch,'png')
    const [JsonPath] = await GenerateTaskTempFilePath(WorkImageType.Points,'json')
    try {
        await writeFileAsync(FilePath, ImageBytes)
        // TODO: Save an item to database.
        await writeFileAsync(JsonPath,JSON.stringify({
            points: PointsData
        }))

        const UpsertResult = await TaskPool.upsert({
            Receipt: GeneratedReceipt,
            OriginalSketchFile : FileName,
            ColorizedFile:'',
            Status: 2,
            CreatedAt: moment().unix()
        } as TaskPool)
        console.log("Upsert Result:", UpsertResult)
        return {
            StausCode: 0,
            Receipt: GeneratedReceipt
        }
    }
    catch (WriteFileErr) {
        console.error(WriteFileErr)
        return {
            StatusCode: -2
        }
    }
}
    // 定义内部Status 
    // 2 Pending 正在排队等待上色
    // 1 Colorizing 正在上色
    // 0 Finished 完成上色
export async function QueryColorizationStatus(Receipt : string) {
    const task = await TaskPool.findOne({ where : { Receipt : Receipt }})
    if(!task) {
        return {
            StatusCode: -1
        }
    }
    let StatusResult = {}
    StatusResult['StatusCode'] = task.Status

    if(task.Status === 0) {
        StatusResult['Receipt'] = Receipt
    }
    return StatusResult
}

export async function QueryColorizationResult(Receipt : string) {
    const task = await TaskPool.findOne({ where : { Receipt : Receipt }})
    if(task && task.Status === 0 && task.ColorizedFile) {
        // 开始构造文件流
        const path = GenerateTaskExistsFilePath(WorkImageType.Colorization,task.ColorizedFile)
        return fs.createReadStream(path).on('error',console.error)
    }
    console.error("Currently queried task haven't been finish. => ",task)
    return null
}


