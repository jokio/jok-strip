
/// <reference path="JokClientEngine.ts" />
/// <reference path="Game.ts" />
/// <reference path="../typings/jquery.d.ts"/>
/// <reference path="../typings/kinetic.d.ts"/>


import ClientEngine = require('JokClientEngine');
import Game = require('Game');

class GameClient extends ClientEngine.JokClient {
    
    constructor() {
        super();
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

        this.sendCommand(Game.MessageType.C_UserChar, char);
    }
    onKeyboardOptionCome(data: Game.KeyBoardOption) {
        console.log(data);
            this.gameState = Game.GameState.Whaiting;
            //keyboard option
            this.keyboarOption =data;      
    }
    onBadChar(data) {
        console.log('Dasamatebelia');
        console.log(data);
    }

    

    onRestartCall(msg:any) {
        this.changePlayerState(msg);
             //clear current state
            //canvas
            this.synchronizeCanvasObject();
            //canvas
    }
    changePlayerState(msg:any) {
        console.log(msg);
        //todo dasamtavrebelia rom umtkivneulod amoiRos :)
        this.mState = (msg.state[0].userId == <string> window["userid"]) && msg.state ? msg.state[0] : msg.state[1];
        this.fState = (msg.state[0].userId == <string>window["userid"] && msg.state) ? msg.state[1] : msg.state[0];
        if (this.fState) {
            this.fState.time = this.fState.time && this.fState.time > 0 ? Math.floor(this.fState.time / 1000) : Game.GameTable.TIMEOUTTICK / 1000;
        }
        this.mState.time = this.mState.time && this.mState.time > 0 ? Math.floor(this.mState.time / 1000) : Game.GameTable.TIMEOUTTICK / 1000;
    
    }

    onFirstStateCall(msg: any) {
        this.changePlayerState(msg);   
            //first run full state
            this.gameState = Game.GameState.Running;
            this.drawAllow = false;
            //'გთხოვთ, დაელოდოთ მეორე მოთამაშეს.'
            this.firstDrawScreen(this.mState.proverbState);
            this.RestartGame();
    }

    onStateCome(msg: any) {

        this.changePlayerState(msg)

        if (this.mState.helpkeys)
            for (var k in this.mState.helpkeys) {
                //test
                var element = document.getElementById('btn' + this.mState.helpkeys[k]);
                element.style.visibility = "hidden";
                element.style.position = "fixed";
            }
        this.drawAllow = true;
            this.animateWhile();
    }

    onGameEndCall(msg: any) {
        this.changePlayerState(msg);
        //დასამატებელია არასწორი არასწორის დამატება.
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
                $('#divKeyboard button').each(function (i, element: HTMLElement) {
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
            
    }

    onMsg(msg: Game.IGameToClient) {

        console.log("aqar unda Semosuliyo");
    }

    timerTick() {
        
            if (this.mState.time <= 0)
                this.mState.time = Game.GameTable.TIMEOUTTICK / 1000;
            if (this.fState.time <= 0)
                this.fState.time = Game.GameTable.TIMEOUTTICK / 1000;
            this.drawScreen();
            this.mState.time--;
            this.fState.time--;
        
        }

    updatePage() {
        var bt = $('#btnplayAgain')[0];
        this.drawAllow = true;
        bt.style['visibility'] = 'hidden';
        bt.style['position'] = 'absolute';
        console.log('5.2');
        $('#divKeyboard button').each(function (i, el: HTMLElement) {
            el.style['visibility'] = 'initial';
            el.style['position'] = 'initial';
        });
        this.layer.draw();
    }

    synchronizeCanvasObject() {
        console.log('5.1');
        this.gameState = Game.GameState.Running;
        this.updatePage();
        this.layer.removeChildren();
        this.chars = [];
        this.rects = [];
        this.firstDrawScreen(this.mState.proverbState);
        this.drawAllow = true;
        this.layer.draw();
    }

    public static getPercent(dec: number):number{

      return   Math.round(100 * Math.abs((1 - dec))); // /100 
    }
    RestartGame() {
        console.log('4.1');
        
        console.log('state:'+this.gameState);
        if (Game.GameState.Stoped != this.gameState) {
            console.log('4.2');
           
            this.layer.draw();
            this.updatePage();
            if (Game.GameState.Ended== this.gameState) {
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
                this.sendCommand(Game.MessageType.C_FirstGameStart ,"{FirstState}");
            }
        }
    }

    animateWhile() {
        clearTimeout(this.timerHendler);
        if (this.drawAllow) {
            this.timerTick();
            this.timerHendler = setTimeout(()=>this.animateWhile(), 1000);
        }
    }

    gameEndDrawScreen(meText: string, frText: string) {
        this.drawAllow = true;
        this.drawScreen();
        this.drawAllow = false;
    }
    firstDrawScreen(text:string) {
       
        var maxWidth: number = <number>this.layer.getAttr('width');
        ////--clear
        if (this.chars.length < 2) {
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
                if (x + rectWidth > maxWidth) { // თუ კობი გარეთ ხვდება
                    x = q;
                    y = q + y + rectheight; // კუბის ჩაწევა
                }
            }
            console.log(2.2);
            y = q + y + rectheight
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
    }
    //--CANVAS
    stage: Kinetic.Stage;
    layer: Kinetic.Layer;
    rects: Kinetic.Rect[] = [];
    chars: Kinetic.Text[] = [];
    pntext: Kinetic.Text;
    drawScreen() {
      
            console.log('1.0');
            if (!this.drawAllow)
                return;
             console.log(1.1);
            if (!(this.gameState==Game.GameState.Running&& this.mState && this.fState && this.fState.proverbState && this.mState.proverbState)) {
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
          
            this.pntext.setText('თქვენ სიცოცხლე: ' + GameClient.getPercent(this.mState.incorect / this.mState.maxIncorrect) + '%    დარჩენილი დრო: ' + this.mState.time + '\r\n' + ' მოწინააღმდეგე სიცოცხლე: ' + GameClient.getPercent(this.fState.incorect / this.fState.maxIncorrect) + ' %    დარჩენილი დრო: ' + this.fState.time)
            console.log('1.4.4');
             this.layer.draw();
            console.log(1.4);
       
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
 drawAllow = false;
keyboarOption: Game.KeyBoardOption;
gameState= Game.GameState.Stoped;
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
