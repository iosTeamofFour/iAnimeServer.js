import seq from '../../Persistence/MySQLConfig';
import { Work } from '../../Persistence/Model/Work';
import { Illustrations } from '../../Persistence/Model/Illustrations'
import * as FileResolver from '../../Service/Config/FileResolver'

import AppConfig = require('../../../app.json')

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
    Colorization = 'colorization'
}

const InfoItemFilter = (type : WorkInformationType, Prefix : string) =>  type === WorkInformationType.Home ? `${Prefix}.id, ${Prefix}.name, ${Prefix}.artist` : `${Prefix}.*`

export async function GetWorkInformation(WorkId: number, Type: WorkInformationType) {
    const sql = `select ${InfoItemFilter(Type, 'w')}, i.nick_name as artist_name from work w left join information i on artist = i.user_id and id = ?`
    return await seq.query({ query: sql, values: [WorkId] }, { mapToModel: true, model: Work })
}

export async function GetMyLikeWorks(UserID : number, Start : number, Count : number, Type : WorkInformationType) {
    const sql = `select ${InfoItemFilter(Type, 'w')} from my_like left join work w on w.id = work_id where user_id = ? order by w.created desc LIMIT ${Start},${Count} ;`
    return await seq.query({ query : sql, values: [UserID]}, { mapToModel : true, model : Work })
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
                return FileResolver.GetWorkImageReadFileStream(WorkId, ImageType, image.SketchImageMid)
            else if (ImageType === WorkImageType.Colorization && image.ColorizationImageMid)
                return FileResolver.GetWorkImageReadFileStream(WorkId, ImageType, image.ColorizationImageMid)
            else
                return {
                    StatusCode: -1
                }
        }
        else if (ScaleType === WorkImageSizeType.Origin) {
            if (ImageType === WorkImageType.Sketch && image.SketchImage)
                return FileResolver.GetWorkImageReadFileStream(WorkId, ImageType, image.SketchImage)
            else if (ImageType === WorkImageType.Colorization && image.ColorizationImage)
                return FileResolver.GetWorkImageReadFileStream(WorkId, ImageType, image.ColorizationImage)
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