﻿using System.Web;
using System.Web.Optimization;

namespace Jok.Strip
{
    public class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/play/js").Include(
                        "~/Scripts/Common/jquery.signalR-2.0.0.js",
                        "~/Scripts/Common/kinetic-v{version}.js",
                        "~/Scripts/Jok.GameEngine.js",
                        "~/Scripts/Game.js"
                        ));

            bundles.Add(new StyleBundle("~/play/css").Include("~/Content/site.css"));
        }
    }
}