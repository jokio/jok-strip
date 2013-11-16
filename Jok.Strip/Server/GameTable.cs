
using System.Data.Entity;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Formatters.Binary;
using System.Text;
using System.Xml;
using Antlr.Runtime;
using Jok.Strip.Common;
using Jok.Strip.Server;
using Jok.Strip.Server.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.Ajax.Utilities;

namespace Jok.Strip.Server
{
    //####### ეს დროებით არის აქ.
    public static class Extentions
    {
        public static bool IsChar(this KeyboardOption option, string key)
        {
            if (string.IsNullOrEmpty(key) || key.Length != 1)
                return false;
            key = key.ToLower();
            if (option.From <= (int)key[0] && option.To >= (int)key[0])
                return true;
            return false;
        }

        public static bool IsChar(this KeyboardOption option, char key)
        {
            return option.IsChar(key.ToString());
        }

        /// <summary>
        /// Perform a deep Copy of the object.
        /// </summary>
        /// <typeparam name="T">The type of object being copied.</typeparam>
        /// <param name="source">The object instance to copy.</param>
        /// <returns>The copied object.</returns>
    }

    //######## --------


    /// <summary>
    /// თანმიმდევრობა:
    /// 1. პროპერთიები
    /// 2. public მეთოდები
    /// 3. protected მეთოდები
    /// 4. private მეთოდები
    /// </summary>
    public class GameTable : GameTableBase<GamePlayer>
    {
        #region Const

        public const char XCHAR = '•';
        public const int TIME_OUT_TICK = 3000;

        #endregion

        #region Properties

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

        #region static functions

        public static int MaxIncorrectCounter(string str, KeyboardOption option)
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

        public static string GetNewProverb()
        {
            return "All good things come to an end.";
        }

        public static bool IsWinner(GamePlayer fuser, GamePlayer suser)
        {
            if (fuser.ProverbState.Contains(GameTable.XCHAR))
                return true;
            if (suser.ProverbState.Contains(GameTable.XCHAR))
                return false;
            return fuser.Incorect < suser.Incorect;

        }
        #endregion

        /// <summary>
        /// გარედან გამოძახებადი მეთოდები შემოგვაქ public მეთოდებით ასეთი სახით, რომელშიც ვაკეთებთ მაგიდზე Player-ს განსაზღვრას userid-თი და შემდეგ ვიძახებთ შესაბამის protected მეთოდს
        /// ამ მეთოდის საქმე არის 2 რამე:
        /// 1. გაიგოს რომელი userid რომელიც გადმოვაწოდეთ ამ მაგიდაზე თამაშობდა თუ არა
        /// 2. lock-ში ჩასვას შესასრულებელი ლოგიკა
        /// </summary>
        /// <param name="userid"></param>
        /// <param name="someParam"></param>
        public void IncomingMethod(int userid, string someParam)
        {
            var player = GetPlayer(userid);
            if (player == null) return;

            lock (SyncObject)
            {
                OnIncomingMethod(player, someParam);
            }
        }

        public void Ping(int userid)
        {
            var player = GetPlayer(userid);
            if (player == null) return;

            lock (SyncObject)
            {
                OnPing(player);
            }
        }


        public void OnRestartCall(int userid)
        {
            var player = GetPlayer(userid);
            if (player == null) return;
            lock (SyncObject)
            {
                this.TryRestartGame(player);
            }
        }

        public void SetNewChar(int userid, string ch)
        {

            var player = GetPlayer(userid);
            if (player == null) return;

            lock (SyncObject)
            {
                OnSetNewChar(player, ch);
            }

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
//mgoni unda imuSaos ase.
                    t.TimerCreateDate = DateTime.Now;
                    t.TimerHendler = JokTimer<int>.Create();
                    t.TimerHendler.SetTimeout(e =>
                        OnSetNewChar(t, // PROBLEMA  AXAL CVLADSI IQNEBA ROMELIC SXVA FUNQCIAS ASINQRONULI MUSAOBISTVIS GADAECEMA. 
                            GetRandomChar(t.HelpKeys))
                        , 0, TIME_OUT_TICK);
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
                var sPlayer = GetPleyerState(Players.Single(p =>
                              p.UserID != player.UserID));
                sPlayer.HelpKeys.Clear();
               
                sPlayer.ProverbState= new string(sPlayer.ProverbState.Select(a => this.KeysOption.IsChar(a) ? ' ' : a).ToArray());
                GameCallback.PlayerState(player, new[] { GetPleyerState(player), sPlayer });
            }
        }


        private void TryRestartGame(GamePlayer pl)
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
                    t.TimerHendler = JokTimer<int>.Create();
                    t.TimerHendler.SetTimeout(e =>
                        OnSetNewChar(t, // PROBLEMA  AXAL CVLADSI IQNEBA ROMELIC SXVA FUNQCIAS ASINQRONULI MUSAOBISTVIS GADAECEMA. 
                            GetRandomChar(t.HelpKeys))
                        , 0, TIME_OUT_TICK);
                }

            }
        }
        public static GamePlayer GetPleyerState(GamePlayer pl)
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
                Time = TIME_OUT_TICK - (pl.TimerHendler != null &&
                                        pl.TimerCreateDate != default(DateTime)
                    ? DateTime.Now.Millisecond - pl.TimerCreateDate.Millisecond
                    : 0),
                TimerCreateDate = pl.TimerCreateDate
            };
        }
        

        private void RestartState()
        {
            Proverb = GameTable.GetNewProverb();
            foreach (var player in Players)
            {
                player.Time = TIME_OUT_TICK;
                player.Incorect = 0;
                player.MaxIncorrect = GameTable.
                                             MaxIncorrectCounter(Proverb, KeysOption);
                player.HelpKeys = new List<char>();
                player.RestartRequest = false;
                player.ProverbState = new string(Proverb.ToCharArray().
                    Select(c => this.KeysOption.IsChar(c)
                        ? GameTable.XCHAR
                        : c).ToArray());
            }

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
            lock (this)
            {


                if (Status == TableStatus.Started && SetNewChar(player, ch))
                {

                    player.TimerCreateDate = DateTime.Now;
                    if (player.TimerHendler != null)
                        player.TimerHendler.Stop();
                    player.TimerHendler.SetTimeout(e =>
                        OnSetNewChar(player,
                            GetRandomChar(player.HelpKeys))
                        , 0, TIME_OUT_TICK);

                }
                ;
            }
            SendStates();
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

            
            var end = (player.MaxIncorrect <=
                           player.Incorect || !player.ProverbState.Contains(XCHAR));
                if (end)
                {
                    SendStates();
                    SendGameEnd();
                    return false;
                }
            
            return true;
        }

        protected override void OnLeave(GamePlayer player)
        {
            if (this.Status != TableStatus.Started)
                Players.Remove(player);
            else
            {
                if(!Players.Any(p=>p.IsOnline))
                    this.Status = TableStatus.Finished;
            }
            // აქ უნდა ჩაიდოს ცოტა ჭკვიანი ლოგიკა, თუ თამაში დაწყებულია, მოთამაშე არ უნდა ამოიშალოს სიიდან.
        }

        protected void OnIncomingMethod(GamePlayer player, string someParam)
        {
            //მაგიდის ყველა წევრისთვის გაგზავნა
            GameCallback.SomeCallback(Table, "Sent to table (all players)");

            //მაგიდის კონკრეტული წევრისთვის გაგზავნა
            GameCallback.SomeCallback(ActivePlayer, "Sent to ActivePlayer");
        }

        protected void OnPing(GamePlayer player)
        {
            GameCallback.Pong(player);
        }


        public GameTable()
        {
            Status = TableStatus.New;
        }
    }

    [DataContract]
    public class GamePlayer : IGamePlayer
    {

        public string IPAddress { get; set; }

        public bool IsVIP { get; set; }

        public bool IsOnline { get; set; }

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
        public IJokTimer<int> TimerHendler { set; get; }
        [IgnoreDataMember]
        public DateTime TimerCreateDate { set; get; }
        //--
        public override bool Equals(object obj)
        {
            return (obj is GamePlayer) &&
                   ((GamePlayer)obj).UserID.Equals(UserID);

        }
    }
}