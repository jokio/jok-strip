//Enum
var GameStates = {
    Started: "Started",
    New: "New",
    Finished: "Finished",
    StartedWaiting: "StartedWaiting"
};
Object.freeze(GameStates);
//-----------------

//-Class Template
function PlayerState (){
    this.Time = 1;
    this.UserId = 1;
    this.HelpKeys = [];
    this.ProverbState = '';
    this.Incorect = 0;
    this.MaxIncorrect = 0;
}

//--
var proxy = new GameHub('GameHub', window.userid, '');

//-------Cvladebi
var This = {
    stage: Kinetic.Stage,
    layer: Kinetic.Layer,
    rects: [],//Kinetic.Rect
    pntext: Kinetic.Text,
    drawAllow: false,
    keyboardOption: 'TMP',
    gameState: GameStates.New,
    mState: new PlayerState(),
    fState: new PlayerState(),
    timerHendler: -1,
};

//-------

// -------- Sida funqciebi
This.isCanvasSupported = function() {
    return true;
};

This.loadCanvas = function() {
    if (!this.isCanvasSupported())
        return false;
    if (!(this.layout == null || this.stage == null))
        return false;
    this.layer = new Kinetic.Layer({
        x: 0,
        y: 0,
        width: 780,
        height: 300
    });
    this.stage = new Kinetic.Stage({
        container: 'canvaseOne',
        width: 780,
        height: 330
    });
    this.stage.add(this.layer);
    
    return true;
};

This.drawScreen = function() {
    console.log('1.0');
    if (!this.drawAllow)
        return;
    console.log('1.1');
    if (!(this.gameState == GameStates.Started && this.mState && this.fstat)) {
        console.log('test. Ar unda Semovides. 1.1.2');
        return;
    }
    console.log('1.2');

    var chars = this.mState.proverbState.split('');


};
//-------
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