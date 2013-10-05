/// <reference path="Game.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'JokClientEngine'], function(require, exports, __ClientEngine__) {
    var ClientEngine = __ClientEngine__;
    

    var GameClient = (function (_super) {
        __extends(GameClient, _super);
        function GameClient() {
            var _this = this;
            _super.call(this);

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
        GameClient.prototype.onConnect = function () {
            console.log('connected');
        };

        GameClient.prototype.onAuthorize = function (info) {
            console.log('authorize info', info);

            if (info.isSuccess) {
                this.sendCommand('ping');
            }
        };

        GameClient.prototype.onDisconnect = function () {
            console.log('disconnected');
        };

        GameClient.Start = function (url) {
            return new GameClient().connect(url);
        };
        return GameClient;
    })(ClientEngine.JokClient);

    GameClient.Start('ws://localhost:3000/');
});
//# sourceMappingURL=GameClient.js.map
