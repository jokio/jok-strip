/// <reference path="~/Scripts/Common/kinetic-v4.4.3.js"/>

//class tamplate
function KeyboardOption() {
    this.From = 1;
    this.To = 1;
}

function PlayerState() {
    this.time = 1;
    this.UserID = 1;
    this.helpkeys = [];
    this.proverbState = '';
    this.incorect = 0;
}

//Enum
var Table = {};
Table.States = {
    Started: 1,
    New: 0,
    Finished: 3,
    StartedWaiting: 2
};
Object.freeze(Table.States);


var Game = {
    proxy: new GameHub('GameHub', jok.config.sid, jok.config.channel),

    XCHAR: '•',
    MaxIncorrect:10,
    TIMEOUTTICK: 15000,

    Init: function () {

        this.proxy.on('Online', this.Online.bind(this));
        this.proxy.on('Offline', this.Offline.bind(this));
        this.proxy.on('UserAuthenticated', this.UserAuthenticated.bind(this));
        this.proxy.on('TableState', this.TableState.bind(this));
        this.proxy.on('SetCharResult', this.SetCharResult.bind(this));
        this.proxy.start();
        $(document).on('ready', this.onLoad.bind(this));
        $('.play_again').on('click', this.onPlayAgain.bind(this));
    },
    //todo
    SetCharResult:function(helpkeys, proverb, time, incorrect, oponentProverb, oponentIncorrect) {
   
        if (!this.initCanvasFirst) {
            this.drawAllow = true;
            this.firstDrawScreen(proverb);
            this.initCanvasFirst = true;
        }
        this.currentState.time = time > 0 ?
            Math.floor(time / 1000) : Game.TIMEOUTTICK / 1000;
        this.currentState.helpkeys = helpkeys;
        this.currentState.incorect = incorrect;
        this.opponentState.incorect = oponentIncorrect;
        this.currentState.proverbState = proverb;
        this.opponentState.proverbState = oponentProverb;
        //----
        this.animateWhile();
        if (this.currentState.helpkeys)
            for (var k in this.currentState.helpkeys) {
                $('#btn' + this.currentState.helpkeys[k].toUpperCase()).addClass('keyClicked');
            }
    },

 
    Online: function () {
        console.log('server is online');
        Game.loadCanvas();
    },

    UserAuthenticated: function (userID) {

        Game.proxy.send('IncomingMethod', 'someParam');
        Game.UserID = userID;
        jok.currentUserID = userID;

    },

    Offline: function () {
        console.log('server is offline');
    },

    TableState: function (table) {
        switch (table.Status) {
            case Table.States.New:
                $('#Notification > .item').hide();
                $('#Notification > .item.waiting_opponent').show();
                jok.setPlayer(1, jok.currentUserID);
            
                break;
            case Table.States.Finished:
                //todo
                $('#Notification > .item').hide();
                $('#Notification > .item.table_finish_winner > span').html(jok.players[table.LastWinnerPlayer.UserID].nick);
                $('#Notification > .item.table_finish_winner').show();
                this.gameEndCall();
                break;
            case Table.States.Started:
                var opponent = (table.players[0].UserID == jok.currentUserID) ? table.players[1].UserID : table.players[0].UserID;
                jok.setPlayer(1, jok.currentUserID);
                jok.setPlayer(2, opponent);
                $('#Notification > .item').hide();
                this.keyboardOption = table.KeysOption;
                this.XCHAR = table.XCHAR;
                this.TIMEOUTTICK = table.TIME_OUT_TICK;
                this.MaxIncorrect = table.MaxIncorrect;
                this.synchronizeCanvasObject();
                //todo
                break;
            case Table.States.StartedWaiting:
                break;
        }
    },

    getPercent: function (dec) {
        return Math.round(100 * Math.abs((1 - dec)));
    },

    isWinner: function (currentPlayer, opponentPlayer) {
        if (currentPlayer.proverbState.indexOf(Game.XCHAR) < 0)
            return true;

        if (opponentPlayer.proverbState.indexOf(Game.XCHAR) < 0)
            return false;

        return currentPlayer.incorect < opponentPlayer.incorect;
    },

    initCanvasFirst: false,


    UserID: 0,
    stage: {},//new Kinetic.Stage()
    layer: {},//new Kinetic.Layer()
    rects: new Array(),//new Kinetic.Rect[0] 
    chars: new Array(),//new Kinetic.Text[0]
    pntext: {},//Kinetic.Text
    drawAllow: false,
    keyboardOption: new KeyboardOption(),

    currentState: new PlayerState(),
    opponentState: new PlayerState(),
    timerHendler: -1,
    IsChar: function (schar) {
        return schar ? (schar.length == 1 && schar.toLowerCase().charCodeAt(0)
            >= this.keyboardOption.From && this.keyboardOption.To
                >= schar.toLowerCase().charCodeAt(0)) : false;
    },

    isCanvasSupported: function () {
        return true;
    },

    loadCanvas: function () {
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
    },

    drawScreen: function () {
        if (!this.drawAllow)
            return;

        var tmpchars = this.currentState.proverbState.split('');

        for (var i = 0; i < tmpchars.length; i++) {
            if (this.opponentState.proverbState.charAt(i) != Game.XCHAR &&
                this.currentState.proverbState.charAt(i) !=
                    this.opponentState.proverbState.charAt(i)) {
                this.rects[i].setStroke('#21A527');
            }
            this.chars[i].setText(tmpchars[i]);
        }
        this.pntext.setText('თქვენ სიცოცხლე: ' +
            Game.getPercent(this.currentState.incorect / this.MaxIncorrect) +
            '%    დარჩენილი დრო: ' + this.currentState.time + '\r\n' +
            ' მოწინააღმდეგე სიცოცხლე: ' + Game.getPercent(this.opponentState.incorect /
                this.MaxIncorrect));      
        this.layer.draw();
    },

    timerTick: function () {
        if (this.currentState.time <= 0)
            this.currentState.time = Game.TIMEOUTTICK / 1000;
        if (this.opponentState.time <= 0)
            this.opponentState.time = Game.TIMEOUTTICK / 1000;
        this.drawScreen();
        this.currentState.time--;
        this.opponentState.time--;
    },

    animateWhile: function () {

        clearTimeout(this.timerHendler);

        if (this.drawAllow) {
            this.timerTick();
            this.timerHendler = setTimeout(function () {
                Game.animateWhile();
            }, 1000);
        }
    },

    gameEndDrawScreen: function () {
        this.drawAllow = true;
        this.drawScreen();
        this.drawAllow = false;
    },

    firstDrawScreen: function (text) {
        var maxWidth = this.layer.getAttr('width');
        console.log('2.0' + maxWidth);

        //---Clear
        if (this.layer) {
            this.layer.removeChildren();
            this.layer.draw();
        }
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
            var chart = new Kinetic.Text({
                x: x + q,
                y: y + q * 2,
                text: chararr[i],
                fontSize: 24,
                fontFamily: 'Calibri',
                width: rect.getWidth(),
                align: 'center',
                fill: 'black'
            });
            this.chars.push(chart);
            this.rects.push(rect);
            this.layer.add(rect);
            this.layer.add(chart);
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
    },


    synchronizeCanvasObject: function () {
        $('#divKeyboard div').show();
        $('#divKeyboard div').removeClass("keyClicked");
        this.layer.removeChildren();
        this.chars = [];
        this.rects = [];
        this.initCanvasFirst = false;
        this.layer.draw();
    },

    gameEndCall: function () {

        for (var k in this.currentState.helpkeys) {
            $('#btn' + this.currentState.helpkeys[k]);
        }
        this.drawAllow = true;
        this.drawScreen(); 
        $('#divKeyboard div').hide();
        this.drawAllow = false;
        this.layer.clear();
        this.initCanvasFirst = false;
        //var winner = Game.isWinner(this.currentState, this.opponentState) ?
        //    this.currentState : this.opponentState;
        //this.pntext.setText('გამარჯვებულია: ' + winner.UserID);
        this.layer.draw();

    },
    
    sendChar: function (kchar) {
        Game.proxy.send('SetChar', kchar);
    },
    
    onLoad: function () {
         for (var i = 65; i <= 90; i++) {
            var chart = String.fromCharCode(i);
            var btn = document.createElement("div");
            var t = document.createTextNode(chart);
            btn.appendChild(t);
            btn.id = 'btn' + chart;
            btn.innerText = chart;
            btn.value = chart;
            btn.addEventListener("click", this.onKeyBoardClick, true);
            document.getElementById("divKeyboard").appendChild(btn);
            $(btn).hide();
        }
        $('#divKeyboard div').show();
    },
    
    onPlayAgain: function () {
       this.proxy.send('PlayAgain', 1);
    },
    
    onKeyBoardClick: function (e) {
        window.Game.sendChar(e.target.innerHTML);
    }
};

Game.Init();