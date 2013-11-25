using Jok.GameEngine;
using Jok.Strip.Common;
using Jok.Strip.Server.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;

namespace Jok.Strip.Server
{
    public class GameTable : GameTableBase<GamePlayer>
    {
        #region Properties

        [DataMember]
        public char XCHAR = '•';
        [DataMember]
        public int TIME_OUT_TICK = 15000;
        public override bool IsStarted
        {
            get { return Status == TableStatus.Started || Status == TableStatus.StartedWaiting; }
        }

        public override bool IsFinished
        {
            get { return Status == TableStatus.Finished; }
        }

        [DataMember]
        public int MaxIncorrect { set; get; }
        [DataMember]
        public TableStatus Status { get; set; }

        [DataMember]
        public GamePlayer LastWinnerPlayer
        {
            set;
            get;
        }
        [DataMember]
        public KeyboardOption KeysOption = new KeyboardOption() { From = 97, To = 122 };

        private string Proverb { set; get; }
        #endregion



        public void SetNewChar(int userid, string ch)
        {

            var player = GetPlayer(userid);
            if (player == null) return;

            lock (SyncObject)
            {
                OnSetNewChar(player, ch);
            }

        }

        public void PlayAgain(int userid)
        {
            var player = GetPlayer(userid);
            if (player == null) return;

            lock (SyncObject)
            {
                this.OnPlayAgain(player);
            }
        }



        protected override void OnJoin(GamePlayer player, object state)
        {
            switch (Status)
            {
                case TableStatus.New:
                    if (!Players.Contains(player))
                        AddPlayer(player);

                    if (Players.Count == 2)
                    {
                        Init();
                        Start();
                        SendPlayerState();
                    }
                    else
                    {
                        GameCallback.TableState(player, this);
                    }

                    break;

                case TableStatus.Started:
                    GameCallback.TableState(this, this);
                    SendPlayerState();
                    break;


                case TableStatus.StartedWaiting:
                    if (!Players.Contains(player))
                        return;
                    Status = TableStatus.Started;
                    GameCallback.TableState(this, this);
                    SendPlayerState();
                    break;
            }
        }

        protected override void OnLeave(GamePlayer player)
        {

            switch (Status)
            {
                case TableStatus.New:
                    RemovePlayer(player);
                    break;


                case TableStatus.Started:
                    Status = TableStatus.StartedWaiting;
                    GameCallback.TableState(this, this);
                    break;


                case TableStatus.StartedWaiting:
                    break;


                case TableStatus.Finished:
                    RemovePlayer(player);
                    break;
            }

        }

        protected void OnSetNewChar(GamePlayer player, string ch)
        {
            if ((Status != TableStatus.Started && Status != TableStatus.StartedWaiting) || !SetNewChar(player, ch))
                return;
            player.TimerCreateDate = DateTime.Now;
            player.TimerHendler.SetTimeout(OnPlayerTime, player, TIME_OUT_TICK);
            //    var oponent = GetNextPlayer(player);
            //    var oponentProverb = new string(oponent.ProverbState.Select(a => this.KeysOption.IsChar(a) ? ' ' : a).ToArray());
            //    var playerProverb = new string(player.ProverbState.Select(a => this.KeysOption.IsChar(a) ? ' ' : a).ToArray());
            //    var currentTime = TIME_OUT_TICK - (DateTime.Now.Ticks - player.TimerCreateDate.Ticks)/10000;
            //    var oponentTime = TIME_OUT_TICK - (DateTime.Now.Ticks - oponent.TimerCreateDate.Ticks)/10000;
            //    GameCallback.SetCharResult(player, player.HelpKeys, player.ProverbState, currentTime, player.Incorect, oponentProverb, oponent.Incorect);
            //    GameCallback.SetCharResult(oponent, oponent.HelpKeys, oponent.ProverbState, oponentTime, oponent.Incorect, playerProverb, player.Incorect);
            //
            SendPlayerState();
        }

        protected void OnPlayAgain(GamePlayer pl)
        {
            if (Status != TableStatus.Finished)
                return;
            Init();
            Start();
            SendPlayerState();
        }



        void Init()
        {
            MaxIncorrect = 0;
            Status = TableStatus.New;
            Players.ForEach(e => e.Init());
            Proverb = string.Empty;
        }

        void Start()
        {
            Status = TableStatus.Started;
            Proverb = GetNewProverb();
            MaxIncorrect = MaxIncorrectCounter(Proverb, KeysOption);
            foreach (var player in Players)
            {
                player.Time = TIME_OUT_TICK;

                player.ProverbState = new string(Proverb.ToCharArray().
                    Select(c => this.KeysOption.IsChar(c)
                        ? XCHAR
                        : c).ToArray());
                player.TimerCreateDate = DateTime.Now;
                player.TimerHendler.SetTimeout(OnPlayerTime, player, TIME_OUT_TICK);
            }
            GameCallback.TableState(this, this);

        }

        void Finish()
        {

            Status = TableStatus.Finished;

            LastWinnerPlayer = Players.FirstOrDefault(p => !p.ProverbState.Contains(XCHAR));
            if (LastWinnerPlayer == null) //აქ ასხამს თუ მხოლოდ ერთი მოთამაშეა! ჯერ არ ვივი ერთი მოთამაშე როგორ აიჩითა.
                LastWinnerPlayer = Players[0].Incorect < Players[1].Incorect ? Players[0] : Players[1];
            Players.ForEach(p => p.TimerHendler.Stop());
            GameCallback.TableState(Table, this);

        }



        string GetRandomChar(List<char> ch)
        {
            for (var i = KeysOption.From; i <= KeysOption.To; i++)
            {
                if (!ch.Contains((char)i))
                    return ((char)i).ToString();
            }
            return XCHAR.ToString();
        }

        void OnPlayerTime(GamePlayer player)
        {
            OnSetNewChar(player, GetRandomChar(player.HelpKeys));
        }

        void SendPlayerState()
        {
            if (Players.Count != 2)
            {//todo tavi ver davadgi aq rogor Semodis jer !
                return;
            }
            var player = Players[0];
            var oponent = GetNextPlayer(player);
            var oponentProverb = new string(oponent.ProverbState.Select(a => this.KeysOption.IsChar(a) ? ' ' : a).ToArray());
            var playerProverb = new string(player.ProverbState.Select(a => this.KeysOption.IsChar(a) ? ' ' : a).ToArray());
            var currentTime = TIME_OUT_TICK - (DateTime.Now.Ticks - player.TimerCreateDate.Ticks) / 10000;
            var oponentTime = TIME_OUT_TICK - (DateTime.Now.Ticks - oponent.TimerCreateDate.Ticks) / 10000;
            GameCallback.SetCharResult(player, player.HelpKeys, player.ProverbState, currentTime, player.Incorect, oponentProverb, oponent.Incorect);
            GameCallback.SetCharResult(oponent, oponent.HelpKeys, oponent.ProverbState, oponentTime, oponent.Incorect, playerProverb, player.Incorect);
        }

        bool SetNewChar(GamePlayer player, string ch)
        {
            ch = ch.ToLower();
            if (!KeysOption.IsChar(ch) || player.
               HelpKeys.Contains(ch[0]))
                return false;
            player.HelpKeys.Add(ch[0]);
            var str = this.Proverb.ToLower();
            var pstate = player.ProverbState;
            var bld = new StringBuilder();
            bool isCorrect = false;
            for (var i = 0; i < str.Length; i++)
            {
                if (pstate[i] == XCHAR && str[i] == ch[0])
                {
                    bld.Append(Proverb[i]);
                    isCorrect = true;
                }
                else
                {
                    bld.Append(pstate[i]);
                }
            }

            if (this.Status == TableStatus.Started)
                player.ProverbState = bld.ToString();

            if (!isCorrect)
            {
                player.Incorect++;
            }

            if (!CheckFinish())
                return true;

            Finish();
            return false;
        }

        bool CheckFinish()
        {
            return Players.Any(p => MaxIncorrect <= p.Incorect || !p.ProverbState.Contains(XCHAR));

        }

        int MaxIncorrectCounter(string str, KeyboardOption option)
        {
            str = str.ToLower();
            var arr = new HashSet<char>();
            for (var i = 0; i < str.Length; i++)
            {
                if (option.IsChar(str[i]))
                    arr.Add(str[i]);
            }
            return (int)Math.Round((((option.To - option.From) - arr.Count) * 0.7), 0);
        }

        string GetNewProverb()
        {
            var arr = new[]
            {
                "All good things come to an end.", 
                "Two wrongs don't make a right",
                "Hope for the best, but prepare for the worst.",
                "Keep your friends close and your enemies closer.",
                "A picture is worth a thousand words.",
                "Easy come, easy go.",
                "Don't put all your eggs in one basket.",
                "A chain is only as strong as its weakest link.",
                "You can lead a horse to water, but you can't make him drink."
            };

            return arr[DateTime.Now.Second % 8];//random
        }
    }

    [DataContract]
    public class GamePlayer : IGamePlayer
    {
        [DataMember]
        public string IPAddress { get; set; }

        [DataMember]
        public bool IsVIP { get; set; }

        [DataMember]
        public bool IsOnline { get; set; }

        [IgnoreDataMember]
        public List<string> ConnectionIDs { get; set; }

        [IgnoreDataMember]
        public long Time { set; get; }

        [IgnoreDataMember]
        public List<char> HelpKeys { set; get; }

        [IgnoreDataMember]
        public string ProverbState { set; get; }

        [IgnoreDataMember]
        public int Incorect { set; get; }

        [DataMember]
        public int UserID { get; set; }

        [IgnoreDataMember]
        public IJokTimer<GamePlayer> TimerHendler { set; get; }

        [IgnoreDataMember]
        public DateTime TimerCreateDate { set; get; }


        public GamePlayer()
        {
            TimerHendler = JokTimer<GamePlayer>.Create();
        }


        public void Init()
        {
            this.Time = 0;

            this.Incorect = 0;

            this.HelpKeys = new List<char>();

            this.ProverbState = String.Empty; //new string(Proverb.ToCharArray().

        }
    }
}