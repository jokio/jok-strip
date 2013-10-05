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

                _this.emit('connect', socket.emit);

                var sid = '';
                var ipaddress = '';
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
                    _this.emit('disconnect', socket);
                });
            });

            this.httpServer.listen(port, function () {
                console.log('[SERVER]:', 'http://localhost:' + port + '/');
            });

            return this;
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
        UserAuthorization.GetInfo = function (sid, ipaddress, cb) {
            setTimeout(function () {
                cb(true, 32);
            }, 1000);
        };
        return UserAuthorization;
    })();
    exports.UserAuthorization = UserAuthorization;
});
//# sourceMappingURL=ServerEngine.js.map
