import { Middleware } from "koa";
import { VALIDATE_PARAM } from "./ParameterValidatorDecorator";
import 'reflect-metadata'

const METHOD_ATTRIBUTE = "method"
const PATH_ATTRIBUTE = "path"
const WS_PATH_ATTRIBUTE = "ws_path"
const AUTHORIZE_ATTRIBUTE = "authorize"

export class ControllerBase { }

export interface IControllerBase { new(): ControllerBase }

export interface RouteInfo {
  root: string,
  subpath: string,
  method: string,
  fn: Middleware,
  authorize?:boolean,
  validator?: Middleware
}

// ------------- Helper ---------------
export function isConstructor(f: { new(...args: any[]): {} }) {
  try {
    new f();
  } catch (err) {
    return false;
  }
  return true;
}

function isFunction(f: any) {
  return f instanceof Function
}

const SubPathMapptingFactory = (method: string) => (path: string): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(PATH_ATTRIBUTE, ResolvePath(path), descriptor.value)
    Reflect.defineMetadata(METHOD_ATTRIBUTE, method, descriptor.value)
  }
}

const Authorize = (target, propertyKey, descriptor)  => {
  Reflect.defineMetadata(AUTHORIZE_ATTRIBUTE, true, descriptor.value)
}
const SupportMethodList = ['get', 'post', 'put','all']
const [Get, Post, Put,WebSocketPath] = SupportMethodList.map(it => SubPathMapptingFactory(it))


const ResolvePath = (path: string) => path[0] === '/' ? path : `/${path}`

// ------------- Decorator ---------------
const Controller = (path: string): ClassDecorator => {
  return target => {
    Reflect.defineMetadata(PATH_ATTRIBUTE, ResolvePath(path), target)
  }
}

const WsController = (path: string): ClassDecorator => {
  return target => {
    Reflect.defineMetadata(WS_PATH_ATTRIBUTE, ResolvePath(path), target)
  }
}

const ValidatePath = (path: string) => path && path[0] === '/'

const ValidateDecorator = (subpath: string, method: string): boolean => {
  if (!ValidatePath(subpath)) return false;
  if (SupportMethodList.filter(it => method === it).length === 0) return false;
  return true;
}

const GetRouteAttribute = (ControllerClass : IControllerBase): [string, RouteInfo[],boolean?] => {

  const rootPath = Reflect.getMetadata(PATH_ATTRIBUTE, ControllerClass) as string
  const wsRootPath = Reflect.getMetadata(WS_PATH_ATTRIBUTE, ControllerClass) as string
  if(rootPath && ValidatePath(rootPath)) {
    return ExtractSubPath(false)(ControllerClass,rootPath)
  }
  else if(wsRootPath && ValidatePath(wsRootPath)) {
    return ExtractSubPath(true)(ControllerClass,wsRootPath)
  }
}

const ExtractSubPath = (IsWebSocket : boolean) => (ControllerClass : IControllerBase, RootPath : string) :  [string, RouteInfo[],boolean?] => {
  const controllerInstance = new ControllerClass()
  const prototype = Object.getPrototypeOf(controllerInstance)

  const methodsNames = Object.getOwnPropertyNames(prototype)
    .filter(item => !isConstructor(prototype[item]) && isFunction(prototype[item]))

  const routeInfo: RouteInfo[] = []

  methodsNames.forEach(name => {
    const fn = prototype[name]

    const subpath = Reflect.getMetadata(PATH_ATTRIBUTE, fn)
    const method = Reflect.getMetadata(METHOD_ATTRIBUTE, fn)
    const authorize = Reflect.getMetadata(AUTHORIZE_ATTRIBUTE, fn) || false
    const validator = Reflect.getMetadata(VALIDATE_PARAM, fn)
    if (ValidateDecorator(subpath, method)) {
      routeInfo.push({
        root: RootPath,
        subpath: subpath,
        method: method,
        fn: fn.bind(controllerInstance),
        authorize: authorize,
        validator: validator
      })
      console.log(`Path is ${RootPath}${subpath}: ${method}. Added to router. Is websocket ${IsWebSocket}`)
    }
  })
  return [RootPath, routeInfo,IsWebSocket]
}

export { GetRouteAttribute, Controller, WsController, Get, Post, Put,WebSocketPath, Authorize }