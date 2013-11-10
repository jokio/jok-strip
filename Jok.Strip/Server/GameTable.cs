﻿
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
            if (option.From <= (int)key[0] || option.To >= (int)key[0])
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
        public static T Clone<T>(this object source)
        {
            if (!typeof(T).IsSerializable)
            {
                throw new ArgumentException("The type must be serializable.", "source");
            }

            // Don't serialize a null object, simply return the default for that object
            if (Object.ReferenceEquals(source, null))
            {
                return default(T);
            }

            IFormatter formatter = new BinaryFormatter();
            Stream stream = new MemoryStream();
            using (stream)
            {
                formatter.Serialize(stream, source);
                stream.Seek(0, SeekOrigin.Begin);
                return (T)formatter.Deserialize(stream);
            }
        }


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
            return (int)Math.Round(((option.To - option.From) - arr.Count * 0.7), 0);
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

        public void SetNewChar(int userid, string ch)
        {
            
            var player = GetPlayer(userid);
            if (player == null) return;

            lock (SyncObject)
            {
                OnSetNewChar(player,ch);
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
            GameCallback.Options(player, this.KeysOption);
            //todo მერე გადასაკეთებელი იქნება არჩეული ენის თვის შესაბამისი ღილაკების გაგზავნა.

            if (Status == TableStatus.New && Players.Count == 2)
            // სულ ორი მოტამაშეს შეუძლია ამ თამაშის ერთდროული თამაში.
            {
                Status = TableStatus.Started;
                RestartState();
                SendStates();
                for (int i=0;i<Players.Count;i++)
                { //mgoni unda imuSaos ase.
                    Players[i].TimerCreateDate = DateTime.Now;
                    Players[i].TimerHendler = JokTimer<int>.Create();
                    Players[i].TimerHendler.SetTimeout(e =>
                    OnSetNewChar(Players[i],
                    GetRandomChar(Players[i].HelpKeys))
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
                if (!ch.Contains((char) i))
                    return ((char)i).ToString();
            }
            return XCHAR.ToString();
        }
        private void SendGameEnd()
        {
            GameCallback.GameEnd(Table,
                        (IsWinner(Players[0],
                        Players[1]) ?
                        Players[0].UserID : Players[1].UserID));
        }

        private void SendStates()
        {
            foreach (var player in Players)
            {
                var sPlayer = Players.Single(p =>
                              p.UserID != player.UserID);
                var tmpstate = GetPleyerState(sPlayer);
                tmpstate.HelpKeys = null;
                GameCallback.PlayerState(player, GetPleyerState(player), tmpstate);
            }
        }

        private GamePlayer GetPleyerState(GamePlayer pl)
        {
            var sState = pl.Clone<GamePlayer>();
            sState.Time = TIME_OUT_TICK - (pl.TimerHendler != null &&
                          pl.TimerCreateDate != default(DateTime) ?
                          DateTime.Now.Millisecond - pl.TimerCreateDate.Millisecond : 0);
            return sState;
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

            if (!SetNewChar(player, ch))
            {
                //todo Check game is End;

                player.TimerCreateDate = DateTime.Now;
                if(player.TimerHendler !=null)
                    player.TimerHendler.Stop();
                player.TimerHendler.SetTimeout(e =>
                    OnSetNewChar(player,
                    GetRandomChar(player.HelpKeys))
                    ,0,TIME_OUT_TICK);

            };
        }


        private bool SetNewChar(GamePlayer player, string ch)
        {
            ch = ch.ToLower();
            if(!KeysOption.IsChar(ch) || player.
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
            Players.Remove(player);

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
    }
  
    [DataContract]
    public class GamePlayer : IGamePlayer
    {

        public string IPAddress { get; set; }

        public bool IsVIP { get; set; }

        public bool IsOnline { get; set; }
        
        public List<string> ConnectionIDs { get; set; }

        //--Game Options

        [DataMember]
        public long Time { set; get; }

        [DataMember]
        public List<char> HelpKeys { set; get; }
        [DataMember]
        public string ProverbState { set; get; }
        [DataMember]
        public int Incorect { set; get; }
        [DataMember]
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