

export interface IGameToClient { // Game To Client messages
    code: number;/*
             FullState=1; //new
            
           error =100
        */
    state: UserState[];
    data?: any;
}


export class UserState {
    public userId: string;
    public proverbState: string;
    public helpkeys: string[];
    public isActive: boolean;
    public time: number;
}


export class GameTable {
    public TabelID: number;
    //OPTIONS
    private keyBoardOption = { from: 65, to: 90 };
    public static XCHAR = '•';
    public static TIMEOUTTICK: number;
    public GameEnd: boolean = false;
    //-------
    users: {
        [key: string]: {
            originProverb: string;
            timeoutHendler?: number; // ასეთ გადაწყვეტილებას სინქრონიზაციის საჭვალება დაჭირდება!
            state: UserState
        }
    } = {};

    join(userid: string) {

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
    }

    private TimeControl(userid: string, char?: string) {
        this.TableStateChanged({ code: 1, state: this.GetState() });
        if (this.users[userid].timeoutHendler != null)
            clearTimeout(this.users[userid].timeoutHendler); // todo: (bug ?)

        this.users[userid].timeoutHendler = setTimeout(() => {
            //Timeout 'thinking logically'
            this.setNewCharforUser(userid, char ? char : this.getRandomCharForUser(userid));
            if (this.users[userid].state.proverbState.indexOf(GameTable.XCHAR) < 0) {
                //თამაში დასრულდა
                this.GameEnd = true;
            }
            //-------------------
            this.TimeControl(userid);
            //--
        }, GameTable.TIMEOUTTICK);
    }

    private setNewCharforUser(userid: string, char: string) {
        char = char.toLowerCase();
        if (!(this.IsChar(char)) ||
            this.users[userid].state.helpkeys.indexOf(char) >= 0)
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

    }

    private getRandomCharForUser(userid: string): string {
        for (var i = this.keyBoardOption.from; i < this.keyBoardOption.to; i++) {
            if (this.users[userid].state.helpkeys.indexOf(String.fromCharCode(i)) < 0) {// not Contains
                return String.fromCharCode(i);
            }
        }
        return '';
    }

    public IsChar(char: string): boolean {
        return char ?
            (char.length == 1 &&
            char.toLowerCase().charCodeAt(0) >= this.keyBoardOption.from &&
            this.keyBoardOption.to >= char.toLowerCase().charCodeAt(0))
            : false;

    }
    /// ყველა მომხმარებელი
    public GetState(): UserState[] {
        var arr: UserState[] = [];
        for (var k in this.users)
            arr.push(this.users[k].state);
        return arr;
    }

    /// ასოსების დამალვა!
    generateVerb(text: string): string {
        if (text == null) return "";
        var keyobj = this.keyBoardOption;
        //   todo: შესაცვლელია უკეთესი ლოგიკა!
        text.split(' ').forEach((e) => {
            if (e.length >= 4) {
                // შესაცვლელია! + random
                var replStr = '';
                e.split('').forEach(function (ch) {

                    if (this.IsChar(ch)) {
                        replStr += GameTable.XCHAR; //  ეს ნიშანი შეიცვლება ისეთ ნიშნით რომელიც ტექსტში არ უნდა იყოს. მაგ '•'
                    } else {
                        replStr += ch;
                    }
                });
                return text.replace(e, replStr);
            }
        });
        return "";
    }

    ///ახალი ანადზის გენერირება
    getProverb(): string {
        return "All good things must come to an end";
    }

    ///საიტიდან მოთამაშიდან მოვიდა შეტყობინება
    UserAction(userid: string, data: any) {
        //todo: მონაცემის ტიპი მოსაფიქრებელია
        var char = <string>data; // დასამუშავებელია
        //---------------
        if (this.IsChar(char) && !this.GameEnd) {// ეს დაცვა შიგნითაცააქ მაგრამ შეიძლება რიცხვი მომივიდეს უნდა დავამუშავო.
            this.TimeControl(userid, char);
        }
        else {
            this.TableStateChanged({ code: 300, state: null, data: 'ეს არ არის ასო!' });
        }
    }

    constructor(public TableStateChanged: (state: IGameToClient) => void) {
        // event ჩაჯდეს ნაკადში ! მოგვიანებით.

    }



    leave(userid) {
        this.users[userid].state.isActive = false;
        this.TableStateChanged({ code: 1, state: this.GetState() });
    }


}

