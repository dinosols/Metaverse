export class HealthBar {
    constructor(scene, container) {
        const YOFFSET = 0;

        this.bar = new Phaser.GameObjects.Graphics(scene);
        this.statBox = container;
        this.labelText = scene.add.text(10 - 360 / 2, YOFFSET, 'HP:', { fontFamily: 'Gilroy-Light', fontSize: 20, color: '#000000' })
            .setOrigin(.5, .5);
        this.statBox.add(this.labelText);

        this.hpText = scene.add.text(360 / 2 - 10, 20, '???/???', { fontFamily: 'Gilroy-Light', fontSize: 20, color: '#000000' })
            .setOrigin(1, .5);
        this.statBox.add(this.hpText);

        this.x = container.x - 330 / 2 + 15;
        this.y = container.y - 16 / 2 + YOFFSET;
        this.value = 100;
        this.maxHealth = 100;
        this.p = 326 / 100;

        this.draw();

        scene.add.existing(this.bar);
    }

    setMaxHealth(amount) {
        let oldMax = this.maxHealth;
        this.maxHealth = amount;
        this.value = (amount * this.value) / oldMax;
        this.p = 326 / amount;

        this.draw();
    }

    setHealth(amount) {
        this.value = amount;

        if (this.value < 0) {
            this.value = 0;
        }

        this.draw();

        return (this.value === 0);
    }

    decrease(amount) {
        this.value -= amount;

        if (this.value < 0) {
            this.value = 0;
        }

        this.draw();

        return (this.value === 0);
    }

    draw() {
        this.bar.clear();

        //  BG
        this.bar.fillStyle(0x000000);
        this.bar.fillRect(this.x, this.y, 330, 16);

        //  Health

        this.bar.fillStyle(0xffffff);
        this.bar.fillRect(this.x + 2, this.y + 2, 326, 12);

        if (this.value < 30) {
            this.bar.fillStyle(0xff0000);
        }
        else {
            this.bar.fillStyle(0x00ff00);
        }

        var d = Math.floor(this.p * this.value);

        this.bar.fillRect(this.x + 2, this.y + 2, d, 12);

        this.hpText.setText(this.value.toString() + "/" + this.maxHealth);
    }

}