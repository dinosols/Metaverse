import { NameInputScene } from "./NameInputScene";
import { DinoSelectScene } from "./DinoSelectScene";
import { MetaverseScene } from "./MetaverseScene";
//import { BattleScene } from "./BattleScene";

const ZOOM_LEVEL = 1;

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    dom: {
        createContainer: true
    },
    scene: [
        NameInputScene, DinoSelectScene, MetaverseScene
    ],
    scale: {
        mode: Phaser.Scale.NONE,
        //autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth / ZOOM_LEVEL,
        height: window.innerHeight / ZOOM_LEVEL,
        zoom: ZOOM_LEVEL
    },
};

const Game = new Phaser.Game(config);
window.addEventListener("resize", () => {
    Game.scale.resize(window.innerWidth / ZOOM_LEVEL, window.innerHeight / ZOOM_LEVEL);
}, false
);