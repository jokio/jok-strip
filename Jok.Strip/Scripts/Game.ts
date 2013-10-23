
//todo: gasasworebelia testis cvlileba
export interface IGameToClient { // Game To Client messages
    code:Codes;
    state?: UserState[];
    data?: any;
}
export enum Codes {
    C_RestartRequest= -50,
    C_FirstGameStart=-2,
    C_UserChar= -1,
    State= 1,
    FirstState= 2,
    KeyboardOptionSend = 3,
    WinnerText= 4,
    UserDisconected=6, 
    RestartState = 50,
    GameEnd= 10,
    BadChar= 101
    
}

export class UserState {
    public userId: string;
    public proverbState: string;
    public helpkeys: string[];
    public isActive: boolean;
    public time: number;
    public incorect: number;
    public maxIncorrect: number;
    
}
export class KeyBoardOption{ from: number; to: number }

export enum GameState {
    FirstState,
    Stoped,
    Ended,
    Restarted,
    Running
}
export class GameTable {


    //OPTIONS
    private keyBoardOption: KeyBoardOption;
    public static XCHAR = '•';
    public static TIMEOUTTICK = 15000;
    public TableState: GameState = GameState.FirstState;
    public OriginalProverb: string;
    //-------
    users: {
        [key: string]: {
            RestartRequest?: boolean;
            timeInterval?: { hendler: number; createDate: Date; }; // ასეთ გადაწყვეტილებას სინქრონიზაციის საჭვალება დაჭირდება!
            state: UserState
        }
    } = {};

    public static IsWinner(fUser: UserState, sUser: UserState):boolean {
        //აბრუნებს true თუ პირველი გამარჯვებულია აბრუნებს false თუ მეორე გამარჯვებულია
        //იმის გამო აქ ბევრი ნაკადი შეუძლებელია  შეუძლებელია რომელიმე არ იყოს გამარჯვებული.
        //ეს ბაგია და გამოსწორება მოსაფიქრებელია.
        if (fUser.proverbState.indexOf(GameTable.XCHAR) < 0)
            return true; //pirvelma gaimarjva 
        
        if (sUser.proverbState.indexOf(GameTable.XCHAR) < 0)
            return false; // meore moxmarebelma gaimarjva
        //თუ არცერთი არ შესრულდა გაიმარჯვოს ვინც უფრო ცოცხალია
        return fUser.incorect < sUser.incorect;
        
    }

    public join(userid: string) {

        if (this.OriginalProverb == null || this.OriginalProverb.length > 1) {
            this.OriginalProverb = this.getProverb();

        }
        var users = this.users;
        this.TableStateChanged(null, { code: Codes.KeyboardOptionSend, data: this.keyBoardOption });
        if (users[userid] == null) {
            this.createState(userid);
            //---------
            users[userid].state.isActive = true;
            this.sendUsersState(Codes.FirstState);
            this.gameStart();
        }
        else {
            users[userid].state.isActive = true;
            this.sendUsersState(Codes.FirstState);
            if (this.TableState == GameState.Ended) {
                this.gameEnd();
            } else {
                if (this.users[userid].timeInterval&&this.users[userid].timeInterval.hendler) {
                    console.log('s-3');
                    this.sendUsersState(Codes.State,'s-3');
                }
            }
        }
    }

    RestartState() {

        //todo: GavtiSo timerebi
        this.OriginalProverb = this.getProverb();
        for (var uid in this.users) {
            if (this.users[uid].timeInterval && this.users[uid].timeInterval.hendler)
                clearTimeout(this.users[uid].timeInterval.hendler);
            this.createState(uid);
            this.users[uid].timeInterval = null;
        }
        
        this.TableState = GameState.Restarted;
        this.sendUsersState(Codes.RestartState);//nakadi
    }


    public sendUsersState(code: Codes, data?:any) {
        if (GameState.Running != this.TableState && (code == code.State || code == Codes.UserDisconected))
            return;
        for (var k in this.users)
            this.TableStateChanged(k, { code: code, state: this.getState(k), data: data});
    }

    createState(userid: string): UserState {
        var userState = new UserState();
        userState.incorect = 0;
        userState.maxIncorrect = GameTable.MaxIncorrectCounter(this.OriginalProverb, this.keyBoardOption); //todo: ჩასასწორებელია
        userState.userId = userid;
        userState.helpkeys = [];
        userState.proverbState = this.verbMaskGenerator(this.OriginalProverb);
        this.users[userid] = { state: userState, timeInterval: null,RestartRequest:null};
        return userState;
    }

    public static MaxIncorrectCounter(str: string, keyboardOption: KeyBoardOption): number {
        var arr = [];
        var tmp = '';
        for (var i = 0; i < str.length; i++) {
            tmp = str.charAt(i).toLowerCase();
            if (GameTable.IsChar(tmp, keyboardOption) && arr.indexOf(tmp) <0) {
                arr.push(tmp);
            }
        }
        //(y-x)*70%
        return Math.round(((keyboardOption.to - keyboardOption.from) - arr.length) * 0.7);
    }


    private gameStart() {
        // Start Game
        var array = new Array<UserState>();
        for (var k in this.users) {

            if (this.users[k].state.isActive && this.users[k].RestartRequest==false)
                array.push(this.users[k].state)
        }
        if (array.length >= 2) {
            for (var k in array) {
                this.TimeControl(array[k].userId, null);
            }
        }
      
    }

    private TimeControl(userid: string, char?: string) {
    
        if (this.TableState== GameState.Ended) {
            this.gameEnd();
            return;
        }
       
        this.setNewCharforUser(userid, char);
        if (this.users[userid].timeInterval && this.users[userid].timeInterval.hendler)
            clearTimeout(this.users[userid].timeInterval.hendler); // todo: (bug ?)
        this.users[userid].timeInterval = {
            hendler: setTimeout(() => {
                //Timeout 'thinking logically'
                if (this.TableState == GameState.Ended || this.TableState == GameState.Stoped)
                    return;
                this.setNewCharforUser(userid, this.getRandomCharForUser(userid));
                //-------------------
                this.TimeControl(userid);
                //--
            }, GameTable.TIMEOUTTICK), createDate: new Date()
        };
     
        this.sendUsersState(Codes.State,'s-4');
    }

    private setNewCharforUser(userid: string, char: string) {
        if (char == null)
            return;
        char = char.toLowerCase();
   
        if (!(GameTable.IsChar(char, this.keyBoardOption)) ||
            this.users[userid].state.helpkeys.indexOf(char) >= 0)
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
       var end = (this.users[userid].state.maxIncorrect
        <= this.users[userid].state.incorect)
        || this.users[userid].state.proverbState.indexOf(GameTable.XCHAR) < 0;

        if (end) {
            this.TableState = GameState.Ended;
            this.gameEnd();
        }return;

    }

    gameEnd() {
       this.TableState = GameState.Ended;
        this.sendUsersState(Codes.GameEnd);
        this.sendUsersState(Codes.WinnerText);
        for (var k in this.users) {
            if(this.users[k].timeInterval)
            clearTimeout(this.users[k].timeInterval.hendler);
        }
    }

    private getRandomCharForUser(userid: string): string {
        for (var i = this.keyBoardOption.from; i <= this.keyBoardOption.to; i++) {
            if (this.users[userid].state.helpkeys.indexOf(String.fromCharCode(i)) < 0) {// not Contains
                return String.fromCharCode(i);
            }
        }
        return '';
    }

    public static IsChar(char: string, keyOption: KeyBoardOption): boolean {
        return char ?
            (char.length == 1 &&
            char.toLowerCase().charCodeAt(0) >= keyOption.from &&
            keyOption.to >= char.toLowerCase().charCodeAt(0))
            : false; // bug (fixed)

    }
    /// ყველა მომხმარებელი
    public getState(userid:string): UserState[]{
      
        var arr: UserState[] = [];
        var tmp: UserState;
        for (var k in this.users) {

            this.users[k].state.time = GameTable.TIMEOUTTICK - (this.users[k].timeInterval ? (new Date()).getTime() - this.users[k].timeInterval.createDate.getTime() : 0);
            if (userid != k) {
            tmp= <UserState>JSON.parse(JSON.stringify(this.users[k].state));
                tmp.helpkeys = []; // clear keys
                tmp.proverbState = this.hideProverbState(tmp.proverbState);
            } else {
                tmp = this.users[k].state;
            }
            arr.push(tmp);
        }
        return arr;
    }

    private hideProverbState(str: string): string {
        var result = "";
        try {
            var arr = str.split('');
            for (var s in arr)
                result += GameTable.IsChar(arr[s], this.keyBoardOption) ? ' ' : arr[s];
        }
        finally {
            return result;
        }
    }

    /// ასოსების დამალვა!
    verbMaskGenerator(text: string): string {
        if (text == null) {
            console.log("method verbMaskGenerator(text: string)");
            console.warn("text is empty", text, this);
            throw "text is empty ";
        }
        var result = '';
        //   todo: შესაცვლელია უკეთესი ლოგიკა!
        text.split('').forEach((e) => {       
                e.split('').forEach((ch) => {
                    if (GameTable.IsChar(ch, this.keyBoardOption)) {
                        result += GameTable.XCHAR; // '•'
                    } else {
                        result += ch;
                    }
                });
        });
        return result;
    }

    ///ახალი ანადზის გენერირება
    getProverb(): string  {
        return "All good things, must come to an end.";
    }

    ///საიტიდან მოთამაშიდან მოვიდა შეტყობინება
    UserAction(userid: string, data: { code: Codes; data: any; }) {

        //todo: მონაცემის ტიპი მოსაფიქრებელია
        if (data.code == Codes.C_FirstGameStart) {
            this.users[userid].RestartRequest = false;
            this.gameStart();
            var tu = 0;
            for (var u in this.users) {
                if (this.users[u].RestartRequest == false && this.users[u].state.isActive)
                    tu++;
            }
            if (tu == 2)
                this.TableState = GameState.Running;
        }
        if (Object.keys(this.users).length < 2)
            return;
        if (data.code == Codes.C_UserChar && this.TableState == GameState.Running) {// Received codes should be less than zero.
            var char = <string>data.data; // დასამუშავებელია
            //---------------
            if (GameTable.IsChar(char, this.keyBoardOption)) {
                if (this.users[userid].state.helpkeys.indexOf(char) < 0) {
                    this.TimeControl(userid, char);
                } else {
                    this.TableStateChanged(userid, { code: Codes.BadChar, state: null, data: 'ეს ასო უკვე გამოყენებულია' });
                }
            }
            else {
                this.TableStateChanged(userid,{ code: Codes.BadChar, state: null, data: 'ეს არ არის ასო!' });
            }
            return;
        }
        if (data.code == Codes.C_RestartRequest) {
            this.users[userid].RestartRequest = true;
            var count = 0;
            for (var u in this.users) {
                if (this.users[u].RestartRequest && this.users[u].state.isActive)
                {
                    //todo:Sesacvlelia Seizleba gaasxas isActiveze
                    count++;
                } 
            }
            if (count >= 2) {

                this.RestartState();
                this.gameStart();
          
            }
        }
    }

    constructor(public TableStateChanged: (groupid: string,state: IGameToClient) => void) {
        // event ჩაჯდეს ნაკადში ! მოგვიანებით.
        this.keyBoardOption = { from: 97, to: 122 };
       
    }

 
    ///Method return true if other user is active
    public leave(userid: string) {
        console.log('Leave--');
        if(this.users[userid].state)
            this.users[userid].state.isActive = false;
        if (this.TableState==GameState.Ended)
            this.gameEnd();
        console.log('Disconect');
            this.sendUsersState(Codes.UserDisconected);
        var tmp = false;
        for (var k in this.users)
            tmp = tmp || this.users[k].state.isActive;
        if (!tmp)
            this.gameEnd();
        return tmp;
    }


}

