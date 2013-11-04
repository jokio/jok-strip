using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Jok.Strip.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return RedirectToAction("Play");
        }

        public ActionResult Play(string channel, int userid = 32)
        {
            ViewBag.UserID = userid;

            return View();
        }
    }
}
