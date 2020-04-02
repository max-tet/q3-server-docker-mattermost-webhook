
const https = require('https');

const mattermostHost = process.env.MATTERMOST_HOST || '';
const mattermostPath = process.env.MATTERMOST_PATH || '';
console.log('mattermostHost: ' + mattermostHost);
console.log('mattermostPath: ' + mattermostPath);

function sendNotification(message) {

    const data = JSON.stringify({
        text: message
    });

    const options = {
        hostname: mattermostHost,
        port: 443,
        path: mattermostPath,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`);
    });

    req.on('error', error => {
        console.error(error)
    });

    req.write(data);
    req.end();
}

function sanitizePlayerName(name) {
    return name.replace(/\^\d+/g, "")
}

function startClient() {

    const host = process.env.REST_API_HOST || '127.0.0.1';
    const port = process.env.REST_API_PORT || '9009';
    const url = 'http://' + host + ':' + port;

    console.log('url: ' + url);

    let socket = require('socket.io-client')(url);
    socket.on('connect', function () {
        console.log("connected");
    });
    socket.on('say', function (payload) {
        console.log("say: " + JSON.stringify(payload));
    });
    socket.on('playerBegin', function (payload) {
        console.log("playerBegin: " + JSON.stringify(payload));
        sendNotification("player joined: **" + sanitizePlayerName(payload.data.n) + "**");
    });
    socket.on('playerInfoChanged', function (payload) {
        console.log("playerInfoChanged: " + JSON.stringify(payload));
    });
    socket.on('playerConnect', function (payload) {
        console.log("playerConnect: " + JSON.stringify(payload));
    });
    socket.on('playerDisconnect', function (payload) {
        console.log("playerDisconnect: " + JSON.stringify(payload));
    });
    socket.on('gameStart', function (payload) {
        console.log("gameStart: " + JSON.stringify(payload));
        sendNotification("new game started: **" + payload.data.properties.mapname + "**");
    });
    socket.on('gameEnd', function (payload) {
        console.log("gameEnd: " + JSON.stringify(payload));
        
        if (Object.keys(payload.data.players).length == 0) { return; }
        
        let table = "| Player  | Frags  |\n"
                  + "| :------ | :----- |\n";
        
        Object.values(payload.data.players)
            .sort(function(a,b) {a.score - b.score})
            .forEach(function(player) {
                let name = sanitizePlayerName(player.n);
                let score = player.score;
                table += "| " + name + " | " + score + " |\n";
            }
        
        sendNotification(table);
    });
    socket.on('gameShutdown', function (payload) {
        console.log("gameShutdown: " + JSON.stringify(payload));
    });
    socket.on('item', function (payload) {
        console.log("item: " + JSON.stringify(payload));
    });
    socket.on('kill', function (payload) {
        console.log("kill: " + JSON.stringify(payload));
    });
    socket.on('disconnect', function () {
        console.log("disconnected");
    });
}

startClient();
