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


var LIST_SUBS = []
var LIST = []

function resizeColumns(grid_id) {
    var grid = $("#" + grid_id),
        columns = grid.jqxGrid('columns'),
        rows = grid.jqxGrid('getrows'),
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
    columns_width = {},
        K = 10;

    if (grid.find('#verticalScrollBar' + grid_id).length && grid.find('#verticalScrollBar' + grid_id).css('visibility') !== "hidden") {
        z = 2.2;
    }

    if (columns !== undefined && columns.records !== undefined) {
        columns = columns.records;

        grid.jqxGrid('autoresizecolumns');
        width = grid.width();
        descriptionWidth = grid.jqxGrid('getcolumnproperty', 'Name', 'width'),
            descriptionMinWidth = grid.jqxGrid('getcolumnproperty', 'Name', 'minwidth');

        columns.map(function (column) {
            if (!column.hidden) {
                let firstColumnData = [];

                for (var i = 0; i < rows.length; i++) {
                    let value = rows[i][column.datafield];

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
                all_data[column.text] = firstColumnData;
                datafield[column.text] = column.datafield;
                index_array[column.text] = index;
            }
            index++;
        });


        for (var i in all_data) {
            if (all_data[i].length > 0) {
                let l = 0;
                all_data[i].map(function (v) {
                    if (v !== undefined && v !== null) {
                        if (typeof v !== 'boolean' && v.length > l)
                            l = v.length;
                    }
                });

                if (i.split('<').length == 0 && l < i.length) l = i.length;

                var w = grid.jqxGrid('getcolumnproperty', datafield[i], 'width');

                if (datafield[i] !== 'Name') {
                    let width = (l * K > w) ? l * K : w;

                    if (datafield[i] == 'Datasource')
                        width += grid.jqxGrid('getcolumnproperty', datafield[i], 'minwidth');

                    columns_width[datafield[i]] = width;
                    columns[index_array[i]]['width'] = width;
                    widthWithoutDescription += (width + z);
                }
            }
        }

        if (descriptionWidth + widthWithoutDescription > width) {
            if (descriptionMinWidth + widthWithoutDescription < width)
                descriptionWidth = width - widthWithoutDescription;
            else
                descriptionWidth = descriptionMinWidth;
        }
        else
            descriptionWidth = width - widthWithoutDescription;

        columns.map(function (v) {
            if (v.datafield == "Name")
                v.width = descriptionWidth;
        });

        grid.jqxGrid({ columns: columns });
        grid.jqxGrid('refresh');
    }
}

function print(msg) {
    console.log(msg)
}

var additional_renderer = function (row, datafield, value, html, columnproperties, record) {
    var txt = JSON.stringify(value);
    // $(".popup-content").html( txt )
    if (value != "")
        var showVal = 'View Object';
    else
        var showVal = '';

    setCookie('additionalJSON' + row, txt);

    if (record == undefined)
        var symbol = '';
    else
        var symbol = record.Symbol;

    return '<div class="jqx-grid-cell-left-align" id="vCenter" ><a target="_blank" onclick="JqxPopup(' + row + ', \'' + symbol + '\');">' + showVal + '</a></div>';
}

$(document).ready(function () {

    $(".fixpage").removeClass('fullscreen')

    $('#mainSplitter').jqxSplitter({ width: '100%', height: '100%', panels: [{ size: '270px' }, { size: '80%' }] });

    $.jqx.utilities.scrollBarSize = 10;

    // Get user data and check if session is not Expired
    call_api_ajax('GetMyAccountDetails', 'get', { SessionToken: sessionToken }, false, (data) => {
        userName = data.Result.Name;
        $('#username').text(userName);
        $("body").removeClass("wait");
    });

    $('#profile').attr('href', 'profile?tab=MyProfile');
    $('#favorites').attr('href', 'profilemain?tab=favorites');
    $('#logout').click(function () {
        logout();
    });


    var littleFlag = 0;
    function resizeElements() {
        var contentBottomPadding = $("#main-footer").height();
        $('#jqxWidget').css('height', (window.innerHeight - 120 - contentBottomPadding + 5) + 'px');
        // $('#jqxWidget').css('height', (window.innerHeight - $(".navbar").height() -  $("footer").height() ) + 'px');

        if (window.innerWidth < 1000)
            $('#main-footer').css('width', (window.innerWidth + 150) + 'px');
        // else{
        //     if(window.innerWidth > 1200)
        //         $('#main-footer').css('width', (100) + '%');
        //     else
        //         $('#main-footer').css('width', (100) + '%');
        // }
    }
    $(window).resize(function () {
        if (littleFlag === 0) {
            littleFlag = 1;
            window.dispatchEvent(new Event('resize'));
            setTimeout(function () { littleFlag = 0; }, 1000);
        }
        resizeElements();
    });

    if (littleFlag === 0) {
        littleFlag = 1;
        window.dispatchEvent(new Event('resize'));
        setTimeout(function () { littleFlag = 0; }, 1000);
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

    $("#jqxLoader").jqxLoader({ width: 100, height: 60, autoOpen: false, imagePosition: 'top', text: "Requesting data..." });

    var globalMoveFolders = false;

    var symbol_renderer = function (row, datafield, value, html, columnproperties, record) {
        if (record == undefined) return '';
        return '<div class="jqx-grid-cell-left-align"><a target="_blank" onclick="openSeriesInNewTab(\'' + record.Datasource + '\',\'' + value + '\',\'' + record.Datacategory + '\');">' + value + '</a></div>';
    }
    var imagesMap;
    var databaseColumnRender = function (row, columnfield, value, defaulthtml, columnproperties) {
        var databaseImage;
        if (imagesMap.get(value)) databaseImage = imagesMap.get(value);
        else databaseImage = 'default_white.png';
        return '<div id="databaseColumnRender"> <img src="' + databaseImage + '">' + value + '</div>';
    }

    var favoritesGridSource, favoritesGridDataAdapter;
    var baseDataFields = [
        { name: 'Symbol', type: 'string' },
        { name: 'Datacategory', type: 'string' },
        { name: 'Name', type: 'string' },
        { name: 'Datasource', type: 'string' },
        { name: 'Frequency', type: 'string' },
        { name: 'Currency', type: 'string' },
        { name: 'Unit', type: 'string' },
        //		{ name: 'Icon', type: 'string' },
        { name: 'Logo', type: 'string' },
        { name: 'Decimals', type: 'int' },
        { name: 'Bates', type: 'array' },
        { name: 'BateIndex', type: 'array' },
        { name: 'Conversions', type: 'array' },
        { name: 'Values', type: 'int' },
        { name: 'Corrections', type: 'int' },
        { name: 'Premium', type: 'boolean' },
        { name: 'Subscription', type: 'string' },
        { name: 'Additional', type: 'string' },
        { name: 'Favorite', type: 'boolean' },
        { name: 'StartDate', type: 'date' },
        { name: 'EndDate', type: 'date' },
        { name: 'Conversions', type: 'string' }
    ];
    var baseGridColumns = [
        { text: 'Datasource', datafield: 'Datasource', cellsalign: 'center', align: 'center', minwidth: 30, width: 100, cellsrenderer: databaseColumnRender },
        { text: 'Symbol', groupable: false, datafield: 'Symbol', cellsalign: 'center', align: 'center', minwidth: 10, width: 100, cellsrenderer: symbol_renderer },
        { text: 'Name', groupable: false, datafield: 'Name', cellsalign: 'left', align: 'left', minwidth: 100, width: 300 },
        { text: 'Frequency', groupable: false, datafield: 'Frequency', cellsalign: 'left', align: 'left', minwidth: 10, width: 80 },
        { text: 'From', groupable: false, datafield: 'StartDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'left', align: 'left', minwidth: 10, width: 80 },
        { text: 'To', groupable: false, datafield: 'EndDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'left', align: 'left', width: 80 },
        { text: '# Prices', groupable: false, datafield: 'Values', filtertype: 'number', cellsalign: 'right', align: 'center', minwidth: 10, width: 80 },
        { text: 'Currency', datafield: 'Currency', sortable: false, cellsalign: 'left', align: 'center', minwidth: 10, width: 75, hidden: true },
        { text: 'Decimals', datafield: 'Decimals', sortable: false, cellsalign: 'right', align: 'center', minwidth: 10, width: 65, hidden: true },
        { text: 'Unit', datafield: 'Unit', sortable: false, cellsalign: 'left', align: 'center', minwidth: 10, width: 50, hidden: true },
        { text: 'Conversions', datafield: 'Conversions', sortable: false, cellsalign: 'left', align: 'center', minwidth: 10, width: 50, hidden: true },
        { text: 'Additional', datafield: 'Additional', sortable: false, cellsalign: 'left', align: 'center', minwidth: 10, width: 150, hidden: true, cellsrenderer: additional_renderer }
    ];

    function hideAdditInfo(elem) {
        $('#' + elem).jqxGrid('showloadelement');
        $('#' + elem).jqxGrid('hidecolumn', 'Currency');
        $('#' + elem).jqxGrid('hidecolumn', 'Unit');
        $('#' + elem).jqxGrid('hidecolumn', 'Conversions');
        $('#' + elem).jqxGrid('hidecolumn', 'Decimals');
        $('#' + elem).jqxGrid('hidecolumn', 'Additional');
        resizeColumns(elem);
        $('#' + elem).jqxGrid('hideloadelement');
    }

    function showAdditInfo(elem) {
        $('#' + elem).jqxGrid('showloadelement');
        $('#' + elem).jqxGrid('showcolumn', 'Currency');
        $('#' + elem).jqxGrid('showcolumn', 'Unit');
        $('#' + elem).jqxGrid('showcolumn', 'Conversions');
        $('#' + elem).jqxGrid('showcolumn', 'Decimals');
        $('#' + elem).jqxGrid('showcolumn', 'Additional');
        resizeColumns(elem);
        $('#' + elem).jqxGrid('hideloadelement');
    }

    var keyboardNavigation = function (event) {
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
            case 39:// right
                if (v < max) v += step;
                if (v > max) v = max;
                break;
            case 37: // left
                if (v > min) v -= step;
                if (v < 0) v = 0;
                break;
            default: return;
        }
        scrollbar.jqxScrollBar('setPosition', v);
    };

    async function refreshFavouritesGrid() {
        const data = userFavorites;
        const folderStruct = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
        if(!folderStruct){
            var items = $('#jsreeFavorites').jstree(true).get_json('#', { flat: true });
            $('#jsreeFavorites').jstree(true).select_node(items[0]);
            folderStruct = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
        }
        let searchList = [];
        var search = $("#searchBox").val();

        $('#activeJqxgrid').jqxGrid('showloadelement');

        data.map((e) => {
            folderStruct.original.value.items.map((f) => {
                if (e.Symbol == f.Symbol) searchList.push(e);
            });
        });
        
        if (search == '' || search == undefined) {
            search = '';
        }
        else {
            searchListArr = []
            searchList.map(function (e) {
                if (e.Symbol.toLowerCase().search(search.toLowerCase()) != -1 || e.Name.toLowerCase().search(search.toLowerCase()) != -1)
                    searchListArr.push(e);
            });
            searchList = searchListArr;
        }

        if (search !== undefined && search !== "undefined")
            updateURL({ filter: search });

        favoritesGridSource.localdata = searchList;

        setTimeout(() => {
            $("#activeJqxgrid").jqxGrid('updatebounddata');
        }, 300);
    }

    async function refreshTreeFolders(loaded = true) {
        if (loaded) {
            $('#jsreeFavorites').on('loaded.jstree', async function () {
                let data = userFavorites,
                    items = $('#jsreeFavorites').jstree(true).get_json('#', { flat: true });
                objectFavorites = await getUserFavorites(sessionToken);
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
                                }
                                else {
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
                        }
                        else {
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
        }
        else {
            let data = userFavorites,
                items = $('#jsreeFavorites').jstree(true).get_json('#', { flat: true });

            objectFavorites = await getUserFavorites(sessionToken);
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
                            }
                            else {
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
                    }
                    else {
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

                $('#jsreeFavorites').on('loaded.jstree', async function () {

                    $('#jsreeFavorites').on("activate_node.jstree", function (e, data) {
                        var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                        $("#activeJqxgrid").jqxGrid('showloadelement');
                        setTimeout(() => {
                            refreshFavouritesGrid();
                        }, 10);
                        
                        if (item.original.value.root == true) {
                            $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', true);
                            $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', true);
                            $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', true);
                            $("#btnDeleteFolder").jqxButton({ disabled: true });
                            $("#btnRenameFolder").jqxButton({ disabled: true });
                        } else {
                            $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', false);
                            $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', false);
                            $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', false);
                            $("#btnDeleteFolder").jqxButton({ disabled: false });
                            $("#btnRenameFolder").jqxButton({ disabled: false });
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
        keys.forEach(function (key, i, keys) {
            map.set(key, obj[key]);
        });
        return map;
    }

    function copySelectedSeriesToClipboard(id) {
        var rowsindexes = $("#" + id).jqxGrid('getselectedrowindexes');
        var rows = [], column = $("#" + id).jqxGrid('columns').records;

        let firstRow = [];
        for (var c in column) {
            if (!column[c].hidden && column[c].datafield !== "" && column[c].datafield !== "Favorite" && column[c].datafield !== "id")
                firstRow.push(column[c].text);
        }
        rows.push(firstRow);

        var arr = [];
        for (var i = 0; i < rowsindexes.length; i++) {
            let row = $("#" + id).jqxGrid('getrowdata', rowsindexes[i]);

            let col = [];
            for (var c in column) {
                if (!column[c].hidden && column[c].datafield !== "" && column[c].datafield !== "Favorite" && column[c].datafield !== "id") {
                    if (row[column[c].datafield] == undefined) row[column[c].datafield] = "";

                    if (column[c].datafield == "StartDate" || column[c].datafield == "EndDate")
                        row[column[c].datafield] = new Date(row[column[c].datafield]).toISOString().split('T')[0];

                    col.push(row[column[c].datafield]);
                }
            }
            rows.push(col);
            arr.push(row.Symbol + "/" + row.Symbol);
        }
        seriesToAdd = arr;

        var CsvString = "";
        rows.forEach(function (RowItem, RowIndex) {
            RowItem.forEach(function (ColItem, ColIndex) {
                CsvString += ColItem + "\t";
            });
            CsvString += "\r\n";
        });

        copyToClipboard(CsvString);

        var singleCase = ((rows.length - 1) == 1) ? "has" : "have";
        functionNotificationMessage({ text: rows.length - 1 + " series " + singleCase + " been copied to the clipboard" });
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
                a.text = (i > 0) ? a.value.name+" ("+i+")" : a.value.name;
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
        let as = async () => {
            userDatasources = await getUserDataSources(sessionToken);
            databaseImages = createImageMap(userDatasources);
            databaseNames = createNameMap(userDatasources);
            objectFavorites = await getUserFavorites(sessionToken);
            for (var i in objectFavorites.Datasets) {
                // console.log(objectFavorites.Datasets[i]);
                if (objectFavorites.Datasets[i].Additional && objectFavorites.Datasets[i].Additional.length > 0)
                    objectFavorites.Datasets[i].Conversions = objectFavorites.Datasets[i].Additional.Conversions[0].ConvertTo + " " + objectFavorites.Datasets[i].Additional.Conversions[0].ConvertOperator + objectFavorites.Datasets[i].Additional.Conversions[0].ConvertValue
            }
            userFavorites = objectFavorites.Datasets;
            folderStructure = await createFolderStructure(objectFavorites, sessionToken);
        };
        as().then(function () {
            finish();
        });
    }
    catch (e) { console.log(e) }


    var theme = 'light',
        disactiveSource, disactiveDataAdapter;

    function finish() {
        var deletedFavorites = [],
            namesMap = buildMap(databaseNames),
            seriesToAdd,
            folderToAdd,
            lastTreeItem,
            sourceTreeItem;
        imagesMap = buildMap(databaseImages)

        var toThemeProperty = function (className) {
            return className + " " + className + "-" + theme;
        },

            activeGridColumns = [
                { text: 'Datasource', datafield: 'Datasource', cellsalign: 'center', align: 'center', width: 100, cellsrenderer: databaseColumnRender },
                { text: 'Symbol', groupable: false, datafield: 'Symbol', cellsalign: 'center', align: 'center', width: 100, cellsrenderer: symbol_renderer },
                { text: 'Name', groupable: false, datafield: 'Name', cellsalign: 'left', align: 'left', width: 300 },
                { text: 'Frequency', groupable: false, datafield: 'Frequency', cellsalign: 'left', align: 'left', width: 80 },
                { text: 'From', groupable: false, datafield: 'StartDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'left', align: 'left', width: 80 },
                { text: 'To', groupable: false, datafield: 'EndDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'left', align: 'left', width: 80 },
                { text: '# Prices', groupable: false, datafield: 'Values', filtertype: 'number', cellsalign: 'center', align: 'center', width: 80 },
                { text: 'Currency', datafield: 'Currency', sortable: false, cellsalign: 'left', align: 'center', width: 75, hidden: true },
                { text: 'Decimals', datafield: 'Decimals', sortable: false, cellsalign: 'right', align: 'center', width: 65, hidden: true },
                { text: 'Unit', datafield: 'Unit', sortable: false, cellsalign: 'left', align: 'center', width: 50, hidden: true },
                { text: 'Conversions', datafield: 'Conversions', sortable: false, cellsalign: 'left', align: 'center', width: 50, hidden: true },
                { text: 'Additional', datafield: 'Additional', sortable: false, cellsalign: 'left', align: 'center', width: 150, hidden: true }
            ];

        $('#jqxTabs').jqxTabs({ width: '100%', height: '100%', position: 'top', keyboardNavigation: false });
        $("#jqxTabs").removeClass("wait");
        var requestedTab = getParameterByName('tab');

        if (requestedTab != null && requestedTab != '') {
            if (requestedTab == 'mydatasources') {
                $('#jqxTabs').jqxTabs('select', 1);
                if (!datasourceGrid_active) {
                    datasourceGrid();
                }
            }
            else if (requestedTab == 'deleted') {
                $('#jqxTabs').jqxTabs('select', 2);
                if (!disactiveGrid_active) {
                    $("#jqxLoader").jqxLoader('open');
                    setTimeout(() => { disactiveGrid() }, 5);
                }
            }
            else {
                if (!activeGrid_active) {
                    $("#jqxLoader").jqxLoader('open');
                    setTimeout(() => { activeGrid() }, 5);
                }
            }
        }

        $('#jqxTabs').on('selected', function (event) {
            var tab;
            switch (event.args.item) {
                case 0:
                    tab = "favorites"
                    if (!activeGrid_active) {
                        $("#jqxLoader").jqxLoader('open');
                        setTimeout(() => { activeGrid() }, 5);
                    }
                    break;
                case 1:
                    tab = "mydatasources"
                    if (!datasourceGrid_active) {
                        datasourceGrid();
                    }
                    break;
                case 2:
                    tab = "deleted"
                    if (!disactiveGrid_active) {
                        $("#jqxLoader").jqxLoader('open');
                        setTimeout(() => { disactiveGrid() }, 5);
                    }
                    break;
            }

            $('.jqx-popover').hide();

            dataToSend = { tab: tab }

            if (tab == "mydatasources" && DatasetsOfDatasourceSet !== undefined) {
                dataToSend.page = DatasetsOfDatasourceSet.Request.Page;

                if (DatasetsOfDatasourceSet.Request.Filter !== undefined)
                    dataToSend.filter = DatasetsOfDatasourceSet.Request.Filter;

                if (DatasetsOfDatasourceSet.Request.CategoryFilter !== undefined)
                    dataToSend.category = DatasetsOfDatasourceSet.Request.CategoryFilter;

                if (!DatasetsOfDatasourceSet.Request.Datasource !== undefined)
                    dataToSend.datasource = DatasetsOfDatasourceSet.Request.Datasource;
            }

            else if ($('#searchBox').val() !== "" && $('#searchBox').val() !== undefined && $('#searchBox').val() !== "undefined" && tab == "favorites")
                dataToSend.filter = $('#searchBox').val();
            else
                delete dataToSend.filter;


            updateURL(dataToSend, true);
        });


        /* ============= activeJqxgrid =============== */
        function activeGrid() {
            function WriteFavoritesTree(folders, sessionToken) {
                p = {
                    SessionToken: sessionToken,
                    Tree: folders
                }
                // console.log(p);
                call_api_ajax('WriteUserFavoritesMetadataTree', 'POST', JSON.stringify(p), false);
            }

            function changeNodeWithChilds(elem, method, elems) {
                if (method != 'expandItem' && method != 'collapseItem') return;
                $('#jsreeFavorites').jqxTree(method, elem);
                if (elem.hasItems === true) {
                    var id = elem.id;
                    elems.forEach(function (el) {
                        if (el.parentId == id) changeNodeWithChilds(el, method, elems);
                    });
                }
            }

            var attachContextMenu = function () {
                $("#treeExpander").on('mousedown', function (event) {
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

            var contextMenu = $("#jqxTreeMenu").jqxMenu({ width: '130px', height: '210px', autoOpenPopup: false, mode: 'popup' });
            contextMenu.on('shown', () => {
                var item = $('#jsreeFavorites').jstree(true).get_selected("full", true);
                if (item[0].original.value.root == true)
                    $('#miNewFolder').text('New Folder');
                else
                    $('#miNewFolder').text('New Subfolder');

            });

            $('#chMoveFolders').jqxCheckBox({ checked: false });

            $('#chMoveFolders').on('change', function (event) {
                var button = $('#btnMoveFolders');
                globalMoveFolders = event.args.checked;
                var toggled = button.jqxToggleButton('toggled');
                if (toggled != globalMoveFolders)
                    button.jqxToggleButton('toggle');
            });

            createFolders = async () => {
                // Init Tree Menu
                var clickedItem = null;

                // disable the default browser's context menu.
                $(document).on('contextmenu', function (e) {
                    if ($(e.target).parents('#treeExpander').length > 0)
                        return false;

                    return true;
                });
                // Miqueas-TreeExpander or TODO
                $("#treeExpander").jqxExpander({
                    toggleMode: 'none', showArrow: false, width: "100%", height: "100%",
                    initContent: function () {
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
                            height: 35,
                            tools: 'custom | custom | custom | custom | custom',
                            initTools: function (type, index, tool, menuToolIninitialization) {
                                if (type == "toggleButton") {
                                    var icon = $("<div class='jqx-editor-toolbar-icon jqx-editor-toolbar-icon-" + theme + " buttonIcon'></div>");
                                }
                                switch (index) {
                                    case 0:
                                        var button = $("<div>" + "<img  height='16px' width='16px' src='resources/css/icons/folder_add.png' title='Add a new Folder'></div>");
                                        tool.append(button);
                                        button.jqxButton({ height: 15 });
                                        button.on('click', function () {
                                            openAddFolderDialog();
                                        });
                                        button.find('img').tooltip();
                                        break;
                                    case 1:
                                        var button = $("<div id='btnDeleteFolder'>" + "<img  height='16px' width='16px' src='resources/css/icons/folder_delete.png' title='Delete the selected empty folder'></div>");
                                        tool.append(button);
                                        button.jqxButton({ height: 15, disabled: true });
                                        button.on('click', function () {
                                            openDeleteFolderDialog();
                                        });
                                        button.find('img').tooltip();
                                        break;
                                    case 2:
                                        var button = $("<div id='btnRenameFolder'>" + "<img  height='16px' width='16px' src='resources/css/icons/folder_rename.png' title='Rename the selected folder'></div>");
                                        tool.append(button);
                                        button.jqxButton({ height: 15, disabled: true });
                                        button.on('click', function () {
                                            openRenameDialogWindow();
                                        });
                                        button.find('img').tooltip();
                                        break;
                                    case 3:
                                        var button = $("<div id=\"btnMoveFolders\" ><img  height='16px' width='16px' src='resources/css/icons/FolderUpDn.png' title='Enable folder moving'></div>");
                                        tool.append(button);
                                        button.jqxToggleButton({ height: 15, toggled: false });
                                        button.on('click', function () {
                                            var toggled = button.jqxToggleButton('toggled');
                                            if (toggled != $('#chMoveFolders').jqxCheckBox('checked'))
                                                $('#chMoveFolders').jqxCheckBox({ checked: toggled });
                                            globalMoveFolders = toggled;

                                            if ($('#chMoveFolders').jqxCheckBox('checked')){
                                                button.find('img').tooltip("option", "content", "Disable folder moving");
                                            }
                                            else{
                                                button.find('img').tooltip("option", "content", "Enable folder moving");
                                            }   
                                        });
                                        button.find('img').tooltip();
                                        break;
                                    case 4:
                                        var button = $("<div id='btnShowBackups'>" + "<img  height='16px' width='16px' src='resources/css/icons/backup.png' title='Manage user favorite backups'></div>");
                                        tool.append(button);
                                        tool.css('float', 'right')
                                        button.jqxButton({ height: 15 });
                                        button.on('click', function () {
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
                        $("#jqxTreeMenu").on('itemclick', function (event) {
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
                                    var all_items = $('#jsreeFavorites').jstree(true).get_json('#', { flat: true });
                                    var se = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                    // changeNodeWithChilds(se, 'expandItem', all_items);
                                    break;
                                case "Close All":
                                    $('#jsreeFavorites').jstree('close_all');
                                    var all_items = $('#jsreeFavorites').jstree(true).get_json('#', { flat: true });
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

                folderToAdd = selectedItem.original.value.folderUid;

                if (seriesToAdd.length == 1) {
                    $("#addSeriesWindowContent").text("Paste 1 series to folder '" + selectedItem.original.value.name + "'?");
                }
                else {
                    $("#addSeriesWindowContent").text("Paste " + seriesToAdd.length + " series into folder '" + selectedItem.original.value.name + "'?");
                }
                $('#addSeriesWindow').dialog('open');
                lastTreeItem = selectedItem;
            }

            async function searchSeries() {
                refreshFavouritesGrid();
            }

            $("#gridExpander").jqxExpander({ toggleMode: 'none', showArrow: false, width: "100%", height: "100%", initContent: initActiveJqxgrid });
            var isDragStart = false;

            initToolbar = () => {
                $('#jsreeFavorites').on('loaded.jstree', function () {
                    var items = $('#jsreeFavorites').jstree(true).get_json('#', { flat: true });
                    $('#jsreeFavorites').jstree(true).select_node(items[0]);
                    sourceTreeItem = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                    setTimeout(() => {
                        $('#jsreeFavorites').on("select_node.jstree", function (e, data) {
                            if (isDragStart == false) {
                                sourceTreeItem = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                $("#activeJqxgrid").jqxGrid('showloadelement');
                                setTimeout(() => {
                                    refreshFavouritesGrid();
                                }, 10);
                            }

                            var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                            if (item.original.value.root == true) {
                                $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', true);
                                $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', true);
                                $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', true);
                                $("#btnDeleteFolder").jqxButton({ disabled: true });
                                $("#btnRenameFolder").jqxButton({ disabled: true });
                            } else {
                                $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', false);
                                $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', false);
                                $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', false);
                                $("#btnDeleteFolder").jqxButton({ disabled: false });
                                $("#btnRenameFolder").jqxButton({ disabled: false });
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
                $('#addFolderWindow').dialog({ title: "Create a Subfolder" });
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
                    functionNotificationMessage({ text: 'Folder ' + newFolderName + ' has been added.' })
                });
            }

            $('#folderName').keypress(function (e) {
                if (e.which == 13) {
                    addNewFolder();
                    $('#addFolderWindow').dialog('close');
                    return false;
                }
            });

            $('#newFolderName').keypress(function (e) {
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
                }
                else if (item.original.value.items.length > 0 || isSubFoldersHasSeries(item)) {
                    dialogWindow("You must remove the series from this folder before you can delete it.", "error");
                }
                else if (item.children.length > 0) {
                    dialogWindow("The folder has empty sub folders.<br>Are you sure you want to delete it?", "query", "confirm", null, () => {
                        deleteFolder();
                    }, null, null, { Ok: "Yes", Cancel: "No" });
                }
                else {
                    dialogWindow("Are you sure you want to delete folder '" + item.text + "''?", "query", "confirm", null, () => {
                        deleteFolder();
                    }, null, null, { Ok: "Yes", Cancel: "No" });
                }
            }

            function deleteFolder() {
                var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                if (!item)
                    return;

                $('#jsreeFavorites').jstree().delete_node(item);

                updateFolderStructure();
                functionNotificationMessage({ text: "Folder has been removed." })
            }

            async function updateFolderStructure() {
                var items = $('#jsreeFavorites').jstree(true).get_json('#', { flat: true });
                var sources = [{ value: { id: items[0].id }, items: [] }];
                var links = {};
                let currentRoot = items[0].id;

                links[currentRoot] = 1;

                var fAddToParent = function (src, seek_id, elem) {
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
                    WriteFavoritesTree(JSON.stringify(sources[0].items), sessionToken);
                    // refreshTreeFolders(false);
                }, 200);
            }

            $("#addSeriesWindow").dialog({
                resizable: true,
                autoOpen: false,
                height: "auto",
                width: "auto",
                modal: true,
                buttons: {
                    Ok: function () {
                        addSeriesToFolder();
                        $(this).dialog("close");
                    },
                    Cancel: function () {
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
                    Ok: function () {
                        deleteSeriesFromFolder();
                        $(this).dialog("close");
                    },
                    Cancel: function () {
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
                    Ok: function () {
                        renameFolder();
                        $(this).dialog("close");
                    },
                    Cancel: function () {
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
                    Ok: function () {
                        addNewFolder();
                        $(this).dialog("close");
                    },
                    Cancel: function () {
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
                initContent: function () {
                    $('#addDefaultBackupWindowBtn').jqxButton({ width: '80px' });
                    $("#addDefaultBackupWindowBtn").on('click', function () {
                        addDefaultBackup();
                    });

                    $('#overwriteDefaultBackupWindowBtn').jqxButton({ width: '80px' });
                    $("#overwriteDefaultBackupWindowBtn").on('click', function () {
                        $('#overwriteBackupWindow').jqxWindow('open');
                    });

                    $('#cancelAddDefaultBackupWindowBtn').jqxButton({ width: '80px' });
                    $("#cancelAddDefaultBackupWindowBtn").on('click', function () {
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
                $("#jsreeFavorites").jstree(true).rename_node(item , newFolderName);
                
                updateFolderStructure();
                functionNotificationMessage({ text: "Name has been changed" });
                $("#newFolderName").val("");                
            }

            function openRemoveSeriesFromFolderDialog() {
                var rowsindexes = $("#activeJqxgrid").jqxGrid('getselectedrowindexes');

                if (rowsindexes.length < 1) return;
                var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                var msg;

                if (item.original.value.root == true) {
                    var cmp = {};
                    for (i = 0; i < rowsindexes.length; i++) {
                        var row = $("#activeJqxgrid").jqxGrid('getrowdata', rowsindexes[i]);
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
                            text: 'Can\'t remove as selected series ' + h + ' been located: ' + duplicates.join(','), type: 'error'
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
                });
            }

            async function deleteSeriesFromFolder() {
                var rowsindexes = $("#activeJqxgrid").jqxGrid('getselectedrowindexes');
                rowsindexes.sort(function (a, b) { return a - b; });
                
                let treeNodes = $('#jsreeFavorites').jstree(true).get_json('#', { flat: true });
                let data = userFavorites;

                var deleted = [], deleted_symbol = [], rows_data = [];
                for (var i = 0; i < rowsindexes.length; i++) {
                    
                    var row = $("#activeJqxgrid").jqxGrid('getrowdata', rowsindexes[i]);

                    if(lastTreeItem.original.value.root == false){
                        for (var j = 0; j < lastTreeItem.original.value.items.length; j++) {
                            if(lastTreeItem.original.value.items[j].Symbol == row.Symbol){
                                lastTreeItem.original.value.items.splice(j, 1);
                            }
                        }
                        console.log(lastTreeItem.original.value.items);
                    }
                    else{
                        treeNodes.map((n) => {
                            var node = $('#jsreeFavorites').jstree(true).get_node(n.id);
                            for (var j = 0; j < node.original.value.items.length; j++) {
                                if(node.original.value.items[j].Symbol == row.Symbol){
                                    node.original.value.items.splice(j, 1);
                                }
                            }
                        });

                        if (row.Datacategory !== undefined)
                            deleted.push(row.Datasource + '/' + row.Datacategory + '/' + row.Symbol);
                        else
                            deleted.push(row.Datasource + '/' + row.Symbol);

                        deleted_symbol.push(row.Symbol);
                        rows_data.push(row);
                    }
                }

                if(deleted.length > 0){
                    $("#activeJqxgrid").jqxGrid('showloadelement');
                    call_api_ajax('RemoveUserFavoriteDatasets', 'get', { SessionToken: sessionToken, "Series[]": deleted }, true, async () => {
                        let data = userFavorites, new_data = [];

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
                                var rows = $("#gridDatasetsOfDatasource").jqxGrid('getrows');
                                rows = rows.map((v, i) => {
                                    new_deleted.map((e) => {
                                        if (e == v.Symbol && v.Favorite == true) {
                                            $("#gridDatasetsOfDatasource").jqxGrid('setcellvalue', i, "Favorite", false);
                                        }
                                    });
                                });
                            }
                            userFavorites = new_data;
                            $("#activeJqxgrid").jqxGrid('clearselection');
                            // refreshTreeFolders();
                            refreshFavouritesGrid();
                        }
                        if (disactiveGrid_active) {
                            userDeletedFavorites = userDeletedFavorites.concat(rows_data);
                            disactiveSource.localdata = userDeletedFavorites;
                            $("#disactiveJqxgrid").jqxGrid('updatebounddata', 'cells');
                        }

                        var n = 'folder ' + lastTreeItem.original.value.name;

                        if (lastTreeItem.original.value.root == true)
                            n = 'your Favorites list';

                        var singleCase = deleted.length == 1 ? " has" : "s have";
                        functionNotificationMessage({ text: deleted.length + ' symbol' + singleCase + ' been removed from ' + n, type: "info" });
                    }, null, () => {
                        $("#activeJqxgrid").jqxGrid('hideloadelement');
                    });
                }

                setTimeout(() => {
                    $("#activeJqxgrid").jqxGrid('clearselection');
                    updateFolderStructure();
                    refreshFavouritesGrid();
                    setTimeout(() => {
                        treeNodes.map((n) => {
                            let i = 0;
                            var node = $('#jsreeFavorites').jstree(true).get_node(n.id);
                            node.original.value.items.map((f) => {
                                
                                data.map((e) => {
                                    if (e.Symbol == f.Symbol) i++;
                                });
                            });
                            
                            var text = ( i > 0 ) ? node.original.value.name + " (" + i + ")" : node.original.value.name;
                            $("#jsreeFavorites").jstree('rename_node', node , text );
                        });    
                    }, 50);
                }, 50);
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
                    functionNotificationMessage({ text: "1 new symbol has been added to folder " + lastTreeItem.original.value.name, type: 'info' });

                else if ((newSize - oldSize) > 1)
                    functionNotificationMessage({ text: (newSize - oldSize) + " new symbols have been added to folder " + lastTreeItem.original.value.name, type: 'info' });

                else
                    functionNotificationMessage({ text: "No series copied", type: 'info' });

                // lastTreeItem.text = lastTreeItem.value.name + " (" + newSize + ")";
                // $('#jsreeFavorites').jqxTree('updateItem', lastTreeItem, lastTreeItem);                         		
                updateFolderStructure();
                refreshFavouritesGrid();
            }

            // TODO here are the magic of the grid
            async function initActiveJqxgrid() {

                favoritesGridSource = {
                    datatype: "json",
                    datafields: baseDataFields,
                    localdata: await userFavorites
                };
                await createFolders();
                initToolbar();
                var cols;

                var searchArray = [];
                favoritesGridSource.localdata.forEach(function (e, index) {
                    if ((e.Symbol.search(filterOfURL) != -1 || e.Name.search(filterOfURL) != -1) && filterOfURL !== "undefined") searchArray.push(e)
                });

                favoritesGridSource.localdata = searchArray;
                favoritesGridDataAdapter = new $.jqx.dataAdapter(favoritesGridSource);

                var activeColumns = baseGridColumns;
                activeColumns.splice(1, 0, { text: 'Cat.', groupable: false, datafield: 'Datacategory', cellsalign: 'center', align: 'center', minwidth: 10, width: 100 },)


                // create Tree Grid
                $("#activeJqxgrid").jqxGrid(
                    {
                        handlekeyboardnavigation: function (event) {
                            if (event.currentTarget.id == undefined) return;
                            var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
                            if (key == 46) {
                                openRemoveSeriesFromFolderDialog();
                                return;
                            }
                            keyboardNavigation(event);
                        },
                        width: '100%',
                        height: '100%',
                        rowsheight: 30,
                        columnsheight: 30,
                        source: favoritesGridDataAdapter,
                        columns: activeColumns,
                        theme: theme,
                        columnsresize: true,
                        groupable: false,
                        sortable: true,
                        selectionmode: 'multiplerowsadvanced',
                        showtoolbar: true,
                        ready: function () {
                            if (getCookie('btnHideAdditInfo1') != "undefined" && getCookie('btnHideAdditInfo1') == "true") {
                                showAdditInfo("activeJqxgrid");
                                showAdditionalInformation1 = true;
                            }
                            else {
                                hideAdditInfo("activeJqxgrid");
                                showAdditionalInformation1 = false;
                            }

                            resizeColumns('activeJqxgrid');
                            activeGrid_active = true;
                            $('#gridExpander').removeClass('wait');
                            $('#jqxLoader').jqxLoader('close');
                            $('#activeJqxgrid').find('div.jqx-grid-load').next().text('Processing ...').parent().parent()
                                .css({ 'font-family': 'verdana !important', 'font-size': '12px !important', 'color': '#898989 !important' }).width(133);
                        },
                        rendered: function () {
                            activeJqxgridDragAndDropInit();
                        },
                        rendertoolbar: function (toolbar) {
                            var me = this;
                            var container = $("<div id='activegrid-container'></div>");
                            toolbar.append(container);
                            container.append('<table><tr>' +
                                '<td>Filter:&nbsp;</td>' +
                                '<td><input id="searchBox"></td>' +
                                '<td><button id="searchBtn" style="line-height: 20px;"><img id="activegrid-img" src="resources/css/icons/search.png" style="margin:0 2px 2px 2px; border:0"></button></td>' +
                                '<td><div id="helpIcon2" class="helpIcon"></div></td>' +
                                '<td id="activegrid-buttons"></td>' +
                                '<td><input id="btnRemoveFromFavorites" title="Remove Selected Series from the folder" value="Remove"></td>' +
                                '<td><input id="btnAutosizeActive" title="Autosize Columns"></td>' +
                                '<td><input id="btnHideAdditInfo_favorite" title="Show additional data columns" type="button"></td>' +
                                '<td><input class="fullWidthPage" id="fullWidth2" title="Toggle grid to full screen width"></td>' +
                                '</tr></table>'
                            );

                            $("#btnHideAdditInfo_favorite").jqxToggleButton({ imgSrc: "resources/css/icons/table_plus.png", imgPosition: "center", width: 25, height: 24 });

                            $(".HelpMessage1").jqxPopover({ offset: { left: -50, top: 0 }, arrowOffsetValue: 50, title: "Search Filter Help", showCloseButton: true, selector: $("#helpIcon2") });

                            // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                            var fullWidthFlag = true;
                            let img = (!fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                            let footer_width = (!fullWidthFlag) ? '1230px' : '1230px';

                            $("#main-footer").width(footer_width);
                            $(".fullWidthPage").jqxButton({ imgSrc: "resources/css/icons/" + img + ".png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                            $(".fixpage").toggleClass('fullscreen', !fullWidthFlag);

                            // resizeColumns('activeJqxgrid');

                            $("#searchBox").jqxInput({ placeHolder: "Enter filter text", height: 22, width: 230 });
                            $("#btnAutosizeActive").jqxButton({ imgSrc: "resources/css/icons/autosize.png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                            // $("#fullWidth2").jqxButton({ imgSrc: "resources/css/icons/" + img + ".png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                            $("#btnRemoveFromFavorites").jqxButton({ imgSrc: "resources/css/icons/star_delete.png", imgPosition: "left", width: 81, height: 24, textPosition: "right" });


                            $("#searchBox").keypress(function (e) {
                                if (e.which == 13) {
                                    searchSeries();
                                    return false;
                                }
                            });

                            $("#searchBtn").click(function (evt) {
                                searchSeries();
                            });

                            // $("#searchBox").bind("input", function (evt) 
                            // {
                            //     if (window.event && event.type == "propertychange" && event.propertyName != "value")
                            //         return;

                            //     searchSeries();
                            // });

                            $("#btnAutosizeActive").on('click', function () {
                                resizeColumns('activeJqxgrid');
                            });

                            $("#btnHideAdditInfo_favorite").on('click', function (event) {
                                var current_grid = "activeJqxgrid";
                                var id = event.currentTarget.id;
                                setCookie('btnHideAdditInfo1', $('#' + id).jqxToggleButton('toggled'));

                                var toggled = getCookie('btnHideAdditInfo1');
                                if (toggled == 'true') {
                                    $("#" + current_grid).jqxGrid('beginupdate');
                                    showAdditInfo(current_grid);
                                    document.getElementById(id).title = "Hide additional data columns";
                                    $("#" + current_grid).jqxGrid('endupdate');

                                }
                                else {
                                    $("#" + current_grid).jqxGrid('beginupdate');
                                    hideAdditInfo(current_grid);
                                    document.getElementById(id).title = "Show additional data columns";
                                    $("#" + current_grid).jqxGrid('endupdate');
                                }
                            });

                            if (showAdditionalInformation2) {
                                $('#btnHideAdditInfo_favorite').jqxToggleButton('toggle');
                            }
                            else {
                            }

                            $("#fullWidth2").on('click', function () {
                                // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                                img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                                footer_width = (fullWidthFlag) ? '100%' : '1230px';

                                $("#main-footer").width(footer_width);
                                $(".fullWidthPage").jqxButton({ imgSrc: "resources/css/icons/" + img + ".png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                                $(".fixpage").toggleClass('fullscreen', fullWidthFlag);

                                fullWidthFlag = !fullWidthFlag;
                                setCookie('p_fullWidth1', fullWidthFlag);
                                resizeColumns('activeJqxgrid');
                            });

                            $("#btnRemoveFromFavorites").on('click', function () {
                                openRemoveSeriesFromFolderDialog();
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
                    });

                var element = "";
                $(document).bind('mousemove', function ( event )
                {
                    if (isDragStart == true) {
                        
                        $(".jqx-draggable-dragging").remove();
                        
                        var x = event.pageX;
                        var y = event.pageY;

                        element = document.elementFromPoint(x, y);
                        
                        if(element.id){
                            var item = $('#jsreeFavorites').jstree(true).get_node(element.id);
                            if ( item ){
                                $("#jsreeFavorites").jstree().deselect_all(true);
                                $('#jsreeFavorites').jstree(true).select_node(item);
                            }
                        }                        
                    }
                });


                // Init drag&drop functionality 
                function activeJqxgridDragAndDropInit() {
                    // select all grid cells.
                    var gridCells = $('#activeJqxgrid').find('.jqx-grid-cell');

                    // initialize the jqxDragDrop plug-in. Set its drop target to the second Grid.
                    gridCells.jqxDragDrop({
                        appendTo: 'body', dragZIndex: 99999,
                        dropAction: 'none',
                        cursor: 'arrow',
                        initFeedback: function (feedback) {
                            var rowsindexes = $("#activeJqxgrid").jqxGrid('getselectedrowindexes');
                            feedback.height(25);
                            feedback.width($("#activeJqxgrid").width());
                            feedback.css('background', '#aaa');
                        },
                        dropTarget: $('#jsreeFavorites'),
                        revert: false
                    });

                    gridCells.off('dragStart');
                    gridCells.off('dragEnd');

                    // initialize the dragged object.
                    gridCells.on('dragStart', function (event) {
                        isDragStart = true;
                        var value = $(this).text();
                        var position = $.jqx.position(event.args);
                        var cell = $("#activeJqxgrid").jqxGrid('getcellatposition', position.left, position.top);
                        console.log('cell', cell);
                        var rowsindexes = $("#activeJqxgrid").jqxGrid('getselectedrowindexes');

                        var rows = [];
                        var clickedrow = cell.row;
                        var isselected = false;
                        for (var i = 0; i < rowsindexes.length; i++) {
                            if (rowsindexes[i] == clickedrow) {
                                isselected = true;
                            }
                            rows[rows.length] = $("#activeJqxgrid").jqxGrid('getrowdata', rowsindexes[i]);
                        }
                        if (!isselected) {
                            $("#activeJqxgrid").jqxGrid('selectrow', cell.row);
                            rows[rows.length] = $("#activeJqxgrid").jqxGrid('getrowdata', cell.row);
                        }
                        if (rows.length > 0) {
                            // update feedback's display value.
                            var feedback = $(this).jqxDragDrop('feedback');
                            if (feedback) {
                                feedback.height(rows.length * 19 + 25);
                                feedback.css('background', 'transparent');

                                var table = '<table id="tableActiveStyle">';
                                // init header
                                table += '<tr>';
                                table += '<td style="width:' + this.width + 'px;" class="activeBorder">Datasource</td>';
                                table += '<td style="width:' + this.width + 'px;" class="activeBorder">Symbol</td>';
                                table += '<td style="width:' + this.width + 'px;" class="activeBorder">Name</td>';
                                table += '</tr>';

                                // init table content
                                $.each(rows, function () {
                                    table += '<tr>';
                                    table += '<td class="activeBorder">' + this.Datasource + '</td>'; //TODO: change to alias
                                    table += '<td class="activeBorder">' + this.Symbol + '</td>';
                                    table += '<td class="activeBorder">' + this.Name + '</td>';
                                    table += '</tr>';
                                });
                                table += '</table>';
                                feedback.html(table);
                            }
                            // set the dragged records as data
                            $(this).jqxDragDrop({ data: rows })
                        }


                        $(event.currentTarget).addClass('jstree-draggable');
                    });

                    gridCells.on('dragEnd', function (event, a) {
                        var value = $(this).jqxDragDrop('data');
                        var position = $.jqx.position(event.args);
                        
                        // $("#jsreeFavorites").jqxTree('_syncItems', $("#jsreeFavorites").find('.draggable'));
                        
                        // var x = event.pageX;
                        // var y = event.pageY;

                        // var element = document.elementFromPoint(x, y);
                        // ddd.remove();
                        
                        var item = false;
                        if(element.id){
                            item = $('#jsreeFavorites').jstree(true).get_node(element.id);
                        }
                        
                        if ( !item ) return;
                        else if ( item.original.value.root == true )
                        {
                            functionNotificationMessage({ text: "You can't copy series to folder 'All'", type: "error" });
                        } 
                        else {
                            var arr = new Array();
                            
                            for (var i = 0; i < value.length; i++) {
                                arr.push({Datasource:value[i].Datasource,Datacategory:value[i].Datacategory,Symbol:value[i].Symbol});
                            }

                            seriesToAdd = arr;
                            folderToAdd = item.original.value.id;

                            let msg = "Copy 1 series to folder '" + item.original.value.name + "'?";

                            if ( seriesToAdd.length > 1 )
                                msg = "Copy " + seriesToAdd.length + " series into folder '" + item.original.value.name + "'?"

                            dialogWindow(msg, 'warning', 'confirm', null, () =>
                            {
                                lastTreeItem = item;
                                if(sourceTreeItem){
                                    $("#jsreeFavorites").jstree().deselect_all(true);
                                    $('#jsreeFavorites').jstree(true).select_node(item);
                                }

                                setTimeout(() => { 
                                    let data = userFavorites;
                                    let i = 0;
                                    item.original.value.items.map((f) => {
                                        data.map((e) => {
                                            if (e.Symbol == f.Symbol) i++;
                                        });
                                    });
                                    
                                    var text = ( i > 0 ) ? item.original.value.name + " (" + i + ")" : item.original.value.name;
                                    $("#jsreeFavorites").jstree('rename_node', item , text );
                                }, 100);

                                addSeriesToFolder();
                            },
                            null, null, { Ok: 'Yes', Cancel: 'No' });
                        }
                        isDragStart = false;
                    });
                }
                // End drag&drop functionality

                // create context menu
                var contextMenu = $("#jqxGridMenu").jqxMenu({ width: 200, height: 94, autoOpenPopup: false, mode: 'popup' });
                $("#activeJqxgrid").on('contextmenu', function () {
                    return false;
                });

                // handle context menu clicks.
                $("#jqxGridMenu").on('itemclick', function (event) {
                    var args = event.args;
                    switch ($.trim($(args).text())) {

                        case "Remove from Favorites":
                            openRemoveSeriesFromFolderDialog();
                            break;

                        case "Copy":
                            copySelectedSeriesToClipboard('activeJqxgrid');
                            break;

                        case "Export":
                            makeExportSeriesDialog();
                            break;
                    }
                });

                $("#activeJqxgrid").on('rowclick', function (event) {
                    if (event.args.rightclick) {
                        $("#activeJqxgrid").jqxGrid('selectrow', event.args.rowindex);
                        var scrollTop = $(window).scrollTop();
                        var scrollLeft = $(window).scrollLeft();
                        contextMenu.jqxMenu('open', parseInt(event.args.originalEvent.clientX) + 5 + scrollLeft, parseInt(event.args.originalEvent.clientY) + 5 + scrollTop);
                        return false;
                    }
                    $("#activeJqxgrid").jqxGrid('focus');
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

        /* =============== gridDatasetsOfDatasource ==================*/

        function datasourceGrid() {
            $('#mainSplitter-datasource').jqxSplitter({
                width: '100%',
                height: '100%',
                showSplitBar: false,
                panels: [
                    { size: "22%", collapsible: true, collapsed: true },
                    { size: '78%', collapsible: false }
                ]
            });

            DatasetsOfDatasourceSet = {
                pageSelectedIndex: 0,
                pageCounter: numOfPageURL,
                pageSize: getParameterByName('rows'),
                pagesCount: 0,
                Request: {
                    Datasource: '',
                    SessionToken: sessionToken,
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
                    sort: function (column, ascending) {
                        switch (column) {
                            case "Symbol":
                            case "CategoryName":
                            case "Name":
                                if (ascending == null) {
                                    column = "CategoryName";
                                    ascending = true;
                                }
                                break;
                            default: return;
                        }
                        $('#gridDatasetsOfDatasource').jqxGrid('showloadelement');
                        DatasetsOfDatasourceSet.Request.SortColumns = column;
                        let seq;
                        if (ascending === true) seq = 'asc';
                        else seq = 'desc';
                        DatasetsOfDatasourceSet.Request.SortOrder = seq;
                        call_api_ajax('GetDatasourceMetadata', 'get', DatasetsOfDatasourceSet.Request, true, (data) => {
                            DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;
                            $("#gridDatasetsOfDatasource").jqxGrid('updatebounddata', 'sort');
                            $("#gridDatasetsOfDatasource").jqxGrid('hideloadelement');

                        }, null,
                            () => {
                                $("#gridDatasetsOfDatasource").jqxGrid('hideloadelement');
                            });
                    },
                    datafields: [
                        { name: 'Datasource', type: 'string' },
                        { name: 'Datacategory', type: 'string' },
                        { name: 'Symbol', type: 'string' },
                        { name: 'Conversions', type: 'array' },
                        { name: 'Favorite', type: 'boolean' },
                        { name: 'Name', type: 'string' },
                        { name: 'Frequency', type: 'string' },
                        { name: 'Values', type: 'int' },
                        { name: 'StartDate', type: 'date' },
                        { name: 'EndDate', type: 'date' },
                        { name: 'Currency', type: 'string' },
                        { name: 'Unit', type: 'string' },
                        { name: 'Conversions', type: 'string' },
                        { name: 'Additional', type: 'string' },
                        { name: 'Decimals', type: 'int' }
                    ],
                    localdata: []
                },
            };
            if (DatasetsOfDatasourceSet.pageSize == '' || ![50, 100, 250, 500].includes(parseInt(DatasetsOfDatasourceSet.pageSize))) {
                DatasetsOfDatasourceSet.pageSize = 50;
                DatasetsOfDatasourceSet.Request.Rows = 50;
            }

            var dsColumns = [
                {
                    text: '#', sortable: false, filterable: false, editable: false, cellsalign: 'right', align: 'right', groupable: false,
                    draggable: false, resizable: true, datafield: 'id', columntype: 'number', minwidth: 14, width: 10,
                    cellsrenderer: function (row, column, value) {
                        return "<div id='tableID' style='float:right;margin-right:5px'>" + (value + 1 + (DatasetsOfDatasourceSet.pageCounter - 1) * DatasetsOfDatasourceSet.pageSize) + "</div>";
                    }
                },
                {
                    text: '<img height="18" width="18" src="resources/css/icons/StarGrey.ico">', sortable: false, width: 30, datafield: 'Favorite', cellsalign: 'center', filterable: false, align: 'center',
                    cellsrenderer: function (row, datafield, value) {
                        if (value) return '<div><img id="startIcon" ' +
                            ' height="17" width="17" ' +
                            'src="resources/css/icons/star_icon.png"></div>';
                        return '';
                    }
                },
                { text: 'Symbol', groupable: false, datafield: 'Symbol', cellsalign: 'center', align: 'center', minwidth: 10, width: 100, cellsrenderer: symbol_renderer },
                { text: 'Name', groupable: false, datafield: 'Name', cellsalign: 'left', align: 'left', minwidth: 100, width: 100 },
                { text: 'Frequency', groupable: false, datafield: 'Frequency', cellsalign: 'left', align: 'left', minwidth: 10, width: 80 },
                { text: 'From', groupable: false, datafield: 'StartDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'left', align: 'left', minwidth: 10, width: 80 },
                { text: 'To', groupable: false, datafield: 'EndDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'left', align: 'left', width: 80 },
                { text: '# Prices', groupable: false, datafield: 'Values', filtertype: 'number', cellsalign: 'right', align: 'center', minwidth: 10, width: 80 },
                { text: 'Currency', datafield: 'Currency', sortable: false, cellsalign: 'left', align: 'center', minwidth: 10, width: 75, hidden: true },
                { text: 'Decimals', datafield: 'Decimals', sortable: false, cellsalign: 'right', align: 'center', minwidth: 10, width: 65, hidden: true },
                { text: 'Unit', datafield: 'Unit', sortable: false, cellsalign: 'left', align: 'center', minwidth: 10, width: 50, hidden: true },
                { text: 'Conversions', datafield: 'Conversions', sortable: false, cellsalign: 'left', align: 'center', minwidth: 10, width: 50, hidden: true },
                { text: 'Additional', datafield: 'Additional', sortable: false, cellsalign: 'left', align: 'center', minwidth: 10, width: 150, hidden: true }
            ];

            $(".close, .popup-overlay").on("click", function () {
                $(".popup-overlay, .popup-content").removeClass("active");
            });

            var categoryDSColumns = [
                {
                    text: '#', sortable: false, filterable: false, editable: false, cellsalign: 'right', align: 'right', groupable: false,
                    draggable: false, resizable: true, datafield: 'id', columntype: 'number', minwidth: 14, width: 10,
                    cellsrenderer: function (row, column, value) {
                        return "<div id='tableID' style='float:right;margin-right:5px'>" + (value + 1 + (DatasetsOfDatasourceSet.pageCounter - 1) * DatasetsOfDatasourceSet.pageSize) + "</div>";
                    }
                },
                {
                    text: '<img height="18" width="18" src="resources/css/icons/StarGrey.ico">', sortable: false, width: 30, datafield: 'Favorite', cellsalign: 'center', filterable: false, align: 'center',
                    cellsrenderer: function (row, datafield, value) {
                        if (value) return '<div><img id="startIcon" ' +
                            ' height="17" width="17" ' +
                            'src="resources/css/icons/star_icon.png"></div>';
                        return '';
                    }
                },
                { text: 'Symbol', groupable: false, datafield: 'Symbol', cellsalign: 'center', align: 'center', minwidth: 10, width: 100, cellsrenderer: symbol_renderer },
                { text: 'Cat', groupable: false, datafield: 'Datacategory', cellsalign: 'left', align: 'left', minwidth: 10, width: 100 },
                { text: 'Name', groupable: false, datafield: 'Name', cellsalign: 'left', align: 'left', minwidth: 100, width: 100 },
                { text: 'Frequency', groupable: false, datafield: 'Frequency', cellsalign: 'left', align: 'left', minwidth: 10, width: 80 },
                { text: 'From', groupable: false, datafield: 'StartDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'left', align: 'left', minwidth: 10, width: 80 },
                { text: 'To', groupable: false, datafield: 'EndDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'left', align: 'left', width: 80 },
                { text: '# Prices', groupable: false, datafield: 'Values', filtertype: 'number', cellsalign: 'right', align: 'center', minwidth: 10, width: 80 },
                { text: 'Currency', datafield: 'Currency', sortable: false, cellsalign: 'left', align: 'center', minwidth: 10, width: 75, hidden: true },
                { text: 'Decimals', datafield: 'Decimals', sortable: false, cellsalign: 'right', align: 'center', minwidth: 10, width: 65, hidden: true },
                { text: 'Unit', datafield: 'Unit', sortable: false, cellsalign: 'left', align: 'center', minwidth: 10, width: 50, hidden: true },
                { text: 'Conversions', datafield: 'Conversions', sortable: false, cellsalign: 'left', align: 'center', minwidth: 10, width: 50, hidden: true },
                { text: 'Additional', datafield: 'Additional', sortable: false, cellsalign: 'left', align: 'center', minwidth: 10, width: 150, hidden: true, cellsrenderer: additional_renderer }
            ]

            $("#gridDatasetsOfDatasource").jqxGrid({
                enableellipsis: true,
                handlekeyboardnavigation: keyboardNavigation,
                theme: theme,
                columns: [],
                width: '100%',
                height: '100%',
                rowsheight: 30,
                columnsheight: 30,
                source: DatasetsOfDatasourceSet.dataAdapter,
                columnsresize: true,
                sortable: true,
                showtoolbar: true,
                pageable: true,
                enablebrowserselection: false,
                selectionmode: 'multiplerowsadvanced',
                toolbarheight: 37,
                ready: function () {
                    // if(getCookie('btnHideAdditInfo2') != undefined && getCookie('btnHideAdditInfo2') == "true"){
                    //     showAdditInfo("gridDatasetsOfDatasource");
                    //     showAdditionalInformation2 = true;
                    //     // DatasetsOfDatasourceSet.Request.ShortRecord=false;
                    //     // updateDatasetsOfDatasourceGrid();
                    // }
                    // else{
                    //     hideAdditInfo("gridDatasetsOfDatasource");
                    //     showAdditionalInformation2 = false;
                    //     // DatasetsOfDatasourceSet.Request.ShortRecord=true;
                    //     // updateDatasetsOfDatasourceGrid();
                    // }
                    $('#gridDatasetsOfDatasource').find('div.jqx-grid-load').next().text('Processing ...').parent().parent().css({ 'font-family': 'verdana !important', 'font-size': '12px !important', 'color': '#898989 !important' }).width(133);

                },
                pagerrenderer: function () {
                    if (DatasetsOfDatasourceSet.Request.Page !== undefined) {
                        var element = $("<div id='pages-first-element'></div>");
                        var left_element = $("<div id='pages-last-element'></div>");
                        var pageNumbers = $('<div id="pageNumbers">');

                        var pageButtonToFirst = $("<div id='pageButtonToFirst'><div></div></div>");
                        pageButtonToFirst.find('div').addClass('jqx-icon-arrow-first');
                        pageButtonToFirst.jqxButton({ theme: theme });

                        var pageButtonToLast = $("<div id='pageButtonToLast'><div></div></div>");
                        pageButtonToLast.find('div').addClass('jqx-icon-arrow-last');
                        pageButtonToLast.jqxButton({ theme: theme });

                        var leftPageButton = $("<div id='leftPageButton'><div></div></div>");
                        leftPageButton.find('div').addClass('jqx-icon-arrow-left');
                        leftPageButton.jqxButton({ theme: theme });

                        var rightPageButton = $("<div id='rightPageButton'><div></div></div>");
                        rightPageButton.find('div').addClass('jqx-icon-arrow-right');
                        rightPageButton.jqxButton({ theme: theme });

                        pageButtonToFirst.appendTo(left_element);
                        leftPageButton.appendTo(left_element);
                        pageNumbers.appendTo(left_element);
                        rightPageButton.appendTo(left_element);
                        pageButtonToLast.appendTo(left_element);

                        pageButtonToFirst.click(function () {
                            if (DatasetsOfDatasourceSet.Request.Page !== 1) {
                                DatasetsOfDatasourceSet.Request.Page = 1;
                                DatasetsOfDatasourceSet.pageCounter = DatasetsOfDatasourceSet.Request.Page;
                                updateDatasetsOfDatasourceGrid();
                            }
                        });

                        pageButtonToLast.click(function () {
                            if (DatasetsOfDatasourceSet.Request.Page !== DatasetsOfDatasourceSet.pagesCount) {
                                DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pagesCount;
                                DatasetsOfDatasourceSet.pageCounter = DatasetsOfDatasourceSet.Request.Page;
                                updateDatasetsOfDatasourceGrid();
                            }
                        });

                        leftPageButton.click(function () {
                            if (DatasetsOfDatasourceSet.Request.Page - 1 > 0) {
                                DatasetsOfDatasourceSet.Request.Page -= 1;
                                DatasetsOfDatasourceSet.pageCounter = DatasetsOfDatasourceSet.Request.Page;
                                updateDatasetsOfDatasourceGrid();
                            }
                        });

                        rightPageButton.click(function () {
                            if (DatasetsOfDatasourceSet.Request.Page + 1 <= DatasetsOfDatasourceSet.pagesCount) {
                                DatasetsOfDatasourceSet.Request.Page += 1;
                                updateDatasetsOfDatasourceGrid();
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

                        pageNumbers.find('a').click(function () {
                            if (parseInt($(this).attr('data-page')) !== DatasetsOfDatasourceSet.Request.Page) {
                                DatasetsOfDatasourceSet.Request.Page = parseInt($(this).attr("data-page"));
                                DatasetsOfDatasourceSet.pageCounter = DatasetsOfDatasourceSet.Request.Page;
                                updateDatasetsOfDatasourceGrid();
                            }
                        });

                        var showRows = $('<div style="float: right; margin-top: 1px;"></div>'),
                            droplist = $('<div id="droplistPages" style="float:left">');
                        showRows.append('<div style="margin-right: 7px; float:left;">Rows:</div>');
                        showRows.append(droplist);
                        element.append(showRows);

                        var dropListSource = [50, 100, 250, 500];
                        droplist.jqxDropDownList({
                            source: dropListSource, width: 55, height: 20, theme: "light",
                            dropDownVerticalAlignment: 'top', itemHeight: 24, dropDownHeight: 104, enableBrowserBoundsDetection: true
                        });

                        var index = dropListSource.indexOf(DatasetsOfDatasourceSet.Request.Rows);
                        if (index == -1) {
                            index = dropListSource.indexOf(parseInt(getParameterByName("rows")));
                            index = index == -1 ? 1 : index;
                        }
                        droplist.jqxDropDownList('selectIndex', index);

                        droplist.bind('select', function (event) {
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

                        var inputPage = $("<input type='text' id='dataPageNymber' value='" + DatasetsOfDatasourceSet.Request.Page + "'>");
                        inputPage.jqxInput({ width: 32, height: 20 });
                        inputPage.on('change keyup', function (event) {
                            if (event.type == "keyup" && event.keyCode !== 13) return;

                            var value = parseInt($(this).val());
                            if (!isNaN(value) && value > 0 && value <= DatasetsOfDatasourceSet.pagesCount) {
                                DatasetsOfDatasourceSet.Request.Page = parseInt(value);
                                DatasetsOfDatasourceSet.pageCounter = parseInt(value);
                                updateDatasetsOfDatasourceGrid()
                            }
                        });

                        var label = $("<div id='label1-pages'>Page <span id='inputPage'></span> of <span id='numOfAllPages'>" + (isNaN(DatasetsOfDatasourceSet.pagesCount) ? 0 : DatasetsOfDatasourceSet.pagesCount) + "</span></div>");
                        label.find('#inputPage').append(inputPage);
                        label.appendTo(element);

                        element.find('div[type="button"]').mousedown(function () {
                            var className = "";
                            if (this.id == "firstButton") className = "jqx-icon-arrow-first-selected-" + theme;
                            else if (this.id == "lastButton") className = "jqx-icon-arrow-last-selected-" + theme;
                            else if (this.id == "nextButton") className = "jqx-icon-arrow-right-selected-" + theme;
                            else if (this.id == "prevButton") className = "jqx-icon-arrow-left-selected-" + theme;

                            $(this).find("div").addClass(className);
                        });

                        element.find('div[type="button"]').mouseup(function () {
                            var className = "";
                            if (this.id == "firstButton") className = "jqx-icon-arrow-first-selected-" + theme;
                            else if (this.id == "lastButton") className = "jqx-icon-arrow-last-selected-" + theme;
                            else if (this.id == "nextButton") className = "jqx-icon-arrow-right-selected-" + theme;
                            else if (this.id == "prevButton") className = "jqx-icon-arrow-left-selected-" + theme;

                            $(this).find("div").removeClass(className);
                        });

                        DatasetsOfDatasourceSet.label = label;

                        var new_element = $('<div>').append(element);
                        new_element.append(left_element);
                        return new_element;
                    }
                },
                rendertoolbar: function (toolbar) {
                    var container = $("<div id='table3-container'></div>");
                    toolbar.append(container);

                    var toolbarContent = '<table class="toolbar-table" id="toolbar-table"><tr>' +
                        '<td><input id="btnCopySeriesToFavorite" type="button" value="Add to Favorites" ></td>' +
                        '<td>&nbsp;&nbsp;Filter:</td>' +
                        '<td><input id="searchSeriesBox"></td>' +
                        '<td><button id="searchSeriesBtn"><img id="img-g3" src="resources/css/icons/search.png" style="margin:2px; border:0"></button></td>' +
                        '<td><div id="helpIcon1" class="helpIcon"></div></td>' +
                        '<td id="autosizeRow"><input id="btnAutosize" title="Autosize Columns" type="button"></td>' +
                        '<td><input id="btnHideShowEmptyRecords" type="button"></td>' +
                        '<td><input id="btnHideAdditInfo_datasource" title="Show additional data columns" type="button"></td>' +
                        '<td><input class="fullWidthPage" id="fullWidth3" title="Toggle grid to full screen width"></td>' +
                        '</tr></table>';
                    container.append(toolbarContent);

                    // Define buttons
                    $(".HelpMessage2").jqxPopover({ offset: { left: -50, top: 0 }, arrowOffsetValue: 50, title: "Search Filter Help", showCloseButton: true, selector: $("#helpIcon1") });

                    // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                    var fullWidthFlag = true;
                    let img = (!fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                    let footer_width = (!fullWidthFlag) ? '1230px' : '1230px';

                    $("#main-footer").width(footer_width);
                    $(".fullWidthPage").jqxButton({ imgSrc: "resources/css/icons/" + img + ".png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                    $(".fixpage").toggleClass('fullscreen', !fullWidthFlag);

                    $("#btnCopySeriesToFavorite").jqxButton({ imgSrc: "resources/css/icons/starAdd16.png", imgPosition: "left", width: 120, height: 24, textPosition: "right" });
                    // $("#fullWidth3").jqxButton({imgSrc: "resources/css/icons/fullscreen.png", imgPosition: "left", width: 25, height: 24, textPosition: "right"});
                    $("#btnAutosize").jqxButton({ imgSrc: "resources/css/icons/autosize.png", imgPosition: "center", width: 25, height: 24 });
                    $("#btnAutosize").tooltip();
                    $("#btnHideAdditInfo_datasource").jqxToggleButton({ imgSrc: "resources/css/icons/table_plus.png", imgPosition: "center", width: 25, height: 24 });
                    $("#btnHideShowEmptyRecords").jqxToggleButton({ imgSrc: "resources/css/icons/ShowRows2_16.png", imgPosition: "center", width: 25, height: 24 });
                    $("#searchSeriesBox").jqxInput({ height: 22, width: 250, minLength: 1, placeHolder: "Enter filter text" });

                    // Events
                    $('#searchSeriesBox').keypress(async function (e) {
                        if (e.which == 13) {
                            var filter = $("#searchSeriesBox").val();
                            if (DatasetsOfDatasourceSet.Request.Filter != filter) {
                                DatasetsOfDatasourceSet.Request.Filter = filter;
                                updateDatasetsOfDatasourceGrid();
                            }
                        }
                    });

                    $("#searchSeriesBtn").click(function (evt) {
                        var filter = $("#searchSeriesBox").val();
                        if (DatasetsOfDatasourceSet.Request.Filter != filter) {
                            DatasetsOfDatasourceSet.Request.Filter = filter;
                            updateDatasetsOfDatasourceGrid('sort');
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

                    $("#btnCopySeriesToFavorite").on('click', function () {
                        copySeriesToFavorite();
                    });

                    $("#btnAutosize").on('click', function () {
                        resizeColumns('gridDatasetsOfDatasource');
                    });

                    $("#fullWidth3").on('click', function () {
                        // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                        // Clicking function
                        img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                        footer_width = (fullWidthFlag) ? '100%' : '1230px';

                        $("#main-footer").width(footer_width);
                        $(".fullWidthPage").jqxButton({ imgSrc: "resources/css/icons/" + img + ".png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                        $(".fixpage").toggleClass('fullscreen', fullWidthFlag);
                        fullWidthFlag = !fullWidthFlag;

                        setCookie('p_fullWidth1', fullWidthFlag);
                        window.dispatchEvent(new Event('resize'));
                        resizeColumns('gridDatasetsOfDatasource');
                    });

                    $("#btnHideAdditInfo_datasource").tooltip();
                    $("#btnHideAdditInfo_datasource").on('click', function (event) {
                        var current_grid = "gridDatasetsOfDatasource";
                        var id = event.currentTarget.id;

                        setCookie('btnHideAdditInfo2', $('#' + id).jqxToggleButton('toggled'));

                        var toggled = getCookie('btnHideAdditInfo2');
                        if (toggled == 'true') {
                            $("#" + current_grid).jqxGrid('beginupdate');
                            showAdditInfo(current_grid);
                            document.getElementById(id).title = "Hide additional data columns";
                            $("#" + current_grid).jqxGrid('endupdate');

                            DatasetsOfDatasourceSet.Request.ShortRecord = false;
                            updateDatasetsOfDatasourceGrid();
                        }
                        else {
                            $("#" + current_grid).jqxGrid('beginupdate');
                            hideAdditInfo(current_grid);
                            document.getElementById(id).title = "Show additional data columns";
                            $("#" + current_grid).jqxGrid('endupdate');

                            DatasetsOfDatasourceSet.Request.ShortRecord = true;
                            updateDatasetsOfDatasourceGrid();
                        }
                    });

                    if (showAdditionalInformation2) {
                        $('#btnHideAdditInfo_datasource').jqxToggleButton('toggle');
                    }
                    else {
                    }

                    $("#btnHideShowEmptyRecords").on('click', function () {
                        var toggled = $("#btnHideShowEmptyRecords").jqxToggleButton('toggled');
                        hideEmpty = !toggled;

                        if (toggled) {
                            DatasetsOfDatasourceSet.Request.Page = 1;
                            DatasetsOfDatasourceSet.Request.IgnoreEmpty = false;
                            updateDatasetsOfDatasourceGrid();

                            document.getElementById("btnHideShowEmptyRecords").title = "Hide records with no values";
                            $("#btnHideShowEmptyRecords").tooltip();
                            $("#showHideEmptyRecords").text("Hide empty records");
                            $("#btnHideShowEmptyRecords").jqxToggleButton({ imgSrc: "resources/css/icons/HideRowsGn_16.png", imgPosition: "center", width: 25, height: 24 });
                        }
                        else {
                            DatasetsOfDatasourceSet.Request.Page = 1;
                            DatasetsOfDatasourceSet.Request.IgnoreEmpty = true;
                            updateDatasetsOfDatasourceGrid();

                            document.getElementById("btnHideShowEmptyRecords").title = "Show records with no values";
                            $("#btnHideShowEmptyRecords").tooltip();
                            $("#showHideEmptyRecords").text("Show empty records");
                            $("#btnHideShowEmptyRecords").jqxToggleButton({ imgSrc: "resources/css/icons/ShowRows2_16.png", imgPosition: "center", width: 25, height: 24 });
                        }
                    });

                    document.getElementById("btnHideShowEmptyRecords").title = "Show records with no values";
                    $("#btnHideShowEmptyRecords").tooltip();

                    $("#fullWidth3").tooltip();
                }
            });

            async function loadDropdown() {
                var source = {
                    datatype: "json",
                    datafields: [
                        { name: 'Name' },
                        { name: 'Datasource' },
                        { name: 'Description' },
                        { name: 'DatasourceInfo' },
                        { name: 'group' },
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
                    height: 25,
                    autoDropDownHeight: true,
                    renderer: function (index, label, DatasourceInfo) {
                        if (!DatasourceInfo)
                            return label;

                        if (DatasourceInfo.IsCategoryDS === false)
                            imgurl = 'resources/css/icons/starDis_16.png';
                        else
                            imgurl = 'resources/css/icons/star_icon.png';

                        //                        return '<img height="17" width="17" src="'+ DatasourceInfo.Icon +'"> <img height="17" width="17" src="' + imgurl + '"> <span id="databaseDropdown-lable">' + label + '</span>';
                        return '<img height="17" width="17" src="' + DatasourceInfo.Logo + '"> <img height="17" width="17" src="' + imgurl + '"> <span id="databaseDropdown-lable">' + label + '</span>';
                    },
                    selectionRenderer: function (element, index, label, DatasourceInfo) {
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

                $("#databaseDropdown").on('select', async function (event) {
                    if (event.args) {
                        var item = event.args.item;
                        if (item) {

                            var loadDataSource = function () {
                                var DatasourceInfo = item.originalItem.DatasourceInfo;
                                DatasetsOfDatasourceSet.Request.Datasource = DatasourceInfo.Datasource;
                                dataToSend.tab = "mydatasources";
                                dataToSend.datasource = DatasourceInfo.Datasource;

                                if (DatasourceInfo.IsCategoryDS && $('#mainSplitter-datasource').jqxSplitter('panels')[0].collapsed) {
                                    $('#mainSplitter-datasource').jqxSplitter({ showSplitBar: true });
                                    $('#mainSplitter-datasource').jqxSplitter('expand');
                                    $(".tree-loading").show();
                                    $('#jqxTabs-datasource').jqxTabs({ width: '100%', height: 'calc(100% - 33.99px)' });
                                    $("#jqxTabs-datasource").css("opacity", 1);
                                }
                                else if (!DatasourceInfo.IsCategoryDS) {
                                    // console.log("Is collapsed")
                                    $('#mainSplitter-datasource').jqxSplitter({ showSplitBar: false });
                                    $('#mainSplitter-datasource').jqxSplitter('collapse');

                                }

                                if (!DatasourceInfo.IsCategoryDS) {
                                    delete DatasetsOfDatasourceSet.Request.CategoryFilter;
                                    categoryFilterURL = "";
                                }

                                if (categoryFilterURL == "") {
                                    delete DatasetsOfDatasourceSet.Request.CategoryFilter;
                                    delete dataToSend.category;
                                }
                                else {
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

                                $('#gridDatasetsOfDatasource').jqxGrid('showloadelement');

                                function getDatasource(datasource, sessionToken) {
                                    return fetch(`https://api.intdatamedia.com/GetDatasource?SessionToken=${sessionToken}&Datasource=${datasource}&ReturnAccess=true`)
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

                                        getDatasource(infor.Datasource, infor.SessionToken)
                                            .then(res => res.json())
                                            .then(result => {
                                                if (result.Result.IsCategoryDS === true) {
                                                    DatasourceInfo.UserCategoryList = result.Result.DetailsDS.UserCategoryList
                                                    DatasourceInfo.CategoryTree = result.Result.DetailsDS.CategoryTree
                                                    DatasourceInfo.CategoryList = result.Result.DetailsDS.CategoryList
                                                    LIST = result.Result.DetailsDS.UserCategoryList;
                                                    loadDatabaseDataToGrid(DatasourceInfo);

                                                    $("#gridDatasetsOfDatasource").jqxGrid({ columns: categoryDSColumns });
                                                    $("#gridDatasetsOfDatasource").jqxGrid({ pagesize: r.Metadata.Rows });
                                                    $("#gridDatasetsOfDatasource").jqxGrid({ source: DatasetsOfDatasourceSet.dataAdapter });
                                                    $("#gridDatasetsOfDatasource").jqxGrid('updatebounddata', 'cells');

                                                    $("#gridDatasetsOfDatasource").jqxGrid('showcolumn', 'Datacategory');
                                                } else {
                                                    loadDatabaseDataToGrid(DatasourceInfo);

                                                    $("#gridDatasetsOfDatasource").jqxGrid({ columns: categoryDSColumns });
                                                    $("#gridDatasetsOfDatasource").jqxGrid({ pagesize: r.Metadata.Rows });
                                                    $("#gridDatasetsOfDatasource").jqxGrid({ source: DatasetsOfDatasourceSet.dataAdapter });
                                                    $("#gridDatasetsOfDatasource").jqxGrid('updatebounddata', 'cells');
                                                    $("#gridDatasetsOfDatasource").jqxGrid('hidecolumn', 'Datacategory');
                                                }

                                                resizeColumns('gridDatasetsOfDatasource');
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
                                        $('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');
                                        droplistDatasource_loaded = true;
                                    });
                            }

                            if (DatasetsOfDatasourceSet.Request.Filter == '' || DatasetsOfDatasourceSet.Request.Filter == undefined) {
                                delete DatasetsOfDatasourceSet.Request.Filter;
                                loadDataSource();
                            }
                            else {
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
                                }
                                else {
                                    loadDataSource();
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

            var arrangeData = function (array, type, datasourceInfo = []) {
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

            var getSpecificData = function (userRecords, treeRecords, level) {
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
                $('#gridDatasetsOfDatasource').jqxGrid('showloadelement');

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

                        $("#gridDatasetsOfDatasource").jqxGrid({ pagesize: DatasetsOfDatasourceSet.Request.Rows });
                        $("#gridDatasetsOfDatasource").jqxGrid('updatebounddata', updatetype);

                        var tmp = DatasetsOfDatasourceSet.pageCounter * DatasetsOfDatasourceSet.pageSize;
                        tmp = tmp + '';

                        $('#gridDatasetsOfDatasource').jqxGrid('setcolumnproperty', 'id', 'width', tmp.length * 10);
                        resizeColumns('gridDatasetsOfDatasource');

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
                    }, null, () => {
                        $('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');
                    });
            }

            var databaseJqxgridContextMenu = $("#databaseJqxgridMenu").jqxMenu({ width: 200, height: 125, autoOpenPopup: false, mode: 'popup' });

            $("#gridDatasetsOfDatasource").on('contextmenu', function () {
                return false;
            });

            $("#databaseJqxgridMenu").on('itemclick', function (event) {

                var args = event.args;
                var rowindex = $("#gridDatasetsOfDatasource").jqxGrid('getselectedrowindex');

                switch ($.trim($(args).text())) {
                    case "Add to Favourites":
                        copySeriesToFavorite();
                        break;

                    case "Remove from Favourites":
                        removeSeriesFromFavorites();
                        break;

                    case "Copy":
                        copySelectedSeriesToClipboard('gridDatasetsOfDatasource');
                        break;

                    case "Export":
                        makeExportSeriesDialog();
                        break;
                }
            });

            $("#gridDatasetsOfDatasource").on('rowclick', function (event) {
                if (event.args.rightclick) {
                    $("#gridDatasetsOfDatasource").jqxGrid('selectrow', event.args.rowindex);
                    var scrollTop = $(window).scrollTop();
                    var scrollLeft = $(window).scrollLeft();
                    databaseJqxgridContextMenu.jqxMenu('open', parseInt(event.args.originalEvent.clientX) + 5 + scrollLeft, parseInt(event.args.originalEvent.clientY) + 5 + scrollTop);
                    return false;
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
                        $('#jqxTabs-datasource').jqxTabs({ width: '100%', height: 'calc(100% - 33.99px)' });
                        // $('#userCategory').show();

                        $('#userCategoryCheckbox').jqxCheckBox({ checked: false });

                        $('#toggleCaptionTabTree').on('click', function (event) {
                            $('#userCategory').hide();
                        });

                        $('#toggleCaptionTab').on('click', function (event) {
                            $('#userCategory').show();
                        });

                        let info = $('#userCategory').find('#userCategoryCheckbox')[0].childNodes[1].data;
                        // console.log(info, typeof info)

                        $('#userCategory').find('#userCategoryCheckbox')[0].childNodes[1].data = `My Categories only`

                        $('#userCategoryCheckbox').on('change', function (event) {
                            // alert();
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
                                }
                                else {
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

                                    $('#jstreeCategoriesList').on('loaded.jstree', function () {
                                        let listItems = $('#jstreeCategoriesList').jstree(true).get_json('#', { flat: true });
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

                        $('#jstreeCategoriesTree').on('open_node.jstree', function (a, b, c) {
                            let treeItems = $('#jstreeCategoriesTree').jstree(true).get_json('#', { flat: true });
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

                        $('#jstreeCategoriesTree').on('activate_node.jstree', function (e, item) {
                            // $("#jstreeCategoriesList").jqxTree('selectItem', null);
                            if (item.node.children.length == 0) {
                                if (item.node.original.value !== null) {
                                    var databaseCategory = item.node.original.value;
                                    updateURL({ category: databaseCategory });
                                    updateURL({ page: 1 });
                                    DatasetsOfDatasourceSet.Request.Filter = encodeURIComponent($("#searchBox").val());
                                    DatasetsOfDatasourceSet.Request.CategoryFilter = databaseCategory;
                                    DatasetsOfDatasourceSet.Request.Page = 1;

                                    $('#gridDatasetsOfDatasource').jqxGrid('showloadelement');

                                    let filter = DatasetsOfDatasourceSet.Request.Filter;
                                    filter = (filter !== "") ? "&filter=" + filter : "";

                                    if (DatasetsOfDatasourceSet.Request.Filter == "" || DatasetsOfDatasourceSet.Request.Filter == "undefined") delete DatasetsOfDatasourceSet.Request.Filter;

                                    call_api_ajax('GetDatasets', 'get', DatasetsOfDatasourceSet.Request, true,
                                        (data) => {
                                            DatasetsOfDatasourceSet.SeriesCount = data.Result.Metadata.Datasets;
                                            DatasetsOfDatasourceSet.pagesCount = data.Result.Metadata.PagesCount;
                                            DatasetsOfDatasourceSet.pageCounter = data.Result.Metadata.Page;

                                            DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;

                                            $("#gridDatasetsOfDatasource").jqxGrid({ source: DatasetsOfDatasourceSet.dataAdapter });
                                            refreshPagination();
                                            $("#gridDatasetsOfDatasource").jqxGrid('updatebounddata', 'cells');

                                        }, null, () => {
                                            $('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');
                                        });
                                } else {
                                    $('#gridDatasetsOfDatasource').jqxGrid('clear');
                                }
                            }

                            var item = $('#jstreeCategoriesTree').jstree(true).get_selected("full", true)[0];
                            if(item)
                                document.getElementById(item.id).children[1].style.color = "white";

                            let treeItems = $('#jstreeCategoriesTree').jstree(true).get_json('#', { flat: true });
                            for (let j in treeItems) {
                                if(treeItems[j].id == item.id)
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
                                if(treeItems[j].id == item.id)
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

                        var contextCategoriesMenu = $("#jqxCategoriesMenu").jqxMenu({ width: '120px', height: '56px', autoOpenPopup: false, mode: 'popup' });
                        var attachCategoriesContextMenu = function () {
                            $("#jqxCategoriesMenu").css("opacity", 1);

                            // open the context menu when the user presses the mouse right button.
                            $("#jstreeCategoriesTree").bind('contextmenu', function (e) {
                                return false
                            });

                            $("#jstreeCategoriesTree").on('mousedown', function (event) {
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

                        $("#jqxCategoriesMenu").on('itemclick', function (event) {
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

                        $('#jstreeCategoriesTree').on('loaded.jstree', function () {
                            let treeItems = $('#jstreeCategoriesTree').jstree(true).get_json('#', { flat: true });
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

                        listRecords = [first_item,].concat(sorted_list)

                        $('#jstreeCategoriesList').jstree({
                            "core": {
                                "data": listRecords,
                                "multiple": false,
                                "animation": 0
                            },
                            // "plugins" : [ "wholerow", "checkbox" ]
                        });

                        $('#jstreeCategoriesList').on('activate_node.jstree', function (e, item) {
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

                                $('#gridDatasetsOfDatasource').jqxGrid('showloadelement');

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

                                        // data.Result.Datasets.forEach(item => console.log(item.Subscription))

                                        $("#gridDatasetsOfDatasource").jqxGrid({ source: DatasetsOfDatasourceSet.dataAdapter });
                                        refreshPagination();
                                        $("#gridDatasetsOfDatasource").jqxGrid('updatebounddata');

                                    }, null, () => {
                                        $('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');
                                    });
                            }
                            else {
                                $('#gridDatasetsOfDatasource').jqxGrid('clear');
                            }

                            var item = $('#jstreeCategoriesList').jstree(true).get_selected("full", true)[0];
                            if(item)
                                document.getElementById(item.id).children[1].style.color = "white";

                            let treeItems = $('#jstreeCategoriesList').jstree(true).get_json('#', { flat: true });
                            for (let j in treeItems) {
                                if(treeItems[j].id == item.id)
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
                                if(treeItems[j].id == item.id)
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

                        var attachCategoriesContextMenu = function () {
                            $("#jqxCategoriesMenu").css("opacity", 1);

                            // open the context menu when the user presses the mouse right button.
                            $("#jstreeCategoriesList").bind('contextmenu', function (e) {
                                return false
                            });

                            // open the context menu when the user presses the mouse right button.
                            $("#jstreeCategoriesList").on('mousedown', function (event) {
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

                        $("#jqxCategoriesMenu").on('itemclick', function (event) {
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

                        $('#jstreeCategoriesList').on('loaded.jstree', function () {
                            let listItems = $('#jstreeCategoriesList').jstree(true).get_json('#', { flat: true });
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
                var indexes = $('#gridDatasetsOfDatasource').jqxGrid('getselectedrowindexes');
                if (indexes.length < 1) return;
                var duplicates = [];

                for (var i = 0; i < indexes.length; i++) {
                    var row = $('#gridDatasetsOfDatasource').jqxGrid('getrowdata', indexes[i]);
                    if (row.Favorite == true) duplicates.push(row.Symbol);
                }

                if (duplicates.length > 0) {
                    var h = duplicates.length == 1 ? 'was' : 'were';
                    functionNotificationMessage({ text: 'Series: ' + duplicates.join(',') + ' ' + h + ' already marked as "Favorites"' });
                }
                else {
                    dialogWindow("Do you want to add " + indexes.length + " series to favorites list?", "query", "confirm", null,
                        async () => {
                            var series = [];
                            for (var i = 0; i < indexes.length; i++) {
                                var row = $('#gridDatasetsOfDatasource').jqxGrid('getrowdata', indexes[i]);

                                folderStructure[0].value.items.push({ Datasource: row.Datasource, Datacategory: row.Datacategory, Symbol: row.Symbol });
                                $("#gridDatasetsOfDatasource").jqxGrid('setcellvalue', indexes[i], "Favorite", true);

                                let isExist = false;
                                for (var f in userFavorites) {
                                    if (userFavorites[f].Symbol == row.Symbol) {
                                        isExist = true;
                                    }
                                }
                                if (!isExist) {
                                    if (row.Datacategory !== undefined && row.Datacategory !== "") series.push(row.Datasource + '/' + row.Datacategory + '/' + row.Symbol);
                                    else series.push(row.Datasource + '/' + row.Symbol);
                                    userFavorites.push(row);
                                }
                            }
                            if (activeGrid_active) {
                                refreshFavouritesGrid();
                            }

                            if (series.length > 0)
                                call_api_ajax('AddUserFavoriteDatasets', 'get', { SessionToken: sessionToken, "Series[]": series }, true);

                            functionNotificationMessage({ text: "You have successfully added " + indexes.length + " series to your Favorites list" });
                            
                            folderStructure1 = await createFolderStructure(objectFavorites, sessionToken);
                            $('#jsreeFavorites').jstree("destroy").empty();
                            $('#jsreeFavorites').jstree({
                                "core": {
                                    "data": folderStructure1,
                                    "check_callback": true,
                                },
                                "plugins": ["dnd"]
                            }).on('loaded.jstree', async function () {
                                let treeNodes = $('#jsreeFavorites').jstree(true).get_json('#', { flat: true });
                                var node = $('#jsreeFavorites').jstree(true).get_node(treeNodes[0].id);
                                $('#jsreeFavorites').jstree(true).select_node(treeNodes[0]);

                                setTimeout(() => {
                                    $('#jsreeFavorites').on("select_node.jstree", function (e, data) {
                                        sourceTreeItem = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                        var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                        if (item.original.value.root == true) {
                                            $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', true);
                                            $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', true);
                                            $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', true);
                                            $("#btnDeleteFolder").jqxButton({ disabled: true });
                                            $("#btnRenameFolder").jqxButton({ disabled: true });
                                        } else {
                                            $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', false);
                                            $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', false);
                                            $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', false);
                                            $("#btnDeleteFolder").jqxButton({ disabled: false });
                                            $("#btnRenameFolder").jqxButton({ disabled: false });
                                        }
                                    });
                                }, 200);

                                refreshFavouritesGrid();
                            });
                        });
                }
            }
            function removeSeriesFromFavorites() {
                dialogWindow("Remove all selected series from your Favorites list?", "query", "confirm", null, () => {

                    var rowsindexes = $("#gridDatasetsOfDatasource").jqxGrid('getselectedrowindexes'),
                        item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];

                    rowsindexes.sort(function (a, b) { return a - b; });

                    var deleted = [], deleted_symbol = [], rows_data = [];
                    for (var i = 0; i < rowsindexes.length; i++) {
                        var row = $("#gridDatasetsOfDatasource").jqxGrid('getrowdata', rowsindexes[i]);

                        if (row.Datacategory !== undefined)
                            deleted.push(row.Datasource + '/' + row.Datacategory + '/' + row.Symbol);
                        else
                            deleted.push(row.Datasource + '/' + row.Symbol);

                        deleted_symbol.push(row.Symbol);
                        rows_data.push(row);
                    }

                    call_api_ajax('RemoveUserFavoriteDatasets', 'get', { SessionToken: sessionToken, "Series[]": deleted }, true, async () => {
                        let data = userFavorites, new_data = [];

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

                            var rows = $("#gridDatasetsOfDatasource").jqxGrid('getrows');
                            rows = rows.map((v, i) => {
                                new_deleted.map((e) => {
                                    if (e == v.Symbol && v.Favorite == true) {
                                        $("#gridDatasetsOfDatasource").jqxGrid('setcellvalue', i, "Favorite", false);
                                    }
                                });
                            });

                            userFavorites = new_data;

                            if (activeGrid_active) {
                                // refreshTreeFolders();
                                refreshFavouritesGrid();
                                var n = 'folder ' + item.value.name;
                                if (item.value.root == true)
                                    n = 'your Favorites list';
                            }

                            if (disactiveGrid_active) {
                                userDeletedFavorites = userDeletedFavorites.concat(rows_data);
                                disactiveSource.localdata = userDeletedFavorites;
                                $("#disactiveJqxgrid").jqxGrid('updatebounddata', 'cells');
                            }

                            var singleCase = deleted.length == 1 ? " has" : "s have";
                            functionNotificationMessage({ text: deleted.length + ' symbol' + singleCase + ' been removed from favorites list', type: "info" });
                        }
                    });
                });
            }
        }
        /* =============== End gridDatasetsOfDatasource ==================*/

        /* =================== disactiveJqxgrid ==================== */
        async function disactiveGrid() {
            var disactiveGroupsrenderer = function (text, group, expanded, data) {
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
            var dataFieldsDisactive = [
                { name: 'DateTime', type: 'string' }
            ];
            dataFieldsDisactive = dataFieldsDisactive.concat(baseDataFields);

            userDeletedFavorites = await getDeletedUserFavorites(sessionToken);

            disactiveSource = {
                datatype: "json",
                datafields: dataFieldsDisactive,
                localdata: userDeletedFavorites
            };

            disactiveDataAdapter = new $.jqx.dataAdapter(disactiveSource, { async: true });

            var lastColumn = [{ text: 'Removed Date', datafield: 'DateTime', cellsalign: 'center', align: 'center', width: 140 }];
            var columnsDisactive = baseGridColumns.concat(lastColumn);

            var new_array = [];
            for (var item in columnsDisactive) {
                for (var elm in activeGridColumns) {
                    if (columnsDisactive[item].text == activeGridColumns[elm].text)
                        new_array.push(columnsDisactive[item]);
                }
            }
            columnsDisactive = new_array;

            $("#disactiveJqxgrid").jqxGrid(
                {
                    handlekeyboardnavigation: keyboardNavigation,
                    width: '100%',
                    height: '100%',
                    source: disactiveDataAdapter,
                    columnsresize: true,
                    rowsheight: 30,
                    columnsheight: 30,
                    sortable: true,
                    showtoolbar: true,
                    showfilterrow: false,
                    filterable: true,
                    groupable: false,
                    groupsrenderer: disactiveGroupsrenderer,
                    selectionmode: 'multiplerowsadvanced',
                    columns: columnsDisactive,
                    ready: function () {
                        if (getCookie('btnHideAdditInfo3') != "undefined" && getCookie('btnHideAdditInfo3') == "true") {
                            showAdditInfo("disactiveJqxgrid");
                            showAdditionalInformation3 = true;
                        }
                        else {
                            hideAdditInfo("disactiveJqxgrid");
                            showAdditionalInformation3 = false;
                        }

                        var mTableObject = $("#disactiveJqxgrid");
                        var colDefs = mTableObject.jqxGrid('columns').records;

                        for (var idx = 0; idx < colDefs.length; idx++) {
                            if (colDefs[idx].datafield !== "Name") {
                                mTableObject.jqxGrid('autoresizecolumn', colDefs[idx].datafield, 'all');
                                mTableObject.jqxGrid('setcolumnproperty', colDefs[idx].datafield, 'width', colDefs[idx].width);
                            }
                        }

                        resizeColumns('disactiveJqxgrid');
                        $('#jqxLoader').jqxLoader('close');
                        $('#disactiveGrid').removeClass('wait');
                        disactiveGrid_active = true;
                    },
                    rendertoolbar: function (toolbar) {
                        var container = $("<div id='disactiveJqxgrid-container'></div>");
                        toolbar.append(container);

                        container.append('<table id="disactiveJqxgrid-table"><tr>' +
                            '<td id="disactive-table-first"> <input id="btnRestore" type="button" value="Restore to Favorites"></td>' +
                            '<td align="right"><input id="btnRemove" title="Permanently remove from favorites list" type="button" value="Delete"></td>' +
                            '<td align="right"><input id="btnDelAutosize" title="Autosize Columns" type="button"></td>' +
                            '<td><input id="btnHideAdditInfo_deleted" title="Show additional data columns" type="button"></td>' +
                            '<td><input class="fullWidthPage" id="fullWidth1" title="Toggle grid to full screen width"></td>' +
                            '</tr></table>');

                        // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                        var fullWidthFlag = true;
                        let img = (!fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                        let footer_width = (!fullWidthFlag) ? '1230px' : '1230px';

                        // $("#main-footer").width(footer_width);
                        // $(".fixpage").toggleClass('fullscreen', !fullWidthFlag);
                        // $("section .wrap").toggleClass('fullscreen', !fullWidthFlag);
                        resizeColumns('disactiveJqxgrid');

                        $("#btnHideAdditInfo_deleted").jqxToggleButton({ imgSrc: "resources/css/icons/table_plus.png", imgPosition: "center", height: 24, width: 25 });
                        $("#fullWidth1").jqxButton({ imgSrc: "resources/css/icons/" + img + ".png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                        $("#btnRemove").jqxButton({ imgSrc: "resources/css/icons/delete_16.ico", imgPosition: "left", width: 65, height: 24, textPosition: "right" });
                        $("#btnRestore").jqxButton({ imgSrc: "resources/css/icons/restore.ico", imgPosition: "left", width: 140, height: 24, textPosition: "right" });

                        // Tooltips
                        $("#btnRemove").tooltip();
                        $("#fullWidth1").tooltip();
                        $("#btnHideAdditInfo_deleted").tooltip();

                        $("#fullWidth1").on('click', function () {
                            // var fullWidthFlag = getCookie('p_fullWidth1') == undefined ? true : getCookie('p_fullWidth1') == "true" ? true : false;
                            img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                            footer_width = (fullWidthFlag) ? '100%' : '1230px';

                            $("#main-footer").width(footer_width);
                            $(".fullWidthPage").jqxButton({ imgSrc: "resources/css/icons/" + img + ".png", imgPosition: "left", width: 25, height: 24, textPosition: "right" });
                            $(".fixpage").toggleClass('fullscreen', fullWidthFlag);

                            fullWidthFlag = !fullWidthFlag;
                            window.dispatchEvent(new Event('resize'));
                            resizeColumns('disactiveJqxgrid');
                        });

                        $("#btnRemove").on('click', function () {
                            var getselectedrowindexes = $('#disactiveJqxgrid').jqxGrid('getselectedrowindexes');
                            if (getselectedrowindexes.length == 0) return;
                            var message;

                            if (getselectedrowindexes.length > 1)
                                message = "Are you sure you want to delete " + getselectedrowindexes.length + " series?";

                            else if (getselectedrowindexes.length > 0) {
                                var row = $('#disactiveJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
                                let data = row.Datasource + "/" + row.Symbol;
                                if (row.Datacategory !== undefined)
                                    data = row.Datasource + "/" + row.Datacategory + "/" + row.Symbol;
                                message = "Are you sure you want to delete " + data + " series?";
                            }

                            dialogWindow(message, 'warning', 'confirm', null, () => {
                                var rowsindexes = $('#disactiveJqxgrid').jqxGrid('getselectedrowindexes');
                                if (rowsindexes.length < 1) return;
                                rowsindexes.sort(function (a, b) { return a - b; });

                                var short_elems = [];

                                for (var i = 0; i < rowsindexes.length; i++) {
                                    var ind = rowsindexes[i];
                                    var elem = $('#disactiveJqxgrid').jqxGrid('getrowdata', ind);

                                    if (elem.Datacategory !== undefined)
                                        short_elems.push(elem.Datasource + '/' + elem.Datacategory + '/' + elem.Symbol);
                                    else
                                        short_elems.push(elem.Datasource + '/' + elem.Symbol);
                                }
                                call_api_ajax('DeleteRemovedUserFavoriteDatasets', 'get', { SessionToken: sessionToken, "Series[]": short_elems }, true, () => {
                                    $('#disactiveJqxgrid').jqxGrid('deleterow', ind);
                                    functionNotificationMessage({ text: 'The deletion was successful' });
                                    $("#disactiveJqxgrid").jqxGrid('clearselection');
                                });
                            });
                        });

                        $("#btnHideAdditInfo_deleted").on('click', function (event) {
                            var current_grid = "disactiveJqxgrid",
                                id = event.currentTarget.id;
                            setCookie('btnHideAdditInfo3', $('#' + id).jqxToggleButton('toggled'));

                            var toggled = getCookie('btnHideAdditInfo3');
                            if (toggled == 'true') {
                                $("#" + current_grid).jqxGrid('beginupdate');
                                showAdditInfo(current_grid);
                                document.getElementById(id).title = "Hide additional data columns";
                                $("#" + current_grid).jqxGrid('endupdate');

                            }
                            else {
                                $("#" + current_grid).jqxGrid('beginupdate');
                                hideAdditInfo(current_grid);
                                document.getElementById(id).title = "Show additional data columns";
                                $("#" + current_grid).jqxGrid('endupdate');
                            }

                        });

                        if (showAdditionalInformation3) {
                            $('#btnHideAdditInfo_deleted').jqxToggleButton('toggle');
                        }
                        else {
                        }

                        $("#btnRestore").on('click', restoreFavorite);
                        $("#btnDelAutosize").jqxButton({ imgSrc: "resources/css/icons/autosize.png", imgPosition: "center", width: 25, height: 24 });
                        $("#btnDelAutosize").tooltip();
                        $("#btnDelAutosize").on('click', function () {
                            resizeColumns('disactiveJqxgrid');
                        });

                    }
                });

            // create context menu
            var disactiveJqxgridContextMenu = $("#disactiveJqxgridMenu").jqxMenu({ width: 160, height: 58, autoOpenPopup: false, mode: 'popup' });
            $("#disactiveJqxgrid").on('contextmenu', function () {
                return false;
            });

            // handle context menu clicks.
            $("#disactiveJqxgridMenu").on('itemclick', async function (event) {
                var args = event.args;
                if ($.trim($(args).text()) == "Restore to Favorites") {
                    $('#btnRestore').click();
                }
                else if ($.trim($(args).text()) == "Delete") {
                    $('#btnRemove').click();
                }
            });

            $("#disactiveJqxgrid").on('rowclick', function (event) {
                if (event.args.rightclick) {
                    $("#disactiveJqxgrid").jqxGrid('selectrow', event.args.rowindex);
                    var scrollTop = $(window).scrollTop();
                    var scrollLeft = $(window).scrollLeft();
                    disactiveJqxgridContextMenu.jqxMenu('open', parseInt(event.args.originalEvent.clientX) + 5 + scrollLeft, parseInt(event.args.originalEvent.clientY) + 5 + scrollTop);
                    return false;
                }
            });

            async function restoreFavorite() {
                var getselectedrowindexes = $('#disactiveJqxgrid').jqxGrid('getselectedrowindexes');
                if (getselectedrowindexes.length == 0) return;
                var message;

                if (getselectedrowindexes.length > 1)
                    message = "Are you sure you want to restore " + getselectedrowindexes.length + " series?";

                else if (getselectedrowindexes.length > 0) {
                    var row = $('#disactiveJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);

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
                var rowsindexes = $('#disactiveJqxgrid').jqxGrid('getselectedrowindexes');
                if (rowsindexes.length < 1) return;
                rowsindexes.sort(function (a, b) { return a - b; });

                var elems = {},
                    short_elems = [],
                    long_elems = [],
                    count_cc = 0,
                    dont_exists,
                    deleted_tab = [],
                    existed = 0;

                for (var i = 0; i < rowsindexes.length; i++) {
                    var ind = rowsindexes[i];
                    var elem = $('#disactiveJqxgrid').jqxGrid('getrowdata', ind);

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

                    if (dont_exists == false) { existed++; continue; }
                    elems[c_index] = 1;
                    long_elems.push(elem);

                    if (elem.Datacategory)
                        short_elems.push(elem.Datasource + '/' + elem.Datacategory + '/' + elem.Symbol);
                    else
                        short_elems.push(elem.Datasource + '/' + elem.Symbol);
                }

                call_api_ajax('DeleteRemovedUserFavoriteDatasets', 'get', {
                    SessionToken: sessionToken,
                    "Series[]": deleted_tab
                }, true, () => {
                    if (short_elems.length == 0)
                        message = 'All selected series were already active.';

                    else if (existed != 0 && short_elems.length != 0)
                        message = short_elems.length + ' series ' + were_or_was(short_elems.length) + ' restored correctly<br>' + existed + ' series ' + were_or_was(existed) + ' already active."';

                    else
                        message = 'All selected series were restored: "' + short_elems.length + ' series ' + were_or_was(short_elems.length) + ' restored correctly"'

                    functionNotificationMessage({ text: message });

                    for (var i = 0; i < rowsindexes.length; i++) {
                        var ind = rowsindexes[i];
                        userDeletedFavorites.splice(ind - count_cc, 1);
                        count_cc++;
                    }
                    disactiveSource.localdata = userDeletedFavorites;
                    $('#disactiveJqxgrid').jqxGrid('updatebounddata');
                    $("#disactiveJqxgrid").jqxGrid('clearselection');
                    
                    if (short_elems.length > 0) {
                        call_api_ajax('AddUserFavoriteDatasets', 'get', {
                            SessionToken: sessionToken,
                            "Series[]": short_elems
                        }, true, async () => {
                            
                            if (activeGrid_active) {
                                $("#activeJqxgrid").jqxGrid('updatebounddata', 'cells');
                                folderStructure[0].value.items = folderStructure[0].value.items.concat(short_elems);
                                userFavorites = userFavorites.concat(long_elems);
                                
                                folderStructure1 = await createFolderStructure(objectFavorites, sessionToken);
                                $('#jsreeFavorites').jstree("destroy").empty();
                                $('#jsreeFavorites').jstree({
                                    "core": {
                                        "data": folderStructure1,
                                        "check_callback": true,
                                    },
                                    "plugins": ["dnd"]
                                }).on('loaded.jstree', async function () {
                                    let treeNodes = $('#jsreeFavorites').jstree(true).get_json('#', { flat: true });
                                    var node = $('#jsreeFavorites').jstree(true).get_node(treeNodes[0].id);
                                    $('#jsreeFavorites').jstree(true).select_node(treeNodes[0]);

                                    setTimeout(() => {
                                        $('#jsreeFavorites').on("select_node.jstree", function (e, data) {
                                            sourceTreeItem = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                            var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                            if (item.original.value.root == true) {
                                                $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', true);
                                                $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', true);
                                                $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', true);
                                                $("#btnDeleteFolder").jqxButton({ disabled: true });
                                                $("#btnRenameFolder").jqxButton({ disabled: true });
                                            } else {
                                                $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', false);
                                                $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', false);
                                                $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', false);
                                                $("#btnDeleteFolder").jqxButton({ disabled: false });
                                                $("#btnRenameFolder").jqxButton({ disabled: false });
                                            }
                                        });
                                    }, 200);

                                    refreshFavouritesGrid();
                                });
                            }
                        });
                    }
                });
            }
        }

        /* ============= End disactiveJqxgrid =============== */


        /* =================== Backups =================== */
        var backupsGridDataAdapter;

        $('#backupName').keypress(function (e) {
            if (e.which == 13) {
                createBackup();
                $('#addBackupWindow').dialog('close');
                return false;
            }
        });

        $('#newBackupName').keypress(function (e) {
            if (e.which == 13) {
                editBackup();
                return false;
            }
        });

        async function updateBackupsList() {
            var backupsGridSource = {
                datatype: "json",
                datafields: [
                    { name: 'ActiveDateLabel', type: 'date' },
                    { name: 'AutoSaved', type: 'boolean' },
                    { name: 'ArchiveID', type: 'integer' },
                    { name: 'ArchiveName', type: 'string' },
                    { name: 'Protected', type: 'boolean' }
                ]
            };

            call_api_ajax('GetBackupsList', 'get', { SessionToken: sessionToken }, false, (data) => {
                backupsGridSource.localdata = data.Result;
            });

            backupsGridDataAdapter = new $.jqx.dataAdapter(backupsGridSource);
            $("#backupsJqxgrid").jqxGrid({ source: backupsGridDataAdapter });
            $("#backupsJqxgrid").jqxGrid('updatebounddata');
        }

        async function showBackupsList() {
            if (!backups_loaded) {
                $('#windowBackups').jqxWindow({
                    showCollapseButton: false,
                    resizable: true,
                    isModal: false,
                    height: '540px',
                    width: '800px',
                    maxHeight: screen.innerHeight,
                    maxWidth: screen.innerWidth,
                    autoOpen: false,
                });

                $("#addBackupWindow").dialog({
                    resizable: true,
                    autoOpen: false,
                    height: "auto",
                    width: "auto",
                    modal: true,
                    buttons: {
                        Ok: function () {
                            createBackup();
                            $(this).dialog("close");
                        },
                        Cancel: function () {
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
                        Ok: function () {
                            editBackup();
                        },
                        Cancel: function () {
                            $('#editBackupWindow').find('#newBackupName').val('');
                            $(this).dialog("close");
                        }
                    }
                });
            }
            $('#windowBackups').jqxWindow('open');

            if (!backups_loaded) {
                backups_loaded = true;

                $('#windowBackups').jqxWindow({ title: '<img height="18" width="18" src="resources/css/icons/star_icon.png" id="windowBackup-style"> User Favorite Backups' });

                var backupsGridSource = {
                    datatype: "json",
                    datafields: [
                        { name: 'ActiveDateLabel', type: 'date' },
                        { name: 'AutoSaved', type: 'boolean' },
                        { name: 'ArchiveID', type: 'integer' },
                        { name: 'ArchiveName', type: 'string' },
                        { name: 'Protected', type: 'boolean' }
                    ]
                };

                call_api_ajax('GetBackupsList', 'get', { SessionToken: sessionToken }, false, (data) => {
                    backupsGridSource.localdata = data.Result;
                });

                backupsGridDataAdapter = new $.jqx.dataAdapter(backupsGridSource);

                $("#backupsJqxgrid").jqxGrid({
                    handlekeyboardnavigation: keyboardNavigation,
                    width: '100%',
                    height: '100%',
                    source: backupsGridDataAdapter,
                    columnsresize: true,
                    sortable: false,
                    showtoolbar: true,
                    filterable: false,
                    selectionmode: 'multiplerowsextended',
                    ready: function () {
                        $("#backupsJqxgrid").jqxGrid('autoresizecolumns');
                    },
                    rendertoolbar: function (toolbar) {
                        var container = $("<div id='backup-container'></div>");
                        toolbar.append(container);
                        container.append('<table><tr>' +
                            '<td><input id="btnBackupCreate" type="button" value="Create"></td>' +
                            '<td><input id="btnBackupEdit" type="button" value="Properties"></td>' +
                            '<td><input id="btnBackupRestore" type="button" value="Restore"></td>' +
                            '<td><input id="btnBackupRemove" type="button" value="Delete"></td>' +
                            '<td id="lastItem-backup"></td>' +
                            '<td><input id="refreshBackup" type="button" value=""></td>' +
                            '</tr></table>'
                        );

                        $("#btnBackupRemove").jqxButton({ imgSrc: "resources/css/icons/delete.png", imgPosition: "left", width: '74', textPosition: "center" });
                        $("#btnBackupCreate").jqxButton({ imgSrc: "resources/css/icons/add.png", imgPosition: "left", width: '74', textPosition: "center" });
                        $("#btnBackupRestore").jqxButton({ imgSrc: "resources/css/icons/restore.png", imgPosition: "left", width: '80', textPosition: "center" });
                        $("#btnBackupEdit").jqxButton({ imgSrc: "resources/css/icons/pencil.png", imgPosition: "left", width: '90', textPosition: "center" });
                        $("#refreshBackup").jqxButton({ imgSrc: "resources/css/icons/refresh_16.png", imgPosition: "right", width: '26', textPosition: "center" });
                        $("#newBackupPadlock").jqxCheckBox({ checked: false });

                        $("#btnBackupRemove").on('click', function () {
                            var rows = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');

                            if (rows.length == 0) {
                                dialogWindow("Please, select at least one backup", "error");
                            }
                            else {
                                var pro = false, msg = '';
                                for (var i in rows) {
                                    let row = $('#backupsJqxgrid').jqxGrid('getrowdata', rows[i]);
                                    if (row.Protected) pro = true;
                                }
                                if (pro) {
                                    if (rows.length == 1)
                                        msg = "You must remove protection from this backup before it can be deleted."
                                    else
                                        msg = "You must remove protection from all backups before they can be deleted."

                                    dialogWindow(msg, 'error', null, 'Delete Favorites Backup');
                                    return;
                                }
                                else {
                                    if (rows.length == 1) {
                                        let row = $('#backupsJqxgrid').jqxGrid('getrowdata', rows[0]);
                                        dialogWindow('You are about to delete backup #' + row.ArchiveID + ', "' + row.ArchiveName + '".<br>If you delete this backup it cannot be recovered.<br><br>Do you want to continue?',
                                            'warning', 'confirm', 'Delete Favorites Backup', () => {
                                                deleteBackup();
                                            });
                                    }
                                    else {
                                        dialogWindow('You are about to delete backup ' + rows.length + ' backup files.<br>If you delete them, they cannot be recovered.<br><br>Do you want to continue?',
                                            'warning', 'confirm', 'Delete Favorites Backup', () => {
                                                deleteBackup();
                                            });
                                    }
                                    $("#deleteBackupWindowBtn").focus();
                                }

                            }
                        });

                        $("#refreshBackup").on('click', function () {
                            updateBackupsList();
                        });

                        $("#btnBackupCreate").on('click', function () {
                            $("#backupPadlock").prop('checked', false);
                            $("#backupName").val('');
                            $('#addBackupWindow').dialog('open');
                            $("#backupName").focus();
                        });

                        $("#btnBackupRestore").on('click', function () {
                            var getselectedrowindexes = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');

                            if (getselectedrowindexes.length == 0) {
                                dialogWindow("Please, select at least one backup", "error");
                            }
                            else if (getselectedrowindexes.length > 1) {
                                dialogWindow('Restore only works when one backup is selected.', 'error');
                            }
                            else {
                                var row = $('#backupsJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
                                dialogWindow('You are about to restore backup #' + row.ArchiveID + ', "' + row.ArchiveName + '".<br>Your existing favourites list and folders will be overwritten.<br><br>Do you want to continue?',
                                    'warning', 'confirm', 'Restore Favorites', () => {
                                        restoreBackup();
                                    });
                            }
                        });

                        $("#btnBackupEdit").on('click', function () {
                            var getselectedrowindexes = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');
                            if (getselectedrowindexes.length == 0)
                                return;

                            else if (getselectedrowindexes.length == 1) {
                                var row = $('#backupsJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
                                $('#multipleBackup').hide();
                                $('#singleBackup').show();

                                $("#newBackupPadlock").jqxCheckBox({ checked: row.Protected });
                                $('#editBackupWindow > span').text(row.ArchiveID);
                                $('#newBackupName').val(row.ArchiveName);
                                $('#oldBackupName').text(row.ArchiveName);
                                $('#editBackupWindow').dialog('open');
                                $("#newBackupName").focus();
                            }
                            else if (getselectedrowindexes.length > 1) {
                                $('#singleBackup').hide();
                                $('#multipleBackup').show();
                                $('#oldBackupName  #rowsLength').text(getselectedrowindexes.length);

                                let check_protect = [];
                                for (var i in getselectedrowindexes) {
                                    var row = $('#backupsJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[i]);
                                    check_protect.push(row.Protected);
                                }

                                if (check_protect.includes(true) && check_protect.includes(false))
                                    $("#newBackupPadlock").jqxCheckBox({ checked: null });

                                else if (check_protect.includes(true))
                                    $("#newBackupPadlock").jqxCheckBox({ checked: true });

                                else if (check_protect.includes(false))
                                    $("#newBackupPadlock").jqxCheckBox({ checked: false });

                                $('#editBackupWindow').dialog('open');
                            }
                        });
                    },
                    columns: [
                        { text: 'ID', datafield: 'ArchiveID', cellsalign: 'center', align: 'center', width: 80 },
                        { text: 'Date', datafield: 'ActiveDateLabel', cellsalign: 'center', align: 'center', cellsformat: 'yyyy-MM-dd hh:mm:ss', minwidth: 100 },
                        { text: 'Auto', datafield: 'AutoSaved', cellsrenderer: columnData, cellsalign: 'center', align: 'center', width: 40 },
                        { text: 'Description', datafield: 'ArchiveName', cellsalign: 'left', align: 'center', minwidth: 100 },
                        { text: '<img height="16" width="16" src="../../../icons/grey_login16.png" id="backup-lock">', datafield: 'Protected', cellsrenderer: columnData, cellsalign: 'center', align: 'center', width: 25 },
                    ],
                    theme: theme
                });

                $("#backupsJqxgrid").jqxGrid({ source: backupsGridDataAdapter });

                var contextMenuBackups = $("#jqxGridMenuBackups").jqxMenu({ width: 105, height: 90, autoOpenPopup: false, mode: 'popup' });
                $("#backupsJqxgrid").on('contextmenu', function () {
                    return false;
                });
                $("#jqxGridMenuBackups").on('itemclick', function (event) {
                    var args = event.args;
                    var rowindex = $("#backupsJqxgrid").jqxGrid('getselectedrowindex');
                    switch ($.trim($(args).text())) {
                        case "Properties":
                            $("#btnBackupEdit").click();
                            break;

                        case "Restore":
                            $("#btnBackupRestore").click();
                            break;

                        case "Delete":
                            $("#btnBackupRemove").click();
                            break;
                    }
                });

                $("#backupsJqxgrid").on('rowclick', function (event) {
                    if (event.args.rightclick) {
                        $("#backupsJqxgrid").jqxGrid('selectrow', event.args.rowindex);
                        var scrollTop = $(window).scrollTop();
                        var scrollLeft = $(window).scrollLeft();
                        contextMenuBackups.jqxMenu('open', parseInt(event.args.originalEvent.clientX) + 5 + scrollLeft, parseInt(event.args.originalEvent.clientY) + 5 + scrollTop);
                        return false;
                    }
                });
            }
        }

        $('#windowBackups').on('close', function () {
            $('body').removeClass('overlay');
            $('#backupsJqxgrid').jqxGrid('clearselection');
        });

        var columnData = function (row, columnfield, value, defaulthtml, columnproperties) {
            if (columnfield == 'AutoSaved')
                return (value) ? '<div align="center"><img height="16" width="16" class="columnData" src="../../../icons/action_check.png"></div>' : '';

            else
                return (value) ? '<div align="center"><img height="16" width="16" class="columnData" src="../../../icons/login.png"></div>' : '';
        }

        function deleteBackup() {
            var rows = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');
            var is_error = false;

            if (rows.length !== 0) {
                for (var i in rows) {
                    var row = $('#backupsJqxgrid').jqxGrid('getrowdata', rows[i]);

                    call_api_ajax('DeleteBackupProfile', 'get', { SessionToken: sessionToken, ArchiveID: row.ArchiveID }, false, null,
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
                $('#backupsJqxgrid').jqxGrid('clearselection');
                updateBackupsList();
                functionNotificationMessage({ text: 'Records successfully deleted: ' + rows.length });
            }
        }

        function createBackup() {
            var bn = $('#backupName').val();
            var Protected = $('#addBackupWindow #backupPadlock').is(':checked');

            if (bn == '') {
                dialogWindow("Description can not be empty", 'error');
                return;
            }
            else if (bn.length <= 3) {
                dialogWindow("Description must be more than 3 characters", 'error');
                return;
            }
            else {
                let parameters = {
                    SessionToken: sessionToken,
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
            var getselectedrowindexes = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');
            if (getselectedrowindexes.length == 0)
                return;

            else if (getselectedrowindexes.length == 1) {
                var newBackupName = $("#newBackupName").val();

                if (newBackupName == null || newBackupName == '') {
                    dialogWindow("Backup name can't be empty", "error");
                }
                else if (newBackupName.length <= 3) {
                    dialogWindow("Description must be more than 3 characters", "error");
                }
                else {
                    let rows = $('#backupsJqxgrid').jqxGrid('getrows');
                    for (var i = 0; i < rows.length; i++) {
                        if (i == getselectedrowindexes[0])
                            continue;

                        let row = rows[i];
                        if (row.name == newBackupName) {
                            dialogWindow("A backup with this name already exists", "error");
                            return;
                        }
                    }
                    let row = $('#backupsJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]),
                        parameters = {
                            SessionToken: sessionToken,
                            ArchiveID: row.ArchiveID,
                            NewArchiveName: newBackupName,
                            Protected: protected
                        };
                    call_api_ajax('BackupProfileProperties', 'get', parameters, true, () => {
                        updateBackupsList();
                        $('#editBackupWindow').dialog('close');
                    });
                }
            }
            else {
                if (protected !== null) {
                    for (var i in getselectedrowindexes) {
                        let row = $('#backupsJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[i]),
                            parameters = {
                                SessionToken: sessionToken,
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
            var rows = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');
            var row = $('#backupsJqxgrid').jqxGrid('getrowdata', rows[0]);
            let parameters = {
                SessionToken: sessionToken,
                ArchiveID: row.ArchiveID
            }

            call_api_ajax('RestoreBackupProfile', 'get', parameters, true,
                async (data) => {
                    if (data.Result.Status !== 200) dialogWindow(data.Result.Detail, 'error');
                    else {
                        $("#backupsJqxgrid").jqxGrid('updatebounddata', 'cells');
                        $("#activeJqxgrid").jqxGrid('updatebounddata', 'cells');
                        objectFavorites = await getUserFavorites(sessionToken);
                        folderStructure = await createFolderStructure(objectFavorites, sessionToken);
                        userFavorites = objectFavorites.Datasets;

                        $('#jsreeFavorites').jstree("destroy").empty();
                        $('#jsreeFavorites').jstree({
                            "core": {
                                "data": folderStructure,
                            },
                            // "plugins" : [ "contextmenu" ]
                        }).on('loaded.jstree', async function () {
                            let treeNodes = $('#jsreeFavorites').jstree(true).get_json('#', { flat: true });
                            var node = $('#jsreeFavorites').jstree(true).get_node(treeNodes[0].id);
                            $('#jsreeFavorites').jstree(true).select_node(treeNodes[0]);

                            setTimeout(() => {
                                $('#jsreeFavorites').on("select_node.jstree", function (e, data) {
                                    sourceTreeItem = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                    var item = $('#jsreeFavorites').jstree(true).get_selected("full", true)[0];
                                    if (item.original.value.root == true) {
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', true);
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', true);
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', true);
                                        $("#btnDeleteFolder").jqxButton({ disabled: true });
                                        $("#btnRenameFolder").jqxButton({ disabled: true });
                                    } else {
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmPaste', false);
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmDeleteFolder', false);
                                        $("#jqxTreeMenu").jqxMenu('disable', 'cmRenameFolder', false);
                                        $("#btnDeleteFolder").jqxButton({ disabled: false });
                                        $("#btnRenameFolder").jqxButton({ disabled: false });
                                    }
                                });
                            }, 200);

                            $("#activeJqxgrid").jqxGrid('clearselection');
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
    call_api_ajax('GetUserDatasources', 'get', { SessionToken: sessionToken, ReturnCategoryList: true }, false, (data) => {
        data.Result.map((v) => {
            access = (v.Datasource == database) ? v : access;
        });
    });
    let category_l = (category == "undefined") ? "" : category + "/",
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

    }
    else {
        if (access.Details !== undefined) {
            if (access.Details.Subscription == "Inactive") {
                msg = "You do not have access to the datasource " + database + " or its values."
                flag_dialog = true;
            }


            else if (isDateExpired(access.Details.UserAccess.Ends, true))
                msg = "Your access to the " + database + " data source expired on " + access.Details.UserAccess.Ends + ".<br>Do you want to view this series in a new tab?"
        }
    }

    if (flag_dialog) {
        dialogWindow(msg, 'information');
    } else {
        dialogWindow(msg, 'query', 'confirm', null,
            function () {
                $('body').addClass('overlay');
                $('#loadingData').show();

                let parameters = {
                    SessionToken: sessionToken,
                    Frequency: "d",
                    Series: [{ Datasource: database, Symbol: series }],
                    ReturnMetadata: true,
                    ReturnBateStatus: true
                }
                if (category !== "undefined") parameters.Series[0].Datacategory = category;
                call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data, textStatus, XmlHttpRequest) => {
                    if (data.Result.Series[0].Metadata == undefined || data.Result.Series[0].BateStatus == undefined) {
                        let type = 'Metadata or BateStatus';
                        if (data.Result.Series[0].Metadata == undefined) type = 'Metadata';
                        else if (data.Result.Series[0].BateStatus == undefined) type = 'BateStatus';

                        dialogWindow('The server responded with "' + XmlHttpRequest.status + '" but cannot read the ' + type + ' field', 'error', null, null, null, null, { funcName: 'GetDatasetValues', parameters: parameters, data: data, type: 'post' });
                        console.warn(data);
                        return;
                    }
                    else if (data.Result.Series[0].BateStatus[0].Status > 299) {
                        dialogWindow('The server responded with "' + data.Result.Series[0].BateStatus[0].Status + '". ' + data.Result[0].BateStatus[0].Detail, 'error', null, null, null, null, { funcName: 'GetDatasetValues', parameters: parameters, data: data, type: 'post' });
                        console.warn(data);
                        return;
                    }
                    else if (data.Result.Series[0].Values == undefined) {
                        let type = 'Values';
                        dialogWindow('The server responded with "' + XmlHttpRequest.status + '" but cannot read the ' + type + ' field', 'error', null, null, null, null, { funcName: 'GetDatasetValues', parameters: parameters, data: data, type: 'post' });
                        console.warn(data);
                        return;
                    }
                    else {
                        let t = category !== "undefined" ? database + '/' + category + '/' + series : database + '/' + series;
                        sessionStorage.setItem(t, JSON.stringify(data.Result.Series[0]));
                        var win = window.open("seriesviewer?symbol=" + escape(t) + "&tab=prices", '_blank');
                        win.focus();
                    }
                }, null, () => {
                    $('#loadingData').hide();
                    $('body').removeClass('overlay');
                });
            }, null, null, { Ok: 'Ok', Cancel: 'No' }
        )
    }

}

function handleCloseFavoritesPage(link) {
    window.location.href = "profile?tab=myaccount";
}
async function handleLogout() {
    dialogWindow("Are you sure that you want to logout?", 'warning', 'confirm', null,
        () => {
            call_api_ajax('RevokeSessionToken', 'get', { SessionToken: sessionToken }, false, () => {
                localStorage["forget"] = 'password';
                window.location.href = "/";
            });
        }
    );
}

function autoresizeColumnsManually(dataAdapter, gridName) {
    var gridRecords = [];//dataAdapter.records;
    var maxCodeCharactersCount = Math.max.apply(Math, gridRecords.map(function (o) { return o.Symbol.length; }));
    var maxNameCharactersCount = Math.max.apply(Math, gridRecords.filter(s => s.name != null)
        .map(function (o) { return o.name.length; }));

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

    checkedRows.forEach(function (item, i, checkedRows) {
        var row = $('#activeJqxgrid').jqxGrid('getrowdata', item);
        rows.push(row);
    });

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var parameters = { database_code: row.Symbol, dataset_code: row.Symbol };

        $.post("/user-favourites/disactive", parameters, function (result) { }, 'json');
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
    initContent: function () {
        $('#exportSeriesBtn').jqxButton({ width: '75px', height: '30px' });
        $("#exportSeriesBtn").on('click', function () {
            exportSeries();
            $('#exportDialogWindow').jqxWindow('close');
        });

        $('#cancelExportDialog').jqxButton({ width: '75px', height: '30px' });
        $("#cancelExportDialog").on('click', function () {
            $('#exportDialogWindow').jqxWindow('close');
        });
    }
});

function makeExportSeriesDialog() {
    tab = getParameterByName('tab');

    if (tab == "mydatasources") {
        var rows = $('#gridDatasetsOfDatasource').jqxGrid('getrows'),
            record = ($('#gridDatasetsOfDatasource').jqxGrid('selectedrowindexes').length > 1) ? "records" : "record",
            msg = "Export the " + $('#gridDatasetsOfDatasource').jqxGrid('selectedrowindexes').length + " selected " + record;
    }
    else if (tab == "favorites") {
        var rows = $('#activeJqxgrid').jqxGrid('getrows'),
            record = ($('#activeJqxgrid').jqxGrid('selectedrowindexes').length > 1) ? "records" : "record",
            msg = "Export the " + $('#activeJqxgrid').jqxGrid('selectedrowindexes').length + " selected " + record;
    }
    $('#exportDialogWindow #num').text(rows.length);
    $('#exportSelectedRecordsText').text(msg);
    $('#exportDialogWindow').jqxWindow('open');
}

function exportSeries() {
    var export_type = $('input[name="export_type"]:checked').val(),
        rows,
        rowsindexes,
        id;

    switch (tab) {
        case "favorites":
            id = "activeJqxgrid"
            break;
        case "mydatasources":
            id = "gridDatasetsOfDatasource";
            break;
    }

    if (export_type == "selected")
        rowsindexes = $("#" + id).jqxGrid('getselectedrowindexes');

    else if (export_type == "all") {
        rowsindexes = $("#" + id).jqxGrid('getrows');
        rowsindexes = rowsindexes.map(v => v.uid);
    }

    var rows = [], column = $("#" + id).jqxGrid('columns').records;

    let firstRow = [];
    for (var c in column) {
        if (!column[c].hidden && column[c].datafield !== "" && column[c].datafield !== "Favorite" && column[c].datafield !== "id")
            firstRow.push(column[c].text);
    }
    rows.push(firstRow);

    for (var i = 0; i < rowsindexes.length; i++) {
        let row = $("#" + id).jqxGrid('getrowdata', rowsindexes[i]);
        let col = [];
        for (var c in column) {
            if (!column[c].hidden && column[c].datafield !== "" && column[c].datafield !== "Favorite" && column[c].datafield !== "id") {
                if (row[column[c].datafield] == undefined) row[column[c].datafield] = "";

                if (column[c].datafield == "StartDate" || column[c].datafield == "EndDate")
                    row[column[c].datafield] = new Date(row[column[c].datafield]).toISOString().split('T')[0];

                col.push(row[column[c].datafield]);
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
    rows.forEach(function (RowItem, RowIndex) {
        RowItem.forEach(function (ColItem, ColIndex) {
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

