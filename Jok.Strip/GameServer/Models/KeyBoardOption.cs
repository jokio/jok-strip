using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Web;

namespace Jok.Strip.Server.Models
{
    [DataContract]
    public struct KeyboardOption
    {
        [DataMember]
        public int From { set; get; }
        [DataMember]
        public int To { set; get; }
    }
}