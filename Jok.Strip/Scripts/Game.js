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
                var verbOption = this.getProverb();
                var userState = new UserState();
                userState.incorect = 0;
                userState.maxIncorrect = 5;
                userState.userId = userid;
                userState.helpkeys = [];
                users[userid] = { originProverb: verbOption, state: userState, timeoutHendler: null };
                userState.proverbState = this.verbMaskGenerator(verbOption);
            }
            users[userid].state.isActive = true;

            this.TableStateChanged({ code: 1, state: this.GetState() });
            //  this.TimeControl(userid);
        };

        GameTable.prototype.TimeControl = function (userid, char) {
            var _this = this;
            if (char)
                this.setNewCharforUser(userid, char);
            this.TableStateChanged({ code: 1, state: this.GetState() });
            if (this.users[userid].timeoutHendler != null)
                clearTimeout(this.users[userid].timeoutHendler);

            if (this.GameEnd)
                return;
            this.users[userid].timeoutHendler = setTimeout(function () {
                //Timeout 'thinking logically'
                _this.setNewCharforUser(userid, _this.getRandomCharForUser(userid));

                //-------------------
                _this.TimeControl(userid);
                //--
            }, GameTable.TIMEOUTTICK);
        };

        GameTable.prototype.setNewCharforUser = function (userid, char) {
            console.log('----------------------------------');
            console.log("1.1");
            char = char.toLowerCase();
            console.log("1.2 " + char);
            if (!(GameTable.IsChar(char, this.keyBoardOption)) || this.users[userid].state.helpkeys.indexOf(char) >= 0)
                return;
            console.log("2.1");
            this.users[userid].state.helpkeys.push(char);
            console.log("2.2");
            var orgp = this.users[userid].originProverb.toLowerCase();
            console.log("2.3");
            var pstate = this.users[userid].state.proverbState;
            console.log("2.4");
            var newPstate = '';
            var isCorect = false;

            console.log(this.users[userid]);

            if (this.users[userid].originProverb.length != this.users[userid].state.proverbState.length)
                throw "sthring not match";
            for (var i = 0; i < this.users[userid].originProverb.length; i++) {
                console.log("3.1");
                if (pstate.charAt(i) == GameTable.XCHAR && orgp.charAt(i) == char) {
                    //originalidan aRdgena
                    console.log("3.1.1");
                    newPstate += this.users[userid].originProverb.charAt(i);
                    isCorect = true;
                } else {
                    console.log("3.1.2");
                    newPstate += pstate.charAt(i);
                }
                console.log(newPstate);
            }
            if (!isCorect) {
                this.users[userid].state.incorect++;
                this.GameEnd = this.users[userid].state.maxIncorrect <= this.users[userid].state.incorect;
            }
            this.users[userid].state.proverbState = newPstate;
            return;
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
        GameTable.prototype.GetState = function () {
            var arr = [];
            for (var k in this.users)
                arr.push(this.users[k].state);
            return arr;
        };

        /// ასოსების დამალვა!
        GameTable.prototype.verbMaskGenerator = function (text) {
            if (text == null) {
                console.warn("text is empty ", text, this);
                throw "text is empty ";
            }

            var keyobj = this.keyBoardOption;

            //   todo: შესაცვლელია უკეთესი ლოგიკა!
            text.split(' ').forEach(function (e) {
                if (text.indexOf(GameTable.XCHAR) >= 0)
                    return;
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
                    text = text.replace(e, replStr);
                }
            });
            return text;
        };

        ///ახალი ანადზის გენერირება
        GameTable.prototype.getProverb = function () {
            return "All good things must come to an end";
        };

        ///საიტიდან მოთამაშიდან მოვიდა შეტყობინება
        GameTable.prototype.UserAction = function (userid, data) {
            if (data.code < 0) {
                var char = data.data;

                if (GameTable.IsChar(char, this.keyBoardOption) && !this.GameEnd) {
                    this.TimeControl(userid, char);
                } else {
                    this.TableStateChanged({ code: 300, state: null, data: 'ეს არ არის ასო!' });
                }
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
        GameTable.TIMEOUTTICK = 3000;
        return GameTable;
    })();
    exports.GameTable = GameTable;
});
//# sourceMappingURL=Game.js.map
