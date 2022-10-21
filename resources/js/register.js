function countryOnChange()
{
    $("#phone").intlTelInput("setCountry", $("#country").val());
}

$( document ).ready(function ()
{
    $('#profile').attr('href', 'profile?tab=MyProfile');
    $('#favorites').attr('href', 'profilemain?tab=favorites');

    $('#logout').click( function () {
        logout();
    });

    $("#phone").on("countrychange", function(e, countryData) {
        if(countryData.iso2)
            $("#country").val( countryData.iso2.toUpperCase() );
    });

    $('.bfh-selectbox-filter').on('change', function(){
        var selected = $(this).find("option:selected").val();
    });

    $('[data-toggle="popover"]').popover();
    $('#registrationForm').validator();

    // Phone number configuration
    var telInput = $("#phone"),
        errorMsg = $("#error-msg"),
        validMsg = $("#valid-msg");

    telInput.intlTelInput({
        utilsScript: 'resources/js/utils.js',
        autoPlaceholder: true,
        nationalMode: true,
        initialCountry: "GB"
    });

    var reset = function() {
        telInput.removeClass("error");
        errorMsg.addClass("hide");
        validMsg.addClass("hide");
        };

        telInput.blur(function() {
            reset();
            if ($.trim(telInput.val())) {
            if (telInput.intlTelInput("isValidNumber")) {
                validMsg.removeClass("hide");
            } else {
                telInput.addClass("error");
                errorMsg.removeClass("hide");
            }
            }
        });

    telInput.on("keyup change", reset);

    $("#registrationForm").submit(function(event){
        event.preventDefault();
        
        if ($('#registrationForm').validator('validate').has('.has-error').length === 0) {
            submitForm();
        }
    });

    function submitForm()
    {
        var first_name = $("#first_name").val();
        if ( first_name == null || first_name === '' ) {
            apprise("The First Name field is blank. Please retype it and try again.");
            return;
        }
        
        var last_name = $("#last_name").val();
        if ( last_name == null || last_name === '' ) {
            apprise("The Last Name field is blank. Please retype it and try again.");
            return;
        }
        
        var houseName = $("#houseName").val();
        var streatName = $("#streatName").val();
        var address1, address2;

        if ( houseName == null || houseName === '' ) {
            apprise("The Souse Name field is blank. Please retype it and try again.");
            return;
        }
        
        if ( streatName == null || streatName === '' ){
            address1 = houseName;
        } else {
            address1 = streatName + " " + houseName;
        }
        
        var email = $("#email").val();
        if ( email == null || email === '' ) {
            apprise("The Email Address field is blank. Please retype it and try again.");
            return;
        }
        
        var phone = $("#phone").val();
        if(phone == null || phone === ''){
            apprise("The Telephone No. field is blank. Please retype it and try again.");
            return;
        }
        
        var country = $("#country").val();
        if(country == null || country === ''){
            apprise("The Country field is blank. Please retype it and try again.");
            return;
        }
        
        var city = $("#city").val();
        if(city == null || city === ''){
            apprise("The City field is blank. Please retype it and try again.");
            return;
        }
        
        var post_code = $("#post_code").val();
        if ( post_code == null || post_code === '' ){
            apprise("The Post Code field is blank. Please retype it and try again.");
            return;
        }
        
        if( ! $("#phone").intlTelInput("isValidNumber") ) {
            apprise("Invalid Telephone No. field. Please retype it and try again..");
            return;
        }
            
        parameters = {
                first_name : first_name,
                last_name : last_name,
                company : $("#company").val(),
                address : address1,
                email : email,
                job : $("#job").val(),
                vat : $("#vat").val(),
                phone : $("#phone").intlTelInput("getNumber"),
                country : country,
                city : city,
                post_code : post_code
        };


        var subject = "IDM REGISTRATION from " + first_name + " " + last_name + " at " + $("#company").val(),
            message = "Name\r\n" + "-------------------------" + "\r\n"
            + first_name + " " + last_name
            + "\r\n\r\nJob\r\n" + "-------------------------" + "\r\n"
            + $("#job").val()
            + "\r\n\r\nCompany\r\n" + "-------------------------" + "\r\n"
            + $('#company').val()
            + "\r\n\r\nAddress\r\n" + "-------------------------" + "\r\n"
            + address1
            + "\r\n\r\n" + post_code
            + "\r\n\r\n" + city
            + "\r\n\r\nCountry\r\n" + "-------------------------" + "\r\n"
            + country
            + "\r\n\r\nPhone\r\n" + "-------------------------" + "\r\n"
            + phone
            + "\r\n\r\nEmail\r\n" + "-------------------------" + "\r\n"
            + email
            + "\r\n\r\nMessage\r\n" + "-------------------------" + "\r\n"
            + $("#message").val();

        $.ajax({
            url: "https://api.smtp2go.com/v3/email/send",
            method: 'POST',
            headers: { 'Content-Type': "application/json" },
            data: JSON.stringify({
            'api_key': "api-EB274C844E8C11EA947BF23C91BBF4A0",
            'to': [
                "Sarus <support@sarus.com>"
            ],
            'sender': first_name +" <"+ email +">",
            'subject': subject,
            'text_body': message
            }),
        })
        .done(function(result) {
            if ( result.data.succeeded ) {
                dialogWindow('Thank you. The message has been sent.', "information");
                $('.form-control').val('');
                $('#checknotrebot').prop("checked", false);
                $("#country").val('GB');
                $('#phone').intlTelInput('setCountry', 'GB' );
            }
            else if ( result.data.failed ) dialogWindow("Failed to send the message", "error");
        })
        .fail(function(err) {
            dialogWindow("An error occurred while sending the message", "error");
            throw err;
        });
    }
    $('body').css('opacity', '1');
});