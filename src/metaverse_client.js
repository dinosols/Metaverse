import { io } from "socket.io-client";

let socket = null;

export function connectToServer(scene) {
    socket = io("https://dinosolkingdom.app/", {
        //transports: [ "polling" ]
    });
    //socket = io("localhost:8081");

    socket.on('newplayer', function (data) {
        console.log("newplayer");
        console.log(data);
        console.log(JSON.stringify(data));
        scene.addNewPlayer(data.id, data.sprite, data.species, data.x, data.y);
    });

    socket.on('allplayers', function (data) {
        console.log("allplayers");
        for (var i = 0; i < data.length; i++) {
            console.log("Adding new player")
            scene.addNewPlayer(data[i].id, data[i].sprite, data.species, data[i].x, data[i].y);
        }

        socket.on('move', function (data) {
            console.log("move");
            scene.movePlayer(data.id, data.x, data.y);
        });

        socket.on('remove', function (id) {
            scene.removePlayer(id);
        });
    });

    return socket;
}

export function askNewPlayer(sprite, species) {
    socket.emit('newplayer', { sprite: sprite, species: species });
};

export function sendPosUpdate(x, y) {
    socket.emit('posupdate', { x: x, y: y });
};




