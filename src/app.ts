import * as Koa from 'koa'
import * as bodyParser from 'koa-bodyparser'
import * as cors from '@koa/cors'
import { LoadRouters } from './router-loader';

// try to connect to database
require('./Persistence/MySQLConfig')

const app = new Koa()

// Access logger:

app.use(async (ctx, next) => {
    await next()
    console.log(`${ctx.method} => ${ctx.url}, HTTP ${ctx.status}`)
})

app.use(bodyParser({
    formLimit:"10mb",
    jsonLimit:"10mb",
    textLimit:"10mb"
}))
app.use(cors())

// Global error handler:

app.use(async (ctx, next) => {
    try {
        await next()
    }
    catch (err) {
        console.log(`Global error handler - ${err}`)
        ctx.body = {
            StatusCode: -1000,
            Error: err
        }
    }
})

LoadRouters(app)

const PORT = process.argv.slice(2)[0] || 3000
console.log(`Listening on ${PORT}...`)
app.listen(PORT)


