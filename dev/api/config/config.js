const API = location.protocol + "//api.sarus.com/";
const MAINSITE = location.protocol + "//"+ location.host +"/";
//const SITE_PAGES = ["/profile", "/profilemain", "/seriesviewer", "/mydsviewer", "/MySubscriptions"];
var SITE_PAGES = ["/profile", "/profilemain", "/seriesviewer", "/mydsviewer", "/MySubscriptions"];

if(location.host == "myfavorites.sarus.com" )
{
    SITE_PAGES.push("/");
}


function getBaseUrl() {
    return API;
}
function getMainSite()
{
    return MAINSITE;
}
