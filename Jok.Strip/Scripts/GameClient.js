/// <reference path="Game.ts" />
define(["require", "exports"], function(require, exports) {
    
    var EventEmitter, eio;

    var GameClient = (function () {
        function GameClient() {
            var _this = this;
            this.url = 'ws://localhost:3000/';
            this.serverEvents = new EventEmitter();
            this.reconnectRetryCount = 0;
            this.connect();

            this.serverEvents.on('connect', function () {
                return _this.onConnect();
            });
            this.serverEvents.on('disconnect', function () {
                return _this.onDisconnect();
            });
            this.serverEvents.on('authorize', function (info) {
                return _this.onAuthorize(info);
            });
        }
        GameClient.prototype.connect = function () {
            var _this = this;
            this.reconnectRetryCount++;

            this.socket = new eio.Socket(this.url);

            this.socket.on('open', function () {
                _this.reconnectRetryCount = 0;
                _this.serverEvents.emit('connect', {});
            });

            this.socket.on('message', function (msg) {
                if (!msg || !msg.cmd || !msg.data) {
                    console.log('[INVALID_MSG_RECEIVED]: ' + msg);
                    return;
                }

                _this.serverEvents.emit(msg.cmd, msg.data);
            });

            this.socket.on('close', function () {
                _this.serverEvents.emit('disconnect', {});
                setTimeout(function () {
                    return _this.connect();
                }, 1000);
            });
        };

        // [Server Callbacks]
        GameClient.prototype.onConnect = function () {
        };

        GameClient.prototype.onDisconnect = function () {
        };

        GameClient.prototype.onAuthorize = function (info) {
            console.log(info);
        };

        GameClient.Start = function () {
            return new GameClient();
        };
        return GameClient;
    })();

    GameClient.Start();
});
//# sourceMappingURL=GameClient.js.map
