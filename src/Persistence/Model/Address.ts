import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: "address", timestamps: false })
export class Address extends Model<Address> {

    @Column({ primaryKey: true, field: 'user_id', type: DataType.NUMBER })
    UserId: number

    @Column({ primaryKey: true, field: 'work_id', type: DataType.NUMBER })
    WorkId: number

    @Column({ field: 'path', type: DataType.STRING })
    Path: string

    @Column({ field: 'original_image', type: DataType.STRING })
    OriginalImageID: string

    @Column({ field: 'colorization_image', type: DataType.STRING })
    ColorizationImageID: string

    @Column({ field: 'receipt', type: DataType.STRING })
    Recepit: string
}

