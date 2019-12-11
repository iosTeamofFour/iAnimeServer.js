import { ParameterizedContext } from 'koa';
import { ControllerBase, Controller, Post, Get, Authorize } from "../Utils/Decorators/RouterDecorator";
import { Required, ParameterType } from "../Utils/Decorators/ParameterValidatorDecorator";

import * as BaseIllustrationService from '../Service/Illustration/BaseIllustrationService'

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
        ctx.body = Size
    }

}