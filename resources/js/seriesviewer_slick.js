/*******************
 Series Viewer
 *******************/
let parameters, hideEmptyRows = false, allow_weekend = true;

window.onload = function () {

    setTimeout(hideloader, 1000); /* change the value "2000ms to any duration you want */
    
    //hide the preload
    function hideloader() {
        document.querySelector(".loader-container").style.display = "none";        
    }
    
    $.jqx.theme = 'light';
    $.jqx.utilities.scrollBarSize = 11;

    // Define all variables
    var toggleMetaData = 1,
        requestedTab = getParameterByName('tab'),
        full_symbol = getParameterByName('symbol'),
        sessionToken = getSession(),
        layout = getParameterByName('layout'),
        datasource = full_symbol.split('/')[0],
        symbol = (full_symbol.split('/').length > 2) ? full_symbol.split('/')[2] : full_symbol.split('/')[1],
        category = (full_symbol.split('/').length > 2) ? full_symbol.split('/')[1] : false,
        isPricesDataLoaded = false,
        correctionsDataAdapter,
        chartSource,
        highlight_weekends = true,
        hasUserAccessToCategory = true,
        layoutURL = !isNaN(parseInt(layout)) ? "&layout=" + layout : "",
        frequency_array = [{
                d: 'Day'
            },
            {
                w: 'Week'
            },
            {
                m: 'Month'
            },
            {
                q: 'Quarter'
            },
            {
                hy: 'Half Year'
            },
            {
                y: 'Year'
            }
        ],
        corrections_count,
        size = 0,
        decimalText = '0004',
        isChartLoaded = false,
        isCorrectionsLoaded = false,
        source = {},
        disabledGrid = false,
        expired = false,
        bates = [],
        corrections_array = [],
        dataAdapter,
        gridMetadata,
        correctionsTab = false,
        data_corr = {},
        userName = '',
        corrections_count = 0,
        hide_data,
        bateStatus = [],
        hide_data_chart,
        showNoValue = true,

        isSubChartLoaded = false,
        toolbar_ready = false,
        rowsData,
        rowsOriginalData,
        rowsWeekendData;
    
    function isNumberFunc(n) {
        return /^-?[\d.]+(?:e-?\d+)?$/.test(n) && !isNaN(parseFloat(n));
    }

    var textLength = $("<span class='hidden-text'>");
    $('body').append(textLength);

    function resizeColumns(grid_id) {
        var grid = grid_id,
            get_columns = grid.getColumns(),
            rows = grid.getData().getItems(),
            gridData = {};
            
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

                gridData[k] = gridData[k].reduce(function (a, b) {
                    return String(a).length > String(b).length ? a : b;
                });

                if (k.toLowerCase() !== "date" && k.toLowerCase() !== "volume" && isNumberFunc(gridData[k]))
                    gridData[k] = parseFloat(gridData[k]).toFixed(real_decimal);

                textLength.text(gridData[k]);
                let valueWidth = textLength.width();
                get_columns = get_columns.map(v => {
                    if (v !== undefined && v.field == k) {
                        textLength.text(v.text);
                        v.width = textLength.width() > valueWidth ? textLength.width() : valueWidth;
                        v.width += 20;
                    }
                    return v;
                });
            }

            grid.setColumns(get_columns);
        }
    }

    $('#topPanel, #jqxTabs').show();
    $('#jqxTabs').jqxTabs({
        width: '100%',
        height: '100%',
        position: 'top'
    });

    $('#profile').attr('href', 'profile?tab=MyProfile');
    $('#favorites').attr('href', 'profilemain?tab=favorites');
    $('#logout').click(function () {
        logout();
    });

    // Function to register the data
    function enterDate(data, freq = 'd') {
        if (data) {
            $('#water').remove();

            if (data.Metadata && data.Metadata[0].Simulated !== undefined)
                disabledGrid = data.Metadata[0].Simulated;

            corrections_array = data.Corrections[data.Parameters.Series[0].Datasource+'/'+data.Parameters.Series[0].Symbol];
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

            gridMetadata = data.Metadata[0];
            if (gridMetadata) {
                //                if (full_symbol.split('/').length < 3 && gridMetadata.Datacategory !== "false") {
                if (full_symbol.split('/').length < 3 && gridMetadata.Datacategory !== undefined) {
                    full_symbol = full_symbol.split('/')
                    full_symbol.splice(1, 0, gridMetadata.Datacategory)
                    full_symbol = full_symbol.join('/');

                    window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices" + layoutURL);
                }

                bates = gridMetadata.Bates.map(function (v) {
                    return {
                        name: v,
                        type: 'float'
                    }
                });

                corrections_count = gridMetadata.Corrections;
            }

            rowsOriginalData = [];
            rowsData = Object.keys(data.Rows).map(function (date) {
                let row = {
                    Date: date
                };
                for (var i in bates) {
                    let num = data.Rows[date][i],
                        value = !isNumberFunc(num) ? num : data.Rows[date][i].toFixed(bates[i].name.toLowerCase() == "volume" ? 0 : 4);
                    value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : value;
                    row[bates[i].name] = value;
                }
                rowsOriginalData.push(row);
                return row;
            });

            if (rowsData.length > 0 && new Date(rowsData[0].Date) < new Date(rowsData[rowsData.length - 1].Date))
                rowsData.reverse();

            hide_data = rowsData.map(function (v) {
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

            hide_data = hide_data.filter(function (element) {
                return element !== undefined;
            });

            source.localdata = rowsData;
            
            if(hideEmptyRows == true){
                if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
                    hide_data.reverse();
                source.localdata = hide_data;
            }
            if (chartSource !== undefined) chartSource.localdata = rowsData;

            if (gridMetadata.Datacategory !== undefined && gridMetadata.Datacategory !== "false") {
                $('.categoryExist').show();
                $('#category-info').text(gridMetadata.Datacategory);
            }
            $('#contract-info').text(gridMetadata.Name);
            $('#datasource-info').text(gridMetadata.Datasource);
            $('#symbol-info').text(gridMetadata.Symbol);
            $('#startDate-info').text(gridMetadata.StartDate);
            $('#endDate-info').text(gridMetadata.EndDate);
            $('#frequency-info').text(frequency_array[freq]);
            $('#additional-data-info').text(gridMetadata.Description);
            $('#corrections-info').text(corrections_count);
            $('#num-rows-info').text(Object.keys(rowsData).length);
            
            for (var i = 0; i < source.localdata.length; i++) {
                source.localdata[i].id = "id1_" + i;
                source.localdata[i].num = (i + 1);

                if(source.localdata[i].Close == null){
                    source.localdata[i].Close = "";
                }
    
                if(source.localdata[i].High == null){
                    source.localdata[i].High = "";
                }
    
                if(source.localdata[i].Low == null){
                    source.localdata[i].Low = "";
                }
    
                if(source.localdata[i]['Mean (c)'] == null){
                    source.localdata[i]['Mean (c)'] = "";
                }
    
                if(source.localdata[i]['Hi-Lo (c)'] == null){
                    source.localdata[i]['Hi-Lo (c)'] = "";
                }
            }

            if(grid != undefined){
                grid.setData(source.localdata);
                dataView.beginUpdate();
                dataView.setItems(source.localdata, "id");
                dataView.endUpdate();
                dataView.reSort();
                grid.invalidate();
                grid.render();
                
                setTimeout(() => {
                    var iScrollHeight = $(".slick-viewport").prop("scrollTop");
                    if(iScrollHeight > 0)
                        $(".slick-viewport").prop("scrollTop", 0);
                    else
                        $(".slick-viewport").prop("scrollTop", iScrollHeight+30);
                }, 500);
            }
            
            if(grid1 != undefined){
                grid1.setData(sourceCorrections.localdata);
                dataView1.beginUpdate();
                dataView1.setItems(sourceCorrections.localdata, "id");
                dataView1.endUpdate();
                dataView1.reSort();
                grid1.invalidate();
                grid1.render();
            }

            // if (rowsData.length == 0) {
            //     $('head').append('<style id="water" type="text/css">.watermark.access::before { content: "No data available"; opacity: 1; color: #999 } #row0jqxgrid { opacity: 0 } </style>');
            // }
        }
    }
    // Fetch data if it is not registered
    if (sessionStorage.getItem(full_symbol) === null) {
        let Series;
        if (category !== false) Series = [{
            Datasource: datasource,
            Symbol: symbol,
            Datacategory: category
        }];
        else Series = [{
            Datasource: datasource,
            Symbol: symbol
        }];

        parameters = {
            SessionToken: sessionToken,
            Frequency: "d",
            Series: Series,
            Sparse: true,
            SparseOptions: {
                Leading: true,
                Values: false,
                Trailing: true
            },
            ReturnMetadata: true,
            FrequencyOptions: {
                AllowWeekends:"on"
            }
        };
                 
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
                enterDate(data.Result); // Register the data

                rowsWeekendData = Object.keys(data.Result.Rows).map(function (date) {
                    let row = {Date: date};
                    let num = data.Result.Rows[date][0];
                    row['Close'] = num;
                    return row;
                });
            
                if (rowsWeekendData.length > 0 && new Date(rowsWeekendData[0].Date) < new Date(rowsWeekendData[rowsWeekendData.length - 1].Date))
                    rowsWeekendData.reverse();
            }
        });
    } else {
        sessionStorage.removeItem(full_symbol);

        let Series;
        if (category !== false) Series = [{
            Datasource: datasource,
            Symbol: symbol,
            Datacategory: category
        }];
        else Series = [{
            Datasource: datasource,
            Symbol: symbol
        }];

        parameters = {
            SessionToken: sessionToken,
            Frequency: "d",
            Series: Series,
            Sparse: true,
            SparseOptions: {
                Leading: true,
                Values: false,
                Trailing: true
            },
            ReturnMetadata: true,
            FrequencyOptions: {
                AllowWeekends:"on"
            }
        };
        
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
                enterDate(data.Result); // Register the data
            }
        });
    }


    if (bateStatus.length > 0) {
        let e = false;
        var h = '<div class="dialog-font-report hd-server">Warnings from server:</div><div class="c-grid">',
            t = $('<table class="dialog-font-report" id="ignoreBate">'),
            th = $('<tr><th>SYMBOL</th><th>Bate</th><th>Code</th><th>Detail</th></tr>');
        t.append(th);

        for (var i in bateStatus) {
            if (bateStatus[i].Status !== 200) {
                e = true;
                t.append('<tr><td>' + symbol + '</td><td>' + bateStatus[i].Bate + '</td><td>' + bateStatus[i].Status + '</td><td>' + bateStatus[i].Details + '</td></tr>');
            }
        }

        if (e) {
            h += t[0].outerHTML + '</div>';
            dialogWindow(h, "warning", null, 'Server API Messages');
        }
    }

    var access = '',
        last_access;
    call_api_ajax('GetUserDatasources', 'get', {
        SessionToken: sessionToken,
        ReturnCategoryList: true
    }, true, (data) => {
        data.Result.map((v) => {
            access = (v.Datasource == datasource) ? v : access;
        });
    });

    if (access.Details !== undefined && access.Details.Ends !== undefined) {
        if (isDateExpired(access.Details.Ends, true)) {
            expired = true;
            last_access = access.Details.Ends;
        }
    } else if (access.DetailsDS !== undefined && access.DetailsDS.UserCategoryList !== undefined && gridMetadata.Datacategory !== undefined) {
        access.DetailsDS.UserCategoryList.map((v) => {
            if (v.Name == gridMetadata.Datacategory) {
                if (isDateExpired(v.UserAccess.Ends, true)) {
                    expired = true;
                    last_access = v.UserAccess.Ends;
                }
            }
        });
    }

    if (expired == true && rowsData.length !== 0 && !disabledGrid) {
        $(".status-bar").show().find("#status-info").text("Access expired on " + last_access);
        $('head').append('<style type="text/css">.watermark.access::before { content: "Access expired on ' + last_access + '"; } </style>');
    } else if (expired && disabledGrid) {
        $(".status-bar").show().find("#status-info").text("Simulated values, Access expired on " + last_access);
    } else if (disabledGrid) {
        $(".status-bar").show().find("#status-info").text("Simulated values");
    }

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
            datafields: bates,
            localdata: rowsData
        };
        dataAdapter = new $.jqx.dataAdapter(source, {
            autoBind: autoBind,
            async: async,
            downloadComplete: function () {},
            loadComplete: function () {},
            loadError: function () {}
        });
    }

    // If the prices are not loaded, load it
    if (!isPricesDataLoaded) {
        loadPricesData(false, true);
    }

    $('#jqxTabs').on('selected', function (event) {
        var tab;
        switch (event.args.item) {
            case 0:
                tab = "prices";
                break
            case 1:
                tab = "chart";
                if (!isChartLoaded) {
                    isChartLoaded = true;
                    createChart(rowsData, columns);
                }
                break
            case 2:
                tab = "corrections";
                if (!isCorrectionsLoaded) {
                    isCorrectionsLoaded = true;
                    loadCorrections(true, gridMetadata, corrections_array);
                }
                break
        }
        window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=" + tab);
    });

    var getDate = function (date) {
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

    // formatter: function (row, field, value, html, columnproperties, record) {
    //     let className = "";
    //     if (Object.keys(data_corr).includes(columnproperties.Date)) {
    //         let data = data_corr[columnproperties.Date];
    //         if (data !== undefined) {
    //             if (data.date !== undefined && (data.column.includes(field) || field == ''))
    //                 if (columnproperties.Date == data.date)
    //                     className = "corr_selected";
    //         }
    //     }
    //     let date = new Date(columnproperties.Date);
    //     if (columnproperties.Date !== undefined && (date.getDay() == 6 || date.getDay() == 0) && highlight_weekends)
    //         className = "highlightBG";
    //     return "<div class='"+className+" cell-title cell-right'>" + (value) + "</div>";
    // }

    // var cellsrendererRows = function (row, column, value, defaulthtml, columnproperties, rowdata) {
    //     value = !isNumberFunc(value) ? value : parseFloat(value).toFixed(column.toLowerCase() == "volume" ? 0 : real_decimal);
    //     value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : value;
    //     return '<div class="v-row" style="margin-top: 6px; margin-right: 4px; text-align: right; width: auto">' + value + '</div>';
    // }

  
    function isIEPreVer9() { var v = navigator.appVersion.match(/MSIE ([\d.]+)/i); return (v ? v[1] < 9 : false); }

    function CreateAddHeaderRow() {
        
        // Define buttons
        var frequency = [{
                name: 'Day',
                value: 'Day'
            },
            {
                name: 'Week',
                value: 'Week'
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

        $("#series_frequency").jqxDropDownList({
            source: frequency,
            displayMember: "name",
            valueMember: "value",
            height: 24,
            placeHolder: "Average",
            selectedIndex: 0
        });

        $("#btnLayout1").jqxButton({
            imgSrc: "resources/css/icons/layout_1.png",
            imgPosition: "center",
            width: 25,
            height: 24,
            imgWidth: 16,
            imgHeight: 18
        });

        $("#btnLayout2").jqxButton({
            imgSrc: "resources/css/icons/layout_2.png",
            imgPosition: "center",
            width: 25,
            height: 24,
            imgWidth: 16,
            imgHeight: 18
        });

        $("#btnLayout3").jqxButton({
            imgSrc: "resources/css/icons/layout_3.png",
            imgPosition: "center",
            width: 25,
            height: 24,
            imgWidth: 16,
            imgHeight: 18
        });

        $("#decimal").jqxButton({
            imgPosition: "center",
            width: 'auto',
            height: 24
        });

        var frame = $('<div class="popup-win" style="text-align:center; width:100%">');
        var msg = $('<div style="float: left;margin-left: 24px;padding: 5px 0;">Decimal Places </div><input id="decimal-input" class="deci2" type="text" readonly>');
        var btns = $("<div style='float:right;margin-top:-4px;margin-right: 16px;'>")
        var button1 = $('<div id="btnSpinnUp" title="" class="jqx-rc-all jqx-rc-all-light jqx-button jqx-button-light jqx-widget jqx-widget-light jqx-fill-state-normal jqx-fill-state-normal-light" role="button" aria-disabled="false" style="height: 15px; width: 21px; box-sizing: border-box; position: relative; overflow: hidden;"><img src="resources/css/images/icon-up.png" width="16" height="16" style="display: inline; position: absolute; left:2px; top: 0;"><span style="display: none; position: absolute; left: 9.5px; top: 5px;"></span></div>');
        var button2 = $('<div id="btnSpinnDown" title="" class="jqx-rc-all jqx-rc-all-light jqx-button jqx-button-light jqx-widget jqx-widget-light jqx-fill-state-normal jqx-fill-state-normal-light" role="button" aria-disabled="false" style="height: 15px; width: 21px; box-sizing: border-box; position: relative; overflow: hidden;"><img src="resources/css/images/icon-down.png" width="16" height="16" style="display: inline; position: absolute; left:2px; top: 0;"><span style="display: none; position: absolute; left: 9.5px; top: 5px;"></span></div>');
        var buttons = $('<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix"><div class="ui-dialog-buttonset"><button type="button" class="bb-ok ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" style="margin-right:10px;padding-top: 4px;padding-bottom: 4px;" role="button"><span class="ui-button-text">Ok</span></button><button type="button" style="padding-top: 4px;padding-bottom: 4px;" class="bb-cancel ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button"><span class="ui-button-text">Cancel</span></button></div></div>');
        btns.append(button1);
        btns.append(button2);
        frame.append(msg);
        frame.append(btns);
        frame.append(buttons);
        $("body").append(frame);

        var icons = ['resources/css/icons/hide-rows_16.png', 'resources/css/icons/weekend_16.png', 'resources/css/icons/filesave.png', 'resources/css/icons/reload.png'];
        var hideDropdownData = [{
                    name: 'Hide Empty Rows',
                    value: 'hide',
                },
                {
                    name: 'Allow Weekends',
                    value: 'weekends',
                },
                {
                    name: 'Export Data',
                    value: 'export',
                },
                {
                    name: 'Refresh Data',
                    value: 'refresh',
                }
        ];

        $("#hideDropdown").jqxDropDownList({
            source: hideDropdownData,
            displayMember: "name",
            valueMember: "value",
            height: 24,
            width:170,
            dropDownHeight: 112,
            placeHolder: '<img height="17" width="17" src="resources/css/icons/starDis_16.png">',
            renderer: function (index, label, DatasourceInfo) {
                if (!DatasourceInfo)
                    return label;
                
                imgurl = DatasourceInfo.icon;
                
                if(index<2){
                    //var checked = (getCookie('series-data-item-'+index) && getCookie('series-data-item-'+index) == 'true') ? ' checked="checked"' : '';
                    var checked = (index == 1) ? ' checked="checked"' : '';
                    return '<input type="checkbox" id="checkbox'+index+'" style="margin-right:3px; vertical-align:middle"'+checked+'/><img height="17" width="17" src="' + icons[index] + '"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                }
                else{
                    return '<img height="17" width="17" src="' + icons[index] + '" style="margin-left:15px;"> <span id="databaseDropdown-lable"> ' + label + '</span>';
                }
            },
            selectionRenderer: function (element, index, label, DatasourceInfo) {
                if(index == 0 || index == 1 ){
                    if(index == 0){
                        if($('#checkbox'+index)[0].checked == true){
                            setTimeout(() => {
                                $('#checkbox'+index)[0].checked = false;
                                hideEmptyRows = false;
                                //setCookie('series-data-item-'+index, $('#checkbox'+index)[0].checked);
                            }, 5);                                    
                        }
                        else{
                            setTimeout(() => {
                                $('#checkbox'+index)[0].checked = true;
                                hideEmptyRows = true;
                                //setCookie('series-data-item-'+index, $('#checkbox'+index)[0].checked);
                            }, 5);
                        }

                        setTimeout(() => {
                            if($('#checkbox'+index)[0].checked == true){
                                if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
                                    hide_data.reverse();
                                source.localdata = hide_data;
                            }
                            else{
                                if (new Date(hide_data[0].Date) < new Date(hide_data[hide_data.length - 1].Date))
                                    rowsData.reverse();
                                source.localdata = rowsData;
                            }
                        }, 20);
                        
                        setTimeout(() => {
                            grid.setData(source.localdata);
                            dataView.beginUpdate();
                            dataView.setItems(source.localdata, "id");
                            dataView.endUpdate();
                            dataView.reSort();

                            grid.invalidate();
                            grid.render();
                        }, 50); 
                    }else{
                        dialogWindow("Changing this setting to "+((allow_weekend==true) ? "off":"on")+" requires a server data refresh. <br/>Do you want to continue?", "query", "confirm", "Monitor+ - Allow Weekends", () => {
                            if($('#checkbox'+index)[0].checked == true){
                                setTimeout(() => {
                                    $('#checkbox'+index)[0].checked = false;
                                    allow_weekend = false;
                                    
                                    parameters.FrequencyOptions= {
                                        AllowWeekends:"off"
                                    }

                                    call_api_ajax('GetDatasetValuesRC', 'POST', JSON.stringify(parameters), true, (data) => {
                                        enterDate(data.Result, parameters.Frequency);
                                        updateChart(rowsData, isChartLoaded, isSubChartLoaded, columns);
                                    }, null, () => {
                                    });
                                }, 5);
                            }
                            else{
                                setTimeout(() => {
                                    $('#checkbox'+index)[0].checked = true;
                                    allow_weekend = true;
                                    parameters.FrequencyOptions= {
                                        AllowWeekends:"on"
                                    }
                                    
                                    call_api_ajax('GetDatasetValuesRC', 'POST', JSON.stringify(parameters), true, (data) => {
                                        enterDate(data.Result, parameters.Frequency);
                                        updateChart(rowsData, isChartLoaded, isSubChartLoaded, columns);

                                    }, null, () => {
                                    });
                                }, 5);
                            }
                        }, null, null, { Ok: "Yes", Cancel: "No" });
                    }                
                }
                else if(index == 2){
                    if (!hasUserAccessToCategory)
                        return;

                    makeExportSeriesDialog();
                }
                else if(index == 3){
                    let freq = $("#frequency-info").text().replace(/[^A-Z]/g, '').toLowerCase();
                    parameters.Frequency = freq;
                    setTimeout(() => {
                        call_api_ajax('GetDatasetValuesRC', 'POST', JSON.stringify(parameters), true, (data) => {
                            enterDate(data.Result, freq);
                            updateChart(rowsData, isChartLoaded, isSubChartLoaded, columns);

                        }, null, () => {
                        }, false);
                    }, 5);
                }
                
                imgurl = 'resources/css/icons/setting_16.png';

                return '<img height="17" width="17" src="' + imgurl + '" id="selectedItemDropMenu" class="seletedItemStyle" valign="center">';
            }
        });

        $("#btnAutosizeSeries").jqxButton({
            imgSrc: "resources/css/icons/autosize.png",
            imgPosition: "center",
            width: 25,
            height: 24,
            imgWidth: 16,
            imgHeight: 16
        });
        $("#btnAutosizeSeries").jqxTooltip({
            content: 'Autosize columns',
            position: 'mouse',
            name: 'movieTooltip'
        });

        $("#fullWidth1").jqxButton({
            imgSrc: "resources/css/icons/fullscreen.png",
            imgPosition: "center",
            width: 25,
            height: 24,
            imgWidth: 16,
            imgHeight: 16
        });
        $("#fullWidth1").jqxTooltip({
            content: 'Toggle grid to full screen width',
            position: 'mouse',
            name: 'movieTooltip'
        });
        
        // When select item from dropmenu
        $("#series_frequency").on('select', function (event) {
            var args = event.args;
            $('#frequency-info').text(args.item.value);

            if (args) {
                let freq = args.item.value.replace(/[^A-Z]/g, '').toLowerCase();

                parameters.Frequency = freq;
                if(allow_weekend == false){
                    parameters.FrequencyOptions= {
                        AllowWeekends:"off"
                    }
                }
                
                setTimeout(() => {
                    call_api_ajax('GetDatasetValuesRC', 'POST', JSON.stringify(parameters), true, (data) => {
                        enterDate(data.Result, freq);
                        updateChart(rowsData, isChartLoaded, isSubChartLoaded, columns);
                    }, null, () => {
                    }, false);
                }, 5);
            }                              
        });

        $("#btnLayout1").on('click', function () {
            $('#bottomSplitter').jqxSplitter('collapse');
            $('#pricesSplitter').jqxSplitter('collapse');
            window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices&layout=1");
        });

        $("#btnLayout2").on('click', function () {
            if (!isSubChartLoaded) {
                isSubChartLoaded = true;
                createSubChart(rowsData, columns);                
            }
            $('#bottomSplitter').jqxSplitter('collapse');
            $('#pricesSplitter').jqxSplitter('expand');
            window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices&layout=2");
        });

        $("#btnLayout3").on('click', function () {
            $('#bottomSplitter').jqxSplitter('expand');
            $('#pricesSplitter').jqxSplitter('expand');
            window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices&layout=3");
            if (!isSubChartLoaded) {
                isSubChartLoaded = true;
                createSubChart(rowsData, columns);
            }
        });

        $("#decimal").on("click", function () {
            frame.css({
                left: $("#decimal").offset().left,
                top: $("#decimal").offset().top + 24
            }).toggle(frame.css('display') == 'none').find('.deci2').val('0.' + decimalText);
            decimalNumber = real_decimal;
        });

        $("#btnAutosizeSeries").on("click", function () {
            //let position = $("#jqxgrid").jqxGrid("scrollposition");
            resizeColumns(grid);
            //$("#jqxgrid").jqxGrid("scrolloffset", position.top, position.left)
        });

        fullWidthFlag = true;
        $("#fullWidth1").on('click', function () {
            let img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';

            $("#fullWidth1").jqxButton({
                imgSrc: "resources/css/icons/" + img + ".png",
                imgPosition: "left",
                width: 25,
                textPosition: "right"
            });
            $(".fixpage").toggleClass('fullscreen', fullWidthFlag);
            $("section .wrap").toggleClass('fullscreen', fullWidthFlag);

            fullWidthFlag = !fullWidthFlag;
            window.dispatchEvent(new Event('resize'));
        });

        $(document).on('click', '.bb-ok', function () {
            real_decimal = decimalNumber;
            
            // for (var i = 0; i < source.localdata.length; i++) {
            //     source.localdata[i].id = "id2_" + i;
            //     source.localdata[i].num = (i + 1);
            // }

            // setTimeout(() => {
            //     grid.setData(source.localdata);
            //     dataView.beginUpdate();
            //     dataView.setItems(source.localdata, "id");
            //     dataView.endUpdate();
                
            //     grid1.setData(sourceCorrections.localdata);
            //     dataView1.beginUpdate();
            //     dataView1.setItems(sourceCorrections.localdata, "id");
            //     dataView1.endUpdate();

            //     // if (correctionsTab)
            //         // $("#jqxgridCorrections").jqxGrid('updatebounddata', 'cells');
            // }, 5);
            $('.popup-win').hide();
            resizeColumns(grid);
        });

        $(document).on('click', '.bb-cancel', function () {
            $('.popup-win').hide();
            decimalNumber = real_decimal;
        });

        $(document).on('click', '#btnSpinnUp', function () {
            if (decimalNumber == 9)
                return;

            decimalNumber++;
            decimalText = '';
            for (var i = 0; i < decimalNumber - 1; i++)
                decimalText += '0';

            decimalText += decimalNumber;
            $(".deci2").val('0.' + decimalText);
        });

        // Decrease the decimal number
        $(document).on('click', '#btnSpinnDown', function () {
            if (decimalNumber == 1)
                return;

            decimalNumber--;

            decimalText = '';
            for (var i = 0; i < decimalNumber - 1; i++)
                decimalText += '0';

            decimalText += decimalNumber;
            $(".deci2").val('0.' + decimalText);
        });
    }
    
    var columns = [{
            id: "sel",
            name: '#',
            sortable: true,
            filterable: false,
            field: 'num',
            columntype: 'number',
            width: 50,
            cellsformat: '',
            formatter: function (row, field, value, html, columnproperties, record) {
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
                return "<div class='"+className+" cell-title cell-right'>" + (value) + "</div>";
            }
        },
        {
            id: "date",
            name: 'Date',
            field: 'Date',
            sortable: true,
            width: 100,
            cellsformat: 'yyyy-MM-dd',
            formatter: function (row, field, value, html, columnproperties, record) {
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
                return "<div class='"+className+" cell-title cell-right'>" + value + "</div>";
            }
        },
    ];

    for (var i in bates) {
        let name = bates[i].name;
        name = name.split("(calculated)").join("(c)");

        if (name == "Adjusted_Close")
            name = "Adj. Close";

        if (!["Date", "corrected", "correction_count", "correction_bates"].includes(bates[i].name))
            columns.push({
                id: name,
                name: name,
                field: bates[i].name,
                filtertype: "float",
                sortable: true,
                cellsformat: '',
                formatter: function (row, field, value, html, columnproperties, record) {
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

                    value = !isNumberFunc(value) ? value : parseFloat(value).toFixed(html.name.toLowerCase() == "volume" ? 0 : real_decimal);
                    value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : (value == null) ? "" : value;
                    return "<div class='"+className+" cell-title cell-right'>" + (value) + "</div>";
                }
            });
    }

    // if (corrections_count !== 0) {
    //     columns.push({
    //         id: 'corrections',
    //         name: '# Corrections',
    //         field: 'correction_count',
    //         hidden: true,
    //         cellsformat: '',
    //         formatter: function (row, field, value, html, columnproperties, record) {
    //             let className = "";
    //             if (Object.keys(data_corr).includes(columnproperties.Date)) {
    //                 let data = data_corr[columnproperties.Date];
    //                 if (data !== undefined) {
    //                     if (data.date !== undefined && (data.column.includes(columnfield) || columnfield == ''))
    //                         if (columnproperties.Date == data.date)
    //                             className = "corr_selected";
    //                 }
    //             }
    //             let date = new Date(columnproperties.Date);
    //             if (columnproperties.Date !== undefined && (date.getDay() == 6 || date.getDay() == 0) && highlight_weekends)
    //                 className = "highlightBG";
    //             return "<div class='"+className+" cell-title cell-right' style='margin:4px; margin-top: 6px;text-align:right'>" + (value + 1) + "</div>";
    //         }
    //     });
    // }

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
            return {valid: false, msg: "This is a required field"};
        }
        else {
            return {valid: true, msg: null};
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
        var x = convert_to_float(a[sortcol]), y = convert_to_float(b[sortcol]);
        return (x == y ? 0 : (x > y ? 1 : -1));
    }
    
    function comparer(a, b) {
        var x = a[sortcol], y = b[sortcol];
        return (x == y ? 0 : (x > y ? 1 : -1));
    }

    function toggleFilterRow() {
        grid.setTopPanelVisibility(!grid.getOptions().showTopPanel);
    }

    $(function () {
        // prepare the data
        var isCategory = false;
        
        for (var i = 0; i < source.localdata.length; i++) {
            source.localdata[i].id = "id_" + i;
            source.localdata[i].num = (i+1);

            if(source.localdata[i].Close == null){
                source.localdata[i].Close = "";
            }

            if(source.localdata[i].High == null){
                source.localdata[i].High = "";
            }

            if(source.localdata[i].Low == null){
                source.localdata[i].Low = "";
            }

            if(source.localdata[i]['Mean (c)'] == null){
                source.localdata[i]['Mean (c)'] = "";
            }

            if(source.localdata[i]['Hi-Lo (c)'] == null){
                source.localdata[i]['Hi-Lo (c)'] = "";
            }
        }

        dataView = new Slick.Data.DataView({ inlineFilters: true });
        grid = new Slick.Grid("#jqxgrid", dataView, columns, options);
        grid.setSelectionModel(new Slick.RowSelectionModel());

        // move the filter panel defined in a hidden div into grid top panel
        $("#inlineFilterPanel")
            .appendTo(grid.getTopPanel())
            .show();

        grid.onCellChange.subscribe(function (e, args) {
            dataView.updateItem(args.item.id, args.item);
        });

        grid.onClick.subscribe(function(e, args) {
        });

        grid.onScroll.subscribe(function(e, args) {
            $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightBG");
            $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightWeekends");
        });

        grid.onSelectedRowsChanged.subscribe(function () {
            var rowsObj = $("#jqxgrid div.grid-canvas").find("div.slick-row");
            for(var i=0; i<rowsObj.length; i++){
                let date = new Date($("#jqxgrid div.grid-canvas").children().eq(i).children('.r1').children().text());
                if (date !== undefined && (date.getDay() == 6 || date.getDay() == 0) && highlight_weekends){
                    $("#jqxgrid div.grid-canvas").children().eq(i).children('.r0').children().addClass("highlightBG");
                    $("#jqxgrid div.grid-canvas").children().eq(i).children('.r1').children().addClass("highlightWeekends");
                    $("#jqxgrid div.grid-canvas").children().eq(i).children('.r2').children().addClass("highlightBG");
                }
            }
            
            setTimeout(() => {
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightBG");
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightWeekends");
            }, 10);
        });

        grid.onContextMenu.subscribe(function (e) {
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

            $("body").one("click", function () {
              $("#jqxgridMenu").hide();
            });

            setTimeout(() => {
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightBG");
                $("#jqxgrid div.grid-canvas .selected").children().removeClass("highlightWeekends");
            }, 10);
        });

        grid.onAddNewRow.subscribe(function (e, args) {
        });

        grid.onKeyDown.subscribe(function (e) {
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

        grid.onSort.subscribe(function (e, args) {
            sortdir = args.sortCols[0].sortAsc ? 1 : -1;
            sortcol = args.sortCols[0].sortCol.field;
            
            if (isIEPreVer9()) {
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
                dataView.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortCols[0].sortAsc);
            } else {
                // using native sort with comparer
                // preferred method but can be very slow in IE with huge datasets
                if(sortcol == "Date")
                    dataView.sort(comparer, args.sortCols[0].sortAsc);
                else
                    dataView.sort(comparer1, args.sortCols[0].sortAsc);
            }

        });

        // wire up model events to drive the grid
        // !! both dataView.onRowCountChanged and dataView.onRowsChanged MUST be wired to correctly update the grid
        // see Issue#91
        dataView.onRowCountChanged.subscribe(function (e, args) {
            grid.updateRowCount();
            grid.render();
        });

        dataView.onRowsChanged.subscribe(function (e, args) {
            grid.invalidateRows(args.rows);
            grid.render();            
        });

        dataView.onRowCountChanged.subscribe(function (e, args) {
            grid.updateRowCount();
            grid.render();
        });

        dataView.onPagingInfoChanged.subscribe(function (e, pagingInfo) {
            grid.updatePagingStatusFromView( pagingInfo );

            // show the pagingInfo but remove the dataView from the object, just for the Cypress E2E test
            delete pagingInfo.dataView;
        });

        dataView.onBeforePagingInfoChanged.subscribe(function (e, previousPagingInfo) {
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
            dataView.setFilterArgs({
                percentCompleteThreshold: percentCompleteThreshold,
                searchString: searchString
            });
            dataView.refresh();
        }

        $("#btnSelectRows").click(function () {
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

        CreateAddHeaderRow();

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

        if (!hasUserAccessToCategory) {
            $("#jqxgridCorrectionDetails #contentjqxgridCorrectionDetails").addClass("mat");
            $(".chartContainer").addClass("mat");
        }

        //$("#jqxgrid").toggleClass('watermark', disabledGrid);
        if (expired && !disabledGrid) $("#jqxgrid").toggleClass('watermark access', expired);

        resizeColumns(grid);
    });

    // Change text of loading message form "Loading..." to "Requesting Data.."
    $('#jqxgrid').find('div.jqx-grid-load').next().text('Requesting Data...').css({
        'font-family': 'Calibri',
        'font-size': '14px',
        'color': '#333'
    }).parent().parent().width(153);

    $("#jqxgrid").on("columnresized", function (event) {
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

    $("#jqxgrid").on('contextmenu', function () {
        return false;
    });

    $("#jqxgridMenu").on('itemclick', function (event) {
        var args = event.args;
        switch ($.trim($(args).text())) {
            case "Select All":
                var sel_columns = [];
                if(grid.getData().length == undefined)
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

            case "Highlight weekends":
                highlight_weekends = !highlight_weekends;
                $(".highlight-weekends").toggle(highlight_weekends);
                grid.setColumns(columns);
                break;
        }
    });

    if (parseInt(corrections_count) > 0) {
        $("#jqxgrid").on("rowclick", function (event) {
            if (event.args.row.bounddata.corrected == true)
                showCorrectionDetails(event.args.row.bounddata);
        });

        $("#jqxgrid").on("rowdoubleclick", function (event) {
            if (event.args.row.bounddata.corrected == true) {
                $('#bottomSplitter').jqxSplitter('expand');
                showCorrectionDetails(event.args.row.bounddata);
            }
        });
    }

    function copySelectedSeriesToClipboard() {
        var rowsindexes = grid.getSelectedRows();
        var rows = [];
        for (var i = 0; i < rowsindexes.length; i++) {
            rows[rows.length] = grid.getDataItem(rowsindexes[i]);
        }

        var Results = getRowsData();

        Results.splice(1, 4);
        Results.splice(0, 1, ["Name:", gridMetadata.Name + ' (' + full_symbol + ')']);

        var CsvString = "";
        Results.forEach(function (RowItem, RowIndex) {
            RowItem.forEach(function (ColItem, ColIndex) {
                CsvString += ColItem + "\t";
            });
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

    function showCorrectionDetails() {
        // $("#jqxgridCorrectionDetails").jqxGrid('updatebounddata', 'cells');
        // $("#jqxgridCorrectionDetails").jqxGrid('autoresizecolumns', 'cells');
    }

    var sourceCorrections = {
        datafields: [{
                name: 'PriceDay',
                type: 'date'
            },
            {
                name: 'CorrectionDateTime',
                type: 'date'
            },
            {
                name: 'IssuedDate',
                type: 'date'
            },
            {
                name: 'Bate',
                type: 'string'
            },
            {
                name: 'Type',
                type: 'string'
            },
            {
                name: 'OriginalPrice',
                type: 'string'
            },
            {
                name: 'CorrectedPrice',
                type: 'string'
            },
            {
                name: 'AddedToDB',
                type: 'date'
            }
        ],
        localdata: corrections_array
    };

    var columns_detail = [{
            id: 'date',
            name: 'Date',
            field: 'PriceDay',
            sortable: true,
            filtertype: 'range',
            width: 165,
            cellsformat: 'yyyy-MM-dd',
            cssClass: "cell-title"
        },
        {
            id: 'type',
            name: 'Type',
            field: 'Type',
            width: 120,
            cssClass: "cell-title"
        },
        {
            id: 'bate',
            name: 'Bate',
            field: 'Bate',
            sortable: true,
            width: 120,
            cssClass: "cell-title"
        },
        {
            id: 'original_value',
            name: 'Original Value',
            field: 'OriginalPrice',
            sortable: true,
            width: 210,
            formatter: function (row, field, value, html, columnproperties, record) {
                value = !isNumberFunc(value) ? value : parseFloat(value).toFixed(html.name.toLowerCase() == "volume" ? 0 : real_decimal);
                value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : value;
                return '<div class="v-row" style="margin-top: 6px; margin-right: 4px; text-align: right; width: auto">' + value + '</div>';
            }
        },
        {
            id: 'corrected_value',
            name: 'Corrected Value',
            field: 'CorrectedPrice',
            sortable: true,
            width: 200,
            formatter: function (row, field, value, html, columnproperties, record) {
                value = !isNumberFunc(value) ? value : parseFloat(value).toFixed(html.name.toLowerCase() == "volume" ? 0 : real_decimal);
                value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : value;
                return '<div class="v-row" style="margin-top: 6px; margin-right: 4px; text-align: right; width: auto">' + value + '</div>';
            }
        },
        {
            id: 'date_issued',
            name: 'Date Issued',
            field: 'IssuedDate',
            sortable: true,
            width: 200,
            cellsformat: 'yyyy-MM-dd hh:mm',
            cssClass: "cell-title"
        },
        {
            id: 'date_added',
            name: 'Date Added',
            field: 'AddedToDB',
            sortable: true,
            width: 200,
            cellsformat: 'yyyy-MM-dd hh:mm',
            cssClass: "cell-title"
        }
    ];

    function CreateDetailAddHeaderRow() {
        $("#btnAutosizeCorrectionDetails").jqxButton({
            imgSrc: "resources/css/icons/autosize.png",
            imgPosition: "center",
            width: '30'
        });
        $("#btnCloseCorrestinDetails").jqxButton({
            imgSrc: "resources/css/icons/clear.png",
            imgPosition: "center",
            width: 24,
            height: 24
        });

        $("#btnCloseCorrestinDetails").on('click', function () {
            $('#bottomSplitter').jqxSplitter('collapse');
        });

        $("#btnAutosizeCorrectionDetails").on('click', function () {
            resizeColumns(grid1);
        });
    }
    
    $(function () {
        // prepare the data
        for (var i = 0; i < sourceCorrections.localdata.length; i++) {
            sourceCorrections.localdata[i].id = "id_" + i;
            sourceCorrections.localdata[i].num = (i+1);
        }

        dataView1 = new Slick.Data.DataView({ inlineFilters: true });
        grid1 = new Slick.Grid("#jqxgridCorrectionDetails", dataView1, columns_detail, options);
        grid1.setSelectionModel(new Slick.RowSelectionModel());

        // you need to provide a DOM element container for the plugin to calculate available space
        
        // var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);

        // move the filter panel defined in a hidden div into grid top panel
        $("#inlineFilterPanel")
            .appendTo(grid.getTopPanel())
            .show();

        grid1.onCellChange.subscribe(function (e, args) {
            dataView1.updateItem(args.item.id, args.item);
        });

        grid1.onClick.subscribe(function(e, args) {
        });

        grid1.onContextMenu.subscribe(function (e) {
        });

        grid1.onAddNewRow.subscribe(function (e, args) {
            var item = {"num": data.length, "id": "new_" + (Math.round(Math.random() * 10000)), "title": "New task", "duration": "1 day", "percentComplete": 0, "start": "01/01/2009", "finish": "01/01/2009"};
            $.extend(item, args.item);
            dataView1.addItem(item);
        });

        grid1.onKeyDown.subscribe(function (e) {
            // select all rows on ctrl-a
            if (e.which != 65 || !e.ctrlKey) {
                return false;
            }

            var rows = [];
            for (var i = 0; i < dataView1.getLength(); i++) {
                rows.push(i);
            }

            grid1.setSelectedRows(rows);
            e.preventDefault();
        });

        grid1.onSort.subscribe(function (e, args) {
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
                dataView1.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortCols[0].sortAsc);
            } else {
                // using native sort with comparer
                // preferred method but can be very slow in IE with huge datasets
                dataView1.sort(comparer, args.sortCols[0].sortAsc);
            }

        });

        // wire up model events to drive the grid
        // !! both dataView.onRowCountChanged and dataView.onRowsChanged MUST be wired to correctly update the grid
        // see Issue#91
        dataView1.onRowCountChanged.subscribe(function (e, args) {
            grid1.updateRowCount();
            grid1.render();
        });

        dataView1.onRowsChanged.subscribe(function (e, args) {
            grid1.invalidateRows(args.rows);
            grid1.render();
        });

        dataView1.onPagingInfoChanged.subscribe(function (e, pagingInfo) {
            grid1.updatePagingStatusFromView( pagingInfo );

            // show the pagingInfo but remove the dataView from the object, just for the Cypress E2E test
            delete pagingInfo.dataView;
        });

        dataView1.onBeforePagingInfoChanged.subscribe(function (e, previousPagingInfo) {
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
            dataView1.setFilterArgs({
                percentCompleteThreshold: percentCompleteThreshold,
                searchString: searchString
            });
            dataView1.refresh();
        }

        $("#btnSelectRows").click(function () {
            if (!Slick.GlobalEditorLock.commitCurrentEdit()) {
                return;
            }

            var rows = [];
            for (var i = 0; i < 10 && i < dataView.getLength(); i++) {
                rows.push(i);
            }

            grid1.setSelectedRows(rows);
        });

        grid1.init();

        CreateDetailAddHeaderRow();

        // initialize the model after all the events have been hooked up
        dataView1.beginUpdate();
        dataView1.setItems(sourceCorrections.localdata);
        dataView1.setFilterArgs({
            percentCompleteThreshold: percentCompleteThreshold,
            searchString: searchString
        });
        dataView1.setFilter(myFilter);
        dataView1.endUpdate();

        // if you don't want the items that are not visible (due to being filtered out
        // or being on a different page) to stay selected, pass 'false' to the second arg
        dataView1.syncGridSelection(grid1, true);

        setTimeout(() => {
            var rows = grid.getData().getItems();
            var rowData = grid1.getData().getItems();
            var rowsCount = rows.length;
            data_corr = {};

            for (var i = 0; i < rowsCount; i++) {
                var value = source.localdata[i].Date;
                for (var n = 0; n < rowData.length; n++) {
                    if (value == getDate(rowData[n].PriceDay)) {
                        
                        if (data_corr[getDate(rowData[n].PriceDay)] !== undefined && !data_corr[getDate(rowData[n].PriceDay)].column.includes(rowData[n].Bate)) {
                            data_corr[getDate(rowData[n].PriceDay)].column.push(rowData[n].Bate);
                        } else {
                            data_corr[getDate(rowData[n].PriceDay)] = {
                                date: rowData[n].PriceDay,
                                column: ["Date", rowData[n].Bate]
                            };
                        }
                    }
                }
            }
            // $('#jqxgrid').jqxGrid('updatebounddata', 'cells');
        }, 5);
    });


    $("#jqxgridCorrectionDetails").on('rowclick', function (event) {
        var rowData = grid1.getDataItem(event.args.rowindex);
        var rows = grid.getData().getItems();
        var rowsCount = rows.length;
        for (var i = 0; i < rowsCount; i++) {
            var value = source.localdata[i].Date;
            if (value == getDate(rowData.PriceDay)) {
                //$('#jqxgrid').jqxGrid('clearselection');
                grid.setSelectedRows([i]);
                //$('#jqxgrid').jqxGrid('scrolloffset', 28 * i, 0);
                break;
            }
        }
    });

    function resizeElements() {
        var contentBottomPadding = parseInt($(".main-content").css("padding-bottom"));
        $('#mainSplitter').css('min-height', (window.innerHeight - $(".navbar").height() - contentBottomPadding + 10) + 'px');
        setTimeout(() => {
            $('#jqxgrid').css('width', '100%').css('height', ($('#pricesSplitter').css('height').slice(0,-2)-34));
            
            grid_height = $('#jqxgrid').css('height').slice(0, -2);
            $('#jqxgrid .slick-pane-top').css('height', (grid_height-34));
            $('#jqxgrid .slick-viewport').css('height', (grid_height-34));

            $('#jqxgridCorrectionDetails').css('height', ($('#mainSplitter').css('height').slice(0,-2)-$('#pricesSplitter').css('height').slice(0,-2)-110));
            
            grid1_height = $('#jqxgridCorrectionDetails').css('height').slice(0, -2);
            $('#jqxgridCorrectionDetails .slick-pane-top').css('height', (grid1_height-34));
            $('#jqxgridCorrectionDetails .slick-viewport').css('height', (grid1_height-34));
        }, 5);

        setTimeout(() => {
            $('#jqxgridCorrectionDetails').css('width', '100%');
        }, 10);
      //$(".jqx-tabs-content-element").css("height", (window.innerHeight - $(".navbar").height() - contentBottomPadding - 69) + "px");
    }

    $(window).resize(function () {
        resizeElements()
    });
    resizeElements();

    $('#exportDialogWindow').jqxWindow({
        showCollapseButton: false,
        resizable: false,
        height: 240,
        width: 400,
        autoOpen: false,
        title: 'Export Database Metadata',
        initContent: function () {
            $('#exportSeriesBtn').jqxButton({
                width: '75px',
                height: '30px'
            });
            $("#exportSeriesBtn").on('click', function () {
                exportData();
                $('#exportDialogWindow').jqxWindow('close');
            });

            $('#cancelExportDialog').jqxButton({
                width: '75px',
                height: '30px'
            });
            $("#cancelExportDialog").on('click', function () {
                $('#exportDialogWindow').jqxWindow('close');
            });
        }
    });

    function makeExportSeriesDialog() {
        var rows = grid.getData().getItems();
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
    }

    function getRowsData() {
        var frequencyDropdown = $("#series_frequency").jqxDropDownList('getSelectedItem'),
            frequency = frequencyDropdown != null ? frequencyDropdown.value : 'Default',
            export_type = $('input[name="export_type"]:checked').val(),
            rows,
            datasets = [];

        if (export_type == "selected") {
            var indexes = grid.getSelectedRows();

            if (indexes.length == 0) {
                dialogWindow("Please select at least one date", "error");
                return;
            } else {
                indexes.forEach(function (item, i, indexes) {
                    rows = grid.getDataItem(indexes[i]);
                    let data = columns.map(function (v) {
                        if (v.field == "Date") {
                            var date = new Date(rows[v.field]),
                                day = date.getDate(),
                                month = date.getMonth() + 1,
                                year = date.getFullYear();
                            day = (day < 10) ? '0' + day : day;
                            month = (month < 10) ? '0' + month : month;
                            return year + '-' + month + '-' + day;
                        }
                        return (rows[v.field] == undefined) ? "" : parseFloat(rows[v.field]).toFixed(real_decimal);
                    });
                    datasets.push(data.slice(1));
                });
            }
        } else if (export_type == "all") {
            var items = grid.getData().getItems();

            items.forEach(function (rows) {
                let data = columns.map(function (v) {
                    if (v.field == "Date") {
                        var date = new Date(rows[v.field]),
                            day = date.getDate(),
                            month = date.getMonth() + 1,
                            year = date.getFullYear();
                        day = (day < 10) ? '0' + day : day;
                        month = (month < 10) ? '0' + month : month;
                        return year + '-' + month + '-' + day;
                    }
                    return (rows[v.field] == undefined) ? "" : rows[v.field];
                });
                datasets.push(data.slice(1));
            });
        }

        Results = [
            ["Name:", gridMetadata.Name],
            ["Series:", full_symbol],
            ["Average:", frequency],
            ["From:", gridMetadata.StartDate],
            ["To:", gridMetadata.EndDate],
        ];

        Results.push(columns.map(v => v.name).slice(1));
        datasets.map(v => Results.push(v));

        return Results;
    }
    // Export data to csv file
    function exportData() {

        var date = new Date(),
            day = date.getDate(),
            month = date.getMonth() + 1,
            year = date.getFullYear();

        day = (day < 10) ? '0' + day : day;
        month = (month < 10) ? '0' + month : month;
        date = day + '-' + month + '-' + year;

        var Results = getRowsData();

        var CsvString = "";
        Results.forEach(function (RowItem, RowIndex) {
            RowItem.forEach(function (ColItem, ColIndex) {
                if (ColItem == "") ColItem = " ";
                CsvString += '"' + ColItem.toString() + '",';
            });
            CsvString += "\r\n";
        });

        CsvString = "data:application/csv," + encodeURIComponent(CsvString);

        var link = document.createElement("a");
        link.href = CsvString;
        link.download = datasource + "-" + symbol + "-EXPORT-" + date + ".csv";
        link.click();
    }


    function loadCorrections(async, gridMetadata, corrections_array) {
        if (corrections_count == 0) return;

        var source = {
            datafields: [{
                    name: 'PriceDay',
                    type: 'date'
                },
                {
                    name: 'CorrectionDateTime',
                    type: 'date'
                },
                {
                    name: 'IssuedDate',
                    type: 'date'
                },
                {
                    name: 'Bate',
                    type: 'string'
                },
                {
                    name: 'Type',
                    type: 'string'
                },
                {
                    name: 'OriginalPrice',
                    type: 'string'
                },
                {
                    name: 'CorrectedPrice',
                    type: 'string'
                },
                {
                    name: 'AddedToDB',
                    type: 'date'
                }
            ],
            localdata: corrections_array
        };
        correctionsDataAdapter = new $.jqx.dataAdapter(source, {
            async: true,
            autoBind: false
        });

        $("#jqxgridCorrections").jqxGrid({
            width: '100%',
            height: '100%',
            source: correctionsDataAdapter,
            columnsresize: true,
            sortable: true,
            filterable: true,
            ready: function () {
                correctionsTab = true;
                $("#jqxgridCorrections").jqxGrid('updatebounddata', 'cells');
                resizeColumns('jqxgridCorrections');

            },
            columns: [{
                    text: 'Date',
                    datafield: 'PriceDay',
                    cellsalign: 'center',
                    align: 'center',
                    filtertype: 'range',
                    cellsformat: 'yyyy-MM-dd'
                },
                {
                    text: 'Type',
                    datafield: 'Type',
                    align: 'center',
                    cellsalign: 'center'
                },
                {
                    text: 'Bate',
                    datafield: 'Bate',
                    align: 'center',
                    cellsalign: 'center'
                },
                {
                    text: 'Original Value',
                    datafield: 'OriginalPrice',
                    cellsalign: 'right',
                    align: 'center',
                    formatter: function (row, field, value, html, columnproperties, record) {
                        value = !isNumberFunc(value) ? value : parseFloat(value).toFixed(html.name.toLowerCase() == "volume" ? 0 : real_decimal);
                        value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : value;
                        return '<div class="v-row" style="margin-top: 6px; margin-right: 4px; text-align: right; width: auto">' + value + '</div>';
                    }
                },
                {
                    text: 'Corrected Value',
                    datafield: 'CorrectedPrice',
                    align: 'center',
                    cellsalign: 'right',
                    formatter: function (row, field, value, html, columnproperties, record) {
                        value = !isNumberFunc(value) ? value : parseFloat(value).toFixed(html.name.toLowerCase() == "volume" ? 0 : real_decimal);
                        value = (value == 'NA') ? '<span id="NoValue">N/A<span>' : value;
                        return '<div class="v-row" style="margin-top: 6px; margin-right: 4px; text-align: right; width: auto">' + value + '</div>';
                    }
                },
                {
                    text: 'Date Issued',
                    datafield: 'IssuedDate',
                    align: 'center',
                    cellsalign: 'center',
                    cellsformat: 'yyyy-MM-dd hh:mm'
                },
                {
                    text: 'Date Added',
                    datafield: 'AddedToDB',
                    align: 'center',
                    cellsalign: 'center',
                    cellsformat: 'yyyy-MM-dd hh:mm'
                }
            ]
        });
    }

    var meta_rows = $("#metadataContent").find("div"),
        size = 1.35 * (meta_rows[0].offsetHeight + meta_rows[1].offsetHeight);
  
    $('#mainSplitter').jqxSplitter({
        height: '100%',
        width: '100%',
        orientation: 'horizontal',
        panels: [{
            size: size + "px"
        }, {
            size: "50%"
        }]
    });
    $('#bottomSplitter').jqxSplitter({
        height: '100%',
        width: '100%',
        orientation: 'horizontal',
        panels: [{
            size: "70%",
            collapsible: false
        }, {
            size: "30%",
            collapsed: true
        }]
    });
    $('#pricesSplitter').jqxSplitter({
        height: '100%',
        width: '100%',
        orientation: 'vertical',
        panels: [{
            size: "50%",
            collapsible: false
        }, {
            size: "50%",
            collapsible: true
        }]
    });

    $('#bottomSplitter').on('resize', function (e) {
        // $("#jqxgridCorrectionDetails").jqxGrid({
        //     height: $('#jqxgridCorrectionDetails').parent().height()
        // });
        if (linessubchart !== undefined && $('#subchart').width() > 10) {
            window.dispatchEvent(new Event('resize'));
        }
    });

    $('#pricesSplitter').on('resize', function (e) {
      setTimeout(() => {
        $('.left-toolbar-button').css('display', 'block');
        $('.right-toolbar-content').css('justify-content', 'flex-end').css('margin-left', 'auto');
      }, 50);
         //if ($("#seriesToolbar").length > 0) setTimeout(() => {
         //    $("#seriesToolbar").jqxToolBar('refresh')
         //}, 100);
        if (linessubchart !== undefined && $('#subchart').width() > 10) {
            window.dispatchEvent(new Event('resize'));
        }

    });

    $('#pricesSplitter').on('expanded', function (e) {
        if (!isSubChartLoaded) {
            isSubChartLoaded = true;
            createSubChart(rowsData, columns);
        }
    });

    $('#mainSplitter').on('resize expanded collapsed', function (e) {
        $(".jqx-tabs-content-element").each(function () {
            $(this).css({
                height: $('#bottomPanel').css('height').slice(0,-2) - 35 + "px"
            });
        });
      
        if (linessubchart !== undefined && $('#subchart').width() > 10) {
            if ($("#bottom-subchart").css("display") !== "none") {
                $("#top-subchart").css({
                    height: "calc( 70% - 48px )"
                });
                $("#bottom-subchart").css({
                    height: "calc( 30% - 48px )"
                });
            } else {
                $("#top-subchart").css({
                    height: "calc( 100% - 96px )"
                });
            }
        }
        if (lineschart !== undefined && $("#chart").width() > 10) {
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

    if (layout == 2) {
        $('#bottomSplitter').jqxSplitter('collapse');
        $('#pricesSplitter').jqxSplitter('expand');
    } else if (layout == 3 || corrections_count > 0) {
        if (!isSubChartLoaded) {
            isSubChartLoaded = true;
            createSubChart(rowsData, columns);
        }
        $('#bottomSplitter').jqxSplitter('expand');
        $('#pricesSplitter').jqxSplitter('expand');
    } else {
        $('#bottomSplitter').jqxSplitter('collapse');
        $('#pricesSplitter').jqxSplitter('expand');
    }

    if (requestedTab != null && requestedTab != '') {
        if (requestedTab == 'chart') {
            $('#jqxTabs').jqxTabs('select', 1);
            if (!isChartLoaded) {
                isChartLoaded = true;
                createChart(rowsData, columns);
            }
        } else if (requestedTab == 'corrections' && corrections_count > 0) {
            setTimeout(function () {
                $('#jqxTabs').jqxTabs('select', 2);
                if (!isCorrectionsLoaded) {
                    isCorrectionsLoaded = true;
                    loadCorrections(true, gridMetadata, corrections_array);
                }
            }, 2000);
        } else window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices" + layoutURL);
    } else window.history.pushState("datasetsPage", datasource + " database", "/seriesviewer?symbol=" + full_symbol + "&tab=prices" + layoutURL);


    if (corrections_count == 0) {
        $('#jqxTabs').jqxTabs('removeAt', 2);
    }

    $('#triangle').click(function () {
        meta_rows = $("#metadataContent").find("div"),
            size = 1.35 * (meta_rows[0].offsetHeight + meta_rows[1].offsetHeight),
            number = $("#metadataContent")[0].offsetHeight;
      
        if (toggleMetaData === 1) {
            this.src = "resources/images/up.png";
            $('#mainSplitter').jqxSplitter({
                panels: [{
                    size: number * 1.1 + "px"
                }]
            });
          
          $(".jqx-tabs-content-element").each(function () {
            $(this).css({
              height: $('#mainSplitter').css('height').slice(0,-2) - 163 + "px"
            });
          });

          if (linessubchart !== undefined && $('#subchart').width() > 10) {
            if ($("#bottom-subchart").css("display") !== "none") {
              $("#top-subchart").css({
                height: "calc( 70% - 48px )"
              });
              $("#bottom-subchart").css({
                height: "calc( 30% - 48px )"
              });
            } else {
              $("#top-subchart").css({
                height: $('#mainSplitter').css('height').slice(0,-2) - 268 + "px"
              });
            }
          }
          if (lineschart !== undefined && $("#chart").width() > 10) {
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
          
        } else if (toggleMetaData === -1) {
            this.src = "resources/images/down.png";
            $('#mainSplitter').jqxSplitter({
                panels: [{
                    size: size + "px"
                }]
            });
          
          $(".jqx-tabs-content-element").each(function () {
            $(this).css({
                height: $('#mainSplitter').css('height').slice(0,-2) - 83 + "px"
            });
        });
      
        if (linessubchart !== undefined && $('#subchart').width() > 10) {
            if ($("#bottom-subchart").css("display") !== "none") {
                $("#top-subchart").css({
                    height: "calc( 70% - 48px )"
                });
                $("#bottom-subchart").css({
                    height: "calc( 30% - 48px )"
                });
            } else {
                $("#top-subchart").css({
                    height: $('#mainSplitter').css('height').slice(0,-2) - 188 + "px"
                });
            }
        }
        if (lineschart !== undefined && $("#chart").width() > 10) {
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
        }
        toggleMetaData *= -1;
        window.dispatchEvent(new Event('resize'));
    });

    $('body').removeClass('hiddenBody');
    let x = $("#right-toolbar-content").children('.jqx-widget');
    x.addClass('d-none');
}