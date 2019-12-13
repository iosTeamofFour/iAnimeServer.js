import { Table, Column, DataType, Model } from 'sequelize-typescript'

@Table({ tableName : 'work', timestamps: false})
export class Work extends Model<Work> {


    @Column({ field : 'id', primaryKey : true, type: DataType.NUMBER})
    Id : number

    @Column({ field : 'artist', primaryKey : true, type: DataType.NUMBER})
    ArtistId : number

    @Column({ field : 'name', type: DataType.STRING})
    Name : string

    @Column({ field : 'created', type: DataType.NUMBER })
    CreatedAt : number

    @Column({ field : 'description', type: DataType.STRING })
    Description : string

    @Column({ field : 'forks', type : DataType.NUMBER })
    Forks : number

    @Column({ field: 'likes', type : DataType.NUMBER })
    Likes : number

    @Column({ field : 'allow_download', type : DataType.BOOLEAN })
    AllowDownload : boolean

    @Column({ field : 'allow_sketch', type : DataType.BOOLEAN })
    AllowSketch : boolean

    @Column({ field : 'allow_fork', type : DataType.BOOLEAN })
    AllowFork : boolean
}

export interface WorkUploadRequest {
    ArtistId : number
    Name : string
    CreatedAt : number
    Description : string
    AllowDownload : boolean
    AllowSketch : boolean
    AllowFork : boolean
    Receipt : string
}