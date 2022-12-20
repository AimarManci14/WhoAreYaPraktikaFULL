export { fetchJSON };

async function fetchJSON(what) {
        let jsona = fetch("./json/" + what + ".json").then(r => r.json())
        console.log(jsona)
        return jsona

}
