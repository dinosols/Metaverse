/**
 * Author: Michael Hadley, mikewesthad.com
 * Asset Credits:
 *  - Phaser, Rich Davey, Ilija Melentijević
 */

import { connectToServer, requestPlayerUpdate, requestOpponentUpdate, sendMove } from "./battle_client";
import { connectWallet, retrieveStats, startBattle, getPlayerImage, getOpponentImage, loadMetadatas, getPlayerName, getOpponentName } from "./solana_helper";
import { HealthBar } from "./health_bar";
import { Button } from "./button";
import { DialogModalPlugin } from './dialog_plugin';

// const ratio = Math.max(window.innerWidth / window.innerHeight, window.innerHeight / window.innerWidth)
// const DEFAULT_HEIGHT = 720 // any height you want
// const DEFAULT_WIDTH = ratio * DEFAULT_HEIGHT
// const config = {
//     type: Phaser.AUTO,
//     parent: "game-container",
//     pixelArt: true,
//     physics: {
//         default: "arcade",
//         arcade: {
//             gravity: { y: 0 },
//         },
//     },
//     scene: {
//         preload: preload,
//         create: create,
//         update: update,
//     },
//     scale: {
//         mode: Phaser.Scale.FIT,
//         autoCenter: Phaser.Scale.CENTER_BOTH,
//         width: DEFAULT_WIDTH,
//         height: DEFAULT_HEIGHT
//     },
// };

const START_BATTLE = 0;
const WAIT_FOR_MOVE = 1;
const WAIT_FOR_PROCESSING = 2;
const FIRST_MOVE = 3;
const SECOND_MOVE = 4;
const END_ROUND = 5
const BATTLE_COMPLETE = 6;
const LEAVE_BATTLE = 7;

// const Game = new Phaser.Game(config);

export class BattleScene extends Phaser.Scene {

    constructor() {
        console.log("Constructor");
        super();

        this.currentState = START_BATTLE;
        //this.playerImage = null;
        //this.opponentImage = null;
        this.timer = 5000.0;
        this.playerName = null;
        this.opponentName = null;
        this.battleWinner = null;
        this.done = false;
        this.enqueuedMoves = null;
    }

    init(data) {
        console.log("Init");
        this.playerName = data.player.name;
        this.playerMetadata = data.player.metadata;
        this.playerNFT = data.player.nft;

        this.opponentName = data.opponent.name;
        this.opponentMetadata = data.opponent.metadata;
        this.opponentNFT = data.opponent.nft;
    }

    preload() {
        console.log("Preload");
        this.dialogModal = this.load.scenePlugin({ key: 'DialogModalPlugin', url: DialogModalPlugin, sceneKey: 'dialogModal' });

        this.load.image("background", "assets/images/background.png");
        this.load.image("stat_box", "assets/images/stat_box.png");
        this.load.image("button", "assets/images/button.png");
        this.load.image("button_hover", "assets/images/button_hover.png");
        this.load.image("button_click", "assets/images/button_click.png");
        this.load.image("playerImage", this.playerMetadata.image);
        console.log("playerMetadata.image: " + this.playerMetadata.image);
        this.load.image("opponentImage", this.opponentMetadata.image);
        console.log("opponentMetadata.image: " + this.opponentMetadata.image);
    }

    create() {
        console.log("Create");
        this.background = this.add.image(this.game.scale.width / 2, this.game.scale.height / 2, "background")
            .setOrigin(.5, .5);
        this.playerStatBox = this.add.container(this.game.scale.width / 2 + 110, this.game.scale.height / 2 + 60 - 50);
        this.playerBorder = this.add.image(0, 0, "stat_box")
            .setOrigin(.5, .5);
        this.playerStatBox.add(this.playerBorder);
        this.playerHealth = new HealthBar(this, this.playerStatBox);
        this.playerNameText = this.add.text(-180, -30, "", { fontFamily: 'Gilroy-Light', fontSize: 32, color: '#000000' })
            .setOrigin(0, .5);
        this.playerStatBox.add(this.playerNameText);

        this.opponentStatBox = this.add.container(this.game.scale.width / 2 - 110, this.game.scale.height / 2 - 200 - 50);
        this.opponentBorder = this.add.image(0, 0, "stat_box")
            .setOrigin(.5, .5);
        this.opponentStatBox.add(this.opponentBorder);
        this.opponentHealth = new HealthBar(this, this.opponentStatBox);
        this.opponentNameText = this.add.text(-180, -30, "", { fontFamily: 'Gilroy-Light', fontSize: 32, color: '#000000' })
            .setOrigin(0, .5);
        this.opponentStatBox.add(this.opponentNameText);

        this.dialogModal.init();
        this.dialogModal.setText('Initializing battle...', true);

        const BTN_OFFSET_X = 158;
        const BTN_OFFSET_Y_CONST = 250;
        const BTN_OFFSET_Y = 33;
        this.atkButtons = [
            new Button(this.game.scale.width / 2 - BTN_OFFSET_X, this.game.scale.height / 2 + BTN_OFFSET_Y_CONST - BTN_OFFSET_Y, "", this, this.sendMoveToServer, 0),
            new Button(this.game.scale.width / 2 + BTN_OFFSET_X, this.game.scale.height / 2 + BTN_OFFSET_Y_CONST - BTN_OFFSET_Y, "", this, this.sendMoveToServer, 1),
            new Button(this.game.scale.width / 2 - BTN_OFFSET_X, this.game.scale.height / 2 + BTN_OFFSET_Y_CONST + BTN_OFFSET_Y, "", this, this.sendMoveToServer, 2),
            new Button(this.game.scale.width / 2 + BTN_OFFSET_X, this.game.scale.height / 2 + BTN_OFFSET_Y_CONST + BTN_OFFSET_Y, "", this, this.sendMoveToServer, 3)
        ];

        for (let btn of this.atkButtons) {
            btn.setVisible(false);
        }

        connectToServer(this);
        startBattle(this.playerNFT.mint, this.opponentNFT.mint);
        //await loadMetadatas();

        this.playerNameText.setText(this.playerName);
        this.opponentNameText.setText(this.opponentName);

        // let playerImageURL = this.playerMetadata.image;
        //console.log(playerImageURL);
        // let loader = new Phaser.Loader.LoaderPlugin(this);
        // ask the LoaderPlugin to load the texture
        // loader.image("playerImage", playerImageURL);
        // loader.start();
        // loader.once(Phaser.Loader.Events.COMPLETE, () => {
        this.playerImage = this.add.image(this.game.scale.width / 2 - 200, this.game.scale.height / 2 + 60, "playerImage");
        this.playerImage.setDisplaySize(200, 200);
        // });

        // let opponentImageURL = this.opponentMetadata.image;
        // console.log("opponentImageURL: " + opponentImageURL);
        // loader.image("opponentImage", opponentImageURL);
        // loader.start();
        // loader.once(Phaser.Loader.Events.COMPLETE, () => {
        this.opponentImage = this.add.image(this.game.scale.width / 2 + 200, this.game.scale.height / 2 - 200, "opponentImage");
        this.opponentImage.setDisplaySize(200, 200);
        // });

        this.dialogModal.setText(this.playerName + " vs. " + this.opponentName, true);

        const loadBattle = async () => {
            //connectWallet();
            await retrieveStats(this.playerNFT, this.playerMetadata);
        }

        this.loadBattle = loadBattle();
    }

    update(time, delta) {
        this.timer = Math.max(this.timer - delta, 0);

        switch (this.currentState) {
            case START_BATTLE:
                if (this.timer === 0) {
                    this.dialogModal.setText("");
                    for (let btn of this.atkButtons) {
                        btn.setVisible(true);
                    }
                    console.log("Transition: WAIT_FOR_MOVE");
                    this.currentState = WAIT_FOR_MOVE;
                }
                break;
            case WAIT_FOR_MOVE:
                // Do Nothing
                break;
            case WAIT_FOR_PROCESSING:
                // Do Nothing
                break;
            case FIRST_MOVE:
                if (this.enqueuedMoves[0].player === "player") {
                    this.dialogModal.setText(this.playerName + " used " + this.enqueuedMoves[0].move + ".");
                    requestOpponentUpdate();
                }
                else {
                    this.dialogModal.setText(this.opponentName + " used " + this.enqueuedMoves[0].move + ".");
                    requestPlayerUpdate();
                }
                this.timer = 4000;
                if (this.battleWinner) {
                    console.log("Transition: BATTLE_COMPLETE");
                    this.currentState = BATTLE_COMPLETE;
                }
                else {
                    console.log("Transition: SECOND_MOVE");
                    this.currentState = SECOND_MOVE;
                }
                break;
            case SECOND_MOVE:
                if (this.timer === 0) {
                    if (this.enqueuedMoves[1].player === "player") {
                        this.dialogModal.setText(this.playerName + " used " + this.enqueuedMoves[1].move + ".");
                        requestOpponentUpdate();
                    }
                    else {
                        this.dialogModal.setText(this.opponentName + " used " + this.enqueuedMoves[1].move + ".");
                        requestPlayerUpdate();
                    }
                    this.timer = 4000;
                    if (this.battleWinner) {
                        console.log("Transition: BATTLE_COMPLETE");
                        this.currentState = BATTLE_COMPLETE;
                    }
                    else {
                        console.log("Transition: END_ROUND");
                        this.currentState = END_ROUND;
                    }
                }
                break;
            case END_ROUND:
                if (this.timer === 0) {
                    this.dialogModal.setText("");
                    for (let btn of this.atkButtons) {
                        btn.setVisible(true);
                    }
                    console.log("Transition: WAIT_FOR_MOVE");
                    this.currentState = WAIT_FOR_MOVE;
                }
                break;
            case BATTLE_COMPLETE:
                if (this.timer === 0 && !this.done) {
                    for (let btn of this.atkButtons) {
                        btn.setVisible(false);
                    }
                    if (this.battleWinner === "player") {
                        requestOpponentUpdate();
                        this.dialogModal.setText(this.playerName + ' wins!', true);
                    }
                    else {
                        requestPlayerUpdate();
                        this.dialogModal.setText(this.opponentName + ' wins!', true);
                    }
                    this.done = true;
                    this.timer = 5000;
                    this.currentState = LEAVE_BATTLE;
                    console.log("Transition: LEAVE_BATTLE");
                }
                break;
            case LEAVE_BATTLE:
                if (this.timer === 0) {
                    this.opponentImage.destroy();
                    this.textures.remove("opponentImage");
                    console.log("Running MetaverseScene");
                    this.scene.run("MetaverseScene", { winner: this.battleWinner });
                    console.log("Removing BattleScene");
                    this.scene.remove("BattleScene");
                    console.log("Complete");
                }
        }
    }

    sendMoveToServer(scene, moveIndex) {
        sendMove(moveIndex);
        for (let btn of scene.atkButtons) {
            btn.setVisible(false);
        }

        console.log("Transition: WAIT_FOR_PROCESSING");
        scene.currentState = WAIT_FOR_PROCESSING;
    }

    enqueueMoves(moves) {
        this.enqueuedMoves = moves;
        console.log("Transition: FIRST_MOVE");
        this.currentState = FIRST_MOVE;
    }

    battleDone(winner) {
        console.log("Transition: BATTLE_COMPLETE");
        this.battleWinner = winner;
    }

    updatePlayerHealth(newHealth) {
        this.playerHealth.setHealth(newHealth);
    }

    updatePlayerMaxHealth(newHealth) {
        this.playerHealth.setMaxHealth(newHealth);
    }

    updateOpponentHealth(newHealth) {
        this.opponentHealth.setHealth(newHealth);
    }

    updateOpponentMaxHealth(newHealth) {
        this.opponentHealth.setMaxHealth(newHealth);
    }

    setMoves(moves) {
        for (let i = 0; i < 4; i++) {
            this.atkButtons[i].setLabel(moves[i].move_name);
        }
    }
}
