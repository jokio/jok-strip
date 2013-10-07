/// <reference path="JokServerEngine.ts" />
/// <reference path="Game.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'JokServerEngine'], function(require, exports, __ServerEngine__) {
    var ServerEngine = __ServerEngine__;

    ;

    var GameServer = (function (_super) {
        __extends(GameServer, _super);
        function GameServer() {
            _super.call(this);
            this.on('connect', this.onConnect);
            this.on('authorize', this.onAuthorize);
            this.on('disconnect', this.onDisconnect);
            this.on('msg', this.onMsg);
        }
        GameServer.prototype.onConnect = function (socket) {
            this.groups.add(socket.id, 'test');
        };

        GameServer.prototype.onAuthorize = function (socket, isSuccess) {
            //todo: avtorizebuli uzeri magidaze.
        };

        GameServer.prototype.onDisconnect = function (socket) {
        };

        GameServer.prototype.onMsg = function (socket, text) {
            //if(text.Code != undefined && text.Code==1)
            this.sendToGroup('test', 'msg', text);
        };

        GameServer.Start = function (port) {
            return new GameServer().listen(port);
        };
        return GameServer;
    })(ServerEngine.JokServer);

    GameServer.Start(3000);
});
//# sourceMappingURL=GameServer.js.map
