/// <reference path="Game.ts" />

import ServerEngine = require('ServerEngine');
import GameEngine = require('Game');


export class GameServer extends ServerEngine.JokServer {

    constructor() {
        super();

        this.on('connect', this.onConnect);
        this.on('authoize', this.onAuthorize);
        this.on('disconnect', this.onDisconnect);
    }

    onConnect(socket) {
        console.log('socket connected');
    }

    onAuthorize(socket, isSuccess) {
        console.log('socket authorization result:', isSuccess);
    }

    onDisconnect(socket) {
        console.log('socket disconnected');
    }


    static Start(port: number) {
        return new GameServer().listen(port);
    }
}

GameServer.Start(3000);
