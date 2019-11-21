import { ControllerBase, Controller, Post, Get, Authorize } from "../Utils/Decorators/RouterDecorator";
import { ParameterizedContext } from "koa";
import { Required, ParameterType } from "../Utils/Decorators/ParameterValidatorDecorator";
import * as UserService from '../Service/User/UserService'
import Redis from '../Persistence/RedisConfig'
import { GetUserIDFromToken } from "../Utils/Common";
@Controller("user")
export default class UserController extends ControllerBase {


    @Post("/login")
    @Required(ParameterType.Body, [['phone'], ['password']])
    async Login(ctx: ParameterizedContext) {
        const { phone, password } = ctx.request.body
        ctx.body = await UserService.Login(phone, password)
    }


    @Post("/register")
    @Required(ParameterType.Body, [['phone'], ['password']])
    async Register(ctx: ParameterizedContext) {
        const { phone, password } = ctx.request.body
        ctx.body = await UserService.Register(phone, password)
    }

    @Get("/logout")
    @Authorize
    async Logout(ctx : ParameterizedContext) {
        ctx.body = await Redis.PromiseSet(`${GetUserIDFromToken(ctx.header)}:Revoked`,ctx.header['authorization'],'EX', 60 * 60 * 24)
    }

    @Get("/secret")
    @Authorize
    async SecretArea(ctx : ParameterizedContext) {
        ctx.body = "Here is secret area."
    }
}