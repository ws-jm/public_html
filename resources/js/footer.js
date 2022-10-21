$(document).ready(function () {
    $('.dropdown-btn3').click(function (e) {
        e.stopPropagation();
        if ($(this).children('.dropdown-item').hasClass('dropdown-item-shown') == true) {
            $(this).children('.dropdown-item').removeClass('dropdown-item-shown')
        } else($(this).children('.dropdown-item').addClass('dropdown-item-shown'))
        $('.dropdown-btn1').children('.dropdown-item').removeClass('dropdown-item-shown');
        $('.dropdown-btn2').children('.dropdown-item').removeClass('dropdown-item-shown');
    });


    $('.footerbar .bar').click(function () {
        $('.footer-menu').addClass('nav-menu-shown')
        if ($('.nav-menu').hasClass('nav-menu-shown')) {
            $('.nav-menu').removeClass('nav-menu-shown')
        }
    })
    $('.footerbar .close-btn').click(function () {
        $('.footer-menu').removeClass('nav-menu-shown')
    })
    $(window).resize(function () {

        if ($('.footer-menu').hasClass('nav-menu-shown')) {
            $('.footer-menu').removeClass('nav-menu-shown')
        }
    });

    let lastScrollTop = 0;
    $(window).scroll(function (event) {
        let st = $(this).scrollTop();
        if (st > lastScrollTop) {
            $('.footerbar').css({
                bottom: '-55px'
            });
            $('.footer-menu').removeClass('nav-menu-shown');


        } else {
            $('.footerbar').css({
                bottom: '0px'
            });
        }
        lastScrollTop = st;

    });

    $('.hide-scroller-btn').click(function () {
        $(this).toggle();
        $('.show-scroller-btn').toggle();
        $('.marquee-wrapper').addClass('mrqhidden')
    })
    $('.show-scroller-btn').click(function () {
        $(this).toggle();
        $('.hide-scroller-btn').toggle();
        $('.marquee-wrapper').css({
            visibilty: 'visible',
            opacity: '1'
        })
        $('.marquee-wrapper').removeClass('mrqhidden')
    })

});