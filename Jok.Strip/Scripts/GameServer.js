/// <reference path="Game.ts" />
define(["require", "exports", 'http'], function(require, exports, __http__) {
    
    var http = __http__;

    var GameServer = (function () {
        function GameServer() {
        }
        GameServer.prototype.start = function () {
            this.httpServer = http.createServer(this.httpHandler);
        };

        GameServer.prototype.httpHandler = function (req, res) {
            res.end('Hello World');
        };
        return GameServer;
    })();
    exports.GameServer = GameServer;

    console.log('GameServer Module Loaded');
});
//# sourceMappingURL=GameServer.js.map
