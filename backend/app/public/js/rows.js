import { stringToHTML } from "./fragments.js";
export { setupRows };
import { lower} from "./fragments.js";
import { higher } from "./fragments.js";
import { stats, headless, toggle } from "./fragments.js";
import { initState, updateStats, getStats } from "./stats.js";

// From: https://stackoverflow.com/a/7254108/243532
function pad(a, b){
    return(1e15 + a + '').slice(-b);
}

const delay = 350;
const attribs = ['nationality', 'leagueId', 'teamId', 'position', 'birthdate', 'number']


let setupRows = function (game) {

    let [state, updateState] = initState('WAYgameState', game.solution.id)


    function leagueToFlag(leagueId) {
        let flags = [
            { id:564 , flag:"es1"},
            { id:8 , flag:"en1"},
            { id:384 , flag:"it1"},
            { id:82 , flag:"de1"},
            { id:301 , flag:"fr1"}
        ]
        return flags.filter(f => f.id==leagueId)[0].flag
    }


    function getAge(dateString) {
        let today = new Date();
        let birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        let m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    let check = function (theKey, theValue) {
        if (theKey == 'birthdate' || theKey == 'number') {
            if(theKey=='birthdate'){
                let solAge = getAge(game.solution[theKey]);
                let guessedAge = getAge(theValue)
                if(solAge == guessedAge){
                    return 'correct'
                }
                else if(solAge > guessedAge){
                    return 'higher'
                }
                else{
                    return 'lower'
                }
            }
            else{
                let solNum = game.solution[theKey];
                let guessedNum = theValue
                if(solNum == guessedNum){
                    return 'correct'
                }
                else if(solNum > guessedNum){
                    return 'higher'
                }
                else{
                    return 'lower'
                }
            }

        }
        else{
            if(game.solution[theKey] == theValue){
                return 'correct'
            }
            else{
                return 'incorrect'
            }
        }
    }

        function unblur(outcome) {
        return new Promise( (resolve, reject) =>  {
            setTimeout(() => {
                document.getElementById("mistery").classList.remove("hue-rotate-180", "blur")
                document.getElementById("combobox").remove()
                let color, text
                if (outcome=='success'){
                    color =  "bg-blue-500"
                    text = "Awesome"
                } else {
                    color =  "bg-rose-500"
                    text = "The player was " + game.solution.name
                }
                document.getElementById("picbox").innerHTML += `<div class="animate-pulse fixed z-20 top-14 left-1/2 transform -translate-x-1/2 max-w-sm shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${color} text-white"><div class="p-4"><p class="text-sm text-center font-medium">${text}</p></div></div>`
                resolve();
            }, "2000")
        })
    }

    function showStats(timeout) {
        return new Promise( (resolve, reject) =>  {
            setTimeout(() => {
                document.body.appendChild(stringToHTML(headless(stats())));
                document.getElementById("showHide").onclick = toggle;
                bindClose();
                resolve();
            }, timeout)
        })
    }

    function bindClose() {
        document.getElementById("closedialog").onclick = function () {
            document.body.removeChild(document.body.lastChild)
            document.getElementById("mistery").classList.remove("hue-rotate-180", "blur")
        }
    }

    function setContent(guess) {
        let birthdateCheck = check('birthdate',guess.birthdate)
        let numberCheck = check('number',guess.number)
        return [
            `<img src="https://aimarmanci14.eus/football/nationalities/${guess.nationality}.svg" alt="" style="width: 60%;">`,
            `<img src="https://aimarmanci14.eus/football/leagues/${leagueToFlag(guess.leagueId)}.png" alt="" style="width: 60%;">`,
            `<img src="https://aimarmanci14.eus/football/teams/${guess.teamId}.png" alt="" style="width: 60%;">`,
            `${guess.position}`,
            `${getAge(guess.birthdate)} ${birthdateCheck == 'lower' ? lower : birthdateCheck== 'higher' ? higher : ''}`,
            `#${guess.number} ${numberCheck == 'lower' ? lower : numberCheck== 'higher' ? higher : ''}`
        ]
    }

    function showContent(content, guess) {
        let fragments = '', s = '';
        for (let j = 0; j < content.length; j++) {
            s = "".concat(((j + 1) * delay).toString(), "ms")
            fragments += `<div class="w-1/5 shrink-0 flex justify-center ">
                            <div class="mx-1 overflow-hidden w-full max-w-2 shadowed font-bold text-xl flex aspect-square rounded-full justify-center items-center bg-slate-400 text-white ${check(attribs[j], guess[attribs[j]]) == 'correct' ? 'bg-green-500' : ''} opacity-0 fadeInDown" style="max-width: 60px; animation-delay: ${s};">
                                ${content[j]}
                            </div>
                         </div>`
        }

        let child = `<div class="flex w-full flex-wrap text-l py-2">
                        <div class=" w-full grow text-center pb-2">
                            <div class="mx-1 overflow-hidden h-full flex items-center justify-center sm:text-right px-4 uppercase font-bold text-lg opacity-0 fadeInDown " style="animation-delay: 0ms;">
                                ${guess.name}
                            </div>
                        </div>
                        ${fragments}`

        let playersNode = document.getElementById('players')
        playersNode.prepend(stringToHTML(child))
    }


    function resetInput(){
        let input = document.getElementById("myInput")
        input.value = ""
        input.placeholder="Guess "+(game.guesses.length+1)+" of 8"
    }

    let getPlayer = function (playerId) {
        return game.players.find(player => player.id == playerId)
    }


    function gameEnded(lastGuess){
        if(lastGuess==game.solution.id || game.guesses.length == 8){
            let input = document.getElementById("myInput")
            input.placeholder=""
            return true
        }
        else{
            return false
        }
    }

    function success(){
        unblur('success')
        let input = document.getElementById("myInput")
        input.placeholder = "You won!"
        input.disabled = true
        showStats(2000)
    }
    function gameOver(){
        unblur('gameOver')
        let input = document.getElementById("myInput")
        input.placeholder = "Game ended"
        input.disabled = true
        showStats(2000)
    }

    function calculateNextPlayerTime(){
        let unekoa = new Date()
        let hurrengoa = {
                hours: 23,
                minutes: 59,
                seconds: 59
        }
        let nextPlayer = document.getElementById("nextPlayer")
        nextPlayer.innerText = (hurrengoa.hours - unekoa.getHours()) + " : " + (hurrengoa.minutes - unekoa.getMinutes()) + " : " + (hurrengoa.seconds - unekoa.getSeconds())
        return {
            hours: hurrengoa.hours - unekoa.getHours(),
            minutes: hurrengoa.minutes - unekoa.getMinutes(),
            seconds: hurrengoa.seconds - unekoa.getSeconds()
        }


    }
    resetInput();

    return /* addRow */ function (playerId) {

        let guess = getPlayer(playerId)
        console.log(guess)

        let content = setContent(guess)

        game.guesses.push(playerId)
        updateState(playerId)

        resetInput();

         if (gameEnded(playerId)) {


            if (playerId == game.solution.id) {
                updateStats(game.guesses.length);
                success();
            }
            else{
                if (game.guesses.length == 8) {
                    updateStats(game.guesses.length+1);
                    gameOver();
                }
            }


            setTimeout(() => {
                let interval = setInterval(calculateNextPlayerTime, 1000);
            },1000)
         }


        showContent(content, guess)
    }
}
