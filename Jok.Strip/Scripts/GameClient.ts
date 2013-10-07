/// <reference path="JokClientEngine.ts" />
/// <reference path="Game.ts" />
/// <reference path="typings/jquery.d.ts"/>

import ClientEngine = require('JokClientEngine');

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
        $('#btnChat').on('click', () => {
            var $msg = $('#inpchat'); 
            
            this.sendCommand('msg', { Code: 1, Value: $msg.val() });
            $msg.val("");
        });
     //-----
    }

    onAuthorize(info) {
        console.log('authorize', info);
        
        if (info.isSuccess) {
            this.sendCommand('ping');
        }
    }

    onDisconnect() {
        console.log('disconnected');
    }

    onMsg(text:Game.IMessage) {
        $('#divChat').append(text.Value);
        console.log(text);
    }


    static Start(url) {
        return new GameClient().connect(url);
    }
}




   


GameClient.Start('ws://localhost:3000/');
