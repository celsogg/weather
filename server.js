const http = require('http')
const WebSocket = require('ws')
const rp = require('request-promise')
const redis = require("redis")
const express = require('express')
const redisClient = redis.createClient()

const { ApiCallError } = require('./apiCallError')


let cities = require('./cities.json')
const cityCodes = cities.map(c => c.code)

const CITIES_KEY = 'cities'
const API_ERRORS_KEY = 'api.errors'
const API_KEY = 'db7fa7da43e1b9ef553b941b9ba6bc7d'

cities.forEach(c => redisClient.hmset(CITIES_KEY, c.code, JSON.stringify(c), redis.print))

const getUrl = (lat, long) => `https://api.darksky.net/forecast/${API_KEY}/${lat},${long}?exclude=minutely,hourly,daily,alerts,flags&units=si&lang=es`

const updateCity = async code => {
    redisClient.hmget(CITIES_KEY, code, async(e, cityStr) => {
        if (e) {
            console.error(e)
            return
        }
        const city = JSON.parse(cityStr)
        const url = getUrl(city.lat, city.long)
        try {
            if (Math.random() < 0.1) {
                throw new ApiCallError('How unfortunate! The API Request Failed')
            }
            const res = await rp(url)
            city.temp = JSON.parse(res).currently.temperature
            city.updatedAt = Date.now()
            console.log(`${code} ${city.temp}°`)
            redisClient.hmset(CITIES_KEY, city.code, JSON.stringify(city))
        } catch (e) {
            if (e instanceof ApiCallError) {
                const timestamp = Date.now()
                redisClient.hmset(API_ERRORS_KEY, timestamp, JSON.stringify({ timestamp, url, code }))
                console.log(`${e.name} ${code} retrying...`)
                updateCity(code)
            } else {
                console.error(e)
            }
        }
    })
}

const firstApiCall = async() => {
    cityCodes.forEach(async code => await updateCity(code))
}

firstApiCall()

const apiCallRun = async(timeout, i) => {
    setTimeout(async() => {
        const cityCode = cityCodes[i % cityCodes.length]
        i++
        await updateCity(cityCode)
        apiCallRun(timeout, i)
    }, timeout)
}

apiCallRun(10000, 0)



const app = express()

app.use(express.static('weather-front/dist/weather-front'))

const server = http.createServer(app)
const wss = new WebSocket.Server({ server, port: 3001 })


wss.on('connection', (ws, req) => {
    console.log('connection')

    redisClient.hgetall(CITIES_KEY, (e, r) => ws.send(JSON.stringify(Object.values(r).map(JSON.parse))))

    setInterval(() => {
        redisClient.hgetall(CITIES_KEY, (e, r) => ws.send(JSON.stringify(Object.values(r).map(JSON.parse))))
    }, 10000)
})


app.listen(3000, () => console.log('listening on port 3000'))