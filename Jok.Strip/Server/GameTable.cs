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


        public const char XCHAR = '•';
        public const int TIME_OUT_TICK = 15000;
        public override bool IsStarted
        {
            get { return Status == TableStatus.Started; }
        }

        public override bool IsFinished
        {
            get { return Status == TableStatus.Finished; }
        }

        public TableStatus Status { get; set; }

        //თამაშისთვსი საჭირო პარამეტრები
        private KeyboardOption KeysOption = new KeyboardOption() { From = 97, To = 122 };
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


        public GameTable()
        {
            Status = TableStatus.New;
        }


        protected override void OnJoin(GamePlayer player, object state)
        {

            if (!Players.Contains(player))
            {
                Players.Add(player);
            }
            else
                player = Players[Players.IndexOf(player)];

            GameCallback.KeyOptions(player, this.KeysOption);
            //  GameCallback.PlayerState(player,new []{player});
            //todo მერე გადასაკეთებელი იქნება არჩეული ენის თვის შესაბამისი ღილაკების გაგზავნა.

            if (Status == TableStatus.New && Players.Count == 2)
            {
                Status = TableStatus.Started;
                RestartState();
                SendStates();
                foreach (GamePlayer t in Players)
                {
                    t.TimerCreateDate = DateTime.Now;
                    t.TimerHendler = JokTimer<GamePlayer>.Create();
                    t.TimerHendler.SetTimeout(e =>
                        OnSetNewChar(e, GetRandomChar(e.HelpKeys))
                        , t, TIME_OUT_TICK);
                }
            }

            if (Status == TableStatus.Started)
            {
                SendStates();
                return;
            }
            if (Status == TableStatus.Finished)
            {
                SendStates();
                SendGameEnd();
            }
        }

        protected override void OnLeave(GamePlayer player)
        {
            if (this.Status != TableStatus.Started)
                Players.Remove(player);
            else
            {
                if (!Players.Any(p => p.IsOnline))
                    this.Status = TableStatus.Finished;
            }
            // აქ უნდა ჩაიდოს ცოტა ჭკვიანი ლოგიკა, თუ თამაში დაწყებულია, მოთამაშე არ უნდა ამოიშალოს სიიდან.
        }

        protected void OnSetNewChar(GamePlayer player, string ch)
        {
            switch (Status)
            {
                case TableStatus.Finished:
                    this.SendGameEnd();
                    return;
                case TableStatus.New:
                case TableStatus.StartedWaiting:
                    return;
                default: break;
            }


            if (Status == TableStatus.Started && SetNewChar(player, ch))
            {
                player.TimerCreateDate = DateTime.Now;
                player.TimerHendler.Stop();
                player.TimerHendler.SetTimeout(e =>
                    OnSetNewChar(e,
                        GetRandomChar(e.HelpKeys))
                    , player, TIME_OUT_TICK);

            }

            SendStates();
        }

        protected void OnPlayAgain(GamePlayer pl)
        {
            if (Status != TableStatus.Finished)
                return;
            pl.RestartRequest = true;
            if (Players.All(p => p.RestartRequest))
            {
                Status = TableStatus.Started;
                RestartState();
                GameCallback.RestartGame(Table);
                SendStates();
                foreach (GamePlayer t in Players)
                {
                    //mgoni unda imuSaos ase.
                    t.TimerCreateDate = DateTime.Now;
                    t.TimerHendler.Stop();
                    t.TimerHendler = JokTimer<GamePlayer>.Create();
                    t.TimerHendler.SetTimeout(e =>
                        OnSetNewChar(e, GetRandomChar(e.HelpKeys))
                        , t, TIME_OUT_TICK);
                }

            }
        }



        private string GetRandomChar(List<char> ch)
        {
            for (var i = KeysOption.From; i <= KeysOption.To; i++)
            {
                if (!ch.Contains((char)i))
                    return ((char)i).ToString();
            }
            return XCHAR.ToString();
        }

        private void SendGameEnd()
        {
            Status = TableStatus.Finished;
            GameCallback.GameEnd(Table,
                        (IsWinner(Players[0],
                        Players[1]) ?
                        Players[0].UserID : Players[1].UserID));
        }

        private void SendStates()
        {
            foreach (var player in Players)
            {
                var uid = player.UserID;
                var sPlayer = GetPleyerState(Players.Single(p =>
                              p.UserID != uid));
                sPlayer.HelpKeys.Clear();

                sPlayer.ProverbState = new string(sPlayer.
                        ProverbState.Select(a => this.KeysOption.IsChar(a) ? ' ' : a).ToArray());
                GameCallback.PlayerState(player, new[] { GetPleyerState(player), sPlayer });
            }
        }

        private void RestartState()
        {
            Proverb = GetNewProverb();
            foreach (var player in Players)
            {
                player.Time = TIME_OUT_TICK;
                player.Incorect = 0;
                player.MaxIncorrect = MaxIncorrectCounter(Proverb, KeysOption);
                player.HelpKeys = new List<char>();
                player.RestartRequest = false;
                player.ProverbState = new string(Proverb.ToCharArray().
                    Select(c => this.KeysOption.IsChar(c)
                        ? GameTable.XCHAR
                        : c).ToArray());
            }

        }

        private bool SetNewChar(GamePlayer player, string ch)
        {
            ch = ch.ToLower();
            if (!KeysOption.IsChar(ch) || player.
               HelpKeys.Contains(ch[0]))
                return false;
            player.HelpKeys.Add(ch[0]);
            var str = this.Proverb.ToLower();
            var pstate = player.ProverbState;
            StringBuilder bld = new StringBuilder();
            bool isCorrect = false;
            for (var i = 0; i < str.Length; i++)
            {
                if (pstate[i] == GameTable.XCHAR && str[i] == ch[0])
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

            if (!(player.MaxIncorrect <=
                  player.Incorect || !player.ProverbState.Contains(XCHAR)))
                return true;

            SendStates();
            SendGameEnd();
            return false;
        }

        private GamePlayer GetPleyerState(GamePlayer pl)
        {
            return new GamePlayer()
            {
                ConnectionIDs = pl.ConnectionIDs,
                HelpKeys = pl.HelpKeys.Select(item => item).ToList(), // clone
                TimerHendler = pl.TimerHendler,
                ProverbState = pl.ProverbState,
                Incorect = pl.Incorect,
                MaxIncorrect = pl.MaxIncorrect,
                IPAddress = pl.IPAddress,
                IsVIP = pl.IsVIP,
                IsOnline = pl.IsOnline,
                UserID = pl.UserID,
                Time = TIME_OUT_TICK - (DateTime.Now.Ticks - pl.TimerCreateDate.Ticks) / 10000,
                TimerCreateDate = pl.TimerCreateDate
            };
        }

        private int MaxIncorrectCounter(string str, KeyboardOption option)
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

        private string GetNewProverb()
        {
            return "All good things come to an end.";
        }

        private bool IsWinner(GamePlayer currentPlayer, GamePlayer opponentPlayer)
        {
            if (currentPlayer.ProverbState.Contains(GameTable.XCHAR))
                return true;
            if (opponentPlayer.ProverbState.Contains(GameTable.XCHAR))
                return false;
            return currentPlayer.Incorect < opponentPlayer.Incorect;

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


        //--Game Options
        [IgnoreDataMember]
        public bool RestartRequest = false;

        [DataMember(Name = "time")]
        public long Time { set; get; }

        [DataMember(Name = "helpkeys")]
        public List<char> HelpKeys { set; get; }
        [DataMember(Name = "proverbState")]
        public string ProverbState { set; get; }
        [DataMember(Name = "incorect")]
        public int Incorect { set; get; }
        [DataMember(Name = "maxIncorrect")]
        public int MaxIncorrect { set; get; }
        [DataMember]
        public int UserID { get; set; }

        [IgnoreDataMember]
        public IJokTimer<GamePlayer> TimerHendler { set; get; }
        [IgnoreDataMember]
        public DateTime TimerCreateDate { set; get; }

        public override bool Equals(object obj)
        {
            return (obj is GamePlayer) &&
                   ((GamePlayer)obj).UserID.Equals(UserID);

        }
    }
}