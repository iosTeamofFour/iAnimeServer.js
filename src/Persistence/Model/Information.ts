import { Table, Column, Model, DataType } from 'sequelize-typescript'

export class ChangeableInformation extends Model<Information> {
    @Column({ field: 'nick_name', type: DataType.STRING })
    NickName: string

    @Column({ field: 'avatar', type: DataType.STRING })
    Avatar: string

    @Column({ field: 'background_photo', type: DataType.STRING })
    BackgroundPhoto: string

    @Column({ field: 'signature', type: DataType.STRING })
    Signature: string
}

@Table({ tableName: "information", timestamps: false })
export class Information extends ChangeableInformation {

    @Column({ primaryKey: true, field: 'user_id', type: DataType.NUMBER })
    UserId: number
    
    @Column({ field: 'rank', type: DataType.NUMBER })
    Rank: number
}

