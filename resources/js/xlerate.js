$(document).ready(function () {
  $(".QF-title").click(function () {
    var QFopen = $(this).siblings(".QF-content").height();


    if (QFopen > 0) {

      $(this).siblings(".QF-content").animate({
        maxHeight: '0px'
      }, 500);
      $(this).children(".fa-plus-circle").css("display", "block");
      $(this).children(".fa-minus-circle").css("display", "none");


    } else {

      $(this).siblings(".QF-content").animate({
        maxHeight: '300px'
      }, 500);
      $(this).children(".fa-plus-circle").css("display", "none");
      $(this).children(".fa-minus-circle").css("display", "block");

    }



  });


  $(".swiper-slide  img").dblclick(function () {

    var image_src = $(this).attr('src');

    $('.image-modal img').attr("src", image_src);

    $('.image-modal').css("display", "flex");

  });

  $(".fa-times").click(function () {

    $('.image-modal').css("display", "none");

  });

  const tooltip_att = ["data-bs-toggle", "data-bs-placement", "data-bs-html", "title"]
  const tooltip_att_values = ["tooltip", "right", "true", "Double click to view the image"]
  const allImages = document.querySelectorAll(".swiper-slide img")

  for (let i = 0; i < allImages.length; i++) {
    for (let j = 0; j < tooltip_att.length; j++) {
      allImages[i].setAttribute(tooltip_att[j], tooltip_att_values[j])
    }
  }
  // swiper.js
  var swiper = new Swiper(".mySwiper1", {
    spaceBetween: 30,
    centeredSlides: true,
    keyboard: {
      enabled: false,
    },

    loop: true,

    autoplay: {
      delay: 9000,
      disableOnInteraction: true,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next1",
      prevEl: ".swiper-button-prev1",
    },
  });




  var swiper = new Swiper(".mySwiper2", {
    spaceBetween: 30,
    centeredSlides: true,
    keyboard: {
      enabled: false,
    },

    loop: true,

    autoplay: {
      delay: 12000,
      disableOnInteraction: true,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next2",
      prevEl: ".swiper-button-prev2",
    },
  });




  var swiper = new Swiper(".mySwiper3", {
    spaceBetween: 30,
    centeredSlides: true,
    keyboard: {
      enabled: false,
    },

    loop: true,

    autoplay: {
      delay: 12000,
      disableOnInteraction: true,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next3",
      prevEl: ".swiper-button-prev3",
    },
  });




  var swiper = new Swiper(".mySwiper4", {
    spaceBetween: 30,
    centeredSlides: true,
    keyboard: {
      enabled: false,
    },

    loop: true,

    autoplay: {
      delay: 10000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next4",
      prevEl: ".swiper-button-prev4",
    },
  });
  var swiper = new Swiper(".mySwiper5", {
    spaceBetween: 30,
    centeredSlides: true,
    keyboard: {
      enabled: false,
    },
    

    loop: true,

    autoplay: {
      delay: 10000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next4",
      prevEl: ".swiper-button-prev4",
    },
  });


});