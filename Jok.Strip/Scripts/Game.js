define(["require", "exports"], function(require, exports) {
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

    var GameTable = (function () {
        function GameTable(TableStateChanged) {
            this.TableStateChanged = TableStateChanged;
            this.GameEnd = false;
            //-------
            this.users = {};
            // event ჩაჯდეს ნაკადში ! მოგვიანებით.
            this.keyBoardOption = { from: 97, to: 122 };
        }
        GameTable.prototype.join = function (userid) {
            var users = this.users;
            if (users[userid] == null) {
                var userState = new UserState();
                users[userid] = { originProverb: this.getProverb(), state: userState };
                userState.userId = userid;
                userState.helpkeys = [];
                userState.proverbState = this.generateVerb(users[userid].originProverb);
            }
            users[userid].state.isActive = true;

            this.TableStateChanged({ code: 1, state: this.GetState() });
            //  this.TimeControl(userid);
        };

        GameTable.prototype.TimeControl = function (userid, char) {
            var _this = this;
            this.TableStateChanged({ code: 1, state: this.GetState() });
            if (this.users[userid].timeoutHendler != null)
                clearTimeout(this.users[userid].timeoutHendler);

            this.users[userid].timeoutHendler = setTimeout(function () {
                //Timeout 'thinking logically'
                _this.setNewCharforUser(userid, char ? char : _this.getRandomCharForUser(userid));
                if (_this.users[userid].state.proverbState.indexOf(GameTable.XCHAR) < 0) {
                    //თამაში დასრულდა
                    _this.GameEnd = true;
                }

                //-------------------
                _this.TimeControl(userid);
                //--
            }, GameTable.TIMEOUTTICK);
        };

        GameTable.prototype.setNewCharforUser = function (userid, char) {
            char = char.toLowerCase();
            if (!(GameTable.IsChar(char, this.keyBoardOption)) || this.users[userid].state.helpkeys.indexOf(char) >= 0)
                return;
            this.users[userid].state.helpkeys.push(char);
            var orgp = this.users[userid].originProverb.toLowerCase();
            var pstate = this.users[userid].state.proverbState;
            var newPstate = '';
            for (var i = 0; i < this.users[userid].state.proverbState.length; i++) {
                if (pstate[i] == GameTable.XCHAR && orgp[i] == char) {
                    //originalidan aRdgena
                    newPstate += this.users[userid].originProverb[i];
                } else {
                    newPstate += pstate[i];
                }
            }
            this.users[userid].state.proverbState = newPstate;
            return;
        };

        GameTable.prototype.getRandomCharForUser = function (userid) {
            for (var i = this.keyBoardOption.from; i < this.keyBoardOption.to; i++) {
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
        GameTable.prototype.GetState = function () {
            var arr = [];
            for (var k in this.users)
                arr.push(this.users[k].state);
            return arr;
        };

        /// ასოსების დამალვა!
        GameTable.prototype.generateVerb = function (text) {
            if (text == null)
                return "";
            var keyobj = this.keyBoardOption;

            //   todo: შესაცვლელია უკეთესი ლოგიკა!
            text.split(' ').forEach(function (e) {
                if (e.length >= 4) {
                    // შესაცვლელია! + random
                    var replStr = '';
                    e.split('').forEach(function (ch) {
                        if (GameTable.IsChar(ch, keyobj)) {
                            replStr += GameTable.XCHAR;
                        } else {
                            replStr += ch;
                        }
                    });
                    return text.replace(e, replStr);
                }
            });
            return "";
        };

        ///ახალი ანადზის გენერირება
        GameTable.prototype.getProverb = function () {
            return "All good things must come to an end";
        };

        ///საიტიდან მოთამაშიდან მოვიდა შეტყობინება
        GameTable.prototype.UserAction = function (userid, data) {
            //todo: მონაცემის ტიპი მოსაფიქრებელია
            var char = data;

            if (GameTable.IsChar(char, this.keyBoardOption) && !this.GameEnd) {
                this.TimeControl(userid, char);
            } else {
                this.TableStateChanged({ code: 300, state: null, data: 'ეს არ არის ასო!' });
            }
        };

        ///Method return true if other user is active
        GameTable.prototype.leave = function (userid) {
            this.users[userid].state.isActive = false;
            this.TableStateChanged({ code: 1, state: this.GetState() });
            var tmp = false;
            for (var k in this.users)
                tmp = tmp || this.users[k].state.isActive;
            return tmp;
        };
        GameTable.XCHAR = '•';
        return GameTable;
    })();
    exports.GameTable = GameTable;
});
//# sourceMappingURL=Game.js.map
