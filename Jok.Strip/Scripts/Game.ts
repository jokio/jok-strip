
//todo: gasasworebelia testis cvlileba
export interface IGameToClient { // Game To Client messages
    code: number;/*
     -1 user char message
    -10 user restart reqvest
             FullState=1; //new
             FirstState=2;
            GameEnd = 10
           error =100
    keyboardOptionSend = 3 //keyboard option for users    
    */
    state?: UserState[];
    data?: any;
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

export class GameTable {


    //OPTIONS
    private keyBoardOption: KeyBoardOption;
    public static XCHAR = '•';
    public static TIMEOUTTICK = 15000;
    public GameEnd: boolean = false;
    public OriginalProverb: string;
    //-------
    users: {
        [key: string]: {
            timeInterval?: { hendler: number; createDate: Date; }; // ასეთ გადაწყვეტილებას სინქრონიზაციის საჭვალება დაჭირდება!
            state: UserState
        }
    } = {};

    public join(userid: string) {
       
        if (this.OriginalProverb == null || this.OriginalProverb.length > 1) {
            this.OriginalProverb = this.getProverb();
            
        }
        var users = this.users;
        this.TableStateChanged(null, { code: 3, data: this.keyBoardOption });
        if (users[userid] == null) {

            this.createState(userid);
            //---------
            users[userid].state.isActive = true;
            this.sendUsersState(2);
            this.gameStart();

        }
        else {
            users[userid].state.isActive = true;
            if (this.GameEnd) {
                this.gameEnd();
            }
            else {
                this.sendUsersState(1);
            }
        }
       
    }

    public sendUsersState(code:number) {
        //1
        
        for(var k in this.users)
            this.TableStateChanged(k, { code:code, state: this.getState(k) });
    }

    createState(userid:string):UserState {
            var userState = new UserState();
            userState.incorect = 0;
            userState.maxIncorrect = 5; //todo; ჩასასწორებელია
            userState.userId = userid;
            userState.helpkeys = [];
            userState.proverbState = this.verbMaskGenerator(this.OriginalProverb);
        this.users[userid] = { state: userState, timeoutHendler: null };
        return userState;
        }



    private gameStart() {
        // Start Game
        var array = new Array<UserState>();
        for (var k in this.users) {

            if (this.users[k].state.isActive)
                array.push(this.users[k].state)
        }
        if (array.length >= 2) {
            for (var k in array) {
                this.TimeControl(array[k].userId, null);
            }
        }
      
    }

    private TimeControl(userid: string, char?: string) {
        if (this.GameEnd) {
            this.gameEnd();
            return;
        }
       
        this.setNewCharforUser(userid, char);
            if(this.users[userid].timeInterval)
            clearTimeout(this.users[userid].timeInterval.hendler); // todo: (bug ?)
        this.users[userid].timeInterval = {
            hendler: setTimeout(() => {
                //Timeout 'thinking logically'
                if (this.GameEnd)
                    return;
                this.setNewCharforUser(userid, this.getRandomCharForUser(userid));
                //-------------------
                this.TimeControl(userid);
                //--
            }, GameTable.TIMEOUTTICK), createDate: new Date()
        };
        this.sendUsersState(1);
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
        this.GameEnd = (this.users[userid].state.maxIncorrect
        <= this.users[userid].state.incorect)
        || this.users[userid].state.proverbState.indexOf(GameTable.XCHAR) < 0;
       
        if (this.GameEnd)
            this.gameEnd();
        return;

    }

    gameEnd() {
        this.GameEnd = true;
        this.sendUsersState(10);
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
    UserAction(userid: string, data: { code: number; data: any; }) {
        //todo: მონაცემის ტიპი მოსაფიქრებელია
        if (Object.keys(this.users).length < 2)
            return;
        if (data.code < 0) {
            
            var char = <string>data.data; // დასამუშავებელია
            //---------------
            if (GameTable.IsChar(char, this.keyBoardOption)&&this.users[userid].state.helpkeys.indexOf(char)<0) {
                this.TimeControl(userid, char);
            }
            else {
                this.TableStateChanged(null,{ code: 200, state: null, data: 'ეს არ არის ასო!' });
            }
        }
    }

    constructor(public TableStateChanged: (groupid: string,state: IGameToClient) => void) {
        // event ჩაჯდეს ნაკადში ! მოგვიანებით.
        this.keyBoardOption = { from: 97, to: 122 };
       
    }

 
    ///Method return true if other user is active
    public leave(userid: string) {

        if(this.users[userid].state)
            this.users[userid].state.isActive = false;
        if (this.GameEnd)
            this.gameEnd();
        this.sendUsersState(1);
        var tmp = false;
        for (var k in this.users)
            tmp = tmp || this.users[k].state.isActive;
        if (!tmp)
            this.gameEnd();
        return tmp;
    }


}

