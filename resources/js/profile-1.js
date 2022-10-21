$.jqx.theme = 'light';
$.jqx.utilities.scrollBarSize = 11;

function openSeriesInNewTab(database, category, sessionToken) {
    dialogWindow("Do you want to view the metadata for category: " + category + "?", 'query', 'confirm', null,
        function() {
            window.open('mydsviewer?Datasource=' + database + '&Page=1&Category=' + category, '_blank')
        },
        null, null, {
            Ok: 'Yes',
            Cancel: 'No'
        });
}

function openNav() {
    $('#tabs-menu').addClass('show');

}

function closeNav() {
    $('#tabs-menu').removeClass('show');

}

$(document).ready(function() {
    $("#tabs-menu li").on('click', function() {
        if ($(window).width() <= 768) {
            closeNav();
        }
    });

    $.jqx.utilities.scrollBarSize = 11;

    var sessionToken = getSession(),
        url_tab = getParameterByName('tab'),
        DatasourcePage_active = false,
        userName = '',
        userRef = '',
        userCompany = '',
        userCountry = '',
        userPhone = '',
        userEmail = '',
        userAddress1 = '',
        userAddress2 = '',
        userAPIKey = '',
        userCity = '',
        userPostCode = '',
        userInActive = null,
        accessData, available, updateHint, grid, menu, last_API_KEY, userSettings = {};

    // Get user data and check if session is not Expired
    call_api_ajax('GetMyAccountDetails', 'get', {
        SessionToken: getSession()
    }, true, (data) => {
        // console.log(data.Result);
        userName = data.Result.Name;
        userRef = data.Result.UserNumber;
        userCompany = data.Result.Company;
        userCountry = data.Result.Country;
        userPhone = data.Result.Phone;
        userEmail = data.Result.Email;
        userAddress1 = data.Result.Address1;
        userAddress2 = data.Result.Address2;
        userCity = data.Result.City;
        userAPIKey = data.Result.APIKey;
        userPostCode = data.Result.PostCode;
        userInActive = data.Result.InactiveAccess;
        // console.log("apt"+userAPIKey);
        $('#username').text(userName);
        // console.log("active?"+userInActive);
        $('#tab6 .secTitle > span:first-child').text(userName + '. ' + userCompany);
        fillCustomerInformation();
    }, null, null, false);

    var settings = {
        Credentials: {
            UserRef: false,
            UserName: false,
            Password: false,
            Confirm: false
        },
        Token: {
            DefaultMins: 10
        },
        AutoLogin: false
    };

    call_api_ajax('ReadUserJSONSettings', 'get', {
        SessionToken: getSession()
    }, true, (data) => {
        data = JSON.parse(data.Result);

        settings.Credentials.UserRef = data.Credentials.UserRef;
        settings.Credentials.UserName = data.Credentials.UserName;
        settings.Credentials.Password = data.Credentials.Password;
        settings.Credentials.Confirm = data.Credentials.Confirm;
        settings.AutoLogin = data.AutoLogin;

        userSettings.id = data.Credentials.UserRef;
        userSettings.user = data.Credentials.UserName;
        userSettings.pass = data.Credentials.Password;
        userSettings.check = data.Credentials.Confirm;
        userSettings.autoLogin = data.AutoLogin;

        $('.rememberSettings').find('td.prop-value input[name="id"]').prop('checked', userSettings.id);
        $('.rememberSettings').find('td.prop-value input[name="username"]').prop('checked', userSettings.user);
        $('.rememberSettings').find('td.prop-value input[name="password"]').prop('checked', userSettings.pass);
        $('.rememberSettings').find('td.prop-value input[name="checkbox"]').prop('checked', userSettings.check);
        $('.rememberSettings').find('td.prop-value input[name="renewToken"]').prop('checked', userSettings.autoLogin);

        if (userSettings.id == true && userSettings.user == true && userSettings.pass == true) {
            $('.rememberSettings').find('td.prop-value input[name="renewToken"]').prop('disabled', false);
        } else {
            $('.rememberSettings').find('td.prop-value input[name="renewToken"]').prop('disabled', true);
        }

        // $("#token-life").val(data.Token.DefaultMins);
    }, null, null, false);

    $('.rememberSettings').find('td.prop-value input').click(function() {
        if ($('.rememberSettings').find('td.prop-value input[name="id"]').is(':checked') == true &&
            $('.rememberSettings').find('td.prop-value input[name="username"]').is(':checked') == true &&
            $('.rememberSettings').find('td.prop-value input[name="password"]').is(':checked') == true
        ) {
            $('.rememberSettings').find('td.prop-value input[name="renewToken"]').prop('disabled', false);
        } else {
            $('.rememberSettings').find('td.prop-value input[name="renewToken"]').prop('checked', false);
            $('.rememberSettings').find('td.prop-value input[name="renewToken"]').prop('disabled', true);
        }
    });

    function createDatasourcePage() {
        call_api_ajax('GetUserDatasources', 'get', {
            SessionToken: getSession(),
            ReturnCategoryList: 'true'
        }, true, (data) => {
            // console.log('===', data)
            data = data.Result;
            if (data.length <= 99) {
                var $prevItems = null;

                for (var i in data) {
                    let obj;
                    if (data[i].IsCategoryDS === true) {
                        grid = $('<div style="border-color: transparent;" id="grid' + i + '"></div>');
                        menu = $('<div id="jqxdropdownbutton' + i + '"></div>');
                        accessData = '<div class="idm-access"><i><img src="resources/css/icons/Folder16.png" alt=""></i> Categories: <span>' + data[i].DetailsDS.UserCategoryCount + '/' + data[i].DetailsDS.CategoryCount + '</span><span class="online-bt sm-btn"></span></div>';
                        available = '<p> Updated: ' + data[i].LastUpdated.split('T').join(' ').split('Z').join(' ') + '</p></div>';
                        updateHint = '';
                        obj = 'DetailsDS';
                    } else {
                        accessData = '<div class="idm-access"><i><img src="resources/css/icons/Key16.png" alt=""></i> ' + data[i].Details.Subscription + ' Access: <span>' + data[i].Details.UserAccess.Starts + ' to ' + data[i].Details.UserAccess.Ends + '</span></div>';
                        available = '<p> Available: ' + data[i].Details.StartDate + ' to ' + data[i].Details.EndDate + '</p></div>';
                        updateHint = 'title=" Updated: ' + data[i].LastUpdated.split('T').join(' ').split('Z').join(' ') + '"';
                        obj = 'Details';
                    }

                    var items = $('<div class="col-lg-6 idm-box">' +
                        '<div class="idm-box-inner">' +
                        '<div class="idm-box-inner-heading">' +
                        '<div class="idm-box-logo">' +
                        //                                '<img src="'+ data[i].Icon.split('http:').join(location.protocol) +'" alt="">' +
                        '<img src="' + data[i].Logo.split('http:').join(location.protocol) + '" alt="">' +
                        '</div><div class="idm-box-heading"><h2>' +
                        '<a href="mydsviewer?Datasource=' + data[i].Datasource + '" target="_blank">' + data[i].Name + '</a>' +
                        '</h2><span style="position: absolute; top: 90%; left: 10px;">Datasource: <strong><a id="sourceName" href="mydsviewer?Datasource=' + data[i].Datasource + '" target="_blank">' + data[i].Datasource + '</a></strong></span>' +
                        '</div></div><div class="idm-mid-part">' +
                        '<p class="equal-height">' + data[i].Description + '</p>' +
                        '<div class="dis-block clearfix"><div class="idm-date"><i>' +
                        '<img src="resources/idm-service/resources/images/date-icon.jpg" ' + updateHint + ' alt=""></i>' + available +
                        '<div class="idm-series">Series: <span>' + data[i][obj].SeriesCount + '</span></div>' + accessData +
                        '</div><div class="idm-inner-footer"><span class="premium-bt pull-left">' +
                        '</span> <span class="online-bt pull-right"><a href="mydsviewer?Datasource=' + data[i].Datasource + '" target="_blank">View Details</a></span>' +
                        '</div></div></div></div>');

                    items.appendTo('.idm-database-block > .row');

                    if (i % 2 != 0) {
                        var $content1 = $prevItems.find('.equal-height');
                        var $content2 = items.find('.equal-height');
                        var h1 = $content1.height();
                        var h2 = $content2.height();
                        var maxHeight = h1 > h2 ? h1 : h2;
                        $content1.height(maxHeight);
                        $content2.height(maxHeight);
                    }

                    $prevItems = items;

                    if (data[i].IsCategoryDS === true) {
                        $(items).css('background-color', '#e6fbec').find('.online-bt a').css({
                            "background": "#6eb343",
                            "color": "#fff"
                        });
                        $('.sm-btn').append(menu);
                        menu.append(grid);

                        var left = $(grid).offset().left,
                            top = $(grid).offset().top,
                            p_w = $('.main-content').outerWidth(),
                            p_h = $('.main-content').outerHeight(),
                            p_l = $('.main-content').offset().left,
                            p_t = $('.main-content').offset().top,
                            width = p_l + p_w - left,
                            height = p_t + -top;

                        menu.jqxDropDownButton({
                            width: 50,
                            height: 20
                        });

                        var dropDownContent = "<img src='resources/css/icons/smViewDD.png' style='width: 50px; height: 20px;margin-left: -3px;' />";
                        menu.jqxDropDownButton('setContent', dropDownContent);

                        let source = {
                            localdata: [],
                            //                            datatype: "array",
                            datatype: "json",
                            datafields: [{
                                    name: 'Name',
                                    type: 'string'
                                },
                                {
                                    name: 'Description',
                                    type: 'string'
                                },
                                {
                                    name: 'StartDate',
                                    type: 'date'
                                },
                                {
                                    name: 'EndDate',
                                    type: 'date'
                                },
                                {
                                    name: 'Starts',
                                    'map': 'UserAccess>Starts',
                                    type: 'date'
                                },
                                {
                                    name: 'Ends',
                                    'map': 'UserAccess>Ends',
                                    type: 'date'
                                },
                                {
                                    name: 'SeriesCount',
                                    type: 'int'
                                },
                                {
                                    name: 'Subscription',
                                    type: 'string'
                                }
                                //                                { name: 'InactiveAccess', type: 'boolean' }
                            ]
                        };

                        let dataAdapter = new $.jqx.dataAdapter(source, {
                            loadComplete: function(data) {},
                            loadError: function(xhr, status, error) {}
                        });

                        source.localdata = data[i].DetailsDS.UserCategoryList;
                        height = 35 + (source.localdata.length * 34);

                        if (height > 200)
                            height = 200;

                        // console.log('height', height);

                        var pagerrenderer = function() {
                            var element = $("<div style='margin-left: 10px; margin-top: 11px; width: 100%; height: 100%;'></div>");
                            var datainfo = $("#grid" + i).jqxGrid('getdatainformation');
                            var paginginfo = datainfo.paginginformation;
                            var leftButton = $("<div style='padding: 0px; float: left;'><div style='margin-left: 9px; width: 16px; height: 16px;'></div></div>");
                            leftButton.find('div').addClass('jqx-icon-arrow-left');
                            leftButton.width(36);

                            var rightButton = $("<div style='padding: 0px; margin: 0px 3px; float: left;'><div style='margin-left: 9px; width: 16px; height: 16px;'></div></div>");
                            rightButton.find('div').addClass('jqx-icon-arrow-right');
                            rightButton.width(36);

                            leftButton.appendTo(element);
                            rightButton.appendTo(element);
                            var label = $("<div style='font-size: 11px; margin: 2px 3px; margin-top:-2px; font-weight: bold; float: left;'></div>");
                            label.text("1-" + paginginfo.pagesize + ' of ' + datainfo.rowscount);
                            label.appendTo(element);
                            self.label = label;
                            // update buttons states.
                            var handleStates = function(event, button, className, add) {
                                button.on(event, function() {
                                    if (add == true) {
                                        button.find('div').addClass(className);
                                    } else button.find('div').removeClass(className);
                                });
                            }
                            rightButton.click(function() {
                                grid.jqxGrid('gotonextpage');
                            });
                            leftButton.click(function() {
                                grid.jqxGrid('gotoprevpage');
                            });
                            return element;
                        }

                        grid.on('pagechanged', function() {
                            var datainfo = grid.jqxGrid('getdatainformation');
                            var paginginfo = datainfo.paginginformation;
                            self.label.text(1 + paginginfo.pagenum * paginginfo.pagesize + "-" + Math.min(datainfo.rowscount, (paginginfo.pagenum + 1) * paginginfo.pagesize) + ' of ' + datainfo.rowscount);
                        });

                        var symbol_renderer = function(row, datafield, value, html, columnproperties, record) {
                            return '<div class="jqx-grid-cell-left-align" id="vCenter" ><a target="_blank" onclick="openSeriesInNewTab(\'' + data[i].Datasource + '\',\'' + value + '\',\'' + getSession() + '\');">' + value + '</a></div>';
                        }

                        var inactiveAccess_renderer = function(row, datafield, value) {
                            if (value) return '<div class="inactiveRenderer"><img id="startIcon" height="17" width="17" src="resources/css/icons/confirm24.png"></div>';
                            else return '<div class="inactiveRenderer"><img id="startIcon" height="17" width="17" src="resources/css/icons/cancel_AI.png"></div>';
                        }

                        var cellclassname = function(row, column, value, data) {
                            if (isDateExpired(data.Ends, true))
                                return 'redClass';
                        }

                        grid.jqxGrid({
                            width: width - 5,
                            source: dataAdapter,
                            pageable: false,
                            height: height,
                            sortable: true,
                            columnsresize: true,
                            theme: 'light',
                            pagerrenderer: pagerrenderer,
                            columns: [{
                                    text: 'Name',
                                    align: 'center',
                                    datafield: 'Name',
                                    width: 100,
                                    filtertype: 'string',
                                    //cellsrenderer: symbol_renderer
                                },
                                {
                                    text: 'Description',
                                    align: 'center',
                                    datafield: 'Description',
                                    filtertype: 'string'
                                },
                                {
                                    text: 'Count',
                                    align: 'center',
                                    datafield: 'SeriesCount',
                                    width: 100,
                                    filtertype: 'number',
                                    cellsalign: 'center'
                                },
                                {
                                    text: 'From',
                                    align: 'center',
                                    datafield: 'Starts',
                                    width: 100,
                                    cellsalign: 'center',
                                    filtertype: 'range',
                                    cellsformat: 'yyyy-MM-dd'
                                },
                                {
                                    text: 'To',
                                    align: 'center',
                                    datafield: 'Ends',
                                    width: 100,
                                    cellsalign: 'center',
                                    filtertype: 'range',
                                    cellsformat: 'yyyy-MM-dd',
                                    cellclassname: cellclassname
                                },
                                {
                                    text: 'Access',
                                    align: 'center',
                                    datafield: 'Subscription',
                                    width: 100,
                                    filtertype: 'string',
                                    cellsalign: 'center'
                                },
                                {
                                    text: 'Start Date',
                                    align: 'center',
                                    datafield: 'StartDate',
                                    minwidth: 75,
                                    width: 200,
                                    cellsalign: 'center',
                                    filtertype: 'range',
                                    cellsformat: 'yyyy-MM-dd'
                                },
                                {
                                    text: 'End Date',
                                    align: 'center',
                                    datafield: 'EndDate',
                                    width: 120,
                                    cellsalign: 'center',
                                    filtertype: 'range',
                                    cellsformat: 'yyyy-MM-dd'
                                },
                                //                                { text: 'I.A.', align: 'center', datafield: 'InactiveAccess', width: 100, filtertype: 'boolean', cellsalign: 'center', cellsrenderer: inactiveAccess_renderer }
                            ],
                            ready: function() {
                                grid.jqxGrid('autoresizecolumns');
                            },
                            handlekeyboardnavigation: function(event) {
                                var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
                                var ctrlKey = event.ctrlKey;

                                var position = grid.jqxGrid('scrollposition');
                                var left = position.left;
                                var top = position.top;
                                var val = ctrlKey == true ? 50000 : 40;

                                switch (key) {
                                    case 37: // left
                                        grid.jqxGrid('scrolloffset', top, left - val);
                                        return true;
                                    case 38: // up
                                        grid.jqxGrid('scrolloffset', top - val, left);
                                        return true;
                                    case 36: // up Home
                                        grid.jqxGrid('scrolloffset', top - val, left);
                                        if (ctrlKey) {
                                            grid.jqxGrid('clearselection');
                                            grid.jqxGrid('selectrow', 0);
                                        }
                                        return true;
                                    case 39: // right
                                        grid.jqxGrid('scrolloffset', top, left + val);
                                        return true;
                                    case 40: // down
                                        grid.jqxGrid('scrolloffset', top + val, left);
                                        return true;
                                    case 35: // down End
                                        grid.jqxGrid('scrolloffset', top + val, left);
                                        if (ctrlKey) {
                                            grid.jqxGrid('clearselection');
                                            var rows = grid.jqxGrid('getrows');
                                            grid.jqxGrid('selectrow', rows.length - 1);
                                        }
                                        return true;
                                }
                            },
                        });

                        var rows = grid.jqxGrid('getrows');
                        var count = rows.length;

                        if (count > 10) {
                            grid.jqxGrid({
                                pageable: true,
                                pagesize: 10
                            });
                        }

                        // initialize jqxGrid
                        grid.on('rowselect', function(event) {
                            var args = event.args;
                            var row = grid.jqxGrid('getrowdata', args.rowindex);
                        });

                    }
                }
            } else window.location.href = "MySubscriptions";

            DatasourcePage_active = true;
        });
    }


    var boxes = document.getElementsByClassName("col-sm-6 idm-box");

    for (var i = 0; i < boxes.length - 1; i++) {
        for (var j = i + 1; j < boxes.length; j++) {
            if (boxes[i].innerHTML.indexOf("top-right-ribbon") === -1 && boxes[j].innerHTML.indexOf("top-right-ribbon") !== -1) {
                var t = boxes[i].outerHTML;
                boxes[i].outerHTML = boxes[j].outerHTML;
                boxes[j].outerHTML = t;
            }
            if (boxes[i].innerHTML.indexOf("top-right-ribbon") !== -1 && boxes[j].innerHTML.indexOf("top-right-ribbon") === -1) {
                // ne menjaj im mesta
            } else {
                var nameI = boxes[i].getElementsByClassName("idm-box-heading")[0].getElementsByTagName("a")[0].innerHTML;
                var nameJ = boxes[j].getElementsByClassName("idm-box-heading")[0].getElementsByTagName("a")[0].innerHTML;
                if (nameJ < nameI) {
                    var t = boxes[i].outerHTML;
                    boxes[i].outerHTML = boxes[j].outerHTML;
                    boxes[j].outerHTML = t;
                }
            }
        }
    }

    var cont = $(".row");
    var str = "";
    for (var i = 0; i < boxes.length; i++) {
        if (i % 2 == 0) boxes[i].classList.add("mr");
        str += boxes[i].outerHTML;
    }
    cont.html(str);

    if (url_tab !== "") {
        if (url_tab == "MySubscriptions") createDatasourcePage();

        if ($('#tabs-menu li[data-tab="' + url_tab + '"]').length > 0) {
            $('#tabs-menu li, .page').removeClass('active');
            $('#tabs-menu li[data-tab="' + url_tab + '"]').addClass('active');
            $('#' + $('#tabs-menu li[data-tab="' + url_tab + '"]').attr('data-page')).addClass('active');
        } else {
            window.history.pushState('profile', 'profile', 'profile?tab=MyProfile');
        }
    } else {
        window.history.pushState('profile', 'profile', 'profile?tab=MyProfile');
    }

    $('#tabs-menu li').click(function() {
        if (getSession() == undefined || getSession() == "") {
            openLoginPopup();
        } else {
            // $("#check").prop('checked', false);
            // $("#token-life").val(min);

            $("#saveDefault").jqxButton({
                width: '55px',
                height: '28px',
                textPosition: "center"
            });

            var id = $(this).attr('data-page');
            if ($(this).attr('data-tab') == "MySubscriptions" && !DatasourcePage_active) {
                createDatasourcePage();
            }

            $('#tabs-menu li').removeClass('active');
            $('.page.active').removeClass('active');
            $(this).addClass('active');
            $('#' + id).addClass('active');
            window.history.pushState('profile', 'profile', 'profile?tab=' + $(this).attr('data-tab'));
        }
    });

    $('#profile').attr('href', 'profile?tab=MyProfile');
    $('#favorites').attr('href', 'profilemain?tab=favorites');
    $('#logout').click(function() {
        logout();
    });
    $('#listViewer').parent().remove()

    $('#newAPIKey').click(function() {
        if (getSession() == undefined || getSession() == "") {
            openLoginPopup();
        } else {
            openRequestNewApiKeyDialog();
        }
    });

    var get_time = function(currentTime) {
        let time = currentTime / 1000,
            min = parseInt(time / 60),
            seconds = parseInt(time % 60);

        min = (min < 10) ? "0" + min : min;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        return min + ":" + seconds;
    }

    var curTime = 0,
        min = 0,
        sessionTime;

    call_api_ajax('SessionTokenExpires', 'get', {
        SessionToken: getSession()
    }, false, (data) => {
        // if(getCookie("remaining") > 0){
        //     curTime = getCookie("remaining");
        // }
        // else{
        setCookie("remaining", data.Result.Remaining);
        curTime = data.Result.Remaining;
        // }

        min = data.Result.Remaining / 1000,
            min = parseInt(min / 60);
        $("#remaining-token").text(get_time(curTime));
        // $("#token-life").val(min);
    }, null, null, false);

    $("#token-life").keyup(function(event) {
        if (!($("#token-life").val() >= 1 && $("#token-life").val() <= 1440)) {
            dialogWindow('Minutes of life for a new session token. Range is 1 to 1440 (1 day).', "information");
            this.value = this.value.slice(0, -1);
        }
    });

    $("#token-life").val(getCookie('defaultMin'));

    var sessionTimeFunc = () => {
        curTime = getCookie("remaining");
        $('#session-token').html(getSession());
        sessionTime = setInterval(() => {
            // curTime = getCookie("remaining");
            if (getCookie("remaining") > 0 && (curTime - 1000) >= 0) {
                curTime -= 1000;
                $("#remaining-token").text(get_time(curTime));
                $('#loginPopup').jqxWindow('close');
                // setCookie("remaining", curTime);
            } else {
                $("#remaining-token").text('00:00');
                $('#session-token').html('&nbsp;');
                last_API_KEY = $('#apiKey').val();
                $('#apiKey, #newPassword, #confrimPassword').val('');
                $("#newPassword").prop('disabled', true);
                $('#confrimPassword').prop('disabled', true);
                $('#generatedPass').prop('disabled', true);
                $('#btnSaveUserPassword').prop('disabled', true);
                $('#newAPIKey').prop('disabled', true);
                setSession("");

                bc.postMessage({
                    path: 'profile',
                    active: 0,
                    SessionToken: ""
                });

                bc.postMessage({
                    path: 'login',
                    message: "Token has already expired"
                });

                setSession("Token has already expired", "error");

                // window.location.href = '/login';
                clearInterval(sessionTime);
                openLoginPopup();
            }
        }, 1000);
    }

    $('#session-token').text(getSession());

    sessionTimeFunc();

    $('#btnLoadLogin').click(function() {
        setTimeout(() => {
            sessionTimeFunc();
        }, 3000);
    });

    $('[data-toggle="popover"]').popover();

    $("#btnSaveUserPassword").click(function(event) {
        if (getSession() == undefined || getSession() == "") {
            openLoginPopup();
        } else {
            event.preventDefault();
            var newPassword = $("#newPassword").val();
            var confirmPassword = $("#confrimPassword").val();
            if (newPassword == '' && confirmPassword == '') {
                apprise("The password is blank. Please enter (and confirm) a new valid password.", null, () => {
                    $("#newPassword").focus();
                });
                return;
            }

            if (newPassword == null || newPassword === '' || confirmPassword !== newPassword) {
                apprise("The values in 'New Password' and 'Confirm Password' do not match. Please check and try again.", null, () => {
                    $("#confrimPassword").focus();
                });
            } else {
                dialogWindow("Save the new password?", 'query', 'confirm', 'Change my password', submitFormPassword, () => {
                    $("#newPassword").val('');
                    $('#confrimPassword').val('');
                });
            }
        }
    });

    $('#saveSettings').click(function() {
        if (getSession() == undefined || getSession() == "") {
            openLoginPopup();
        } else {
            $('.rememberSettings').find('td.prop-value input').each(function() {
                if ($(this).attr('name') == "id") {
                    settings.Credentials.UserRef = $(this).is(':checked') ? true : false;
                } else if ($(this).attr('name') == "username") {
                    settings.Credentials.UserName = $(this).is(':checked') ? true : false;
                } else if ($(this).attr('name') == "password") {
                    settings.Credentials.Password = $(this).is(':checked') ? true : false;
                } else if ($(this).attr('name') == "checkbox") {
                    settings.Credentials.Confirm = $(this).is(':checked') ? true : false;
                } else if ($(this).attr('name') == "renewToken") {
                    settings.AutoLogin = $(this).is(':checked') ? true : false;
                }
            });

            var settings_str = JSON.stringify(settings);

            call_api_ajax("WriteUserJSONSettings", "post", JSON.stringify({
                SessionToken: getSession(),
                Data: settings_str
            }), true, () => {
                $('.rememberSettings').find('td.prop-value input').each(function() {
                    setCookie('remember-' + $(this).attr('name'), $(this).is(':checked') ? true : false);
                });
                dialogWindow("Settings saved successfully", "information");
            });
        }
    });

    function openRequestNewApiKeyDialog() {
        var msg = "Changing the API Key may cause problems for other applications that use the API to get market data." +
            "<br><br>Are you sure that you want to change the API Key?"
        dialogWindow(msg, 'warning', 'confirm', 'Change your API Key', generateNewAPIKey);
    }

    function submitFormPassword() {
        var newPassword = $("#newPassword").val();

        let = parameters = {
            SessionToken: getSession(),
            NewPassword: newPassword
        };

        call_api_ajax('ChangeUserPassword', 'get', parameters, true, () => {
            dialogWindow('Password was changed successfully', 'information');
            $("#newPassword").val('');
            $('#confrimPassword').val('');
        });
    }

    function fillCustomerInformation() {
        // console.log('fillCustomerInformation() was called');
        $(".reference > span").html(userRef);
        $("#name").html(userName);

        var address = userAddress1;

        if (userAddress2 != null && userAddress2 != '')
            address += '<p>' + userAddress2 + '</p>';

        if (userCity != null && userCity != '')
            address += '<p>' + userCity + '</p>';

        if (userCountry != null && userCountry != '')
            address += '<p>' + userCountry + '</p>';

        if (userPostCode != null && userPostCode != '')
            address += '<p>' + userPostCode + '</p>';

        $("#address").html(address);
        $("#company").html(userCompany);
        $("#country").html(userCountry);

        var phoneNumber = (userPhone !== undefined) ? userPhone : "";
        $("#phone").text(phoneNumber);
        $("#email").text(userEmail);

        $("#username").text(userName);
        $("#apiKey").val(userAPIKey);
    }

    $('#deleteSession').click(function() {
        if (getSession() == undefined || getSession() == "") {
            openLoginPopup();
        } else {
            let sessionToken = getSession();
            if (sessionToken !== "" && sessionToken !== null && sessionToken !== undefined) {
                dialogWindow('Do you want to clear the current session token?', 'query', 'confirm', null, () => {
                    call_api_ajax('RevokeSessionToken', 'get', {
                        SessionToken: sessionToken
                    }, true, () => {
                        setSession("");
                        clearInterval(sessionTime);
                        $("#remaining-token").text('00:00');
                        $('#session-token').html('&nbsp;');
                        last_API_KEY = $("#apiKey").val();
                        $('#apiKey, #confrimPassword, #newPassword').val('');
                        $("#newPassword").prop('disabled', true);
                        $('#confrimPassword').prop('disabled', true);
                        $('#generatedPass').prop('disabled', true);
                        $('#btnSaveUserPassword').prop('disabled', true);
                        $('#newAPIKey').prop('disabled', true);

                        bc.postMessage({
                            path: 'profile',
                            active: 0,
                            SessionToken: ""
                        });

                    }, () => {
                        return false;
                    }, () => {
                        clearInterval(sessionTime);
                    });
                }, null, null, {
                    Ok: 'Yes',
                    Cancel: 'No'
                });
            } else {
                dialogWindow('The token is already blank', 'error');
            }
        }
    });

    $("#saveDefault").jqxButton({
        width: '55px',
        height: '28px',
        textPosition: "center"
    });
    $("#saveDefault span").css("left", 14).css("color", "#212529").css("font-weight", "normal");

    $("#saveDefault").on('click', function() {
        if (getSession() == undefined || getSession() == "") {
            openLoginPopup();
        } else {
            settings.Token.DefaultMins = parseInt($("#token-life").val());
            var settings_str = JSON.stringify(settings);

            call_api_ajax("WriteUserJSONSettings", "post", JSON.stringify({
                SessionToken: getSession(),
                Data: settings_str
            }), true, () => {
                setCookie('defaultMin', settings.Token.DefaultMins);
                dialogWindow("Settings saved successfully", "information");
            });

            var time_json = [{
                    name: 'Default',
                    value: parseFloat(settings.Token.DefaultMins / 60)
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

            $("#liveTime").jqxDropDownList('source', time_json);
        }
    });

    $('#newSession').click(function() {
        if (getSession() == undefined || getSession() == "") {
            openLoginPopup();
        } else {
            sessionToken = getSession();
            if (sessionToken !== "" && sessionToken !== null && sessionToken !== undefined) {
                dialogWindow('Create a new ' + $('#token-life').val() + ' minute session token?', 'query', 'confirm', null, () => {
                        call_api_ajax('GetSessionToken', 'get', {
                            APIKey: userAPIKey,
                            Minutes: $("#token-life").val()
                        }, true, (data) => {
                            setCookie("remaining", data.Result.Remaining);
                            // curTime = data.Result.Remaining;
                            setSession(data.Result.SessionToken);
                            $('#session-token').text(data.Result.SessionToken);

                            // Here is the problem -->
                            bc.postMessage({
                                path: 'profile',
                                active: 1,
                                SessionToken: data.Result.SessionToken
                            });
                            sessionTimeFunc();
                        }, null, () => {
                            clearInterval(sessionTime);
                        });
                    },
                    null, null, {
                        Ok: 'Yes',
                        Cancel: 'No'
                    });
            } else {
                dialogWindow('The token is blank so you will be logged out shortly.<br>Do you want to login again to get a new token?', 'query', 'confirm', null, () => {
                    window.location.href = 'login';
                }, null, null, {
                    Ok: 'Yes',
                    Cancel: 'No'
                });
            }
        }
    });

    $('#refreshSessionToken').click(function() {
        if (getSession() == undefined || getSession() == "") {
            openLoginPopup();
        } else {
            sessionToken = getSession();
            if (sessionToken !== "" && sessionToken !== null && sessionToken !== undefined) {
                dialogWindow('Do you want to restore the session token to full life?', 'query', 'confirm', null, () => {
                        call_api_ajax('RenewSessionToken', 'get', {
                            SessionToken: sessionToken
                        }, true, (data) => {
                            curTime = data.Result.Remaining;
                            bc.postMessage({
                                path: 'profile',
                                active: 1,
                                SessionToken: data.Result.SessionToken
                            });

                        }, () => {
                            dialogWindow('The token is blank so you will be logged out shortly.<br>Do you want to login again to get a new token?', 'query', 'confirm', null, () => {
                                window.location.href = 'login';
                            }, null, null, {
                                Ok: 'Yes',
                                Cancel: 'No'
                            });
                            return false;
                        });
                    },
                    null, null, {
                        Ok: 'Yes',
                        Cancel: 'No'
                    });
            } else {
                dialogWindow('The token is blank so you will be logged out shortly.<br>Do you want to login again to get a new token?', 'query', 'confirm', null, () => {
                    window.location.href = 'login';
                }, null, null, {
                    Ok: 'Yes',
                    Cancel: 'No'
                });
            }
        }
    });

    function generateNewAPIKey() {
        call_api_ajax('RequestNewAPIKey', 'get', {
            SessionToken: getSession()
        }, false, (data) => {
            $("#apiKey").val(data.Result.APIKey);
            dialogWindow("The API Key has now changed. Please use this new key when requesting data from the API.", "information");
        });
    }

    bc.addEventListener("message", e => {
        if (e.data.path == "profile") {
            if (e.data.active) {
                clearInterval(sessionTime);
                sessionToken = e.data.SessionToken;
                $("#apiKey").val(last_API_KEY);
                $("#newPassword").prop('disabled', false);
                $('#confrimPassword').prop('disabled', false);
                $('#generatedPass').prop('disabled', false);
                $('#btnSaveUserPassword').prop('disabled', false);
                $('#newAPIKey').prop('disabled', false);
                $('#session-token').html(e.data.SessionToken);
                curTime = 1800000;
                sessionTimeFunc();
            } else {
                curTime = 0;
                clearInterval(sessionTime);
                $("#remaining-token").text('00:00');
                $('#session-token').html('&nbsp;');
                last_API_KEY = $("#apiKey").val();
                $('#apiKey, #newPassword, #confrimPassword').val('');
                $("#newPassword").prop('disabled', true);
                $('#confrimPassword').prop('disabled', true);
                $('#generatedPass').prop('disabled', true);
                $('#btnSaveUserPassword').prop('disabled', true);
                $('#newAPIKey').prop('disabled', true);
            }
        }
    });

    /*$('#copyAPIKey').click(function () {
        copyToClipboard($('#apiKey').val());
        alert("API Key copied!");
        // $("#copyAPIKey").text("Copied!");
    });
    $(".fa-eye-slash").click(function (e) {
        console.log('eye clicked');
        e.preventDefault();
        if($("#apiKey").attr("type")=="password"){
            $("#apiKey").attr("type","text");
        }else{
            $("#apiKey").attr("type","password");
        }
    });


    if (userInActive == true) {
        $("#contactInformation").show();
        fillCustomerInformation();
        console.log('active');
    } else {
        console.log('we show error');
        $("#errorMsgBlock").show();
        console.log("dead");
    }*/

});
$("#generatedPass").jqxTooltip({
    content: "Click to generate a sample 4 word passphrase that you can edit",
    position: 'top-left',
    theme: 'light'
});

$("#words-wrapper").jqxTooltip({
    content: "Choose the number of words in any generated passphrase (4)",
    position: 'top-left',
    theme: 'light'
});

$("#words-number").jqxDropDownList({
    template: "warning",
    source: [3, 4, 5, 6, 7, 8],
    selectedIndex: 1,
    width: '22',
    height: '26',
    theme: "light",
    autoDropDownHeight: true,
    // dropDownHeight: 250
});

$('#words-number').change(function(e) {
    e.preventDefault();
    e.stopPropagation();
    var num = $(this).val();

    $("#generatedPass").jqxTooltip({
        content: "Click to generate a sample " + num + " word passphrase that you can edit",
    });

    $("#words-wrapper").jqxTooltip({
        content: "Choose the number of words in any generated passphrase (" + num + ")",
    });
});

$('#generatedPass').click(function() {
    if (getSession() == undefined || getSession() == "") {
        openLoginPopup();
    } else {
        console.log("clecik new");
        var words = $('#words-number').val() || 3;
        call_api_ajax('GenerateMyPassPhraseJSON', 'get', {
            words: words
        }, true, (data) => {
            console.log("newpass");
            $('#newPassword').val(data.Result);
        });
    }
});
$(".fa-eye-slash").click(function(e) {
    // console.log('eye clicked');
    e.preventDefault();
    if ($("#apiKey").attr("type") == "password") {
        $("#apiKey").attr("type", "text");
    } else {
        $("#apiKey").attr("type", "password");
    }
});

$('#copyAPIKey').click(function() {
    copyToClipboard($('#apiKey').val());
    //alert("API Key copied!");
    dialogWindow("API Key copied!", "information");
    // $("#copyAPIKey").text("Copied!");
});