/*********************
    User Favorites
**********************/


var sessionToken = getSession(),
    userCategory,
    categories,
    category_list,
    access,
    userName = '',
    backups_loaded = false,
    activeGrid_active = false,
    datasourceGrid_active = false,
    disactiveGrid_active = false,
    numOfPageURL = parseInt(getParameterByName('page')),
    filterOfURL = getParameterByName('filter'),
    CategoryDS,
    dataToSend = {},
    categoryFilterURL = getParameterByName('category'),
    droplistDatasource_loaded = false,
    showAdditionalInformation1 = false,
    showAdditionalInformation2 = false,
    showAdditionalInformation3 = false,
    tab = getParameterByName('tab'),
    DatasetsOfDatasourceSet;
numOfPageURL = !isNaN(numOfPageURL) ? numOfPageURL : 1;
filterOfURL = (filterOfURL == "undefined") ? "" : filterOfURL;

var dataView1, dataView2, dataView3, dataView4;
var grid1, grid2, grid3, grid4;

var LIST_SUBS = []
var LIST = []

function resizeColumns(grid_id) {
    var grid_panel = $("#" + grid_id),
        // columns = grid1.getColumns(),
        // rows = dataView.getItems(),
        all_data = {},
        datafield = {},
        ci = [],
        index = 0,
        index_array = [],
        width,
        widthWithoutDescription = 0,
        descriptionWidth,
        descriptionMinWidth,
        z = 0;

    if (grid_id == "gridDatasetsOfDatasource") {
        columns = grid2.getColumns()
        rows = dataView2.getItems()
    } else if (grid_id == "activeJqxgrid") {
        columns = grid1.getColumns()
        rows = dataView1.getItems()
    } else {
        columns = grid3.getColumns()
        rows = dataView3.getItems()
    }

    columns_width = {},
        K = 10;

    if (grid_panel.find('#verticalScrollBar' + grid_id).length && grid_panel.find('#verticalScrollBar' + grid_id).css('visibility') !== "hidden") {
        z = 2.2;
    }

    if (columns !== undefined) {
        if (grid_id == "activeJqxgrid") {
            // grid1.autosizeColumns();
            width = grid1.getGridPosition().width;
        } else if (grid_id == "gridDatasetsOfDatasource") {
            // grid2.autosizeColumns();
            width = grid2.getGridPosition().width;
        }

        descriptionWidth = columns[3].width,
            descriptionMinWidth = columns[3].minWidth;

        columns.map(function(column) {
            if (!column.hidden) {
                let firstColumnData = [];

                for (var i = 0; i < rows.length; i++) {
                    let value = rows[i][column.field];

                    if (value !== undefined && value !== null) {

                        if (typeof value.getMonth == "function") {
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
                    }
                    firstColumnData.push(value);
                }
                all_data[column.name] = firstColumnData;
                datafield[column.name] = column.field;
                index_array[column.name] = index;
            }
            index++;
        });

        var j = 0;
        for (var i in all_data) {
            if (all_data[i].length > 0) {
                let l = 0;
                all_data[i].map(function(v) {
                    if (v !== undefined && v !== null) {
                        if (typeof v !== 'boolean' && v.length > l)
                            l = v.length;
                    }
                });

                if (i.split('<').length == 0 && l < i.length) l = i.length;

                var w = columns[index_array[i]].width;

                if (grid_id == "activeJqxgrid") {
                    var fieldkey = "Name";
                } else if (grid_id == "gridDatasetsOfDatasource") {
                    var fieldkey = "Description";
                } else {
                    var fieldkey = "Description";
                }

                if (datafield[i] !== fieldkey) {
                    let width = (l * K > w) ? l * K : w;

                    if (datafield[i] == 'Datasource')
                        width += columns[index_array[i]].minWidth;

                    columns_width[datafield[i]] = width;
                    columns[index_array[i]].width = width;
                    widthWithoutDescription += (width + z);
                }
            }
            j++;
        }

        if (descriptionWidth + widthWithoutDescription > width) {
            if (descriptionMinWidth + widthWithoutDescription < width)
                descriptionWidth = width - widthWithoutDescription;
            else
                descriptionWidth = descriptionMinWidth;
        } else
            descriptionWidth = width - widthWithoutDescription;

        columns.map(function(v) {
            if (grid_id == "activeJqxgrid") {
                if (v.field == "Name")
                    v.width = descriptionWidth;
            } else {
                if (v.field == "Name") {
                    v.width = descriptionWidth;
                }
            }
        });

        // grid.jqxGrid({ columns: columns });
        // grid.jqxGrid('refresh');
    }

}

function print(msg) {
    console.log(msg)
}

var additional_renderer = function(row, datafield, value, html, columnproperties, record) {
    var txt = JSON.stringify(value);
    // $(".popup-content").html( txt )
    if (value != undefined)
        var showVal = 'View Object';
    else
        var showVal = '';

    return '<a target="_blank">' + showVal + '</a>';
}

var checkboxSelector = new Slick.CheckboxSelectColumn({
    cssClass: "slick-cell-checkboxsel"
});

$(document).ready(function() {

    // calcuTimeFunc();

    $(".fixpage").removeClass('fullscreen')

    $('#mainSplitter').jqxSplitter({
        width: '100%',
        height: '100%',
        panels: [{
            size: '270px'
        }, {
            size: '80%'
        }]
    });

    $.jqx.utilities.scrollBarSize = 10;

    // Get user data and check if session is not Expired
    /*call_api_ajax('GetMyAccountDetails', 'get', {
        SessionToken: sessionToken
    }, false, (data) => {
        userName = data.Result.Name;
        $('#username').text(userName);
        $("body").removeClass("wait");
    });*/

    $('#profile').attr('href', 'profile?tab=MyProfile');
    $('#favorites').attr('href', 'profilemain?tab=favorites');
    $('#logout').click(function() {
        logout();
    });

    var littleFlag = 0;

    function resizeElements() {
        var contentBottomPadding = $("#main-footer").height();
        // $('#jqxWidget').css('height', (window.innerHeight - 120 - contentBottomPadding + 5) + 'px');

        if (window.innerWidth < 1000)
            $('#main-footer').css('width', (window.innerWidth + 150) + 'px');

        tab = getParameterByName('tab');

        $('#fav-help-div').css("top", (parseInt($('.main-content').css("margin-top").slice(0, -2)) + 6));

        if (tab == "favorites") {
            setTimeout(() => {
                var panel_height = ($('.fixpage').css("height").slice(0, -2) - 165) + "px";
                // $('#jqxWidget').css("height", (panel_height.slice(0, -2) + 200));
                $('#mainSplitter').css("height", (panel_height.slice(0, -2) - 45));
                // alert($('#mainSplitter').css("height"));
                $('#activeJqxgrid').css("height", (panel_height.slice(0, -2) - 107))
                $('#activeJqxgrid .slick-viewport').css('height', "calc(100% - 65px)");
                $('#activeJqxgrid .slick-pane-top').css('height', "100%");

                if (grid1 != undefined) {
                    refreshFavouritesGrid();
                }
            }, 5);
        } else if (tab == "mydatasources") {
            // var panel_height = $('.splitter-panel-datasource').css("height");
            // $('#gridDatasetsOfDatasource').css("height", (2500))

            var panel_height = ($('.fixpage').css("height").slice(0, -2) - 210) + "px";
            // $('#jqxWidget').css("height", (panel_height.slice(0, -2) + 200));
            // $('#mainSplitter-datasource').css("height", "calc(100% - 35px)")
            // $('#gridDatasetsOfDatasource').css("height", "calc(100% - 140px)")

            setTimeout(() => {
                    // resizeColumns('gridDatasetsOfDatasource');
                    $('.slick-viewport').css('height', "100%");
                    $('.slick-pane-top').css('height', "100%");
                },
                5);
        } else {
            setTimeout(() => {
                    var panel_height = ($('.fixpage').css("height").slice(0, -2) - 150) + "px";
                    // $('#jqxWidget').css("height", (panel_height.slice(0, -2) + 200));
                    // $('#disactiveJqxgrid').css("height", "calc(100% - 85px)")
                    // resizeColumns('gridDatasetsOfDatasource');
                    $('#disactiveJqxgrid .slick-viewport').css('height', "calc(100% - 60px)");
                    $('#disactiveJqxgrid .slick-pane-top').css('height', "100%");
                },
                5);
        }
    }

    setTimeout(function() {
        $(window).resize(function() {
            if ($('#reportCreator') != undefined && $('#reportCreator').jqxWindow('isOpen') == false) {
                if (littleFlag === 0) {
                    littleFlag = 1;
                    window.dispatchEvent(new Event('resize'));
                    setTimeout(function() {
                        littleFlag = 0;
                    }, 1000);
                }
                resizeElements();
            }
        });
    }, 100);

    if (littleFlag === 0) {
        littleFlag = 1;
        window.dispatchEvent(new Event('resize'));
        setTimeout(function() {
            littleFlag = 0;
        }, 1000);
    }
    // setTimeout(()=>{
    //     $(".fixpage").toggleClass('fullscreen', false);
    // },1000)

    //    if($(".fixpage").hasClass('fullscreen')){
    //         $(".fixpage").removeClass('fullscreen');
    //    }
    //    else{
    //         $(".fixpage").addClass('fullscreen');
    //    }

    $('body > div.fixpage.fullscreen > nav > div').css('max-width', '100%')
    resizeElements();

    // $("#jqxLoader").jqxLoader({
    //     width: 100,
    //     height: 60,
    //     autoOpen: false,
    //     imagePosition: 'top',
    //     text: "Requesting data..."
    // });

    var globalMoveFolders = false;

    var symbol_renderer = function(row, datafield, value, html, columnproperties, record) {
        return '<a target="_blank">' + value + '</a>';
    }

    var imagerenderer = function(row, cell, value, columnDef, dataContext) {
        if (value)
            return '<div><img id="seriesStartIcon" ' +
                ' height="17" width="17" ' +
                'src="resources/css/icons/star_icon.png"/></div>';
        else
            return '';
    }

    var imagesMap;
    var databaseColumnRender = function(row, columnfield, value, defaulthtml, columnproperties) {
        var databaseImage;
        if (imagesMap.get(value)) databaseImage = imagesMap.get(value);
        else databaseImage = 'default_white.png';
        return '<div id="databaseColumnRender"> <img src="' + databaseImage + '">' + value + '</div>';
    }

    var isDragStart = false;
    var element = "";
    var favoritesGridSource, favoritesGridDataAdapter;
    var seriesToAdd;
    var baseDataFields = [{
            name: 'Symbol',
            type: 'string'
        },
        {
            name: 'Datacategory',
            type: 'string'
        },
        {
            name: 'Name',
            type: 'string'
        },
        {
            name: 'Datasource',
            type: 'string'
        },
        {
            name: 'Frequency',
            type: 'string'
        },
        {
            name: 'Currency',
            type: 'string'
        },
        {
            name: 'Unit',
            type: 'string'
        },
        //		{ name: 'Icon', type: 'string' },
        {
            name: 'Logo',
            type: 'string'
        },
        {
            name: 'Decimals',
            type: 'int'
        },
        {
            name: 'Bates',
            type: 'array'
        },
        {
            name: 'BateIndex',
            type: 'array'
        },
        {
            name: 'Conversions',
            type: 'array'
        },
        {
            name: 'Values',
            type: 'int'
        },
        {
            name: 'Corrections',
            type: 'int'
        },
        {
            name: 'Premium',
            type: 'boolean'
        },
        {
            name: 'Subscription',
            type: 'string'
        },
        {
            name: 'Additional',
            type: 'string'
        },
        {
            name: 'Favorite',
            type: 'boolean'
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
            name: 'Conversions',
            type: 'string'
        }
    ];

    var baseGridColumns = [{
            id: "datasource",
            name: 'Datasource',
            field: 'Datasource',
            minwidth: 30,
            sortable: true,
            cssClass: "cell-title",
            width: 100,
            formatter: databaseColumnRender
        },
        {
            id: "symbol",
            name: 'Symbol',
            field: 'Symbol',
            minwidth: 10,
            width: 100,
            sortable: true,
            formatter: symbol_renderer,
            cssClass: "cell-title"
        },
        {
            id: "name",
            name: 'Name',
            field: 'Name',
            minwidth: 20,
            width: 400,
            sortable: true,
            cssClass: "cell-title"
        },
        {
            id: "frequency",
            name: 'Frequency',
            field: 'Frequency',
            sortable: true,
            minwidth: 10,
            width: 80,
            cssClass: "cell-title"
        },
        {
            id: "from",
            name: 'From',
            field: 'StartDate',
            filtertype: 'range',
            sortable: true,
            cellsformat: 'yyyy-MM-dd',
            minwidth: 10,
            width: 80,
            cssClass: "cell-title"
        },
        {
            id: "to",
            name: 'To',
            field: 'EndDate',
            width: 80,
            sortable: true,
            cssClass: "cell-title"
        },
        {
            id: "values",
            name: '# Prices',
            field: 'Values',
            minwidth: 10,
            sortable: true,
            width: 80,
            cssClass: "cell-title"
        },
        {
            id: "currency",
            name: 'Currency',
            field: 'Currency',
            sortable: false,
            minwidth: 10,
            width: 75,
            cssClass: "cell-title"
        },
        {
            id: "decimals",
            name: 'Decimals',
            field: 'Decimals',
            sortable: false,
            minwidth: 10,
            width: 65,
            cssClass: "cell-title"
        },
        {
            id: "unit",
            name: 'Unit',
            field: 'Unit',
            sortable: false,
            minwidth: 10,
            width: 50,
            cssClass: "cell-title"
        },
        {
            id: "conversions",
            name: 'Conversions',
            field: 'Conversions',
            sortable: false,
            minwidth: 10,
            width: 50,
            cssClass: "cell-title"
        },
        {
            id: "additional",
            name: 'Additional',
            field: 'Additional',
            sortable: false,
            minwidth: 10,
            width: 150,
            cssClass: "cell-title",
            formatter: additional_renderer
        }
    ];

    function hideAdditInfo(elem) {
        if (elem == 1) {
            var update_columns = [ //checkboxSelector.getColumnDefinition(),
                {
                    id: "datasource",
                    name: 'Datasource',
                    field: 'Datasource',
                    minwidth: 30,
                    sortable: true,
                    cssClass: "cell-title",
                    width: 100,
                    formatter: databaseColumnRender
                },
                {
                    id: "symbol",
                    name: 'Symbol',
                    field: 'Symbol',
                    minwidth: 10,
                    width: 100,
                    sortable: true,
                    formatter: symbol_renderer,
                    cssClass: "cell-title"
                },
                {
                    id: "name",
                    name: 'Name',
                    field: 'Name',
                    minwidth: 20,
                    width: 355,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "frequency",
                    name: 'Frequency',
                    field: 'Frequency',
                    minwidth: 10,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "from",
                    name: 'From',
                    field: 'StartDate',
                    filtertype: 'range',
                    cellsformat: 'yyyy-MM-dd',
                    sortable: true,
                    minwidth: 10,
                    width: 80,
                    cssClass: "cell-title"
                },
                {
                    id: "to",
                    name: 'To',
                    field: 'EndDate',
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "values",
                    name: '# Prices',
                    field: 'Values',
                    minwidth: 10,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title cell-right"
                },
            ];

            var old_columns = grid1.getColumns();

            var isCategory = false;
            for (var c in old_columns) {
                if (old_columns[c].name == "Cat.")
                    isCategory = true;
            }

            if (isCategory)
                update_columns.splice(1, 0, {
                    id: 'cat',
                    name: 'Cat.',
                    field: 'Datacategory',
                    minwidth: 10,
                    width: 40,
                    sortable: true,
                    cssClass: "cell-title"
                }, )

            grid1.setColumns(update_columns);
            // resizeColumns('activeJqxgrid');

            var panel_height = ($('.fixpage').css("height").slice(0, -2) - 165) + "px";

            $('#mainSplitter').css("height", (panel_height.slice(0, -2) - 45));
            $('#activeJqxgrid').css("height", (panel_height.slice(0, -2) - 107))
            $('#activeJqxgrid .slick-viewport').css('height', "calc(100% - 60px)");
            $('#activeJqxgrid .slick-pane-top').css('height', "100%");

            // if($('.slick-pane-top').css('height').slice(0,-2) > (grid1.getData().length * 30)){
            //     $('.slick-header').css('width', '100%');
            // }
            // else{
            //     $('.slick-header').css('width', '98.3%');
            // }
        } else if (elem == 2) {
            var update_columns = [{
                    id: "sel",
                    name: "#",
                    field: "num",
                    behavior: "select",
                    cssClass: "cell-title cell-right",
                    minWidth: 40,
                    width: 40,
                    cannotTriggerInsert: true,
                    resizable: false,
                    excludeFromColumnPicker: true,
                    headerCssClass: 'right',
                    sortable: true
                },
                {
                    id: "favorite",
                    name: "<img height='18' width='18' src='resources/css/icons/StarGrey.ico'>",
                    field: "Favorite",
                    filterable: false,
                    cssClass: "cell-title",
                    minWidth: 30,
                    width: 30,
                    resizable: false,
                    formatter: imagerenderer
                },
                {
                    id: "symbol",
                    name: "Symbol",
                    field: "Symbol",
                    width: 100,
                    minWidth: 100,
                    cssClass: "cell-title",
                    sortable: true,
                    formatter: symbol_renderer
                },
                {
                    id: "description",
                    name: "Description",
                    field: "Name",
                    sortable: true,
                    minWidth: 20,
                    width: 390,
                    cssClass: "cell-title"
                },
                {
                    id: "frequency",
                    defaultSortAsc: false,
                    name: "Frequency",
                    field: "Frequency",
                    minWidth: 80,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "from",
                    name: "From",
                    field: "StartDate",
                    minWidth: 80,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "to",
                    name: "To",
                    field: "EndDate",
                    minWidth: 80,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "values",
                    name: "# Prices",
                    field: "Values",
                    minWidth: 80,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title cell-right"
                },
            ];

            var old_columns = grid2.getColumns();

            var isCategory = false;
            for (var c in old_columns) {
                if (old_columns[c].name == "Cat.")
                    isCategory = true;
            }

            if (isCategory)
                update_columns.splice(2, 0, {
                    id: 'cat',
                    name: 'Cat.',
                    field: 'Datacategory',
                    minwidth: 10,
                    width: 40,
                    cssClass: "cell-title"
                }, )

            grid2.setColumns(update_columns);
            // resizeColumns('gridDatasetsOfDatasource');

            var panel_height = ($('.fixpage').css("height").slice(0, -2) - 210) + "px";
            // $('#mainSplitter-datasource').css("height", "calc(100% - 58px)")
            // $('#gridDatasetsOfDatasource').css("height", (panel_height.slice(0, -2) - 107))

            setTimeout(() => {
                    // resizeColumns('gridDatasetsOfDatasource');
                    $('.slick-viewport').css('height', "100%");
                    $('.slick-pane-top').css('height', "100%");
                },
                5);
        } else {
            var update_columns = [{
                    id: "datasource",
                    name: 'Datasource',
                    field: 'Datasource',
                    minwidth: 30,
                    sortable: true,
                    cssClass: "cell-title",
                    width: 100,
                    formatter: databaseColumnRender
                },
                {
                    id: "symbol",
                    name: 'Symbol',
                    field: 'Symbol',
                    minwidth: 10,
                    width: 100,
                    sortable: true,
                    formatter: symbol_renderer,
                    cssClass: "cell-title"
                },
                {
                    id: "name",
                    name: 'Name',
                    field: 'Name',
                    minwidth: 20,
                    width: 650,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "frequency",
                    name: 'Frequency',
                    field: 'Frequency',
                    minwidth: 10,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "from",
                    name: 'From',
                    field: 'StartDate',
                    filtertype: 'range',
                    cellsformat: 'yyyy-MM-dd',
                    minwidth: 10,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "to",
                    name: 'To',
                    field: 'EndDate',
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "values",
                    name: '# Prices',
                    field: 'Values',
                    minwidth: 10,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title cell-right"
                },
            ];

            var old_columns = grid3.getColumns();

            var isCategory = false;
            for (var c in old_columns) {
                if (old_columns[c].name == "Cat.")
                    isCategory = true;
            }

            if (isCategory)
                update_columns.splice(1, 0, {
                    id: 'cat',
                    name: 'Cat.',
                    field: 'Datacategory',
                    minwidth: 10,
                    width: 40,
                    cssClass: "cell-title"
                }, )

            grid3.setColumns(update_columns);
            // resizeColumns('disactiveJqxgrid');
            var panel_height = ($('.fixpage').css("height").slice(0, -2) - 150) + "px";
            $('#disactiveGrid').css("height", "100%")
                //$('#disactiveJqxgrid').css("height", "calc(100% - 85px)")

            setTimeout(() => {
                    // resizeColumns('gridDatasetsOfDatasource');
                    $('#disactiveJqxgrid .slick-viewport').css('height', "calc(100% - 60px)");
                    $('#disactiveJqxgrid .slick-pane-top').css('height', "100%");
                },
                5);

            // if($('.slick-pane-top').css('height').slice(0,-2) > (grid3.getData().getItems().length * 30)){
            //     $('.slick-header').css('width', '100%');
            // }
            // else{
            //     $('.slick-header').css('width', '98.7%');
            // }
        }
    }

    function showAdditInfo(elem) {
        if (elem == 1) {
            var update_columns = [{
                    id: "datasource",
                    name: 'Datasource',
                    field: 'Datasource',
                    minwidth: 30,
                    cssClass: "cell-title",
                    width: 100,
                    sortable: true,
                    formatter: databaseColumnRender
                },
                {
                    id: "symbol",
                    name: 'Symbol',
                    field: 'Symbol',
                    minwidth: 10,
                    width: 100,
                    formatter: symbol_renderer,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "name",
                    name: 'Name',
                    field: 'Name',
                    minwidth: 20,
                    width: 355,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "frequency",
                    name: 'Frequency',
                    field: 'Frequency',
                    minwidth: 10,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "from",
                    name: 'From',
                    field: 'StartDate',
                    filtertype: 'range',
                    cellsformat: 'yyyy-MM-dd',
                    minwidth: 10,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "to",
                    name: 'To',
                    field: 'EndDate',
                    cellsformat: 'yyyy-MM-dd',
                    minwidth: 10,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "values",
                    name: '# Prices',
                    field: 'Values',
                    minwidth: 10,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title cell-right"
                },
                {
                    id: "currency",
                    name: 'Currency',
                    field: 'Currency',
                    sortable: false,
                    minwidth: 10,
                    width: 75,
                    cssClass: "cell-title"
                },
                {
                    id: "decimals",
                    name: 'Decimals',
                    field: 'Decimals',
                    sortable: false,
                    minwidth: 10,
                    width: 65,
                    cssClass: "cell-title"
                },
                {
                    id: "unit",
                    name: 'Unit',
                    field: 'Unit',
                    sortable: false,
                    minwidth: 10,
                    width: 50,
                    cssClass: "cell-title"
                },
                {
                    id: "conversions",
                    name: 'Conversions',
                    field: 'Conversions',
                    sortable: false,
                    minwidth: 10,
                    width: 50,
                    cssClass: "cell-title"
                },
                {
                    id: "additional",
                    name: 'Additional',
                    field: 'Additional',
                    sortable: false,
                    minwidth: 10,
                    width: 150,
                    cssClass: "cell-title",
                    formatter: additional_renderer
                }
            ];

            var old_columns = grid1.getColumns();

            var isCategory = false;
            for (var c in old_columns) {
                if (old_columns[c].name == "Cat.")
                    isCategory = true;
            }

            if (isCategory)
                update_columns.splice(1, 0, {
                    id: 'cat',
                    name: 'Cat.',
                    field: 'Datacategory',
                    minwidth: 10,
                    width: 40,
                    sortable: true,
                    cssClass: "cell-title"
                }, )

            grid1.setColumns(update_columns);
            resizeColumns('activeJqxgrid');

            var panel_height = ($('.fixpage').css("height").slice(0, -2) - 165) + "px";
            $('#mainSplitter').css("height", (panel_height.slice(0, -2) - 45));
            $('#activeJqxgrid').css("height", (panel_height.slice(0, -2) - 107))

            setTimeout(() => {
                    // resizeColumns('gridDatasetsOfDatasource');
                    $('#activeJqxgrid .slick-viewport').css('height', "calc(100% - 60px)");
                    $('#activeJqxgrid .slick-pane-top').css('height', "100%");
                },
                5);

            // if($('.slick-pane-top').css('height').slice(0,-2) > (grid1.getData().getItems().length * 30)){
            //     $('.slick-header').css('width', '100%');
            // }
            // else{
            //     $('.slick-header').css('width', '98.3%');
            // }
        } else if (elem == 2) {
            var update_columns = [{
                    id: "sel",
                    name: "#",
                    field: "num",
                    behavior: "select",
                    cssClass: "cell-title cell-right",
                    minWidth: 40,
                    width: 40,
                    cannotTriggerInsert: true,
                    resizable: false,
                    excludeFromColumnPicker: true,
                    headerCssClass: 'right',
                    sortable: true
                },
                {
                    id: "favorite",
                    name: "<img height='18' width='18' src='resources/css/icons/StarGrey.ico'>",
                    field: "Favorite",
                    filterable: false,
                    cssClass: "cell-title",
                    minWidth: 30,
                    width: 30,
                    resizable: false,
                    formatter: imagerenderer
                },
                {
                    id: "symbol",
                    name: "Symbol",
                    field: "Symbol",
                    width: 100,
                    minWidth: 100,
                    cssClass: "cell-title",
                    sortable: true,
                    formatter: symbol_renderer
                },
                {
                    id: "description",
                    name: "Description",
                    field: "Name",
                    sortable: true,
                    minWidth: 20,
                    width: 390,
                    cssClass: "cell-title"
                },
                {
                    id: "frequency",
                    defaultSortAsc: false,
                    name: "Frequency",
                    field: "Frequency",
                    minWidth: 80,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "from",
                    name: "From",
                    field: "StartDate",
                    minWidth: 80,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "to",
                    name: "To",
                    field: "EndDate",
                    minWidth: 80,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "values",
                    name: "# Prices",
                    field: "Values",
                    minWidth: 80,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title cell-right"
                },
                {
                    id: "currency",
                    name: "Currency",
                    field: "Currency",
                    minWidth: 60,
                    width: 60,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "decimals",
                    name: "Decimals",
                    field: "Decimals",
                    minWidth: 60,
                    width: 60,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "unit",
                    name: "Unit",
                    field: "Unit",
                    minWidth: 60,
                    width: 60,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "conversions",
                    name: "Conversions",
                    field: "Conversions",
                    minWidth: 100,
                    width: 100,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "additional",
                    name: "Additional",
                    field: "Additional",
                    minWidth: 120,
                    width: 120,
                    sortable: true,
                    cssClass: "cell-title",
                    formatter: additional_renderer
                },
            ];

            var old_columns = grid2.getColumns();

            var isCategory = false;
            for (var c in old_columns) {
                if (old_columns[c].name == "Cat.")
                    isCategory = true;
            }

            if (isCategory)
                update_columns.splice(2, 0, {
                    id: 'cat',
                    name: 'Cat.',
                    field: 'Datacategory',
                    minwidth: 10,
                    width: 40,
                    cssClass: "cell-title"
                }, )

            grid2.setColumns(update_columns);
            // resizeColumns('gridDatasetsOfDatasource');

            var panel_height = ($('.fixpage').css("height").slice(0, -2) - 210) + "px";
            // $('#mainSplitter-datasource').css("height", "calc(100% - 35px)")
            $('#gridDatasetsOfDatasource').css("height", (panel_height.slice(0, -2) - 107))

            setTimeout(() => {
                    // resizeColumns('gridDatasetsOfDatasource');
                    $('.slick-viewport').css('height', "100%");
                    $('.slick-pane-top').css('height', "100%");
                },
                5);
        } else {
            // var lastColumn = [{id: 'dateTime', name: 'Removed Date', field: 'DateTime', width: 140, cssClass: "cell-title" }];
            var update_columns = [{
                    id: "datasource",
                    name: 'Datasource',
                    field: 'Datasource',
                    minwidth: 30,
                    cssClass: "cell-title",
                    width: 100,
                    sortable: true,
                    formatter: databaseColumnRender
                },
                {
                    id: "symbol",
                    name: 'Symbol',
                    field: 'Symbol',
                    minwidth: 10,
                    width: 100,
                    formatter: symbol_renderer,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "name",
                    name: 'Name',
                    field: 'Name',
                    minwidth: 20,
                    width: 650,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "frequency",
                    name: 'Frequency',
                    field: 'Frequency',
                    minwidth: 10,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "from",
                    name: 'From',
                    field: 'StartDate',
                    filtertype: 'range',
                    cellsformat: 'yyyy-MM-dd',
                    minwidth: 10,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "to",
                    name: 'To',
                    field: 'EndDate',
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "values",
                    name: '# Prices',
                    field: 'Values',
                    minwidth: 10,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title cell-right"
                },
                {
                    id: "currency",
                    name: 'Currency',
                    field: 'Currency',
                    sortable: false,
                    minwidth: 10,
                    width: 75,
                    cssClass: "cell-title"
                },
                {
                    id: "decimals",
                    name: 'Decimals',
                    field: 'Decimals',
                    sortable: false,
                    minwidth: 10,
                    width: 65,
                    cssClass: "cell-title"
                },
                {
                    id: "unit",
                    name: 'Unit',
                    field: 'Unit',
                    sortable: false,
                    minwidth: 10,
                    width: 50,
                    cssClass: "cell-title"
                },
                {
                    id: "conversions",
                    name: 'Conversions',
                    field: 'Conversions',
                    sortable: false,
                    minwidth: 10,
                    width: 50,
                    cssClass: "cell-title"
                },
                {
                    id: "additional",
                    name: 'Additional',
                    field: 'Additional',
                    sortable: false,
                    minwidth: 10,
                    width: 150,
                    cssClass: "cell-title",
                    formatter: additional_renderer
                }
            ];

            var old_columns = grid3.getColumns();

            var isCategory = false;
            for (var c in old_columns) {
                if (old_columns[c].name == "Cat.")
                    isCategory = true;
            }

            if (isCategory)
                update_columns.splice(1, 0, {
                    id: 'cat',
                    name: 'Cat.',
                    field: 'Datacategory',
                    minwidth: 10,
                    width: 40,
                    cssClass: "cell-title"
                }, )

            grid3.setColumns(update_columns);
            // resizeColumns('disactiveJqxgrid');

            var panel_height = ($('.fixpage').css("height").slice(0, -2) - 150) + "px";
            $('#disactiveGrid').css("height", (panel_height.slice(0, -2) - 62))
                //$('#disactiveJqxgrid').css("height", "calc(100% - 85px)")

            setTimeout(() => {
                    // resizeColumns('gridDatasetsOfDatasource');
                    // $('#disactiveJqxgrid .slick-viewport').css('height', "calc(100% - 60px)");
                    $('#disactiveJqxgrid .slick-pane-top').css('height', "100%");
                },
                5);

            // if($('.slick-pane-top').css('height').slice(0,-2) > (grid3.getData().getItems().length * 30)){
            //     $('.slick-header').css('width', '100%');
            // }
            // else{
            //     $('.slick-header').css('width', '98.7%');
            // }
        }
    }

    var keyboardNavigation = function(event) {
        var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
        if (event.currentTarget.id == undefined) return;
        if (key != 37 && key != 39) return;
        var id = event.currentTarget.id;
        var scrollbar = $('#' + id).jqxGrid('hScrollBar');
        var min = scrollbar.jqxScrollBar('min');
        var max = scrollbar.jqxScrollBar('max');
        if (max == 1) return;
        var v = scrollbar.jqxScrollBar('value');
        var step = 20;
        switch (key) {
            case 39: // right
                if (v < max) v += step;
                if (v > max) v = max;
                break;
            case 37: // left
                if (v > min) v -= step;
                if (v < 0) v = 0;
                break;
            default:
                return;
        }
        scrollbar.jqxScrollBar('setPosition', v);
    };

    async function refreshFavouritesGrid() {
        const data = userFavorites;
        const folderStruct = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
        if (!folderStruct) {
            var items = $('#jsreeFavorites').jstree(true).get_json('#', {
                flat: true
            });
            $('#jsreeFavorites').jstree(true).select_node(items[0]);
            folderStruct = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
        }
        let searchList = [];
        var search = $("#searchBox").val();
        var isCategory = false;
        data.map((e, i) => {
            folderStruct.original.value.items.map((f) => {
                if (e.Symbol == f.Symbol) {
                    searchList.push(e);
                }
            });
        });

        if (search == '' || search == undefined) {
            search = '';
        } else {
            searchListArr = []
            searchList.map(function(e) {
                if (e.Symbol.toLowerCase().search(search.toLowerCase()) != -1 || e.Name.toLowerCase().search(search.toLowerCase()) != -1)
                    searchListArr.push(e);
            });
            searchList = searchListArr;
        }

        if (search !== undefined && search !== "undefined")
            updateURL({
                filter: search
            });

        favoritesGridSource.localdata = searchList;

        for (var i = 0; i < favoritesGridSource.localdata.length; i++) {
            favoritesGridSource.localdata[i].id = "id_" + i;
            favoritesGridSource.localdata[i].num = (i + 1);

            if (favoritesGridSource.localdata[i].Datacategory != undefined)
                isCategory = true;
            else
                favoritesGridSource.localdata[i].Datacategory = ""
        }

        var columns = [{
                id: "datasource",
                name: 'Datasource',
                field: 'Datasource',
                minwidth: 30,
                cssClass: "cell-title",
                width: 100,
                sortable: true,
                formatter: databaseColumnRender
            },
            {
                id: "symbol",
                name: 'Symbol',
                field: 'Symbol',
                minwidth: 10,
                width: 100,
                formatter: symbol_renderer,
                sortable: true,
                cssClass: "cell-title"
            },
            {
                id: "name",
                name: 'Name',
                field: 'Name',
                minwidth: 20,
                width: 420,
                sortable: true,
                cssClass: "cell-title"
            },
            {
                id: "frequency",
                name: 'Frequency',
                field: 'Frequency',
                minwidth: 10,
                width: 80,
                sortable: true,
                cssClass: "cell-title"
            },
            {
                id: "from",
                name: 'From',
                field: 'StartDate',
                filtertype: 'range',
                cellsformat: 'yyyy-MM-dd',
                minwidth: 10,
                width: 80,
                sortable: true,
                cssClass: "cell-title"
            },
            {
                id: "to",
                name: 'To',
                field: 'EndDate',
                cellsformat: 'yyyy-MM-dd',
                minwidth: 10,
                width: 80,
                sortable: true,
                cssClass: "cell-title"
            },
            {
                id: "values",
                name: '# Prices',
                field: 'Values',
                minwidth: 10,
                width: 80,
                sortable: true,
                cssClass: "cell-title"
            },
            {
                id: "currency",
                name: 'Currency',
                field: 'Currency',
                sortable: false,
                minwidth: 10,
                width: 75,
                cssClass: "cell-title"
            },
            {
                id: "decimals",
                name: 'Decimals',
                field: 'Decimals',
                sortable: false,
                minwidth: 10,
                width: 65,
                cssClass: "cell-title"
            },
            {
                id: "unit",
                name: 'Unit',
                field: 'Unit',
                sortable: false,
                minwidth: 10,
                width: 50,
                cssClass: "cell-title"
            },
            {
                id: "conversions",
                name: 'Conversions',
                field: 'Conversions',
                sortable: false,
                minwidth: 10,
                width: 50,
                cssClass: "cell-title"
            },
            {
                id: "additional",
                name: 'Additional',
                field: 'Additional',
                sortable: false,
                minwidth: 10,
                width: 150,
                cssClass: "cell-title",
                formatter: additional_renderer
            }
        ];
        //alert(isCategory)
        setTimeout(() => {
            if (isCategory) {
                columns.splice(1, 0, {
                    id: 'cat',
                    name: 'Cat.',
                    field: 'Datacategory',
                    minwidth: 10,
                    width: 40,
                    sortable: true,
                    cssClass: "cell-title"
                }, )
            }

            //grid1.setData(favoritesGridSource.localdata);
            grid1.setColumns(columns);

            dataView1.beginUpdate();
            dataView1.setItems(favoritesGridSource.localdata, "id");
            dataView1.endUpdate();
            dataView1.reSort();

            //grid1.invalidate();
            //grid1.render();

            var toggled = getCookie('btnHideAdditInfo1');

            var tab = getParameterByName('tab');
            if (tab == "favorites") {
                if (toggled == 'true') {
                    showAdditInfo(1);
                } else {
                    hideAdditInfo(1);
                }
            }
        }, 50);
    }

    async function refreshTreeFolders(loaded = true) {
        if (loaded) {
            $('#jsreeFavorites').on('loaded.jstree', async function() {
                let data = userFavorites,
                    items = $('#jsreeFavorites').jstree(true).get_json('#', {
                        flat: true
                    });
                objectFavorites = await getUserFavorites(getSession());
                let all_items = await createFolderStructure(objectFavorites);

                if (data !== undefined) {
                    items.map((item, j) => {
                        let i = 0;
                        if (j > 0) {
                            objectFavorites.FavoritesTree.map((row, k) => {
                                if (item.id.split("_")[1] === row.value.id.split("_")[1]) {

                                    objectFavorites.FavoritesTree[k].value.items.map((f) => {
                                        data.map((e) => {
                                            if (e.Symbol == f.Symbol) i++;
                                        });
                                    });

                                    all_items[0].children[k].text = (i == 0) ? objectFavorites.FavoritesTree[k].value.name : objectFavorites.FavoritesTree[k].value.name + " (" + '<span>' + i + '</span>' + ")";
                                    all_items[0].children[k].state = {
                                        'opened': true,
                                    };
                                } else {
                                    objectFavorites.FavoritesTree[k].items.map((u, h) => {
                                        if (item.id.split("_")[1] === u.value.id.split("_")[1]) {
                                            u.value.items.map((f) => {
                                                data.map((e) => {
                                                    if (e.Symbol == f.Symbol) i++;
                                                });
                                            });

                                            all_items[0].children[k].children[h].text = (i == 0) ? objectFavorites.FavoritesTree[k].items[h].value.name : objectFavorites.FavoritesTree[k].items[h].value.name + " (" + '<span>' + i + '</span>' + ")";
                                            all_items[0].children[k].children[h].state = {
                                                'opened': true,
                                            };
                                        }
                                    });
                                }
                            });
                        } else {
                            all_items[j].value.items.map((f) => {
                                data.map((e) => {
                                    if (e.Symbol == f.Symbol) i++;
                                });
                            });

                            all_items[0].text = (i == 0) ? all_items[j].value.name : all_items[j].value.name + " (" + '<span>' + i + '</span>' + ")";
                            all_items[0].state = {
                                'opened': true,
                            };
                        }
                    });

                    // all_items[0].state = {
                    //     'opened': true,
                    // };

                    // $('#jsreeFavorites').jstree("destroy").empty();
                    // $('#jsreeFavorites').jstree({
                    //     "core": {
                    //         "data": all_items,
                    //         "multiple": false,
                    //         "animation": 1,
                    //         "check_callback": true
                    //     },
                    //     "plugins": ["dnd"],
                    // });
                }

                // $('#jsreeFavorites').jstree('open_all');
            });
        } else {
            let data = userFavorites,
                items = $('#jsreeFavorites').jstree(true).get_json('#', {
                    flat: true
                });
            objectFavorites = await getUserFavorites(getSession());
            let all_items = await createFolderStructure(objectFavorites);

            if (data !== undefined) {
                items.map((item, j) => {
                    let i = 0;
                    if (j > 0) {
                        objectFavorites.FavoritesTree.map((row, k) => {
                            if (item.id === row.value.id) {
                                objectFavorites.FavoritesTree[k].value.items.map((f) => {
                                    data.map((e) => {
                                        if (e.Symbol == f.Symbol) i++;
                                    });
                                });

                                all_items[0].children[k].text = (i == 0) ? objectFavorites.FavoritesTree[k].value.name : objectFavorites.FavoritesTree[k].value.name + " (" + '<span>' + i + '</span>' + ")";
                                all_items[0].children[k].state = {
                                    'opened': true,
                                };
                            } else {
                                objectFavorites.FavoritesTree[k].items.map((u, h) => {
                                    if (item.id === u.value.id) {
                                        u.value.items.map((f) => {
                                            data.map((e) => {
                                                if (e.Symbol == f.Symbol) i++;
                                            });
                                        });

                                        all_items[0].children[k].children[h].text = (i == 0) ? objectFavorites.FavoritesTree[k].items[h].value.name : objectFavorites.FavoritesTree[k].items[h].value.name + " (" + '<span>' + i + '</span>' + ")";
                                    }
                                });
                            }
                        });
                    } else {
                        all_items[j].value.items.map((f) => {
                            data.map((e) => {
                                if (e.Symbol == f.Symbol) i++;
                            });
                        });
                        all_items[0].text = (i == 0) ? all_items[j].value.name : all_items[j].value.name + " (" + '<span>' + i + '</span>' + ")"
                    }
                });

                all_items[0].state = {
                    'opened': true,
                };

                $('#jsreeFavorites').jstree("destroy").empty();
                $('#jsreeFavorites').jstree({
                    "core": {
                        "data": all_items,
                        "multiple": false,
                        "animation": 1,
                        "check_callback": true
                    },
                    "plugins": ["dnd"],
                });

                $('#jsreeFavorites').on('loaded.jstree', async function() {
                    $('#jsreeFavorites').on("activate_node.jstree", function(e, data) {
                        var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                        // $("#activeJqxgrid").jqxGrid('showloadelement');
                        setTimeout(() => {
                            refreshFavouritesGrid();
                        }, 10);

                        if (item.original.value.root == true) {
                            $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', true);
                            $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', true);
                            $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', true);
                            $("#btnDeleteFolder").jqxButton({
                                disabled: true
                            });
                            $("#btnRenameFolder").jqxButton({
                                disabled: true
                            });
                        } else {
                            $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', false);
                            $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', false);
                            $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', false);
                            $("#btnDeleteFolder").jqxButton({
                                disabled: false
                            });
                            $("#btnRenameFolder").jqxButton({
                                disabled: false
                            });
                        }
                    });
                });
            }
        }

        // setTimeout(() => {
        //     $('#jsreeFavorites').jstree('open_all');
        // }, 200);

    }

    function buildMap(obj) {
        let map = new Map();
        var keys = Object.keys(obj);
        keys.forEach(function(key, i, keys) {
            map.set(key, obj[key]);
        });
        return map;
    }

    function copySelectedSeriesToClipboard(id) {
        if (id == "activeJqxgrid") {
            var rowsindexes = grid1.getSelectedRows();
            var rows = [],
                column = grid1.getColumns();
        } else if (id == "gridDatasetsOfDatasource") {
            var rowsindexes = grid2.getSelectedRows();
            var rows = [],
                column = grid2.getColumns();
        }

        let firstRow = [];
        for (var c in column) {
            if (!column[c].hidden && column[c].field !== "" && column[c].field !== "Favorite" && column[c].field !== "id")
                firstRow.push(column[c].name);
        }
        rows.push(firstRow);

        var arr = [];
        for (var i = 0; i < rowsindexes.length; i++) {
            let row = {};
            if (id == "activeJqxgrid") {
                row = grid1.getDataItem(rowsindexes[i]);
            } else if (id == "gridDatasetsOfDatasource") {
                row = grid2.getDataItem(rowsindexes[i]);
            }

            let col = [];
            for (var c in column) {
                if (!column[c].hidden && column[c].field !== "" && column[c].field !== "Favorite" && column[c].field !== "id") {
                    if (row[column[c].field] == undefined) row[column[c].field] = "";

                    if (column[c].field == "StartDate" || column[c].field == "EndDate")
                        row[column[c].field] = new Date(row[column[c].field]).toISOString().split('T')[0];

                    col.push(row[column[c].field]);
                }
            }

            if (row.Favorite) {
                rows.push(col);
                arr.push({
                    Datasource: row.Datasource,
                    Datacategory: row.Datacategory,
                    Symbol: row.Symbol
                });
            }
        }
        seriesToAdd = arr;

        var CsvString = "";
        rows.forEach(function(RowItem, RowIndex) {
            RowItem.forEach(function(ColItem, ColIndex) {
                CsvString += ColItem + "\t";
            });
            CsvString += "\r\n";
        });

        if (rows.length > 1) {
            copyToClipboard(CsvString);
            var singleCase = ((rows.length - 1) == 1) ? "has" : "have";
            functionNotificationMessage({
                text: rows.length - 1 + " series " + singleCase + " been copied to the clipboard"
            });
        }
    }

    async function createFolderStructure(objectFavorites, sessionToken) {

        const folders = objectFavorites.FavoritesTree;
        let data = userFavorites;

        let folderArray = [];

        objectFavorites.Datasets.forEach(fav => {
            folderArray.push({
                Datasource: fav.Datasource,
                Datacategory: fav.Datacategory,
                Symbol: fav.Symbol,
            });
        });

        function removeTittle(src) {
            src.forEach((a) => {
                // console.log(a);
                let i = 0;
                a.value.items.map((f) => {
                    data.map((e) => {
                        if (e.Symbol == f.Symbol) i++;
                    });
                });
                a.text = (i > 0) ? a.value.name + " (" + i + ")" : a.value.name;
                a.children = a.items;

                if (a.children.length > 0) removeTittle(a.children);
            });
        }
        removeTittle(folders);

        let as = "All series";
        let mainFolders = [{
            text: (userFavorites.length > 0) ? as + " (" + folderArray.length + ")" : as,
            icon: "resources/css/icons/folder.png",
            selected: true,
            expanded: true, //folders.length > 0 ? true:false,
            state: {
                opened: true,
            },
            value: {
                name: as,
                items: userFavorites.length > 0 ? folderArray : [],
                root: true
            }
        }];

        mainFolders[0].children = folders;
        return mainFolders;
    }

    let databaseImages, databaseNames, userFavorites, userBackups, folderStructure, objectFavorites, userDeletedFavorites;
    var userDatasources;
    try {
        let as = async() => {
            userDatasources = await getUserDataSources(getSession(), true);
            databaseImages = createImageMap(userDatasources);
            databaseNames = createNameMap(userDatasources);
            objectFavorites = await getUserFavorites(getSession());
            for (var i in objectFavorites.Datasets) {
                if (objectFavorites.Datasets[i].Additional && objectFavorites.Datasets[i].Additional.length > 0)
                    objectFavorites.Datasets[i].Conversions = objectFavorites.Datasets[i].Additional.Conversions[0].ConvertTo + " " + objectFavorites.Datasets[i].Additional.Conversions[0].ConvertOperator + objectFavorites.Datasets[i].Additional.Conversions[0].ConvertValue
            }
            userFavorites = objectFavorites.Datasets;
            folderStructure = await createFolderStructure(objectFavorites, getSession());
        };
        as().then(function() {
            finish();
        });
    } catch (e) {
        console.log(e)
    }


    var theme = 'light',
        disactiveSource, disactiveDataAdapter;

    function finish() {
        var deletedFavorites = [],
            namesMap = buildMap(databaseNames),
            folderToAdd,
            lastTreeItem,
            sourceTreeItem;
        imagesMap = buildMap(databaseImages)

        var toThemeProperty = function(className) {
                return className + " " + className + "-" + theme;
            },

            activeGridColumns = [{
                    id: "datasource",
                    name: "Datasource",
                    field: "Datasource",
                    minWidth: 20,
                    width: 100,
                    cssClass: "cell-title",
                    sortable: true,
                    formatter: databaseColumnRender
                },
                {
                    id: "symbol",
                    name: "Symbol",
                    field: "Symbol",
                    minWidth: 20,
                    width: 100,
                    cssClass: "cell-title",
                    sortable: true,
                    formatter: symbol_renderer
                },
                {
                    id: "name",
                    name: "Name",
                    field: "Name",
                    sortable: true,
                    minWidth: 20,
                    width: 450,
                    maxWidth: 450,
                    cssClass: "cell-title"
                },
                {
                    id: "frequency",
                    defaultSortAsc: false,
                    name: "Frequency",
                    field: "Frequency",
                    minWidth: 20,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "from",
                    name: "From",
                    field: "StartDate",
                    minWidth: 20,
                    width: 100,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "to",
                    name: "To",
                    field: "EndDate",
                    minWidth: 20,
                    width: 100,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "values",
                    name: "# Prices",
                    field: "Values",
                    minWidth: 20,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title cell-right"
                },
                {
                    id: "currency",
                    name: "Currency",
                    field: "Currency",
                    minWidth: 20,
                    width: 60,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "decimals",
                    name: "Decimals",
                    field: "Decimals",
                    minWidth: 20,
                    width: 60,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "unit",
                    name: "Unit",
                    field: "Unit",
                    minWidth: 20,
                    width: 60,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "conversions",
                    name: "Conversions",
                    field: "Conversions",
                    minWidth: 20,
                    width: 100,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "additional",
                    name: "Additional",
                    field: "Additional",
                    minWidth: 20,
                    width: 120,
                    sortable: true,
                    cssClass: "cell-title"
                },
            ];

        $('#jqxTabs').jqxTabs({
            width: '100%',
            height: '100%',
            position: 'top',
            keyboardNavigation: false
        });
        $("#jqxTabs").removeClass("wait");

        // $("#fav-help").jqxButton({
        //     imgSrc: "resources/css/icons/help_24.png",
        //     imgPosition: "left",
        //     textPosition: "center"
        // });

        $("#fav-help").tooltip();

        // $("#fav-help").on('click', function () {
        //     window.open("fav-help.html", '_blank');
        // });

        var requestedTab = getParameterByName('tab');
        if (requestedTab != null && requestedTab != '') {
            if (requestedTab == 'mydatasources') {
                $('#jqxTabs').jqxTabs('select', 1);
                if (!datasourceGrid_active) {
                    datasourceGrid();
                }
            } else if (requestedTab == 'deleted') {
                $('#jqxTabs').jqxTabs('select', 2);
                if (!disactiveGrid_active) {
                    // $("#jqxLoader").jqxLoader('open');
                    setTimeout(() => {
                        disactiveGrid()
                    }, 5);
                }
            } else {
                if (!activeGrid_active) {
                    // $("#jqxLoader").jqxLoader('open');
                    setTimeout(() => {
                        activeGrid()
                    }, 5);
                }
            }
        }

        $('#jqxTabs').on('selected', function(event) {
            if (getSession() == undefined || getSession() == "") {
                openLoginPopup();
            } else {
                var tab;
                switch (event.args.item) {
                    case 0:
                        tab = "favorites"
                        if (!activeGrid_active) {
                            // $("#jqxLoader").jqxLoader('open');
                            setTimeout(() => {
                                activeGrid()
                            }, 20);
                        } else {
                            hideAdditInfo(1);
                            activeJqxgridDragAndDropInit();
                        }
                        break;
                    case 1:
                        tab = "mydatasources"
                        if (!datasourceGrid_active) {
                            // $("#jqxLoader").jqxLoader('open');
                            datasourceGrid();
                            // hideAdditInfo(2);
                            // var panel_height = $('.splitter-panel-datasource').css("height");

                            // setTimeout(() =>
                            // {
                            //     $('#gridDatasetsOfDatasource').css("height", (panel_height.slice(0,-2)-67))
                            //     // resizeColumns('gridDatasetsOfDatasource');
                            //     $('.slick-viewport').css('height', (panel_height.slice(0,-2)-67));
                            //     $('.slick-pane-top').css('height', (panel_height.slice(0,-2)-67));
                            // },
                            // 50);
                        } else {
                            // datasourceGrid();
                            hideAdditInfo(2);
                        }
                        break;
                    case 2:
                        tab = "deleted"
                        if (!disactiveGrid_active) {
                            // $("#jqxLoader").jqxLoader('open');
                            setTimeout(() => {
                                disactiveGrid()
                            }, 20);
                        } else {
                            hideAdditInfo(3);
                        }
                        break;
                }

                $('.jqx-popover').hide();

                dataToSend = {
                    tab: tab
                }

                if (tab == "mydatasources" && DatasetsOfDatasourceSet !== undefined) {
                    dataToSend.page = DatasetsOfDatasourceSet.Request.Page;

                    if (DatasetsOfDatasourceSet.Request.Filter !== undefined)
                        dataToSend.filter = DatasetsOfDatasourceSet.Request.Filter;

                    if (DatasetsOfDatasourceSet.Request.CategoryFilter !== undefined)
                        dataToSend.category = DatasetsOfDatasourceSet.Request.CategoryFilter;

                    if (!DatasetsOfDatasourceSet.Request.Datasource !== undefined)
                        dataToSend.datasource = DatasetsOfDatasourceSet.Request.Datasource;
                } else if ($('#searchBox').val() !== "" && $('#searchBox').val() !== undefined && $('#searchBox').val() !== "undefined" && tab == "favorites")
                    dataToSend.filter = $('#searchBox').val();
                else
                    delete dataToSend.filter;


                updateURL(dataToSend, true);
            }
        });

        /* ============= activeJqxgrid =============== */
        function activeGrid() {
            function changeNodeWithChilds(elem, method, elems) {
                if (method != 'expandItem' && method != 'collapseItem') return;
                $('#jsreeFavorites').jqxTree(method, elem);
                if (elem.hasItems === true) {
                    var id = elem.id;
                    elems.forEach(function(el) {
                        if (el.parentId == id) changeNodeWithChilds(el, method, elems);
                    });
                }
            }

            var attachContextMenu = function() {
                $("#treeExpander").on('mousedown', function(event) {
                    var target = $(event.target).parents('li:first')[0],
                        rightClick = isRightClick(event);
                    if (rightClick) {
                        if (target) {
                            $("#jsreeFavorites").jstree().deselect_all(true);
                            $('#jsreeFavorites').jstree(true).select_node(target);
                        }
                        var scrollTop = $(window).scrollTop();
                        var scrollLeft = $(window).scrollLeft();
                        contextMenu.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
                        return false;
                    }
                });
            }

            function isRightClick(event) {
                var rightclick;
                if (!event)
                    var event = window.event;

                if (event.which)
                    rightclick = (event.which == 3);

                else if (event.button)
                    rightclick = (event.button == 2);

                return rightclick;
            }

            var contextMenu = $("#jqxTreeMenu").jqxMenu({
                width: '130px',
                height: '210px',
                autoOpenPopup: false,
                mode: 'popup'
            });
            contextMenu.on('shown', () => {
                var item = $('#jsreeFavorites').jstree(true).get_selected("full", true);
                if (item[0].original.value.root == true)
                    $('#miNewFolder').text('New Folder');
                else
                    $('#miNewFolder').text('New Subfolder');

            });

            $('#chMoveFolders').jqxCheckBox({
                checked: false
            });

            $('#chMoveFolders').on('change', function(event) {
                var button = $('#btnMoveFolders');
                globalMoveFolders = event.args.checked;
                var toggled = button.jqxToggleButton('toggled');
                if (toggled != globalMoveFolders)
                    button.jqxToggleButton('toggle');

                if (toggled) {
                    $('#btnMoveFolders').find('img').attr('src', 'resources/css/icons/grey_move.png');
                    $('#btnMoveFolders').find('img').tooltip("option", "content", "Enable folder moving");
                } else {
                    $('#btnMoveFolders').find('img').attr('src', 'resources/css/icons/color_move.png');
                    $('#btnMoveFolders').find('img').tooltip("option", "content", "Disable folder moving");
                }
            });

            createFolders = async() => {
                // Init Tree Menu
                var clickedItem = null;

                // disable the default browser's context menu.
                $(document).on('contextmenu', function(e) {
                    if ($(e.target).parents('#treeExpander').length > 0)
                        return false;

                    return true;
                });
                // Miqueas-TreeExpander or TODO
                $("#treeExpander").jqxExpander({
                    toggleMode: 'none',
                    showArrow: false,
                    width: "100%",
                    height: "100%",
                    initContent: function() {
                        $('#jsreeFavorites').jstree({
                            "core": {
                                "data": folderStructure,
                                "check_callback": true,
                            },
                            "plugins": ["dnd"]
                        });

                        // refreshTreeFolders();

                        $("#jqxTreeToolBar").jqxToolBar({
                            width: '100%',
                            height: 38,
                            tools: 'custom | custom | custom | custom | custom',
                            initTools: function(type, index, tool, menuToolIninitialization) {
                                if (type == "toggleButton") {
                                    var icon = $("<div class='jqx-editor-toolbar-icon jqx-editor-toolbar-icon-" + theme + " buttonIcon'></div>");
                                }
                                switch (index) {
                                    case 0:
                                        var button = $("<div>" + "<img  height='16px' width='16px' src='resources/css/icons/folder_add.png' title='Add a new Folder'></div>");
                                        tool.append(button);
                                        button.jqxButton({
                                            height: 15
                                        });
                                        button.on('click', function() {
                                            openAddFolderDialog();
                                        });
                                        button.find('img').tooltip();
                                        break;
                                    case 1:
                                        var button = $("<div id='btnDeleteFolder'>" + "<img  height='16px' width='16px' src='resources/css/icons/folder_delete.png' title='Delete the selected empty folder'></div>");
                                        tool.append(button);
                                        button.jqxButton({
                                            height: 15,
                                            disabled: true
                                        });
                                        button.on('click', function() {
                                            openDeleteFolderDialog();
                                        });
                                        button.find('img').tooltip();
                                        break;
                                    case 2:
                                        var button = $("<div id='btnRenameFolder'>" + "<img  height='16px' width='16px' src='resources/css/icons/folder_rename.png' title='Rename the selected folder'></div>");
                                        tool.append(button);
                                        button.jqxButton({
                                            height: 15,
                                            disabled: true
                                        });
                                        button.on('click', function() {
                                            openRenameDialogWindow();
                                        });
                                        button.find('img').tooltip();
                                        break;
                                    case 3:
                                        var button = $("<div id=\"btnMoveFolders\" style='margin-right:30px;'><img  height='16px' width='16px' src='resources/css/icons/grey_move.png' title='Enable folder moving'></div>");
                                        tool.append(button);
                                        button.jqxToggleButton({
                                            height: 15,
                                            toggled: false
                                        });
                                        button.on('click', function() {
                                            var toggled = button.jqxToggleButton('toggled');
                                            if (toggled != $('#chMoveFolders').jqxCheckBox('checked'))
                                                $('#chMoveFolders').jqxCheckBox({
                                                    checked: toggled
                                                });
                                            globalMoveFolders = toggled;

                                            if (toggled) {
                                                button.find('img').attr('src', 'resources/css/icons/color_move.png');
                                                button.find('img').tooltip("option", "content", "Disable folder moving");
                                            } else {
                                                button.find('img').attr('src', 'resources/css/icons/grey_move.png');
                                                button.find('img').tooltip("option", "content", "Enable folder moving");
                                            }
                                        });
                                        button.find('img').tooltip();
                                        break;
                                    case 4:
                                        var button = $("<div id='btnShowBackups' style='margin-right:4px'>" + "<img  height='16px' width='16px' src='resources/css/icons/backup.png' title='Manage user favorite backups'></div>");
                                        tool.append(button);
                                        tool.css('float', 'right')
                                        button.jqxButton({
                                            height: 15
                                        });
                                        button.on('click', function() {
                                            $('body').addClass('overlay');
                                            showBackupsList();
                                        });
                                        button.find('img').tooltip();
                                        break;
                                }
                            }
                        });

                        attachContextMenu();
                        $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', true);
                        $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', true);
                        $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', true);
                        $("#jqxTreeMenu").on('itemclick', function(event) {
                            var item = $.trim($(event.args).text());
                            switch (item) {
                                case "New Folder":
                                case "New Subfolder":
                                    openAddFolderDialog();
                                    attachContextMenu();
                                    break;
                                case "Rename Folder":
                                    openRenameDialogWindow();
                                    attachContextMenu();
                                    break;
                                case "Paste":
                                    pasteSeriesFromClipboardToFolder();
                                    attachContextMenu();
                                    break;
                                case "Open All":
                                    $('#jsreeFavorites').jstree('open_all');
                                    var all_items = $('#jsreeFavorites').jstree(true).get_json('#', {
                                        flat: true
                                    });
                                    var se = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                    // changeNodeWithChilds(se, 'expandItem', all_items);
                                    break;
                                case "Close All":
                                    $('#jsreeFavorites').jstree('close_all');
                                    var all_items = $('#jsreeFavorites').jstree(true).get_json('#', {
                                        flat: true
                                    });
                                    var se = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                    // changeNodeWithChilds(se,'collapseItem', all_items);
                                    break;
                                case "Delete Folder":
                                    openDeleteFolderDialog();
                                    attachContextMenu();
                                    break;
                            }
                        });
                    }
                });
            };

            function pasteSeriesFromClipboardToFolder() {
                var selectedItem = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                if (selectedItem.original.value.root == true)
                    return;

                if (!seriesToAdd) {
                    dialogWindow('Nothing to paste', 'warning');
                    return;
                }

                folderToAdd = selectedItem.original.value.id;

                if (seriesToAdd.length == 1) {
                    $("#addSeriesWindowContent").text("Paste 1 series to folder '" + selectedItem.original.value.name + "'?");
                } else {
                    $("#addSeriesWindowContent").text("Paste " + seriesToAdd.length + " series into folder '" + selectedItem.original.value.name + "'?");
                }
                $('#addSeriesWindow').dialog('open');
                lastTreeItem = selectedItem;
            }

            async function searchSeries() {
                refreshFavouritesGrid();
            }

            $("#gridExpander").jqxExpander({
                toggleMode: 'none',
                showArrow: false,
                width: "100%",
                height: "100%",
                initContent: initActiveJqxgrid
            });

            initToolbar = () => {
                $('#jsreeFavorites').on('loaded.jstree', function() {
                    var items = $('#jsreeFavorites').jstree(true).get_json('#', {
                        flat: true
                    });
                    $('#jsreeFavorites').jstree(true).select_node(items[0]);
                    sourceTreeItem = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                    setTimeout(() => {
                        $('#jsreeFavorites').on('activate_node.jstree', function(e, item) {
                            // $('#jsreeFavorites').on("select_node.jstree", function (e, data) {
                            if (isDragStart == false) {
                                sourceTreeItem = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                // $("#activeJqxgrid").jqxGrid('showloadelement');
                                refreshFavouritesGrid();
                                setTimeout(() => {
                                    refreshFavouritesGrid();
                                }, 10);

                                var rowsindexes = grid1.getSelectedRows();

                                if (rowsindexes.length != 0)
                                    grid1.setSelectedRows([0]);

                                setTimeout(() => {
                                    activeJqxgridDragAndDropInit();
                                }, 100);
                            }

                            var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                            if (item.original.value.root == true) {
                                $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', true);
                                $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', true);
                                $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', true);
                                $("#btnDeleteFolder").jqxButton({
                                    disabled: true
                                });
                                $("#btnRenameFolder").jqxButton({
                                    disabled: true
                                });
                            } else {
                                $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', false);
                                $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', false);
                                $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', false);
                                $("#btnDeleteFolder").jqxButton({
                                    disabled: false
                                });
                                $("#btnRenameFolder").jqxButton({
                                    disabled: false
                                });
                            }
                        });
                    }, 200);
                });
            }

            function openAddFolderDialog() {
                var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                if (!item) return;

                $("#rootFolderUid").val(item.original.value.folderUid);

                $('#folder-info').text('Create a Subfolder under "' + item.original.value.name + '"');
                $('#addFolderWindow').dialog({
                    title: "Create a Subfolder"
                });
                $('#addFolderWindow').dialog('open');

                $('#folderName').focus();
            }

            async function addNewFolder() {
                var newFolderName = $("#folderName").val();
                if (newFolderName == null || newFolderName == '') {
                    dialogWindow("Folder name is blank. Please enter a valid folder name.", 'error')
                    return;
                }

                var added_elem = {
                    text: newFolderName,
                    icon: "resources/css/icons/folder.png",
                    value: {
                        name: newFolderName,
                        items: [],
                        root: false
                    }
                };

                var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];

                $('#jsreeFavorites').jstree(true).create_node(item, added_elem, "last", function() {
                    if (item.state.opened == false) {
                        $("#jsreeFavorites").jstree("open_node", item.id);
                    }

                    $("#folderName").val("");
                    updateFolderStructure();
                    functionNotificationMessage({
                        text: 'Folder ' + newFolderName + ' has been added.'
                    })
                });
            }

            $('#folderName').keypress(function(e) {
                if (e.which == 13) {
                    addNewFolder();
                    $('#addFolderWindow').dialog('close');
                    return false;
                }
            });

            $('#newFolderName').keypress(function(e) {
                if (e.which == 13) {
                    renameFolder();
                    $('#renameFolderWindow').dialog('close');
                    return false;
                }
            });

            function openDeleteFolderDialog() {
                var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                if (!item)
                    return;
                if (item.original.value.root == true) {
                    dialogWindow("You can't delete the root folder 'All'", "error");
                } else if (item.original.value.items.length > 0 || isSubFoldersHasSeries(item)) {
                    dialogWindow("You must remove the series from this folder before you can delete it.", "error");
                } else if (item.children.length > 0) {
                    dialogWindow("The folder has empty sub folders.<br>Are you sure you want to delete it?", "query", "confirm", null, () => {
                        deleteFolder();
                    }, null, null, {
                        Ok: "Yes",
                        Cancel: "No"
                    });
                } else {
                    dialogWindow("Are you sure you want to delete folder '" + item.text + "''?", "query", "confirm", null, () => {
                        deleteFolder();
                    }, null, null, {
                        Ok: "Yes",
                        Cancel: "No"
                    });
                }
            }

            function deleteFolder() {
                var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                if (!item)
                    return;

                $('#jsreeFavorites').jstree().delete_node(item);

                updateFolderStructure();
                functionNotificationMessage({
                    text: "Folder has been removed."
                })
            }

            $("#addSeriesWindow").dialog({
                resizable: true,
                autoOpen: false,
                height: "auto",
                width: "auto",
                modal: true,
                buttons: {
                    Ok: function() {
                        var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                        setTimeout(() => {
                            let data = userFavorites;
                            let i = 0;
                            item.original.value.items.map((f) => {
                                data.map((e) => {
                                    if (e.Symbol == f.Symbol) i++;
                                });
                            });

                            var text = (i > 0) ? item.original.value.name + " (" + i + ")" : item.original.value.name;
                            $("#jsreeFavorites").jstree('rename_node', item, text);
                        }, 100);
                        addSeriesToFolder();
                        $(this).dialog("close");
                    },
                    Cancel: function() {
                        $(this).dialog("close");
                    }
                }
            });

            $("#deleteSeriesWindow").dialog({
                resizable: true,
                autoOpen: false,
                height: "auto",
                width: "auto",
                modal: true,
                buttons: {
                    Ok: function() {
                        deleteSeriesFromFolder();
                        $(this).dialog("close");
                    },
                    Cancel: function() {
                        $(this).dialog("close");
                    }
                }
            });

            $("#renameFolderWindow").dialog({
                resizable: true,
                autoOpen: false,
                height: "auto",
                width: "auto",
                modal: true,
                buttons: {
                    Ok: function() {
                        renameFolder();
                        $(this).dialog("close");
                    },
                    Cancel: function() {
                        $(this).dialog("close");
                    }
                }
            });

            $("#addFolderWindow").dialog({
                resizable: true,
                autoOpen: false,
                height: "auto",
                width: 500,
                modal: true,
                buttons: {
                    Ok: function() {
                        addNewFolder();
                        $(this).dialog("close");
                    },
                    Cancel: function() {
                        $(this).dialog("close");
                    }
                }
            });

            $('#addDefaultBackupWindow').jqxWindow({
                showCollapseButton: false,
                resizable: false,
                height: 130,
                width: 320,
                autoOpen: false,
                title: "Add default backup",
                isModal: true,
                initContent: function() {
                    $('#addDefaultBackupWindowBtn').jqxButton({
                        width: '80px'
                    });
                    $("#addDefaultBackupWindowBtn").on('click', function() {
                        addDefaultBackup();
                    });

                    $('#overwriteDefaultBackupWindowBtn').jqxButton({
                        width: '80px'
                    });
                    $("#overwriteDefaultBackupWindowBtn").on('click', function() {
                        $('#overwriteBackupWindow').jqxWindow('open');
                    });

                    $('#cancelAddDefaultBackupWindowBtn').jqxButton({
                        width: '80px'
                    });
                    $("#cancelAddDefaultBackupWindowBtn").on('click', function() {
                        $('#addDefaultBackupWindow').jqxWindow('close');
                    });
                }
            });

            function openRenameDialogWindow() {
                var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                if (!item)
                    return;

                if (item.original.value.root == true)
                    return;

                $("#oldFolderName").text(item.original.value.name);
                $('#renameFolderWindow').dialog('open');
                $('#newFolderName').focus();
            }

            async function renameFolder() {
                let data = userFavorites;
                var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                if (!item)
                    return;

                var newFolderName = $("#newFolderName").val();
                if (newFolderName == null || newFolderName == '') {
                    dialogWindow("Folder name is blank. Please enter a valid folder name", "error");
                    return;
                }

                let i = 0;
                item.original.value.items.map((f) => {
                    data.map((e) => {
                        if (e.Symbol == f.Symbol) i++;
                    });
                });

                newFolderName = (i > 0) ? newFolderName + " (" + i + ")" : newFolderName;
                $("#jsreeFavorites").jstree(true).rename_node(item, newFolderName);

                updateFolderStructure();
                functionNotificationMessage({
                    text: "Name has been changed"
                });
                $("#newFolderName").val("");
            }

            function openRemoveSeriesFromFolderDialog() {
                var rowsindexes = grid1.getSelectedRows()

                if (rowsindexes.length < 1) return;
                var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                var msg;

                if (item.original.value.root == true) {
                    var cmp = {};
                    for (i = 0; i < rowsindexes.length; i++) {
                        var row = grid1.getDataItem(rowsindexes[i]);
                        var ind = row.Datasource + '#' + row.Datacategory + '#' + row.Symbol;
                        cmp[ind] = 1;
                    }

                    var duplicates = [];
                    for (var i = 1; i < folderStructure.length; i++) {
                        var compare = folderStructure[i].value.items;
                        for (j = 0; j < compare.length; j++) {
                            var cto = compare[j].Datasource + '#' + compare[j].Datacategory + '#' + compare[j].Symbol;
                            if (cmp[cto] != undefined) {
                                duplicates.push(compare[j].Datasource + '/' + compare[j].Symbol + ' in ' + folderStructure[i].value.name);
                            }
                        }
                    }

                    if (duplicates.length > 0) {
                        var h = rowsindexes.length > 1 ? 'have' : 'has';
                        functionNotificationMessage({
                            text: 'Can\'t remove as selected series ' + h + ' been located: ' + duplicates.join(','),
                            type: 'error'
                        });
                        return;
                    }
                }

                if (item.original.value.root == false && rowsindexes.length == 1)
                    msg = "Remove 1 series from folder '" + item.original.value.name + "'?";

                else if (item.original.value.root == false)
                    msg = "Remove " + rowsindexes.length + " series from folder '" + item.original.value.name + "'?";

                else if (item.original.value.root == true && rowsindexes.length == 1)
                    msg = "You are about to remove 1 series from your favorites list. Do you wish to continue?";

                else
                    msg = "You are about to remove " + rowsindexes.length + " series from your favorites list. Do you wish to continue?";

                dialogWindow(msg, 'warning', 'confirm', null, () => {
                    lastTreeItem = item;
                    deleteSeriesFromFolder();

                    setTimeout(() => {
                        activeJqxgridDragAndDropInit()
                    }, 500);
                });
            }

            async function deleteSeriesFromFolder() {
                var rowsindexes = grid1.getSelectedRows()
                rowsindexes.sort(function(a, b) {
                    return a - b;
                });

                let treeNodes = $('#jsreeFavorites').jstree(true).get_json('#', {
                    flat: true
                });
                let data = userFavorites;

                var deleted = [],
                    deleted_symbol = [],
                    rows_data = [];
                for (var i = 0; i < rowsindexes.length; i++) {

                    var row = grid1.getDataItem(rowsindexes[i]);

                    if (lastTreeItem.original.value.root == false) {
                        for (var j = 0; j < lastTreeItem.original.value.items.length; j++) {
                            if (lastTreeItem.original.value.items[j].Symbol == row.Symbol) {
                                lastTreeItem.original.value.items.splice(j, 1);
                            }
                        }
                    } else {
                        treeNodes.map((n) => {
                            var node = $('#jsreeFavorites').jstree(true).get_node(n.id);
                            for (var j = 0; j < node.original.value.items.length; j++) {
                                if (node.original.value.items[j].Symbol == row.Symbol) {
                                    node.original.value.items.splice(j, 1);
                                }
                            }
                        });

                        if (row.Datacategory !== undefined && row.Datacategory != "")
                            deleted.push(row.Datasource + '/' + row.Datacategory + '/' + row.Symbol);
                        else
                            deleted.push(row.Datasource + '/' + row.Symbol);
                        console.log(deleted);

                        deleted_symbol.push(row.Symbol);
                        rows_data.push(row);
                    }
                }

                if (deleted.length > 0) {
                    call_api_ajax('RemoveUserFavoriteDatasets', 'get', {
                        SessionToken: getSession(),
                        "Series[]": deleted
                    }, true, async() => {
                        let data = userFavorites,
                            new_data = [];

                        if (data !== undefined) {
                            var new_deleted = [];
                            data.map((e, i) => {
                                let isExist = false;
                                new_deleted = deleted_symbol.map((symbol) => {
                                    if (e.Symbol == symbol)
                                        isExist = true;

                                    return symbol;
                                });

                                if (!isExist) new_data.push(e);
                            });

                            if (datasourceGrid_active) {
                                var rows = grid2.getData().getItems();
                                rows = rows.map((v, i) => {
                                    new_deleted.map((e) => {
                                        if (e == v.Symbol && v.Favorite == true) {
                                            v.Favorite = false;
                                            dataView2.updateItem(v.id, v);
                                        }
                                    });
                                });
                            }
                            userFavorites = new_data;
                            // $("#activeJqxgrid").jqxGrid('clearselection');
                            // refreshTreeFolders();
                            refreshFavouritesGrid();
                        }

                        if (disactiveGrid_active) {
                            userDeletedFavorites = userDeletedFavorites.concat(rows_data);
                            disactiveSource.localdata = userDeletedFavorites;

                            var isCategory = false;
                            for (var i = 0; i < disactiveSource.localdata.length; i++) {
                                disactiveSource.localdata[i].id = "id_" + i;
                                disactiveSource.localdata[i].num = (i + 1);
                                disactiveSource.localdata[i].Favorite = "";
                                if (disactiveSource.localdata[i].Datacategory != undefined)
                                    isCategory = true;
                            }

                            var columns = [{
                                    id: "datasource",
                                    name: 'Datasource',
                                    field: 'Datasource',
                                    minwidth: 30,
                                    cssClass: "cell-title",
                                    width: 100,
                                    sortable: true,
                                    formatter: databaseColumnRender
                                },
                                {
                                    id: "symbol",
                                    name: 'Symbol',
                                    field: 'Symbol',
                                    minwidth: 10,
                                    width: 100,
                                    formatter: symbol_renderer,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "name",
                                    name: 'Name',
                                    field: 'Name',
                                    minwidth: 20,
                                    width: 690,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "frequency",
                                    name: 'Frequency',
                                    field: 'Frequency',
                                    minwidth: 10,
                                    width: 80,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "from",
                                    name: 'From',
                                    field: 'StartDate',
                                    filtertype: 'range',
                                    cellsformat: 'yyyy-MM-dd',
                                    minwidth: 10,
                                    width: 80,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "to",
                                    name: 'To',
                                    field: 'EndDate',
                                    width: 80,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "values",
                                    name: '# Prices',
                                    field: 'Values',
                                    minwidth: 10,
                                    width: 80,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "currency",
                                    name: 'Currency',
                                    field: 'Currency',
                                    sortable: false,
                                    minwidth: 10,
                                    width: 75,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "decimals",
                                    name: 'Decimals',
                                    field: 'Decimals',
                                    sortable: false,
                                    minwidth: 10,
                                    width: 65,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "unit",
                                    name: 'Unit',
                                    field: 'Unit',
                                    sortable: false,
                                    minwidth: 10,
                                    width: 50,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "conversions",
                                    name: 'Conversions',
                                    field: 'Conversions',
                                    sortable: false,
                                    minwidth: 10,
                                    width: 50,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "additional",
                                    name: 'Additional',
                                    field: 'Additional',
                                    sortable: false,
                                    minwidth: 10,
                                    width: 150,
                                    cssClass: "cell-title",
                                    formatter: additional_renderer
                                }
                            ];

                            if (isCategory) {
                                columns.splice(1, 0, {
                                    id: 'cat',
                                    name: 'Cat.',
                                    field: 'Datacategory',
                                    minwidth: 10,
                                    width: 40,
                                    cssClass: "cell-title"
                                }, )
                            }

                            grid3.setColumns(columns);

                            dataView3.beginUpdate();
                            dataView3.setItems(disactiveSource.localdata, "id");
                            dataView3.endUpdate();

                            grid3.invalidate();
                            grid3.render();

                            var toggled = getCookie('btnHideAdditInfo3');
                            if (toggled == 'true') {
                                showAdditInfo(3);
                            } else {
                                hideAdditInfo(3);
                            }
                        }

                        var n = 'folder ' + lastTreeItem.original.value.name;

                        if (lastTreeItem.original.value.root == true)
                            n = 'your Favorites list';

                        var singleCase = deleted.length == 1 ? " has" : "s have";
                        functionNotificationMessage({
                            text: deleted.length + ' symbol' + singleCase + ' been removed from ' + n,
                            type: "info"
                        });
                    }, null, () => {
                        // $("#activeJqxgrid").jqxGrid('hideloadelement');
                    });
                }

                setTimeout(() => {
                    // $("#activeJqxgrid").jqxGrid('clearselection');
                    updateFolderStructure();
                    refreshFavouritesGrid();
                    grid1.setSelectedRows([]);
                    setTimeout(() => {
                        treeNodes.map((n) => {
                            let i = 0;
                            var node = $('#jsreeFavorites').jstree(true).get_node(n.id);
                            node.original.value.items.map((f) => {

                                data.map((e) => {
                                    if (e.Symbol == f.Symbol) i++;
                                });
                            });

                            var text = (i > 0) ? node.original.value.name + " (" + i + ")" : node.original.value.name;
                            $("#jsreeFavorites").jstree('rename_node', node, text);
                        });
                    }, 50);
                }, 50);
            }

            // TODO here are the magic of the grid
            async function initActiveJqxgrid() {

                function isIEPreVer9() {
                    var v = navigator.appVersion.match(/MSIE ([\d.]+)/i);
                    return (v ? v[1] < 9 : false);
                }

                function CreateAddHeaderRow() {

                    $("#btnHideAdditInfo_favorite").jqxToggleButton({
                        imgSrc: "resources/css/icons/table_plus.png",
                        imgPosition: "center",
                        width: 25,
                        height: 28,
                        imgWidth: 18,
                        imgHeight: 18,
                    });
                    $("#btnHideAdditInfo_favorite img, #btnHideAdditInfo_favorite span").css("top", 6);

                    $(".HelpMessage1").jqxPopover({
                        offset: {
                            left: -50,
                            top: 0
                        },
                        arrowOffsetValue: 50,
                        title: "Search Filter Help",
                        showCloseButton: true,
                        selector: $("#helpIcon2")
                    });

                    // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                    var fullWidthFlag = true;
                    let img = (!fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                    let footer_width = (!fullWidthFlag) ? '1230px' : '1230px';

                    $("#main-footer").width(footer_width);
                    $(".fullWidthPage").jqxButton({
                        imgSrc: "resources/css/icons/" + img + ".png",
                        imgPosition: "left",
                        width: 25,
                        height: 28,
                        imgWidth: 18,
                        imgHeight: 18,
                        textPosition: "right"
                    });
                    $(".fullWidthPage img, .fullWidthPage span").css("top", 5);
                    $(".fixpage").toggleClass('fullscreen', !fullWidthFlag);

                    // resizeColumns('activeJqxgrid');

                    $("#searchBox").jqxInput({
                        placeHolder: "Enter filter text",
                        height: 24,
                        width: 230
                    });
                    $("#btnAutosizeActive").jqxButton({
                        imgSrc: "resources/css/icons/autosize.png",
                        width: 25,
                        height: 24,
                        imgWidth: 18,
                        imgHeight: 18,
                    });
                    $("#btnAutosizeActive img, #btnAutosizeActive span").css("top", 7);
                    // $("#fullWidth2").jqxButton({ imgSrc: "resources/css/icons/" + img + ".png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                    $("#btnRemoveFromFavorites").jqxButton({
                        imgSrc: "resources/css/icons/star_delete.png",
                        imgPosition: "left",
                        width: 78,
                        height: 28,
                        imgWidth: 18,
                        imgHeight: 18,
                        textPosition: "right"
                    });
                    $("#btnRemoveFromFavorites img, #btnRemoveFromFavorites span").css("top", 6);

                    $("#searchBtn").jqxButton({
                        imgSrc: "resources/css/icons/search.png",
                        imgPosition: "center",
                        width: 24,
                        height: 24,
                        imgWidth: 16,
                        imgHeight: 16
                    });
                    $("#searchBtn img, #searchBtn span").css("top", 6);

                    $("#searchBox").keypress(function(e) {
                        if (e.which == 13) {
                            searchSeries();
                            return false;
                        }
                    });

                    $("#searchBtn").click(function(evt) {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            searchSeries();
                        }
                    });

                    // $("#searchBox").bind("input", function (evt) 
                    // {
                    //     if (window.event && event.type == "propertychange" && event.propertyName != "value")
                    //         return;

                    //     searchSeries();
                    // });

                    $("#btnAutosizeActive").on('click', function() {
                        // resizeColumns('activeJqxgrid');
                        // grid1.autosizeColumns();
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            var toggled = getCookie('btnHideAdditInfo1');
                            if (toggled == 'true') {
                                showAdditInfo(1);

                            } else {
                                hideAdditInfo(1);
                            }

                            activeJqxgridDragAndDropInit();
                        }
                    });

                    $("#btnHideAdditInfo_favorite").on('click', function(event) {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            // var current_grid = "activeJqxgrid";
                            var id = event.currentTarget.id;
                            setCookie('btnHideAdditInfo1', $('#' + id).jqxToggleButton('toggled'));

                            var toggled = getCookie('btnHideAdditInfo1');
                            if (toggled == 'true') {
                                showAdditInfo(1);
                                document.getElementById(id).title = "Hide additional data columns";

                            } else {
                                hideAdditInfo(1);
                                document.getElementById(id).title = "Show additional data columns";
                            }

                            activeJqxgridDragAndDropInit();
                        }
                    });

                    if (showAdditionalInformation2) {
                        $('#btnHideAdditInfo_favorite').jqxToggleButton('toggle');
                    } else {}

                    $("#fullWidth2").on('click', function() {
                        // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                        img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                        footer_width = (fullWidthFlag) ? '100%' : '1230px';

                        footer_posLeft = (fullWidthFlag) ? '0' : '';

                        $(".footerbar").css("max-width", footer_width);
                        $(".footerbar").css("left", footer_posLeft);

                        // $("#main-footer").width(footer_width);
                        $(".fullWidthPage").jqxButton({
                            imgSrc: "resources/css/icons/" + img + ".png",
                            imgPosition: "left",
                            width: 25,
                            height: 24,
                            textPosition: "right"
                        });
                        $(".fullWidthPage img, .fullWidthPage span").css("top", 5);
                        $(".fixpage").toggleClass('fullscreen', fullWidthFlag);

                        fullWidthFlag = !fullWidthFlag;
                        setCookie('p_fullWidth1', fullWidthFlag);
                        resizeColumns('activeJqxgrid');
                    });

                    $("#btnRemoveFromFavorites").on('click', function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            openRemoveSeriesFromFolderDialog();
                            // setTimeout(() => { 
                            //     activeJqxgridDragAndDropInit();
                            // }, 100);
                        }
                    });

                    if (filterOfURL == "undefined")
                        filterOfURL = "";

                    let searchValue = filterOfURL;
                    $('#searchBox').val(searchValue);

                    $("#fullWidth2").tooltip();
                    $("#btnAutosizeActive").tooltip();
                    $('#btnHideAdditInfo_favorite').tooltip();
                    $("#btnRemoveFromFavorites").tooltip();
                }

                favoritesGridSource = {
                    datatype: "json",
                    datafields: baseDataFields,
                    localdata: await userFavorites
                };

                await createFolders();

                initToolbar();
                var cols;

                $('#mainSplitter').on('resize expanded collapsed', function(e) {
                    if ($('#jqxTreeToolBar').css('width').slice(0, -2) < 170) {
                        $('.jqx-toolbar-tool-no-separator-ltr').css('position', 'static');
                    } else {
                        $('.jqx-toolbar-tool-no-separator-ltr').css('position', 'absolute');
                    }
                });

                var searchArray = [];
                var isCategory = false;
                favoritesGridSource.localdata.forEach(function(e, index) {
                    if ((e.Symbol.search(filterOfURL) != -1 || e.Name.search(filterOfURL) != -1) && filterOfURL !== "undefined") searchArray.push(e)

                    if (e.Datacategory != undefined) isCategory = true;
                });

                favoritesGridSource.localdata = searchArray;
                // favoritesGridDataAdapter = new $.jqx.dataAdapter(favoritesGridSource);

                var activeColumns = baseGridColumns;

                // console.log(favoritesGridSource.localdata);

                if (isCategory)
                    activeColumns.splice(1, 0, {
                        id: 'cat',
                        name: 'Cat.',
                        field: 'Datacategory',
                        minwidth: 10,
                        width: 40,
                        sortable: true,
                        cssClass: "cell-title"
                    }, )

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
                    grid1.setTopPanelVisibility(!grid1.getOptions().showTopPanel);
                }

                $(function() {
                    // prepare the data
                    for (var i = 0; i < favoritesGridSource.localdata.length; i++) {
                        favoritesGridSource.localdata[i].id = "id_" + i;
                        favoritesGridSource.localdata[i].num = (i + 1);
                        if (favoritesGridSource.localdata[i].Datacategory == undefined)
                            favoritesGridSource.localdata[i].Datacategory = "";
                        // favoritesGridSource.localdata[i].Favorite = "false";
                    }

                    dataView1 = new Slick.Data.DataView({
                        inlineFilters: true
                    });
                    grid1 = new Slick.Grid("#activeJqxgrid", dataView1, activeColumns, options);
                    grid1.setSelectionModel(new Slick.RowSelectionModel());

                    // create the Resizer plugin
                    // you need to provide a DOM element container for the plugin to calculate available space
                    // resizer = new Slick.Plugins.Resizer({
                    //         container: '.container', // DOM element selector, can be an ID or a class name

                    //         // optionally define some padding and dimensions
                    //         rightPadding: 5, // defaults to 0
                    //         bottomPadding: 10, // defaults to 20
                    //         minHeight: 150, // defaults to 180
                    //         minWidth: 250, // defaults to 300

                    //         // you can also add some max values (none by default)
                    //         // maxHeight: 1000,
                    //         // maxWidth: 2000,
                    //     },
                    //     // the 2nd argument is an object and is optional
                    //     // you could pass fixed dimensions, you can pass both height/width or a single dimension (passing both would obviously disable the auto-resize completely)
                    //     // for example if we pass only the height (as shown below), it will use a fixed height but will auto-resize only the width
                    //     // { height: 300 }
                    // );
                    // grid.registerPlugin(resizer);
                    // resizer.resizeGrid(0, { height: "800", width: "100%" });

                    // var pager = new Slick.Controls.Pager(dataView1, grid1, $("#pager1"));
                    // var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);

                    // move the filter panel defined in a hidden div into grid top panel
                    $("#inlineFilterPanel")
                        .appendTo(grid1.getTopPanel())
                        .show();

                    grid1.onCellChange.subscribe(function(e, args) {
                        dataView1.updateItem(args.item.id, args.item);
                    });

                    grid1.onClick.subscribe(function(e, args) {
                        if (args.grid.getColumns()[1].name == "Cat.") {
                            if (args.cell == 2) {
                                if (getSession() == undefined || getSession() == "") {
                                    openLoginPopup();
                                } else {
                                    item = dataView1.getItem(args.row);
                                    openSeriesInNewTab(item.Datasource, item.Symbol, item.Datacategory);
                                }
                            }
                        } else {
                            if (args.cell == 1) {
                                if (getSession() == undefined || getSession() == "") {
                                    openLoginPopup();
                                } else {
                                    item = dataView1.getItem(args.row);
                                    openSeriesInNewTab(item.Datasource, item.Symbol, item.Datacategory);
                                }
                            }
                        }

                        if (args.cell == 12) {
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                item = dataView1.getItem(args.row);
                                var txt = JSON.stringify(item.Additional);
                                // $(".popup-content").html( txt )
                                if (item.Additional != undefined) {
                                    if (item.Subscription == undefined) {
                                        dialogWindow("You do not have access to that value.", "error");
                                    } else {
                                        setCookie('additionalJSON' + args.row, txt);
                                        JqxPopup(args.row, item.Symbol);
                                    }
                                }
                            }
                        }

                        activeJqxgridDragAndDropInit();
                    });

                    grid1.onContextMenu.subscribe(function(e) {
                        e.preventDefault();
                        var cell = grid1.getCellFromEvent(e);
                        var indexes = grid1.getSelectedRows()
                        indexes.push(cell.row);
                        grid1.setSelectedRows(indexes)

                        $("#jqxGridMenu")
                            .data("row", cell.row)
                            .css("top", e.pageY)
                            .css("left", e.pageX)
                            .show();

                        $("body").one("click", function() {
                            $("#jqxGridMenu").hide();
                        });
                    });

                    grid1.onAddNewRow.subscribe(function(e, args) {
                        var item = {
                            "num": data.length,
                            "id": "new_" + (Math.round(Math.random() * 10000)),
                            "title": "New task",
                            "duration": "1 day",
                            "percentComplete": 0,
                            "start": "01/01/2009",
                            "finish": "01/01/2009"
                        };
                        $.extend(item, args.item);
                        dataView1.addItem(item);
                    });

                    grid1.onKeyDown.subscribe(function(e) {
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

                    /*grid1.onScroll.subscribe(function(e, args){                        
                      });*/

                    grid1.onSort.subscribe(function(e, args) {
                        sortdir = args.sortCols[0].sortAsc ? 1 : -1;
                        sortcol = args.sortCols[0].sortCol.field;
                        if (isIEPreVer9()) {
                            // using temporary Object.prototype.toString override
                            // more limited and does lexicographic sort only by default, but can be much faster

                            var percentCompleteValueFn = function() {
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

                    dataView1.onRowCountChanged.subscribe(function(e, args) {
                        grid1.updateRowCount();
                        grid1.render();
                    });

                    dataView1.onRowsChanged.subscribe(function(e, args) {
                        grid1.invalidateRows(args.rows);
                        grid1.render();
                    });

                    dataView1.onPagingInfoChanged.subscribe(function(e, pagingInfo) {
                        grid1.updatePagingStatusFromView(pagingInfo);

                        // show the pagingInfo but remove the dataView from the object, just for the Cypress E2E test
                        delete pagingInfo.dataView;
                    });

                    dataView1.onBeforePagingInfoChanged.subscribe(function(e, previousPagingInfo) {
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
                        dataView1.setFilterArgs({
                            percentCompleteThreshold: percentCompleteThreshold,
                            searchString: searchString
                        });
                        dataView1.refresh();
                    }

                    $("#btnSelectRows").click(function() {
                        if (!Slick.GlobalEditorLock.commitCurrentEdit()) {
                            return;
                        }

                        var rows = [];
                        for (var i = 0; i < 10 && i < dataView1.getLength(); i++) {
                            rows.push(i);
                        }

                        grid1.setSelectedRows(rows);
                    });

                    grid1.init();

                    CreateAddHeaderRow();

                    // initialize the model after all the events have been hooked up
                    dataView1.beginUpdate();
                    dataView1.setItems(favoritesGridSource.localdata);
                    dataView1.setFilterArgs({
                        percentCompleteThreshold: percentCompleteThreshold,
                        searchString: searchString
                    });
                    dataView1.setFilter(myFilter);
                    dataView1.endUpdate();

                    // if you don't want the items that are not visible (due to being filtered out
                    // or being on a different page) to stay selected, pass 'false' to the second arg
                    dataView1.syncGridSelection(grid1, true);

                    $("#gridContainer").resizable();

                    // if (getCookie('btnHideAdditInfo1') != undefined && getCookie('btnHideAdditInfo1') == "true") {
                    //     showAdditInfo(1);
                    //     showAdditionalInformation1 = true;
                    // }
                    // else {
                    hideAdditInfo(1);
                    showAdditionalInformation1 = false;
                    // }
                    resizeColumns('activeJqxgrid');
                    // CreateNavigationRow()
                    $('#gridExpander').removeClass('wait');
                    // $('#jqxLoader').jqxLoader('close');

                    setTimeout(() => {
                            activeJqxgridDragAndDropInit();
                        },
                        50);
                    activeGrid_active = true;
                })

                $(document).bind('mousemove', function(event) {
                    if (isDragStart == true) {
                        $(".jqx-draggable-dragging").remove();

                        var x = event.pageX;
                        var y = event.pageY;

                        $("#proxy_pan").css({
                            display: "inline-block",
                            top: y + 5,
                            left: x + 5
                        });

                        element = document.elementFromPoint(x, y);
                        if (element.id) {

                            var item = $('#jsreeFavorites').jstree(true).get_node(element.id);
                            if (item) {
                                $("#jsreeFavorites").jstree().deselect_all(true);
                                $('#jsreeFavorites').jstree(true).select_node(item);
                            }
                        }
                    }
                });

                // create context menu
                $("#jqxGridMenu").jqxMenu({
                    width: 200,
                    height: 94,
                    autoOpenPopup: false,
                    mode: 'popup'
                });

                // handle context menu clicks.
                $("#jqxGridMenu").on('itemclick', function(event) {
                    var args = event.args;
                    switch ($.trim($(args).text())) {

                        case "Remove from Favorites":
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                openRemoveSeriesFromFolderDialog();
                            }
                            break;

                        case "Copy":
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                copySelectedSeriesToClipboard('activeJqxgrid');
                            }
                            break;

                        case "Export":
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                makeExportSeriesDialog();
                            }
                            break;
                    }
                });
            }

            function isSubFoldersHasSeries(folder) {
                if (folder.children.length == 0)
                    return folder.original.value.items.length > 0;

                var elements = $('#' + folder.id).find('li');
                // console.log(elements);
                for (var i = 0; i < elements.length; i++) {
                    var item = $('#jsreeFavorites').jstree(true).get_node(elements[i])
                    if (isSubFoldersHasSeries(item) == true)
                        return true;
                }
                return false;
            }
        }
        /* =================== End activeJqxgrid =================== */

        function WriteFavoritesTree(folders, sessionToken) {
            p = {
                    SessionToken: sessionToken,
                    Tree: folders
                }
                // console.log(p);
            call_api_ajax('WriteUserFavoritesMetadataTree', 'POST', JSON.stringify(p), false);
        }

        async function updateFolderStructure() {
            var items = $('#jsreeFavorites').jstree(true).get_json('#', {
                flat: true
            });
            var sources = [{
                value: {
                    id: items[0].id
                },
                items: []
            }];
            var links = {};
            let currentRoot = items[0].id;

            links[currentRoot] = 1;

            var fAddToParent = function(src, seek_id, elem) {
                src.every((el) => {
                    if (el.value.id == seek_id) {
                        el.items.push(elem);
                        return false;
                    }
                    if (el.items.length > 0) return fAddToParent(el.items, seek_id, elem);
                    return true;
                });
                return true;
            };

            items.forEach((elem, index) => {
                if (index == 0) return;
                var node = $('#jsreeFavorites').jstree(true).get_node(elem.id);
                node.original.value.id = elem.id;
                node.original.value.name = node.text.split('(')[0];
                var add_elem = {
                    label: node.text.split('(')[0],
                    icon: "resources/css/icons/folder.png",
                    items: [],
                    value: node.original.value
                }
                fAddToParent(sources, elem.parent, add_elem);
            });

            setTimeout(() => {
                WriteFavoritesTree(JSON.stringify(sources[0].items), getSession());
                // refreshTreeFolders(false);
            }, 200);
        }

        async function addSeriesToFolder() {
            var oldSize = lastTreeItem.original.value.items.length,
                newSize = oldSize,
                len = lastTreeItem.original.value.items.length,
                it = lastTreeItem.original.value.items;

            for (var i = 0; i < seriesToAdd.length; i++) {
                var isFound = false;
                for (var j = 0; j < len; j++) {
                    if (it[j].Datasource == seriesToAdd[i].Datasource &&
                        it[j].Datacategory == seriesToAdd[i].Datacategory &&
                        it[j].Symbol == seriesToAdd[i].Symbol) {
                        isFound = true;
                        break;
                    }
                }
                if (isFound === false) newSize++;
                else seriesToAdd[i] = undefined;
            }

            for (var i = 0; i < seriesToAdd.length; i++) {
                if (seriesToAdd[i] != undefined)
                    lastTreeItem.original.value.items.push(seriesToAdd[i]);
            }
            if ((newSize - oldSize) == 1)
                functionNotificationMessage({
                    text: "1 new symbol has been added to folder " + lastTreeItem.original.value.name,
                    type: 'info'
                });

            else if ((newSize - oldSize) > 1)
                functionNotificationMessage({
                    text: (newSize - oldSize) + " new symbols have been added to folder " + lastTreeItem.original.value.name,
                    type: 'info'
                });

            else
                functionNotificationMessage({
                    text: "No series copied",
                    type: 'info'
                });


            // console.log(lastTreeItem.original.value.items);

            // lastTreeItem.text = lastTreeItem.value.name + " (" + newSize + ")";
            // $('#jsreeFavorites').jqxTree('updateItem', lastTreeItem, lastTreeItem);                         		
            updateFolderStructure();
            refreshFavouritesGrid();

            setTimeout(() => {
                activeJqxgridDragAndDropInit();
            }, 100);
        }

        // Init drag&drop functionality 
        function activeJqxgridDragAndDropInit() {
            // select all grid cells.
            var gridCells = $('#activeJqxgrid').find('.slick-cell');
            var prev_node;

            // initialize the jqxDragDrop plug-in. Set its drop target to the second Grid.

            if (gridCells.length > 0) {
                gridCells.jqxDragDrop({
                    appendTo: 'body',
                    dragZIndex: 99999,
                    dropAction: 'none',
                    cursor: 'arrow',
                    initFeedback: function(proxy) {
                        var rowsindexes = grid1.getSelectedRows()
                        proxy.height(25);
                        proxy.width($("#activeJqxgrid").width());
                        proxy.css('display', 'none');
                    },
                    dropTarget: $('#jsreeFavorites'),
                    revert: false
                });
            }

            gridCells.off('dragStart');
            gridCells.off('dragEnd');

            // initialize the dragged object.
            gridCells.on('dragStart', function(event) {
                prev_node = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                isDragStart = true;
                var value = $(this).text();
                var cell = grid1.getActiveCell();
                var rowsindexes = grid1.getSelectedRows();

                if (rowsindexes.length != 0) {
                    var rows = [];
                    var clickedrow = cell.row;
                    var isselected = false;
                    for (var i = 0; i < rowsindexes.length; i++) {
                        if (rowsindexes[i] == clickedrow) {
                            isselected = true;
                        }
                        rows.push(grid1.getDataItem(rowsindexes[i]));
                    }
                    // if (!isselected) {
                    //     grid1.setSelectedRows(cell.row)
                    //     rows.push(grid1.getDataItem(rowsindexes[i]));
                    // }
                    if (rows.length > 0) {
                        var proxy = $("<span id='proxy_pan'></span>")
                            .css({
                                position: "absolute",
                                display: "hidden",
                                padding: "4px 10px",
                                "font-family": "Calibri",
                                "font-size": "14px",
                                background: "#e0e0e0",
                                border: "1px solid gray",
                                "z-index": 99999,
                                "-moz-border-radius": "8px",
                                "-moz-box-shadow": "2px 2px 6px silver"
                            })
                            .text("Drag to tree folder. " + rows.length + " rows selected")
                            .appendTo("body");

                        $(this).jqxDragDrop({
                            data: rows
                        })
                    }

                    $(event.currentTarget).addClass('jstree-draggable');
                }
            });

            gridCells.on('dragEnd', function(event, a) {
                var value = $(this).jqxDragDrop('data');
                var position = $.jqx.position(event.args);

                $("#proxy_pan").remove();

                var item = false;
                if (element.id) {
                    item = $('#jsreeFavorites').jstree(true).get_node(element.id);
                }

                if (!item) console.log("select non-item");
                else if (item.original.value.root == true) {
                    functionNotificationMessage({
                        text: "You can't copy series to folder 'All'",
                        type: "error"
                    });
                } else {
                    if (value != null) {
                        var arr = new Array();
                        for (var i = 0; i < value.length; i++) {
                            arr.push({
                                Datasource: value[i].Datasource,
                                Datacategory: value[i].Datacategory,
                                Symbol: value[i].Symbol
                            });
                        }

                        seriesToAdd = arr;
                        folderToAdd = item.original.value.id;

                        let msg = "Copy 1 series to folder '" + item.original.value.name + "'?";

                        if (seriesToAdd.length > 1)
                            msg = "Copy " + seriesToAdd.length + " series into folder '" + item.original.value.name + "'?"

                        dialogWindow(msg, 'warning', 'confirm', null, () => {
                                lastTreeItem = item;
                                if (sourceTreeItem) {
                                    $("#jsreeFavorites").jstree().deselect_all(true);
                                    $('#jsreeFavorites').jstree(true).select_node(prev_node);
                                }

                                setTimeout(() => {
                                    let data = userFavorites;
                                    let i = 0;
                                    item.original.value.items.map((f) => {
                                        data.map((e) => {
                                            if (e.Symbol == f.Symbol) i++;
                                        });
                                    });

                                    var text = (i > 0) ? item.original.value.name + " (" + i + ")" : item.original.value.name;
                                    $("#jsreeFavorites").jstree('rename_node', item, text);
                                }, 100);

                                addSeriesToFolder();
                            },
                            null, null, {
                                Ok: 'Yes',
                                Cancel: 'No'
                            });
                    }
                }
                isDragStart = false;
            });
        }
        // End drag&drop functionality

        /* =============== gridDatasetsOfDatasource ==================*/

        function datasourceGrid() {
            $('#mainSplitter-datasource').jqxSplitter({
                width: '100%',
                height: '100%',
                showSplitBar: false,
                panels: [{
                        size: "22%",
                        collapsible: true,
                        collapsed: true
                    },
                    {
                        size: '78%',
                        collapsible: false
                    }
                ]
            });

            DatasetsOfDatasourceSet = {
                pageSelectedIndex: 0,
                pageCounter: numOfPageURL,
                pageSize: getParameterByName('rows'),
                pagesCount: 0,
                Request: {
                    Datasource: '',
                    SessionToken: getSession(),
                    CaseSensitive: false,
                    Filter: filterOfURL,
                    SortOrder: "asc",
                    SortColumns: "CategoryName",
                    Rows: getParameterByName('rows'),
                    Page: numOfPageURL,
                    ShortRecord: false
                },

                source: {
                    datatype: "json",
                    // sort: function (column, ascending) {
                    //     switch (column) {
                    //         case "Symbol":
                    //         case "CategoryName":
                    //         case "Name":
                    //             if (ascending == null) {
                    //                 column = "CategoryName";
                    //                 ascending = true;
                    //             }
                    //             break;
                    //         default: return;
                    //     }

                    //     DatasetsOfDatasourceSet.Request.SortColumns = column;
                    //     let seq;
                    //     if (ascending === true) seq = 'asc';
                    //     else seq = 'desc';
                    //     DatasetsOfDatasourceSet.Request.SortOrder = seq;
                    //     call_api_ajax('GetDatasourceMetadata', 'get', DatasetsOfDatasourceSet.Request, true, (data) => {
                    //         DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;
                    //         $("#gridDatasetsOfDatasource").jqxGrid('updatebounddata', 'sort');
                    //         $("#gridDatasetsOfDatasource").jqxGrid('hideloadelement');

                    //     }, null,
                    //         () => {
                    //             $("#gridDatasetsOfDatasource").jqxGrid('hideloadelement');
                    //         });
                    // },
                    datafields: [{
                            name: 'Datasource',
                            type: 'string'
                        },
                        {
                            name: 'Datacategory',
                            type: 'string'
                        },
                        {
                            name: 'Symbol',
                            type: 'string'
                        },
                        {
                            name: 'Conversions',
                            type: 'array'
                        },
                        {
                            name: 'Favorite',
                            type: 'boolean'
                        },
                        {
                            name: 'Name',
                            type: 'string'
                        },
                        {
                            name: 'Frequency',
                            type: 'string'
                        },
                        {
                            name: 'Values',
                            type: 'int'
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
                            name: 'Currency',
                            type: 'string'
                        },
                        {
                            name: 'Unit',
                            type: 'string'
                        },
                        {
                            name: 'Conversions',
                            type: 'string'
                        },
                        {
                            name: 'Additional',
                            type: 'string'
                        },
                        {
                            name: 'Decimals',
                            type: 'int'
                        }
                    ],
                    localdata: []
                },
            };

            // call_api_ajax('GetDatasourceMetadata', 'get', DatasetsOfDatasourceSet.Request, true, (data) => {
            //     DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;

            //     console.log('DatasetsOfDatasourceSet = {', DatasetsOfDatasourceSet.source.localdata);

            // });

            if (DatasetsOfDatasourceSet.pageSize == '' || ![50, 100, 250, 500].includes(parseInt(DatasetsOfDatasourceSet.pageSize))) {
                DatasetsOfDatasourceSet.pageSize = 50;
                DatasetsOfDatasourceSet.Request.Rows = 50;
            }

            function isIEPreVer9() {
                var v = navigator.appVersion.match(/MSIE ([\d.]+)/i);
                return (v ? v[1] < 9 : false);
            }

            function CreateAddHeaderRow() {

                // Define buttons
                $(".HelpMessage2").jqxPopover({
                    offset: {
                        left: -50,
                        top: 0
                    },
                    arrowOffsetValue: 50,
                    title: "Search Filter Help",
                    showCloseButton: true,
                    selector: $("#helpIcon1")
                });

                // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                var fullWidthFlag = true;
                let img = (!fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                let footer_width = (!fullWidthFlag) ? '1230px' : '1230px';

                $("#main-footer").width(footer_width);
                $(".fullWidthPage").jqxButton({
                    imgSrc: "resources/css/icons/" + img + ".png",
                    imgPosition: "left",
                    width: 25,
                    height: 28,
                    imgWidth: 18,
                    imgHeight: 18,
                    textPosition: "right"
                });
                $(".fullWidthPage img, .fullWidthPage span").css("top", 5);
                $(".fixpage").toggleClass('fullscreen', !fullWidthFlag);

                $("#btnCopySeriesToFavorite").jqxButton({
                    imgSrc: "resources/css/icons/starAdd16.png",
                    width: 135,
                    height: 28,
                    imgWidth: 18,
                    imgHeight: 18,
                });
                $("#btnCopySeriesToFavorite img, #btnCopySeriesToFavorite span").css("top", 6);
                // $("#fullWidth3").jqxButton({imgSrc: "resources/css/icons/fullscreen.png", imgPosition: "left", width: 25, height: 24, textPosition: "right"});

                $("#btnAutosize").jqxButton({
                    imgSrc: "resources/css/icons/autosize.png",
                    imgPosition: "center",
                    width: 25,
                    height: 28,
                    imgWidth: 18,
                    imgHeight: 18,
                });
                $("#btnAutosize img, #btnAutosize span").css("top", 7);
                $("#btnAutosize").tooltip();

                $("#btnHideAdditInfo_datasource").jqxToggleButton({
                    imgSrc: "resources/css/icons/table_plus.png",
                    imgPosition: "center",
                    width: 25,
                    height: 28,
                    imgWidth: 18,
                    imgHeight: 18,
                });
                $("#btnHideAdditInfo_datasource img, #btnHideAdditInfo_datasource span").css("top", 6);

                $("#btnHideShowEmptyRecords").jqxToggleButton({
                    imgSrc: "resources/css/icons/ShowRows2_16.png",
                    imgPosition: "center",
                    width: 25,
                    height: 28,
                    imgWidth: 18,
                    imgHeight: 18,
                });
                $("#btnHideShowEmptyRecords img, #btnHideShowEmptyRecords span").css("top", 6);

                $("#searchSeriesBtn").jqxToggleButton({
                    imgSrc: "resources/css/icons/search.png",
                    imgPosition: "center",
                    width: 24,
                    height: 24,
                    imgWidth: 16,
                    imgHeight: 16
                });
                $("#searchSeriesBtn img, #searchSeriesBtn span").css("top", 6);
                $("#searchSeriesBtn").tooltip();

                $("#searchSeriesBox").jqxInput({
                    height: 24,
                    width: 250,
                    minLength: 1,
                    placeHolder: "Enter filter text"
                });

                // Events
                $('#searchSeriesBox').keypress(async function(e) {
                    if (e.which == 13) {
                        var filter = $("#searchSeriesBox").val();
                        if (DatasetsOfDatasourceSet.Request.Filter != filter) {
                            DatasetsOfDatasourceSet.Request.Filter = filter;
                            updateDatasetsOfDatasourceGrid();
                        }
                    }
                });

                $("#searchSeriesBtn").click(function(evt) {
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        var filter = $("#searchSeriesBox").val();
                        if (DatasetsOfDatasourceSet.Request.Filter != filter) {
                            DatasetsOfDatasourceSet.Request.Filter = filter;
                            updateDatasetsOfDatasourceGrid('sort');
                        }
                    }
                });

                // $("#searchSeriesBox").bind("input", function ( evt )
                // {
                //     if (window.event && event.type == "propertychange" && event.propertyName != "value") return;

                //     var filter = $("#searchSeriesBox").val();
                //     if( DatasetsOfDatasourceSet.Request.Filter != filter )
                //     {
                //         DatasetsOfDatasourceSet.Request.Filter = filter;
                //         updateDatasetsOfDatasourceGrid('sort');
                //     }
                // });

                $("#btnCopySeriesToFavorite").on('click', function() {
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        copySeriesToFavorite();
                    }
                });

                $("#btnAutosize").on('click', function() {
                    // resizeColumns('gridDatasetsOfDatasource');
                    var toggled = getCookie('btnHideAdditInfo2');
                    if (toggled == 'true') {
                        showAdditInfo(2);

                    } else {
                        hideAdditInfo(2);
                    }
                });

                $("#fullWidth3").on('click', function() {
                    // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                    // Clicking function
                    img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                    footer_width = (fullWidthFlag) ? '100%' : '1230px';

                    footer_posLeft = (fullWidthFlag) ? '0' : '';

                    $(".footerbar").css("max-width", footer_width);
                    $(".footerbar").css("left", footer_posLeft);

                    // $("#main-footer").width(footer_width);
                    $(".fullWidthPage").jqxButton({
                        imgSrc: "resources/css/icons/" + img + ".png",
                        imgPosition: "left",
                        width: 25,
                        height: 24,
                        textPosition: "right"
                    });
                    $(".fullWidthPage img, .fullWidthPage span").css("top", 5);
                    $(".fixpage").toggleClass('fullscreen', fullWidthFlag);
                    fullWidthFlag = !fullWidthFlag;

                    setCookie('p_fullWidth1', fullWidthFlag);
                    window.dispatchEvent(new Event('resize'));
                    resizeColumns('gridDatasetsOfDatasource');
                });

                $("#btnHideAdditInfo_datasource").tooltip();
                $("#btnHideAdditInfo_datasource").on('click', function(event) {
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        var current_grid = "gridDatasetsOfDatasource";
                        var id = event.currentTarget.id;

                        setCookie('btnHideAdditInfo2', $('#' + id).jqxToggleButton('toggled'));

                        var toggled = getCookie('btnHideAdditInfo2');
                        if (toggled == 'true') {
                            showAdditInfo(2);
                            document.getElementById(id).title = "Hide additional data columns";

                            DatasetsOfDatasourceSet.Request.ShortRecord = false;
                            updateDatasetsOfDatasourceGrid();
                        } else {
                            hideAdditInfo(2);
                            document.getElementById(id).title = "Show additional data columns";

                            DatasetsOfDatasourceSet.Request.ShortRecord = true;
                            updateDatasetsOfDatasourceGrid();
                        }
                    }
                });

                if (showAdditionalInformation2) {
                    $('#btnHideAdditInfo_datasource').jqxToggleButton('toggle');
                } else {}

                $("#btnHideShowEmptyRecords").on('click', function() {
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        var toggled = $("#btnHideShowEmptyRecords").jqxToggleButton('toggled');
                        hideEmpty = !toggled;

                        if (toggled) {
                            DatasetsOfDatasourceSet.Request.Page = 1;
                            DatasetsOfDatasourceSet.Request.IgnoreEmpty = false;
                            updateDatasetsOfDatasourceGrid();

                            document.getElementById("btnHideShowEmptyRecords").title = "Hide records with no values";
                            $("#btnHideShowEmptyRecords").tooltip();
                            $("#showHideEmptyRecords").text("Hide empty records");
                            $("#btnHideShowEmptyRecords").jqxToggleButton({
                                imgSrc: "resources/css/icons/HideRowsGn_16.png",
                                imgPosition: "center",
                                width: 25,
                                height: 24
                            });
                        } else {
                            DatasetsOfDatasourceSet.Request.Page = 1;
                            DatasetsOfDatasourceSet.Request.IgnoreEmpty = true;
                            updateDatasetsOfDatasourceGrid();

                            document.getElementById("btnHideShowEmptyRecords").title = "Show records with no values";
                            $("#btnHideShowEmptyRecords").tooltip();
                            $("#showHideEmptyRecords").text("Show empty records");
                            $("#btnHideShowEmptyRecords").jqxToggleButton({
                                imgSrc: "resources/css/icons/ShowRows2_16.png",
                                imgPosition: "center",
                                width: 25,
                                height: 24
                            });
                        }
                    }
                });

                document.getElementById("btnHideShowEmptyRecords").title = "Show records with no values";
                $("#btnHideShowEmptyRecords").tooltip();

                $("#fullWidth3").tooltip();
            }

            function CreateNavigationRow() {

                if (DatasetsOfDatasourceSet.Request.Page !== undefined) {
                    var element = $("<div id='pages-first-element'></div>");
                    var left_element = $("<div id='pages-last-element'></div>");
                    var pageNumbers = $('<div id="pageNumbers">');

                    var pageButtonToFirst = $("<div id='pageButtonToFirst'><div></div></div>");
                    pageButtonToFirst.find('div').addClass('jqx-icon-arrow-first');
                    pageButtonToFirst.jqxButton({
                        theme: theme
                    });

                    var pageButtonToLast = $("<div id='pageButtonToLast'><div></div></div>");
                    pageButtonToLast.find('div').addClass('jqx-icon-arrow-last');
                    pageButtonToLast.jqxButton({
                        theme: theme
                    });

                    var leftPageButton = $("<div id='leftPageButton'><div></div></div>");
                    leftPageButton.find('div').addClass('jqx-icon-arrow-left');
                    leftPageButton.jqxButton({
                        theme: theme
                    });

                    var rightPageButton = $("<div id='rightPageButton'><div></div></div>");
                    rightPageButton.find('div').addClass('jqx-icon-arrow-right');
                    rightPageButton.jqxButton({
                        theme: theme
                    });

                    pageButtonToFirst.appendTo(left_element);
                    leftPageButton.appendTo(left_element);
                    pageNumbers.appendTo(left_element);
                    rightPageButton.appendTo(left_element);
                    pageButtonToLast.appendTo(left_element);

                    pageButtonToFirst.click(function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            if (DatasetsOfDatasourceSet.Request.Page !== 1) {
                                DatasetsOfDatasourceSet.Request.Page = 1;
                                DatasetsOfDatasourceSet.pageCounter = DatasetsOfDatasourceSet.Request.Page;
                                updateDatasetsOfDatasourceGrid();
                            }
                        }
                    });

                    pageButtonToLast.click(function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            if (DatasetsOfDatasourceSet.Request.Page !== DatasetsOfDatasourceSet.pagesCount) {
                                DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pagesCount;
                                DatasetsOfDatasourceSet.pageCounter = DatasetsOfDatasourceSet.Request.Page;
                                updateDatasetsOfDatasourceGrid();
                            }
                        }
                    });

                    leftPageButton.click(function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            if (DatasetsOfDatasourceSet.Request.Page - 1 > 0) {
                                DatasetsOfDatasourceSet.Request.Page -= 1;
                                DatasetsOfDatasourceSet.pageCounter = DatasetsOfDatasourceSet.Request.Page;
                                updateDatasetsOfDatasourceGrid();
                            }
                        }
                    });

                    rightPageButton.click(function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            if (DatasetsOfDatasourceSet.Request.Page + 1 <= DatasetsOfDatasourceSet.pagesCount) {
                                DatasetsOfDatasourceSet.Request.Page += 1;
                                updateDatasetsOfDatasourceGrid();
                            }
                        }
                    });

                    // The numbers between the arows
                    var currently_page = "text-decoration: none;",
                        i = parseInt(DatasetsOfDatasourceSet.Request.Page / 7) * 7,
                        n = DatasetsOfDatasourceSet.pagesCount > i + 6 ? i + 6 : DatasetsOfDatasourceSet.pagesCount;

                    if (i > 6) {
                        pageNumbers.append('<a class="jqx-grid-pager-number jqx-grid-pager-number-light jqx-rc-all jqx-rc-all-light" id="pages-numbers-after" tabindex="-1" href="javascript:void(0);" data-page="' + (i - 1) + '">...</a>');
                    }

                    for (; i <= n; i++) {
                        if (i == 0) continue;
                        currently_page = (i == DatasetsOfDatasourceSet.Request.Page) ? "font-weight:bolder !important;" : "";
                        pageNumbers.append('<a class="jqx-grid-pager-number jqx-grid-pager-number-light jqx-rc-all jqx-rc-all-light" style="' + currently_page + '" tabindex="-1" href="javascript:void(0);" data-page="' + i + '">' + i + '</a>');
                    }

                    if (i <= DatasetsOfDatasourceSet.pagesCount) {
                        pageNumbers.append('<a class="jqx-grid-pager-number jqx-grid-pager-number-light jqx-rc-all jqx-rc-all-light" id="pages-numbers-before" tabindex="-1" href="javascript:void(0);" data-page="' + i + '">...</a>');
                    }

                    pageNumbers.find('a').click(function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            if (parseInt($(this).attr('data-page')) !== DatasetsOfDatasourceSet.Request.Page) {
                                DatasetsOfDatasourceSet.Request.Page = parseInt($(this).attr("data-page"));
                                DatasetsOfDatasourceSet.pageCounter = DatasetsOfDatasourceSet.Request.Page;
                                updateDatasetsOfDatasourceGrid();
                            }
                        }
                    });

                    var inputPage = $("<input type='text' id='dataPageNymber' value='" + DatasetsOfDatasourceSet.Request.Page + "'>");
                    inputPage.jqxInput({
                        width: 32,
                        height: 20
                    });
                    inputPage.on('change keyup', function(event) {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            if (event.type == "keyup" && event.keyCode !== 13) return;

                            var value = parseInt($(this).val());
                            if (!isNaN(value) && value > 0 && value <= DatasetsOfDatasourceSet.pagesCount) {
                                DatasetsOfDatasourceSet.Request.Page = parseInt(value);
                                DatasetsOfDatasourceSet.pageCounter = parseInt(value);
                                updateDatasetsOfDatasourceGrid()
                            }
                        }
                    });



                    var label = $("<div id='label1-pages'>Page <span id='inputPage'></span> of <span id='numOfAllPages'>" + (isNaN(DatasetsOfDatasourceSet.pagesCount) ? 0 : DatasetsOfDatasourceSet.pagesCount) + "</span></div>");
                    label.find('#inputPage').append(inputPage);
                    label.appendTo(element);

                    element.find('div[type="button"]').mousedown(function() {
                        var className = "";
                        if (this.id == "firstButton") className = "jqx-icon-arrow-first-selected-" + theme;
                        else if (this.id == "lastButton") className = "jqx-icon-arrow-last-selected-" + theme;
                        else if (this.id == "nextButton") className = "jqx-icon-arrow-right-selected-" + theme;
                        else if (this.id == "prevButton") className = "jqx-icon-arrow-left-selected-" + theme;

                        $(this).find("div").addClass(className);
                    });

                    element.find('div[type="button"]').mouseup(function() {
                        var className = "";
                        if (this.id == "firstButton") className = "jqx-icon-arrow-first-selected-" + theme;
                        else if (this.id == "lastButton") className = "jqx-icon-arrow-last-selected-" + theme;
                        else if (this.id == "nextButton") className = "jqx-icon-arrow-right-selected-" + theme;
                        else if (this.id == "prevButton") className = "jqx-icon-arrow-left-selected-" + theme;

                        $(this).find("div").removeClass(className);
                    });

                    DatasetsOfDatasourceSet.label = label;





                    var showRows = $('<div></div>'),
                        droplist = $('<div id="droplistPages">');
                    showRows.append('<div>Rows:</div>');
                    showRows.append(droplist);
                    element.append(showRows);

                    var dropListSource = [50, 100, 250, 500];
                    droplist.jqxDropDownList({
                        source: dropListSource,
                        width: 55,
                        height: 20,
                        theme: "light",
                        dropDownVerticalAlignment: 'top',
                        itemHeight: 24,
                        dropDownHeight: 104,
                        enableBrowserBoundsDetection: true
                    });

                    var index = dropListSource.indexOf(DatasetsOfDatasourceSet.Request.Rows);
                    if (index == -1) {
                        index = dropListSource.indexOf(parseInt(getParameterByName("rows")));
                        index = index == -1 ? 1 : index;
                    }
                    droplist.jqxDropDownList('selectIndex', index);

                    droplist.bind('select', function(event) {
                        var args = event.args;
                        if (args) {
                            var size = parseInt(droplist.jqxDropDownList('getItem', args.index).label);
                            DatasetsOfDatasourceSet.Request.Page = 1;
                            DatasetsOfDatasourceSet.pageCounter = 1;
                            DatasetsOfDatasourceSet.Request.Rows = size;
                            DatasetsOfDatasourceSet.pageSize = size;
                            updateDatasetsOfDatasourceGrid()
                        }
                    });




                    var new_element = $('<div>').append(left_element);
                    new_element.append(element);
                    $('#pager2').html(new_element);
                }

            }

            var dsColumns = [{
                    text: '#',
                    sortable: false,
                    filterable: false,
                    editable: false,
                    cellsalign: 'right',
                    align: 'right',
                    groupable: false,
                    draggable: false,
                    resizable: true,
                    datafield: 'id',
                    columntype: 'number',
                    minwidth: 14,
                    width: 10,
                    cellsrenderer: function(row, column, value) {
                        return "<div id='tableID' style='float:right;margin-right:5px'>" + (value + 1 + (DatasetsOfDatasourceSet.pageCounter - 1) * DatasetsOfDatasourceSet.pageSize) + "</div>";
                    }
                },
                {
                    text: '<img height="18" width="18" src="resources/css/icons/StarGrey.ico">',
                    sortable: false,
                    width: 30,
                    datafield: 'Favorite',
                    cellsalign: 'center',
                    filterable: false,
                    align: 'center',
                    cellsrenderer: function(row, datafield, value) {
                        if (value) return '<div><img id="startIcon" ' +
                            ' height="17" width="17" ' +
                            'src="resources/css/icons/star_icon.png"></div>';
                        return '';
                    }
                },
                {
                    text: 'Symbol',
                    groupable: false,
                    datafield: 'Symbol',
                    cellsalign: 'center',
                    align: 'center',
                    minwidth: 10,
                    width: 100,
                    cellsrenderer: symbol_renderer
                },
                {
                    text: 'Name',
                    groupable: false,
                    datafield: 'Name',
                    cellsalign: 'left',
                    align: 'left',
                    minwidth: 100,
                    width: 100
                },
                {
                    text: 'Frequency',
                    groupable: false,
                    datafield: 'Frequency',
                    cellsalign: 'left',
                    align: 'left',
                    minwidth: 10,
                    width: 80
                },
                {
                    text: 'From',
                    groupable: false,
                    datafield: 'StartDate',
                    filtertype: 'range',
                    cellsformat: 'yyyy-MM-dd',
                    cellsalign: 'left',
                    align: 'left',
                    minwidth: 10,
                    width: 80
                },
                {
                    text: 'To',
                    groupable: false,
                    datafield: 'EndDate',
                    filtertype: 'range',
                    cellsformat: 'yyyy-MM-dd',
                    cellsalign: 'left',
                    align: 'left',
                    width: 80
                },
                {
                    text: '# Prices',
                    groupable: false,
                    datafield: 'Values',
                    filtertype: 'number',
                    cellsalign: 'right',
                    align: 'center',
                    minwidth: 10,
                    width: 80
                },
                {
                    text: 'Currency',
                    datafield: 'Currency',
                    sortable: false,
                    cellsalign: 'left',
                    align: 'center',
                    minwidth: 10,
                    width: 75,
                    hidden: true
                },
                {
                    text: 'Decimals',
                    datafield: 'Decimals',
                    sortable: false,
                    cellsalign: 'right',
                    align: 'center',
                    minwidth: 10,
                    width: 65,
                    hidden: true
                },
                {
                    text: 'Unit',
                    datafield: 'Unit',
                    sortable: false,
                    cellsalign: 'left',
                    align: 'center',
                    minwidth: 10,
                    width: 50,
                    hidden: true
                },
                {
                    text: 'Conversions',
                    datafield: 'Conversions',
                    sortable: false,
                    cellsalign: 'left',
                    align: 'center',
                    minwidth: 10,
                    width: 50,
                    hidden: true
                },
                {
                    text: 'Additional',
                    datafield: 'Additional',
                    sortable: false,
                    cellsalign: 'left',
                    align: 'center',
                    minwidth: 10,
                    width: 150,
                    hidden: true
                }
            ];

            $(".close, .popup-overlay").on("click", function() {
                $(".popup-overlay, .popup-content").removeClass("active");
            });

            var categoryDSColumns = [{
                    id: "sel",
                    name: "#",
                    field: "num",
                    behavior: "select",
                    cssClass: "cell-title cell-right",
                    minWidth: 40,
                    width: 40,
                    cannotTriggerInsert: true,
                    resizable: false,
                    excludeFromColumnPicker: true
                },
                {
                    id: "favorite",
                    name: "<img height='18' width='18' src='resources/css/icons/StarGrey.ico'>",
                    field: "Favorite",
                    filterable: false,
                    cssClass: "cell-title",
                    minWidth: 30,
                    width: 30,
                    resizable: false,
                    formatter: imagerenderer
                },
                {
                    id: "symbol",
                    name: "Symbol",
                    field: "Symbol",
                    width: 100,
                    minWidth: 100,
                    cssClass: "cell-title",
                    sortable: true,
                    formatter: symbol_renderer
                },
                {
                    id: "name",
                    name: "Name",
                    field: "Name",
                    sortable: true,
                    minWidth: 400,
                    width: 400,
                    cssClass: "cell-title"
                },
                {
                    id: "frequency",
                    defaultSortAsc: false,
                    name: "Frequency",
                    field: "Frequency",
                    minWidth: 80,
                    width: 80,
                    formatter: Slick.Formatters.PercentCompleteBar,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "from",
                    name: "From",
                    field: "StartDate",
                    minWidth: 80,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "to",
                    name: "To",
                    field: "EndDate",
                    minWidth: 80,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "values",
                    name: "# Prices",
                    field: "Values",
                    minWidth: 80,
                    width: 80,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "currency",
                    name: "Currency",
                    field: "Currency",
                    minWidth: 60,
                    width: 60,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "decimals",
                    name: "Decimals",
                    field: "Decimals",
                    minWidth: 60,
                    width: 60,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "unit",
                    name: "Unit",
                    field: "Unit",
                    minWidth: 60,
                    width: 60,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "conversions",
                    name: "Conversions",
                    field: "Conversions",
                    minWidth: 100,
                    width: 100,
                    sortable: true,
                    cssClass: "cell-title"
                },
                {
                    id: "additional",
                    name: "Additional",
                    field: "Additional",
                    minWidth: 120,
                    width: 120,
                    sortable: true,
                    cssClass: "cell-title",
                    formatter: additional_renderer
                },
                // {id: "effort-driven", name: "Effort Driven", width: 80, minWidth: 20, maxWidth: 80, cssClass: "cell-effort-driven", field: "effortDriven", formatter: Slick.Formatters.Checkbox, editor: Slick.Editors.Checkbox, cannotTriggerInsert: true, sortable: true}
            ];

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
                grid2.setTopPanelVisibility(!grid2.getOptions().showTopPanel);
            }

            $(function() {
                var isCategory = false;

                // prepare the data
                for (var i = 0; i < DatasetsOfDatasourceSet.source.localdata.length; i++) {
                    DatasetsOfDatasourceSet.source.localdata[i].id = "id_" + i;
                    DatasetsOfDatasourceSet.source.localdata[i].num = (i + 1);

                    if (DatasetsOfDatasourceSet.source.localdata[i].Datacategory != undefined) isCategory = true;
                }

                if (isCategory)
                    categoryDSColumns.splice(1, 0, {
                        id: 'cat',
                        name: 'Cat.',
                        field: 'Datacategory',
                        minwidth: 10,
                        width: 40,
                        cssClass: "cell-title"
                    }, )

                dataView2 = new Slick.Data.DataView({
                    inlineFilters: true
                });
                grid2 = new Slick.Grid("#gridDatasetsOfDatasource", dataView2, categoryDSColumns, options);
                grid2.setSelectionModel(new Slick.RowSelectionModel());

                // var pager = new Slick.Controls.Pager(dataView2, grid2, $("#pager2"));
                // var columnpicker = new Slick.Controls.ColumnPicker(categoryDSColumns, grid2, options);

                // move the filter panel defined in a hidden div into grid top panel
                $("#inlineFilterPanel")
                    .appendTo(grid2.getTopPanel())
                    .show();

                grid2.onCellChange.subscribe(function(e, args) {
                    dataView2.updateItem(args.item.id, args.item);
                });

                grid2.onClick.subscribe(function(e, args) {
                    if (args.grid.getColumns()[2].name == "Cat.") {
                        if (args.cell == 3) {
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                item = dataView2.getItem(args.row);
                                openSeriesInNewTab(item.Datasource, item.Symbol, item.Datacategory);
                            }
                        }
                    } else {
                        if (args.cell == 2) {
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                item = dataView2.getItem(args.row);
                                openSeriesInNewTab(item.Datasource, item.Symbol, item.Datacategory);
                            }
                        }
                    }

                    if (args.cell == 12) {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            item = dataView2.getItem(args.row);
                            var txt = JSON.stringify(item.Additional);
                            // $(".popup-content").html( txt )
                            if (item.Additional != undefined) {
                                setCookie('additionalJSON' + args.row, txt);
                                JqxPopup(args.row, item.Symbol);
                            }
                        }
                    }
                });

                grid2.onContextMenu.subscribe(function(e) {
                    e.preventDefault();
                    var cell = grid2.getCellFromEvent(e);
                    var indexes = grid2.getSelectedRows()
                    indexes.push(cell.row);
                    grid2.setSelectedRows(indexes)

                    $("#databaseJqxgridMenu")
                        .data("row", cell.row)
                        .css("top", e.pageY)
                        .css("left", e.pageX)
                        .show();

                    $("body").one("click", function() {
                        $("#databaseJqxgridMenu").hide();
                    });
                });

                grid2.onAddNewRow.subscribe(function(e, args) {
                    var item = {
                        "num": data.length,
                        "id": "new_" + (Math.round(Math.random() * 10000)),
                        "title": "New task",
                        "duration": "1 day",
                        "percentComplete": 0,
                        "start": "01/01/2009",
                        "finish": "01/01/2009"
                    };
                    $.extend(item, args.item);
                    dataView2.addItem(item);
                });

                grid2.onKeyDown.subscribe(function(e) {
                    // select all rows on ctrl-a
                    if (e.which != 65 || !e.ctrlKey) {
                        return false;
                    }

                    var rows = [];
                    for (var i = 0; i < dataView2.getLength(); i++) {
                        rows.push(i);
                    }

                    grid2.setSelectedRows(rows);
                    e.preventDefault();
                });

                grid2.onSort.subscribe(function(e, args) {
                    sortdir = args.sortCols[0].sortAsc ? 1 : -1;
                    sortcol = args.sortCols[0].sortCol.field;

                    if (isIEPreVer9()) {
                        // using temporary Object.prototype.toString override
                        // more limited and does lexicographic sort only by default, but can be much faster

                        alert(args.sortCols[0].sortAsc);
                        var percentCompleteValueFn = function() {
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
                        dataView2.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortCols[0].sortAsc);
                    } else {
                        // using native sort with comparer
                        // preferred method but can be very slow in IE with huge datasets
                        dataView2.sort(comparer, args.sortCols[0].sortAsc);
                    }
                });

                // wire up model events to drive the grid
                // !! both dataView.onRowCountChanged and dataView.onRowsChanged MUST be wired to correctly update the grid
                // see Issue#91
                dataView2.onRowCountChanged.subscribe(function(e, args) {
                    grid2.updateRowCount();
                    grid2.render();
                });

                dataView2.onRowsChanged.subscribe(function(e, args) {
                    grid2.invalidateRows(args.rows);
                    grid2.render();
                });

                dataView2.onPagingInfoChanged.subscribe(function(e, pagingInfo) {
                    grid2.updatePagingStatusFromView(pagingInfo);

                    // show the pagingInfo but remove the dataView from the object, just for the Cypress E2E test
                    delete pagingInfo.dataView;
                });

                dataView2.onBeforePagingInfoChanged.subscribe(function(e, previousPagingInfo) {
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
                    dataView2.setFilterArgs({
                        percentCompleteThreshold: percentCompleteThreshold,
                        searchString: searchString
                    });
                    dataView2.refresh();
                }

                $("#btnSelectRows").click(function() {
                    if (!Slick.GlobalEditorLock.commitCurrentEdit()) {
                        return;
                    }

                    var rows = [];
                    for (var i = 0; i < 10 && i < dataView2.getLength(); i++) {
                        rows.push(i);
                    }

                    grid2.setSelectedRows(rows);
                });

                grid2.init();

                CreateAddHeaderRow();

                dataView2.beginUpdate();
                dataView2.setItems(DatasetsOfDatasourceSet.source.localdata);
                dataView2.setFilterArgs({
                    percentCompleteThreshold: percentCompleteThreshold,
                    searchString: searchString
                });
                dataView2.setFilter(myFilter);
                dataView2.endUpdate();

                // if you don't want the items that are not visible (due to being filtered out
                // or being on a different page) to stay selected, pass 'false' to the second arg
                dataView2.syncGridSelection(grid2, true);

                $("#gridContainer").resizable();

                // if (getCookie('btnHideAdditInfo') != undefined && getCookie('btnHideAdditInfo') == "true") {
                //     showAdditInfo(2);
                //     showAdditionalInformation2 = true;
                // }
                // else {
                //     hideAdditInfo(2);
                //     showAdditionalInformation2 = false;
                // }
                // updateDatasetsOfDatasourceGrid()

                hideAdditInfo(2);
                showAdditionalInformation2 = false;
                // resizeColumns('gridDatasetsOfDatasource');
                // $('#jqxLoader').jqxLoader('close');

                CreateNavigationRow();
            })

            async function loadDropdown() {
                var source = {
                    datatype: "json",
                    datafields: [{
                            name: 'Name'
                        },
                        {
                            name: 'Datasource'
                        },
                        {
                            name: 'Description'
                        },
                        {
                            name: 'DatasourceInfo'
                        },
                        {
                            name: 'group'
                        },
                    ],
                    localdata: await userDatasources,
                    async: false
                };
                var dataAdapter = new $.jqx.dataAdapter(source);

                $("#databaseDropdown").jqxDropDownList({
                    source: dataAdapter,
                    displayMember: "Name",
                    valueMember: "DatasourceInfo",
                    width: 350,
                    height: 28,
                    autoDropDownHeight: true,
                    renderer: function(index, label, DatasourceInfo) {
                        if (!DatasourceInfo)
                            return label;

                        if (DatasourceInfo.IsCategoryDS === false)
                            imgurl = 'resources/css/icons/starDis_16.png';
                        else
                            imgurl = 'resources/css/icons/star_icon.png';

                        //                        return '<img height="17" width="17" src="'+ DatasourceInfo.Icon +'"> <img height="17" width="17" src="' + imgurl + '"> <span id="databaseDropdown-lable">' + label + '</span>';
                        return '<img height="17" width="17" src="' + DatasourceInfo.Logo + '"> <img height="17" width="17" src="' + imgurl + '"> <span id="databaseDropdown-lable">' + label + '</span>';
                    },
                    selectionRenderer: function(element, index, label, DatasourceInfo) {
                        if (!DatasourceInfo)
                            return label;

                        if (DatasourceInfo.Premium === false)
                            imgurl = 'resources/css/icons/starDis_16.png';
                        else
                            imgurl = 'resources/css/icons/star_icon.png';

                        //                        return '<img height="17" width="17" src="'+ DatasourceInfo.Icon +'" class="seletedItemStyle"> <img height="17" width="17" src="' + imgurl + '" id="selectedItemDropMenu" class="seletedItemStyle"> <span id="datasource-label">' + label + '</span>';
                        return '<img height="17" width="17" src="' + DatasourceInfo.Logo + '" class="seletedItemStyle"> <img height="17" width="17" src="' + imgurl + '" id="selectedItemDropMenu" class="seletedItemStyle"> <span id="datasource-label">' + label + '</span>';
                    }
                });

                $("#databaseDropdown").on('select', async function(event) {
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        if (event.args) {
                            var item = event.args.item;
                            if (item) {

                                var loadDataSource = function() {
                                    var DatasourceInfo = item.originalItem.DatasourceInfo;
                                    DatasetsOfDatasourceSet.Request.Datasource = DatasourceInfo.Datasource;
                                    dataToSend.tab = "mydatasources";
                                    dataToSend.datasource = DatasourceInfo.Datasource;

                                    if (DatasourceInfo.IsCategoryDS && $('#mainSplitter-datasource').jqxSplitter('panels')[0].collapsed) {
                                        $('#mainSplitter-datasource').jqxSplitter({
                                            showSplitBar: true
                                        });
                                        $('#mainSplitter-datasource').jqxSplitter('expand');
                                        $(".tree-loading").show();
                                        $('#jqxTabs-datasource').jqxTabs({
                                            width: '100%'
                                        });
                                        $("#jqxTabs-datasource").css("opacity", 1);
                                    } else if (!DatasourceInfo.IsCategoryDS) {
                                        // console.log("Is collapsed")
                                        $('#mainSplitter-datasource').jqxSplitter({
                                            showSplitBar: false
                                        });
                                        $('#mainSplitter-datasource').jqxSplitter('collapse');

                                    }

                                    if (!DatasourceInfo.IsCategoryDS) {
                                        delete DatasetsOfDatasourceSet.Request.CategoryFilter;
                                        categoryFilterURL = "";
                                    }

                                    if (categoryFilterURL == "") {
                                        delete DatasetsOfDatasourceSet.Request.CategoryFilter;
                                        delete dataToSend.category;
                                    } else {
                                        dataToSend.category = categoryFilterURL
                                        DatasetsOfDatasourceSet.Request.CategoryFilter = categoryFilterURL;
                                    }

                                    DatasetsOfDatasourceSet.pageCounter = numOfPageURL;
                                    DatasetsOfDatasourceSet.Request.Datasource = item.originalItem.Datasource;
                                    DatasetsOfDatasourceSet.Request.Rows = DatasetsOfDatasourceSet.pageSize;
                                    DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                                    DatasetsOfDatasourceSet.Request.SortColumns = DatasourceInfo.IsCategoryDS ? "CategoryName" : "Symbol";

                                    var num = DatasetsOfDatasourceSet.SeriesCount / DatasetsOfDatasourceSet.pageSize;
                                    num = (parseInt(num) < num) ? parseInt(num) + 1 : parseInt(num);

                                    DatasetsOfDatasourceSet.Request.Page = (DatasetsOfDatasourceSet.Request.Page > num || DatasetsOfDatasourceSet.Request.Page <= 0) ? 1 : DatasetsOfDatasourceSet.Request.Page;
                                    DatasetsOfDatasourceSet.pageCounter = DatasetsOfDatasourceSet.Request.Page;

                                    delete DatasetsOfDatasourceSet.Request.category;

                                    function getDatasource(datasource, sessionToken) {
                                        return fetch(`https://api.idatamedia.org/GetDatasource?SessionToken=${sessionToken}&Datasource=${datasource}&ReturnAccess=true`)
                                    }
                                    DatasetsOfDatasourceSet.Request.ReturnAccess = true;

                                    call_api_ajax('GetDatasets', 'get', DatasetsOfDatasourceSet.Request, true,
                                        (data) => {
                                            for (var i in data.Result.Datasets) {
                                                if (data.Result.Datasets[i].Additional != undefined)
                                                    data.Result.Datasets[i].Conversions = data.Result.Datasets[i].Additional.Conversions[0].ConvertTo + " " + data.Result.Datasets[i].Additional.Conversions[0].ConvertOperator + data.Result.Datasets[i].Additional.Conversions[0].ConvertValue
                                            }
                                            var r = data.Result;

                                            DatasetsOfDatasourceSet.source.localdata = r.Datasets;

                                            DatasetsOfDatasourceSet.SeriesCount = r.Metadata.Datasets;
                                            DatasetsOfDatasourceSet.pagesCount = r.Metadata.PagesCount;
                                            DatasetsOfDatasourceSet.Request.Page = r.Metadata.Page;
                                            DatasetsOfDatasourceSet.pageCounter = r.Metadata.Page;
                                            DatasetsOfDatasourceSet.Request.Rows = r.Metadata.Rows;
                                            let infor = DatasetsOfDatasourceSet.Request

                                            getDatasource(infor.Datasource, getSession())
                                                .then(res => res.json())
                                                .then(result => {
                                                    var isCategory = false;
                                                    // prepare the data
                                                    for (var i = 0; i < DatasetsOfDatasourceSet.source.localdata.length; i++) {
                                                        DatasetsOfDatasourceSet.source.localdata[i].id = "id_" + i;
                                                        DatasetsOfDatasourceSet.source.localdata[i].num = (i + 1);
                                                        // DatasetsOfDatasourceSet.source.localdata[i].Favorite = "false";
                                                        if (DatasetsOfDatasourceSet.source.localdata[i].Datacategory != undefined)
                                                            var isCategory = true;
                                                    }

                                                    var columns = [{
                                                            id: "sel",
                                                            name: "#",
                                                            field: "num",
                                                            behavior: "select",
                                                            cssClass: "cell-title cell-right",
                                                            minWidth: 40,
                                                            width: 40,
                                                            cannotTriggerInsert: true,
                                                            resizable: false,
                                                            excludeFromColumnPicker: true,
                                                            headerCssClass: 'right',
                                                            sortable: true
                                                        },
                                                        {
                                                            id: "favorite",
                                                            name: "<img height='18' width='18' src='resources/css/icons/StarGrey.ico'>",
                                                            field: "Favorite",
                                                            filterable: false,
                                                            cssClass: "cell-title",
                                                            minWidth: 30,
                                                            width: 30,
                                                            resizable: false,
                                                            formatter: imagerenderer
                                                        },
                                                        {
                                                            id: "symbol",
                                                            name: "Symbol",
                                                            field: "Symbol",
                                                            width: 100,
                                                            minWidth: 100,
                                                            cssClass: "cell-title",
                                                            sortable: true,
                                                            formatter: symbol_renderer
                                                        },
                                                        {
                                                            id: "description",
                                                            name: "Description",
                                                            field: "Name",
                                                            sortable: true,
                                                            minWidth: 20,
                                                            width: 400,
                                                            cssClass: "cell-title"
                                                        },
                                                        {
                                                            id: "frequency",
                                                            defaultSortAsc: false,
                                                            name: "Frequency",
                                                            field: "Frequency",
                                                            minWidth: 80,
                                                            width: 80,
                                                            sortable: true,
                                                            cssClass: "cell-title"
                                                        },
                                                        {
                                                            id: "from",
                                                            name: "From",
                                                            field: "StartDate",
                                                            minWidth: 80,
                                                            width: 80,
                                                            sortable: true,
                                                            cssClass: "cell-title"
                                                        },
                                                        {
                                                            id: "to",
                                                            name: "To",
                                                            field: "EndDate",
                                                            minWidth: 80,
                                                            width: 80,
                                                            sortable: true,
                                                            cssClass: "cell-title"
                                                        },
                                                        {
                                                            id: "values",
                                                            name: "# Prices",
                                                            field: "Values",
                                                            minWidth: 80,
                                                            width: 80,
                                                            sortable: true,
                                                            cssClass: "cell-title cell-right"
                                                        },
                                                        {
                                                            id: "currency",
                                                            name: "Currency",
                                                            field: "Currency",
                                                            minWidth: 60,
                                                            width: 60,
                                                            sortable: true,
                                                            cssClass: "cell-title"
                                                        },
                                                        {
                                                            id: "decimals",
                                                            name: "Decimals",
                                                            field: "Decimals",
                                                            minWidth: 60,
                                                            width: 60,
                                                            sortable: true,
                                                            cssClass: "cell-title"
                                                        },
                                                        {
                                                            id: "unit",
                                                            name: "Unit",
                                                            field: "Unit",
                                                            minWidth: 60,
                                                            width: 60,
                                                            sortable: true,
                                                            cssClass: "cell-title"
                                                        },
                                                        {
                                                            id: "conversions",
                                                            name: "Conversions",
                                                            field: "Conversions",
                                                            minWidth: 100,
                                                            width: 100,
                                                            sortable: true,
                                                            cssClass: "cell-title"
                                                        },
                                                        {
                                                            id: "additional",
                                                            name: "Additional",
                                                            field: "Additional",
                                                            minWidth: 120,
                                                            width: 120,
                                                            sortable: true,
                                                            cssClass: "cell-title",
                                                            formatter: additional_renderer
                                                        },
                                                    ];

                                                    if (isCategory) {
                                                        columns.splice(1, 0, {
                                                            id: 'cat',
                                                            name: 'Cat.',
                                                            field: 'Datacategory',
                                                            minwidth: 10,
                                                            width: 40,
                                                            cssClass: "cell-title"
                                                        }, )
                                                    }

                                                    if (result.Result.IsCategoryDS === true) {
                                                        DatasourceInfo.UserCategoryList = result.Result.DetailsDS.UserCategoryList;
                                                        DatasetsOfDatasourceSet.source.UserCategoryList = result.Result.DetailsDS.UserCategoryList
                                                        DatasourceInfo.CategoryTree = result.Result.DetailsDS.CategoryTree
                                                        DatasourceInfo.CategoryList = result.Result.DetailsDS.CategoryList
                                                        LIST = result.Result.DetailsDS.UserCategoryList;
                                                        loadDatabaseDataToGrid(DatasourceInfo);

                                                        grid2.setColumns(columns);
                                                        grid2.setData(DatasetsOfDatasourceSet.source.localdata);

                                                        // initialize the model after all the events have been hooked up
                                                        dataView2.beginUpdate();
                                                        dataView2.setItems(DatasetsOfDatasourceSet.source.localdata);
                                                        dataView2.endUpdate();
                                                        // // if you don't want the items that are not visible (due to being filtered out
                                                        // // or being on a different page) to stay selected, pass 'false' to the second arg
                                                        // dataView2.syncGridSelection(grid2, true);

                                                        // dataView2.setPagingOptions({pageSize: r.Metadata.Rows});

                                                        dataView2.syncGridSelection(grid2, true);
                                                        grid2.invalidate();
                                                        grid2.render();
                                                        dataView2.setPagingOptions({
                                                            pageSize: r.Metadata.Rows
                                                        });
                                                    } else {
                                                        loadDatabaseDataToGrid(DatasourceInfo);

                                                        grid2.setColumns(columns);
                                                        grid2.setData(DatasetsOfDatasourceSet.source.localdata);
                                                        dataView2.beginUpdate();
                                                        dataView2.setItems(DatasetsOfDatasourceSet.source.localdata);
                                                        dataView2.endUpdate();

                                                        // if you don't want the items that are not visible (due to being filtered out
                                                        // or being on a different page) to stay selected, pass 'false' to the second arg
                                                        dataView2.syncGridSelection(grid2, true);

                                                        grid2.invalidate();
                                                        grid2.render();
                                                        dataView2.setPagingOptions({
                                                            pageSize: r.Metadata.Rows
                                                        });
                                                        // $("#gridDatasetsOfDatasource").jqxGrid('hidecolumn', 'Datacategory');
                                                    }

                                                    var toggled = getCookie('btnHideAdditInfo2');

                                                    // var tab = getParameterByName('tab');
                                                    // if(tab == "favorites"){
                                                    if (toggled == 'true') {
                                                        showAdditInfo(2);
                                                    } else {
                                                        hideAdditInfo(2);
                                                    }
                                                    // }

                                                    // var sel_row = [0=>1];
                                                    grid2.setSelectedRows([0]);

                                                    // resizeColumns('gridDatasetsOfDatasource');
                                                    CreateNavigationRow()
                                                })
                                                .catch(e => console.warn("Error in GetDatasource Call: ", e))

                                            if (![50, 100, 250, 500].includes(r.Metadata.Rows)) {
                                                DatasetsOfDatasourceSet.Request.Rows = 50;
                                            }
                                            DatasetsOfDatasourceSet.pageSize = DatasetsOfDatasourceSet.Request.Rows;
                                            dataToSend.filter = DatasetsOfDatasourceSet.Request.Filter;
                                            dataToSend.page = DatasetsOfDatasourceSet.pageCounter;
                                            dataToSend.filter = dataToSend.filter == undefined ? "" : dataToSend.filter;
                                            dataToSend.rows = DatasetsOfDatasourceSet.Request.Rows;

                                            updateURL(dataToSend);
                                            $("#searchSeriesBox").val(dataToSend.filter);
                                            datasourceGrid_active = true;
                                        }, null, () => {
                                            // $('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');
                                            droplistDatasource_loaded = true;
                                        }, false);
                                }

                                if (DatasetsOfDatasourceSet.Request.Filter == '' || DatasetsOfDatasourceSet.Request.Filter == undefined) {
                                    delete DatasetsOfDatasourceSet.Request.Filter;
                                    loadDataSource();
                                } else {
                                    if (droplistDatasource_loaded) {
                                        dialogWindow("You are about to change datasource to '" + item.originalItem.Datasource + "'.<br>Do you want to clear filter for the datasource?",
                                            'warning', 'confirm', null,
                                            () => {
                                                DatasetsOfDatasourceSet.Request.Filter = "";
                                                dataToSend.filter = "";
                                                $("#searchSeriesBox").val('');
                                                loadDataSource();

                                            }, () => {
                                                loadDataSource();
                                            });
                                    } else {
                                        loadDataSource();
                                    }
                                }
                            }
                        }
                    }
                });

                var current_datasource = "ECBFX";

                if (getParameterByName("datasource") !== "") {
                    current_datasource = getParameterByName("datasource");
                }

                var items = $("#databaseDropdown").jqxDropDownList('getItems'),
                    index = 0;

                for (i in items) {
                    if (items[i].value.Datasource == current_datasource) {
                        index = parseInt(i);
                        break;
                    }
                }

                $("#databaseDropdown").jqxDropDownList('selectIndex', index);
                dataToSend.datasource = current_datasource;
            }

            loadDropdown();

            function refreshPagination() {
                var num = DatasetsOfDatasourceSet.SeriesCount / DatasetsOfDatasourceSet.pageSize;
                num = (parseInt(num) < num) ? parseInt(num) + 1 : parseInt(num);
                num = !isNaN(num) ? num : 1;
                // console.log(DatasetsOfDatasourceSet);
                // DatasetsOfDatasourceSet.label.find('input').val( DatasetsOfDatasourceSet.pageCounter ).parent().find('span').text( num );
            }

            DatasetsOfDatasourceSet.dataAdapter = new $.jqx.dataAdapter(DatasetsOfDatasourceSet.source);

            var arrangeData = function(array, type, datasourceInfo = []) {
                if (type === "Tree") {
                    for (let i in array) {
                        if (array[i].Group !== undefined) {
                            let name = array[i].Group,
                                category = array[i].Filter;
                            delete array[i].Group;
                            delete array[i].Filter;
                            array[i].text = name;
                            let flag = false
                            datasourceInfo.UserCategoryList.map((l) => {
                                for (let m of category.split(",")) {
                                    if (m === l.Name) {
                                        flag = true
                                    }
                                }
                            })

                            if (flag) {
                                array[i].icon = 'resources/css/icons/folder_yellow.png';
                            } else {
                                array[i].icon = 'resources/css/icons/folder_grey.png';
                            }

                            array[i].expanded = true;
                            array[i].value = category;
                            let items = array[i].Items;
                            delete array[i].Items;
                            array[i].children = arrangeData(items, "Tree", datasourceInfo);
                        } else {
                            if (array[i].access) {
                                array[i].icon = 'resources/css/icons/Tree2.png';
                                let name = array[i].Name;
                                delete array[i].Name;
                                if (array[i].Description !== undefined) {
                                    array[i].text = name + ' [' + array[i].Description + ']';
                                    array[i].value = array[i].Description;
                                    delete array[i].Description;
                                } else {
                                    array[i].text = name + ' [' + array[i].Category + ']';
                                    array[i].value = array[i].Category;
                                    delete array[i].Category;
                                }
                            } else {
                                array[i].icon = 'resources/css/icons/Abort1.png';
                                let name = array[i].Name;
                                delete array[i].Name;
                                if (array[i].Description !== undefined) {
                                    array[i].text = name + ' [' + array[i].Description + ']';
                                    array[i].value = array[i].Description;
                                    delete array[i].Description;
                                } else {
                                    array[i].text = name + ' [' + array[i].Category + ']';
                                    array[i].value = array[i].Category;
                                    delete array[i].Category;
                                }
                            }
                        }
                    }
                } else if (type === "List") {
                    for (let i in array) {
                        if (array[i].access) {
                            array[i].icon = 'resources/css/icons/Tree2.png';
                            let name = array[i].Name;
                            delete array[i].Name;
                            if (array[i].Description !== undefined) {
                                array[i].text = name + ' [' + array[i].Description + ']';
                                array[i].value = array[i].Description;
                                delete array[i].Description;
                            } else {
                                array[i].text = name + ' [' + array[i].Category + ']';
                                array[i].value = array[i].Category;
                                delete array[i].Category;
                            }
                        } else {
                            array[i].icon = 'resources/css/icons/Abort1.png';
                            let name = array[i].Name;
                            delete array[i].Name;
                            if (array[i].Description !== undefined) {
                                array[i].text = name + ' [' + array[i].Description + ']';
                                array[i].value = array[i].Description;
                                delete array[i].Description;
                            } else {
                                array[i].text = name + ' [' + array[i].Category + ']';
                                array[i].value = array[i].Category;
                                delete array[i].Category;
                            }
                        }

                    }
                } else if (type === "UserList") {
                    for (let i in array) {
                        array[i].icon = 'resources/css/icons/Tree2.png';
                        let name = array[i].Name;
                        delete array[i].Name;
                        if (array[i].Description !== undefined) {
                            array[i].text = name + ' [' + array[i].Description + ']';
                            array[i].value = array[i].Description;
                            delete array[i].Description;
                        } else {
                            array[i].text = name + ' [' + array[i].Category + ']';
                            array[i].value = array[i].Category;
                            delete array[i].Category;
                        }
                    }
                }

                return array;
            };

            var getSpecificData = function(userRecords, treeRecords, level) {
                let array = []
                if (level === 1) {
                    treeRecords.map((t) => {
                        userRecords.map((u) => {
                            let value = u.text[2] === " " ? u.text.slice(0, 2) : u.text.slice(0, 3);
                            if (t.children === undefined && t.value === value) {
                                array.push(t);
                            } else {
                                let all = []
                                if (t.value !== undefined)
                                    all = t.value.split(',');

                                if (all.indexOf(value) !== -1) {
                                    let items = getSpecificData(userRecords, t.children, 2);
                                    if (items.length > 0) {
                                        t.children = items;
                                        let exists = false;
                                        array.map((v) => {
                                            if (v.value == t.value)
                                                exists = true;
                                        });

                                        if (!exists)
                                            array.push(t);
                                    }
                                }
                            }
                        });
                    });
                } else if (level === 2) {
                    treeRecords.map((t) => {
                        userRecords.map((u) => {
                            let value = u.text[2] === " " ? u.text.slice(0, 2) : u.text.slice(0, 3);
                            if (t.children === undefined && t.value === value) {
                                array.push(t);
                            } else {
                                let all = []
                                if (t.value !== undefined)
                                    all = t.value.split(',');

                                if (all.indexOf(value) !== -1) {
                                    let items = getSpecificData(t.children, userRecords, 3);
                                    if (items.length > 0) {
                                        t.children = items;
                                        let exists = false;
                                        array.map((v) => {
                                            if (v.value == t.value)
                                                exists = true;
                                        });

                                        if (!exists)
                                            array.push(t);
                                    }
                                }
                            }
                        });
                    });
                } else {
                    treeRecords.map((t) => {
                        userRecords.map((u) => {
                            let value = u.text[2] === " " ? u.text.slice(0, 2) : u.text.slice(0, 3);
                            if (t.children === undefined && t.value === value) {
                                array.push(t);
                            } else {
                                let all = []
                                if (t.value !== undefined)
                                    all = t.value.split(',');

                                if (all.indexOf(value) !== -1) {
                                    let items = getSpecificData(t.children, userRecords);
                                    if (items.length > 0) {
                                        t.children = items;
                                        let exists = false;
                                        array.map((v) => {
                                            if (v.value == t.value)
                                                exists = true;
                                        });

                                        if (!exists)
                                            array.push(t);
                                    }
                                }
                            }
                        });
                    });
                }

                return array;
            };
            async function updateDatasetsOfDatasourceGrid(updatetype = 'cells') {
                call_api_ajax('GetDatasets', 'get', DatasetsOfDatasourceSet.Request, true,
                    (data) => {
                        // console.log("Get it datasets 1. data: ", data, "\nparams: ", DatasetsOfDatasourceSet.Request)
                        for (var i in data.Result.Datasets) {
                            if (data.Result.Datasets[i].Additional != undefined)
                                data.Result.Datasets[i].Conversions = data.Result.Datasets[i].Additional.Conversions[0].ConvertTo + " " + data.Result.Datasets[i].Additional.Conversions[0].ConvertOperator + data.Result.Datasets[i].Additional.Conversions[0].ConvertValue
                        }
                        var r = data.Result;
                        DatasetsOfDatasourceSet.source.localdata = r.Datasets;
                        DatasetsOfDatasourceSet.Metadata = r.Metadata;
                        DatasetsOfDatasourceSet.SeriesCount = r.Metadata.Datasets;
                        DatasetsOfDatasourceSet.pagesCount = r.Metadata.PagesCount;
                        DatasetsOfDatasourceSet.Request.Page = r.Metadata.Page;
                        DatasetsOfDatasourceSet.pageCounter = r.Metadata.Page;
                        DatasetsOfDatasourceSet.Request.Rows = r.Metadata.Rows;
                        if (![50, 100, 250, 500].includes(r.Metadata.Rows)) {
                            DatasetsOfDatasourceSet.Request.Rows = 50;
                        }
                        DatasetsOfDatasourceSet.pageSize = DatasetsOfDatasourceSet.Request.Rows;

                        var isCategory = false;
                        for (var i = 0; i < DatasetsOfDatasourceSet.source.localdata.length; i++) {
                            DatasetsOfDatasourceSet.source.localdata[i].id = "id_" + i;
                            DatasetsOfDatasourceSet.source.localdata[i].num = (i + 1);
                            // DatasetsOfDatasourceSet.source.localdata[i].Favorite = "false";
                            if (DatasetsOfDatasourceSet.source.localdata[i].Datacategory != undefined)
                                var isCategory = true;
                        }

                        var columns = [{
                                id: "sel",
                                name: "#",
                                field: "num",
                                behavior: "select",
                                cssClass: "cell-title cell-right",
                                minWidth: 40,
                                width: 40,
                                cannotTriggerInsert: true,
                                resizable: false,
                                excludeFromColumnPicker: true,
                                headerCssClass: 'right',
                                sortable: true
                            },
                            {
                                id: "favorite",
                                name: "<img height='18' width='18' src='resources/css/icons/StarGrey.ico'>",
                                field: "Favorite",
                                filterable: false,
                                cssClass: "cell-title",
                                minWidth: 30,
                                width: 30,
                                resizable: false,
                                formatter: imagerenderer
                            },
                            {
                                id: "symbol",
                                name: "Symbol",
                                field: "Symbol",
                                width: 100,
                                minWidth: 100,
                                cssClass: "cell-title",
                                sortable: true,
                                formatter: symbol_renderer
                            },
                            {
                                id: "description",
                                name: "Description",
                                field: "Name",
                                sortable: true,
                                minWidth: 20,
                                width: 400,
                                cssClass: "cell-title"
                            },
                            {
                                id: "frequency",
                                defaultSortAsc: false,
                                name: "Frequency",
                                field: "Frequency",
                                minWidth: 80,
                                width: 80,
                                sortable: true,
                                cssClass: "cell-title"
                            },
                            {
                                id: "from",
                                name: "From",
                                field: "StartDate",
                                minWidth: 80,
                                width: 80,
                                sortable: true,
                                cssClass: "cell-title"
                            },
                            {
                                id: "to",
                                name: "To",
                                field: "EndDate",
                                minWidth: 80,
                                width: 80,
                                sortable: true,
                                cssClass: "cell-title"
                            },
                            {
                                id: "values",
                                name: "# Prices",
                                field: "Values",
                                minWidth: 80,
                                width: 80,
                                sortable: true,
                                cssClass: "cell-title cell-right"
                            },
                            {
                                id: "currency",
                                name: "Currency",
                                field: "Currency",
                                minWidth: 60,
                                width: 60,
                                sortable: true,
                                cssClass: "cell-title"
                            },
                            {
                                id: "decimals",
                                name: "Decimals",
                                field: "Decimals",
                                minWidth: 60,
                                width: 60,
                                sortable: true,
                                cssClass: "cell-title"
                            },
                            {
                                id: "unit",
                                name: "Unit",
                                field: "Unit",
                                minWidth: 60,
                                width: 60,
                                sortable: true,
                                cssClass: "cell-title"
                            },
                            {
                                id: "conversions",
                                name: "Conversions",
                                field: "Conversions",
                                minWidth: 100,
                                width: 100,
                                sortable: true,
                                cssClass: "cell-title"
                            },
                            {
                                id: "additional",
                                name: "Additional",
                                field: "Additional",
                                minWidth: 120,
                                width: 120,
                                sortable: true,
                                cssClass: "cell-title",
                                formatter: additional_renderer
                            },
                        ];

                        if (isCategory) {
                            columns.splice(1, 0, {
                                id: 'cat',
                                name: 'Cat.',
                                field: 'Datacategory',
                                minwidth: 10,
                                width: 40,
                                cssClass: "cell-title"
                            }, )
                        }

                        grid2.setColumns(columns);
                        grid2.setData(DatasetsOfDatasourceSet.source.localdata);

                        dataView2.beginUpdate();
                        dataView2.setItems(DatasetsOfDatasourceSet.source.localdata, "id");
                        dataView2.endUpdate();

                        grid2.invalidate();
                        grid2.render();

                        dataView2.setPagingOptions({
                            pageSize: DatasetsOfDatasourceSet.Request.Rows
                        });

                        var toggled = getCookie('btnHideAdditInfo2');
                        // var tab = getParameterByName('tab');
                        // if(tab == "favorites"){
                        if (toggled == 'true') {
                            showAdditInfo(2);
                        } else {
                            hideAdditInfo(2);
                        }
                        // }

                        var tmp = DatasetsOfDatasourceSet.pageCounter * DatasetsOfDatasourceSet.pageSize;
                        tmp = tmp + '';

                        // $('#gridDatasetsOfDatasource').jqxGrid('setcolumnproperty', 'id', 'width', tmp.length * 10);
                        // resizeColumns('gridDatasetsOfDatasource');
                        var dataToSend = {};
                        dataToSend.filter = DatasetsOfDatasourceSet.Request.Filter;
                        dataToSend.filter = dataToSend.filter == undefined ? "" : dataToSend.filter;
                        dataToSend.page = DatasetsOfDatasourceSet.pageCounter;
                        dataToSend.rows = DatasetsOfDatasourceSet.Request.Rows;

                        if (getParameterByName('tab') !== 'mydatasources') {
                            dataToSend.page = '';
                            dataToSend.filter = getParameterByName('filter');
                            if (categoryFilterURL !== "") dataToSend.categories = categoryFilterURL;
                        }

                        updateURL(dataToSend);
                        $("#searchSeriesBox").val(dataToSend.filter);
                        datasourceGrid_active = true;
                        CreateNavigationRow();
                    }, null, () => {
                        // $('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');
                    }, false);
            }

            $(window).resize(function() {
                setTimeout(() => {
                    updateDatasetsOfDatasourceGrid()
                }, 10);
            });

            var databaseJqxgridContextMenu = $("#databaseJqxgridMenu").jqxMenu({
                width: 200,
                height: 95,
                autoOpenPopup: false,
                mode: 'popup'
            });

            $("#databaseJqxgridMenu").on('itemclick', function(event) {
                var args = event.args;
                switch ($.trim($(args).text())) {
                    case "Add to Favourites":
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            copySeriesToFavorite();
                        }
                        break;

                    case "Remove from Favourites":
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            removeSeriesFromFavorites();
                        }
                        break;

                    case "Copy":
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            copySelectedSeriesToClipboard('gridDatasetsOfDatasource');
                            $("#databaseJqxgridMenu").hide();
                        }
                        break;

                    case "Export":
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            makeExportSeriesDialog();
                        }
                        break;
                }
            });

            var treeCreated = false;

            function loadDatabaseDataToGrid(DatasourceInfo) {
                if (DatasourceInfo.IsCategoryDS && !treeCreated) {

                    function compareAccess(elem) {
                        for (e of DatasourceInfo.UserCategoryList) {
                            if (elem === e.Name) {
                                return true
                            }
                        }
                        return false
                    }
                    // TODO ONE
                    function accessIcon() {
                        let list = DatasourceInfo.CategoryTree;
                        for (j in list) {
                            if (list[j].Group !== undefined) {
                                for (i in list[j].Items) {
                                    if (list[j].Items[i].Items) {
                                        for (k in list[j].Items[i].Items) {
                                            if (compareAccess(list[j].Items[i].Items[k].Category)) {
                                                list[j].Items[i].Items[k].access = true;
                                            } else {
                                                list[j].Items[i].Items[k].access = false;
                                            }
                                        }

                                    } else {
                                        if (compareAccess(list[j].Items[i].Category)) {
                                            list[j].Items[i].access = true;
                                        } else {
                                            list[j].Items[i].access = false;
                                        }
                                    }

                                }
                            } else {
                                if (compareAccess(list[j].Category)) {
                                    list[j].access = true;
                                } else {
                                    list[j].access = false;
                                }
                            }
                        }

                    }

                    function accessList() {
                        let list = DatasourceInfo.CategoryList;
                        for (let j in list) {
                            // let tmp_label = list[j].label[2] === " " ? list[j].label.slice(0, 2) : list[j].label.slice(0, 3);
                            if (compareAccess(list[j].Name)) {
                                list[j].access = true;
                            } else {
                                list[j].access = false;
                            }
                        }
                    }

                    accessList()
                    accessIcon()
                    var treeRecords = arrangeData(DatasourceInfo.CategoryTree, "Tree", DatasourceInfo); // TODO Here is the problem with the Tree
                    var listRecords = arrangeData(DatasourceInfo.CategoryList, "List"); // TODO Here is the problem with the List

                    treeRecords.unshift({
                        icon: "resources/css/icons/globe16-1.png",
                        text: "[All Categories]",
                        value: ""
                    })
                    listRecords.unshift({
                        icon: "resources/css/icons/globe16-1.png",
                        text: "[All Categories]",
                        value: ""
                    })

                    var treeElements = [];
                    for (let i in treeRecords) {
                        treeElements.push(treeRecords[i]);
                        if (treeRecords[i].children != null) {
                            for (let j in treeRecords[i].children) {
                                treeElements.push(treeRecords[i].children[j]);
                                if (treeRecords[i].children[j].children != null) {
                                    for (let k in treeRecords[i].children[j].children) {
                                        treeElements.push(treeRecords[i].children[j].children[k]);
                                    }
                                }
                            }
                        }
                    }

                    if (DatasourceInfo.UserCategoryList !== undefined)
                        var userRecords = arrangeData(DatasourceInfo.UserCategoryList, "UserList");

                    if (DatasourceInfo.CategoryList !== undefined) {
                        $('#jqxTabs-datasource').jqxTabs({
                            width: '100%',
                            // height: 'calc(100% - 0.99px)'
                        });
                        // $('#userCategory').show();

                        $('#userCategoryCheckbox').jqxCheckBox({
                            checked: false
                        });

                        $('#toggleCaptionTabTree').on('click', function(event) {
                            $('#userCategory').hide();
                            $('#jqxTabs-datasource').jqxTabs({
                                width: '100%'

                            });
                        });

                        $('#toggleCaptionTab').on('click', function(event) {
                            $('#userCategory').show();
                            $('#jqxTabs-datasource').jqxTabs({
                                width: '100%'

                            });
                        });

                        let info = $('#userCategory').find('#userCategoryCheckbox')[0].childNodes[1].data;
                        // console.log(info, typeof info)

                        $('#userCategory').find('#userCategoryCheckbox')[0].childNodes[1].data = `My Categories only`

                        $('#userCategoryCheckbox').on('change', function(event) {
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                $(".tree-loading").show();
                                setTimeout(() => {
                                    if (event.args.checked) {
                                        $('#toggleCaptionTab .jqx-tabs-titleContentWrapper').text('My Categories');
                                        $('#jstreeCategoriesList').jstree("destroy").empty();
                                        $('#jstreeCategoriesList').jstree({
                                            "core": {
                                                "data": userRecords,
                                                "multiple": false,
                                                "animation": 1
                                            },
                                            // "plugins" : [ "wholerow", "checkbox" ]
                                        });

                                        $('#jstreeCategoriesList').on('activate_node.jstree', function(e, item) {
                                            if (item.node.text !== null && item.node.text !== "") {
                                                var databaseCategory;
                                                if (item.node.original.value === "") {
                                                    databaseCategory = ""
                                                } else {
                                                    databaseCategory = item.node.text.slice(0, 3)[2] === " " ? item.node.text.slice(0, 2) : item.node.text.slice(0, 3);
                                                }

                                                updateURL({ category: databaseCategory });
                                                updateURL({ page: 1 });
                                                DatasetsOfDatasourceSet.Request.Filter = encodeURIComponent($("#searchBox").val());
                                                DatasetsOfDatasourceSet.Request.CategoryFilter = databaseCategory;
                                                DatasetsOfDatasourceSet.Request.Page = 1;

                                                // $('#gridDatasetsOfDatasource').jqxGrid('showloadelement');

                                                let filter = DatasetsOfDatasourceSet.Request.Filter;
                                                filter = (filter !== "") ? "&filter=" + filter : "";

                                                if (DatasetsOfDatasourceSet.Request.Filter == "" || DatasetsOfDatasourceSet.Request.Filter == "undefined") {
                                                    delete DatasetsOfDatasourceSet.Request.Filter;
                                                    delete dataToSend.filter;
                                                }

                                                call_api_ajax('GetDatasets', 'get', DatasetsOfDatasourceSet.Request, true,
                                                    (data) => {
                                                        // console.log("Get it datasets 3. data: ", data, "\nparams: ", DatasetsOfDatasourceSet.Request)
                                                        DatasetsOfDatasourceSet.SeriesCount = data.Result.Metadata.Datasets;
                                                        DatasetsOfDatasourceSet.pagesCount = data.Result.Metadata.PagesCount;
                                                        DatasetsOfDatasourceSet.pageCounter = data.Result.Metadata.Page;
                                                        DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;

                                                        var isCategory = false;
                                                        for (var i = 0; i < DatasetsOfDatasourceSet.source.localdata.length; i++) {
                                                            DatasetsOfDatasourceSet.source.localdata[i].id = "id_" + i;
                                                            DatasetsOfDatasourceSet.source.localdata[i].num = (i + 1);

                                                            if (DatasetsOfDatasourceSet.source.localdata[i].Datacategory != undefined)
                                                                var isCategory = true;
                                                        }

                                                        var columns = [
                                                            { id: "sel", name: "#", field: "num", behavior: "select", cssClass: "cell-title cell-right", minWidth: 40, width: 40, cannotTriggerInsert: true, resizable: false, excludeFromColumnPicker: true, headerCssClass: 'right', sortable: true },
                                                            { id: "favorite", name: "<img height='18' width='18' src='resources/css/icons/StarGrey.ico'>", field: "Favorite", filterable: false, cssClass: "cell-title", minWidth: 30, width: 30, resizable: false, formatter: imagerenderer },
                                                            { id: "symbol", name: "Symbol", field: "Symbol", width: 100, minWidth: 100, cssClass: "cell-title", sortable: true, formatter: symbol_renderer },
                                                            { id: "description", name: "Description", field: "Name", sortable: true, minWidth: 20, width: 400, cssClass: "cell-title" },
                                                            { id: "frequency", defaultSortAsc: false, name: "Frequency", field: "Frequency", minWidth: 80, width: 80, sortable: true, cssClass: "cell-title" },
                                                            { id: "from", name: "From", field: "StartDate", minWidth: 80, width: 80, sortable: true, cssClass: "cell-title" },
                                                            { id: "to", name: "To", field: "EndDate", minWidth: 80, width: 80, sortable: true, cssClass: "cell-title" },
                                                            { id: "values", name: "# Prices", field: "Values", minWidth: 80, width: 80, sortable: true, cssClass: "cell-title cell-right" },
                                                            { id: "currency", name: "Currency", field: "Currency", minWidth: 60, width: 60, sortable: true, cssClass: "cell-title" },
                                                            { id: "decimals", name: "Decimals", field: "Decimals", minWidth: 60, width: 60, sortable: true, cssClass: "cell-title" },
                                                            { id: "unit", name: "Unit", field: "Unit", minWidth: 60, width: 60, sortable: true, cssClass: "cell-title" },
                                                            { id: "conversions", name: "Conversions", field: "Conversions", minWidth: 100, width: 100, sortable: true, cssClass: "cell-title" },
                                                            { id: "additional", name: "Additional", field: "Additional", minWidth: 120, width: 120, sortable: true, cssClass: "cell-title", formatter: additional_renderer },
                                                        ];

                                                        if (isCategory) {
                                                            columns.splice(1, 0, { id: 'cat', name: 'Cat.', field: 'Datacategory', minwidth: 10, width: 40, cssClass: "cell-title" }, )
                                                        }

                                                        grid2.setColumns(columns);
                                                        // data.Result.Datasets.forEach(item => console.log(item.Subscription))
                                                        grid2.setData(DatasetsOfDatasourceSet.source.localdata);

                                                        dataView2.beginUpdate();
                                                        dataView2.setItems(DatasetsOfDatasourceSet.source.localdata, "id");
                                                        dataView2.endUpdate();
                                                        refreshPagination();

                                                        grid2.invalidate();
                                                        grid2.render();

                                                        var toggled = getCookie('btnHideAdditInfo2');
                                                        // var tab = getParameterByName('tab');
                                                        // if(tab == "favorites"){
                                                        if (toggled == 'true') {
                                                            showAdditInfo(2);
                                                        } else {
                                                            hideAdditInfo(2);
                                                        }
                                                        // }
                                                    }, null, () => {
                                                        // $('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');
                                                    }, false);
                                            } else {
                                                // $('#gridDatasetsOfDatasource').jqxGrid('clear');
                                            }


                                        });

                                        var attachCategoriesContextMenu = function() {
                                            $("#jqxCategoriesMenu").css("opacity", 1);

                                            // open the context menu when the user presses the mouse right button.
                                            $("#jstreeCategoriesList").bind('contextmenu', function(e) {
                                                return false
                                            });

                                            // open the context menu when the user presses the mouse right button.
                                            $("#jstreeCategoriesList").on('mousedown', function(event) {
                                                var target = $(event.target).parents('li:first')[0];
                                                var rightClick = isRightClick(event);
                                                if (rightClick && target != null) {
                                                    $("#jstreeCategoriesList").jstree().deselect_all(true);
                                                    $('#jstreeCategoriesList').jstree(true).select_node(target);
                                                    var scrollTop = $(window).scrollTop();
                                                    var scrollLeft = $(window).scrollLeft();
                                                    return false;
                                                }
                                            });
                                        }
                                        attachCategoriesContextMenu();

                                        $("#jqxCategoriesMenu").on('itemclick', function(event) {
                                            var item = $.trim($(event.args).text());
                                            switch (item) {
                                                case "Open All":
                                                    $('#jstreeCategoriesList').jstree('open_all');
                                                    attachCategoriesContextMenu();
                                                    break;
                                                case "Close All":
                                                    $('#jstreeCategoriesList').jstree('close_all');
                                                    attachCategoriesContextMenu();
                                                    break;
                                            }
                                        });

                                        function isRightClick(event) {
                                            var rightclick;
                                            if (!event) var event = window.event;
                                            if (event.which) rightclick = (event.which == 3);
                                            else if (event.button) rightclick = (event.button == 2);
                                            return rightclick;
                                        }
                                    } else {
                                        $('#toggleCaptionTab .jqx-tabs-titleContentWrapper').text('Categories');
                                        $('#jstreeCategoriesList').jstree("destroy").empty();
                                        $('#jstreeCategoriesList').jstree({
                                            "core": {
                                                "data": listRecords,
                                                "multiple": false,
                                                "animation": 0
                                            },
                                            // "plugins" : [ "wholerow", "checkbox" ]
                                        });

                                        $('#jstreeCategoriesList').on('activate_node.jstree', function(e, item) {
                                            if (item.node.text !== null && item.node.text !== "") {
                                                var databaseCategory;
                                                if (item.node.original.value === "") {
                                                    databaseCategory = ""
                                                } else {
                                                    databaseCategory = item.node.text.slice(0, 3)[2] === " " ? item.node.text.slice(0, 2) : item.node.text.slice(0, 3);
                                                }

                                                updateURL({ category: databaseCategory });
                                                updateURL({ page: 1 });
                                                DatasetsOfDatasourceSet.Request.Filter = encodeURIComponent($("#searchBox").val());
                                                DatasetsOfDatasourceSet.Request.CategoryFilter = databaseCategory;
                                                DatasetsOfDatasourceSet.Request.Page = 1;

                                                // $('#gridDatasetsOfDatasource').jqxGrid('showloadelement');

                                                let filter = DatasetsOfDatasourceSet.Request.Filter;
                                                filter = (filter !== "") ? "&filter=" + filter : "";

                                                if (DatasetsOfDatasourceSet.Request.Filter == "" || DatasetsOfDatasourceSet.Request.Filter == "undefined") {
                                                    delete DatasetsOfDatasourceSet.Request.Filter;
                                                    delete dataToSend.filter;
                                                }

                                                call_api_ajax('GetDatasets', 'get', DatasetsOfDatasourceSet.Request, true,
                                                    (data) => {
                                                        // console.log("Get it datasets 3. data: ", data, "\nparams: ", DatasetsOfDatasourceSet.Request)
                                                        DatasetsOfDatasourceSet.SeriesCount = data.Result.Metadata.Datasets;
                                                        DatasetsOfDatasourceSet.pagesCount = data.Result.Metadata.PagesCount;
                                                        DatasetsOfDatasourceSet.pageCounter = data.Result.Metadata.Page;
                                                        DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;

                                                        var isCategory = false;
                                                        for (var i = 0; i < DatasetsOfDatasourceSet.source.localdata.length; i++) {
                                                            DatasetsOfDatasourceSet.source.localdata[i].id = "id_" + i;
                                                            DatasetsOfDatasourceSet.source.localdata[i].num = (i + 1);

                                                            if (DatasetsOfDatasourceSet.source.localdata[i].Datacategory != undefined)
                                                                var isCategory = true;
                                                        }

                                                        var columns = [
                                                            { id: "sel", name: "#", field: "num", behavior: "select", cssClass: "cell-title cell-right", minWidth: 40, width: 40, cannotTriggerInsert: true, resizable: false, excludeFromColumnPicker: true, headerCssClass: 'right', sortable: true },
                                                            { id: "favorite", name: "<img height='18' width='18' src='resources/css/icons/StarGrey.ico'>", field: "Favorite", filterable: false, cssClass: "cell-title", minWidth: 30, width: 30, resizable: false, formatter: imagerenderer },
                                                            { id: "symbol", name: "Symbol", field: "Symbol", width: 100, minWidth: 100, cssClass: "cell-title", sortable: true, formatter: symbol_renderer },
                                                            { id: "description", name: "Description", field: "Name", sortable: true, minWidth: 20, width: 400, cssClass: "cell-title" },
                                                            { id: "frequency", defaultSortAsc: false, name: "Frequency", field: "Frequency", minWidth: 80, width: 80, sortable: true, cssClass: "cell-title" },
                                                            { id: "from", name: "From", field: "StartDate", minWidth: 80, width: 80, sortable: true, cssClass: "cell-title" },
                                                            { id: "to", name: "To", field: "EndDate", minWidth: 80, width: 80, sortable: true, cssClass: "cell-title" },
                                                            { id: "values", name: "# Prices", field: "Values", minWidth: 80, width: 80, sortable: true, cssClass: "cell-title cell-right" },
                                                            { id: "currency", name: "Currency", field: "Currency", minWidth: 60, width: 60, sortable: true, cssClass: "cell-title" },
                                                            { id: "decimals", name: "Decimals", field: "Decimals", minWidth: 60, width: 60, sortable: true, cssClass: "cell-title" },
                                                            { id: "unit", name: "Unit", field: "Unit", minWidth: 60, width: 60, sortable: true, cssClass: "cell-title" },
                                                            { id: "conversions", name: "Conversions", field: "Conversions", minWidth: 100, width: 100, sortable: true, cssClass: "cell-title" },
                                                            { id: "additional", name: "Additional", field: "Additional", minWidth: 120, width: 120, sortable: true, cssClass: "cell-title", formatter: additional_renderer },
                                                        ];

                                                        if (isCategory) {
                                                            columns.splice(1, 0, { id: 'cat', name: 'Cat.', field: 'Datacategory', minwidth: 10, width: 40, cssClass: "cell-title" }, )
                                                        }

                                                        grid2.setColumns(columns);
                                                        // data.Result.Datasets.forEach(item => console.log(item.Subscription))
                                                        grid2.setData(DatasetsOfDatasourceSet.source.localdata);

                                                        dataView2.beginUpdate();
                                                        dataView2.setItems(DatasetsOfDatasourceSet.source.localdata, "id");
                                                        dataView2.endUpdate();
                                                        refreshPagination();

                                                        grid2.invalidate();
                                                        grid2.render();

                                                        var toggled = getCookie('btnHideAdditInfo2');
                                                        // var tab = getParameterByName('tab');
                                                        // if(tab == "favorites"){
                                                        if (toggled == 'true') {
                                                            showAdditInfo(2);
                                                        } else {
                                                            hideAdditInfo(2);
                                                        }
                                                        // }
                                                    }, null, () => {
                                                        // $('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');
                                                    }, false);
                                            } else {
                                                // $('#gridDatasetsOfDatasource').jqxGrid('clear');
                                            }

                                            var item = $('#jstreeCategoriesList').jstree(true).get_selected("full", true)[0];
                                            if (item)
                                                document.getElementById(item.id).children[1].style.color = "white";

                                            let treeItems = $('#jstreeCategoriesList').jstree(true).get_json('#', { flat: true });
                                            for (let j in treeItems) {
                                                if (treeItems[j].id == item.id)
                                                    continue;
                                                let splitted = treeItems[j].text.split("[")
                                                let element = document.getElementById(treeItems[j].id);
                                                if (splitted.length > 1) {
                                                    let subnode = splitted[1].replace("]", "")
                                                    if (subnode !== "All Categories") {
                                                        for (let k in userRecords) {
                                                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0, 2) : userRecords[k].text.slice(0, 3);
                                                            if (subnode !== available_category && element != null) {
                                                                //element.style.color = "#aaa" 
                                                                element.children[1].style.color = "#aaa";
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    if (element != null && element.children[1]) {
                                                        element.children[1].style.color = "#aaa";
                                                    }
                                                }
                                            }

                                            for (let j in treeItems) {
                                                if (treeItems[j].id == item.id)
                                                    continue;
                                                let splitted = treeItems[j].text.split("[")
                                                let categories1 = treeElements[j].value.split(",")
                                                let element = document.getElementById(treeItems[j].id);
                                                for (let m of categories1) {
                                                    for (let o in userRecords) {
                                                        if (userRecords[o].text.split(" ")[0] === m) {
                                                            if (element != null && element.children[1])
                                                                element.children[1].style.color = "black";
                                                        }
                                                    }
                                                }
                                                if (splitted.length > 1) {
                                                    let subnode = splitted[1].replace("]", "")
                                                    if (subnode !== "All Categories") {
                                                        for (let k in userRecords) {
                                                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0, 2) : userRecords[k].text.slice(0, 3);
                                                            if (element != null && subnode === available_category) {
                                                                element.children[0].style.color = "black";
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        });

                                        var attachCategoriesContextMenu = function() {
                                            $("#jqxCategoriesMenu").css("opacity", 1);

                                            // open the context menu when the user presses the mouse right button.
                                            $("#jstreeCategoriesList").bind('contextmenu', function(e) {
                                                return false
                                            });

                                            // open the context menu when the user presses the mouse right button.
                                            $("#jstreeCategoriesList").on('mousedown', function(event) {
                                                var target = $(event.target).parents('li:first')[0];
                                                var rightClick = isRightClick(event);
                                                if (rightClick && target != null) {
                                                    $("#jstreeCategoriesList").jstree().deselect_all(true);
                                                    $('#jstreeCategoriesList').jstree(true).select_node(target);
                                                    var scrollTop = $(window).scrollTop();
                                                    var scrollLeft = $(window).scrollLeft();
                                                    return false;
                                                }
                                            });
                                        }
                                        attachCategoriesContextMenu();

                                        $("#jqxCategoriesMenu").on('itemclick', function(event) {
                                            var item = $.trim($(event.args).text());
                                            switch (item) {
                                                case "Open All":
                                                    $('#jstreeCategoriesList').jstree('open_all');
                                                    attachCategoriesContextMenu();
                                                    break;
                                                case "Close All":
                                                    $('#jstreeCategoriesList').jstree('close_all');
                                                    attachCategoriesContextMenu();
                                                    break;
                                            }
                                        });

                                        function isRightClick(event) {
                                            var rightclick;
                                            if (!event) var event = window.event;
                                            if (event.which) rightclick = (event.which == 3);
                                            else if (event.button) rightclick = (event.button == 2);
                                            return rightclick;
                                        }

                                        $('#jstreeCategoriesList').on('loaded.jstree', function() {
                                            let listItems = $('#jstreeCategoriesList').jstree(true).get_json('#', {
                                                flat: true
                                            });
                                            for (let j in listItems) {
                                                if (listItems[j].text !== "[All Categories]") {
                                                    let value = listItems[j].text.split(" ")[0]
                                                    for (let m of userRecords) {
                                                        if (value !== m.text.split(" ")[0]) {
                                                            let element = document.getElementById(listItems[j].id);
                                                            element.children[1].style.color = "#aaa";
                                                        }
                                                    }
                                                }
                                            }

                                            for (let j in listItems) {
                                                if (listItems[j].text !== "[All Categories]") {
                                                    let value = listItems[j].text.split(" ")[0]
                                                    for (let m of userRecords) {
                                                        if (value === m.text.split(" ")[0]) {
                                                            let element = document.getElementById(listItems[j].id);
                                                            element.children[1].style.color = "black";
                                                        }
                                                    }
                                                }
                                            }
                                        });
                                    }
                                    $(".tree-loading").hide();
                                }, 0.5);
                            }
                        });
                    }
                    $('#jqxTabs-datasource').css("opacity", 1);

                    if (treeRecords) {
                        $('#jstreeCategoriesTree').jstree({
                            "core": {
                                "data": treeRecords,
                            },
                            // "plugins" : [ "contextmenu" ]
                        });

                        $('#jstreeCategoriesTree').on('open_node.jstree', function(a, b, c) {
                            let treeItems = $('#jstreeCategoriesTree').jstree(true).get_json('#', {
                                flat: true
                            });
                            for (let j in treeItems) {
                                let splitted = treeItems[j].text.split("[")
                                let element = document.getElementById(treeItems[j].id);

                                if (splitted.length > 1) {
                                    let subnode = splitted[1].replace("]", "")
                                    if (subnode !== "All Categories") {
                                        for (let k in userRecords) {
                                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0, 2) : userRecords[k].text.slice(0, 3);
                                            if (subnode !== available_category && element != null) {
                                                //element.style.color = "#aaa" 
                                                element.children[1].style.color = "#aaa";
                                            }
                                        }
                                    }
                                } else {
                                    if (element != null && element.children[1]) {
                                        element.children[1].style.color = "#aaa";
                                    }
                                }
                            }

                            for (let j in treeItems) {
                                let splitted = treeItems[j].text.split("[")
                                let categories1 = treeElements[j].value.split(",")
                                let element = document.getElementById(treeItems[j].id);
                                for (let m of categories1) {
                                    for (let o in userRecords) {
                                        if (userRecords[o].text.split(" ")[0] === m) {
                                            if (element != null && element.children[1])
                                                element.children[1].style.color = "black";
                                        }
                                    }
                                }
                                if (splitted.length > 1) {
                                    let subnode = splitted[1].replace("]", "")
                                    if (subnode !== "All Categories") {
                                        for (let k in userRecords) {
                                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0, 2) : userRecords[k].text.slice(0, 3);
                                            if (element != null && subnode === available_category) {
                                                element.children[0].style.color = "black";
                                            }
                                        }
                                    }
                                }
                            }
                        });

                        $('#jstreeCategoriesTree').on('activate_node.jstree', function(e, item) {
                            // $("#jstreeCategoriesList").jqxTree('selectItem', null);
                            if (item.node.children.length == 0) {
                                if (item.node.original.value !== null) {
                                    var databaseCategory = item.node.original.value;
                                    updateURL({
                                        category: databaseCategory
                                    });
                                    updateURL({
                                        page: 1
                                    });
                                    DatasetsOfDatasourceSet.Request.Filter = encodeURIComponent($("#searchBox").val());
                                    DatasetsOfDatasourceSet.Request.CategoryFilter = databaseCategory;
                                    DatasetsOfDatasourceSet.Request.Page = 1;

                                    let filter = DatasetsOfDatasourceSet.Request.Filter;
                                    filter = (filter !== "") ? "&filter=" + filter : "";

                                    if (DatasetsOfDatasourceSet.Request.Filter == "" || DatasetsOfDatasourceSet.Request.Filter == "undefined") delete DatasetsOfDatasourceSet.Request.Filter;

                                    call_api_ajax('GetDatasets', 'get', DatasetsOfDatasourceSet.Request, true,
                                        (data) => {
                                            DatasetsOfDatasourceSet.SeriesCount = data.Result.Metadata.Datasets;
                                            DatasetsOfDatasourceSet.pagesCount = data.Result.Metadata.PagesCount;
                                            DatasetsOfDatasourceSet.pageCounter = data.Result.Metadata.Page;

                                            DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;

                                            var isCategory = false;
                                            for (var i = 0; i < DatasetsOfDatasourceSet.source.localdata.length; i++) {
                                                DatasetsOfDatasourceSet.source.localdata[i].id = "id_" + i;
                                                DatasetsOfDatasourceSet.source.localdata[i].num = (i + 1);

                                                if (DatasetsOfDatasourceSet.source.localdata[i].Datacategory != undefined)
                                                    var isCategory = true;
                                            }

                                            var columns = [{
                                                    id: "sel",
                                                    name: "#",
                                                    field: "num",
                                                    behavior: "select",
                                                    cssClass: "cell-title cell-right",
                                                    minWidth: 40,
                                                    width: 40,
                                                    cannotTriggerInsert: true,
                                                    resizable: false,
                                                    excludeFromColumnPicker: true,
                                                    headerCssClass: 'right',
                                                    sortable: true
                                                },
                                                {
                                                    id: "favorite",
                                                    name: "<img height='18' width='18' src='resources/css/icons/StarGrey.ico'>",
                                                    field: "Favorite",
                                                    filterable: false,
                                                    cssClass: "cell-title",
                                                    minWidth: 30,
                                                    width: 30,
                                                    resizable: false,
                                                    formatter: imagerenderer
                                                },
                                                {
                                                    id: "symbol",
                                                    name: "Symbol",
                                                    field: "Symbol",
                                                    width: 100,
                                                    minWidth: 100,
                                                    cssClass: "cell-title",
                                                    sortable: true,
                                                    formatter: symbol_renderer
                                                },
                                                {
                                                    id: "description",
                                                    name: "Description",
                                                    field: "Name",
                                                    sortable: true,
                                                    minWidth: 20,
                                                    width: 400,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "frequency",
                                                    defaultSortAsc: false,
                                                    name: "Frequency",
                                                    field: "Frequency",
                                                    minWidth: 80,
                                                    width: 80,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "from",
                                                    name: "From",
                                                    field: "StartDate",
                                                    minWidth: 80,
                                                    width: 80,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "to",
                                                    name: "To",
                                                    field: "EndDate",
                                                    minWidth: 80,
                                                    width: 80,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "values",
                                                    name: "# Prices",
                                                    field: "Values",
                                                    minWidth: 80,
                                                    width: 80,
                                                    sortable: true,
                                                    cssClass: "cell-title cell-right"
                                                },
                                                {
                                                    id: "currency",
                                                    name: "Currency",
                                                    field: "Currency",
                                                    minWidth: 60,
                                                    width: 60,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "decimals",
                                                    name: "Decimals",
                                                    field: "Decimals",
                                                    minWidth: 60,
                                                    width: 60,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "unit",
                                                    name: "Unit",
                                                    field: "Unit",
                                                    minWidth: 60,
                                                    width: 60,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "conversions",
                                                    name: "Conversions",
                                                    field: "Conversions",
                                                    minWidth: 100,
                                                    width: 100,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "additional",
                                                    name: "Additional",
                                                    field: "Additional",
                                                    minWidth: 120,
                                                    width: 120,
                                                    sortable: true,
                                                    cssClass: "cell-title",
                                                    formatter: additional_renderer
                                                },
                                            ];

                                            if (isCategory) {
                                                columns.splice(1, 0, {
                                                    id: 'cat',
                                                    name: 'Cat.',
                                                    field: 'Datacategory',
                                                    minwidth: 10,
                                                    width: 40,
                                                    cssClass: "cell-title"
                                                }, )
                                            }

                                            grid2.setColumns(columns);

                                            // refreshPagination();
                                            // // $("#gridDatasetsOfDatasource").jqxGrid('updatebounddata', 'cells');

                                            // grid2.invalidate();
                                            grid2.setData(DatasetsOfDatasourceSet.source.localdata);
                                            dataView2.beginUpdate();
                                            dataView2.setItems(DatasetsOfDatasourceSet.source.localdata, "id");
                                            dataView2.endUpdate();
                                            grid2.invalidate();
                                            grid2.render();

                                            var toggled = getCookie('btnHideAdditInfo2');
                                            // var tab = getParameterByName('tab');
                                            // if(tab == "favorites"){
                                            if (toggled == 'true') {
                                                showAdditInfo(2);
                                            } else {
                                                hideAdditInfo(2);
                                            }
                                            // }

                                            grid2.setSelectedRows([0]);

                                        }, null, () => {
                                            // $('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');
                                        }, false);
                                } else {
                                    // $('#gridDatasetsOfDatasource').jqxGrid('clear');
                                }
                            }

                            var item = $('#jstreeCategoriesTree').jstree(true).get_selected("full", true)[0];
                            if (item)
                                document.getElementById(item.id).children[1].style.color = "white";

                            let treeItems = $('#jstreeCategoriesTree').jstree(true).get_json('#', {
                                flat: true
                            });
                            for (let j in treeItems) {
                                if (treeItems[j].id == item.id)
                                    continue;

                                let splitted = treeItems[j].text.split("[")
                                let element = document.getElementById(treeItems[j].id);
                                if (splitted.length > 1) {
                                    let subnode = splitted[1].replace("]", "")
                                    if (subnode !== "All Categories") {
                                        for (let k in userRecords) {
                                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0, 2) : userRecords[k].text.slice(0, 3);
                                            if (subnode !== available_category && element != null) {
                                                //element.style.color = "#aaa" 
                                                element.children[1].style.color = "#aaa";
                                            }
                                        }
                                    }
                                } else {
                                    if (element != null && element.children[1]) {
                                        element.children[1].style.color = "#aaa";
                                    }
                                }
                            }

                            for (let j in treeItems) {
                                if (treeItems[j].id == item.id)
                                    continue;

                                let splitted = treeItems[j].text.split("[")
                                let categories1 = treeElements[j].value.split(",")
                                let element = document.getElementById(treeItems[j].id);
                                for (let m of categories1) {
                                    for (let o in userRecords) {
                                        if (userRecords[o].text.split(" ")[0] === m) {
                                            if (element != null && element.children[1])
                                                element.children[1].style.color = "black";
                                        }
                                    }
                                }
                                if (splitted.length > 1) {
                                    let subnode = splitted[1].replace("]", "")
                                    if (subnode !== "All Categories") {
                                        for (let k in userRecords) {
                                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0, 2) : userRecords[k].text.slice(0, 3);
                                            if (element != null && subnode === available_category) {
                                                element.children[0].style.color = "black";
                                            }
                                        }
                                    }
                                }
                            }
                        });

                        var contextCategoriesMenu = $("#jqxCategoriesMenu").jqxMenu({
                            width: '120px',
                            height: '56px',
                            autoOpenPopup: false,
                            mode: 'popup'
                        });
                        var attachCategoriesContextMenu = function() {
                            $("#jqxCategoriesMenu").css("opacity", 1);

                            // open the context menu when the user presses the mouse right button.
                            $("#jstreeCategoriesTree").bind('contextmenu', function(e) {
                                return false
                            });

                            $("#jstreeCategoriesTree").on('mousedown', function(event) {
                                event.preventDefault();
                                var target = $(event.target).parents('li:first')[0];
                                var rightClick = isRightClick(event);
                                if (rightClick && target != null) {
                                    $("#jstreeCategoriesTree").jstree().deselect_all(true);
                                    $('#jstreeCategoriesTree').jstree(true).select_node(target);
                                    var scrollTop = $(window).scrollTop();
                                    var scrollLeft = $(window).scrollLeft();
                                    contextCategoriesMenu.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
                                    return false;
                                }
                            });
                        }
                        attachCategoriesContextMenu();

                        $("#jqxCategoriesMenu").on('itemclick', function(event) {
                            var item = $.trim($(event.args).text());
                            switch (item) {
                                case "Open All":
                                    $('#jstreeCategoriesTree').jstree('open_all');
                                    attachCategoriesContextMenu();
                                    break;
                                case "Close All":
                                    $('#jstreeCategoriesTree').jstree('close_all');
                                    attachCategoriesContextMenu();
                                    break;
                            }
                        });

                        function isRightClick(event) {
                            var rightclick;
                            if (!event) var event = window.event;
                            if (event.which) rightclick = (event.which == 3);
                            else if (event.button) rightclick = (event.button == 2);
                            return rightclick;
                        }

                        $('#jstreeCategoriesTree').on('loaded.jstree', function() {
                            let treeItems = $('#jstreeCategoriesTree').jstree(true).get_json('#', {
                                flat: true
                            });
                            document.getElementById(treeItems[0].id).children[0].style.width = "5px";
                            for (let j in treeItems) {
                                let splitted = treeItems[j].text.split("[")
                                let element = document.getElementById(treeItems[j].id);
                                if (splitted.length > 1) {
                                    let subnode = splitted[1].replace("]", "")
                                    if (subnode !== "All Categories") {
                                        for (let k in userRecords) {
                                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0, 2) : userRecords[k].text.slice(0, 3);
                                            if (subnode !== available_category && element != null) {
                                                //element.style.color = "#aaa" 
                                                element.children[1].style.color = "#aaa";
                                            }
                                        }
                                    }
                                } else {
                                    if (element != null && element.children[1]) {
                                        element.children[1].style.color = "#aaa";
                                    }
                                }
                            }

                            for (let j in treeItems) {
                                let splitted = treeItems[j].text.split("[")
                                let categories1 = treeElements[j].value.split(",")
                                let element = document.getElementById(treeItems[j].id);
                                for (let m of categories1) {
                                    for (let o in userRecords) {
                                        if (userRecords[o].text.split(" ")[0] === m) {
                                            if (element != null && element.children[1])
                                                element.children[1].style.color = "black";
                                        }
                                    }
                                }
                                if (splitted.length > 1) {
                                    let subnode = splitted[1].replace("]", "")
                                    if (subnode !== "All Categories") {
                                        for (let k in userRecords) {
                                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0, 2) : userRecords[k].text.slice(0, 3);
                                            if (element != null && subnode === available_category) {
                                                element.children[0].style.color = "black";
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                    if (listRecords) {
                        let first_item = listRecords.shift();

                        let sorted_list = listRecords.sort((a, b) => {
                            if (a.text < b.text) {
                                return -1;
                            }
                            if (a.text > b.text) {
                                return 1;
                            }
                            return 0;
                        });

                        listRecords = [first_item, ].concat(sorted_list)

                        $('#jstreeCategoriesList').jstree({
                            "core": {
                                "data": listRecords,
                                "multiple": false,
                                "animation": 0
                            },
                            // "plugins" : [ "wholerow", "checkbox" ]
                        });

                        $('#jstreeCategoriesList').on('activate_node.jstree', function(e, item) {
                            if (item.node.text !== null && item.node.text !== "") {
                                var databaseCategory;
                                if (item.node.original.value === "") {
                                    databaseCategory = ""
                                } else {
                                    databaseCategory = item.node.text.slice(0, 3)[2] === " " ? item.node.text.slice(0, 2) : item.node.text.slice(0, 3);
                                }

                                updateURL({
                                    category: databaseCategory
                                });
                                updateURL({
                                    page: 1
                                });
                                DatasetsOfDatasourceSet.Request.Filter = encodeURIComponent($("#searchBox").val());
                                DatasetsOfDatasourceSet.Request.CategoryFilter = databaseCategory;
                                DatasetsOfDatasourceSet.Request.Page = 1;

                                // $('#gridDatasetsOfDatasource').jqxGrid('showloadelement');

                                let filter = DatasetsOfDatasourceSet.Request.Filter;
                                filter = (filter !== "") ? "&filter=" + filter : "";

                                if (DatasetsOfDatasourceSet.Request.Filter == "" || DatasetsOfDatasourceSet.Request.Filter == "undefined") {
                                    delete DatasetsOfDatasourceSet.Request.Filter;
                                    delete dataToSend.filter;
                                }

                                call_api_ajax('GetDatasets', 'get', DatasetsOfDatasourceSet.Request, true,
                                    (data) => {
                                        // console.log("Get it datasets 3. data: ", data, "\nparams: ", DatasetsOfDatasourceSet.Request)
                                        DatasetsOfDatasourceSet.SeriesCount = data.Result.Metadata.Datasets;
                                        DatasetsOfDatasourceSet.pagesCount = data.Result.Metadata.PagesCount;
                                        DatasetsOfDatasourceSet.pageCounter = data.Result.Metadata.Page;
                                        DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;

                                        var isCategory = false;
                                        for (var i = 0; i < DatasetsOfDatasourceSet.source.localdata.length; i++) {
                                            DatasetsOfDatasourceSet.source.localdata[i].id = "id_" + i;
                                            DatasetsOfDatasourceSet.source.localdata[i].num = (i + 1);

                                            if (DatasetsOfDatasourceSet.source.localdata[i].Datacategory != undefined)
                                                var isCategory = true;
                                        }

                                        var columns = [{
                                                id: "sel",
                                                name: "#",
                                                field: "num",
                                                behavior: "select",
                                                cssClass: "cell-title cell-right",
                                                minWidth: 40,
                                                width: 40,
                                                cannotTriggerInsert: true,
                                                resizable: false,
                                                excludeFromColumnPicker: true,
                                                headerCssClass: 'right',
                                                sortable: true
                                            },
                                            {
                                                id: "favorite",
                                                name: "<img height='18' width='18' src='resources/css/icons/StarGrey.ico'>",
                                                field: "Favorite",
                                                filterable: false,
                                                cssClass: "cell-title",
                                                minWidth: 30,
                                                width: 30,
                                                resizable: false,
                                                formatter: imagerenderer
                                            },
                                            {
                                                id: "symbol",
                                                name: "Symbol",
                                                field: "Symbol",
                                                width: 100,
                                                minWidth: 100,
                                                cssClass: "cell-title",
                                                sortable: true,
                                                formatter: symbol_renderer
                                            },
                                            {
                                                id: "description",
                                                name: "Description",
                                                field: "Name",
                                                sortable: true,
                                                minWidth: 20,
                                                width: 400,
                                                cssClass: "cell-title"
                                            },
                                            {
                                                id: "frequency",
                                                defaultSortAsc: false,
                                                name: "Frequency",
                                                field: "Frequency",
                                                minWidth: 80,
                                                width: 80,
                                                sortable: true,
                                                cssClass: "cell-title"
                                            },
                                            {
                                                id: "from",
                                                name: "From",
                                                field: "StartDate",
                                                minWidth: 80,
                                                width: 80,
                                                sortable: true,
                                                cssClass: "cell-title"
                                            },
                                            {
                                                id: "to",
                                                name: "To",
                                                field: "EndDate",
                                                minWidth: 80,
                                                width: 80,
                                                sortable: true,
                                                cssClass: "cell-title"
                                            },
                                            {
                                                id: "values",
                                                name: "# Prices",
                                                field: "Values",
                                                minWidth: 80,
                                                width: 80,
                                                sortable: true,
                                                cssClass: "cell-title cell-right"
                                            },
                                            {
                                                id: "currency",
                                                name: "Currency",
                                                field: "Currency",
                                                minWidth: 60,
                                                width: 60,
                                                sortable: true,
                                                cssClass: "cell-title"
                                            },
                                            {
                                                id: "decimals",
                                                name: "Decimals",
                                                field: "Decimals",
                                                minWidth: 60,
                                                width: 60,
                                                sortable: true,
                                                cssClass: "cell-title"
                                            },
                                            {
                                                id: "unit",
                                                name: "Unit",
                                                field: "Unit",
                                                minWidth: 60,
                                                width: 60,
                                                sortable: true,
                                                cssClass: "cell-title"
                                            },
                                            {
                                                id: "conversions",
                                                name: "Conversions",
                                                field: "Conversions",
                                                minWidth: 100,
                                                width: 100,
                                                sortable: true,
                                                cssClass: "cell-title"
                                            },
                                            {
                                                id: "additional",
                                                name: "Additional",
                                                field: "Additional",
                                                minWidth: 120,
                                                width: 120,
                                                sortable: true,
                                                cssClass: "cell-title",
                                                formatter: additional_renderer
                                            },
                                        ];

                                        if (isCategory) {
                                            columns.splice(1, 0, {
                                                id: 'cat',
                                                name: 'Cat.',
                                                field: 'Datacategory',
                                                minwidth: 10,
                                                width: 40,
                                                cssClass: "cell-title"
                                            }, )
                                        }

                                        grid2.setColumns(columns);
                                        // data.Result.Datasets.forEach(item => console.log(item.Subscription))
                                        grid2.setData(DatasetsOfDatasourceSet.source.localdata);

                                        dataView2.beginUpdate();
                                        dataView2.setItems(DatasetsOfDatasourceSet.source.localdata, "id");
                                        dataView2.endUpdate();
                                        refreshPagination();

                                        grid2.invalidate();
                                        grid2.render();

                                        var toggled = getCookie('btnHideAdditInfo2');
                                        // var tab = getParameterByName('tab');
                                        // if(tab == "favorites"){
                                        if (toggled == 'true') {
                                            showAdditInfo(2);
                                        } else {
                                            hideAdditInfo(2);
                                        }
                                        // }
                                    }, null, () => {
                                        // $('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');
                                    }, false);
                            } else {
                                // $('#gridDatasetsOfDatasource').jqxGrid('clear');
                            }

                            var item = $('#jstreeCategoriesList').jstree(true).get_selected("full", true)[0];
                            if (item)
                                document.getElementById(item.id).children[1].style.color = "white";

                            let treeItems = $('#jstreeCategoriesList').jstree(true).get_json('#', {
                                flat: true
                            });
                            for (let j in treeItems) {
                                if (treeItems[j].id == item.id)
                                    continue;
                                let splitted = treeItems[j].text.split("[")
                                let element = document.getElementById(treeItems[j].id);
                                if (splitted.length > 1) {
                                    let subnode = splitted[1].replace("]", "")
                                    if (subnode !== "All Categories") {
                                        for (let k in userRecords) {
                                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0, 2) : userRecords[k].text.slice(0, 3);
                                            if (subnode !== available_category && element != null) {
                                                //element.style.color = "#aaa" 
                                                element.children[1].style.color = "#aaa";
                                            }
                                        }
                                    }
                                } else {
                                    if (element != null && element.children[1]) {
                                        element.children[1].style.color = "#aaa";
                                    }
                                }
                            }

                            for (let j in treeItems) {
                                if (treeItems[j].id == item.id)
                                    continue;
                                let splitted = treeItems[j].text.split("[")
                                let categories1 = treeElements[j].value.split(",")
                                let element = document.getElementById(treeItems[j].id);
                                for (let m of categories1) {
                                    for (let o in userRecords) {
                                        if (userRecords[o].text.split(" ")[0] === m) {
                                            if (element != null && element.children[1])
                                                element.children[1].style.color = "black";
                                        }
                                    }
                                }
                                if (splitted.length > 1) {
                                    let subnode = splitted[1].replace("]", "")
                                    if (subnode !== "All Categories") {
                                        for (let k in userRecords) {
                                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0, 2) : userRecords[k].text.slice(0, 3);
                                            if (element != null && subnode === available_category) {
                                                element.children[0].style.color = "black";
                                            }
                                        }
                                    }
                                }
                            }
                        });

                        var attachCategoriesContextMenu = function() {
                            $("#jqxCategoriesMenu").css("opacity", 1);

                            // open the context menu when the user presses the mouse right button.
                            $("#jstreeCategoriesList").bind('contextmenu', function(e) {
                                return false
                            });

                            // open the context menu when the user presses the mouse right button.
                            $("#jstreeCategoriesList").on('mousedown', function(event) {
                                var target = $(event.target).parents('li:first')[0];
                                var rightClick = isRightClick(event);
                                if (rightClick && target != null) {
                                    $("#jstreeCategoriesList").jstree().deselect_all(true);
                                    $('#jstreeCategoriesList').jstree(true).select_node(target);
                                    var scrollTop = $(window).scrollTop();
                                    var scrollLeft = $(window).scrollLeft();
                                    return false;
                                }
                            });
                        }
                        attachCategoriesContextMenu();

                        $("#jqxCategoriesMenu").on('itemclick', function(event) {
                            var item = $.trim($(event.args).text());
                            switch (item) {
                                case "Open All":
                                    $('#jstreeCategoriesList').jstree('open_all');
                                    attachCategoriesContextMenu();
                                    break;
                                case "Close All":
                                    $('#jstreeCategoriesList').jstree('close_all');
                                    attachCategoriesContextMenu();
                                    break;
                            }
                        });

                        function isRightClick(event) {
                            var rightclick;
                            if (!event) var event = window.event;
                            if (event.which) rightclick = (event.which == 3);
                            else if (event.button) rightclick = (event.button == 2);
                            return rightclick;
                        }

                        $('#jstreeCategoriesList').on('loaded.jstree', function() {
                            let listItems = $('#jstreeCategoriesList').jstree(true).get_json('#', {
                                flat: true
                            });
                            for (let j in listItems) {
                                document.getElementById(listItems[j].id).children[0].style.width = "5px";
                                let element = document.getElementById(listItems[j].id);
                                if (listItems[j].text !== "[All Categories]") {
                                    let value = listItems[j].text.split(" ")[0]
                                    for (let m of userRecords) {
                                        if (value !== m.text.split(" ")[0]) {
                                            element.children[1].style.color = "#aaa";
                                        }
                                    }
                                }
                            }

                            for (let j in listItems) {
                                let element = document.getElementById(listItems[j].id);
                                if (listItems[j].text !== "[All Categories]") {
                                    let value = listItems[j].text.split(" ")[0]
                                    for (let m of userRecords) {
                                        if (value === m.text.split(" ")[0]) {
                                            element.children[1].style.color = "black";
                                        }
                                    }
                                }
                            }
                        });
                    }
                    treeCreated = true;
                }

                $(".tree-loading").hide();
            }

            function copySeriesToFavorite() {
                var indexes = grid2.getSelectedRows();
                if (indexes.length < 1) return;
                var duplicates = [];

                for (var i = 0; i < indexes.length; i++) {
                    var row = grid2.getDataItem(indexes[i]);
                    if (row.Favorite == true) duplicates.push(row.Symbol);
                }

                if (duplicates.length > 0) {
                    var h = duplicates.length == 1 ? 'was' : 'were';
                    functionNotificationMessage({
                        text: 'Series: ' + duplicates.join(',') + ' ' + h + ' already marked as "Favorites"'
                    });
                } else {
                    dialogWindow("Do you want to add " + indexes.length + " series to favorites list?", "query", "confirm", null,
                        async() => {
                            var series = [];
                            var userRecords1 = DatasetsOfDatasourceSet.source.UserCategoryList;
                            var count_cc = 0;
                            for (var i = 0; i < indexes.length; i++) {
                                var item = grid2.getDataItem(indexes[i]);

                                folderStructure[0].value.items.push({
                                    Datasource: item.Datasource,
                                    Datacategory: item.Datacategory,
                                    Symbol: item.Symbol
                                });

                                let isExist = false;
                                for (var f in userFavorites) {
                                    if (userFavorites[f].Symbol == item.Symbol) {
                                        isExist = true;
                                    }
                                }
                                if (!isExist) {
                                    if (item.Datacategory !== undefined && item.Datacategory !== "") {
                                        for (let k in userRecords1) {
                                            let available_category = userRecords1[k].text[2] === " " ? userRecords1[k].text.slice(0, 2) : userRecords1[k].text.slice(0, 3);
                                            if (item.Datacategory === available_category) {
                                                series.push(item.Datasource + '/' + item.Datacategory + '/' + item.Symbol);
                                            }
                                        }
                                    } else series.push(item.Datasource + '/' + item.Symbol);
                                    userFavorites.push(item);

                                    // userDeletedFavorites = jQuery.grep(userDeletedFavorites, function(n) {
                                    //     return n['Symbol'] != item.Symbol;   //or n[1] for second item in two item array
                                    // });
                                }
                            }

                            if (series.length > 0) {
                                call_api_ajax('AddUserFavoriteDatasets', 'get', {
                                        SessionToken: getSession(),
                                        "Series[]": series
                                    }, true,
                                    () => {
                                        for (var i = 0; i < indexes.length; i++) {
                                            var item = grid2.getDataItem(indexes[i]);
                                            item.Favorite = true;
                                            grid2.updateCell(indexes[i], 1);
                                        }

                                        functionNotificationMessage({
                                            text: "You have successfully added " + indexes.length + " series to your Favorites list"
                                        });
                                    }, null, () => {
                                        // $('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');
                                    });

                                // item.Favorite = true;
                                // grid2.updateCell(indexes[i], 1);

                                if (activeGrid_active) {
                                    setTimeout(() => {
                                        refreshFavouritesGrid();
                                    }, 100);
                                }

                                // if (series.length > 0)


                                folderStructure1 = await createFolderStructure(objectFavorites, getSession());
                                $('#jsreeFavorites').jstree("destroy").empty();
                                $('#jsreeFavorites').jstree({
                                    "core": {
                                        "data": folderStructure1,
                                        "check_callback": true,
                                    },
                                    "plugins": ["dnd"]
                                }).on('loaded.jstree', async function() {
                                    let treeNodes = $('#jsreeFavorites').jstree(true).get_json('#', {
                                        flat: true
                                    });
                                    var node = $('#jsreeFavorites').jstree(true).get_node(treeNodes[0].id);
                                    $('#jsreeFavorites').jstree(true).select_node(treeNodes[0]);

                                    setTimeout(() => {
                                        $('#jsreeFavorites').on("select_node.jstree", function(e, data) {
                                            sourceTreeItem = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                            var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                            if (item.original.value.root == true) {
                                                $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', true);
                                                $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', true);
                                                $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', true);
                                                $("#btnDeleteFolder").jqxButton({
                                                    disabled: true
                                                });
                                                $("#btnRenameFolder").jqxButton({
                                                    disabled: true
                                                });
                                            } else {
                                                $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', false);
                                                $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', false);
                                                $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', false);
                                                $("#btnDeleteFolder").jqxButton({
                                                    disabled: false
                                                });
                                                $("#btnRenameFolder").jqxButton({
                                                    disabled: false
                                                });
                                            }
                                        });
                                    }, 200);

                                    // refreshFavouritesGrid();

                                    activeJqxgridDragAndDropInit();

                                    call_api_ajax('DeleteRemovedUserFavoriteDatasets', 'get', {
                                        SessionToken: getSession(),
                                        "Series[]": series
                                    }, true, async() => {
                                        if (disactiveGrid_active) {
                                            var userDeletedFavorites = await getDeletedUserFavorites(getSession());
                                            for (var i = 0; i < indexes.length; i++) {
                                                var item = grid2.getDataItem(indexes[i]);
                                                userDeletedFavorites = jQuery.grep(userDeletedFavorites, function(n) {
                                                    return n['Symbol'] != item.Symbol; //or n[1] for second item in two item array
                                                });
                                            }
                                            disactiveSource.localdata = userDeletedFavorites;
                                            var isCategory = false;
                                            for (var i = 0; i < disactiveSource.localdata.length; i++) {
                                                disactiveSource.localdata[i].id = "id_" + i;
                                                disactiveSource.localdata[i].num = (i + 1);
                                                disactiveSource.localdata[i].Favorite = "";
                                                if (disactiveSource.localdata[i].Datacategory != undefined)
                                                    var isCategory = true;
                                            }

                                            var columns = [{
                                                    id: "datasource",
                                                    name: 'Datasource',
                                                    field: 'Datasource',
                                                    minwidth: 30,
                                                    cssClass: "cell-title",
                                                    width: 100,
                                                    sortable: true,
                                                    formatter: databaseColumnRender
                                                },
                                                {
                                                    id: "symbol",
                                                    name: 'Symbol',
                                                    field: 'Symbol',
                                                    minwidth: 10,
                                                    width: 100,
                                                    formatter: symbol_renderer,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "name",
                                                    name: 'Name',
                                                    field: 'Name',
                                                    minwidth: 20,
                                                    width: 690,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "frequency",
                                                    name: 'Frequency',
                                                    field: 'Frequency',
                                                    minwidth: 10,
                                                    width: 80,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "from",
                                                    name: 'From',
                                                    field: 'StartDate',
                                                    filtertype: 'range',
                                                    cellsformat: 'yyyy-MM-dd',
                                                    minwidth: 10,
                                                    width: 80,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "to",
                                                    name: 'To',
                                                    field: 'EndDate',
                                                    width: 80,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "values",
                                                    name: '# Prices',
                                                    field: 'Values',
                                                    minwidth: 10,
                                                    width: 80,
                                                    sortable: true,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "currency",
                                                    name: 'Currency',
                                                    field: 'Currency',
                                                    sortable: false,
                                                    minwidth: 10,
                                                    width: 75,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "decimals",
                                                    name: 'Decimals',
                                                    field: 'Decimals',
                                                    sortable: false,
                                                    minwidth: 10,
                                                    width: 65,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "unit",
                                                    name: 'Unit',
                                                    field: 'Unit',
                                                    sortable: false,
                                                    minwidth: 10,
                                                    width: 50,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "conversions",
                                                    name: 'Conversions',
                                                    field: 'Conversions',
                                                    sortable: false,
                                                    minwidth: 10,
                                                    width: 50,
                                                    cssClass: "cell-title"
                                                },
                                                {
                                                    id: "additional",
                                                    name: 'Additional',
                                                    field: 'Additional',
                                                    sortable: false,
                                                    minwidth: 10,
                                                    width: 150,
                                                    cssClass: "cell-title",
                                                    formatter: additional_renderer
                                                }
                                            ];

                                            if (isCategory) {
                                                columns.splice(1, 0, {
                                                    id: 'cat',
                                                    name: 'Cat.',
                                                    field: 'Datacategory',
                                                    minwidth: 10,
                                                    width: 40,
                                                    cssClass: "cell-title"
                                                }, )
                                            }

                                            grid3.setColumns(columns);
                                            grid3.setData(disactiveSource.localdata);
                                            dataView3.beginUpdate();
                                            dataView3.setItems(disactiveSource.localdata, "id");
                                            dataView3.endUpdate();
                                            dataView3.refresh();

                                            grid3.invalidate();
                                            grid3.render();

                                            grid3.setSelectedRows([]);

                                            var toggled = getCookie('btnHideAdditInfo3');
                                            if (toggled == 'true') {
                                                showAdditInfo(3);
                                            } else {
                                                hideAdditInfo(3);
                                            }
                                        }
                                    });
                                });
                            } else {
                                if (item.Datacategory !== undefined && item.Datacategory !== "") {
                                    functionNotificationMessage({
                                        text: "You cannot add symbol '" + item.Symbol + "' as you have no access to category '" + item.Datacategory + "'",
                                        type: 'error'
                                    });
                                }
                            }
                        });
                }
            }

            function removeSeriesFromFavorites() {
                var rowsindexes = grid2.getSelectedRows();

                rowsindexes.sort(function(a, b) {
                    return a - b;
                });

                dialogWindow("Remove " + rowsindexes.length + " series from your Favorites list?", "query", "confirm", null, () => {
                    var deleted = [],
                        deleted_symbol = [],
                        rows_data = [];
                    for (var i = 0; i < rowsindexes.length; i++) {
                        var row = grid2.getDataItem(rowsindexes[i]);

                        if (row.Datacategory !== undefined)
                            deleted.push(row.Datasource + '/' + row.Datacategory + '/' + row.Symbol);
                        else
                            deleted.push(row.Datasource + '/' + row.Symbol);

                        deleted_symbol.push(row.Symbol);
                        rows_data.push(row);
                    }

                    call_api_ajax('RemoveUserFavoriteDatasets', 'get', {
                        SessionToken: getSession(),
                        "Series[]": deleted
                    }, true, async() => {
                        let data = userFavorites,
                            new_data = [];

                        if (data !== undefined) {
                            var new_deleted = [];
                            data.map((e, i) => {
                                let isExist = false;
                                new_deleted = deleted_symbol.map((symbol) => {
                                    if (e.Symbol == symbol)
                                        isExist = true;

                                    return symbol;
                                });

                                if (!isExist) new_data.push(e);
                            });

                            rows_data.forEach(function(row, i, indexes1) {
                                if (row.Favorite == true) {
                                    row.Favorite = false;
                                    dataView2.updateItem(row.id, row);
                                }
                            });

                            userFavorites = new_data;

                            if (activeGrid_active) {
                                var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                // refreshTreeFolders();
                                refreshFavouritesGrid();
                                // var n = 'folder ' + item.value.name;
                                // if (item.value.root == true)
                                //     n = 'your Favorites list';
                            }

                            if (disactiveGrid_active) {
                                userDeletedFavorites = userDeletedFavorites.concat(rows_data);
                                disactiveSource.localdata = userDeletedFavorites;
                                // $("#disactiveJqxgrid").jqxGrid('updatebounddata', 'cells');
                                grid3.render();
                            }

                            var singleCase = deleted.length == 1 ? " has" : "s have";
                            functionNotificationMessage({
                                text: deleted.length + ' symbol' + singleCase + ' been removed from favorites list',
                                type: "info"
                            });

                            objectFavorites.Datasets = userFavorites;
                            folderStructure1 = await createFolderStructure(objectFavorites, getSession());
                            $('#jsreeFavorites').jstree("destroy").empty();
                            $('#jsreeFavorites').jstree({
                                "core": {
                                    "data": folderStructure1,
                                    "check_callback": true,
                                },
                                "plugins": ["dnd"]
                            }).on('loaded.jstree', async function() {
                                let treeNodes = $('#jsreeFavorites').jstree(true).get_json('#', {
                                    flat: true
                                });
                                var node = $('#jsreeFavorites').jstree(true).get_node(treeNodes[0].id);
                                $('#jsreeFavorites').jstree(true).select_node(treeNodes[0]);

                                setTimeout(() => {
                                    $('#jsreeFavorites').on("select_node.jstree", function(e, data) {
                                        sourceTreeItem = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                        var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                        if (item.original.value.root == true) {
                                            $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', true);
                                            $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', true);
                                            $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', true);
                                            $("#btnDeleteFolder").jqxButton({
                                                disabled: true
                                            });
                                            $("#btnRenameFolder").jqxButton({
                                                disabled: true
                                            });
                                        } else {
                                            $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', false);
                                            $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', false);
                                            $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', false);
                                            $("#btnDeleteFolder").jqxButton({
                                                disabled: false
                                            });
                                            $("#btnRenameFolder").jqxButton({
                                                disabled: false
                                            });
                                        }
                                    });
                                }, 200);

                                // refreshFavouritesGrid();
                            });
                        }
                    });
                });
            }
        }
        /* =============== End gridDatasetsOfDatasource ==================*/

        /* =================== disactiveJqxgrid ==================== */
        async function disactiveGrid() {
            var disactiveGroupsrenderer = function(text, group, expanded, data) {
                if (data.groupcolumn.datafield == 'alias') {
                    if (imagesMap.get(data.subItems[0].alias))
                        databaseImage = imagesMap.get(data.subItems[0].alias);
                    else
                        databaseImage = 'default_white.png';

                    return '<div class="' + toThemeProperty('jqx-grid-groups-row') + '" id="disactive-renderer">' +
                        '<img src="resources/css/icons/databases/' + databaseImage + '">' +
                        '<span> ' + namesMap.get(data.subItems[0].alias) + '</span></div>';
                }
            }
            var dataFieldsDisactive = [{
                name: 'DateTime',
                type: 'string'
            }];
            dataFieldsDisactive = dataFieldsDisactive.concat(baseDataFields);

            userDeletedFavorites = await getDeletedUserFavorites(getSession());

            disactiveSource = {
                datatype: "json",
                datafields: dataFieldsDisactive,
                localdata: userDeletedFavorites
            };

            var lastColumn = [{
                id: 'dateTime',
                name: 'Removed Date',
                field: 'DateTime',
                width: 140,
                cssClass: "cell-title"
            }];
            var columnsDisactive = baseGridColumns.concat(lastColumn);


            var isCategory = false;
            // favoritesGridSource.localdata.forEach(function (e, index) {
            //     if ((e.Symbol.search(filterOfURL) != -1 || e.Name.search(filterOfURL) != -1) && filterOfURL !== "undefined") searchArray.push(e)

            //     if(e.Datacategory != undefined) isCategory = true;
            // });

            // favoritesGridSource.localdata = searchArray;
            // // favoritesGridDataAdapter = new $.jqx.dataAdapter(favoritesGridSource);

            // var activeColumns = baseGridColumns;

            // console.log(favoritesGridSource.localdata);

            var new_array = [];
            for (var item in columnsDisactive) {
                for (var elm in activeGridColumns) {
                    if (columnsDisactive[item].name == activeGridColumns[elm].name)
                        new_array.push(columnsDisactive[item]);
                }
            }
            columnsDisactive = new_array;

            function isIEPreVer9() {
                var v = navigator.appVersion.match(/MSIE ([\d.]+)/i);
                return (v ? v[1] < 9 : false);
            }

            function CreateAddHeaderRow() {

                // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                var fullWidthFlag = true;
                let img = (!fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                let footer_width = (!fullWidthFlag) ? '1230px' : '1230px';

                // $("#main-footer").width(footer_width);
                // $(".fixpage").toggleClass('fullscreen', !fullWidthFlag);
                // $("section .wrap").toggleClass('fullscreen', !fullWidthFlag);
                // resizeColumns('disactiveJqxgrid');

                $("#btnHideAdditInfo_deleted").jqxToggleButton({
                    imgSrc: "resources/css/icons/table_plus.png",
                    imgPosition: "center",
                    height: 28,
                    width: 25,
                    imgWidth: 18,
                    imgHeight: 18,
                });
                $("#btnHideAdditInfo_deleted img, #btnHideAdditInfo_deleted span").css("top", 6);

                $("#fullWidth1").jqxButton({
                    imgSrc: "resources/css/icons/" + img + ".png",
                    imgPosition: "left",
                    width: 25,
                    height: 28,
                    imgWidth: 18,
                    imgHeight: 18,
                    textPosition: "right"
                });
                $("#fullWidth1 img, #fullWidth1 span").css("top", 6);

                $("#btnRemove").jqxButton({
                    imgSrc: "resources/css/icons/delete_16.ico",
                    imgPosition: "left",
                    width: 68,
                    height: 28,
                    imgWidth: 18,
                    imgHeight: 18,
                    textPosition: "right"
                });
                $("#btnRemove img, #btnRemove span").css("top", 6);

                $("#btnRestore").jqxButton({
                    imgSrc: "resources/css/icons/refreshfav.png",
                    imgPosition: "left",
                    width: 155,
                    height: 28,
                    imgWidth: 18,
                    imgHeight: 18,
                    textPosition: "right"
                });
                $("#btnRestore img, #btnRestore span").css("top", 6);

                // Tooltips
                $("#btnRemove").tooltip();
                $("#fullWidth1").tooltip();
                $("#btnHideAdditInfo_deleted").tooltip();

                $("#fullWidth1").on('click', function() {
                    // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                    img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                    footer_width = (fullWidthFlag) ? '100%' : '1230px';
                    footer_posLeft = (fullWidthFlag) ? '0' : '';

                    $(".footerbar").css("max-width", footer_width);
                    $(".footerbar").css("left", footer_posLeft);

                    // $("#main-footer").width(footer_width);
                    $(".fullWidthPage").jqxButton({
                        imgSrc: "resources/css/icons/" + img + ".png",
                        imgPosition: "left",
                        width: 25,
                        height: 24,
                        textPosition: "right"
                    });
                    $(".fullWidthPage img, .fullWidthPage span").css("top", 5);
                    $(".fixpage").toggleClass('fullscreen', fullWidthFlag);

                    fullWidthFlag = !fullWidthFlag;
                    window.dispatchEvent(new Event('resize'));

                    var toggled = getCookie('btnHideAdditInfo3');
                    if (toggled == 'true') {
                        showAdditInfo(3);
                    } else {
                        hideAdditInfo(3);
                    }
                    // resizeColumns('disactiveJqxgrid');
                });

                $("#btnRemove").on('click', function() {
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        var getselectedrowindexes = grid3.getSelectedRows();
                        if (getselectedrowindexes.length == 0) return;
                        var message;

                        if (getselectedrowindexes.length > 1)
                            message = "Are you sure you want to delete " + getselectedrowindexes.length + " series?";

                        else if (getselectedrowindexes.length > 0) {
                            var row = grid3.getDataItem(getselectedrowindexes[0]);
                            let data = row.Datasource + "/" + row.Symbol;
                            if (row.Datacategory !== undefined)
                                data = row.Datasource + "/" + row.Datacategory + "/" + row.Symbol;
                            message = "Are you sure you want to delete " + data + " series?";
                        }

                        dialogWindow(message, 'warning', 'confirm', null, () => {
                            var rowsindexes = grid3.getSelectedRows();
                            if (rowsindexes.length < 1) return;
                            rowsindexes.sort(function(a, b) {
                                return a - b;
                            });

                            var short_elems = [],
                                count_cc = 0;
                            for (var i = 0; i < rowsindexes.length; i++) {
                                var ind = rowsindexes[i];
                                var elem = grid3.getDataItem(ind);

                                var ind = rowsindexes[i];
                                userDeletedFavorites.splice(ind - count_cc, 1);
                                count_cc++;

                                if (elem.Datacategory !== undefined)
                                    short_elems.push(elem.Datasource + '/' + elem.Datacategory + '/' + elem.Symbol);
                                else
                                    short_elems.push(elem.Datasource + '/' + elem.Symbol);
                            }
                            call_api_ajax('DeleteRemovedUserFavoriteDatasets', 'get', {
                                SessionToken: getSession(),
                                "Series[]": short_elems
                            }, true, () => {

                                disactiveSource.localdata = userDeletedFavorites;
                                var isCategory = false;
                                for (var i = 0; i < disactiveSource.localdata.length; i++) {
                                    disactiveSource.localdata[i].id = "id_" + i;
                                    disactiveSource.localdata[i].num = (i + 1);
                                    disactiveSource.localdata[i].Favorite = "";
                                    if (disactiveSource.localdata[i].Datacategory != undefined)
                                        var isCategory = true;
                                }

                                var columns = [{
                                        id: "datasource",
                                        name: 'Datasource',
                                        field: 'Datasource',
                                        minwidth: 30,
                                        cssClass: "cell-title",
                                        width: 100,
                                        sortable: true,
                                        formatter: databaseColumnRender
                                    },
                                    {
                                        id: "symbol",
                                        name: 'Symbol',
                                        field: 'Symbol',
                                        minwidth: 10,
                                        width: 100,
                                        formatter: symbol_renderer,
                                        sortable: true,
                                        cssClass: "cell-title"
                                    },
                                    {
                                        id: "name",
                                        name: 'Name',
                                        field: 'Name',
                                        minwidth: 20,
                                        width: 690,
                                        sortable: true,
                                        cssClass: "cell-title"
                                    },
                                    {
                                        id: "frequency",
                                        name: 'Frequency',
                                        field: 'Frequency',
                                        minwidth: 10,
                                        width: 80,
                                        sortable: true,
                                        cssClass: "cell-title"
                                    },
                                    {
                                        id: "from",
                                        name: 'From',
                                        field: 'StartDate',
                                        filtertype: 'range',
                                        cellsformat: 'yyyy-MM-dd',
                                        minwidth: 10,
                                        width: 80,
                                        sortable: true,
                                        cssClass: "cell-title"
                                    },
                                    {
                                        id: "to",
                                        name: 'To',
                                        field: 'EndDate',
                                        width: 80,
                                        sortable: true,
                                        cssClass: "cell-title"
                                    },
                                    {
                                        id: "values",
                                        name: '# Prices',
                                        field: 'Values',
                                        minwidth: 10,
                                        width: 80,
                                        sortable: true,
                                        cssClass: "cell-title"
                                    },
                                    {
                                        id: "currency",
                                        name: 'Currency',
                                        field: 'Currency',
                                        sortable: false,
                                        minwidth: 10,
                                        width: 75,
                                        cssClass: "cell-title"
                                    },
                                    {
                                        id: "decimals",
                                        name: 'Decimals',
                                        field: 'Decimals',
                                        sortable: false,
                                        minwidth: 10,
                                        width: 65,
                                        cssClass: "cell-title"
                                    },
                                    {
                                        id: "unit",
                                        name: 'Unit',
                                        field: 'Unit',
                                        sortable: false,
                                        minwidth: 10,
                                        width: 50,
                                        cssClass: "cell-title"
                                    },
                                    {
                                        id: "conversions",
                                        name: 'Conversions',
                                        field: 'Conversions',
                                        sortable: false,
                                        minwidth: 10,
                                        width: 50,
                                        cssClass: "cell-title"
                                    },
                                    {
                                        id: "additional",
                                        name: 'Additional',
                                        field: 'Additional',
                                        sortable: false,
                                        minwidth: 10,
                                        width: 150,
                                        cssClass: "cell-title",
                                        formatter: additional_renderer
                                    }
                                ];

                                if (isCategory) {
                                    columns.splice(1, 0, {
                                        id: 'cat',
                                        name: 'Cat.',
                                        field: 'Datacategory',
                                        minwidth: 10,
                                        width: 40,
                                        cssClass: "cell-title"
                                    }, )
                                }

                                functionNotificationMessage({
                                    text: 'The deletion was successful'
                                });

                                grid3.setColumns(columns);

                                dataView3.beginUpdate();
                                dataView3.setItems(disactiveSource.localdata, "id");
                                dataView3.endUpdate();

                                grid3.invalidate();
                                grid3.render();

                                grid3.setSelectedRows([]);

                                var toggled = getCookie('btnHideAdditInfo3');
                                if (toggled == 'true') {
                                    showAdditInfo(3);
                                } else {
                                    hideAdditInfo(3);
                                }
                            });
                        });
                    }
                });

                $("#btnHideAdditInfo_deleted").on('click', function(event) {
                    var current_grid = "disactiveJqxgrid",
                        id = event.currentTarget.id;
                    setCookie('btnHideAdditInfo3', $('#' + id).jqxToggleButton('toggled'));

                    var toggled = getCookie('btnHideAdditInfo3');
                    if (toggled == 'true') {
                        showAdditInfo(3);
                        document.getElementById(id).title = "Hide additional data columns";
                    } else {
                        hideAdditInfo(3);
                        document.getElementById(id).title = "Show additional data columns";
                    }

                });

                if (showAdditionalInformation3) {
                    $('#btnHideAdditInfo_deleted').jqxToggleButton('toggle');
                } else {}

                $("#btnRestore").on('click', restoreFavorite);
                $("#btnDelAutosize").jqxButton({
                    imgSrc: "resources/css/icons/autosize.png",
                    imgPosition: "center",
                    width: 25,
                    height: 24,
                    imgWidth: 18,
                    imgHeight: 18,
                });
                $("#btnDelAutosize img, #btnDelAutosize span").css("top", 7);
                $("#btnDelAutosize").tooltip();
                $("#btnDelAutosize").on('click', function() {
                    var toggled = getCookie('btnHideAdditInfo3');
                    if (toggled == 'true') {
                        showAdditInfo(3);
                    } else {
                        hideAdditInfo(3);
                    }
                });
            }

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
                grid3.setTopPanelVisibility(!grid3.getOptions().showTopPanel);
            }

            $(function() {
                // prepare the data
                for (var i = 0; i < disactiveSource.localdata.length; i++) {
                    disactiveSource.localdata[i].id = "id_" + i;
                    disactiveSource.localdata[i].num = (i + 1);
                    // disactiveSource.localdata[i].Favorite = "false";
                    if (disactiveSource.localdata[i].Datacategory != undefined) isCategory = true;
                }

                if (isCategory)
                    columnsDisactive.splice(1, 0, {
                        id: 'cat',
                        name: 'Cat.',
                        field: 'Datacategory',
                        minwidth: 10,
                        width: 40,
                        cssClass: "cell-title"
                    }, )

                dataView3 = new Slick.Data.DataView({
                    inlineFilters: true
                });
                grid3 = new Slick.Grid("#disactiveJqxgrid", dataView3, columnsDisactive, options);
                grid3.setSelectionModel(new Slick.RowSelectionModel());

                // var pager = new Slick.Controls.Pager(dataView3, grid3, $("#pager2"));
                // var columnpicker = new Slick.Controls.ColumnPicker(columnsDisactive, grid3, options);

                // move the filter panel defined in a hidden div into grid top panel
                $("#inlineFilterPanel")
                    .appendTo(grid3.getTopPanel())
                    .show();

                grid3.onCellChange.subscribe(function(e, args) {
                    dataView3.updateItem(args.item.id, args.item);
                });

                grid3.onClick.subscribe(function(e, args) {
                    if (args.grid.getColumns()[1].name == "Cat.") {
                        if (args.cell == 2) {
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                item = dataView3.getItem(args.row);
                                openSeriesInNewTab(item.Datasource, item.Symbol, item.Datacategory);
                            }
                        }
                        if (args.cell == 12) {
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                item = dataView3.getItem(args.row);
                                var txt = JSON.stringify(item.Additional);
                                // $(".popup-content").html( txt )
                                if (item.Additional != undefined) {
                                    if (item.Subscription == "None") {
                                        if (item.IsCategoryDS) {
                                            msg = "You do not have access to the " + item.Datasource + " data category " + item.Datacategory + " or its values.";
                                        } else {
                                            msg = "You do not have access to the datasource " + item.Datasource + " or its values."
                                        }
                                        dialogWindow(msg, "error");
                                    } else {
                                        setCookie('additionalJSON' + args.row, txt);
                                        JqxPopup(args.row, item.Symbol);
                                    }
                                }
                            }
                        }
                    } else {
                        if (args.cell == 1) {
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                item = dataView3.getItem(args.row);
                                openSeriesInNewTab(item.Datasource, item.Symbol, item.Datacategory);
                            }
                        }

                        if (args.cell == 11) {
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                item = dataView3.getItem(args.row);
                                var txt = JSON.stringify(item.Additional);
                                // $(".popup-content").html( txt )
                                if (item.Additional != undefined) {
                                    if (item.Subscription == "None") {
                                        if (item.IsCategoryDS) {
                                            msg = "You do not have access to the " + item.Datasource + " data category " + item.Datacategory + " or its values.";
                                        } else {
                                            msg = "You do not have access to the datasource " + item.Datasource + " or its values."
                                        }
                                        dialogWindow(msg, "error");
                                    } else {
                                        setCookie('additionalJSON' + args.row, txt);
                                        JqxPopup(args.row, item.Symbol);
                                    }
                                }
                            }
                        }
                    }
                });

                grid3.onContextMenu.subscribe(function(e) {
                    e.preventDefault();
                    var cell = grid3.getCellFromEvent(e);
                    var indexes = grid3.getSelectedRows()
                    indexes.push(cell.row);
                    grid3.setSelectedRows(indexes)

                    $("#disactiveJqxgridMenu")
                        .data("row", cell.row)
                        .css("top", e.pageY)
                        .css("left", e.pageX)
                        .show();

                    $("body").one("click", function() {
                        $("#disactiveJqxgridMenu").hide();
                    });
                });

                grid3.onAddNewRow.subscribe(function(e, args) {
                    var item = {
                        "num": data.length,
                        "id": "new_" + (Math.round(Math.random() * 10000)),
                        "title": "New task",
                        "duration": "1 day",
                        "percentComplete": 0,
                        "start": "01/01/2009",
                        "finish": "01/01/2009"
                    };
                    $.extend(item, args.item);
                    dataView3.addItem(item);
                });

                grid3.onKeyDown.subscribe(function(e) {
                    // select all rows on ctrl-a
                    if (e.which != 65 || !e.ctrlKey) {
                        return false;
                    }

                    var rows = [];
                    for (var i = 0; i < dataView3.getLength(); i++) {
                        rows.push(i);
                    }

                    grid3.setSelectedRows(rows);
                    e.preventDefault();
                });

                grid3.onSort.subscribe(function(e, args) {
                    sortdir = args.sortCols[0].sortAsc ? 1 : -1;
                    sortcol = args.sortCols[0].sortCol.field;

                    if (isIEPreVer9()) {
                        // using temporary Object.prototype.toString override
                        // more limited and does lexicographic sort only by default, but can be much faster

                        alert(args.sortCols[0].sortAsc);
                        var percentCompleteValueFn = function() {
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
                        dataView3.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortCols[0].sortAsc);
                    } else {
                        // using native sort with comparer
                        // preferred method but can be very slow in IE with huge datasets
                        dataView3.sort(comparer, args.sortCols[0].sortAsc);
                    }
                });

                // wire up model events to drive the grid
                // !! both dataView.onRowCountChanged and dataView.onRowsChanged MUST be wired to correctly update the grid
                // see Issue#91
                dataView3.onRowCountChanged.subscribe(function(e, args) {
                    grid3.updateRowCount();
                    grid3.render();
                });

                dataView3.onRowsChanged.subscribe(function(e, args) {
                    grid3.invalidateRows(args.rows);
                    grid3.render();
                });

                dataView3.onPagingInfoChanged.subscribe(function(e, pagingInfo) {
                    grid3.updatePagingStatusFromView(pagingInfo);

                    // show the pagingInfo but remove the dataView from the object, just for the Cypress E2E test
                    delete pagingInfo.dataView;
                });

                dataView3.onBeforePagingInfoChanged.subscribe(function(e, previousPagingInfo) {
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
                    dataView3.setFilterArgs({
                        percentCompleteThreshold: percentCompleteThreshold,
                        searchString: searchString
                    });
                    dataView3.refresh();
                }

                $("#btnSelectRows").click(function() {
                    if (!Slick.GlobalEditorLock.commitCurrentEdit()) {
                        return;
                    }

                    var rows = [];
                    for (var i = 0; i < 10 && i < dataView3.getLength(); i++) {
                        rows.push(i);
                    }

                    grid3.setSelectedRows(rows);
                });

                grid3.init();

                CreateAddHeaderRow();

                dataView3.beginUpdate();
                dataView3.setItems(disactiveSource.localdata);
                dataView3.setFilterArgs({
                    percentCompleteThreshold: percentCompleteThreshold,
                    searchString: searchString
                });
                dataView3.setFilter(myFilter);
                dataView3.endUpdate();

                // if you don't want the items that are not visible (due to being filtered out
                // or being on a different page) to stay selected, pass 'false' to the second arg
                dataView3.syncGridSelection(grid3, true);

                $("#gridContainer").resizable();

                // if (getCookie('btnHideAdditInfo') != undefined && getCookie('btnHideAdditInfo') == "true") {
                //     showAdditInfo(2);
                //     showAdditionalInformation2 = true;
                // }
                // else {
                //     hideAdditInfo(2);
                //     showAdditionalInformation2 = false;
                // }
                // updateDatasetsOfDatasourceGrid()

                hideAdditInfo(3);
                showAdditionalInformation3 = false;
                // resizeColumns('gridDatasetsOfDatasource');
                $('#disactiveGrid').removeClass('wait');
                // $('#jqxLoader').jqxLoader('close');

                disactiveGrid_active = true;
            })

            // create context menu
            var disactiveJqxgridContextMenu = $("#disactiveJqxgridMenu").jqxMenu({
                width: 160,
                height: 58,
                autoOpenPopup: false,
                mode: 'popup'
            });

            // handle context menu clicks.
            $("#disactiveJqxgridMenu").on('itemclick', async function(event) {
                if (getSession() == undefined || getSession() == "") {
                    openLoginPopup();
                } else {
                    var args = event.args;
                    if ($.trim($(args).text()) == "Restore to Favorites") {
                        $('#btnRestore').click();
                    } else if ($.trim($(args).text()) == "Delete") {
                        $('#btnRemove').click();
                    }
                }
            });

            async function restoreFavorite() {
                var getselectedrowindexes = grid3.getSelectedRows();
                if (getselectedrowindexes.length == 0) return;
                var message;

                if (getselectedrowindexes.length > 1)
                    message = "Are you sure you want to restore " + getselectedrowindexes.length + " series?";

                else if (getselectedrowindexes.length > 0) {
                    var row = grid3.getDataItem(getselectedrowindexes[0]);

                    let data = row.Datasource + "/" + row.Symbol;
                    if (row.Datacategory !== undefined)
                        data = row.Datasource + "/" + row.Datacategory + "/" + row.Symbol;

                    message = "Are you sure you want to restore " + data + " series?";
                }

                dialogWindow(message, 'query', 'confirm', null, () => {
                    _restoreFavorite();
                });
            }

            async function _restoreFavorite() {
                var rowsindexes = grid3.getSelectedRows();
                if (rowsindexes.length < 1) return;
                rowsindexes.sort(function(a, b) {
                    return a - b;
                });

                var elems = {},
                    short_elems = [],
                    short_elems1 = [],
                    long_elems = [],
                    count_cc = 0,
                    dont_exists,
                    deleted_tab = [],
                    existed = 0;

                for (var i = 0; i < rowsindexes.length; i++) {
                    var ind = rowsindexes[i];
                    var elem = grid3.getDataItem(ind);

                    c_index = elem.Datasource + '/' + elem.Datacategory + '/' + elem.Symbol;

                    if (elem.Datacategory == undefined)
                        deleted_tab.push(elem.Datasource + '/' + elem.Symbol);
                    else
                        deleted_tab.push(elem.Datasource + '/' + elem.Datacategory + '/' + elem.Symbol);

                    if (elems[c_index] != undefined) continue; // we skip duplicates in same list
                    dont_exists = userFavorites.every((s) => {
                        if (elem.Category == s.Datacategory && elem.Symbol == s.Symbol && elem.Datasource == s.Datasource)
                            return false;

                        return true;
                    });

                    if (dont_exists == false) {
                        existed++;
                        continue;
                    }
                    elems[c_index] = 1;
                    long_elems.push(elem);

                    if (elem.Datacategory) {
                        short_elems.push(elem.Datasource + '/' + elem.Datacategory + '/' + elem.Symbol);
                        short_elems1.push({
                            Datasource: elem.Datasource,
                            Datacategory: elem.Datacategory,
                            Symbol: elem.Symbol
                        });
                    } else {
                        short_elems.push(elem.Datasource + '/' + elem.Symbol);
                        short_elems1.push({
                            Datasource: elem.Datasource,
                            Symbol: elem.Symbol
                        });
                    }

                }

                if (short_elems.length > 0) {
                    call_api_ajax('AddUserFavoriteDatasets', 'get', {
                        SessionToken: getSession(),
                        "Series[]": short_elems
                    }, true, async() => {

                        call_api_ajax('DeleteRemovedUserFavoriteDatasets', 'get', {
                            SessionToken: getSession(),
                            "Series[]": deleted_tab
                        }, true, () => {
                            if (short_elems.length == 0)
                                message = 'All selected series were already active.';

                            else if (existed != 0 && short_elems.length != 0)
                                message = short_elems.length + ' series ' + were_or_was(short_elems.length) + ' restored correctly<br>' + existed + ' series ' + were_or_was(existed) + ' already active."';

                            else
                                message = 'All selected series were restored: "' + short_elems.length + ' series ' + were_or_was(short_elems.length) + ' restored correctly"'

                            functionNotificationMessage({
                                text: message
                            });

                            for (var i = 0; i < rowsindexes.length; i++) {
                                var ind = rowsindexes[i];
                                userDeletedFavorites.splice(ind - count_cc, 1);
                                count_cc++;
                            }

                            disactiveSource.localdata = userDeletedFavorites;
                            var isCategory = false;
                            for (var i = 0; i < disactiveSource.localdata.length; i++) {
                                disactiveSource.localdata[i].id = "id_" + i;
                                disactiveSource.localdata[i].num = (i + 1);
                                disactiveSource.localdata[i].Favorite = "";
                                if (disactiveSource.localdata[i].Datacategory != undefined)
                                    var isCategory = true;
                            }

                            var columns = [{
                                    id: "datasource",
                                    name: 'Datasource',
                                    field: 'Datasource',
                                    minwidth: 30,
                                    cssClass: "cell-title",
                                    width: 100,
                                    sortable: true,
                                    formatter: databaseColumnRender
                                },
                                {
                                    id: "symbol",
                                    name: 'Symbol',
                                    field: 'Symbol',
                                    minwidth: 10,
                                    width: 100,
                                    formatter: symbol_renderer,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "name",
                                    name: 'Name',
                                    field: 'Name',
                                    minwidth: 20,
                                    width: 690,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "frequency",
                                    name: 'Frequency',
                                    field: 'Frequency',
                                    minwidth: 10,
                                    width: 80,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "from",
                                    name: 'From',
                                    field: 'StartDate',
                                    filtertype: 'range',
                                    cellsformat: 'yyyy-MM-dd',
                                    minwidth: 10,
                                    width: 80,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "to",
                                    name: 'To',
                                    field: 'EndDate',
                                    width: 80,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "values",
                                    name: '# Prices',
                                    field: 'Values',
                                    minwidth: 10,
                                    width: 80,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "currency",
                                    name: 'Currency',
                                    field: 'Currency',
                                    sortable: false,
                                    minwidth: 10,
                                    width: 75,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "decimals",
                                    name: 'Decimals',
                                    field: 'Decimals',
                                    sortable: false,
                                    minwidth: 10,
                                    width: 65,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "unit",
                                    name: 'Unit',
                                    field: 'Unit',
                                    sortable: false,
                                    minwidth: 10,
                                    width: 50,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "conversions",
                                    name: 'Conversions',
                                    field: 'Conversions',
                                    sortable: false,
                                    minwidth: 10,
                                    width: 50,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "additional",
                                    name: 'Additional',
                                    field: 'Additional',
                                    sortable: false,
                                    minwidth: 10,
                                    width: 150,
                                    cssClass: "cell-title",
                                    formatter: additional_renderer
                                }
                            ];

                            if (isCategory) {
                                columns.splice(1, 0, {
                                    id: 'cat',
                                    name: 'Cat.',
                                    field: 'Datacategory',
                                    minwidth: 10,
                                    width: 40,
                                    cssClass: "cell-title"
                                }, )
                            }

                            grid3.setColumns(columns);

                            dataView3.beginUpdate();
                            dataView3.setItems(disactiveSource.localdata, "id");
                            dataView3.endUpdate();

                            grid3.invalidate();
                            grid3.render();

                            grid3.setSelectedRows([]);

                            var toggled = getCookie('btnHideAdditInfo3');
                            if (toggled == 'true') {
                                showAdditInfo(3);
                            } else {
                                hideAdditInfo(3);
                            }
                        });

                        if (activeGrid_active) {
                            objectFavorites = await getUserFavorites(getSession());
                            userFavorites = objectFavorites.Datasets;

                            folderStructure[0].value.items = folderStructure[0].value.items.concat(short_elems);
                            folderStructure1 = await createFolderStructure(objectFavorites, getSession());
                            $('#jsreeFavorites').jstree("destroy").empty();
                            $('#jsreeFavorites').jstree({
                                "core": {
                                    "data": folderStructure1,
                                    "check_callback": true,
                                },
                                "plugins": ["dnd"]
                            }).on('loaded.jstree', async function() {
                                let treeNodes = $('#jsreeFavorites').jstree(true).get_json('#', {
                                    flat: true
                                });
                                var node = $('#jsreeFavorites').jstree(true).get_node(treeNodes[0].id);
                                $('#jsreeFavorites').jstree(true).select_node(treeNodes[0]);

                                $('#jsreeFavorites').on("select_node.jstree", function(e, data) {
                                    sourceTreeItem = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                    var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                    if (item.original.value.root == true) {
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', true);
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', true);
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', true);
                                        $("#btnDeleteFolder").jqxButton({
                                            disabled: true
                                        });
                                        $("#btnRenameFolder").jqxButton({
                                            disabled: true
                                        });
                                    } else {
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', false);
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', false);
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', false);
                                        $("#btnDeleteFolder").jqxButton({
                                            disabled: false
                                        });
                                        $("#btnRenameFolder").jqxButton({
                                            disabled: false
                                        });
                                    }
                                });

                                setTimeout(() => {
                                    refreshFavouritesGrid();
                                }, 200);

                                var text = node.original.value.name + " (" + (folderStructure1[0].value.items.length) + ")";
                                $("#jsreeFavorites").jstree('rename_node', node, text);
                            });
                        }
                    });
                }
            }

            $(window).resize(function() {
                disactiveSource.localdata = userDeletedFavorites;
                var isCategory = false;
                for (var i = 0; i < disactiveSource.localdata.length; i++) {
                    disactiveSource.localdata[i].id = "id_" + i;
                    disactiveSource.localdata[i].num = (i + 1);
                    disactiveSource.localdata[i].Favorite = "";
                    if (disactiveSource.localdata[i].Datacategory != undefined)
                        var isCategory = true;
                }

                var columns = [
                    { id: "datasource", name: 'Datasource', field: 'Datasource', minwidth: 30, cssClass: "cell-title", width: 100, sortable: true, formatter: databaseColumnRender },
                    { id: "symbol", name: 'Symbol', field: 'Symbol', minwidth: 10, width: 100, formatter: symbol_renderer, sortable: true, cssClass: "cell-title" },
                    { id: "name", name: 'Name', field: 'Name', minwidth: 20, width: 690, sortable: true, cssClass: "cell-title" },
                    { id: "frequency", name: 'Frequency', field: 'Frequency', minwidth: 10, width: 80, sortable: true, cssClass: "cell-title" },
                    { id: "from", name: 'From', field: 'StartDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', minwidth: 10, width: 80, sortable: true, cssClass: "cell-title" },
                    { id: "to", name: 'To', field: 'EndDate', width: 80, sortable: true, cssClass: "cell-title" },
                    { id: "values", name: '# Prices', field: 'Values', minwidth: 10, width: 80, sortable: true, cssClass: "cell-title" },
                    { id: "currency", name: 'Currency', field: 'Currency', sortable: false, minwidth: 10, width: 75, cssClass: "cell-title" },
                    { id: "decimals", name: 'Decimals', field: 'Decimals', sortable: false, minwidth: 10, width: 65, cssClass: "cell-title" },
                    { id: "unit", name: 'Unit', field: 'Unit', sortable: false, minwidth: 10, width: 50, cssClass: "cell-title" },
                    { id: "conversions", name: 'Conversions', field: 'Conversions', sortable: false, minwidth: 10, width: 50, cssClass: "cell-title" },
                    { id: "additional", name: 'Additional', field: 'Additional', sortable: false, minwidth: 10, width: 150, cssClass: "cell-title", formatter: additional_renderer }
                ];

                if (isCategory) {
                    columns.splice(1, 0, { id: 'cat', name: 'Cat.', field: 'Datacategory', minwidth: 10, width: 40, cssClass: "cell-title" }, )
                }

                grid3.setColumns(columns);

                dataView3.beginUpdate();
                dataView3.setItems(disactiveSource.localdata, "id");
                dataView3.endUpdate();

                grid3.invalidate();
                grid3.render();

                grid3.setSelectedRows([]);

                var toggled = getCookie('btnHideAdditInfo3');
                if (toggled == 'true') {
                    showAdditInfo(3);
                } else {
                    hideAdditInfo(3);
                }

            });
        }

        /* ============= End disactiveJqxgrid =============== */


        /* =================== Backups =================== */
        var backupsGridDataAdapter;

        $('#backupName').keypress(function(e) {
            if (e.which == 13) {
                createBackup();
                $('#addBackupWindow').dialog('close');
                return false;
            }
        });

        $('#newBackupName').keypress(function(e) {
            if (e.which == 13) {
                editBackup();
                return false;
            }
        });

        async function updateBackupsList() {
            var backupsGridSource = {
                datatype: "json",
                datafields: [{
                        name: 'ActiveDateLabel',
                        type: 'date'
                    },
                    {
                        name: 'AutoSaved',
                        type: 'boolean'
                    },
                    {
                        name: 'ArchiveID',
                        type: 'integer'
                    },
                    {
                        name: 'ArchiveName',
                        type: 'string'
                    },
                    {
                        name: 'Protected',
                        type: 'boolean'
                    }
                ]
            };

            call_api_ajax('GetBackupsList', 'get', {
                SessionToken: getSession()
            }, false, (data) => {
                backupsGridSource.localdata = data.Result;
            });

            for (var i = 0; i < backupsGridSource.localdata.length; i++) {
                backupsGridSource.localdata[i].id = "id_" + i;
                backupsGridSource.localdata[i].num = (i + 1);
            }

            grid4.setData(backupsGridSource.localdata);
            dataView4.beginUpdate();
            dataView4.setItems(backupsGridSource.localdata, "id");
            dataView4.endUpdate();

            grid4.invalidate();
            grid4.render();
        }

        async function showBackupsList() {
            if (!backups_loaded) {
                $('#windowBackups').jqxWindow({
                    showCollapseButton: false,
                    resizable: true,
                    isModal: false,
                    height: '650px',
                    width: '805px',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    autoOpen: false,
                    title:'User Favorite Backups'
                });

                $("#addBackupWindow").dialog({
                    resizable: true,
                    autoOpen: false,
                    height: "auto",
                    width: "auto",
                    modal: true,
                    buttons: {
                        Ok: function() {
                            createBackup();
                            $(this).dialog("close");
                        },
                        Cancel: function() {
                            $(this).dialog("close");
                        }
                    }
                });

                $("#editBackupWindow").dialog({
                    resizable: true,
                    autoOpen: false,
                    height: "auto",
                    width: "auto",
                    modal: true,
                    buttons: {
                        Ok: function() {
                            editBackup();
                        },
                        Cancel: function() {
                            $('#editBackupWindow').find('#newBackupName').val('');
                            $(this).dialog("close");
                        }
                    }
                });
            }
            $('#windowBackups').jqxWindow('open');

            if (!backups_loaded) {
                backups_loaded = true;

                function isIEPreVer9() {
                    var v = navigator.appVersion.match(/MSIE ([\d.]+)/i);
                    return (v ? v[1] < 9 : false);
                }

                function CreateAddHeaderRow() {

                    $("#btnBackupRemove").jqxButton({
                        imgSrc: "resources/css/icons/delete.png",
                        imgPosition: "left",
                        textPosition: "center"
                    });
                    $("#btnBackupCreate").jqxButton({
                        imgSrc: "resources/css/icons/add.png",
                        imgPosition: "left",
                        textPosition: "center"
                    });
                    $("#btnBackupRestore").jqxButton({
                        imgSrc: "resources/css/icons/restore.png",
                        imgPosition: "left",
                        textPosition: "center"
                    });
                    $("#btnBackupEdit").jqxButton({
                        imgSrc: "resources/css/icons/pencil.png",
                        imgPosition: "left",
                        textPosition: "center"
                    });
                    $("#refreshBackup").jqxButton({
                        imgSrc: "resources/css/icons/refresh_16.png",
                        imgPosition: "right",
                        textPosition: "center"
                    });
                    $("#newBackupPadlock").jqxCheckBox({
                        checked: false
                    });

                    $("#btnBackupRemove").on('click', function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            var rows = grid4.getSelectedRows()

                            if (rows.length == 0) {
                                dialogWindow("Please, select at least one backup", "error");
                            } else {
                                var pro = false,
                                    msg = '';
                                rows.forEach(function(item, i, indexes) {
                                    var row = grid4.getDataItem(item);
                                    if (row.Protected) pro = true;
                                });

                                if (pro) {
                                    if (rows.length == 1)
                                        msg = "You must remove protection from this backup before it can be deleted."
                                    else
                                        msg = "You must remove protection from all backups before they can be deleted."

                                    dialogWindow(msg, 'error', null, 'Delete Favorites Backup');
                                    return;
                                } else {
                                    if (rows.length == 1) {
                                        var row = grid4.getDataItem(rows[0]);
                                        dialogWindow('You are about to delete backup #' + row.ArchiveID + ', "' + row.ArchiveName + '".<br>If you delete this backup it cannot be recovered.<br><br>Do you want to continue?',
                                            'warning', 'confirm', 'Delete Favorites Backup', () => {
                                                deleteBackup();
                                            });
                                    } else {
                                        dialogWindow('You are about to delete backup ' + rows.length + ' backup files.<br>If you delete them, they cannot be recovered.<br><br>Do you want to continue?',
                                            'warning', 'confirm', 'Delete Favorites Backup', () => {
                                                deleteBackup();
                                            });
                                    }
                                    $("#deleteBackupWindowBtn").focus();
                                }

                            }
                        }
                    });

                    $("#refreshBackup").on('click', function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            updateBackupsList();
                        }
                    });

                    $("#btnBackupCreate").on('click', function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            $("#backupPadlock").prop('checked', false);
                            $("#backupName").val('');
                            $('#addBackupWindow').dialog('open');
                            $("#backupName").focus();
                        }
                    });

                    $("#btnBackupRestore").on('click', function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            var getselectedrowindexes = grid4.getSelectedRows();

                            if (getselectedrowindexes.length == 0) {
                                dialogWindow("Please, select at least one backup", "error");
                            } else if (getselectedrowindexes.length > 1) {
                                dialogWindow('Restore only works when one backup is selected.', 'error');
                            } else {
                                var row = grid4.getDataItem(getselectedrowindexes[0]);
                                dialogWindow('You are about to restore backup #' + row.ArchiveID + ', "' + row.ArchiveName + '".<br>Your existing favourites list and folders will be overwritten.<br><br>Do you want to continue?',
                                    'warning', 'confirm', 'Restore Favorites', () => {
                                        restoreBackup();
                                    });
                            }
                        }
                    });

                    $("#btnBackupEdit").on('click', function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            var getselectedrowindexes = grid4.getSelectedRows();
                            if (getselectedrowindexes.length == 0)
                                return;

                            else if (getselectedrowindexes.length == 1) {
                                var row = grid4.getDataItem(getselectedrowindexes[0]);
                                $('#multipleBackup').hide();
                                $('#singleBackup').show();

                                $("#newBackupPadlock").jqxCheckBox({
                                    checked: row.Protected
                                });
                                $('#editBackupWindow > span').text(row.ArchiveID);
                                $('#newBackupName').val(row.ArchiveName);
                                $('#oldBackupName').text(row.ArchiveName);
                                $('#editBackupWindow').dialog('open');
                                $("#newBackupName").focus();
                            } else if (getselectedrowindexes.length > 1) {
                                $('#singleBackup').hide();
                                $('#multipleBackup').show();
                                $('#oldBackupName  #rowsLength').text(getselectedrowindexes.length);

                                let check_protect = [];
                                for (var i in getselectedrowindexes) {
                                    var row = grid4.getDataItem(getselectedrowindexes[i]);
                                    check_protect.push(row.Protected);
                                }

                                if (check_protect.includes(true) && check_protect.includes(false))
                                    $("#newBackupPadlock").jqxCheckBox({
                                        checked: null
                                    });

                                else if (check_protect.includes(true))
                                    $("#newBackupPadlock").jqxCheckBox({
                                        checked: true
                                    });

                                else if (check_protect.includes(false))
                                    $("#newBackupPadlock").jqxCheckBox({
                                        checked: false
                                    });

                                $('#editBackupWindow').dialog('open');
                            }
                        }
                    });
                }

                // $('#windowBackups').jqxWindow({
                //     title: '<img height="18" width="18" src="resources/css/icons/star_icon.png" id="windowBackup-style"> User Favorite Backups'
                // });

                var backupsGridSource = {
                    datatype: "json",
                    datafields: [{
                            name: 'ActiveDateLabel',
                            type: 'date'
                        },
                        {
                            name: 'AutoSaved',
                            type: 'boolean'
                        },
                        {
                            name: 'ArchiveID',
                            type: 'integer'
                        },
                        {
                            name: 'ArchiveName',
                            type: 'string'
                        },
                        {
                            name: 'Protected',
                            type: 'boolean'
                        }
                    ]
                };

                call_api_ajax('GetBackupsList', 'get', {
                    SessionToken: getSession()
                }, false, (data) => {
                    backupsGridSource.localdata = data.Result;
                });

                var columns = [{
                        id: "bid",
                        name: 'ID',
                        field: 'ArchiveID',
                        cellsalign: 'center',
                        align: 'center',
                        width: 80,
                        sortable: true,
                        cssClass: "cell-title"
                    },
                    {
                        id: "date",
                        name: 'Date',
                        field: 'ActiveDateLabel',
                        cellsformat: 'yyyy-MM-dd hh:mm:ss',
                        minwidth: 100,
                        width: 150,
                        sortable: true,
                        cssClass: "cell-title"
                    },
                    {
                        id: "auto",
                        name: 'Auto',
                        field: 'AutoSaved',
                        formatter: columnData,
                        cellsalign: 'center',
                        align: 'center',
                        width: 40,
                        sortable: true
                    },
                    {
                        id: "backup_lock",
                        name: '<img height="16" width="16" src="../../../icons/grey_login16.png" id="backup-lock">',
                        field: 'Protected',
                        formatter: columnData,
                        cellsalign: 'center',
                        align: 'center',
                        width: 35
                    },
                    {
                        id: "description",
                        name: 'Description',
                        field: 'ArchiveName',
                        cellsalign: 'left',
                        align: 'center',
                        minwidth: 100,
                        width: 466,
                        sortable: true,
                        cssClass: "cell-title"
                    },

                ];

                // { id: "datasource", name: 'Datasource', field: 'Datasource', minwidth: 30, cssClass: "cell-title", width: 100, sortable: true, formatter: databaseColumnRender },
                // { id: "symbol", name: 'Symbol', field: 'Symbol', minwidth: 10, width: 100, formatter: symbol_renderer, sortable: true, cssClass: "cell-title" },
                // { id: "name", name: 'Name', field: 'Name', minwidth: 20, width: 355, sortable: true, cssClass: "cell-title" },
                // { id: "frequency", name: 'Frequency', field: 'Frequency', minwidth: 10, width: 80, sortable: true, cssClass: "cell-title" },
                // { id: "from", name: 'From', field: 'StartDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', minwidth: 10, width: 80, sortable: true, cssClass: "cell-title" },
                // { id: "to", name: 'To', field: 'EndDate', cellsformat: 'yyyy-MM-dd', minwidth: 10, width: 80, sortable: true, cssClass: "cell-title" },

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
                    grid4.setTopPanelVisibility(!grid.getOptions().showTopPanel);
                }

                $(function() {
                    backupsGridSource.localdata.sort((a, b) => Date.parse(b.ActiveDateLabel) - Date.parse(a.ActiveDateLabel))
                        // prepare the data
                    for (var i = 0; i < backupsGridSource.localdata.length; i++) {
                        backupsGridSource.localdata[i].id = "id_" + i;
                        backupsGridSource.localdata[i].num = (i + 1);
                        // DatasetsOfDatasourceSet.source.localdata[i].Favorite = "false";            
                    }

                    dataView4 = new Slick.Data.DataView({
                        inlineFilters: true
                    });
                    grid4 = new Slick.Grid("#backupsJqxgrid", dataView4, columns, options);
                    grid4.setSelectionModel(new Slick.RowSelectionModel());

                    // create the Resizer plugin
                    // you need to provide a DOM element container for the plugin to calculate available space
                    // resizer = new Slick.Plugins.Resizer({
                    //         container: '.container', // DOM element selector, can be an ID or a class name

                    //         // optionally define some padding and dimensions
                    //         rightPadding: 5, // defaults to 0
                    //         bottomPadding: 10, // defaults to 20
                    //         minHeight: 150, // defaults to 180
                    //         minWidth: 250, // defaults to 300

                    //         // you can also add some max values (none by default)
                    //         // maxHeight: 1000,
                    //         // maxWidth: 2000,
                    //     },
                    //     // the 2nd argument is an object and is optional
                    //     // you could pass fixed dimensions, you can pass both height/width or a single dimension (passing both would obviously disable the auto-resize completely)
                    //     // for example if we pass only the height (as shown below), it will use a fixed height but will auto-resize only the width
                    //     // { height: 300 }
                    // );
                    // // grid.registerPlugin(resizer);
                    // resizer.resizeGrid(0, {
                    //     height: "800",
                    //     width: "100%"
                    // });

                    // var pager = new Slick.Controls.Pager(dataView4, grid4, $("#pager"));
                    // var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);

                    // move the filter panel defined in a hidden div into grid top panel
                    $("#inlineFilterPanel")
                        .appendTo(grid4.getTopPanel())
                        .show();

                    grid4.onCellChange.subscribe(function(e, args) {
                        dataView4.updateItem(args.item.id, args.item);
                    });

                    grid4.onClick.subscribe(function(e, args) {

                    });

                    grid4.onContextMenu.subscribe(function(e) {
                        e.preventDefault();
                        var cell = grid4.getCellFromEvent(e);
                        var indexes = grid4.getSelectedRows()
                        indexes.push(cell.row);
                        grid4.setSelectedRows(indexes)

                        $("#jqxGridMenuBackups")
                            .data("row", cell.row)
                            .css("top", e.pageY)
                            .css("left", e.pageX)
                            .show();

                        $("body").one("click", function() {
                            $("#jqxGridMenuBackups").hide();
                        });
                    });

                    grid4.onAddNewRow.subscribe(function(e, args) {
                        var item = {
                            "num": data.length,
                            "id": "new_" + (Math.round(Math.random() * 10000)),
                            "title": "New task",
                            "duration": "1 day",
                            "percentComplete": 0,
                            "start": "01/01/2009",
                            "finish": "01/01/2009"
                        };
                        $.extend(item, args.item);
                        dataView4.addItem(item);
                    });

                    grid4.onKeyDown.subscribe(function(e) {
                        // select all rows on ctrl-a
                        if (e.which != 65 || !e.ctrlKey) {
                            return false;
                        }

                        var rows = [];
                        for (var i = 0; i < dataView4.getLength(); i++) {
                            rows.push(i);
                        }

                        grid4.setSelectedRows(rows);
                        e.preventDefault();
                    });

                    grid4.onSort.subscribe(function(e, args) {
                        sortdir = args.sortCols[0].sortAsc ? 1 : -1;
                        sortcol = args.sortCols[0].sortCol.field;
                        if (isIEPreVer9()) {
                            // using temporary Object.prototype.toString override
                            // more limited and does lexicographic sort only by default, but can be much faster

                            var percentCompleteValueFn = function() {
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
                            dataView4.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortCols[0].sortAsc);
                        } else {
                            // using native sort with comparer
                            // preferred method but can be very slow in IE with huge datasets
                            dataView4.sort(comparer, args.sortCols[0].sortAsc);
                        }

                    });

                    // wire up model events to drive the grid
                    // !! both dataView.onRowCountChanged and dataView.onRowsChanged MUST be wired to correctly update the grid
                    // see Issue#91
                    dataView4.onRowCountChanged.subscribe(function(e, args) {
                        grid4.updateRowCount();
                        grid4.render();
                    });

                    dataView4.onRowsChanged.subscribe(function(e, args) {
                        grid4.invalidateRows(args.rows);
                        grid4.render();
                    });

                    dataView4.onPagingInfoChanged.subscribe(function(e, pagingInfo) {
                        grid4.updatePagingStatusFromView(pagingInfo);

                        // show the pagingInfo but remove the dataView from the object, just for the Cypress E2E test
                        delete pagingInfo.dataView;
                    });

                    dataView4.onBeforePagingInfoChanged.subscribe(function(e, previousPagingInfo) {
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
                        dataView4.setFilterArgs({
                            percentCompleteThreshold: percentCompleteThreshold,
                            searchString: searchString
                        });
                        dataView4.refresh();
                    }

                    $("#btnSelectRows").click(function() {
                        if (!Slick.GlobalEditorLock.commitCurrentEdit()) {
                            return;
                        }

                        var rows = [];
                        for (var i = 0; i < 10 && i < dataView4.getLength(); i++) {
                            rows.push(i);
                        }

                        grid4.setSelectedRows(rows);
                    });

                    grid4.init();

                    CreateAddHeaderRow();

                    // initialize the model after all the events have been hooked up
                    dataView4.beginUpdate();
                    dataView4.setItems(backupsGridSource.localdata);
                    dataView4.setFilterArgs({
                        percentCompleteThreshold: percentCompleteThreshold,
                        searchString: searchString
                    });
                    dataView4.setFilter(myFilter);
                    dataView4.endUpdate();

                    // dataView4.sort(comparer, args.sortCols[0].sortAsc);

                    // if you don't want the items that are not visible (due to being filtered out
                    // or being on a different page) to stay selected, pass 'false' to the second arg
                    dataView4.syncGridSelection(grid4, false);

                    $("#gridContainer").resizable();

                    // CreateNavigationRow()

                    var panel_height = ($('#windowBackups').css("height").slice(0, -2) - 45) + "px";
                    $('#backupsJqxgrid').css("height", "calc(100% - 37px)")
                    $('.slick-viewport').css('height', "calc(100% - 60px)");
                    $('.slick-pane-top').css('height', "calc(100% - 40px)");

                    // alert($('.slick-viewport').css('height'));

                });

                // grid4.setSortColumn("date", true);

                var contextMenuBackups = $("#jqxGridMenuBackups").jqxMenu({
                    width: 105,
                    height: 90,
                    autoOpenPopup: false,
                    mode: 'popup'
                });
                $("#backupsJqxgrid").on('contextmenu', function() {
                    return false;
                });
                $("#jqxGridMenuBackups").on('itemclick', function(event) {
                    var args = event.args;
                    var rowindex = $("#backupsJqxgrid").jqxGrid('getselectedrowindex');
                    switch ($.trim($(args).text())) {
                        case "Properties":
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                $("#btnBackupEdit").click();
                            }
                            break;

                        case "Restore":
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                $("#btnBackupRestore").click();
                            }
                            break;

                        case "Delete":
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                $("#btnBackupRemove").click();
                            }
                            break;
                    }
                });

                // $("#backupsJqxgrid").on('rowclick', function (event) {
                //     if (event.args.rightclick) {
                //         $("#backupsJqxgrid").jqxGrid('selectrow', event.args.rowindex);
                //         var scrollTop = $(window).scrollTop();
                //         var scrollLeft = $(window).scrollLeft();
                //         contextMenuBackups.jqxMenu('open', parseInt(event.args.originalEvent.clientX) + 5 + scrollLeft, parseInt(event.args.originalEvent.clientY) + 5 + scrollTop);
                //         return false;
                //     }
                // });                
            }
        }

        $('#windowBackups').on('close', function() {
            $('body').removeClass('overlay');
            // $('#backupsJqxgrid').jqxGrid('clearselection');
        });

        var columnData = function(row, columnfield, value, defaulthtml, columnproperties) {
            if (columnfield == 2) {
                return (value) ? '<div align="center"><img height="16" width="16" class="columnData" src="../../../icons/action_check.png"></div>' : '';
            } else {
                return (value) ? '<div align="center"><img height="16" width="16" class="columnData" src="../../../icons/login.png"></div>' : '';
            }
        }

        function deleteBackup() {
            var rows = grid4.getSelectedRows()
            var is_error = false;

            if (rows.length !== 0) {
                for (var i = 0; i < rows.length; i++) {
                    var row = grid4.getDataItem(rows[i]);
                    call_api_ajax('DeleteBackupProfile', 'get', {
                            SessionToken: getSession(),
                            ArchiveID: row.ArchiveID
                        }, false, null,
                        () => {
                            is_error = true;
                        });

                    if (is_error) {
                        setTimeout(() => {
                            dialogWindow('Could not delete the backup "' + row.ArchiveName + '"', 'error');
                        }, 200);
                        updateBackupsList();
                        break;
                    }
                }
            }

            if (!is_error) {
                // $('#backupsJqxgrid').jqxGrid('clearselection');
                updateBackupsList();
                functionNotificationMessage({
                    text: 'Records successfully deleted: ' + rows.length
                });
            }
        }

        function createBackup() {
            var bn = $('#backupName').val();
            var Protected = $('#addBackupWindow #backupPadlock').is(':checked');

            if (bn == '') {
                dialogWindow("Description can not be empty", 'error');
                return;
            } else if (bn.length <= 3) {
                dialogWindow("Description must be more than 3 characters", 'error');
                return;
            } else {
                let parameters = {
                    SessionToken: getSession(),
                    ArchiveName: bn,
                    Protected: Protected
                }
                call_api_ajax('CreateBackupProfile', 'get', parameters, false, (data) => {
                    if (data.Result.Status !== 200) dialogWindow(data.Result.Detail, 'error');
                    else
                        updateBackupsList();
                });
            }
        }

        function editBackup() {
            var protected = $("#newBackupPadlock").jqxCheckBox('val');
            var getselectedrowindexes = grid4.getSelectedRows();
            if (getselectedrowindexes.length == 0)
                return;

            else if (getselectedrowindexes.length == 1) {
                var newBackupName = $("#newBackupName").val();

                if (newBackupName == null || newBackupName == '') {
                    dialogWindow("Backup name can't be empty", "error");
                } else if (newBackupName.length <= 3) {
                    dialogWindow("Description must be more than 3 characters", "error");
                } else {
                    let rows = grid4.getData();
                    for (var i = 0; i < rows.length; i++) {
                        if (i == getselectedrowindexes[0])
                            continue;

                        let row = rows[i];
                        if (row.name == newBackupName) {
                            dialogWindow("A backup with this name already exists", "error");
                            return;
                        }
                    }
                    let row = grid4.getDataItem(getselectedrowindexes[0]),
                        parameters = {
                            SessionToken: getSession(),
                            ArchiveID: row.ArchiveID,
                            NewArchiveName: newBackupName,
                            Protected: protected
                        };
                    call_api_ajax('BackupProfileProperties', 'get', parameters, true, () => {
                        updateBackupsList();
                        $('#editBackupWindow').dialog('close');
                    });
                }
            } else {
                if (protected !== null) {
                    for (var i in getselectedrowindexes) {
                        let row = grid4.getDataItem(getselectedrowindexes[i]),
                            parameters = {
                                SessionToken: getSession(),
                                ArchiveID: row.ArchiveID,
                                NewArchiveName: row.ArchiveName,
                                Protected: protected
                            };
                        call_api_ajax('BackupProfileProperties', 'get', parameters, false);
                    }
                    updateBackupsList();
                    $('#editBackupWindow').dialog('close');
                }
            }
        }

        function restoreBackup() {
            var rows = grid4.getSelectedRows();
            var row = grid4.getDataItem(rows[0])
            let parameters = {
                SessionToken: getSession(),
                ArchiveID: row.ArchiveID
            }

            call_api_ajax('RestoreBackupProfile', 'get', parameters, true,
                async(data) => {
                    if (data.Result.Status !== 200) dialogWindow(data.Result.Detail, 'error');
                    else {
                        // $("#backupsJqxgrid").jqxGrid('updatebounddata', 'cells');
                        // $("#activeJqxgrid").jqxGrid('updatebounddata', 'cells');
                        objectFavorites = await getUserFavorites(getSession());
                        folderStructure = await createFolderStructure(objectFavorites, getSession());
                        userFavorites = objectFavorites.Datasets;

                        $('#jsreeFavorites').jstree("destroy").empty();
                        $('#jsreeFavorites').jstree({
                            "core": {
                                "data": folderStructure,
                            },
                            // "plugins" : [ "contextmenu" ]
                        }).on('loaded.jstree', async function() {
                            let treeNodes = $('#jsreeFavorites').jstree(true).get_json('#', {
                                flat: true
                            });
                            var node = $('#jsreeFavorites').jstree(true).get_node(treeNodes[0].id);
                            $('#jsreeFavorites').jstree(true).select_node(treeNodes[0]);

                            setTimeout(() => {
                                $('#jsreeFavorites').on("select_node.jstree", function(e, data) {
                                    sourceTreeItem = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                    var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                    if (item.original.value.root == true) {
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', true);
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', true);
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', true);
                                        $("#btnDeleteFolder").jqxButton({
                                            disabled: true
                                        });
                                        $("#btnRenameFolder").jqxButton({
                                            disabled: true
                                        });
                                    } else {
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', false);
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', false);
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', false);
                                        $("#btnDeleteFolder").jqxButton({
                                            disabled: false
                                        });
                                        $("#btnRenameFolder").jqxButton({
                                            disabled: false
                                        });
                                    }
                                });
                            }, 200);

                            // $("#activeJqxgrid").jqxGrid('clearselection');
                            refreshFavouritesGrid();
                        });

                        // refreshTreeFolders();

                        $('#windowBackups').jqxWindow('close');
                        dialogWindow('The backup was restored.', 'information');
                    }
                });
        }
        /* =================== End Backups =================== */
    }

});

function openSeriesInNewTab(database, series, category) {
    call_api_ajax('GetUserDatasources', 'get', {
        SessionToken: getSession(),
        ReturnCategoryList: true
    }, false, (data) => {
        data.Result.map((v) => {
            access = (v.Datasource == database) ? v : access;
        });
    }, null, null, false);
    let category_l = (category == undefined || category == "") ? "" : category + "/",
        msg = "Do you want to view the series " + database + "/" + category_l + series + " in a new tab?";
    let flag_dialog = false;
    if (access.IsCategoryDS) {
        let u_access = false,
            last_access;

        if (access.DetailsDS !== undefined && access.DetailsDS.UserCategoryList !== undefined) {
            access.DetailsDS.UserCategoryList.map((v) => {
                if (v.Name === category && v.Subscription !== 'Inactive') {
                    u_access = true;
                    let res = isDateExpired(v.UserAccess.Ends, true)
                    if (res) {
                        u_access = null;
                        last_access = v.EndDate;
                    }
                }
            });
        }

        if (u_access == null)
            msg = "Your access to the " + database + " data category " + category + " expired on " + last_access + ".<br>Do you want to view this series in a new tab?";

        else if (!u_access) {
            msg = "You do not have access to the " + database + " data category " + category + " or its values.";
            flag_dialog = true;
        }

    } else {
        if (access.Details !== undefined) {
            if (access.Details.Subscription == "Inactive") {
                msg = "You do not have access to the datasource " + database + " or its values."
                flag_dialog = true;
            } else if (isDateExpired(access.Details.UserAccess.Ends, true))
                msg = "Your access to the " + database + " data source expired on " + access.Details.UserAccess.Ends + ".<br>Do you want to view this series in a new tab?"
        }
    }

    if (flag_dialog) {
        dialogWindow(msg, 'information');
    } else {
        dialogWindow(msg, 'query', 'confirm', null,
            function() {
                $('body').addClass('overlay');
                $('.loader-container').show();

                let parameters = {
                    SessionToken: getSession(),
                    Frequency: "d",
                    Series: [{
                        Datasource: database,
                        Symbol: series
                    }],
                    ReturnMetadata: true,
                    ReturnBateStatus: true
                }
                if (category !== undefined && category !== "") parameters.Series[0].Datacategory = category;
                call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data, textStatus, XmlHttpRequest) => {
                    if (data.Result.Series[0].Metadata == undefined || data.Result.Series[0].BateStatus == undefined) {
                        let type = 'Metadata or BateStatus';
                        if (data.Result.Series[0].Metadata == undefined) type = 'Metadata';
                        else if (data.Result.Series[0].BateStatus == undefined) type = 'BateStatus';

                        dialogWindow('The server responded with "' + XmlHttpRequest.status + '" but cannot read the ' + type + ' field', 'error', null, null, null, null, {
                            funcName: 'GetDatasetValues',
                            parameters: parameters,
                            data: data,
                            type: 'post'
                        });
                        console.warn(data);
                        return;
                    } else if (data.Result.Series[0].BateStatus[0].Status > 299) {
                        dialogWindow('The server responded with "' + data.Result.Series[0].BateStatus[0].Status + '". ' + data.Result[0].BateStatus[0].Detail, 'error', null, null, null, null, {
                            funcName: 'GetDatasetValues',
                            parameters: parameters,
                            data: data,
                            type: 'post'
                        });
                        console.warn(data);
                        return;
                    } else if (data.Result.Series[0].Values == undefined) {
                        let type = 'Values';
                        dialogWindow('The server responded with "' + XmlHttpRequest.status + '" but cannot read the ' + type + ' field', 'error', null, null, null, null, {
                            funcName: 'GetDatasetValues',
                            parameters: parameters,
                            data: data,
                            type: 'post'
                        });
                        console.warn(data);
                        return;
                    } else {
                        let t = (category !== undefined && category !== "") ? database + '/' + category + '/' + series : database + '/' + series;
                        sessionStorage.setItem(t, JSON.stringify(data.Result.Series[0]));
                        var win = window.open("seriesviewer?symbol=" + escape(t) + "&tab=prices", '_blank');
                        win.focus();
                    }
                }, null, () => {
                    $('.loader-container').hide();
                    $('body').removeClass('overlay');
                });
            }, null, null, {
                Ok: 'Yes',
                Cancel: 'No'
            }
        )
    }

}

function handleCloseFavoritesPage(link) {
    window.location.href = "profile?tab=myaccount";
}
async function handleLogout() {
    dialogWindow("Are you sure that you want to logout?", 'warning', 'confirm', null,
        () => {
            call_api_ajax('RevokeSessionToken', 'get', {
                SessionToken: getSession()
            }, false, () => {
                localStorage["forget"] = 'password';
                window.location.href = "/";
            });
        }
    );
}

function autoresizeColumnsManually(dataAdapter, gridName) {
    var gridRecords = []; //dataAdapter.records;
    var maxCodeCharactersCount = Math.max.apply(Math, gridRecords.map(function(o) {
        return o.Symbol.length;
    }));
    var maxNameCharactersCount = Math.max.apply(Math, gridRecords.filter(s => s.name != null)
        .map(function(o) {
            return o.name.length;
        }));

    resizeColumnsRegardingCharactersCount('Symbol', maxCodeCharactersCount, gridName);
    resizeColumnsRegardingCharactersCount('name', maxNameCharactersCount, gridName);
    resizeColumnsRegardingCharactersCount('first_date', 11, gridName);
    resizeColumnsRegardingCharactersCount('last_date', 11, gridName);
    resizeColumnsRegardingCharactersCount('frequency', 9, gridName);
    resizeColumnsRegardingCharactersCount('prices', 9, gridName);


    if (gridRecords.length > 0 && gridRecords[0].link != null) {
        resizeColumnsRegardingCharactersCount('link', maxCodeCharactersCount, gridName);
    }
}

function disactiveFavorite() {
    var rows = new Array(),
        checkedRows = $('#activeJqxgrid').jqxGrid('getselectedrowindexes');

    checkedRows.forEach(function(item, i, checkedRows) {
        var row = $('#activeJqxgrid').jqxGrid('getrowdata', item);
        rows.push(row);
    });

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var parameters = {
            database_code: row.Symbol,
            dataset_code: row.Symbol
        };

        $.post("/user-favourites/disactive", parameters, function(result) {}, 'json');
        $("#activeJqxgrid").jqxGrid('deleteRow', row.uid);
    }

    $("#disactiveJqxgrid").jqxGrid('updatebounddata', 'cells');
}

function resizeColumnsRegardingCharactersCount(column, charactersCount, gridName) {
    var k;
    if (charactersCount < 50) k = 7.5;
    else if (charactersCount < 100) k = 6.5;
    else k = 6;

    $("#" + gridName).jqxGrid('setcolumnproperty', column, 'width', charactersCount * k + 30);
}

$('#exportDialogWindow').jqxWindow({
    showCollapseButton: false,
    resizable: false,
    height: 240,
    width: 400,
    autoOpen: false,
    title: 'Export Database Metadata',
    initContent: function() {
        $('#exportSeriesBtn').jqxButton({
            width: '75px',
            height: '31px'
        });
        $("#exportSeriesBtn").on('click', function() {
            exportSeries();
            $('#exportDialogWindow').jqxWindow('close');
        });

        $('#cancelExportDialog').jqxButton({
            width: '75px',
            height: '31px'
        });
        $("#cancelExportDialog").on('click', function() {
            $('#exportDialogWindow').jqxWindow('close');
        });
    }
});

function makeExportSeriesDialog() {
    tab = getParameterByName('tab');
    if (tab == "mydatasources") {
        var rows = grid2.getData().length,
            record = (grid2.getSelectedRows().length > 1) ? "records" : "record",
            msg = "Export the " + grid2.getSelectedRows().length + " selected " + record;
    } else if (tab == "favorites") {
        var rows = grid1.getData().getPagingInfo().totalRows,
            record = (grid1.getSelectedRows().length > 1) ? "records" : "record",
            msg = "Export the " + grid1.getSelectedRows().length + " selected " + record;
    }
    $('#exportDialogWindow #num').text(rows);
    $('#exportSelectedRecordsText').text(msg);
    $('#exportDialogWindow').jqxWindow('open');
    $('#exportDialogWindow .jqx-window-header div').css("float", "none");
}

function exportSeries() {
    var export_type = $('input[name="export_type"]:checked').val(),
        rows,
        rowsindexes;

    if (export_type == "selected") {
        if (tab == "favorites") {
            rowsindexes = grid1.getSelectedRows();
        } else {
            rowsindexes = grid2.getSelectedRows();
        }
    } else if (export_type == "all") {
        if (tab == "favorites") {
            rowsindexes = grid1.getData().getItems();
        } else {
            rowsindexes = grid2.getData().getItems();
        }
        rowsindexes = rowsindexes.map(v => v.id.slice(3));
    }

    var rows = [];

    switch (tab) {
        case "favorites":
            var column = grid1.getColumns();
            break;
        case "mydatasources":
            var column = grid2.getColumns();
            break;
    }

    let firstRow = [];
    for (var c in column) {
        if (!column[c].hidden && column[c].field !== "" && column[c].field !== "Favorite" && column[c].field !== "id")
            firstRow.push(column[c].name);
    }
    rows.push(firstRow);

    for (var i = 0; i < rowsindexes.length; i++) {
        let row = "";
        if (tab == "favorites") {
            row = grid1.getDataItem(rowsindexes[i]);
        } else {
            row = grid2.getDataItem(rowsindexes[i]);
        }

        let col = [];
        for (var c in column) {
            if (!column[c].hidden && column[c].field !== "" && column[c].field !== "Favorite" && column[c].field !== "id") {
                if (row[column[c].field] == undefined) row[column[c].field] = "";

                if (column[c].field == "StartDate" || column[c].field == "EndDate")
                    row[column[c].field] = new Date(row[column[c].field]).toISOString().split('T')[0];

                col.push(row[column[c].field]);
            }
        }
        rows.push(col);
    }

    var date = new Date(),
        day = date.getDate(),
        month = date.getMonth() + 1,
        year = date.getFullYear();

    day = (day < 10) ? '0' + day : day;
    month = (month < 10) ? '0' + month : month;
    date = day + '-' + month + '-' + year;

    var CsvString = "";
    rows.forEach(function(RowItem, RowIndex) {
        RowItem.forEach(function(ColItem, ColIndex) {
            if (ColItem == "") ColItem = " ";
            CsvString += '"' + ColItem + '",';
        });
        CsvString += "\r\n";
    });

    CsvString = "data:application/csv," + encodeURIComponent(CsvString);
    var link = document.createElement("a");
    link.href = CsvString;
    link.download = tab.toUpperCase() + "-EXPORT-" + date + ".csv"
    link.click();
}