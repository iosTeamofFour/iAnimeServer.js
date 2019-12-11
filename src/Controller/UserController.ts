import { ControllerBase, Controller, Post, Get, Authorize } from "../Utils/Decorators/RouterDecorator";
import { ParameterizedContext } from "koa";
import { Required, ParameterType } from "../Utils/Decorators/ParameterValidatorDecorator";
import * as UserService from '../Service/User/UserService';
import Redis from '../Persistence/RedisConfig';
import { ExtractJWTStringFromHeader, GetUserIDFromToken } from "../Utils/Common";
import * as FileResolver from '../Service/Config/FileResolver'
import AppConfig = require('../../app.json');
import { ChangeableInformation } from "../Persistence/Model/Information";
import { IncomingMessage } from "http";

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
    async Logout(ctx: ParameterizedContext) {
        ctx.body = await Redis.PromiseSet(`${ExtractJWTStringFromHeader(ctx.header)}:Revoked`, "1", 'EX', AppConfig.JWT.Expire)
    }


    @Get("/profile")
    @Authorize
    async GetUserProfile(ctx: ParameterizedContext) {
        const UserID = (ctx.query.userid as string) || GetUserIDFromToken(ctx.header)
        let Profile = await UserService.GetUserProfile(parseInt(UserID))
        ctx.body = Profile ? { StatusCode: 0, Profile } : { StatusCode: -1 }
    }

    @Post("/profile")
    @Authorize
    @Required(ParameterType.Body, [['NickName'], ['Avatar'], ['Signature'], ['BackgroundPhoto']])
    async UpdateUserProfile(ctx: ParameterizedContext) {
        const UserID = GetUserIDFromToken(ctx.header)
        const UpdatedInformation = ctx.request.body as ChangeableInformation
        this.TrimUnchangeableFields(UpdatedInformation)
        ctx.body = await UserService.UpdateUserProfile(parseInt(UserID), UpdatedInformation)
    }

    @Get("/avatar")
    @Authorize
    async GetAvatar(ctx: ParameterizedContext) {
        const UserID = (ctx.query.userid as string) || GetUserIDFromToken(ctx.header)
        ctx.set("Content-Type", "image/png")
        ctx.body = await FileResolver.GetAvatarReadFileStream(UserID)
    }

    @Get("/background")
    @Authorize
    async GetBackground(ctx: ParameterizedContext) {
        const UserID = (ctx.query.userid as string) || GetUserIDFromToken(ctx.header)
        ctx.set("Content-Type", "image/png")
        ctx.body = await FileResolver.GetBackgroundImageReadFileStream(UserID)
    }

    @Post("/avatar")
    @Authorize
    async UploadAvatar(ctx: ParameterizedContext) {
        if (ctx.request.headers["content-type"] === "image/png") {
            // Try to open the pipe for image streaming
            const UserID = GetUserIDFromToken(ctx.header)
            const stream = FileResolver.GetAvatarWriteFileStream(UserID)

            await this.UploadImage(ctx.req, stream, () => { ctx.status = 400; FileResolver.ClearAvatar(UserID);  })
                .catch(err => { ctx.status = 400, ctx.body = err })
                .then(finish => ctx.body = finish)
        }
        else {
            ctx.status = 400 // Bad Request
            ctx.body = "Should set `content-type` in header to `image/png`"
        }
    }

    @Post("/homepage")
    @Authorize
    async UploadBackground(ctx: ParameterizedContext) {
        if (ctx.request.headers["content-type"] === "image/png") {
            // Try to open the pipe for image streaming
            const UserID = GetUserIDFromToken(ctx.header)
            const stream = FileResolver.GetBackgroundImageWriteFileStream(UserID)
            await this.UploadImage(ctx.req, stream, () => { ctx.status = 400; FileResolver.ClearBackground(UserID);  })
                .catch(err => { ctx.status = 400, ctx.body = err })
                .then(finish => ctx.body = finish)
        }
        else {
            ctx.
                ctx.status = 400 // Bad Request
            ctx.body = "Should set `content-type` in header to `image/png`"
        }
    }

    // 我正在关注的人
    @Get("/following")
    @Authorize
    async GetFollowingUser(ctx : ParameterizedContext) {
        const UserID = GetUserIDFromToken(ctx.header)
        ctx.body = await UserService.GetFollowingList(parseInt(UserID));
    }

    @Get("/follower")
    @Authorize
    async GetFollowerUser(ctx : ParameterizedContext) {
        const UserID = GetUserIDFromToken(ctx.header)
        ctx.body = await UserService.GetFollowerList(parseInt(UserID));
    }

    @Post("/follow")
    @Authorize
    @Required(ParameterType.Body,[['UserID'],['Cancel']])
    async UpdateFollowStatus(ctx : ParameterizedContext) {
        const { UserID, Cancel } = ctx.request.body
        const LoginedUserID = GetUserIDFromToken(ctx.header)
        if(Cancel) {
            ctx.body = await UserService.UnfollowUser(parseInt(LoginedUserID), UserID)
        }
        else {
            ctx.body = await UserService.FollowUser(parseInt(LoginedUserID),UserID)
        }
    }

    UploadImage(source: IncomingMessage, destination: NodeJS.WritableStream, failed?: () => void, finished?: () => void) {
        failed = failed || function () { }
        finished = finished || function () { }

        return new Promise((resolve, reject) => {
            source.pipe(destination).on('error', () => {
                failed()
                reject({
                    StatusCode: -2,
                    Error: "Broken pipe."
                })
            }).on('close', () => {
                finished()
                resolve({
                    StatusCode: 0
                })
            })
        })
    }
    
    TrimUnchangeableFields(info) {
        ['UserId', 'Rank'].forEach(item => {
            if (info.hasOwnProperty(item)) {
                delete info[item]
            }
        })
    }
}