import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: "taskpool", timestamps: false })
export class TaskPool extends Model<TaskPool> {

    @Column({ primaryKey: true, field: 'receipt', type: DataType.STRING })
    Receipt: string

    @Column({ field: 'sketch', type: DataType.STRING })
    OriginalSketchFile: string

    @Column({ field: 'colorization', type: DataType.STRING })
    ColorizedFile: string

    @Column({ field : 'status', type: DataType.NUMBER })
    Status : number

    @Column({ field : 'created', type: DataType.NUMBER })
    CreatedAt : number
}
