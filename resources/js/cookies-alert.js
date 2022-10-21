document.addEventListener("readystatechange", ()=>{
    if (document.readyState === "interactive") {
        dialogWindow('This site uses cookies for registered users only. By continuing to browse the site you are agreeing to our use of cookies <a href="cookie-policy"> Find out more </a>', "information");
        $('.ui-dialog-buttonset .ui-button-text').html('Dismiss');
        console.log("Before load")
    }
})

document.addEventListener("DOMContentLoaded", ()=>{
    console.log("Content loaded")
    let firstTime = sessionStorage.getItem("firstTime")
    if (firstTime === null) {
        dialogWindow('This site uses cookies for registered users only. By continuing to browse the site you are agreeing to our use of cookies <a href="cookie-policy"> Find out more </a>', "information");
        $('.ui-dialog-buttonset .ui-button-text').html('Dismiss');
        sessionStorage.setItem("firstTime", true)
    }
})


/*

<div class="alert alert-info alert-dismissible bg-primary cookies-alert">
    <a href="#" class="close" data-dismiss="alert" aria-label="close">
        <button class="btn btn-outline-light">Dismiss</button>
    </a>
    This site uses cookies for registered users only. By continuing to browse the site you are agreeing to our use of cookies <a href="cookie-policy"> Find out more </a>
</div>

*/

