/// <reference path="Game.ts" />

import ServerEngine = require('JokServerEngine');
import GameEngine = require('Game');


class GameServer extends ServerEngine.JokServer {

    constructor() {
        super();
        
        this.on('connect', this.onConnect);
        this.on('authorize', this.onAuthorize);
        this.on('disconnect', this.onDisconnect);
        this.on('ping', this.onPing);
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

    onPing() {
        console.log('ping received');
    }


    static Start(port: number) {
        return new GameServer().listen(port);
    }
}

GameServer.Start(3000);
