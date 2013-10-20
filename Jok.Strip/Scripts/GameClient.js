/// <reference path="JokClientEngine.ts" />
/// <reference path="Game.ts" />
/// <reference path="typings/jquery.d.ts"/>
/// <reference path="typings/kinetic.d.ts"/>
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
            this.rects = [];
            this.chars = [];
            //repaint
            //--------------------
            this.drawTimerer = -1;
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
            if (msg.code == 3) {
                //keyboard option
                this.keyboarOption = msg.data;
                return;
            }

            if (msg.code == 200) {
                return;
            }

            this.mState = (msg.state[0].userId == window["userid"]) && msg.state ? msg.state[0] : msg.state[1];
            this.fState = (msg.state[0].userId == window["userid"] && msg.state) ? msg.state[1] : msg.state[0];

            if (msg.code == 2) {
                //first run full state
                this.gameEnd = false;

                //'გთხოვთ, დაელოდოთ მეორე მოთამაშეს.'
                this.drawScreen(2, this.mState.proverbState, null);
            }

            if (!this.gameEnd && (msg.code == 1 || msg.code == 10)) {
                if (this.mState.helpkeys)
                    for (var k in this.mState.helpkeys) {
                        document.getElementById('btn' + this.mState.helpkeys[k]).style.color = 'red';
                    }
                if (this.fState) {
                    this.fState.time = this.fState.time && this.fState.time > 0 ? Math.floor(this.fState.time / 1000) : 10;
                }

                this.drawScreen(msg.code, this.mState.proverbState, this.fState.proverbState);

                this.mState.time = this.mState.time && this.mState.time > 0 ? Math.floor(this.mState.time / 1000) : 10;
                if (msg.code == 10) {
                    clearInterval(this.timerHendler);
                    this.gameEnd = true;
                    this.drawScreen(1, this.mState.proverbState, this.fState.proverbState);
                    this.drawScreen(msg.code, "თამაში დასრულებულია", null);
                    return;
                }
                if (this.timerHendler == -1)
                    this.timerHendler = setInterval(function () {
                        _this.mState.time--;
                        _this.fState.time--;
                        if (_this.mState.time <= 0)
                            _this.mState.time = 10;
                        if (_this.fState.time <= 0)
                            _this.fState.time = 10;

                        //ctx.fillText("თქვენი დრო:" + this.mState.time.toString() + "   სიცოცხლე:" + (100 - 100 * this.mState.incorect / this.mState.maxIncorrect).toString() + "%", 20, 160);
                        //ctx.fillText("მოწინააღმდეგის დრო:" + this.fState.time.toString() + "   სიცოცხლე:" + (100 - 100 * this.fState.incorect / this.fState.maxIncorrect).toString() + "%", 20, 190);
                        _this.drawScreen(null, null, null);
                    }, 1000);
            }
        };

        GameClient.prototype.drawScreen = function (code, text1, text2) {
            if (code == null) {
                if (!(!this.gameEnd && this.mState && this.fState && this.fState.proverbState && this.mState.proverbState))
                    return;

                // console.log(1.2);
                // this.layer.clear();
                var chars = this.mState.proverbState.split('');

                for (var i = 0; i < chars.length; i++) {
                    if (this.fState.proverbState.charAt(i) != Game.GameTable.XCHAR && this.mState.proverbState.charAt(i) != this.fState.proverbState.charAt(i)) {
                        this.rects[i].setStroke('#21A527');
                    }
                    this.chars[i].setText(chars[i]);
                    this.layer.draw();
                }

                // console.log(1.4);
                return;
            }

            var maxWidth = this.layer.getAttr('width');

            if (code == 2 && this.chars.length < 2) {
                // console.log('2');
                //
                //clear ALL
                //
                //todo:gasatania globalur parametrebad
                var q = 5;
                var x = q;
                var y = q;
                var rectWidth = 40;
                var rectheight = 40;

                //loadorFullUpdate
                var chararr = text1.split('');
                for (var i = 0; i < chararr.length; i++) {
                    var rect = new Kinetic.Rect({
                        x: x + q,
                        y: y,
                        width: rectWidth,
                        height: rectheight,
                        stroke: 'white',
                        strokeWidth: 2
                    });

                    // console.log('2.1');
                    var char = new Kinetic.Text({
                        x: x + q,
                        y: y + q * 2,
                        text: chararr[i],
                        fontSize: 24,
                        fontFamily: 'Calibri',
                        width: rect.getWidth(),
                        align: 'center',
                        fill: 'black'
                    });

                    this.chars.push(char);
                    this.rects.push(rect);
                    this.layer.add(rect);
                    this.layer.add(char);
                    if (!Game.GameTable.IsChar(chararr[i], this.keyboarOption) && Game.GameTable.XCHAR != chararr[i]) {
                        rect.setOpacity(0);
                    }
                    x = x + (rectWidth + q);
                    if (x + rectWidth > maxWidth) {
                        x = q;
                        y = q + y + rectheight;
                    }
                }

                // console.log(2.2);
                this.layer.draw();
                return;
            }
            if (code == 10) {
                //        if (text2.charAt(i) != Game.GameTable.XCHAR && text1.charAt(i) != text2.charAt(i)) {
                //            console.log(text1);
                //            console.log(text2);
                //            ctx.strokeStyle = '#21A527';
                //        }
                //        if (Game.GameTable.IsChar(text1.charAt(i), this.keyboarOption)
                //            || text1.charAt(i) == Game.GameTable.XCHAR)
                //            ctx.strokeRect(x, y, w, h);
            }
        };

        GameClient.prototype.loadCanvas = function () {
            if (!this.isCanvasSupported())
                return false;

            //layer
            this.layer = new Kinetic.Layer({
                x: 0,
                y: 0,
                width: 780,
                height: 300
            });

            //stage
            this.stage = new Kinetic.Stage({
                container: 'canvasOne',
                width: 780,
                height: 330
            });
            this.stage.add(this.layer);
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

    //window['requestAnimFrame'] = (function () {
    //    //return window['requestAnimationFrame'] ||
    //    //    window['webkitRequestAnimationFrame'] ||
    //    //    window['mozRequestAnimationFrame'] ||
    //     return   function (callback) {
    //            window.setTimeout(callback, 200);
    //        };
    //})();
    var w = window;
    GameClient.Start('ws://localhost:3000/?token=' + w.userid);
});
//# sourceMappingURL=GameClient.js.map
