const http = require('http')
const WebSocket = require('ws')
const rp = require('request-promise')

const redis = require("redis")
const redisClient = redis.createClient()

function ApiCallError () {}

ApiCallError.prototype = new Error();

redisClient.on("error", function (err) {
    console.log("Error " + err);
});


let cities = [{
    code: 'SCL',
    name: 'Santiago',
    lat: -33.45694,
    long: -70.64827,
    temp: 0,
    updatedAt: 0
}, {
    code: 'ZRH',
    name: 'Zurich',
    lat: 47.36667,
    long: 8.55,
    temp: 0,
    updatedAt: 0
}, {
    code: 'AKL',
    name: 'Auckland',
    lat: -36.86667,
    long: 174.76667,
    temp: 0,
    updatedAt: 0
}, {
    code: 'SYD',
    name: 'Sydney',
    lat: -33.86785,
    long: 151.20732,
    temp: 0,
    updatedAt: 0
}, {
    code: 'LON',
    name: 'London',
    lat: 51.50853,
    long: -0.12574,
    temp: 0,
    updatedAt: 0
}, {
    code: 'ATL', // la capital de Georgia
    name: 'Atlanta',
    lat: 33.749,
    long: -84.38798,
    temp: 0,
    updatedAt: 0
}]

const cityCodes = cities.map(c => c.code)

cities.forEach(c => {
    console.log(JSON.stringify(c))
    const str = JSON.stringify(c)
    redisClient.hmset('cities', c.code, JSON.stringify(c), redis.print)
})
redisClient.hgetall('cities', (e, r) => console.log(r))

const getUrl = (lat, long) => `https://api.darksky.net/forecast/${apiKey}/${lat},${long}?exclude=minutely,hourly,daily,alerts,flags&units=si&lang=es`

const apiKey = 'db7fa7da43e1b9ef553b941b9ba6bc7d'
const apiCallPromises = cities.map(c => rp(getUrl(c.lat, c.long)))

const firstApiCall = async () => {
    cityCodes.forEach(code => {
        redisClient.hmget('cities', code, async (e, cityStr) => {
            if (e) {
                console.log(e)
                return
            }

            try {
                const city = JSON.parse(cityStr)
                const res = await rp(getUrl(city.lat, city.long))
                city.temp = JSON.parse(res).currently.temperature
                city.updatedAt = Date.now()
                redisClient.hmset('cities', city.code, JSON.stringify(city))
                redisClient.hgetall('cities', (e, r) => console.log(r))
            } catch (e) {
                console.error(e)
            }
        })
    })
}

firstApiCall()

let apiCall = async () => {
    if (Math.random() < 0.1) throw new ApiCallError('How unfortunate! The API Request Failed')
    const result = await Promise.all(apiCallPromises)
    console.log(result)
}

let run = async () => {
    let i = 0;
    setInterval(() => {
        const cityCode = cityCodes[ i % cityCodes.length ]
        i++
        redisClient.hmget('cities', cityCode, async (e, cityStr) => {
            if (e) console.log(e)
            const city = JSON.parse(cityStr)
            const url = getUrl(city.lat, city.long)
            try {
                if (Math.random() < 0.1) throw new ApiCallError('How unfortunate! The API Request Failed')
                const city = JSON.parse(cityStr)
                const res = await rp(url)
                city.temp = JSON.parse(res).currently.temperature
                city.updatedAt = Date.now()
                redisClient.hmset('cities', city.code, JSON.stringify(city))
                redisClient.hgetall('cities', (e, r) => console.log(r))
            } catch (e) {
                // console.error(e)
                if (e instanceof ApiCallError) {
                    console.log('ApiCallError!!')
                    const timestamp = Date.now()
                    redisClient.hmset('api.errors', timestamp, JSON.stringify({timestamp, url, cityCode}))
                    redisClient.hgetall('api.errors', (e, r) => console.log(r))
                }
            }
        })
    }, 2000);
}

run();

//apiCall()

const express = require('express');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, port: 3001 })


wss.on('connection', (ws, req) => {
    console.log('connection')

    ws.on('message', (data) => {
        console.log(data)
    })

    let i = 0

    setInterval(() => {
        redisClient.hgetall('cities', (e, r) => {
            console.log(r)
            ws.send(JSON.stringify(Object.values(r).map(JSON.parse)))
        })
    }, 10000)
})


app.listen(3000, () => console.log('listening on port 3000'));
