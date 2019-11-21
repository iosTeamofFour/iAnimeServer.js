import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({ tableName: "user", timestamps: false })
export class User extends Model<User> {

    @Column({ primaryKey: true, field: 'user_id', type: DataType.NUMBER, autoIncrement:true })
    Id: number

    @Column({ field: 'phone', validate: { IsChinaPhone } })
    Phone: string

    @Column({ field: 'password' })
    Password: string
}



function IsChinaPhone(phone: string) {
    // TODO - Use a regex for Chinese Phone instead.
    return phone.length === 11
}