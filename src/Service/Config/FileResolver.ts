import AppConfig = require('../../../app.json')
import * as _path from 'path'
import * as fs from 'fs'

const fsExist = (path : fs.PathLike) => {
    return new Promise((resolve) => {
        fs.exists(path,exist => resolve(exist))
    })
}

export const GetAvatarFilePath = (UserID: string) => _path.join(AppConfig.Statics.Avatar, UserID, 'avatar.png')
export const GetBackgroundImageFilePath = (UserID: string) => _path.join(AppConfig.Statics.Background, UserID, 'background.png')

export const GetAvatarWriteFileStream = (UserID : string) => {
    let fp = GetAvatarFilePath(UserID)
    return fs.createWriteStream(fp)
}

export const GetAvatarReadFileStream = async (UserID : string) => {
    let fp = GetAvatarFilePath(UserID)
    return fsExist(fp).then(exist => {
        if(exist) return fs.createReadStream(fp).on('error',console.error)
        else return fs.createReadStream(_path.join(AppConfig.Statics.AvatarPlaceholder)).on('error',console.error)
    })
}


export const GetBackgroundImageWriteFileStream = (UserID : string) => {
    let fp = GetBackgroundImageFilePath(UserID)
    return fs.createWriteStream(fp)
}

export const GetBackgroundImageReadFileStream = async (UserID : string) => {
    let fp = GetBackgroundImageFilePath(UserID)
    return fsExist(fp).then(exist => {
        if(exist) return fs.createReadStream(fp).on('error',console.error)
        else return fs.createReadStream(_path.join(AppConfig.Statics.BackgroundPlaceholder)).on('error',console.error)
    })
}


