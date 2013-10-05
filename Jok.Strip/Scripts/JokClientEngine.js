var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'Common/EventEmitter'], function(require, exports, __events__) {
    var events = __events__;

    var global = window;

    var JokClient = (function (_super) {
        __extends(JokClient, _super);
        function JokClient() {
            _super.call(this);
            this.reconnectRetryCount = 0;

            global.gameClient = this;
        }
        JokClient.prototype.connect = function (url) {
            var _this = this;
            this.reconnectRetryCount++;

            this.socket = new global.eio.Socket(url);

            this.socket.on('open', function () {
                _this.reconnectRetryCount = 0;
                _this.emit('connect', {});
            });

            this.socket.on('message', function (msg) {
                try  {
                    var command = JSON.parse(msg);
                } catch (err) {
                }

                if (!command || !command.cmd || !command.data) {
                    console.log('[INVALID_MSG_RECEIVED]: ' + msg);
                    return;
                }

                _this.emit(command.cmd, command.data);
            });

            this.socket.on('close', function () {
                _this.emit('disconnect', {});
            });

            this.socket.on('error', function (data) {
                console.log('error', data);
                setTimeout(function () {
                    return _this.connect(url);
                }, 1000);
            });

            return this;
        };

        JokClient.prototype.sendCommand = function (cmd, data) {
            if (typeof data === "undefined") { data = {}; }
            this.socket.send(JSON.stringify({
                cmd: cmd,
                data: data
            }));
        };
        return JokClient;
    })(events.EventEmitter);
    exports.JokClient = JokClient;
});
//# sourceMappingURL=JokClientEngine.js.map
