using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(Jok.Strip.Startup))]
namespace Jok.Strip
{
    public partial class Startup 
    {
        public void Configuration(IAppBuilder app) 
        {
            ConfigureAuth(app);
        }
    }
}
