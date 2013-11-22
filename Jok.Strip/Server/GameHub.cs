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