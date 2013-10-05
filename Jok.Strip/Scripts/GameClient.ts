/// <reference path="Game.ts" />

import ClientEngine = require('JokClientEngine');
import GameEngine = require('Game');


class GameClient extends ClientEngine.JokClient {

    constructor() {
        super();

        this.serverEvents.on('connect', () => this.onConnect());
        this.serverEvents.on('disconnect', () => this.onDisconnect());
        this.serverEvents.on('authorize', (info) => this.onAuthorize(info));
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
