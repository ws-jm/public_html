/*******************
 Series Report
 *******************/
let parameters, requestParameters, notesParameters, userParameters, hideEmptyRows = false,
    allow_weekend = false,
    edit_flag = false,
    report_name, report_locked, report_type, request_editor, notes_editor, user_editor, response_viewer, response_json, columns, series_columns, batesArray;

window.onload = function() {

    setTimeout(hideloader, 1000); /* change the value "2000ms to any duration you want */

    //hide the preloader
    function hideloader() {
        document.querySelector(".loader-container").style.display = "none";
    }

    $.jqx.theme = 'light';
    $.jqx.utilities.scrollBarSize = 11;

    // Define all variables
    var simpleViewChecked = 1;
    var toggleMetaData = 1,
        requestedTab = getParameterByName('tab'),
        report_id = getParameterByName('report_id'),
        sessionToken = getSession(),
        layout = getParameterByName('layout'),
        isPricesDataLoaded = false,
        highlight_weekends = true,
        hasUserAccessToCategory = true,
        layoutURL = !isNaN(parseInt(layout)) ? "&layout=" + layout : "",
        frequency_array = {
            d: 'Day',
            w: 'Week',
            hm: 'HalfMonth',
            m: 'Month',
            q: 'Quarter',
            hy: 'HalfYear',
            y: 'Year'
        },
        corrections_count,
        size = 0,
        real_decimal = 4,
        digits = 4,
        decimalText = '0004',
        isChartLoaded = false,
        source = {},
        disabledGrid = false,
        expired = false,
        bates = [],
        corrections_array = [],
        gridMetadata,
        startDate,
        endDate,
        data_corr = {},
        corrections_count = 0,
        hide_data,
        bateStatus = [],

        rowsData,
        rowsOriginalData,
        rowsWeekendData,
        preHeaderColumnHeight = 0,
        reportsList = [],
        selectReportIndex = -1,
        fullWidthFlag = true,
        columnsWithHighlightingById = {};
    original_columnsWithHighlightingById = {};
    all_select = false;

    request_editor = new JsonEditor('#request-json-display', {}, { editable: false });
    // notes_editor = new JsonEditor('#notes-json-display', {}, { editable: false });
    user_editor = new JsonEditor('#user-json-display', {}, { editable: false });
    response_viewer = new JSONViewer({
        container: document.body,
        data: {},
        theme: 'light',
        expand: false
    });
    document.querySelector("#response-json-display").appendChild(response_viewer.getContainer());

    function isNumberFunc(n) {
        return /^-?[\d.]+(?:e-?\d+)?$/.test(n) && !isNaN(parseFloat(n));
    }

    $("#jqxLoader").jqxLoader({
        width: 120,
        height: 60,
        autoOpen: false,
        imagePosition: 'top',
        text: "Requesting data..."
    });

    $("#jqxLoader1").jqxLoader({
        width: 80,
        height: 60,
        autoOpen: false,
        imagePosition: 'top',
        text: "Saving..."
    });

    var textLength = $("<span class='hidden-text'>");
    $('body').append(textLength);

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function resizeColumns(grid_id) {
        var grid = grid_id,
            get_columns = grid.getColumns(),
            gridData = {};

        if (grid.getData().length == undefined)
            var rows = grid.getData().getItems();
        else
            var rows = grid.getData();

        if (
            get_columns !== undefined && Array.isArray(get_columns) && get_columns.length > 0 &&
            rows !== undefined && Array.isArray(rows) && rows.length > 0
        ) {
            get_columns.map(column => {
                rows.map(row => {
                    if (column.field !== undefined && Object.keys(row).includes(column.field)) {
                        if (!Object.keys(gridData).includes(column.field))
                            gridData[column.field] = [];

                        if (
                            row[column.field] == "NA" ||
                            row[column.field] == "N/A" ||
                            row[column.field] == undefined ||
                            row[column.field] == null ||
                            row[column.field] == '<span id="NoValue">N/A<span>'
                        ) {
                            gridData[column.field].push("0");
                        } else if (
                            column.cellsformat !== undefined && (
                                column.cellsformat.toLowerCase() == "yyyy-mm-dd" ||
                                column.cellsformat.toLowerCase() == "yyyy-mm-dd hh:mm" ||
                                column.cellsformat.toLowerCase() == "yyyy-mm-dd hh:mm:ss")
                        ) {
                            var date = new Date(row[column.field]),
                                dd = date.getDate(),
                                MM = date.getMonth() + 1,
                                yy = date.getFullYear(),
                                hh = date.getHours(),
                                mm = date.getMinutes(),
                                ss = date.getSeconds();

                            if (dd < 10) dd = '0' + dd;
                            if (mm < 10) mm = '0' + mm;

                            if (column.cellsformat.toLowerCase() == "yyyy-mm-dd hh:mm:ss")
                                gridData[column.field].push(yy + "-" + MM + "-" + dd + " " + hh + ":" + mm + ":" + ss);

                            else if (column.cellsformat.toLowerCase() == "yyyy-mm-dd hh:mm")
                                gridData[column.field].push(yy + "-" + MM + "-" + dd + " " + hh + ":" + mm);

                            else
                                gridData[column.field].push(yy + "-" + MM + "-" + dd);
                        } else
                            gridData[column.field].push(row[column.field])
                    }
                });
            });

            for (var k in gridData) {

                gridData[k] = gridData[k].reduce(function(a, b) {
                    return String(a).length > String(b).length ? a : b;
                });

                if (k.toLowerCase() !== "sel" && k.toLowerCase() !== "date" && k.toLowerCase() !== "volume" && isNumberFunc(gridData[k])) {
                    gridData[k] = parseFloat(gridData[k]).toFixed(real_decimal);
                }

                textLength.text(gridData[k]);
                let valueWidth = textLength.width();
                get_columns = get_columns.map(v => {
                    if (v !== undefined && v.field == k) {
                        textLength.text(v.text);
                        // v.width = textLength.width() > valueWidth ? textLength.width() : valueWidth;
                        // v.width += 20;
                    }

                    if (![" ", "Date", "corrected", "correction_count", "correction_bates"].includes(v.name)) {

                        // v.name = "<br>test";
                        v.formatter = function(row, field, value, html, columnproperties, record) {
                            let className = "";
                            if (Object.keys(data_corr).includes(columnproperties.Date)) {
                                let data = data_corr[columnproperties.Date];
                                if (data !== undefined) {
                                    if (columnproperties.Date == data.date)
                                        className = "corr_selected";
                                }
                            }
                            let date = new Date(columnproperties.Date);
                            if (columnproperties.Date !== undefined && (date.getDay() == 6 || date.getDay() == 0) && highlight_weekends)
                                className = "highlightBG";

                            if (parameters.ColumnDecimals != undefined && parameters.ColumnDecimals[v.id.split("-")[v.id.split("-").length - 1]] != undefined) {
                                value = !isNumberFunc(value) ? value : parseFloat(value).toFixed(html.name.toLowerCase() == "volume" ? 0 : parameters.ColumnDecimals[v.id.split("-")[v.id.split("-").length - 1]]);
                            } else {
                                value = !isNumberFunc(value) ? value : parseFloat(value).toFixed(html.name.toLowerCase() == "volume" ? 0 : 4);
                            }

                            value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : (value == null) ? "" : value;
                            return "<div class='" + className + " cell-title cell-right'>" + (value) + "</div>";
                        }
                        Object.keys(columnsWithHighlightingById).map(function(column) {
                            if (column == v.id) {
                                v.formatter = function(row, field, value, html, columnproperties, record) {
                                    let className = "";
                                    if (Object.keys(data_corr).includes(columnproperties.Date)) {
                                        let data = data_corr[columnproperties.Date];
                                        if (data !== undefined) {
                                            if (columnproperties.Date == data.date)
                                                className = "corr_selected";
                                        }
                                    }
                                    let date = new Date(columnproperties.Date);
                                    if (columnproperties.Date !== undefined && (date.getDay() == 6 || date.getDay() == 0) && highlight_weekends)
                                        className = "highlightBG";

                                    value = !isNumberFunc(value) ? value : parseFloat(value).toFixed(html.name.toLowerCase() == "volume" ? 0 : real_decimal);
                                    value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : (value == null) ? "" : value;
                                    return "<div class='" + className + " cell-title cell-right'>" + (value) + "</div>";
                                }
                            }
                        });
                    }
                    return v;
                });
            }

            setTimeout(() => {
                for (var i = 0; i < columns.length; i++) {
                    if (parseInt($('#slick-column-name-' + i).width()) > parseInt($('#slick-column-name-' + i).parent().width())) {
                        // get_columns[i].minWidth = parseInt($('#slick-column-name-' + i).width()) + 8;
                    }
                }

                grid.setColumns(get_columns);
                $(".icon-highlight-on").parent(".slick-header-column").css("background-color", "#94e9f7fa").css("color", "#0574b6");
                // $('#jqxgrid .extraInfo').parents('.slick-column-name').css('float', "unset");
                CreateAddPreHeaderRow();
            }, 10);

            setTimeout(() => {
                resizeElements();
            }, 50);
        }
    }

    $('#topPanel, #jqxTabs').show();
    $('#jqxTabs').jqxTabs({
        width: '100%',
        height: '100%',
        position: 'top',
        keyboardNavigation: false
    });

    $("#jqxTabsTab2").css("float", "right").css("margin-right", "20px").hide();
    $("#jqxTabsTab3").css("float", "right").hide();

    var navheight = parseInt($('#jqxTabs').height()) - 170;
    $("#jqxnavigationbar").jqxNavigationBar({ height: "auto", theme: 'summer' });

    $('#jqxExpander1').on('expanded', function() {
        $("#jqxExpander2").jqxExpander({ width: '100%', expanded: false });
        $("#jqxExpander3").jqxExpander({ width: '100%', expanded: false });

        $('#request-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 210);
        $('#notes-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 210);
        $('#user-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 210);
    });

    $('#jqxExpander2').on('expanded', function() {
        $("#jqxExpander1").jqxExpander({ width: '100%', expanded: false });
        $("#jqxExpander3").jqxExpander({ width: '100%', expanded: false });

        $('#request-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 210);
        $('#notes-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 210);
        $('#user-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 210);
    });

    $('#jqxExpander3').on('expanded', function() {
        $("#jqxExpander1").jqxExpander({ width: '100%', expanded: false });
        $("#jqxExpander2").jqxExpander({ width: '100%', expanded: false });

        $('#request-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 210);
        $('#notes-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 210);
        $('#user-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 210);
    });

    // Function to register the data
    function enterDate(data, freq = 'd') {
        if (data) {
            $('#water').remove();

            if (data.Metadata && data.Metadata[0].Simulated !== undefined)
                disabledGrid = data.Metadata[0].Simulated;

            corrections_array = data.Corrections[data.Parameters.Series[0].Datasource + '/' + data.Parameters.Series[0].Symbol];
            //            alert(JSON.stringify(data.BateStatus));

            bateStatus = data.Columns;

            let corrections_new_array = [];

            for (var i in corrections_array) {
                for (var x in corrections_array[i]) {
                    corrections_new_array.push({
                        PriceDay: i,
                        Type: corrections_array[i][x][0]['Operation'],
                        Bate: x,
                        OriginalPrice: (corrections_array[i][x][0]['From'] == undefined) ? "" : corrections_array[i][x][0]['From'],
                        IssuedDate: (corrections_array[i][x][0]['PublishedDateTime'] == undefined) ? "" : corrections_array[i][x][0]['PublishedDateTime'],
                        CorrectedPrice: (corrections_array[i][x][0]['To'] == undefined) ? "" : corrections_array[i][x][0]['To'],
                        AddedToDB: (corrections_array[i][x][0]['InsertDateTime'] == undefined) ? "" : corrections_array[i][x][0]['InsertDateTime']
                    });
                }
            }

            corrections_array = corrections_new_array;
            corrections_array.reverse();

            // gridMetadata = data.Metadata[0];
            startDate = Object.keys(data.Rows)[0];
            endDate = Object.keys(data.Rows)[Object.keys(data.Rows).length - 1];

            if (data.Columns.length > 0) {
                bates = bateStatus.map(function(v, n) {
                    var json = {
                        id: v.Bate + "-" + n,
                        name: v.Bate,
                        description: v.Name,
                        datasource: v.Datasource,
                        symbol: v.Symbol,
                        datasource: v.Datasource,
                        type: 'float'
                    };
                    if (v.Datacategory != undefined) {
                        json.category = v.Datacategory;
                    }

                    return json;
                });

                corrections_count = data.Corrections.length;
            }

            rowsOriginalData = [];
            rowsData = Object.keys(data.Rows).map(function(date) {
                let row = {
                    Date: date
                };
                for (var i in bates) {
                    let num = data.Rows[date][i],
                        value = !isNumberFunc(num) ? num : data.Rows[date][i];
                    value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : value;
                    row[bates[i].id] = value;
                }
                rowsOriginalData.push(row);
                return row;
            });

            if (rowsData.length > 0 && new Date(rowsData[0].Date) < new Date(rowsData[rowsData.length - 1].Date))
                rowsData.reverse();

            hide_data = rowsData.map(function(v) {
                let isEmpty = true;
                for (var i in v) {
                    if (i !== "Date" && v[i] !== null && v[i] !== undefined) {
                        isEmpty = false;
                        break;
                    }
                }
                if (isEmpty) return undefined;
                else return v;
            });

            hide_data = hide_data.filter(function(element) {
                return element !== undefined;
            });

            source.localdata = rowsData;

            if (hideEmptyRows == true) {
                if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
                    hide_data.reverse();
                source.localdata = hide_data;
            }

            for (var i = 0; i < source.localdata.length; i++) {
                source.localdata[i].id = "id1_" + i;
                source.localdata[i].num = (i + 1);

                if (source.localdata[i].Close == null) {
                    source.localdata[i].Close = "";
                }

                if (source.localdata[i].High == null) {
                    source.localdata[i].High = "";
                }

                if (source.localdata[i].Low == null) {
                    source.localdata[i].Low = "";
                }

                if (source.localdata[i]['Mean (c)'] == null) {
                    source.localdata[i]['Mean (c)'] = "";
                }

                if (source.localdata[i]['Hi-Lo (c)'] == null) {
                    source.localdata[i]['Hi-Lo (c)'] = "";
                }
            }

            if (grid != undefined) {
                grid.setData(source.localdata);
                dataView.beginUpdate();
                dataView.setItems(source.localdata, "id");
                dataView.endUpdate();
                dataView.reSort();
                grid.invalidate();
                grid.render();

                resizeColumns(grid);

                // setTimeout(() => {
                //     var iScrollHeight = $("#jqxgrid .slick-viewport").prop("scrollTop");
                //     alert(iScrollHeight);
                //     if (iScrollHeight > 0)
                //         $("#jqxgrid .slick-viewport").prop("scrollTop", 0);
                //     else
                //         $("#jqxgrid .slick-viewport").prop("scrollTop", iScrollHeight + 30);
                // }, 500);
            }
        }
    }

    var weeks = [];
    weeks[1] = "Monday";
    weeks[2] = "Tuesday";
    weeks[3] = "Wednesday";
    weeks[4] = "Thursday";
    weeks[5] = "Friday";
    weeks[6] = "Saterday";
    weeks[7] = "Sunday";

    function ShowJSReport(reportJson, updateJson = true) {

        if (reportJson.Series != undefined) {
            request_editor.load(reportJson);
        } else {
            $("#request-json-display").html(reportJson);
        }

        if (updateJson == true) {
            parameters = reportJson;
            parameters.SessionToken = getSession();

            if (parameters.Frequency == "chm") {
                $("#average").html("Custom Half Month - Days (" + parameters.FrequencyOptions.StartDay + "-" + parameters.FrequencyOptions.EndDay + "," + parameters.FrequencyOptions.StartDay2 + "-" + parameters.FrequencyOptions.EndDay2 + ").");
            } else if (parameters.Frequency == "hm") {
                $("#average").html("Half Month.");
            } else if (parameters.Frequency == "m" || parameters.Frequency == "q" || parameters.Frequency == "hy" || parameters.Frequency == "y") {
                $("#average").html("Month.");
            } else if (parameters.Frequency == "cm" || parameters.Frequency == "cq" || parameters.Frequency == "chy" || parameters.Frequency == "cy") {
                $("#average").html("Custom Month - Days " + parameters.FrequencyOptions.StartDay + " to " + parameters.FrequencyOptions.EndDay + ".");
            } else if (parameters.Frequency == "w") {
                $("#average").html("Week.");
            } else if (parameters.Frequency == "cw") {
                $("#average").html("Custom Week - begins " + weeks[parameters.FrequencyOptions.StartDay] + ".");
            } else {
                $("#average").html("Day.");
            }

            var reportFillType = "";

            if (parameters.FillOptions.Type != undefined) {
                reportFillType += capitalizeFirstLetter(parameters.FillOptions.Type);
            }

            if (parameters.FillOptions.Style != undefined) {
                if (reportFillType != "") {
                    reportFillType += "/";
                }
                reportFillType += capitalizeFirstLetter(parameters.FillOptions.Style);
            } else {
                if (reportFillType != "") {
                    reportFillType += "/";
                }
                reportFillType += "Null";
            }

            if (parameters.FillOptions.Leading != undefined && parameters.FillOptions.Leading == true) {
                var reportLeading = "On";
            } else {
                var reportLeading = "Off";
            }

            if (parameters.FillOptions.Trailing != undefined && parameters.FillOptions.Trailing == true) {
                var reportTrailing = "On";
            } else {
                var reportTrailing = "Off";
            }

            $('#reportFillType').html(reportFillType);
            $('#reportLeading').html(reportLeading);
            $('#reportTrailing').html(reportTrailing);
            $('#reportFrom').html(parameters.FirstDate);
            $('#reportTo').html(parameters.LastDate);
            $('#reportJSON').html(JSON.stringify(parameters));

            call_api_ajax('GetDatasetValuesRC', 'POST', JSON.stringify(parameters), false, (data, textStatus, XmlHttpRequest) => {

                if (data.Result.length == 0 || data.Result.Rows == undefined) {
                    let type = 'Metadata or BateStatus';
                    if (data.Result.Metadata == undefined) type = 'Metadata';
                    else if (data.Result.Columns == undefined) type = 'BateStatus';
                    else if (data.Result.Rows == undefined) type = 'Values';

                    dialogWindow('The server responded with "' + XmlHttpRequest.status + '" but cannot read the ' + type + ' field', 'error');
                    console.warn(data);
                    return;
                } else if (data.Result.Columns !== undefined && data.Result.Columns.Status > 299) {
                    dialogWindow('Server returned: ' + data.Result.Columns.Status + '. No access to the data series requested', 'error');
                    console.warn(data);
                    return;
                } else {
                    enterDate(data.Result, parameters.Frequency); // Register the data
                    delete parameters["SessionToken"];

                    response_json = data.Result;

                    response_viewer.showJSON(response_json, null, 1);

                    setTimeout(() => {
                        resizeElements();
                    }, 10);
                }
            }, (error) => {
                response_json = error.responseJSON;
                response_viewer.showJSON(response_json, null, 1);
            });
        } else {
            resizeElements();
        }
    }

    if (report_id == "new") {
        if (getCookie('reportJson') != undefined) {
            parameters = getJson(getCookie('reportJson'));

            if (parameters == undefined) {
                parameters = getCookie('reportJson');
            }
            report_locked = false;
            report_type = "RC";

            if (report_locked == true) {
                $('#reportID').html("<img src='resources/css/icons/padlock.png' style='margin-top:-5px'>");
            }

            // $('#saveReportID').html(report_id);
            // $('#reportName').html(report_name);
            var currentTime = new Date();
            $('#reportCreated').html(currentTime.getFullYear() + "-" + currentTime.getMonth() + "-" + currentTime.getDate() + " " + currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds());
            $('#reportUpdated').html(currentTime.getFullYear() + "-" + currentTime.getMonth() + "-" + currentTime.getDate() + " " + currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds());
            // $('#reportNotes').html(data.Result.Notes);
            $('#reportJSON').html(getCookie('reportJson'));
            $('#userJSON').html("{}");

            ShowJSReport(parameters);

            requestParameters = parameters;
        }
    } else {
        call_api_ajax1('ReadReport', 'get', {
            SessionToken: getSession(),
            ReportID: report_id
        }, false, (data) => {
            parameters = getJson(data.Result.ReportJSON);
            if (parameters == undefined) {
                parameters = data.Result.ReportJSON;
            }
            report_id = data.Result.ReportID;
            report_name = data.Result.Name;
            report_locked = data.Result.Locked;
            report_type = data.Result.Type;

            if (data.Result.Locked == true) {
                $('#reportID').html(data.Result.ReportID + "&nbsp;&nbsp;<img src='resources/css/icons/padlock.png' style='margin-top:-5px'>");
            } else {
                $('#reportID').html(data.Result.ReportID);
            }

            $('#saveReportID').html(data.Result.ReportID);
            $('#reportName').html(data.Result.Name);
            $('#reportCreated').html(data.Result.Created);
            $('#reportUpdated').html(data.Result.Updated);
            $('#reportNotes').html(data.Result.Notes);
            $('#reportJSON').html(data.Result.ReportJSON);
            $('#userJSON').html(data.Result.UserJSON);

            ShowJSReport(parameters);

            if (data.Result.Notes != null && data.Result.Notes != "") {
                $("#notes-json-display").val(data.Result.Notes);
            }

            if (data.Result.UserJSON != null && data.Result.UserJSON != "") {
                try {
                    user_editor.load(JSON.parse(data.Result.UserJSON));
                    userParameters = JSON.parse(data.Result.UserJSON);
                } catch (ex) {
                    $("#user-json-display").html(data.Result.UserJSON);
                    userParameters = data.Result.UserJSON;
                }
            }

            requestParameters = parameters;
            // requestParameters.FrequencyOptions = {
            //     AllowWeekends: 'off'
            // };
            notesParameters = data.Result.Notes;

        });
    }

    setTimeout(() => {
        CreateAddHeaderRow();
    }, 200);

    bates.push({
        name: 'Date',
        type: 'date'
    });
    bates.push({
        name: 'corrected',
        type: 'boolean'
    });
    bates.push({
        name: 'correction_count',
        type: 'float'
    });
    bates.push({
        name: 'correction_bates'
    });

    // Load the prices to show it in the table
    function loadPricesData(autoBind, async) {
        isPricesDataLoaded = true;
        source = {
            datatype: "json",
            localdata: rowsData
        };
        dataAdapter = new $.jqx.dataAdapter(source, {
            autoBind: autoBind,
            async: async,
            downloadComplete: function() {},
            loadComplete: function() {},
            loadError: function() {}
        });
    }

    // If the prices are not loaded, load it
    if (!isPricesDataLoaded) {
        loadPricesData(false, true);
    }

    $('#jqxTabs').on('selected', function(event) {
        var tab;
        switch (event.args.item) {
            case 0:
                tab = "prices";
                $(".slick-pane").css("position", "unset");
                $("#jqxTabs .jqx-tabs-content").css("background-color", "#fff");
                $("#fileDropdown1").jqxDropDownList('clearSelection');
                // resizeColumns(grid);
                break
            case 1:
                tab = "chart";
                if (!isChartLoaded) {
                    isChartLoaded = true;
                    createChart(rowsData, columns);
                }
                $("#jqxTabs .jqx-tabs-content").css("background-color", "#fff");
                break
            case 2:
                tab = "result";
                $("#jqxTabs .jqx-tabs-content").css("background-color", "#f2f2f2");
                $('.popup-win').hide();
                $("#fileDropdown1").jqxDropDownList('clearSelection');
                break
            case 3:
                tab = "request";
                $("#jqxTabs .jqx-tabs-content").css("background-color", "#1c2833");
                $('.popup-win').hide();

                var fileDropdownData = [{
                        name: 'New report',
                        value: 'new',
                    },
                    {
                        name: 'Edit report',
                        value: 'edit',
                    },
                    {
                        name: 'Open report',
                        value: 'load',
                    },
                    {
                        name: 'Save report',
                        value: 'save',
                    }
                ];

                $("#fileDropdown1").jqxDropDownList({
                    source: fileDropdownData,
                    displayMember: "name",
                    valueMember: "value",
                    height: 28,
                    width: 145,
                    itemHeight: 30,
                    dropDownHeight: 126,
                    placeHolder: '<img height="17" width="17" src="resources/css/icons/report16.png"> Report',
                    renderer: function(index, label, DatasourceInfo) {
                        if (index == 0) {
                            return '<img height="17" width="17" src="resources/css/icons/new-report16.png" style="margin-left:5px"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                        } else if (index == 1) {
                            return '<img height="17" width="17" src="resources/css/icons/edit-report16.png" style="margin-left:5px"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                        } else if (index == 2) {
                            return '<img height="17" width="17" src="resources/css/icons/fileopen.png" style="margin-left:5px"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                        } else {
                            return '<img height="17" width="17" src="resources/css/icons/filesave.png" style="margin-left:5px"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                        }
                    },
                    selectionRenderer: function(element, index, label, DatasourceInfo) {
                        imgurl = 'resources/css/icons/report16.png';
                        return '<img height="17" width="17" src="' + imgurl + '" id="selectedItemDropMenu" class="seletedItemStyle" valign="center">&nbsp;&nbsp;Report';
                    }
                });

                if (report_id == "new") {
                    $("#fileDropdown1").jqxDropDownList('disableAt', 1);
                }

                var icons = ['resources/css/icons/pencil_edit.png', 'resources/css/icons/weekend_16.png', 'resources/css/icons/report-dn.png', 'resources/css/icons/report-up.png'];
                $('#hideDropdown').jqxDropDownList('clear');
                // setTimeout(() => {
                $("#hideDropdown").jqxDropDownList({
                    source: hideDropdownData,
                    displayMember: "name",
                    valueMember: "value",
                    height: 28,
                    width: 160,
                    itemHeight: 30,
                    dropDownHeight: 130,
                    checkboxes: true,
                    placeHolder: '<img height="18" width="18" src="resources/css/icons/starDis_16.png">',
                    dropDownHorizontalAlignment: 'right',
                    renderer: function(index, label, DatasourceInfo) {
                        if (!DatasourceInfo)
                            return label;

                        $("#listitem2innerListBoxhideDropdown .chkbox .jqx-checkbox-default").remove();
                        $("#listitem3innerListBoxhideDropdown .chkbox .jqx-checkbox-default").remove();

                        imgurl = DatasourceInfo.icon;
                        return '<img height="17" width="17" src="' + icons[index] + '" style="margin-top:2px; margin-left:7px; float:left"> <span id="databaseDropdown-lable" style="float:left; margin-top:2px; margin-left:4px"> ' + label + '</span>';
                    },
                    selectionRenderer: function(element, index, label, DatasourceInfo) {
                        imgurl = 'resources/css/icons/setting_16.png';
                        return '<img height="18" width="18" src="' + imgurl + '" id="selectedItemDropMenu" class="seletedItemStyle" valign="center">';
                    }
                });
                // }, 200);


                if (simpleViewChecked == 1) {
                    $("#hideDropdown").jqxDropDownList("checkIndex", 1);
                } else {
                    $("#hideDropdown").jqxDropDownList("uncheckIndex", 1);
                }
                break;
        }
        window.history.pushState("datasetsPage", "report database", "/report_viewer?report_id=" + report_id + "&tab=" + tab + "&layout=" + layout);
    });

    $('#hideDropdown').on('select', function(event) {
        var args = event.args;
        if (args) {
            // index represents the item's index.                
            var index = args.index;
            var item = args.item;
            // if (index == 0 || index == 1) {
            //     if (rowsData == undefined || rowsData.length == 0) {
            //         dialogWindow("No Report data has been loaded.", "error");
            //         var editorContents = $("#request-json-display").text();
            //         request_editor = new JsonEditor('#request-json-display', editorContents, { editable: true });
            //     }
            //     else {
            if (index == 0) {
                var jsonObj = getJsonTree(request_editor);
                // var jsonObj1 = getJsonTree(notes_editor);
                var jsonObj2 = getJsonTree(user_editor);

                if (item.checked == true) {
                    if (jsonObj == "Json_error") {
                        jsonObj = $("#request-json-display").html();
                        request_editor = new JsonEditor('#request-json-display', "", { editable: true });
                        $("#request-json-display").html(jsonObj);
                    } else {
                        request_editor = new JsonEditor('#request-json-display', jsonObj, { editable: true });
                    }

                    document.getElementById("notes-json-display").readOnly = false;
                    // notes_editor = new JsonEditor('#notes-json-display', jsonObj1, { editable: true });
                    if (jsonObj2 == "Json_error") {
                        jsonObj2 = $("#user-json-display").html();
                        user_editor = new JsonEditor('#user-json-display', "", { editable: true });
                        $("#user-json-display").html(jsonObj2);
                    } else {
                        user_editor = new JsonEditor('#user-json-display', jsonObj2, { editable: true });
                    }
                } else {
                    if (jsonObj == "Json_error") {
                        jsonObj = $("#request-json-display").html();
                        request_editor = new JsonEditor('#request-json-display', "", { editable: false });
                        $("#request-json-display").html(jsonObj);
                    } else {
                        request_editor = new JsonEditor('#request-json-display', jsonObj, { editable: false });
                    }

                    document.getElementById("notes-json-display").readOnly = true;
                    // notes_editor = new JsonEditor('#notes-json-display', jsonObj1, { editable: true });
                    if (jsonObj2 == "Json_error") {
                        jsonObj2 = $("#user-json-display").html();
                        user_editor = new JsonEditor('#user-json-display', "", { editable: false });
                        $("#user-json-display").html(jsonObj2);
                    } else {
                        user_editor = new JsonEditor('#user-json-display', jsonObj2, { editable: false });
                    }
                }
                // }
                // else{
                //     if (item.checked == true) {
                //         $("#hideDropdown").jqxDropDownList('uncheckIndex', 0);
                //     }
                //     else{
                //         $("#hideDropdown").jqxDropDownList('checkIndex', 0);
                //     }
                // }
            } else if (index == 1) {
                if (simpleViewChecked == 1) {
                    simpleViewChecked = 0;
                    $('#tabName').css('opacity', '1');

                    $('#request-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 260).css('top', 0);
                    $('#notes-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 260);
                    $('#user-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 260);

                    $("#tabnote").css("display", 'block');
                    $("#tabuser").css("display", 'block');
                } else {
                    simpleViewChecked = 1;
                    $('#tabName').css('opacity', '0');

                    $('#request-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 176).css('top', -29);
                    $("#tabnote").css("display", 'none');
                    $("#tabuser").css("display", 'none');
                }
            }
            //     }
            // }
            else if (index == 2) {
                var jsonObj = getJsonTree(request_editor);
                // var notesObj = getJsonTree(notes_editor);
                var notesObj = $("#notes-json-display").val();

                var userObj = getJsonTree(user_editor);
                if (jsonObj == "Json_error" || Object.keys(jsonObj).length == 0) {
                    dialogWindow("There are JSON syntax errors so not all features cannot work.<br>Please check the 'JSON Request' tab code for errors.", "error");
                } else {
                    if (jsonObj != undefined && notesObj != undefined && userObj != undefined) {
                        if (jsonObj.Frequency != undefined && jsonObj.Series != undefined) {
                            var reportJSON = {
                                ReportJSON: jsonObj,
                                Notes: notesObj,
                                UserJSON: userObj,
                            };

                            var link = document.createElement('a');
                            link.href = 'data:text/plain;charset=UTF-8,' + escape(JSON.stringify(reportJSON));
                            link.download = 'request_' + report_name + '.SJR';
                            link.click();

                            requestParameters = jsonObj;
                            notesParameters = notesObj;
                            userParameters = userObj;
                            edit_flag = false;
                        } else {
                            dialogWindow("The selected file cannot be used.<br>It was not created with the 'Save JSON' function", "error");
                        }
                    }
                }
            } else if (index == 3) {
                if (getSession() == undefined || getSession() == "") {
                    openLoginPopup();
                } else {
                    $('#fileupload').trigger('click');
                }
            }

            $("#hideDropdown").jqxDropDownList('clearSelection');
            $("#hideDropdown").jqxDropDownList('close');
        }
    });

    $('#fileDropdown1').on('select', function(event) {
        var args = event.args;
        if (args) {
            // index represents the item's index.                
            var index = args.index;
            if (index == 0) {
                if (getSession() == undefined || getSession() == "") {
                    openLoginPopup();
                } else {
                    setCookie('editReport', '');
                    setCookie('reportJson', '');

                    $('body').addClass('overlay');
                    $('#reportCreator').jqxWindow('open');
                    $('#reportCreator').jqxWindow({ position: "center" });
                    // $("#reportCreator").css("min-width", 650).css("min-height", 500);
                    $('#reportCreator .jqx-window-header div').css("float", "none");
                    $('#reportCreator').jqxWindow('focus');

                    $('#reportCreator .jqx-window-header').css("height", "30px").css("background-color", "#3a79d7");
                    $('#reportCreator .jqx-window-content').css("width", "calc(100%)").css("overflow", "unset");

                    $('#reportCreatorSplitter').css("height", "calc(100% - 58px)");
                }
            } else if (index == 1) {
                if (getSession() == undefined || getSession() == "") {
                    openLoginPopup();
                } else {
                    setCookie('editReport', report_id);
                    setCookie('reportJson', JSON.stringify(parameters));

                    $('body').addClass('overlay');
                    $('#reportCreator').jqxWindow('open');
                    $('#reportCreator').jqxWindow({ position: "center" });
                    // $("#reportCreator").css("min-width", 650).css("min-height", 500);
                    $('#reportCreator .jqx-window-header div').css("float", "none");
                    $('#reportCreator').jqxWindow('focus');

                    $('#reportCreator .jqx-window-header').css("height", "30px").css("background-color", "#3a79d7");
                    $('#reportCreator .jqx-window-content').css("width", "calc(100%)").css("overflow", "unset");

                    $('#reportCreatorSplitter').css("height", "calc(100% - 58px)");
                }
            } else if (index == 2) {
                if (getSession() == undefined || getSession() == "") {
                    openLoginPopup();
                } else {
                    var jsonObj = getJsonTree(request_editor);
                    // var jsonObj1 = getJsonTree(notes_editor);
                    var jsonObj1 = $("#notes-json-display").val();
                    var jsonObj2 = getJsonTree(user_editor);
                    if (JSON.stringify(jsonObj) != JSON.stringify(requestParameters)) {
                        edit_flag = true;
                    }

                    if (edit_flag == true) {
                        dialogWindow("The report may have been changed.<br/>If you load a report without saving the current one, you will lose any changes.<br>Do you want continue?", "query", "confirm", "Monitor+", () => {
                            $('#report_list').trigger('click');
                        }, null, null, { Ok: "Yes", Cancel: "No" });
                    } else {
                        $('#report_list').trigger('click');
                    }
                }
            } else if (index == 3) {
                if (getSession() == undefined || getSession() == "") {
                    openLoginPopup();
                } else {
                    var jsonObj = getJsonTree(request_editor);
                    // var jsonObj1 = getJsonTree(user_editor);
                    if (jsonObj == "Json_error" || !(jsonObj.Frequency != undefined && jsonObj.Series != undefined)) {
                        dialogWindow("The Request tab must contain valid JSON code.", "error");
                    } else {
                        call_api_ajax1('ListReports', 'get', {
                            SessionToken: getSession()
                        }, false, (data) => {
                            reportsList = [];
                            for (var i = 0; i < data.Result.length; i++) {
                                reportsList.push({
                                    ReportID: data.Result[i].ReportID,
                                    Name: data.Result[i].Name,
                                    Type: data.Result[i].Type,
                                    Locked: data.Result[i].Locked
                                });
                                if (report_name == data.Result[i].Name)
                                    selectReportIndex = i;
                            }
                        });

                        $('#reportsList').jqxComboBox('clear');
                        $("#reportsList").jqxComboBox({ placeHolder: "Select Item", source: reportsList, displayMember: "Name", valueMember: "Name", width: 'calc( 100% - 45px )', height: 30, itemHeight: 30 });
                        $("#reportsList").jqxComboBox("selectedIndex", selectReportIndex);

                        $('body').addClass('overlay');
                        $('#saveReportWindow').jqxWindow('open');
                        $('#saveReportWindow').jqxWindow({ position: "center" });
                        $("#saveReportWindow").css("min-width", 510).css("min-height", 370);
                        $('#saveReportWindow .jqx-window-header div').css("float", "none");
                    }
                }
            }
        }
        $("#fileDropdown1").jqxDropDownList('clearSelection');
    });

    var getDate = function(date) {
        var today = new Date(date),
            dd = today.getDate(),
            mm = today.getMonth() + 1,
            yyyy = today.getFullYear();

        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        return yyyy + '-' + mm + '-' + dd;
    };

    var frequency = [{
            name: 'Day',
            value: 'Day'
        },
        {
            name: 'Week',
            value: 'Week'
        },
        {
            name: 'Half Month',
            value: 'HalfMonth'
        },
        {
            name: 'Month',
            value: 'Month'
        },
        {
            name: 'Quarter Year',
            value: 'Quarter'
        },
        {
            name: 'Half Year',
            value: 'HalfYear'
        },
        {
            name: 'Year',
            value: 'Year'
        }
    ];

    function isIEPreVer9() { var v = navigator.appVersion.match(/MSIE ([\d.]+)/i); return (v ? v[1] < 9 : false); }

    function CreateAddPreHeaderRow() {
        var $preHeaderPanel = $(grid.getPreHeaderPanel())
            .empty()
            .addClass("slick-header-columns")
            .css('left', '-1000px')
            .width(grid.getHeadersWidth());
        $preHeaderPanel.parent().addClass("slick-header");

        var headerColumnWidthDiff = grid.getHeaderColumnWidthDiff();
        var m, header, lastColumnGroup = '',
            widthTotal = 0;

        var get_columns = grid.getColumns();
        for (var i = 0; i < get_columns.length; i++) {
            m = get_columns[i];
            if (lastColumnGroup === m.columnGroup && i > 0) {
                widthTotal += m.width;
                header.width(widthTotal - headerColumnWidthDiff)
            } else {
                widthTotal = m.width;
                header = $("<div class='ui-state-default slick-header-column' style='white-space: normal; text-overflow:unset; user-select: text; cursor: text;'/>")
                    .html("<span class='slick-column-name' id='slick-column-name-" + i + "' style='white-space: normal'>" + (m.columnGroup || '') + "</span>")
                    .width(m.width - headerColumnWidthDiff)
                    .appendTo($preHeaderPanel);
            }
            lastColumnGroup = m.columnGroup;
        }

        // grid.setColumns(get_columns);

        setTimeout(() => {
            resizeElements();
        }, 200);
    }

    function CreateAddHeaderRow() {

        $("#decimal").jqxButton({
            imgPosition: "left",
            width: 40,
            height: 28,
            textPosition: "center",
        });

        var frame = $('<div class="popup-win" style="text-align:center; width:100%">');
        var msg = $('<div style="float: left;margin-left: 24px;padding: 5px 0;">Decimal Places </div><input id="decimal-input" class="deci2" type="text" readonly style="color:#ddd">');
        var btns = $("<div id='pop-btns' style='float:right;margin-top:0px;margin-right: 21px;border: 1px solid #ddd;border-top-right-radius:4px;border-bottom-right-radius:4px; opacity:0.55'>")
        var button1 = $('<div id="btnSpinnUp" title="" class="jqx-fill-state-normal jqx-fill-state-normal-light jqx-formatted-input-spin-button jqx-formatted-input-spin-button-light" role="button" aria-disabled="false" style="border-top-right-radius:4px"><div class="jqx-input-icon jqx-input-icon-light jqx-icon-arrow-up jqx-icon-arrow-up-light"></div></div>');
        var button2 = $('<div id="btnSpinnDown" title="" class="jqx-fill-state-normal jqx-fill-state-normal-light jqx-formatted-input-spin-button jqx-formatted-input-spin-button-light" role="button" aria-disabled="false" style="border-bottom-right-radius:4px"><div class="jqx-input-icon jqx-input-icon-light jqx-icon-arrow-down jqx-icon-arrow-down-light"></div></div>');
        var buttons = $('<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix"><div class="ui-dialog-buttonset"><button type="button" class="bb-ok ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" style="margin-right:10px;padding-top: 4px;padding-bottom: 4px;" role="button"><span class="ui-button-text">Ok</span></button><button type="button" style="padding-top: 4px;padding-bottom: 4px;" class="bb-cancel ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button"><span class="ui-button-text">Cancel</span></button></div></div>');
        btns.append(button1);
        btns.append(button2);
        frame.append(msg);
        frame.append(btns);
        frame.append(buttons);
        $("body").append(frame);

        var fileDropdownData = [{
                name: 'New report',
                value: 'new',
            },
            {
                name: 'Edit report',
                value: 'edit',
            },
            {
                name: 'Open report',
                value: 'load',
            },
            {
                name: 'Save report',
                value: 'save',
            }
        ];

        $("#fileDropdown").jqxDropDownList({
            source: fileDropdownData,
            displayMember: "name",
            valueMember: "value",
            height: 28,
            width: 145,
            itemHeight: 30,
            dropDownHeight: 126,
            placeHolder: '<img height="17" width="17" src="resources/css/icons/report16.png"> Report',
            renderer: function(index, label, DatasourceInfo) {
                if (index == 0) {
                    return '<img height="17" width="17" src="resources/css/icons/new-report16.png" style="margin-left:5px"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                } else if (index == 1) {
                    return '<img height="17" width="17" src="resources/css/icons/edit-report16.png" style="margin-left:5px"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                } else if (index == 2) {
                    return '<img height="17" width="17" src="resources/css/icons/fileopen.png" style="margin-left:5px"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                } else {
                    return '<img height="17" width="17" src="resources/css/icons/filesave.png" style="margin-left:5px"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                }
            },
            selectionRenderer: function(element, index, label, DatasourceInfo) {
                if (index == 0) {
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        setCookie('editReport', '');
                        setCookie('reportJson', '');

                        $('body').addClass('overlay');
                        $('#reportCreator').jqxWindow('open');
                        $('#reportCreator').jqxWindow({ position: "center" });
                        $('#reportCreator .jqx-window-header div').css("float", "none");
                        $('#reportCreator').jqxWindow('focus');

                        $('#reportCreator .jqx-window-header').css("height", "30px").css("background-color", "#3a79d7");
                        $('#reportCreator .jqx-window-content').css("width", "calc(100%)").css("overflow", "unset");

                        $('#reportCreatorSplitter').css("height", "calc(100% - 58px)");
                    }
                } else if (index == 1) {
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        setCookie('editReport', report_id);
                        setCookie('reportJson', JSON.stringify(parameters));

                        $('body').addClass('overlay');
                        $('#reportCreator').jqxWindow('open');
                        $('#reportCreator').jqxWindow({ position: "center" });
                        $('#reportCreator .jqx-window-header div').css("float", "none");
                        $('#reportCreator').jqxWindow('focus');

                        $('#reportCreator .jqx-window-header').css("height", "30px").css("background-color", "#3a79d7");
                        $('#reportCreator .jqx-window-content').css("width", "calc(100%)").css("overflow", "unset");

                        $('#reportCreatorSplitter').css("height", "calc(100% - 58px)");
                    }
                } else if (index == 2) {
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        var jsonObj = getJsonTree(request_editor);
                        // var jsonObj1 = getJsonTree(notes_editor);
                        var jsonObj1 = $("#notes-json-display").val();
                        var jsonObj2 = getJsonTree(user_editor);
                        if (JSON.stringify(jsonObj) != JSON.stringify(requestParameters)) {
                            edit_flag = true;
                        }

                        if (edit_flag == true) {
                            dialogWindow("The report may have been changed.<br/>If you load a report without saving the current one, you will lose any changes.<br>Do you want continue?", "query", "confirm", "Monitor+", () => {
                                // $('#fileupload').trigger('click');
                                $('#report_list').trigger('click');
                                // $('#report_list')
                            }, null, null, { Ok: "Yes", Cancel: "No" });
                        } else {
                            // $('#fileupload').trigger('click');
                            $('#report_list').trigger('click');
                        }
                    }
                } else if (index == 3) {
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        var jsonObj = getJsonTree(request_editor);
                        if (jsonObj == "Json_error" || !(jsonObj.Frequency != undefined && jsonObj.Series != undefined)) {
                            dialogWindow("The 'JSON Request' tab must contain valid JSON code.", "error");
                        } else {
                            call_api_ajax1('ListReports', 'get', {
                                SessionToken: getSession()
                            }, false, (data) => {
                                reportsList = [];
                                for (var i = 0; i < data.Result.length; i++) {
                                    reportsList.push({
                                        ReportID: data.Result[i].ReportID,
                                        Name: data.Result[i].Name,
                                        Type: data.Result[i].Type,
                                        Locked: data.Result[i].Locked
                                    });
                                    if (report_name == data.Result[i].Name)
                                        selectReportIndex = i;
                                }
                            });

                            $('#reportsList').jqxComboBox('clear');
                            $("#reportsList").jqxComboBox({ placeHolder: "Select Item", source: reportsList, displayMember: "Name", valueMember: "Name", width: 'calc( 100% - 45px )', height: 30, itemHeight: 30 });
                            $("#reportsList").jqxComboBox("selectedIndex", selectReportIndex);

                            $('body').addClass('overlay');
                            $('#saveReportWindow').jqxWindow('open');
                            $('#saveReportWindow').jqxWindow({ position: "center" });
                            $("#saveReportWindow").css("min-width", 510).css("min-height", 370);
                            $('#saveReportWindow .jqx-window-header div').css("float", "none");
                        }
                    }
                }

                imgurl = 'resources/css/icons/report16.png';
                return '<img height="17" width="17" src="' + imgurl + '" id="selectedItemDropMenu" class="seletedItemStyle" valign="center">&nbsp;&nbsp;Report';
            }
        });

        if (report_id == "new") {
            $("#fileDropdown").jqxDropDownList('disableAt', 1);
        }

        var icons1 = ['/resources/css/icons/hide-rows_16.png', /*'/resources/css/icons/allow-we.png',*/ '/resources/css/icons/weekend_16.png', '/resources/css/icons/download-18.png', '/resources/css/icons/json.png'];
        var hideDropdownData1 = [{
                name: 'Hide Empty Rows',
                value: 'hide',
            },
            /*{
                name: 'Allow Weekends',
                value: 'allow',
            },*/
            {
                name: 'Highlight W/E',
                value: 'highlight',
            },
            {
                name: 'Export Data',
                value: 'export',
            },
            {
                name: 'Show JSON tabs',
                value: 'json',
            }
        ];

        $("#hideDropdown1").jqxDropDownList({
            source: hideDropdownData1,
            displayMember: "name",
            valueMember: "value",
            height: 28,
            width: 165,
            itemHeight: 30,
            dropDownHeight: 130,
            checkboxes: true,
            placeHolder: '<img height="18" width="18" src="resources/css/icons/starDis_16.png">',
            dropDownHorizontalAlignment: 'right',
            renderer: function(index, label, DatasourceInfo) {
                $("#listitem2innerListBoxhideDropdown1 .chkbox .jqx-checkbox-default").remove();
                if (!DatasourceInfo)
                    return label;

                imgurl = DatasourceInfo.icon;
                return '<img height="17" width="17" src="' + icons1[index] + '" style="margin-top:2px; margin-left:7px; float:left"> <span id="databaseDropdown-lable" style="float:left; margin-top:2px; margin-left:4px"> ' + label + '</span>';
            },
            selectionRenderer: function(element, index, label, DatasourceInfo) {
                imgurl = 'resources/css/icons/setting_16.png';
                return '<img height="18" width="18" src="' + imgurl + '" id="selectedItemDropMenu" class="seletedItemStyle" valign="center">';
            }
        });

        $('#hideDropdown1').on('select', function(event) {
            var args = event.args;
            if (args) {
                // index represents the item's index.                
                var index = args.index;
                var item = args.item;
                if (index == 0 || index == 1 || index == 3) {
                    if (rowsData == undefined || rowsData.length == 0) {
                        dialogWindow("No Report data has been loaded.", "error");
                    } else {
                        if (index == 0) {
                            if (item.checked == true) {
                                hideEmptyRows = true;
                                if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
                                    hide_data.reverse();
                                source.localdata = hide_data;
                            } else {
                                hideEmptyRows = false;
                                if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
                                    rowsData.reverse();
                                source.localdata = rowsData;
                            }

                            setTimeout(() => {
                                grid.setData(source.localdata);
                                dataView.beginUpdate();
                                dataView.setItems(source.localdata, "id");
                                dataView.endUpdate();
                                dataView.reSort();

                                grid.invalidate();
                                grid.render();
                            }, 60);
                        } else if (index == 1) {
                            /*if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            }
                            else {
                                if(parameters.Frequency == "d" || parameters.Frequency == "cd"){
                                    dialogWindow("Hiding weekends does not affect daily values.<br>You can use the Averages 'Handle weekends' option to do this.", "error", "alert", "Monitor+");
                                    if (item.checked == true) {
                                        item.checked = false;
                                    }
                                    else{
                                        item.checked = true;
                                    }
                                }
                                else{
                                    dialogWindow("Changing this setting to " + ((allow_weekend == true) ? "off" : "on") + " requires a server data refresh. <br/>Do you want to continue?", "query", "confirm", "Monitor+", () => {
                                        $("#jqxLoader").jqxLoader('open');
                                        if (item.checked == true) {
                                            setTimeout(() => {
                                                allow_weekend = true;
                                                parameters.FrequencyOptions.ReturnWeekends = "on";
                                                ShowJSReport(parameters);
                                                // updateChart(rowsData, isChartLoaded, isSubChartLoaded, columns);
                                                $("#jqxLoader").jqxLoader('close');
                                            }, 200);
                                        }
                                        else {
                                            setTimeout(() => {
                                                allow_weekend = false;
                                                parameters.FrequencyOptions.ReturnWeekends = "off";
                                                ShowJSReport(parameters);
                                                // updateChart(rowsData, isChartLoaded, isSubChartLoaded, columns);
                                                $("#jqxLoader").jqxLoader('close');
                                            }, 200);
                                        }
                                    }, () => {
                                        if (item.checked == true) {
                                            item.checked = false;
                                        }
                                        else{
                                            item.checked = true;
                                        }
                                    }, null, { Ok: "Yes", Cancel: "No" });
                                }
                            }*/

                            highlight_weekends = !highlight_weekends;
                            $(".highlight-weekends").toggle(highlight_weekends);
                            gridColumndraw();
                            // grid.setColumns(columns);
                            CreateAddPreHeaderRow();
                            resizeColumns(grid);
                        } else {
                            if (item.checked == true) {
                                $("#jqxTabsTab2").show();
                                $("#jqxTabsTab3").show();
                                $("#jqxTabsTab2 .jqx-tabs-titleWrapper, #jqxTabsTab3 .jqx-tabs-titleWrapper").css("margin-top", 0);
                            } else {
                                $("#jqxTabsTab2").hide();
                                $("#jqxTabsTab3").hide();
                            }
                        }
                    }
                } else if (index == 2) {
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        if (!hasUserAccessToCategory)
                            return;

                        if (rowsData == undefined || rowsData.length == 0) {
                            dialogWindow("No Report data has been loaded.", "error");
                        } else {
                            makeExportSeriesDialog();
                        }
                    }
                }

                $("#hideDropdown1").jqxDropDownList('clearSelection');
                $("#hideDropdown1").jqxDropDownList('close');
            }
        });

        $("#hideDropdown1").jqxDropDownList('checkIndex', 1);
        // $("#hideDropdown1").jqxDropDownList('checkIndex', 2);

        var jqxExpander1Height = $('#jqxExpander1').height();
        var jqxExpander2Height = $('#jqxExpander2').height();
        var jqxExpander3Height = $('#jqxExpander3').height();

        $('#jqxExpander2').css('display', 'none');
        $('#jqxExpander3').css('display', 'none');

        $('#jqxExpander1').height(jqxExpander1Height + jqxExpander2Height + jqxExpander3Height);

        $("#btnRefreshData").on('click', function() {
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                var jsonObj = getJsonTree(request_editor);

                if (jsonObj == "Json_error" || Object.keys(jsonObj).length == 0) {
                    dialogWindow("No Report data has been loaded.", "error");
                } else {
                    dialogWindow("Refresh the market data (using the current 'JSON Request' tab code)?", "query", "confirm", "Monitor+", () => {
                        $("#jqxLoader").jqxLoader('open');
                        setTimeout(() => {
                            if (jsonObj != undefined) {
                                if (jsonObj.Frequency != undefined && jsonObj.Series != undefined) {
                                    ShowJSReport(jsonObj);
                                    gridColumndraw();
                                    grid.setColumns(columns);
                                    CreateAddPreHeaderRow();
                                    // resizeColumns(grid);
                                    $("#jqxLoader").jqxLoader('close');
                                } else {
                                    $("#jqxLoader").jqxLoader('close');
                                    dialogWindow("The 'JSON Request' tab must contain valid JSON code.", "error");
                                }
                            }
                        }, 20);
                    }, () => {}, null, { Ok: "Yes", Cancel: "No" });
                }
            }
        });

        $("#btnAutosizeSeries").jqxButton({
            imgSrc: "resources/css/icons/autosize.png",
            imgPosition: "center",
            width: 28,
            height: 28,
            imgWidth: 20,
            imgHeight: 20
        });
        $("#btnAutosizeSeries img").css("top", 5);
        

        // 2022 5 23 3:09
        function refreshFullWidth1() {
            let img1 = (fullWidthFlag) ? 'fullscreen' : 'fullscreen1';
            $("#fullWidth1").jqxButton({
                imgSrc: "resources/css/icons/" + img1 + ".png",
                imgPosition: "left",
                width: 28,
                height: 28,
                imgWidth: 18,
                imgHeight: 18,
                textPosition: "right"
            });
            $("#fullWidth1 img").css("left", 5).css("top", 5);
        }

        refreshFullWidth1();


        $("#decimal").on("click", function() {
            if (parameters.ColumnDecimals != undefined && Object.keys(columnsWithHighlightingById)[0] != undefined) {
                var sel_num = 999;
                Object.keys(columnsWithHighlightingById).map(function(column) {
                    const getStr = column.split("-");
                    if (sel_num > parseInt(getStr[getStr.length - 1])) {
                        sel_num = parseInt(getStr[getStr.length - 1]);
                    }
                });
                if (parameters.ColumnDecimals[sel_num] != undefined) {
                    decimalText = '';
                    for (var i = 0; i < parseInt(parameters.ColumnDecimals[sel_num]) - 1; i++)
                        decimalText += '0';

                    decimalText += parameters.ColumnDecimals[sel_num];
                    real_decimal = parameters.ColumnDecimals[sel_num];
                } else {
                    decimalText = "0004";
                    real_decimal = 4;
                }
            }
            frame.css({
                left: ($("#decimal").offset().left - frame.width() + $("#decimal").width() + 5),
                top: $("#decimal").offset().top + 24
            }).toggle(frame.css('display') == 'none').find('.deci2').val('0.' + decimalText);
            decimalNumber = real_decimal;
        });

        $("#btnAutosizeSeries").on("click", function() {
            resizeColumns(grid);
        });

        $("#fullWidth1").on('click', function() {
            let img = (fullWidthFlag) ? 'fullscreen' : 'fullscreen1';

            $("#fullWidth1").jqxButton({
                imgSrc: "resources/css/icons/" + img + ".png",
                imgPosition: "left",
                width: 28,
                width: 28,
                imgWidth: 18,
                imgHeight: 18,
                textPosition: "right"
            });
            $("#fullWidth1 img").css("left", 5).css("top", 5);
            $(".fixpage").toggleClass('fullscreen', fullWidthFlag);
            $(".footerbar").toggleClass('full-footer');
            $("section .wrap").toggleClass('fullscreen', fullWidthFlag);

            fullWidthFlag = !fullWidthFlag;
            window.dispatchEvent(new Event('resize'));
        });

        $(document).on('click', '.bb-ok', function() {
            real_decimal = decimalNumber;
            Object.keys(columnsWithHighlightingById).map(function(column) {
                if (parameters.ColumnDecimals != undefined) {
                    parameters.ColumnDecimals[column.split("-")[column.split("-").length - 1]] = decimalNumber;
                } else {
                    parameters.ColumnDecimals = [];
                    for (var i = 0; i < Object.keys(parameters.Series).length; i++) {
                        if (column.split("-")[column.split("-").length - 1] == i) {
                            parameters.ColumnDecimals[i] = decimalNumber;
                        } else {
                            parameters.ColumnDecimals[i] = 4;
                        }
                    }
                    parameters.ColumnDecimals[column.split("-")[column.split("-").length - 1]] = decimalNumber;
                }

                ShowJSReport(parameters, false);
            });

            $('.popup-win').hide();
            resizeColumns(grid);
        });

        $(document).on('click', '.bb-cancel', function() {
            $('.popup-win').hide();
            decimalNumber = real_decimal;
        });

        $(document).on('click', '#btnSpinnUp', function() {
            if (Object.keys(columnsWithHighlightingById).length > 0) {
                if (decimalNumber == 9)
                    return;

                decimalNumber++;
                decimalText = '';
                for (var i = 0; i < decimalNumber - 1; i++)
                    decimalText += '0';

                decimalText += decimalNumber;
                $(".deci2").val('0.' + decimalText);
            }
        });

        // Decrease the decimal number
        $(document).on('click', '#btnSpinnDown', function() {
            if (Object.keys(columnsWithHighlightingById).length > 0) {
                if (decimalNumber == 0)
                    return;

                decimalNumber--;

                decimalText = '';
                for (var i = 0; i < decimalNumber - 1; i++)
                    decimalText += '0';

                decimalText += decimalNumber;
                $(".deci2").val('0.' + decimalText);
            }
        });
    }

    function gridColumndraw() {
        batesArray = [];
        var num = 1;
        var beforeSymbol = "";
        var gID = -1;
        for (var i in bates) {
            let name = bates[i].name;
            name = name.split("(calculated)").join("(c)");

            if (name == "Adjusted_Close")
                name = "Adj. Close";

            if (!["Date", "corrected", "correction_count", "correction_bates"].includes(bates[i].name)) {

            }
        }
        columns = [{
                id: "sel",
                name: ' ',
                label: ' ',
                columnGroup: '',
                sortable: true,
                filterable: false,
                field: 'num',
                columntype: 'number',
                width: 50,
                cellsformat: '',
                formatter: function(row, field, value, html, columnproperties, record) {
                    let className = "";
                    if (Object.keys(data_corr).includes(columnproperties.Date)) {
                        let data = data_corr[columnproperties.Date];
                        if (data !== undefined) {
                            // if (data.date !== undefined && (data.column.includes(field) || field == ''))
                            if (columnproperties.Date == data.date)
                                className = "corr_selected";
                        }
                    }
                    let date = new Date(columnproperties.Date);
                    if (columnproperties.Date !== undefined && (date.getDay() == 6 || date.getDay() == 0) && highlight_weekends)
                        className = "highlightBG";
                    return "<div class='" + className + " cell-title cell-right'>" + (value) + "</div>";
                },
                header: {
                    menu: {
                        items: [{
                                iconImage: "resources/css/icons/sort-asc.gif",
                                title: "Sort Ascending",
                                disabled: false,
                                // hidden: !columns[i].sortable, // you could disable or hide the command completely
                                command: "sort-asc"
                            },
                            {
                                iconImage: "resources/css/icons/sort-desc.gif",
                                title: "Sort Descending",
                                disabled: false,
                                // hidden: !columns[i].sortable, // you could disable or hide the command completely
                                cssClass: '',
                                command: "sort-desc"
                            },
                            // { divider: true }
                        ]
                    }
                }
            },
            {
                id: "Date",
                name: "Date",
                label: 'Date',
                field: "Date",
                columnGroup: '',
                sortable: true,
                width: 100,
                formatter: function(row, field, value, html, columnproperties, record) {
                    let className = "";
                    if (Object.keys(data_corr).includes(columnproperties.Date)) {
                        let data = data_corr[columnproperties.Date];
                        if (data !== undefined) {
                            // if (data.date !== undefined && (data.column.includes(field) || field == ''))
                            if (columnproperties.Date == data.date)
                                className = "corr_selected";
                        }
                    }
                    if (highlight_weekends) {
                        let date = new Date(value);
                        if (date.getDay() == 6 || date.getDay() == 0)
                            className = className !== "" ? className + " highlightWeekends" : "highlightWeekends";
                    }
                    return "<div class='" + className + " cell-title cell-right'>" + value + "</div>";
                },
                header: {
                    menu: {
                        items: [{
                                iconImage: "resources/css/icons/sort-asc.gif",
                                title: "Sort Ascending",
                                disabled: false,
                                // hidden: !columns[i].sortable, // you could disable or hide the command completely
                                command: "sort-asc"
                            },
                            {
                                iconImage: "resources/css/icons/sort-desc.gif",
                                title: "Sort Descending",
                                disabled: false,
                                // hidden: !columns[i].sortable, // you could disable or hide the command completely
                                cssClass: '',
                                command: "sort-desc"
                            },
                            // { divider: true }
                        ]
                    }
                }
            },
        ];

        for (var i in bates) {
            let name = bates[i].name;
            name = name.split("(calculated)").join("(c)");

            if (name == "Adjusted_Close")
                name = "Adj. Close";

            if (!["Date", "corrected", "correction_count", "correction_bates"].includes(bates[i].name)) {

                if (bates[i].category == undefined)
                    var columnGroup = bates[i].description + " [" + bates[i].datasource + "/" + bates[i].symbol + "]";
                else
                    var columnGroup = bates[i].description + " [" + bates[i].datasource + "/" + bates[i].category + "/" + bates[i].symbol + "]";

                if (parameters.ColumnDecimals != undefined && parameters.ColumnDecimals[i] != undefined) {
                    digits = parameters.ColumnDecimals[i];
                } else {
                    digits = 4;
                }

                Object.keys(columnsWithHighlightingById).map(function(column) {
                    if (column == bates[i].id) {
                        digits = real_decimal;
                    }
                });

                var handleWeekends = [{
                        name: 'As reported',
                        value: 'A',
                        hint: 'Use weekends if in the source dataset. Nomally all result datasets are adjusted if weekends are found in any dataset.'
                    },
                    {
                        name: '5 Day (No W/E)',
                        value: '5',
                        hint: 'All weekend values are removed from the source dataset.'
                    },
                    {
                        name: '5 Day (W/E+ to Monday)',
                        value: '5+',
                        hint: 'Force the Monday value to be overwritten by a valid weekend value.'
                    },
                    {
                        name: '5 Day (W/E- to Friday)',
                        value: '5-',
                        hint: 'Move weekend values to the previous Friday (if empty). The Saturday value is used only if the Sunday has no value.'
                    },
                    {
                        name: '7 Day (Added empty W/E)',
                        value: '7',
                        hint: 'Add weekend dates containing no (null) values.'
                    },
                    {
                        name: '7 day (Added filled W/E)',
                        value: '7f',
                        hint: 'Add weekend dates filled using the selected fill type.'
                    }
                ];

                for (var j = 0; j < Object.keys(parameters.Series).length; j++) {
                    if (bates[i].symbol == parameters.Series[j].Symbol) {
                        // var getID = bates[i].id.split("-")[bates[i].id.split("-").length-1];
                        var getID = j;
                        var handleWeekend = "";
                        var simulated = "";
                        if (parameters.Series[getID]["HandleWeekends"] != undefined && parameters.Series[getID]["HandleWeekends"] == "5") {
                            handleWeekend = "(W/E: 5) ";
                        } else if (parameters.Series[getID]["HandleWeekends"] != undefined && parameters.Series[getID]["HandleWeekends"] == "5+") {
                            handleWeekend = "(W/E: 5+) ";
                        } else if (parameters.Series[getID]["HandleWeekends"] != undefined && parameters.Series[getID]["HandleWeekends"] == "5-") {
                            handleWeekend = "(W/E: 5-) ";
                        } else if (parameters.Series[getID]["HandleWeekends"] != undefined && parameters.Series[getID]["HandleWeekends"] == "7") {
                            handleWeekend = "(W/E: 7) ";
                        } else if (parameters.Series[getID]["HandleWeekends"] != undefined && parameters.Series[getID]["HandleWeekends"] == "7f") {
                            handleWeekend = "(W/E: 7f) ";
                        } else {
                            handleWeekend = "";
                        }

                        if (parameters.Series[getID].LeadLag != undefined && parameters.Series[getID].LeadLag > 0) {
                            handleWeekend += "(Lead: " + parameters.Series[getID].LeadLag + ")<br>";
                        } else if (parameters.Series[getID].LeadLag != undefined && parameters.Series[getID].LeadLag < 0) {
                            handleWeekend += "(Lag: " + parameters.Series[getID].LeadLag + ")<br>";
                        } else {
                            if (handleWeekend != "") {
                                handleWeekend += "<br>";
                            }
                        }

                        if (parameters.Series[getID].Prefill != undefined && parameters.Series[getID].Fill != undefined && parameters.Series[getID].PostFill != undefined) {
                            if (parameters.Series[getID].Prefill == true || parameters.Series[getID].Fill == true || parameters.Series[getID].PostFill == true) {
                                handleWeekend += "Fill: ";

                                if (parameters.Series[getID].Prefill == true) {
                                    handleWeekend += "Pre";
                                }

                                if (parameters.Series[getID].Fill == true) {
                                    if (parameters.Series[getID].Prefill == true) {
                                        handleWeekend += "/";
                                    }
                                    handleWeekend += "Fill";
                                }

                                if (parameters.Series[getID].PostFill == true) {
                                    if (parameters.Series[getID].Prefill == true || parameters.Series[getID].Fill == true) {
                                        handleWeekend += "/";
                                    }
                                    handleWeekend += "Post";
                                }
                            }
                        }

                        // if(response_json.Columns[getID].Simulated != undefined){
                        if (response_json.Columns[getID].Simulated != undefined && response_json.Columns[getID].Simulated == true) {
                            simulated += "(SIMULATED)";
                        }

                        if (response_json.Columns[getID].Status == 204) {
                            if (simulated != "") {
                                simulated += "<br>";
                            }
                            simulated += "(No Access)";
                        } else if (response_json.Columns[getID].Status == 206) {
                            if (simulated != "") {
                                simulated += "<br>";
                            }
                            simulated += "(Partial Access)";
                        } else if (response_json.Columns[getID].Status == 200) {
                            simulated += "";
                        } else {
                            if (simulated != "") {
                                simulated += "<br>";
                            }
                            simulated += "(Status Error: " + response_json.Columns[getID].Status + "</p>";
                        }
                        // }

                        var jsonColumn = {
                            id: bates[i].id,
                            name: name + "<br><span class='extraInfo'>" + handleWeekend + "<p style='color:red'>" + simulated + "</p></span>",
                            label: name + "\013\012" + simulated,
                            field: bates[i].id,
                            filtertype: "float",
                            sortable: true,
                            cellsformat: "",
                            columnGroup: columnGroup,
                            formatter: function(row, field, value, html, columnproperties, record) {
                                let className = "";
                                if (Object.keys(data_corr).includes(columnproperties.Date)) {
                                    let data = data_corr[columnproperties.Date];
                                    if (data !== undefined) {
                                        if (columnproperties.Date == data.date)
                                            className = "corr_selected";
                                    }
                                }
                                let date = new Date(columnproperties.Date);
                                if (columnproperties.Date !== undefined && (date.getDay() == 6 || date.getDay() == 0) && highlight_weekends)
                                    className = "highlightBG";

                                value = !isNumberFunc(value) ? value : parseFloat(value).toFixed(html.name.toLowerCase() == "volume" ? 0 : digits);
                                value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : (value == null) ? "" : value;
                                return "<div class='" + className + " cell-title cell-right'>" + (value) + "</div>";
                            },
                            header: {
                                menu: {
                                    items: [{
                                            iconImage: "resources/css/icons/sort-asc.gif",
                                            title: "Sort Ascending",
                                            disabled: false,
                                            // hidden: !columns[i].sortable, // you could disable or hide the command completely
                                            command: "sort-asc"
                                        },
                                        {
                                            iconImage: "resources/css/icons/sort-desc.gif",
                                            title: "Sort Descending",
                                            disabled: false,
                                            // hidden: !columns[i].sortable, // you could disable or hide the command completely
                                            cssClass: '',
                                            command: "sort-desc"
                                        },
                                        // { divider: true }
                                    ]
                                },
                                buttons: [{
                                    cssClass: "icon-highlight-off",
                                    command: "toggle-highlight",
                                    tooltip: "Toggle column selection."
                                }]
                            }
                        }

                        // if (bates[i].datasource == "ECBFX") {
                        jsonColumn.minWidth = 140;
                        // }

                        columns.push(jsonColumn);

                        var item = bates[i];

                        if (beforeSymbol != item.symbol) {
                            beforeSymbol = item.symbol;
                            gID++;
                        }

                        item.check = false;
                        item.num = num;
                        item.title = gID + item.description + " (" + item.symbol + ")";
                        batesArray.push(item);

                        num++;
                        break;
                    }
                }
            }
        }
    }

    gridColumndraw();

    var visibleColumns = columns;

    var options = {
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
        autosizeColsMode: Slick.GridAutosizeColsMode.FitColsToViewport,
        enableColumnReorder: false,
        createPreHeaderPanel: true,
        showPreHeaderPanel: true,
        preHeaderPanelHeight: 50,
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
            return { valid: false, msg: "This is a required field" };
        } else {
            return { valid: true, msg: null };
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

    function convert_to_float(x) {
        var converted = parseFloat(x);
        return isNaN(converted) ? x : converted
    }

    function comparer1(a, b) {
        var x = convert_to_float(a[sortcol]),
            y = convert_to_float(b[sortcol]);
        return (x == y ? 0 : (x > y ? 1 : -1));
    }

    function comparer(a, b) {
        var x = a[sortcol],
            y = b[sortcol];
        return (x == y ? 0 : (x > y ? 1 : -1));
    }

    function toggleFilterRow() {
        grid.setTopPanelVisibility(!grid.getOptions().showTopPanel);
    }

    if (source.localdata == undefined)
        source.localdata = [];


    var executeSort = function(sortCols) {
        // firstly add column reference and remove any sort columns that are no longer visible
        sortCols = sortCols.filter(function(el, i) {
            for (var i = 0; i < visibleColumns.length; i++) {
                if (visibleColumns[i].id === el.columnId) {
                    el.sortCol = visibleColumns[i];
                    return true;
                }
            }
            return false;
        });

        grid.setSortColumns(sortCols);

        dataView.sort(function(dataRow1, dataRow2) {
            for (var i = 0, l = sortCols.length; i < l; i++) {
                var field = sortCols[i].sortCol.field;
                var sign = sortCols[i].sortAsc ? 1 : -1;
                var value1 = dataRow1[field],
                    value2 = dataRow2[field];
                var result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
                if (result != 0) {
                    return result;
                }
            }
            return 0;
        });

        grid.invalidate();

        grid.render();
    };

    var removeColumnById = function(array, idVal) {
        return array.filter(function(el, i) {
            return el.id !== idVal;
        });
    };

    var removeSortColumnById = function(array, idVal) {
        return array.filter(function(el, i) {
            return el.columnId !== idVal;
        });
    };

    function autoAlignMenu(isEnabled) {
        headerMenuPlugin.setOptions({ autoAlign: isEnabled });
    }

    function formattedRandomNum(maxVal) {
        var numDigits = ('' + maxVal).length;
        return ('0000' + (Math.floor(Math.random() * maxVal) + 1)).slice(-numDigits)
    }

    $(function() {
        // prepare the data
        for (var i = 0; i < source.localdata.length; i++) {
            source.localdata[i].id = "id_" + i;
            source.localdata[i].num = (i + 1);

            if (source.localdata[i].Close == null) {
                source.localdata[i].Close = "";
            }

            if (source.localdata[i].High == null) {
                source.localdata[i].High = "";
            }

            if (source.localdata[i].Low == null) {
                source.localdata[i].Low = "";
            }

            if (source.localdata[i]['Mean (c)'] == null) {
                source.localdata[i]['Mean (c)'] = "";
            }

            if (source.localdata[i]['Hi-Lo (c)'] == null) {
                source.localdata[i]['Hi-Lo (c)'] = "";
            }
        }

        dataView = new Slick.Data.DataView({ inlineFilters: true });
        grid = new Slick.Grid("#jqxgrid", dataView, columns, options);
        // var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);
        headerMenuPlugin = new Slick.Plugins.HeaderMenu({});
        grid.setSelectionModel(new Slick.RowSelectionModel());

        var headerButtonsPlugin = new Slick.Plugins.HeaderButtons();

        headerButtonsPlugin.onCommand.subscribe(function(e, args) {
            var column = args.column;
            var button = args.button;
            var command = args.command;

            if (command == "toggle-highlight") {
                if (button.cssClass == "icon-highlight-on") {
                    delete columnsWithHighlightingById[column.id];
                    button.cssClass = "icon-highlight-off";
                    button.tooltip = "Toggle column selection.";

                    if (Object.keys(columnsWithHighlightingById).length == 0) {
                        $("#pop-btns").css("opacity", 0.55);
                        $("#decimal-input").css("color", "#ddd");
                    }
                } else {
                    columnsWithHighlightingById[column.id] = true;
                    button.cssClass = "icon-highlight-on";
                    button.tooltip = "Click to deselect the cell"
                    $("#pop-btns").css("opacity", 1);
                    $("#decimal-input").css("color", "#000");
                }

                grid.invalidate();
                setTimeout(() => {
                    $(".icon-highlight-on").css("width", "100%").css("cursor", "point");
                    $(".icon-highlight-off").css("width", "100%").css("cursor", "point");
                    $(".icon-highlight-on").parent(".slick-header-column").css("background-color", "#94e9f7fa").css("color", "#0574b6");
                    $(".icon-highlight-off").parent(".slick-header-column").css("background-color", "#f6f6f6").css("color", "#454545");
                }, 10);

                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightBG");
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightWeekends");
            }
        });

        grid.registerPlugin(headerButtonsPlugin);

        // move the filter panel defined in a hidden div into grid top panel
        $("#inlineFilterPanel")
            .appendTo(grid.getTopPanel())
            .show();

        grid.onCellChange.subscribe(function(e, args) {
            dataView.updateItem(args.item.id, args.item);
        });

        grid.onClick.subscribe(function(e, args) {});

        grid.onScroll.subscribe(function(e, args) {
            $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightBG");
            $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightWeekends");
        });

        grid.onSelectedRowsChanged.subscribe(function() {
            var rowsObj = $("#jqxgrid div.grid-canvas").find("div.slick-row");
            for (var i = 0; i < rowsObj.length; i++) {
                let date = new Date($("#jqxgrid div.grid-canvas").children().eq(i).children('.r1').children().text());
                if (date !== undefined && (date.getDay() == 6 || date.getDay() == 0) && highlight_weekends) {
                    for (var j = 0; j < columns.length; j++) {
                        $("#jqxgrid div.grid-canvas").children().eq(i).children('.r' + j).children().addClass("highlightBG");
                    }
                }
            }

            setTimeout(() => {
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightBG");
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightWeekends");
            }, 10);
        });

        grid.onContextMenu.subscribe(function(e) {
            e.preventDefault();
            var cell = grid.getCellFromEvent(e);
            var indexes = grid.getSelectedRows()
            indexes.push(cell.row);
            grid.setSelectedRows(indexes)

            $("#jqxgridMenu")
                .data("row", cell.row)
                .css("top", e.pageY)
                .css("left", e.pageX)
                .show();

            $("body").one("click", function() {
                $("#jqxgridMenu").hide();
            });

            setTimeout(() => {
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightBG");
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightWeekends");
            }, 10);
        });

        grid.onAddNewRow.subscribe(function(e, args) {});

        grid.onKeyDown.subscribe(function(e) {
            // select all rows on ctrl-a
            if (e.which != 65 || !e.ctrlKey) {
                return false;
            }

            var rows = [];
            for (var i = 0; i < dataView.getLength(); i++) {
                rows.push(i);
            }

            grid.setSelectedRows(rows);
            e.preventDefault();
        });

        grid.onSort.subscribe(function(e, args) {
            // sortdir = args.sortCols[0].sortAsc ? 1 : -1;
            // sortcol = args.sortCols[0].sortCol.field;

            // if (isIEPreVer9()) {
            //     var percentCompleteValueFn = function () {
            //         var val = this["percentComplete"];
            //         if (val < 10) {
            //             return "00" + val;
            //         } else if (val < 100) {
            //             return "0" + val;
            //         } else {
            //             return val;
            //         }
            //     };

            //     // use numeric sort of % and lexicographic for everything else
            //     dataView.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortCols[0].sortAsc);
            // } else {
            //     // using native sort with comparer
            //     // preferred method but can be very slow in IE with huge datasets
            //     if (sortcol == "Date")
            //         dataView.sort(comparer, args.sortCols[0].sortAsc);
            //     else
            //         dataView.sort(comparer1, args.sortCols[0].sortAsc);
            // }

            if (args.sortCols.length > 0) {
                if (!["sel", "Date", "corrected", "correction_count", "correction_bates"].includes(args.sortCols[0].columnId)) {
                    executeSort(args.sortCols);
                } else {
                    $(".slick-header-column-sorted .slick-column-name").css("font-style", "normal");
                }
            }
        });

        headerMenuPlugin.onBeforeMenuShow.subscribe(function(e, args) {
            console.log('Before the Header Menu is shown');
        });

        headerMenuPlugin.onAfterMenuShow.subscribe(function(e, args) {
            console.log('After the Header Menu is shown');
        });

        headerMenuPlugin.onCommand.subscribe(function(e, args) {
            // e.preventDefault(); // you could do if you wish to keep the menu open

            if (args.command === "hide") {
                // hide column
                visibleColumns = removeColumnById(visibleColumns, args.column.id);
                grid.setColumns(visibleColumns);
                executeSort(grid.getSortColumns());
            } else if (args.command === "sort-asc" || args.command === "sort-desc") {
                // sort column asc or desc
                var isSortedAsc = (args.command === "sort-asc");

                // var sortCols = removeSortColumnById(grid.getSortColumns(), args.column.id);
                // sortCols.push({ sortAsc: isSortedAsc, columnId: args.column.id });

                var sortCols = [{ sortAsc: isSortedAsc, columnId: args.column.id }];
                grid.setSortColumns(sortCols);
                executeSort(sortCols);
                // $(".slick-header-column-sorted .slick-column-name").css("font-style", "italic");
            } else {
                // command not recognised
                alert("Command: " + args.command);
            }
        });

        grid.registerPlugin(headerMenuPlugin);

        // wire up model events to drive the grid
        // !! both dataView.onRowCountChanged and dataView.onRowsChanged MUST be wired to correctly update the grid
        // see Issue#91
        dataView.onRowCountChanged.subscribe(function(e, args) {
            grid.updateRowCount();
            grid.render();
        });

        dataView.onRowsChanged.subscribe(function(e, args) {
            grid.invalidateRows(args.rows);
            grid.render();
        });

        dataView.onRowCountChanged.subscribe(function(e, args) {
            grid.updateRowCount();
            grid.render();
        });

        dataView.onPagingInfoChanged.subscribe(function(e, pagingInfo) {
            grid.updatePagingStatusFromView(pagingInfo);

            // show the pagingInfo but remove the dataView from the object, just for the Cypress E2E test
            delete pagingInfo.dataView;
        });

        dataView.onBeforePagingInfoChanged.subscribe(function(e, previousPagingInfo) {
            // show the previous pagingInfo but remove the dataView from the object, just for the Cypress E2E test
            delete previousPagingInfo.dataView;
        });

        var h_runfilters = null;

        // wire up the slider to apply the filter to the model
        $("#pcSlider,#pcSlider2").slider({
            "range": "min",
            "slide": function(event, ui) {
                Slick.GlobalEditorLock.cancelCurrentEdit();

                if (percentCompleteThreshold != ui.value) {
                    window.clearTimeout(h_runfilters);
                    h_runfilters = window.setTimeout(updateFilter, 10);
                    percentCompleteThreshold = ui.value;
                }
            }
        });

        // wire up the search textbox to apply the filter to the model
        $("#txtSearch,#txtSearch2").keyup(function(e) {
            Slick.GlobalEditorLock.cancelCurrentEdit();

            // clear on Esc
            if (e.which == 27) {
                this.value = "";
            }

            searchString = this.value;
            updateFilter();
        });

        function updateFilter() {
            dataView.setFilterArgs({
                percentCompleteThreshold: percentCompleteThreshold,
                searchString: searchString
            });
            dataView.refresh();
        }

        $("#btnSelectRows").click(function() {
            if (!Slick.GlobalEditorLock.commitCurrentEdit()) {
                return;
            }

            var rows = [];
            for (var i = 0; i < 10 && i < dataView.getLength(); i++) {
                rows.push(i);
            }
            grid.setSelectedRows(rows);
        });

        grid.init();

        grid.onColumnsResized.subscribe(function(e, args) {
            setTimeout(() => {
                CreateAddPreHeaderRow();
            }, 50);
        });

        // initialize the model after all the events have been hooked up
        dataView.beginUpdate();
        dataView.setItems(source.localdata);
        dataView.setFilterArgs({
            percentCompleteThreshold: percentCompleteThreshold,
            searchString: searchString
        });
        dataView.setFilter(myFilter);
        dataView.endUpdate();

        // if you don't want the items that are not visible (due to being filtered out
        // or being on a different page) to stay selected, pass 'false' to the second arg
        dataView.syncGridSelection(grid, true);

        $("#gridContainer").resizable();

        cols = grid.getColumns();
        let y = [];
        for (c in cols) {
            if (cols[c].name !== "#" && cols[c].name !== "Date")
                y.push(cols[c].name);
        }

        $('#cols').text(y.join(', '));

        //$("#jqxgrid").toggleClass('watermark', disabledGrid);
        if (expired && !disabledGrid) $("#jqxgrid").toggleClass('watermark access', expired);

        resizeColumns(grid);
        CreateAddPreHeaderRow();
    });

    // Change text of loading message form "Loading..." to "Requesting Data.."
    $('#jqxgrid').find('div.jqx-grid-load').next().text('Requesting Data...').css({
        'font-family': 'Calibri',
        'font-size': '14px',
        'color': '#333'
    }).parent().parent().width(153);

    $("#jqxgrid").on("columnresized", function(event) {
        var args = event.args,
            newCols = grid.getColumns();

        for (var i = 0; i < newCols.length; i++) {
            if (args.field != newCols[i].field) {
                newCols[i].width = cols[i].width;
            }
        }
        grid.setColumns(newCols);
    });

    var contextMenu = $("#jqxgridMenu").jqxMenu({
        width: 175,
        height: 92,
        autoOpenPopup: false,
        mode: 'popup'
    });

    $("#jqxgrid").on('contextmenu', function() {
        return false;
    });

    $("#jqxgridMenu").on('itemclick', function(event) {
        var args = event.args;
        switch ($.trim($(args).text())) {
            case "Select All":
                var sel_columns = [];
                if (grid.getData().length == undefined)
                    var rows = grid.getData().getItems();
                else
                    var rows = grid.getData();
                for (var k in rows) {
                    sel_columns.push(k);
                }
                grid.setSelectedRows(sel_columns);
                break;

            case "Copy":
                copySelectedSeriesToClipboard();
                break;

            case "Highlight W/E":
                highlight_weekends = !highlight_weekends;
                $(".highlight-weekends").toggle(highlight_weekends);
                (highlight_weekends) ? $("#hideDropdown1").jqxDropDownList('checkIndex', 1): $("#hideDropdown1").jqxDropDownList('uncheckIndex', 1);
                gridColumndraw();
                // grid.setColumns(columns);
                CreateAddPreHeaderRow();
                resizeColumns(grid);
                break;
        }
    });

    function copySelectedSeriesToClipboard() {
        var rowsindexes = grid.getSelectedRows();
        var rows = [];
        for (var i = 0; i < rowsindexes.length; i++) {
            rows[rows.length] = grid.getDataItem(rowsindexes[i]);
        }
        var Results = getRowsData();
        
        if (Results == undefined) {
            return false;
        }

        Results.splice(0, 5);
        // Results.splice(0, 1, ["Name:", gridMetadata.Name + ' (' + full_symbol + ')']);

        var CsvString = "";
        Results.forEach(function(RowItem, RowIndex) {
            if (RowIndex == 0) {
                var lastGroup = "last";
                RowItem.forEach(function(ColItem, ColIndex) {
                    if (lastGroup == ColItem) {
                        CsvString += "\t";
                    } else {
                        if (ColIndex == (RowItem.length - 1)) {
                            CsvString += ColItem;
                        } else {
                            CsvString += ColItem + "\t";
                        }
                    }
                    lastGroup = ColItem;
                });

            } else {
                RowItem.forEach(function(ColItem, ColIndex) {
                    CsvString += ColItem + "\t";
                });
            }
            CsvString += "\r\n";
        });

        copyToClipboard(CsvString);

        var singleCase = rows.length == 1 ? "has" : "have";
        var singleRow = rows.length == 1 ? "row" : "rows";
        functionNotificationMessage({
            text: rows.length + ' ' + singleRow + ' ' + singleCase + " been copied to the clipboard",
            type: "info"
        });
    }

    function resizeElements() {

        var contentBottomPadding = parseInt($(".main-content").css("padding-bottom"));
        $('#mainSplitter').css('min-height', (window.innerHeight - contentBottomPadding + 16) + 'px');
        preHeaderColumnHeight = 0;
        setTimeout(() => {
            var txtheight = parseInt($("#tabnote").css("height")) + 10;
            // $("#jqxnavigationbar").css('height',)
            // $('#request-json-body').parent().css('height', parseInt($('#jqxTabs').height())-152);
            if (simpleViewChecked) {
                $('#request-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 176).css('top', -29);
            } else {
                $('#request-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 260).css('top', 0);
                $('#notes-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 260);
                $('#user-json-display').parent().css('height', parseInt($('#jqxTabs').height()) - 260);
            }

            // $('#response-json-display').parent().css('height', parseInt($('#jqxTabs').height())-40);
            $('#response-json-display').css('height', parseInt($('#jqxTabs').height()) - 175);
            $('#response-json-display pre').css('height', '100%');
        }, 50);

        if (parameters != undefined && parameters.Series != undefined) {
            setTimeout(() => {
                for (var i = 0; i < columns.length; i++) {
                    if (preHeaderColumnHeight < parseInt($('#slick-column-name-' + i).height()) && parseInt($('#slick-column-name-' + i).height()) < 200) {
                        preHeaderColumnHeight = parseInt($('#slick-column-name-' + i).height());
                    }
                }

                var chainged = false;
                var maxHeight = 30;
                for (var i = 0; i < Object.keys(parameters.Series).length; i++) {
                    var height = 30;
                    if ((parameters.Series[i].HandleWeekends != undefined && parameters.Series[i].HandleWeekends != "A") || (parameters.Series[i].LeadLag != undefined && parameters.Series[i].LeadLag != 0)) {
                        height += 20;
                        chainged = true;
                    }

                    if (parameters.Series[i].Prefill != undefined && parameters.Series[i].Fill != undefined && parameters.Series[i].PostFill != undefined) {
                        if (parameters.Series[i].Prefill == true || parameters.Series[i].Fill == true || parameters.Series[i].PostFill == true) {
                            height += 20;
                            chainged = true;
                        }
                    }

                    if (response_json.Columns[i].Simulated != undefined && response_json.Columns[i].Simulated == true) {
                        height += 20;
                        chainged = true;
                    }

                    if (response_json.Columns[i].Status != 200) {
                        height += 20;
                        chainged = true;
                    }

                    if (height > maxHeight) {
                        maxHeight = height;
                    }
                }

                $('#jqxgrid .slick-header-columns').css('height', maxHeight);

                $('#jqxgrid .slick-preheader-panel').css("height", preHeaderColumnHeight + 10);
                $('#jqxgrid .slick-preheader-panel .slick-header-columns').css("height", preHeaderColumnHeight + 11);

                $('#jqxgrid').css('width', '100%').css('height', parseInt($('#jqxTabs').height()) - 98);

                if (grid != undefined) {
                    grid.resizeCanvas();
                }

                $('#jqxgrid .slick-pane-top').css('height', "calc(100% - " + (preHeaderColumnHeight + maxHeight + 11) + "px)");
                $('#jqxgrid .slick-viewport').css('height', "100%");

                $("#bottomSplitter").parent().css("height", "100%");
            }, 100);
        }

        // 2022 5 23 3:09
        setTimeout(() => {
            let img1 = (fullWidthFlag) ? 'fullscreen' : 'fullscreen1';
            $("#fullWidth1").jqxButton({
                imgSrc: "resources/css/icons/" + img1 + ".png",
                imgPosition: "left",
                width: 28,
                height: 28,
                imgWidth: 18,
                imgHeight: 18,
                textPosition: "right"
            });
            $("#fullWidth1 img").css("left", 5).css("top", 5);

            let img2 = (fullWidthFlag) ? 'fullscreen' : 'fullscreen1';
            $("#fullWidth").jqxButton({
                imgSrc: "resources/css/icons/" + img2 + ".png",
                imgPosition: "left",
                width: 28,
                height: 28,
                imgWidth: 18,
                imgHeight: 18,
                textPosition: "right"
            });

            let img3 = (fullWidthFlag) ? 'fullscreen' : 'fullscreen1';
            $("#ResultfullWidth").jqxButton({
                imgSrc: "resources/css/icons/" + img3 + ".png",
                imgPosition: "left",
                width: 28,
                height: 28,
                imgWidth: 18,
                imgHeight: 18,
                textPosition: "right"
            });

            $("#jqxTabs .jqx-tabs-content-element").each(function() {
                $(this).css({
                    height: $('#bottomPanel').height() - 137 + "px"
                });
            });

            if ( $("#chart").width() > 10) {
                if ($("#bottom-subchart").css("display") !== "none") {
                    $("#top-chart").css({
                        height: "calc( 100% - 96px )"
                    });
                    //   $("#bottom-chart").css({
                    //     height: "calc( 30% - 48px )"
                    //   });
                } else {
                    $("#top-subchart").css({
                        height: "calc( 100% - 96px )"
                    });
                }
            }
        }, 10);
    }

    $(window).resize(function() {
        resizeElements();
    });

    resizeElements();

    $('#exportDialogWindow').jqxWindow({
        showCollapseButton: false,
        resizable: false,
        height: 330,
        width: 400,
        autoOpen: false,
        title: 'Export Database Metadata',
        initContent: function() {
            $('#exportSeriesBtn').jqxButton({
                width: '75px',
                height: '30px'
            });
            $("#exportSeriesBtn").on('click', function() {
                exportData();
                $('#exportDialogWindow').jqxWindow('close');
            });

            $('#cancelExportDialog').jqxButton({
                width: '75px',
                height: '30px'
            });
            $("#cancelExportDialog").on('click', function() {
                $('#exportDialogWindow').jqxWindow('close');
            });
        }
    });

    function makeExportSeriesDialog() {
        if (grid.getData().length == undefined)
            var rows = grid.getData().getItems();
        else
            var rows = grid.getData();
        $('#exportDialogWindow #num').text(rows.length);
        if (grid.getSelectedRows().length == 0) {
            $("#export-one").prop('disabled', true);
            $("#export-all").prop('checked', true);
        } else {
            $("#export-all, #export-one").prop('disabled', false);
            $("#export-one").prop('checked', true);
        }
        let record = (grid.getSelectedRows().length > 1) ? "records" : "record";
        let msg = "Export the " + grid.getSelectedRows().length + " selected " + record;
        $('#exportSelectedRecordsText').text(msg);
        $('#exportDialogWindow').jqxWindow('open');
        $('#exportDialogWindow .jqx-window-header div').css("float", "none");
    }

    // function IsParameterColumnDecimals() {
    //     try {
    //         var d = parameters.ColumnDecimals[getID]
    //         return 1;
    //     } catch (error) {
    //         return 0;
    //     }  
    // }

    function getRowsData() {
        // var frequencyDropdown = $("#series_frequency").jqxDropDownList('getSelectedItem'),
        var frequency = frequency_array[parameters.Frequency];
        var export_type = $('input[name="export_type"]:checked').val(),
            rows,
            datasets = [];

        if (export_type == "selected") {
            var indexes = grid.getSelectedRows();
            indexes.sort((a, b) => a - b);

            if (indexes.length == 0) {
                dialogWindow("Please select at least one row in the table to copy.", "error");
                return;
            } else {
                indexes.forEach(function(item, i, indexes) {
                    rows = grid.getDataItem(indexes[i]);
                    let data = columns.map(function(v) {
                        if (v.field == "Date") {
                            var date = new Date(rows[v.field]),
                                day = date.getDate(),
                                month = date.getMonth() + 1,
                                year = date.getFullYear();
                            day = (day < 10) ? '0' + day : day;
                            month = (month < 10) ? '0' + month : month;
                            return year + '-' + month + '-' + day + '`';
                        } else {
                            var getID = v.id.split("-")[v.id.split("-").length - 1];
                            return (rows[v.field] == undefined || rows[v.field] == null) ? "" : (
                                        getID != undefined ? 
                                            parseFloat(rows['Close-o']).toFixed(4) : 4);
                        }
                    });
                    datasets.push(data.slice(1));
                });
            }
        } else if (export_type == "all") {
            if (grid.getData().length == undefined)
                var items = grid.getData().getItems();
            else
                var items = grid.getData();

            items.forEach(function(rows) {
                let data = columns.map(function(v) {
                    if (v.field == "Date") {
                        var date = new Date(rows[v.field]),
                            day = date.getDate(),
                            month = date.getMonth() + 1,
                            year = date.getFullYear();
                        day = (day < 10) ? '0' + day : day;
                        month = (month < 10) ? '0' + month : month;
                        return year + '-' + month + '-' + day + '`';
                    }
                    return (rows[v.field] == undefined) ? "" : rows[v.field];
                });
                datasets.push(data.slice(1));
            });
        }

        var startD = startDate + "`";
        var endD = endDate + "`";

        var date = new Date(),
            day = date.getDate(),
            month = date.getMonth() + 1,
            year = date.getFullYear(),
            hours = date.getHours(),
            minutes = date.getMinutes(),
            seconds = date.getSeconds(),
            times = hours + ":" + minutes + ":" + seconds;

        day = (day < 10) ? '0' + day : day;
        month = (month < 10) ? '0' + month : month;
        date = day + '-' + month + '-' + year;

        Results = [
            ["Exported from Sarus Xlerate on " + date + " at " + times],
            ["Report #ID:", report_id, "Report Name:", report_name],
            ["Average:", frequency],
            ["Start Date:", startD],
            ["End Date:", endD],
        ];

        Results.push(columns.map(v => v.columnGroup).slice(1));
        Results.push(columns.map(v => v.label).slice(1));
        datasets.map(v => Results.push(v));

        return Results;
    }

    // Export data to csv file
    function exportData() {

        var Results = getRowsData();
        // Results.splice(4, 1);

        var file_type = $('input[name="file_type"]:checked').val();
        if (file_type == "csv") {
            var CsvString = "";
            Results.forEach(function(RowItem, RowIndex) {
                if (RowIndex == 5) {
                    var lastGroup = "last";
                    RowItem.forEach(function(ColItem, ColIndex) {
                        if (lastGroup == ColItem) {
                            CsvString += ',';
                        } else {
                            if (ColIndex == (RowItem.length - 1)) {
                                CsvString += ColItem;
                            } else {
                                CsvString += '"' + ColItem.toString() + '",';
                            }
                        }
                        lastGroup = ColItem;
                    });

                } else {
                    RowItem.forEach(function(ColItem, ColIndex) {
                        CsvString += '"' + ColItem.toString() + '",';
                    });
                }

                // RowItem.forEach(function (ColItem, ColIndex) {
                //     if (ColItem == "" || ColItem == "NaN") ColItem = " ";
                //     CsvString += '"' + ColItem.toString() + '",';
                // });
                CsvString += "\r\n";
            });

            CsvString = "data:application/csv," + encodeURIComponent(CsvString);

            var link = document.createElement("a");
            link.href = CsvString;
            link.download = report_name + ".csv";
            link.click();
        } else {
            // var uri = 'data:application/vnd.ms-excel;base64,',
            //     template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body><table>{table}</table></body></html>',
            //     base64 = function (s) {
            //         return window.btoa(unescape(encodeURIComponent(s)))
            //     },
            //     format = function (s, c) {
            //         return s.replace(/{(\w+)}/g, function (m, p) {
            //             return c[p];
            //         })
            //     }

            var table = "<table id='export_table'>";
            Results.forEach(function(RowItem, RowIndex) {
                if (RowIndex == 5) {
                    table += "<tr><td></td>";
                    var columnGroup = "";
                    var colspan = 1;
                    columns.forEach(function(column, RowIndex) {
                        if (![" ", "Date", "corrected", "correction_count", "correction_bates"].includes(column.name)) {
                            if (columnGroup == column.columnGroup) {
                                colspan++;
                            } else if (columnGroup != "" && columnGroup != column.columnGroup) {
                                table += "<td colspan = '" + colspan + "'>" + columnGroup + "</td>";
                                colspan = 1;
                            }
                            columnGroup = column.columnGroup;
                        }
                    });
                    table += "<td colspan = '" + colspan + "'>" + columnGroup + "</td>";
                    table += "</tr>";
                } else {
                    table += "<tr bgcolor='red'>";
                    RowItem.forEach(function(ColItem, ColIndex) {
                        if (ColItem == "" || ColItem == "NaN") ColItem = " ";
                        table += "<td>" + ColItem.toString() + "</td>";
                    });
                    table += "</tr>";
                }
            });
            table += "</table>";
            $("#export_excel").html(table);
            var elt = document.getElementById('export_table');
            setTimeout(() => {
                var wb = XLSX.utils.table_to_book(elt, { sheet: "sheet1" });
                return XLSX.writeFile(wb, (report_name + '.xls'));
            }, 100);

            // var ctx = {
            //     worksheet: "sheet1" || '',
            //     table: toExcel
            // };
            // var link = document.createElement("a");
            // link.download = report_name + ".xls";
            // link.href = uri + base64(format(template, ctx))
            // link.click();
        }
    }

    // var meta_rows = $("#metadataContent").find("div"),
    //     size = 1.35 * (meta_rows[0].offsetHeight + meta_rows[1].offsetHeight);

    $('#mainSplitter').jqxSplitter({
        height: '100%',
        width: '100%',
        orientation: 'horizontal',
        panels: [{
            size: "65px",
        }, {
            size: "50%",
        }]
    });

    $('#mainSplitter').on('resize expanded collapsed', function(e) {
        $("#jqxTabs .jqx-tabs-content-element").each(function() {
            $(this).css({
                height: $('#bottomPanel').css('height').slice(0, -2) - 137 + "px"
            });
        });

        if ( $("#chart").width() > 10) {
            if ($("#bottom-subchart").css("display") !== "none") {
                $("#top-chart").css({
                    height: "calc( 70% - 48px )"
                });
                $("#bottom-chart").css({
                    height: "calc( 30% - 48px )"
                });
            } else {
                $("#top-subchart").css({
                    height: "calc( 100% - 96px )"
                });
            }
        }

        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 10);
    });

    var hideDropdownData = [{
            name: 'Allow Editing',
            value: 'allow',
        },
        {
            name: 'Simple View',
            value: 'simple',
        },
        {
            name: 'Export Request',
            value: 'export',
        },
        {
            name: 'Import Request',
            value: 'import',
        }
    ];

    if (requestedTab != null && requestedTab != '') {
        if (requestedTab == 'chart') {
            $('#jqxTabs').jqxTabs('select', 1);
            if (!isChartLoaded) {
                isChartLoaded = true;
                createChart(rowsData, columns);
            }
        } else if (requestedTab == 'request') {
            $('#jqxTabs').jqxTabs('select', 3);
        } else if (requestedTab == 'result') {
            $('#jqxTabs').jqxTabs('select', 2);
        } else window.history.pushState("datasetsPage", " database", "/report_viewer?report_id=" + report_id + "&tab=prices" + layoutURL);
    } else window.history.pushState("datasetsPage", " database", "/report_viewer?report_id=" + report_id + "&tab=prices" + layoutURL);

    function CreateAddRequestHeaderRow() {

        var frequency_json = [{
                name: 'Day',
                value: 'Day'
            },
            {
                name: 'Week',
                value: 'Week'
            },
            {
                name: 'Half Month',
                value: 'HalfMonth'
            },
            {
                name: 'Month',
                value: 'Month'
            },
            {
                name: 'Quarter',
                value: 'Quarter'
            },
            {
                name: 'Half Year',
                value: 'HalfYear'
            },
            {
                name: 'Year',
                value: 'Year'
            }
        ];

        $("#btnSeriesProperties, #btnSeriesProperties1").jqxButton({
            imgSrc: "resources/css/icons/series-prop.png",
            imgPosition: "left",
            width: 88,
            height: 28,
            imgWidth: 18,
            imgHeight: 18,
            textPosition: "right"
        });
        $("#btnSeriesProperties span, #btnSeriesProperties1 span").css("left", 28);

        $("#btnSeriesProperties, #btnSeriesProperties1").on('click', function() {
            $('.popup-win').hide();
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                var jsonObj = getJsonTree(request_editor);
                if (jsonObj == "Json_error" || !(jsonObj.Frequency != undefined && jsonObj.Series != undefined)) {
                    dialogWindow("The 'JSON Request' tab must contain valid JSON code.", "error");
                } else {
                    $('body').addClass('overlay');
                    $('#selectSeriesPopup').jqxWindow('open');
                    $('#selectSeriesPopup').jqxWindow({ position: "center" });
                    $("#selectSeriesPopup").css("min-width", 250).css("min-height", 300);
                    $('#selectSeriesPopup .jqx-window-header div').css("float", "none");
                    $('#selectSeriesPopup').jqxWindow('focus');

                    // $('#selectSeriesPopup .jqx-window-header').css("height", "18px").css("background", "url('resources/css/images/header-bg.gif') center top repeat-x");
                    $('#selectSeriesPopup .jqx-window-content').css("width", "calc(100%)").css("overflow", "unset").css("min-width", 250);
                    $('#treeGrid').css("height", parseInt($("#selectSeriesPopup").height()) - 102);
                    $('#treeGrid').css("width", parseInt($("#selectSeriesPopup").width()));
                    $('#treeGrid .slick-pane-top').css('height', "calc(100% - 124px)");
                    $('#treeGrid .slick-viewport').css('height', "calc(100%)");

                    setTimeout(() => {
                        if (parseInt($('#treeGrid .grid-canvas').height()) > (parseInt($('#selectSeriesPopup').height()) - 110)) {
                            series_columns[2].width = parseInt($("#selectSeriesPopup").width()) - 118;
                        } else {
                            series_columns[2].width = parseInt($("#selectSeriesPopup").width()) - 100;
                        }
                        grid1.setColumns(series_columns);
                    }, 50);

                    original_columnsWithHighlightingById = {};
                    setTimeout(() => {
                        var selectedData = [];
                        for (var i = 0; i < 300; i++) {
                            var row_info = grid1.getDataItem(i);
                            if (row_info != undefined && row_info["id"] != undefined) {
                                if (columnsWithHighlightingById[row_info["id"]] != undefined) {
                                    selectedData.push(i);
                                    columnsWithHighlightingById[row_info["id"]] = i;
                                    original_columnsWithHighlightingById[row_info["id"]] = i;

                                    $($("#treeGrid .grid-canvas").children(".slick-row")[i]).children(".r1").css("background-color", "rgb(205, 222, 243)").css("background-image", "url(resources/css/icons/check-green.png)").css("background-repeat", "no-repeat").css("background-position", "center center");
                                    $($("#treeGrid .grid-canvas").children(".slick-row")[i]).children(".r2").css("background-color", "rgb(205, 222, 243)");
                                } else {
                                    $($("#treeGrid .grid-canvas").children(".slick-row")[i]).children(".r1").css("background-color", "white").css("background-image", "unset");
                                    $($("#treeGrid .grid-canvas").children(".slick-row")[i]).children(".r2").css("background-color", "white");
                                }
                            }
                        };
                    }, 100);
                    // grid1.setSelectedRows(selectedData);
                    $("#sel_series").html(Object.keys(columnsWithHighlightingById).length);
                    if (Object.keys(columnsWithHighlightingById).length == 0) {
                        $("#btnLoadBates").jqxButton("disabled", true);
                    } else {
                        $("#btnLoadBates").jqxButton("disabled", false);
                    }
                    $("#treeGrid #header-effort-driven").css("background-image", "url(resources/css/icons/check-grey.png)");

                    $("#selectSeriesPopup").keyup(function(event) {
                        if (event.keyCode === 13) {
                            $("#btnLoadBates").trigger('click');
                        }
                    });
                }
            }
        });

        $("#btnFill, #btnFill1").jqxButton({
            imgSrc: "resources/css/icons/fill.png",
            imgPosition: "left",
            width: 55,
            height: 28,
            imgWidth: 18,
            imgHeight: 18,
            textPosition: "right"
        });
        $("#btnFill span, #btnFill1 span").css("left", 28);

        $("#btnFill, #btnFill1").on('click', function() {
            $('.popup-win').hide();
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                var jsonObj = getJsonTree(request_editor);
                if (jsonObj == "Json_error" || !(jsonObj.Frequency != undefined && jsonObj.Series != undefined)) {
                    dialogWindow("The 'JSON Request' tab must contain valid JSON code.", "error");
                } else {
                    $('body').addClass('overlay');
                    $('#fillPopup').jqxWindow('open');
                    $('#fillPopup').jqxWindow({ position: "center" });
                    $("#fillPopup").css("min-width", 380).css("min-height", 400);
                    $('#fillPopup .jqx-window-header div').css("float", "none");
                    $('#fillPopup').jqxWindow('focus');

                    $("#fillPopup").keyup(function(event) {
                        if (event.keyCode === 13) {
                            $("#btnLoadFill").trigger('click');
                        }
                    });

                    if (parameters.FillOptions.Type != undefined) {
                        $("#select_fillType").jqxDropDownList('selectItem', parameters.FillOptions.Type);
                    } else {
                        $("#select_fillType").jqxDropDownList('selectItem', 'previous');
                    }

                    if (parameters.FillOptions.Style != undefined) {
                        $("#select_fillStyle").jqxDropDownList('selectItem', parameters.FillOptions.Style);
                    } else {
                        $("#select_fillStyle").jqxDropDownList('selectItem', 'null');
                    }

                    if (parameters.FillOptions.Leading != undefined) {
                        $("#fillLeading").jqxCheckBox('checked', parameters.FillOptions.Leading);
                    } else {
                        $("#fillLeading").jqxCheckBox('checked', false);
                    }

                    if (parameters.FillOptions.Trailing != undefined) {
                        $("#fillTrailing").jqxCheckBox('checked', parameters.FillOptions.Trailing);
                    } else {
                        $("#fillTrailing").jqxCheckBox('checked', false);
                    }

                    if (parameters.Sparse != undefined) {
                        $("#sparse").jqxCheckBox('checked', parameters.Sparse);
                    } else {
                        $("#sparse").jqxCheckBox('checked', false);
                    }

                    // if (parameters.FrequencyOptions.ReturnWeekends != undefined && parameters.FrequencyOptions.ReturnWeekends == "on") {
                    //     $("#allowWeekend").jqxCheckBox('checked', true);
                    // }
                    // else {
                    //     $("#allowWeekend").jqxCheckBox('checked', false);
                    // }
                }
            }
        });

        $("#btnFrequency, #btnFrequency1").jqxButton({
            imgSrc: "resources/css/icons/average.png",
            imgPosition: "left",
            width: 85,
            height: 28,
            imgWidth: 18,
            imgHeight: 18,
            textPosition: "right"
        });
        // $("#btnDateRange").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");
        $("#btnFrequency span, #btnFrequency1 span").css("left", 28);

        $("#btnFrequency, #btnFrequency1").on('click', function() {
            $('.popup-win').hide();
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                var jsonObj = getJsonTree(request_editor);
                if (jsonObj == "Json_error" || !(jsonObj.Frequency != undefined && jsonObj.Series != undefined)) {
                    dialogWindow("The 'JSON Request' tab must contain valid JSON code.", "error");
                } else {
                    $('body').addClass('overlay');
                    $('#frequencyPopup').jqxWindow('open');
                    $('#frequencyPopup').jqxWindow({ position: "center" });
                    // $("#frequencyPopup").css("min-width", 380).css("min-height", 440);
                    $('#frequencyPopup .jqx-window-header div').css("float", "none");
                    $('#frequencyPopup').jqxWindow('focus');

                    $("#frequencyPopup").keyup(function(event) {
                        if (event.keyCode === 13) {
                            $("#btnLoadFrequency").trigger('click');
                        }
                    });

                    if (parameters.Frequency.substr(0, 1) == "c") {
                        $("#select_frequency").jqxDropDownList('selectItem', frequency_array[parameters.Frequency.substr(1)]);
                        if (parameters.Frequency.substr(1) != "d") {
                            $("#custom_frequency").jqxCheckBox("checked", true);
                        }
                    } else {
                        $("#select_frequency").jqxDropDownList('selectItem', frequency_array[parameters.Frequency]);
                        if (parameters.Frequency != "d") {
                            $("#custom_frequency").jqxCheckBox("checked", false);
                        }
                    }

                    if (parameters.FrequencyOptions.HandleWeekends != undefined) {
                        $("#select_weekends").jqxDropDownList('selectItem', parameters.FrequencyOptions.HandleWeekends);
                    } else {
                        $("#select_weekends").jqxDropDownList('selectItem', "A");
                    }

                    if (parameters.FrequencyOptions.HandleWeekends != undefined && (parameters.FrequencyOptions.HandleWeekends == "5+" || parameters.FrequencyOptions.HandleWeekends == "5-")) {
                        $("#overwriteWeekend").jqxCheckBox("disabled", false);
                    } else {
                        $("#overwriteWeekend").jqxCheckBox("checked", false);
                        $("#overwriteWeekend").jqxCheckBox("disabled", true);
                    }

                    if (parameters.Frequency == "d" || parameters.Frequency == "cd") {
                        $(".firstDate_averages").hide();
                    } else {
                        $(".firstDate_averages").show();
                        if (parameters.FrequencyOptions.UseFirstDate != undefined) {
                            $("#firstDate_averages").jqxCheckBox('checked', parameters.FrequencyOptions.UseFirstDate);
                        } else {
                            $("#firstDate_averages").jqxCheckBox('checked', false);
                        }
                    }

                    if (parameters.FrequencyOptions.ReturnWeekends != undefined && parameters.FrequencyOptions.ReturnWeekends == "on") {
                        $("#weekendDate_averages").jqxCheckBox('checked', true);
                    } else {
                        $("#weekendDate_averages").jqxCheckBox('checked', false);
                    }
                }
            }
        });


        $("#btnDateRange, #btnDateRange1").jqxButton({
            imgSrc: "resources/css/icons/calendar.png",
            imgPosition: "left",
            width: 65,
            height: 28,
            imgWidth: 20,
            imgHeight: 20,
            textPosition: "right"
        });
        // $("#btnDateRange, #btnDateRange1").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");
        $("#btnDateRange span, #btnDateRange1 span").css("left", 25);

        var s_date;
        $("#btnDateRange, #btnDateRange1").on('click', function() {
            $('.popup-win').hide();
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                var jsonObj = getJsonTree(request_editor);
                if (jsonObj == "Json_error" || !(jsonObj.Frequency != undefined && jsonObj.Series != undefined)) {
                    dialogWindow("The 'JSON Request' tab must contain valid JSON code.", "error");
                } else {
                    $('body').addClass('overlay');
                    $('#dateRangePopup').jqxWindow('open');
                    $('#dateRangePopup').jqxWindow({ position: "center" });
                    $("#dateRangePopup").css("min-width", 356).css("min-height", 400);
                    $('#dateRangePopup .jqx-window-header div').css("float", "none");
                    $('#dateRangePopup').jqxWindow('focus');

                    $("#dateRangePopup").keyup(function(event) {
                        if (event.keyCode === 13) {
                            $("#btnLoadDateRange").trigger('click');
                        }
                    });

                    if (parameters.FirstDate != undefined) {
                        if (parameters.FirstDate == "Earliest") {
                            $("#use_earliest").jqxCheckBox("checked", true);
                            $("#inputdr_startDate").val("Earliest");
                            
                           
                        } else {
                            s_date = parameters.FirstDate;
                            $("#dr_startDate").removeClass('input-enabled')
                            $("#use_earliest").jqxCheckBox("checked", false);
                            $('#dr_startDate').jqxDateTimeInput('setDate', new Date(s_date));
                        }
                    } else {
                        var myCurrentDate = new Date();
                        if (parameters.Frequency == "d") {
                            s_date = new Date(myCurrentDate);
                            s_date.setDate(s_date.getDate() - 500);
                        } else if (parameters.Frequency == "w") {
                            s_date = new Date(myCurrentDate);
                            s_date.setDate(s_date.getDate() - (500 * 7));
                        } else if (parameters.Frequency == "hm") {
                            s_date = new Date(myCurrentDate);
                            s_date.setMonth(s_date.getMonth() - 125);
                        } else if (parameters.Frequency == "m") {
                            s_date = new Date(myCurrentDate);
                            s_date.setMonth(s_date.getMonth() - 120);
                        } else if (parameters.Frequency == "q") {
                            s_date = new Date(myCurrentDate);
                            s_date.setMonth(s_date.getMonth() - 120);
                        } else if (parameters.Frequency == "hy") {
                            s_date = new Date(myCurrentDate);
                            s_date.setMonth(s_date.getMonth() - 300);
                        } else if (parameters.Frequency == "y") {
                            s_date = new Date(myCurrentDate);
                            s_date.setMonth(s_date.getMonth() - 360);
                        }

                        $('#dr_startDate').jqxDateTimeInput('setDate', new Date(s_date));
                    }

                    

                    if (parameters.LastDate != undefined) {
                        if (parameters.LastDate == "Latest") {
                            $("#use_latest").jqxCheckBox("checked", true);
                            $("#inputdr_endDate").val("Latest");
                        } else {
                            $("#use_latest").jqxCheckBox("checked", false);
                            $('#dr_endDate').jqxDateTimeInput('setDate', new Date(parameters.LastDate));
                        }
                    } else {
                        $('#dr_endDate').jqxDateTimeInput('setDate', new Date(source.localdata[0].Date));
                    }

                    if (parameters.Periods != undefined) {
                        $("#dr_periods").jqxFormattedInput("val", parameters.Periods);
                        $('#dateRangeTabs').jqxTabs('select', 1);
                    }

                    if (parameters.CommonStart != undefined) {
                        if (parameters.CommonStart == true)
                            $("#cm_startDate").jqxCheckBox("checked", true);
                        else
                            $("#cm_startDate").jqxCheckBox("checked", false);
                    }

                    if (parameters.CommonEnd != undefined) {
                        if (parameters.CommonEnd == true)
                            $("#cm_endDate").jqxCheckBox("checked", true);
                        else
                            $("#cm_endDate").jqxCheckBox("checked", false);
                    }

                    if (parameters.Series[1] != undefined) {
                        $("#cm_startDate").jqxCheckBox("disabled", false);
                        $("#cm_endDate").jqxCheckBox("disabled", false);
                    } else {
                        $("#cm_startDate").jqxCheckBox("disabled", true);
                        $("#cm_endDate").jqxCheckBox("disabled", true);
                    }
                }
            }
        });


        series_columns = [
            { id: "sel", name: " ", field: "num1", cssClass: "cell-selection", minWidth: 60, width: 60, resizable: false, selectable: false, focusable: false },
            { id: "check", name: "<div id='header-effort-driven'></div>", width: 40, minWidth: 40, maxWidth: 40, cssClass: "cell-effort-driven", field: "check", formatter: Slick.Formatters.Checkmark, editor: Slick.Editors.Checkbox, sortable: true },
            { id: "name", name: "Column", field: "name", minWidth: 200, width: 260, cssClass: "cell-title", sortable: true }
        ];

        var options = {
            enableCellNavigation: true,
            // editable: true,
            rowHeight: 32,
        };

        var sortcol = "sel";
        var sortdir = 1;

        function myFilter(item, args) {
            return item["percentComplete"] >= args.percentComplete;
        }

        function comparer2(a, b) {
            var x = a[sortcol],
                y = b[sortcol];
            return (x == y ? 0 : (x > y ? 1 : -1));
        }

        function groupByDuration() {
            dataView1.setGrouping({
                getter: "title",
                formatter: function(g) {
                    return g.value.substr(1);
                },
                aggregateCollapsed: false,
                lazyTotalsCalculation: true
            });
        }

        $(function() {
            var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
            dataView1 = new Slick.Data.DataView({
                groupItemMetadataProvider: groupItemMetadataProvider,
                inlineFilters: true
            });
            grid1 = new Slick.Grid("#treeGrid", dataView1, series_columns, options);

            // register the group item metadata provider to add expand/collapse group handlers
            grid1.registerPlugin(groupItemMetadataProvider);
            grid1.setSelectionModel(new Slick.RowSelectionModel());
            // grid1.setSelectionModel(new Slick.CellSelectionModel());

            grid1.onSort.subscribe(function(e, args) {
                sortdir = args.sortAsc ? 1 : -1;
                sortcol = args.sortCol.field;

                if (isIEPreVer9()) {
                    // using temporary Object.prototype.toString override
                    // more limited and does lexicographic sort only by default, but can be much faster            
                    var percentCompleteValueFn = function() {
                        var val = this["id"];
                        if (val < 10) {
                            return "00" + val;
                        } else if (val < 100) {
                            return "0" + val;
                        } else {
                            return val;
                        }
                    };

                    // use numeric sort of % and lexicographic for everything else
                    dataView1.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortAsc);
                } else {
                    // using native sort with comparer
                    // preferred method but can be very slow in IE with huge datasets
                    dataView1.sort(comparer2, args.sortAsc);
                }
            });

            grid1.onClick.subscribe(function(e, args, sss) {

                var row_info = args.grid.getDataItem(args.row);

                if (row_info["id"] != undefined) {
                    setTimeout(() => {
                        var node = args.grid.getActiveCellNode();
                        if ($(node).parent(".slick-row").children(".r1").css("background-color") == "rgb(205, 222, 243)") {
                            $(node).parent(".slick-row").children(".r1").css("background-color", "white").css("background-image", "unset");
                            $(node).parent(".slick-row").children(".r2").css("background-color", "white");

                            const getStr = row_info["id"].split("-");

                            if (getStr.length > 1) {
                                $($("#jqxgrid .slick-header-columns-left").children('.slick-header-column')[2 + parseInt(getStr[getStr.length - 1])]).css("background-color", "#f6f6f6");
                            }
                        } else {
                            const getStr = row_info["id"].split("-");

                            if (getStr.length > 1) {
                                $($("#jqxgrid .slick-header-columns-left").children('.slick-header-column')[2 + parseInt(getStr[getStr.length - 1])]).css("background-color", "rgb(148, 233, 247)");
                            }
                            $(node).parent(".slick-row").children(".r1").css("background-color", "rgb(205, 222, 243)").css("background-image", "url(resources/css/icons/check-green.png)").css("background-repeat", "no-repeat").css("background-position", "center");
                            $(node).parent(".slick-row").children(".r2").css("background-color", "rgb(205, 222, 243)");
                        }
                    }, 5);

                    if (columnsWithHighlightingById[row_info["id"]] != undefined) {
                        delete columnsWithHighlightingById[row_info["id"]];
                    } else {
                        columnsWithHighlightingById[row_info["id"]] = args.row;
                    }
                }
                // var selectedData = [];
                // Object.keys(columnsWithHighlightingById).map(function (column) {
                //     selectedData.push(columnsWithHighlightingById[column]);
                // });

                setTimeout(() => {
                    // args.grid.setSelectedRows(selectedData);
                    $("#sel_series").html(Object.keys(columnsWithHighlightingById).length);

                    if (Object.keys(columnsWithHighlightingById).length == 0) {
                        $("#btnLoadBates").jqxButton("disabled", true);
                    } else {
                        $("#btnLoadBates").jqxButton("disabled", false);
                    }

                    for (var i = 0; i < columns.length; i++) {
                        if (columnsWithHighlightingById[columns[i]["id"]] != undefined) {
                            columns[i]["header"]["buttons"][0]["cssClass"] = "icon-highlight-on";
                        } else {
                            if (columns[i]["header"]["buttons"] != undefined) {
                                columns[i]["header"]["buttons"][0]["cssClass"] = "icon-highlight-off";
                            }
                        }
                    }

                    // grid.setColumns(columns);
                    // resizeColumns(grid);
                }, 1);
            });

            grid1.onHeaderClick.subscribe(function(e, args) {
                if (args.column.field == "check") {
                    var selectedData = [];
                    if (all_select == false) {
                        for (var i = 0; i < 300; i++) {
                            var row_info = args.grid.getDataItem(i);
                            if (row_info != undefined && row_info["id"] != undefined) {
                                selectedData.push(i);
                                columnsWithHighlightingById[row_info["id"]] = i;
                            }
                        };
                        args.grid.setSelectedRows(selectedData);
                        setTimeout(() => {
                            $("#treeGrid .slick-cell.selected").css("background-color", "rgb(205, 222, 243)");
                            $("#treeGrid .cell-effort-driven.selected").css("background-image", "url(resources/css/icons/check-green.png)").css("background-repeat", "no-repeat").css("background-position", "center");
                        }, 10);

                        all_select = true;
                        $("#treeGrid #header-effort-driven").css("background-image", "url(resources/css/icons/check-green.png)");
                        $("#sel_series").html(Object.keys(columnsWithHighlightingById).length);
                        $("#btnLoadBates").jqxButton("disabled", false);
                    } else {
                        columnsWithHighlightingById = {};
                        args.grid.setSelectedRows([]);
                        $("#treeGrid .slick-cell").css("background-color", "white");
                        $("#treeGrid .cell-effort-driven").css("background-image", "unset");
                        all_select = false;
                        $("#treeGrid #header-effort-driven").css("background-image", "url(resources/css/icons/check-grey.png)");
                        $("#sel_series").html(0);
                        $("#btnLoadBates").jqxButton("disabled", true);
                    }

                    for (var i = 0; i < columns.length; i++) {
                        if (columnsWithHighlightingById[columns[i]["id"]] != undefined) {
                            columns[i]["header"]["buttons"][0]["cssClass"] = "icon-highlight-on";
                        } else {
                            if (columns[i]["header"]["buttons"] != undefined) {
                                columns[i]["header"]["buttons"][0]["cssClass"] = "icon-highlight-off";
                            }
                        }
                    }

                    grid.setColumns(columns);
                    resizeColumns(grid);
                }
            });

            // wire up model events to drive the grid
            dataView1.onRowCountChanged.subscribe(function(e, args) {
                grid1.updateRowCount();
                grid1.render();
            });

            dataView1.onRowsChanged.subscribe(function(e, args) {
                grid1.invalidateRows(args.rows);
                grid1.render();
            });

            var h_runfilters = null;

            // initialize the model after all the events have been hooked up
            dataView1.beginUpdate();
            dataView1.setItems(batesArray);
            groupByDuration();
            dataView1.endUpdate();

            // $("#gridContainer").resizable();
        });

        $('#selectSeriesPopup').on('close', function() {
            $('body').removeClass('overlay');
        });

        $('#selectSeriesPopup').jqxWindow({
            showCollapseButton: false,
            resizable: true,
            isModal: false,
            height: '460px',
            width: '360px',
            maxHeight: '2000%',
            maxWidth: '2000%',
            autoOpen: false,
            title: 'Select Columns to Edit'
        });

        $('#selectSeriesPopup').on('resizing', function(event) {
            // $('#selectSeriesPopup .jqx-window-content').css("width", "calc(100%)").css("overflow", "unset");
            $('#treeGrid .slick-viewport').css('overflow', "hidden");
            $('#treeGrid').css("height", parseInt($("#selectSeriesPopup").height()) - 102);
            $('#treeGrid').css("width", parseInt($("#selectSeriesPopup").width()));
            $('#treeGrid .slick-pane-top').css('height', "calc(100% - 124px)");
            $('#treeGrid .slick-viewport').css('height', "calc(100%)");

            setTimeout(() => {
                if (parseInt($('#treeGrid .grid-canvas').height()) > (parseInt($('#selectSeriesPopup').height()) - 110)) {
                    series_columns[2].width = parseInt($("#selectSeriesPopup").width()) - 118;
                } else {
                    series_columns[2].width = parseInt($("#selectSeriesPopup").width()) - 100;
                }
                grid1.setColumns(series_columns);
            }, 50);
        });

        $('#selectSeriesPopup').on('resized', function(event) {
            // $('#selectSeriesPopup .jqx-window-content').css("width", "calc(100%)").css("overflow", "unset");
            // $('#treeGrid').css("height", parseInt($("#selectSeriesPopup").height())-85);
            // $('#treeGrid').css("width", parseInt($("#selectSeriesPopup").width()));
            // $('#treeGrid .slick-pane-top').css('height', "calc(100% - 124px)");
            // $('#treeGrid .slick-viewport').css('height', "calc(100%)");

            // setTimeout(() => {
            //     if(parseInt($('#treeGrid .grid-canvas').height()) > (parseInt($('#selectSeriesPopup').height())-110)){
            //         series_columns[2].width = parseInt($("#selectSeriesPopup").width()) - 118;
            //     }
            //     else{
            //         series_columns[2].width = parseInt($("#selectSeriesPopup").width()) - 100;
            //     }
            //     grid1.setColumns(series_columns);
            // }, 50);
        });

        $("#btnLoadBates").jqxButton({
            width: '65px',
            height: '31px',
            textPosition: "center"
        });

        $("#btnLoadBates span").css("left", 24).css("top", 7);

        $("#btnLoadBates").on('click', function() {
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                if (Object.keys(columnsWithHighlightingById).length > 0) {
                    $('#selectSeriesPopup').jqxWindow('close');

                    original_columnsWithHighlightingById = {};
                    for (var i = 0; i < columns.length; i++) {
                        if (columnsWithHighlightingById[columns[i]["id"]] != undefined) {
                            original_columnsWithHighlightingById[columns[i]["id"]] = columnsWithHighlightingById[columns[i]["id"]];
                            columns[i]["header"]["buttons"][0]["cssClass"] = "icon-highlight-on";
                        }
                    }

                    setTimeout(() => {
                        $('body').addClass('overlay');
                        $('#seriesPropertiesPopup').jqxWindow('open');
                        $('#seriesPropertiesPopup').jqxWindow({ position: "center" });
                        $("#seriesPropertiesPopup").css("min-width", 380).css("min-height", 470);
                        $('#seriesPropertiesPopup .jqx-window-header div').css("float", "none");
                        $('#seriesPropertiesPopup').jqxWindow('focus');
                    }, 300);

                    $("#seriesPropertiesPopup").keyup(function(event) {
                        if (event.keyCode === 13) {
                            $("#btnLoadSeriesProperties").trigger('click');
                        }
                    });

                    if (parameters.FillOptions.Type != undefined) {
                        if (parameters.FillOptions.Type == "previous") {
                            $("#fillType").html("Previous Value");
                        } else if (parameters.FillOptions.Type == "midpoint") {
                            $("#fillType").html("Mid Point");
                        } else {
                            $("#fillType").html("Interpolated");
                        }
                    } else {
                        $("#fillType").html("Previous Value");
                    }

                    var sel_num = 999;
                    Object.keys(columnsWithHighlightingById).map(function(column) {
                        const getStr = column.split("-");
                        if (sel_num > parseInt(getStr[getStr.length - 1])) {
                            sel_num = parseInt(getStr[getStr.length - 1]);
                        }
                    });

                    if (parameters.Series[sel_num].Prefill != undefined) {
                        $("#prefill_holiday").jqxCheckBox("checked", parameters.Series[sel_num].Prefill);
                    } else {
                        $("#prefill_holiday").jqxCheckBox("checked", false);
                    }

                    if (parameters.Series[sel_num].Fill != undefined) {
                        $("#fill_holiday").jqxCheckBox("checked", parameters.Series[sel_num].Fill);
                    } else {
                        $("#fill_holiday").jqxCheckBox("checked", false);
                    }

                    if (parameters.Series[sel_num].PostFill != undefined) {
                        $("#postfill_holiday").jqxCheckBox("checked", parameters.Series[sel_num].PostFill);
                    } else {
                        $("#postfill_holiday").jqxCheckBox("checked", false);
                    }

                    if (parameters.Series[sel_num].HandleWeekends != undefined) {
                        $("#s_p_select_weekends").jqxDropDownList("selectItem", parameters.Series[sel_num].HandleWeekends);
                        if (parameters.Series[sel_num].HandleWeekends == "5+" || parameters.Series[sel_num].HandleWeekends == "5-") {
                            $("#s_p_overwriteWeekend").jqxCheckBox("disabled", false);
                        } else {
                            $("#s_p_overwriteWeekend").jqxCheckBox("checked", false);
                            $("#s_p_overwriteWeekend").jqxCheckBox("disabled", true);
                        }
                    } else {
                        $("#s_p_select_weekends").jqxDropDownList("selectItem", "A");
                        $("#s_p_overwriteWeekend").jqxCheckBox("disabled", true);
                    }

                    if (parameters.Series[sel_num].LeadLag != undefined) {
                        $("#s_p_lagNum").jqxFormattedInput("val", parameters.Series[sel_num].LeadLag);
                        $("#leadOption").jqxCheckBox("checked", true);
                    } else {
                        $("#s_p_lagNum").jqxFormattedInput("val", "0");
                        $("#leadOption").jqxCheckBox("checked", false);
                    }
                } else {
                    dialogWindow("First select the required series from the 'Values Table' tab by clicking in their column name cells in row two.", "error");
                }
            }
        });

        $("#btnCancelBates").jqxButton({
            width: '65',
            height: '31px',
            textPosition: "center"
        });

        $("#btnCancelBates span").css("left", 13).css("top", 7);

        $("#btnCancelBates").on('click', function() {
            columnsWithHighlightingById = {};
            Object.keys(original_columnsWithHighlightingById).map(function(column) {
                columnsWithHighlightingById[column] = true;
            });
            for (var i = 0; i < columns.length; i++) {
                if (columnsWithHighlightingById[columns[i]["id"]] != undefined) {
                    columns[i]["header"]["buttons"][0]["cssClass"] = "icon-highlight-on";
                } else {
                    if (columns[i]["header"]["buttons"] != undefined) {
                        columns[i]["header"]["buttons"][0]["cssClass"] = "icon-highlight-off";
                    }
                }
            }

            grid.setColumns(columns);
            resizeColumns(grid);
            $('#selectSeriesPopup').jqxWindow('close');
        });


        $('#seriesPropertiesPopup').on('close', function() {
            $('body').removeClass('overlay');
        });

        $('#seriesPropertiesPopup').jqxWindow({
            showCollapseButton: false,
            resizable: false,
            isModal: false,
            height: '470px',
            width: '380px',
            maxHeight: '100%',
            maxWidth: '100%',
            autoOpen: false,
            title: 'Adjust Column Properties'
        });

        $('#seriesPropertiesPopup').on('resized', function(event) {
            $('#seriesPropertiesPopup .jqx-window-content').css("width", "calc(100% - 10px)").css("overflow", "unset");
        });

        $("#btnLoadSeriesProperties").jqxButton({
            width: '65px',
            height: '31px',
            textPosition: "center"
        });

        $("#btnLoadSeriesProperties span").css("left", 24).css("top", 7);

        $("#btnLoadSeriesProperties").on('click', function() {
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                for (var i = 0; i < Object.keys(parameters.Series).length; i++) {
                    var selected = false;
                    var col = "";
                    Object.keys(columnsWithHighlightingById).map(function(column) {
                        const getStr = column.split("-");
                        if (i == getStr[getStr.length - 1]) {
                            selected = true;
                            col = column;
                        }
                    });

                    if (selected == true) {
                        parameters["Series"][i]["Prefill"] = $("#prefill_holiday").jqxCheckBox("checked");
                        parameters["Series"][i]["Fill"] = $("#fill_holiday").jqxCheckBox("checked");
                        parameters["Series"][i]["PostFill"] = $("#postfill_holiday").jqxCheckBox("checked");
                        parameters["Series"][i]["HandleWeekends"] = $("#s_p_select_weekends").jqxDropDownList('val');
                        if ($("#leadOption").jqxCheckBox("checked") == true) {
                            parameters["Series"][i]["LeadLag"] = parseInt($("#s_p_lagNum").val());
                        } else {
                            delete parameters["Series"][i]["LeadLag"];
                        }

                        var handleWeekend = "";
                        var simulated = "";
                        if (parameters.Series[i].HandleWeekends != undefined && parameters.Series[i].HandleWeekends == "5") {
                            handleWeekend = "(W/E: 5) ";
                        } else if (parameters.Series[i].HandleWeekends != undefined && parameters.Series[i].HandleWeekends == "5+") {
                            if ($("#s_p_overwriteWeekend").jqxCheckBox("checked") == true) {
                                handleWeekend = "(W/E: 5+/o) ";
                            } else {
                                handleWeekend = "(W/E: 5+) ";
                            }
                        } else if (parameters.Series[i].HandleWeekends != undefined && parameters.Series[i].HandleWeekends == "5-") {
                            if ($("#s_p_overwriteWeekend").jqxCheckBox("checked") == true) {
                                handleWeekend = "(W/E: 5-/o) ";
                            } else {
                                handleWeekend = "(W/E: 5-) ";
                            }
                        } else if (parameters.Series[i].HandleWeekends != undefined && parameters.Series[i].HandleWeekends == "7") {
                            handleWeekend = "(W/E: 7) ";
                        } else if (parameters.Series[i].HandleWeekends != undefined && parameters.Series[i].HandleWeekends == "7f") {
                            handleWeekend = "(W/E: 7f) ";
                        } else {
                            handleWeekend = "";
                        }

                        if (parameters.Series[i].LeadLag != undefined && parameters.Series[i].LeadLag > 0) {
                            handleWeekend += "(Lead: " + parameters.Series[i].LeadLag + ")<br>";
                        } else if (parameters.Series[i].LeadLag != undefined && parameters.Series[i].LeadLag < 0) {
                            handleWeekend += "(Lag: " + parameters.Series[i].LeadLag + ")<br>";
                        } else {
                            if (handleWeekend != "") {
                                handleWeekend += "<br>";
                            }
                        }

                        if (parameters.Series[i].Prefill != undefined && parameters.Series[i].Fill != undefined && parameters.Series[i].PostFill != undefined) {
                            if (parameters.Series[i].Prefill == true || parameters.Series[i].Fill == true || parameters.Series[i].PostFill == true) {
                                handleWeekend += "Fill: ";

                                if (parameters.Series[i].Prefill == true) {
                                    handleWeekend += "Pre";
                                }

                                if (parameters.Series[i].Fill == true) {
                                    if (parameters.Series[i].Prefill == true) {
                                        handleWeekend += "/";
                                    }
                                    handleWeekend += "Fill";
                                }

                                if (parameters.Series[i].PostFill == true) {
                                    if (parameters.Series[i].Prefill == true || parameters.Series[i].Fill == true) {
                                        handleWeekend += "/";
                                    }
                                    handleWeekend += "Post";
                                }
                            }
                        }

                        // if(response_json.Columns[i].Simulated != undefined){
                        if (response_json.Columns[i].Simulated != undefined && response_json.Columns[i].Simulated == true) {
                            simulated += "(SIMULATED)";
                        }

                        if (response_json.Columns[i].Status == 204) {
                            if (simulated != "") {
                                simulated += "<br>";
                            }
                            simulated += "(No Access)";
                        } else if (response_json.Columns[i].Status == 206) {
                            if (simulated != "") {
                                simulated += "<br>";
                            }
                            simulated += "(Partial Access)";
                        } else if (response_json.Columns[i].Status == 200) {
                            simulated += "";
                        } else {
                            if (simulated != "") {
                                simulated += "<br>";
                            }
                            simulated += "(Status Error: " + response_json.Columns[getID].Status + ")";
                        }

                        for (var j = 0; j < columns.length; j++) {
                            if (columns[j].id == col) {
                                columns[j].name = bates[i].name + "<br><span class='extraInfo' id='handleWeekend-" + col + "'>" + handleWeekend + "<p style='color:red'>" + simulated + "</p></span>";
                            }
                        }
                    }
                }

                grid.setColumns(columns);
                $(".icon-highlight-on").parent(".slick-header-column").css("background-color", "#94e9f7fa").css("color", "#0574b6");
                // $('#jqxgrid .extraInfo').parents('.slick-column-name').css('float', "unset");

                if ($("#updateToJson_seriesProperties").jqxCheckBox("checked") == true) {
                    $('#seriesPropertiesPopup').jqxWindow('close');
                    $("#jqxLoader").jqxLoader('open');
                    setTimeout(() => {
                        ShowJSReport(parameters, true);
                        $("#jqxLoader").jqxLoader('close');
                    }, 250);
                } else {
                    $('#seriesPropertiesPopup').jqxWindow('close');
                    dialogWindow("Some settings cannot update until the market data is reloaded.<br>Would you like to reload the market data now?", 'query', 'confirm', null,
                        function() {
                            $("#jqxLoader").jqxLoader('open');
                            setTimeout(() => {
                                ShowJSReport(parameters, true);
                                $("#jqxLoader").jqxLoader('close');
                            }, 50);
                        },
                        function() {
                            $("#jqxLoader").jqxLoader('open');
                            setTimeout(() => {
                                ShowJSReport(parameters, false);
                                $("#jqxLoader").jqxLoader('close');
                            }, 50);
                        }, null, {
                            Ok: 'Yes',
                            Cancel: 'No'
                        }
                    );
                }
            }
        });

        $("#btnCancelSeriesProperties").jqxButton({
            width: '65px',
            height: '31px',
            textPosition: "center"
        });

        $("#btnCancelSeriesProperties span").css("left", 13).css("top", 7);

        $("#btnCancelSeriesProperties").on('click', function() {
            $('#seriesPropertiesPopup').jqxWindow('close');
        });


        $('#fillPopup').on('close', function() {
            $('body').removeClass('overlay');
        });

        $('#fillPopup').jqxWindow({
            showCollapseButton: false,
            resizable: false,
            isModal: false,
            height: '452px',
            width: '380px',
            maxHeight: '100%',
            maxWidth: '100%',
            autoOpen: false,
            title: 'Fill Settings'
        });

        $('#fillPopup').on('resized', function(event) {
            $('#fillPopup .jqx-window-content').css("width", "calc(100% - 10px)").css("overflow", "unset");
        });

        $("#btnLoadFill").jqxButton({
            width: '65px',
            height: '31px',
            textPosition: "center"
        });

        $("#btnLoadFill span").css("left", 24).css("top", 7);

        $("#btnLoadFill").on('click', function() {
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                parameters.FillOptions.Type = $("#select_fillType").jqxDropDownList('val');
                parameters.FillOptions.Style = $("#select_fillStyle").jqxDropDownList('val');
                parameters.FillOptions.Leading = $("#fillLeading").jqxCheckBox("checked")
                parameters.FillOptions.Trailing = $("#fillTrailing").jqxCheckBox("checked")
                parameters.Sparse = $("#sparse").jqxCheckBox("checked")

                // if ($("#allowWeekend").jqxCheckBox("checked") == true) {
                //     parameters["FrequencyOptions"]["ReturnWeekends"] = "on";
                // }
                // else {
                //     parameters["FrequencyOptions"]["ReturnWeekends"] = "off";
                // }

                if ($("#updateToJson_fill").jqxCheckBox("checked") == true) {
                    $('#fillPopup').jqxWindow('close');
                    $("#jqxLoader").jqxLoader('open');
                    setTimeout(() => {
                        ShowJSReport(parameters, true);
                        $("#jqxLoader").jqxLoader('close');
                    }, 250);
                } else {
                    $('#fillPopup').jqxWindow('close');
                    dialogWindow("Some settings cannot update until the market data is reloaded.<br>Would you like to reload the market data now?", 'query', 'confirm', null,
                        function() {
                            $("#jqxLoader").jqxLoader('open');
                            setTimeout(() => {
                                ShowJSReport(parameters, true);
                                $("#jqxLoader").jqxLoader('close');
                            }, 50);
                        },
                        function() {
                            $("#jqxLoader").jqxLoader('open');
                            setTimeout(() => {
                                ShowJSReport(parameters, false);
                                $("#jqxLoader").jqxLoader('close');
                            }, 50);
                        }, null, {
                            Ok: 'Yes',
                            Cancel: 'No'
                        }
                    );
                }
            }
        });

        $("#btnCancelFill").jqxButton({
            width: '65px',
            height: '31px',
            textPosition: "center"
        });

        $("#btnCancelFill span").css("left", 13).css("top", 7);

        $("#btnCancelFill").on('click', function() {
            $('#fillPopup').jqxWindow('close');
        });


        $('#frequencyPopup').on('close', function() {
            $('body').removeClass('overlay');
        });

        $('#frequencyPopup').jqxWindow({
            showCollapseButton: false,
            resizable: false,
            isModal: false,
            height: '450px',
            width: '380px',
            maxHeight: '100%',
            maxWidth: '100%',
            autoOpen: false,
            title: 'Average Defaults'
        });

        $('#frequencyPopup').on('resized', function(event) {
            $('#frequencyPopup .jqx-window-content').css("width", "calc(100% - 10px)").css("overflow", "unset");
        });

        $("#btnLoadFrequency").jqxButton({
            width: '65px',
            height: '31px',
            textPosition: "center"
        });

        $("#btnLoadFrequency span").css("left", 24).css("top", 7);

        $("#btnLoadFrequency").on('click', function() {
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                var value = $("#select_frequency").jqxDropDownList('val');
                let freq = value.replace(/[^A-Z]/g, '').toLowerCase();

                if (freq == "d") {
                    parameters.Frequency = freq;
                    delete parameters["FrequencyOptions"]["StartDay"];
                    delete parameters["FrequencyOptions"]["EndDay"];
                    delete parameters["FrequencyOptions"]["StartDay2"];
                    delete parameters["FrequencyOptions"]["EndDay2"];
                } else if (freq == "w") {
                    delete parameters["FrequencyOptions"]["EndDay"];
                    delete parameters["FrequencyOptions"]["StartDay2"];
                    delete parameters["FrequencyOptions"]["EndDay2"];

                    if ($("#custom_frequency").jqxCheckBox("checked") == false) {
                        parameters.Frequency = freq;
                        delete parameters["FrequencyOptions"]["StartDay"];
                    } else {
                        parameters.Frequency = "c" + freq;
                        parameters["FrequencyOptions"]["StartDay"] = $("#week_begins").jqxDropDownList('val');
                    }
                } else if (freq == "hm") {
                    if ($("#custom_frequency").jqxCheckBox("checked") == false) {
                        parameters.Frequency = freq;
                        delete parameters["FrequencyOptions"]["StartDay"];
                        delete parameters["FrequencyOptions"]["EndDay"];
                        delete parameters["FrequencyOptions"]["StartDay2"];
                        delete parameters["FrequencyOptions"]["EndDay2"];
                    } else {
                        parameters.Frequency = "c" + freq;
                        parameters["FrequencyOptions"]["StartDay"] = $("#fq_periods1").val();
                        parameters["FrequencyOptions"]["EndDay"] = $("#fq_periods_to1").val();
                        parameters["FrequencyOptions"]["StartDay2"] = $("#fq_periods2").val();
                        parameters["FrequencyOptions"]["EndDay2"] = $("#fq_periods_to2").val();
                    }
                } else if (freq == "m" || freq == "q" || freq == "hy" || freq == "y") {
                    delete parameters["FrequencyOptions"]["StartDay2"];
                    delete parameters["FrequencyOptions"]["EndDay2"];

                    if ($("#custom_frequency").jqxCheckBox("checked") == false) {
                        parameters.Frequency = freq;
                        delete parameters["FrequencyOptions"]["StartDay"];
                        delete parameters["FrequencyOptions"]["EndDay"];
                    } else {
                        parameters.Frequency = "c" + freq;
                        parameters["FrequencyOptions"]["StartDay"] = $("#fq_m_periods").val();
                        parameters["FrequencyOptions"]["EndDay"] = $("#fq_m_periods_to").val();
                    }
                }

                parameters.FrequencyOptions.HandleWeekends = $("#select_weekends").jqxDropDownList('val')

                if (parameters.Frequency != "d" && parameters.Frequency != "cd") {
                    parameters["FrequencyOptions"]["UseFirstDate"] = $("#firstDate_averages").jqxCheckBox("checked");
                } else {
                    delete parameters["FrequencyOptions"]["UseFirstDate"];
                }

                // if ($("#firstDate_averages").jqxCheckBox("checked") == true) {
                //     parameters["FrequencyOptions"]["ReturnWeekends"] = "on";
                // }
                // else {
                //     parameters["FrequencyOptions"]["ReturnWeekends"] = "off";
                // }

                if ($("#weekendDate_averages").jqxCheckBox("checked") == true) {
                    parameters["FrequencyOptions"]["ReturnWeekends"] = "on";
                    // $("#hideDropdown1").jqxDropDownList("checkIndex", 1);
                } else {
                    parameters["FrequencyOptions"]["ReturnWeekends"] = "off";
                    // $("#hideDropdown1").jqxDropDownList("uncheckIndex", 1);
                }

                if ($("#updateToJson_frequency").jqxCheckBox("checked") == true) {
                    $('#frequencyPopup').jqxWindow('close');
                    $("#jqxLoader").jqxLoader('open');
                    setTimeout(() => {
                        ShowJSReport(parameters, true);
                        $("#jqxLoader").jqxLoader('close');
                    }, 250);
                } else {
                    $('#frequencyPopup').jqxWindow('close');
                    dialogWindow("Some settings cannot update until the market data is reloaded.<br>Would you like to reload the market data now?", 'query', 'confirm', null,
                        function() {
                            $("#jqxLoader").jqxLoader('open');
                            setTimeout(() => {
                                ShowJSReport(parameters, true);
                                $("#jqxLoader").jqxLoader('close');
                            }, 50);
                        },
                        function() {
                            $("#jqxLoader").jqxLoader('open');
                            setTimeout(() => {
                                ShowJSReport(parameters, false);
                                $("#jqxLoader").jqxLoader('close');
                            }, 50);
                        }, null, {
                            Ok: 'Yes',
                            Cancel: 'No'
                        }
                    );
                }
            }
        });

        $("#btnCancelFrequency").jqxButton({
            width: '65px',
            height: '31px',
            textPosition: "center"
        });

        $("#btnCancelFrequency span").css("left", 13).css("top", 7);

        $("#btnCancelFrequency").on('click', function() {
            $('#frequencyPopup').jqxWindow('close');
        });

        $('#dateRangeTabs').jqxTabs({
            width: '100%',
            height: '100%',
            position: 'top',
            keyboardNavigation: false
        });

        $('#frequencyTabs').jqxTabs({
            width: '100%',
            height: '100%',
            position: 'top',
            keyboardNavigation: false
        });

        // $('#fillTabs').jqxTabs({
        //     width: '100%',
        //     height: '100%',
        //     position: 'top',
        //     keyboardNavigation: false
        // });

        $('#seriesPropertiesTabs').jqxTabs({
            width: '100%',
            height: '100%',
            position: 'top',
            keyboardNavigation: false
        });

        $("#select_frequency").jqxDropDownList({
            source: frequency,
            displayMember: "name",
            valueMember: "value",
        //    width: 235,
			width:  "calc(100% - 22px)",
            height: 24,
            dropDownHeight: 185,
            placeHolder: "Average",
            selectedIndex: 0
        });

        $("#select_frequency").on('change', function(event) {
            var args = event.args;
            var frame;
            if (args) {
                if(!$('#average_panel').hasClass('disable')){
                    $('#average_panel').addClass('disable')
                    console.log('loaded');
                }
                let freq = args.item.value.replace(/[^A-Z]/g, '').toLowerCase();
                $('.firstDate_averages').show();
                if (freq == "w") {
                    $('#frequency_panel').css("display", "block");
                    frame = $('<table style="width: 290px; margin: auto;"><tr><td style="padding-left: 15px;"><label style="float:left; padding-right: 10px; line-height: 23px;">Week begins on:</label><br><div id="week_begins" style="margin-left:20px; box-shadow: 0px 0 1px rgb(0 0 0 / 25%);"></div></td></tr><tr><td style="text-align:center; padding:10px 0px 10px 0px; color:#666;">Default is Monday (ISO-8601)</td></tr></table>');
                    $('#average_panel').html(frame);
                    $('#frequency_title').html("<div id='custom_frequency' style='float:left'></div>Create Custom Week");
                    $("#custom_frequency").jqxCheckBox({ width: 25, height: 25 });

                    $("#custom_frequency").on('change', function(event) {                       
                        if ($("#custom_frequency").jqxCheckBox("checked") == false) {
                            $('#average_panel').addClass('disable')                          
                            $("#week_begins").jqxDropDownList('selectItem', 1);
                            $("#week_begins").jqxDropDownList('disabled', true);
                        } else {
                            $('#average_panel').removeClass('disable')
                            $("#week_begins").jqxDropDownList('disabled', true);
                        }
                    });

                    var weeks = [{
                            name: 'Sunday',
                            value: 7
                        },
                        {
                            name: 'Monday',
                            value: 1
                        },
                        {
                            name: 'Tuesday',
                            value: 2
                        },
                        {
                            name: 'Wednesday',
                            value: 3
                        },
                        {
                            name: 'Thursday',
                            value: 4
                        },
                        {
                            name: 'Friday',
                            value: 5
                        },
                        {
                            name: 'Saterday',
                            value: 6
                        }
                    ];

                    $("#week_begins").jqxDropDownList({
                        source: weeks,
                        displayMember: "name",
                        valueMember: "value",
                        width: "calc(100% - 55px)",
                        height: 24,
                        dropDownHeight: 185,
                        placeHolder: "Average",
                        selectedIndex: 1
                    });

                    if (parameters.FrequencyOptions.StartDay != undefined) {
                        $("#week_begins").jqxDropDownList('selectItem', parameters.FrequencyOptions.StartDay);
                    } else {
                        $("#week_begins").jqxDropDownList('disabled', true);
                    }
                } else if (freq == "hm") {
                    $('#frequency_panel').css("display", "block");
                    frame = $('<table style="width: 290px; margin: auto;"><tr><td style="width:158px; padding-left: 15px; height: 40px;"><label style="float:left; line-height: 23px;">Period 1&nbsp;&nbsp;&nbsp;&nbsp;</label><div id="fq_periods1" style="float:left;"><input type="text" style="text-align: center;"/><div></div></div></td><td style="padding-left: 10px;"><label style="float:left; line-height: 23px;">to&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label><div id="fq_periods_to1" style="float:left"><input type="text" style="text-align: center;"/><div></div></div><br></td></tr><tr><td style="padding-left: 15px; height: 40px;"><label style="float:left; line-height: 23px;">Period 2&nbsp;&nbsp;&nbsp;&nbsp;</label><div id="fq_periods2" style="float:left"><input type="text" style="text-align: center;"/><div></div></div><br></td><td style="padding-left: 10px;"><label style="float:left; line-height: 23px;">to&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label><div id="fq_periods_to2" style="float: left;"><input type="text" style="text-align: center;"/><div></div></div><br></td></tr><tr><td colspan=2 style="text-align:center; padding:10px 0px 10px 0px; color:#666;">Default half month ranges are 1-15 - 16-31</td></tr></table>');
                    $('#average_panel').html(frame);
                    $('#frequency_title').html("<div id='custom_frequency' style='float:left'></div>Create Custom Half Month");
                    $("#custom_frequency").jqxCheckBox({ width: 25, height: 25 });

                    $("#fq_periods1").jqxFormattedInput({ width: 70, height: 25, radix: "decimal", value: "1", min: "1", max: "15", spinButtons: true });
                    $("#fq_periods_to1").jqxFormattedInput({ width: 70, height: 25, radix: "decimal", value: "15", min: "1", max: "31", spinButtons: true });
                    $("#fq_periods2").jqxFormattedInput({ width: 70, height: 25, radix: "decimal", value: "16", min: "1", max: "31", spinButtons: true });
                    $("#fq_periods_to2").jqxFormattedInput({ width: 70, height: 25, radix: "decimal", value: "31", min: "16", max: "31", spinButtons: true });

                    $("#custom_frequency").on('change', function(event) {
                        if ($("#custom_frequency").jqxCheckBox("checked") == false) {
                            $('#average_panel').addClass('disable')                            
                            $("#fq_periods1").jqxFormattedInput("val", 1);
                            $("#fq_periods1").jqxFormattedInput('disabled', true);
                            $("#fq_periods_to1").jqxFormattedInput("val", 15);
                            $("#fq_periods_to1").jqxFormattedInput('disabled', true);
                            $("#fq_periods2").jqxFormattedInput("val", 16);
                            $("#fq_periods2").jqxFormattedInput('disabled', true);
                            $("#fq_periods_to2").jqxFormattedInput("val", 31);
                            $("#fq_periods_to2").jqxFormattedInput('disabled', true);
                        } else {
                            $('#average_panel').removeClass('disable')
                            $("#fq_periods1").jqxFormattedInput('disabled', false);
                            $("#fq_periods_to1").jqxFormattedInput('disabled', false);
                            $("#fq_periods2").jqxFormattedInput('disabled', false);
                            $("#fq_periods_to2").jqxFormattedInput('disabled', false);
                        }
                    });

                    $("#fq_periods_to1").on("change", function(event) {
                        var args = event.args;
                        var value = args.value;

                        if (value >= parseInt($("#fq_periods1").val())) {
                            $("#fq_periods1").jqxFormattedInput("max", value);
                        }
                    });

                    $("#fq_periods1").on("change", function(event) {
                        var args = event.args;
                        var value = args.value;

                        if (value < parseInt($("#fq_periods_to1").val())) {
                            $("#fq_periods_to1").jqxFormattedInput("min", value);
                        }
                    });

                    $("#fq_periods_to2").on("change", function(event) {
                        var args = event.args;
                        var value = args.value;

                        if (value >= parseInt($("#fq_periods2").val())) {
                            $("#fq_periods2").jqxFormattedInput("max", value);
                        }
                    });

                    $("#fq_periods2").on("change", function(event) {
                        var args = event.args;
                        var value = args.value;

                        if (value < parseInt($("#fq_periods_to2").val())) {
                            $("#fq_periods_to2").jqxFormattedInput("min", value);
                        }
                    });

                    if (parameters.FrequencyOptions.StartDay != undefined) {
                        $("#fq_periods1").jqxFormattedInput('val', parameters.FrequencyOptions.StartDay);
                    } else {
                        $("#fq_periods1").jqxFormattedInput('disabled', true);
                    }

                    if (parameters.FrequencyOptions.EndDay != undefined) {
                        $("#fq_periods_to1").jqxFormattedInput('val', parameters.FrequencyOptions.EndDay);
                    } else {
                        $("#fq_periods_to1").jqxFormattedInput('disabled', true);
                    }

                    if (parameters.FrequencyOptions.StartDay2 != undefined) {
                        $("#fq_periods2").jqxFormattedInput('val', parameters.FrequencyOptions.StartDay2);
                    } else {
                        $("#fq_periods2").jqxFormattedInput('disabled', true);
                    }

                    if (parameters.FrequencyOptions.EndDay2 != undefined) {
                        $("#fq_periods_to2").jqxFormattedInput('val', parameters.FrequencyOptions.EndDay2);
                    } else {
                        $("#fq_periods_to2").jqxFormattedInput('disabled', true);
                    }
                } else if (freq == "m" || freq == "q" || freq == "hy" || freq == "y") {
                    $('#frequency_panel').css("display", "block");
                    frame = $('<table style="width: 290px; margin: auto;"><tr><td style="width:50%; padding-right: 10px; height: 40px;"><label style="float:right; line-height: 23px;">Start Day:&nbsp;&nbsp;&nbsp;&nbsp;</label></td><td style="width:50%; padding-left: 10px;"><div id="fq_m_periods" style="float:left"><input type="text" style="text-align: center;"/><div></div></div></td></tr><tr><td style="padding-right: 10px; height: 40px;"><label style="float:right; line-height: 23px;">End Day:&nbsp;&nbsp;&nbsp;&nbsp;</label></td><td style="padding-left: 10px;"><div id="fq_m_periods_to" style="float: left;"><input type="text" style="text-align: center;"/><div></div></div></td></tr><tr><td colspan=2 style="text-align:center; padding:10px 0px 10px 0px; " class="comments-text">Default month day range is 1-31</td></tr></table>');
                    $('#average_panel').html(frame);

                    if (freq == "m") {
                        $('#frequency_title').html("<div id='custom_frequency' style='float:left'></div>Create Custom Month");
                    } else if (freq == "q") {
                        $('#frequency_title').html("<div id='custom_frequency' style='float:left'></div>Create Custom Quarter Year");
                    } else if (freq == "hy") {
                        $('#frequency_title').html("<div id='custom_frequency' style='float:left'></div>Create Custom Half Year");
                    } else if (freq == "y") {
                        $('#frequency_title').html("<div id='custom_frequency' style='float:left'></div>Create Custom Year");
                    }

                    $("#custom_frequency").jqxCheckBox({ width: 25, height: 25 });

                    $("#fq_m_periods").jqxFormattedInput({ width: 70, height: 25, radix: "decimal", value: "1", min: "1", max: "31", spinButtons: true });
                    $("#fq_m_periods_to").jqxFormattedInput({ width: 70, height: 25, radix: "decimal", value: "31", min: "1", max: "31", spinButtons: true });

                    $("#custom_frequency").on('change', function(event) {
                        if ($("#custom_frequency").jqxCheckBox("checked") == false) {
                            $('#average_panel').addClass('disable')
                            $("#fq_m_periods").jqxFormattedInput("val", 1);
                            $("#fq_m_periods").jqxFormattedInput('disabled', true);
                            $("#fq_m_periods_to").jqxFormattedInput("val", 31);
                            $("#fq_m_periods_to").jqxFormattedInput('disabled', true);
                        } else {
                            $('#average_panel').removeClass('disable')
                            $("#fq_m_periods").jqxFormattedInput('disabled', false);
                            $("#fq_m_periods_to").jqxFormattedInput('disabled', false);
                        }
                    });

                    $("#fq_m_periods_to").on("change", function(event) {
                        var args = event.args;
                        var value = args.value;

                        if (value >= parseInt($("#fq_m_periods").val())) {
                            $("#fq_m_periods").jqxFormattedInput("max", value);
                        }
                    });

                    $("#fq_m_periods").on("change", function(event) {
                        var args = event.args;
                        var value = args.value;

                        if (value < parseInt($("#fq_m_periods_to").val())) {
                            $("#fq_m_periods_to").jqxFormattedInput("min", value);
                        }
                    });

                    if (parameters.FrequencyOptions.StartDay != undefined) {
                        $("#fq_m_periods").jqxFormattedInput('val', parameters.FrequencyOptions.StartDay);
                    } else {
                        $("#fq_m_periods").jqxFormattedInput('disabled', true);
                    }

                    if (parameters.FrequencyOptions.EndDay != undefined) {
                        $("#fq_m_periods_to").jqxFormattedInput('val', parameters.FrequencyOptions.EndDay);
                    } else {
                        $("#fq_m_periods_to").jqxFormattedInput('disabled', true);
                    }
                } else if (freq == "d") {
                    $('#frequency_panel').css("display", "none");
                    $('.firstDate_averages').hide();
                }
            }
        });

        var fillType = [{
                name: 'Previous Value',
                value: 'previous',
                hint: 'Use the previous value.'
            },
            {
                name: 'Mid Point',
                value: 'midpoint',
                hint: 'Mid-way between the previous and next values.'
            },
            {
                name: 'Interpolated',
                value: 'interpolate',
                hint: 'Curve fitted values between the previous and next values.'
            }
        ];

        $("#select_fillType").jqxDropDownList({
            source: fillType,
            displayMember: "name",
            valueMember: "value",
            width: "calc(100% - 38px)",
            height: 24,
            dropDownHeight: 83,
            placeHolder: "Average",
            selectedIndex: 0
        });

        $('#select_fillType').jqxDropDownList({
            renderer: function(index, label, value) {
                var datarecord = fillType[index];
                return "<p title='" + datarecord.hint + "'>" + datarecord.name + "</p>";
            }
        });

        $("#select_fillType").on('change', function(event) {
            var args = event.args;
            if (args) {
                $("#fill_hint").html(fillType[args.index]["name"] + ": " + fillType[args.index]["hint"]);
            }
        });

        var fillStyle = [{
                name: 'Null',
                value: 'null'
            },
            {
                name: 'NA',
                value: 'na'
            },
            {
                name: 'Both',
                value: 'both'
            }
        ];

        $("#select_fillStyle").jqxDropDownList({
            source: fillStyle,
            displayMember: "name",
            valueMember: "value",
            width: "calc(100% - 28px)",
            height: 24,
            dropDownHeight: 83,
            placeHolder: "Average",
            selectedIndex: 0
        });

        $("#select_fillStyle").on('change', function(event) {
            var args = event.args;
            if (args) {
                // $("#fill_hint").html(fillType[args.index]["name"] + ": " + fillType[args.index]["hint"]);
            }
        });

        var handleWeekends = [{
                name: 'As reported',
                value: 'A',
                hint: 'Use weekends if in the source dataset. All datasets are adjusted if weekends are found in any dataset.'
            },
            {
                name: '5 Day (No W/E)',
                value: '5',
                hint: 'All weekend values are removed from the source dataset.'
            },
            {
                name: '5 Day (W/E+ to Monday)',
                value: '5+',
                hint: 'Force the Monday value to be overwritten by a valid weekend value.'
            },
            {
                name: '5 Day (W/E- to Friday)',
                value: '5-',
                hint: 'Move weekend values to the previous Friday (if empty). The Saturday value is used only if the Sunday has no value.'
            },
            {
                name: '7 Day (Added empty W/E)',
                value: '7',
                hint: 'Add weekend dates containing no (null) values.'
            },
            {
                name: '7 day (Added filled W/E)',
                value: '7f',
                hint: 'Add weekend dates filled using the selected fill type.'
            }
        ];

        $("#select_weekends").jqxDropDownList({
            source: handleWeekends,
            displayMember: "name",
            valueMember: "value",
            width: "calc(100% - 22px)",
            height: 24,
            dropDownHeight: 160,
            placeHolder: "Average",
            selectedIndex: 0
        });

       

        $('#select_weekends').jqxDropDownList({
            renderer: function(index, label, value) {
                var datarecord = handleWeekends[index];
                return "<p title='" + datarecord.hint + "'>" + datarecord.name + "</p>";
            }
        });
       
      
        $("#select_weekends").on('change', function(event) {
            var args = event.args;
            if (args) {
                if (args.item.value == "5+" || args.item.value == "5-") {
                    $("#overwriteWeekend").jqxCheckBox("disabled", false);
                    // if($('#overwriteWeekend').hasClass('hidden'))
                    $("#overwriteWeekend").removeClass('hidden');   
                } else {
                    $("#overwriteWeekend").jqxCheckBox("checked", false);
                    $("#overwriteWeekend").jqxCheckBox("disabled", true);
                    $("#overwriteWeekend").addClass('hidden');                
                }

                if (args.item.value == "A") {
                    $("#weekends_hint").html("Use weekends if in the source dataset. All datasets are adjusted if weekends are found in any dataset.");
                } else if (args.item.value == "5") {
                    $("#weekends_hint").html("All weekend values are removed from the source dataset.");
                } else if (args.item.value == "5+") {
                    if ($("#overwriteWeekend").jqxCheckBox("checked") == true) {
                        $("#weekends_hint").html("Force (valid) weekend values to the next Monday. A (valid) Saturday value is used only if the Sunday has no value.");
                    } else {
                        $("#weekends_hint").html("Move (valid) weekend values to the next Monday (if empty). A (valid) Saturday value is used only if the Sunday has no value.");
                    }
                } else if (args.item.value == "5-") {
                    if ($("#overwriteWeekend").jqxCheckBox("checked") == true) {
                        $("#weekends_hint").html("Force (valid) weekend values to the previous Friday. A (valid) Saturday value is used only if the Sunday has no value.");
                    } else {
                        $("#weekends_hint").html("Move (valid) weekend values to the previous Friday (if empty). A (valid) Saturday value is used only if the Sunday has no value.");
                    }
                } else if (args.item.value == "7") {
                    $("#weekends_hint").html("Add weekend dates containing no (null) values.");
                } else if (args.item.value == "7f") {
                    $("#weekends_hint").html("Add weekend dates filled using the selected fill type.");
                }


                // if (args.item.value == "5") {
                //     $("#weekendLabel").html("All weekend values are removed from the source data");
                // }
                // else if (args.item.value == "5+") {
                //     $("#weekendLabel").html("Move weekend values to the next Monday.");
                // }
                // else if (args.item.value == "5-") {
                //     $("#weekendLabel").html("Move weekend values to the previous Friday.");
                // }
                // else if (args.item.value == "7") {
                //     $("#weekendLabel").html("Add weekend dates containing no (null) values.");
                // }
                // else if (args.item.value == "7f") {
                //     var fillType = "";
                //     if (parameters.FillOptions.Type == "previous") {
                //         fillType = "Previous Value";
                //     }
                //     else if (parameters.FillOptions.Type == "midpoint") {
                //         fillType = "Mid Point";
                //     }
                //     else {
                //         fillType = "Interpolated";
                //     }
                //     $("#weekendLabel").html("Add weekend dates filled using the selected '" + fillType + "' fill type.");
                // }
                // else if (args.item.value == "A") {
                //     $("#weekendLabel").html("Add weekend dates filled using the selected 'Previous Value' fill type.");
                // }
            }
        });
        $("#overwriteWeekend").addClass('hidden');
        

        $("#overwriteWeekend").on('change', function(event) {
            var checked = event.args.checked;
            if (checked == true) {
                if ($("#select_weekends").jqxDropDownList("val") == "5+") {
                    $("#weekends_hint").html("Force (valid) weekend values to the next Monday. A (valid) Saturday value is used only if the Sunday has no value.");
                } else if ($("#select_weekends").jqxDropDownList("val") == "5-") {
                    $("#weekends_hint").html("Force (valid) weekend values to the previous Friday. A (valid) Saturday value is used only if the Sunday has no value.");
                }
            } else {
                if ($("#select_weekends").jqxDropDownList("val") == "5+") {
                    $("#weekends_hint").html("Move (valid) weekend values to the next Monday (if empty). A (valid) Saturday value is used only if the Sunday has no value.");
                } else if ($("#select_weekends").jqxDropDownList("val") == "5-") {
                    $("#weekends_hint").html("Move (valid) weekend values to the previous Friday (if empty). A (valid) Saturday value is used only if the Sunday has no value.");
                }
            }
        });

        $("#s_p_select_weekends").jqxDropDownList({
            source: handleWeekends,
            displayMember: "name",
            valueMember: "value",
            width: "calc(100% - 28px)",
            height: 24,
            dropDownHeight: 160,
            placeHolder: "Average",
            selectedIndex: 0
        });

        $("#s_p_select_weekends").on('change', function(event) {
            var args = event.args;
            if (args) {
                if (args.item.value == "5+" || args.item.value == "5-") {
                    $("#s_p_overwriteWeekend").jqxCheckBox("disabled", false);
                    $("#s_p_overwriteWeekend").jqxCheckBox("checked", false);
                } else {
                    $("#s_p_overwriteWeekend").jqxCheckBox("disabled", true);
                    $("#s_p_overwriteWeekend").jqxCheckBox("checked", false);
                }

                if (args.item.value == "A") {
                    $("#weekends_hint1").html("Use weekends if in the source dataset. All datasets are adjusted if weekends are found in any dataset.");
                } else if (args.item.value == "5") {
                    $("#weekends_hint1").html("All weekend values are removed from the source dataset.");
                } else if (args.item.value == "5+") {
                    if ($("#s_p_overwriteWeekend").jqxCheckBox("checked") == true) {
                        $("#weekends_hint1").html("Force (valid) weekend values to the next Monday. A (valid) Saturday value is used only if the Sunday has no value.");
                    } else {
                        $("#weekends_hint1").html("Move (valid) weekend values to the next Monday (if empty). A (valid) Saturday value is used only if the Sunday has no value.");
                    }
                } else if (args.item.value == "5-") {
                    if ($("#s_p_overwriteWeekend").jqxCheckBox("checked") == true) {
                        $("#weekends_hint1").html("Force (valid) weekend values to the previous Friday. A (valid) Saturday value is used only if the Sunday has no value.");
                    } else {
                        $("#weekends_hint1").html("Move (valid) weekend values to the previous Friday (if empty). A (valid) Saturday value is used only if the Sunday has no value.");
                    }
                } else if (args.item.value == "7") {
                    $("#weekends_hint1").html("Add weekend dates containing no (null) values.");
                } else if (args.item.value == "7f") {
                    $("#weekends_hint1").html("Add weekend dates filled using the selected fill type.");
                }

                // if (args.item.value == "5") {
                //     $("#s_p_WeekendLabel").html("All weekend values are removed from the source data");
                // }
                // else if (args.item.value == "5+") {
                //     $("#s_p_WeekendLabel").html("Move weekend values to the next Monday.");
                // }
                // else if (args.item.value == "5-") {
                //     $("#s_p_WeekendLabel").html("Move weekend values to the previous Friday.");
                // }
                // else if (args.item.value == "7") {
                //     $("#s_p_WeekendLabel").html("Add weekend dates containing no (null) values.");
                // }
                // else if (args.item.value == "7f") {
                //     var fillType = "";
                //     if (parameters.FillOptions.Type == "previous") {
                //         fillType = "Previous Value";
                //     }
                //     else if (parameters.FillOptions.Type == "midpoint") {
                //         fillType = "Mid Point";
                //     }
                //     else {
                //         fillType = "Interpolated";
                //     }
                //     $("#s_p_WeekendLabel").html("Add weekend dates filled using the selected '" + fillType + "' fill type.");
                // }
                // else if (args.item.value == "A") {
                //     $("#s_p_WeekendLabel").html("Add weekend dates filled using the selected 'Previous Value' fill type.");
                // }
            }
        });

        $("#s_p_overwriteWeekend").on('change', function(event) {
            var checked = event.args.checked;
            if (checked == true) {
                if ($("#s_p_select_weekends").jqxDropDownList("val") == "5+") {
                    // $("#s_p_WeekendLabel").html("Force weekend values to the next Monday.");
                    $("#weekends_hint1").html("Force (valid) weekend values to the next Monday. A (valid) Saturday value is used only if the Sunday has no value.");
                } else if ($("#s_p_select_weekends").jqxDropDownList("val") == "5-") {
                    // $("#s_p_WeekendLabel").html("Force weekend values to the previous Friday.");
                    $("#weekends_hint1").html("Force (valid) weekend values to the previous Friday. A (valid) Saturday value is used only if the Sunday has no value.");
                }
            } else {
                if ($("#s_p_select_weekends").jqxDropDownList("val") == "5+") {
                    // $("#s_p_WeekendLabel").html("Move weekend values to the next Monday.");
                    $("#weekends_hint1").html("Move (valid) weekend values to the next Monday (if empty). A (valid) Saturday value is used only if the Sunday has no value.");
                } else if ($("#s_p_select_weekends").jqxDropDownList("val") == "5-") {
                    // $("#s_p_WeekendLabel").html("Move weekend values to the previous Friday.");
                    $("#weekends_hint1").html("Move (valid) weekend values to the previous Friday (if empty). A (valid) Saturday value is used only if the Sunday has no value.");
                }
            }
        });

        $("#firstDate_averages").jqxCheckBox({ width: 250, height: 25 });
        $("#weekendDate_averages").jqxCheckBox({ width: 250, height: 25 });
        $("#updateToJson_frequency").jqxCheckBox({ width: 115, height: 25 });

        $("#fillLeading").jqxCheckBox({ height: 25 });
        $("#fillTrailing").jqxCheckBox({ height: 25 });
        $("#sparse").jqxCheckBox({ width: 100, height: 25 });
        $("#overwriteWeekend").jqxCheckBox({ width: 250, height: 25 });
        // $("#allowWeekend").jqxCheckBox({ width: 250, height: 25 });
        $("#updateToJson_fill").jqxCheckBox({ width: 115, height: 25 });

        // $("#leading-help-div").click(function () {
        //     dialogWindow("If true, any leading missing values are filled forward using the previous (valid) value.<br>The fill is applied using the currently selected 'Fill Type' and 'Style' parameters.<br>If no previous value exists no leading fill is used.", "warning");
        // });

        $(".HelpMessage_leading").eq(0).jqxPopover({
            width: 400,
            offset: {
                left: -50,
                top: 0
            },
            arrowOffsetValue: 50,
            title: "Trailing Fill Help",
            showCloseButton: true,
            selector: $("#leading-help-div")
        });

        $(".HelpMessage_trailing").eq(0).jqxPopover({
            width: 400,
            offset: {
                left: -50,
                top: 0
            },
            arrowOffsetValue: 50,
            title: "Leading Fill Help",
            showCloseButton: true,
            selector: $("#trailing-help-div")
        });

        $(".HelpMessage_updateValue1").eq(0).jqxPopover({
            offset: {
                left: -50,
                top: 0
            },
            arrowOffsetValue: 50,
            title: "Update Values Hint",
            showCloseButton: true,
            selector: $("#updateValues-help-div1")
        });

        $(".HelpMessage_updateValue2").eq(0).jqxPopover({
            offset: {
                left: -50,
                top: 0
            },
            arrowOffsetValue: 50,
            title: "Update Values Hint",
            showCloseButton: true,
            selector: $("#updateValues-help-div2")
        });

        $(".HelpMessage_updateValue3").eq(0).jqxPopover({
            offset: {
                left: -50,
                top: 0
            },
            arrowOffsetValue: 50,
            title: "Update Values Hint",
            showCloseButton: true,
            selector: $("#updateValues-help-div3")
        });

        $(".HelpMessage_updateValue4").eq(0).jqxPopover({
            offset: {
                left: -50,
                top: 0
            },
            arrowOffsetValue: 50,
            title: "Update Values Hint",
            showCloseButton: true,
            selector: $("#updateValues-help-div4")
        });

        // $("#trailing-help-div").click(function () {
        //     dialogWindow("If true, trailing missing values after the last valid value are filled using the last valid value.<br>The fill is applied using the currently selected 'Fill Type' and the 'Style' parameters.<br>Fill Types ‘midpoint‘ or ‘interpolate‘ require a valid value after the last selected date or they cannot be calculated.", "warning");
        // });

        // $(".updateValues-help-div").click(function () {
        //     dialogWindow("Refresh the market data in the 'Values Table' tab when the 'Ok' button is clicked.", "warning");
        // });

        $("#prefill_holiday").jqxCheckBox({ width: 250, height: 25 });
        $("#fill_holiday").jqxCheckBox({ width: 250, height: 25 });
        $("#postfill_holiday").jqxCheckBox({ width: 250, height: 25 });
        $("#s_p_overwriteWeekend").jqxCheckBox({ width: 250, height: 25, disabled: true });
        $("#leadOption").jqxCheckBox({ width: 90, height: 25 });

        $("#leadOption").on('change', function(event) {
            var checked = event.args.checked;
            if (checked == true) {
                $('#s_p_lagNum').jqxFormattedInput('disabled', false);
            } else {
                $('#s_p_lagNum').jqxFormattedInput('disabled', true);
            }
        });

        $("#s_p_lagNum").jqxFormattedInput({ width: 70, height: 25, radix: "decimal", value: 0, min: -1000, max: 1000, spinButtons: true, disabled: true });
        $("#updateToJson_seriesProperties").jqxCheckBox({ width: 115, height: 25 });

        $("#cm_startDate").jqxCheckBox({ width: 180, height: 25 });
        $("#use_earliest").jqxCheckBox({ width: 180, height: 25 });
        $("#cm_endDate").jqxCheckBox({ width: 180, height: 25 });
        $("#use_latest").jqxCheckBox({ width: 180, height: 25 });
        $("#updateToJson_dateRange").jqxCheckBox({ width: 115, height: 25 });

        $("#dr_periods").jqxFormattedInput({ width: 70, height: 25, radix: "decimal", value: "50", min: "3", max: "1000", spinButtons: true });

        $("#cm_startDate").on('change', function(event) {
            if ($("#use_earliest").jqxCheckBox("checked") == false) {
                var checked = event.args.checked;
                if (checked == true) {
                    // $("#dr_startDate").jqxDateTimeInput("disabled", true);
                    $('#dr_startDate').jqxDateTimeInput('setDate', new Date(source.localdata[source.localdata.length - 1].Date));
                } else {
                    // $("#dr_startDate").jqxDateTimeInput("disabled", false);
                    $('#dr_startDate').jqxDateTimeInput('setDate', s_date);
                }
            }
        });

        $("#cm_endDate").on('change', function(event) {
            if ($("#use_latest").jqxCheckBox("checked") == false) {
                var checked = event.args.checked;
                if (checked == true) {
                    // $("#dr_endDate").jqxDateTimeInput("disabled", true);
                    $('#dr_endDate').jqxDateTimeInput('setDate', new Date(source.localdata[0].Date));
                } else {
                    // $("#dr_endDate").jqxDateTimeInput("disabled", false);
                    $('#dr_endDate').jqxDateTimeInput('setDate', new Date());
                }
            }
        });

        if(  $("#use_earliest").jqxCheckBox("checked") ==true){
            if( $("#dr_startDate").hasClass('input-enabled')){
                $("#dr_startDate").removeClass('input-enabled')
                $("#startDate_btnCalendar").removeClass('input-enabled')
            }
        }
        if(  $("#use_latest").jqxCheckBox("checked") ==true){
            if( $("#dr_endDate").hasClass('input-enabled')){
                $("#dr_endDate").removeClass('input-enabled')
                $("#endDate_btnCalendar").removeClass('input-enabled')
            }
        }

        $("#use_earliest").on('change', function(event) {
            var checked = event.args.checked;
            if (checked == true) {
                if( $("#dr_startDate").hasClass('input-enabled')){
                    $("#dr_startDate").removeClass('input-enabled')
                    $("#startDate_btnCalendar").removeClass('input-enabled')
                }
                $("#dr_startDate").jqxDateTimeInput("disabled", true);
                $("#inputdr_startDate").val("Earliest");
                $("#startDate_btnCalendar").css("opacity", 0.6);
            } else {
                $("#dr_startDate").addClass('input-enabled')
                $("#startDate_btnCalendar").addClass('input-enabled')
                $("#dr_startDate").jqxDateTimeInput("disabled", false);
                $('#dr_startDate').jqxDateTimeInput('setDate', new Date());
                $("#startDate_btnCalendar").css("opacity", 1);
            }
        });

        $("#use_latest").on('change', function(event) {
            var checked = event.args.checked;
            if (checked == true) {
                if(  $("#use_latest").jqxCheckBox("checked") ==true){
                    if( $("#dr_endDate").hasClass('input-enabled')){
                        $("#dr_endDate").removeClass('input-enabled')
                        $("#endDate_btnCalendar").removeClass('input-enabled')
                    }
                }
                $("#dr_endDate").jqxDateTimeInput("disabled", true);
                $("#inputdr_endDate").val("Latest");
                $("#endDate_btnCalendar").css("opacity", 0.6);
            } else {
                $("#dr_endDate").addClass('input-enabled')
                $("#endDate_btnCalendar").addClass('input-enabled')
                $("#dr_endDate").jqxDateTimeInput("disabled", false);
                $('#dr_endDate').jqxDateTimeInput('setDate', new Date());
                $("#endDate_btnCalendar").css("opacity", 1);
            }
        });

        var isOpen_datepicker1 = false,
            isOpen_datepicker2 = false;
        $("#dr_startDate").jqxDateTimeInput({ width: '160px', height: '25px', formatString: "yyyy-MM-dd", showCalendarButton: false });
        $("#dr_endDate").jqxDateTimeInput({ width: '160px', height: '25px', formatString: "yyyy-MM-dd", showCalendarButton: false });

        $('#dateRangePopup').on('close', function() {
            $('body').removeClass('overlay');
        });

        $('#dateRangePopup').jqxWindow({
            showCollapseButton: false,
            resizable: false,
            isModal: false,
            height: '414px',
            width: '356px',
            maxHeight: '100%',
            maxWidth: '100%',
            autoOpen: false,
            title: 'Report Date Range'
        });

        $('#dateRangePopup').on('resized', function(event) {
            $('#dateRangePopup .jqx-window-content').css("width", "calc(100% - 10px)").css("overflow", "unset");
        });

        $("#btnLoadDateRange").jqxButton({
            width: '65px',
            height: '31px',
            textPosition: "center"
        });

        $("#btnLoadDateRange span").css("left", 24).css("top", 7);

        $("#btnLoadDateRange").on('click', function() {
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                if ($("#dr_startDate").jqxDateTimeInput("getText") == "Earliest") {
                    var startDate = $("#dr_startDate").jqxDateTimeInput("getText");
                } else {
                    var startDate = new Date($("#dr_startDate").jqxDateTimeInput("getDate")),
                        s_day = startDate.getDate(),
                        s_month = startDate.getMonth() + 1,
                        s_year = startDate.getFullYear();
                    s_day = (s_day < 10) ? '0' + s_day : s_day;
                    s_month = (s_month < 10) ? '0' + s_month : s_month;
                    startDate = s_year + '-' + s_month + '-' + s_day;
                }

                if ($("#dr_endDate").jqxDateTimeInput("getText") == "Latest") {
                    var endDate = $("#dr_endDate").jqxDateTimeInput("getText");
                } else {
                    var endDate = new Date($("#dr_endDate").jqxDateTimeInput("getDate")),
                        e_day = endDate.getDate(),
                        e_month = endDate.getMonth() + 1,
                        e_year = endDate.getFullYear();
                    e_day = (e_day < 10) ? '0' + e_day : e_day;
                    e_month = (e_month < 10) ? '0' + e_month : e_month;
                    endDate = e_year + '-' + e_month + '-' + e_day;
                }

                var periods = $('#dr_periods').val();

                if ($('#dateRangeTabs').jqxTabs('val') == 1 && periods >= 3) {
                    parameters.Periods = periods;
                    delete parameters["FirstDate"];
                } else {
                    parameters.FirstDate = startDate;
                    delete parameters["Periods"];
                }

                parameters.LastDate = endDate;

                parameters.CommonStart = $("#cm_startDate").jqxCheckBox("checked");
                parameters.CommonEnd = $("#cm_endDate").jqxCheckBox("checked");

                if ($("#updateToJson_dateRange").jqxCheckBox("checked") == true) {
                    $('#dateRangePopup').jqxWindow('close');
                    $("#jqxLoader").jqxLoader('open');
                    setTimeout(() => {
                        ShowJSReport(parameters, true);
                        $("#jqxLoader").jqxLoader('close');
                    }, 250);
                } else {
                    $('#dateRangePopup').jqxWindow('close');
                    dialogWindow("Some settings cannot update until the market data is reloaded.<br>Would you like to reload the market data now?", 'query', 'confirm', null,
                        function() {
                            $("#jqxLoader").jqxLoader('open');
                            setTimeout(() => {
                                ShowJSReport(parameters, true);
                                $("#jqxLoader").jqxLoader('close');
                            }, 50);
                        },
                        function() {
                            $("#jqxLoader").jqxLoader('open');
                            setTimeout(() => {
                                ShowJSReport(parameters, false);
                                $("#jqxLoader").jqxLoader('close');
                            }, 50);
                        }, null, {
                            Ok: 'Yes',
                            Cancel: 'No'
                        }
                    );
                }
            }
        });

        $("#btnCancelDateRange").jqxButton({
            width: '65px',
            height: '31px',
            textPosition: "center"
        });

        $("#btnCancelDateRange span").css("left", 13).css("top", 7);

        $("#btnCancelDateRange").on('click', function() {
            $('#dateRangePopup').jqxWindow('close');
        });

        $('#saveReportWindow').on('close', function() {
            $('body').removeClass('overlay');
            $("#fileDropdown1").jqxDropDownList('clearSelection');
        });

        $('#startDate_btnCalendar').click(function() {
            if ($("#use_earliest").jqxCheckBox("checked") == false && $("#cm_startDate").jqxCheckBox("checked") == false) {
                $("#dr_startDate").jqxDateTimeInput("open");
            }
        });

        $('#endDate_btnCalendar').click(function() {
            if ($("#use_latest").jqxCheckBox("checked") == false && $("#cm_endDate").jqxCheckBox("checked") == false) {
                $("#dr_endDate").jqxDateTimeInput("open");
            }
        });

        $('#saveReportWindow').jqxWindow({
            showCollapseButton: false,
            resizable: true,
            isModal: false,
            height: '370px',
            width: '600px',
            maxHeight: '100%',
            maxWidth: '100%',
            autoOpen: false,
            title: 'Save Server Report'
        });

        $('#saveReportWindow').on('resizing', function(event) {
            $('#saveReportWindow .jqx-window-content').css("width", "calc(100% - 10px)").css("overflow", "unset");
            $("#reportsList").jqxComboBox("width", "calc( 100% - 45px )");
            // $("#reportsList").jqxComboBox("dropDownHeight", parseInt($('#saveReportWindow').height())-240);
            $("#saveReportLockedRow").css("height", parseInt($('#saveReportWindow').height()) - 270);
        });

        $("#btnSaveReport").jqxButton({
            width: '60px',
            height: '30px',
            textPosition: "center"
        });
        $("#btnSaveReport span").css("left", 16).css("top", 6);

        $("#btnSaveReport").on('click', function() {
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                var checked = $("#createCloneReport").jqxCheckBox('checked');
                if (checked == true) {
                    if ($("#reportsList").jqxComboBox("selectedIndex") > -1) {
                        dialogWindow("Create a copy of report " + reportsList[$("#reportsList").jqxComboBox("selectedIndex")].Name + "?", 'query', 'confirm', null,
                            function() {
                                call_api_ajax1('ReadReport', 'get', {
                                    SessionToken: getSession(),
                                    ReportID: reportsList[$("#reportsList").jqxComboBox("selectedIndex")].ReportID
                                }, false, (data) => {
                                    var params = {
                                        SessionToken: getSession(),
                                        Name: data.Result.Name + " (Copy)",
                                        Type: data.Result.Type,
                                        Notes: data.Result.Notes,
                                        ReportJSON: data.Result.ReportJSON,
                                        UserJSON: data.Result.UserJSON
                                    };
                                    $("#jqxLoader1").jqxLoader('open');
                                    setTimeout(() => {
                                        call_api_ajax1('WriteReport', 'post', JSON.stringify(params), false, (newData) => {
                                            if (data.Result.ReportID != undefined) {
                                                report_id = newData.Result.ReportID;
                                                call_api_ajax1('ReadReport', 'get', {
                                                    SessionToken: getSession(),
                                                    ReportID: report_id
                                                }, false, (data) => {
                                                    parameters = JSON.parse(data.Result.ReportJSON);
                                                    report_name = data.Result.Name;
                                                    report_locked = data.Result.Locked;
                                                    report_type = data.Result.Type;
                                                    ShowJSReport(parameters);

                                                    $("#notes-json-display").val(data.Result.Notes);
                                                    user_editor.load(JSON.parse(data.Result.UserJSON));

                                                    requestParameters = JSON.parse(data.Result.ReportJSON);
                                                    requestParameters.FrequencyOptions = {
                                                        AllowWeekends: 'off'
                                                    };
                                                    notesParameters = data.Result.Notes;
                                                    userParameters = JSON.parse(data.Result.UserJSON);
                                                    edit_flag = false;

                                                    if (data.Result.Locked == true) {
                                                        $('#reportID').html(data.Result.ReportID + "&nbsp;&nbsp;<img src='resources/css/icons/padlock.png' style='margin-top:-5px'>");
                                                    } else {
                                                        $('#reportID').html(data.Result.ReportID);
                                                    }
                                                    $('#saveReportID').html(data.Result.ReportID);
                                                    $('#reportName').html(data.Result.Name);

                                                    if (parameters.Frequency == "chm") {
                                                        $("#average").html("Custom Half Month - Days (" + parameters.FrequencyOptions.StartDay + "-" + parameters.FrequencyOptions.EndDay + "," + parameters.FrequencyOptions.StartDay2 + "-" + parameters.FrequencyOptions.EndDay2 + ").");
                                                    } else if (parameters.Frequency == "hm") {
                                                        $("#average").html("Half Month.");
                                                    } else if (parameters.Frequency == "m" || parameters.Frequency == "q" || parameters.Frequency == "hy" || parameters.Frequency == "y") {
                                                        $("#average").html("Month.");
                                                    } else if (parameters.Frequency == "cm" || parameters.Frequency == "cq" || parameters.Frequency == "chy" || parameters.Frequency == "cy") {
                                                        $("#average").html("Custom Month - Days " + parameters.FrequencyOptions.StartDay + " to " + parameters.FrequencyOptions.EndDay + ".");
                                                    } else if (parameters.Frequency == "w") {
                                                        $("#average").html("Week.");
                                                    } else if (parameters.Frequency == "cw") {
                                                        $("#average").html("Custom Week - begins " + weeks[parameters.FrequencyOptions.StartDay] + ".");
                                                    } else {
                                                        $("#average").html("Day.");
                                                    }

                                                    $('#reportType').html(data.Result.Type);
                                                    $('#reportFrom').html(parameters.FirstDate);
                                                    $('#reportTo').html(parameters.LastDate);
                                                    $('#reportCreated').html(data.Result.Created);
                                                    $('#reportUpdated').html(data.Result.Updated);
                                                    $('#reportNotes').html(data.Result.Notes);
                                                    $('#reportJSON').html(data.Result.ReportJSON);
                                                    $('#userJSON').html(data.Result.UserJSON);
                                                });

                                                window.history.pushState("datasetsPage", "report database", "/report_viewer?report_id=" + report_id + "&tab=request&layout=1");
                                                $("#jqxLoader1").jqxLoader('close');
                                            }
                                        });
                                    }, 300);
                                });
                                // updateReportListCombobox();
                                resizeElements();
                                $('#saveReportWindow').jqxWindow("close");
                            }, null, null, {
                                Ok: 'Yes',
                                Cancel: 'No'
                            }
                        )
                    } else {
                        dialogWindow("Please select a report to copy", "error");
                    }
                } else {
                    var value = $("#reportsList input").val();
                    if (value == "") {
                        dialogWindow("You must first enter a valid report name to save it with.", "error");
                    } else {
                        var existReportID, existLocked = "";
                        for (var i = 0; i < reportsList.length; i++) {
                            if (reportsList[i].Name == value) {
                                existReportID = reportsList[i].ReportID;
                                existLocked = reportsList[i].Locked;
                                break;
                            }
                        }

                        var jsonObj = getJsonTree(request_editor);
                        // var jsonObj1 = getJsonTree(notes_editor);
                        var jsonObj1 = $("#notes-json-display").val();
                        var jsonObj2 = getJsonTree(user_editor);
                        var userJSON = JSON.stringify(jsonObj2);

                        if (jsonObj2 == "Json_error") {
                            dialogWindow("The User JSON field seems to contain invalid JSON text <br>but the record was saved as requested.", "error");
                            jsonObj2 = $("#user-json-display").html();
                            userJSON = $("#user-json-display").html();
                        }

                        if (existReportID == undefined || existReportID == "") {
                            var params = {
                                SessionToken: getSession(),
                                Name: value,
                                Type: report_type,
                                Notes: jsonObj1,
                                ReportJSON: JSON.stringify(jsonObj),
                                UserJSON: userJSON
                            };

                            $('#saveReportWindow').jqxWindow("close");
                            $("#jqxLoader1").jqxLoader('open');
                            setTimeout(() => {
                                call_api_ajax1('WriteReport', 'post', JSON.stringify(params), false, (data) => {
                                    if (data.Result.ReportID != undefined) {
                                        report_id = data.Result.ReportID;
                                        call_api_ajax1('ReadReport', 'get', {
                                            SessionToken: getSession(),
                                            ReportID: report_id
                                        }, false, (data) => {
                                            parameters = JSON.parse(data.Result.ReportJSON);
                                            report_name = data.Result.Name;
                                            report_locked = data.Result.Locked;
                                            report_type = data.Result.Type;
                                            ShowJSReport(parameters);

                                            $("#notes-json-display").val(data.Result.Notes);
                                            user_editor.load(JSON.parse(data.Result.UserJSON));

                                            requestParameters = JSON.parse(data.Result.ReportJSON);
                                            requestParameters.FrequencyOptions = {
                                                AllowWeekends: 'off'
                                            };
                                            notesParameters = data.Result.Notes;
                                            userParameters = JSON.parse(data.Result.UserJSON);
                                            edit_flag = false;

                                            if (data.Result.Locked == true) {
                                                $('#reportID').html(data.Result.ReportID + "&nbsp;&nbsp;<img src='resources/css/icons/padlock.png' style='margin-top:-5px'>");
                                            } else {
                                                $('#reportID').html(data.Result.ReportID);
                                            }
                                            $('#saveReportID').html(data.Result.ReportID);
                                            $('#reportName').html(data.Result.Name);

                                            if (parameters.Frequency == "chm") {
                                                $("#average").html("Custom Half Month - Days (" + parameters.FrequencyOptions.StartDay + "-" + parameters.FrequencyOptions.EndDay + "," + parameters.FrequencyOptions.StartDay2 + "-" + parameters.FrequencyOptions.EndDay2 + ").");
                                            } else if (parameters.Frequency == "hm") {
                                                $("#average").html("Half Month.");
                                            } else if (parameters.Frequency == "m" || parameters.Frequency == "q" || parameters.Frequency == "hy" || parameters.Frequency == "y") {
                                                $("#average").html("Month.");
                                            } else if (parameters.Frequency == "cm" || parameters.Frequency == "cq" || parameters.Frequency == "chy" || parameters.Frequency == "cy") {
                                                $("#average").html("Custom Month - Days " + parameters.FrequencyOptions.StartDay + " to " + parameters.FrequencyOptions.EndDay + ".");
                                            } else if (parameters.Frequency == "w") {
                                                $("#average").html("Week.");
                                            } else if (parameters.Frequency == "cw") {
                                                $("#average").html("Custom Week - begins " + weeks[parameters.FrequencyOptions.StartDay] + ".");
                                            } else {
                                                $("#average").html("Day.");
                                            }

                                            $('#reportType').html(data.Result.Type);
                                            $('#reportFrom').html(parameters.FirstDate);
                                            $('#reportTo').html(parameters.LastDate);
                                            $('#reportCreated').html(data.Result.Created);
                                            $('#reportUpdated').html(data.Result.Updated);
                                            $('#reportNotes').html(data.Result.Notes);
                                            $('#reportJSON').html(data.Result.ReportJSON);
                                            $('#userJSON').html(data.Result.UserJSON);
                                        });

                                        window.history.pushState("datasetsPage", "report database", "/report_viewer?report_id=" + report_id + "&tab=request&layout=1");
                                        setCookie('reportJson', "");
                                        $("#fileDropdown").jqxDropDownList('enableAt', 1);
                                        $("#fileDropdown1").jqxDropDownList('enableAt', 1);
                                        $("#createCloneReport").jqxCheckBox("disabled", false);

                                        $("#jqxLoader1").jqxLoader('close');
                                    }
                                });
                            }, 300);
                        } else {
                            if (report_id == existReportID) {
                                // dialogWindow("You are about to overwrite a saved server report.<br>Do you want to continue?", 'query', 'confirm', null,
                                //     function () {
                                var locked = $("#reportPadlock").jqxCheckBox("checked");

                                if (existLocked == true) {
                                    call_api_ajax1('UnlockReport', 'get', { SessionToken: getSession(), ReportID: existReportID }, false);
                                }

                                requestParameters = jsonObj;
                                notesParameters = jsonObj1;
                                userParameters = jsonObj2;
                                edit_flag = false;

                                var params = {
                                    SessionToken: getSession(),
                                    ReportID: existReportID,
                                    Name: value,
                                    Type: report_type,
                                    Notes: jsonObj1,
                                    ReportJSON: JSON.stringify(jsonObj),
                                    UserJSON: userJSON
                                };
                                call_api_ajax1('WriteReport', 'post', JSON.stringify(params), false);

                                if (locked == true) {
                                    call_api_ajax1('LockReport', 'get', { SessionToken: getSession(), ReportID: existReportID }, false);
                                }
                                $('#saveReportWindow').jqxWindow("close");
                                //     }, null, null, {
                                //         Ok: 'Yes',
                                //         Cancel: 'No'
                                //     }
                                // )
                            } else {
                                dialogWindow("You are about to permanently overwrite a saved server report.<br>Do you want to continue?", 'query', 'confirm', null,
                                    function() {
                                        var locked = $("#reportPadlock").jqxCheckBox("checked");

                                        if (existLocked == true) {
                                            call_api_ajax1('UnlockReport', 'get', { SessionToken: getSession(), ReportID: existReportID }, false);
                                        }

                                        requestParameters = jsonObj;
                                        notesParameters = jsonObj1;
                                        userParameters = jsonObj2;
                                        edit_flag = false;

                                        var params = {
                                            SessionToken: getSession(),
                                            ReportID: existReportID,
                                            Name: value,
                                            Type: report_type,
                                            Notes: JSON.stringify(jsonObj1),
                                            ReportJSON: JSON.stringify(jsonObj),
                                            UserJSON: userJSON
                                        };
                                        call_api_ajax1('WriteReport', 'post', JSON.stringify(params), false);

                                        if (locked == true) {
                                            call_api_ajax1('LockReport', 'get', { SessionToken: getSession(), ReportID: existReportID }, false);
                                        }
                                        $('#saveReportWindow').jqxWindow("close");
                                    }, null, null, {
                                        Ok: 'Yes',
                                        Cancel: 'No'
                                    }
                                )
                            }
                        }
                        resizeElements();
                        // updateReportListCombobox();
                    }
                }
            }
        });

        $("#btnCancelReport").jqxButton({
            width: '65px',
            height: '30px',
            textPosition: "center"
        });
        $("#btnCancelReport span").css("left", 13).css("top", 6);

        $("#btnCancelReport").on('click', function() {
            $('#saveReportWindow').jqxWindow('close');
        });

        if (report_locked == true) {
            $("#reportPadlock").jqxCheckBox({
                width: 25,
                height: 25,
                checked: true
            });
        } else {
            $("#reportPadlock").jqxCheckBox({
                width: 25,
                height: 25,
                checked: false
            });
        }

        $("#createCloneReport").jqxCheckBox({
            width: 200,
            height: 25,
            checked: false
        });

        if (report_id == "new") {
            $("#createCloneReport").jqxCheckBox("disabled", true);
        }

        // $("#createCloneReport").bind('change', function (event) {
        //     var checked = event.args.checked;
        //     if(checked == true){
        //         $("#reportPadlock").jqxCheckBox({disabled: false});
        //         $("#reportsList").jqxComboBox("disabled", false);
        //     }
        //     else{
        //         $("#reportPadlock").jqxCheckBox({disabled: true});
        //         $("#reportsList").jqxComboBox("disabled", true);
        //     }
        // });

        $("#btnRequestRefreshJson").jqxButton({
            imgSrc: "resources/css/icons/reload.png",
            imgPosition: "left",
            width: 28,
            height: 28,
            imgWidth: 18,
            imgHeight: 18,
            textPosition: "right"
        });

        // $("#btnRequestRefreshJson").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");

        $("#btnRequestRefreshJson").on('click', function() {
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                var jsonObj = getJsonTree(request_editor);

                // if (jsonObj == "Json_error" || Object.keys(jsonObj).length == 0) {
                //     dialogWindow("No Report data has been loaded.", "error");
                // }
                // else {
                dialogWindow("Refresh the market data (using the current 'JSON Request' tab code)?", "query", "confirm", "Monitor+", () => {
                    $("#jqxLoader").jqxLoader('open');
                    setTimeout(() => {
                        if (jsonObj != undefined) {
                            if (jsonObj.Frequency != undefined && jsonObj.Series != undefined) {
                                ShowJSReport(jsonObj);
                                setTimeout(() => {
                                    gridColumndraw();
                                    // grid.setColumns(columns);
                                    CreateAddPreHeaderRow();
                                    resizeColumns(grid);

                                    // grid1.setData(batesArray);
                                    dataView1.beginUpdate();
                                    dataView1.setItems(batesArray);
                                    groupByDuration();
                                    dataView1.endUpdate();
                                    $("#jqxLoader").jqxLoader('close');
                                }, 500);
                            } else {
                                $("#jqxLoader").jqxLoader('close');
                                dialogWindow("The 'JSON Request' tab must contain valid JSON code.", "error");
                            }
                        } else {
                            $("#jqxLoader").jqxLoader('close');
                            dialogWindow("The 'JSON Request' tab must contain valid JSON code.", "error");
                        }
                    }, 100);
                }, null, null, { Ok: "Yes", Cancel: "No" });
                // }
            }
        });

        $("#fileupload").change(function() {
            var file_info = $('#fileupload').prop('files');
            var filename = file_info[0].name;
            if (filename.substr(filename.length - 3) !== "SJR") {
                dialogWindow("The wrong file format has been selected. It must be an exported '.SJR' file type.");
            } else {
                var fr = new FileReader();
                fr.addEventListener('load', (event) => {
                    const result = getJson(event.target.result);
                    if (result != undefined && result.ReportJSON != undefined && result.Notes != undefined && result.UserJSON != undefined) {
                        if (result.ReportJSON.Frequency != undefined && result.ReportJSON.Series != undefined) {
                            ShowJSReport(result.ReportJSON);
                            // notes_editor.load(getJson(result.Notes));
                            $("#notes-json-display").val(result.Notes);
                            user_editor.load(result.UserJSON);
                            gridColumndraw();
                            grid.setColumns(columns);
                            CreateAddPreHeaderRow();
                        } else {
                            dialogWindow("The selected file cannot be used. <br/>It was not created  with the 'Save JSON' function", "error");
                        }
                    }
                });
                fr.readAsText(file_info[0], 'UTF-8');
            }
        });

        // 2022 5 23 3:09
        function refreshFullWidth() {

            let img2 = (fullWidthFlag) ? 'fullscreen' : 'fullscreen1';
            $("#fullWidth").jqxButton({
                imgSrc: "resources/css/icons/" + img2 + ".png",
                imgPosition: "left",
                width: 28,
                height: 28,
                imgWidth: 18,
                imgHeight: 18,
                textPosition: "right"
            });
        }
        refreshFullWidth();

        // $("#fullWidth").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");

        $("#fullWidth").on('click', function() {
            let img = (fullWidthFlag) ? 'fullscreen' : 'fullscreen1';

            $("#fullWidth").jqxButton({
                imgSrc: "resources/css/icons/" + img + ".png",
                imgPosition: "left",
                width: 28,
                height: 28,
                imgWidth: 18,
                imgHeight: 18,
                textPosition: "right"
            });
            $(".fixpage").toggleClass('fullscreen', fullWidthFlag);
            $(".footerbar").toggleClass('full-footer');
            $("section .wrap").toggleClass('fullscreen', fullWidthFlag);

            fullWidthFlag = !fullWidthFlag;
            window.dispatchEvent(new Event('resize'));
        });

        // 2022 5 23 3:09
        function refreshResultFullWidth() {

            let img3 = (fullWidthFlag) ? 'fullscreen' : 'fullscreen1';
            $("#ResultfullWidth").jqxButton({
                imgSrc: "resources/css/icons/" + img3 + ".png",
                imgPosition: "left",
                width: 28,
                height: 28,
                imgWidth: 18,
                imgHeight: 18,
                textPosition: "right"
            });
        }

        refreshResultFullWidth();
        // $("#ResultfullWidth").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");

        $("#ResultfullWidth").on('click', function() {
            let img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';

            $("#ResultfullWidth").jqxButton({
                imgSrc: "resources/css/icons/" + img + ".png",
                imgPosition: "left",
                width: 28,
                height: 28,
                imgWidth: 18,
                imgHeight: 18,
                textPosition: "right"
            });
            $(".fixpage").toggleClass('fullscreen', fullWidthFlag);
            $(".footerbar").toggleClass('full-footer');
            $("section .wrap").toggleClass('fullscreen', fullWidthFlag);

            fullWidthFlag = !fullWidthFlag;
            window.dispatchEvent(new Event('resize'));
        });

        $("#btnResponseSaveJson").jqxButton({
            imgSrc: "resources/css/icons/report-dn.png",
            imgPosition: "left",
            width: 114,
            height: 28,
            imgWidth: 18,
            imgHeight: 18,
            textPosition: "right"
        });
        $("#btnResponseSaveJson span").css("left", 26);
        // $("#btnResponseSaveJson").css("border-color", "#ddd").css("box-shadow", "0px 0 2px rgb(0 0 0 / 25%)");

        $("#btnResponseSaveJson").on('click', function() {
            var jsonObj = response_json;
            if (jsonObj != undefined) {
                var link = document.createElement('a');
                link.href = 'data:text/plain;charset=UTF-8,' + escape(JSON.stringify(jsonObj));
                link.download = 'response_' + report_name + '.JSON';
                link.click();
            } else {
                dialogWindow("No Report data has been loaded.", "error");
            }
        });

        $("#btnResponseRefresh").jqxButton({
            imgSrc: "resources/css/icons/reload.png",
            imgPosition: "left",
            width: 28,
            height: 28,
            imgWidth: 18,
            imgHeight: 18,
            textPosition: "right"
        });
        $("#btnResponseRefresh img").css("top", 5);

        $("#btnResponseRefresh").on('click', function() {
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                var jsonObj = getJsonTree(request_editor);

                // if (jsonObj == "Json_error" || Object.keys(jsonObj).length == 0) {
                //     dialogWindow("No Report data has been loaded.", "error");
                // }
                // else {
                dialogWindow("Refresh the market data (using the current 'JSON Request' tab code)?", "query", "confirm", "Monitor+", () => {
                    $("#jqxLoader").jqxLoader('open');
                    setTimeout(() => {
                        if (jsonObj != undefined) {
                            if (jsonObj.Frequency != undefined && jsonObj.Series != undefined) {
                                ShowJSReport(jsonObj);
                                setTimeout(() => {
                                    gridColumndraw();
                                    // grid.setColumns(columns);
                                    CreateAddPreHeaderRow();
                                    resizeColumns(grid);
                                    $("#jqxLoader").jqxLoader('close');
                                }, 500);
                            } else {
                                $("#jqxLoader").jqxLoader('close');
                                dialogWindow("The 'JSON Request' tab must contain valid JSON code.", "error");
                            }
                        } else {
                            $("#jqxLoader").jqxLoader('close');
                            dialogWindow("The 'JSON Request' tab must contain valid JSON code.", "error");
                        }
                    }, 100);
                }, () => {}, null, { Ok: "Yes", Cancel: "No" });
                // }
            }
        });

        $("#btnCopy").jqxButton({
            imgSrc: "resources/css/icons/copy.png",
            imgPosition: "left",
            width: 63,
            height: 28,
            imgWidth: 18,
            imgHeight: 18,
            textPosition: "right"
        });

        $("#btnCopy span").css("left", 28);

        $("#btnCopy").on('click', function() {
            copySelectedSeriesToClipboard();
        });

        $("#btnSaveReportCreator").on("click", function() {
            setTimeout(() => {
                if (getCookie("updateJson") != undefined && getCookie("updateJson") != "" && getCookie("updateJson") != "new") {
                    $("#jqxLoader").jqxLoader('open');
                    setTimeout(() => {
                        var updateJson = JSON.parse(getCookie("updateJson"));
                        ShowJSReport(updateJson);
                        setTimeout(() => {
                            gridColumndraw();
                            grid.setColumns(columns);
                            CreateAddPreHeaderRow();
                            resizeColumns(grid);

                            dataView1.beginUpdate();
                            dataView1.setItems(batesArray);
                            groupByDuration();
                            dataView1.endUpdate();

                            $("#jqxLoader").jqxLoader('close');
                        }, 300);
                        setCookie("updateJson", "");
                    }, 300);
                }
            }, 10);
        })
    }

    CreateAddRequestHeaderRow();

    function getJsonTree(obj) {
        try {
            return obj.get();
        } catch (ex) {
            if (ex != "Error: SyntaxError: Unexpected end of JSON input") {
                // dialogWindow("Wrong JSON Format: " + ex, "error", null, "Saving Report");
                // $("#jqxLoader").jqxLoader('close');
                return "Json_error";
            } else {
                return {};
            }
        }
    }

    function getJson(txt) {
        try {
            return JSON.parse(txt);
        } catch (ex) {
            alert('Wrong JSON Format: ' + ex);
        }
    }

    $('#triangle').click(function() {
        meta_rows = $("#metadataContent").find("div"),
            size = 1.35 * (meta_rows[0].offsetHeight + meta_rows[1].offsetHeight + meta_rows[2].offsetHeight),
            number = $("#metadataContent")[0].offsetHeight;

        if (toggleMetaData === 1) {
            this.src = "resources/images/up.png";
            $('#mainSplitter').jqxSplitter({
                panels: [{
                    size: number * 1.1 + "px"
                }]
            });

            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 10);

        } else if (toggleMetaData === -1) {
            this.src = "resources/images/down.png";
            $('#mainSplitter').jqxSplitter({
                panels: [{
                    size: size - 4 + "px"
                }]
            });

            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 10);
        }

        if ( $("#chart").width() > 10) {
            if ($("#bottom-subchart").css("display") !== "none") {
                $("#top-chart").css({
                    height: "calc( 70% - 48px )"
                });
                $("#bottom-chart").css({
                    height: "calc( 30% - 48px )"
                });
            } else {
                $("#top-subchart").css({
                    height: "calc( 100% - 96px )"
                });
            }
        }

        toggleMetaData *= -1;
        window.dispatchEvent(new Event('resize'));
    });

    $('body').removeClass('hiddenBody');
    // let x = $("#right-toolbar-content").children('.jqx-widget');
    // x.addClass('d-none');
    
}


