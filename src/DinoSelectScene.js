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
        const asyncLoader = (loaderPlugin) => new Promise((resolve, reject) => {
            loaderPlugin.on('filecomplete', resolve).on('loaderror', reject);
            loaderPlugin.start();
        });

        const loadDinosols = async () => {
            await connectWallet();
            let dinosolsArray = await getDinosols();
            for (const dinosol of dinosolsArray) {
                console.log("Loading " + dinosol.metadata.name + " from " + dinosol.metadata.image);
                this.dinosolsArray.push(dinosol);
                this.load.image(dinosol.metadata.name, dinosol.metadata.image);
            }
            this.load.start();
            //await asyncLoader(this.load.image('image2', 'path/to/image2.png'));
        };

        this.loadDinosols = loadDinosols();
    }

    create(data) {
        let { width, height } = this.sys.game.canvas;
        //while (!this.preloaded);
        this.loadDinosols.then(() => {
            this.load.once(Phaser.Loader.Events.COMPLETE, () => {
                console.log(this.load);
                console.log(this.load.progress);
                console.log(this.load.textureManager.list);
                console.log(this.dinosolsArray);
                let x = 125;
                let y = 125;
                for (const dinosol of this.dinosolsArray) {
                    console.log(dinosol.metadata.name);
                    console.log(dinosol.metadata.image);
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
                    });
                });
            });
        });
    }

    update(time, delta) {
        // Used to update your game. This function runs constantly
    }
}