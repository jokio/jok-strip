/// <reference path="Game.ts" />


import GameEngine = require('Game');
import http = require('http');
var Primus = require('primus');


export class GameServer {

    httpServer: http.Server;

    primus;

    start() {
        this.httpServer = http.createServer(this.httpHandler);
        this.primus = new Primus(this.httpServer, {/* options */});
    }

    httpHandler(req, res) {
        res.end('Hello World');
    }

}

console.log('GameServer Module Loaded');