export interface BaseResponse {
    StatusCode : number,
    Message? : any
}


export interface LoginResponse extends BaseResponse {
    Token : string
    TokenExpire : number
}

