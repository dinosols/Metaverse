import { BattleScene } from "./BattleScene";
import { connectToServer, askNewPlayer, sendPosUpdate } from "./metaverse_client";
import { choose } from "./utilities";

export class MetaverseScene extends Phaser.Scene {
    //scene;
    controls;
    cursors;
    player;
    playerSprite;
    playerUsername;
    jellies;
    chickens;
    cpus;
    dino;
    timer;

    constructor() {
        super('MetaverseScene');
    }

    init(data) {
        console.log(data);
        this.playerName = data.name;
        this.playerSpriteURL = data.sprite;
        this.playerMetadata = data.metadata;
        this.playerNFT = data.nft;

        this.currentOpponent = null;
        this.NUM_CPUS = 200;
        this.cpusLoaded = false;
        this.playerMap = {};
    }

    preload() {
        console.log(this.playerMetadata);
        for (const trait of this.playerMetadata.attributes) {
            if (trait.trait_type === "Species") {
                this.playerSpecies = trait.value;
                break;
            }
        }

        this.load.image("tiles", "assets/tilemaps/tuxmon-sample-32px.png");
        this.load.image("tiles2", "assets/tilemaps/rpg.png");
        this.load.tilemapTiledJSON("map", "assets/tilemaps/map.json");

        if (this.playerSpecies === "Triceratops" || this.playerSpecies === "Tyrannosaurus") {
            this.load.spritesheet('player', this.playerSpriteURL, { frameWidth: 64, frameHeight: 64 });
        }
        else {
            this.load.spritesheet('player', this.playerSpriteURL, { frameWidth: 32, frameHeight: 32 });
        }
        // this.load.spritesheet('raptor', 'assets/sprites/raptor.png', { frameWidth: 32, frameHeight: 32 });
        // this.load.spritesheet('ptero', 'assets/sprites/ptero.png', { frameWidth: 32, frameHeight: 32 });
        // this.load.spritesheet('trex', 'assets/sprites/trex.png', { frameWidth: 64, frameHeight: 64 });
        // this.load.spritesheet('trice', 'assets/sprites/trice.png', { frameWidth: 64, frameHeight: 64 });
        // this.load.spritesheet('jelly', 'assets/sprites/jelly.png', { frameWidth: 32, frameHeight: 32 });
        // this.load.spritesheet('chicken', 'assets/sprites/chicken.png', { frameWidth: 32, frameHeight: 32 });

        const loadCPUs = async () => {
            for (let i = 1; i <= this.NUM_CPUS; i++) {
                let number = i.toString().padStart(3, '0');
                let metadataFile = 'https://dinosols.s3.amazonaws.com/beta_dinos/' + number + ".json";
                let metadata = await (await fetch(metadataFile)).json();
                let species = "";
                for (const attribute of metadata.attributes) {
                    if (attribute.trait_type === "Species") {
                        species = attribute.value;
                        break;
                    }
                }

                let filename = number + "_pixel.png";
                if (species === "Triceratops" || species === "Tyrannosaurus") {
                    this.load.spritesheet(number, 'https://dinosols.s3.amazonaws.com/beta_dinos/' + filename, { frameWidth: 64, frameHeight: 64 });
                }
                else {
                    this.load.spritesheet(number, 'https://dinosols.s3.amazonaws.com/beta_dinos/' + filename, { frameWidth: 32, frameHeight: 32 });
                }
            }
        };

        this.loadCPUs = loadCPUs();

        this.load.audio("background_music", ["assets/music/background.mp3"]);
    }

    create() {
        this.socket = connectToServer(this);
        this.timer = 0;
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
        //const waterLayer = waterMap.createLayer(0, waterTileset, 0, 0); // layer index, tileset, x, y
        const waterLayer = map.createLayer("water", tuxmon, 0, 0); // layer index, tileset, x, y
        //const treesLayer = treesMap.createLayer(0, treesTileset, 0, 0); // layer index, tileset, x, y
        const treesLayer = map.createLayer("trees", rpg, 0, 0); // layer index, tileset, x, y

        //this.dino = choose(this.dinos);
        this.playerSprite = this.physics.add
            .sprite(32, 32, "player")
            .setOrigin(0.5);
        this.playerUsername = this.add.text(0, 0, this.playerName, {
            fontFamily: 'Arial',
            color: '#000000',
        }).setFontSize(16).setOrigin(0.5, 2.25);
        this.player = this.add.container().setSize(this.playerSprite.width, this.playerSprite.height);
        this.player.add(this.playerSprite);
        this.player.add(this.playerUsername);
        this.playerUsername.setPosition(this.playerSprite.x, this.playerSprite.y);
        this.physics.world.enable(this.player);

        let playerX, playerY;
        let loop = true;
        do {
            playerX = Math.floor(Math.random() * map.width);
            playerY = Math.floor(Math.random() * map.height);
            let waterClear = true;
            let treesClear = true;
            for (let x = playerX - 1; x <= playerX + 1; x++) {
                for (let y = playerY - 1; y <= playerY + 1; y++) {
                    if (waterLayer.getTileAt(x, y) !== null) {
                        waterClear = false;
                    }
                    if (treesLayer.getTileAt(x, y) !== null) {
                        treesClear = false;
                    }
                }
            }
            loop = !treesClear || !waterClear;
        } while (loop);
        this.player.setPosition(playerX * 32, playerY * 32);
        askNewPlayer(this.playerSpriteURL, this.playerSpecies);

        waterLayer.setCollision(249);
        treesLayer.setCollision(722);
        this.physics.add.collider(this.player, waterLayer);
        this.physics.add.collider(this.player, treesLayer);

        // Mess with the physics bodies in the container so the bounding box is only around the sprite.
        this.playerSprite.body.setEnable(false);
        this.player.body.setSize(this.playerSprite.width, this.playerSprite.height, true);
        this.player.body.setOffset(this.playerSprite.x, this.playerSprite.y, true);

        this.loadCPUs.then(() => {
            while (this.load.isLoading());

            this.cpus = this.physics.add.group();
            for (let i = 1; i <= this.NUM_CPUS; i++) {
                let number = i.toString().padStart(3, '0');
                let filename = number + "_pixel.png";
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

                let cpuX, cpuY;
                let loop = true;
                do {
                    cpuX = Math.floor(Math.random() * map.width);
                    cpuY = Math.floor(Math.random() * map.height);
                    let waterClear = true;
                    let treesClear = true;
                    for (let x = cpuX - 1; x <= cpuX + 1; x++) {
                        for (let y = cpuY - 1; y <= cpuY + 1; y++) {
                            if (waterLayer.getTileAt(x, y) !== null) {
                                waterClear = false;
                            }
                            if (treesLayer.getTileAt(x, y) !== null) {
                                treesClear = false;
                            }
                        }
                    }
                    loop = !treesClear || !waterClear;
                } while (loop);

                this.cpus.create(cpuX * 32, cpuY * 32, number);
            }
            this.cpus.children.iterate((cpu) => {
                this.physics.add.collider(cpu, waterLayer);
                this.physics.add.collider(cpu, treesLayer);
            }, this);

            this.scene.launch("HUDScene");

            this.battleCollider = this.physics.add.overlap(this.player, this.cpus, this.beginBattle, null, this);
            this.cpusLoaded = true;
        });

        this.events.on('wake', function (sys, data) {
            console.log("Metaverse Scene Awoken");
            console.log(data);

            if (data.winner === "player") {
                this.cpus.remove(this.currentOpponent, true, true);
                this.currentOpponent = null;
                this.events.emit('updateDinos');
            }
            else {
                this.scene.restart({
                    name: this.playerName,
                    sprite: this.playerSpriteURL,
                    metadata: this.playerMetadata,
                    nft: this.playerNFT
                });
            }
            this.battleCollider.active = true;
        }, this);

        //jelly = this.physics.add
        //    .sprite(96, 96, 'jelly');

        //for (const dinoType of this.dinos) {
        this.anims.create({
            key: "player" + '-front-walk',
            frames: this.anims.generateFrameNumbers("player", { frames: [0, 1, 2, 1] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: "player" + '-right-walk',
            frames: this.anims.generateFrameNumbers("player", { frames: [3, 4, 5, 4] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: "player" + '-left-walk',
            frames: this.anims.generateFrameNumbers("player", { frames: [6, 7, 8, 7] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: "player" + '-back-walk',
            frames: this.anims.generateFrameNumbers("player", { frames: [9, 10, 11, 10] }),
            frameRate: 8,
            repeat: -1
        });
        //}

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
        camera.startFollow(this.player);
        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cursors = this.input.keyboard.createCursorKeys();

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

        this.backgroundMusic = this.sound.add("background_music", { loop: true });
        this.backgroundMusic.play();
    }

    update(time, delta) {
        const speed = 256;
        const prevVelocity = this.player.body.velocity.clone();

        // Stop any previous movement from the last frame
        this.player.body.setVelocity(0);

        // Horizontal movement
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(speed);
        }

        // Vertical movement
        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(speed);
        }

        // Normalize and scale the velocity so that player can't move faster along a diagonal
        this.player.body.velocity.normalize().scale(speed);

        // Update the animation last and give left/right animations precedence over up/down animations
        if (this.cursors.left.isDown) {
            this.playerSprite.anims.play("player" + "-left-walk", true);
        } else if (this.cursors.right.isDown) {
            this.playerSprite.anims.play("player" + "-right-walk", true);
        } else if (this.cursors.up.isDown) {
            this.playerSprite.anims.play("player" + "-back-walk", true);
        } else if (this.cursors.down.isDown) {
            this.playerSprite.anims.play("player" + "-front-walk", true);
        } else {
            this.playerSprite.anims.stop();

            // If we were moving, pick and idle frame to use
            if (prevVelocity.y > 0) this.playerSprite.setTexture("player", 1);
            else if (prevVelocity.x > 0) this.playerSprite.setTexture("player", 3);
            else if (prevVelocity.x < 0) this.playerSprite.setTexture("player", 7);
            else if (prevVelocity.y < 0) this.playerSprite.setTexture("player", 10);
        }

        this.timer += delta;
        while (this.timer > 1000) {
            this.timer -= 1000;
            //jellies.children.iterate(processJelly, this);
            //chickens.children.iterate(processChicken, this);
            if (this.cpusLoaded) {
                this.cpus.children.iterate(this.processDino, this);
            }
            sendPosUpdate(this.player.x, this.player.y);
        }
    }

    processJelly(jelly) {
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

    processChicken(chicken) {
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

    processDino(dino) {
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

    addNewPlayer(id, sprite, species, x, y) {
        console.log("Adding " + sprite + " " + species + " at x:" + x + " y:" + y);

        let key = sprite.split('/').pop().replace(".png", "");
        console.log("Key: " + key);
        if (species === "Triceratops" || species === "Tyrannosaurus") {
            this.load.spritesheet(key, sprite, { frameWidth: 64, frameHeight: 64 });
        }
        else {
            this.load.spritesheet(key, sprite, { frameWidth: 32, frameHeight: 32 });
        }

        this.load.start();

        this.load.on('filecomplete-spritesheet-' + key, function (key, type, data) {
            this.playerMap[id] = this.physics.add.sprite(32, 32, key);
            this.playerMap[id].setPosition(x, y);
        });
    };

    movePlayer(id, x, y) {
        //var distance = Phaser.Math.distance(player.x, player.y, x, y);
        //var tween = game.add.tween(player);
        //var duration = distance * 10;
        //tween.to({ x: x, y: y }, duration);
        //tween.start();
        this.playerMap[id].setPosition(x, y);
        console.log(this.player.x);
        console.log(this.player.y);
    };

    removePlayer(id) {
        this.playerMap[id].destroy();
        delete this.playerMap[id];
    };

    beginBattle(player, opponent) {
        console.log("Begin battle!");
        this.currentOpponent = opponent;
        console.log(this.currentOpponent);
        //this.scene.get("BattleScene").scene.restart();
        this.scene.add("BattleScene", BattleScene, true, {
            socket: this.socket,
            player: {
                name: this.playerName,
                metadata: this.playerMetadata,
                nft: this.playerNFT,
            },
            opponent: {
                name: "Wild Dinosol #" + this.currentOpponent.texture.key,
                metadata: { image: 'https://dinosols.s3.amazonaws.com/beta_dinos/' + this.currentOpponent.texture.key + ".png" },
                nft: { mint: "beta" + this.currentOpponent.texture.key }
            },
        });
        //this.scene.bringToTop("BattleScene");
        this.scene.sleep("MetaverseScene");
        this.battleCollider.active = false;
    }
}

export class HUDScene extends Phaser.Scene {

    constructor() {
        super({ key: 'HUDScene', active: false });

        this.dinos = 0;
    }

    create() {

        //  Grab a reference to the Game Scene
        let metaverse = this.scene.get('MetaverseScene');

        //  Our Text object to display the Score
        this.info = this.add.text(10, 10, 'Wild Dinos: ' + metaverse.NUM_CPUS, { font: '24px Arial', fill: '#000000' });

        //  Listen for events from it
        metaverse.events.on('updateDinos', function () {
            this.dinos = metaverse.cpus.children.size;
            this.info.setText('Wild Dinos: ' + this.dinos);

        }, this);
    }
}