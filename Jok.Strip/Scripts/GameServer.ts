/// <reference path="Game.ts" />


import GameEngine = require('Game');
import http = require('http');


export class GameServer {

    httpServer: http.Server;

    primus;

    start() {
        this.httpServer = http.createServer(this.httpHandler);
    }

    httpHandler(req, res) {
        res.end('Hello World');
    }

}

console.log('GameServer Module Loaded');