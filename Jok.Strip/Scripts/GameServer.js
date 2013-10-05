/// <reference path="Game.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'JokServerEngine'], function(require, exports, __ServerEngine__) {
    var ServerEngine = __ServerEngine__;
    

    var GameServer = (function (_super) {
        __extends(GameServer, _super);
        function GameServer() {
            _super.call(this);

            this.on('connect', this.onConnect);
            this.on('authorize', this.onAuthorize);
            this.on('disconnect', this.onDisconnect);
            this.on('ping', this.onPing);
        }
        GameServer.prototype.onConnect = function (socket) {
            console.log('socket connected');
        };

        GameServer.prototype.onAuthorize = function (socket, isSuccess) {
            console.log('socket authorization result:', isSuccess);
        };

        GameServer.prototype.onDisconnect = function (socket) {
            console.log('socket disconnected');
        };

        GameServer.prototype.onPing = function () {
            console.log('ping received');
        };

        GameServer.Start = function (port) {
            return new GameServer().listen(port);
        };
        return GameServer;
    })(ServerEngine.JokServer);

    GameServer.Start(3000);
});
//# sourceMappingURL=GameServer.js.map
