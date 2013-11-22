using Jok.GameEngine;
using Jok.GameEngine.Models;
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


        public void SetChar(string ch)
        {
            var user = GetCurrentUser();
            if (user == null) return;

            user.Table.SetNewChar(user.UserID, ch);
        }

        public void PlayAgain(int c)
        {
            var user = GetCurrentUser();
            if (user == null) return;

            user.Table.PlayAgain(user.UserID);
        }
    }
}