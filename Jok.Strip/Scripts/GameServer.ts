/// <reference path="JokServerEngine.ts" />
/// <reference path="Game.ts" />

import ServerEngine = require('JokServerEngine');
import GameEngine = require('Game');


class GameServer extends ServerEngine.JokServer {

    constructor() {
        super();
        
        this.on('connect', this.onConnect);
        this.on('authorize', this.onAuthorize);
        this.on('disconnect', this.onDisconnect);
        this.on('msg', this.onMsg);
    }


    onConnect(socket) {
        this.groups.add(socket.id, 'test');
    }

    onAuthorize(socket, isSuccess) {
    }

    onDisconnect(socket) {
    }

    onMsg(socket, text) {
        this.sendToGroup('test', 'msg', text);
    }


    static Start(port: number) {
        return new GameServer().listen(port);
    }
}

GameServer.Start(3000);
