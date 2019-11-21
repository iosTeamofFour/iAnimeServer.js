import { ParameterizedContext, Middleware } from "koa";

export const VALIDATE_PARAM = "validate-param"

export enum ParameterType {
  QueryString,
  Body
}

function DefaultTest(test) {
  return true
}

const MatchParameters = (bag: ParameterType, namez: [string, ((test: any) => boolean)?][]) => async (ctx: ParameterizedContext, next) => {
  let source = {}
  switch (bag) {
    case ParameterType.QueryString: {
      source = {...ctx.query}
      break
    }
    case ParameterType.Body: {
      source = ctx.request.body
      break
    }
  }

  if (!source) {
    ctx.response.status = 400;
    ctx.body = {
      Unmatched: "No parameter."
    }
    return
  }

  let matched = [], unmatched = []
  namez.forEach(([name, test]) => {
    test = test || DefaultTest
    if (source.hasOwnProperty(name) && test(source[name])) {
      matched.push(name)
    }
    else {
      unmatched.push(name)
    }
  })
  if (unmatched.length > 0) {
    ctx.response.status = 400;
    ctx.body = {
      Unmatched: unmatched
    }
    return
  }
  await next()
}

export const Required = (from: ParameterType, namez: [string, ((test: any) => boolean)?][]): MethodDecorator => {
  return (target,
    propertyKey,
    descriptor) => {
    Reflect.defineMetadata(VALIDATE_PARAM, MatchParameters(from, namez)
    , descriptor.value)
  }
}
