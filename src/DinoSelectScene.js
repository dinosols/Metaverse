import { connectWallet, getDinosols } from "./solana_helper";

export class DinoSelectScene extends Phaser.Scene {

    constructor() {
        super('DinoSelectScene');
        this.dinosolsArray = [];
        this.dinosolMap = new Map();
        this.chosenDino = null;
    }

    init(data) {
        this.playerName = data.name;
        this.preloaded = false;
    }

    preload() {
        const loadDinosols = async () => {
            await connectWallet();
            let dinosolsArray = await getDinosols();
            for (const dinosol of dinosolsArray) {
                console.log("Loading " + dinosol.metadata.name + " from " + dinosol.metadata.image);
                this.dinosolsArray.push(dinosol);
                this.load.image(dinosol.metadata.name, dinosol.metadata.image);
            }
            this.load.start();
        };

        this.loadDinosols = loadDinosols();
    }

    create(data) {
        let { width, height } = this.sys.game.canvas;
        this.add.text(width/2, 24, "Select your Dinosol", { color: 'white', fontSize: '48px ' }).setOrigin(0.5);
        //while (!this.preloaded);
        this.loadDinosols.then(() => {
            this.load.once(Phaser.Loader.Events.COMPLETE, () => {
                let x = 125;
                let y = 150;
                for (const dinosol of this.dinosolsArray) {
                    let img = this.add.image(x, y, dinosol.metadata.name);
                    img.setDisplaySize(200, 200);
                    img.setInteractive();
                    img.setData("nft", dinosol.nft);
                    img.setData("metadata", dinosol.metadata);
                    x += 250;
                    if (x >= width) {
                        x = 125;
                        y += 250;
                    }
                }

                this.input.on('gameobjectdown', function (pointer, gameObject, event) {
                    console.log(gameObject.getData("metadata"));
                    let spriteURL = "";
                    this.scene.scene.start('MetaverseScene', {
                        name: this.scene.playerName,
                        sprite: gameObject.getData("metadata").image.replace(".png", "_pixel.png"),
                        metadata: gameObject.getData("metadata"),
                        nft: gameObject.getData("nft"),
                    });
                });
            });
        });
    }

    update(time, delta) {
        // Used to update your game. This function runs constantly
    }
}