

var proxy = new GameHub('GameHub', window.userid, '');

proxy.on('Online', function () {
    console.log('server is online');

});

proxy.on('Offline', function () {
    console.log('server is offline');
});

proxy.on('UserAuthenticated', function (userid) {

    proxy.send('IncomingMethod', 'someParam');

});

proxy.on('Pong', function (str,strb) {
    console.log('aqamdec movida:' + str+strb);
});

proxy.on('SomeCallback', function (i) {

});

proxy.start();