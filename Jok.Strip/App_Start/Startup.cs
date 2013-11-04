using Microsoft.Owin;
using Owin;

[assembly: OwinStartup(typeof(Jok.Strip.Startup))]

namespace Jok.Strip
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.MapSignalR();
        }
    }
}