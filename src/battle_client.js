//import { io } from "socket.io-client";

export function connectToServer(socket, scene) {
    // socket = io("https://dinosolkingdom.app/", {
    //     path: "/battle/socket.io/",
    //     transports: [ "websocket" ]
    // });
    //socket = io("http://localhost:8082");

    socket.on("player_maxhealth", function (data) {
        console.log("player_maxhealth");
        console.log(data);
        scene.updatePlayerMaxHealth(data);
    });

    socket.on("player_health", function (data) {
        console.log("player_health");
        console.log(data);
        scene.updatePlayerHealth(data);
    });

    socket.on("player_moves", function (data) {
        console.log("player_moves");
        console.log(data);
        scene.setMoves(data);
    });

    socket.on("opponent_maxhealth", function (data) {
        console.log("opponent_maxhealth");
        console.log(data);
        scene.updateOpponentMaxHealth(data);
    });

    socket.on("opponent_health", function (data) {
        console.log("opponent_health");
        console.log(data);
        scene.updateOpponentHealth(data);
    });

    socket.on("opponent_moves", function (data) {
        console.log("opponent_moves");
        console.log(data);
    });

    socket.on("moves", function (moves) {
        scene.enqueueMoves(moves);
    });

    socket.on("battledone", function(winner){
        scene.battleDone(winner);
    });
}

export function newBattle(socket, player, opponent) {
    console.log("New Battle:");
    console.log(player);
    console.log(opponent);
    socket.emit("battle", { player: player, opponent: opponent });
}

export function sendMove(socket, moveIndex) {
    socket.emit("move", moveIndex);
}

export function requestPlayerUpdate(socket){
    socket.emit("request_player_update")
}

export function requestOpponentUpdate(socket){
    socket.emit("request_opponent_update");
}

export function cleanupBattle(socket){
    socket.off('player_maxhealth');
    socket.off('player_health');
    socket.off('player_moves');
    socket.off('opponent_maxhealth');
    socket.off('opponent_health');
    socket.off('opponent_moves');
    socket.off('moves');
    socket.off('battledone');
}