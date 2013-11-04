
//todo: gasasworebelia testis cvlileba
export interface IGameToClient { // Game To Client messages
    state?: UserState[];
    data?: any;
}



export class MessageType {
    static C_RestartRequest = "C_RestartRequest";
    static C_FirstGameStart = "C_FirstGameStart";
    static C_UserChar = "C_UserChar";
    static State = "State";
    static FirstState = "FirstState";
    static KeyboardOption = "KeyboardOption";
    static WinnerText = "WinnerText";
    static UserDisconected = "UserDisconected";
    static RestartState = "RestartState";
    static GameEnd = "GameEnd";
    static BadChar = "BadChar";
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
    FirstState=0,
    Stoped=1,
    Ended=2,
    Restarted=3,
    Running= 4,
    Whaiting=5
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
            timeInterval: { hendler: number; createDate: Date; }; // ასეთ გადაწყვეტილებას სინქრონიზაციის საჭვალება დაჭირდება!
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

     
        var users = this.users;
        this.TableStateChanged(null, MessageType.KeyboardOption,this.keyBoardOption);
        if (users[userid] == null) {
            this.createState(userid);
            //---------
            users[userid].state.isActive = true;
            this.sendUsersState(MessageType.FirstState);
            this.gameStart();
            this.FirstGameStart(userid);
        }
        else {
            users[userid].state.isActive = true;
            this.sendUsersState(MessageType.FirstState);
            if (this.TableState == GameState.Ended) {
                this.gameEnd();
            } else {
                if (this.users[userid].timeInterval&&this.users[userid].timeInterval.hendler) {
                    console.log('s-3');
                    this.sendUsersState(MessageType.State,'s-3');
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
            this.users[uid].state.isActive = true;
            this.users[uid].RestartRequest = false;

        }
        
        this.TableState = GameState.Restarted;
        this.sendUsersState(MessageType.RestartState);//nakadi
    }


    public sendUsersState(code: string, data?: any) {

        if (GameState.Running != this.TableState && (code === MessageType.State || code === MessageType.UserDisconected)) {
            return;
            //es droebiT dasadgenia ratom igzavneba 2 obieqti!
        }
        for (var k in this.users)
            this.TableStateChanged(k, code,{ state: this.getState(k), data: data});
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
        console.log('2.0');
        if (this.TableState== GameState.Ended) {
            this.gameEnd();
            return;
        }
        console.log('2.1');       
        this.setNewCharforUser(userid, char);
        console.log('2.2');
        if (this.users[userid].timeInterval && this.users[userid].timeInterval.hendler)
            clearTimeout(this.users[userid].timeInterval.hendler); // todo: (bug ?)
        console.log('2.4');
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
        console.log('2.5');
        this.sendUsersState(MessageType.State);
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
        this.sendUsersState(MessageType.GameEnd);
        this.sendUsersState(MessageType.WinnerText);
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
    //---------New Functions
    FirstGameStart(userid: string) {
      // MessageType.FirstState
            this.users[userid].RestartRequest = false;

            var tu = 0;
            console.log('0.1.1')
            for (var u in this.users) {
                if (this.users[u].RestartRequest == false && this.users[u].state.isActive) {
                    tu++;
                    console.log('0.1.2');
                }
            }
            console.log('0.1.3');

            if (tu => 2) {
                console.log('0.1.3.1');
                //todo:gasasworebelia
                if (this.TableState == GameState.FirstState)
                    this.TableState = GameState.Whaiting;
                else
                    this.TableState = GameState.Running;
                this.gameStart();
            }
        
    }
    UserCharSet(userid: string, char: string) {
    //    MessageType.C_UserChar
        if (Object.keys(this.users).length < 2)
            return;

        if (this.TableState == GameState.Running) {// Received codes should be less than zero
            //---------------
            console.log('0.1.6');
            if (GameTable.IsChar(char, this.keyBoardOption)) {
                if (this.users[userid].state.helpkeys.indexOf(char) < 0) {
                    this.TimeControl(userid, char);
                } else {
                    //todo es  MessageType.State  Sesacvlelia unda iyows Wron Char
                    this.TableStateChanged(userid, MessageType.State, { state: null, data: 'ეს ასო უკვე გამოყენებულია' });
                }
            }
            else {
                this.TableStateChanged(userid, MessageType.BadChar ,{ state: null, data: 'ეს არ არის ასო!' });
            }
            return;
        }


    }

    UserRestartRequest(userid: string) {
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
    }
    //--------
    ///საიტიდან მოთამაშიდან მოვიდა შეტყობინება
    UserAction(userid: string, data: { data: any; }) {
        //todo wasaSlelia.
        console.log("aq ar unda Semosuliyo");
    }

    constructor(public TableStateChanged: (groupid: string,nessageType:string,data:any) => void) {
        // event ჩაჯდეს ნაკადში ! მოგვიანებით.
        this.keyBoardOption = { from: 97, to: 122 };
        this.TableState = GameState.FirstState;
            this.OriginalProverb = this.getProverb();

       
    }

 
    ///Method return true if other user is active
    public leave(userid: string) {
        console.log('Leave--');
        if(this.users[userid].state)
            this.users[userid].state.isActive = false;
        if (this.TableState==GameState.Ended)
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
    }


}

