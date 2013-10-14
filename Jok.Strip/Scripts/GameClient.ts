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
        // $('#divChat').append(msg);
      //  console.log(msg);

        //-------- take elements
        var ftext = document.getElementById('lbFtext');
        var fans = document.getElementById('lbFans');
        var ftime = document.getElementById("lbFtime");
        var mtext = document.getElementById('lbMtext');
        var mtime = document.getElementById("lbMtime");
        var mans = document.getElementById('lbMans');

        if (msg.code == 2) {
            //first run
            this.gameEnd = false;
            mtime.innerHTML = 'გთხოვთ დაელოდოთ მეორე მოთამაშეს';

        }


        if (!this.gameEnd && (msg.code == 1 || msg.code == 10)) {

            var me =  (msg.state[0].userId == <string> window["userid"]) ? msg.state[0] : msg.state[1];
              var fr = (msg.state[0].userId == <string>window["userid"]) ? msg.state[1] : msg.state[0];


                   this.fTime = fr.time && fr.time > 0 ? Math.floor(fr.time / 1000) : 10;

                    ftext.innerHTML = fr.proverbState;
                     fans.innerHTML = fr.helpkeys.join(', ');



            this.mTime = 10; me.time && me.time > 0 ? Math.floor(me.time / 1000) : 10;
            mtext.innerHTML = me.proverbState;
            mans.innerHTML = me.helpkeys.join(', ');

            if (msg.code == 10) {
                clearInterval(this.timerHendler);
                this.gameEnd = true;
                mtime.innerHTML = "თამაში დასრულებულია";
               ftime.innerHTML = "თამაში დასრულებულია";
                return;
            }
           if(this.timerHendler==-1)
            this.timerHendler = setInterval(() => {
                this.mTime--;
               this.fTime--;
                if (this.mTime <= 0)
                    this.mTime = 10;
                if (this.fTime <= 0)
                    this.fTime = 10;
                ftime.innerHTML = this.fTime.toString();
                document.getElementById("lbMtime").innerHTML = this.mTime.toString();
            }, 1000);

        }


    }
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
