import { io } from "socket.io-client";

let socket = null;

export function connectToServer(game) {
    socket = io("localhost:8081");

    socket.on('newplayer', function (data) {
        console.log("newplayer");
        console.log(data);
        console.log(JSON.stringify(data));
        Game.addNewPlayer(data.id, data.sprite, data.x, data.y);
    });

    socket.on('allplayers', function (data) {
        console.log("allplayers");
        for (var i = 0; i < data.length; i++) {
            console.log("Adding new player")
            Game.addNewPlayer(data[i].id, data[i].sprite, data[i].x, data[i].y);
        }

        socket.on('move', function (data) {
            console.log("move");
            Game.movePlayer(data.id, data.x, data.y);
        });

        socket.on('remove', function (id) {
            Game.removePlayer(id);
        });
    });
}

export function askNewPlayer(sprite) {
    socket.emit('newplayer', { sprite: sprite });
};

export function sendPosUpdate(x, y) {
    socket.emit('posupdate', { x: x, y: y });
};




