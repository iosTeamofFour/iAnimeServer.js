import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: "my_like", timestamps: false })
export class MyLike extends Model<MyLike> {

    @Column({ primaryKey: true, field: 'user_id', type: DataType.NUMBER })
    UserId: number

    @Column({ field: 'work_id', primaryKey: true, type: DataType.NUMBER })
    WorkId: number
}

