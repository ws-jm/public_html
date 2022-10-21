async function forgotePass() {
    var win = window.open( 'forgot-password', '_blank' );
    win.focus();
}

// Do not comment this code
// Script working on safari
document.getElementById('loginForm').addEventListener('submit', function(event){
    event.preventDefault();
    password = $('#password').val();
    var dataP = {
        UserReferenceNo: $('#id').val(),
        Username: $('#usernameForm').val(),
        Password: password
    };

    if(getCookie('defaultMin') > 0 ){
        dataP.Minutes = getCookie('defaultMin');
    }
    else{
        dataP.Minutes = 10;
    }

    var testUser = dataP.Username.split(' ').join(''),
        testPass = dataP.Password.split(' ').join(''),
        testRefN = dataP.UserReferenceNo.split(' ').join('');
    
    if ( testUser !== "" && testPass !== "" && testRefN !== ""
        && dataP.UserReferenceNo.length > 3 && dataP.Username.length > 3 && dataP.Password.length > 3
        )
    {
        call_api_ajax('GetSessionToken', 'get', dataP, true, ( data ) =>
        {
            var path = "profilemain?tab=favorites",
            lastPath = getSession("path");
            
            if ( lastPath !== "" && lastPath !== null && lastPath !== undefined && !lastPath.includes('login') )
                path = lastPath;
            
            $.ajax({
                url: 'encrypt.php',
                type: 'post',
                data: { password: window.btoa( password ), type: 'encrypt' },
                success: function ( password )
                {
                	
                    setSession( data.Result.SessionToken );
                    setSession( path, "path" );
                    setCookie("user_logout", 0);

                    // comment this out on safari
                    // bc.postMessage({
                    //     path: 'profile',
                    //     active: 1,
                    //     SessionToken: data.Result.SessionToken
                    // });

                    call_api_ajax('ReadUserJSONSettings', 'get', { SessionToken: data.Result.SessionToken }, false, ( data ) =>
                    {
                        data = JSON.parse(data.Result);
                        if ( data !== undefined )
                        {                            
                            setCookie('remember-id',        data.Credentials.UserRef);
                            setCookie('remember-username',  data.Credentials.UserName);
                            setCookie("remember-password",  data.Credentials.Password);
                            setCookie("remember-checkbox",  data.Credentials.Confirm);
                            setCookie("remember-renewToken",  data.AutoLogin);

                            if (data.Credentials.UserRef == true) setCookie('id', dataP.UserReferenceNo);
                            if (data.Credentials.UserName == true) setCookie('username', dataP.Username);
                            if (data.Credentials.Password == true) setSession( password, "password" );

                            setCookie('defaultMin', data.Token.DefaultMins);
                            setCookie("remaining", (data.Token.DefaultMins*60*1000));
                        }
                    });
                    
                    window.location.href = path;
                },
                error: function ( XMLHttpRequest )
                {
                    let error = XMLHttpRequest.responseJSON.Errors;
                    error.Details = ( error.Details == "" ) ? XMLHttpRequest.statusText : error.Details;

                    let errorMsg = String ( error.Details );
                    errorMsg = ( errorMsg.indexOf('Trace') !== -1 ) ? errorMsg.split('Trace:')[1] : errorMsg;
                    
                    dialogWindow("The request returned error " + error.Status + ". ( " + errorMsg + " )", "error");
                    throw ( errorMsg + ' ' + error.Status );
                },
                async: false
            });
        }, () =>
        {
            dialogWindow("You have entered an invalid account number, username or password.<br>Please check and try again or use the 'Forgot Password' link below.", "error");
            return false;
        }, null, false);
    }
    else {
        if ( testRefN == "" ) {
            dialogWindow('Please enter a valid User Reference Number.', 'error', null, null, () => {
                $('#id').focus();
            });
        }
        else if ( dataP.UserReferenceNo.length <= 3 )
        {
            dialogWindow('The User Reference Number cannot be less than 4 characters long.', 'error', null, null, () => {
                $('#id').focus();
            });
        }
        else if ( testUser == "" ) {
            dialogWindow('Please enter a valid user name.', 'error', null, null, () => {
                $('#usernameForm').focus();
            });
        }
        else if ( dataP.Username.length <= 3 )
        {
            dialogWindow('The user name cannot be less than 4 characters long.', 'error', null, null, () => {
                $('#usernameForm').focus();
            });
        }
        else if ( testPass == "" ) {
            dialogWindow('Please enter a valid password.', 'error', null, null, () => {
                $('#password').focus();
            });
        }
        else if ( dataP.Password.length <= 3 )
        {
            console.log( dataP.password )
            dialogWindow('The password cannot be less than 4 characters long.', 'error', null, null, () => {
                $('#password').focus();
            });
        }
    }
})


$( document ).ready(function()
{
    //console.log("page loaded");
    var session = getSession(),
    password = '',
    preventKeypress = false;

    if ( session !== "" && session !== undefined && session !== null )
    {
        call_api_ajax('SessionTokenExpires', 'get', { SessionToken: session }, false, ( data ) =>
        {
            window.location.href = "profilemain?tab=favorites";
            return false;
        }, () => {
            $('.login-page').show();
            return false;
        });
    }
    else $('.login-page').show();

    $(function(){
  
        $('#eye').click(function(){
              if($(this).hasClass('fa-eye-slash')){
                 
                $(this).removeClass('fa-eye-slash');
                
                $(this).addClass('fa-eye');
                
                $('#password').attr('type','text');
                  
              }else{
               
                $(this).removeClass('fa-eye');
                
                $(this).addClass('fa-eye-slash');  
                
                $('#password').attr('type','password');
              }
          });
      });

   
    // $('#password').on('keyup', function ()
    // {
    //     $('.fa-eye-slash').addClass('show-eye');

    //     let last = $( this ).val().substr( $( this ).val().length - 1 );

    //     if ( last !== '•' && last !== '' && $( this ).val() !== "" )
    //     {
    //         password += last;
    //         //$( this ).val( $( this ).val().slice(0, -1) + '•' );
    //     }
    // })
    // .on('keydown', function ( e )
    // {
    //     if ( e.key == "Enter" ) {
    //         e.preventDefault();
    //     }
        
    //     let val = $( this ).val();
    //     let len = val.length;

    //     if ( password.length > len ) password = '';
        
    //     //$( this ).val( '•'.repeat( len ) );

    //     if ( e.which == 8 )
    //         password = password.slice(0, -1);
    //     else if ( e.which !== 8 && val.substr(len - 1) !== '•' )
    //         password += val.substr(len - 1);
    // });


    $('[data-toggle="popover"]').popover();
    $("#termAndConditions").attr( "data-content",  "Term and Conditions");
    
    var errorMsg = ( msg ) => {
        
        let message = msg;

        if ( message !== "" )
        {
            if ( message == "Unknown session token" || message == "Token has already expired" )
                msg = "Your session token has expired due to inactivity.";
                
            msg += "<br><br>You must login to continue.";

            dialogWindow( msg, "error" );
        }
    };

    bc.addEventListener("message", e => {
        if ( e.data.path == "login" )
        {
            // errorMsg( e.data.message );
        }
    });

    let sessionError = getSession("error");
    if ( sessionError !== "" && sessionError !== null ) {
        // errorMsg( sessionError );
        setSession("", "error", true);
    }

    
    $('#loginForm').submit(function( event )
    {
        event.preventDefault();
        password = $('#password').val();
        var dataP = {
            UserReferenceNo: $('#id').val(),
            Username: $('#usernameForm').val(),
            Password: password
        };

        if(getCookie('defaultMin') > 0 ){
            dataP.Minutes = getCookie('defaultMin');
        }

        var testUser = dataP.Username.split(' ').join(''),
            testPass = dataP.Password.split(' ').join(''),
            testRefN = dataP.UserReferenceNo.split(' ').join('');
			
        if ( testUser !== "" && testPass !== "" && testRefN !== ""
            && dataP.UserReferenceNo.length > 3 && dataP.Username.length > 3 && dataP.Password.length > 3
            )
        {
            call_api_ajax('GetSessionToken', 'get', dataP, true, ( data ) =>
            {
                var path = "profilemain?tab=favorites",
                lastPath = getSession("path");
                
                if ( lastPath !== "" && lastPath !== null && lastPath !== undefined && !lastPath.includes('login') )
                    path = lastPath;

                $.ajax({
                    url: 'encrypt.php',
                    type: 'post',
                    data: { password: window.btoa( password ), type: 'encrypt' },
                    success: function ( password )
                    {
                        setSession( data.Result.SessionToken );
                        setSession( path, "path" );
                        setCookie("user_logout", 0);

                        bc.postMessage({
                            path: 'profile',
                            active: 1,
                            SessionToken: data.Result.SessionToken
                        });

                        call_api_ajax('ReadUserJSONSettings', 'get', { SessionToken: data.Result.SessionToken }, false, ( data ) =>
                        {
                            data = JSON.parse(data.Result);
                            if ( data !== undefined )
                            {                            
                                setCookie('remember-id',        data.Credentials.UserRef);
                                setCookie('remember-username',  data.Credentials.UserName);
                                setCookie("remember-password",  data.Credentials.Password);
                                setCookie("remember-checkbox",  data.Credentials.Confirm);
                                setCookie("remember-renewToken",  data.AutoLogin);

                                if (data.Credentials.UserRef == true) setCookie('id', dataP.UserReferenceNo);
                                if (data.Credentials.UserName == true) setCookie('username', dataP.Username);
                                if (data.Credentials.Password == true) setSession( password, "password" );

                                setCookie('defaultMin', data.Token.DefaultMins);
                                setCookie("remaining", (data.Token.DefaultMins*60*1000));
                            }
                        });
                        
                        // window.location.href = path;
                    },
                    error: function ( XMLHttpRequest )
                    {
                        let error = XMLHttpRequest.responseJSON.Errors;
                        error.Details = ( error.Details == "" ) ? XMLHttpRequest.statusText : error.Details;

                        let errorMsg = String ( error.Details );
                        errorMsg = ( errorMsg.indexOf('Trace') !== -1 ) ? errorMsg.split('Trace:')[1] : errorMsg;
                        
                        dialogWindow("The request returned error " + error.Status + ". ( " + errorMsg + " )", "error");
                        throw ( errorMsg + ' ' + error.Status );
                    },
                    async: false
                });
            }, () =>
            {
                dialogWindow("You have entered an invalid account number, username or password.<br>Please check and try again or use the 'Forgot Password' link below.", "error");
                return false;
            }, null, false);
        }
        else {
            if ( testRefN == "" ) {
                dialogWindow('Please enter a valid User Reference Number.', 'error', null, null, () => {
                    $('#id').focus();
                });
            }
            else if ( dataP.UserReferenceNo.length <= 3 )
            {
                dialogWindow('The User Reference Number cannot be less than 4 characters long.', 'error', null, null, () => {
                    $('#id').focus();
                });
            }
            else if ( testUser == "" ) {
                dialogWindow('Please enter a valid user name.', 'error', null, null, () => {
                    $('#usernameForm').focus();
                });
            }
            else if ( dataP.Username.length <= 3 )
            {
                dialogWindow('The user name cannot be less than 4 characters long.', 'error', null, null, () => {
                    $('#usernameForm').focus();
                });
            }
            else if ( testPass == "" ) {
                dialogWindow('Please enter a valid password.', 'error', null, null, () => {
                    $('#password').focus();
                });
            }
            else if ( dataP.Password.length <= 3 )
            {
                console.log( dataP.password )
                dialogWindow('The password cannot be less than 4 characters long.', 'error', null, null, () => {
                    $('#password').focus();
                });
            }
        }
    });

    
    $( window ).keydown(function ( e ) {
        $('.forrm-control').blur();
        if ( e.key == "Enter" )
        {
            if (  $(".ui-dialog").length == 0 || ( $(".ui-dialog").hasClass("ui-dialog-content") && !$(".ui-dialog").dialog("isOpen") ) ) {
                $('#btnLogin:not(:disabled)').click();
            }
        }
    });

    if ( getCookie("remember-id") == "true" )
        $('#id').val( getCookie("id") );
    
    if ( getCookie("remember-username") == "true" ){
        $('#usernameForm').val( getCookie("username") );
    }

    if ( getCookie("remember-checkbox") == "true" )
    {
        $("#checkbox").prop("checked", (getCookie('remember-checkbox') == "true"));
        $('#btnLogin').prop('disabled', !$('#checkbox').is(":checked"));
    }

    if ( getSession("password") !== null && getCookie('remember-password') == "true" )
    {
        $.ajax({
            url: 'encrypt.php',
            type: 'post',
            data: { password: getSession("password") , type: 'decrypt' },
            success: function ( passwordDec )
            {
                password = window.atob( passwordDec );
                $('#password').val(password);
            },
            error: function ( XMLHttpRequest )
            {
                let error = XMLHttpRequest.responseJSON.Errors;
                error.Details = ( error.Details == "" ) ? XMLHttpRequest.statusText : error.Details;

                let errorMsg = String ( error.Details );
                errorMsg = ( errorMsg.indexOf('Trace') !== -1 ) ? errorMsg.split('Trace:')[1] : errorMsg;

                dialogWindow("The request returned error " + error.Status + ". ( " + errorMsg + " )", "error");
                throw ( errorMsg + ' ' + error.Status );
            },
            async: false
        });
    }
    
    $('#checkbox').click(function()
    {
        if ( document.getElementById('checkbox').checked ) 
        {
            $('#btnLogin').prop('disabled', false);
        }
        else {
            $('#btnLogin').prop('disabled', true);
        }
    });
    if ( password == "" )
        $('.fa-eye-slash').addClass('show-eye');
});



/*********************************************************** */



/* async function forgotePass() {
    var win = window.open( 'forgot-password', '_blank' );
    win.focus();
}

$( document ).ready(function()
{
    var session = getSession(),
    password = '',
    preventKeypress = false;

    if ( session !== "" && session !== undefined && session !== null )
    {
        call_api_ajax('SessionTokenExpires', 'get', { SessionToken: session }, false, ( data ) =>
        {
            window.location.href = "profilemain?tab=favorites";
            return false;
        }, () => {
            $('.login-page').show();
            return false;
        });
    }
    else $('.login-page').show();

    

    $(".fa-eye-slash").mouseup(function()
    {
        $('#password').val( new Array( password.length + 1 ).join('•') );
    });

    $(".fa-eye-slash").mousedown(function()
    {
        $('#password').val( password );
    });

    $('#password').on('keyup', function ()
    {
        $('.fa-eye-slash').addClass('show-eye');

        let last = $( this ).val().substr( $( this ).val().length - 1 );

        if ( last !== '•' && last !== '' && $( this ).val() !== "" )
        {
            password += last;
            $( this ).val( $( this ).val().slice(0, -1) + '•' );
        }
    })
    .on('keydown', function ( e )
    {
        if ( e.key == "Enter" ) {
            e.preventDefault();
        }
        
        let val = $( this ).val();
        let len = val.length;

        if ( password.length > len ) password = '';
        
        $( this ).val( '•'.repeat( len ) );

        if ( e.which == 8 )
            password = password.slice(0, -1);
        else if ( e.which !== 8 && val.substr(len - 1) !== '•' )
            password += val.substr(len - 1);
    });

    $('[data-toggle="popover"]').popover();
    $("#termAndConditions").attr( "data-content",  "Term and Conditions");
    
    var errorMsg = ( msg ) => {
        
        let message = msg;

        if ( message !== "" )
        {
            if ( message == "Unknown session token" || message == "Token has already expired" )
                msg = "Your session token has expired due to inactivity.";
                
            msg += "<br><br>You must login to continue.";

            dialogWindow( msg, "error" );
        }
    };

    bc.addEventListener("message", e => {
        if ( e.data.path == "login" )
        {
            errorMsg( e.data.message );
        }
    });

    let sessionError = getSession("error");
    if ( sessionError !== "" && sessionError !== null ) {
        errorMsg( sessionError );
        setSession("", "error", true);
    }


    $('#loginForm').submit(function( event )
    {
        event.preventDefault();

        var dataP = {
            UserReferenceNo: $('#id').val(),
            Username: $('#usernameForm').val(),
            Password: password
        };

        var testUser = dataP.Username.split(' ').join(''),
            testPass = dataP.Password.split(' ').join(''),
            testRefN = dataP.UserReferenceNo.split(' ').join('');

        if ( testUser !== "" && testPass !== "" && testRefN !== ""
            && dataP.UserReferenceNo.length > 3 && dataP.Username.length > 3 && dataP.Password.length > 3
            )
        {
            call_api_ajax('GetSessionToken', 'get', dataP, true, ( data ) =>
            {
                var path = "profilemain?tab=favorites",
                lastPath = getSession("path");
                
                if ( lastPath !== "" && lastPath !== null && lastPath !== undefined && !lastPath.includes('login') )
                    path = lastPath;

                $.ajax({
                    url: 'encrypt.php',
                    type: 'post',
                    data: { password: window.btoa( password ), type: 'encrypt' },
                    success: function ( password )
                    {
                        setSession( data.Result.SessionToken );
                        setSession( path, "path" );

                        bc.postMessage({
                            path: 'profile',
                            active: 1,
                            SessionToken: data.Result.SessionToken
                        });

                        call_api_ajax('ReadUserJSONSettings', 'get', { SessionToken: data.Result.SessionToken }, false, ( data ) =>
                        {
                            data = JSON.parse(data.Result);
                            if ( data !== undefined )
                            {                            
                                setCookie('remember-id',        data.Credentials.UserRef);
                                setCookie('remember-username',  data.Credentials.UserName);
                                setCookie("remember-password",  data.Credentials.Password);
                                setCookie("remember-checkbox",  data.Credentials.Confirm);

                                if (data.Credentials.UserRef == true) setCookie('id', dataP.UserReferenceNo);
                                if (data.Credentials.UserName == true) setCookie('username', dataP.Username);
                                if (data.Credentials.Password == true) setSession( password, "password" );

                                setCookie("remaining", (data.Token.DefaultMins*60*1000));
                            }
                        });

                        window.location.href = path;
                    },
                    error: function ( XMLHttpRequest )
                    {
                        let error = XMLHttpRequest.responseJSON.Errors;
                        error.Details = ( error.Details == "" ) ? XMLHttpRequest.statusText : error.Details;

                        let errorMsg = String ( error.Details );
                        errorMsg = ( errorMsg.indexOf('Trace') !== -1 ) ? errorMsg.split('Trace:')[1] : errorMsg;
                        
                        dialogWindow("The request returned error " + error.Status + ". ( " + errorMsg + " )", "error");
                        throw ( errorMsg + ' ' + error.Status );
                    },
                    async: false
                });
            }, () =>
            {
                dialogWindow("You have entered an invalid account number, username or password.<br>Please check and try again or use the 'Forgot Password' link below.", "error");
                return false;
            }, null, false);
        }
        else {
            if ( testRefN == "" ) {
                dialogWindow('Please enter a valid User Reference Number.', 'error', null, null, () => {
                    $('#id').focus();
                });
            }
            else if ( dataP.UserReferenceNo.length <= 3 )
            {
                dialogWindow('The User Reference Number cannot be less than 4 characters long.', 'error', null, null, () => {
                    $('#id').focus();
                });
            }
            else if ( testUser == "" ) {
                dialogWindow('Please enter a valid user name.', 'error', null, null, () => {
                    $('#usernameForm').focus();
                });
            }
            else if ( dataP.Username.length <= 3 )
            {
                dialogWindow('The user name cannot be less than 4 characters long.', 'error', null, null, () => {
                    $('#usernameForm').focus();
                });
            }
            else if ( testPass == "" ) {
                dialogWindow('Please enter a valid password.', 'error', null, null, () => {
                    $('#password').focus();
                });
            }
            else if ( dataP.Password.length <= 3 )
            {
                console.log( dataP.password )
                dialogWindow('The password cannot be less than 4 characters long.', 'error', null, null, () => {
                    $('#password').focus();
                });
            }
        }
    });

    
    $( window ).keydown(function ( e ) {
        $('.forrm-control').blur();
        if ( e.key == "Enter" )
        {
            if (  $(".ui-dialog").length == 0 || ( $(".ui-dialog").hasClass("ui-dialog-content") && !$(".ui-dialog").dialog("isOpen") ) ) {
                $('#btnLogin:not(:disabled)').click();
            }
        }
    });

    if ( getCookie("remember-id") == "1" )
        $('#id').val( getCookie("id") );
    
    if ( getCookie("remember-username") == "1" )
        $('#usernameForm').val( getCookie("username") );

    if ( getCookie("remember-checkbox") == "1" )
    {
        $("#checkbox").prop("checked", (getCookie('remember-checkbox') == "1"));
        $('#btnLogin').prop('disabled', !$('#checkbox').is(":checked"));
    }

    if ( getSession("password") !== null && getCookie('remember-password') == "1" )
    {
        $.ajax({
            url: 'encrypt.php',
            type: 'post',
            data: { password: getSession("password") , type: 'decrypt' },
            success: function ( passwordDec )
            {
                password = window.atob( passwordDec );
                $('#password').val( '•'.repeat( password.length ) );
            },
            error: function ( XMLHttpRequest )
            {
                let error = XMLHttpRequest.responseJSON.Errors;
                error.Details = ( error.Details == "" ) ? XMLHttpRequest.statusText : error.Details;

                let errorMsg = String ( error.Details );
                errorMsg = ( errorMsg.indexOf('Trace') !== -1 ) ? errorMsg.split('Trace:')[1] : errorMsg;

                dialogWindow("The request returned error " + error.Status + ". ( " + errorMsg + " )", "error");
                throw ( errorMsg + ' ' + error.Status );
            },
            async: false
        });
    }
    
    $('#checkbox').click(function()
    {
        if ( document.getElementById('checkbox').checked ) 
        {
            $('#btnLogin').prop('disabled', false);
        }
        else {
            $('#btnLogin').prop('disabled', true);
        }
    });
    if ( password == "" )
        $('.fa-eye-slash').addClass('show-eye');
});*/