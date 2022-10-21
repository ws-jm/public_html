function setCookie(cname, cvalue, exdays=1) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

$( document ).ready(function()
{
    var report_grid, report_dataView;
    
    var sessionToken = getParameterByName('SessionToken');
    if ( sessionToken !== "" )
    {
        window.location.href = 'profilemain?tab=favorites';
    }
    else {
        $('.fixpage').show();
    }

    function isIEPreVer9() { var v = navigator.appVersion.match(/MSIE ([\d.]+)/i); return (v ? v[1] < 9 : false); }
    
    $('#reportBackups').jqxWindow({
        showCollapseButton: false,
        resizable: true,
        isModal: false,
        height: '650px',
        width: '805px',
        maxHeight: '100%',
        maxWidth: '100%',
        autoOpen: false,
        title: 'Open a WebXL Market Data Report'
    });

    var reportCreatorWidth = 890;
    var reportCreatorHeight = 735;
    var reportCreatorMinWidth = 450;
    var reportCreatorMinHeight = 400;
    if(parseInt($(window).width()) < 890 || parseInt($(window).height()) < 735){
        reportCreatorWidth = "90%";
        reportCreatorHeight = "90%";

        reportCreatorMinWidth = parseInt($(window).width()) * 0.9;
        reportCreatorMinHeight = parseInt($(window).height()) * 0.9;
    }

    $('#reportCreator').jqxWindow({
        showCollapseButton: false,
        resizable: true,
        isModal: false,
        height: reportCreatorHeight,
        width: reportCreatorWidth,
        minHeight: reportCreatorMinHeight,
        minWidth: reportCreatorMinWidth,
        maxHeight: '2000px',
        maxWidth: '2500px',
        autoOpen: false,
        title: 'Load Market Data',
        showCloseButton: false,
        keyboardCloseKey: 'none'
    });

    $("#reportCreator .jqx-window-header").append("<input id='closeBtn' style='background-color: #f3f3f3 !important; top:10px; right:12px'/>");

    $('#loginPopup').jqxWindow({
        showCollapseButton: false,
        resizable: true,
        isModal: false,
        height: '420px',
        width: '370px',
        maxHeight: '100%',
        maxWidth: '100%',
        autoOpen: false,
        title: 'Quick Login'
    });

    $("#re_referenceNumber").jqxInput({
        // placeHolder: "Enter filter text",
        height: 30,
        width: "100%"
    });

    $("#re_username").jqxInput({
        // placeHolder: "Enter filter text",
        height: 30,
        width: "100%"
    });

    $("#re_password").jqxInput({
        // placeHolder: "Enter filter text",
        height: 30,
        width: "100%"
    });

    if(getCookie('defaultMin') != undefined && getCookie('defaultMin') != null && getCookie('defaultMin') > 0 ){
        var defaultMin = getCookie('defaultMin');
    }
    else{
        var defaultMin = 10;
    }

    var time_json = [{
            name: 'Default',
            value: parseFloat(defaultMin/60)
        },
        {
            name: '.5',
            value: 0.5
        },
        {
            name: '1',
            value: 1
        },
        {
            name: '2',
            value: 2
        },
        {
            name: '3',
            value: 3
        },
        {
            name: '6',
            value: 6
        },
        {
            name: '12',
            value: 12
        }
    ];

    var password = "";
    var liveTime = 60;
    
    $("#liveTime").jqxDropDownList({
        source: time_json,
        displayMember: "name",
        valueMember: "value",
        height: 22,
        placeHolder: "Average",
        selectedIndex: 0,
        width: 68,
        dropDownHeight: 155
    });

    $("#liveTime").on('change', function (event) {
        var args = event.args;
        if (args) {
            var index = args.index;
            if(index == 0){
                $("#liveTimeLabel").hide();
            }
            else{
                $("#liveTimeLabel").show();
            }
        }
    });

    if ( getCookie("remember-id") == "true" )
        $('#re_referenceNumber').val( getCookie("id") );
    
    if ( getCookie("remember-username") == "true" )
        $('#re_username').val( getCookie("username") );

    if ( getSession("password") !== null && getCookie('remember-password') == "true" )
    {
        $.ajax({
            url: 'encrypt.php',
            type: 'post',
            data: { password: getSession("password") , type: 'decrypt' },
            success: function ( passwordDec )
            {
                password = window.atob( passwordDec );
                $('#re_password').val(password);
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

    $('#btnLoadLogin').click( function () {
        if($("#re_referenceNumber").val() == ""){
            functionNotificationMessage({
                text: 'Please insert Reference No',
                type: 'error'
            });
            $("#re_referenceNumber").focus();
            return false;
        }
        if($("#re_username").val() == ""){
            functionNotificationMessage({
                text: 'Please insert User Name',
                type: 'error'
            });
            $("#re_username").focus();
            return false;
        }
        if($("#re_password").val() == ""){
            functionNotificationMessage({
                text: 'Please insert Password',
                type: 'error'
            });
            $("#re_password").focus();
            return false;
        }

        password = $('#re_password').val();
        liveTime = parseFloat($("#liveTime").jqxDropDownList('val')) * 60;
        var dataP = {
            UserReferenceNo: $('#re_referenceNumber').val(),
            Username: $('#re_username').val(),
            Password: password,
            Minutes: liveTime
        };
        
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

                            setCookie("remaining", (liveTime*60*1000));
                            calcuTimeFunc();
                        }
                    });

                    $('#loginPopup').jqxWindow('close');
                    // return sessionToken = data.Result.SessionToken;
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
    });

    $('#loginPopup').on('close', function () {
        if($('#reportBackups').jqxWindow('isOpen') == false){
            $('body').removeClass('overlay');
        }
    });

    $('#btnCancelLogin').jqxButton({
        width: '65px',
        height: '35px',
        textPosition: "center"
    });

    $('#btnCancelLogin span').css('left', 14).css('top', 9);

    $('#btnCancelLogin').on('click', function () {
        // window.location.href = '/login';
        $('#loginPopup').jqxWindow('close');
    });

    $("#loginPopup").css("min-width", 365).css("min-height", 409);

    $('#loginPopup').on('resized', function (event) {
        $('#loginPopup .jqx-window-content').css("width", "calc(100% - 8px)").css("overflow", "unset");
        $('#loginPopup #login-container').css("height", parseInt($('#loginPopup').height()) - 122);
    });

    var session = getSession();
    
    if ( session !== null && session !== "" && session !== undefined )
    {
        call_api_ajax('SessionTokenExpires', 'get', { SessionToken : session }, false, () =>
        {
            // Get user data and check if session is not Expired
            call_api_ajax('GetMyAccountDetails', 'get', { SessionToken: session }, true, ( data ) =>
            {
                username = data.Result.Name;
                $('#login_name').text( username );
                $('#username').text( username );
                $('#profile').attr('href', 'profile?tab=MyProfile');
                $('#favorites').attr('href', 'profilemain?tab=favorites');
                $('#logout').click( function () {
                    logout();
                });
                $('.non-login').hide();
                $('.home-menu').show();
            },
            () => {
                return false;
            }, null, false);
        },
        () => {
                $('.home-menu').hide();
                $('.non-login').show();
                return false;
        }, null, false);
      
        var columnData = function (row, columnfield, value, defaulthtml, columnproperties) {
            return (value) ? '<div align="center"><img height="16" width="16" class="columnData" src="../../../icons/login.png"></div>' : '';
        }

        $('#report_list').click( function () {

            if(getSession() == undefined || getSession() == ""){
                openLoginPopup();
            }
            else{
                call_api_ajax1('ListReports', 'get', {
                    SessionToken: getSession()
                }, true,
                (data) => {

                    $("#editReportWindow").dialog({
                        resizable: true,
                        autoOpen: false,
                        height: "auto",
                        width: "auto",
                        modal: true,
                        buttons: [
                            {
                                text: "Save",
                                click: function() {
                                    editReport();
                                }
                            },
                            {
                                text: "Cancel",
                                click: function() {
                                    $('#editReportWindow').find('#newReportName').val('');
                                    $(this).dialog("close");
                                }
                            }
                        ],
                        resize: function(event, ui) {
                            $(".ui-dialog").css("min-height", 250).css("min-width", 300);
                            $("#editReportWindow").css("width", "100%").css("height", parseInt($("#editReportWindow").parent().height())-98).css("min-height", 147).css("min-width", 293);                        
                        }
                    });
    
                    function deleteReport() {
                        var rows = report_grid.getSelectedRows()
                        var is_error = false;
            
                        if (rows.length !== 0) {
                            for (var i = 0; i < rows.length; i++) {
                                var row = report_grid.getDataItem(rows[i]);
                                call_api_ajax1('DeleteReport', 'get', {
                                        SessionToken: getSession(),
                                        ReportID: row.ReportID
                                    }, false, null,
                                    () => {
                                        is_error = true;
                                    });
            
                                if (is_error) {
                                    setTimeout(() => {
                                        dialogWindow('Could not delete the report "' + row.Name + '"', 'error');
                                    }, 200);
                                    updateReportList();
                                    break;
                                }
                            }
                        }
            
                        if (!is_error) {
                            // $('#backupsJqxgrid').jqxGrid('clearselection');
                            updateReportList();
                            functionNotificationMessage({
                                text: 'Records successfully deleted: ' + rows.length
                            });
                        }
                    }
    
                    function editReport() {
                        var locked = $("#newReportPadlock").jqxCheckBox('val');
                        var getselectedrowindexes = report_grid.getSelectedRows();
                        if (getselectedrowindexes.length == 0)
                            return;
            
                        else if (getselectedrowindexes.length == 1) {
                            var newReportName = $("#newReportName").val();
            
                            if (newReportName == null || newReportName == '') {
                                dialogWindow("Report name can't be empty", "error");
                            } else if (newReportName.length <= 3) {
                                dialogWindow("Description must be more than 3 characters", "error");
                            } else {
                                let rows = report_grid.getData();
                                for (var i = 0; i < rows.length; i++) {
                                    if (i == getselectedrowindexes[0])
                                        continue;
            
                                    let row = rows[i];
                                    if (row.name == newReportName) {
                                        dialogWindow("A report with this name already exists", "error");
                                        return;
                                    }
                                }
                                let row = report_grid.getDataItem(getselectedrowindexes[0]);
                                call_api_ajax1('ReadReport', 'get', {
                                    SessionToken: getSession(),
                                    ReportID: row.ReportID
                                }, false, (data) => {
                                    if(data.Result.Locked == true){
                                        call_api_ajax1('UnlockReport', 'get', {SessionToken: session, ReportID: data.Result.ReportID}, false);
                                    }
                                    
                                    var parameters = {
                                        SessionToken: getSession(),
                                        ReportID: data.Result.ReportID,
                                        Name: newReportName,
                                        Type: data.Result.Type,
                                        // Locked: locked,
                                        Notes: data.Result.Notes,
                                        ReportJSON: data.Result.ReportJSON,
                                        UserJSON: data.Result.UserJSON
                                    };
                                    call_api_ajax1('WriteReport', 'post', JSON.stringify(parameters), false);
                                    
                                    if(locked == true){
                                        call_api_ajax1('LockReport', 'get', {SessionToken: getSession(), ReportID: data.Result.ReportID}, false);
                                    }
                                });
                                updateReportList();
                                $('#editReportWindow').dialog('close');
                            }
                        } else {
                            // if (locked !== null) {
                            //     for (var i in getselectedrowindexes) {
                            //         let row = report_grid.getDataItem(getselectedrowindexes[i]),
                            //             parameters = {
                            //                 SessionToken: session,
                            //                 ReportID: row.ReportID,
                            //                 Name: row.Name,
                            //                 Locked: locked
                            //             };
                            //         call_api_ajax1('WriteReport', 'post', parameters, false);
                            //     }
                            //     updateReportList();
                            //     $('#editReportWindow').dialog('close');
                            // }
                        }
                    }
    
                    function copyReport() {
                        var getselectedrowindexes = report_grid.getSelectedRows();
                        if (getselectedrowindexes.length == 0)
                            return;
            
                        for (var i in getselectedrowindexes) {
                            let row = report_grid.getDataItem(getselectedrowindexes[i]);
                            call_api_ajax1('ReadReport', 'get', {
                                SessionToken: getSession(),
                                ReportID: row.ReportID
                            }, false, (data) => {
                                var parameters = {
                                    SessionToken: getSession(),
                                    // ReportID: row.ReportID,
                                    Name: data.Result.Name+" (Copy)",
                                    Type: data.Result.Type,
                                    // Locked: data.Result.Locked,
                                    Notes: data.Result.Notes,
                                    ReportJSON: data.Result.ReportJSON,
                                    UserJSON: data.Result.UserJSON
                                };
                                call_api_ajax1('WriteReport', 'post', JSON.stringify(parameters), false);                            
                            });
                        }
                        updateReportList();
                    }
                    
                    async function updateReportList() {
                        if(getSession() == undefined || getSession() == ""){
                            openLoginPopup();
                        }
                        else{
                            call_api_ajax1('ListReports', 'get', {
                                SessionToken: getSession()
                            }, false, (data) => {
                                for (var i = 0; i < data.Result.length; i++) {
                                    data.Result[i].id = "id_" + i;
                                    data.Result[i].num = (i + 1);
                                }
        
                                report_grid.setData(data.Result);
                                report_dataView.beginUpdate();
                                report_dataView.setItems(data.Result, "id");
                                report_dataView.endUpdate();
                    
                                report_grid.invalidate();
                                report_grid.render();
                            });
                        }
                    }
                    
                    function CreateAddHeaderRow() {
    
                        $("#btnReportRemove").jqxButton({
                            imgSrc: "resources/css/icons/delete.png",
                            imgPosition: "left",
                            width: 75,
                            textPosition: "center"
                        });

                        $("#btnReportCreate").jqxButton({
                            imgSrc: "resources/css/icons/nr16.png",
                            imgPosition: "left",
                            width: 65,
                            textPosition: "center"
                        });
    
                        $("#btnReportCopy").jqxButton({
                            imgSrc: "resources/css/icons/restore.png",
                            imgPosition: "left",
                            width: 70,
                            textPosition: "center"
                        });
    
                        $("#btnReportEdit").jqxButton({
                            imgSrc: "resources/css/icons/pencil.png",
                            imgPosition: "left",
                            width: 95,
                            textPosition: "center"
                        });
    
                        $("#refreshReport").jqxButton({
                            imgSrc: "resources/css/icons/refresh_16.png",
                            imgPosition: "right",
                            textPosition: "center"
                        });
    
                        $("#newReportPadlock").jqxCheckBox({
                            width: 100, 
                            height: 25,
                            checked: false
                        });
    
                        $("#btnReportRemove").on('click', function () {
                            if(getSession() == undefined || getSession() == ""){
                                openLoginPopup();
                            }
                            else{
                                var rows = report_grid.getSelectedRows()
    
                                if (rows.length == 0) {
                                    dialogWindow("Please, select at least one report", "error");
                                } else {
                                    var pro = false,
                                        msg = '';
                                    rows.forEach(function (item, i, indexes) {
                                        var row = report_grid.getDataItem(item);
                                        if (row.Locked) pro = true;
                                    });
        
                                    if (pro) {
                                        if (rows.length == 1)
                                            msg = "You must remove lock from this report before it can be deleted."
                                        else
                                            msg = "You must remove lock from all report before they can be deleted."
        
                                        dialogWindow(msg, 'error', null, 'Delete Favorites Report');
                                        return;
                                    } else {
                                        if (rows.length == 1) {
                                            var row = report_grid.getDataItem(rows[0]);
                                            dialogWindow('You are about to delete report #' + row.ReportID + ', "' + row.Name + '".<br>If you delete this report it cannot be recovered.<br><br>Do you want to continue?',
                                                'warning', 'confirm', 'Delete Favorites Report', () => {
                                                    deleteReport();
                                                });
                                        } else {
                                            dialogWindow('You are about to delete report ' + rows.length + ' report files.<br>If you delete them, they cannot be recovered.<br><br>Do you want to continue?',
                                                'warning', 'confirm', 'Delete Favorites report', () => {
                                                    deleteReport();
                                                });
                                        }
                                        // $("#deleteReportWindowBtn").focus();
                                    }
                                }
                            }
                        });
    
                        $("#refreshReport").on('click', function () {
                            if(getSession() == undefined || getSession() == ""){
                                openLoginPopup();
                            }
                            else{
                                updateReportList();
                            }
                        });
    
                        $("#btnReportCreate").on('click', function () {
                            $('#reportBackups').jqxWindow('close');
                            
                            setTimeout(() => {
                                $('body').addClass('overlay');
                                $('#reportCreator').jqxWindow('open');
                                $('#reportCreator').jqxWindow({position: "center"});
                                // $("#reportCreator").css("min-width", 650).css("min-height", 500);
                                $('#reportCreator .jqx-window-header div').css("float", "none");
                                $('#reportCreator').jqxWindow('focus');

                                $('#reportCreator .jqx-window-header').css("height", "30px").css("background-color", "#3a79d7");
                                $('#reportCreator .jqx-window-content').css("width", "calc(100%)").css("overflow", "unset");

                                $('#reportCreatorSplitter').css("height", "calc(100% - 50px)");
                            }, 20);
                        });
    
                        $("#btnReportCopy").on('click', function () {
                            if(getSession() == undefined || getSession() == ""){
                                openLoginPopup();
                            }
                            else{
                                var getselectedrowindexes = report_grid.getSelectedRows();
        
                                if (getselectedrowindexes.length == 0) {
                                    dialogWindow("Please, select at least one report", "error");
                                } else if (getselectedrowindexes.length > 1) {
                                    dialogWindow('Restore only works when one report is selected.', 'error');
                                } else {
                                    var row = report_grid.getDataItem(getselectedrowindexes[0]);
                                    dialogWindow('You are about make a copy of report #' + row.ReportID + ', "' + row.Name + ' (Copy)".<br><br>Do you want to continue?',
                                        'warning', 'confirm', 'Clone Server Report', () => {
                                            copyReport();
                                        });
                                }
                            }
                        });
    
                        $("#btnReportEdit").on('click', function () {
                            if(getSession() == undefined || getSession() == ""){
                                openLoginPopup();
                            }
                            else{
                                var getselectedrowindexes = report_grid.getSelectedRows();
                                if (getselectedrowindexes.length == 0)
                                    return;
        
                                else if (getselectedrowindexes.length == 1) {
                                    var row = report_grid.getDataItem(getselectedrowindexes[0]);
                                    $('#multipleReport').hide();
                                    $('#singleReport').show();
        
                                    $("#newReportPadlock").jqxCheckBox({
                                        checked: row.Locked
                                    });
                                    $('#newReportID').text(row.ReportID);
                                    $('#oldReportID').text(row.ReportID);
                                    $('#newReportName').val(row.Name);
                                    $('#oldReportName').text(row.Name);
                                    $('#editReportWindow').dialog('open');
                                    $("#newReportName").focus();
                                } else if (getselectedrowindexes.length > 1) {
                                    $('#singleReport').hide();
                                    $('#multipleReport').show();
                                    $('#oldReportName  #rowsReportLength').text(getselectedrowindexes.length);
        
                                    let check_lock = [];
                                    for (var i in getselectedrowindexes) {
                                        var row = report_grid.getDataItem(getselectedrowindexes[i]);
                                        check_lock.push(row.Locked);
                                    }
        
                                    if (check_lock.includes(true) && check_lock.includes(false))
                                        $("#newReportPadlock").jqxCheckBox({
                                            checked: null
                                        });
        
                                    else if (check_lock.includes(true))
                                        $("#newReportPadlock").jqxCheckBox({
                                            checked: true
                                        });
        
                                    else if (check_lock.includes(false))
                                        $("#newReportPadlock").jqxCheckBox({
                                            checked: false
                                        });
        
                                    $('#editReportWindow').dialog('open');
                                }
                                $("#editReportWindow").css("width", "100%").css("height", parseInt($("#editReportWindow").parent().height())-98).css("min-height", 147).css("min-width", 293);
                            }
                        });
                    }
    
                    var report_columns = [{
                            id: "rid",
                            name: 'ID',
                            field: 'ReportID',
                            cellsalign: 'center',
                            align: 'center',
                            width: 60,
                            sortable: true,
                            cssClass: "cell-title cell-right"
                        },
                        {
                            id: "rname",
                            name: 'Report Name',
                            field: 'Name',
                            cellsformat: 'yyyy-MM-dd hh:mm:ss',
                            minWidth: 100,
                            width: 321,
                            sortable: true,
                            cssClass: "cell-title"
                        },
                        {
                            id: "created_date",
                            name: 'Created',
                            field: 'Created',
                            cellsalign: 'center',
                            align: 'center',
                            width: 150,
                            cssClass: "cell-title"
                        },
                        {
                            id: "updated_date",
                            name: 'Updated',
                            field: 'Updated',
                            cellsalign: 'center',
                            align: 'center',
                            width: 150,
                            sortable: true,
                            cssClass: "cell-title"
                        },
                        {
                            id: "report_lock",
                            name: '<img height="16" width="16" src="../../../icons/grey_login16.png" id="backup-lock">',
                            field: 'Locked',
                            formatter: columnData,
                            cellsalign: 'center',
                            align: 'center',
                            width: 35
                        },
                        {
                            id: "rtype",
                            name: 'Type',
                            field: 'Type',
                            cellsalign: 'left',
                            align: 'center',
                            minwidth: 80,
                            width: 80,
                            sortable: true,
                            cssClass: "cell-title cell-center"
                        },            
                    ];
        
                    var report_options = {
                        columnPicker: {
                            columnTitle: "Columns",
                            hideForceFitButton: false,
                            hideSyncResizeButton: false,
                            forceFitTitle: "Force fit columns",
                            syncResizeTitle: "Synchronous resize",
                        },
                        editable: true,
                        enableAddRow: false,
                        enableCellNavigation: true,
                        enableColumnReorder: false,
                        multiColumnSort: true,
                        asyncEditorLoading: true,
                        forceFitColumns: false,
                        rowHeight: 30,
                        explicitInitialization: true,
                    };
        
                    var sortcol = "title";
                    var sortdir = 1;
                    var percentCompleteThreshold = 0;
                    var searchString = "";
        
                    function requiredFieldValidator(value) {
                        if (value == null || value == undefined || !value.length) {
                            return {
                                valid: false,
                                msg: "This is a required field"
                            };
                        } else {
                            return {
                                valid: true,
                                msg: null
                            };
                        }
                    }
        
                    function myFilter(item, args) {
                        if (item["percentComplete"] < args.percentCompleteThreshold) {
                            return false;
                        }
        
                        if (args.searchString != "" && item["title"].indexOf(args.searchString) == -1) {
                            return false;
                        }
                        return true;
                    }
        
                    function percentCompleteSort(a, b) {
                        return a["percentComplete"] - b["percentComplete"];
                    }
        
                    function comparer(a, b) {
                        var x = a[sortcol],
                            y = b[sortcol];
                        return (x == y ? 0 : (x > y ? 1 : -1));
                    }
        
                    function toggleFilterRow() {
                        report_grid.setTopPanelVisibility(!grid.getOptions().showTopPanel);
                    }
        
                    $(function () {
                        // backupsGridSource.localdata.sort((a, b) => Date.parse(b.ActiveDateLabel) - Date.parse(a.ActiveDateLabel))
                        // prepare the data
                        for (var i = 0; i < data.Result.length; i++) {
                            data.Result[i].id = "id_" + i;
                            data.Result[i].num = (i + 1);
                        }
        
                        report_dataView = new Slick.Data.DataView({
                            inlineFilters: true
                        });
                        report_grid = new Slick.Grid("#reportGrid", report_dataView, report_columns, report_options);
                        report_grid.setSelectionModel(new Slick.RowSelectionModel());
        
                        // move the filter panel defined in a hidden div into grid top panel
                        $("#inlineFilterPanel")
                            .appendTo(report_grid.getTopPanel())
                            .show();
        
                        report_grid.onCellChange.subscribe(function (e, args) {
                            report_dataView.updateItem(args.item.id, args.item);
                        });
        
                        report_grid.onClick.subscribe(function (e, args) {    
                        });
    
                        report_grid.onDblClick.subscribe(function (e, args, c) {
                            if(getSession() == undefined || getSession() == ""){
                                openLoginPopup();
                            }
                            else{
                                var row = report_grid.getDataItem(args.row);
                                call_api_ajax1('ReadReport', 'get', {
                                    SessionToken: getSession(),
                                    ReportID: row['ReportID']
                                }, true, (data) => {
                                    try {
                                        if(location.pathname == "/report_viewer"){
                                            var report_id = getParameterByName('report_id');
                                            if(report_id == row['ReportID']){
                                                var jsonObj = request_editor.get();
                                                // var jsonObj1 = getJsonTree(notes_editor);
                                                // var jsonObj2 = getJsonTree(user_editor);
                                                
                                                console.log("=====", jsonObj);
                                                console.log("-----", requestParameters);
                                                console.log("~~~~~", report_id);

                                                window.open("report_viewer?report_id=" + escape(row['ReportID']) + "&tab=prices&layout=1", '_blank');
                                            }
                                            else{
                                                window.open("report_viewer?report_id=" + escape(row['ReportID']) + "&tab=prices&layout=1", '_blank');
                                            }
                                        }
                                        else{
                                            window.open("report_viewer?report_id=" + escape(row['ReportID']) + "&tab=prices&layout=1", '_blank');
                                        }
                                    } catch (ex) {
                                        dialogWindow("Wrong JSON Format: " + ex, "error");
                                    }
                                });
                            }
                        });
        
                        report_grid.onContextMenu.subscribe(function (e) {
                        });
        
                        report_grid.onAddNewRow.subscribe(function (e, args) {
                            
                        });
        
                        report_grid.onKeyDown.subscribe(function (e) {
                            // select all rows on ctrl-a
                            if (e.which != 65 || !e.ctrlKey) {
                                return false;
                            }
        
                            var rows = [];
                            for (var i = 0; i < report_dataView.getLength(); i++) {
                                rows.push(i);
                            }
        
                            report_grid.setSelectedRows(rows);
                            e.preventDefault();
                        });
        
                        report_grid.onSort.subscribe(function (e, args) {
                            sortdir = args.sortCols[0].sortAsc ? 1 : -1;
                            sortcol = args.sortCols[0].sortCol.field;
                            if (isIEPreVer9()) {
                                // using temporary Object.prototype.toString override
                                // more limited and does lexicographic sort only by default, but can be much faster
        
                                var percentCompleteValueFn = function () {
                                    var val = this["percentComplete"];
                                    if (val < 10) {
                                        return "00" + val;
                                    } else if (val < 100) {
                                        return "0" + val;
                                    } else {
                                        return val;
                                    }
                                };
                                // use numeric sort of % and lexicographic for everything else
                                report_dataView.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortCols[0].sortAsc);
                            } else {
                                // using native sort with comparer
                                // preferred method but can be very slow in IE with huge datasets
                                report_dataView.sort(comparer, args.sortCols[0].sortAsc);
                            }
                        });
        
                        // wire up model events to drive the grid
                        // !! both dataView.onRowCountChanged and dataView.onRowsChanged MUST be wired to correctly update the grid
                        // see Issue#91
                        report_dataView.onRowCountChanged.subscribe(function (e, args) {
                            report_grid.updateRowCount();
                            report_grid.render();
                        });
        
                        report_dataView.onRowsChanged.subscribe(function (e, args) {
                            report_grid.invalidateRows(args.rows);
                            report_grid.render();
                        });
        
                        report_dataView.onPagingInfoChanged.subscribe(function (e, pagingInfo) {
                            report_grid.updatePagingStatusFromView(pagingInfo);
        
                            // show the pagingInfo but remove the dataView from the object, just for the Cypress E2E test
                            delete pagingInfo.dataView;
                        });
        
                        report_dataView.onBeforePagingInfoChanged.subscribe(function (e, previousPagingInfo) {
                            // show the previous pagingInfo but remove the dataView from the object, just for the Cypress E2E test
                            delete previousPagingInfo.dataView;
                        });
        
                        var h_runfilters = null;
        
                        // wire up the slider to apply the filter to the model
                        $("#pcSlider,#pcSlider2").slider({
                            "range": "min",
                            "slide": function (event, ui) {
                                Slick.GlobalEditorLock.cancelCurrentEdit();
        
                                if (percentCompleteThreshold != ui.value) {
                                    window.clearTimeout(h_runfilters);
                                    h_runfilters = window.setTimeout(updateFilter, 10);
                                    percentCompleteThreshold = ui.value;
                                }
                            }
                        });
        
                        // wire up the search textbox to apply the filter to the model
                        $("#txtSearch,#txtSearch2").keyup(function (e) {
                            Slick.GlobalEditorLock.cancelCurrentEdit();
        
                            // clear on Esc
                            if (e.which == 27) {
                                this.value = "";
                            }
        
                            searchString = this.value;
                            updateFilter();
                        });
        
                        function updateFilter() {
                            report_dataView.setFilterArgs({
                                percentCompleteThreshold: percentCompleteThreshold,
                                searchString: searchString
                            });
                            report_dataView.refresh();
                        }
        
                        $("#btnSelectRows").click(function () {
                            if (!Slick.GlobalEditorLock.commitCurrentEdit()) {
                                return;
                            }
        
                            var rows = [];
                            for (var i = 0; i < 10 && i < report_dataView.getLength(); i++) {
                                rows.push(i);
                            }
        
                            report_grid.setSelectedRows(rows);
                        });
        
                        report_grid.init();
    
                        CreateAddHeaderRow();
        
                        // initialize the model after all the events have been hooked up
                        report_dataView.beginUpdate();
                        report_dataView.setItems(data.Result);
                        report_dataView.setFilterArgs({
                            percentCompleteThreshold: percentCompleteThreshold,
                            searchString: searchString
                        });
                        report_dataView.setFilter(myFilter);
                        report_dataView.endUpdate();
        
                        // if you don't want the items that are not visible (due to being filtered out
                        // or being on a different page) to stay selected, pass 'false' to the second arg
                        report_dataView.syncGridSelection(report_grid, false);
        
                        // $('#reportGrid .slick-pane-top').css('height', "calc(100% - 40px)");
                    });

                    $('body').addClass('overlay');
                    $('#reportBackups').jqxWindow('open');
                    $('#reportBackups').jqxWindow({position: "center"});

                    setTimeout(() => {
                        $('#reportBackups .jqx-window-content').css("width", "calc(100% - 8px)").css("overflow", "unset");
                        $('#reportGrid').css("height", parseInt($("#reportBackups").height())-122);
                        $('#reportGrid').css("width", parseInt($("#reportBackups").width())-8);
                        $('#reportGrid .slick-pane-top').css('height', "calc(100% - 15px)");
                        $('#reportGrid .slick-viewport').css('height', "calc(100% - 15px)");

                        report_columns[1].width = parseInt($("#reportBackups").width()) - 502;
                        report_grid.setColumns(report_columns);

                        var headers =   $('#reportGrid .slick-header-columns').children();
                        var firstHeaderRow = $(headers[0]).children()[0];
                        $(firstHeaderRow).css("margin-left", 19);                
                        var typeHeaderRow = $(headers[5]).children()[0];
                        $(typeHeaderRow).css("margin-left", 22);
                    }, 100);
                    
                    $("#btnLoadReport").jqxButton({
                        width: '60px',
                        height: '35px',
                        textPosition: "center"
                    });
    
                    $("#btnCancelModal").jqxButton({
                        width: '65px',
                        height: '35px',
                        textPosition: "center"
                    });
    
                    $("#btnLoadReport").on('click', function () {
                        if(getSession() == undefined || getSession() == ""){
                            openLoginPopup();
                        }
                        else{
                            var rowsindexes = report_grid.getSelectedRows();
                            if(rowsindexes.length > 0){
                                var row = report_grid.getDataItem(rowsindexes[0]);
                                call_api_ajax1('ReadReport', 'get', {
                                    SessionToken: getSession(),
                                    ReportID: row['ReportID']
                                }, true, (data) => {
                                    console.log(data);
                                    try {
                                        JSON.parse(data.Result.ReportJSON);
                                        var win = window.open("report_viewer?report_id=" + escape(row['ReportID']) + "&tab=prices&layout=1", '_blank');
                                    } catch (ex) {
                                        dialogWindow("Wrong JSON Format: " + ex, "error");
                                    }
                                });
                                
                                // win.focus();
                            }
                        }
                    });
    
                    $("#btnCancelModal").on('click', function () {
                        $('#reportBackups').jqxWindow('close');
                    });
    
                    $('#reportBackups').on('resized', function (event) {
                        // $('#reportBackups .jqx-window-content').css("width", "calc(100% - 8px)").css("overflow", "unset");
                        // $('#reportGrid').css("height", parseInt($("#reportBackups").height())-122);
                        // $('#reportGrid').css("width", parseInt($("#reportBackups").width())-8);
                        // $('#reportGrid .slick-pane-top').css('height', "calc(100% - 15px)");
                        // $('#reportGrid .slick-viewport').css('height', "calc(100% - 15px)");
    
                        // report_columns[1].width = parseInt($("#reportBackups").width()) - 502;
                        // report_grid.setColumns(report_columns);
    
                        // var headers =   $('#reportGrid .slick-header-columns').children();
                        // var firstHeaderRow = $(headers[0]).children()[0];
                        // $(firstHeaderRow).css("margin-left", 19);                
                        // var typeHeaderRow = $(headers[5]).children()[0];
                        // $(typeHeaderRow).css("margin-left", 22);
                    });

                    $('#reportBackups').on('resizing', function (event) {
                        $('#reportBackups .jqx-window-content').css("width", "calc(100% - 8px)").css("overflow", "unset");
                        $('#reportGrid').css("height", parseInt($("#reportBackups").height())-122);
                        $('#reportGrid').css("width", parseInt($("#reportBackups").width())-8);
                        $('#reportGrid .slick-pane-top').css('height', "calc(100% - 15px)");
                        $('#reportGrid .slick-viewport').css('height', "calc(100% - 15px)");
    
                        report_columns[1].width = parseInt($("#reportBackups").width()) - 502;
                        report_grid.setColumns(report_columns);
    
                        var headers =   $('#reportGrid .slick-header-columns').children();
                        var firstHeaderRow = $(headers[0]).children()[0];
                        $(firstHeaderRow).css("margin-left", 19);                
                        var typeHeaderRow = $(headers[5]).children()[0];
                        $(typeHeaderRow).css("margin-left", 22);
                    });
    
                    $('#reportBackups').on('close', function () {
                        $('body').removeClass('overlay');
                    });
    
                    setTimeout(() => {
                        $('#reportGrid').css("height", "calc(100% - 85px)");
                        $('#reportGrid .slick-viewport').css('height', parseInt($('#reportGrid').height()));
    
                        var headers =   $('#reportGrid .slick-header-columns').children();
                        var firstHeaderRow = $(headers[0]).children()[0];
                        $(firstHeaderRow).css("margin-left", 19);                
                        var typeHeaderRow = $(headers[5]).children()[0];
                        $(typeHeaderRow).css("margin-left", 22);
    
                        $('#reportBackups .jqx-window-content').css("width", "calc(100% - 8px)").css("overflow", "unset");
                        $("#report-container span").css("left", 28).css("top", 4);
                        $("#reportBackups").css("min-width", 450).css("min-height", 250);
                    }, 50);
                }, null, () => {
                    // $('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');slick-column-name
                });
            }
        });
    }
    else {
        $('.home-menu').hide();
        $('.non-login').show();
    }
});