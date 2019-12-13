import AppConfig = require('../../../app.json')
import * as _path from 'path'
import * as fs from 'fs'
import { PassThrough } from 'stream'
import { WorkImageType } from '../Illustration/BaseIllustrationService'

const fsExist = (path: fs.PathLike) => {
    return new Promise((resolve) => {
        fs.exists(path, exist => resolve(exist))
    })
}
const __BackgroundPlaceholder = _path.join(AppConfig.Statics.BackgroundPlaceholder);

const __AvatarPlaceholder = _path.join(AppConfig.Statics.AvatarPlaceholder)

export const GetAvatarFilePath = (UserID: string, ShouldDetectFolder?: boolean) => {
    const folder = _path.join(AppConfig.Statics.Avatar, UserID)
    const file = _path.join(folder, 'avatar.png')

    if (ShouldDetectFolder && !fs.existsSync(folder)) {
        fs.mkdirSync(folder)
    }
    return file
}
export const GetBackgroundImageFilePath = (UserID: string, ShouldDetectFolder?: boolean) => {
    const folder = _path.join(AppConfig.Statics.Background, UserID)
    const file = _path.join(folder, 'background.png')

    if (ShouldDetectFolder && !fs.existsSync(folder)) {
        fs.mkdirSync(folder)
    }
    return file
}

export const ClearAvatar = (UserID : string) => {
    const Path = GetAvatarFilePath(UserID,false)
    if(fs.existsSync(Path)) {
        fs.unlinkSync(Path)
    }
}


export const ClearBackground = (UserID : string) => {
    const Path = GetBackgroundImageFilePath(UserID,false)
    if(fs.existsSync(Path)) {
        fs.unlinkSync(Path)
    }
}

// ===== Write Stream Builder =====
export const GetAvatarWriteFileStream = (UserID: string) => {
    let fp = GetAvatarFilePath(UserID, true)
    return fs.createWriteStream(fp)
}
export const GetBackgroundImageWriteFileStream = (UserID: string) => {
    let fp = GetBackgroundImageFilePath(UserID, true)
    return fs.createWriteStream(fp)
}

// ===== Read Stream Builder =====
export const GetAvatarReadFileStream = async (UserID: string) => {
    let fp = GetAvatarFilePath(UserID)
    return GetImageReadFileStream(fp, __AvatarPlaceholder)
}

export const GetBackgroundImageReadFileStream = async (UserID: string) => {
    let fp = GetBackgroundImageFilePath(UserID)
    return GetImageReadFileStream(fp, __BackgroundPlaceholder)
}

// ===== Common Image Stream Builder =====

export const GetImageReadFileStream = (Path, Placeholder) => {
    return fsExist(Path).then(exist => {
        if (exist) return fs.createReadStream(Path).on('error', console.error)
        else return fs.createReadStream(Placeholder).on('error', console.error)
    })
}

export const GetWorkImageReadFileStream = (WorkId : number,ImageType : WorkImageType, FileName : string) => {
    const Path = _path.join(AppConfig.Statics.Works,WorkId.toString(),ImageType,FileName)
    if(!fs.existsSync(Path)) return null
    return fs.createReadStream(Path)
}
