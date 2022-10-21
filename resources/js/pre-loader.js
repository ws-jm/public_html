    /* after window is loaded completely */
    window.onload = function () {
      setTimeout(hideloader, 1000); /* change the value "2000ms to any duration you want */

      //hide the preloader
      function hideloader() {
        document.querySelector(".loader-container").style.display = "none";
      }

      // function hideloader() {
      //   $(".loader-container").delay(2000).fadeOut("slow");

      // }


    }