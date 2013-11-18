using Jok.Strip.Server.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Jok.Strip.Common
{
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

}