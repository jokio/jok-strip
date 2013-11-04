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
            this.on(Game.MessageType.C_RestartRequest, this.onRestartRequest);
            this.on(Game.MessageType.C_FirstGameStart, this.onFirstGameStart);
            this.on(Game.MessageType.C_UserChar, this.onUserCharSend);
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
            this.groups.add(socket.id, socket.userid);
            for (var key in this.Tables) {
                for (var ukey in this.Tables[key].users) {
                    if (this.Tables[key].users[ukey].state.userId == socket.userid) {
                        TabelID = key;
                        break;
                    }
                }
            }

            if (TabelID == -1) {
                for (var key in this.Tables) {
                    if (Object.keys(this.Tables[key].users).length != 2) {
                        TabelID = key;
                        break;
                    }
                }

                if (TabelID < 0) {
                    TabelID = Math.abs(Math.random() * 10000000);
                    this.Tables[TabelID] = new Game.GameTable(function (groupid, messageType, data) {
                        _this.sendToGroup(groupid == null ? TabelID.toString() : groupid, messageType, data);
                    });
                }
            }
            this.groups.add(socket.id, socket.userid);
            this.groups.add(socket.id, TabelID);
            socket.tabelid = TabelID;
            this.Tables[TabelID].join(socket.userid);
        };

        GameServer.prototype.onDisconnect = function (socket) {
            if (this.Tables[socket.tabelid])
                if (!this.Tables[socket.tabelid].leave(socket.userid)) {
                    delete this.Tables[socket.tabelid];
                    //todo dasamtavrebelia siebis amoReba da grupebidan waSla
                }
        };

        GameServer.prototype.onUserCharSend = function (socket, data) {
            console.log('server onUserCharSend' + data);
            if (this.Tables[socket.tabelid]) {
                this.Tables[socket.tabelid].UserCharSet(socket.userid, data);
            }
        };

        GameServer.prototype.onFirstGameStart = function (socket, data) {
            if (this.Tables[socket.tabelid]) {
                this.Tables[socket.tabelid].FirstGameStart(socket.userid);
            }
        };

        GameServer.prototype.onRestartRequest = function (socket, data) {
            if (this.Tables[socket.tabelid]) {
                this.Tables[socket.tabelid].UserRestartRequest(socket.userid);
            }
        };

        GameServer.prototype.onMsg = function (socket, text) {
            //todo: unda waiSalos
            console.log('aq ar unda Semovides   onMsg(socket: ISocket, text)');
            if (this.Tables[socket.tabelid]) {
                this.Tables[socket.tabelid].UserAction(socket.userid, text);
            }
        };

        GameServer.Start = function (port) {
            return new GameServer().listen(port);
        };
        return GameServer;
    })(ServerEngine.JokServer);

    GameServer.Start(process.env.PORT || 3000);
});
//# sourceMappingURL=GameServer.js.map
