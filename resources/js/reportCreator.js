/*********************
    Report Creator
**********************/

var sessionToken = getSession();
var reportCreatorDataView;
var reportCreatorGrid;
var filterOfURL = getParameterByName('filter');
filterOfURL = (filterOfURL == "undefined") ? "" : filterOfURL;

var leftCollapse = false;

function resizeRepoCreatorColumns(grid_id) {
    var grid_panel = $("#" + grid_id),
        // creatorColumns = reportCreatorGrid.getColumns(),
        // rows = reportCreatorDataView.getItems(),
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

    if (grid_id == "repoCreatorgrid") {
        creatorColumns = reportCreatorGrid.getColumns()
        rows = reportCreatorDataView.getItems()
    }

    columns_width = {},
        K = 10;

    if (grid_panel.find('#verticalScrollBar' + grid_id).length && grid_panel.find('#verticalScrollBar' + grid_id).css('visibility') !== "hidden") {
        z = 2.2;
    }

    if (creatorColumns !== undefined) {
        if (grid_id == "repoCreatorgrid") {
            // reportCreatorGrid.autosizeColumns();
            width = reportCreatorGrid.getGridPosition().width;
        }

        descriptionWidth = creatorColumns[3].width,
            descriptionMinWidth = creatorColumns[3].minWidth;

        creatorColumns.map(function(column) {
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

                var w = creatorColumns[index_array[i]].width;

                if (grid_id == "repoCreatorgrid") {
                    var fieldkey = "Name";
                }

                if (datafield[i] !== fieldkey) {
                    let width = (l * K > w) ? l * K : w;

                    if (datafield[i] == 'Datasource')
                        width += creatorColumns[index_array[i]].minWidth;

                    columns_width[datafield[i]] = width;
                    creatorColumns[index_array[i]].width = width;
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

        creatorColumns.map(function(v) {
            if (grid_id == "repoCreatorgrid") {
                if (v.field == "Name")
                    v.width = descriptionWidth;
            }
        });

        // grid.jqxGrid({ columns: creatorColumns });
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

$(document).ready(function() {

    // calcuTimeFunc();

    // $.jqx.theme = 'light';
    // $.jqx.utilities.scrollBarSize = 11;

    $('#reportCreatorSplitter').jqxSplitter({
        width: '100%',
        // height: 200,
        panels: [{
            size: '180px'
        }]
    });

    $('#reportCreatorRightSplitter').jqxSplitter({
        height: '100%',
        width: 300,
        orientation: 'horizontal',
        panels: [{
            size: '60%'
        }]
    });

    $.jqx.utilities.scrollBarSize = 10;

    var littleFlag = 0;

    function resizeRepoCreatorElements() {
        setTimeout(() => {
            if (reportCreatorGrid != undefined) {
                $('#repoCreatorgrid').css("height", parseInt($("#reportCreator").height()) - parseInt($("#bottomSplitterPanel1").height()) - 141);
                $('#repoCreatorgrid').css("width", parseInt($("#reportCreator").width()) - parseInt($("#leftSplitterPanel1").width()) - 9);
                $('#repoCreatorgrid .slick-pane-top').css('height', "calc(100% - 34px)");
                $('#repoCreatorgrid .slick-viewport').css('height', "calc(100%)");
            }
            $("#deleteBtn").parent("div").css("margin-top", (parseInt($("#seriesButtonPan").height()) - 170))
        }, 5);
    }

    $(window).resize(function() {
        resizeRepoCreatorElements();
    });

    resizeRepoCreatorElements();

    var globalMoveFolders = false;

    // var symbol_renderer = function (row, datafield, value, html, columnproperties, record) {
    //     return '<a target="_blank">' + value + '</a>';
    // }

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
        return '<div class="databaseColumnRender"> <img src="' + databaseImage + '">' + value + '</div>';
    }

    var isDragStart1 = false;
    var element1 = "";
    var reportCreatorGridSource;
    var seriesToAdd1 = null,
        folderToAdd1 = null;

    function hideAdditInfo(elem) {
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
                // formatter: symbol_renderer,
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

        var old_columns = reportCreatorGrid.getColumns();

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

        reportCreatorGrid.setColumns(update_columns);

        // var panel_height = ($('.fixpage').css("height").slice(0, -2) - 165) + "px";

        // // $('#mainSplitter').css("height", (panel_height.slice(0, -2) - 45));
        // $('#repoCreatorgrid').css("height", (panel_height.slice(0, -2) - 107))
        // $('#repoCreatorgrid .slick-viewport').css('height', "calc(100% - 60px)");
        // $('#repoCreatorgrid .slick-pane-top').css('height', "100%");
    }

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
            // formatter: symbol_renderer,
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
        // {
        //     id: "currency",
        //     name: 'Currency',
        //     field: 'Currency',
        //     sortable: false,
        //     minwidth: 10,
        //     width: 75,
        //     cssClass: "cell-title"
        // },
        // {
        //     id: "decimals",
        //     name: 'Decimals',
        //     field: 'Decimals',
        //     sortable: false,
        //     minwidth: 10,
        //     width: 65,
        //     cssClass: "cell-title"
        // },
        // {
        //     id: "unit",
        //     name: 'Unit',
        //     field: 'Unit',
        //     sortable: false,
        //     minwidth: 10,
        //     width: 50,
        //     cssClass: "cell-title"
        // },
        // {
        //     id: "conversions",
        //     name: 'Conversions',
        //     field: 'Conversions',
        //     sortable: false,
        //     minwidth: 10,
        //     width: 50,
        //     cssClass: "cell-title"
        // },
        // {
        //     id: "additional",
        //     name: 'Additional',
        //     field: 'Additional',
        //     sortable: false,
        //     minwidth: 10,
        //     width: 150,
        //     cssClass: "cell-title",
        //     formatter: additional_renderer
        // }
    ];

    async function refreshRepoCreatorGrid() {
        const data = userFavorites;
        const folderStruct = $('#jstreeRepoCreator').jstree(true).get_selected("full", true)[0];
        if (!folderStruct) {
            var items = $('#jstreeRepoCreator').jstree(true).get_json('#', {
                flat: true
            });
            $('#jstreeRepoCreator').jstree(true).select_node(items[0]);
            folderStruct = $('#jstreeRepoCreator').jstree(true).get_selected("full", true)[0];
        }
        let searchList = [];
        var search = $("#searchReportCreatorBox").val();
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

        reportCreatorGridSource.localdata = searchList;

        for (var i = 0; i < reportCreatorGridSource.localdata.length; i++) {
            reportCreatorGridSource.localdata[i].id = "id_" + i;
            reportCreatorGridSource.localdata[i].num = (i + 1);

            if (reportCreatorGridSource.localdata[i].Datacategory != undefined)
                isCategory = true;
            else
                reportCreatorGridSource.localdata[i].Datacategory = ""
        }

        var creatorColumns = [{
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
                // formatter: symbol_renderer,
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
            // {
            //     id: "currency",
            //     name: 'Currency',
            //     field: 'Currency',
            //     sortable: false,
            //     minwidth: 10,
            //     width: 75,
            //     cssClass: "cell-title"
            // },
            // {
            //     id: "decimals",
            //     name: 'Decimals',
            //     field: 'Decimals',
            //     sortable: false,
            //     minwidth: 10,
            //     width: 65,
            //     cssClass: "cell-title"
            // },
            // {
            //     id: "unit",
            //     name: 'Unit',
            //     field: 'Unit',
            //     sortable: false,
            //     minwidth: 10,
            //     width: 50,
            //     cssClass: "cell-title"
            // },
            // {
            //     id: "conversions",
            //     name: 'Conversions',
            //     field: 'Conversions',
            //     sortable: false,
            //     minwidth: 10,
            //     width: 50,
            //     cssClass: "cell-title"
            // },
            // {
            //     id: "additional",
            //     name: 'Additional',
            //     field: 'Additional',
            //     sortable: false,
            //     minwidth: 10,
            //     width: 150,
            //     cssClass: "cell-title",
            //     formatter: additional_renderer
            // }
        ];

        setTimeout(() => {
            if (isCategory) {
                creatorColumns.splice(1, 0, {
                    id: 'cat',
                    name: 'Cat.',
                    field: 'Datacategory',
                    minwidth: 10,
                    width: 40,
                    sortable: true,
                    cssClass: "cell-title"
                }, )
            }

            // reportCreatorGrid.setColumns(creatorColumns);

            reportCreatorDataView.beginUpdate();
            reportCreatorDataView.setItems(reportCreatorGridSource.localdata, "id");
            reportCreatorDataView.endUpdate();
            reportCreatorDataView.reSort();
        }, 50);
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

    let databaseImages, databaseNames, userFavorites, userBackups, folderStructure, objectFavorites, resultJson = [];
    var userDatasources;
    var selectItem;
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
            initReportCreator();
        });
    } catch (e) {
        console.log(e)
    }

    function initReportCreator() {
        imagesMap = buildMap(databaseImages)

        repoCreatorGrid()

        /* ============= repoCreatorgrid =============== */
        function repoCreatorGrid() {
            var attachContextMenu = function() {
                $("#jstreeRepoCreator").on('mousedown', function(event) {
                    var target = $(event.target).parents('li:first')[0],
                        rightClick = isRightClick(event);
                    if (rightClick) {
                        if (target) {
                            $("#jstreeRepoCreator").jstree().deselect_all(true);
                            $('#jstreeRepoCreator').jstree(true).select_node(target);
                        }
                        var scrollTop = $(window).scrollTop();
                        var scrollLeft = $(window).scrollLeft();
                        contextMenu.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
                        return false;
                    }
                });
            }

            var contextMenu = $("#reportCreatorTreeMenu").jqxMenu({
                width: '105px',
                height: '65px',
                autoOpenPopup: false,
                mode: 'popup'
            });

            createFolders = async() => {
                // Init Tree Menu
                var clickedItem = null;

                // disable the default browser's context menu.
                $(document).on('contextmenu', function(e) {
                    if ($(e.target).parents('#jstreeRepoCreator').length > 0)
                        return false;

                    return true;
                });

                $('#jstreeRepoCreator').jstree({
                    "core": {
                        "data": folderStructure,
                        "check_callback": true,
                    },
                    "plugins": ["dnd"]
                });

                attachContextMenu();
                $("#reportCreatorTreeMenu").on('itemclick', function(event) {
                    var item = $.trim($(event.args).text());
                    switch (item) {
                        case "Open All":
                            $('#jstreeRepoCreator').jstree('open_all');
                            break;
                        case "Close All":
                            $('#jstreeRepoCreator').jstree('close_all');
                            break;
                    }
                });
                // refreshTreeFolders();
            };

            async function searchSeries() {
                refreshRepoCreatorGrid();
            }

            initRepoCreatorJqxgrid();

            initToolbar = () => {
                $('#jstreeRepoCreator').on('loaded.jstree', function() {
                    var items = $('#jstreeRepoCreator').jstree(true).get_json('#', {
                        flat: true
                    });
                    $('#jstreeRepoCreator').jstree(true).select_node(items[0]);
                    sourceTreeItem = $('#jstreeRepoCreator').jstree(true).get_selected("full", true)[0];
                    setTimeout(() => {
                        $('#jstreeRepoCreator').on('activate_node.jstree', function(e, item) {
                            // $('#jsreeFavorites').on("select_node.jstree", function (e, data) {
                            if (isDragStart1 == false) {
                                sourceTreeItem = $('#jstreeRepoCreator').jstree(true).get_selected("full", true)[0];
                                refreshRepoCreatorGrid();
                                setTimeout(() => {
                                    refreshRepoCreatorGrid();
                                }, 10);

                                var rowsindexes = reportCreatorGrid.getSelectedRows();

                                if (rowsindexes.length != 0)
                                    reportCreatorGrid.setSelectedRows([0]);
                            }

                            var item = $('#jstreeRepoCreator').jstree(true).get_selected("full", true)[0];
                        });
                    }, 200);
                });
            }

            // TODO here are the magic of the grid
            async function initRepoCreatorJqxgrid() {

                function isIEPreVer9() {
                    var v = navigator.appVersion.match(/MSIE ([\d.]+)/i);
                    return (v ? v[1] < 9 : false);
                }

                function CreateAddHeaderRow() {

                    $(".HelpMessageRepo1").jqxPopover({
                        offset: {
                            left: -50,
                            top: 0
                        },
                        arrowOffsetValue: 50,
                        title: "Search Filter Help",
                        showCloseButton: true,
                        selector: $("#helpIconRepoCreator")
                    });

                    // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                    var fullWidthFlag = true;
                    let img = (!fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                    let footer_width = (!fullWidthFlag) ? '1230px' : '1230px';

                    $("#main-footer").width(footer_width);

                    $("#searchReportCreatorBox").jqxInput({
                        placeHolder: " Enter filter text",
                        height: 24,
                        width: 230
                    });

                    $("#searchReportCreatorBtn").jqxButton({
                        imgSrc: "resources/css/icons/search.png",
                        imgPosition: "center",
                        width: 24,
                        height: 24,
                        imgWidth: 16,
                        imgHeight: 16
                    });
                    $("#searchReportCreatorBtn img").css("top", 6);

                    $("#btnAutosizeRepoCreator").jqxButton({
                        imgSrc: "resources/css/icons/autosize.png",
                        imgPosition: "center",
                        width: 24,
                        height: 24,
                        imgWidth: 16,
                        imgHeight: 16
                    });
                    $("#btnAutosizeRepoCreator img").css("top", 6);

                    $("#closeBtn").jqxButton({
                        imgSrc: "resources/jqwidgets/styles/images/close.png",
                        imgPosition: "center",
                        width: 20,
                        height: 20,
                        imgWidth: 18,
                        imgHeight: 18
                    });
                    $("#closeBtn").css("position", "absolute");
                    $("#closeBtn img").css("left", 0).css("top", 0);

                    $("#closeBtn").on('click', function() {
                        dialogWindow("Do you want to close the report editor?", "query", "confirm", "Monitor+", () => {
                            $('#reportCreator').jqxWindow('close');
                        }, null, null, { Ok: "Yes", Cancel: "No" });
                    });

                    $("#searchReportCreatorBox").keypress(function(e) {
                        if (e.which == 13) {
                            searchSeries();
                            return false;
                        }
                    });

                    $("#searchReportCreatorBox").click(function(evt) {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            searchSeries();
                        }
                    });

                    $("#searchReportCreatorBtn").on('click', function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            searchSeries();
                        }
                    });

                    $("#btnAutosizeRepoCreator").on('click', function() {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            hideAdditInfo(1);
                        }
                    });

                    if (filterOfURL == "undefined")
                        filterOfURL = "";

                    let searchValue = filterOfURL;
                    $('#searchReportCreatorBox').val(searchValue);

                    // $("#btnAutosizeRepoCreator").tooltip();
                }

                reportCreatorGridSource = {
                    datatype: "json",
                    localdata: await userFavorites
                };

                await createFolders();

                initToolbar();
                var cols;

                // $('#mainSplitter').on('resize expanded collapsed', function (e) {
                //     if($('#jqxTreeToolBar').css('width').slice(0,-2) < 170){
                //         $('.jqx-toolbar-tool-no-separator-ltr').css('position', 'static');
                //     }else{
                //         $('.jqx-toolbar-tool-no-separator-ltr').css('position', 'absolute');
                //     }
                // });

                var searchArray = [];
                var isCategory = false;

                reportCreatorGridSource.localdata.forEach(function(e, index) {
                    if ((e.Symbol.search(filterOfURL) != -1 || e.Name.search(filterOfURL) != -1) && filterOfURL !== "undefined") searchArray.push(e)

                    if (e.Datacategory != undefined) isCategory = true;
                });

                reportCreatorGridSource.localdata = searchArray;

                var reportCreatorColumns = baseGridColumns;

                if (isCategory)
                    reportCreatorColumns.splice(1, 0, {
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
                    multiSelect: false,
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
                    reportCreatorGrid.setTopPanelVisibility(!reportCreatorGrid.getOptions().showTopPanel);
                }

                $(function() {
                    // prepare the data
                    for (var i = 0; i < reportCreatorGridSource.localdata.length; i++) {
                        reportCreatorGridSource.localdata[i].id = "id_" + i;
                        reportCreatorGridSource.localdata[i].num = (i + 1);
                        if (reportCreatorGridSource.localdata[i].Datacategory == undefined)
                            reportCreatorGridSource.localdata[i].Datacategory = "";
                    }

                    reportCreatorDataView = new Slick.Data.DataView({
                        inlineFilters: true
                    });
                    reportCreatorGrid = new Slick.Grid("#repoCreatorgrid", reportCreatorDataView, reportCreatorColumns, options);
                    reportCreatorGrid.setSelectionModel(new Slick.RowSelectionModel());

                    $("#inlineFilterPanel")
                        .appendTo(reportCreatorGrid.getTopPanel())
                        .show();

                    reportCreatorGrid.onCellChange.subscribe(function(e, args) {
                        reportCreatorDataView.updateItem(args.item.id, args.item);
                    });

                    reportCreatorGrid.onClick.subscribe(function(e, args) {
                        repoCreatorgridDragAndDropInit();
                    });

                    reportCreatorGrid.onDblClick.subscribe(function(e, args, c) {
                        if (getSession() == undefined || getSession() == "") {
                            openLoginPopup();
                        } else {
                            openBatesList();
                        }
                    });

                    reportCreatorGrid.onContextMenu.subscribe(function(e) {
                        e.preventDefault();
                        var cell = reportCreatorGrid.getCellFromEvent(e);
                        var indexes = []
                        indexes.push(cell.row);
                        reportCreatorGrid.setSelectedRows(indexes)

                        $("#reportCreatorGridMenu")
                            .data("row", cell.row)
                            .css("top", e.pageY)
                            .css("left", e.pageX)
                            .show();

                        $("body").one("click", function() {
                            $("#reportCreatorGridMenu").hide();
                        });

                        $("#reportCreator").one("click", function() {
                            $("#reportCreatorGridMenu").hide();
                        });
                    });

                    reportCreatorGrid.onAddNewRow.subscribe(function(e, args) {
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
                        reportCreatorDataView.addItem(item);
                    });

                    reportCreatorGrid.onKeyDown.subscribe(function(e) {

                        // select all rows on ctrl-a
                        if (e.which != 65 || !e.ctrlKey) {
                            return false;
                        }

                        var rows = [];
                        for (var i = 0; i < reportCreatorDataView.getLength(); i++) {
                            rows.push(i);
                        }

                        reportCreatorGrid.setSelectedRows(rows);
                        e.preventDefault();
                    });

                    reportCreatorGrid.onSort.subscribe(function(e, args) {
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
                            reportCreatorDataView.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortCols[0].sortAsc);
                        } else {
                            // using native sort with comparer
                            // preferred method but can be very slow in IE with huge datasets
                            reportCreatorDataView.sort(comparer, args.sortCols[0].sortAsc);
                        }
                    });

                    reportCreatorDataView.onRowCountChanged.subscribe(function(e, args) {
                        reportCreatorGrid.updateRowCount();
                        reportCreatorGrid.render();
                    });

                    reportCreatorDataView.onRowsChanged.subscribe(function(e, args) {
                        reportCreatorGrid.invalidateRows(args.rows);
                        reportCreatorGrid.render();
                    });

                    reportCreatorDataView.onPagingInfoChanged.subscribe(function(e, pagingInfo) {
                        reportCreatorGrid.updatePagingStatusFromView(pagingInfo);

                        // show the pagingInfo but remove the dataView from the object, just for the Cypress E2E test
                        delete pagingInfo.dataView;
                    });

                    reportCreatorDataView.onBeforePagingInfoChanged.subscribe(function(e, previousPagingInfo) {
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
                        reportCreatorDataView.setFilterArgs({
                            percentCompleteThreshold: percentCompleteThreshold,
                            searchString: searchString
                        });
                        reportCreatorDataView.refresh();
                    }

                    $("#btnSelectRows").click(function() {
                        if (!Slick.GlobalEditorLock.commitCurrentEdit()) {
                            return;
                        }

                        var rows = [];
                        for (var i = 0; i < 10 && i < reportCreatorDataView.getLength(); i++) {
                            rows.push(i);
                        }

                        reportCreatorGrid.setSelectedRows(rows);
                    });

                    reportCreatorGrid.init();

                    CreateAddHeaderRow();

                    // initialize the model after all the events have been hooked up
                    reportCreatorDataView.beginUpdate();
                    reportCreatorDataView.setItems(reportCreatorGridSource.localdata);
                    reportCreatorDataView.setFilterArgs({
                        percentCompleteThreshold: percentCompleteThreshold,
                        searchString: searchString
                    });
                    reportCreatorDataView.setFilter(myFilter);
                    reportCreatorDataView.endUpdate();

                    // if you don't want the items that are not visible (due to being filtered out
                    // or being on a different page) to stay selected, pass 'false' to the second arg
                    reportCreatorDataView.syncGridSelection(reportCreatorGrid, true);

                    $("#gridContainer").resizable();

                    setTimeout(() => {
                        hideAdditInfo(1);
                        resizeRepoCreatorColumns('repoCreatorgrid');
                        repoCreatorgridDragAndDropInit();
                    }, 10);
                })

                // create context menu
                $("#reportCreatorGridMenu").jqxMenu({
                    width: 200,
                    height: 64,
                    autoOpenPopup: false,
                    mode: 'popup'
                });

                // handle context menu clicks.
                $("#reportCreatorGridMenu").on('itemclick', function(event) {
                    var args = event.args;
                    switch ($.trim($(args).text())) {

                        case "Add to list":
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                openBatesList();
                            }
                            break;

                        case "Copy":
                            if (getSession() == undefined || getSession() == "") {
                                openLoginPopup();
                            } else {
                                var rowsindexes = reportCreatorGrid.getSelectedRows();
                                seriesToAdd1 = reportCreatorGrid.getDataItem(rowsindexes[0]);
                            }
                            break;
                    }

                    $("#reportCreatorGridMenu").hide();
                });

                $(document).bind('mousemove', function(event) {
                    if (isDragStart1 == true) {
                        $(".jqx-draggable-dragging").remove();

                        var x = event.pageX;
                        var y = event.pageY;

                        $("#proxy_pan").css({
                            display: "inline-block",
                            top: y + 5,
                            left: x + 5
                        });

                        element1 = document.elementFromPoint(x, y);
                        if (element1.id && $('#jstreeSeriesList').html() != "") {
                            var item = $('#jstreeSeriesList').jstree(true).get_node(element1.id);
                            if (item) {
                                $("#jstreeSeriesList").jstree().deselect_all(true);
                                $('#jstreeSeriesList').jstree(true).select_node(item);
                            }
                        }
                    }
                });
            }

            $("#btnSaveReportCreator").jqxButton({
                width: '65px',
                height: '31px',
                textPosition: "center"
            });
            $('#btnSaveReportCreator span').css('left', 24).css('top', 6);

            $("#btnSaveReportCreator").on('click', function() {
                if (resultJson.length > 0) {
                    let reportJson = {};
                    let series = {};
                    resultJson.map((e, i) => {
                        series[i] = {
                            "Datasource": e.value.series[0].Datasource,
                            "Symbol": e.value.series[0].Symbol,
                            "BateIndex": []
                        };

                        if (e.value.series[0].Datacategory != "") {
                            series[i].Datacategory = e.value.series[0].Datacategory
                        }

                        e.children.map((c, j) => {
                            series[i].BateIndex.push(c.id.split("-")[1]);
                        });
                    });

                    if (getCookie("editReport") != undefined && getCookie("editReport") != "" && getCookie("editReport") != "new") {
                        reportJson = JSON.parse(getCookie('reportJson'));
                        reportJson.Series = series;
                        setCookie('updateJson', JSON.stringify(reportJson));
                    } else {
                        reportJson = {
                            "Series": series,
                            "StartDate": "2000-02-01",
                            "EndDate": "Latest",
                            "ClipStart": false,
                            "ClipEnd": false,
                            "DateFormat": "YYYY-MM-DD",
                            "Frequency": "d",
                            "FrequencyOptions": {
                                "AllowWeekends": "on"
                            },
                            "FillOptions": {
                                "Trailing": true,
                                "Style": "null",
                                "Type": "previous"
                            },
                        };

                        setCookie('reportJson', JSON.stringify(reportJson));
                        window.open("report_viewer?report_id=new&tab=request&layout=1", '_blank');
                    }
                    $("#reportCreator").jqxWindow("close");
                    $("#batesListPopup").dialog("close");
                }
            });

            $("#btnCancelReportCreator").jqxButton({
                width: '65px',
                height: '31px',
                textPosition: "center"
            });
            $('#btnCancelReportCreator span').css('left', 13).css('top', 6);

            $('#reportCreator').on('close', function() {
                $('body').removeClass('overlay');
                setTimeout(() => {
                    setCookie("editReport", "");
                    // setCookie("reportJson", "");
                }, 50);
            });

            $("#btnCancelReportCreator").on('click', function() {
                dialogWindow("Do you want to close the report editor?", "query", "confirm", "Monitor+", () => {
                    $('#reportCreator').jqxWindow('close');
                }, null, null, { Ok: "Yes", Cancel: "No" });
            });

            $("#leftPanIcon").click(function() {
                if (leftCollapse == false) {
                    $('#reportCreatorSplitter').jqxSplitter({ width: '100%', height: "calc(100% - 57px)", panels: [{ size: "25px" }] });
                    $("#leftPanIcon").attr("src", "resources/jqwidgets/styles/images/metro-icon-right.png");
                } else {
                    $('#reportCreatorSplitter').jqxSplitter({ width: '100%', height: "calc(100% - 57px)", panels: [{ size: "180px" }] });
                    $("#leftPanIcon").attr("src", "resources/jqwidgets/styles/images/metro-icon-left.png");
                }
                $('#repoCreatorgrid').css("width", parseInt($("#reportCreator").width()) - parseInt($("#leftSplitterPanel1").width()) - 9);
                leftCollapse = !leftCollapse;
            });
        }
        /* =================== End repoCreatorgrid =================== */

        var attachContextMenu1 = function() {
            $("#jstreeSeriesList").on('mousedown', function(event) {
                var target = $(event.target).parents('li:first')[0],
                    rightClick = isRightClick(event);
                if (rightClick) {
                    if (target) {
                        $("#jstreeSeriesList").jstree().deselect_all(true);
                        $('#jstreeSeriesList').jstree(true).select_node(target);
                    }
                    var scrollTop = $(window).scrollTop();
                    var scrollLeft = $(window).scrollLeft();
                    contextMenu1.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
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

        var contextMenu1 = $("#seriesListTreeMenu").jqxMenu({
            width: '140px',
            height: '96px',
            autoOpenPopup: false,
            mode: 'popup'
        });

        $(document).on('contextmenu', function(e) {
            console.log($(e.target));
            try {
                if ($(e.target).context.id == "jstreeSeriesList" || $(e.target).parents('#jstreeSeriesList').length > 0) {
                    if (seriesToAdd1 == null) {
                        $("#seriesListTreeMenu").jqxMenu('disable', 'slPaste', true);
                    } else {
                        $("#seriesListTreeMenu").jqxMenu('disable', 'slPaste', false);
                    }
                    if ($('#jstreeSeriesList').html() != "") {
                        var selectItem = $('#jstreeSeriesList').jstree(true).get_selected("full", true)[0];
                        if (selectItem != undefined) {
                            $("#seriesListTreeMenu").jqxMenu('disable', 'slProperties', false);
                            $("#seriesListTreeMenu").jqxMenu('disable', 'slRemove', false);
                        } else {
                            $("#seriesListTreeMenu").jqxMenu('disable', 'slProperties', true);
                            $("#seriesListTreeMenu").jqxMenu('disable', 'slRemove', true);
                        }
                    } else {
                        $("#seriesListTreeMenu").jqxMenu('disable', 'slProperties', true);
                        $("#seriesListTreeMenu").jqxMenu('disable', 'slRemove', true);
                    }
                    return false;
                }
            } catch (error) {
                setSession( 0, "IsPopup");
                
                setCookie("remaining", getSession('defaultMin')*60*1000);
                setTimeout(() => {
                    sessionTimeFunc();
                    call_api_ajax('RenewSessionToken', 'get', {
                        SessionToken: getSession()
                    }, false, (data) => {
                        $('#session-token').text(getSession());
                    }, null, null, saveLocation = true)
                }, 300);
                return true;
            }
            return true;
        });

        attachContextMenu1();

        $("#seriesListTreeMenu").on('itemclick', function(event) {
            var item = $.trim($(event.args).text());
            switch (item) {
                case "Paste":
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        if (seriesToAdd1 != null) {
                            if ($('#jstreeSeriesList').html() != "") {
                                var selectItem = $('#jstreeSeriesList').jstree(true).get_selected("full", true)[0];
                                if (selectItem != undefined) {
                                    folderToAdd1 = selectItem.original.value.series[0].tid;
                                }
                            }
                            openBatesList();
                            seriesToAdd1 = null;
                        }
                    }
                    break;
                case "Series Properties":
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        var selectItem = $('#jstreeSeriesList').jstree(true).get_selected("full", true)[0];
                        if (selectItem != undefined) {
                            editBatesList();
                        }
                    }
                    break;
                case "Remove":
                    if (getSession() == undefined || getSession() == "") {
                        openLoginPopup();
                    } else {
                        var selectItem = $('#jstreeSeriesList').jstree(true).get_selected("full", true)[0];
                        if (selectItem != undefined) {
                            removeBatesList();
                        }
                    }
                    break;
            }
        });
    }

    // Init drag&drop functionality 
    function repoCreatorgridDragAndDropInit() {
        // select all grid cells.
        var gridCells = $('#repoCreatorgrid').find('.slick-cell');

        // initialize the jqxDragDrop plug-in. Set its drop target to the second Grid.
        if (gridCells.length > 0) {
            gridCells.jqxDragDrop({
                appendTo: 'body',
                dragZIndex: 99999,
                dropAction: 'none',
                cursor: 'arrow',
                initFeedback: function(proxy) {
                    var rowsindexes = reportCreatorGrid.getSelectedRows()
                    proxy.height(25);
                    proxy.width($("#repoCreatorgrid").width());
                    proxy.css('display', 'none');
                },
                dropTarget: $('#jstreeSeriesList'),
                revert: false
            });
        }

        gridCells.off('dragStart');
        gridCells.off('dragEnd');

        // initialize the dragged object.
        gridCells.on('dragStart', function(event) {
            isDragStart1 = true;
            var value = $(this).text();
            var cell = reportCreatorGrid.getActiveCell();
            var rowsindexes = reportCreatorGrid.getSelectedRows();

            if (rowsindexes.length != 0) {
                var rows = [];
                var clickedrow = cell.row;
                var isselected = false;
                for (var i = 0; i < rowsindexes.length; i++) {
                    if (rowsindexes[i] == clickedrow) {
                        isselected = true;
                    }
                    rows.push(reportCreatorGrid.getDataItem(rowsindexes[i]));
                }
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
            if (element1.id && $('#jstreeSeriesList').html() != "") {
                item = $('#jstreeSeriesList').jstree(true).get_node(element1.id);
            }

            if (!item) {
                if (value != null) {
                    openBatesList();
                }
            } else if (item.original.value.root == true) {
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
                            Symbol: value[i].Symbol,
                            Bates: value[i].Bates
                        });
                    }

                    seriesToAdd1 = arr;
                    folderToAdd1 = item.original.value.series[0].tid;

                    openBatesList();
                }
            }
            isDragStart1 = false;
        });
    }

    $('#reportCreator').on('open', function(event) {
        resultJson = [];
        $('#jstreeSeriesList').jstree("destroy").empty();
        if (getCookie("editReport") != undefined && getCookie("editReport") != "" && getCookie("editReport") != "new") {
            const data = userFavorites;
            let reportJson = JSON.parse(getCookie('reportJson'));

            for (var i = 0; i < Object.keys(reportJson.Series).length; i++) {
                data.map((e, j) => {
                    if (e.Symbol == reportJson.Series[i].Symbol) {
                        var bates = e.Bates;
                        var obj = {
                            children: [],
                            icon: "resources/css/icons/tree-folder.png",
                            label: e.Symbol + " " + e.Name + " (" + e.Datasource + ")",
                            text: e.Symbol + " " + e.Name + " (" + e.Datasource + ")",
                            value: { name: e.Symbol + " " + e.Name + " (" + e.Datasource + ")", series: [{ Datasource: e.Datasource, Symbol: e.Symbol, Datacategory: e.Datacategory, tid: resultJson.length }], items: [], root: false },
                            expanded: true
                        }

                        for (var k = 0; k < reportJson.Series[i].BateIndex.length; k++) {
                            var batesIndex = resultJson.length + "-" + reportJson.Series[i].BateIndex[k];
                            var batesLabel = bates[reportJson.Series[i].BateIndex[k]];

                            obj.children.push({
                                icon: "resources/css/icons/ts2.png",
                                items: [],
                                id: batesIndex,
                                text: batesLabel,
                                value: { name: batesLabel, series: [{ Datasource: e.Datasource, Symbol: e.Symbol, Datacategory: e.Datacategory, tid: resultJson.length }], items: [], root: false }
                            });

                            obj.value.items.push({
                                text: batesLabel,
                                id: batesIndex
                            });
                        }

                        resultJson.push(obj);
                    }
                });
            }

            setTimeout(() => {
                $('#jstreeSeriesList').jstree({
                    "core": {
                        "data": resultJson,
                        "multiple": false,
                        "animation": 1,
                        "check_callback": function(operation, node, node_parent, node_position, more) {
                            if (operation === 'move_node' && node.parent !== node_parent.id) {
                                return false;
                            }
                            return true;
                        },
                        "dblclick_toggle": false
                    },
                    "plugins": ["dnd"],
                });

                $("jstreeSeriesList").css("padding", "6px 0 6px 0;");

                $('#jstreeSeriesList').on('loaded.jstree', function() {
                    setTimeout(() => {
                        $('#jstreeSeriesList').on('dblclick.jstree', function(e) {
                            editBatesList();
                        });

                        $('#jstreeSeriesList').on("select_node.jstree", function(e, data) {
                            if (seriesToAdd1 == null) {
                                $("#seriesListTreeMenu").jqxMenu('disable', 'slPaste', true);
                            } else {
                                $("#seriesListTreeMenu").jqxMenu('disable', 'slPaste', false);
                            }
                        });

                        $('#jstreeSeriesList').on("move_node.jstree copy_node.jstree", function() {
                            var items = $('#jstreeSeriesList').jstree(true).get_json('#', {
                                flat: true,
                                no_data: true
                            });

                            var data = [];
                            var parentNode = "";
                            var parentSeries = [];
                            for (var i = 0; i < items.length; i++) {
                                if (items[i].parent == "#") {
                                    for (var j = 0; j < resultJson.length; j++) {
                                        if (items[i].text == resultJson[j].text) {
                                            data.push({
                                                children: [],
                                                expanded: true,
                                                icon: resultJson[j].icon,
                                                label: resultJson[j].label,
                                                text: resultJson[j].text,
                                                value: {
                                                    items: [],
                                                    name: resultJson[j].value.name,
                                                    root: false,
                                                    series: [{
                                                        Datasource: resultJson[j].value.series[0].Datasource,
                                                        Symbol: resultJson[j].value.series[0].Symbol,
                                                        Datacategory: resultJson[j].value.series[0].Datacategory,
                                                        tid: data.length - 1
                                                    }]
                                                }
                                            });

                                            parentNode = items[i].text
                                            parentSeries = data[data.length - 1].value.series;

                                            break;
                                        }
                                    }
                                } else {
                                    for (var j = 0; j < data.length; j++) {
                                        if (data[j].text == parentNode && data[j].value.series[0].tid == parentSeries[0].tid) {
                                            data[j].children.push({
                                                icon: items[i].icon,
                                                items: [],
                                                id: items[i].id,
                                                text: items[i].text,
                                                value: {
                                                    tems: [],
                                                    name: items[i].text,
                                                    root: false,
                                                    series: parentSeries
                                                }
                                            });

                                            data[j].value.items.push({
                                                text: items[i].text,
                                                value: items[i].id
                                            });
                                        }
                                    }
                                }
                            }

                            resultJson = data;
                        })
                    }, 50);
                });

                setTimeout(() => {
                    $('#jstreeSeriesList').jstree('open_all');
                }, 100);
            }, 50);

        }
    });

    $("#batesListPopup").dialog({
        resizable: true,
        autoOpen: false,
        height: "auto",
        width: "auto",
        modal: true,
        // buttons: [
        //     {
        //         text: "OK",
        //         click: function() {
        //             refreshSeriesList();
        //         }
        //     }
        // ],
        resize: function(event, ui) {
            // console.log("===", $("#batesListPopup").height());
            $(".ui-dialog").css("min-width", 340).css("min-height", 270);
            $("#batesListPopup").css("width", "100%").css("height", parseInt($(".ui-dialog").height()) - 32).css("overflow", "unset").css("min-width", 330).css("min-height", 230);
            $("#batesListPan").jqxListBox("width", parseInt($("#batesListPopup").width()) - 2);
            $("#batesListPan").jqxListBox("height", parseInt($("#batesListPopup").height()) - 52);
            $("#batesListPan").css("border-radius", 1);
        },
    });

    $("#selAllBates").jqxCheckBox({
        width: 140,
        height: 26,
        checked: false
    });

    $("#selAllBates").on('change', function(event) {
        if ($("#selAllBates").jqxCheckBox("checked") == false) {
            $("#batesListPan").jqxListBox('uncheckAll');
        } else {
            $("#batesListPan").jqxListBox('checkAll');
        }
    });

    $("#btnSelectBates").jqxButton({
        width: '55px',
        height: '26px',
        textPosition: "center",
        disabled: true
    });
    $('#btnSelectBates span').css('left', 19);

    $("#btnSelectBates").on('click', function() {
        var bates = $("#batesListPan").jqxListBox('getCheckedItems');
        if (bates.length > 0) {
            refreshSeriesList(seriesItem);
        }
    });

    $("#batesListPan").jqxListBox({ width: 300, source: [], checkboxes: true, height: 165 });

    $("#batesListPan").on('checkChange', function(event) {
        var args = event.args;
        // get new check state.
        var checked = args.checked;

        setTimeout(() => {
            // get all checked items.
            var checkedItems = $("#batesListPan").jqxListBox('getCheckedItems');

            if (checkedItems.length > 0) {
                $("#btnSelectBates").jqxButton("disabled", false);
            } else {
                $("#btnSelectBates").jqxButton("disabled", true);
            }
        }, 50);
    });

    $('#jstreeSeriesList').jstree({
        "core": {
            "data": [],
            "check_callback": true,
            "dblclick_toggle": false
        },
        "plugins": ["dnd"],
    });

    $("#upArrow").jqxButton({
        imgSrc: "resources/images/up_14.png",
        imgPosition: "center",
        width: 30,
        height: 30,
        imgWidth: 13,
        imgHeight: 13
    });
    $("#upArrow img").css("top", 8).css("left", 8);

    $("#upArrow").on('click', function() {
        if ($('#jstreeSeriesList').html() != "") {

            var items = $('#jstreeSeriesList').jstree(true).get_json('#', {
                flat: true
            });

            var from = 0,
                to;

            var selectItem = $('#jstreeSeriesList').jstree(true).get_selected("full", true)[0];
            parentNo = 0;

            if (selectItem != undefined) {
                items.map((e, i) => {
                    if (e.parent == "#") {
                        parentNo++;
                    }

                    if (e.id == selectItem.id) {
                        to = (selectItem.parent == "#") ? parentNo : i;
                    }

                    if (e.id == selectItem.parent) {
                        from = (selectItem.parent == "#") ? 0 : i;
                    }
                });

                if ((to - from - 2) > -1) {
                    $('#jstreeSeriesList').jstree("move_node", "#" + selectItem.id, "#" + selectItem.parent, parseInt(to - from - 2));
                }
            }

            // var prev_node = null;

            // if (selectItem != undefined) {
            //     var items = $('#jstreeSeriesList').jstree(true).get_json('#', {
            //         flat: true
            //     });

            //     $("#jstreeSeriesList").jstree().deselect_all(true);
            //     if (selectItem.parent == "#") {
            //         items.map((e, i) => {
            //             if (e.id == selectItem.id) {
            //                 if (prev_node != null) {
            //                     $('#jstreeSeriesList').jstree(true).select_node(prev_node);
            //                 } else {
            //                     $('#jstreeSeriesList').jstree(true).select_node(e);
            //                 }
            //             } else {
            //                 if (e.parent == "#") {
            //                     prev_node = e;
            //                 }
            //             }
            //         });
            //     } else {
            //         items.map((e, i) => {
            //             if (e.id == selectItem.id) {
            //                 if (prev_node.parent != "#") {
            //                     $('#jstreeSeriesList').jstree(true).select_node(prev_node);
            //                 } else {
            //                     $('#jstreeSeriesList').jstree(true).select_node(e);
            //                 }
            //             } else {
            //                 prev_node = e;
            //             }
            //         });
            //     }
            // }
        }
    });

    $("#downArrow").jqxButton({
        imgSrc: "resources/images/down_14.png",
        imgPosition: "center",
        width: 30,
        height: 30,
        imgWidth: 13,
        imgHeight: 13
    });
    $("#downArrow img").css("top", 8).css("left", 8);

    $("#downArrow").on('click', function() {
        if ($('#jstreeSeriesList').html() != "") {
            var items = $('#jstreeSeriesList').jstree(true).get_json('#', {
                flat: true
            });

            var from = 0,
                to;

            var selectItem = $('#jstreeSeriesList').jstree(true).get_selected("full", true)[0];
            parentNo = 0;

            if (selectItem != undefined) {
                items.map((e, i) => {
                    if (e.parent == "#") {
                        parentNo++;
                    }

                    if (e.id == selectItem.id) {
                        to = (selectItem.parent == "#") ? parentNo : i;
                    }

                    if (e.id == selectItem.parent) {
                        from = (selectItem.parent == "#") ? 0 : i;
                    }
                });

                console.log("to", to);
                console.log("from", from);

                $('#jstreeSeriesList').jstree("move_node", "#" + selectItem.id, "#" + selectItem.parent, parseInt(to - from + 1));
            }

            // if (selectItem != undefined) {
            //     var items = $('#jstreeSeriesList').jstree(true).get_json('#', {
            //         flat: true
            //     });

            //     $("#jstreeSeriesList").jstree().deselect_all(true);
            //     if (selectItem.parent == "#") {
            //         var i = items.length - 1;
            //         while (i > -1) {
            //             if (items[i].id == selectItem.id) {
            //                 if (next_node != null) {
            //                     $('#jstreeSeriesList').jstree(true).select_node(next_node);
            //                 } else {
            //                     $('#jstreeSeriesList').jstree(true).select_node(items[i]);
            //                 }
            //             } else {
            //                 if (items[i].parent == "#") {
            //                     next_node = items[i];
            //                 }
            //             }
            //             i--;
            //         }
            //     } else {
            //         var i = items.length - 1;
            //         while (i > -1) {
            //             if (items[i].id == selectItem.id) {
            //                 if (next_node != null && next_node.parent != "#") {
            //                     $('#jstreeSeriesList').jstree(true).select_node(next_node);
            //                 } else {
            //                     $('#jstreeSeriesList').jstree(true).select_node(items[i]);
            //                 }
            //             } else {
            //                 next_node = items[i];
            //             }
            //             i--;
            //         }
            //     }
            // }
        }
    });

    $("#deleteBtn").jqxButton({
        imgSrc: "resources/images/del_series.png",
        imgPosition: "center",
        width: 30,
        height: 30,
        imgWidth: 20,
        imgHeight: 20
    });

    $("#deleteBtn").on('click', function() {
        if (getSession() == undefined || getSession() == "") {
            openLoginPopup();
        } else {
            if ($('#jstreeSeriesList').html() != "") {
                var selectItem = $('#jstreeSeriesList').jstree(true).get_selected("full", true)[0];
                if (selectItem != undefined) {
                    removeBatesList();
                }
            }
        }
    });

    $("#propertiesBtn").jqxButton({
        imgSrc: "resources/images/series-prop.png",
        imgPosition: "center",
        width: 30,
        height: 30,
        imgWidth: 20,
        imgHeight: 20
    });

    $("#propertiesBtn").on('click', function() {
        if (getSession() == undefined || getSession() == "") {
            openLoginPopup();
        } else {
            if ($('#jstreeSeriesList').html() != "") {
                var selectItem = $('#jstreeSeriesList').jstree(true).get_selected("full", true)[0];
                if (selectItem != undefined) {
                    editBatesList();
                }
            }
        }
    });

    function refreshSeriesList(seriesItem = null) {
        $("#batesListPopup").dialog("close");

        if (seriesItem != null) {
            if (seriesItem.Bates.length > 1) {
                var bates = $("#batesListPan").jqxListBox('getCheckedItems');
            } else {
                var bates = seriesItem.Bates;
            }

            var obj = {
                children: [],
                icon: "resources/css/icons/tree-folder.png",
                label: seriesItem.Symbol + " " + seriesItem.Name + " (" + seriesItem.Datasource + ")",
                text: seriesItem.Symbol + " " + seriesItem.Name + " (" + seriesItem.Datasource + ")",
                value: { name: seriesItem.Symbol + " " + seriesItem.Name + " (" + seriesItem.Datasource + ")", series: [{ Datasource: seriesItem.Datasource, Symbol: seriesItem.Symbol, Datacategory: seriesItem.Datacategory, tid: resultJson.length }], items: [], root: false },
                expanded: true
            }

            for (var i = 0; i < bates.length; i++) {
                let batesLabel;
                if (seriesItem.Bates.length > 1) {
                    batesIndex = resultJson.length + "-" + bates[i].index;
                    batesLabel = bates[i].value;
                } else {
                    batesIndex = resultJson.length + "-" + 0;
                    batesLabel = bates[i];
                }

                obj.children.push({
                    icon: "resources/css/icons/ts2.png",
                    items: [],
                    id: batesIndex,
                    text: batesLabel,
                    value: { name: batesLabel, series: [{ Datasource: seriesItem.Datasource, Symbol: seriesItem.Symbol, Datacategory: seriesItem.Datacategory, tid: resultJson.length }], items: [], root: false }
                });

                obj.value.items.push({
                    text: batesLabel,
                    id: batesIndex
                });
            }

            if ($("#sel_tID").val() != "") {
                resultJson.map((e, i) => {
                    if (e.value.series[0].tid == $("#sel_tID").val()) {
                        resultJson[i] = obj;
                    }
                });
            } else {
                if (folderToAdd1 != null) {
                    resultJson.splice(parseInt(folderToAdd1 + 1), 0, obj);
                    resultJson.map((e, i) => {
                        e.value.series[0].tid = i
                    });
                } else {
                    resultJson.push(obj);
                }
            }

            $('#jstreeSeriesList').jstree("destroy").empty();
            $('#jstreeSeriesList').jstree({
                "core": {
                    "data": resultJson,
                    "multiple": false,
                    "animation": 1,
                    "check_callback": function(operation, node, node_parent, node_position, more) {
                        if (operation === 'move_node' && node.parent !== node_parent.id) {
                            return false;
                        }
                        return true;
                    },
                    "dblclick_toggle": false
                },
                "plugins": ["dnd"],
            });

            $("jstreeSeriesList").css("padding", "6px 0 6px 0;");

            $('#jstreeSeriesList').on('loaded.jstree', function() {
                setTimeout(() => {
                    $('#jstreeSeriesList').on('dblclick.jstree', function(e) {
                        editBatesList();
                    });

                    $('#jstreeSeriesList').on("select_node.jstree", function(e, data) {
                        if (seriesToAdd1 == null) {
                            $("#seriesListTreeMenu").jqxMenu('disable', 'slPaste', true);
                        } else {
                            $("#seriesListTreeMenu").jqxMenu('disable', 'slPaste', false);
                        }
                    });

                    $('#jstreeSeriesList').on("move_node.jstree copy_node.jstree", function() {
                        var items = $('#jstreeSeriesList').jstree(true).get_json('#', {
                            flat: true,
                            no_data: true
                        });

                        var data = [];
                        var parentNode = "";
                        var parentSeries = [];
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].parent == "#") {
                                for (var j = 0; j < resultJson.length; j++) {
                                    if (items[i].text == resultJson[j].text) {
                                        data.push(resultJson[j]);
                                        data[data.length - 1].children = [];
                                        data[data.length - 1].value.items = [];
                                        data[data.length - 1].value.series[0].tid = i;

                                        parentNode = items[i].text
                                        parentSeries = data[data.length - 1].value.series;
                                    }
                                }
                            } else {
                                for (var j = 0; j < data.length; j++) {
                                    if (data[j].text == parentNode) {
                                        data[j].children.push({
                                            icon: items[i].icon,
                                            items: [],
                                            id: items[i].id,
                                            text: items[i].text,
                                            value: {
                                                tems: [],
                                                name: items[i].text,
                                                root: false,
                                                series: parentSeries
                                            }
                                        });

                                        data[j].value.items.push({
                                            text: items[i].text,
                                            value: items[i].id
                                        });
                                    }
                                }
                            }
                        }

                        resultJson = data;
                    })
                }, 50);
            });

            setTimeout(() => {
                $('#jstreeSeriesList').jstree('open_all');
            }, 50);
        }

        folderToAdd1 = null;
    }

    function openBatesList() {
        $("#sel_tID").val("");

        var rowsindexes = reportCreatorGrid.getSelectedRows();
        seriesItem = reportCreatorGrid.getDataItem(rowsindexes[0]);
        var source = seriesItem.Bates;

        if (source.length > 1) {
            $('#batesListPopup').dialog("open");
            $(".ui-dialog").css("padding", "0");
            $(".ui-dialog-titlebar").css("background-color", "rgb(58, 121, 215)");
            $(".ui-dialog-title").css("color", "#fff").css("font-weight", "normal").css("padding-left", "25px").css("margin-left", "-5px");
            $(".ui-dialog .ui-dialog-buttonpane").css("border-top", "0");

            $("#batesListPan").jqxListBox("source", source);
            $("#batesListPan").jqxListBox('uncheckAll');
            $("#selAllBates").jqxCheckBox("checked", false);
        } else {
            refreshSeriesList(seriesItem);
        }
    }

    function editBatesList() {
        const data = userFavorites;
        var selectItem = $('#jstreeSeriesList').jstree(true).get_selected("full", true)[0];

        reportCreatorGrid.getData().getItems().map((e, i) => {
            if (e.Symbol == selectItem.original.value.series[0].Symbol) {
                seriesItem = e;
            }
        });

        data.map((e, i) => {
            if (e.Symbol == selectItem.original.value.series[0].Symbol) {
                $('#batesListPopup').dialog("open");
                $(".ui-dialog").css("padding", "0");
                $(".ui-dialog-titlebar").css("background-color", "rgb(58, 121, 215)");
                $(".ui-dialog-title").css("color", "#fff").css("font-weight", "normal").css("padding-left", "25px").css("background", "url(resources/css/icons/Favorites16.png) 0px no-repeat").css("margin-left", "-5px");
                $(".ui-dialog .ui-dialog-buttonpane").css("border-top", "0");
                $("#sel_tID").val(selectItem.original.value.series[0].tid);

                var source = e.Bates;

                $("#batesListPan").jqxListBox("source", source);

                resultJson.map((f, j) => {
                    if (f.value.series[0].Symbol == e.Symbol && f.value.series[0].tid == selectItem.original.value.series[0].tid) {
                        $("#batesListPan").jqxListBox('uncheckAll');
                        f.value.items.map((g, k) => {
                            $("#batesListPan").jqxListBox('checkItem', g.text);
                        });
                    }
                });
            }
        });
    }

    function removeBatesList() {
        var selectItem = $('#jstreeSeriesList').jstree(true).get_selected("full", true)[0];

        if (selectItem.children.length == 0) {
            dialogWindow("Are you sure you want to remove the bate(s):<br/>'" + selectItem.original.value.name + "'", 'warning', 'confirm', 'WebXL Report Editor', () => {
                resultJson.map((f, i) => {
                    if (f.value.series[0].tid == selectItem.original.value.series[0].tid) {
                        if (f.children.length > 1) {
                            for (var j = 0; j < f.children.length; j++) {
                                if (f.children[j].label == selectItem.original.value.name) {
                                    resultJson[i].children.splice(j, 1);
                                    resultJson[i].value.items.splice(j, 1);
                                }
                            }
                        } else {
                            resultJson.splice(i, 1);
                        }
                    }
                });

                $('#jstreeSeriesList').jstree("destroy").empty();
                $('#jstreeSeriesList').jstree({
                    "core": {
                        "data": resultJson,
                        "multiple": false,
                        "animation": 1,
                        "check_callback": function(operation, node, node_parent, node_position, more) {
                            if (operation === 'move_node' && node.parent !== node_parent.id) {
                                return false;
                            }
                            return true;
                        },
                        "dblclick_toggle": false
                    },
                    "plugins": ["dnd"],
                });

                $("jstreeSeriesList").css("padding", "6px 0 6px 0;");

                $('#jstreeSeriesList').on('loaded.jstree', function() {
                    setTimeout(() => {
                        $('#jstreeSeriesList').on('dblclick.jstree', function(e) {
                            editBatesList();
                        });
                    }, 50);
                });

                setTimeout(() => {
                    $('#jstreeSeriesList').jstree('open_all');
                }, 50);
            });

            $(".ui-dialog").css("padding", "0");
            $(".ui-dialog-titlebar").css("background-color", "rgb(58, 121, 215)");
            $(".ui-dialog-title").css("color", "#fff").css("font-weight", "normal").css("padding-left", "25px").css("background", "url(resources/css/icons/Favorites16.png) 0px no-repeat").css("margin-left", "-5px");

            $(".ui-button").css("box-shadow", "-1px 0 5px rgb(0 0 0 / 25%);").css("border-color", "transparent !important").css("background-color", "rgb(237, 237, 237) !important").css("border", "1px solid #ddd");
        } else {
            dialogWindow("Remove the contract:<br/>'" + selectItem.original.value.name.split('-')[1].trim() + "'?", 'warning', 'confirm', 'WebXL Report Editor', () => {
                resultJson.map((f, i) => {
                    if (f.value.series[0].tid == selectItem.original.value.series[0].tid) {
                        resultJson.splice(i, 1);
                    }
                });

                $('#jstreeSeriesList').jstree("destroy").empty();
                $('#jstreeSeriesList').jstree({
                    "core": {
                        "data": resultJson,
                        "multiple": false,
                        "animation": 1,
                        "check_callback": function(operation, node, node_parent, node_position, more) {
                            if (operation === 'move_node' && node.parent !== node_parent.id) {
                                return false;
                            }
                            return true;
                        },
                        "dblclick_toggle": false
                    },
                    "plugins": ["dnd"],
                });

                $("jstreeSeriesList").css("padding", "6px 0 6px 0;");

                $('#jstreeSeriesList').on('loaded.jstree', function() {
                    setTimeout(() => {
                        $('#jstreeSeriesList').on('dblclick.jstree', function(e) {
                            editBatesList();
                        });
                    }, 50);
                });

                setTimeout(() => {
                    $('#jstreeSeriesList').jstree('open_all');
                }, 50);
            });

            $(".ui-dialog").css("padding", "0");
            $(".ui-dialog-titlebar").css("background-color", "rgb(58, 121, 215)");
            $(".ui-dialog-title").css("color", "#fff").css("font-weight", "normal").css("padding-left", "25px").css("background", "url(resources/css/icons/Favorites16.png) 0px no-repeat").css("margin-left", "-5px");
            $(".ui-button").css("box-shadow", "-1px 0 5px rgb(0 0 0 / 25%);").css("border-color", "transparent !important").css("background-color", "rgb(237, 237, 237) !important").css("border", "1px solid #ddd");
        }
    }

    function buildMap(obj) {
        let map = new Map();
        var keys = Object.keys(obj);
        keys.forEach(function(key, i, keys) {
            map.set(key, obj[key]);
        });
        return map;
    }

});