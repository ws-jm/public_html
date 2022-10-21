function openSeriesInNewTab(database, category, n = 0)
{   
    let message = "Do you want to view the metadata for category: "+category+"?";
    if ( n )
        message = "Do you want to view the data series in "+database+"?";

    dialogWindow(message, 'query', 'confirm', null,
    function()
    {
        if ( n )
            window.open('mydsviewer?Datasource='+database+'&Page=1', '_blank')
        else
            window.open('mydsviewer?Datasource='+database+'&Page=1&Category='+category, '_blank')
    },
    null, null, { Ok: 'Yes', Cancel: 'No' });
}
function resizeColumns( grid_id )
{
    var grid = $("#" + grid_id),
    columns = grid.jqxGrid('columns').records,
    rows = grid.jqxGrid('getrows'),
    all_data = {},
    datafield = {},
    index = 0,
    index_array = [],
    width,
    widthWithoutDescription = 0,
    descriptionWidth,
    descriptionMinWidth,
    z = 0;
    columns_width = {},
    K = 10;
    
    if ( grid.find('#verticalScrollBar'+grid_id).length && grid.find('#verticalScrollBar'+grid_id).css('visibility') !== "hidden" ) {
        z = 2.2;
    }

    if ( columns !== undefined )
    {
        grid.jqxGrid('autoresizecolumns');
        width = grid.width();
        descriptionWidth = grid.jqxGrid('getcolumnproperty','Description','width'),
        descriptionMinWidth = grid.jqxGrid('getcolumnproperty','Description','minwidth');

        columns.map(function ( column )
        {
            if ( !column.hidden )
            {
                let firstColumnData = [];

                for ( var i = 0; i < rows.length; i++ )
                {
                    let value = rows[i][ column.datafield ];

                    if ( value !== undefined && value !== null && typeof value.getMonth == "function" )
                    {
                        var dd = value.getDate(); 
                        var mm = value.getMonth() + 1; 
                
                        var yyyy = value.getFullYear(); 
                        if (dd < 10) { 
                            dd = '0' + dd; 
                        } 
                        if (mm < 10) { 
                            mm = '0' + mm; 
                        } 
                        value = yyyy + "-" + mm + "-" + dd; 
                    }
                    firstColumnData.push( value );
                }
                all_data[column.text] = firstColumnData;
                datafield[column.text] = column.datafield;
                index_array[column.text] = index;
            }
            index++;
        });


        for ( var i in all_data )
        {
            if ( all_data[i].length > 0 )
            {
                let l = 0;
                all_data[i].map(function (v)
                {
                    if ( v !== undefined && v !== null && typeof v !== 'boolean' && v.length > l )
                        l = v.length;
                });

                if ( i.split('<').length == 0 && l < i.length ) l = i.length;
                
                var w = grid.jqxGrid('getcolumnproperty', datafield[i] , 'width');

                if ( datafield[i] !== 'Description' )
                {
                    let width = ( l*K > w ) ? l*K : w;

                    if ( datafield[i] == 'Datasource' )
                        width += grid.jqxGrid('getcolumnproperty', datafield[i] , 'minwidth');

                    columns_width[ datafield[i] ] = width;
                    columns[ index_array[ i ] ]['width'] = width;
                    widthWithoutDescription += ( width + z );
                }
            }
        }

        if ( descriptionWidth + widthWithoutDescription > width )
        {
            if ( descriptionMinWidth + widthWithoutDescription < width )
                descriptionWidth = width - widthWithoutDescription;
            else
                descriptionWidth = descriptionMinWidth;
        }
        else
            descriptionWidth = width - widthWithoutDescription;

        columns.map(function(v) {
            if (v.datafield == "Description")
                v.width = descriptionWidth;
        });
        
        grid.jqxGrid({ columns : columns });
        grid.jqxGrid('refresh');
    }
}

function resizeGrid()
{
    let gridColumns = $('#jqxgrid').jqxGrid('columns').records,
    rows = $('#jqxgrid').jqxGrid('getrows');
    gridColumns[0].text = "";
    
    $('#jqxgrid').jqxGrid('autoresizecolumns');

    var widthWithoutDesc = 0;

    for ( var i = 2; i < gridColumns.length; i++ )
    {
        let datarow = rows.map(function ( r ) {
            if ( gridColumns[i].datafield == "Name" )
            {
                let l = gridColumns[i].datafield,
                l2 = r[ gridColumns[i].datafield ],
                l3 = "Datasource: " + r.Datasource;
                if ( l.length > l2.length && l.length > l3.length ) return parseInt ( l.length  * 6.3 );
                if ( l2.length > l.length && l2.length > l3.length ) return parseInt( l2.length * 6.3 );
                if ( l3.length > l.length && l3.length > l2.length ) return parseInt( l3.length * 6.3 );
            }
            else if ( r[ gridColumns[i].datafield ] !== undefined )
            {
                let val = String( r[ gridColumns[i].datafield ] );
                let n = 7;
                if ( gridColumns[i].datafield == "SeriesCount" ) n = 9.5;
                if ( gridColumns[i].datafield == "Description" ) n = 5.7;
                if ( gridColumns[i].datafield == "Access" || gridColumns[i].datafield == "Available" )
                {
                    let nVal = val.split('to');
                    let aVal = val.split('at');
                    if ( nVal.length == 2 )
                    {
                        val = nVal[0] + ' to'
                    }
                    else if ( aVal.length == 2 ) {
                        val = aVal[0] + ' at'
                    }
                }

                if ( gridColumns[i].text.length > val.length )
                    return parseInt( gridColumns[i].text.length * n );
                else
                    return parseInt( val.length * n );
            }
            else return r[ gridColumns[i].datafield ];
        });

        let maxN = Math.max( ...datarow );
        if ( gridColumns[i].datafield !== "Description" ) {
            widthWithoutDesc += maxN;
            $("#jqxgrid").jqxGrid('setcolumnproperty', gridColumns[i].datafield, 'width', maxN);
        }
    }
    let moreSize = 80;
    if ( $("#jqxgrid").find('#verticalScrollBarjqxgrid').length && $("#jqxgrid").find('#verticalScrollBarjqxgrid').css('visibility') !== "hidden" )
        moreSize = 95;

    $("#jqxgrid").jqxGrid('setcolumnproperty', "Description", 'width', $("#jqxgrid").width() - widthWithoutDesc - moreSize );
}

$( document ).ready(function ()
{
    $.jqx.utilities.scrollBarSize = 11;

    var sessionToken = getSession(),
    userName = '';

    // Get user data and check if session is not Expired
    call_api_ajax('GetMyAccountDetails', 'get', { SessionToken: sessionToken }, false, ( data ) =>
    {
        userName = data.Result.Name;
		$('#username').text( userName );
    });

    function datasource( data )
    {
        var mainGrid = data.map(function( v )
        {
            let dataObject = {
                Name: v.Name,
                Description: v.Description,
//                Icon: v.Icon,
                Logo: v.Logo,
                Datasource: v.Datasource,
                SeriesCount: v.SeriesCount,
                CategoryDS: v.CategoryDS
            };

            if ( v.CategoryDS )
            {
                dataObject.Available = v.Updated.split('T').join(' at ').split('Z').join(' ');
                dataObject.Access = v.DetailsDS.UserCategoryCount +'/'+ v.DetailsDS.CategoryCount;
                let cate = v.DetailsDS.Categories.map( function ( c ) {
                    c.Datasource = v.Datasource;
                    return c;
                });
                dataObject.Categories = cate;
            }
            else {
//                dataObject.Access = v.Details.AccessStartDate +' to '+ v.Details.AccessEndDate;
                dataObject.Access = v.Details.Starts +' to '+ v.Details.Ends;
                dataObject.Available = v.Details.Starts + ' to ' + v.Details.Ends;
            }

            return dataObject;
        });

        return mainGrid;
    }

    call_api_ajax('GetUserDatasources', 'get', { SessionToken: sessionToken, ReturnCategoryList: 'true' }, true, ( data ) =>
    {
        data = data.Result;

        let mainGrid = datasource( data );

        var source = {
            datafields: [
//                { name: 'Icon', type: 'string' },
                { name: 'Logo', type: 'string' },
                { name: 'Name', type: 'string' },
                { name: 'SeriesCount', type: 'int' },
                { name: 'Access', type: 'string' },
                { name: 'Available', type: 'string' },
                { name: 'Description', type: 'string' },
                { name: 'CategoryDS', type: 'boolean' },
                { name: 'Categories', type: 'array' },
                { name: 'Datasource', type: 'string' }
            ],
            async: true,
            localdata: mainGrid
        };

        var nestedGrids = new Array();

        // create nested grid.
        var initrowdetails = function ( index, parentElement, gridElement, record )
        {
            var grid = $($(parentElement).children()[0]);
            nestedGrids[index] = grid;

            // fill the orders depending on the id.
            
            var orderssource = { datafields: [
                { name: 'Name', type: 'string' },
                { name: 'Description', type: 'string' },
                { name: 'StartDate', type: 'date' },
                { name: 'EndDate', type: 'date' },
                { name: 'AccessStartDate', type: 'date' },
                { name: 'AccessEndDate', type: 'date' },
                { name: 'SeriesCount', type: 'int' },
                { name: 'AccessType', type: 'string' },
                { name: 'InactiveAccess', type: 'boolean' },
                { name: 'Datasource', type: 'string' }
            ],
                localdata: record.Categories
            };

            var symbol_renderer = function (row, datafield, value, html, columnproperties, record) 
            {
                return '<div class="jqx-grid-cell-left-align" id="vCenter" ><a target="_blank" onclick="openSeriesInNewTab(\'' + record.Datasource + '\',\'' + value + '\');">' + value + '</a></div>';
            };

            var inactiveAccess_renderer = function (row, datafield, value) 
            {
                if (value) return '<div class="inactiveRenderer"><img id="startIcon" height="17" width="17" src="resources/css/icons/confirm24.png"></div>';
                else return '<div class="inactiveRenderer"><img id="startIcon" height="17" width="17" src="resources/css/icons/cancel_AI.png"></div>';
            };

            var cellclassname = function (row, column, value, data) {
                if ( isDateExpired( data.AccessEndDate, true ) )
                    return 'redClass';
            };

            var nestedGridAdapter = new $.jqx.dataAdapter(orderssource);
            if ( grid != null ) {

                var pagerrenderer = function ()
                {
                    var element = $("<div style='margin-left: 10px; margin-top: 11px; width: 100%; height: 100%;'></div>");
                    var datainfo = grid.jqxGrid('getdatainformation');
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
                    var handleStates = function (event, button, className, add) {
                        button.on(event, function () {
                            if (add == true) {
                                button.find('div').addClass(className);
                            }
                            else button.find('div').removeClass(className);
                        });
                    }
                    rightButton.click(function () {
                        grid.jqxGrid('gotonextpage');
                    });
                    leftButton.click(function () {
                        grid.jqxGrid('gotoprevpage');
                    });
                    return element;
                }
                
                grid.on('pagechanged', function () {
                    var datainfo = grid.jqxGrid('getdatainformation');
                    var paginginfo = datainfo.paginginformation;
                    self.label.text(1 + paginginfo.pagenum * paginginfo.pagesize + "-" + Math.min(datainfo.rowscount, (paginginfo.pagenum + 1) * paginginfo.pagesize) + ' of ' + datainfo.rowscount);
                });
                var tooltiprenderer = function (element) {
                    $(element).parent().jqxTooltip({ position: 'mouse', content: "Inactive Access" });
                }
                grid.jqxGrid({
                    width: 'calc( 100% - 60px )',
                    height: 180,
                    source: nestedGridAdapter,
                    pagerrenderer: pagerrenderer,
                    columnsresize: true,
                    columns: [
                        { text: 'Name', align: 'center', datafield: 'Name', width: 60, filtertype: 'string', cellsrenderer: symbol_renderer },
                        { text: 'Category Description', align: 'center', datafield: 'Description', width: 166, filtertype: 'string' },
                        { text: 'Count', align: 'center', datafield: 'SeriesCount', width: 80, filtertype: 'number', cellsalign: 'center' },
                        { text: 'Access From', align: 'center', datafield: 'AccessStartDate', width: 80, cellsalign: 'center', filtertype: 'range', cellsformat: 'yyyy-MM-dd' },
                        { text: 'Access To', align: 'center', datafield: 'AccessEndDate', width: 80, cellsalign: 'center', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellclassname: cellclassname },
                        { text: 'Access Type', align: 'center', datafield: 'AccessType', width: 100, filtertype: 'string', cellsalign: 'center' },
                        { text: 'First Date', align: 'center', datafield: 'StartDate', width: 80, cellsalign: 'center', filtertype: 'range', cellsformat: 'yyyy-MM-dd' },
                        { text: 'Last Date', align: 'center', datafield: 'EndDate', width: 80, cellsalign: 'center', filtertype: 'range', cellsformat: 'yyyy-MM-dd' },
                        { text: 'I.A.', rendered: tooltiprenderer, align: 'center', datafield: 'InactiveAccess', minwidth: 40, width: 100, filtertype: 'boolean', cellsalign: 'center', cellsrenderer: inactiveAccess_renderer }
                    ],
                    ready: function()
                    {
                        grid.jqxGrid('autoresizecolumns');
                        grid.addClass('sub-grid');
                        grid.parent().addClass('green-light')
                        resizeColumns( grid.attr('id') );

                        $('#fullWidth').on('click', function () {
                            resizeColumns( grid.attr('id') );
                        });
                    }
                });
            }
        }
        var imagerenderer = function ( row, column, value )
        {
            return '<div style="margin: 5px 2px 2px 10px;text-align:center;"><img width="32" height="32" src="' + value + '"></div>';
        }
        var renderer = function ( row, column, value )
        {  
            if ( column == "Name" )
            {
                let data = $('#jqxgrid').jqxGrid('getrowdata', row);
                return '<span style="padding: 8px; float: left">' + value + '<div style="margin-top:5px">Datasource:  <strong><a target="_blank" onclick="openSeriesInNewTab(\'' + data.Datasource + '\',\'' + value + '\',\'' + 1 + '\');">' + data.Datasource + '</a></strong></div></span>';
            }
            else if ( column == "SeriesCount" )
                return '<span style="padding: 8px; float: right">' + value + '</span>';

            else if ( column == "Access" || column == "Available" )
            {
                let nVal = value.split('to');
                let aVal = value.split('at');
                if ( nVal.length == 2 )
                    return '<span class="access-available"><div>' + nVal[0] + ' to</div><div>'+ nVal[1] +'</div></span>';
                if ( aVal.length == 2 )
                    return '<span class="access-available"><div>' + aVal[0] + ' at</div><div>'+ aVal[1] +'</div></span>';
                else
                    return '<span class="access-available"><div>' + value + '</div></span>';
            }
            else if ( column == "Description" )
                return '<span style="padding: 8px; float: left; white-space: normal;">' + value + '</span>';
            else
                return '<span style="padding: 8px; float: left">' + value + '</span>';
        }
        var callclass = function( row, column, value, data )
        {
            if ( data.CategoryDS )
            {
                return 'green-light';
            }
        }

        var keyboardNavigation = function(event)
        {
            var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
            if ( event.currentTarget.id == undefined ) return;
            if ( key != 37 && key != 39 ) return;
            var id = event.currentTarget.id;
            var scrollbar = $('#'+id).jqxGrid('hScrollBar');
            var min = scrollbar.jqxScrollBar('min');
            var max= scrollbar.jqxScrollBar('max');
            if ( max == 1 ) return; 
            var v = scrollbar.jqxScrollBar('value');
            var step = 20;
            switch( key )
            {
                case 39:// right
                    if ( v < max ) v+=step;
                    if (v > max ) v= max;
                break;
                case 37: // left
                    if ( v > min ) v -= step;
                    if ( v < 0 ) v = 0;
                break;
                default: return;
            }
            scrollbar.jqxScrollBar('setPosition', v);
        };

        function refreshPagination()
        {
            var rows = $('#jqxgrid').jqxGrid('getrows');
            var num = DatasetsOfDatasourceSet.SeriesCount / DatasetsOfDatasourceSet.pageSize;
            num = ( parseInt( num ) < num ) ? parseInt( num ) + 1 : parseInt( num );
            DatasetsOfDatasourceSet.label.find('input').val( DatasetsOfDatasourceSet.pageCounter ).parent().find('span').text( num );
        }

        var numOfPageURL = parseInt( getParameterByName('Page') );
        numOfPageURL = !isNaN( numOfPageURL ) ? numOfPageURL : 1;

        var theme = "light";

        var columnsData = [
//            { text: '', minwidth: 50, datafield: 'Icon', cellsrenderer: imagerenderer, cellclassname: callclass },
            { text: '', minwidth: 50, datafield: 'Logo', cellsrenderer: imagerenderer, cellclassname: callclass },
            { text: 'Name', datafield: 'Name', width: 310, cellsrenderer: renderer, cellclassname: callclass },
            { text: 'Series', cellsalign:'center', align:'center', datafield: 'SeriesCount', cellclassname: callclass },
            { text: 'Access', align:'center', cellsalign:'center', cellsrenderer: renderer, datafield: 'Access', cellclassname: callclass },
            { text: 'Available', align:'center', cellsalign:'center', cellsrenderer: renderer, datafield: 'Available', cellclassname: callclass },
            { text: 'Description', datafield: 'Description', minwidth: 10, cellsrenderer: renderer, cellclassname: callclass }
        ];

        // creage jqxgrid
        $("#jqxgrid").jqxGrid(
        {
            width: 'calc( 100% - 3px )',
            /*height: 'calc( 100% - 3px )',*/
		    handlekeyboardnavigation:keyboardNavigation,
            source: source,
            rowdetails: true,
            autorowheight: true,
            autoheight: true,
            theme: theme,
            initrowdetails: initrowdetails,
            columns: columnsData,
            columnsresize: true,
            sortable: true,
            showtoolbar: true,
            pageable: true,
            selectionmode: 'none',
            toolbarheight:37,
            ready: function ()
            {
                $('#jqxgrid').jqxGrid('beginupdate');
                var datainformation = $('#jqxgrid').jqxGrid('getrows');
                for ( i = 0; i < datainformation.length; i++ )
                {
                    var enableRowDetails = datainformation[i].CategoryDS;
                    if ( enableRowDetails ) {
                        $("#jqxgrid").jqxGrid('setrowdetails', i, "<div id='jqxgrid'" + i + " style='margin: 10px;'></div>", 200, true);
                    }
                }
                $('#jqxgrid').jqxGrid('endupdate');
                resizeGrid();
                $('#contenttablejqxgrid > div').slice( mainGrid.length ).remove();
            },
            pagerrenderer: function ()
            {
                var itemsPerPage = 50;
                var items = source.localdata.length;
                var page = 1;
                var pageNumbers = parseInt( items / itemsPerPage );
                pageNumbers += pageNumbers < ( items / itemsPerPage ) ? 1 : 0;
                //$("#jqxgrid").jqxGrid({ pagesize: pageNumbers });

                var element = $("<div id='pagerender-element'></div>");
                var left_element = $("<div id='pagerender-last-element'></div>");

                var num = pageNumbers;
                page = ( page > num || page <= 0 ) ? 1 : page;

                var pageNumbers = $('<div id="pageNumberStyle">');
                
                res = parseInt( page / 6 ) * 6;
                var n = ( res == 0 ) ? 1 : res;
                res = ( n == 1 ) ? n + 5 : n + 6;

                for ( ; n < res; n++ )
                {
                    if ( num >= n ) {
                        var style = "text-decoration: none;";

                        if ( n == page )
                            style += "font-weight:bolder !important;";
                        else
                            style += "cursor:pointer";

                        $('<a class="jqx-grid-pager-number jqx-grid-pager-number-light jqx-rc-all jqx-rc-all-light" style="'+style+'" data-page="'+n+'">'+n+'</a>').appendTo( pageNumbers );
                    }
                }

                if ( page > 5 )
                    $('<a class="jqx-grid-pager-number jqx-grid-pager-number-light jqx-rc-all jqx-rc-all-light" style="text-decoration: none;cursor:pointer" data-page="'+ ( parseInt( pageNumbers.find('.jqx-grid-pager-number:first-child').attr('data-page') ) - 1 ) +'">...</a>').prependTo( pageNumbers );

                if ( page < num - 5 )
                    $('<a class="jqx-grid-pager-number jqx-grid-pager-number-light jqx-rc-all jqx-rc-all-light" style="text-decoration: none;cursor:pointer" data-page="'+ ( parseInt( pageNumbers.find('.jqx-grid-pager-number:last-child').attr('data-page') ) + 1 ) +'">...</a>').appendTo( pageNumbers );

                var pageButtonToFirst = $("<div id='pageButtonToFirst'><div></div></div>");
                pageButtonToFirst.find('div').addClass('jqx-icon-arrow-first');
                pageButtonToFirst.jqxButton({ theme: theme });

                var pageButtonToLast  = $("<div id='pageButtonToLast'><div></div></div>");
                pageButtonToLast.find('div').addClass('jqx-icon-arrow-last');
                pageButtonToLast.jqxButton({ theme: theme });

                var leftPageButton = $("<div id='leftPageButton'><div></div></div>");
                leftPageButton.find('div').addClass('jqx-icon-arrow-left');
                leftPageButton.jqxButton({ theme: theme });

                var rightPageButton = $("<div id='rightPageButton'><div></div></div>");
                rightPageButton.find('div').addClass('jqx-icon-arrow-right');
                rightPageButton.jqxButton({ theme: theme });

                pageButtonToFirst.appendTo( left_element );
                leftPageButton.appendTo( left_element );
                pageNumbers.appendTo( left_element );
                rightPageButton.appendTo( left_element );
                pageButtonToLast.appendTo( left_element );

                var label = $("<div id='page-lable1'>Page <input type='text' id='dataPageNymber' value='"+ page +"'> of <span id='numOfAllPages'>"+ num +"</span></div>");
                label.appendTo(element);

                var label2 = $("<div id='page-lable2'> Rows: </div>");
                label2.appendTo(element);
                
                var dropdown = $('<div id="jqxPageDropDownList" style="float: left;"></div>');
                dropdown.jqxDropDownList({ source: ['10', '25', '50', '100'], selectedIndex: 1, width: 55, height: 17, autoDropDownHeight: true, enableBrowserBoundsDetection:true });
                
                dropdown.on('change', async function (event) {
                    var args = event.args;
                    if (args) {
                        var item = args.item;
                        $("#jqxgrid").jqxGrid({ pagesize: parseInt( item.value ) });
                    }
                });
                dropdown.appendTo(element);
                
                var handleStates = function (event, button, className, add) {
                    button.on(event, function () 
                    {
                        if (add == true) button.find('div').addClass(className);
                        else button.find('div').removeClass(className);
                    });
                };
                if (theme != '') {
                    handleStates('mousedown', rightPageButton, 'jqx-icon-arrow-right-selected-' + theme, true);
                    handleStates('mouseup', rightPageButton, 'jqx-icon-arrow-right-selected-' + theme, false);
                    handleStates('mousedown', leftPageButton, 'jqx-icon-arrow-left-selected-' + theme, true);
                    handleStates('mouseup', leftPageButton, 'jqx-icon-arrow-left-selected-' + theme, false);
                    handleStates('mouseenter', rightPageButton, 'jqx-icon-arrow-right-hover-' + theme, true);
                    handleStates('mouseleave', rightPageButton, 'jqx-icon-arrow-right-hover-' + theme, false);
                    handleStates('mouseenter', leftPageButton, 'jqx-icon-arrow-left-hover-' + theme, true);
                    handleStates('mouseleave', leftPageButton, 'jqx-icon-arrow-left-hover-' + theme, false);
                }

                pageNumbers.find('a').click(async function() {});
                pageButtonToLast.click(async function() {});
                rightPageButton.click(async function () {});
                pageButtonToFirst.click(async function() {});
                leftPageButton.click(async function () {});
                
                var new_element = $('<div>').append(element);
                new_element.append(left_element);
                return new_element;
            },
            rendertoolbar: function (toolbar)
            {
                var container = $("<div id='activegrid-container'></div>");
                toolbar.append(container);
                container.append('<table><tr>' + 
                    '<td><img id="activegrid-img" src="resources/css/icons/search.png"></td>' +
                    '<td><input id="searchBox"></td>' +
                    '<td><div id="helpIcon2" class="helpIcon"></div></td>' +
                    '<td id="activegrid-buttons"></td>' + 
                    '<td><input class="refreshGrid" id="refrestData" title="Refresh Grid"></td>' +
                    '<td><input id="btnAutosizeActive" title="Autosize Columns"></td>' +
                    '<td><input class="fullWidthPage" id="fullWidth" title="Toggle grid to full screen width"></td>' +
                    '<td><input id="btn-list-view" title="Panel view" ></td>' +
                    '</tr></table>'
                );

                $(".HelpMessage").eq(0).jqxPopover({offset: {left: -50, top:0}, arrowOffsetValue: 50, title: "Search Filter Help", showCloseButton: true, selector: $("#helpIcon2") });
                $("#searchBox").jqxInput({ placeHolder: "Enter filter text", height: 22, width: 230 });
                $("#btnAutosizeActive").jqxButton({ imgSrc: "resources/css/icons/autosize.png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                $("#fullWidth").jqxButton({ imgSrc: "resources/css/icons/fullscreen.png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                $("#refrestData").jqxButton({ imgSrc: "resources/css/icons/reload.png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                $("#btn-list-view").jqxButton({ imgSrc: "resources/css/icons/view_icons.png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                

                $("#btnAutosizeActive").on('click', function ()
                {
                    resizeGrid();
                });

                var fullWidthFlag = true;

                $("#fullWidth").on('click', function ()
                {
                    let img = ( fullWidthFlag ) ? 'fullscreen1' : 'fullscreen';
                    
                    $(".fullWidthPage").jqxButton({ imgSrc: "resources/css/icons/"+ img +".png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                    $(".fixpage, .wrap").toggleClass('fullscreen', fullWidthFlag);

                    fullWidthFlag = !fullWidthFlag;
                    resizeGrid();
                });

                $('#refrestData').on('click', function ()
                {
                    $('#jqxgrid').jqxGrid('showloadelement');
                    call_api_ajax('GetUserDatasources', 'get', { SessionToken: sessionToken, ReturnCategoryList: 'true' }, true, ( data ) =>
                    {
                        data = data.Result;
                        let mainGrid = datasource( data );
                        source.localdata = mainGrid;
                        $('#jqxgrid').jqxGrid('updatebounddata', 'cells');
                        $('#jqxgrid').jqxGrid('hideloadelement');
                    });
                });
            

                $('#searchBox').on('keyup', function()
                {
                    var searchList = [];
                    mainGrid.forEach(( e ) => {
                        let check = true;
                        let words = $(this).val().split(' ');
                        for ( var w in words )
                        {
                            if ( e.Name.toLowerCase().search( words[w].toLowerCase() ) == -1 && e.Description.toLowerCase().search( words[w].toLowerCase() ) == -1 )
                            {
                                check = false;
                                break;
                            }
                        }
                        if ( check )
                            searchList.push(e)
                    });
                    source.localdata = searchList;
                    $('#jqxgrid').jqxGrid('updatebounddata', 'cells');
                });

                $('#btn-list-view').click(function () {
                    window.location.href = "profile?tab=MySubscriptions"
                });

                $("#fullWidth").tooltip();
                $("#btnAutosizeActive").tooltip();
                $("#refrestData").tooltip();
                $("#btn-list-view").tooltip();
            }
        });

        var contextMenu = $("#jqxgridMenu").jqxMenu({ width: 125, height: 30, autoOpenPopup: false, mode: 'popup'});
        $("#jqxgrid").on('contextmenu', function () {
            return false;
        });
        $("#jqxgridMenu").on('itemclick', function (event) {
            var args = event.args;
            var rowindex = $("#jqxgrid").jqxGrid('getselectedrowindex');
            var datasource = $("#jqxgrid").jqxGrid('getrowdata', rowindex);
            let ndatasource = datasource.Datasource;

            switch( $(args).text() )
            {
                case "View Details":
                    openSeriesInNewTab( ndatasource, null, 1 );
                    break;
            }
        });
        $("#jqxgrid").on('rowclick', function ( event ) {
            if ( event.args.rightclick )
            {
                $("#jqxgrid").jqxGrid('selectrow', event.args.rowindex);
                var scrollTop = $( window ).scrollTop();
                var scrollLeft = $( window ).scrollLeft();
                contextMenu.jqxMenu('open', parseInt( event.args.originalEvent.clientX ) + 5 + scrollLeft, parseInt( event.args.originalEvent.clientY ) + 5 + scrollTop);
                return false;
            }
        });
    });

    $('#mainSplitter').jqxSplitter({ width: '100%', height: '100%', showSplitBar: false, panels: [{ size: "100%" }] });

    function resizeElements()
    {
        $('#jqxWidget').css('height', (window.innerHeight - $(".navbar").height() - 90 ) + 'px');
    }

    $( window ).resize(function() { resizeElements(); resizeGrid(); });
    resizeElements();

    $('#jqxWidget').css('visibility', 'visible')

    $('#profile').attr('href', 'profile?tab=MyProfile');
    $('#favorites').attr('href', 'profilemain?tab=favorites');
    $('#logout').click( function () {
        logout();
    });
});