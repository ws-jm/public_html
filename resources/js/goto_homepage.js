
$(document).ready(function() 
{
document.addEventListener("DOMContentLoaded", ()=>{
    let menuLinks = document.getElementsByClassName("navbar-nav")
    let url = location.protocol + "//" + location.hostname
    menuLinks[0].childNodes[1].children[0].href = url
});
});