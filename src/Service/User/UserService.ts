import { User } from '../../Persistence/Model/User'
import { Information, ChangeableInformation } from '../../Persistence/Model/Information'
import { BaseResponse, LoginResponse } from '../..//Model/Responses'
import { CreateToken } from '../../auth'
import * as moment from 'moment'
import AppConfig = require('../../../app.json')

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

async function Register(phone: string, password: string) : Promise<BaseResponse> {
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
            .thenReturn({ StatusCode : 0 })
            .catchReturn({ StatusCode : -2 })
        }
        else throw ({ StatusCode : -1 })
    })
    .catch<BaseResponse>(phoneTaken => phoneTaken)
}

async function GetUserProfile(UserID : number) {
    return await Information.findOne({
        where: {
            UserId : UserID
        }
    }).catchReturn(null)
}


async function UpdateUserProfile(UserID : number, UpdatedProfile : ChangeableInformation) : Promise<BaseResponse> {
    return await Information.update(UpdatedProfile, { where : { UserId : UserID }})
                            .then(([number]) => ({ StatusCode: number === 1 ? 0 : -1 }))
                            .catchReturn({ StatusCode: - 2})
}

export { Login, Register, GetUserProfile, UpdateUserProfile }