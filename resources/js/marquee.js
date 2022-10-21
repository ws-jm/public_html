$(document).ready(function () {
    $(".marquee-wrapper").click(function () {
        $(".marquee").toggleClass("mrqstop")
    })


    // let lastScrollTop = 0;
    // $(window).scroll(function (event) {
    //     let st = $(this).scrollTop();
    //     if (st > lastScrollTop) {
    //         $('.marquee-wrapper').css({
    //             visibility: 'hidden'
                
    //         })

    //     } else {
    //         $('.marquee-wrapper').css({
    //             visibility:'visible'
    //         })
    //     }
    //     lastScrollTop = st;
    // });



})