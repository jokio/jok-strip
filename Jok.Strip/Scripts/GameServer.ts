/// <reference path="JokServerEngine.ts" />
/// <reference path="Game.ts" />

import ServerEngine = require('JokServerEngine');


export interface ISocket {
    id: string;
    userid: string;
    sendCommand(cmd: string, data: any);
    table: Game.GameTable;
};

class GameServer extends ServerEngine.JokServer {
    
     Tables: {
            [tableId: string]:
                Game.GameTable;
            
        } = {};


    constructor() {
        super();
        this.on('connect', this.onConnect);
        this.on('authorize', this.onAuthorize);
        this.on('disconnect', this.onDisconnect);
        this.on('msg', this.onMsg);
    }


    onConnect(socket: ISocket) {
        //todo Sesacvlelia!
    this.groups.add(socket.id, 'test');
    }
    

    onAuthorize(socket:ISocket, isSuccess:boolean) {
        //todo: avtorizebuli uzeri magidaze.        

        if (!isSuccess)
            return;
        //+ მაგიდა რომელზეც მხოლოდ ერთი მოთამაშეა და დაემატოს. 
        //bug: საპოვნელია ეს მოთამაშე ხომ არაა უკვე სხვა მაგიდაზეც!
        
        var TabelID = -1;
        for (var key in this.Tables) {
            if (Object.keys(this.Tables[key].users).length != 2)
            {
                TabelID = key;
                break;
            }
        }
        if (TabelID<0)
        {
            TabelID = Math.abs(Math.random() * 10000000);
            this.Tables[TabelID] = new Game.GameTable((data: Game.IGameToClient) => {
                this.sendToGroup(TabelID, 'msg', data);
            });
           
        }
        this.Tables[TabelID].join(socket.id);
        socket.table = this.Tables[TabelID];
    }

    onDisconnect(socket: ISocket) {
        this.Tables[socket.table.TabelID].leave(socket.id);
       
    }

    onMsg(socket: ISocket, text) {
        //if(text.Code != undefined && text.Code==1) 
        this.sendToGroup('test', 'msg', text);
    }


    static Start(port: number) {
        return new GameServer().listen(port);
    }
}

GameServer.Start(3000);
