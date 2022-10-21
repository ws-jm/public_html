function buildMap(obj) {
    let map = new Map();

    var keys = Object.keys(obj);
    keys.forEach(function (key, i, keys) {
        map.set(key, obj[key]);
    });
    return map;
}

$.jqx.theme = 'light';
$.jqx.utilities.scrollBarSize = 11;
var aliases = buildMap({
    "CRYPTO": "CRYPTO",
    "PPE": "PPE",
    "SRF": "SRF",
    "CFTC": "CFTC",
    "ENTSOE": "ENTSOE",
    "BP": "BP",
    "GDT": "GDT",
    "WFE": "WFE",
    "BOE": "BOE",
    "CME": "CME",
    "OPEC": "OPEC",
    "SCFNBY": "SCFNBY",
    "ECBFX": "ECBFX",
    "COM": "GCP",
    "GOOG": "GLOBALSTK",
    "EUREX": "EUREX",
    "YAHOO": "STOCK2",
    "CLFX": "CLFX",
    "LME": "LME",
    "CHRIS": "CONFUT",
    "JODI-OIL": "JODI-OIL",
    "NASDAQOMX": "NASDAQOMX",
    "ICE": "ICE",
    "EEX-PWR": "EEX-PWR",
    "BIS": "BIS",
    "JODI-GAS": "JODI-GAS",
    "SCF": "SCF",
    "EEX": "EEX",
    "LLOYDS": "LLOYDS",
    "NIKKEI": "NIKKEI",
    "PLATTS": "PLATTS"
}),
    theme = 'light',
    hideEmpty = true,
    search = '',
    url,
    cols,
    charts = [],
    pagingCodes = [],
    pageSize = 250,
    pageSelectedIndex = 1,
    pageCounter = 1,
    sortcolumn = "dataset_code",
    desc = false,
    isSorted = false,
    databaseImage,
    datasourceInfo,
    categories,
    leftPageButton,
    userCategory,
    CategoryDS,
    category_list,
    access = '',
    rightPageButton,
    DatasetsOfDatasourceSet,
    sessionToken = getSession(),
    databaseName = getParameterByName("Datasource"),
    userName = '',


    showAdditionalInformation = getParameterByName("info_columns") == "true" ? true : false,
    databaseCategory = databaseCategory == "" ? 'All' : databaseCategory;

document.title = databaseName + ' database';

$(document).ready(function () {

    // Get user data and check if session is not Expired
    call_api_ajax('GetMyAccountDetails', 'get', { SessionToken: sessionToken }, false, (data) => {
        userName = data.Result.Name;
        $('#username').text(userName);
    });

    call_api_ajax('GetUserDatasources', 'get', { SessionToken: sessionToken, ReturnCategoryList: true }, false, (data) => {
        data.Result.map((v) => {
            access = (v.Datasource == databaseName) ? v : access;
        });
    });

    $('#profile').attr('href', 'profile?tab=MyProfile');
    $('#favorites').attr('href', 'profilemain?tab=favorites');
    $('#logout').click(function () {
        logout();
    });

    function resizeColumns(grid_id) {
        var grid = $("#" + grid_id),
            columns = grid.jqxGrid('columns').records,
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

        if (columns !== undefined) {
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
                        if (v !== undefined && v!== null){          
                            if (typeof v !== 'boolean' && v.length > l)
                                l = v.length;
                        }
                    });

                    if (i.split('<').length == 0 && l < i.length) l = i.length;

                    var w = grid.jqxGrid('getcolumnproperty', datafield[i], 'width');

                    if (datafield[i] !== 'Description') {
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
                if (v.datafield == "Description")
                    v.width = descriptionWidth;
            });

            grid.jqxGrid({ columns: columns });
            grid.jqxGrid('refresh');
        }
    }

    function refreshPagination() {
        var rows = $('#jqxgrid').jqxGrid('getrows');
        var num = DatasetsOfDatasourceSet.SeriesCount / DatasetsOfDatasourceSet.pageSize;
        num = (parseInt(num) < num) ? parseInt(num) + 1 : parseInt(num);
        DatasetsOfDatasourceSet.label.find('input').val(DatasetsOfDatasourceSet.pageCounter).parent().find('span').text(num);
    }

    var numOfPageURL = parseInt(getParameterByName('Page'));
    numOfPageURL = !isNaN(numOfPageURL) ? numOfPageURL : 1;

    var rows = parseInt(getParameterByName('rows'));
    rows = !isNaN(rows) ? rows : 50;

    var categoryFilterURL = getParameterByName('Category'),
        filterOfURL = getParameterByName('Filter');
    $("#searchBox").val(filterOfURL);

    let filterURL = (filterOfURL !== "" && filterOfURL !== "undefined" && filterOfURL !== undefined) ? "&Filter=" + filterOfURL : "";
    let categoryURL = (categoryFilterURL !== "") ? "&Category=" + categoryFilterURL : "";
    
    window.history.pushState('mydsviewer', 'mydsviewer', 'mydsviewer?Datasource=' + databaseName + '&Page=' + numOfPageURL + categoryURL + '&rows=' + rows + filterURL);

    DatasetsOfDatasourceSet = {
        pageSelectedIndex: 0,
        pageCounter: numOfPageURL,
        pageSize: getParameterByName('rows'),
        pagesCount: -1,
        Request: {
            Datasource: databaseName,
            SessionToken: sessionToken,
            CaseSensitive: false,
            Rows: getParameterByName('rows'),
            Page: numOfPageURL,
            ShortRecord: false,
            IgnoreEmpty: true
            //            ReturnCategoryList: true
        },

        source: {
            datatype: "json",
            sort: function (column, ascending) {
                switch (column) {
                    case "Symbol":
                    case "CategoryName":
                    case "Description":
                        if (ascending == null) {
                            column = "CategoryName";
                            ascending = true;
                        }
                        break;
                    default: return;
                }
                $('#jqxgrid').jqxGrid('showloadelement');
                DatasetsOfDatasourceSet.Request.SortColumns = column;
                let seq;
                if (DatasetsOfDatasourceSet.Request.SortOrder == 'desc') seq = 'asc';
                else seq = 'desc';
                DatasetsOfDatasourceSet.Request.SortOrder = seq;

                if (DatasetsOfDatasourceSet.Request.Filter == "") delete DatasetsOfDatasourceSet.Request.Filter;

                call_api_ajax('GetDatasourceMetadata', 'get', DatasetsOfDatasourceSet.Request, true,
                    (data) => {
                        DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;
                        DatasetsOfDatasourceSet.Request.SortColumns = data.Result.Metadata.SortColumns;
                        $("#jqxgrid").jqxGrid('updatebounddata', 'sort');
                    }, null, () => {
                        $("#jqxgrid").jqxGrid('hideloadelement');
                    });
            },
            datafields: [
                { name: 'Datacategory', type: 'string' },
                { name: 'Symbol', type: 'string' },
                { name: 'Favorite', type: 'boolean' },
                { name: 'Name', type: 'string' },
                { name: 'Frequency', type: 'string' },
                { name: 'Values', type: 'int' },
                { name: 'StartDate', type: 'date' },
                { name: 'EndDate', type: 'date' },
                { name: 'Currency', type: 'string' },
                { name: 'Unit', type: 'string' },
                { name: 'Conversions', type: 'string'},
                { name: 'Additional', type: 'string' },
                { name: 'Decimals', type: 'int' }
            ],
            localdata: []
        }
    };

    if (DatasetsOfDatasourceSet.pageSize == '' || ![50, 100, 250, 500].includes(parseInt(DatasetsOfDatasourceSet.pageSize))) {
        DatasetsOfDatasourceSet.pageSize = 50;
        DatasetsOfDatasourceSet.Request.Rows = 50;
    }

    if (categoryURL !== "")
        DatasetsOfDatasourceSet.Request.CategoryFilter = categoryFilterURL;

    if (filterURL !== "")
        DatasetsOfDatasourceSet.Request.Filter = filterOfURL

    if (DatasetsOfDatasourceSet.Request.Filter == "") delete DatasetsOfDatasourceSet.Request.Filter;

    function getDatasource(datasource, sessionToken) {
        return fetch(`${API}GetDatasource?SessionToken=${sessionToken}&Datasource=${datasource}&ReturnAccess=true`)
    }

    // call_api_ajax('GetDatasourceMetadata', 'get', DatasetsOfDatasourceSet.Request, false,
    //     (data) => {
    //         console.log(data);
    //         // userCategory = data.Result.Metadata.UserCategoryList;
    //         // categories = data.Result.Metadata.CategoryTree;
    //         // category_list = data.Result.Metadata.CategoryList;
    //         DatasetsOfDatasourceSet.SeriesCount = data.Result.Metadata.Datasets;
    //         DatasetsOfDatasourceSet.pagesCount = data.Result.Metadata.PagesCount;
    //         DatasetsOfDatasourceSet.pageCounter = data.Result.Metadata.Page;
    //         DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;
    //         //        DatasetsOfDatasourceSet.Request.ReturnCategoryList = false;
    //     });

    DatasetsOfDatasourceSet.Request.ReturnAccess = true;
    // DatasetsOfDatasourceSet.Request.Filter = "PCAA";
    call_api_ajax('GetDatasets', 'get', DatasetsOfDatasourceSet.Request, false,
        (data) => {
            DatasetsOfDatasourceSet.SeriesCount = data.Result.Metadata.Datasets;
            DatasetsOfDatasourceSet.pagesCount = data.Result.Metadata.PagesCount;
            DatasetsOfDatasourceSet.pageCounter = data.Result.Metadata.Page;
            for (var i in data.Result.Datasets) {
                if(data.Result.Datasets[i].Additional != undefined)
                    data.Result.Datasets[i].Conversions = data.Result.Datasets[i].Additional.Conversions[0].ConvertTo + " " + data.Result.Datasets[i].Additional.Conversions[0].ConvertOperator + data.Result.Datasets[i].Additional.Conversions[0].ConvertValue
            }
            DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;

        });

    call_api_ajax('GetAllDatasources', 'get', { SessionToken: sessionToken, ReturnCategoryList: true, ReturnCategoryTree: true, ReturnUserCategoryList: true }, false,
        (data) => {
            for (var i in data.Result) {
                if (data.Result[i].Datasource == databaseName) {
                    CategoryDS = data.Result[i].CategoryDS;
                    //                databaseImage = data.Result[i].Icon;
                    //console.log(data.Result[i]);
                    databaseImage = data.Result[i].Logo;
                    $('#database-name').html('<img id="databaseRenderImg" src="' + databaseImage + '">' + data.Result[i].Name + ' (' + databaseName + ')');
                    //return;
                }

                if (databaseName == "PLATTS" && data.Result[i].Datasource == databaseName) {
                    datasourceInfo = data.Result[i].DetailsDS;
                    categories = data.Result[i].DetailsDS.CategoryTree;
                    category_list = data.Result[i].DetailsDS.CategoryList;
                    userCategory = data.Result[i].DetailsDS.UserCategoryList;
                }
            }
        });


    DatasetsOfDatasourceSet.dataAdapter = new $.jqx.dataAdapter(DatasetsOfDatasourceSet.source);

    var arrangeData = function ( array, type, datasourceInfo = [] ){
        if (type === "Tree") {
            for ( let i in array ){
                if ( array[i].Group !== undefined ) {
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
                    array[i].children = arrangeData( items, "Tree", datasourceInfo );
                } else {
                    if ( array[i].access ) {
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

    var getSpecificData = function ( userRecords, treeRecords, level )
    {
        let array = []
        if (level === 1) { 
            treeRecords.map(( t ) => {
                userRecords.map(( u ) => {
                    let value = u.text[2] === " " ? u.text.slice(0,2) : u.text.slice(0,3);
                    if ( t.items === undefined && t.value === value ) {
                        array.push( t );
                    } else {
                        let all = []
                        if (t.value !== undefined)
                            all = t.value.split(',');

                        if ( all.indexOf( value ) !== -1 )
                        {
                            let items = getSpecificData( userRecords, t.items, 2 );
                            if ( items.length > 0 )
                            {
                                t.items = items;
                                let exists = false;
                                array.map((v) => {
                                    if ( v.value == t.value )
                                        exists = true;
                                });
                                
                                if ( !exists )
                                    array.push( t );
                            }
                        }
                    }
                });
            });
        } else if (level === 2) {
            treeRecords.map(( t ) => {
                userRecords.map(( u ) => {
                    let value = u.text[2] === " " ? u.text.slice(0,2) : u.text.slice(0,3);
                    if ( t.items === undefined && t.value === value ) {
                        array.push( t );
                    } else {
                        let all = []
                        if (t.value !== undefined)
                            all = t.value.split(',');

                        if ( all.indexOf( value ) !== -1 )
                        {
                            let items = getSpecificData( t.items, userRecords, 3 );
                            if ( items.length > 0 )
                            {
                                t.items = items;
                                let exists = false;
                                array.map((v) => {
                                    if ( v.value == t.value )
                                        exists = true;
                                });
                                
                                if ( !exists )
                                    array.push( t );
                            }
                        }
                    }
                });
            });
        } else {
            treeRecords.map(( t ) => {
                userRecords.map(( u ) => {
                    let value = u.text[2] === " " ? u.text.slice(0,2) : u.text.slice(0,3);
                    if ( t.items === undefined && t.value === value ) {
                        array.push( t );
                    } else {
                        let all = []
                        if (t.value !== undefined)
                            all = t.value.split(',');

                        if ( all.indexOf( value ) !== -1 )
                        {
                            let items = getSpecificData( t.items, userRecords );
                            if ( items.length > 0 )
                            {
                                t.items = items;
                                let exists = false;
                                array.map((v) => {
                                    if ( v.value == t.value )
                                        exists = true;
                                });
                                
                                if ( !exists )
                                    array.push( t );
                            }
                        }
                    }
                });
            });
        }
        
        return array;
    };

    // getDatasource(DatasetsOfDatasourceSet.Request.Datasource, DatasetsOfDatasourceSet.Request.SessionToken)
    // .then(res => res.json())
    // .then(result => {
    //     categories = result.Result.DetailsDS.CategoryTree;
    //     category_list = result.Result.DetailsDS.CategoryList;
    //alert(JSON.stringify(DatasetsOfDatasourceSet.Request));

    // call_api_ajax('GetDatasource', 'post', { SessionToken: sessionToken, Datasource: "PLATTS" }, false,
    // ( data ) => {
    //     alert(JSON.stringify(data));
    //         for ( var i in data.Result )
    //         {
    //             if ( data.Result[i].Datasource == databaseName ) {
    //                 CategoryDS =  data.Result[i].CategoryDS;
    // //                databaseImage = data.Result[i].Icon;
    // console.log(data.Result[i]);
    //                 databaseImage = data.Result[i].Logo;
    //                 $('#database-name').html('<img id="databaseRenderImg" src="' + databaseImage + '">' + data.Result[i].Name + ' (' + databaseName + ')' );
    //                 return;
    //             }
    //         }
    // });

    // TODO ONE
    function compareAccess(elem) {
        for (e of datasourceInfo.UserCategoryList) {
            if(elem === e.Name) {
                return true
            }
        }
        return false
    }

    function accessIcon() {
        let list = categories;
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
        let list = category_list;
        for(let j in list) {
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

    var treeRecords = arrangeData(categories, "Tree", datasourceInfo);
    var listRecords = arrangeData(category_list, "List");

    var treeElements = [];
    for (let i in treeRecords) {
        treeElements.push(treeRecords[i]);
        if(treeRecords[i].children != null){
            for (let j in treeRecords[i].children) {
                treeElements.push(treeRecords[i].children[j]);
                if(treeRecords[i].children[j].children != null){
                    for (let k in treeRecords[i].children[j].children) {
                        treeElements.push(treeRecords[i].children[j].children[k]);
                    }
                }
            }
        }
    }

    // if(treeRecords != undefined || listRecords != undefined)
    $('#mainSplitter').jqxSplitter({ width: '100%', height: '100%', panels: [{ size: "22%", collapsible: true, collapsed: false }, { size: '78%', collapsible: false }] });
    $('#mainSplitter').jqxSplitter({ showSplitBar: true });
    //$('#mainSplitter').jqxSplitter('expand');
    if (CategoryDS || treeRecords != undefined) {

        //        $('#mainSplitter').jqxSplitter({ width: '100%', height: '100%', panels: [{ size: "22%" }, { size: '78%', collapsible: false }] });
        if (category_list !== undefined) {
            var userRecords = arrangeData(userCategory, "UserList");
            $('#jqxTabs').jqxTabs({ width: '100%', height: 'calc( 100% - 33.99px )' });
            // $('#userCategory').show();
            $('#userCategoryCheckbox').jqxCheckBox({ checked: false });

            $('#toggleCaptionTabTree').on('click', function (event)
            {
                $('#userCategory').hide();
            });

            $('#toggleCaptionTab').on('click', function (event)
            {
                $('#userCategory').show();
            });

            $('#userCategoryCheckbox').on('change', function (event) {
                if ( event.args.checked ) {
                    $('#toggleCaptionTab .jqx-tabs-titleContentWrapper').text('My Categories');
                    $('#jstreeCategoriesList').jstree("destroy").empty(); 
                    $('#jstreeCategoriesList').jstree({
                        "core" : {
                            "data" : userRecords,
                            "multiple" : false,
                            "animation" : 1
                        },
                        // "plugins" : [ "wholerow", "checkbox" ]
                    });
                }
                else {
                    $('#toggleCaptionTab .jqx-tabs-titleContentWrapper').text('Categories');
                    $('#jstreeCategoriesList').jstree("destroy").empty();
                    $('#jstreeCategoriesList').jstree({
                        "core" : {
                            "data" : listRecords,
                            "multiple" : false,
                            "animation" : 0
                        },
                        // "plugins" : [ "wholerow", "checkbox" ]
                    });

                    $('#jstreeCategoriesList').on('loaded.jstree', function(){
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
            });
        }
        else $('#jqxTabs').jqxTabs({ width: '100%', height: '100%' });
    }
    else {
        $('#mainSplitter').jqxSplitter({ width: '100%', height: '100%', showSplitBar: false, panels: [{ size: "0%" }, { size: "100%" }] });
        $('#jqxTabs').jqxTabs({ width: '100%', height: '100%' });
    }

    if (treeRecords) {
        
        $('#jstreeCategoriesTree').jstree({
            "core" : {
                "data" : treeRecords,
            },
            // "plugins" : [ "contextmenu" ]
        });

        $('#jstreeCategoriesTree').on('open_node.jstree', function(a, b, c){
            let treeItems = $('#jstreeCategoriesTree').jstree(true).get_json('#', { flat: true });
            for (let j in treeItems) {
                let splitted = treeItems[j].text.split("[")
                let element = document.getElementById(treeItems[j].id);
                if (splitted.length > 1) {
                    let subnode = splitted[1].replace("]", "")
                    if(subnode !== "All Categories") {
                        for (let k in userRecords) {
                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0,2) : userRecords[k].text.slice(0,3);
                            if (subnode !== available_category && element != null) {
                                //element.style.color = "#aaa" 
                                element.children[1].style.color = "#aaa";
                            }
                        } 
                    }                                
                } else {
                    if (element != null && element.children[1]){
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
                    if(subnode !== "All Categories") {
                        for (let k in userRecords) {
                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0,2) : userRecords[k].text.slice(0,3);
                            if (element != null && subnode === available_category) {
                                element.children[0].style.color = "black";
                            }
                        }                                    
                    }                                
                }
            }
        });

        $('#jstreeCategoriesTree').on('activate_node.jstree', function (e, item)
        {
            if (item.node.children.length == 0) {
                // $("#jqxCategoriesList").jqxTree('selectItem', null);
                if ( item.node.original.value !== null){
                    var databaseCategory = item.node.original.value;

                    DatasetsOfDatasourceSet.Request.Filter = encodeURIComponent($("#searchBox").val());
                    DatasetsOfDatasourceSet.Request.CategoryFilter = databaseCategory;
                    DatasetsOfDatasourceSet.Request.Page = 1;

                    $('#jqxgrid').jqxGrid('showloadelement');

                    let filter = DatasetsOfDatasourceSet.Request.Filter;
                    filter = (filter !== "") ? "&Filter=" + filter : "";

                    if (DatasetsOfDatasourceSet.Request.Filter == "") delete DatasetsOfDatasourceSet.Request.Filter;

                    call_api_ajax('GetDatasourceMetadata', 'get', DatasetsOfDatasourceSet.Request, true,
                        (data) => {
                            DatasetsOfDatasourceSet.SeriesCount = data.Result.Metadata.Datasets;
                            DatasetsOfDatasourceSet.pagesCount = data.Result.Metadata.PagesCount;
                            DatasetsOfDatasourceSet.pageCounter = data.Result.Metadata.Page;
                            DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;
                            DatasetsOfDatasourceSet.Request.Rows = data.Result.Metadata.Rows;

                            for (var i in data.Result.Datasets) {
                                if(data.Result.Datasets[i].Additional != undefined)
                                    data.Result.Datasets[i].Conversions = data.Result.Datasets[i].Additional.Conversions[0].ConvertTo + " " + data.Result.Datasets[i].Additional.Conversions[0].ConvertOperator + data.Result.Datasets[i].Additional.Conversions[0].ConvertValue
                            }

                            $("#jqxgrid").jqxGrid({ source: DatasetsOfDatasourceSet.dataAdapter });
                            refreshPagination();
                            $("#jqxgrid").jqxGrid('updatebounddata');
                            resizeColumns('jqxgrid');

                            let categoryURL = (DatasetsOfDatasourceSet.Request.CategoryFilter !== undefined) ? "&Category=" + DatasetsOfDatasourceSet.Request.CategoryFilter : "";
                            window.history.pushState('mydsviewer', 'mydsviewer', 'mydsviewer?Datasource=' + databaseName + '&Page=' + DatasetsOfDatasourceSet.pageCounter + categoryURL + '&rows=' + DatasetsOfDatasourceSet.Request.Rows);

                        }, null, () => {
                            $('#jqxgrid').jqxGrid('hideloadelement');
                        });
                }
                else {
                    $('#jqxgrid').jqxGrid('clear');
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
        var clickedItem = null;

        var attachCategoriesContextMenu = function () {
            document.getElementById("jqxCategoriesMenu").style.visibility = "visible";

            $("#jstreeCategoriesTree").bind('contextmenu', function(e){
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

        $("#jqxCategoriesMenu").on('itemclick', function (event)
        {
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

        $('#jstreeCategoriesTree').on('loaded.jstree', function(){
            let treeItems = $('#jstreeCategoriesTree').jstree(true).get_json('#', { flat: true });
            // document.getElementById(treeItems[0].id).children[0].style.width="5px";
            for (let j in treeItems) {
                let splitted = treeItems[j].text.split("[")
                let element = document.getElementById(treeItems[j].id);
                if (splitted.length > 1) {
                    let subnode = splitted[1].replace("]", "")
                    if(subnode !== "All Categories") {
                        for (let k in userRecords) {
                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0,2) : userRecords[k].text.slice(0,3);
                            if (subnode !== available_category && element != null) {
                                //element.style.color = "#aaa" 
                                element.children[1].style.color = "#aaa";
                            }
                        } 
                    }                                
                } else {
                    if (element != null && element.children[1]){
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
                    if(subnode !== "All Categories") {
                        for (let k in userRecords) {
                            let available_category = userRecords[k].text[2] === " " ? userRecords[k].text.slice(0,2) : userRecords[k].text.slice(0,3);
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
        $('#jstreeCategoriesList').jstree({
            "core" : {
                "data" : listRecords,
                "multiple" : false,
                "animation" : 0
            },
            // "plugins" : [ "wholerow", "checkbox" ]
        });

        $('#jstreeCategoriesList').on('activate_node.jstree', function (e, item)
        {
            // $("#jstreeCategoriesTree").jqxTree('selectItem', null);
            if ( item.node.text !== null && item.node.text !== "" ){
                var databaseCategory = item.value;

                DatasetsOfDatasourceSet.Request.Filter = encodeURIComponent($("#searchBox").val());
                DatasetsOfDatasourceSet.Request.CategoryFilter = databaseCategory;
                DatasetsOfDatasourceSet.Request.Page = 1;

                $('#jqxgrid').jqxGrid('showloadelement');

                let filter = DatasetsOfDatasourceSet.Request.Filter;
                filter = (filter !== "") ? "&Filter=" + filter : "";

                if (DatasetsOfDatasourceSet.Request.Filter == "") delete DatasetsOfDatasourceSet.Request.Filter;

                call_api_ajax('GetDatasourceMetadata', 'get', DatasetsOfDatasourceSet.Request, true,
                    (data) => {
                        DatasetsOfDatasourceSet.SeriesCount = data.Result.Metadata.Datasets;
                        DatasetsOfDatasourceSet.pagesCount = data.Result.Metadata.PagesCount;
                        DatasetsOfDatasourceSet.pageCounter = data.Result.Metadata.Page;
                        DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;
                        DatasetsOfDatasourceSet.Request.Rows = data.Result.Metadata.Rows;

                        $("#jqxgrid").jqxGrid({ source: DatasetsOfDatasourceSet.dataAdapter });
                        refreshPagination();
                        $("#jqxgrid").jqxGrid('updatebounddata');
                        resizeColumns('jqxgrid');

                        let categoryURL = (DatasetsOfDatasourceSet.Request.CategoryFilter !== undefined) ? "&Category=" + DatasetsOfDatasourceSet.Request.CategoryFilter : "";
                        window.history.pushState('mydsviewer', 'mydsviewer', 'mydsviewer?Datasource=' + databaseName + '&Page=' + DatasetsOfDatasourceSet.pageCounter + categoryURL + '&rows=' + DatasetsOfDatasourceSet.Request.Rows);

                    }, null, () => {
                        $('#jqxgrid').jqxGrid('hideloadelement');
                    });
            }
            else {
                $('#jqxgrid').jqxGrid('clear');
            }

            var item = $('#jstreeCategoriesList').jstree(true).get_selected("full", true)[0];
            if(item)
                document.getElementById(item.id).children[1].style.color = "white";

            let listItems = $('#jstreeCategoriesList').jstree(true).get_json('#', { flat: true });
            for (let j in listItems) {
                if(listItems[j].id == item.id)
                    continue;
                document.getElementById(listItems[j].id).children[0].style.width="5px";
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
                if(listItems[j].id == item.id)
                    continue;
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

        var attachCategoriesContextMenu = function () {
            document.getElementById("jqxCategoriesMenu").style.visibility = "visible";

            // open the context menu when the user presses the mouse right button.
            $("#jstreeCategoriesList").bind('contextmenu', function(e){
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

        $("#jqxCategoriesMenu").on('itemclick', function (event)
        {
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

        $('#jstreeCategoriesList').on('loaded.jstree', function(){
            let listItems = $('#jstreeCategoriesList').jstree(true).get_json('#', { flat: true });
            for (let j in listItems) {
                document.getElementById(listItems[j].id).children[0].style.width="5px";
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

    if (!listRecords && !treeRecords) {
        // $('#mainSplitter').jqxSplitter('collapse');
    }
    /* End Categories Tree */
    // })
    // .catch(e => console.warn("Error in GetDatasource Call: ", e))

    async function updateDatasetsOfDatasourceGrid(updatepages = 'all', updatetype = true, resizecolumns = true) {
        $('#jqxgrid').jqxGrid('showloadelement');

        let filter = DatasetsOfDatasourceSet.Request.Filter;
        filter = (filter !== "" && filter !== "undefined" && filter !== undefined) ? "&Filter=" + filter : "";
        let categoryF = getParameterByName('Category');
        categoryF = (categoryF !== "") ? "&Category=" + categoryF : "";
        
        if (DatasetsOfDatasourceSet.Request.Filter == "") delete DatasetsOfDatasourceSet.Request.Filter;
        
        call_api_ajax('GetDatasourceMetadata', 'get', DatasetsOfDatasourceSet.Request, true,
            (data) => {
                DatasetsOfDatasourceSet.SeriesCount = data.Result.Metadata.Datasets;
                DatasetsOfDatasourceSet.pagesCount = data.Result.Metadata.PagesCount;
                DatasetsOfDatasourceSet.pageCounter = data.Result.Metadata.Page;
                DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;
                DatasetsOfDatasourceSet.Request.Rows = (data.Result.Metadata.Rows < 50) ? 50 : data.Result.Metadata.Rows;

                $("#jqxgrid").jqxGrid({ pagesize: DatasetsOfDatasourceSet.Request.Rows });
                $("#jqxgrid").jqxGrid('updatebounddata', updatetype);

                if (updatepages == true) refreshPagination();
                window.history.pushState('mydsviewer', 'mydsviewer', 'mydsviewer?Datasource=' + databaseName + '&Page=' + DatasetsOfDatasourceSet.pageCounter + filter + categoryF + '&rows=' + DatasetsOfDatasourceSet.Request.Rows);

                $('#jqxgrid').jqxGrid('hideloadelement');
                refreshPagination();
                resizeColumns('jqxgrid');
            });
    }

    var imagerenderer = function (row, datafield, value) {
        if (value)
            return '<div><img id="seriesStartIcon" ' +
                ' height="17" width="17" ' +
                'src="resources/css/icons/star_icon.png"/></div>';
        else
            return '';
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

        var singleCase = rows.length == 1 ? "has" : "have";
        functionNotificationMessage({ text: rows.length - 1 + " series " + singleCase + " been copied to the clipboard" });
    }

    function removeSeriesFromFavorites() {
        dialogWindow("Remove all selected series from your Favorites list?", "query", "confirm", null, () => {

            var rowsindexes = $("#jqxgrid").jqxGrid('getselectedrowindexes');
            rowsindexes.sort(function (a, b) { return a - b; });

            var deleted = [], deleted_symbol = [];
            for (var i = 0; i < rowsindexes.length; i++) {
                var row = $("#jqxgrid").jqxGrid('getrowdata', rowsindexes[i]);

                if (row.Favorite) {
                    if (row.Datacategory !== undefined)
                        deleted.push(databaseName + '/' + row.Datacategory + '/' + row.Symbol);
                    else
                        deleted.push(databaseName + '/' + row.Symbol);

                    deleted_symbol.push(row.Symbol);
                }
            }

            call_api_ajax('RemoveUserFavoriteDatasets', 'get', { SessionToken: sessionToken, "Series[]": deleted }, true, async () => {
                var rows = $("#jqxgrid").jqxGrid('getrows');
                rows = rows.map((v, i) => {
                    deleted_symbol.map((e) => {
                        if (e == v.Symbol && v.Favorite == true) {
                            $("#jqxgrid").jqxGrid('setcellvalue', i, "Favorite", false);
                        }
                    });
                });

                var singleCase = deleted_symbol.length == 1 ? " has" : "s have";
                functionNotificationMessage({ text: deleted_symbol.length + ' symbol' + singleCase + ' been removed from favorites list', type: "info" });
            });
        });
    }

    var cellclassCorrections = function (row, columnfield, value, rowdata) {
        if (value > 0)
            return 'correction-cell';

        return;
    }

    var symbol_renderer = function (row, datafield, value, html, columnproperties, record) {
        return '<div class="jqx-grid-cell-left-align" id="vCenter" ><a target="_blank" onclick="openSeriesInNewTab(\'' + databaseName + '\',\'' + value + '\',\'' + record.Datacategory + '\');">' + value + '</a></div>';
    }

    var additional_renderer = function (row, datafield, value, html, columnproperties, record) {
        var txt = JSON.stringify(value);
        // $(".popup-content").html( txt )
        if(value != "")
            var showVal = 'View Object';
        else
            var showVal = '';

        setCookie('additionalJSON'+row, txt);
        
        return '<div class="jqx-grid-cell-left-align" id="vCenter" ><a target="_blank" onclick="JqxPopup('+row+', \''+record.Symbol+'\');">' + showVal + '</a></div>';
    }

    //removes the "active" class to .popup and .popup-content when the "Close" button is clicked 
    $(".close, .popup-overlay").on("click", function() {
        $(".popup-overlay, .popup-content").removeClass("active");
    });


    var columns = [
        {
            text: '#', sortable: false, filterable: false, editable: false, cellsalign: 'right', align: 'right',
            groupable: false, draggable: false, resizable: false,
            datafield: '', columntype: 'number', width: 50,
            cellsrenderer: function (row, column, value) {
                return "<div id='pageRender' align='right'>" + (value + 1 + (pageCounter - 1) * pageSize) + "</div>";
            }
        },
        { text: '<img height="18" width="18" src="resources/css/icons/StarGrey.ico">', sortable: false, minwidth: 32, width: 32, datafield: 'Favorite', cellsalign: 'center', filterable: false, align: 'center', cellsrenderer: imagerenderer }
    ];

    columns.push(
        { text: 'Symbol', groupable: false, datafield: 'Symbol', cellsalign: 'center', align: 'center', width: 100, cellsrenderer: symbol_renderer },
        { text: 'Description', groupable: false, datafield: 'Name', cellsalign: 'left', align: 'left', width: 300 },
        { text: 'Frequency', groupable: false, datafield: 'Frequency', cellsalign: 'left', align: 'left', width: 80 },
        { text: 'From', groupable: false, datafield: 'StartDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'left', align: 'left', width: 80 },
        { text: 'To', groupable: false, datafield: 'EndDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'left', align: 'left', width: 80 },
        { text: '# Prices', groupable: false, datafield: 'Values', filtertype: 'number', cellsalign: 'right', align: 'center', width: 80 },
        { text: 'Currency', datafield: 'Currency', sortable: false, cellsalign: 'left', align: 'center', width: 75, hidden: true },
        { text: 'Decimals', datafield: 'Decimals', sortable: false, cellsalign: 'right', align: 'center', width: 65, hidden: true },
        { text: 'Unit', datafield: 'Unit', sortable: false, cellsalign: 'left', align: 'center', width: 50, hidden: true },
        { text: 'Conversions', datafield: 'Conversions', sortable: false, cellsalign: 'left', align: 'center', width: 50, hidden: true },
        { text: 'Additional', datafield: 'Additional', sortable: false, cellsalign: 'left', align: 'center', width: 150, hidden: true, cellsrenderer: additional_renderer }
    );

    if (CategoryDS)
        columns.splice(3, 0, { text: 'Category', groupable: false, datafield: 'Datacategory', cellsalign: 'left', align: 'center', width: 80 })

    console.log(DatasetsOfDatasourceSet.source.localdata);

    // initialize jqxGrid
    $("#jqxgrid").jqxGrid(
        {
            width: '100%',
            height: '100%',
            source: DatasetsOfDatasourceSet.dataAdapter,
            columnsresize: true,
            sortable: true,
            rowsheight: 30,
            columnsheight: 30,
            showtoolbar: true,
            pageable: true,
            enablebrowserselection: true,
            pagesize: pageSize,
            selectionmode: 'multiplerowsadvanced',
            deferreddatafields: ['name'],
            ready: function () {
                if (getCookie('btnHideAdditInfo') != undefined && getCookie('btnHideAdditInfo') == "true") {
                    showAdditInfo();

                    showAdditionalInformation = true;
                }
                else {
                    hideAdditInfo();
                    showAdditionalInformation = false;
                }
                resizeColumns('jqxgrid');
            },
            rendered: function () {

            },
            toolbarheight: 37,
            handlekeyboardnavigation: function (event) {
                var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
                var ctrlKey = event.ctrlKey;

                var position = $('#jqxgrid').jqxGrid('scrollposition');
                var left = position.left;
                var top = position.top;
                var val = ctrlKey == true ? 50000 : 40;

                switch (key) {
                    case 37: // left
                        $('#jqxgrid').jqxGrid('scrolloffset', top, left - val);
                        return true;
                    case 38: // up
                        $('#jqxgrid').jqxGrid('scrolloffset', top - val, left);
                        return true;
                    case 36: // up Home
                        $('#jqxgrid').jqxGrid('scrolloffset', top - val, left);
                        if (ctrlKey) {
                            $('#jqxgrid').jqxGrid('clearselection');
                            $('#jqxgrid').jqxGrid('selectrow', 0);
                        }
                        return true;
                    case 39: // right
                        $('#jqxgrid').jqxGrid('scrolloffset', top, left + val);
                        return true;
                    case 40: // down
                        $('#jqxgrid').jqxGrid('scrolloffset', top + val, left);
                        return true;
                    case 35: // down End
                        $('#jqxgrid').jqxGrid('scrolloffset', top + val, left);
                        if (ctrlKey) {
                            $('#jqxgrid').jqxGrid('clearselection');
                            var rows = $('#jqxgrid').jqxGrid('getrows');
                            $('#jqxgrid').jqxGrid('selectrow', rows.length - 1);
                        }
                        return true;
                }
            },
            rendertoolbar: function (toolbar) {
                var container = $("<div id='table-container'></div>");
                toolbar.append(container);

                var toolbarContent = '<table class="toolbar-table" id="table-container-toolbar"><tr>' +
                    '<td><input id="btnCopySeriesToFavorite" type="button" value="Add to Favorites" /></td>' +
                    '<td><input id="btnExportSeries" type="button" /></td>' +
                    '<td><input id="btnRefreshSeries" type="button" /></td>' +
                    '<td align="right" id="showEmptyBtn"><input id="btnAutosize" type="button"/></td>' +
                    '<td align="right"><input id="btnHideAdditInfo" type="button" /></td>' +
                    '<td align="right"><input id="btnHideShowEmptyRecords" type="button" /></td>' +
                    '<td><input class="fullWidthPage" id="fullWidth1"/></td>' +
                    '</tr></table>';

                container.append(toolbarContent);

                // var fullWidthFlag = getCookie('fullWidth1') == "undefined" ? true : getCookie('fullWidth1') == "true" ? true : false;
                var fullWidthFlag = true;
                let img = (!fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                let footer_width = (!fullWidthFlag) ? '100%' : '1230px';

                $("#main-footer").width(footer_width);
                $(".fullWidthPage").jqxButton({ imgSrc: "resources/css/icons/" + img + ".png", imgPosition: "left", width: '26', textPosition: "right" });
                $(".fixpage").toggleClass('fullscreen', !fullWidthFlag);
                $("section .wrap").toggleClass('fullscreen', !fullWidthFlag);
                resizeColumns('jqxgrid');

                // Define buttons
                $("#btnCopySeriesToFavorite").jqxButton({ imgSrc: "resources/css/icons/starAdd16.png", imgPosition: "left", width: 125, height: 25, textPosition: "right" });
                $("#btnExportSeries").jqxButton({ imgSrc: "resources/css/icons/filesave.png", imgPosition: "left", width: 27, height: 25 });
                $("#btnRefreshSeries").jqxButton({ imgSrc: "resources/css/icons/reload.png", imgPosition: "left", width: 27, height: 25 });
                $("#btnAutosize").jqxButton({ imgSrc: "resources/css/icons/autosize.png", imgPosition: "center", width: 30 });
                $("#btnHideAdditInfo").jqxToggleButton({ imgSrc: "resources/css/icons/table_plus.png", imgPosition: "center", width: 25, height: 25 });
                $("#btnHideShowEmptyRecords").jqxToggleButton({ imgSrc: "resources/css/icons/ShowRows2_16.png", imgPosition: "center", width: 25, height: 25 });

                $("#fullWidth1").on('click', function () {
                    img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
                    footer_width = (fullWidthFlag) ? '100%' : '1230px';
                    $("#main-footer").width(footer_width);
                    $(".fullWidthPage").jqxButton({ imgSrc: "resources/css/icons/" + img + ".png", imgPosition: "left", width: '26', textPosition: "right" });
                    $(".fixpage").toggleClass('fullscreen', fullWidthFlag);
                    $("section .wrap").toggleClass('fullscreen', fullWidthFlag);
                    resizeColumns('jqxgrid');

                    fullWidthFlag = !fullWidthFlag;
                    setCookie('fullWidth1', fullWidthFlag);
                    window.dispatchEvent(new Event('resize'));
                });

                $("#searchBox").jqxInput({ placeHolder: "Enter filter text", height: 25, width: 300, minLength: 1 });
                $(".HelpMessage").eq(0).jqxPopover({ offset: { left: -50, top: 0 }, arrowOffsetValue: 50, title: "Search Filter Help", showCloseButton: true, selector: $("#helpIcon2") });

                // Events
                $('#searchBox').keypress(async function (e) {
                    if (e.which == 13) {
                        var filter = $("#searchBox").val();
                        if (DatasetsOfDatasourceSet.Request.Filter != filter) {
                            DatasetsOfDatasourceSet.Request.Filter = filter;
                            updateDatasetsOfDatasourceGrid();
                        }
                    }
                });

                $("#searchBtn").click(function(evt) 
                {
                    var filter = $("#searchBox").val();
                    if (DatasetsOfDatasourceSet.Request.Filter != filter) {
                        DatasetsOfDatasourceSet.Request.Filter = filter;
                        updateDatasetsOfDatasourceGrid(true, 'sort');
                    }
                });

                // $("#searchBox").bind("input", function () {
                //     if (window.event && event.type == "propertychange" && event.propertyName != "value") return;

                //     var filter = $("#searchBox").val();
                //     if (DatasetsOfDatasourceSet.Request.Filter != filter) {
                //         DatasetsOfDatasourceSet.Request.Filter = filter;
                //         updateDatasetsOfDatasourceGrid(true, 'sort');
                //     }
                // });

                // Eventes
                $("#btnExportSeries").on('click', function () {
                    makeExportSeriesDialog();
                });
                $("#btnRefreshSeries").on('click', function () {
                    updateDatasetsOfDatasourceGrid();
                });

                $("#btnCopySeriesToCategory").on('click', function () {
                    makeAndFillCategotyWindow();
                });

                $("#btnCopySeriesToFavorite").on('click', function () {
                    copySeriesToFavorite();
                });

                $("#btnAutosize").on('click', function () {
                    resizeColumns('jqxgrid');
                });

                $("#fullWidth1").jqxTooltip({ content: 'Toggle grid to full screen width', position: 'mouse', name: 'movieTooltip' });
                $("#btnAutosize").jqxTooltip({ content: 'Autosize columns', position: 'mouse', name: 'movieTooltip' });
                $("#btnHideAdditInfo").jqxTooltip({ content: 'Show additional data columns', position: 'mouse', name: 'movieTooltip' });
                $("#btnHideShowEmptyRecords").jqxTooltip({ content: 'Show records with no values', position: 'mouse', name: 'movieTooltip' });
                $("#btnRefreshSeries").jqxTooltip({ content: 'Refresh the metadata in the table', position: 'mouse', name: 'movieTooltip' });
                $("#btnExportSeries").jqxTooltip({ content: 'Save the metadata to local machine', position: 'mouse', name: 'movieTooltip' });

                $("#btnHideAdditInfo").on('click', function () {
                    setCookie('btnHideAdditInfo', $("#btnHideAdditInfo").jqxToggleButton('toggled'));
                    var toggled = getCookie('btnHideAdditInfo');
                    if (toggled == 'true') {
                        showAdditInfo();
                        $("#btnHideAdditInfo").jqxTooltip({ content: 'Hide additional data columns', position: 'mouse', name: 'movieTooltip' });
                        $("#showHideAddInfo").text("Hide additional columns");
                        showAdditionalInformation = true;
                    }
                    else {
                        hideAdditInfo();
                        $("#btnHideAdditInfo").jqxTooltip({ content: 'Show additional data columns', position: 'mouse', name: 'movieTooltip' });
                        $("#showHideAddInfo").text("Show additional columns");
                        showAdditionalInformation = false;
                    }
                });

                $("#btnHideShowEmptyRecords").on('click', function () {
                    var toggled = $("#btnHideShowEmptyRecords").jqxToggleButton('toggled');
                    hideEmpty = !toggled;

                    if (toggled) {
                        DatasetsOfDatasourceSet.Request.Page = 1;
                        DatasetsOfDatasourceSet.Request.IgnoreEmpty = false;
                        updateDatasetsOfDatasourceGrid();

                        $("#btnHideShowEmptyRecords").jqxTooltip({ content: 'Hide records with no values', position: 'mouse', name: 'movieTooltip' });
                        $("#showHideEmptyRecords").text("Hide empty records");
                        $("#btnHideShowEmptyRecords").jqxToggleButton({ imgSrc: "resources/css/icons/HideRowsGn_16.png", imgPosition: "center", width: 25, height: 25 });
                    }
                    else {
                        DatasetsOfDatasourceSet.Request.Page = 1;
                        DatasetsOfDatasourceSet.Request.IgnoreEmpty = true;
                        updateDatasetsOfDatasourceGrid();

                        $("#btnHideShowEmptyRecords").jqxTooltip({ content: 'Show records with no values', position: 'mouse', name: 'movieTooltip' });
                        $("#showHideEmptyRecords").text("Show empty records");
                        $("#btnHideShowEmptyRecords").jqxToggleButton({ imgSrc: "resources/css/icons/ShowRows2_16.png", imgPosition: "center", width: 25, height: 25 });
                    }
                });

                if (showAdditionalInformation) {
                    $('#btnHideAdditInfo').jqxToggleButton('toggle');
                    $("#btnHideAdditInfo").jqxTooltip({ content: 'Hide additional data columns', position: 'mouse', name: 'movieTooltip' });
                    $("#showHideAddInfo").text("Hide additional columns");
                }
                else {
                    $("#btnHideAdditInfo").jqxTooltip({ content: 'Show additional data columns', position: 'mouse', name: 'movieTooltip' });
                    $("#showHideAddInfo").text("Show additional columns");
                }
            },
            pagerrenderer: function () {
                var element = $("<div id='pagerender-element'></div>");
                var left_element = $("<div id='pagerender-last-element'></div>");

                var datainfo = $("#jqxgrid").jqxGrid('getdatainformation');
                var paginginfo = datainfo.paginginformation;

                var num = DatasetsOfDatasourceSet.SeriesCount / DatasetsOfDatasourceSet.pageSize;
                num = (parseInt(num) < num) ? parseInt(num) + 1 : parseInt(num);

                DatasetsOfDatasourceSet.Request.Page = (DatasetsOfDatasourceSet.Request.Page > num || DatasetsOfDatasourceSet.Request.Page <= 0) ? 1 : DatasetsOfDatasourceSet.Request.Page;
                DatasetsOfDatasourceSet.pageCounter = DatasetsOfDatasourceSet.Request.Page;

                var pageNumbers = $('<div id="pageNumberStyle">');

                res = parseInt(DatasetsOfDatasourceSet.Request.Page / 6) * 6;
                var n = (res == 0) ? 1 : res;
                res = (n == 1) ? n + 5 : n + 6;

                for (; n < res; n++) {
                    if (num >= n) {
                        var style = "text-decoration: none;";

                        if (n == DatasetsOfDatasourceSet.Request.Page)
                            style += "font-weight:bolder !important;";
                        else
                            style += "cursor:pointer";

                        $('<a class="jqx-grid-pager-number jqx-grid-pager-number-light jqx-rc-all jqx-rc-all-light" style="' + style + '" data-page="' + n + '">' + n + '</a>').appendTo(pageNumbers);
                    }
                }

                if (DatasetsOfDatasourceSet.Request.Page > 5)
                    $('<a class="jqx-grid-pager-number jqx-grid-pager-number-light jqx-rc-all jqx-rc-all-light" style="text-decoration: none;cursor:pointer" data-page="' + (parseInt(pageNumbers.find('.jqx-grid-pager-number:first-child').attr('data-page')) - 1) + '">...</a>').prependTo(pageNumbers);

                if (DatasetsOfDatasourceSet.Request.Page < num - 5)
                    $('<a class="jqx-grid-pager-number jqx-grid-pager-number-light jqx-rc-all jqx-rc-all-light" style="text-decoration: none;cursor:pointer" data-page="' + (parseInt(pageNumbers.find('.jqx-grid-pager-number:last-child').attr('data-page')) + 1) + '">...</a>').appendTo(pageNumbers);

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

                var label = $("<div id='page-lable1'>Page <input type='text' id='dataPageNymber' value='0'> of <span id='numOfAllPages'>0</span></div>");
                label.appendTo(element);

                var label2 = $("<div id='page-lable2'> Rows: </div>");
                label2.appendTo(element);

                var dropdown = $('<div id="jqxPageDropDownList" style="float: left;"></div>');
                dropdown.jqxDropDownList({
                    source: ['50', '100', '250', '500'], selectedIndex:
                        DatasetsOfDatasourceSet.pageSelectedIndex, width: 55, height: 17, autoDropDownHeight: true, enableBrowserBoundsDetection: true
                });
                dropdown.on('change', async function (event) {
                    var args = event.args;
                    if (args) {
                        var item = args.item;
                        DatasetsOfDatasourceSet.pageSelectedIndex = item.index;
                        DatasetsOfDatasourceSet.pageSize = parseInt(item.label);
                        DatasetsOfDatasourceSet.pageCounter = 1;
                        DatasetsOfDatasourceSet.Request.Rows = DatasetsOfDatasourceSet.pageSize;
                        DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                        updateDatasetsOfDatasourceGrid();
                    }
                });
                dropdown.appendTo(element);
                DatasetsOfDatasourceSet.label = label;
                refreshPagination();

                var handleStates = function (event, button, className, add) {
                    button.on(event, function () {
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

                pageNumbers.find('a').click(async function () {
                    if (parseInt($(this).attr('data-page')) !== DatasetsOfDatasourceSet.Request.Page) {
                        DatasetsOfDatasourceSet.pageCounter = parseInt($(this).attr('data-page'));
                        DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                        updateDatasetsOfDatasourceGrid(true, 'all', false);
                    }
                });

                pageButtonToLast.click(async function () {
                    if (DatasetsOfDatasourceSet.pageCounter !== DatasetsOfDatasourceSet.pagesCount) {
                        DatasetsOfDatasourceSet.pageCounter = DatasetsOfDatasourceSet.pagesCount;
                        DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                        updateDatasetsOfDatasourceGrid(true, 'all', false);
                    }
                });

                rightPageButton.click(async function () {
                    if (DatasetsOfDatasourceSet.pageCounter !== DatasetsOfDatasourceSet.pagesCount) {
                        DatasetsOfDatasourceSet.pageCounter++;
                        DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                        updateDatasetsOfDatasourceGrid(true, 'all', false);
                    }
                });

                pageButtonToFirst.click(async function () {
                    if (DatasetsOfDatasourceSet.pageCounter !== 1) {
                        DatasetsOfDatasourceSet.pageCounter = 1;
                        DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                        updateDatasetsOfDatasourceGrid(true, 'all', false);
                    }
                });

                leftPageButton.click(async function () {
                    if (DatasetsOfDatasourceSet.pageCounter !== 1) {
                        DatasetsOfDatasourceSet.pageCounter--;
                        DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                        updateDatasetsOfDatasourceGrid(true, 'all', false);
                    }
                });

                var new_element = $('<div>').append(element);
                new_element.append(left_element);
                return new_element;
            },
            columns: columns,
            autosavestate: true,
        });

    $('#jqxgrid').find('div.jqx-grid-load').next().text('Requesting Data...').parent().parent().width(153);

    function pageNumberCheck(val) {
        var value = parseInt(val);
        if (
            value <= DatasetsOfDatasourceSet.pagesCount &&
            value > 0
        ) {
            DatasetsOfDatasourceSet.pageCounter = value;
            DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
            updateDatasetsOfDatasourceGrid(true, 'all', false);
        }
        else {
            dialogWindow("The page number \"" + value + "\" is invalid", "error");
        }
    }

    $(window).on('keyup', function (e) {
        if (e.key == 'Enter' && $(e.target).attr('id') == "dataPageNymber") {
            pageNumberCheck($(e.target).val());
        }
    });

    $(document).on('blur', '#dataPageNymber', function () {
        pageNumberCheck($(this).val());
    });

    var contextMenu = $("#jqxgridMenu").jqxMenu({ width: 200, height: 125, autoOpenPopup: false, mode: 'popup' });
    $("#jqxgrid").on('contextmenu', function () {
        return false;
    });
    $("#jqxgridMenu").on('itemclick', function (event) {
        var args = event.args;
        var rowindex = $("#jqxgrid").jqxGrid('getselectedrowindex');
        switch ($.trim($(args).text())) {
            case "Add to Favourites":
                copySeriesToFavorite();
                break;

            case "Remove from Favourites":
                removeSeriesFromFavorites();
                break;

            case "Copy":
                copySelectedSeriesToClipboard('jqxgrid');
                break;

            case "Export":
                makeExportSeriesDialog();
                break;
        }
    });

    $("#jqxgrid").on('rowclick', function (event) {
        if (event.args.rightclick) {
            $("#jqxgrid").jqxGrid('selectrow', event.args.rowindex);
            var scrollTop = $(window).scrollTop();
            var scrollLeft = $(window).scrollLeft();
            contextMenu.jqxMenu('open', parseInt(event.args.originalEvent.clientX) + 5 + scrollLeft, parseInt(event.args.originalEvent.clientY) + 5 + scrollTop);
            return false;
        }
    });

    function hideAdditInfo() {
        $('#jqxgrid').jqxGrid('showloadelement');
        $('#jqxgrid').jqxGrid('hidecolumn', 'Currency');
        $('#jqxgrid').jqxGrid('hidecolumn', 'Unit');
        $('#jqxgrid').jqxGrid('hidecolumn', 'Conversions');
        $('#jqxgrid').jqxGrid('hidecolumn', 'Decimals');
        $('#jqxgrid').jqxGrid('hidecolumn', 'Additional');
        resizeColumns('jqxgrid');
        $('#jqxgrid').jqxGrid('hideloadelement');
    }

    function showAdditInfo() {
        $('#jqxgrid').jqxGrid('showloadelement');
        $('#jqxgrid').jqxGrid('showcolumn', 'Currency');
        $('#jqxgrid').jqxGrid('showcolumn', 'Unit');
        $('#jqxgrid').jqxGrid('showcolumn', 'Conversions');
        $('#jqxgrid').jqxGrid('showcolumn', 'Decimals');
        $('#jqxgrid').jqxGrid('showcolumn', 'Additional');
        resizeColumns('jqxgrid');
        $('#jqxgrid').jqxGrid('hideloadelement');
    }
});

function resizeElements() {
    var contentBottomPadding = $("#main-footer").height();
    $('#jqxWidget').css('height', (window.innerHeight - 120 - contentBottomPadding - 66) + 'px');

    if (window.innerWidth < 1000)
        $('#main-footer').css('width', (window.innerWidth + 150) + 'px');
    // else {
    //     if (window.innerWidth > 1200)
    //         $('#main-footer').css('width', (100) + '%');
    //     else
    //         $('#main-footer').css('width', '1230px');
    // }
}

$(window).resize(function () { resizeElements() });
resizeElements();

function openSeriesInNewTab(database, series, category) {
    let category_l = (category == "undefined") ? "" : category + "/",
        msg = "Do you want to view the series " + database + "/" + category_l + series + " in a new tab?";

    if (access.CategoryDS) {
        let u_access = false,
            last_access;

        if (access.DetailsDS !== undefined && access.DetailsDS.Categories !== undefined) {
            access.DetailsDS.Categories.map((v) => {
                if (v.Name == category && v.AccessType !== 'inactive') {
                    u_access = true;
                    if (isDateExpired(v.Ends, true)) {
                        u_access = null;
                        last_access = v.Ends;
                    }
                }
            });
        }

        if (u_access == null)
            msg = "Your access to the " + database + " data category " + category + " expired on " + last_access + ".<br>Do you want to view this series in a new tab?";

        else if (!u_access)
            msg = "You do not have access to the " + database + " data category " + category + " or its values.<br>Do you want to view this series in a new tab?";
    }
    else {
        if (access.Details !== undefined) {
            if (access.Details.Subscription == "inactive")
                msg = "You do not have access to the datasource " + database + " or its values.<br>Do you want to view this series in a new tab?"

            else if (isDateExpired(access.Details.UserAccess.Ends, true))
                msg = "Your access to the " + database + " data source expired on " + access.Details.UserAccess.Ends + ".<br>Do you want to view this series in a new tab?"
        }
    }

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
            };
            if (category != "undefined") parameters.Series[0].Datacategory = category;

            call_api_ajax('GetDatasetValues', 'POST', JSON.stringify(parameters), true, (data, textStatus, XmlHttpRequest) => {
                if (data.Result.Series[0].Metadata == undefined || data.Result.Series[0].BateStatus == undefined) {
                    let type = 'Metadata or BateStatus';
                    if (data.Result.Series[0].Metadata == undefined) type = 'Metadata';
                    else if (data.Result.Series[0].BateStatus == undefined) type = 'BateStatus';

                    dialogWindow('The server responded with "' + XmlHttpRequest.status + '" but cannot read the ' + type + ' field', 'error', null, null, null, null, { funcName: 'GetDatasetValues', parameters: parameters, data: data, type: 'post' });
                    console.warn(data);
                    return
                }
                else if (data.Result.Series[0].BateStatus[0].Status > 299) {
                    dialogWindow('The server responded with "' + data.Result.Series[0].BateStatus[0].Status + '". ' + data.Result.Series[0].BateStatus[0].Detail, 'error', null, null, null, null, { funcName: 'GetDatasetValues', parameters: parameters, data: data, type: 'post' });
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
                    let symbol = (access.CategoryDS) ? database + "/" + category_l + series : database + "/" + category_l + series;
                    sessionStorage.setItem(symbol, JSON.stringify(data.Result.Series[0]));
                    var win = window.open("seriesviewer?symbol=" + symbol + "&tab=prices", '_blank');
                    win.focus();
                }
            }, null, () => {
                $('#loadingData').hide();
                $('body').removeClass('overlay');
            });
        }, null, null, { Ok: 'Yes', Cancel: 'No' });
}

function refreshSeries() {
    var indexes = $('#jqxgrid').jqxGrid('getselectedrowindexes')
    indexes.forEach(function (item, i, indexes) {
        var row = $('#jqxgrid').jqxGrid('getrowdata', item);
        var url = "databases/" + row.database + "/" + row.code + "/reload";

        $.post(url, function (result) {
            if (result.success && indexes.length == (i + 1)) {
                $("#jqxgrid").jqxGrid('updatebounddata', 'cells');
            }
            else if (!result.success)
                apprise("Failed reload series " + row.code);

        }, 'json');
    });
}

function copySeriesToFavorite() {
    var indexes = $('#jqxgrid').jqxGrid('getselectedrowindexes');

    if (indexes.length < 1)
        dialogWindow("Please, select at least one series", "error");
    else {
        var array = [], rows = [];
        indexes.forEach(function (item, i, indexes) {
            var row = $('#jqxgrid').jqxGrid('getrowdata', item);
            if (!row.Favorite) {
                let cate = (row.Datacategory == undefined) ? "" : row.Datacategory + '/';
                array.push(databaseName + '/' + cate + row.Symbol);
                rows.push(row);
            }
        });

        dialogWindow("Do you want to add " + rows.length + " series to favorites list?", "query", "confirm", null,
            () => {
                call_api_ajax('AddUserFavoriteDatasets', 'get', { SessionToken: sessionToken, "Series[]": array }, false,
                    () => {
                        rows.forEach(function (item, i, indexes) {
                            if (!item.Favorite)
                                $("#jqxgrid").jqxGrid('setcellvalue', item.uid, "Favorite", true);
                        });
                        functionNotificationMessage({ text: "You have successfully added " + rows.length + " series to your Favorites list" });
                    });
            });
    }
}

function markAsForceUpdate() {
    var indexes = $('#jqxgrid').jqxGrid('getselectedrowindexes');
    if (indexes.length < 1)
        return;
    indexes.forEach(function (item, i, indexes) {
        var row = $('#jqxgrid').jqxGrid('getrowdata', item);

        $.get("databases/" + row.database + "/" + row.code + "/markForceUpdate", function (result) {
            if (!result.success)
                apprise(result.errorMsg);
            else {
                row.force_update = true;
                $("#jqxgrid").jqxGrid('updaterow', row.uid, row);
            }
        });
    });
}

function markAsNotForceUpdate() {
    var indexes = $('#jqxgrid').jqxGrid('getselectedrowindexes');
    if (indexes.length < 1)
        return;
    indexes.forEach(function (item, i, indexes) {
        var row = $('#jqxgrid').jqxGrid('getrowdata', item);

        $.get("databases/" + row.database + "/" + row.code + "/markNotForceUpdate", function (result) {
            if (!result.success)
                apprise(result.errorMsg);
            else {
                row.force_update = false;
                $("#jqxgrid").jqxGrid('updaterow', row.uid, row);
            }
        });
    });
}
function initCategoryList() {
    var source = {
        datatype: "json",
        datafields: [
            { name: 'code' },
            { name: 'title' }
        ],
        async: true
    };
    var dataAdapter = new $.jqx.dataAdapter(source);

    // Create a jqxDropDownList
    $("#categoryDropdownList").jqxDropDownList({
        source: dataAdapter,
        displayMember: 'title',
        valueMember: 'code',
        selectedIndex: 0,
        width: '380px',
        height: '25'
    });
}

function makeAndFillCategotyWindow() {
    var indexes = $('#jqxgrid').jqxGrid('getselectedrowindexes');
    if (indexes.length < 1)
        return;
    var row = $('#jqxgrid').jqxGrid('getrowdata', 0);

    $('#categoryAddDialogWindow').jqxWindow('open');
    initCategoryList();

    $("#acSymbol").text(row.code);
    $("#acSeries").text(row.name);
}

function addToCategorySelectedSeries() {
    var indexes = $('#jqxgrid').jqxGrid('getselectedrowindexes');
    var category = $("#categoryDropdownList").jqxDropDownList('getSelectedItem').value;

    indexes.forEach(function (item, i, indexes) {
        var row = $('#jqxgrid').jqxGrid('getrowdata', item);
        addToCategory(row, category);
    });
}

function addToCategory(row, category) {
    var parameters = {
        database_code: row.database,
        dataset_code: row.code
    };

    var url = "idm-customer-categories/settings/" + category + "/addSeries";
    $.post(url, parameters, function (result) {
        if (!result.success && result.code == 0)
            apprise(result.errorMsg);

        else if (!result.success && result.code == 1) {
            var message = "Symbol  CRYPTO/" + row.code + " already exists in " + category + " category. Do you want replace it?";
            apprise(message, { 'verify': true }, function (r) {
                if (r) {
                    var parameters = { database_code: row.database, dataset_code: row.code };
                    var url = "idm-customer-categories/settings/" + category + "/updateSeries";
                    $.post(url, parameters);
                    $('#categoryAddDialogWindow').jqxWindow('close');
                }
            });
        }
        else {
            $('#categoryAddDialogWindow').jqxWindow('close');
        }
    }, 'json');
}

$("#categoryAddDialogWindow").css('visibility', 'visible');
$("#exportDialogWindow").css('visibility', 'visible');

var jqxWidget = $('#jqxWidget');
var offset = jqxWidget.offset();

$('#categoryAddDialogWindow').jqxWindow({
    showCollapseButton: false,
    resizable: false,
    height: 300,
    width: 500,
    autoOpen: false,
    title: 'User Category - Add symbol',
    initContent: function () {
        $('#addCategoryButton').jqxButton({ width: '70px', height: '34px' });
        $("#addCategoryButton").on('click', function () {
            addToCategorySelectedSeries();
        });

        $('#cancelCategoryButton').jqxButton({ width: '90px', height: '34px' });
        $("#cancelCategoryButton").on('click', function () {
            $('#categoryAddDialogWindow').jqxWindow('close');
        });
    }
});

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
    var rows = $('#jqxgrid').jqxGrid('getrows');
    $('#exportDialogWindow #num').text(rows.length);
    if ($('#jqxgrid').jqxGrid('selectedrowindexes').length == 0) {
        $("#export-one").prop('disabled', true);
        $("#export-all").prop('checked', true);
    }
    else {
        $("#export-all, #export-one").prop('disabled', false);
        $("#export-one").prop('checked', true);
    }
    let record = ($('#jqxgrid').jqxGrid('selectedrowindexes').length > 1) ? "records" : "record";
    let msg = "Export the " + $('#jqxgrid').jqxGrid('selectedrowindexes').length + " selected " + record;
    $('#exportSelectedRecordsText').text(msg);
    $('#exportDialogWindow').jqxWindow('open');
}

function exportSeries() {
    var export_type = $('input[name="export_type"]:checked').val(),
        rows,
        datasource,
        datasets = [],
        getDateInFormat = (date) => {
            var date = new Date(date);
            day = date.getDate(),
                month = date.getMonth() + 1,
                year = date.getFullYear();

            day = (day < 10) ? '0' + day : day;
            month = (month < 10) ? '0' + month : month;
            date = day + '-' + month + '-' + year;
            return date;
        };

    if (export_type == "selected") {
        var indexes = $('#jqxgrid').jqxGrid('getselectedrowindexes')

        if (indexes.length == 0) {
            dialogWindow("Please, select at least one series", "error");
            return;
        }
        else {
            indexes.forEach(function (item, i, indexes) {
                rows = $('#jqxgrid').jqxGrid('getrowdata', item);
                datasets.push([databaseName, rows.Symbol, rows.Description, rows.Frequency, getDateInFormat(rows.StartDate), getDateInFormat(rows.EndDate), rows.Values]);
            });
        }
    }
    else if (export_type == "all") {
        var items = $('#jqxgrid').jqxGrid('getrows');

        items.forEach(function (rows) {
            datasets.push([databaseName, rows.Symbol, rows.Description, rows.Frequency, getDateInFormat(rows.StartDate), getDateInFormat(rows.EndDate), rows.Values]);
        });
    }

    var Results = [
        ["Datasource", "Symbol", "Description", "Frequency", "From", "To", "Prices"]
    ];

    datasets.map(v => Results.push(v));

    var date = new Date(),
        day = date.getDate(),
        month = date.getMonth() + 1,
        year = date.getFullYear();

    day = (day < 10) ? '0' + day : day;
    month = (month < 10) ? '0' + month : month;
    date = day + '-' + month + '-' + year;

    var CsvString = "";
    Results.forEach(function (RowItem, RowIndex) {
        RowItem.forEach(function (ColItem, ColIndex) {
            if (ColItem == "") ColItem = " ";
            CsvString += '"' + ColItem + '",';
        });
        CsvString += "\r\n";
    });

    CsvString = "data:application/csv," + encodeURIComponent(CsvString);
    var link = document.createElement("a");
    link.href = CsvString;
    link.download = databaseName + "-EXPORT-" + date + ".csv"
    link.click();
}
$('.wrap').removeClass('wait');
$("#jqxgridMenu, #jqxTabs").css('visibility', 'visible');