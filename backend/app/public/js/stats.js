export {initState}
export {getStats, updateStats}

let initState = function(what, solutionId) {
    let emaitza = []
    let lag = localStorage.getItem(what)
    if(lag){
        let lag2 = JSON.parse(lag)
        lag2.guesses = []
        lag2.solution = solutionId
        localStorage.setItem('WAYgameState', JSON.stringify(lag2))
        emaitza.push(lag2)
    }
    else{
        let WAYgameState= {
            guesses : [],
            solution : solutionId
        }

        localStorage.setItem('WAYgameState', JSON.stringify(WAYgameState))
        emaitza.push(WAYgameState)
    }
    emaitza.push(function(guess){
        let lag = localStorage.getItem("WAYgameState")
        let parsedLag = JSON.parse(lag)


        parsedLag.guesses.push(guess)
        localStorage.setItem("WAYgameState", JSON.stringify(parsedLag))
    })
    return emaitza
}
function successRate (e){
    return e.successRate
}

let getStats = function(what) {
    let lag = localStorage.getItem(what)
    if(lag){
        let parsedLag = JSON.parse(lag)
        return parsedLag
    }
    else{
        let egoera = {
            winDistribution: [0,0,0,0,0,0,0,0,0],
            gamesFailed: 0,
            currentStreak: 0,
            bestStreak: 0,
            totalGames: 0,
            successRate: 0
        }
        localStorage.setItem('gameStats', JSON.stringify(egoera))
        return egoera
    }
};


function updateStats(t){
    let lag = localStorage.getItem('gameStats')
    let gameStats = JSON.parse(lag)
    gameStats.winDistribution[t-1]++
    gameStats.totalGames++
    if(t>=8){
        gameStats.gamesFailed++
        gameStats.currentStreak = 0
    }
    else {
        gameStats.currentStreak++
        if(gameStats.currentStreak > gameStats.bestStreak){
            gameStats.bestStreak = gameStats.currentStreak
        }
    }
    gameStats.successRate =Number((((gameStats.totalGames - gameStats.gamesFailed) / gameStats.totalGames) * 100).toFixed(2));
    localStorage.setItem('gameStats', JSON.stringify(gameStats))
};


let gamestats = getStats('gameStats'    );



