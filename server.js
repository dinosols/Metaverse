// var express = require('express');
// var app = express();
// var server = require('http').Server(app);
// var io = require('socket.io').listen(server);

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.lastPlayerID = 0;

server.listen(process.env.PORT || 8081, function () {
    console.log('Listening on ' + server.address().port);
});

io.on('connection', function (socket) {

    socket.on('newplayer', function (newPlayerData) {
        console.log("newplayer");
        socket.emit('allplayers', getAllPlayers());

        socket.player = {
            id: server.lastPlayerID++,
            sprite: newPlayerData.sprite,
            x: 8192,
            y: 7680
        };

        socket.broadcast.emit('newplayer', socket.player);

        socket.on('posupdate', function (data) {
            console.log('pos update to ' + data.x + ', ' + data.y);
            socket.player.x = data.x;
            socket.player.y = data.y;
            socket.broadcast.emit('move', socket.player);
        });

        socket.on('disconnect', function () {
            io.emit('remove', socket.player.id);
        });
    });

    socket.on('test', function () {
        console.log('test received');
    });
});

function getAllPlayers() {
    var players = [];
    //console.log(io.sockets);
    //console.log(io.sockets.sockets);
    for (const [id, socket] of io.sockets.sockets) {
        console.log(socket);
        var player = socket.player;
        if (player) players.push(player);
    }
    console.log(players);
    return players;
}

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
