$(document).ready(function () {
    $('.owl-carousel').owlCarousel({
        loop: true,
        animateOut: 'fadeOut',
        items: 1,
        dots: true,
        nav: false,
        autoplay: true,
        slideTransition: 'ease-in-out',
        smartSpeed: 600,
        autoplayTimeout: 4000,
    });

    let carousel = $('.owl-carousel').data('owl.carousel');



    $('.item').on('click', function () {
        if ($('.paused-text').hasClass('active')) {
            $('.paused-text').removeClass('active')
            console.log('active removed')
        } else {
            $('.paused-text').addClass('active')
            console.log('active added')
        }
        if (carousel.options.autoplay == false) {
            carousel.options.autoplay = true;
        } else {
            carousel.options.autoplay = false;
        }
        $('.owl-carousel').trigger('refresh.owl.carousel');

    });


    $('.paused-text ').on('click', function () {
        if ($('.paused-text').hasClass('active')) {
            $('.paused-text').removeClass('active')
            carousel.options.autoplay = true;
            $('.owl-carousel').trigger('refresh.owl.carousel');
        } else {
            $('.paused-text').addClass('active')
            carousel.options.autoplay = false;
            $('.owl-carousel').trigger('refresh.owl.carousel');

        }
    })


















});