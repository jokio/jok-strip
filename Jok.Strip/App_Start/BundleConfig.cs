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
                        "~/Scripts/Common/EventEmitter.js",
                        "~/Scripts/Common/engine.io-client.js",
                        "~/Scripts/Common/kinetic-v4.4.3.min.js"
                        ));

            bundles.Add(new StyleBundle("~/bundles/css").Include("~/Content/site.css"));
        }
    }
}