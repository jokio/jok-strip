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
            this.on(Game.MessageType.KeyboardOption, this.onKeyboardOptionCome);
            this.on(Game.MessageType.BadChar, this.onBadChar);
            this.on(Game.MessageType.RestartState, this.onRestartCall);
            this.on(Game.MessageType.FirstState, this.onFirstStateCall);
            this.on(Game.MessageType.State, this.onStateCome);
            this.on(Game.MessageType.GameEnd, this.onGameEndCall);
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
            this.sendCommand(Game.MessageType.C_UserChar, char);
        };
        GameClient.prototype.onKeyboardOptionCome = function (data) {
            console.log(data);
            this.gameState = Game.GameState.Whaiting;

            //keyboard option
            this.keyboarOption = data;
        };
        GameClient.prototype.onBadChar = function (data) {
            console.log('Dasamatebelia');
            console.log(data);
        };

        GameClient.prototype.onRestartCall = function (msg) {
            this.changePlayerState(msg);

            //clear current state
            //canvas
            this.synchronizeCanvasObject();
            //canvas
        };
        GameClient.prototype.changePlayerState = function (msg) {
            console.log(msg);

            //todo dasamtavrebelia rom umtkivneulod amoiRos :)
            this.mState = (msg.state[0].userId == window["userid"]) && msg.state ? msg.state[0] : msg.state[1];
            this.fState = (msg.state[0].userId == window["userid"] && msg.state) ? msg.state[1] : msg.state[0];
            if (this.fState) {
                this.fState.time = this.fState.time && this.fState.time > 0 ? Math.floor(this.fState.time / 1000) : Game.GameTable.TIMEOUTTICK / 1000;
            }
            this.mState.time = this.mState.time && this.mState.time > 0 ? Math.floor(this.mState.time / 1000) : Game.GameTable.TIMEOUTTICK / 1000;
        };

        GameClient.prototype.onFirstStateCall = function (msg) {
            this.changePlayerState(msg);

            //first run full state
            this.gameState = Game.GameState.Running;
            this.drawAllow = false;

            //'გთხოვთ, დაელოდოთ მეორე მოთამაშეს.'
            this.firstDrawScreen(this.mState.proverbState);
            this.RestartGame();
        };

        GameClient.prototype.onStateCome = function (msg) {
            this.changePlayerState(msg);

            if (this.mState.helpkeys)
                for (var k in this.mState.helpkeys) {
                    //test
                    var element = document.getElementById('btn' + this.mState.helpkeys[k]);
                    element.style.visibility = "hidden";
                    element.style.position = "fixed";
                }
            this.drawAllow = true;
            this.animateWhile();
        };

        GameClient.prototype.onGameEndCall = function (msg) {
            this.changePlayerState(msg);

            if (this.mState.helpkeys)
                for (var k in this.mState.helpkeys) {
                    //test
                    var element = document.getElementById('btn' + this.mState.helpkeys[k]);
                    element.style.visibility = "hidden";
                    element.style.position = "fixed";
                }

            this.drawAllow = false;
            this.gameState = Game.GameState.Ended;

            //  this.drawScreen(Game.Codes.State, <string>this.mState.proverbState, <string> this.fState.proverbState);
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
        };

        GameClient.prototype.onMsg = function (msg) {
            console.log("aqar unda Semosuliyo");
        };

        GameClient.prototype.timerTick = function () {
            if (this.mState.time <= 0)
                this.mState.time = Game.GameTable.TIMEOUTTICK / 1000;
            if (this.fState.time <= 0)
                this.fState.time = Game.GameTable.TIMEOUTTICK / 1000;
            this.drawScreen();
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
            this.layer.draw();
        };

        GameClient.prototype.synchronizeCanvasObject = function () {
            console.log('5.1');
            this.gameState = Game.GameState.Running;
            this.updatePage();
            this.layer.removeChildren();
            this.chars = [];
            this.rects = [];
            this.firstDrawScreen(this.mState.proverbState);
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

                this.layer.draw();
                this.updatePage();
                if (Game.GameState.Ended == this.gameState) {
                    this.layer.clear();
                    for (var i = 0; i < this.chars.length; i++) {
                        this.chars[i].hide();
                        this.rects[i].hide();
                    }
                    this.pntext.setText('გთხოვთ დაელოდოთ მეორე მოთამაშეს!');
                    this.layer.draw();
                    console.log('4.3');
                    this.sendCommand(Game.MessageType.C_RestartRequest, "{RESTART}");
                    //todo -------
                } else {
                    console.log('4.5');
                    this.pntext.setText('გთხოვთ დაელოდოთ მეორე მოთამაშეს!');
                    this.layer.draw();
                    this.sendCommand(Game.MessageType.C_FirstGameStart, "{FirstState}");
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

        GameClient.prototype.gameEndDrawScreen = function (meText, frText) {
            this.drawAllow = true;
            this.drawScreen();
            this.drawAllow = false;
        };
        GameClient.prototype.firstDrawScreen = function (text) {
            var maxWidth = this.layer.getAttr('width');

            if (this.chars.length < 2) {
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
                var chararr = text.split('');
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
        };

        GameClient.prototype.drawScreen = function () {
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
