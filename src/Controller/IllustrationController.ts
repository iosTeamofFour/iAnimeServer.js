import { ParameterizedContext } from 'koa';
import { ControllerBase, Controller, Get, Authorize, Post } from "../Utils/Decorators/RouterDecorator";
import { Required, ParameterType } from "../Utils/Decorators/ParameterValidatorDecorator";
import * as BaseIllustrationService from '../Service/Illustration/BaseIllustrationService'
import * as IllustrationProcessService from '../Service/Illustration/IllustrationProcessService'
import { ReadStream } from 'fs';
import { GetUserIDFromToken } from '../Utils/Common';
import { WorkUploadRequest } from '../Persistence/Model/Work';



@Controller("illustration")
export default class IllustrationController extends ControllerBase {

    @Get("/mywork")
    @Authorize
    @Required(ParameterType.QueryString, [['userid'], ['type', (type) => /^(home|detail)$/.test(type)]])
    async GetUserWorks(ctx: ParameterizedContext) {
        const { userid, type } = ctx.query
        ctx.body = await BaseIllustrationService.GetWorkInformationByUserID(parseInt(userid), type)
    }

    @Get("/image")
    @Authorize
    @Required(ParameterType.QueryString, [['id']])
    async GetWorkImage(ctx: ParameterizedContext) {
        const Size = ((ctx.query['size'] || '').match(/^(origin|mid)$/) || ['origin'])[0]
        const ImageType = ((ctx.query['type'] || '').match(/^(sketch|colorization)$/) || ['colorization'])[0]
        const { id } = ctx.query
        const stream = await BaseIllustrationService.GetWorkImage(id, Size, ImageType)
        if (stream instanceof ReadStream) {
            ctx.set("Content-Type", "image/png")
        }
        // 可能不是stream, 而是错误码，此时需要客户端判断header的content-type做进一步处理
        ctx.body = stream
    }

    @Get("/mylike")
    @Authorize
    @Required(ParameterType.QueryString, [['userid'], 
                                          ['start', TestNumber], 
                                          ['count', TestNumber], 
                                          ['type', (type) => /^(home|detail)$/.test(type)]])
    async GetMyLikeWorks(ctx: ParameterizedContext) {
        const { userid, start, count, type } = ctx.query
        ctx.body = await BaseIllustrationService.GetMyLikeWorks(userid, start, count, type)
    }

    @Post("/mylike")
    @Authorize
    @Required(ParameterType.Body,[['id'],['Cancel']])
    async UpdateWorkLikeStatus(ctx : ParameterizedContext) {
        const UserID = GetUserIDFromToken(ctx.header)
        const { id, Cancel } = ctx.request.body
        if(Cancel) {
            ctx.body = await BaseIllustrationService
                                .UnLikeOneWork(parseInt(UserID), id)
        }
        else {
            ctx.body = await BaseIllustrationService
                                .LikeOneWork(parseInt(UserID), id)
        }
    }


    @Get("/workdetail")
    @Authorize
    @Required(ParameterType.QueryString,[['id']])
    async GetSingleWorkDetail(ctx : ParameterizedContext) {
        const { id } = ctx.query
        ctx.body = await BaseIllustrationService
                                .GetWorkInformationByWorkID(parseInt(id),
                                                            BaseIllustrationService.WorkInformationType.Detail)
        
    }

    // 提交上色请求
    @Post("/colorization")
    @Authorize
    @Required(ParameterType.Body,[['image'],['points', pointArr => pointArr instanceof Array]])
    async RequestColorization(ctx : ParameterizedContext) {
        const { image, points } = ctx.request.body
        ctx.body = await IllustrationProcessService.SaveSketchForFurtherColorization(image,points)
    }

    // 发布新作品
    @Post("/upload")
    @Authorize
    @Required(ParameterType.Body,[
        ['name'],
        ['created'],
        ['description'],
        ['tags'],
        ['allow_download'],['allow_sketch'],['allow_fork'],['receipt']])
    async UploadNewWork(ctx : ParameterizedContext) {
        const { name, created, description, tags, allow_download, allow_sketch, allow_fork, receipt } = ctx.request.body
        const UserID = GetUserIDFromToken(ctx.header)
        const WorkForUpload : WorkUploadRequest = {
            Name : name,
            CreatedAt : created,
            Description:description,
            AllowDownload : allow_download,
            AllowSketch:allow_sketch,
            AllowFork:allow_fork,
            ArtistId: parseInt(UserID),
            Receipt : receipt
        }

        ctx.body = await BaseIllustrationService.UploadOneWork(WorkForUpload)
    }

    // 查询上色任务完成情况
    @Get("/colorization/status")
    @Authorize
    @Required(ParameterType.QueryString,[['receipt']])
    async QueryColorizationStatus(ctx : ParameterizedContext) {
        //执行查询
        const { receipt } = ctx.query
        ctx.body = await IllustrationProcessService.QueryColorizationStatus(receipt)
    }
    @Get("/colorization/result")
    @Authorize
    @Required(ParameterType.QueryString,[['receipt']])
    async QueryColorizationResult(ctx : ParameterizedContext) {
        //执行查询
        const { receipt } = ctx.query
        const stream = await IllustrationProcessService.QueryColorizationResult(receipt)
        if(stream) {
            ctx.set('Content-Type','image/png')
        }
        ctx.body = stream
    }

}

function TestNumber(ShouldBeNumber : string) {
    return /^[0-9][0-9]*$/.test(ShouldBeNumber)
}