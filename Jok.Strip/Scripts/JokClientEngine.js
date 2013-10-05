define(["require", "exports"], function(require, exports) {
    

    var global = window;

    var JokClient = (function () {
        function JokClient() {
            this.reconnectRetryCount = 0;
            this.serverEvents = new global.EventEmitter();

            global.gameClient = this;
        }
        JokClient.prototype.connect = function (url) {
            var _this = this;
            this.reconnectRetryCount++;

            this.socket = new global.eio.Socket(url);

            this.socket.on('open', function () {
                _this.reconnectRetryCount = 0;
                _this.serverEvents.emit('connect', {});
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

                _this.serverEvents.emit(command.cmd, command.data);
            });

            this.socket.on('close', function () {
                _this.serverEvents.emit('disconnect', {});
                setTimeout(function () {
                    return _this.connect(url);
                }, 1000);
            });

            this.socket.on('error', function (data) {
                console.log('error', data);
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
    })();
    exports.JokClient = JokClient;
});
//# sourceMappingURL=JokClientEngine.js.map
