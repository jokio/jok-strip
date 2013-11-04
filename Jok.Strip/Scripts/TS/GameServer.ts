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
        this.on(Game.MessageType.C_RestartRequest, this.onRestartRequest);
        this.on(Game.MessageType.C_FirstGameStart,this.onFirstGameStart);
        this.on(Game.MessageType.C_UserChar, this.onUserCharSend);
    }


    onConnect(socket: ISocket) {
        //todo Sesacvlelia!

        this.groups.add(socket.id, 'test');
    }


    onAuthorize(socket: ISocket, isSuccess: boolean) {
        //todo: avtorizebuli uzeri magidaze.        

        if (!isSuccess)
            return;
        //+ მაგიდა რომელზეც მხოლოდ ერთი მოთამაშეა და დაემატოს. 
        //bug: საპოვნელია ეს მოთამაშე ხომ არაა უკვე სხვა მაგიდაზეც!



        var TabelID = -1;
        this.groups.add(socket.id, socket.userid);
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
                this.Tables[TabelID] = new Game.GameTable((groupid: string, messageType: string, data:any) => {
                    this.sendToGroup(groupid == null ? TabelID.toString() : groupid, messageType, data);
                });
            }
        }
        this.groups.add(socket.id, socket.userid);
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

    onUserCharSend(socket: ISocket, data) {
        console.log('server onUserCharSend' + data);
        if (this.Tables[socket.tabelid]) {
            this.Tables[socket.tabelid].UserCharSet(socket.userid, data);
        }
    }

    onFirstGameStart(socket: ISocket, data) {
        //data not needed
        if (this.Tables[socket.tabelid]) {
            this.Tables[socket.tabelid].FirstGameStart(socket.userid);
        }
    
    }

    onRestartRequest(socket: ISocket, data) {
        //data not needed
        if (this.Tables[socket.tabelid]) {
            this.Tables[socket.tabelid].UserRestartRequest(socket.userid);
        }
    }

    onMsg(socket: ISocket, text) {
        //todo: unda waiSalos
        console.log('aq ar unda Semovides   onMsg(socket: ISocket, text)');
        if (this.Tables[socket.tabelid]) {
            this.Tables[socket.tabelid].UserAction(socket.userid,text);
        }
    }


    static Start(port: number) {
        return new GameServer().listen(port);
    }
}

GameServer.Start(process.env.PORT || 3000);
