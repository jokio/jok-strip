import events = require('Common/EventEmitter')

var global: any = window;

export class JokClient extends events.EventEmitter {

    socket;

    reconnectRetryCount = 0;

    logging: boolean;

    constructor() {
        super();

        global.gameClient = this;
    }


    connect(url: string) {
        this.reconnectRetryCount++;

        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket = null;
        }

        this.socket = new global.eio.Socket(url);

        this.socket.on('open', () => {
            this.reconnectRetryCount = 0;
            this.emit('connect', {});

            if (this.logging) {
                console.log('connected');
            }
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

            this.emit(command.cmd, command.data);

            if (this.logging) {
                console.log(command.cmd, command.data);
            }
        });

        this.socket.on('close', () => {
            this.emit('disconnect', {});

            if (this.logging) {
                console.log('disonnected');
            }
        });

        this.socket.on('error', (data) => {
            if (this.logging) {
                console.log('error', data);
            }
            setTimeout(() => this.connect(url), 1000);
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