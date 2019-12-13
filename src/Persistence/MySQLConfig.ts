import { Sequelize } from 'sequelize-typescript'
import { Address } from './Model/Address'
import { Follow } from './Model/Follow'
import { Information } from './Model/Information'
import { MyLike } from './Model/MyLike';
import { User } from './Model/User'
import { Work } from './Model/Work'
import { FollowResponse } from '../Model/FollowResponse'
import { Illustrations } from './Model/Illustrations'
import { TaskPool } from './Model/TaskPool'

const { Database: { MySQL } } = require('../../app.json')

const { UserName, Password, Host, Port, Database } = MySQL

const sequelize = new Sequelize(Database, UserName, Password, {
    host: Host,
    port: Port,
    dialect: 'mysql',
    pool: {
        max: 10,
        min: 0,
        idle: 30000
    }
})

sequelize.addModels([
    Address, Follow, Information, MyLike, User, Work, FollowResponse, Illustrations, TaskPool
])

console.log("MySQL with sequelize is loaded!")

export default sequelize
