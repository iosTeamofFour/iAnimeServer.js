import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: "taskpool", timestamps: false })
export class TaskPool extends Model<TaskPool> {

    @Column({ primaryKey: true, field: 'receipt', type: DataType.STRING })
    Receipt: string

    @Column({ field: 'original', type: DataType.STRING })
    OriginalSketchFile: string

    @Column({ field: 'finished', type: DataType.STRING })
    ColorizedFile: string
}
