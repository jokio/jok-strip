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
            console.log(msg);

            if (msg.code == 3) {
                //keyboard option
                console.log(msg.data);
                this.keyboarOption = msg.data;
            }

            if (msg.code == 2) {
                //first run full state
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
                        //var ctx = this.context;
                        //ctx.fillStyle = '#ADD8E6';
                        //ctx.fillRect(10, 150, 580, 200);
                        //ctx.fillStyle = '#FFFFFF';
                        //this.mState.time--;
                        //this.fState.time--;
                        //if (this.mState.time <= 0)
                        //    this.mState.time = 10;
                        //if (this.fState.time <= 0)
                        //    this.fState.time = 10;
                        //ctx.fillText("თქვენი დრო:" + this.mState.time.toString() + "   სიცოცხლე:" + (100 - 100 * this.mState.incorect / this.mState.maxIncorrect).toString() + "%", 20, 160);
                        //ctx.fillText("მოწინააღმდეგის დრო:" + this.fState.time.toString() + "   სიცოცხლე:" + (100 - 100 * this.fState.incorect / this.fState.maxIncorrect).toString() + "%", 20, 190);
                    }, 1000);
            }
        };

        GameClient.prototype.drawScreen = function (code, text1, text2) {
            var maxWidth = this.layer.getAttr('width');

            if (code == 2) {
                //
                //clear ALL
                //
                //todo:gasatania globalur parametrebad
                var x = 5;
                var y = 5;

                var q = 5;
                var rectWidth = 40;
                var rectheight = 40;

                //loadorFullUpdate
                var chararr = text1.split('');
                for (var i = 0; i < chararr.length; i++) {
                    var rect = new Kinetic.Rect({
                        x: x,
                        y: y,
                        width: rectWidth,
                        height: rectheight,
                        stroke: 'white',
                        strokeWidth: 2
                    });
                    var char = new Kinetic.Text({
                        x: x,
                        y: y + 10,
                        text: chararr[i],
                        fontSize: 24,
                        fontFamily: 'Calibri',
                        width: rect.getWidth(),
                        align: 'center',
                        fill: 'black'
                    });

                    this.chars.push(char);
                    this.rects.push(rect);
                    this.layer.add(char);
                    this.layer.add(rect);
                    console.log((x + rectWidth + q).toString() + "  -" + i + "-  " + maxWidth);
                    if (x + rectWidth + 2 * q > maxWidth) {
                        x = 0 - rectWidth;
                        y = q + y + rectheight;
                    }
                    x = x + rectWidth + q;
                }
                this.layer.draw();
            }
            if (code == 10) {
                //ctx.fillStyle = '#ADD8E6';
                //ctx.fillRect(10, 150, 580, 200);
                //ctx.fillStyle = '#FFFFFF';
                //ctx.fillText(text1, 20, 160);
            }
            //if (code == 1) {
            //    //Semovida
            //    ctx.fillStyle = '#ADD8E6';
            //    ctx.fillRect(0, 0, 600, 400);
            //    ctx.lineWidth = 2;
            //    ctx.fillStyle = '#FFFFFF';
            //    var arr = text1.split('');
            //    var j = 0, i = 0;
            //    var ti = 0, tj = 0;
            //    for (i = 0; i < arr.length; i++) {
            //        // ctx.strokeStyle = '#FFFFFF';
            //        if (x + w > 600 - q) { // თუ კობი გარეთ ხვდება
            //            x = q;
            //            y = q + y + h; // კუბის ჩაწევა
            //        }
            //        if (ti * (w + q) + 13 > 600) {
            //            tj++;
            //            ti = 0;
            //        }
            //        // if (text1.charAt(i) == Game.GameTable.XCHAR) {
            //        //if (text2.charAt(i) == Game.GameTable.XCHAR)
            //        ctx.strokeStyle = '#FFFFFF';
            //        //else
            //        //   ctx.strokeStyle = '#ECA6A6';
            //        if (text2.charAt(i) != Game.GameTable.XCHAR && text1.charAt(i) != text2.charAt(i)) {
            //            console.log(text1);
            //            console.log(text2);
            //            ctx.strokeStyle = '#21A527';
            //        }
            //        if (Game.GameTable.IsChar(text1.charAt(i), this.keyboarOption)
            //            || text1.charAt(i) == Game.GameTable.XCHAR)
            //            ctx.strokeRect(x, y, w, h);
            //        x = x + w + q;
            //        ctx.fillText(arr[i], ti * (w + q) + 13, 8 + (h + q) * tj);
            //        ti++;
            //    }
            //  }
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

    var w = window;

    GameClient.Start('ws://localhost:3000/?token=' + w.userid);
});
//# sourceMappingURL=GameClient.js.map
