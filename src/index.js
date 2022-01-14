import { connectToServer, askNewPlayer, sendPosUpdate } from "./client.js";
function choose(choices) {
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
}

const ratio = Math.max(window.innerWidth / window.innerHeight, window.innerHeight / window.innerWidth)
const DEFAULT_HEIGHT = 720 // any height you want
const DEFAULT_WIDTH = ratio * DEFAULT_HEIGHT
const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT
    },
};

const Game = new Phaser.Game(config);
let scene;
let controls;
let cursors;
const NUM_CPUS = 10;
let player, jellies, chickens, cpus;
let dinos = ["raptor", "ptero", "trex", "trice"];
let dino;
let timer;
let playerMap = {};

function preload() {
    scene = this;
    this.load.image("tiles", "../assets/tilemaps/tuxmon-sample-32px.png");
    this.load.image("tiles2", "../assets/tilemaps/rpg.png");
    //this.load.tilemapCSV("ground", "../assets/tilemaps/ground.csv");
    //this.load.tilemapCSV("water", "../assets/tilemaps/water.csv");
    //this.load.tilemapCSV("trees", "../assets/tilemaps/trees.csv");
    this.load.tilemapTiledJSON("map", "../assets/tilemaps/map.json");
    this.load.spritesheet('raptor', 'assets/sprites/raptor.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('ptero', 'assets/sprites/ptero.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('trex', 'assets/sprites/trex.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('trice', 'assets/sprites/trice.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('jelly', 'assets/sprites/jelly.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('chicken', 'assets/sprites/chicken.png', { frameWidth: 32, frameHeight: 32 });

    for (let i = 1; i <= NUM_CPUS; i++) {
        let number = i.toString().padStart(4, '0');
        let filename = number + ".png";
        this.load.spritesheet(number, 'assets/ai_sprites/' + filename, { frameWidth: 64, frameHeight: 64 });
    }

    //this.load.html('nameform', 'assets/text/nameform.html');
}

function create() {
    connectToServer();
    timer = 0;
    // When loading a CSV map, make sure to specify the tileWidth and tileHeight!
    //const groundMap = this.make.tilemap({ key: "ground", tileWidth: 32, tileHeight: 32 });
    //const waterMap = this.make.tilemap({ key: "water", tileWidth: 32, tileHeight: 32 });
    //const treesMap = this.make.tilemap({ key: "trees", tileWidth: 32, tileHeight: 32 });
    const map = this.make.tilemap({ key: "map" });
    //const groundTileset = groundMap.addTilesetImage("tiles");
    //const waterTileset = waterMap.addTilesetImage("tiles");
    //const treesTileset = treesMap.addTilesetImage("tiles2");
    const tuxmon = map.addTilesetImage("Tuxmon", "tiles");
    const rpg = map.addTilesetImage("RPG", "tiles2");
    //const groundLayer = groundMap.createLayer(0, groundTileset, 0, 0); // layer index, tileset, x, y
    const groundLayer = map.createLayer("ground", tuxmon, 0, 0); // layer index, tileset, x, y
    console.log(groundLayer);
    //const waterLayer = waterMap.createLayer(0, waterTileset, 0, 0); // layer index, tileset, x, y
    const waterLayer = map.createLayer("water", tuxmon, 0, 0); // layer index, tileset, x, y
    console.log(waterLayer);
    //const treesLayer = treesMap.createLayer(0, treesTileset, 0, 0); // layer index, tileset, x, y
    const treesLayer = map.createLayer("trees", rpg, 0, 0); // layer index, tileset, x, y
    console.log(treesLayer);

    dino = choose(dinos);
    player = this.physics.add
        .sprite(32, 32, dino);
    //player.setScale(2, 2);
    player.setPosition(map.widthInPixels / 2 - 32 * 4, map.heightInPixels / 2 - 32 * 16);
    askNewPlayer(dino);

    waterLayer.setCollision(249);
    treesLayer.setCollision(722);
    this.physics.add.collider(player, waterLayer);
    this.physics.add.collider(player, treesLayer);

    cpus = this.physics.add.group();
    for (let i = 1; i <= NUM_CPUS; i++) {
        let number = i.toString().padStart(4, '0');
        let filename = number + ".png";
        //this.load.spritesheet('dino' + number, 'assets/ai_sprites/' + filename, { framewidth: 64, frameHeight: 64 });

        this.anims.create({
            key: number + '-front-walk',
            frames: this.anims.generateFrameNumbers(number, { frames: [0, 1, 2, 1] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: number + '-right-walk',
            frames: this.anims.generateFrameNumbers(number, { frames: [3, 4, 5, 4] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: number + '-left-walk',
            frames: this.anims.generateFrameNumbers(number, { frames: [6, 7, 8, 7] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: number + '-back-walk',
            frames: this.anims.generateFrameNumbers(number, { frames: [9, 10, 11, 10] }),
            frameRate: 8,
            repeat: -1
        });

        cpus.create(map.widthInPixels / 2 - 32 * 4, map.heightInPixels / 2 - 32 * 16, number);
    }
    cpus.children.iterate((cpu) => {
        this.physics.add.collider(cpu, waterLayer);
        this.physics.add.collider(cpu, treesLayer);
    }, this);

    //jelly = this.physics.add
    //    .sprite(96, 96, 'jelly');

    for (const dinoType of dinos) {
        this.anims.create({
            key: dinoType + '-front-walk',
            frames: this.anims.generateFrameNumbers(dinoType, { frames: [0, 1, 2, 1] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: dinoType + '-right-walk',
            frames: this.anims.generateFrameNumbers(dinoType, { frames: [3, 4, 5, 4] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: dinoType + '-left-walk',
            frames: this.anims.generateFrameNumbers(dinoType, { frames: [6, 7, 8, 7] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: dinoType + '-back-walk',
            frames: this.anims.generateFrameNumbers(dinoType, { frames: [9, 10, 11, 10] }),
            frameRate: 8,
            repeat: -1
        });
    }

    // this.anims.create({
    //     key: 'jelly-front-walk',
    //     frames: this.anims.generateFrameNumbers('jelly', { frames: [0, 1, 2, 1] }),
    //     frameRate: 8,
    //     repeat: -1
    // });
    // this.anims.create({
    //     key: 'jelly-right-walk',
    //     frames: this.anims.generateFrameNumbers('jelly', { frames: [3, 4, 5, 4] }),
    //     frameRate: 8,
    //     repeat: -1
    // });
    // this.anims.create({
    //     key: 'jelly-left-walk',
    //     frames: this.anims.generateFrameNumbers('jelly', { frames: [6, 7, 8, 7] }),
    //     frameRate: 8,
    //     repeat: -1
    // });
    // this.anims.create({
    //     key: 'jelly-back-walk',
    //     frames: this.anims.generateFrameNumbers('jelly', { frames: [9, 10, 11, 10] }),
    //     frameRate: 8,
    //     repeat: -1
    // });

    // this.anims.create({
    //     key: 'chicken-front-walk',
    //     frames: this.anims.generateFrameNumbers('chicken', { frames: [0, 1, 2, 1] }),
    //     frameRate: 8,
    //     repeat: -1
    // });
    // this.anims.create({
    //     key: 'chicken-right-walk',
    //     frames: this.anims.generateFrameNumbers('chicken', { frames: [3, 4, 5, 4] }),
    //     frameRate: 8,
    //     repeat: -1
    // });
    // this.anims.create({
    //     key: 'chicken-left-walk',
    //     frames: this.anims.generateFrameNumbers('chicken', { frames: [6, 7, 8, 7] }),
    //     frameRate: 8,
    //     repeat: -1
    // });
    // this.anims.create({
    //     key: 'chicken-back-walk',
    //     frames: this.anims.generateFrameNumbers('chicken', { frames: [9, 10, 11, 10] }),
    //     frameRate: 8,
    //     repeat: -1
    // });

    const camera = this.cameras.main;
    camera.startFollow(player);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cursors = this.input.keyboard.createCursorKeys();

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // jellies = this.physics.add.group({
    //     key: 'jelly',
    //     quantity: 10,
    //     collideWorldBounds: true,
    //     setScale: { x: 2, y: 2 },
    //     setPosition: { x: groundMap.widthInPixels / 2, y: groundMap.heightInPixels / 2 }
    // });
    // chickens = this.physics.add.group({
    //     key: 'chicken',
    //     quantity: 10,
    //     collideWorldBounds: true,
    //     setScale: { x: 2, y: 2 },
    //     setPosition: { x: groundMap.widthInPixels / 2, y: groundMap.heightInPixels / 2 - 32 * 16 }
    // });

    var text = this.add.text(300, 10, 'Please enter your name', { color: 'white', fontSize: '20px ' });
    var element = this.add.dom(400, 0).createFromHTML('assets/text/nameform.html');

    element.addListener('click');

    element.on('click', function (event) {

        if (event.target.name === 'playButton') {
            var inputText = this.getChildByName('nameField');

            //  Have they entered anything?
            if (inputText.value !== '') {
                //  Turn off the click events
                this.removeListener('click');

                //  Hide the login element
                this.setVisible(false);

                //  Populate the text with whatever they typed in
                text.setText('Welcome ' + inputText.value);
            }
        }
    });
}

function update(time, delta) {
    const speed = 256;
    const prevVelocity = player.body.velocity.clone();

    // Stop any previous movement from the last frame
    player.body.setVelocity(0);

    // Horizontal movement
    if (cursors.left.isDown) {
        player.body.setVelocityX(-speed);
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(speed);
    }

    // Vertical movement
    if (cursors.up.isDown) {
        player.body.setVelocityY(-speed);
    } else if (cursors.down.isDown) {
        player.body.setVelocityY(speed);
    }

    // Normalize and scale the velocity so that player can't move faster along a diagonal
    player.body.velocity.normalize().scale(speed);

    // Update the animation last and give left/right animations precedence over up/down animations
    if (cursors.left.isDown) {
        player.anims.play(dino + "-left-walk", true);
    } else if (cursors.right.isDown) {
        player.anims.play(dino + "-right-walk", true);
    } else if (cursors.up.isDown) {
        player.anims.play(dino + "-back-walk", true);
    } else if (cursors.down.isDown) {
        player.anims.play(dino + "-front-walk", true);
    } else {
        player.anims.stop();

        // If we were moving, pick and idle frame to use
        if (prevVelocity.y > 0) player.setTexture(dino, 1);
        else if (prevVelocity.x > 0) player.setTexture(dino, 3);
        else if (prevVelocity.x < 0) player.setTexture(dino, 7);
        else if (prevVelocity.y < 0) player.setTexture(dino, 10);
    }

    timer += delta;
    while (timer > 1000) {
        timer -= 1000;
        //jellies.children.iterate(processJelly, this);
        //chickens.children.iterate(processChicken, this);
        cpus.children.iterate(processDino, this);
        sendPosUpdate(player.x, player.y);
    }
}

function processJelly(jelly) {
    if (Phaser.Math.RND.pick([true, false]) === true) {
        const speed = 64;
        let dir = Phaser.Math.RND.pick(["left", "right", "back", "front"]);
        if (dir === "left") {
            jelly.body.setVelocityX(-speed);
            jelly.body.setVelocityY(0);
            jelly.anims.play("jelly-left-walk", true);
        }
        else if (dir === "right") {
            jelly.body.setVelocityX(speed);
            jelly.body.setVelocityY(0);
            jelly.anims.play("jelly-right-walk", true);
        }
        else if (dir === "back") {
            jelly.body.setVelocityX(0);
            jelly.body.setVelocityY(-speed);
            jelly.anims.play("jelly-back-walk", true);
        }
        else if (dir === "front") {
            jelly.body.setVelocityX(0);
            jelly.body.setVelocityY(speed);
            jelly.anims.play("jelly-front-walk", true);
        }
    }
}

function processChicken(chicken) {
    const speed = 64;
    if (Phaser.Math.RND.pick([true, false]) === true) {
        let dir = Phaser.Math.RND.pick(["left", "right", "back", "front"]);
        if (dir === "left") {
            chicken.body.setVelocityX(-speed);
            chicken.body.setVelocityY(0);
            chicken.anims.play("chicken-left-walk", true);
        }
        else if (dir === "right") {
            chicken.body.setVelocityX(speed);
            chicken.body.setVelocityY(0);
            chicken.anims.play("chicken-right-walk", true);
        }
        else if (dir === "back") {
            chicken.body.setVelocityX(0);
            chicken.body.setVelocityY(-speed);
            chicken.anims.play("chicken-back-walk", true);
        }
        else if (dir === "front") {
            chicken.body.setVelocityX(0);
            chicken.body.setVelocityY(speed);
            chicken.anims.play("chicken-front-walk", true);
        }
    }
}

function processDino(dino) {
    const speed = 64;
    const key = dino.texture.key;
    if (Phaser.Math.RND.pick([true, false]) === true) {
        let dir = Phaser.Math.RND.pick(["left", "right", "back", "front"]);
        if (dir === "left") {
            dino.body.setVelocityX(-speed);
            dino.body.setVelocityY(0);
            dino.anims.play(key + "-left-walk", true);
        }
        else if (dir === "right") {
            dino.body.setVelocityX(speed);
            dino.body.setVelocityY(0);
            dino.anims.play(key + "-right-walk", true);
        }
        else if (dir === "back") {
            dino.body.setVelocityX(0);
            dino.body.setVelocityY(-speed);
            dino.anims.play(key + "-back-walk", true);
        }
        else if (dir === "front") {
            dino.body.setVelocityX(0);
            dino.body.setVelocityY(speed);
            dino.anims.play(key + "-front-walk", true);
        }
    }
}

//Game.getCoordinates = function (layer, pointer) {
//    Client.sendPosUpdate(pointer.worldX, pointer.worldY);
//};

Game.addNewPlayer = function (id, sprite, x, y) {
    console.log("Adding " + sprite + " at x:" + x.toString() + " y:" + y.toString());
    playerMap[id] = scene.physics.add.sprite(32, 32, sprite);
    playerMap[id].setPosition(x, y);
};

Game.movePlayer = function (id, x, y) {
    //var distance = Phaser.Math.distance(player.x, player.y, x, y);
    //var tween = game.add.tween(player);
    //var duration = distance * 10;
    //tween.to({ x: x, y: y }, duration);
    //tween.start();
    playerMap[id].setPosition(x, y);
    console.log(player.x);
    console.log(player.y);
};

Game.removePlayer = function (id) {
    playerMap[id].destroy();
    delete playerMap[id];
};