/// <reference path="Game.ts" />

import ClientEngine = require('JokClientEngine');
import GameEngine = require('Game');


class GameClient extends ClientEngine.JokClient {

    constructor() {
        super();

        this.on('connect', this.onConnect);
        this.on('disconnect', this.onDisconnect);
        this.on('authorize', this.onAuthorize);
    }


    onConnect() {
        console.log('connected');
    }

    onAuthorize(info) {
        console.log('authorize', info);

        if (info.isSuccess) {
            this.sendCommand('ping');
        }
    }

    onDisconnect() {
        console.log('disconnected');
    }


    static Start(url) {
        return new GameClient().connect(url);
    }
}

GameClient.Start('ws://localhost:3000/');
