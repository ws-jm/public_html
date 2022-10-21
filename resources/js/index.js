$(document).ready(function () {
    $('.marquee-wrapper').click(function () {
        $('.marquee').toggleClass('mrqstop')
    })

    var downloadingImage = new Image();
    downloadingImage.onload = function(){
        document.images[0].src = "resources/images/illustrations/banner-illustration.png";
        document.images[1].src = "resources/images/illustrations/why-choose-idm.svg";
        document.images[2].src = "resources/images/target.png";
        document.images[3].src = "resources/images/report2.png";
        document.images[4].src = "resources/images/idea.png";
        document.images[5].src = "resources/images/datacircle.png";
        document.images[6].src = "resources/images/data.png";
        document.images[7].src = "resources/images/handshake-blue.png";
        document.images[8].src = "resources/images/illustrations/small-company.png";
        document.images[9].src = "resources/images/illustrations/data-integration-img.svg";
        document.images[10].src = "resources/images/illustrations/question.svg";
        document.images[11].src = "resources/images/illustrations/register-now.svg";
        document.images[12].src = "resources/images/imgpsh_fullsize_anim (1).png";
        document.images[13].src = "resources/images/exchanges/nymex.png";
        document.images[14].src = "resources/images/exchanges/ice.png";
        document.images[15].src = "resources/images/exchanges/cme.png";
        document.images[16].src = "resources/images/exchanges/eurex.png";
        document.images[17].src = "resources/images/exchanges/cftc.png";
        document.images[18].src = "resources/images/exchanges/jodi.png";
        document.images[19].src = "resources/images/exchanges/lme.png";
        document.images[20].src = "resources/images/exchanges/crypto.png";
        document.images[21].src = "resources/images/exchanges/fx.png";
        document.images[22].src = "resources/images/exchanges/ecb.png";
        document.images[23].src = "resources/images/exchanges/indices.png";
        document.images[24].src = "resources/images/exchanges/amsterdam.png";
        document.images[25].src = "resources/images/exchanges/argentina.png";
        document.images[26].src = "resources/images/exchanges/athens.png";
        document.images[27].src = "resources/images/exchanges/B3-brazil.png";
        document.images[28].src = "resources/images/exchanges/borse-berlin.png";
        document.images[29].src = "resources/images/exchanges/bombay.png";
        document.images[30].src = "resources/images/exchanges/borsa-italiana.png";
        document.images[31].src = "resources/images/exchanges/brussels.png";
        document.images[32].src = "resources/images/exchanges/budapest.png";
        document.images[33].src = "resources/images/exchanges/cftc.png";
        document.images[34].src = "resources/images/exchanges/cme.png";
        document.images[35].src = "resources/images/exchanges/copenhagen.png";
        document.images[36].src = "resources/images/exchanges/crypto.png";
        document.images[37].src = "resources/images/exchanges/dusseldorf.png";
        document.images[38].src = "resources/images/exchanges/dusx.jpg";
        document.images[39].src = "resources/images/exchanges/ecb.png";
        document.images[40].src = "resources/images/exchanges/eurex.png";
        document.images[41].src = "resources/images/exchanges/frax.png";
        document.images[42].src = "resources/images/exchanges/fx.png";
        document.images[43].src = "resources/images/exchanges/hamx.jpg";
        document.images[44].src = "resources/images/exchanges/hanoi.png";
        document.images[45].src = "resources/images/exchanges/hong-kong.png";
        document.images[46].src = "resources/images/exchanges/ice.png";
        document.images[47].src = "resources/images/exchanges/indonesia.png";
        document.images[48].src = "resources/images/exchanges/irish.png";
        document.images[49].src = "resources/images/exchanges/jodi.png";
        document.images[50].src = "resources/images/exchanges/jse.png";
        document.images[51].src = "resources/images/exchanges/korea.png";
        document.images[52].src = "resources/images/exchanges/kosdaq.png";
        document.images[53].src = "resources/images/exchanges/lisbon.png";
        document.images[54].src = "resources/images/exchanges/lme.png";
        document.images[55].src = "resources/images/exchanges/lse.png";
        document.images[56].src = "resources/images/exchanges/luxx.jpg";
        document.images[57].src = "resources/images/exchanges/madrid.png";
        document.images[58].src = "resources/images/exchanges/mexico.png";
        document.images[59].src = "resources/images/exchanges/munich.png";
        document.images[60].src = "resources/images/exchanges/berx.jpg";
        document.images[61].src = "resources/images/exchanges/nikkei.png";
        document.images[62].src = "resources/images/exchanges/nymex.png";
        document.images[63].src = "resources/images/exchanges/nse.png";
        document.images[64].src = "resources/images/exchanges/opec.png";
        document.images[65].src = "resources/images/exchanges/oslo.png";
        document.images[66].src = "resources/images/exchanges/pakistan.png";
        document.images[67].src = "resources/images/exchanges/paris.png";
        document.images[68].src = "resources/images/exchanges/philippines.png";
        document.images[69].src = "resources/images/exchanges/poland.png";
        document.images[70].src = "resources/images/exchanges/santiago.png";
        document.images[71].src = "resources/images/exchanges/saudi-arabia.png";
        document.images[72].src = "resources/images/exchanges/shanghai.png";
        document.images[73].src = "resources/images/exchanges/shenzhen.png";
        document.images[74].src = "resources/images/exchanges/singapore.png";
        document.images[75].src = "resources/images/exchanges/six-swiss.png";
        document.images[76].src = "resources/images/exchanges/stux.png";
        document.images[77].src = "resources/images/exchanges/taipei.png";
        document.images[78].src = "resources/images/exchanges/tel-aviv.png";
        document.images[79].src = "resources/images/exchanges/thailand.png";
        document.images[80].src = "resources/images/exchanges/tokyo.png";
        document.images[81].src = "resources/images/exchanges/toronto.png";
        document.images[82].src = "resources/images/exchanges/tsxx.jpg";
        document.images[83].src = "resources/images/exchanges/twse.png";
        document.images[84].src = "resources/images/exchanges/vienna.png";
        document.images[85].src = "resources/images/exchanges/xetra.png";
        document.images[86].src = "resources/images/exchanges/xhan.png";
    };
});

let cookieBox = document.querySelector('#cookie-warning-wrapper'); // the main cookie warning wrapper
let acceptBtn = document.querySelector('.cookie-btn'); // the dismis button
acceptBtn.onclick = () => { //when click on the button
    document.cookie = "cookie=warning; max-age=" + 60 * 60 * 24 ; // set a cookie for 24hour
    cookieBox.style.display = 'none' // hide the cookie warning
}
let checkCookie = document.cookie.indexOf("cookie=warning"); //checking our cookie
//if cookie is already set then hide the cookie warning else show it 
checkCookie != -1 ? cookieBox.style.display = "none" : cookieBox.style.display = "block";