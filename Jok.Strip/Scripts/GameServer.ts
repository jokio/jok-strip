/// <reference path="JokServerEngine.ts" />
/// <reference path="Game.ts" />

import ServerEngine = require('JokServerEngine');


export interface ISocket {
    id: string;
    userid: string;
    sendCommand(cmd: string, data: any);
    table: Game.GameTable;
};

class GameServer extends ServerEngine.JokServer{

    constructor() {
        super();
        this.on('connect', this.onConnect);
        this.on('authorize', this.onAuthorize);
        this.on('disconnect', this.onDisconnect);
        this.on('msg', this.onMsg);
    }


    onConnect(socket: ISocket) {
        
        this.groups.add(socket.id, 'test');
    }

    onAuthorize(socket:ISocket, isSuccess:boolean) {
        //todo: avtorizebuli uzeri magidaze.        
    }

    onDisconnect(socket: ISocket) {
    }

    onMsg(socket: ISocket, text: Game.IMessage) {
        //if(text.Code != undefined && text.Code==1) 
        this.sendToGroup('test', 'msg', text);
        
    }


    static Start(port: number) {
        return new GameServer().listen(port);
    }
}

GameServer.Start(3000);
