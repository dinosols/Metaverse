export class NameInputScene extends Phaser.Scene {

    constructor() {
        super('NameInputScene');
    }

    init() {
        // Used to prepare data
    }

    preload() {
        this.load.html("form", "form.html");
    }

    create(data) {
        let { width, height } = this.sys.game.canvas;

        this.nameInput = this.add.dom(width/2, 360)
            .createFromCache("form")
            .setOrigin(0.5);

        this.message = this.add.text(width/2, 250, "Input Username", {
            color: "#FFFFFF",
            fontSize: 60,
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.returnKey.on("down", event => {
            let name = this.nameInput.getChildByName("name");
            if (name.value != "") {
                this.scene.start('DinoSelectScene', {name: name.value});
            }
        });
    }

    update(time, delta) {
        // Used to update your game. This function runs constantly
    }
}