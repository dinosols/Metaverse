import { connectToServer, askNewPlayer, sendPosUpdate } from "./client";
import { choose } from "./utilities";

export class MetaverseScene extends Phaser.Scene {
    //scene;
    controls;
    cursors;
    NUM_CPUS = 10;
    player;
    playerSprite;
    playerUsername;
    jellies;
    chickens;
    cpus;
    //dinos = ["raptor", "ptero", "trex", "trice"];
    dino;
    timer;
    playerMap = {};

    constructor() {
        super('MetaverseScene');
    }

    init(data) {
        this.playerName = data.name;
        this.playerSpriteURL = data.sprite;
        this.playerMetadata = data.metadata;
    }

    preload() {
        console.log(this.playerMetadata);
        for (const trait of this.playerMetadata.attributes) {
            if (trait.trait_type === "Species") {
                this.playerSpecies = trait.value;
                break;
            }
        }

        this.load.image("tiles", "../assets/tilemaps/tuxmon-sample-32px.png");
        this.load.image("tiles2", "../assets/tilemaps/rpg.png");
        this.load.tilemapTiledJSON("map", "../assets/tilemaps/map.json");

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

        for (let i = 1; i <= this.NUM_CPUS; i++) {
            let number = i.toString().padStart(4, '0');
            let filename = number + ".png";
            this.load.spritesheet(number, 'assets/ai_sprites/' + filename, { frameWidth: 64, frameHeight: 64 });
        }
    }

    create() {
        connectToServer();
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
        console.log(groundLayer);
        //const waterLayer = waterMap.createLayer(0, waterTileset, 0, 0); // layer index, tileset, x, y
        const waterLayer = map.createLayer("water", tuxmon, 0, 0); // layer index, tileset, x, y
        console.log(waterLayer);
        //const treesLayer = treesMap.createLayer(0, treesTileset, 0, 0); // layer index, tileset, x, y
        const treesLayer = map.createLayer("trees", rpg, 0, 0); // layer index, tileset, x, y
        console.log(treesLayer);

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
        //player.setScale(2, 2);
        this.player.setPosition(map.widthInPixels / 2 - 32 * 4, map.heightInPixels / 2 - 32 * 16);
        askNewPlayer("player");

        waterLayer.setCollision(249);
        treesLayer.setCollision(722);
        this.physics.add.collider(this.player, waterLayer);
        this.physics.add.collider(this.player, treesLayer);

        // Mess with the physics bodies in the container so the bounding box is only around the sprite.
        this.playerSprite.body.setEnable(false);
        this.player.body.setSize(this.playerSprite.width, this.playerSprite.height, true);
        this.player.body.setOffset(this.playerSprite.x, this.playerSprite.y, true);

        this.cpus = this.physics.add.group();
        for (let i = 1; i <= this.NUM_CPUS; i++) {
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

            this.cpus.create(map.widthInPixels / 2 - 32 * 4, map.heightInPixels / 2 - 32 * 16, number);
        }
        this.cpus.children.iterate((cpu) => {
            this.physics.add.collider(cpu, waterLayer);
            this.physics.add.collider(cpu, treesLayer);
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
            this.cpus.children.iterate(this.processDino, this);
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

    addNewPlayer(id, sprite, x, y) {
        console.log("Adding " + sprite + " at x:" + x.toString() + " y:" + y.toString());
        playerMap[id] = this.physics.add.sprite(32, 32, sprite);
        playerMap[id].setPosition(x, y);
    };

    movePlayer(id, x, y) {
        //var distance = Phaser.Math.distance(player.x, player.y, x, y);
        //var tween = game.add.tween(player);
        //var duration = distance * 10;
        //tween.to({ x: x, y: y }, duration);
        //tween.start();
        playerMap[id].setPosition(x, y);
        console.log(player.x);
        console.log(player.y);
    };

    removePlayer(id) {
        playerMap[id].destroy();
        delete playerMap[id];
    };
}
