import * as jwt from 'koa-jwt'
import * as jwtManager from 'jsonwebtoken'
import { Middleware } from 'koa'
import Redis from './Persistence/RedisConfig'
import { GetUserIDFromToken } from './Utils/Common';
const { JWT: { Secret, Audience, Issuer } } = require('../app.json')

const JWTMiddleware = jwt({ secret: Secret, issuer: Issuer, audience: Audience})

const RevocableJWTMiddleware : Middleware  = async (ctx, next) => {
    const _next = async () => {
        const UserID = GetUserIDFromToken(ctx.header)
        const exists = await Redis.PromiseGet(`${UserID}:Revoked`)
        if (exists && exists === ctx.header['authorization']) {
            ctx.status = 401
            ctx.response.set("Token-Expired","true")
        }
        else {
            await next()
        }
    }
    await JWTMiddleware(ctx,_next)
}

const CreateToken = (payload: any) => {
   return jwtManager.sign(payload, Secret, {
        audience: Audience,
        issuer: Issuer,
        expiresIn: 3600 * 24 * 2
    })
}

export  {
    JWTMiddleware, CreateToken, RevocableJWTMiddleware
}