

export interface IGameToClient { // Game To Client messages
    code: number;/*
             FullState=1; //new
             FirstState=2;
            GameEnd = 10
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
    public incorect: number;
    public maxIncorrect: number;
}
export class KeyBoardOption{ from: number; to: number }

export class GameTable {


    //OPTIONS
    private keyBoardOption: KeyBoardOption;
    public static XCHAR = '•';
    public static TIMEOUTTICK = 10000;
    public GameEnd: boolean = false;
    //-------
    users: {
        [key: string]: {

            originProverb: string;
            timeInterval?: { hendler: number; createDate: Date; }; // ასეთ გადაწყვეტილებას სინქრონიზაციის საჭვალება დაჭირდება!
            state: UserState
        }
    } = {};

    public join(userid: string) {

        var users = this.users;
        if (users[userid] == null) {
            var verbOption = this.getProverb();
            var userState = new UserState();
            userState.incorect = 0;
            userState.maxIncorrect = 5; //todo; ჩასასწორებელია
            userState.userId = userid;
            userState.helpkeys = [];
            users[userid] = { originProverb: verbOption, state: userState, timeoutHendler: null };
            userState.proverbState = this.verbMaskGenerator(verbOption);



        }
        users[userid].state.isActive = true;



        this.TableStateChanged({ code: 2, state: this.GetState() });
        this.gameStart();
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
        this.TableStateChanged({ code: 1, state: this.GetState() });
    }

    private setNewCharforUser(userid: string, char: string) {
        if (char == null)
            return;
        char = char.toLowerCase();
   
        if (!(GameTable.IsChar(char, this.keyBoardOption)) ||
            this.users[userid].state.helpkeys.indexOf(char) >= 0)
            return;
    
        this.users[userid].state.helpkeys.push(char);
   
        var orgp = this.users[userid].originProverb.toLowerCase();
      
        var pstate = this.users[userid].state.proverbState;
    
        var newPstate = '';
        var isCorect = false;
      
    
        if (this.users[userid].originProverb.length != this.users[userid].state.proverbState.length)
            throw "sthring not match";
        for (var i = 0; i < this.users[userid].originProverb.length; i++) {
           
            if (pstate.charAt(i) == GameTable.XCHAR && orgp.charAt(i) == char) {
                //originalidan aRdgena
                
                newPstate += this.users[userid].originProverb.charAt(i);
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
        this.TableStateChanged({ code: 10, state: this.GetState() });
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
    public GetState(): UserState[] {
        var arr: UserState[] = [];
        for (var k in this.users) {

            this.users[k].state.time = GameTable.TIMEOUTTICK - (this.users[k].timeInterval ? (new Date()).getTime() - this.users[k].timeInterval.createDate.getTime() : 0);
            arr.push(this.users[k].state);
        }
        return arr;
    }

    /// ასოსების დამალვა!
    verbMaskGenerator(text: string): string {
        if (text == null) {
            console.log("method verbMaskGenerator(text: string)");
            console.warn("text is empty", text, this);
            throw "text is empty ";
        }
  
        var keyobj = this.keyBoardOption;

        //   todo: შესაცვლელია უკეთესი ლოგიკა!
        text.split(' ').forEach((e) => {
         
            if (text.indexOf(GameTable.XCHAR)>=0)
                return;
            if (e.length >= 4) {
                // შესაცვლელია! + random
                var replStr = '';
                e.split('').forEach((ch) => {
              
                    if (GameTable.IsChar(ch, keyobj)) {
                        replStr += GameTable.XCHAR; // '•'
                    } else {
                        replStr += ch;
                    }
                });
                text = text.replace(e, replStr);
            }
        });
        return text;
    }

    ///ახალი ანადზის გენერირება
    getProverb(): string  {
        return "All good things must come to an end";
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
                this.TableStateChanged({ code: 200, state: null, data: 'ეს არ არის ასო!' });
            }
        }
    }

    constructor(public TableStateChanged: (state: IGameToClient) => void) {
        // event ჩაჯდეს ნაკადში ! მოგვიანებით.
        this.keyBoardOption = { from: 97, to: 122 };
       
    }

 
    ///Method return true if other user is active
    public leave(userid: string) {

        if(this.users[userid].state)
            this.users[userid].state.isActive = false;
        if (this.GameEnd)
            this.gameEnd();
        this.TableStateChanged({ code: 1, state: this.GetState() });
        var tmp = false;
        for (var k in this.users)
            tmp = tmp || this.users[k].state.isActive;
        if (!tmp)
            this.gameEnd();
        return tmp;
    }


}

