/// <reference path="JokClientEngine.ts" />
/// <reference path="Game.ts" />
/// <reference path="typings/jquery.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'JokClientEngine', 'Game'], function(require, exports, __ClientEngine__, __Game__) {
    var ClientEngine = __ClientEngine__;
    var Game = __Game__;

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
            this.loadCanvas();
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

            if (msg.code == 2) {
                //first run
                this.gameEnd = false;
                this.drawScreen(2, 'გთხოვთ დაელოდოთ მეორე მოთამაშეს', null);
            }

            if (!this.gameEnd && (msg.code == 1 || msg.code == 10)) {
                this.mState = (msg.state[0].userId == window["userid"]) ? msg.state[0] : msg.state[1];
                this.fState = (msg.state[0].userId == window["userid"]) ? msg.state[1] : msg.state[0];

                if (this.mState.helpkeys)
                    for (var k in this.mState.helpkeys) {
                        document.getElementById('btn' + this.mState.helpkeys[k]).style.color = 'red';
                    }
                this.fState.time = this.fState.time && this.fState.time > 0 ? Math.floor(this.fState.time / 1000) : 10;

                // ftext.innerHTML = fr.proverbState;
                // fans.innerHTML = fr.helpkeys.join(', ');
                this.drawScreen(msg.code, this.mState.proverbState, this.fState.proverbState);

                this.mState.time = this.mState.time && this.mState.time > 0 ? Math.floor(this.mState.time / 1000) : 10;

                if (msg.code == 10) {
                    clearInterval(this.timerHendler);
                    this.gameEnd = true;
                    this.drawScreen(1, this.mState.proverbState, this.fState.proverbState);

                    this.drawScreen(msg.code, "თამაში დასრულებულია", null);

                    //ftime.innerHTML = "თამაში დასრულებულია";
                    return;
                }
                if (this.timerHendler == -1)
                    this.timerHendler = setInterval(function () {
                        var ctx = _this.context;
                        ctx.fillStyle = '#888888';
                        ctx.fillRect(10, 150, 580, 200);
                        ctx.fillStyle = '#FFFFFF';
                        _this.mState.time--;
                        _this.fState.time--;
                        if (_this.mState.time <= 0)
                            _this.mState.time = 10;
                        if (_this.fState.time <= 0)
                            _this.fState.time = 10;
                        ctx.fillText("თქვენი დრო:" + _this.mState.time.toString() + "   სიცოცხლე:" + (100 - 100 * _this.mState.incorect / _this.mState.maxIncorrect).toString() + "%", 20, 160);
                        ctx.fillText("მოწინააღმდეგის დრო:" + _this.fState.time.toString() + "   სიცოცხლე:" + (100 - 100 * _this.fState.incorect / _this.fState.maxIncorrect).toString() + "%", 20, 190);
                    }, 1000);
            }
        };

        //--CANVAS
        GameClient.prototype.drawScreen = function (code, text1, text2) {
            var ctx = this.context;
            var x = 5;
            var y = 5;
            var w = 30;
            var h = 30;
            var q = 5;

            //--clear
            ctx.fillStyle = '#FFFFFF';

            if (code == 2 || code == 10) {
                ctx.fillStyle = '#888888';
                ctx.fillRect(10, 150, 580, 200);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(text1, 20, 160);
            }

            if (code == 1) {
                //Semovida
                ctx.fillStyle = '#888888';
                ctx.fillRect(0, 0, 600, 400);
                ctx.lineWidth = 2;
                ctx.fillStyle = '#FFFFFF';
                var arr = text1.split('');

                var j = 0, i = 0;
                var ti = 0, tj = 0;
                for (i = 0; i < arr.length; i++) {
                    if (x + w > 600 - q) {
                        x = q;
                        y = q + y + h;
                    }
                    if (ti * (w + q) + 13 > 600) {
                        tj++;
                        ti = 0;
                    }
                    if (text1.charAt(i) == Game.GameTable.XCHAR) {
                        if (text2.charAt(i) == Game.GameTable.XCHAR)
                            ctx.strokeStyle = '#FFFFFF';
else
                            ctx.strokeStyle = '#ECA6A6';
                    } else if (text2.charAt(i) == Game.GameTable.XCHAR) {
                        ctx.strokeStyle = '#E2FFE2';
                    } else {
                        ctx.strokeStyle = '#EBE2FF';
                    }

                    ctx.strokeRect(x, y, w, h);
                    x = x + w + q;
                    ctx.fillText(arr[i], ti * (w + q) + 13, 8 + (h + q) * tj);
                    ti++;
                }
            }
        };

        GameClient.prototype.loadCanvas = function () {
            if (!this.isCanvasSupported())
                return false;

            this.theCanvas = document.getElementById("canvasOne");
            this.context = this.theCanvas.getContext('2d');

            this.context.fillStyle = '#888888';
            this.context.fillRect(0, 0, 600, 400);
            this.context.font = '20px Arial';
            this.context.textBaseline = 'top';
        };

        GameClient.prototype.isCanvasSupported = function () {
            //droebit MODERNIZE
            Game.UserState;
            var elem = document.createElement('canvasOne');
            return true;
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
