import { ParameterizedContext } from 'koa';
import { ControllerBase, Controller, Get, Authorize } from "../Utils/Decorators/RouterDecorator";
import { Required, ParameterType } from "../Utils/Decorators/ParameterValidatorDecorator";
import * as BaseIllustrationService from '../Service/Illustration/BaseIllustrationService'
import { ReadStream } from 'fs';

@Controller("illustration")
export default class IllustrationController extends ControllerBase {

    @Get("/mywork")
    @Authorize
    @Required(ParameterType.QueryString, [['userid'], ['type', (type) => /^(home|detail)$/.test(type)]])
    async GetUserWorks(ctx: ParameterizedContext) {
        const { userid, type } = ctx.query
        ctx.body = await BaseIllustrationService.GetWorkInformation(parseInt(userid), type)
    }

    @Get("/image")
    @Authorize
    @Required(ParameterType.QueryString, [['id']])
    async GetWorkImage(ctx: ParameterizedContext) {
        const Size = ((ctx.query['size'] || '').match(/^(origin|mid)$/) || ['origin'])[0]
        const ImageType = ((ctx.query['type'] || '').match(/^(sketch|colorization)$/) || ['colorization'])[0]
        const { id } = ctx.query
        const stream = BaseIllustrationService.GetWorkImage(id, Size, ImageType)
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
        
    }
}

function TestNumber(ShouldBeNumber : string) {
    return /^[1-9][0-9]*$/.test(ShouldBeNumber)
}