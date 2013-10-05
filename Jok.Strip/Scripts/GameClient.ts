/// <reference path="Game.ts" />

import GameEngine = require('Game');
var EventEmitter, eio;


class GameClient {

    url = 'ws://localhost:3000/';

    serverEvents = new EventEmitter();

    socket;

    reconnectRetryCount = 0;



    constructor() {
        this.connect();

        this.serverEvents.on('connect', () => this.onConnect());
        this.serverEvents.on('disconnect', () => this.onDisconnect());
        this.serverEvents.on('authorize', (info) => this.onAuthorize(info));
    }


    connect() {
        this.reconnectRetryCount++;

        this.socket = new eio.Socket(this.url);

        this.socket.on('open', () => {
            this.reconnectRetryCount = 0;
            this.serverEvents.emit('connect', {});
        });

        this.socket.on('message', (msg) => {

            if (!msg || !msg.cmd || !msg.data) {
                console.log('[INVALID_MSG_RECEIVED]: ' + msg);
                return;
            }

            this.serverEvents.emit(msg.cmd, msg.data);
        });

        this.socket.on('close', () => {
            this.serverEvents.emit('disconnect', {});
            setTimeout(() => this.connect(), 1000);
        });
    }


    // [Server Callbacks]
    onConnect() {

    }

    onDisconnect() {

    }

    onAuthorize(info) {
        console.log(info);
    }


    static Start() {
        return new GameClient();
    }
}

GameClient.Start();
