const fs = require('fs')

const Result = fs.readFileSync('TestBase64.png').toString('base64')

const anotherBuffer = Buffer.from(Result,'base64')

fs.writeFileSync("TestBase642.png",anotherBuffer)