import { Connection, } from '@solana/web3.js';
import {
    getParsedNftAccountsByOwner,
} from "@nfteyez/sol-rayz";
var Buffer = require('buffer/').Buffer

var connection;
const DINOSOLS_UPDATE_AUTHORITY = "PoWbSu5iThzzuAnPnStwAxk3BSVUUZYzHC4feArhscr";

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
                dinosolsArray.push({nft, metadata});
            }
        }
    }

    console.log(dinosolsArray);
    return dinosolsArray;
}