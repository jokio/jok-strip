var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'http', 'events'], function(require, exports, __http__, __events__) {
    var http = __http__;
    var events = __events__;
    var engine = require('engine.io');

    var JokServer = (function (_super) {
        __extends(JokServer, _super);
        function JokServer() {
            _super.apply(this, arguments);
            this.groups = new GroupsAdapter();
        }
        JokServer.prototype.listen = function (port) {
            var _this = this;
            this.httpServer = http.createServer(this.httpHandler);
            this.engineServer = engine.attach(this.httpServer);

            this.engineServer.on('connection', function (socket) {
                socket.sendCommand = function (cmd, data) {
                    if (typeof data === "undefined") { data = {}; }
                    socket.send(JSON.stringify({
                        cmd: cmd,
                        data: data
                    }));
                };

                _this.emit('connect', socket);

                var cookies = {};
                socket.request.headers.cookie && socket.request.headers.cookie.split(';').forEach(function (cookie) {
                    var parts = cookie.split('=');
                    cookies[parts[0].trim()] = (parts[1] || '').trim();
                });

                var sid = socket.request.query.token;
                var ipaddress = socket.request.connection.remoteAddress;
                var channel = '';

                UserAuthorization.GetInfo(sid, ipaddress, function (isSuccess, userid) {
                    if (socket.isClosed)
                        return;

                    socket.userid = userid;
                    socket.channel = channel;

                    socket.sendCommand('authorize', {
                        isSuccess: isSuccess,
                        userid: userid
                    });

                    _this.emit('authorize', socket, isSuccess);
                });

                socket.on('message', function (msg) {
                    try  {
                        var command = JSON.parse(msg);
                    } catch (err) {
                    }

                    if (!command || !command.cmd || !command.data) {
                        //console.log('[INVALID_MSG_RECEIVED]: ' + msg);
                        return;
                    }

                    _this.emit(command.cmd, socket, command.data);
                });

                socket.on('close', function () {
                    socket.isClosed = true;
                    _this.groups.delAll(socket.id);
                    _this.emit('disconnect', socket);
                });
            });

            this.httpServer.listen(port, function () {
                console.log('[SERVER]:', 'http://localhost:' + port + '/');
            });

            return this;
        };

        JokServer.prototype.sendToGroup = function (group, cmd, data) {
            var _this = this;
            this.groups.clients(group).forEach(function (value, index, array) {
                if (_this.engineServer.clients[value])
                    _this.engineServer.clients[value].sendCommand(cmd, data);
            });
        };

        JokServer.prototype.httpHandler = function (req, res) {
            res.end('Online Game Server (c) Jok Entertainment');
        };
        return JokServer;
    })(events.EventEmitter);
    exports.JokServer = JokServer;

    var UserAuthorization = (function () {
        function UserAuthorization() {
        }
        UserAuthorization.GetInfo = function (token, ipaddress, cb) {
            setTimeout(function () {
                cb(true, token);
            }, 1000);
        };
        return UserAuthorization;
    })();
    exports.UserAuthorization = UserAuthorization;

    var GroupsAdapter = (function () {
        function GroupsAdapter() {
            this.rooms = {};
            this.sids = {};
        }
        GroupsAdapter.prototype.add = function (id, room, fn) {
            this.sids[id] = this.sids[id] || {};
            this.sids[id][room] = true;
            this.rooms[room] = this.rooms[room] || {};
            this.rooms[room][id] = true;
            if (fn)
                process.nextTick(fn.bind(null, null));
        };

        GroupsAdapter.prototype.get = function (id, fn) {
            var adapter = this;
            if (fn)
                process.nextTick(function () {
                    fn(null, adapter.sids[id] || null);
                });
        };

        GroupsAdapter.prototype.del = function (id, room, fn) {
            this.sids[id] = this.sids[id] || {};
            this.rooms[room] = this.rooms[room] || {};
            delete this.sids[id][room];
            if (this.rooms[room]) {
                delete this.rooms[room][id];
                if (!Object.keys(this.rooms[room]).length) {
                    delete this.rooms[room];
                }
            }
            if (fn)
                process.nextTick(fn.bind(null, null));
        };

        GroupsAdapter.prototype.delAll = function (id) {
            var room, rooms = this.sids[id];
            if (rooms) {
                for (room in rooms) {
                    this.del(id, room);
                }
            }
            delete this.sids[id];
        };

        GroupsAdapter.prototype.broadcast = function (data, opts, clients) {
            var rooms = opts.rooms || [];
            var except = opts.except || [];
            var length = rooms.length;
            var ids = {};
            var socket;
            if (length) {
                for (var i = 0; i < length; i++) {
                    var room = this.rooms[rooms[i]];
                    if (!room)
                        continue;
                    for (var id in room) {
                        if (ids[id] || ~except.indexOf(id))
                            continue;
                        socket = clients[id];
                        if (socket) {
                            socket.write(data);
                            ids[id] = true;
                        }
                    }
                }
            } else {
                for (var id in this.sids) {
                    if (~except.indexOf(id))
                        continue;
                    socket = clients[id];
                    if (socket)
                        socket.write(data);
                }
            }
        };

        GroupsAdapter.prototype.clients = function (room, fn) {
            var clients = Object.keys(this.rooms[room] || {});
            if (fn)
                process.nextTick(function () {
                    fn(null, clients);
                });
            return clients;
        };
        return GroupsAdapter;
    })();
    exports.GroupsAdapter = GroupsAdapter;
});
//# sourceMappingURL=JokServerEngine.js.map
