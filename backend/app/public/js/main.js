import { folder, leftArrow } from "./fragments.js";
import { fetchJSON } from "./loaders.js";
import { setupRows } from "./rows.js";
import { autocomplete }  from "./autocomplete.js";
//Aldaketa
function differenceInDays(date1) {
    let gaur =new Date()
    const diffTime = Math.abs(gaur - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    //return diffDays
    return 19
}

let difference_In_Days = differenceInDays(new Date("08-18-2022"));

window.onload = function () {
  document.getElementById(
    "gamenumber"
  ).innerText = difference_In_Days.toString();
  document.getElementById("back-icon").innerHTML = folder + leftArrow;
};

let game = {
  guesses: [],
  solution: {},
  players: [],
  leagues: []
};

function getSolution(players, solutionArray, difference_In_Days) {
    console.log(difference_In_Days)
    console.log(solutionArray)
    let sol= solutionArray[difference_In_Days- 1].id
    let em =players.filter(p => p.id==sol)[0]
    console.log(em)
    return em
}

Promise.all([fetchJSON("fullplayers"), fetchJSON("solution")]).then(
  (values) => {

    let solution;
    
    [game.players, solution] = values;

    game.solution = getSolution(game.players, solution, difference_In_Days);
    
    console.log(game.solution);

    document.getElementById(
      "mistery"
    ).src = `https://aimarmanci14.eus/football/players/${game.solution.id}.png`;


      console.log(game);
      autocomplete(document.getElementById("myInput"), game)
  }
);
