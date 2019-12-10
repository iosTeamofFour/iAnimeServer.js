import * as jwt from 'jsonwebtoken'

export function ExtractJWTStringFromHeader(header : any) {
  return header['authorization'].replace('Bearer ', '')
}

export function ExtractBearerFromHeader(header: any) {
  const token = ExtractJWTStringFromHeader(header)
  return jwt.decode(token, { complete: true })
}

export function GetUserIDFromToken(header: any): string {
  const JwtObj = ExtractBearerFromHeader(header)
  return JwtObj['payload']['user_id'].toString()
}

export function TryParseJSON(text: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const data = JSON.parse(text)
      resolve(data)
    }
    catch {
      reject()
    }
  })
}