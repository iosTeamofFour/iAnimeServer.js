import { User } from '../../Persistence/Model/User'
import { BaseResponse, LoginResponse } from '../..//Model/Responses'
import { CreateToken } from '../../auth'
import * as moment from 'moment'

async function Login(phone: string, password: string): Promise<BaseResponse> {
    return await User.findOne({
        where: {
            Phone: phone,
            Password: password
        }
    }).then(user => user ? ({
        StatusCode: 0,
        Token: CreateToken({user_id : user.Id}),
        TokenExpire: moment().add(1, 'd').unix()
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
    }).then(([_, created]) => created ? ({ StatusCode: 0 }) : ({ StatusCode: -1 }))
}

export { Login, Register }