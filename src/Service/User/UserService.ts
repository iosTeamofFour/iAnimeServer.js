import { User } from '../../Persistence/Model/User'
import { Follow } from '../../Persistence/Model/Follow';
import { Information, ChangeableInformation } from '../../Persistence/Model/Information'
import { BaseResponse, LoginResponse } from '../..//Model/Responses'
import { CreateToken } from '../../auth'
import * as moment from 'moment'
import sequelize from '../../Persistence/MySQLConfig'
import AppConfig = require('../../../app.json')
import { FollowResponse } from '../../Model/FollowResponse';


async function Login(phone: string, password: string): Promise<BaseResponse> {
    return await User.findOne({
        where: {
            Phone: phone,
            Password: password
        }
    }).then(user => user ? ({
        StatusCode: 0,
        Token: CreateToken({ user_id: user.Id }),
        TokenExpire: moment().add(AppConfig.JWT.Expire, 's').unix()
    }) as LoginResponse : ({
        StatusCode: -1
    }) as BaseResponse, err => ({ StatusCode: -2, Message: err }) as BaseResponse)
}

async function Register(phone: string, password: string): Promise<BaseResponse> {
    return await User.findOrCreate({
        where: {
            Phone: phone,
            Password: password
        },
        defaults: { Phone: phone, Password: password }
    })
        .then(([user, created]) => {
            if (created) {
                return Information.create(
                    {
                        UserId: user.Id,
                        NickName: `触手${user.Id}号`,
                        Signature: '这只触手很懒, 没有留下签名',
                        Rank: 1
                    } as Information
                )
                    .thenReturn({ StatusCode: 0 })
                    .catchReturn({ StatusCode: -2 })
            }
            else throw ({ StatusCode: -1 })
        })
        .catch<BaseResponse>(phoneTaken => phoneTaken)
}

async function GetUserProfile(UserID: number) {
    return await Information.findOne({
        where: {
            UserId: UserID
        }
    }).catchReturn(null)
}


async function UpdateUserProfile(UserID: number, UpdatedProfile: ChangeableInformation): Promise<BaseResponse> {
    return await Information.update(UpdatedProfile, { where: { UserId: UserID } })
        .then(([number]) => ({ StatusCode: number === 1 ? 0 : -1 }))
        .catchReturn({ StatusCode: - 2 })
}


async function GetFollowingList(UserID: number) {
    const sql = "select user_id as UserID ,nick_name as NickName from information,(select fo.follower_id as followid from follow as fo where fo.user_id = ?) as follower where user_id = follower.followid;"
    return await sequelize.query({ query: sql, values: [UserID] }, { mapToModel: true, model: FollowResponse })
}

async function GetFollowerList(UserID: number) {
    const sql = "select user_id as UserID ,nick_name as NickName from information,(select fo.user_id as followid from follow as fo where fo.follower_id = ?) as follower where user_id = follower.followid;"
    return await sequelize.query({ query: sql, values: [UserID] }, { mapToModel: true, model: FollowResponse })
}

async function FollowUser(UserID: number, WantToFollowUserID: number) {

    const FollowRecordPair = {
        UserId: UserID,
        FollowerID: WantToFollowUserID
    }
    const IfHaveSuchUser = await User.count({ where: { Id: WantToFollowUserID } })

    if (IfHaveSuchUser !== 1) {
        return {
            StatusCode: -2 //没有此用户
        }
    }
    return await Follow.findOrCreate({
        where: FollowRecordPair,
        defaults: FollowRecordPair
    }).then(([pair, created]) => {
        return created ? { StatusCode: 0 } : { StatusCode: -1 }
    }).catchReturn({ StatusCode: -2 })
}

async function UnfollowUser(UserID: number, WantToUnfollowUserID: number) {
    const FollowRecordPair = {
        UserId: UserID,
        FollowerID: WantToUnfollowUserID
    }
    const IfHaveSuchUser = await User.count({ where: { Id: WantToUnfollowUserID } })

    if (IfHaveSuchUser !== 1) {
        return {
            StatusCode: -2 //没有此用户
        }
    }

    let transaction = await sequelize.transaction()
    return await Follow.destroy({ where: FollowRecordPair, transaction: transaction }).then(count => {
        if (count === 1) {
            transaction.commit()
            return {
                StatusCode: 0
            }
        }
        else if (count === 0) {
            transaction.commit()
            return {
                StatusCode: -1
            }
        }
        else
            throw Error("Unknown error, should roll back.")
    }).catch(() => {
        transaction.rollback()
        return { StatusCode: -3 }
    })
}

export { Login, Register, GetUserProfile, UpdateUserProfile, GetFollowingList, GetFollowerList, FollowUser, UnfollowUser }