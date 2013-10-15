/// <reference path="JokClientEngine.ts" />
/// <reference path="Game.ts" />
/// <reference path="typings/jquery.d.ts"/>
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
            _super.call(this);
            this.timerHendler = -1;

            this.on('connect', this.onConnect);
            this.on('disconnect', this.onDisconnect);
            this.on('authorize', this.onAuthorize);
            this.on('msg', this.onMsg);
        }
        GameClient.prototype.onConnect = function () {
            console.log('connected');
            //---- Install
            //-----
        };

        GameClient.prototype.onAuthorize = function (info) {
            console.log('authorize', info);

            if (info.isSuccess) {
                //todo;
            }
        };

        GameClient.prototype.onDisconnect = function () {
            console.log('disconnected');
        };

        GameClient.prototype.onMsg = function (msg) {
            var _this = this;
            console.log(msg);

            // $('#divChat').append(msg);
            //  console.log(msg);
            //-------- take elements
            var ftext = document.getElementById('lbFtext');
            var fans = document.getElementById('lbFans');
            var ftime = document.getElementById("lbFtime");
            var mtext = document.getElementById('lbMtext');
            var mtime = document.getElementById("lbMtime");
            var mans = document.getElementById('lbMans');

            if (msg.code == 2) {
                //first run
                this.gameEnd = false;
                mtime.innerHTML = 'გთხოვთ დაელოდოთ მეორე მოთამაშეს';
            }

            if (!this.gameEnd && (msg.code == 1 || msg.code == 10)) {
                var me = (msg.state[0].userId == window["userid"]) ? msg.state[0] : msg.state[1];
                var fr = (msg.state[0].userId == window["userid"]) ? msg.state[1] : msg.state[0];

                if (me.helpkeys)
                    for (var k in me.helpkeys) {
                        document.getElementById('btn' + me.helpkeys[k]).style.color = 'red';
                    }
                this.fTime = fr.time && fr.time > 0 ? Math.floor(fr.time / 1000) : 10;

                ftext.innerHTML = fr.proverbState;
                fans.innerHTML = fr.helpkeys.join(', ');

                this.mTime = me.time && me.time > 0 ? Math.floor(me.time / 1000) : 10;
                mtext.innerHTML = me.proverbState;

                //   mans.innerHTML = me.helpkeys.join(', ');
                mans.innerHTML = (100 - 100 * me.incorect / me.maxIncorrect).toString() + "%";
                if (msg.code == 10) {
                    clearInterval(this.timerHendler);
                    this.gameEnd = true;
                    mtime.innerHTML = "თამაში დასრულებულია";
                    ftime.innerHTML = "თამაში დასრულებულია";
                    return;
                }
                if (this.timerHendler == -1)
                    this.timerHendler = setInterval(function () {
                        _this.mTime--;
                        _this.fTime--;
                        if (_this.mTime <= 0)
                            _this.mTime = 10;
                        if (_this.fTime <= 0)
                            _this.fTime = 10;
                        ftime.innerHTML = _this.fTime.toString();
                        document.getElementById("lbMtime").innerHTML = _this.mTime.toString();
                    }, 1000);
            }
        };

        GameClient.Start = function (url) {
            return new GameClient().connect(url);
        };
        return GameClient;
    })(ClientEngine.JokClient);

    var w = window;

    GameClient.Start('ws://localhost:3000/?token=' + w.userid);
});
//# sourceMappingURL=GameClient.js.map
