using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Runtime.Serialization;
using System.Threading.Tasks;
using System.Timers;
using System.Web;

namespace Jok.Strip.Common
{
    public abstract class GameHubBase<TTable> : GameHubBase<GameHubConnection<TTable>, TTable>
    where TTable : class, IGameTable, new()
    {
    }

    public abstract class GameHubBase<TConnection, TTable> : Hub
        where TConnection : GameHubConnection<TTable>, new()
        where TTable : class, IGameTable, new()
    {
        public static ConcurrentDictionary<string, TConnection> Connections { get; set; }
        public static List<TTable> Tables { get; set; }
        public static object TablesSyncObject = new object();

        static GameHubBase()
        {
            Connections = new ConcurrentDictionary<string, TConnection>();
            Tables = new List<TTable>();
        }

        protected virtual bool IsTablesEnabled
        {
            get { return true; }
        }

        protected virtual bool OneConnectionPerUserID
        {
            get { return true; }
        }


        public override Task OnConnected()
        {
            var token = Context.QueryString["token"];
            var ipaddress = Context.Request.Environment["server.RemoteIpAddress"].ToString();
            var connectionID = Context.ConnectionId;
            var channel = Context.QueryString["channel"] ?? String.Empty;

            base.OnConnected().Wait();

            ConnectedEvent(token, ipaddress, channel, connectionID);

            return null;
        }

        public override Task OnReconnected()
        {
            var token = Context.QueryString["token"];
            var ipaddress = Context.Request.Environment["server.RemoteIpAddress"].ToString();
            var connectionID = Context.ConnectionId;
            var channel = Context.QueryString["channel"] ?? String.Empty;


            base.OnReconnected().Wait();

            // თუ პამეხების გამო შიდა რეკონექტი იყო, არ სჭირდება მაშინ აქ არაფრის გაკეთება
            // მემორიში საჭირო ინფო არის ისედაც
            TConnection user;
            if (Connections.TryGetValue(connectionID, out user))
                return null;

            ConnectedEvent(token, ipaddress, channel, connectionID);

            return null;
        }

        public override Task OnDisconnected()
        {
            var connectionID = Context.ConnectionId;

            base.OnDisconnected().Wait();

            TConnection user;
            if (!Connections.TryRemove(connectionID, out user))
                return null;

            if (IsTablesEnabled)
            {
                user.Table.Leave(user.UserID, connectionID);

                if (user.Table.PlayersCount == 0 || user.Table.OnlinePlayersCount == 0)
                    lock (TablesSyncObject)
                    {
                        Tables.Remove(user.Table);
                    }

                user.Table = null;
            }

            return null;
        }


        protected virtual void ConnectedEvent(string token, string ipaddress, string channel, string connectionID)
        {
            try
            {
                if (String.IsNullOrEmpty(token))
                {
                    this.Clients.Caller.Close("Token not provided");
                    return;
                }

                var userInfo = GetUserInfo(token, ipaddress);

                if (!userInfo.IsSuccess)
                {
                    this.Clients.Caller.Close("User info not found for token: " + token);
                    return;
                }

                var userid = userInfo.UserID;
                var isVIP = userInfo.IsVIP;


                var conn = new TConnection
                {
                    UserID = userid,
                    Channel = channel,
                    IPAddress = ipaddress,
                    IsVIP = isVIP,
                    Lang = userInfo.Lang
                };

                Groups.Add(connectionID, userid.ToString()).Wait();

                // თუ მხოლოდ ერთი კონექშენია დაშვებული, დანარჩენებს ვთიშავთ
                if (OneConnectionPerUserID)
                {
                    Clients.Group(conn.UserID.ToString(), connectionID).Close("Another connection is open");
                }

                // ვუგზავნით მომხმარებელს ინფორმაციას თუ რომელი იუზერია
                Clients.Caller.UserAuthenticated(userid, true);
                // ხოლო თუ კიდე არის სხვა მოერთებული იგივე იუზერ აიდით, იმასაც ვუგზავნით ინფოს რომ მოერთდა ვიღაც კიდე
                if (!OneConnectionPerUserID)
                    Clients.Group(conn.UserID.ToString(), connectionID).UserAuthenticated(userid, false);

                if (!Connections.TryAdd(connectionID, conn))
                {
                    this.Clients.Caller.Close("User object add to Users collection failed");
                    return;
                }

                if (IsTablesEnabled)
                {
                    conn.Table = GetTable(userid, channel, ipaddress);

                    if (conn.Table == null)
                    {
                        this.Clients.Caller.Close("User can't join table. User.Table is null");
                        return;
                    }

                    //await Groups.Add(connectionID, user.Table.ID.ToString());

                    conn.Table.Join(userid, connectionID, ipaddress, isVIP, conn);
                }
            }
            catch (Exception ex)
            {
                this.Clients.Caller.Close(ex.ToString());
            }
        }

        protected virtual JokUserInfo GetUserInfo(string token, string ipaddress)
        {
            return JokAPI.GetUser(token, ipaddress);
        }

        private TTable GetTable(int userid, string channel, string ipaddress)
        {
            var table = default(TTable);

            lock (TablesSyncObject)
            {
                table = FindTable(userid, channel, ipaddress);
                if (table == default(TTable))
                {
                    table = CreateTable(channel);
                    if (table != null)
                        Tables.Add(table);
                }
            }

            return table;
        }

        protected virtual TTable FindTable(int userid, string channel, string ipaddress)
        {
            var table = default(TTable);

            // in started_waiting tables
            table = Tables.FirstOrDefault(t => t.UserIDs.Contains(userid) && t.IsStarted && !t.IsFinished);

            if (table != default(TTable)) return table;


            // find in existing tables
            table = Tables.FirstOrDefault(t =>
                t.Channel == channel &&
                t.PlayersCount < t.MaxPlayersCount &&
                !t.IsStarted &&
                !t.IsFinished &&
                (channel != "tournament" || TournamentChannelValidations(t, ipaddress)));

            return table;
        }

        protected virtual bool TournamentChannelValidations(TTable table, string ipaddress)
        {
            if (table.PlayersCount == table.MaxPlayersCount)
                return false;

            // ყველა ip უნდა იყოს განსხვავებული
            if (table.IPAddresses.Contains(ipaddress))
                return false;

            if (table.MaxPlayersCount != 2 || table.PlayersCount != 1 || table.IPAddresses.Count != 1)
                return true;

            var now = DateTime.Now;

            return JokSharedInfo.IPsLog.Count(l => (now - l.CreateDate < TimeSpan.FromHours(2)) && (
                (l.IP1 == table.IPAddresses[0] && l.IP2 == ipaddress) ||
                (l.IP2 == table.IPAddresses[0] && l.IP1 == ipaddress))) == 0;
        }

        protected virtual TTable CreateTable(string channel)
        {
            return new TTable
            {
                ID = Guid.NewGuid(),
                Channel = channel
            };
        }

        protected TConnection GetCurrentUser()
        {
            TConnection user;
            if (Connections.TryGetValue(Context.ConnectionId, out user))
                return user;

            return null;
        }
    }

    public static class JokAPI
    {
        /// <summary>
        /// Default: https://api.jok.ge/user/{0}/info?ip={1}&gameid={2}
        /// </summary>
        public static string GetUserUrl { get; set; }
        /// <summary>
        /// Default: 
        /// </summary>
        public static string FinishGameUrl { get; set; }
        public static string GameID { get; set; }

        static JokAPI()
        {
            GameID = "0";
            GetUserUrl = "https://api.jok.ge/user/{0}/info?ip={1}&gameid={2}";
            FinishGameUrl = "https://api.jok.ge/game/{0}/finish";
        }


        public static JokUserInfo GetUser(string token, string ipaddress)
        {
            try
            {
                var url = String.Format(GetUserUrl, token, ipaddress, GameID);
                var t = new HttpClient().GetStringAsync(url);
                t.Wait();

                return JsonConvert.DeserializeObject<JokUserInfo>(t.Result);
            }
            catch
            {
                return new JokUserInfo();
            }
        }

        public static void FinishGame(bool isFullGame, string channel, params GameFinishPlayerInfo[] playerInfos)
        {
            try
            {
                var gameInfo = new GameFinishInfo
                {
                    IsFull = isFullGame,
                    Channel = channel,
                    Players = playerInfos.ToList()
                };


                var url = String.Format(FinishGameUrl, GameID);
                var t = new HttpClient().PostAsJsonAsync<GameFinishInfo>(url, gameInfo);
                t.Wait();

                if (t.Result.StatusCode == System.Net.HttpStatusCode.OK)
                {
                }
            }
            catch
            {
            }
        }
    }

    public class JokUserInfo
    {
        public bool IsSuccess { get; set; }
        public string Reason { get; set; }
        public int UserID { get; set; }
        public string Nick { get; set; }
        public bool IsVIP { get; set; }
        public string Lang { get; set; }
    }

    public class GameHubConnection<TTable>
    {
        public int UserID { get; set; }
        public string Channel { get; set; }
        public string IPAddress { get; set; }
        public bool IsVIP { get; set; }
        public string Lang { get; set; }
        public TTable Table { get; set; }
    }

    class IPAddressesLog
    {
        public string IP1 { get; set; }
        public string IP2 { get; set; }
        public DateTime CreateDate { get; set; }
    }

    public interface ICallback
    {
        List<string> ConnectionIDs { get; set; }
    }

    public interface IGameTable : ICallback
    {
        Guid ID { get; set; }
        int MaxPlayersCount { get; }
        int PlayersCount { get; }
        int OnlinePlayersCount { get; }
        string Channel { get; set; }
        bool IsStarted { get; }
        bool IsFinished { get; }
        List<string> IPAddresses { get; }
        List<int> UserIDs { get; }

        void Join(int userID, string connectionID, string ipaddress, bool isVIP, object state = null);
        void Leave(int userID, string connectionID);
    }

    public interface IGamePlayer : ICallback
    {
        int UserID { get; set; }
        string IPAddress { get; set; }
        bool IsVIP { get; set; }
        bool IsOnline { get; set; }
    }

    [DataContract]
    public abstract class GameTableBase<TGamePlayer> : IGameTable
        where TGamePlayer : class, IGamePlayer, new()
    {
        #region IGameTable
        [DataMember(Name = "id")]
        public Guid ID { get; set; }
        [DataMember(Name = "channel")]
        public string Channel { get; set; }
        [IgnoreDataMember]
        public List<string> IPAddresses { get; set; }
        [IgnoreDataMember]
        public virtual int MaxPlayersCount
        {
            get { return 2; }
        }
        [IgnoreDataMember]
        public int PlayersCount
        {
            get
            {
                lock (SyncObject)
                {
                    return Players.Count;
                }
            }
        }
        [IgnoreDataMember]
        public int OnlinePlayersCount
        {
            get
            {
                lock (SyncObject)
                {
                    return Players.Count(p => p.IsOnline);
                }
            }
        }
        [IgnoreDataMember]
        public abstract bool IsStarted { get; }
        [IgnoreDataMember]
        public abstract bool IsFinished { get; }
        [IgnoreDataMember]
        public List<string> ConnectionIDs { get; set; }
        [IgnoreDataMember]
        public List<int> UserIDs { get; set; }
        #endregion

        protected GameTableBase<TGamePlayer> Table
        {
            get { return this; }
        }

        [DataMember(Name = "players")]
        public List<TGamePlayer> Players = new List<TGamePlayer>();
        [DataMember(Name = "activePlayer")]
        public TGamePlayer ActivePlayer;

        protected object SyncObject = new object();

        public GameTableBase()
        {
            IPAddresses = new List<string>();
            ConnectionIDs = new List<string>();
            UserIDs = new List<int>();
            ActivePlayer = null;
        }


        public void Join(int userid, string connectionID, string ipaddress, bool isVIP, object state = null)
        {
            lock (SyncObject)
            {
                var player = GetPlayer(userid);
                if (player == null)
                    player = new TGamePlayer { UserID = userid, IPAddress = ipaddress, IsVIP = isVIP };

                player.ConnectionIDs = new List<string>();
                player.ConnectionIDs.Add(connectionID);
                player.IsOnline = true;

                RefreshIPAddressesAndUserIDs();

                OnJoin(player, state);

                RefreshIPAddressesAndUserIDs();
            }
        }

        public void Leave(int userid, string connectionID)
        {
            lock (SyncObject)
            {
                var player = GetPlayer(userid);
                if (player == null) return;
                if (!player.ConnectionIDs.Contains(connectionID)) return;

                player.IsOnline = false;
                OnLeave(player);

                RefreshIPAddressesAndUserIDs();
            }
        }

        protected abstract void OnJoin(TGamePlayer player, object state);

        protected abstract void OnLeave(TGamePlayer player);


        protected void AddPlayer(TGamePlayer player)
        {
            Players.Add(player);
            RefreshIPAddressesAndUserIDs();
        }

        protected void RemovePlayer(TGamePlayer player)
        {
            if (!Players.Contains(player)) return;

            Players.Remove(player);
            RefreshIPAddressesAndUserIDs();
        }

        protected void RefreshIPAddressesAndUserIDs()
        {
            IPAddresses.Clear();
            ConnectionIDs.Clear();
            UserIDs.Clear();

            Players.ForEach(p =>
            {
                if (!IPAddresses.Contains(p.IPAddress))
                    IPAddresses.Add(p.IPAddress);

                if (!UserIDs.Contains(p.UserID))
                    UserIDs.Add(p.UserID);

                p.ConnectionIDs.ForEach(c =>
                {
                    if (!ConnectionIDs.Contains(c))
                        ConnectionIDs.Add(c);
                });
            });
        }

        protected TGamePlayer GetPlayer(int userid)
        {
            return Players.FirstOrDefault(p => p.UserID == userid);
        }

        protected TGamePlayer GetNextPlayer(TGamePlayer player = default(TGamePlayer))
        {
            if (Players.Count <= 1) return null;

            if (player == default(TGamePlayer))
                player = ActivePlayer;

            if (player == default(TGamePlayer)) return null;

            var index = Players.IndexOf(player);

            return Players[index < Players.Count - 1 ? ++index : 0];
        }

        protected void SaveIPAddressesLog()
        {
            lock (SyncObject)
            {
                if (Players.Count != 2) return;

                JokSharedInfo.IPsLog.Add(new IPAddressesLog
                {
                    IP1 = Players[0].IPAddress,
                    IP2 = Players[1].IPAddress,
                    CreateDate = DateTime.Now
                });

                JokSharedInfo.IPsLog.RemoveAll(p => p.CreateDate < DateTime.Now.AddHours(-5));
            }
        }
    }



    public class GameFinishInfo
    {
        public bool IsFull { get; set; }
        public string Channel { get; set; }
        public List<GameFinishPlayerInfo> Players { get; set; }
    }

    public class GameFinishPlayerInfo
    {
        public int UserID { get; set; }
        public string IPAddress { get; set; }
        public bool IsOnline { get; set; }
        public int Points { get; set; }
    }

    class JokTimerInternal<T> : IJokTimer<T>
    {
        Timer timer;

        public void SetInterval(Action<T> method, T state, int delayInMilliseconds)
        {
            Stop();

            timer = new Timer(delayInMilliseconds);
            timer.Elapsed += (source, e) =>
            {
                method(state);
            };

            timer.Enabled = true;
            timer.Start();
        }

        public void SetTimeout(Action<T> method, T state, int delayInMilliseconds)
        {
            Stop();

            timer = new System.Timers.Timer(delayInMilliseconds);
            timer.Elapsed += (source, e) =>
            {
                method(state);
            };

            timer.AutoReset = false;
            timer.Enabled = true;
            timer.Start();
        }

        public void Stop()
        {
            try
            {
                if (timer != null)
                {
                    timer.Stop();
                    timer.Close();
                    timer.Dispose();
                    timer = null;
                }
            }
            catch { }
        }
    }

    class JokSharedInfo
    {
        public static List<IPAddressesLog> IPsLog = new List<IPAddressesLog>();
    }

    public static class JokTimer<T>
    {
        public static IJokTimer<T> Create()
        {
            return new JokTimerInternal<T>();
        }
    }

    public interface IJokTimer<T>
    {
        void SetInterval(Action<T> method, T state, int delayInMilliseconds);
        void SetTimeout(Action<T> method, T state, int delayInMilliseconds);
        void Stop();
    }
}