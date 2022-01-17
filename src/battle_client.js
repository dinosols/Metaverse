import { io } from "socket.io-client";

let socket = null;

export function connectToServer(scene) {
    //socket = io("http://ec2-174-129-178-49.compute-1.amazonaws.com:8082");
    socket = io("http://localhost:8082");

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

export function newBattle(player, opponent) {
    socket.emit("battle", { player: player, opponent: opponent });
}

export function sendMove(moveIndex) {
    socket.emit("move", moveIndex);
}

export function requestPlayerUpdate(){
    socket.emit("request_player_update")
}

export function requestOpponentUpdate(){
    socket.emit("request_opponent_update");
}