import { Connection, } from '@solana/web3.js';
import {
    getParsedNftAccountsByOwner,
} from "@nfteyez/sol-rayz";
var Buffer = require('buffer/').Buffer

import { newBattle } from './battle_client';

var connection;
const DINOSOLS_UPDATE_AUTHORITY = "PoWbSu5iThzzuAnPnStwAxk3BSVUUZYzHC4feArhscr";

var PLAYER_MAP = {
    "token": "",
    "image": "",
    "stats": {},
};

export async function connectWallet() {
    while (!window.solana);
    await window.solana.connect();
    connection = new Connection("https://ssc-dao.genesysgo.net/");
}

export async function getDinosols() {
    const address = window.solana.publicKey.toString();
    console.log(address);
    const nftArray = await getParsedNftAccountsByOwner({
        publicAddress: address,
        connection: connection
    });

    let dinosolsArray = [];
    for (const nft of nftArray) {
        if (nft.updateAuthority === "PoWbSu5iThzzuAnPnStwAxk3BSVUUZYzHC4feArhscr") {
            let metadata = await (await fetch(nft.data.uri)).json();
            if (metadata.symbol === "DINO") {
                dinosolsArray.push({ nft, metadata });
            }
        }
    }

    console.log(dinosolsArray);
    return dinosolsArray;
}

export async function retrieveStats(nft, metadata) {
    PLAYER_MAP["token"] = nft.mint;
    let jsonResult = await (await fetch(metadata.image.replace(".png", ".stats.json"))).json();
    PLAYER_MAP["image"] = metadata.image;
    PLAYER_MAP["stats"] = jsonResult;

    console.log(PLAYER_MAP);
}

export function startBattle(playerToken, opponentToken) {
    newBattle(playerToken, opponentToken);
}

export async function getGameMetadata(token) {
    // Grab the Game Metadata PDA.
    let [metadataAccount, bump] = await PublicKey.findProgramAddress([
        Buffer.from("gamemetav1"),
        GAME_METADATA_PUBKEY.toBuffer(),
        new PublicKey(token).toBuffer(),
    ], GAME_METADATA_PUBKEY);

    const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);
    const metadata = decodeMetadata(metadataAccountInfo.data);
    console.log(metadata);
    return metadata;
}

export async function loadMetadatas() {
    let playerMetadataPDA = await Metadata.getPDA(EXAMPLE_MAP["player"][0]["token"]);
    let playerMeta = await Metadata.load(connection, playerMetadataPDA);
    playerMetadata = await (await fetch(playerMeta.data.data.uri)).json();

    let opponentMetadataPDA = await Metadata.getPDA("6iXMGpERkYzpPaMNpWP7ZRnbGvdvveLs72THDqsyYgJL");
    let opponentMeta = await Metadata.load(connection, opponentMetadataPDA);
    opponentMetadata = await (await fetch(opponentMeta.data.data.uri)).json();
}

export async function getPlayerImage() {
    return playerMetadata.image;
}

export async function getPlayerName() {
    return playerMetadata.name;
}

export async function getOpponentImage() {
    return opponentMetadata.image;
}

export async function getOpponentName() {
    return opponentMetadata.name;
}