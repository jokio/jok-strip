using Jok.Strip.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Jok.Strip.Server
{
    public class GameHub : GameHubBase<GameTable>
    {
        #region Custom Authentication
        // ტესტირებისთვის არის ეს მხოლოდ საჭირო, რეალურ სერვერზე რომ არ შეამოწმოს ინფო
        protected override JokUserInfo GetUserInfo(string token, string ipaddress)
        {
            var userInfo = new JokUserInfo
            {
                IsSuccess = true,
                UserID = Convert.ToInt32(token),
                Nick = token,
                IsVIP = false
            };

            return userInfo;
        }
        #endregion


        public void IncomingMethod(string someParam)
        {
            var user = GetCurrentUser();
            if (user == null) return;

            // ყველა იუზერს გააჩნია მაგიდა, როგორც კი შემოდის სერვერზე ავტომატურად რაღაც მაგიდაზე ჯდება,
            // ასე რომ აქ მაგიდის შემოწმება აღარ არის საჭირო

            user.Table.IncomingMethod(user.UserID, someParam);
        }

        public void Ping()
        {
            var user = GetCurrentUser();
            if (user == null) return;

            user.Table.Ping(user.UserID);
        }
    }
}