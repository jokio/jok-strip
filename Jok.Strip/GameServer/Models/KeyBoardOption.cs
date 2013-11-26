using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Web;
using Microsoft.Ajax.Utilities;

namespace Jok.Strip.Server.Models
{
    [DataContract]
    public struct KeyboardOption
    {
        [DataMember]
        public int From { set; get; }
        [DataMember]
        public int To { set; get; }
        [DataMember]
        public string LN { set; get; }

        public static KeyboardOption GetKeyboardOptionFromString(string str = "EN")
        {
            switch (str)
            {
                  
                case  "GE":return new KeyboardOption() {From = 4304, To = 4336,LN="GE"};
                case  "RU" : return new KeyboardOption() {From = 1072, To = 1105,LN="RU"};
                default: return new KeyboardOption() {From = 97, To = 122 ,LN="EN"};  
            }
        }
        public override bool Equals(object obj)
        {

            return ((KeyboardOption) obj).From == this.From && ((KeyboardOption) obj).To == this.To;
        }
    }
}