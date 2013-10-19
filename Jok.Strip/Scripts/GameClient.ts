/// <reference path="JokClientEngine.ts" />
/// <reference path="Game.ts" />
/// <reference path="typings/jquery.d.ts"/>

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

        if (msg.code == 2) {
            //first run
            this.gameEnd = false;
          this.drawScreen(2,'გთხოვთ დაელოდოთ მეორე მოთამაშეს',null);

        }

        //დასამატებელია არასწორი არასწორის დამატება.
        if (!this.gameEnd && (msg.code == 1 || msg.code == 10)) {

            var me =  (msg.state[0].userId == <string> window["userid"]) ? msg.state[0] : msg.state[1];
              var fr = (msg.state[0].userId == <string>window["userid"]) ? msg.state[1] : msg.state[0];

            if(me.helpkeys)
                for (var k in me.helpkeys) {
                    document.getElementById('btn' + me.helpkeys[k]).style.color = 'red';
            }
                   this.fTime = fr.time && fr.time > 0 ? Math.floor(fr.time / 1000) : 10;

            // ftext.innerHTML = fr.proverbState;
            // fans.innerHTML = fr.helpkeys.join(', ');

            this.drawScreen(msg.code, me.proverbState, fr.proverbState);

            this.mTime = me.time && me.time > 0 ? Math.floor(me.time / 1000) : 10;
           // mtext.innerHTML = me.proverbState;
            //   mans.innerHTML = me.helpkeys.join(', ');
           // mans.innerHTML = (100 - 100*me.incorect / me.maxIncorrect).toString() + "%";
            if (msg.code == 10) {
                clearInterval(this.timerHendler);
                this.gameEnd = true;
               // mtime.innerHTML = "თამაში დასრულებულია";
               //ftime.innerHTML = "თამაში დასრულებულია";
                return;
            }
           if(this.timerHendler==-1)
               this.timerHendler = setInterval(() => {
                   var ctx = this.context;
                   ctx.fillStyle = '#888888';
                   ctx.fillRect(10, 150, 580, 200);
                   ctx.fillStyle = '#FFFFFF';
                this.mTime--;
               this.fTime--;
                if (this.mTime <= 0)
                    this.mTime = 10;
                if (this.fTime <= 0)
                    this.fTime = 10;
                   ctx.fillText("თქვენი დრო:"+this.mTime.toString(), 20, 160);
                   ctx.fillText("მოწინააღმდეგის დრო" + this.fTime.toString(), 20, 190);
              
            }, 1000);

            
        }

    }
    //--CANVAS
    drawScreen(code:number,text1?:string,text2?:string) {
        var ctx = this.context;
        var x = 5; var y = 5;
        var w = 30; var h = 30;
        var q = 5;
//--clear
        ctx.fillStyle = '#888888';
        ctx.fillRect(0, 0, 600, 400);
        ctx.font = '20px Arial';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#FFFFFF';
        if (code == 2) {
            ctx.fillText(text1, 20, 160);
        }
        
        

        if (code==1) {
           
            ctx.lineWidth = 2;
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
                if (text1.charAt(i) == Game.GameTable.XCHAR) {
                    if (text2.charAt(i) == Game.GameTable.XCHAR)
                        ctx.strokeStyle = '#FFFFFF';
                    else 
                        ctx.strokeStyle = '#ECA6A6';
                } else
                    if (text2.charAt(i) == Game.GameTable.XCHAR) {
                        ctx.strokeStyle = '#E2FFE2';
                    }
                    else {

                        ctx.strokeStyle = '#EBE2FF';
                    }
                
                ctx.strokeRect(x, y, w, h);
                x = x + w + q;
                ctx.fillText(arr[i], ti * (w + q) + 13, 8 + (h + q) * tj);
                ti++;
            }
        }

    }
    theCanvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    loadCanvas():boolean {
        if (!this.isCanvasSupported())
            return false;
        this.theCanvas =<HTMLCanvasElement> document.getElementById("canvasOne");
        this.context = this.theCanvas.getContext('2d');
    }
    
    isCanvasSupported(): boolean {
    //droebit MODERNIZE
        var elem = <HTMLCanvasElement> document.createElement('canvasOne');
        return true;//!!(elem.getContext && elem.getContext('2d'));
}
    //--------------------
   
    gameEnd:boolean;
    fTime: number;
    mTime: number;
    timerHendler: number=-1;
    static Start(url): any {
        return new GameClient().connect(url);
    }
}





var w: any = window;

GameClient.Start('ws://localhost:3000/?token=' + w.userid);
