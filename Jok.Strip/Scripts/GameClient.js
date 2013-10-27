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
            this.drawAllow = false;
            this.gameState = Game.GameState.Stoped;
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

        GameClient.prototype.sendChar = function (char) {
            this.sendCommand("msg", { code: Game.Codes.C_UserChar, data: char });
        };

        GameClient.prototype.onMsg = function (msg) {
            console.log(msg);
            if (msg.code == Game.Codes.KeyboardOptionSend) {
                this.gameState = Game.GameState.Whaiting;

                //keyboard option
                this.keyboarOption = msg.data;
                return;
            }

            if (msg.code == Game.Codes.BadChar) {
                return;
            }
            this.mState = (msg.state[0].userId == window["userid"]) && msg.state ? msg.state[0] : msg.state[1];
            this.fState = (msg.state[0].userId == window["userid"] && msg.state) ? msg.state[1] : msg.state[0];
            if (this.fState) {
                this.fState.time = this.fState.time && this.fState.time > 0 ? Math.floor(this.fState.time / 1000) : Game.GameTable.TIMEOUTTICK / 1000;
            }
            this.mState.time = this.mState.time && this.mState.time > 0 ? Math.floor(this.mState.time / 1000) : Game.GameTable.TIMEOUTTICK / 1000;
            if (msg.code == Game.Codes.RestartState) {
                //clear current state
                //canvas
                this.synchronizeCanvasObject();
                //canvas
            }
            if (msg.code == Game.Codes.FirstState) {
                //first run full state
                this.gameState = Game.GameState.Running;
                this.drawAllow = false;

                //'გთხოვთ, დაელოდოთ მეორე მოთამაშეს.'
                this.drawScreen(Game.Codes.FirstState, this.mState.proverbState, null);
                this.RestartGame();
            }

            if (this.gameState == Game.GameState.Running && (msg.code == Game.Codes.State || msg.code == Game.Codes.GameEnd)) {
                if (this.mState.helpkeys)
                    for (var k in this.mState.helpkeys) {
                        //test
                        var element = document.getElementById('btn' + this.mState.helpkeys[k]);
                        element.style.visibility = "hidden";
                        element.style.position = "fixed";
                    }
                console.log('0.0.1');
                this.drawScreen(msg.code, null, null);
                console.log('0.0.2');

                if (msg.code == Game.Codes.GameEnd) {
                    this.drawAllow = false;
                    this.gameState = Game.GameState.Ended;
                    this.drawScreen(Game.Codes.State, this.mState.proverbState, this.fState.proverbState);

                    //ღილაკების დამალვა.
                    $('#divKeyboard button').each(function (i, element) {
                        element.style["visibility"] = "hidden";
                        element.style['position'] = 'absolute';
                    });

                    //კიდევ ვითამაშოს გამოჩენა
                    var bt = $('#btnplayAgain')[0];
                    bt.style['visibility'] = 'visible';
                    bt.style['position'] = 'initial';

                    //მოგებულის გამოჩენა
                    this.drawAllow = false;
                    var winner = Game.GameTable.IsWinner(this.mState, this.fState) ? this.mState : this.fState;
                    this.pntext.setText('გამარჯვებულია: ' + winner.userId);
                    this.layer.draw();
                    return;
                }
                console.log('0.0.3');
                console.log(this.timerHendler);
            }
            if (msg.code == Game.Codes.State) {
                this.drawAllow = true;
                this.animateWhile();
            }
        };

        GameClient.prototype.timerTick = function () {
            if (this.mState.time <= 0)
                this.mState.time = Game.GameTable.TIMEOUTTICK / 1000;
            if (this.fState.time <= 0)
                this.fState.time = Game.GameTable.TIMEOUTTICK / 1000;
            this.drawScreen(null, null, null);
            this.mState.time--;
            this.fState.time--;
        };

        GameClient.prototype.updatePage = function () {
            var bt = $('#btnplayAgain')[0];
            this.drawAllow = true;
            bt.style['visibility'] = 'hidden';
            bt.style['position'] = 'absolute';
            console.log('5.2');
            $('#divKeyboard button').each(function (i, el) {
                el.style['visibility'] = 'initial';
                el.style['position'] = 'initial';
            });
            this.layer.clear();
        };

        GameClient.prototype.synchronizeCanvasObject = function () {
            console.log('5.1');
            this.gameState = Game.GameState.Running;
            this.updatePage();
            this.layer.removeChildren();
            this.chars = [];
            this.rects = [];

            this.drawScreen(Game.Codes.FirstState, this.mState.proverbState, null);
            this.drawAllow = true;
            this.layer.draw();
        };

        GameClient.getPercent = function (dec) {
            return Math.round(100 * Math.abs((1 - dec)));
        };
        GameClient.prototype.RestartGame = function () {
            console.log('4.1');

            console.log('state:' + this.gameState);
            if (Game.GameState.Stoped != this.gameState) {
                console.log('4.2');
                this.pntext.setText('');
                this.layer.draw();
                this.updatePage();
                if (Game.GameState.Ended == this.gameState) {
                    this.layer.clear();
                    console.log('4.3');
                    this.sendCommand("msg", { code: Game.Codes.C_RestartRequest });
                } else {
                    console.log('4.5');
                    this.pntext.setText('გთხოვთ დაელოდოთ მეორე მოთამაშეს!');
                    this.layer.draw();
                    this.sendCommand('msg', { code: Game.Codes.C_FirstGameStart });
                }
            }
        };

        GameClient.prototype.animateWhile = function () {
            var _this = this;
            clearTimeout(this.timerHendler);
            if (this.drawAllow) {
                this.timerTick();
                this.timerHendler = setTimeout(function () {
                    return _this.animateWhile();
                }, 1000);
            }
        };

        GameClient.prototype.drawScreen = function (code, text1, text2) {
            if (code == null) {
                console.log('1.0');
                if (!this.drawAllow)
                    return;
                console.log(1.1);
                if (!(this.gameState == Game.GameState.Running && this.mState && this.fState && this.fState.proverbState && this.mState.proverbState)) {
                    console.log('test. Ar unda Semovides. 1.1.2');
                    return;
                }
                console.log(1.2);

                // this.layer.clear();
                var chars = this.mState.proverbState.split('');
                console.log(1.3);
                for (var i = 0; i < chars.length; i++) {
                    if (this.fState.proverbState.charAt(i) != Game.GameTable.XCHAR && this.mState.proverbState.charAt(i) != this.fState.proverbState.charAt(i)) {
                        this.rects[i].setStroke('#21A527');
                    }
                    this.chars[i].setText(chars[i]);
                }

                //todo: optimizacia max incoreqtze Sesazlebelia!
                console.log('1.4.3');

                //RENDER
                this.pntext.setText('თქვენ სიცოცხლე: ' + GameClient.getPercent(this.mState.incorect / this.mState.maxIncorrect) + '%    დარჩენილი დრო: ' + this.mState.time + '\r\n' + ' მოწინააღმდეგე სიცოცხლე: ' + GameClient.getPercent(this.fState.incorect / this.fState.maxIncorrect) + ' %    დარჩენილი დრო: ' + this.fState.time);
                console.log('1.4.4');
                this.layer.draw();
                console.log(1.4);
                return;
            }

            var maxWidth = this.layer.getAttr('width');

            if (code == Game.Codes.FirstState && this.chars.length < 2) {
                console.log('2');

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
                    console.log('2.1');
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
                console.log(2.2);
                y = q + y + rectheight;
                this.pntext = new Kinetic.Text({
                    x: q,
                    y: y + q * 2,
                    text: '',
                    fontSize: 16,
                    fontFamily: 'Calibri',
                    width: maxWidth,
                    align: 'center',
                    fill: 'black'
                });
                this.layer.add(this.pntext);

                //    this.layer.draw(); ar daixatos pirvelad Sesvlisas
                return;
            }
            if (code == Game.Codes.GameEnd) {
                //dasasruli // mogebuli unda vaCveno
                this.drawScreen(null, null, null);
                //გამოვიტანოთ ვინ გაიმარჯვა
                //გამოვითანოთ ხელახლა თამაშის ღილაკი
            }
        };

        GameClient.prototype.loadCanvas = function () {
            if (!this.isCanvasSupported())
                return false;
            if (this.layer == null || this.stage == null) {
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
            }
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
