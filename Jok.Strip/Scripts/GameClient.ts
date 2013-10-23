/// <reference path="JokClientEngine.ts" />
/// <reference path="Game.ts" />
/// <reference path="typings/jquery.d.ts"/>
/// <reference path="typings/kinetic.d.ts"/>


import ClientEngine = require('JokClientEngine');
import Game = require('Game');

class GameClient extends ClientEngine.JokClient {
    
    constructor() {
        super();
        this.on('connect', this.onConnect);
        this.on('disconnect', this.onDisconnect);
        this.on('authorize', this.onAuthorize);
        this.on('msg', this.onMsg);
    }


    onConnect() {
        console.log('connected');
        //---- Install
        this.loadCanvas();
        //-----
    }

    onAuthorize(info) {
        console.log('authorize', info);

        if (info.isSuccess) {
            //todo;
        }
    }

    onDisconnect() {
        console.log('disconnected');
    }

    sendChar(char: string) {

        this.sendCommand("msg", { code: Game.Codes.C_UserChar, data: char });
    }

    onMsg(msg: Game.IGameToClient) {
        console.log(msg);
        if (msg.code == Game.Codes.KeyboardOptionSend) {
            //keyboard option
            this.keyboarOption = <Game.KeyBoardOption>msg.data;
            return;
        }

        if (msg.code == Game.Codes.BadChar) {
           
            return;
        }



        this.mState = (msg.state[0].userId == <string> window["userid"]) && msg.state ? msg.state[0] : msg.state[1];
        this.fState = (msg.state[0].userId == <string>window["userid"] && msg.state) ? msg.state[1] : msg.state[0];
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
            this.gameEnd = false;
            this.timerHendler = -1;
            //'გთხოვთ, დაელოდოთ მეორე მოთამაშეს.'
            this.drawScreen(Game.Codes.FirstState, this.mState.proverbState, null);

        }

        //დასამატებელია არასწორი არასწორის დამატება.
        if (!this.gameEnd && (msg.code == Game.Codes.State || msg.code == Game.Codes.GameEnd)) {
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
                clearInterval(this.timerHendler);
                this.gameEnd = true;
                this.drawScreen(Game.Codes.State, <string>this.mState.proverbState, <string> this.fState.proverbState);
                $('#divKeyboard button').each(function (i, element: HTMLElement) {
                    element.style["visibility"] = "hidden";
                    element.style['position'] = 'absolute';
                    
                });
                return;
            }
            console.log('0.0.3');
            console.log(this.timerHendler);
            if (this.timerHendler == -1)
                this.timerHendler = setInterval(()=>this.timerTick(), 1000);
        }

    }
    timerTick() {
        this.mState.time--;
        this.fState.time--;
        if (this.mState.time <= 0)
            this.mState.time = Game.GameTable.TIMEOUTTICK / 1000;
        if (this.fState.time <= 0)
            this.fState.time = Game.GameTable.TIMEOUTTICK / 1000;
        this.drawScreen(null, null, null);
    }

    updatePage() {
        var bt = $('#btnplayAgain')[0];

        bt.style['visibility'] = 'hidden';
        bt.style['position'] = 'absolute';
        console.log('5.2');
        $('#divKeyboard button').each(function (i, el: HTMLElement) {
            el.style['visibility'] = 'initial';
            el.style['position'] = 'initial';
        });
    }

    synchronizeCanvasObject() {
        console.log('5.1');
        this.gameEnd = false;
        this.updatePage();
        this.layer.removeChildren();
        this.chars = [];
        this.rects = [];
        this.drawScreen(Game.Codes.FirstState, this.mState.proverbState, null);
        clearInterval(this.timerHendler);
        this.timerHendler = setInterval(()=> { this.timerTick() }, 1000);;
    }

    RestartGame()
    {
        this.updatePage();
        if (this.gameEnd) {
            console.log('4.3');
            this.sendCommand("msg", { code: Game.Codes.C_RestartRequest });
        } else {
            console.log('4.5');
            this.sendCommand('msg', { code: Game.Codes.C_FirstGameStart });}
    }
    //--CANVAS
    stage: Kinetic.Stage;
    layer: Kinetic.Layer;
    rects: Kinetic.Rect[] = [];
    chars: Kinetic.Text[] = [];
    drawScreen(code?: Game.Codes, text1?: string, text2?: string) {

        if (code == null) {
            //drawState
             console.log(1.1);
            if (!(!this.gameEnd && this.mState && this.fState && this.fState.proverbState && this.mState.proverbState)) {
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
                    this.layer.draw();
            }

            console.log(1.4);
            return;
        }

        var maxWidth: number = <number>this.layer.getAttr('width');
        ////--clear
        if (code == Game.Codes.FirstState && this.chars.length<2) {
            console.log('2');
            //
            //clear ALL
            //
            //todo:gasatania globalur parametrebad
            var q = 5;
            var x = q; var y = q;
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
                if (x + rectWidth > maxWidth) { // თუ კობი გარეთ ხვდება
                    x = q;
                    y = q + y + rectheight; // კუბის ჩაწევა
                }
            }
            console.log(2.2);
            this.layer.draw();
            return;
        }
        if (code == Game.Codes.GameEnd) {
            //dasasruli // mogebuli unda vaCveno
            this.drawScreen(null, null, null);
        }
    }



    loadCanvas(): boolean {
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
      
       
    }

    isCanvasSupported(): boolean {
        //droebit MODERNIZE
        Game.UserState
        var elem = <HTMLCanvasElement> document.createElement('canvasOne');
        return true;//!!(elem.getContext && elem.getContext('2d'));
    }
    //repaint



    //-------------------- 
    drawTimerer = -1;
keyboarOption: Game.KeyBoardOption;
gameEnd: boolean;
mState: Game.UserState;
fState: Game.UserState;
timerHendler: number = -1;
    static Start(url): any {
    return new GameClient().connect(url);
    }
}


//window['requestAnimFrame'] = (function () {
//    //return window['requestAnimationFrame'] ||
//    //    window['webkitRequestAnimationFrame'] ||
//    //    window['mozRequestAnimationFrame'] ||
//     return   function (callback) {
//            window.setTimeout(callback, 200);
//        };
//})();
var w: any = window;
GameClient.Start('ws://localhost:3000/?token=' + w.userid);
