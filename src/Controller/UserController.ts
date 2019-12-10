import { ControllerBase, Controller, Post, Get, Authorize } from "../Utils/Decorators/RouterDecorator";
import { ParameterizedContext } from "koa";
import { Required, ParameterType } from "../Utils/Decorators/ParameterValidatorDecorator";
import * as UserService from '../Service/User/UserService';
import Redis from '../Persistence/RedisConfig';
import { ExtractJWTStringFromHeader, GetUserIDFromToken } from "../Utils/Common";
import * as FileResolver from '../Service/Config/FileResolver'
import AppConfig = require('../../app.json');
import { ChangeableInformation } from "../Persistence/Model/Information";

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
        ctx.body = await Redis.PromiseSet(`${ExtractJWTStringFromHeader(ctx.header)}:Revoked`,"1",'EX', AppConfig.JWT.Expire)
    }


    @Get("/profile")
    @Authorize
    async GetUserProfile(ctx : ParameterizedContext) {
        const UserID = (ctx.query.userid as string) || GetUserIDFromToken(ctx.header)
        let Profile = await UserService.GetUserProfile(parseInt(UserID))
        ctx.body = Profile ?  { StatusCode: 0, Profile } : { StatusCode : -1 }
    }

    @Post("/profile")
    @Authorize
    @Required(ParameterType.Body,[['NickName'],['Avatar'],['Signature'],['BackgroundPhoto']])
    async UpdateUserProfile(ctx : ParameterizedContext) {
        const UserID = GetUserIDFromToken(ctx.header)
        const UpdatedInformation = ctx.request.body as ChangeableInformation
        this.TrimUnchangeableFields(UpdatedInformation)
        ctx.body = await UserService.UpdateUserProfile(parseInt(UserID), UpdatedInformation)
    }

    @Get("/avatar")
    @Authorize
    async GetAvatar(ctx : ParameterizedContext) {
        const UserID = (ctx.query.userid as string) || GetUserIDFromToken(ctx.header)
        ctx.set("Content-Type","image/png")
        ctx.body = await FileResolver.GetAvatarReadFileStream(UserID)
    }

    @Get("/background")
    @Authorize
    async GetBackground(ctx : ParameterizedContext) {
        const UserID = (ctx.query.userid as string) || GetUserIDFromToken(ctx.header)
        ctx.set("Content-Type","image/png")
        ctx.body = await FileResolver.GetBackgroundImageReadFileStream(UserID)
    }

    TrimUnchangeableFields(info) {
        ['UserId', 'Rank'].forEach(item => {
            if(info.hasOwnProperty(item)) {
                delete info[item]
            }
        })
    }
}