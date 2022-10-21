// Test upload 7 May 2021 10:27
/**********************************
        Connect to API. Test Version 236A
**********************************/
function call_api_ajax(funcName, type, parameters = {}, async = true, callback = null, errorFunc = null, done = null, saveLocation = true) {
    if (
        parameters.SessionToken !== undefined &&
        (parameters.SessionToken == "" || parameters.SessionToken == null || parameters.SessionToken == undefined)
    ) {
        if (location.pathname !== '/login' && saveLocation)
            setSession(location.href, "path");

        window.location.href = '/login';
        return;
    } else {
        try {
            $.ajax({
                url: API + funcName,
                type: type,
                data: parameters,
                contentType: 'application/json',
                success: function(data, textStatus, XmlHttpRequest) {
                    try {

                        bc.postMessage({
                            path: 'profile',
                            active: 1,
                            SessionToken: parameters.SessionToken
                        });
                    } catch (e) {}

                    if (location.pathname !== '/login' && saveLocation)
                        setSession(location.href, "path");

                    if (done !== null) done();
                    if (callback !== null) callback(data, textStatus, XmlHttpRequest);
                },
                error: function(XMLHttpRequest) {

                    console.log("Error: ", XMLHttpRequest.responseJSON.Errors[0].Details)
                    let n = XMLHttpRequest.responseText.search(/Details/i);
                    if (location.pathname !== '/login' && saveLocation)
                        setSession(location.href, "path");

                    var error;
                    if (XMLHttpRequest.responseJSON !== undefined)
                        error = XMLHttpRequest.responseJSON.Errors[0];

                    else if (XMLHttpRequest.responseText.split(" ").join("") !== "") {
                        try {
                            error = JSON.parse(XMLHttpRequest.responseText).Errors[0];
                        } catch (e) { error = {} }
                    } else
                        error = { };

                    if ((error.Details == "Token has already expired" || error.Details == "Unknown session token") && SITE_PAGES.includes(location.pathname)) {
                        bc.postMessage({
                            path: 'profile',
                            active: 0,
                            SessionToken: ""
                        });
                        bc.postMessage({
                            path: 'login',
                            message: error.Details
                        });
                        setSession(error.Details, "error");
                        window.location.href = '/login';
                        return;
                    }

                    error.Details = (error.Details == undefined || error.Details == "") ? XMLHttpRequest.statusText : error.Details;

                    let errorMsg = String(error.Details);
                    errorMsg = (errorMsg.indexOf('Trace') !== -1) ? errorMsg.split('Trace:')[1] : errorMsg;

                    let status = (error.Status == undefined || error.Status == "") ? XMLHttpRequest.status : error.Status;

                    if (done !== null) done();
                    if (errorFunc !== null && status !== 0) {
                        let p = errorFunc(XMLHttpRequest);
                        if (p !== undefined) return p;
                    }

                    if (typeof parameters == "string")
                        parameters = JSON.parse(parameters);

                    if (status == 0)
                        dialogWindow("Server error from " + API + funcName + ". <br>Please check your connection.", "error");
                    else
                        dialogWindow(XMLHttpRequest.responseText.slice(n - 1).split("}")[0].split(":\"")[1].slice(0, -1), "error", null, "Sarus Monitor+", () => {}, () => {}, { funcName: funcName, parameters: parameters, data: XMLHttpRequest, type: type });

                    console.error('Request exception: ' + API + funcName);
                    console.error('Parameters:', parameters);
                    console.error('Details: ' + errorMsg + ' ' + status);
                },
                async: async
            });
        } catch (e) {
            console.log(e);
        }
    }
}

function call_api_ajax1(funcName, type, parameters = {}, async = true, callback = null, errorFunc = null, done = null, saveLocation = true) {
    if (
        parameters.SessionToken !== undefined &&
        (parameters.SessionToken == "" || parameters.SessionToken == null || parameters.SessionToken == undefined)
    ) {
        if (location.pathname !== '/login' && saveLocation)
            setSession(location.href, "path");

        window.location.href = '/login';
        return;
    } else {
        try {
            $.ajax({
                url: API + funcName,
                type: type,
                data: parameters,
                contentType: 'application/json',
                success: function(data, textStatus, XmlHttpRequest) {
                    try {

                        bc.postMessage({
                            path: 'profile',
                            active: 1,
                            SessionToken: parameters.SessionToken
                        });
                    } catch (e) {}

                    if (location.pathname !== '/login' && saveLocation)
                        setSession(location.href, "path");

                    if (done !== null) done();
                    if (callback !== null) callback(data, textStatus, XmlHttpRequest);
                },
                error: function(XMLHttpRequest) {

                    console.log("Error: ", XMLHttpRequest.responseJSON.Errors[0].Details)
                    let n = XMLHttpRequest.responseText.search(/Details/i);
                    if (location.pathname !== '/login' && saveLocation)
                        setSession(location.href, "path");

                    var error;
                    if (XMLHttpRequest.responseJSON !== undefined)
                        error = XMLHttpRequest.responseJSON.Errors[0];

                    else if (XMLHttpRequest.responseText.split(" ").join("") !== "") {
                        try {
                            error = JSON.parse(XMLHttpRequest.responseText).Errors[0];
                        } catch (e) { error = {} }
                    } else
                        error = {};

                    if ((error.Details == "Token has already expired") && SITE_PAGES.includes(location.pathname)) {
                        bc.postMessage({
                            path: 'profile',
                            active: 0,
                            SessionToken: ""
                        });
                        bc.postMessage({
                            path: 'login',
                            message: error.Details
                        });
                        setSession(error.Details, "error");
                        window.location.href = '/login';
                        return;
                    }

                    error.Details = (error.Details == undefined || error.Details == "") ? XMLHttpRequest.statusText : error.Details;

                    let errorMsg = String(error.Details);
                    errorMsg = (errorMsg.indexOf('Trace') !== -1) ? errorMsg.split('Trace:')[1] : errorMsg;

                    let status = (error.Status == undefined || error.Status == "") ? XMLHttpRequest.status : error.Status;

                    if (done !== null) done();
                    if (errorFunc !== null && status !== 0) {
                        let p = errorFunc(XMLHttpRequest);
                        if (p !== undefined) return p;
                    }

                    if (typeof parameters == "string")
                        parameters = JSON.parse(parameters);

                    if (status == 0) {
                        dialogWindow("Server error from " + "http://api.sarus.com/" + funcName + ". <br>Please check your connection.", "error");
                    } else {
                        dialogWindow(XMLHttpRequest.responseText.slice(n - 1).split("}")[0].split(":\"")[1].slice(0, -1), "error", null, "Sarus Monitor+", () => {}, () => {}, { funcName: funcName, parameters: parameters, data: XMLHttpRequest, type: type });
                    }
                    $("#dialogWindow").css("min-height", 130);
                    // console.error('Request exception: ' + "http://api.sarus.com/" + funcName);
                    // console.error('Parameters:', parameters);
                    // console.error('Details: ' + errorMsg + ' ' + status );
                },
                async: async
            });
        } catch (e) {
            console.log(e);
        }
    }
}


/***************************
    notification message
***************************/
function functionNotificationMessage(config) {
    var text = config.text || "Message";
    var div = document.createElement('div');
    var body = document.getElementsByTagName('body')[0];
    var elem = body.appendChild(div);
    div.innerHTML = text;

    $(elem).jqxNotification({
        autoOpen: true,
        autoClose: true,
        autoCloseDelay: 3000,
        opacity: 1,
        position: config.position || 'top-left',
        template: config.type || 'success'
    });

    setTimeout(() => {
        $('#jqxNotificationDefaultContainer-top-left').css('top', 'calc( 30% )').css('left', 'calc( 42% )').css('margin', 'auto').css('width', 'auto').css('font-family', 'Calibri').css('z-index', '99999')
        $('.jqx-notification-content').css('font-size', '15px');
    }, 50);

    $(elem).on('close', function() {
        $(elem).jqxNotification('destroy');
        body.removeChild(elem);
    });
}

/***********************
    session system
************************/
function getSession(action = "sessionToken") {
    var sessionToken = getParameterByName('SessionToken');
    if (sessionToken == '') {
        $.ajax({
            url: MAINSITE + 'session.php',
            type: 'post',
            data: { type: 'get', action: action },
            success: function(session) {
                sessionToken = session;
            },
            async: false
        });
    } else {
        setSession(sessionToken, 'sessionToken', true);
    }

    return sessionToken;
}

function setSession(sessionToken, action = "sessionToken", async = false) {
    $.ajax({
        url: MAINSITE + 'session.php',
        type: 'post',
        data: { type: 'set', value: sessionToken, action: action },
        async: async
    });
}

/**********************
    cookies system
**********************/

function setCookie(cname, cvalue, exdays = 30) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function getParameterByName(name) {
    url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return '';
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function logout() {
    dialogWindow("Are you sure that you want to logout?", 'warning', 'confirm', null,
        () => {
            let session = getSession();

            if (session !== undefined && session !== null && session !== "") {
                call_api_ajax('RevokeSessionToken', 'get', { SessionToken: session }, false, () => {
                    setSession("");
                    setCookie("remaining", 0);
                    setCookie("user_logout", 1);
                    localStorage["forget"] = 'password';

                    bc.postMessage({
                        path: 'profile',
                        active: 0,
                        SessionToken: ""
                    });

                    window.location.href = "/";
                });
            } else {
                window.location.href = "/";
            }
        }
    );
}

function downloadFile(filename, content) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

const copyToClipboard = str => {
    const el = $('<textarea style="position:fixed; opacity: 0; z-index: -9999" readonly>');
    el.val(str);
    $('body').append(el)
    setTimeout(() => {
            const selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;
            el[0].select()
            document.execCommand('copy');
            document.body.removeChild(el[0]);
            if (selected) {
                document.getSelection().removeAllRanges();
                document.getSelection().addRange(selected);
            }
        },
        10);
};

function popup_win() {
    $(".popup-overlay, .popup-content").addClass("active");
}

function dialogWindow(msg, type = null, dialog = null, title = null, callback = () => {}, closed = () => {}, enableDetails = null, button = { Ok: "Ok", Cancel: "Cancel" }, delay = 100) {
    $('#dialogWindow').html('<span id="dialogWindowContent" class="dialogWindowContent"></span>');

    if (enableDetails !== null) {
        var userName = '',
            userRef = '',
            userCompany = '';

        /*call_api_ajax('GetMyAccountDetails', 'get', { SessionToken: getSession() }, false, ( data ) => {
            userName    = data.Result.Name;
            userRef     = data.Result.UserNumber;
            userCompany = data.Result.Company;
            $('.u_ref').text( userRef );
            $('.u_company').text( userCompany );
            $('.u_name').text( userName )
        });*/

        var today = new Date();
        var text = "Report Details\r\n" + "-------------------------" + "\r\n" +
            "Date: " + today.toLocaleString() + "\r\n" +
            "Name: " + userName + "\r\n" +
            "Customer: " + userCompany + "\r\n" +
            "Error: " + msg + "\r\n\r\n" +
            "Request\r\n" + "-------------------------" + "\r\n" +
            "URL: " + API + enableDetails.funcName + "\r\n" +
            "Type: " + enableDetails.type.toLowerCase() + "\r\n" +
            "Parameters: " + JSON.stringify(enableDetails.parameters, null, 4) + "\r\n\r\n" +
            "Response\r\n" + "-------------------------" + "\r\n" + JSON.stringify(enableDetails.data, null, 4);


        $('<div class="report">Show Report</div>').insertAfter('#dialogWindowContent');
        $('#dialogWindow .report').on('click', function() {
            $("#dialogWindow").dialog({
                buttons: {
                    "Save": function() {
                        downloadFile('Report', text);
                    },
                    "Ok": function() {
                        $(this).dialog("destroy");
                    },
                    "Copy": function() {
                        copyToClipboard(text);
                    }
                }
            });
            $('.ui-dialog-buttonset').addClass('reportButtons');
            // $('.reportButtons button:first-child').prepend('<img src="resources/css/icons/Diskette.png">');
            // $('.reportButtons button:last-child').prepend('<img src="resources/css/icons/CopyIBtn.png">');

            $('#dialogWindow .report').remove();
            $('#dialogWindow img').remove();
            $("#dialogWindowContent").removeClass('dialogWindowContent')
                .html(
                    '<div class="reportDialog"><div class="top-text">The following error report has been created:</div><div class="reportBox">' +
                    '<div><span>Date:</span><span>' + today.toLocaleString() + '</span><span class="reportUserId"><span id="ref">Reference No:</span><span class="u_ref">' + userRef + '</span></span></div>' +
                    '<div><span>Name:</span><span class="u_name">' + userName + '</span></div>' +
                    '<div><span>Customer:</span><span class="u_company">' + userCompany + '</span></div>' +
                    '<div><span>Error:</span><span>' + msg + '</span></div>' +
                    '<div id="tabs-error-msg"><ul><li><a href="#tabs-1">Request</a></li><li><a href="#tabs-2">Response</a></li></ul>' +
                    '<div id="tabs-1">' +
                    '<div><span>Request:</span><span>' + API + enableDetails.funcName + '</span></div>' +
                    '<div><span>Type:</span><span>' + enableDetails.type.toLowerCase() + '</span></div>' +
                    '<div><span>Parameters:</span><span class="data-response">' + JSON.stringify(enableDetails.parameters, null, 4) + '</span></div>' +
                    '</div>' +
                    '<div id="tabs-2" class="data-response">' + JSON.stringify(enableDetails.data, null, 4) +
                    '</div></div>' +
                    '</div></div>'
                );

            $("#tabs-error-msg").tabs();

            var height = $('#dialogWindow').parents('.ui-dialog').outerHeight();
            $('#dialogWindow').parents('.ui-dialog').css({
                top: 'calc( 50% - ' + height / 2 + 'px )',
                left: 0,
                right: 0,
                margin: '0 auto'
            });
        });
    } else {
        $('.ui-dialog-buttonset').removeClass('reportButtons');
        $('.ui-dialog-buttonset > button > img').remove();
    }
    title = (title !== null) ? title : "Monitor+";

    if (type !== null) {
        type = type.toLowerCase();
        var img = 'resources/css/icons/' + type + '.png';
        $('#dialogWindowContent').before('<img width="40" height="40" src="' + img + '">');
    }

    var buttons = {};

    if (dialog == 'confirm') {
        buttons[button.Ok] = function() {
            $(this).dialog("destroy");
            if (callback !== null)
                setTimeout(() => { callback() }, delay);
        };

        buttons[button.Cancel] = function() {
            $(this).dialog("destroy");
            if (closed !== null)
                setTimeout(() => { closed() }, delay);
        };

        if (button.Destroy != undefined) {
            buttons[button.Destroy] = function() {
                $(this).dialog("destroy");
                // if ( closed !== null )
                //     setTimeout(() => { closed() }, delay);
            };
        }
    } else {
        buttons[button.Ok] = function() {
            $(this).dialog("destroy");
            if (callback !== null)
                setTimeout(() => { callback() }, delay);
        }
    }


    $("#dialogWindowContent").html(msg);
    $("#dialogWindow").dialog({
        resizable: false,
        autoOpen: true,
        height: "auto",
        title: title,
        width: 'auto',
        modal: true,
        buttons: buttons,
        close: function() {
            $('html, body').animate({
                scrollTop: 0
            }, 1);
        }
    });
}

function isDateExpired(date, withToday = false) {
    var getDate = function() {
        var today = new Date();

        var dd = today.getDate();
        var mm = today.getMonth() + 1;

        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        return new Date(yyyy, mm, dd);
    }

    if (typeof date == "string") {
        date = date.split('-');
        date = new Date(date[0], date[1], date[2]);
    }

    if (withToday)
        return new Date(date.toDateString()) <= new Date(getDate().toDateString());
    else
        return new Date(date.toDateString()) < new Date(getDate().toDateString());
}

function updateURL(data = {}, clear = false) {
    var url = (!clear) ? location.search : '';

    for (var name in data) {
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);

        if (results !== null && !clear) {
            url = url.replace(results[0], results[0].split(results[1])[0] + '=' + data[name]);
        } else {
            url += (name == "tab") ? "profilemain?" + name + "=" + data[name] : '&' + name + "=" + data[name];
        }

        results = regex.exec(url);

        if (results[2] == "")
            url = url.replace(results[0], "");

    }
    window.history.pushState("UserFavorites", "UserFavorites", url);
}

function getUserName(st) {
    var ud;
    call_api_ajax('GetMyAccountDetails', 'get', { SessionToken: st }, false, (data) => {
        ud = data.Result;
    });
    return ud.Name;
}

function openLoginPopup() {
    // if(getCookie("user_logout") != undefined && getCookie("user_logout") == 1){
    //     window.location.href = '/login';
    // }
    // else{
    $('body').addClass('overlay');
    $('#loginPopup').jqxWindow('open');
    $('#loginPopup').jqxWindow({ position: "center" });
    $('#loginPopup').css('z-index', 999999);
    $('#loginPopup .jqx-window-header div').css("float", "none");
    $('#loginPopup').jqxWindow('focus');
    if (getCookie('remember-renewToken') == "true") {
        setTimeout(() => {
            if ($('#loginPopup').jqxWindow('isOpen') == true) {                
                $("#btnLoadLogin").trigger('click');
            }
        }, 100);            
    }
    $("#loginPopup").keyup(function(event) {
        if (event.keyCode === 13) {
            $("#btnLoadLogin").trigger('click');
        }
    });
    // }
}

function calcuTimeFunc() {
    
    var error = false;
    
    var calcuRemaining = setInterval(() => {

        if (getCookie("remaining") >= 1000 ) { 
            if(location.href == "https://dev2.sarus.com/login" ) {
                setCookie("remaining", 60000);
                setSession(1, 'defaultMin' );
            }
            else {
                try {
                    $.ajax({
                        url: API + "QuerySessionToken",
                        type: 'get',
                        data: {
                            SessionToken: getSession()
                        },
                        contentType: 'application/json',
                        success: function(data, textStatus, XmlHttpRequest) {
                            setCookie("remaining", data.Result.Remaining);
                        },
                        error: function(XMLHttpRequest) {
                            setCookie("remaining", 1);
                        },
                        async:function () {
    
                        }
                    });
                } catch (e) {
                    clearInterval(calcuRemaining);
                    $.ajax({
                        url: API + "RenewSessionToken",
                        type: 'get',
                        data: {
                            SessionToken: getSession()
                        },
                        contentType: 'application/json',
                        success: function(data, textStatus, XmlHttpRequest) {
                            setCookie("remaining",getSession('defaultMin')*60000);
                            calcuTimeFunc();
                        },
                        error: function(XMLHttpRequest) {
                            calcuTimeFunc();
                        },
                        async:function () {

                        }
                    });
                }
                if(getCookie("remember-renewToken") == 'true' && getCookie("remaining") <= 2000) {
                    clearInterval(calcuRemaining);
                        $.ajax({
                            url: API + "RenewSessionToken",
                            type: 'get',
                            data: {
                                SessionToken: getSession()
                            },
                            contentType: 'application/json',
                            success: function(data, textStatus, XmlHttpRequest) {
                                setCookie("remaining",getSession('defaultMin')*60000);
                                calcuTimeFunc();
                                
                            },
                            error: function(XMLHttpRequest) {
                                calcuTimeFunc();
                            },
                            async:function () {

                            }
                        });
                    }
            }
        } 
        else {
            if (error == false && (getSession() != undefined && getSession() != "")) {
                fetch(`${API}SessionTokenExpires?SessionToken=${getSession()}`)
                    .then(res => res.json())
                    .then(result => {
                        if (result.Result != undefined && result.Result.Remaining > 0) {
                            remaining = result.Result.Remaining;
                        } else {
                            error = true;
                            setCookie("remaining", 0);                       
                            setSession("");
                            clearInterval(calcuRemaining);
                        }
                    })
                    .catch(e => console.warn("Token has already expired: ", e));
            }
        }
    }, 1000);
}

calcuTimeFunc();

