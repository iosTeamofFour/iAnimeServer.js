import { Column, Model, DataType, Table } from 'sequelize-typescript'

@Table
export class FollowResponse extends Model<FollowResponse> {

    @Column({ field: 'UserID', type: DataType.NUMBER })
    UserId: number

    @Column({ field: 'NickName', type: DataType.STRING })
    NickName: number
}

