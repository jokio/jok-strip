
import http = require('http');
import events = require('events');
var engine = require('engine.io');


export class JokServer extends events.EventEmitter {

    private httpServer: http.Server;

    public engineServer;


    listen(port: number) {
        this.httpServer = http.createServer(this.httpHandler);
        this.engineServer = engine.attach(this.httpServer);

        this.engineServer.on('connection', (socket) => {

            this.emit('connect', socket);

            var sid = '';
            var ipaddress = '';
            var channel = '';

            UserAuthorization.GetInfo(sid, ipaddress, (isSuccess, userid) => {

                if (socket.isClosed) return;

                socket.userid = userid;
                socket.channel = channel;

                socket.send({
                    cmd: 'authorize',
                    data: {
                        isSuccess: isSuccess,
                        userid: userid
                    }
                });

                this.emit('authorize', socket, isSuccess);
            });


            socket.on('message', (msg) => {

                if (!msg || !msg.cmd || !msg.data) {
                    return;
                }

                this.emit(msg.cmd, socket, msg.data);
            });

            socket.on('close', () => {
                socket.isClosed = true;
                this.emit('disconnect', socket);
            });
        });

        this.httpServer.listen(port, () => {
            console.log('[SERVER]:', 'http://localhost:' + port + '/');
        });

        return this;
    }

    private httpHandler(req, res) {
        res.end('Online Game Server (c) Jok Entertainment');
    }
}

export class UserAuthorization {
    static GetInfo(sid: string, ipaddress: string, cb: (isSuccess: boolean, userid: number) => void) {

        setTimeout(() => {

            cb(true, 32);

        }, 1000);
    }
}