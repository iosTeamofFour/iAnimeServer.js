import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: "follow", timestamps: false })
export class Follow extends Model<Follow> {

    @Column({ primaryKey: true, field: 'user_id', type: DataType.NUMBER })
    UserId: number

    @Column({ field: 'follower_id', type: DataType.STRING })
    FollowerID: number
}

