using System.Web;
using System.Web.Optimization;

namespace Jok.Strip
{
    public class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/js").Include(
                        "~/Scripts/Common/jquery-{version}.js",
                        "~/Scripts/Common/jquery.signalR-2.0.0.js",
                        "~/Scripts/Jok.GameEngine.js",
                        "~/Scripts/Jok.Strip.Client.js"
                        ));

            bundles.Add(new StyleBundle("~/bundles/css").Include("~/Content/site.css"));
        }
    }
}