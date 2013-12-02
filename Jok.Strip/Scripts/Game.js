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
    MaxIncorrect: 10,
    TIMEOUTTICK: 15000,

    Init: function() {

        //$(document).on('ready', this.onLoad.bind(this));
        $('.play_again').on('click', this.onPlayAgain.bind(this));

        this.proxy.on('Online', this.Online.bind(this));
        this.proxy.on('Offline', this.Offline.bind(this));
        this.proxy.on('UserAuthenticated', this.UserAuthenticated.bind(this));
        this.proxy.on('TableState', this.TableState.bind(this));
        this.proxy.on('SetCharResult', this.SetCharResult.bind(this));
        this.proxy.start();
    },


    // UI Events ----------------------------------------------------------
    onLoad: function () {
        if (this.keyboardIsCreated)
            return;
        console.log("---LOAD---");
        this.currentDiv = $('#currentDiv')[0];
        this.oponentDiv = $('#oponentDiv')[0];

        for (var i = this.keyboardOption.From; i <= this.keyboardOption.To; i++) {
            var chart = String.fromCharCode(i);
            var btn = document.createElement("div");
            var t = document.createTextNode(chart);
            btn.appendChild(t);
            btn.id = 'btn' + chart;
            btn.innerText = chart.toUpperCase();
            btn.value = chart;
            btn.className = 'keyboard_item';
            btn.addEventListener("click", this.onKeyBoardClick, true);
            document.getElementById("divKeyboard").appendChild(btn);
            $(btn).hide();
        }
        //$('.keyboard_item').show();
        this.keyboardIsCreated = true;
    },

    onPlayAgain: function() {
        this.proxy.send('PlayAgain', 1);
    },

    onKeyBoardClick: function(e) {

        window.Game.sendChar(e.target.innerHTML);
    },



    // Server Callbacks ---------------------------------------------------
    Online: function() {
        console.log('server is online');
        Game.loadCanvas();
    },

    Offline: function() {
        console.log('server is offline');
    },

    UserAuthenticated: function(userID) {

        Game.proxy.send('IncomingMethod', 'someParam');
        Game.UserID = userID;
        jok.currentUserID = userID;

    },

    keyboardIsCreated: false,

    TableState: function (table) {
        switch (table.Status) {
            case Table.States.New:
                $('#Notification > .item').hide();
                $('#Notification > .item.waiting_opponent').show();
                jok.setPlayer(1, jok.currentUserID);
                if (!this.keyboardIsCreated) {
                    this.keyboardOption = table.KeysOption;
                    this.onLoad();//      this.loadCanvas();
                }
                break;


            case Table.States.Started:
                var opponent = (table.players[0].UserID == jok.currentUserID) ? table.players[1].UserID : table.players[0].UserID;
                jok.setPlayer(1, jok.currentUserID);
                jok.setPlayer(2, opponent);
                $('#Notification > .item').hide();
              
                if (!this.keyboardIsCreated) {
                    this.keyboardOption = table.KeysOption;
                    this.onLoad();//      this.loadCanvas();
                }
                this.XCHAR = table.XCHAR;
                this.TIMEOUTTICK = table.TIME_OUT_TICK;
                this.MaxIncorrect = table.MaxIncorrect;
                this.synchronizeCanvasObject();

                $('#Player2 .offline').hide();
                break;


            case Table.States.StartedWaiting:
                $('#Notification > .item').hide();
                $('#Notification > .item.opponent_offline').show();
                if (!this.keyboardIsCreated) {
                    this.keyboardOption = table.KeysOption;
                    this.onLoad();//      this.loadCanvas();
                }
                $('#Player2 .offline').show();
                break;


            case Table.States.Finished:
                //todo
                $('#Notification > .item').hide();
                $('#Notification > .item.table_finish_winner > span').html(jok.players[table.LastWinnerPlayer.UserID].nick);
                $('#Notification > .item.table_finish_winner').show();
                this.gameEndCall();
                break;
        }
    },

    SetCharResult: function (helpkeys, proverb, time, incorrect, oponentProverb, oponentIncorrect) {

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
                $('#btn' + this.currentState.helpkeys[k]).addClass('disabled');
            }
    },



    // Helper functions ---------------------------------------------------
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
    currentDiv: {},
    oponentDiv:{},
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

        if (!(this.layout  === undefined || this.layout == null || this.stage === undefined  || this.stage == null))
            return false;

        $('#canvasOne').empty();

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
            if (this.chars[i] != null && this.chars[i] !== undefined && this.chars[i].setText)
                this.chars[i].setText(tmpchars[i]);
       
        }
        this.layer.draw();
        this.currentDiv.innerHTML = ('Your Life: ' +Game.getPercent(this.currentState.incorect / this.MaxIncorrect) +'% <br/> Time Left: ' + this.currentState.time);
        this.oponentDiv.innerHTML=('Oponent Life:' + Game.getPercent(this.opponentState.incorect /this.MaxIncorrect) +'%');
       
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
        $('#divKeyboard').show();
        $('.keyboard_item').show();
        //---Clear
        if (this.layer) {
            this.layer.removeChildren();
            this.layer.draw();
        }
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
                //tu sityva kide mosdevs.
                var charCounter = 0;
                for (var c = i+1; c < chararr.length; c++) {
                    if (chararr[c] === ' ')
                        break;
                    charCounter++;
                }
                if (charCounter != 0) {
                    charCounter = charCounter * (rectWidth + q);
                    if (x+charCounter + rectWidth > maxWidth) {
                        x = q;
                        y = q + y + rectheight;
                        continue;
                    }

                }
            }
            x = x + (rectWidth + q);
            if (x + rectWidth > maxWidth) {
                x = q;
                y = q + y + rectheight;
                //tu gadasvlis mere pirveli simbolo carieli adgilia
                if (i + 1 < chararr.length && chararr[i + 1] == ' ')
                    i++;
            }
          
        }
        
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
      //  $('.keyboard_item').show();
        $('.keyboard_item').removeClass('disabled');
        this.layer.removeChildren();
        this.chars = new Array();
        this.rects = new Array();
        this.initCanvasFirst = false;
        this.layer.draw();
    },

    gameEndCall: function () {
        this.initCanvasFirst = false;
        for (var k in this.currentState.helpkeys) {
            $('#btn' + this.currentState.helpkeys[k]);
        }
        this.drawAllow = true;
        this.drawScreen();
        $('#divKeyboard').hide();
        this.drawAllow = false;
        this.layer.clear();
       
        //var winner = Game.isWinner(this.currentState, this.opponentState) ?
        //    this.currentState : this.opponentState;
        //this.pntext.setText('გამარჯვებულია: ' + winner.UserID);
      //  this.layer.draw();

    },

    sendChar: function (kchar) {
        var chart = kchar.toLowerCase();
        if (this.currentState.helpkeys.indexOf(chart) <= -1)
            this.proxy.send('SetChar', chart);
    },

};

Game.Init();

game.init = function () {

    //$('#Notification').append('<div class="item waiting_opponent_tournament"><br />Welcome<br/>Waiting for opponent...<br /><br /></div>');
    $('#Notification').append('<div class="item opponent_offline"><br />Opponent is offline, Keep playing<br /><br /></div>');

    $('#Player2').append('<div class="offline">Offline</div>');
}