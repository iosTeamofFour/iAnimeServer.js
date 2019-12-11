import seq from '../../Persistence/MySQLConfig';
import { Work } from '../../Persistence/Model/Work';

import AppConfig = require('../../../app.json')

export enum WorkInformationType {
    Home = 'home',
    Detail = 'detail'
}

export enum WorkImageType {
    Mid = 'mid',
    Origin = 'origin'
}

export async function GetWorkInformation(WorkId: number, Type: WorkInformationType) {
    const sql = `select ${Type === WorkInformationType.Home ? 'w.id, w.name, w.artist' : 'w.*'}, i.nick_name as artist_name from work w left join information i on artist = i.user_id and id = ?`
    return await seq.query({ query: sql, values: [WorkId] }, { mapToModel: true, model: Work })
}


export async function GetWorkImage(WorkId: number, Type: WorkImageType) {
    
}
