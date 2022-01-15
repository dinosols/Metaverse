import { NameInputScene } from "./NameInputScene";
import { MetaverseScene } from "./MetaverseScene";

const ratio = Math.max(window.innerWidth / window.innerHeight, window.innerHeight / window.innerWidth)
const DEFAULT_HEIGHT = 720 // any height you want
const DEFAULT_WIDTH = ratio * DEFAULT_HEIGHT
const ZOOM_LEVEL = 1;

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: true,
        },
    },
    dom: {
        createContainer: true
    },
    scene: [
        NameInputScene, MetaverseScene
    ],
    scale: {
        mode: Phaser.Scale.NONE,
        //autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth/ZOOM_LEVEL,
        height: window.innerHeight/ZOOM_LEVEL,
        zoom: ZOOM_LEVEL
    },
};

const Game = new Phaser.Game(config);
window.addEventListener("resize", () => {
    Game.scale.resize(window.innerWidth/ZOOM_LEVEL, window.innerHeight/ZOOM_LEVEL);
},false
);