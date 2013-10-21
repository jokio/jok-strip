﻿/// <reference path="JokClientEngine.ts" />
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

    onMsg(msg: Game.IGameToClient) {
        console.log(msg);
        if (msg.code == Game.Codes.KeyboardOptionSend) {
            //keyboard option
            this.keyboarOption = <Game.KeyBoardOption>msg.data;
            return;
        }

        if (msg.code== Game.Codes.BadChar) {
            return;
        }

        this.mState = (msg.state[0].userId == <string> window["userid"]) && msg.state ? msg.state[0] : msg.state[1];
        this.fState = (msg.state[0].userId == <string>window["userid"] && msg.state) ? msg.state[1] : msg.state[0];

        if (msg.code == Game.Codes.FirstState) {
            //first run full state
            this.gameEnd = false;
            //'გთხოვთ, დაელოდოთ მეორე მოთამაშეს.'
            this.drawScreen(2, this.mState.proverbState, null);

        }

        //დასამატებელია არასწორი არასწორის დამატება.
        if (!this.gameEnd && (msg.code == Game.Codes.State || msg.code == Game.Codes.GameEnd)) {
            if (this.mState.helpkeys)
                for (var k in this.mState.helpkeys) {
                    document.getElementById('btn' + this.mState.helpkeys[k]).style.color = 'red';
                }
            if (this.fState) {
                this.fState.time = this.fState.time && this.fState.time > 0 ? Math.floor(this.fState.time / 1000) : Game.GameTable.TIMEOUTTICK / 1000;
            }

            this.drawScreen(msg.code, this.mState.proverbState, this.fState.proverbState);

            this.mState.time = this.mState.time && this.mState.time > 0 ? Math.floor(this.mState.time / 1000) : Game.GameTable.TIMEOUTTICK / 1000;
            if (msg.code == Game.Codes.GameEnd) {
                clearInterval(this.timerHendler);
                this.gameEnd = true;
                this.drawScreen(Game.Codes.State, <string>this.mState.proverbState, <string> this.fState.proverbState);
                this.drawScreen(msg.code, "თამაში დასრულებულია", null);
                return;
            }
            if (this.timerHendler == -1)
                this.timerHendler = setInterval(() => {
                    this.mState.time--;
                    this.fState.time--;
                    if (this.mState.time <= 0)
                        this.mState.time = Game.GameTable.TIMEOUTTICK/1000;
                    if (this.fState.time <= 0)
                        this.fState.time = Game.GameTable.TIMEOUTTICK / 1000;
                    //ctx.fillText("თქვენი დრო:" + this.mState.time.toString() + "   სიცოცხლე:" + (100 - 100 * this.mState.incorect / this.mState.maxIncorrect).toString() + "%", 20, 160);
                    //ctx.fillText("მოწინააღმდეგის დრო:" + this.fState.time.toString() + "   სიცოცხლე:" + (100 - 100 * this.fState.incorect / this.fState.maxIncorrect).toString() + "%", 20, 190);
                    this.drawScreen(null, null, null);
                }, 1000);
        }

    }
    //--CANVAS
    stage: Kinetic.Stage;
    layer: Kinetic.Layer;
    rects: Kinetic.Rect[] = [];
    chars: Kinetic.Text[] = [];
    drawScreen(code?: Game.Codes, text1?: string, text2?: string) {

        if (code == null) {
            //drawState
           // console.log(1.1);
            if (!(!this.gameEnd&&this.mState && this.fState && this.fState.proverbState && this.mState.proverbState))
                return;
           // console.log(1.2);
           // this.layer.clear();
            var chars = this.mState.proverbState.split('');
           // console.log(1.3);
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

        var maxWidth: number = <number>this.layer.getAttr('width');
        ////--clear
        if (code == Game.Codes.FirstState && this.chars.length<2) {
           // console.log('2');
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
                if (x + rectWidth > maxWidth) { // თუ კობი გარეთ ხვდება
                    x = q;
                    y = q + y + rectheight; // კუბის ჩაწევა
                }
            }
           // console.log(2.2);
            this.layer.draw();
            return;
        }
        if (code == code.GameEnd) {
         //dasasruli // mogebuli unda vaCveno

        }
    }



    loadCanvas(): boolean {
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
