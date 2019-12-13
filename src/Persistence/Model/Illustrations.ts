import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: "illustrations", timestamps: false })
export class Illustrations extends Model<Illustrations> {

    @Column({ primaryKey: true, field: 'id', type: DataType.NUMBER })
    Id: number

    @Column({ field: 'sketch', type: DataType.STRING })
    SketchImage: string

    @Column({ field: 'colorization', type: DataType.STRING })
    ColorizationImage: string

    @Column({ field: 'points', type: DataType.STRING })
    PointsJson: string

    @Column({ field: 'skectch_mid', type: DataType.STRING })
    SketchImageMid: string

    @Column({ field: 'colorization_mid', type: DataType.STRING })
    ColorizationImageMid: string
}

