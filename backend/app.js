import fs from 'fs';
import fetch from 'node-fetch'

let download = function(what){
    let data = []
    let writepath =''
    if(what=='leagues'){
        writepath = 'json/leagues'
        data = fs.readFileSync('leagues.txt', 'utf8').split("\n")
    }
    else if(what=='teams'){
        writepath = 'json/teams'
        data = fs.readFileSync('teamIDs.txt', 'utf8').split("\n")

    } else if (what=='nationalities'){
        writepath = 'json/nationalities'
        data = fs.readFileSync('nationalities.txt', 'utf8').split("\n")
    } else {
        console.log('Error: unknown download type')
    }
    fs.mkdirSync(writepath, {recursive:true})
    data.forEach( (elem, idx) => {
        elem=elem.replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        if (what === 'leagues') {
            //const url = `https://playfootball.games/media/competitions/${elem}.png`
            const url = `https://aimarmanci14.eus/football/leagues/${elem}.png`
            fetch(url)
                .then(res => {
                    // check status
                    if (res.status === 200) {
                        res.body.pipe(fs.createWriteStream(`${writepath}/${elem}.png`))
                    } else {
                        console.log(`status: ${res.status} line: ${idx} elem:${elem} not found`)
                    }
                })
                .catch(err => console.log(err))
        } else if (what === 'teams') {
            //const url = `https://cdn.sportmonks.com/images/soccer/teams/${elem % 32}/${elem}.png`
            const url = `https://aimarmanci14.eus/football/teams/${elem}.png`
            fetch(url)
                .then(res => {
                    // check status
                    if (res.status === 200) {
                        res.body.pipe(fs.createWriteStream(`${writepath}/${elem}.png`))
                    } else {
                        console.log(`status: ${res.status} line: ${idx} elem:${elem} not found`)
                    }
                })
                .catch(err => console.log(err))
        } else if (what === 'nationalities') {
            let url = ''
            console.log(elem)
            //if (elem == "Cte d'Ivoire") {
              //  url = `https://aimarmanci14.eus/football/nationalities/Cte dIvoire.svg`
            //}
            //else{
                url = `https://aimarmanci14.eus/football/nationalities/${elem}.svg`
            //}
            fetch(url)
                .then(res => {
                    // check status
                    if (res.status === 200) {
                        res.body.pipe(fs.createWriteStream(`${writepath}/${elem}.svg`))
                    } else {
                        console.log(`status: ${res.status} line: ${idx} elem:${elem} not found`)
                    }
                })
                .catch(err => console.log(err))
        }
    })
}
let getPlayers = function() {
    let writepath4 = 'json/players/'
    fs.mkdirSync(writepath4, {recursive: true})
    try {
        // read leagues file into an array of lines
        let data = fs.readFileSync('playerIDs.txt', 'utf8').split("\n")
        let i = 0
        let clock = setInterval(() => {
            let elem = data[i]
            i++
            if (i == data.length) {
                clearInterval(clock)
            }
            elem = elem.replace(/[^a-zA-Z0-9 ]/g, '');
            //const url = `https://playfootball.games/media/players/${elem %32}/${elem}.png`
            const url = `https://aimarmanci14.eus/football/players/${elem}.png`
            fetch(url)
                .then(res => {
                    // check status
                    if (res.status === 200) {
                        res.body.pipe(fs.createWriteStream(`${writepath4}${elem}.png`))
                        console.log(`status: ${res.status} line: ${i} elem:${elem} success`)

                    } else {
                        console.log(`status: ${res.status} line: ${i} elem:${elem} not found`)
                    }
                })
                .catch(err => console.log(err))
        }, 10)//Nire domeinuarekin 10 ahal da jarri, bestela 500 da balioa


    } catch (err) {
        console.error(err);
    }
}
//download('leagues')
//download('teams')
//download('nationalities')
getPlayers()