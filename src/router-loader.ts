import * as KoaRouter from 'koa-router'
import * as fs from 'fs'
import * as path from 'path'
import * as Koa from 'koa'
import { RevocableJWTMiddleware } from './auth'
import { ControllerBase, GetRouteAttribute } from './Utils/Decorators/RouterDecorator'

const rootDir = path.join(__dirname, 'Controller')

const fileExtReg = /(\.js$|\.ts$|\.tsx$)/

function LoadRouters(app : Koa ,walkingDir : string = rootDir) {

  function JoinPath(walkingDir : string, file: string) {
    return path.join(walkingDir,file)
  }

  fs.readdirSync(walkingDir).forEach(fd => {
    if(fs.statSync(JoinPath(walkingDir,fd)).isDirectory()) {
      LoadRouters(app,JoinPath(walkingDir,fd))
      return
    }
    if (!fileExtReg.test(fd)) return
    const loadPath = JoinPath(walkingDir,fd)
    const controller = require(loadPath).default
    if (controller && controller.prototype instanceof ControllerBase) {
      // Begin extract router info from decorator
      const info = GetRouteAttribute(controller)
      if (info) {
        const [rootPath, routeInfo,isWebsocket] = info
        const __router = new KoaRouter({ prefix: rootPath })
        routeInfo.forEach(r => {
          let fnList = [r.fn]

          if(r.authorize) fnList.unshift(RevocableJWTMiddleware)
          if(r.validator) fnList.unshift(r.validator)

          __router[r.method](r.subpath,...fnList)
        })
        // if(isWebsocket) app.ws.use(__router.routes() as any)
        // else 
        app.use(__router.routes())
      }
    }
  })
}


export { LoadRouters }