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

var dataView;
var grid, resizer;

$(document).ready(function () {
  
    $(window).resize(function () {
        setTimeout(() => {
            var panel_height = ($('.fixpage').css("height").slice(0,-2) - 210)+"px";
            $('#jqxgrid').css("height", (panel_height.slice(0,-2)-72))
            $('.slick-viewport').css('height', ($('#jqxgrid').height()-30));
            $('.slick-pane-top').css('top', '0px').css('height', "100%");
        }, 50);
        // setTimeout(() => {
        //     updateDatasetsOfDatasourceGrid()
        // }, 10);
    });

    // setTimeout(() =>
    // {
    //     // $('.slick-viewport').css('height', '429px');
    //     $('.slick-pane-top').css('top', '32px').css('height', '465px');
    // },
    // 50);

    // Get user data and check if session is not Expired
  
//   call_api_ajax('GetMyAccountDetails', 'get', { SessionToken: session }, false, ( data ) =>
//     {
// 	    var userName     = data.Result.Name;
        
//         $('#username').text( userName );
//     });
  
    call_api_ajax('GetMyAccountDetails', 'get', {
        SessionToken: getSession()
    }, false, (data) => {
        userName = data.Result.Name;
        $('#username').text(userName);
      $("body").removeClass("wait");
    });

    call_api_ajax('GetUserDatasources', 'get', {
        SessionToken: getSession(),
        ReturnCategoryList: true
    }, false, (data) => {
        data.Result.map((v) => {
            access = (v.Datasource == databaseName) ? v : access;
        });
    });

    $('#profile').attr('href', 'profile?tab=MyProfile');
    $('#favorites').attr('href', 'profilemain?tab=favorites');
    $('#logout').click(function () {
        logout();
    });
  
  call_api_ajax('GetMyAccountDetails', 'get', {
        SessionToken: getSession()
    }, false, (data) => {
        userName = data.Result.Name;
        $('#username').text(userName);
      $("body").removeClass("wait");
    });

    function resizeColumns(grid_id) {
        var grid_panel = $("#" + grid_id),
            columns = grid.getColumns(),
            rows = dataView.getItems(),
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

        if (grid_panel.find('#verticalScrollBar' + grid_id).length && grid_panel.find('#verticalScrollBar' + grid_id).css('visibility') !== "hidden") {
            z = 2.2;
        }

        if (columns !== undefined) {
            // grid.autosizeColumns();
            width = grid.getGridPosition().width;

            descriptionWidth = columns[3].width,
                descriptionMinWidth = columns[3].minWidth;

            columns.map(function (column) {
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
                    all_data[i].map(function (v) {
                        if (v !== undefined && v !== null) {
                            if (typeof v !== 'boolean' && v.length > l)
                                l = v.length;
                        }
                    });

                    if (i.split('<').length == 0 && l < i.length) l = i.length;

                    var w = columns[index_array[i]].width;

                    if (datafield[i] !== 'Description') {
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

            columns.map(function (v) {
                if (v.field == "Description")
                    v.width = descriptionWidth;
            });

            // grid.jqxGrid({ columns: columns });
            // grid.jqxGrid('refresh');
        }


        var panel_height = $('.splitter-panel').css("height");
        $('#jqxgrid').css("height", (panel_height.slice(0, -2) - 73));

        setTimeout(() => {
                $('.slick-viewport').css('height', (panel_height.slice(0, -2) - 103));
                //$('.slick-pane-top').css('top', '0px').css('height', (panel_height.slice(0, -2) - 68));
                $('.slick-pane-top').css('top', '0px').css('height', '100%');
            },
            5);
    }

    function refreshPagination() {
        var rows = dataView.getItems();
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
            SessionToken: getSession(),
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
                    default:
                        return;
                }
                // $('#jqxgrid').jqxGrid('showloadelement');
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
                        // $("#jqxgrid").jqxGrid('updatebounddata', 'sort');
                    }, null, () => {
                        // $("#jqxgrid").jqxGrid('hideloadelement');
                    });
            },
            datafields: [{
                    name: 'Datacategory',
                    type: 'string'
                },
                {
                    name: 'Symbol',
                    type: 'string'
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
                if (data.Result.Datasets[i].Additional != undefined)
                    data.Result.Datasets[i].Conversions = data.Result.Datasets[i].Additional.Conversions[0].ConvertTo + " " + data.Result.Datasets[i].Additional.Conversions[0].ConvertOperator + data.Result.Datasets[i].Additional.Conversions[0].ConvertValue
            }
            DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;

        });

    call_api_ajax('GetAllDatasources', 'get', {
            SessionToken: getSession(),
            ReturnCategoryList: true,
            ReturnCategoryTree: true,
            ReturnUserCategoryList: true
        }, false,
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
                        array[i].value = name;
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
                        array[i].value = name;
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
                    array[i].value = name;
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
                    if (t.items === undefined && t.value === value) {
                        array.push(t);
                    } else {
                        let all = []
                        if (t.value !== undefined)
                            all = t.value.split(',');

                        if (all.indexOf(value) !== -1) {
                            let items = getSpecificData(userRecords, t.items, 2);
                            if (items.length > 0) {
                                t.items = items;
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
                    if (t.items === undefined && t.value === value) {
                        array.push(t);
                    } else {
                        let all = []
                        if (t.value !== undefined)
                            all = t.value.split(',');

                        if (all.indexOf(value) !== -1) {
                            let items = getSpecificData(t.items, userRecords, 3);
                            if (items.length > 0) {
                                t.items = items;
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
                    if (t.items === undefined && t.value === value) {
                        array.push(t);
                    } else {
                        let all = []
                        if (t.value !== undefined)
                            all = t.value.split(',');

                        if (all.indexOf(value) !== -1) {
                            let items = getSpecificData(t.items, userRecords);
                            if (items.length > 0) {
                                t.items = items;
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
            if (elem === e.Name) {
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

    var treeRecords = arrangeData(categories, "Tree", datasourceInfo);
    var listRecords = arrangeData(category_list, "List");

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

    // if(treeRecords != undefined || listRecords != undefined)
    $('#mainSplitter').jqxSplitter({
        width: '100%',
        height: '100%',
        panels: [{
            size: "22%",
            collapsible: true,
            collapsed: false
        }, {
            size: '78%',
            collapsible: false
        }]
    });
    $('#mainSplitter').jqxSplitter({
        showSplitBar: true
    });
    //$('#mainSplitter').jqxSplitter('expand');
    if (CategoryDS || treeRecords != undefined) {

        //        $('#mainSplitter').jqxSplitter({ width: '100%', height: '100%', panels: [{ size: "22%" }, { size: '78%', collapsible: false }] });
        if (category_list !== undefined) {
            var userRecords = arrangeData(userCategory, "UserList");
            $('#jqxTabs').jqxTabs({
                width: '100%',
                height: '100%'
            });
            // $('#userCategory').show();
            $('#userCategoryCheckbox').jqxCheckBox({
                checked: false
            });

            $('#toggleCaptionTabTree').on('click', function (event) {
                $('#userCategory').hide();
            });

            $('#toggleCaptionTab').on('click', function (event) {
                $('#userCategory').show();
            });

            $('#userCategoryCheckbox').on('change', function (event) {
                if(getSession() == undefined || getSession() == ""){
                    openLoginPopup();
                }
                else{
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
                    
                        $('#jstreeCategoriesList').on('activate_node.jstree', function (e, item) {
                // $("#jstreeCategoriesTree").jqxTree('selectItem', null);
                if (item.node.text !== null && item.node.text !== "") {
                    var databaseCategory = item.node.original.value;
                
                    DatasetsOfDatasourceSet.Request.Filter = encodeURIComponent($("#searchBox").val());
                    DatasetsOfDatasourceSet.Request.CategoryFilter = databaseCategory;
                    DatasetsOfDatasourceSet.Request.Page = 1;

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

                            var isCategory = false;
                            for (var i = 0; i < DatasetsOfDatasourceSet.source.localdata.length; i++) {
                                DatasetsOfDatasourceSet.source.localdata[i].id = "id_" + i;
                                DatasetsOfDatasourceSet.source.localdata[i].num = (i + 1);
                                // DatasetsOfDatasourceSet.source.localdata[i].Favorite = "";

                                if (DatasetsOfDatasourceSet.source.localdata[i].Datacategory != undefined)
                                    var isCategory = true;
                            }

                            var columns = [{
                                    id: "sel",
                                    name: "#",
                                    field: "num",
                                    behavior: "select",
                                    cssClass: "cell-title cell-right",
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
                                    width: 30,
                                    resizable: false,
                                    formatter: imagerenderer
                                },
                                {
                                    id: "symbol",
                                    name: "Symbol",
                                    field: "Symbol",
                                    minWidth: 20,
                                    width: 80,
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
                                    maxWidth: 400,
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
                                    width: 80,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "to",
                                    name: "To",
                                    field: "EndDate",
                                    minWidth: 20,
                                    width: 80,
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
                                    cssClass: "cell-title",
                                    formatter: additional_renderer
                                },
                            ];

                            if (isCategory) {
                                columns.splice(2, 0, {
                                    id: 'cat',
                                    name: 'Cat.',
                                    field: 'Datacategory',
                                    minwidth: 10,
                                    width: 40,
                                    cssClass: "cell-title"
                                }, )
                            }

                            grid.setColumns(columns);
                            grid.setData(DatasetsOfDatasourceSet.source.localdata);
                            dataView.beginUpdate();
                            dataView.setItems(DatasetsOfDatasourceSet.source.localdata, "id");
                            dataView.endUpdate();

                            grid.invalidate();
                            grid.render();

                            var toggled = getCookie('btnHideAdditInfo');
                            if (toggled == 'true') {
                                showAdditInfo();
                            } else {
                                hideAdditInfo();
                            }

                            refreshPagination();
                            CreateNavigationRow();
                            // resizeColumns('jqxgrid');

                            let categoryURL = (DatasetsOfDatasourceSet.Request.CategoryFilter !== undefined) ? "&Category=" + DatasetsOfDatasourceSet.Request.CategoryFilter : "";
                            window.history.pushState('mydsviewer', 'mydsviewer', 'mydsviewer?Datasource=' + databaseName + '&Page=' + DatasetsOfDatasourceSet.pageCounter + categoryURL + '&rows=' + DatasetsOfDatasourceSet.Request.Rows);

                        }, null, () => {
                            // $('#jqxgrid').jqxGrid('hideloadelement');
                        });
                } else {
                    // $('#jqxgrid').jqxGrid('clear');
                }

                var item = $('#jstreeCategoriesList').jstree(true).get_selected("full", true)[0];
                if (item)
                    document.getElementById(item.id).children[1].style.color = "white";

                let listItems = $('#jstreeCategoriesList').jstree(true).get_json('#', {
                    flat: true
                });
                for (let j in listItems) {
                    if (listItems[j].id == item.id)
                        continue;
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
                    if (listItems[j].id == item.id)
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
                    
                    $('#jstreeCategoriesList').on('activate_node.jstree', function (e, item) {
                // $("#jstreeCategoriesTree").jqxTree('selectItem', null);
                if (item.node.text !== null && item.node.text !== "") {
                    var databaseCategory = item.node.original.value;

                    DatasetsOfDatasourceSet.Request.Filter = encodeURIComponent($("#searchBox").val());
                    DatasetsOfDatasourceSet.Request.CategoryFilter = databaseCategory;
                    DatasetsOfDatasourceSet.Request.Page = 1;

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

                            var isCategory = false;
                            for (var i = 0; i < DatasetsOfDatasourceSet.source.localdata.length; i++) {
                                DatasetsOfDatasourceSet.source.localdata[i].id = "id_" + i;
                                DatasetsOfDatasourceSet.source.localdata[i].num = (i + 1);
                                // DatasetsOfDatasourceSet.source.localdata[i].Favorite = "";

                                if (DatasetsOfDatasourceSet.source.localdata[i].Datacategory != undefined)
                                    var isCategory = true;
                            }

                            var columns = [{
                                    id: "sel",
                                    name: "#",
                                    field: "num",
                                    behavior: "select",
                                    cssClass: "cell-title cell-right",
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
                                    width: 30,
                                    resizable: false,
                                    formatter: imagerenderer
                                },
                                {
                                    id: "symbol",
                                    name: "Symbol",
                                    field: "Symbol",
                                    minWidth: 20,
                                    width: 80,
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
                                    maxWidth: 400,
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
                                    width: 80,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "to",
                                    name: "To",
                                    field: "EndDate",
                                    minWidth: 20,
                                    width: 80,
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
                                    cssClass: "cell-title",
                                    formatter: additional_renderer
                                },
                            ];

                            if (isCategory) {
                                columns.splice(2, 0, {
                                    id: 'cat',
                                    name: 'Cat.',
                                    field: 'Datacategory',
                                    minwidth: 10,
                                    width: 40,
                                    cssClass: "cell-title"
                                }, )
                            }

                            grid.setColumns(columns);
                            grid.setData(DatasetsOfDatasourceSet.source.localdata);
                            dataView.beginUpdate();
                            dataView.setItems(DatasetsOfDatasourceSet.source.localdata, "id");
                            dataView.endUpdate();

                            grid.invalidate();
                            grid.render();

                            var toggled = getCookie('btnHideAdditInfo');
                            if (toggled == 'true') {
                                showAdditInfo();
                            } else {
                                hideAdditInfo();
                            }

                            refreshPagination();
                            CreateNavigationRow();
                            // resizeColumns('jqxgrid');

                            let categoryURL = (DatasetsOfDatasourceSet.Request.CategoryFilter !== undefined) ? "&Category=" + DatasetsOfDatasourceSet.Request.CategoryFilter : "";
                            window.history.pushState('mydsviewer', 'mydsviewer', 'mydsviewer?Datasource=' + databaseName + '&Page=' + DatasetsOfDatasourceSet.pageCounter + categoryURL + '&rows=' + DatasetsOfDatasourceSet.Request.Rows);

                        }, null, () => {
                            // $('#jqxgrid').jqxGrid('hideloadelement');
                        });
                } else {
                    // $('#jqxgrid').jqxGrid('clear');
                }

                var item = $('#jstreeCategoriesList').jstree(true).get_selected("full", true)[0];
                if (item)
                    document.getElementById(item.id).children[1].style.color = "white";

                let listItems = $('#jstreeCategoriesList').jstree(true).get_json('#', {
                    flat: true
                });
                for (let j in listItems) {
                    if (listItems[j].id == item.id)
                        continue;
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
                    if (listItems[j].id == item.id)
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
                }
            });
        } else $('#jqxTabs').jqxTabs({
            width: '100%',
            height: '100%'
        });
    } else {
        $('#mainSplitter').jqxSplitter({
            width: '100%',
            height: '100%',
            showSplitBar: false,
            panels: [{
                size: "0%"
            }, {
                size: "100%"
            }]
        });
        $('#jqxTabs').jqxTabs({
            width: '100%',
            height: '100%'
        });
    }

    if (treeRecords) {

        $('#jstreeCategoriesTree').jstree({
            "core": {
                "data": treeRecords,
            },
            // "plugins" : [ "contextmenu" ]
        });

        $('#jstreeCategoriesTree').on('open_node.jstree', function (a, b, c) {
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

        $('#jstreeCategoriesTree').on('activate_node.jstree', function (e, item) {
            if (item.node.children.length == 0) {
                // $("#jqxCategoriesList").jqxTree('selectItem', null);
                if (item.node.original.value !== null) {
                    var databaseCategory = item.node.original.value;

                    DatasetsOfDatasourceSet.Request.Filter = encodeURIComponent($("#searchBox").val());
                    DatasetsOfDatasourceSet.Request.CategoryFilter = databaseCategory;
                    DatasetsOfDatasourceSet.Request.Page = 1;

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

                            var isCategory = false;
                            for (var i = 0; i < DatasetsOfDatasourceSet.source.localdata.length; i++) {
                                DatasetsOfDatasourceSet.source.localdata[i].id = "id_" + i;
                                DatasetsOfDatasourceSet.source.localdata[i].num = (i + 1);
                                // DatasetsOfDatasourceSet.source.localdata[i].Favorite = "";

                                if (DatasetsOfDatasourceSet.source.localdata[i].Datacategory != undefined)
                                    var isCategory = true;
                            }

                            var columns = [{
                                    id: "sel",
                                    name: "#",
                                    field: "num",
                                    behavior: "select",
                                    cssClass: "cell-title cell-right",
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
                                    width: 30,
                                    resizable: false,
                                    formatter: imagerenderer
                                },
                                {
                                    id: "symbol",
                                    name: "Symbol",
                                    field: "Symbol",
                                    minWidth: 20,
                                    width: 80,
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
                                    maxWidth: 400,
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
                                    width: 80,
                                    sortable: true,
                                    cssClass: "cell-title"
                                },
                                {
                                    id: "to",
                                    name: "To",
                                    field: "EndDate",
                                    minWidth: 20,
                                    width: 80,
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
                                    cssClass: "cell-title",
                                    formatter: additional_renderer
                                },
                            ];

                            if (isCategory) {
                                columns.splice(2, 0, {
                                    id: 'cat',
                                    name: 'Cat.',
                                    field: 'Datacategory',
                                    minwidth: 10,
                                    width: 40,
                                    cssClass: "cell-title"
                                }, )
                            }

                            grid.setColumns(columns);
                            grid.setData(DatasetsOfDatasourceSet.source.localdata);
                            dataView.beginUpdate();
                            dataView.setItems(DatasetsOfDatasourceSet.source.localdata, "id");
                            dataView.endUpdate();

                            console.log(DatasetsOfDatasourceSet.source.localdata);

                            grid.invalidate();
                            grid.render();

                            var toggled = getCookie('btnHideAdditInfo');
                            if (toggled == 'true') {
                                showAdditInfo();
                            } else {
                                hideAdditInfo();
                            }

                            for (var i in data.Result.Datasets) {
                                if (data.Result.Datasets[i].Additional != undefined)
                                    data.Result.Datasets[i].Conversions = data.Result.Datasets[i].Additional.Conversions[0].ConvertTo + " " + data.Result.Datasets[i].Additional.Conversions[0].ConvertOperator + data.Result.Datasets[i].Additional.Conversions[0].ConvertValue
                            }

                            refreshPagination();
                            CreateNavigationRow();
                            // resizeColumns('jqxgrid');

                            let categoryURL = (DatasetsOfDatasourceSet.Request.CategoryFilter !== undefined) ? "&Category=" + DatasetsOfDatasourceSet.Request.CategoryFilter : "";
                            window.history.pushState('mydsviewer', 'mydsviewer', 'mydsviewer?Datasource=' + databaseName + '&Page=' + DatasetsOfDatasourceSet.pageCounter + categoryURL + '&rows=' + DatasetsOfDatasourceSet.Request.Rows);

                        }, null, () => {
                            // $('#jqxgrid').jqxGrid('hideloadelement');
                        });
                } else {
                    // $('#jqxgrid').jqxGrid('clear');
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
        var clickedItem = null;

        var attachCategoriesContextMenu = function () {
            document.getElementById("jqxCategoriesMenu").style.visibility = "visible";

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
            let treeItems = $('#jstreeCategoriesTree').jstree(true).get_json('#', {
                flat: true
            });
            // document.getElementById(treeItems[0].id).children[0].style.width="5px";
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
        $('#jstreeCategoriesList').jstree({
            "core": {
                "data": listRecords,
                "multiple": false,
                "animation": 0
            },
            // "plugins" : [ "wholerow", "checkbox" ]
        });

        $('#jstreeCategoriesList').on('activate_node.jstree', function (e, item) {
            // $("#jstreeCategoriesTree").jqxTree('selectItem', null);
            if (item.node.text !== null && item.node.text !== "") {
                var databaseCategory = item.node.original.value;

                DatasetsOfDatasourceSet.Request.Filter = encodeURIComponent($("#searchBox").val());
                DatasetsOfDatasourceSet.Request.CategoryFilter = databaseCategory;
                DatasetsOfDatasourceSet.Request.Page = 1;

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

                        var isCategory = false;
                        for (var i = 0; i < DatasetsOfDatasourceSet.source.localdata.length; i++) {
                            DatasetsOfDatasourceSet.source.localdata[i].id = "id_" + i;
                            DatasetsOfDatasourceSet.source.localdata[i].num = (i + 1);
                            // DatasetsOfDatasourceSet.source.localdata[i].Favorite = "";

                            if (DatasetsOfDatasourceSet.source.localdata[i].Datacategory != undefined)
                                var isCategory = true;
                        }

                        var columns = [{
                                id: "sel",
                                name: "#",
                                field: "num",
                                behavior: "select",
                                cssClass: "cell-title cell-right",
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
                                width: 30,
                                resizable: false,
                                formatter: imagerenderer
                            },
                            {
                                id: "symbol",
                                name: "Symbol",
                                field: "Symbol",
                                minWidth: 20,
                                width: 80,
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
                                maxWidth: 400,
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
                                width: 80,
                                sortable: true,
                                cssClass: "cell-title"
                            },
                            {
                                id: "to",
                                name: "To",
                                field: "EndDate",
                                minWidth: 20,
                                width: 80,
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
                                cssClass: "cell-title",
                                formatter: additional_renderer
                            },
                        ];

                        if (isCategory) {
                            columns.splice(2, 0, {
                                id: 'cat',
                                name: 'Cat.',
                                field: 'Datacategory',
                                minwidth: 10,
                                width: 40,
                                cssClass: "cell-title"
                            }, )
                        }

                        grid.setColumns(columns);
                        grid.setData(DatasetsOfDatasourceSet.source.localdata);
                        dataView.beginUpdate();
                        dataView.setItems(DatasetsOfDatasourceSet.source.localdata, "id");
                        dataView.endUpdate();

                        grid.invalidate();
                        grid.render();

                        var toggled = getCookie('btnHideAdditInfo');
                        if (toggled == 'true') {
                            showAdditInfo();
                        } else {
                            hideAdditInfo();
                        }

                        refreshPagination();
                        CreateNavigationRow();
                        // resizeColumns('jqxgrid');

                        let categoryURL = (DatasetsOfDatasourceSet.Request.CategoryFilter !== undefined) ? "&Category=" + DatasetsOfDatasourceSet.Request.CategoryFilter : "";
                        window.history.pushState('mydsviewer', 'mydsviewer', 'mydsviewer?Datasource=' + databaseName + '&Page=' + DatasetsOfDatasourceSet.pageCounter + categoryURL + '&rows=' + DatasetsOfDatasourceSet.Request.Rows);

                    }, null, () => {
                        // $('#jqxgrid').jqxGrid('hideloadelement');
                    });
            } else {
                // $('#jqxgrid').jqxGrid('clear');
            }

            var item = $('#jstreeCategoriesList').jstree(true).get_selected("full", true)[0];
            if (item)
                document.getElementById(item.id).children[1].style.color = "white";

            let listItems = $('#jstreeCategoriesList').jstree(true).get_json('#', {
                flat: true
            });
            for (let j in listItems) {
                if (listItems[j].id == item.id)
                    continue;
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
                if (listItems[j].id == item.id)
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

    if (!listRecords && !treeRecords) {
        // $('#mainSplitter').jqxSplitter('collapse');
    }
    /* End Categories Tree */
    // })
    // .catch(e => console.warn("Error in GetDatasource Call: ", e))

    async function updateDatasetsOfDatasourceGrid(updatepages = 'all', updatetype = true, resizecolumns = true) {

        let filter = DatasetsOfDatasourceSet.Request.Filter;
        filter = (filter !== "" && filter !== "undefined" && filter !== undefined) ? "&Filter=" + filter : "";
        let categoryF = getParameterByName('Category');
        categoryF = (categoryF !== "") ? "&Category=" + categoryF : "";

        if (DatasetsOfDatasourceSet.Request.Filter == "") delete DatasetsOfDatasourceSet.Request.Filter;

        DatasetsOfDatasourceSet.Request.SessionToken = getSession();
        
        call_api_ajax('GetDatasourceMetadata', 'get', DatasetsOfDatasourceSet.Request, false,
            (data) => {
                DatasetsOfDatasourceSet.SeriesCount = data.Result.Metadata.Datasets;
                DatasetsOfDatasourceSet.pagesCount = data.Result.Metadata.PagesCount;
                DatasetsOfDatasourceSet.pageCounter = data.Result.Metadata.Page;
                DatasetsOfDatasourceSet.source.localdata = data.Result.Datasets;
                DatasetsOfDatasourceSet.Request.Rows = (data.Result.Metadata.Rows < 50) ? 50 : data.Result.Metadata.Rows;

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
                        width: 30,
                        resizable: false,
                        formatter: imagerenderer
                    },
                    {
                        id: "symbol",
                        name: "Symbol",
                        field: "Symbol",
                        minWidth: 20,
                        width: 80,
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
                        maxWidth: 400,
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
                        width: 80,
                        sortable: true,
                        cssClass: "cell-title"
                    },
                    {
                        id: "to",
                        name: "To",
                        field: "EndDate",
                        minWidth: 20,
                        width: 80,
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
                        cssClass: "cell-title",
                        formatter: additional_renderer
                    },
                ];

                if (isCategory) {
                    columns.splice(2, 0, {
                        id: 'cat',
                        name: 'Cat.',
                        field: 'Datacategory',
                        minwidth: 10,
                        width: 40,
                        cssClass: "cell-title"
                    }, )
                }

                grid.setColumns(columns);
                grid.setData(DatasetsOfDatasourceSet.source.localdata);
                dataView.beginUpdate();
                dataView.setItems(DatasetsOfDatasourceSet.source.localdata, "id");
                dataView.endUpdate();

                grid.invalidate();
                grid.render();

                var toggled = getCookie('btnHideAdditInfo');
                if (toggled == 'true') {
                    showAdditInfo();
                } else {
                    hideAdditInfo();
                }

                if (updatepages == true) refreshPagination();
                window.history.pushState('mydsviewer', 'mydsviewer', 'mydsviewer?Datasource=' + databaseName + '&Page=' + DatasetsOfDatasourceSet.pageCounter + filter + categoryF + '&rows=' + DatasetsOfDatasourceSet.Request.Rows);

                refreshPagination();
                // resizeColumns('jqxgrid');
                CreateNavigationRow();
            });
    }

    var imagerenderer = function (row, cell, value, columnDef, dataContext) {
        if (value)
            return '<div><img id="seriesStartIcon" ' +
                ' height="17" width="17" ' +
                'src="resources/css/icons/star_icon.png"/></div>';
        else
            return '';
    }

    function copySelectedSeriesToClipboard(id) {
        var rowsindexes = grid.getSelectedRows();
        var rows = [],
            column = grid.getColumns();

        let firstRow = [];
        for (var c in column) {
            if (!column[c].hidden && column[c].field !== "" && column[c].field !== "Favorite" && column[c].field !== "id")
                firstRow.push(column[c].text);
        }
        rows.push(firstRow);

        var arr = [];
        for (var i = 0; i < rowsindexes.length; i++) {
            let row = grid.getDataItem(rowsindexes[i]);

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
        // functionNotificationMessage({ text: rows.length - 1 + " series " + singleCase + " been copied to the clipboard" });
    }

    function removeSeriesFromFavorites() {
        
        var rowsindexes = grid.getSelectedRows()
        rowsindexes.sort(function (a, b) {
            return a - b;
        });
      
        dialogWindow("Remove "+rowsindexes.length+" series from your Favorites list?", "query", "confirm", null, () => {
            var rows = [],
                deleted = [],
                deleted_symbol = [];
            for (var i = 0; i < rowsindexes.length; i++) {
                var row = grid.getDataItem(rowsindexes[i]);

                if (row.Favorite) {
                    if (row.Datacategory !== undefined)
                        deleted.push(databaseName + '/' + row.Datacategory + '/' + row.Symbol);
                    else
                        deleted.push(databaseName + '/' + row.Symbol);

                    deleted_symbol.push(row.Symbol);
                }

                rows.push(row);
            }

            call_api_ajax('RemoveUserFavoriteDatasets', 'get', {
                SessionToken: getSession(),
                "Series[]": deleted
            }, false, () => {

                rows.forEach(function (item, i, indexes1) {
                    if (item.Favorite == true) {
                        item.Favorite = false;
                        dataView.updateItem(item.id, item);
                    }
                });

                var singleCase = deleted_symbol.length == 1 ? " has" : "s have";
                // functionNotificationMessage({ text: "You have successfully added " + rowsindexes.length + " series to your Favorites list" });
                functionNotificationMessage({
                    text: deleted_symbol.length + ' symbol' + singleCase + ' been removed from favorites list',
                    type: "info"
                });
            });
        });
    }

    var cellclassCorrections = function (row, columnfield, value, rowdata) {
        if (value > 0)
            return 'correction-cell';

        return;
    }

    var symbol_renderer = function (row, field, value, html, columnproperties, record) {
        return '<a target="_blank">' + value + '</a>';
    }

    var additional_renderer = function (row, datafield, value, html, columnproperties, record) {
        var txt = JSON.stringify(value);
        // $(".popup-content").html( txt )
        if (value != undefined)
            var showVal = 'View Object';
        else
            var showVal = '';

        return '<a target="_blank">' + showVal + '</a>';
    }

    //removes the "active" class to .popup and .popup-content when the "Close" button is clicked 
    $(".close, .popup-overlay").on("click", function () {
        $(".popup-overlay, .popup-content").removeClass("active");
    });


    // initialize jqxGrid

    function isIEPreVer9() {
        var v = navigator.appVersion.match(/MSIE ([\d.]+)/i);
        return (v ? v[1] < 9 : false);
    }

    function CreateAddHeaderRow() {

        var fullWidthFlag = true;
        let img = (!fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
        let footer_width = (!fullWidthFlag) ? '100%' : '1230px';

        $("#main-footer").width(footer_width);
        $(".fullWidthPage").jqxButton({
            imgSrc: "resources/css/icons/" + img + ".png",
            imgPosition: "left",
            width: '26',
            textPosition: "right"
        });
        $(".fixpage").toggleClass('fullscreen', !fullWidthFlag);
        $("section .wrap").toggleClass('fullscreen', !fullWidthFlag);

        // Define buttons
        $("#btnCopySeriesToFavorite").jqxButton({
            imgSrc: "resources/css/icons/starAdd16.png",
            imgPosition: "left",
            width: 125,
            height: 24,
            textPosition: "right"
        });
        $("#btnExportSeries").jqxButton({
            imgSrc: "resources/css/icons/filesave.png",
            imgPosition: "left",
            width: 25,
             height: 24,
             imgWidth: 16,
             imgHeight: 16
        });
        $("#btnRefreshSeries").jqxButton({
            imgSrc: "resources/css/icons/reload.png",
            imgPosition: "left",
            width: 25,
             height: 24,
             imgWidth: 16,
             imgHeight: 16
        });
        $("#btnAutosize").jqxButton({
            imgSrc: "resources/css/icons/autosize.png",
            imgPosition: "center",
            width: 25,
            height: 24,
            imgWidth: 16,
            imgHeight: 16
        });
        $("#btnHideAdditInfo").jqxToggleButton({
            imgSrc: "resources/css/icons/table_plus.png",
            imgPosition: "center",
            width: 25,
             height: 24,
             imgWidth: 16,
             imgHeight: 16
        });
        $("#btnHideShowEmptyRecords").jqxToggleButton({
            imgSrc: "resources/css/icons/ShowRows2_16.png",
            imgPosition: "center",
            width: 25,
             height: 24,
             imgWidth: 16,
             imgHeight: 16
        });


        $("#fullWidth1").on('click', function () {
            img = (fullWidthFlag) ? 'fullscreen1' : 'fullscreen';
            footer_width = (fullWidthFlag) ? '100%' : '1230px';
            footer_posLeft = (fullWidthFlag) ? '0' : '';
            // console.log(footer_posLeft);
            // $("#main-footer").width(footer_width);
            $(".footerbar").css("max-width", footer_width);
            // if(fullWidthFlag)
            $(".footerbar").css("left", footer_posLeft);
            // else
            //     $(".footerbar").css("left", "");

            $(".fullWidthPage").jqxButton({
                imgSrc: "resources/css/icons/" + img + ".png",
                imgPosition: "left",
                width: '26',
                textPosition: "right"
            });
            $(".fixpage").toggleClass('fullscreen', fullWidthFlag);
            $("section .wrap").toggleClass('fullscreen', fullWidthFlag);

            fullWidthFlag = !fullWidthFlag;
            setCookie('fullWidth1', fullWidthFlag);
            window.dispatchEvent(new Event('resize'));

            var toggled = getCookie('btnHideAdditInfo');
            if (toggled == 'true') {
                showAdditInfo();
            } else {
                hideAdditInfo();
                grid.render();
            }
        });

        $("#searchBox").jqxInput({
            placeHolder: "Enter filter text",
            height: 25,
            width: 300,
            minLength: 1
        });
        $(".HelpMessage").eq(0).jqxPopover({
            width: 400,
            offset: {
                left: -50,
                top: 0
            },
            arrowOffsetValue: 50,
            title: "Search Filter Help",
            showCloseButton: true,
            selector: $("#helpIcon2")
        });

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

        $("#searchBtn").click(function (evt) {
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
            if(getSession() == undefined || getSession() == ""){
                openLoginPopup();
            }
            else{
                makeExportSeriesDialog();
            }
        });
        $("#btnRefreshSeries").on('click', function () {
            // updateDatasetsOfDatasourceGrid();
            var toggled = getCookie('btnHideAdditInfo');
            if (toggled == 'true') {
                showAdditInfo();
            } else {
                hideAdditInfo();
            }
        });

        $("#btnCopySeriesToCategory").on('click', function () {
            if(getSession() == undefined || getSession() == ""){
                openLoginPopup();
            }
            else{
                makeAndFillCategotyWindow();
            }
        });

        $("#btnCopySeriesToFavorite").on('click', function () {
            if(getSession() == undefined || getSession() == ""){
                openLoginPopup();
            }
            else{
                copySeriesToFavorite();
            }
        });

        $("#btnAutosize").on('click', function () {
            // resizeColumns('jqxgrid');
            // grid.autosizeColumns();

            var toggled = getCookie('btnHideAdditInfo');
            if (toggled == 'true') {
                showAdditInfo();
            } else {
                hideAdditInfo();
            }
        });

        $("#fullWidth1").jqxTooltip({
            content: 'Toggle grid to full screen width',
            position: 'mouse',
            name: 'movieTooltip'
        });
        $("#btnAutosize").jqxTooltip({
            content: 'Autosize columns',
            position: 'mouse',
            name: 'movieTooltip'
        });
        $("#btnHideAdditInfo").jqxTooltip({
            content: 'Show additional data columns',
            position: 'mouse',
            name: 'movieTooltip'
        });
        $("#btnHideShowEmptyRecords").jqxTooltip({
            content: 'Show records with no values',
            position: 'mouse',
            name: 'movieTooltip'
        });
        $("#btnRefreshSeries").jqxTooltip({
            content: 'Refresh the metadata in the table',
            position: 'mouse',
            name: 'movieTooltip'
        });
        $("#btnExportSeries").jqxTooltip({
            content: 'Save the metadata to local machine',
            position: 'mouse',
            name: 'movieTooltip'
        });

        $("#btnHideAdditInfo").on('click', function () {
            setCookie('btnHideAdditInfo', $("#btnHideAdditInfo").jqxToggleButton('toggled'));
            var toggled = getCookie('btnHideAdditInfo');
            if (toggled == 'true') {
                showAdditInfo();
                $("#btnHideAdditInfo").jqxTooltip({
                    content: 'Hide additional data columns',
                    position: 'mouse',
                    name: 'movieTooltip'
                });
                $("#showHideAddInfo").text("Hide additional columns");
                showAdditionalInformation = true;
            } else {
                hideAdditInfo();
                $("#btnHideAdditInfo").jqxTooltip({
                    content: 'Show additional data columns',
                    position: 'mouse',
                    name: 'movieTooltip'
                });
                $("#showHideAddInfo").text("Show additional columns");
                showAdditionalInformation = false;
            }
        });

        $("#btnHideShowEmptyRecords").on('click', function () {
            if(getSession() == undefined || getSession() == ""){
                openLoginPopup();
            }
            else{
                var toggled = $("#btnHideShowEmptyRecords").jqxToggleButton('toggled');
                hideEmpty = !toggled;

                if (toggled) {
                    DatasetsOfDatasourceSet.Request.Page = 1;
                    DatasetsOfDatasourceSet.Request.IgnoreEmpty = false;
                    updateDatasetsOfDatasourceGrid();

                    $("#btnHideShowEmptyRecords").jqxTooltip({
                        content: 'Hide records with no values',
                        position: 'mouse',
                        name: 'movieTooltip'
                    });
                    $("#showHideEmptyRecords").text("Hide empty records");
                    $("#btnHideShowEmptyRecords").jqxToggleButton({
                        imgSrc: "resources/css/icons/HideRowsGn_16.png",
                        imgPosition: "center",
                        width: 25,
                        height: 25
                    });
                } else {
                    DatasetsOfDatasourceSet.Request.Page = 1;
                    DatasetsOfDatasourceSet.Request.IgnoreEmpty = true;
                    updateDatasetsOfDatasourceGrid();

                    $("#btnHideShowEmptyRecords").jqxTooltip({
                        content: 'Show records with no values',
                        position: 'mouse',
                        name: 'movieTooltip'
                    });
                    $("#showHideEmptyRecords").text("Show empty records");
                    $("#btnHideShowEmptyRecords").jqxToggleButton({
                        imgSrc: "resources/css/icons/ShowRows2_16.png",
                        imgPosition: "center",
                        width: 25,
                        height: 25
                    });
                }
            }
        });

        if (showAdditionalInformation) {
            $('#btnHideAdditInfo').jqxToggleButton('toggle');
            $("#btnHideAdditInfo").jqxTooltip({
                content: 'Hide additional data columns',
                position: 'mouse',
                name: 'movieTooltip'
            });
            $("#showHideAddInfo").text("Hide additional columns");
        } else {
            $("#btnHideAdditInfo").jqxTooltip({
                content: 'Show additional data columns',
                position: 'mouse',
                name: 'movieTooltip'
            });
            $("#showHideAddInfo").text("Show additional columns");
        }
    }

    function CreateNavigationRow() {
        var element = $("<div id='pagerender-element'></div>");
        var left_element = $("<div id='pagerender-last-element'></div>");

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

        var label = $("<div id='page-lable1'>Page <input type='text' id='dataPageNymber' value='0'> of <span id='numOfAllPages'>0</span></div>");
        label.appendTo(element);

        var label2 = $("<div id='page-lable2'> Rows: </div>");
        label2.appendTo(element);

        var dropdown = $('<div id="jqxPageDropDownList" style="float: left;"></div>');
        var dropListSource = [50, 100, 250, 500];
        var index = dropListSource.indexOf(DatasetsOfDatasourceSet.Request.Rows);
        if (index == -1) {
            index = dropListSource.indexOf(parseInt(getParameterByName("rows")));
            index = index == -1 ? 1 : index;
        }
        dropdown.jqxDropDownList({
            source: dropListSource,
            selectedIndex: index,
            width: 55,
            height: 17,
            autoDropDownHeight: true,
            enableBrowserBoundsDetection: true
        });
        dropdown.on('change', async function (event) {
            if(getSession() == undefined || getSession() == ""){
                openLoginPopup();
            }
            else{
                var args = event.args;
                if (args) {
                    var item = args.item;
                    DatasetsOfDatasourceSet.pageSelectedIndex = item.index;
                    DatasetsOfDatasourceSet.pageSize = parseInt(item.label);
                    DatasetsOfDatasourceSet.pageCounter = 1;
                    DatasetsOfDatasourceSet.Request.Rows = parseInt(item.label);
                    DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                    updateDatasetsOfDatasourceGrid();
                }
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
            if(getSession() == undefined || getSession() == ""){
                openLoginPopup();
            }
            else{
                if (parseInt($(this).attr('data-page')) !== DatasetsOfDatasourceSet.Request.Page) {
                    DatasetsOfDatasourceSet.pageCounter = parseInt($(this).attr('data-page'));
                    DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                    updateDatasetsOfDatasourceGrid(true, 'all', false);
                }
            }
        });

        pageButtonToLast.click(async function () {
            if(getSession() == undefined || getSession() == ""){
                openLoginPopup();
            }
            else{
                if (DatasetsOfDatasourceSet.pageCounter !== DatasetsOfDatasourceSet.pagesCount) {
                    DatasetsOfDatasourceSet.pageCounter = DatasetsOfDatasourceSet.pagesCount;
                    DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                    updateDatasetsOfDatasourceGrid(true, 'all', false);
                }
            }
        });

        rightPageButton.click(async function () {
            if(getSession() == undefined || getSession() == ""){
                openLoginPopup();
            }
            else{
                if (DatasetsOfDatasourceSet.pageCounter !== DatasetsOfDatasourceSet.pagesCount) {
                    DatasetsOfDatasourceSet.pageCounter++;
                    DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                    updateDatasetsOfDatasourceGrid(true, 'all', false);
                }
            }
        });

        pageButtonToFirst.click(async function () {
            if(getSession() == undefined || getSession() == ""){
                openLoginPopup();
            }
            else{
                if (DatasetsOfDatasourceSet.pageCounter !== 1) {
                    DatasetsOfDatasourceSet.pageCounter = 1;
                    DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                    updateDatasetsOfDatasourceGrid(true, 'all', false);
                }
            }
        });

        leftPageButton.click(async function () {
            if(getSession() == undefined || getSession() == ""){
                openLoginPopup();
            }
            else{
                if (DatasetsOfDatasourceSet.pageCounter !== 1) {
                    DatasetsOfDatasourceSet.pageCounter--;
                    DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
                    updateDatasetsOfDatasourceGrid(true, 'all', false);
                }
            }
        });

        var new_element = $('<div>').append(left_element);
        new_element.append(element);
        $('#pager').html(new_element);
    }

    var cellsrenderer = function (row, column, value) {
        return '<div style="text-align: center; margin-top: 5px;">' + value + '</div>';
    }
    var columnsrenderer = function (value) {
        return '<div style="text-align: center; margin-top: 5px;">' + value + '</div>';
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
            minWidth: 80,
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
            maxWidth: 450,
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
        grid.setTopPanelVisibility(!grid.getOptions().showTopPanel);
    }

    $(function () {
        // prepare the data
        var isCategory = false;
        for (var i = 0; i < DatasetsOfDatasourceSet.source.localdata.length; i++) {
            DatasetsOfDatasourceSet.source.localdata[i].id = "id_" + i;
            DatasetsOfDatasourceSet.source.localdata[i].num = (i + 1);
            // DatasetsOfDatasourceSet.source.localdata[i].Favorite = "false";

            if (DatasetsOfDatasourceSet.source.localdata[i].Datacategory != undefined)
                isCategory = true;
        }

        if (isCategory) {
            columns.splice(2, 0, {
                id: 'cat',
                name: 'Cat.',
                field: 'Datacategory',
                minwidth: 10,
                width: 40,
                cssClass: "cell-title"
            })
        }

        dataView = new Slick.Data.DataView({
            inlineFilters: true
        });
        grid = new Slick.Grid("#jqxgrid", dataView, columns, options);
        grid.setSelectionModel(new Slick.RowSelectionModel());

        // create the Resizer plugin
        // you need to provide a DOM element container for the plugin to calculate available space
        resizer = new Slick.Plugins.Resizer({
                container: '.container', // DOM element selector, can be an ID or a class name

                // optionally define some padding and dimensions
                rightPadding: 5, // defaults to 0
                bottomPadding: 10, // defaults to 20
                minHeight: 150, // defaults to 180
                minWidth: 250, // defaults to 300

                // you can also add some max values (none by default)
                // maxHeight: 1000,
                // maxWidth: 2000,
            },
            // the 2nd argument is an object and is optional
            // you could pass fixed dimensions, you can pass both height/width or a single dimension (passing both would obviously disable the auto-resize completely)
            // for example if we pass only the height (as shown below), it will use a fixed height but will auto-resize only the width
            // { height: 300 }
        );
        // grid.registerPlugin(resizer);
        resizer.resizeGrid(0, {
            height: "800",
            width: "100%"
        });

        var pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));
        // var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);

        // move the filter panel defined in a hidden div into grid top panel
        $("#inlineFilterPanel")
            .appendTo(grid.getTopPanel())
            .show();

        grid.onCellChange.subscribe(function (e, args) {
            dataView.updateItem(args.item.id, args.item);
        });

        grid.onClick.subscribe(function (e, args) {
            if (args.grid.getColumns()[2].name == "Cat.") {
                if (args.cell == 3) {
                    item = dataView.getItem(args.row);
                    openSeriesInNewTab(item.Datasource, item.Symbol, item.Datacategory);
                }
            } else {
                if (args.cell == 2) {
                    item = dataView.getItem(args.row);
                    openSeriesInNewTab(item.Datasource, item.Symbol, item.Datacategory);
                }
            }

            if (args.cell == 12) {
                item = dataView.getItem(args.row);
                var txt = JSON.stringify(item.Additional);
                // $(".popup-content").html( txt )
                if (item.Additional != undefined) {
                    setCookie('additionalJSON' + args.row, txt);
                    JqxPopup(args.row, item.Symbol);
                }
            }
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
        });

        grid.onAddNewRow.subscribe(function (e, args) {
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
            dataView.addItem(item);
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
                dataView.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortCols[0].sortAsc);
            } else {
                // using native sort with comparer
                // preferred method but can be very slow in IE with huge datasets
                dataView.sort(comparer, args.sortCols[0].sortAsc);
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

        dataView.onPagingInfoChanged.subscribe(function (e, pagingInfo) {
            grid.updatePagingStatusFromView(pagingInfo);

            // show the pagingInfo but remove the dataView from the object, just for the Cypress E2E test
            delete pagingInfo.dataView;
            console.log('on After Paging Info Changed - New Paging:: ', pagingInfo);
        });

        dataView.onBeforePagingInfoChanged.subscribe(function (e, previousPagingInfo) {
            // show the previous pagingInfo but remove the dataView from the object, just for the Cypress E2E test
            delete previousPagingInfo.dataView;
            console.log('on Before Paging Info Changed - Previous Paging:: ', previousPagingInfo);
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
        dataView.setItems(DatasetsOfDatasourceSet.source.localdata);
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

        // if (getCookie('btnHideAdditInfo') != undefined && getCookie('btnHideAdditInfo') == "true") {
        //     showAdditInfo();
        //     showAdditionalInformation = true;
        // }
        // else {
        hideAdditInfo();
        showAdditionalInformation = false;
        // }

        resizeColumns('jqxgrid');
        CreateNavigationRow()

    })


    // $("#jqxgrid").jqxGrid(
    //     {
    //         width: '100%',
    //         height: '100%',
    //         source: DatasetsOfDatasourceSet.dataAdapter,
    //         columnsresize: true,
    //         sortable: true,
    //         rowsheight: 30,
    //         columnsheight: 30,
    //         showtoolbar: true,
    //         pageable: true,
    //         enablebrowserselection: true,
    //         pagesize: pageSize,
    //         selectionmode: 'multiplerowsadvanced',
    //         deferreddatafields: ['name'],
    //         ready: function () {
    //         },
    //         rendered: function () {
    //         },
    //         toolbarheight: 37,
    //         handlekeyboardnavigation: function (event) {
    //             var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
    //             var ctrlKey = event.ctrlKey;

    //             var position = $('#jqxgrid').jqxGrid('scrollposition');
    //             var left = position.left;
    //             var top = position.top;
    //             var val = ctrlKey == true ? 50000 : 40;

    //             switch (key) {
    //                 case 37: // left
    //                     $('#jqxgrid').jqxGrid('scrolloffset', top, left - val);
    //                     return true;
    //                 case 38: // up
    //                     $('#jqxgrid').jqxGrid('scrolloffset', top - val, left);
    //                     return true;
    //                 case 36: // up Home
    //                     $('#jqxgrid').jqxGrid('scrolloffset', top - val, left);
    //                     if (ctrlKey) {
    //                         $('#jqxgrid').jqxGrid('clearselection');
    //                         $('#jqxgrid').jqxGrid('selectrow', 0);
    //                     }
    //                     return true;
    //                 case 39: // right
    //                     $('#jqxgrid').jqxGrid('scrolloffset', top, left + val);
    //                     return true;
    //                 case 40: // down
    //                     $('#jqxgrid').jqxGrid('scrolloffset', top + val, left);
    //                     return true;
    //                 case 35: // down End
    //                     $('#jqxgrid').jqxGrid('scrolloffset', top + val, left);
    //                     if (ctrlKey) {
    //                         $('#jqxgrid').jqxGrid('clearselection');
    //                         var rows = $('#jqxgrid').jqxGrid('getrows');
    //                         $('#jqxgrid').jqxGrid('selectrow', rows.length - 1);
    //                     }
    //                     return true;
    //             }
    //         },
    //         rendertoolbar: function (toolbar) {
    //         },
    //         pagerrenderer: function () {
    //         },
    //         columns: columns,
    //         autosavestate: true,
    //     });

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
        } else {
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

    $("#jqxgridMenu").jqxMenu({
        width: 200,
        height: 125,
        autoOpenPopup: false,
        mode: 'popup'
    });

    $("#jqxgridMenu").on('itemclick', function (event) {
        var args = event.args;
        switch ($.trim($(args).text())) {
            case "Add to Favourites":
                if(getSession() == undefined || getSession() == ""){
                    openLoginPopup();
                }
                else{
                    copySeriesToFavorite();
                }
                break;

            case "Remove from Favourites":
                if(getSession() == undefined || getSession() == ""){
                    openLoginPopup();
                }
                else{
                    removeSeriesFromFavorites();
                }
                break;

            case "Copy":
                if(getSession() == undefined || getSession() == ""){
                    openLoginPopup();
                }
                else{
                    copySelectedSeriesToClipboard('jqxgrid');
                }
                break;

            case "Export":
                if(getSession() == undefined || getSession() == ""){
                    openLoginPopup();
                }
                else{
                    makeExportSeriesDialog();
                }
                break;
        }
    });

    function hideAdditInfo() {
        var update_columns = [{
                id: "sel",
                name: "#",
                field: "num",
                behavior: "select",
                cssClass: "cell-title cell-right",
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
                width: 30,
                resizable: false,
                formatter: imagerenderer
            },
            {
                id: "symbol",
                name: "Symbol",
                field: "Symbol",
                minWidth: 20,
                width: 80,
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
                maxWidth: 400,
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
                width: 80,
                sortable: true,
                cssClass: "cell-title"
            },
            {
                id: "to",
                name: "To",
                field: "EndDate",
                minWidth: 20,
                width: 80,
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
        ];

        var old_columns = grid.getColumns();

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

        grid.setColumns(update_columns);
        resizeColumns('jqxgrid');
    }

    function showAdditInfo() {
        var update_columns = [{
                id: "sel",
                name: "#",
                field: "num",
                behavior: "select",
                cssClass: "cell-title cell-right",
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
                width: 30,
                resizable: false,
                formatter: imagerenderer
            },
            {
                id: "symbol",
                name: "Symbol",
                field: "Symbol",
                minWidth: 20,
                width: 80,
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
                maxWidth: 400,
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
                width: 80,
                sortable: true,
                cssClass: "cell-title"
            },
            {
                id: "to",
                name: "To",
                field: "EndDate",
                minWidth: 20,
                width: 80,
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
                cssClass: "cell-title",
                formatter: additional_renderer
            },
        ];

        var old_columns = grid.getColumns();

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

        grid.setColumns(update_columns);
        resizeColumns('jqxgrid');
    }


   

    function resizeElements() {
        //var footerheight = $(".footerbar").height();
        //$('#jqxWidget').css('height', (window.innerHeight - 120 - footerheight - 66) + 'px');


        //var footerheight = $(".footerbar").height();
        if ($(window).width() > 992) {
            $('#jqxWidget').css('height', (window.innerHeight - 190) + 'px');
            console.log('greater then 992')
        }
        else if ($(window).width() < 992) {
            $('#jqxWidget').css('height', (window.innerHeight - 160) + 'px');
            console.log('Less then 992')

        }
        else if ($(window).width() < 767) {
            $('#jqxWidget').css('height', (window.innerHeight) + 'px');
            console.log('less then 767')

        }

        if (window.innerWidth < 1000)
            $('#main-footer').css('width', (window.innerWidth + 150) + 'px');
        // else {
        //     if (window.innerWidth > 1200)
        //         $('#main-footer').css('width', (100) + '%');
        //     else
        //         $('#main-footer').css('width', '1230px');
        // }

        // var panel_height = $('.splitter-panel').css("height");
        // $('#jqxgrid').css("height", (2500))

        /*setTimeout(() => {
                resizeColumns();
                $('.slick-viewport').css('height', (panel_height.slice(0, -2) - 68));
                $('.slick-pane-top').css('top', '0px').css('height', (panel_height.slice(0, -2) - 68));
            },
            10);*/
    }

    $(window).resize(function () {
        resizeElements()
    });
    resizeElements();

});



function openSeriesInNewTab(database, series, category) {
    let category_l = (category == undefined) ? "" : category + "/",
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
    } else {
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
                SessionToken: getSession(),
                Frequency: "d",
                Series: [{
                    Datasource: database,
                    Symbol: series
                }],
                ReturnMetadata: true,
                ReturnBateStatus: true
            };
            if (category != "undefined") parameters.Series[0].Datacategory = category;

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
                    return
                } else if (data.Result.Series[0].BateStatus[0].Status > 299) {
                    dialogWindow('The server responded with "' + data.Result.Series[0].BateStatus[0].Status + '". ' + data.Result.Series[0].BateStatus[0].Detail, 'error', null, null, null, null, {
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
                    let symbol = (access.CategoryDS) ? database + "/" + category_l + series : database + "/" + category_l + series;
                    sessionStorage.setItem(symbol, JSON.stringify(data.Result.Series[0]));
                    var win = window.open("seriesviewer?symbol=" + symbol + "&tab=prices", '_blank');
                    win.focus();
                }
            }, null, () => {
                $('#loadingData').hide();
                $('body').removeClass('overlay');
            });
        }, null, null, {
            Ok: 'Yes',
            Cancel: 'No'
        });
}

function refreshSeries() {
    var indexes = grid.getSelectedRows()
    indexes.forEach(function (item, i, indexes) {
        var row = grid.getDataItem(item);
        var url = "databases/" + row.database + "/" + row.code + "/reload";

        $.post(url, function (result) {
            if (result.success && indexes.length == (i + 1)) {
                // $("#jqxgrid").jqxGrid('updatebounddata', 'cells');
            } else if (!result.success)
                apprise("Failed reload series " + row.code);

        }, 'json');
    });
}

function copySeriesToFavorite() {
    var indexes = grid.getSelectedRows();
    if (indexes.length < 1)
        dialogWindow("Please, select at least one series", "error");
    else {
        var array = [],
            rows = [];
        indexes.forEach(function (item, i, indexes) {
            var row = grid.getDataItem(item);
            if (!row.Favorite) {
                let cate = (row.Datacategory == undefined) ? "" : row.Datacategory + '/';
                array.push(databaseName + '/' + cate + row.Symbol);
                rows.push(row);
            }
        });

        dialogWindow("Do you want to add " + rows.length + " series to favorites list?", "query", "confirm", null,
            () => {
                call_api_ajax('AddUserFavoriteDatasets', 'get', {
                        SessionToken: getSession(),
                        "Series[]": array
                    }, false,
                    () => {
                        rows.forEach(function (item, i, indexes1) {
                            if (!item.Favorite) {
                                item.Favorite = true;
                                dataView.updateItem(item.id, item);
                            }
                        });

                        functionNotificationMessage({
                            text: "You have successfully added " + rows.length + " series to your Favorites list"
                        });
                    });
            });
    }
}

function markAsForceUpdate() {
    var indexes = grid.getSelectedRows();
    if (indexes.length < 1)
        return;
    indexes.forEach(function (item, i, indexes) {
        var row = grid.getDataItem(item);

        $.get("databases/" + row.database + "/" + row.code + "/markForceUpdate", function (result) {
            if (!result.success)
                apprise(result.errorMsg);
            else {
                row.force_update = true;
                dataView.updateItem(item.id, item);
            }
        });
    });
}

function markAsNotForceUpdate() {
    var indexes = grid.getSelectedRows();
    if (indexes.length < 1)
        return;
    indexes.forEach(function (item, i, indexes) {
        var row = grid.getDataItem(item);

        $.get("databases/" + row.database + "/" + row.code + "/markNotForceUpdate", function (result) {
            if (!result.success)
                apprise(result.errorMsg);
            else {
                row.force_update = false;
                dataView.updateItem(item.id, item);
            }
        });
    });
}

function initCategoryList() {
    var source = {
        datatype: "json",
        datafields: [{
                name: 'code'
            },
            {
                name: 'title'
            }
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
    var indexes = grid.getSelectedRows();
    if (indexes.length < 1)
        return;
    var row = grid.getDataItem(indexes[0]);

    $('#categoryAddDialogWindow').jqxWindow('open');
    initCategoryList();

    $("#acSymbol").text(row.code);
    $("#acSeries").text(row.name);
}

function addToCategorySelectedSeries() {
    var indexes = grid.getSelectedRows();
    var category = $("#categoryDropdownList").jqxDropDownList('getSelectedItem').value;

    indexes.forEach(function (item, i, indexes) {
        var row = grid.getDataItem(item);
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
            apprise(message, {
                'verify': true
            }, function (r) {
                if (r) {
                    var parameters = {
                        database_code: row.database,
                        dataset_code: row.code
                    };
                    var url = "idm-customer-categories/settings/" + category + "/updateSeries";
                    $.post(url, parameters);
                    $('#categoryAddDialogWindow').jqxWindow('close');
                }
            });
        } else {
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
        $('#addCategoryButton').jqxButton({
            width: '70px',
            height: '34px'
        });
        $("#addCategoryButton").on('click', function () {
            addToCategorySelectedSeries();
        });

        $('#cancelCategoryButton').jqxButton({
            width: '90px',
            height: '34px'
        });
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
        $('#exportSeriesBtn').jqxButton({
            width: '75px',
            height: '30px'
        });
        $("#exportSeriesBtn").on('click', function () {
            exportSeries();
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
    var rows = grid.getData().getPagingInfo().totalRows;
    $('#exportDialogWindow #num').text(rows);
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
        var indexes = grid.getSelectedRows()

        if (indexes.length == 0) {
            dialogWindow("Please, select at least one series", "error");
            return;
        } else {
            indexes.forEach(function (item, i, indexes) {
                rows = grid.getDataItem(item);
                datasets.push([databaseName, rows.Symbol, rows.Description, rows.Frequency, getDateInFormat(rows.StartDate), getDateInFormat(rows.EndDate), rows.Values]);
            });
        }
    } else if (export_type == "all") {
        var items = dataView.getItems();

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