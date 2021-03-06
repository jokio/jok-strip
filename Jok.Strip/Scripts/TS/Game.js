﻿define(["require", "exports"], function(require, exports) {
    var MessageType = (function () {
        function MessageType() {
        }
        MessageType.C_RestartRequest = "C_RestartRequest";
        MessageType.C_FirstGameStart = "C_FirstGameStart";
        MessageType.C_UserChar = "C_UserChar";
        MessageType.State = "State";
        MessageType.FirstState = "FirstState";
        MessageType.KeyboardOption = "KeyboardOption";
        MessageType.WinnerText = "WinnerText";
        MessageType.UserDisconected = "UserDisconected";
        MessageType.RestartState = "RestartState";
        MessageType.GameEnd = "GameEnd";
        MessageType.BadChar = "BadChar";
        return MessageType;
    })();
    exports.MessageType = MessageType;

    var UserState = (function () {
        function UserState() {
        }
        return UserState;
    })();
    exports.UserState = UserState;
    var KeyBoardOption = (function () {
        function KeyBoardOption() {
        }
        return KeyBoardOption;
    })();
    exports.KeyBoardOption = KeyBoardOption;

    (function (GameState) {
        GameState[GameState["FirstState"] = 0] = "FirstState";
        GameState[GameState["Stoped"] = 1] = "Stoped";
        GameState[GameState["Ended"] = 2] = "Ended";
        GameState[GameState["Restarted"] = 3] = "Restarted";
        GameState[GameState["Running"] = 4] = "Running";
        GameState[GameState["Whaiting"] = 5] = "Whaiting";
    })(exports.GameState || (exports.GameState = {}));
    var GameState = exports.GameState;
    var GameTable = (function () {
        function GameTable(TableStateChanged) {
            this.TableStateChanged = TableStateChanged;
            this.TableState = GameState.FirstState;
            //-------
            this.users = {};
            // event ჩაჯდეს ნაკადში ! მოგვიანებით.
            this.keyBoardOption = { from: 97, to: 122 };
            this.TableState = GameState.FirstState;
            this.OriginalProverb = this.getProverb();
        }
        GameTable.IsWinner = function (fUser, sUser) {
            if (fUser.proverbState.indexOf(GameTable.XCHAR) < 0)
                return true;

            if (sUser.proverbState.indexOf(GameTable.XCHAR) < 0)
                return false;

            //თუ არცერთი არ შესრულდა გაიმარჯვოს ვინც უფრო ცოცხალია
            return fUser.incorect < sUser.incorect;
        };

        GameTable.prototype.join = function (userid) {
            var users = this.users;
            this.TableStateChanged(null, MessageType.KeyboardOption, this.keyBoardOption);
            if (users[userid] == null) {
                this.createState(userid);

                //---------
                users[userid].state.isActive = true;
                this.sendUsersState(MessageType.FirstState);
                this.gameStart();
                this.FirstGameStart(userid);
            } else {
                users[userid].state.isActive = true;
                this.sendUsersState(MessageType.FirstState);
                if (this.TableState == GameState.Ended) {
                    this.gameEnd();
                } else {
                    if (this.users[userid].timeInterval && this.users[userid].timeInterval.hendler) {
                        console.log('s-3');
                        this.sendUsersState(MessageType.State, 's-3');
                    }
                }
            }
        };

        GameTable.prototype.RestartState = function () {
            //todo: GavtiSo timerebi
            this.OriginalProverb = this.getProverb();
            for (var uid in this.users) {
                if (this.users[uid].timeInterval && this.users[uid].timeInterval.hendler)
                    clearTimeout(this.users[uid].timeInterval.hendler);
                this.createState(uid);
                this.users[uid].state.isActive = true;
                this.users[uid].RestartRequest = false;
            }

            this.TableState = GameState.Restarted;
            this.sendUsersState(MessageType.RestartState);
        };

        GameTable.prototype.sendUsersState = function (code, data) {
            if (GameState.Running != this.TableState && (code === MessageType.State || code === MessageType.UserDisconected)) {
                return;
                //es droebiT dasadgenia ratom igzavneba 2 obieqti!
            }
            for (var k in this.users)
                this.TableStateChanged(k, code, { state: this.getState(k), data: data });
        };

        GameTable.prototype.createState = function (userid) {
            var userState = new UserState();
            userState.incorect = 0;
            userState.maxIncorrect = GameTable.MaxIncorrectCounter(this.OriginalProverb, this.keyBoardOption);
            userState.userId = userid;
            userState.helpkeys = [];
            userState.proverbState = this.verbMaskGenerator(this.OriginalProverb);
            this.users[userid] = { state: userState, timeInterval: null, RestartRequest: null };
            return userState;
        };

        GameTable.MaxIncorrectCounter = function (str, keyboardOption) {
            var arr = [];
            var tmp = '';
            for (var i = 0; i < str.length; i++) {
                tmp = str.charAt(i).toLowerCase();
                if (GameTable.IsChar(tmp, keyboardOption) && arr.indexOf(tmp) < 0) {
                    arr.push(tmp);
                }
            }

            //(y-x)*70%
            return Math.round(((keyboardOption.to - keyboardOption.from) - arr.length) * 0.7);
        };

        GameTable.prototype.gameStart = function () {
            // Start Game
            var array = new Array();
            for (var k in this.users) {
                if (this.users[k].state.isActive && this.users[k].RestartRequest == false)
                    array.push(this.users[k].state);
            }
            if (array.length >= 2) {
                for (var k in array) {
                    this.TimeControl(array[k].userId, null);
                }
            }
        };

        GameTable.prototype.TimeControl = function (userid, char) {
            var _this = this;
            console.log('2.0');
            if (this.TableState == GameState.Ended) {
                this.gameEnd();
                return;
            }
            console.log('2.1');
            this.setNewCharforUser(userid, char);
            console.log('2.2');
            if (this.users[userid].timeInterval && this.users[userid].timeInterval.hendler)
                clearTimeout(this.users[userid].timeInterval.hendler);
            console.log('2.4');
            this.users[userid].timeInterval = {
                hendler: setTimeout(function () {
                    if (_this.TableState == GameState.Ended || _this.TableState == GameState.Stoped)
                        return;
                    _this.setNewCharforUser(userid, _this.getRandomCharForUser(userid));

                    //-------------------
                    _this.TimeControl(userid);
                    //--
                }, GameTable.TIMEOUTTICK),
                createDate: new Date()
            };
            console.log('2.5');
            this.sendUsersState(MessageType.State);
        };

        GameTable.prototype.setNewCharforUser = function (userid, char) {
            if (char == null)
                return;
            char = char.toLowerCase();

            if (!(GameTable.IsChar(char, this.keyBoardOption)) || this.users[userid].state.helpkeys.indexOf(char) >= 0)
                return;

            this.users[userid].state.helpkeys.push(char);

            var orgp = this.OriginalProverb.toLowerCase();

            var pstate = this.users[userid].state.proverbState;

            var newPstate = '';
            var isCorect = false;

            if (this.OriginalProverb.length != this.users[userid].state.proverbState.length) {
                console.log(this.OriginalProverb + "     :        " + this.users[userid].state.proverbState);
                throw "sthring not match";
            }
            for (var i = 0; i < this.OriginalProverb.length; i++) {
                if (pstate.charAt(i) == GameTable.XCHAR && orgp.charAt(i) == char) {
                    //originalidan aRdgena
                    newPstate += this.OriginalProverb.charAt(i);
                    isCorect = true;
                } else {
                    newPstate += pstate.charAt(i);
                }
            }
            this.users[userid].state.proverbState = newPstate;
            if (!isCorect) {
                this.users[userid].state.incorect++;
            }
            var end = (this.users[userid].state.maxIncorrect <= this.users[userid].state.incorect) || this.users[userid].state.proverbState.indexOf(GameTable.XCHAR) < 0;

            if (end) {
                this.TableState = GameState.Ended;
                this.gameEnd();
            }
            return;
        };

        GameTable.prototype.gameEnd = function () {
            this.TableState = GameState.Ended;
            this.sendUsersState(MessageType.GameEnd);
            this.sendUsersState(MessageType.WinnerText);
            for (var k in this.users) {
                if (this.users[k].timeInterval)
                    clearTimeout(this.users[k].timeInterval.hendler);
            }
        };

        GameTable.prototype.getRandomCharForUser = function (userid) {
            for (var i = this.keyBoardOption.from; i <= this.keyBoardOption.to; i++) {
                if (this.users[userid].state.helpkeys.indexOf(String.fromCharCode(i)) < 0) {
                    return String.fromCharCode(i);
                }
            }
            return '';
        };

        GameTable.IsChar = function (char, keyOption) {
            return char ? (char.length == 1 && char.toLowerCase().charCodeAt(0) >= keyOption.from && keyOption.to >= char.toLowerCase().charCodeAt(0)) : false;
        };

        /// ყველა მომხმარებელი
        GameTable.prototype.getState = function (userid) {
            var arr = [];
            var tmp;
            for (var k in this.users) {
                this.users[k].state.time = GameTable.TIMEOUTTICK - (this.users[k].timeInterval ? (new Date()).getTime() - this.users[k].timeInterval.createDate.getTime() : 0);
                if (userid != k) {
                    tmp = JSON.parse(JSON.stringify(this.users[k].state));
                    tmp.helpkeys = [];
                    tmp.proverbState = this.hideProverbState(tmp.proverbState);
                } else {
                    tmp = this.users[k].state;
                }
                arr.push(tmp);
            }
            return arr;
        };

        GameTable.prototype.hideProverbState = function (str) {
            var result = "";
            try  {
                var arr = str.split('');
                for (var s in arr)
                    result += GameTable.IsChar(arr[s], this.keyBoardOption) ? ' ' : arr[s];
            } finally {
                return result;
            }
        };

        /// ასოსების დამალვა!
        GameTable.prototype.verbMaskGenerator = function (text) {
            var _this = this;
            if (text == null) {
                console.log("method verbMaskGenerator(text: string)");
                console.warn("text is empty", text, this);
                throw "text is empty ";
            }
            var result = '';

            //   todo: შესაცვლელია უკეთესი ლოგიკა!
            text.split('').forEach(function (e) {
                e.split('').forEach(function (ch) {
                    if (GameTable.IsChar(ch, _this.keyBoardOption)) {
                        result += GameTable.XCHAR;
                    } else {
                        result += ch;
                    }
                });
            });
            return result;
        };

        ///ახალი ანადზის გენერირება
        GameTable.prototype.getProverb = function () {
            return "All good things, must come to an end.";
        };

        //---------New Functions
        GameTable.prototype.FirstGameStart = function (userid) {
            // MessageType.FirstState
            this.users[userid].RestartRequest = false;

            var tu = 0;
            console.log('0.1.1');
            for (var u in this.users) {
                if (this.users[u].RestartRequest == false && this.users[u].state.isActive) {
                    tu++;
                    console.log('0.1.2');
                }
            }
            console.log('0.1.3');

            if (function (tu) {
                return 2;
            }) {
                console.log('0.1.3.1');

                if (this.TableState == GameState.FirstState)
                    this.TableState = GameState.Whaiting;
else
                    this.TableState = GameState.Running;
                this.gameStart();
            }
        };
        GameTable.prototype.UserCharSet = function (userid, char) {
            if (Object.keys(this.users).length < 2)
                return;

            if (this.TableState == GameState.Running) {
                //---------------
                console.log('0.1.6');
                if (GameTable.IsChar(char, this.keyBoardOption)) {
                    if (this.users[userid].state.helpkeys.indexOf(char) < 0) {
                        this.TimeControl(userid, char);
                    } else {
                        //todo es  MessageType.State  Sesacvlelia unda iyows Wron Char
                        this.TableStateChanged(userid, MessageType.State, { state: null, data: 'ეს ასო უკვე გამოყენებულია' });
                    }
                } else {
                    this.TableStateChanged(userid, MessageType.BadChar, { state: null, data: 'ეს არ არის ასო!' });
                }
                return;
            }
        };

        GameTable.prototype.UserRestartRequest = function (userid) {
            //MessageType.C_RestartRequest
            this.users[userid].RestartRequest = true;
            var count = 0;
            for (var u in this.users) {
                if (this.users[u].RestartRequest && this.users[u].state.isActive) {
                    //todo:Sesacvlelia Seizleba gaasxas isActiveze
                    count++;
                }
            }
            console.log('------------------------------------');
            if (count >= 2) {
                console.log('0.1.6');
                this.RestartState();
                console.log('0.1.7');
                this.TableState = GameState.Running;
                this.gameStart();
                console.log('0.1.8');
            }
        };

        //--------
        ///საიტიდან მოთამაშიდან მოვიდა შეტყობინება
        GameTable.prototype.UserAction = function (userid, data) {
            //todo wasaSlelia.
            console.log("aq ar unda Semosuliyo");
        };

        ///Method return true if other user is active
        GameTable.prototype.leave = function (userid) {
            console.log('Leave--');
            if (this.users[userid].state)
                this.users[userid].state.isActive = false;
            if (this.TableState == GameState.Ended)
                this.gameEnd();
            console.log('Disconect');
            this.sendUsersState(MessageType.UserDisconected);
            var tmp = false;
            for (var k in this.users)
                tmp = tmp || this.users[k].state.isActive;
            if (!tmp) {
                //Bthis.TableState = GameState.Ended;
                this.gameEnd();
            }
            return tmp;
        };
        GameTable.XCHAR = '•';
        GameTable.TIMEOUTTICK = 15000;
        return GameTable;
    })();
    exports.GameTable = GameTable;
});
//# sourceMappingURL=Game.js.map
