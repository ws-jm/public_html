$(document).ready(function () {
    $(document).on('click', function (e) {
        if ($(e.target).is(".dropdown-btn") == false && $('.dropdown-item').hasClass(
                'dropdown-item-shown')) {
            $('.dropdown-item').removeClass('dropdown-item-shown');

        }
    });

    $('.navbar .bar').click(function () {
        $('.nav-menu').addClass('nav-menu-shown')
        if ($('.footer-menu').hasClass('nav-menu-shown')) {
            $('.footer-menu').removeClass('nav-menu-shown')
        }
    });

    $('.navbar .close-btn').click(function () {
        $('.nav-menu').removeClass('nav-menu-shown')
    });


    $(window).resize(function () {
        if ($('.nav-menu').hasClass('nav-menu-shown')) {
            $('.nav-menu').removeClass('nav-menu-shown')
        }

    });

    let lastScrollTop = 0;
    $(window).scroll(function (event) {
        let st = $(this).scrollTop();
        if (st > lastScrollTop) {
            $('.navbar').css({
                top: '-110px'
            });
            $('.dropdown-item').removeClass('dropdown-item-shown');
            $('.nav-menu').removeClass('nav-menu-shown');
            $('.marquee-wrapper').css({
                visibility: 'hidden',
                opacity: '0'

            });
        } else {
            $('.navbar').css({
                top: '0'
            })

            $('.marquee-wrapper').css({
                visibility: 'visible',
                opacity: 1
            })

        }
        lastScrollTop = st;
    });
});