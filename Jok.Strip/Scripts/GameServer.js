/// <reference path="JokServerEngine.ts" />
/// <reference path="Game.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'JokServerEngine', 'Game'], function(require, exports, __ServerEngine__, __Game__) {
    var ServerEngine = __ServerEngine__;
    var Game = __Game__;

    ;

    var GameServer = (function (_super) {
        __extends(GameServer, _super);
        function GameServer() {
            _super.call(this);
            this.Tables = {};
            this.on('connect', this.onConnect);
            this.on('authorize', this.onAuthorize);
            this.on('disconnect', this.onDisconnect);
            this.on('msg', this.onMsg);
        }
        GameServer.prototype.onConnect = function (socket) {
            //todo Sesacvlelia!
            this.groups.add(socket.id, 'test');
        };

        GameServer.prototype.onAuthorize = function (socket, isSuccess) {
            var _this = this;
            if (!isSuccess)
                return;

            //+ მაგიდა რომელზეც მხოლოდ ერთი მოთამაშეა და დაემატოს.
            //bug: საპოვნელია ეს მოთამაშე ხომ არაა უკვე სხვა მაგიდაზეც!
            var TabelID = -1;
            for (var key in this.Tables) {
                if (Object.keys(this.Tables[key].users).length != 2) {
                    TabelID = key;
                    break;
                }
            }
            if (TabelID < 0) {
                TabelID = Math.abs(Math.random() * 10000000);
                this.Tables[TabelID] = new Game.GameTable(function (data) {
                    _this.sendToGroup(TabelID, 'msg', data);
                });
            }
            this.Tables[TabelID].join(socket.id);
            socket.table = this.Tables[TabelID];
        };

        GameServer.prototype.onDisconnect = function (socket) {
            this.Tables[socket.table.TabelID].leave(socket.id);
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
