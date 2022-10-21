$( document ).ready(function ()
{
    var page = getParameterByName('page'),
    sessionToken = getSession(),
    userName = "",
    userCompany = "",
    userCountry = "",
    userPhone = "",
    userEmail = "";

    var content = {
        "sales-inquiry" : {
            title: "Sales Inquiry",
            content: "If you have questions about product pricing. data charges, invoicing, discounts or wish to discuss a custom quotation then we’ll be glad to help.<br><br>" +
                    "Please fill in the form with as much information as you can and we’ll be in touch.<br><br>",
            color: "#008DD0",
            image: "resources/idm-service/resources/images/icon1.png"
        },
        "market-data-inquiry" : {
            title: "Market Data Inquiry",
            content: "Market data is the life blood of any trading company and we can provide reference market data covering most markets and  going back many years.<br><br>" +
                    "If you have a question about market data content, history, metadata or need access to specific data such as stocks, bonds, fundamental, financials, or from other data vendors then we’re here to help.<br><br>" +
                    "Please fill in the form with as much information as you can and we’ll be in touch.<br><br>",
            color: "#4DAF7C",
            image: "resources/idm-service/resources/images/icon4.png"
        },
        "support-inquiry" : {
            title: "Support Inquiry",
            content: "If you have any technical question regarding software, data or metadata, API access or any general support questions then this is the contact form to use.<br><br>" +
                    "Please fill in the form with as much information as you can and we’ll be in touch.<br><br>" ,
            color: "#EC644B",
            image: "resources/idm-service/resources/images/icon2.png"
        },
        "partner-inquiry" : {
            title: "Strategic Partners",
            content: "If you have a question about becoming a sales agent, creating commercial products, licensing our products as your own or any related issues then this is the place to contact us.<br><br>" +
                    "If you have proprietary data that you would like to market using our platform then we can help with creating a new channel to market for you.<br><br>" +
                    "Please fill in the form with as much information as you can and we’ll be in touch.<br><br>" ,
            color: "#6232BA",
            image: "resources/idm-service/resources/images/icon3.png"
        }
    };

    if ( sessionToken !== "" && sessionToken !== undefined && sessionToken !== null )
    {
        call_api_ajax('GetMyAccountDetails', 'get', { SessionToken: sessionToken }, false, ( data ) =>
        {
            userName    = ( data.Result.Name    !== undefined ) ? data.Result.Name    : "",
            userCompany = ( data.Result.Company !== undefined ) ? data.Result.Company : "",
            userCountry = ( data.Result.Country !== undefined ) ? data.Result.Country : "",
            userPhone   = ( data.Result.Phone   !== undefined ) ? data.Result.Phone   : "",
            userEmail   = ( data.Result.Email   !== undefined ) ? data.Result.Email   : "";

            $('#username').text( userName );
        },
        () => {
            return false;
        });
    }
    
    if ( page !== "" && page !== undefined )
    {
        $('#contact-page img').attr('src', content[ page ].image);
        $('#submitButton').css('background-color', content[ page ].color);
        $('#contact-title').text( content[ page ].title );
        $('#page-content').html( content[ page ].content );
        $('section').hide();
        $('#name').val( userName );
        $('#companyName').val( userCompany )
        $('#country').val( userCountry );
        $('#email').val( userEmail );
        $('#telephone').val( userPhone );
        $('#page-select').show();
        $('#comment').focus();
        $('#email').change(function(a)
        {
    	    var id = document.getElementById('email');    	    
    	    if( id.validity.valid != true ) 
    	    {
    		dialogWindow('Incorrect value of email. Use format xxxx@domain',"Error");
    		$('#submitButton').prop('disabled', true);
    		$('#email').val('');
    	    }
        });

        $('.form-control').keyup(function() {
            var allfull = true;
            $('.form-control:not(#telephone):not(#companyName)').each(function () {
                if ( $( this ).val() == "" )
                    allfull = false;
            });
 
            if ( allfull ) $('#submitButton').prop('disabled', false);
            else $('#submitButton').prop('disabled', true);
        });

        $('#submitButton').click(function () {
            let name = page.split('-'),
            date = new Date();

            name.length -= 1;
            name = name.join(' ');
	    switch(page)
	    {
		case "sales-inquiry":
		    page_id = "sales";
		break;
		case "market-data-inquiry":
		    page_id = "marketdata";
		break;
		case "support-inquiry":
		    page_id = "support";
		break;
		case "partner-inquiry":
		    page_id = "parnters";
		break;
	    }
            var data = { 
		sub_name: name.toUpperCase(), 
		sub_date: date.toDateString(), 
		sub_dateT: date.toDateString(), 
		m_name: $('#name').val(),
		m_companyName: $('#companyName').val(),
		m_country: $('#country').val(),
		m_email: $('#email').val(),
		m_telephone: $('#telephone').val(),
		m_comment: $('#comment').val()
            };
            let subject = 'Web page '+page_id+' message from ' + data['m_email'];
	    var message = "Name\r\n-------------------------\r\n"
                    + data['m_name']
                    + "\r\n\r\nCompany\r\n-------------------------\r\n"
                    + data['m_companyName']
                    + "\r\n\r\nCountry\r\n-------------------------\r\n"
                    + data['m_country']
                    + "\r\n\r\nEmail\r\n-------------------------\r\n"
                    + data['m_email']
                    + "\r\n\r\nPhone\r\n-------------------------\r\n"
                    + data['m_telephone']
                    + "\r\n\r\nMessage\r\n-------------------------\r\n"
                    + data['m_comment'];
            
            $.ajax({
                url: './SendServiceEMail.php',
                type: 'post',
                data: {
            	    service_id: page_id,
            	    body: message,
            	    subject: subject,
            	    body_type: 'text'
                },
                error:function(jqx,text,error)
                {
            	    let e;
		    if(jqx.responseJSON != undefined) e = jqx.responseJSON.error;
		    else e = error;
            	    dialogWindow("Error in sending request: "+e, "error");
                },
                success: function ( res )
                {
                    dialogWindow('Thank you. The message has been sent.', "information");
                    $('.form-control').val('');
                },
                async: false
            });
        });
    }

    $('#profile').attr('href', 'profile?tab=myaccount');
    $('#favorites').attr('href', 'profilemain?tab=favorites');

    $('#logout').click( () => {
        logout();
    });

    $("#submitButton").prop('disabled', true);

    function enableBtn()
    {
        $("#submitButton").prop('disabled', false);
    }

    $("#conactUsForm").submit(function(event){
        event.preventDefault();
        submitForm();
    });

    function submitForm()
    {
        var username = $("#name").val();
        var email = $("#email").val();
        var telephone = $("#telephone").val();
        var country = $("#country").val();
        var comment = $("#comment").val();
        var companyName = $("#companyName").val();
        var reCaptchaResponse = $("#g-recaptcha-response").val();
        
        var parameters = {
            username : username,
            email : email,
            telephone : telephone,
            comment : comment,
            country : country,
            companyName : companyName,
            reCaptchaResponse : reCaptchaResponse
        };
    }
    $('body').css('opacity', 1);
});