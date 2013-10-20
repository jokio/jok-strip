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

    onMsg(msg: Game.IGameToClient) {
        console.log(msg);

        if (msg.code == 3) {
            //keyboard option
            console.log(msg.data);
            this.keyboarOption = <Game.KeyBoardOption>msg.data;
        }

        if (msg.code == 2) {
            //first run full state
            this.gameEnd = false;
            this.drawScreen(2, 'გთხოვთ დაელოდოთ მეორე მოთამაშეს', null);

        }

        //დასამატებელია არასწორი არასწორის დამატება.
        if (!this.gameEnd && (msg.code == 1 || msg.code == 10)) {

            this.mState = (msg.state[0].userId == <string> window["userid"]) ? msg.state[0] : msg.state[1];
            this.fState = (msg.state[0].userId == <string>window["userid"]) ? msg.state[1] : msg.state[0];

            if (this.mState.helpkeys)
                for (var k in this.mState.helpkeys) {
                    document.getElementById('btn' + this.mState.helpkeys[k]).style.color = 'red';
                }
            this.fState.time = this.fState.time && this.fState.time > 0 ? Math.floor(this.fState.time / 1000) : 10;

            // ftext.innerHTML = fr.proverbState;
            // fans.innerHTML = fr.helpkeys.join(', ');

            this.drawScreen(<number>msg.code, <string>this.mState.proverbState, <string> this.fState.proverbState);

            this.mState.time = this.mState.time && this.mState.time > 0 ? Math.floor(this.mState.time / 1000) : 10;
            // mtext.innerHTML = me.proverbState;
            //   mans.innerHTML = me.helpkeys.join(', ');
            // mans.innerHTML = (100 - 100*me.incorect / me.maxIncorrect).toString() + "%";
            if (msg.code == 10) {
                clearInterval(this.timerHendler);
                this.gameEnd = true;
                this.drawScreen(1, <string>this.mState.proverbState, <string> this.fState.proverbState);

                this.drawScreen(msg.code, "თამაში დასრულებულია", null);


                //ftime.innerHTML = "თამაში დასრულებულია";
                return;
            }
            if (this.timerHendler == -1)
                this.timerHendler = setInterval(() => {
                    var ctx = this.context;
                    ctx.fillStyle = '#ADD8E6';
                    ctx.fillRect(10, 150, 580, 200);
                    ctx.fillStyle = '#FFFFFF';
                    this.mState.time--;
                    this.fState.time--;
                    if (this.mState.time <= 0)
                        this.mState.time = 10;
                    if (this.fState.time <= 0)
                        this.fState.time = 10;
                    ctx.fillText("თქვენი დრო:" + this.mState.time.toString() + "   სიცოცხლე:" + (100 - 100 * this.mState.incorect / this.mState.maxIncorrect).toString() + "%", 20, 160);
                    ctx.fillText("მოწინააღმდეგის დრო:" + this.fState.time.toString() + "   სიცოცხლე:" + (100 - 100 * this.fState.incorect / this.fState.maxIncorrect).toString() + "%", 20, 190);

                }, 1000);



        }

    }
    //--CANVAS
    drawScreen(code: number, text1?: string, text2?: string) {
        
        var ctx = this.context;
        var x = 5; var y = 5;
        var w = 30; var h = 30;
        var q = 5;
        //--clear
        ctx.fillStyle = '#FFFFFF';

        if (code == 2 || code == 10) {
            ctx.fillStyle = '#ADD8E6';
            ctx.fillRect(10, 150, 580, 200);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(text1, 20, 160);

        }

        if (code == 1) {
            //Semovida

            ctx.fillStyle = '#ADD8E6';
            ctx.fillRect(0, 0, 600, 400);
            ctx.lineWidth = 2;
            ctx.fillStyle = '#FFFFFF';
            var arr = text1.split('');


            var j = 0, i = 0;
            var ti = 0, tj = 0;
            for (i = 0; i < arr.length; i++) {
                // ctx.strokeStyle = '#FFFFFF';
                if (x + w > 600 - q) { // თუ კობი გარეთ ხვდება
                    x = q;
                    y = q + y + h; // კუბის ჩაწევა
                }


                if (ti * (w + q) + 13 > 600) {
                    tj++;
                    ti = 0;
                }
                // if (text1.charAt(i) == Game.GameTable.XCHAR) {
                //if (text2.charAt(i) == Game.GameTable.XCHAR)
                ctx.strokeStyle = '#FFFFFF';
                //else 
                //   ctx.strokeStyle = '#ECA6A6';

                if (text2.charAt(i) != Game.GameTable.XCHAR && text1.charAt(i) != text2.charAt(i)) {
                    console.log(text1);
                    console.log(text2);
                    ctx.strokeStyle = '#21A527';
                }
                if (Game.GameTable.IsChar(text1.charAt(i), this.keyboarOption)
                    || text1.charAt(i) == Game.GameTable.XCHAR)
                    ctx.strokeRect(x, y, w, h);

                x = x + w + q;
                ctx.fillText(arr[i], ti * (w + q) + 13, 8 + (h + q) * tj);
                ti++;
            }
        }

    }
    theCanvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    loadCanvas(): boolean {
        if (!this.isCanvasSupported())
            return false;

        this.theCanvas = <HTMLCanvasElement> document.getElementById("canvasOne");
        this.context = this.theCanvas.getContext('2d');

        this.context.fillStyle = '#ADD8E6';
        this.context.fillRect(0, 0, 600, 400);
        this.context.font = '20px Arial';
        this.context.textBaseline = 'top';
    }

    isCanvasSupported(): boolean {
        //droebit MODERNIZE
        Game.UserState
        var elem = <HTMLCanvasElement> document.createElement('canvasOne');
        return true;//!!(elem.getContext && elem.getContext('2d'));
    }
    //--------------------
    keyboarOption: Game.KeyBoardOption;
    gameEnd: boolean;
    mState: Game.UserState;
    fState: Game.UserState;
    timerHendler: number = -1;
    static Start(url): any {
        return new GameClient().connect(url);
    }
}





var w: any = window;

GameClient.Start('ws://localhost:3000/?token=' + w.userid);
