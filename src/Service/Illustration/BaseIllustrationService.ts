import seq from '../../Persistence/MySQLConfig';
import { Work, WorkUploadRequest } from '../../Persistence/Model/Work';
import { Illustrations } from '../../Persistence/Model/Illustrations';
import * as FileResolver from '../../Service/Config/FileResolver';
import * as fs from 'fs'
import { promisify } from 'util'
import AppConfig = require('../../../app.json');
import { MyLike } from '../../Persistence/Model/MyLike';
import sequelize from '../../Persistence/MySQLConfig';
import { TaskPool } from '../../Persistence/Model/TaskPool';

const existsAsync = promisify(fs.exists)
const copyFileAsync = promisify(fs.copyFile)

export enum WorkInformationType {
    Home = 'home',
    Detail = 'detail'
}

export enum WorkImageSizeType {
    Mid = 'mid',
    Origin = 'origin'
}

export enum WorkImageType {
    Sketch = 'sketch',
    Colorization = 'colorization',
    Points = 'points'
}



const InfoItemFilter = (type: WorkInformationType, Prefix: string) => type === WorkInformationType.Home ? `${Prefix}.id, ${Prefix}.name, ${Prefix}.artist` : `${Prefix}.*`

export async function GetWorkInformationByUserID(UserID: number, Type: WorkInformationType) {
    const sql = `select ${InfoItemFilter(Type, 'w')}, i.nick_name as artist_name from work w left join information i on w.artist = i.user_id where i.user_id = ? order by w.created desc`
    return await seq.query({ query: sql, values: [UserID] }, { mapToModel: true, model: Work })
}

export async function GetWorkInformationByWorkID(WorkID: number, Type: WorkInformationType) {
    const sql = `select ${InfoItemFilter(Type, 'w')}, i.nick_name as artist_name from work w left join information i on w.artist = i.user_id where w.id = ?`
    return await seq.query({ query: sql, values: [WorkID] }, { mapToModel: true, model: Work })
}

export async function GetMyLikeWorks(UserID: number, Start: number, Count: number, Type: WorkInformationType) {
    const sql = `select ${InfoItemFilter(Type, 'w')} from my_like left join work w on w.id = work_id where user_id = ? order by w.created desc LIMIT ${Start},${Count} ;`
    return await seq.query({ query: sql, values: [UserID] }, { mapToModel: true, model: Work })
}


export async function GetWorkImage(WorkId: number, ScaleType: WorkImageSizeType, ImageType: WorkImageType) {
    const image = await Illustrations.findOne({ where: { Id: WorkId } })
    if (!image)
        return {
            StatusCode: -1 // Cannot find the work with such id specified.
        }

    try {
        if (ScaleType === WorkImageSizeType.Mid) {
            if (ImageType === WorkImageType.Sketch && image.SketchImageMid)
                return FileResolver.GetWorkImageReadFileStream(image.ArtistId, ImageType, image.SketchImageMid)
            else if (ImageType === WorkImageType.Colorization && image.ColorizationImageMid)
                return FileResolver.GetWorkImageReadFileStream(image.ArtistId, ImageType, image.ColorizationImageMid)
            else
                return {
                    StatusCode: -1
                }
        }
        else if (ScaleType === WorkImageSizeType.Origin) {
            if (ImageType === WorkImageType.Sketch && image.SketchImage)
                return FileResolver.GetWorkImageReadFileStream(image.ArtistId, ImageType, image.SketchImage)
            else if (ImageType === WorkImageType.Colorization && image.ColorizationImage)
                return FileResolver.GetWorkImageReadFileStream(image.ArtistId, ImageType, image.ColorizationImage)
            else
                return {
                    StatusCode: -1
                }
        }
    }
    catch (OpenFileFailed) {
        console.error(OpenFileFailed)
        return {
            StatusCode: -2 // 文件打开失败
        }
    }
}


export async function LikeOneWork(UserID: number, WantToLikeWorkID: number) {
    const LikeRecordPair = {
        UserId: UserID,
        WorkId: WantToLikeWorkID
    }
    const IfHaveSuchWork = await Work.count({ where: { Id: WantToLikeWorkID } })
    if (IfHaveSuchWork !== 1) {
        return {
            StatusCode: -2 //没有此作品
        }
    }
    return await MyLike.findOrCreate({
        where: LikeRecordPair,
        defaults: LikeRecordPair
    }).then(([pair, created]) => {
        return created ? { StatusCode: 0 } : { StatusCode: -1 }
    }).catchReturn({ StatusCode: -2 })
}

export async function UnLikeOneWork(UserID: number, WantToUnLikeWorkID: number) {
    const LikeRecordPair = {
        UserId: UserID,
        WorkId: WantToUnLikeWorkID
    }
    const IfHaveSuchWork = await Work.count({ where: { Id: WantToUnLikeWorkID } })

    if (IfHaveSuchWork !== 1) {
        return {
            StatusCode: -2 //没有此作品
        }
    }
    let transaction = await sequelize.transaction()
    return await MyLike.destroy({ where: LikeRecordPair, transaction: transaction }).then(count => {
        if (count === 1) {
            transaction.commit()
            return {
                StatusCode: 0
            }
        }
        else if (count === 0) {
            transaction.commit()
            return {
                StatusCode: -1
            }
        }
        else
            throw Error("Unknown error, should roll back.")
    }).catch(() => {
        transaction.rollback()
        return { StatusCode: -3 }
    })
}


export async function UploadOneWork(WorkInfo: WorkUploadRequest) {

    /*
        分几步上传作品:
        1. 验证Receipt是否已经正确
        2. 验证Receipt中指代的图片文件是否正确存在本地
        3. 正确的把图片复制到当前用户的作品文件夹
        4. 插数据库
        5. 告知成功
    */
    let transaction = await seq.transaction()
    return await TaskPool.findOne({ where: { Receipt: WorkInfo.Receipt } })
        .then(async task => {
            if (!task) throw Error("Invalid Task.")
            const sketchPath = FileResolver.GenerateTaskExistsFilePath(WorkImageType.Sketch, task.OriginalSketchFile)
            const colorizedPath = FileResolver.GenerateTaskExistsFilePath(WorkImageType.Colorization, task.ColorizedFile)
            if (await existsAsync(sketchPath) && await existsAsync(colorizedPath)) {
                return [task, sketchPath, colorizedPath] as [TaskPool, string, string]
            }
            else {
                throw Error("No such sketch file and colorized file.")
            }
        })
        .then(async ([task, sketch, colorized]) => {
            const sketchFinalPath = FileResolver.GenerateWorkExistsFilePath(WorkImageType.Sketch, WorkInfo.ArtistId, task.OriginalSketchFile)
            const colorizedFinalPath = FileResolver.GenerateWorkExistsFilePath(WorkImageType.Colorization, WorkInfo.ArtistId, task.ColorizedFile)

            await copyFileAsync(sketch, sketchFinalPath)
            await copyFileAsync(colorized, colorizedFinalPath)
            return task
        })
        .then(async (task) => {
            const work = await Work.create({ ...WorkInfo }, { transaction: transaction })
            const illu = await Illustrations.create({
                Id: work.Id,
                ArtistId: work.ArtistId,
                SketchImage: task.OriginalSketchFile,
                ColorizationImage: task.ColorizedFile,
                PointsJson: `${task.Receipt}.json`
            },
            { transaction: transaction })
            if (work && illu) {
                transaction.commit()
            }
            else {
                transaction.rollback()
                throw Error("DB Write Error.")
            }
            return work
        })
        .then(work => ({ StatusCode:0 , Id: work.Id }))
        .catch(err => {
            console.log(err)
            if (err.errno === -4058) return { StatusCode: -2 }
            else if (err instanceof Error) return { StatusCode: -1 }
        })
}