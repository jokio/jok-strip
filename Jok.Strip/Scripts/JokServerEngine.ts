
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

            socket.sendCommand = function (cmd, data = {}) {
                socket.send(JSON.stringify({
                    cmd: cmd,
                    data: data
                }));
            }

            this.emit('connect', socket.emit);

            var sid = '';
            var ipaddress = '';
            var channel = '';

            UserAuthorization.GetInfo(sid, ipaddress, (isSuccess, userid) => {

                if (socket.isClosed) return;

                socket.userid = userid;
                socket.channel = channel;

                socket.sendCommand('authorize', {
                    isSuccess: isSuccess,
                    userid: userid
                });

                this.emit('authorize', socket, isSuccess);
            });


            socket.on('message', (msg) => {

                try {
                    var command = JSON.parse(msg);
                }
                catch (err) { }

                if (!command || !command.cmd || !command.data) {
                    //console.log('[INVALID_MSG_RECEIVED]: ' + msg);
                    return;
                }

                this.emit(command.cmd, socket, command.data);
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