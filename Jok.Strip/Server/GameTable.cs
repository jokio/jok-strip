using Jok.Strip.Common;
using Jok.Strip.Server.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Jok.Strip.Server
{
    /// <summary>
    /// თანმიმდევრობა:
    /// 1. პროპერთიები
    /// 2. public მეთოდები
    /// 3. protected მეთოდები
    /// 4. private მეთოდები
    /// </summary>
    public class GameTable : GameTableBase<GamePlayer>
    {
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


        protected override void OnJoin(GamePlayer player, object state)
        {
            Players.Add(player);

            ActivePlayer = Players.First();
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

    public class GamePlayer : IGamePlayer
    {
        public int UserID { get; set; }

        public string IPAddress { get; set; }

        public bool IsVIP { get; set; }

        public bool IsOnline { get; set; }

        public List<string> ConnectionIDs { get; set; }
    }
}