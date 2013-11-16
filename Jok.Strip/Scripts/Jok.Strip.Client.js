/// <reference path="~/Scripts/Common/kinetic-v4.4.3.js"/>

var Game = {};
//Enum
Game.States = {
    Started: "Started",
    New: "New",
    Finished: "Finished",
    StartedWaiting: "StartedWaiting"
};
Object.freeze(Game.States);

Game.TIMEOUTTICK = 3000;
//Object.freeze(Game.TIMEOUTTICK);

Game.XCHAR = '•';
//Object.freeze(Game.XCHAR);


Game.getPercent =function (dec) {
    return Math.round(100 * Math.abs((1 - dec)));
};

Game.isWinner = function (fUser, sUser) {
    if (fUser.proverbState.indexOf(Game.XCHAR) < 0)
        return true;
    if (sUser.proverbState.indexOf(Game.XCHAR) < 0)
        return false;
    return fUser.incorect < sUser.incorect;
};

//-Class Template

function KeyboardOption (){
        this.From=1;
        this.To = 1;
    }
function PlayerState (){
    this.time = 1;
    this.UserID = 1;
    this.helpkeys = [];
    this.proverbState = '';
    this.incorect = 0;
    this.maxIncorrect = 0;
}

var proxy = new GameHub('GameHub', window.userid, '');

var This = {
    UserID:0,
    stage: {},//new Kinetic.Stage()
    layer: {},//new Kinetic.Layer()
    rects: new Array(),//new Kinetic.Rect[0] 
    chars: new Array(),//new Kinetic.Text[0]
    pntext: {},//Kinetic.Text
    drawAllow: false,
    keyboardOption: new KeyboardOption,
    gameState: Game.States.New,
    mState: new PlayerState(),
    fState: new PlayerState(),
    timerHendler: -1,
};
// -------- Sida funqciebi

This.IsChar=  function (schar) {
    return schar ? (schar.length == 1 && schar.toLowerCase().charCodeAt(0)
        >= this.keyboardOption.From && this.keyboardOption.To
        >= schar.toLowerCase().charCodeAt(0)) : false;
};

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
        width: 780,
        height: 330,
        container: 'canvasOne'
    });
    this.stage.add(this.layer);
    
    return true;
};

This.drawScreen = function() {
    console.log('1.0');
    if (!this.drawAllow)
        return;
    console.log('1.1');
    if (!(this.gameState == Game.States.Started &&
        this.mState && this.fState)) {
        console.log('test. Ar unda Semovides. 1.1.2');
        return;
    }
    console.log('1.2');

    var tmpchars = this.mState.proverbState.split('');
    console.log('1.3');
    for (var i = 0; i < tmpchars.length; i++) {
        if (this.fState.proverbState.charAt(i) != Game.XCHAR &&
            this.mState.proverbState.charAt(i) !=
                this.fState.proverbState.charAt(i)) {
                this.rects[i].setStroke('#21A527');
        }
        this.chars[i].setText(tmpchars[i]);
    }
    this.pntext.setText('თქვენ სიცოცხლე: ' +
        Game.getPercent(this.mState.incorect / this.mState.maxIncorrect) +
        '%    დარჩენილი დრო: ' + this.mState.time + '\r\n' +
        ' მოწინააღმდეგე სიცოცხლე: ' + Game.getPercent(this.fState.incorect /
        this.fState.maxIncorrect) + ' %    დარჩენილი დრო: ' + this.fState.time);
    console.log('1.4.4');
    this.layer.draw();
    console.log('1.4.5');
};

This.timerTick = function() {
    if (this.mState.time <= 0)
        this.mState.time = Game.TIMEOUTTICK / 1000;
    if (this.fState.time <= 0)
        this.fState.time = Game.TIMEOUTTICK / 1000;
    this.drawScreen();
    this.mState.time--;
    this.fState.time--;};

This.animateWhile = function() {
    clearTimeout(this.timerHendler);
    if (this.drawAllow) {
        this.timerTick();
        this.timerHendler = setTimeout(function() {
            This.animateWhile();
        }, 1000);
    }
};

This.gameEndDrawScreen = function() {
    this.drawAllow = true;
    this.drawScreen();
    this.drawAllow = false;
};

This.firstDrawScreen = function(text) {
    var maxWidth = this.layer.getAttr('width');
    console.log('2.0' + maxWidth);
    //---Clear
    if (this.layer) {
        this.layer.removeChildren();
        this.layer.draw();
    }
    

    if (this.gameState== Game.States.New || this.gameState==Game.States.Finished) {
        console.log('2.1');
        var q = 5;
        var x = q;
        var y = q;
        var rectWidth = 40;
        var rectheight = 40;
        var chararr = text.split('');
        for (var i = 0; i < chararr.length; i++) {
            var rect = new Kinetic.Rect({
                x: x + q,
                y: y,
                width: rectWidth,
                height: rectheight,
                stroke: 'white',
                strokeWidth: 2
            });
            console.log('2.1{i}-' + i);
            var char = new Kinetic.Text({
                x: x + q,
                y: y + q * 2,
                text: chararr[i],
                fontSize: 24,
                fontFamily: 'Calibri',
                width: rect.getWidth(),
                align: 'center',
                fill: 'black'
            });
            this.chars.push(char);
            this.rects.push(rect);
            this.layer.add(rect);
            this.layer.add(char);
            if (!this.IsChar(chararr[i]) && Game.XCHAR != chararr[i]) {
                rect.setOpacity(0);
            }
            x = x + (rectWidth + q);
            if (x + rectWidth > maxWidth) {
                x = q;
                y = q + y + rectheight;
            }
        }
        console.log('2.3');
        y = q + y + rectheight;
        this.pntext = new Kinetic.Text({
            x: q,
            y: y + q * 2,
            text: '',
            fontSize: 16,
            fontFamily: 'Calibri',
            width: maxWidth,
            align: 'center',
            fill: 'black'
        });
        
        this.layer.add(this.pntext);
        this.layer.draw();
    }
};

This.updatePage = function() {
    var bt = $('#btnplayAgain')[0];
   // this.drawAllow = true;
    bt.style['visibility'] = 'hidden';
    bt.style['position'] = 'absolute';
    console.log('5.2');
    $('#divKeyboard button').each(function(i, el) {
        el.style['visibility'] = 'initial';
        el.style['position'] = 'initial';
    });
   // this.layer.draw();

};

This.synchronizeCanvasObject = function() {
    console.log('5.1');
    this.gameState = Game.States.New;
    this.updatePage();
    this.layer.removeChildren();
    this.chars = [];
    this.rects = [];
   // this.firstDrawScreen(this.mState.proverbState);
    this.layer.draw();
};

This.restartGame = function () {
    if (Game.States.Started == this.gameState)
        return;
    console.log('4.1');

    console.log('state:' + this.gameState);
    
        console.log('4.2');
    
        this.updatePage();
        if (Game.States.Finished == this.gameState) {
            this.layer.clear();
            for (var i = 0; i < this.chars.length; i++) {
                this.chars[i].hide();
                this.rects[i].hide();
            }
            this.pntext.setText('გთხოვთ დაელოდოთ მეორე მოთამაშეს!');
            this.layer.draw();
            console.log('4.3');
            proxy.send('Restart', 1);
        } else {
            console.log('4.5');
            this.pntext = new Kinetic.Text({
                x: 10,
                y: 100,
                text: '',
                fontSize: 16,
                fontFamily: 'Calibri',
                width: this.layer.getAttr('width'),
                align: 'center',
                fill: 'black'
            });
            this.pntext.setText('გთხოვთ დაელოდოთ მეორე მოთამაშეს!');
            this.layer.add(this.pntext);
            this.layer.draw();
         
        }
    
};

This.changePlayerState = function(arrPl) {
    this.mState = (arrPl[0].UserID == this.UserID) ? arrPl[0] : arrPl[1];
    this.fState = (arrPl[0].UserID == this.UserID) ? arrPl[1] : arrPl[0];
    if (this.fState) {
        this.fState.time = this.fState.time && this.fState>0? 
             Math.floor(this.fState.time / 1000) :
            Game.TIMEOUTTICK / 1000;
    }
    this.mState.time = this.mState.time && this.mState.time > 0 ?
        Math.floor(this.mState.time / 1000) : Game.TIMEOUTTICK / 1000;
};

This.playerState = function (arrPl) {
    this.changePlayerState(arrPl);
    if (this.gameState == Game.States.New) {
        this.firstDrawScreen(this.mState.proverbState);
        //todo aqedan unda gavitano.
        this.gameState = Game.States.Started;
        this.drawAllow = true;
    } else {
      
        this.animateWhile();
    }
    if(this.mState.helpkeys)
        for (var k in this.mState.helpkeys) {
            var element = document.getElementById('btn' + this.mState.helpkeys[k]);
            element.style.visibility = "hidden";
            element.style.position = "fixed";
        }
    
};

This.gameEndCall = function() {
   
        for (var k in this.mState.helpkeys) {
            var element = document.getElementById('btn' + this.mState.helpkeys[k]);
            element.style.visibility = "hidden";
            element.style.position = "fixed";
        }
     //   this.drawAllow = false;
        this.gameState = Game.States.Finished;
    this.drawAllow = true;
        this.drawScreen(); //todo gasatestia
        $('#divKeyboard button').each(function (i, el) {
            el.style["visibility"] = "hidden";
            el.style['position'] = 'absolute';
        });
        var bt = $('#btnplayAgain')[0];
        bt.style['visibility'] = 'visible';
        bt.style['position'] = 'initial';
        this.drawAllow = false;
        
        var winner = Game.isWinner(this.mState, this.fState) ? this.mState : this.fState;
        this.pntext.setText('გამარჯვებულია: ' + winner.UserID);
        this.layer.draw();
    
};
//-------

This.sendChar = function(kchar) {
    proxy.send('SetChar', kchar);
};
//game event
proxy.on('KeyOptions', function (keybrOption) {

    console.log("KeyOptions->", keybrOption);
    This.keyboardOption = keybrOption;
  
});

proxy.on('RestartGame', function () {

   // This.restartGame();
    This.synchronizeCanvasObject();
});

proxy.on('GameEnd', function(winnerid) {
    //todo Set new state
    This.gameState = Game.States.Finished;
    This.gameEndCall();

});

proxy.on('PlayerState', function (plArr) {
    This.playerState(plArr);
});

proxy.on('Online', function () {
    console.log('server is online');
    This.loadCanvas();
    This.gameState = Game.States.New;
});

proxy.on('Offline', function () {
    console.log('server is offline');
});

proxy.on('UserAuthenticated', function (UserID) {

    proxy.send('IncomingMethod', 'someParam');

    This.UserID = UserID;

});

proxy.on('Pong', function (str,strb) {
    console.log('aqamdec movida:' + str+strb);
});

proxy.on('SomeCallback', function (i) {
    
});

proxy.start();