import events2 = require('events')

var global: any = window;

export class JokClient {

    serverEvents;

    socket;

    reconnectRetryCount = 0;


    constructor() {
        this.serverEvents = new global.EventEmitter();

        global.gameClient = this;
    }


    connect(url: string) {
        this.reconnectRetryCount++;

        this.socket = new global.eio.Socket(url);

        this.socket.on('open', () => {
            this.reconnectRetryCount = 0;
            this.serverEvents.emit('connect', {});
        });

        this.socket.on('message', (msg) => {

            try {
                var command = JSON.parse(msg);
            }
            catch (err) { }

            if (!command || !command.cmd || !command.data) {
                console.log('[INVALID_MSG_RECEIVED]: ' + msg);
                return;
            }

            this.serverEvents.emit.call(this, command.cmd, command.data);
        });

        this.socket.on('close', () => {
            this.serverEvents.emit('disconnect', {});
            setTimeout(() => this.connect(url), 1000);
        });

        this.socket.on('error', (data) => {
            console.log('error', data);
        });

        return this;
    }

    sendCommand(cmd, data = {}) {
        this.socket.send(JSON.stringify({
            cmd: cmd,
            data: data
        }));
    }

}