/**
 * Created by Jerome on 03-03-17.
 */

var Client = {};
Client.socket = io.connect();

Client.sendTest = function(){
    console.log("test sent");
    Client.socket.emit('test');
};

Client.askNewPlayer = function(sprite){
    Client.socket.emit('newplayer', {sprite:sprite});
};

Client.sendPosUpdate = function(x,y){
  Client.socket.emit('posupdate',{x:x,y:y});
};

Client.socket.on('newplayer',function(data){
    console.log("newplayer");
    console.log(data);
    console.log(JSON.stringify(data));
    Game.addNewPlayer(data.id, data.sprite, data.x, data.y);
});

Client.socket.on('allplayers',function(data){
    console.log("allplayers");
    for(var i = 0; i < data.length; i++){
        console.log("Adding new player")
        Game.addNewPlayer(data[i].id, data[i].sprite, data[i].x, data[i].y);
    }

    Client.socket.on('move',function(data){
        console.log("move");
        Game.movePlayer(data.id,data.x,data.y);
    });

    Client.socket.on('remove',function(id){
        Game.removePlayer(id);
    });
});


