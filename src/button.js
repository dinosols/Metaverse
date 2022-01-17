export class Button {
    constructor(x, y, label, scene, callback, index) {

        this.button = scene.add.image(x, y, "button")
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                callback(scene, index);
            })
            .on('pointerover', () => {
                this.button.setTint("0xdfdfdf");
            })
            .on('pointerout', () => {
                this.button.clearTint();
        });

        this.buttonText = scene.add.text(x, y, label)
            .setOrigin(0.5);
    }

    setVisible(visible){
        this.button.setVisible(visible);
        this.buttonText.setVisible(visible);
    }

    setLabel(text){
        this.buttonText.setText(text);
    }
}