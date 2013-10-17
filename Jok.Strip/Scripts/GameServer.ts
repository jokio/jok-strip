/// <reference path="JokServerEngine.ts" />
/// <reference path="Game.ts" />

import ServerEngine = require('JokServerEngine');
import Game = require('Game');

export interface ISocket {
    id: string;
    userid: string;
    sendCommand(cmd: string, data: any);
  
    tabelid;
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
            for (var ukey in this.Tables[key].users) {
                if (this.Tables[key].users[ukey].state.userId == socket.userid) {
                    TabelID = key;
                    break;
                }
            }
        }

        if (TabelID == -1) {
            for (var key in this.Tables) {
                if (Object.keys(this.Tables[key].users).length != 2) {
                TabelID = key;
                break;
            }
        }

            if (TabelID < 0) {
            TabelID = Math.abs(Math.random() * 10000000);
            this.Tables[TabelID] = new Game.GameTable((data: Game.IGameToClient) => {
                this.sendToGroup(TabelID, 'msg', data);
            });
            }
        }
           
        this.groups.add(socket.id, TabelID);
        socket.tabelid = TabelID;
        this.Tables[TabelID].join(socket.userid);
       
    }

    onDisconnect(socket: ISocket) {
        if (this.Tables[socket.tabelid])

            //delete Tabel active user not exist,
            if (!this.Tables[socket.tabelid].leave(socket.userid)) {
                delete this.Tables[socket.tabelid];
                //todo dasamtavrebelia siebis amoReba da grupebidan waSla
            }
      
    }

    onMsg(socket: ISocket, text) {
        //if(text.Code != undefined && text.Code==1) 
        if (this.Tables[socket.tabelid]) {
            this.Tables[socket.tabelid].UserAction(socket.userid,text);
        }
       // this.sendToGroup('test', 'msg', socket.tabelid);
    }


    static Start(port: number) {
        return new GameServer().listen(port);
    }
}

GameServer.Start(process.env.PORT || 3000);
