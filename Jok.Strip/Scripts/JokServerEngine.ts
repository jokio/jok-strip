
import http = require('http');
import events = require('events');
var engine = require('engine.io');


export class JokServer extends events.EventEmitter {

    private httpServer: http.Server;

    public engineServer;

    public groups = new GroupsAdapter();


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

            this.emit('connect', socket);

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
                this.groups.delAll(socket.id);
                this.emit('disconnect', socket);
            });
        });

        this.httpServer.listen(port, () => {
            console.log('[SERVER]:', 'http://localhost:' + port + '/');
        });

        return this;
    }

    sendToGroup(group, cmd, data) {
        this.groups.clients(group).forEach((value, index, array) => {
            if (this.engineServer.clients[value])
                this.engineServer.clients[value].sendCommand(cmd, data);
        });
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


export class GroupsAdapter {

    rooms = {};

    sids = {};

    add(id, room, fn?) {
        this.sids[id] = this.sids[id] || {};
        this.sids[id][room] = true;
        this.rooms[room] = this.rooms[room] || {};
        this.rooms[room][id] = true;
        if (fn) process.nextTick(fn.bind(null, null));
    }

    get(id, fn) {
        var adapter = this;
        if (fn) process.nextTick(function () {
            fn(null, adapter.sids[id] || null);
        });
    }

    del(id, room, fn?) {
        this.sids[id] = this.sids[id] || {};
        this.rooms[room] = this.rooms[room] || {};
        delete this.sids[id][room];
        if (this.rooms[room]) {
            delete this.rooms[room][id];
            if (!Object.keys(this.rooms[room]).length) {
                delete this.rooms[room];
            }
        }
        if (fn) process.nextTick(fn.bind(null, null));
    }

    delAll(id) {
        var room, rooms = this.sids[id];
        if (rooms) {
            for (room in rooms) {
                this.del(id, room);
            }
        }
        delete this.sids[id];
    }

    broadcast(data, opts, clients) {
        var rooms = opts.rooms || [];
        var except = opts.except || [];
        var length = rooms.length;
        var ids = {};
        var socket;
        if (length) {
            for (var i = 0; i < length; i++) {
                var room = this.rooms[rooms[i]];
                if (!room) continue;
                for (var id in room) {
                    if (ids[id] || ~except.indexOf(id)) continue;
                    socket = clients[id];
                    if (socket) {
                        socket.write(data);
                        ids[id] = true;
                    }
                }
            }
        } else {
            for (var id in this.sids) {
                if (~except.indexOf(id)) continue;
                socket = clients[id];
                if (socket) socket.write(data);
            }
        }
    }

    clients(room, fn?) {
        var clients = Object.keys(this.rooms[room] || {});
        if (fn) process.nextTick(function () {
            fn(null, clients);
        });
        return clients;
    }
}
