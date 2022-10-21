	var globalMoveFolders=false;
	var conversions_renderer = function (row, datafield, value, html, columnproperties, record) 
	{
		var ret = '';
		if(value.length > 0 )
		{
			value.forEach((e)=>{
				ret += '<div>'+e.ConvertTo+': '+e.ConvertOperator+e.ConvertValue+'</div>';
			});
			
			return ret;
		}
		return '<span>N/A</span>';
//		if(record == undefined) return '';
//		return '<div class="jqx-grid-cell-left-align" style="margin-top: 12.5px;"><a target="_blank" onclick="return openSeriesInNewTab(\'' + record.Datasource + '\',\'' + value + '\')">' + value + '</a></div>';
	}
	
	var symbol_renderer = function (row, datafield, value, html, columnproperties, record) 
	{
		if(record == undefined) return '';
		return '<div class="jqx-grid-cell-left-align" style="margin-top: 12.5px;"><a target="_blank" onclick="return openSeriesInNewTab(\'' + record.Datasource + '\',\'' + value + '\')">' + value + '</a></div>';
	}
	var imagesMap;
	var databaseColumnRender = function (row, columnfield, value, defaulthtml, columnproperties) {
		var databaseImage;
		if(imagesMap.get(value)) databaseImage = imagesMap.get(value);
		else databaseImage = 'default_white.png';
		return '<div style="margin-top:8px;"> <img style="width:30px;height:30px;margin-right:5px;" src="' + databaseImage + '"></img>'+value+'</div>';
	}
	
	var favoritesGridSource, favoritesGridDataAdapter;
	var baseDataFields = [
		{ name: 'Symbol', type: 'string' },
		{ name: 'Datacategory', type: 'string' },
		{ name: 'Description', type: 'string' },
		{ name: 'Datasource', type: 'string' },
		{ name: 'Frequency', type: 'string' },
		{ name: 'Currency', type: 'string' },
		{ name: 'Unit', type: 'string' },
//		{ name: 'Icon', type: 'string' },
		{ name: 'Logo', type: 'string' },
		{ name: 'DecimalPlaces', type: 'int' },
		{ name: 'Bates', type: 'array' },
		{ name: 'BateIndex', type: 'array' },
		{ name: 'Conversions', type: 'array' },
		{ name: 'Values', type: 'int' },
		{ name: 'Corrections', type: 'int' },
		{ name: 'Premium', type: 'boolean' },
		{ name: 'Subscription', type: 'string' },
		{ name: 'Additional', type: 'string' },
		{ name: 'Favorite', type: 'boolean' },
		{ name: 'StartDate', type: 'date'},
		{ name: 'EndDate', type: 'date'},
		{ name: 'Conversions', type: 'string'}
	];
	var baseGridColumns = [
		{ text: 'Datasource', datafield: 'Datasource', cellsalign: 'center', align: 'center', minwidth: 100, cellsrenderer:databaseColumnRender},
		{ text: 'Symbol', groupable: false, datafield: 'Symbol', cellsalign: 'center', align: 'center', minwidth: 100, cellsrenderer:symbol_renderer},
		{ text: 'Description', groupable: false, datafield: 'Description', cellsalign: 'left', align: 'center', minwidth: 300},
		{ text: 'Frequency', groupable: false, datafield: 'Frequency', cellsalign: 'center', align: 'center', minwidth: 80},
		{ text: 'From', groupable: false, datafield: 'StartDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'center', align: 'center', minwidth: 80},
		{ text: 'To', groupable: false, datafield: 'EndDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'center', align: 'center', minwidth: 80},
		{ text: '# Prices', groupable: false, datafield: 'Values', filtertype: 'number', cellsalign: 'center', align: 'center', minwidth: 80},
		{ text: 'Currency', datafield: 'Currency', sortable: false, cellsalign: 'left', align: 'center', width: 30,minwidth:75,width:75, hidden: true},
		{ text: 'Decimal', datafield: 'DecimalPlaces', sortable: false, cellsalign: 'left', align: 'center',minwidth:65, width:65, hidden: true},
		{ text: 'Unit', datafield: 'Unit', sortable: false, cellsalign: 'left', align: 'center', minwidth:50, width:50, hidden: true},
		{ text: 'ConvertTo', datafield: 'Conversions', sortable: false, cellsalign: 'left', align: 'center', minwidth:50, width:50, hidden: true, cellsrenderer:conversions_renderer},
		{ text: 'Additional', datafield: 'Additional', sortable: false, cellsalign: 'left', align: 'center',minwidth:150,width: 150, hidden: true}
	];
	
	var ChangableGridColumns = {
		Values:1,
		To:2,
		From:3,
		Frequency:4		
	};

	async function refreshFavouritesGrid()
	{
		const data = userFavorites;
		const folderStruct = $('#jqxTree').jqxTree('getSelectedItem');
		let searchList = [];
		var search = $("#searchBox").val();
		if(search=='' || search == undefined ){
			search = '';
			data.forEach((e) => {
				folderStruct.value.items.forEach((f) => {
					if(e.Symbol === f.Symbol) searchList.push(e)
				})
			})
		}
		else {
			data.forEach(function (e,index){
				if(e.Symbol.search(search) != -1 || e.Description.search(search) != -1 ) searchList.push(e)
			})
		}
		favoritesGridSource.localdata = searchList;
		$("#activeJqxgrid").jqxGrid('updatebounddata', 'cells');
	}
	$(document).ready(function() {
		$("#navbar-external-favorites").load("navbar_external_favorites.html");
    });
    
    function resizeColumns(grid_id)
	{
		var grid =  $("#"+grid_id);
		
		var columns = grid.jqxGrid('columns');
		if( columns.records != undefined) {
			columns = columns.records;
//			alert(grid_id+ ' records');
		} 
//		else alert(grid_id+' direct');
		
		grid.jqxGrid('autoresizecolumns');
		var width = grid.width();
		var ci = {};
		var columns_width = {},widthWithoutDescription=0;
		var descriptionWidth = grid.jqxGrid('getcolumnproperty','Description','width');
		var descriptionMinWidth = grid.jqxGrid('getcolumnproperty','Description','minwidth');
		columns.forEach((e,index)=>{
			var hidden = grid.jqxGrid('getcolumnproperty',e.datafield,'hidden');
			if(hidden == undefined ) hidden = false;
			columns[index]['hidden'] = hidden;
			if( hidden == false )
			{
				var w = grid.jqxGrid('getcolumnproperty',e.datafield,'width');
				columns_width[e.datafield] = w;
				columns[index]['width'] = w;
				if( e.datafield != 'Description' ) widthWithoutDescription += w;
				ci[e.datafield] = index;
			}
		});
		
		if( descriptionWidth + widthWithoutDescription > width )
		{
			if( descriptionMinWidth + widthWithoutDescription < width ) descriptionWidth = width - widthWithoutDescription;
			else descriptionWidth = descriptionMinWidth;
		} else
		{
			descriptionWidth = width - widthWithoutDescription;
		}
		columns[ci['Description']]['width'] = descriptionWidth;
		grid.jqxGrid({columns:columns});
		grid.jqxGrid('refresh');

	}
	function buildMap(obj) 
	{
		let map = new Map();
		var keys = Object.keys(obj);
		keys.forEach(function(key, i, keys) {
			map.set(key, obj[key]);
		});
		return map;
	}
	
	let sessionToken = getParameterByName('SessionToken');
	let databaseImages, databaseNames, userFavorites, userBackups,folderStructure,objectFavorites, userDeletedFavorites;
	var userDatasources;
	try 
	{
		let as = async () => {
			userDatasources = await getUserDataSources(sessionToken);
			databaseImages = createImageMap(userDatasources);
			databaseNames = createNameMap(userDatasources);
			objectFavorites = await getUserFavorites(sessionToken);
			userFavorites = objectFavorites.Datasets;
			folderStructure = await createFolderStructure(objectFavorites,sessionToken);
			userDeletedFavorites = await getDeletedUserFavorites(sessionToken);
		};
		as().then(function()
		{
			finish();
		});
	}
	catch(e)
	{
		console.log('exception '+e);
	}
	var theme = 'arctic';

	var disactiveSource,disactiveDataAdapter;
	function finish()
	{
		var deletedFavorites = [];
		imagesMap = buildMap(databaseImages);
		var namesMap = buildMap(databaseNames);
		var seriesToAdd;
		var folderToAdd;
		var lastTreeItem;
		var sourceTreeItem;
		
//		$.jqx.theme = 'arctic';
		
		$("#infoMessageNotification").jqxNotification({
		    width: 250,
		     position: "top-left", 
		     opacity: 1,
		     autoOpen: false, 
		     animationOpenDelay: 500, 
		     autoClose: true, 
		     autoCloseDelay: 5000,
		     template: "info"
		});
	        var toThemeProperty = function (className) {
	    	    return className + " " + className + "-" + theme;
        	};
	     
		var activeGridColumns = [
                  { text: 'Datasource', datafield: 'Datasource', cellsalign: 'center', align: 'center', minwidth: 100, cellsrenderer:databaseColumnRender},
                  { text: 'Symbol', groupable: false, datafield: 'Symbol', cellsalign: 'center', align: 'center', minwidth: 100,cellsrenderer:symbol_renderer},
                  { text: 'Description', groupable: false, datafield: 'Description', cellsalign: 'left', align: 'center', minwidth: 300},
                  { text: 'Frequency', groupable: false, datafield: 'Frequency', cellsalign: 'center', align: 'center', minwidth: 80},
                  { text: 'From', groupable: false, datafield: 'StartDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'center', align: 'center', minwidth: 80},
                  { text: 'To', groupable: false, datafield: 'EndDate', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'center', align: 'center', minwidth: 80},
                  { text: '# Prices', groupable: false, datafield: 'Values', filtertype: 'number', cellsalign: 'center', align: 'center', minwidth: 80}
        	];
	        
	    var littleFlag = 0;
		$(document).ready(function () 
		{
		    loadDropdown();
        	    function resizeElements()
        	    {
    			var contentBottomPadding = parseInt( $(".main-content").css("padding-bottom") );
    			$('#jqxWidget').css('height', (window.innerHeight - $(".navbar").height() - contentBottomPadding - 35) + 'px');
//    			console.log($("#activeJqxgrid").width());
    		    }
    		    $( window ).resize(function() 
    		    {
			if(littleFlag === 0)
			{
				littleFlag = 1;
				window.dispatchEvent(new Event('resize'));
				setTimeout(function() { littleFlag = 0; }, 1000);
			}
    			resizeElements();
    		    });
    		    (function () 
    		    {
			if(littleFlag === 0)
			{
				littleFlag = 1;
				window.dispatchEvent(new Event('resize'));
				setTimeout(function() { littleFlag = 0; }, 1000);
			}
    			resizeElements();
    		    }());
        	    $('#jqxTabs').on('created',function()
        	    {
			resizeColumns('gridDatasetsOfDatasource');        	    
//        	    	alert('jqxTab created');
        	    });
        	    $('#jqxTabs').jqxTabs({ width: '100%', height: '100%', position: 'top',keyboardNavigation:false });
        	    var requestedTab = getParameterByName('tab');
        	    if(requestedTab != null && requestedTab != '') {
            		if(requestedTab == 'databases'){
            		    $('#jqxTabs').jqxTabs('select', 1);
            		} else if(requestedTab == 'deleted') {
            		    $('#jqxTabs').jqxTabs('select', 2);
            		}
        	    }
        	    $('#jqxTabs').on('selected', function (event) {
            		var tab;
            		switch(event.args.item){
	            	    case 0:
            			tab = "favorites"
            			break;
            		    case 1:
            			tab = "databases"
            			break;
            		    case 2:
            			tab = "deleted"
            			break;
            		}
            		window.history.pushState("UserFavorites", "UserFavorites", "/?tab=" + tab+'&SessionToken='+sessionToken);
        	    });
            
	    	var disactiveCols;
        	var dataFieldsDisactive = [
        		{ name: 'DateTime', type: 'string' }
        	];
        	dataFieldsDisactive = dataFieldsDisactive.concat(baseDataFields);
	    	
	        disactiveSource =
	        {
	        	datatype: "json",
	        	datafields: dataFieldsDisactive,
	        	localdata:  userDeletedFavorites
	        };
	        disactiveDataAdapter = new $.jqx.dataAdapter(disactiveSource, {});

            var disactiveGroupsrenderer = function (text, group, expanded, data) {
            	if (data.groupcolumn.datafield == 'alias') {
            		if(imagesMap.get(data.subItems[0].alias))
            			databaseImage = imagesMap.get(data.subItems[0].alias);
            		else
            			databaseImage = 'default_white.png';
            		
            		return '<div class="' + toThemeProperty('jqx-grid-groups-row') + '" style="position: absolute; margin-top:-15px;">' + 
                    	'<img style="width:30px;height:30px;" src="resources/css/icons/databases/' + databaseImage + '"></img>' + 
                    	'<span> ' + namesMap.get(data.subItems[0].alias) + '</span></div>';
            		
            	}
            }

		function changeNodeWithChilds(elem,method,elems)
		{
			if(method != 'expandItem' && method != 'collapseItem') return;
			$('#jqxTree').jqxTree(method,elem);
			if(elem.hasItems === true )
			{
				var id = elem.id;
				elems.forEach(function(el)
				{
					if(el.parentId == id ) changeNodeWithChilds(el,method,elems);
				});
			}
		}
        	var lastColumn = [
        	{ text: 'Deletion DateTime', datafield: 'DateTime', cellsalign: 'center', align: 'center', minwidth: 140}];
        	var columnsDisactive = baseGridColumns.concat(lastColumn);
		$("#disactiveJqxgrid").jqxGrid(
		{
			handlekeyboardnavigation:keyboardNavigation,
			width: '100%',
			height: '100%',
			source: disactiveDataAdapter,
			columnsresize: true,
			rowsheight: 40,
			
                  sortable: true,
                  showtoolbar: true,
                  showfilterrow: false,
                  filterable: true,
                  groupable: false,
                  groupsrenderer: disactiveGroupsrenderer,
                  selectionmode: 'multiplerowsadvanced',

//                deferreddatafields: ['database_code'],
//                  scrollmode: 'deferred',

                  ready: function () {
//                  	alert('disactive ready');
			resizeColumns('disactiveJqxgrid');
//                  	disactiveCols = $("#disactiveJqxgrid").jqxGrid("columns");
//                  	autoresizeColumnsManually(disactiveDataAdapter, "disactiveJqxgrid");
                  },
                  rendertoolbar: function (toolbar) {
                      var me = this;
                      var container = $("<div style='margin: 5px;width:100%;'></div>");
                      toolbar.append(container);
      				
                      container.append('<table style="width:100%;"><tr>' + 
                      '<td style="width:100%;"> <input id="btnRestore" type="button" value="Restore to Favorites"></td>' +
                      '<td align="right"><input id="btnRemove" title="Permanently remove from favorites list" style="margin-right:10px;" type="button" value="Delete" ></td>' + 
                      '<td align="right"><input id="btnDelAutosize" title="Autosize Columns" style="margin-right:10px;" type="button"></td>' +
			'<td><input id="btnHideAdditInfo_deleted" title="Show additional data columns" style="margin-right: 5px;" type="button"></td>'+
		  '<td><input class="fullWidthPage" id="fullWidth1" title="Toggle grid to full screen width" style="margin-right:10px;"></td>' +
                      '</tr></table>');
                      $("#btnHideAdditInfo_deleted").jqxToggleButton({ imgSrc: "resources/css/icons/table_plus.png", imgPosition: "center", width: 25, height: 25 });

                      $("#fullWidth1").jqxButton({imgSrc: "resources/css/icons/fullscreen.png", imgPosition: "left", width: '26', textPosition: "right"});
                      $("#btnRemove").jqxButton({imgSrc: "resources/css/icons/delete_16.ico", imgPosition: "left", width: '65', textPosition: "right"});
                      $("#btnRemove").tooltip();
                      $("#fullWidth1").tooltip();
                      $("#btnRestore").jqxButton({imgSrc: "resources/css/icons/restore.ico", imgPosition: "left", width: '140', textPosition: "right"});
                      
						$("#fullWidth1").on('click', function ()
						{
							if(fullWidthFlag === 1)
							{
								$(".fullWidthPage").jqxButton({imgSrc: "resources/css/icons/fullscreen1.png", imgPosition: "left", width: '26', textPosition: "right"});
								document.getElementsByClassName("fixpage")[0].style.maxWidth = "100%";
							}
							else
							{
								$(".fullWidthPage").jqxButton({imgSrc: "resources/css/icons/fullscreen.png", imgPosition: "left", width: '26', textPosition: "right"});
								document.getElementsByClassName("fixpage")[0].style.maxWidth = "1200px";
							}
							fullWidthFlag *= -1;
							window.dispatchEvent(new Event('resize'));
							resizeColumns('disactiveJqxgrid');
						});
					  
                      $("#btnRemove").on('click', function () {
                    	  var getselectedrowindexes = $('#disactiveJqxgrid').jqxGrid('getselectedrowindexes');
                    	  if( getselectedrowindexes.length == 0) return;
                    	    var message;
                    	  if (getselectedrowindexes.length > 1) message = "Are you sure you want to delete " + getselectedrowindexes.length + " series?";
                    	  else if (getselectedrowindexes.length > 0) {
                    		  var row = $('#disactiveJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
                      		  message = "Are you sure you want to delete " + row.Datasource + "/" + row.Symbol+ " series?";                      		  
                    	  }
                    	  functionConfirmMessage({
                    	    text:message,
                    	    yes:async ()=>{
                    		var s = [];
                    		getselectedrowindexes.sort((a,b)=>{ return a-b; } );
                    		$cc_count++;
                    		for(var i=0;i<getselectedrowindexes.length;i++)
                    		{
                    		  var row = $('#disactiveJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[i]);
                    		  deletedUserFavorites.splice(getselectedrowindexes[i]-$cc_count,1);
                    		  $cc_count++;
                    		  s.push({Datasource:row.Datasource,Category:row.Category?row.Category:"false",Symbol:row.Symbol,DateTime:row.DateTime});
                    		}
				r = await call_api_command('post','DeleteRemovedUserFavoriteDatasets',{
						SessionToken:sessionToken,
						Series:s
				});
                    	    }
                    	});
              	      });
              	      
			$("#btnHideAdditInfo_deleted").on('click', function (event) {
				console.log('BBBBBBBBBBBBBBBBBBBBBBBBBBBBB');
				var current_grid = "disactiveJqxgrid";
				var id = event.currentTarget.id;
				console.log(id);
				var toggled = $('#'+id).jqxToggleButton('toggled');
				if (toggled) {
					$("#"+current_grid).jqxGrid('beginupdate');
					showAdditInfo(current_grid);
					document.getElementById(id).title = "Hide additional data columns";
					$("#"+current_grid).jqxGrid('endupdate');
					
				} else {
					$("#"+current_grid).jqxGrid('beginupdate');
					hideAdditInfo(current_grid);
					document.getElementById(id).title = "Show additional data columns";
					$("#"+current_grid).jqxGrid('endupdate');					
				}
			});
              	      
                      $("#btnRestore").on('click', restoreFavorite);
                       $("#btnDelAutosize").jqxButton({imgSrc: "resources/css/icons/autosize.png", imgPosition: "center", width: '30'});
					   $("#btnDelAutosize").tooltip();
			 $("#btnDelAutosize").on('click', function () {
			 	resizeColumns('disactiveJqxgrid');
			 });
                  },
                  columns: columnsDisactive
	            });
        		// create context menu
                var disactiveJqxgridContextMenu = $("#disactiveJqxgridMenu").jqxMenu({ width: 160, height: 58, autoOpenPopup: false, mode: 'popup'});
                $("#disactiveJqxgrid").on('contextmenu', function () {
                    return false;
                });
                // handle context menu clicks.
                $("#disactiveJqxgridMenu").on('itemclick', async function (event) {
                    var args = event.args;
                    
                    if ($.trim($(args).text()) == "Restore to Favorites") {
                    	await restoreFavorite();
                    } else if ($.trim($(args).text()) == "Delete"){
                    	var getselectedrowindexes = $('#disactiveJqxgrid').jqxGrid('getselectedrowindexes');
                  	    if (getselectedrowindexes.length > 1)
                          	confirmMessage("Are you sure you want to delete " + getselectedrowindexes.length + " series?", deleteFavorite);
                  	    else if (getselectedrowindexes.length > 0) {
                  		  var row = $('#disactiveJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
                    		  confirmMessage("Are you sure you want to delete " + row.alias + "/" + row.dataset_code + " series?", deleteFavorite);
                  	    }
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

				var attachContextMenu = function () {
                    $("#treeExpander").on('mousedown', function (event) {
                        var target = $(event.target).parents('li:first')[0];
                        var rightClick = isRightClick(event);
                        if (rightClick) {
                        	if(target)
                            	$("#jqxTree").jqxTree('selectItem', target);
                            var scrollTop = $(window).scrollTop();
                            var scrollLeft = $(window).scrollLeft();
                            contextMenu.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
                            return false;
                        }
                    });
				}
				
				function isRightClick(event) {
                    var rightclick;
                    if (!event) var event = window.event;
                    if (event.which) rightclick = (event.which == 3);
                    else if (event.button) rightclick = (event.button == 2);
                    return rightclick;
				}
            	    var contextMenu = $("#jqxTreeMenu").jqxMenu({ width: '130px',  height: '210px', autoOpenPopup: false, mode: 'popup' });
            	    contextMenu.on('shown',()=>{
            		var item = $('#jqxTree').jqxTree('getSelectedItem');
            		if(item.value.root == true )
            		{
            		    $('#miNewFolder').text('New Folder');
            		}
            		else {
            		    $('#miNewFolder').text('New Subfolder');
            		}
            	    });
                $('#chMoveFolders').jqxCheckBox( { checked:false });
                $('#chMoveFolders').on('change', function (event) 
            	{
            	    var button = $('#btnMoveFolders');
            	    globalMoveFolders = event.args.checked; 
                    var toggled = button.jqxToggleButton('toggled');
            	    if( toggled != globalMoveFolders) button.jqxToggleButton('toggle');
        	}); 
                
                
		function refreshTreeFolders()
		{
			console.log($('#jqxTree').jqxTree('source'));
			var items = $('#jqxTree').jqxTree('getItems');
			console.log(items);
			items.forEach(function(item)
			{
				item.label = item.value.items.length == 0 ? item.value.name : item.value.name + " (" + '<span style="color:blue;">'+item.value.items.length+'</span>' + ")"
				$('#jqxTree').jqxTree('updateItem', item, item);
	
			});
		}		
				        		
                createFolders = async () => {
                
			        		
                // Init Tree Menu
                var clickedItem = null;
                
             	// disable the default browser's context menu.
                $(document).on('contextmenu', function (e) {
                    if ($(e.target).parents('#treeExpander').length > 0) {
                        return false;
                    }
                    return true;
                });
                
                
        		$('#mainSplitter').jqxSplitter({ width: '100%', height: '100%', panels: [{ size: 250 }] });
        		$("#treeExpander").jqxExpander({toggleMode: 'none', showArrow: false, width: "100%", height: "100%", 
                    initContent: async function () {
//                    	console.log('here wow');
                    	
                        $('#jqxTree').jqxTree({ 
                        	source: folderStructure, 
                        	allowDrag: true, 
                        	allowDrop: true, 
                        	height: '100%', width: '100%',
                        	dragStart:function(elem)
                        	{
                        		if(elem.value.root == true || globalMoveFolders == false) return false;
                        	},
                        	dragEnd: async function (dragItem, dropItem, args, dropPosition, tree)
                        	{
                        		if(dropItem.value.root == true )
                        		{
                        			if(dropPosition != 'inside') return false;
                        		}
					return true;
                        	}
                        });
                        
                        console.log( $('#jqxTree').jqxTree('getItems') );
                        $("#jqxTree").on('dragEnd',function(event)
                        {
				updateFolderStructure();                      		
                        });
                        $('#jqxTree').jqxTree('expandAll');
                        
						sourceTreeItem = $('#jqxTree').jqxTree('getSelectedItem');
//						console.log('pass here too');
						refreshTreeFolders();
						console.log(sourceTreeItem);
                        
                        $("#jqxTreeToolBar").jqxToolBar({
                            width: '100%', height: 35, tools: 'custom | custom | custom | custom | custom',
                            initTools: function (type, index, tool, menuToolIninitialization) {
                                if (type == "toggleButton") {
                                    var icon = $("<div class='jqx-editor-toolbar-icon jqx-editor-toolbar-icon-" + theme + " buttonIcon'></div>");
                                }
                                switch (index) {
                                    case 0:
                                        var button = $("<div>" + "<img  height='16px' width='16px' src='resources/css/icons/folder_add.png' title='Add a new Folder'></img></div>");
                                        tool.append(button);
                                        button.jqxButton({ height: 15 });
                                        button.on('click', function ()
                                        {
                                           openAddFolderDialog();
                                        });
                                        break;
                                    case 1:
                                    	var button = $("<div id='btnDeleteFolder'>" + "<img  height='16px' width='16px' src='resources/css/icons/folder_delete.png' title='Delete the selected empty folder'></img></div>");
                                        tool.append(button);
                                        button.jqxButton({ height: 15, disabled: true });
                                        button.on('click', function ()
                                        {
                                        	openDeleteFolderDialog();
                                        });
                                        
                                        break;
                                    case 2:
                                        var button = $("<div id='btnRenameFolder'>" + "<img  height='16px' width='16px' src='resources/css/icons/folder_rename.png' title='Rename the selected folder'></img></div>");
                                        tool.append(button);
                                        button.jqxButton({ height: 15, disabled: true });
                                      	button.on('click', function ()
                                        {
                                      		openRenameDialogWindow();
                                        });
                                        break;
                                    case 3:
                                        var button = $("<div id=\"btnMoveFolders\" ><img  height='16px' width='16px' src='resources/css/icons/FolderUpDn.png' title='Switch On/Off folders moving'></img></div>");
                                        tool.append(button);
                                        button.jqxToggleButton({ height: 15, toggled:false });
                                      	button.on('click', function ()
                                        {
                                    	    var toggled = button.jqxToggleButton('toggled');
                                    	    if( toggled != $('#chMoveFolders').jqxCheckBox( 'checked'))$('#chMoveFolders').jqxCheckBox( {checked:toggled});
                                    	    globalMoveFolders = toggled;                                    	                                        	    
                                        });
                                        break;
                                    case 4:
                                        var button = $("<div id='btnShowBackups'>" + "<img  height='16px' width='16px' src='resources/css/icons/backup.png' title='Manage user favorite backups'></img></div>");
                                        tool.append(button);
                                        tool.css('float', 'right')
                                        button.jqxButton({ height: 15 });
                                      	button.on('click', function ()
                                        {
                                    		//console.log($("#jqxTree").jqxTree('getItems'));
                                    		//console.log(folderStructure);
                                       		showBackupsList();
                                        });
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
                            case "Open":
                            	var all_items = $('#jqxTree').jqxTree('getItems');
                            	var se = $('#jqxTree').jqxTree('getSelectedItem');
                            	changeNodeWithChilds(se,'expandItem',all_items);
                                break;
                            case "Close":
                            	var all_items = $('#jqxTree').jqxTree('getItems');
                            	var se = $('#jqxTree').jqxTree('getSelectedItem');
                            	changeNodeWithChilds(se,'collapseItem',all_items);
                                break;
                            case "Delete Folder":
                            	openDeleteFolderDialog();
                            	attachContextMenu();
                                break;
                            }
                        });
                    }
				});
			}
        		
        		function pasteSeriesFromClipboardToFolder(){
        			var selectedItem = $('#jqxTree').jqxTree('selectedItem');
        			console.log(selectedItem);
        			if(selectedItem.value.root == true)
        				return;
        			
        			if(!seriesToAdd){
	                	    $("#warningWindowContent").text("Nothing to paste");
    	        		    $('#warningWindow').dialog('open');
        			    return;
        			}
        			
				folderToAdd = selectedItem.value.folderUid;
            		
				if(seriesToAdd.length == 1) 
				{
            			    $("#addSeriesWindowContent").text("Paste 1 series to folder '" + selectedItem.value.name + "'?");
				} else {
				    $("#addSeriesWindowContent").text("Paste " + seriesToAdd.length + " series into folder '" + selectedItem.value.name + "'?");
				}
        			$('#addSeriesWindow').dialog('open');
        			lastTreeItem = selectedItem;
        		}
        		
        		async function searchSeries(){
        			refreshFavouritesGrid();
        		}
        		
        		$("#gridExpander").jqxExpander({toggleMode: 'none', showArrow: false, width: "100%", height: "100%", 
                    initContent: initActiveJqxgrid
                });
				var isDragStart = false;
				
			initToolbar = () => {
        		$('#jqxTree').on('select', function (event) {
        			if(isDragStart == false){
        				sourceTreeItem = $('#jqxTree').jqxTree('getSelectedItem');
        				refreshFavouritesGrid();
        			}
        			
        			var item = $('#jqxTree').jqxTree('getSelectedItem');
        			if(item.value.root == true){
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
				}

        		
        		function openAddFolderDialog(){
        			var item = $('#jqxTree').jqxTree('getSelectedItem');
        			if(!item) return;

        			$("#rootFolderUid").val(item.value.folderUid);

        			$('#addFolderWindow').dialog({ title: "Create a sub folder under '" + item.value.name + "''"});
        			$('#addFolderWindow').dialog('open');

        			$('#folderName').focus();
        		}
        		
        		async function addNewFolder(){
        			console.log('addNewFolder is called');
        			var newFolderName = $("#folderName").val();
        			if(newFolderName == null || newFolderName == '') {
	                		$("#warningWindowContent").text("Folder name is blank. Please enter a valid folder name");
    	        			$('#warningWindow').dialog('open');
    	        			return;
        			}
        			
				var added_elem = {
					label: newFolderName,
					icon: "resources/css/icons/folder.png",
					value: {
						name: newFolderName,
						items: [],
						root: false
					}
				};
										
				var item = $('#jqxTree').jqxTree('getSelectedItem');
				$('#jqxTree').jqxTree('addTo',added_elem,item);
				if(item.isExpanded == false) $('#jqxTree').jqxTree('expandItem',item);
				$("#folderName").val("");
				updateFolderStructure();
				$("#infoMessageNotificationContent").text(`Folder ${newFolderName} has been added`);
				$("#infoMessageNotification").jqxNotification("open");
        		}
        		
        		$('#folderName').keypress(function (e) {
	      			if (e.which == 13) {
	      				addNewFolder();
                    	$('#addFolderWindow').dialog('close');
	      			    return false;
	      			}
        		});
        		
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
        		
        		$('#newFolderName').keypress(function (e) {
	      			if (e.which == 13) {
	      				renameFolder();
                    	$('#renameFolderWindow').dialog('close');
	      			    return false;
	      			}
        		});
      			
        		$('#windowBackups').jqxWindow({
        			showCollapseButton: false, 
        			resizable: true, 
        			isModal: false,
        			height: '90%', 
        			width: '100%', 
        			autoOpen:false,
        		});
        		
        		function openDeleteFolderDialog(){
        			var item = $('#jqxTree').jqxTree('getSelectedItem');
        			if(!item)
        				return;
        			if(item.value.root == true) {
    	        		$("#warningWindowContent").text("You can't delete the root folder 'All'");
    	        		$('#warningWindow').dialog('open');
	                	return;
        			} else if( item.value.items.length > 0 || isSubFoldersHasSeries(item) ) {
    	        		$("#warningWindowContent").text("You must remove the series from this folder before you can delete it.");
    	        		$('#warningWindow').dialog('open');
	                	return;
        			} else if(item.subtreeElement){
    					$("#deleteFolderWindowContent").text("The folder has empty sub folders. Are you sure you want to delete it?");
    	        		$('#deleteFolderWindow').dialog('open');
    	        		return;
        			}
        			
        			$("#deleteFolderWindowContent").text("Are you sure you want to delete folder '" + item.label + "''?");
        			$('#deleteFolderWindow').dialog('open');
        		}
        		
        		function deleteFolder(){
        			$('#deleteFolderWindow').dialog('close');
        			
        			var item = $('#jqxTree').jqxTree('getSelectedItem');
        			if(!item)
        				return;
					   
                       	$('#jqxTree').jqxTree('selectItem', item.parentElement);
                       	$('#jqxTree').jqxTree('removeItem', item.element);
				updateFolderStructure();
		   $("#infoMessageNotificationContent").text("Folder has been removed");
                       	$("#infoMessageNotification").jqxNotification("open");
        		}
        		function updateFolderStructure()
        		{
				console.log(folderStructure);
				console.log();
				var items = $('#jqxTree').jqxTree('getItems');
				var sources = [{value:{id:items[0].id},items:[]}];
				var links = {};
				let currentRoot = items[0].id;
				links[currentRoot] = 1;
				var indexes_stack = [0];
				var fAddToParent = function(src,seek_id,elem)
				{
					src.every((el)=>{
						if( el.value.id == seek_id )
						{
							el.items.push(elem);
							return false;
						} 
						if(el.items.length > 0 ) return fAddToParent(el.items,seek_id,elem);
						return true;
					});
					return true;
				};
				/*
				var fadd_elem = function(src,elem,level,index,path) {
					if(level == index ) 
					{
						src.push(elem);
						return;
					}
					var i = path[index];
					fadd_elem(src[i].items,elem,level,index+1,path);
				} 
				*/
				items.forEach((elem,index)=>{
					if( index == 0 ) return;
//					var level = elem.level;
					elem.value.id = elem.id;
					var add_elem = {
						label: elem.label,
						icon: "resources/css/icons/folder.png",
						items:[],
						value:elem.value
					}
					fAddToParent(sources,elem.parentId,add_elem);
					
/*					if(links[elem.parentId] == undefined) 
					{
						indexes_stack.push(0);
						links[elem.parentId] = 1;
					}
					else {
						var n=[];
						let r = indexes_stack.every((a,i)=>{
							n.push(a);
							return i!=level;
						});
						if(r == false ) {
							indexes_stack=n;
							let l = indexes_stack.length;
							indexes_stack[l-1]++;
						} else indexes_stack.push(0);
					}
*/
//					fadd_elem( sources, add_elem, level, 0, indexes_stack);
				});
				console.log(sources);
				WriteFavoritesTree(JSON.stringify(sources[0].items),sessionToken);
                        }
        		
        		$("#addBackupWindow").dialog({
	       		      resizable: true,
	                  autoOpen: false,
	       		      height: "auto",
	       		      width: "auto",
	       		      modal: true,
	       		      buttons: {
	       		        Ok: function() {
	       		        	createBackup();
	       		          	$( this ).dialog( "close" );
	       		        },
	       		        Cancel: function() {
	       		          	$( this ).dialog( "close" );
	       		        }
	       		      },
       		     	  close: function() {
                   		$('#windowBackups').jqxWindow('expand');
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
	       		          	$( this ).dialog( "close" );
	       		        }
	       		      },
       		     	  close: function() {
                   		$('#windowBackups').jqxWindow('expand');
       		     	  }
	       		    });
        		
        		$("#deleteFolderWindow").dialog({
	       		      resizable: true,
	                  autoOpen: false,
	       		      height: "auto",
	       		      width: "auto",
	       		      modal: true,
	       		      buttons: {
	       		        Ok: function() {
	       		        	deleteFolder();
	       		          	$( this ).dialog( "close" );
	       		        },
	       		        Cancel: function() {
	       		          	$( this ).dialog( "close" );
	       		        }
	       		      }
	       		    });
        		
        		$("#addSeriesWindow").dialog({
	       		      resizable: true,
                      autoOpen: false,
	       		      height: "auto",
	       		      width: "auto",
	       		      modal: true,
	       		      buttons: {
	       		        Ok: function() {
	       		        	addSeriesToFolder();
	       		          	$( this ).dialog( "close" );
	       		        },
	       		        Cancel: function() {
	       		          	$( this ).dialog( "close" );
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
	       		          	$( this ).dialog( "close" );
	       		        },
	       		        Cancel: function() {
	       		          	$( this ).dialog( "close" );
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
	       		          	$( this ).dialog( "close" );
	       		        },
	       		        Cancel: function() {
	       		          	$( this ).dialog( "close" );
	       		        }
	       		      }
	       		    });
        		
        		$("#addFolderWindow").dialog({
	       		      resizable: true,
                      autoOpen: false,
	       		      height: "auto",
	       		      width: 400,
	       		      modal: true,
	       		      buttons: {
	       		        Ok: function() {
	       		        	addNewFolder();
	       		          	$( this ).dialog( "close" );
	       		        },
	       		        Cancel: function() {
	       		          	$( this ).dialog( "close" );
	       		        }
	       		      }
	       		    });
        		
        		$("#recreateBackupWindow").dialog({
	       		      resizable: true,
	                  autoOpen: false,
	       		      height: "auto",
	       		      width: "auto",
	       		      modal: true,
	       		      buttons: {
	       		    	Ok: function() {
	       		    		createNewBackupIfNeed();
	       		          	$( this ).dialog( "close" );
	       		        },
	       		        Cancel: function() {
	       		          	$( this ).dialog( "close" );
	       		        }
	       		      },
       		     	  close: function() {
                     		$('#windowBackups').jqxWindow('expand');
         		     	  }
	       		    });
        		
        		$("#deleteBackupWindow").dialog({
	       		      resizable: true,
	                  autoOpen: false,
	       		      height: "auto",
	       		      width: "auto",
	       		      modal: true,
	       		      buttons: {
	       		    	Ok: function() {
	       		    		deleteBackup();
	       		          	$( this ).dialog( "close" );
	       		        },
	       		        Cancel: function() {
	       		          	$( this ).dialog( "close" );
	       		        }
	       		      },
       		     	  close: function() {
                     		$('#windowBackups').jqxWindow('expand');
        		      }
	       		    });
        		
        		$("#warningWindow").dialog({
	       		      resizable: true,
	                  autoOpen: false,
	       		      height: "auto",
	       		      width: "auto",
	       		      modal: true,
	       		      buttons: {
		       		        Ok: function() {
		       		          	$( this ).dialog( "close" );
		       		        }
	       		      },
       		     	  close: function() {
                   		if( $('#windowBackups').jqxWindow('isOpen') )
                     		$('#windowBackups').jqxWindow('expand');
       		     	  }
	       		    });
        		
        		$('#addDefaultBackupWindow').jqxWindow({
                    showCollapseButton: false, resizable: false, height: 130, width: 320, autoOpen:false,
                    title:"Add default backup",isModal: true,
                    initContent: function () {
                        $('#addDefaultBackupWindowBtn').jqxButton({ width: '80px'});
                        $("#addDefaultBackupWindowBtn").on('click', function () {
                        	addDefaultBackup();
                	   	});
                        
                        $('#overwriteDefaultBackupWindowBtn').jqxButton({ width: '80px'});
                        $("#overwriteDefaultBackupWindowBtn").on('click', function () {
                        	$('#overwriteBackupWindow').jqxWindow('open');
                	   	});
                        
                        $('#cancelAddDefaultBackupWindowBtn').jqxButton({ width: '80px'});
                        $("#cancelAddDefaultBackupWindowBtn").on('click', function () {
                       	 	$('#addDefaultBackupWindow').jqxWindow('close');
                 	    });
                    }
                });
        		
        		$('#overwriteBackupWindow').jqxWindow({
                    showCollapseButton: false, resizable: false, height: 130, width: 320, autoOpen:false,
                    title:"Overwrite backup",isModal: true,
                    initContent: function () {
                        $('#overwriteBackupWindowBtn').jqxButton({ width: '80px'});
                        $("#overwriteBackupWindowBtn").on('click', function () {
                        	overwriteDefaultBackup();
                        	$('#overwriteBackupWindow').jqxWindow('close');
                	   	});
                        
                        $('#cancelOverwriteBackupWindowBtn').jqxButton({ width: '80px'});
                        $("#cancelOverwriteBackupWindowBtn").on('click', function () {
                       	 	$('#overwriteBackupWindow').jqxWindow('close');
                 	    });
                    }
                });
        		
        		function openRenameDialogWindow(){
        			var item = $('#jqxTree').jqxTree('getSelectedItem');
        			if(!item)
        				return;
        			
        			if(item.value.root == true){
    	        		$("#warningWindowContent").text("You can't rename the root folder 'All'");
    	        		$('#warningWindow').dialog('open');
	                	return;
        			}
        			

        			$("#oldFolderName").text(item.value.name);
        			$('#renameFolderWindow').dialog('open');
        			$('#newFolderName').focus();
        		}
        		
        		async function renameFolder(){
        			var item = $('#jqxTree').jqxTree('getSelectedItem');
        			if(!item)
        				return;
        			
        			var newFolderName = $("#newFolderName").val();
        			if(newFolderName == null || newFolderName == '') {
    	        		$("#warningWindowContent").text("Folder name is blank. Please enter a valid folder name");
    	        		$('#warningWindow').dialog('open');
    	        		return;
        			}
					
					(await folderStructure).forEach((e) => {
						
						if(e.label === item.label){
							e.label = newFolderName
							}
					})
					$("#infoMessageNotificationContent").text("Name has been changed");
		                    	$("#infoMessageNotification").jqxNotification("open");
//					refreshTree();
        		    
        		    $("#newFolderName").val("");
        		}

			function openRemoveSeriesFromFolderDialog()
			{
				var rowsindexes = $("#activeJqxgrid").jqxGrid('getselectedrowindexes');
				if(rowsindexes.length < 1) return;
				var item = $('#jqxTree').jqxTree('getSelectedItem');
				var msg;
				if(item.value.root == true )
				{
					var cmp = {};
					for(i=0;i<rowsindexes.length;i++)
					{
						var row = $("#activeJqxgrid").jqxGrid('getrowdata', rowsindexes[i]);
						var ind = row.Datasource+'#'+row.Datacategory+'#'+row.Symbol;
						cmp[ind] = 1;
					}
					var duplicates = [];
					for(var i=1;i<folderStructure.length;i++)
					{
						var compare = folderStructure[i].value.items;
						for(j=0;j<compare.length;j++)
						{
							var cto = compare[j].Datasource+'#'+compare[j].Datacategory+'#'+compare[j].Symbol;
							if( cmp[cto] != undefined )
							{
								duplicates.push(compare[j].Datasource+'/'+compare[j].Symbol+' in '+folderStructure[i].value.name);
							}
						}
					}
					if(duplicates.length > 0 )
					{
						var h = rowsindexes.length > 1? 'have' : 'has';
						functionNotificationMessage({
							text:'Can\'t remove as selected series '+h+' been located: '+duplicates.join(',')
						});
						return;
					}
				}
				if(item.value.root == false && rowsindexes.length == 1)
					msg = "Remove 1 series from folder '" + item.value.name + "'?";
				else if(item.value.root == false)
					msg = "Remove " + rowsindexes.length + " series from folder '" + item.value.name + "'?";
				else if(item.value.root == true && rowsindexes.length == 1)
					msg = "Warning, You are about to remove 1 series from your favorites list. Do you wish to continue?";
				else
					msg = "Warning, You are about to remove " + rowsindexes.length + " series from your  favorites list. Do you wish to continue?";
				functionConfirmMessage({
					text:msg,
					yes:async function()
					{
						deleteSeriesFromFolder();
					}
				});
			}
        		
			async function deleteSeriesFromFolder()
			{
				var rowsindexes = $("#activeJqxgrid").jqxGrid('getselectedrowindexes');
				rowsindexes.sort(function(a,b){ return a-b; });

				console.log(rowsindexes);
				var cmp = {},deleted_series=[];
				var item = $('#jqxTree').jqxTree('getSelectedItem');
				var cc_count=0;
				var elems=[],deleted = [];

				for (var i = 0; i < rowsindexes.length; i++) 
				{
					var row = $("#activeJqxgrid").jqxGrid('getrowdata', rowsindexes[i]);
					console.log(rowsindexes[i]);
					var ind = row.Datasource+'#'+row.Datacategory+'#'+row.Symbol;
					deleted_series.push(row);
					cmp[ind] = 1;
					if(item.value.root == true )
					{
						deleted.push(folderStructure[0].value.items[rowsindexes[i]-cc_count]);
						folderStructure[0].value.items.splice(rowsindexes[i]-cc_count,1);
						userFavorites.splice(rowsindexes[i]-cc_count,1);
						cc_count++;
					}
				}
				var compare = item.value.items;
				console.log(cmp);
				if(item.value.root == true ) elems = item.value.items;
				else
				for(var i=0;i<compare.length;i++)
				{
					var cto = compare[i].Datasource+'#'+compare[i].Datacategory+'#'+compare[i].Symbol;
					console.log(cto);
					if( cmp[cto] == undefined ) elems.push(compare[i]);
					else deleted.push(compare[i]);
				}
				item.value.items=elems;
				var singleCase = deleted.length == 1 ? " has" : "s have";
				var n;
				if( item.value.root === true ) n = ' your Favorites list';
				else n = ' folder '+item.value.name;
				functionNotificationMessage({text: deleted.length + ' symbol'+ singleCase + ' been removed from'+n});
				item.label = item.value.items.length == 0 ? item.value.name:item.value.name + " (" + (item.value.items.length) + ")"
				$('#jqxTree').jqxTree('updateItem', item, item);
				if(item.value.root === true )
				{
					r = await call_api_command('post','RemoveUserFavoriteDatasets',{
						SessionToken:sessionToken,
						Series:deleted
					});
					userDeletedFavorites = await getDeletedUserFavorites(sessionToken);
					disactiveSource.localdata = userDeletedFavorites;
					$('#disactiveJqxgrid').jqxGrid('updatebounddata','cells');
				}
				await updateFolderStructure();
				refreshFavouritesGrid();
			}
        		async function addSeriesToFolder()
        		{
                      			$('#addSeriesWindow').dialog('close');
                      			
                          		var oldSize = lastTreeItem.value.items.length;
                          		var newSize = oldSize;
                          		var len = lastTreeItem.value.items.length;
                          		var it = lastTreeItem.value.items;
                          		console.log(it);
                          		for(var i = 0; i < seriesToAdd.length; i++) {
                          		    var isFound = false;
                          		    for(var j=0;j<len;j++)
                          		    {
                          			if( it[j].Datasource == seriesToAdd[i].Datasource &&
                          			it[j].Datacategory == seriesToAdd[i].Datacategory &&
                          			it[j].Symbol == seriesToAdd[i].Symbol  )
                          			{
                          			    isFound = true;
                          			    break;
                          			}
                          		    }
                          		    if( isFound === false ) newSize++;
                          		    else seriesToAdd[i] = undefined;
                          		}
                          		console.log(seriesToAdd);
                          		for(var i = 0; i < seriesToAdd.length; i++) 
                          		{
                          		    if( seriesToAdd[i] != undefined ) lastTreeItem.value.items.push(seriesToAdd[i]);
                          		}
                          		if((newSize - oldSize) == 1)
                          			$("#infoMessageNotificationContent").text("1 new symbol has been added to folder " + lastTreeItem.value.name);
                          		else if((newSize - oldSize) > 1)
                          			$("#infoMessageNotificationContent").text((newSize - oldSize) + " new symbols have been added to folder " + lastTreeItem.value.name);
                          		else	
                          			$("#infoMessageNotificationContent").text("No series copied");
                          		
      	                    		$("#infoMessageNotification").jqxNotification("open");
                          		
                          		lastTreeItem.label = lastTreeItem.value.name + " (" + newSize + ")"
                          		$('#jqxTree').jqxTree('updateItem', lastTreeItem, lastTreeItem);
                          		updateFolderStructure();                          		
                          		refreshFavouritesGrid();
        		}

        		
	async function initActiveJqxgrid()
	{
		favoritesGridSource =
		{
			datatype: "json",
			datafields: baseDataFields,
			localdata: await userFavorites
		};
		await createFolders();
		initToolbar();
		var cols;
		favoritesGridDataAdapter = new $.jqx.dataAdapter(favoritesGridSource);
		// create Tree Grid
		$("#activeJqxgrid").jqxGrid(
		{
			handlekeyboardnavigation:function(event)
			{
				if( event.currentTarget.id == undefined ) return;
				var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
				if(key == 46 )
				{
					openRemoveSeriesFromFolderDialog();	
					return;
				}
				keyboardNavigation(event);
			},
			width: '100%',
			height: '100%',
			rowsheight: 40,
			scrollbarsize: 10,
			source: favoritesGridDataAdapter,
			columnsresize: true,
			groupable: false,
			sortable: true,
			selectionmode: 'multiplerowsadvanced',
			//deferreddatafields: ['name'],
			//scrollmode: 'deferred',
			// groups: ['alias'],
			showtoolbar: true,
			ready: function () {
				resizeColumns('activeJqxgrid');
//				cols = $("#activeJqxgrid").jqxGrid("columns");
//                  		alert('active ready');


//				$('#activeJqxgrid').jqxGrid('autoresizecolumns');
//				autoresizeColumnsManually(favoritesGridDataAdapter, "activeJqxgrid");
			},
			rendered: function () 
			{
				activeJqxgridDragAndDropInit();
			},
			rendertoolbar: function (toolbar) {
				var me = this;
				var container = $("<div style='margin: 5px;width:100%;'></div>");
				toolbar.append(container);
				container.append('<table><tr>' + 
				'<td><img src="resources/css/icons/search.png" style="margin-right:3px;margin-top:3px;"></td>' +
				'<td><input id="searchBox"></td>' +
				'<td><input type="submit" id="helpIcon" value=""></td>' +
				'<td style="width:100%;"></td>' + 
				'<td><input id="btnRemoveFromFavorites" title="Remove Selected Series from the folder" style="margin-right:10px;" value="Remove"></td>' + 
				'<td><input id="btnAutosizeActive" title="Autosize Columns" style="margin-right:10px;"></td>' +
				'<td><input id="btnHideAdditInfo_favorite" title="Show additional data columns" style="margin-right: 5px;" type="button"></td>'+
				'<td><input class="fullWidthPage" id="fullWidth2" title="Toggle grid to full screen width" style="margin-right:10px;"></td>' +
				'</tr></table>');
				$("#btnHideAdditInfo_favorite").jqxToggleButton({ imgSrc: "resources/css/icons/table_plus.png", imgPosition: "center", width: 25, height: 25 });

				$("#searchBox").jqxInput({placeHolder: "Enter filter text",  height: 22, width:230 });
				$("#btnAutosizeActive").jqxButton({imgSrc: "resources/css/icons/autosize.png", imgPosition: "left", width: '26', textPosition: "right"});
				$("#fullWidth2").jqxButton({imgSrc: "resources/css/icons/fullscreen.png", imgPosition: "left", width: '26', textPosition: "right"});
				$("#btnRemoveFromFavorites").jqxButton({imgSrc: "resources/css/icons/star_delete.png", imgPosition: "left", width: '75', textPosition: "right"});
				$("#btnAutosizeActive").tooltip();
				$("#searchBox").keypress(function (e) {
					if (e.which == 13) {
						searchSeries();
						return false;
					}
				});
				$("#searchBox").bind("input", function (evt) 
				{
					if (window.event && event.type == "propertychange" && event.propertyName != "value")
						return;
					window.clearTimeout($(this).data("timeout"));
					$(this).data("timeout", setTimeout(function () {
						searchSeries();
					}, 900));
				});
				$("#btnAutosizeActive").on('click', function ()
				{
					resizeColumns('activeJqxgrid');
				});

			$("#btnHideAdditInfo_favorite").on('click', function (event) {
				var current_grid = "activeJqxgrid";
				var id = event.currentTarget.id;
				console.log(id);
				var toggled = $('#'+id).jqxToggleButton('toggled');
				if (toggled) {
					$("#"+current_grid).jqxGrid('beginupdate');
					showAdditInfo(current_grid);
					document.getElementById(id).title = "Hide additional data columns";
					$("#"+current_grid).jqxGrid('endupdate');
					
				} else {
					$("#"+current_grid).jqxGrid('beginupdate');
					hideAdditInfo(current_grid);
					document.getElementById(id).title = "Show additional data columns";
					$("#"+current_grid).jqxGrid('endupdate');					
				}
			});

							
							$("#fullWidth2").on('click', function ()
                            {
								//console.log("debug");
								if(fullWidthFlag === 1)
								{
									$(".fullWidthPage").jqxButton({imgSrc: "resources/css/icons/fullscreen1.png", imgPosition: "left", width: '26', textPosition: "right"});
									document.getElementsByClassName("fixpage")[0].style.maxWidth = "100%";
								}
								else
								{
									$(".fullWidthPage").jqxButton({imgSrc: "resources/css/icons/fullscreen.png", imgPosition: "left", width: '26', textPosition: "right"});
									document.getElementsByClassName("fixpage")[0].style.maxWidth = "1200px";
								}
								fullWidthFlag *= -1;
								resizeColumns('activeJqxgrid');
//								autoresizeColumnsManually(favoritesGridDataAdapter, "activeJqxgrid");
//								window.dispatchEvent(new Event('resize'));
                            });
	                        
	                        $("#btnRemoveFromFavorites").tooltip();
	                        $("#btnRemoveFromFavorites").on('click', function ()
                            {
                               openRemoveSeriesFromFolderDialog();
                            });
							$("#fullWidth2").tooltip();
	                    },
                        columns: baseGridColumns,//activeGridColumns,
                        theme:theme
                    });
                    
                    /*
                    $("#activeJqxgrid").on("columnresized", function (event) 
                  	{
                  		var args = event.args;
      	            	var newCols = $("#activeJqxgrid").jqxGrid("columns");
      	                for (var i = 0; i < newCols.records.length; i++) {
      	                	if(args.datafield != newCols.records[i].datafield){
      	                		newCols.records[i].width = cols.records[i].width;
      	                		$("#activeJqxgrid").jqxGrid('setcolumnproperty', newCols.records[i].datafield, 'width', cols.records[i].width);
      	                	}
      	                }
                  	}); */ 
                    
                    /*$("#jqxActiveGridToolBar").jqxToolBar({
                        width: '100%', height: 35, tools: 'custom custom custom custom',
                        initTools: function (type, index, tool, menuToolIninitialization) {
                            if (type == "toggleButton") {
                                var icon = $("<div class='jqx-editor-toolbar-icon jqx-editor-toolbar-icon-" + theme + " buttonIcon'></div>");
                            }
                            switch (index) {
                                case 0:
                                    tool.append('<img src="resources/css/icons/search.png" style="margin-right:3px;margin-top:3px;"></img>');
                                    break;
                                case 1:
                                    var searchBox = $("<input id='searchBox'>");
                                    tool.append(searchBox);
                                    searchBox.jqxInput({placeHolder: "Enter filter text",  height: 22, width:230 });
                                    
                    				searchBox.keypress(function (e) {
                    					  if (e.which == 13) {
                    						  searchSeries();
                    					    return false;
                    					  }
                    				});
                    				
                    				searchBox.bind("input", function (evt) {
                    				    if (window.event && event.type == "propertychange" && event.propertyName != "value")
                    				        return;
                    				    window.clearTimeout($(this).data("timeout"));
                    				    
                    				    $(this).data("timeout", setTimeout(function () {
                    				    	searchSeries();
                    				    }, 900));
                    				});
                                    break;
                                case 2:
                                    var button = $("<div>" + "<img  height='16px' width='16px' src='resources/css/icons/autosize.png' title='Autosize the columns'></img></div>");
                                    tool.append(button);
                                    tool.css('float', 'right')
                                    button.jqxButton({ height: 15 });
                                    button.on('click', function ()
                                    {
                                 	   autoresizeColumnsManually(favoritesGridDataAdapter, "activeJqxgrid");
                                    });
                                    break;
                                case 3:
                                    var button = $("<div><img  height='16px' width='16px' src='resources/css/icons/star_delete.png' title='Remove selected series from this folder' ></img> Remove from Favorites</div>");
                                    tool.append(button);
                                    tool.css('float', 'right')
                                    button.jqxButton({ height: 15 });
                                    button.on('click', function ()
                                    {
                                       openRemoveSeriesFromFolderDialog();
                                    });
                                    break;
                            }
                        }
                    });*/
                    
                    
                    $(document).bind('mousemove', function (event) {
                        if (isDragStart == true) {
                        	var x = event.pageX;
                            var y = event.pageY;
                            
	                        var item = $("#jqxTree").jqxTree('hitTest', x, y);
	                        if(item)
	                        	$('#jqxTree').jqxTree('selectItem', item, true);
                        }
                    });
                    
                    /* Init drag&drop functionality */
                    function activeJqxgridDragAndDropInit() { 
	                    // select all grid cells.
			            var gridCells = $('#activeJqxgrid').find('.jqx-grid-cell');
			            // initialize the jqxDragDrop plug-in. Set its drop target to the second Grid.
			            gridCells.jqxDragDrop({ appendTo: 'body',  dragZIndex: 99999,
			                dropAction: 'none',
			                cursor: 'arrow',
			                initFeedback: function (feedback) {
			                    var rowsindexes = $("#activeJqxgrid").jqxGrid('getselectedrowindexes');
			                    feedback.height(25);
			                    feedback.width( $("#activeJqxgrid").width());
			                    feedback.css('background', '#aaa');
			                },
			                dropTarget: $('#jqxTree'),
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
			    					
			                        var table = '<table style="color:white; background:#709dc9">';
			                        // init header
			                        table += '<tr>';
		                            table += '<td style="width:' + this.width + 'px;border: 1px solid #bbbdbf;">Datasource</td>';
		                            table += '<td style="width:' + this.width + 'px;border: 1px solid #bbbdbf;">Symbol</td>';
		                            table += '<td style="width:' + this.width + 'px;border: 1px solid #bbbdbf;">Description</td>';
			                        table += '</tr>';
			                        
			                        // init table content
			                        $.each(rows, function () {
			                            table += '<tr>';
			                            table += '<td style="border: 1px solid #bbbdbf;">' + this.Datasource + '</td>'; //TODO: change to alias
			                            table += '<td style="border: 1px solid #bbbdbf;">' + this.Symbol + '</td>';
			                            table += '<td style="border: 1px solid #bbbdbf;">' + this.Description + '</td>';
			                            table += '</tr>';
			                        });
			                        table += '</table>';
			                        feedback.html(table);
			                    }
			                    // set the dragged records as data
			                    $(this).jqxDragDrop({ data: rows })
			                }
			            });
			            gridCells.on('dragEnd', function (event) {
//			            	console.log('!!! pass here');
			            	var value = $(this).jqxDragDrop('data');
	                    		var position = $.jqx.position(event.args);
	                    		$("#jqxTree").jqxTree('_syncItems', $("#jqxTree").find('.draggable'));
	                    		var item = $("#jqxTree").jqxTree('hitTest', position.left, position.top);
	                    		console.log(item);
	                    		if(!item) {
	                        	    $("#warningMessageNotificationContent").text("Move mouse to the folder");
	                        	    $("#warningMessageNotification").jqxNotification("open"); 
	                    		} else if(item.value.root == true) {
		    	        		$("#warningWindowContent").text("You can't copy series to folder 'All'");
		    	        		$('#warningWindow').dialog('open');
			            	} else {
	                        	    var arr = new Array();
	                        	    for (var i = 0; i < value.length; i++) {
//	                        		arr.push(value[i].Datasource + "/" + value[i].Symbol);
						arr.push({Datasource:value[i].Datasource,Datacategory:value[i].Datacategory,Symbol:value[i].Symbol});
	                        	    }
	                        	    console.log('Attention');
	                        	    console.log(value);
	                        	    seriesToAdd = arr;
	                    		    folderToAdd = item.value.folderUid;
	                    		
	                    		    if(seriesToAdd.length == 1) 
	                    		    {
                        			$("#addSeriesWindowContent").text("Copy 1 series to folder '" + item.value.name + "'?");
            				    } else {
            					$("#addSeriesWindowContent").text("Copy " + seriesToAdd.length + " series into folder '" + item.value.name + "'?");
            				    }
	                    		
	                		    $('#addSeriesWindow').dialog('open');
	                		    lastTreeItem = item;
	                			
	                		    if(sourceTreeItem)
                          		    $('#jqxTree').jqxTree('selectItem', sourceTreeItem);
	                    		}
	                    		isDragStart = false;
			            });
                	}
                    /* End drag&drop functionality */
                    
                 	// create context menu
                    var contextMenu = $("#jqxGridMenu").jqxMenu({ width: 100, height: 58, autoOpenPopup: false, mode: 'popup'});
                    $("#activeJqxgrid").on('contextmenu', function () {
                        return false;
                    });
                    // handle context menu clicks.
                    $("#jqxGridMenu").on('itemclick', function (event) {
                        var args = event.args;
                        
                        if ($.trim($(args).text()) == "Copy") {
                        	copySelectedSeriesToClipboard();
                        } else if ($.trim($(args).text()) == "Remove"){
                        	openRemoveSeriesFromFolderDialog();
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
        		
        		function copySelectedSeriesToClipboard(){
        			var rowsindexes = $("#activeJqxgrid").jqxGrid('getselectedrowindexes');
                	var rows = [];
 	                for (var i = 0; i < rowsindexes.length; i++) {
 	                    rows[rows.length] = $("#activeJqxgrid").jqxGrid('getrowdata', rowsindexes[i]);
 	                }
 		            
 	                var arr = new Array();
                 	for (var i = 0; i < rows.length; i++) {
                 		arr.push(rows[i].Symbol + "/" + rows[i].Symbol);
                 	}
                 	seriesToAdd = arr;
                 	
                 	var singleCase = rows.length == 1 ? "has" : "have";
                	$("#infoMessageNotificationContent").text(rows.length + " series " + singleCase + " been copied to the clipboard");
                  	$("#infoMessageNotification").jqxNotification("open");
        		}
        		
        		function isSubFoldersHasSeries(folder){
        			if(folder.hasItems == false)
        				return folder.value.items.length > 0;
        				
        			var elements = $(folder.element).find('li');
        			for (var i = 0; i < elements.length; i++) {
        				var item = $('#jqxTree').jqxTree('getItem', elements[i]);
        				if(isSubFoldersHasSeries(item) == true)
        					return true;
                		}
        			return false;
        		}
        		
        		async function updateBackupsList()
        		{
        			var backupsGridSource = {
           				datatype: "json",
           				datafields: [
        			     	    { name: 'ActiveDateLabel', type: 'date' },
        			     	    { name: 'AutoSaved', type: 'boolean' },
        			     	    { name: 'ArchiveID', type: 'integer' },
        			     	    { name: 'ArchiveName', type: 'integer' }
					],
					localdata: await getBackupsList(sessionToken)
				};
				
				var backupsGridDataAdapter = new $.jqx.dataAdapter(backupsGridSource);
				$("#backupsJqxgrid").jqxGrid({
        	                    source: backupsGridDataAdapter
        	                });
        		}
        		
        		async function showBackupsList(){
        		
        			$('#windowBackups').jqxWindow('open');
        			$('#windowBackups').jqxWindow({title: '<img height="18" width="18" src="resources/css/icons/star_icon.png" style="margin-left:2px;"></img> User Favorite backups'});
        			
        			var backupsGridSource =
                		{
           				datatype: "json",
           				datafields: [
        			     	    { name: 'ActiveDateLabel', type: 'date' },
        			     	    { name: 'AutoSaved', type: 'boolean' },
        			     	    { name: 'ArchiveID', type: 'integer' },
        			     	    { name: 'ArchiveName', type: 'string' },
        			     	            	           	        	
					],
					localdata: await getBackupsList(sessionToken)
				};
				var backupsGridDataAdapter = new $.jqx.dataAdapter(backupsGridSource);
				$("#backupsJqxgrid").jqxGrid({
				handlekeyboardnavigation:keyboardNavigation,
				    width: '100%',
				    height: '100%',
        	                    source: backupsGridDataAdapter,
        	                    columnsresize: true,
        	                    sortable: false,
        	                    showtoolbar: true,
        	                    filterable: false,
        	                    selectionmode: 'singlerow',
        	                    ready: function () {
//        	                    	alert('backup ready');

					$('#backupsJqxgrid').jqxGrid('autoresizecolumns');
				    },
        	                    rendertoolbar: function (toolbar) {
        	                        var me = this;
        	                        var container = $("<div style='margin: 5px;width:100%;'></div>");
        	                        toolbar.append(container);
        	                        container.append('<table><tr>' + 
                	                '<td><input id="btnBackupCreate" style="margin-left: 10px;" type="button" value="Create"></td>' +
        	                        '<td><input id="btnBackupEdit" style="margin-left: 10px;" type="button" value="Properties"></td>' +
        	                        '<td><input id="btnBackupRestore" style="margin-left: 10px;" type="button" value="Restore"></td>' +
        	                        '<td><input id="btnBackupRemove" style="margin-left: 10px;" type="button" value="Delete"></td>' + 
        	                        '<td style="width:100%;"></td>' + 
        	                        '</tr></table>');
        	                        
        	                        $("#btnBackupRemove").jqxButton({imgSrc: "resources/css/icons/delete.png", imgPosition: "left", width: '74', textPosition: "center"});
        	                        $("#btnBackupCreate").jqxButton({imgSrc: "resources/css/icons/add.png", imgPosition: "left", width: '74', textPosition: "center"});
        	                        $("#btnBackupRestore").jqxButton({imgSrc: "resources/css/icons/restore.png", imgPosition: "left", width: '80', textPosition: "center"});
        	                        $("#btnBackupEdit").jqxButton({imgSrc: "resources/css/icons/pencil.png", imgPosition: "left", width: '90', textPosition: "center"});
									
        	                        $("#btnBackupRemove").on('click', function () {
        	                        	var getselectedrowindexes = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');
        	           	                if (getselectedrowindexes.length == 0)
        	           	                	return;
        	           	                	
        	           	                var row = $('#backupsJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
        	                        	if(!row.padlock) {
	        	                        	$('#deleteBackupWindow').dialog('open');
	        	                        	$('#deleteBackupNameOfBackup').text('#'+ row.ArchiveID +' '+ row.ArchiveName);
	           	                        	$('#windowBackups').jqxWindow('collapse');
	        	                        	$("#deleteBackupWindowBtn").focus();
        	                        	} else {
        			    	        	$("#warningWindowContent").text("You must unlock the backup before you can delete it");
	           	                        	$('#windowBackups').jqxWindow('collapse');
        			    	        	$('#warningWindow').dialog('open');
        	                        	}
        	                	    });
        	                        $("#btnBackupCreate").on('click', function () {
        	                        	document.getElementById("backupPadlock").checked = false;
        	                        	$("#backupName").val('');
        	                        	$('#addBackupWindow').dialog('open');
        	                        	$('#windowBackups').jqxWindow('collapse');
        	                        	$("#backupName").focus();
        	                	    });
        	                        $("#btnBackupRestore").on('click', function () {
        	                        	var getselectedrowindexes = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');
        	           	                if (getselectedrowindexes.length == 0)
        	           	                	return;

       	           	                	$('#recreateBackupWindow').dialog('open');
       	           	                	
       	           	             		var row = $('#backupsJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
       	           	                	$('#recreateBackupNameOfBackup').text(row.name);
           	                        	$('#windowBackups').jqxWindow('collapse');
        	                	    });
        	                        $("#btnBackupEdit").on('click', function () {
        	                        	var getselectedrowindexes = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');
        	           	                if (getselectedrowindexes.length == 0)
        	           	                	return;
	        	           	            var row = $('#backupsJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
	        	           	            
        	                        	$('#editBackupWindow').dialog('open');
        	                        	$('#windowBackups').jqxWindow('collapse');
        	                        	
        	                        	document.getElementById("newBackupPadlock").checked = row.padlock;
	        	           	       		$('#newBackupName').val(row.name);
	        	           	       		$('#oldBackupName').text(row.name);
	        	           	       		$("#newBackupName").focus();
        	                	    });
        	                    },
        	                    columns: [
									{ text: 'ID', datafield: 'ArchiveID', cellsalign: 'center', align: 'center', width: 80},
        	           	        	{ text: 'Date', datafield: 'ActiveDateLabel', cellsalign: 'center', align: 'center', cellsformat: 'yyyy-MM-dd hh:mm:ss', minwidth: 100},
        	           	        	{ text: 'Auto', datafield: 'AutoSaved', cellsalign: 'center', align: 'center', width: 40},
        	           	        	{ text: 'Description', datafield: 'ArchiveName', cellsalign: 'left', align: 'center', minwidth: 100},
        	           	        	{ text: '<img height="18" width="18" src="/resources/css/icons/padlock_black.png" style="margin-left:2.5px;"/>', datafield: 'padlock', cellsalign: 'center', cellsrenderer: padlockRender,  align: 'center', width: 25},        	           	        	
        	        	   	    ],
        	        	   theme:theme
        	        	   	    
        	            });
        		}
        		
        		 var padlockRender = function (row, datafield, value) {
                 	if(value)
                     	return '<div><img style="margin-top:5px; display:block; margin-left: auto; margin-right: auto;" ' +
                     		' height="17" width="17" ' +
                     		'src="resources/css/icons/padlock.png"></img></div>';
                     else
                     	return '';
                 }
        		
        		function deleteBackup(){
        		    var getselectedrowindexes = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');
        		    if (getselectedrowindexes.length == 0) return;
        		    var row = $('#backupsJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
        		    try {
        			var r = call_api_command('get','DeleteBackupProfile',{SessionToken:sessionToken,ArchiveID:row.ArchiveID });
				r.then(function(result)
				{
				    if(result.Status != 200 ) alert(result.Detail);
				    else updateBackupsList();    
				});
			    }
			    catch(e)
			    {	
				console.log(e);
				alert(e);
			    }
    			}
    		
    			function createBackup(){
    			    try {
    				var bn = $('#backupName').val();
    				if(bn == '' ) {
    				    alert('Description can not be empty')
    				    return;
    				}
    				
				var r = call_api_command('get','CreateBackupProfile',{SessionToken:sessionToken,ArchiveName:bn });
				r.then(function(result)
				{
				    if(result.Status != 200 )alert(result.Detail);
				    else updateBackupsList();    
				});
			    }
			    catch(e)
			    {
				console.log(e);
				alert(e);
			    }
    			}
    		
    			function editBackup(){
    				var getselectedrowindexes = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');
   	                if (getselectedrowindexes.length == 0)
   	                	return;
   	                
   	                var newBackupName = $("#newBackupName").val();
   	                if(newBackupName == null || newBackupName == '') {
   	                	infoMessage("Backup name can't be empty");
   	                	return;
   	                }
   	                
   	             	var rows = $('#backupsJqxgrid').jqxGrid('getrows');
   	                for(var i = 0; i < rows.length; i++) {
   	                	if(i == getselectedrowindexes[0])
   	                		continue;
   	                	
   	                	var row = rows[i];
   	                	if(row.name == newBackupName) {
   	   	                	infoMessage("A backup with this name already exists");
   	                		return;
   	                	}
   	                }
   	                	
	   	            var row = $('#backupsJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
   	                var url = "/user-favourites/backup/edit?date=" + row.date.getTime()
   	                + "&name=" + newBackupName + "&padlock=" + document.getElementById('newBackupPadlock').checked;
   	                
                  	$.get(url, function(result){
                  		$("#infoMessageNotificationContent").text("Backup properties updated");
                      	$("#infoMessageNotification").jqxNotification("open");
                      	$("#backupsJqxgrid").jqxGrid('updatebounddata', 'cells');
                      	
                    	$('#editBackupWindow').dialog('close');
		    		});
    			}
    		
    			function restoreBackup(){
    				var getselectedrowindexes = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');
   	                if (getselectedrowindexes.length == 0)
   	                	return
   	                	
   	                var row = $('#backupsJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
   	                
   	             	$.get("/user-favourites/backup/restore?date=" + row.date.getTime(), function(result){
       	            	$("#infoMessageNotificationContent").text("Backup has been successfully restored");
                      	$("#infoMessageNotification").jqxNotification("open");
                      	$("#backupsJqxgrid").jqxGrid('updatebounddata', 'cells');
                      	$("#disactiveJqxgrid").jqxGrid('updatebounddata', 'cells');
                      	refreshTree();
		    		});
    			}
    			
    			var existsBackup;
    			function createNewBackupIfNeed(){
    				var oneDay = 1000 * 3600 * 24;
    				var now = new Date();
    				
    				var getselectedrowindexes = $('#backupsJqxgrid').jqxGrid('getselectedrowindexes');
   	                if (getselectedrowindexes.length == 0)
   	                	return;
   	                
   	                var selectedRow = $('#backupsJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
   	                if((now.getTime() - oneDay) < selectedRow.date.getTime()){
			        	addDefaultBackup();
						return;
			        }
   	                
    				var rows = $('#backupsJqxgrid').jqxGrid('getrows');
    				for(var i = 0; i < rows.length; i++) {
    					if( (now.getTime() - oneDay) < rows[i].date.getTime()){
    						existsBackup = rows[i];
    						$('#addDefaultBackupWindow').jqxWindow('open');
    						return;
    					}
    				}
    				
    				addDefaultBackup();
    			}
    			
    			function addDefaultBackup(padlock){
    				if(padlock == null)
    					padlock = 'true';
    				
    				$('#addDefaultBackupWindow').jqxWindow('close');
    				$.get("/user-favourites/backup/create?name=Automatic Backup for restored list&padlock=" + padlock,
    		          		function(result){
    			          		$("#infoMessageNotificationContent").text("Backup properties updated");
    			              	$("#infoMessageNotification").jqxNotification("open");
    			              	
    			              	restoreBackup();
    		    	});
    			}
    			
    			function overwriteDefaultBackup(){
    				$.get("/user-favourites/backup/remove?date=" + existsBackup.date.getTime());
    				addDefaultBackup(existsBackup.padlock);
    			}
        });
//        	alert('here');	
		initGridDatasetsOfDatasource();
        }

        var fullWidthFlag = 1;

		function disactiveFavorite(){
			var rows = new Array();
	        var checkedRows = $('#activeJqxgrid').jqxGrid('getselectedrowindexes');
	        
	        checkedRows.forEach(function(item, i, checkedRows) {
				var row = $('#activeJqxgrid').jqxGrid('getrowdata', item);
				rows.push(row);
	        });
            
           	for (var i = 0; i < rows.length; i++) {
	            var row = rows[i];
				var parameters = { database_code : row.Symbol, dataset_code : row.Symbol };
				
				$.post("/user-favourites/disactive",
						parameters, function(result) {}, 'json');
				$("#activeJqxgrid").jqxGrid('deleteRow', row.uid);
           	}
			
			$("#disactiveJqxgrid").jqxGrid('updatebounddata', 'cells');
		}
		
		function confirmDisactiveFavorite() {
			var checkedRows = $('#activeJqxgrid').jqxGrid('getselectedrowindexes');
	        if(checkedRows.length == 0)
	        	return;
	        
	    	var message = "Do you want to remove " + checkedRows.length + " series from your favourites list?";
        	apprise(message, {'verify':true}, function(r){
        		if(r){ 
					disactiveFavorite();
        		}
        	});
		}
		
		function viewPrices() {
			var rows = new Array();
			var checkedRows = $('#activeJqxgrid').jqxGrid('getselectedrowindexes');
	        
	        checkedRows.forEach(function(item, i, checkedRows) {
				var row = $('#activeJqxgrid').jqxGrid('getrowdata', item);
				rows.push(row);
	        });
            
           	for (var i = 0; i < rows.length; i++) {
	            var row = rows[i];
				
				var url = "/databases/" + row.alias + "/" + row.dataset_code;
				var win = window.open(url, '_blank');
           	}
		}
		

		async function restoreFavorite()
		{
			var getselectedrowindexes = $('#disactiveJqxgrid').jqxGrid('getselectedrowindexes');
			if( getselectedrowindexes.length == 0) return;
			var message; 
			if( getselectedrowindexes.length > 1) message = "Are you sure you want to restore "  + getselectedrowindexes.length + " series?";
			else if (getselectedrowindexes.length > 0) {
				var row = $('#disactiveJqxgrid').jqxGrid('getrowdata', getselectedrowindexes[0]);
				message = "Are you sure you want to restore " + row.Datasource + "/" + row.Symbol + " series?";
			}
			functionConfirmMessage({
				text:message,
				yes:await _restoreFavorite
			});
		}		
		async function _restoreFavorite() 
		{
			var rowsindexes = $('#disactiveJqxgrid').jqxGrid('getselectedrowindexes');
			if (rowsindexes.length < 1) return;
			rowsindexes.sort(function(a,b){ return a-b; });
			var elems = {};
			var short_elems = [],long_elems=[];
			var count_cc=0, dont_exists,deleted_tab=[];
			var existed=0;
			for(var i=0;i<rowsindexes.length;i++)
			{
				var ind=rowsindexes[i];
				var elem = $('#disactiveJqxgrid').jqxGrid('getrowdata', ind);
				c_index = elem.Datasource+'/'+elem.Datacategory+'/'+elem.Symbol;
				deleted_tab.push({Datasource:elem.Datasource,Category:elem.Category?elem.Category:"false",Symbol:elem.Symbol,DateTime:elem.DateTime});
				if(elems[c_index] != undefined ) continue; // we skip duplicates in same list
				dont_exists = userFavorites.every((s)=>{
					if(elem.Category == s.Datacategory && elem.Symbol==s.Symbol && elem.Datasource==s.Datasource)
					{
						return false;
					}
					return true;
				});
				if(dont_exists == false) { existed++; continue; }
				elems[c_index] = 1;
				long_elems.push(elem);
				if(elem.Category) short_elems.push({Datasource:elem.Datasource,Datacategory:elem.Category,Symbol:elem.Symbol});
				else short_elems.push({Datasource:elem.Datasource,Symbol:elem.Symbol});
			}
			r = await call_api_command('post','DeleteRemovedUserFavoriteDatasets',{
				SessionToken:sessionToken,
				Series:deleted_tab
			});
			if(r.Status == 200 )
			{
			    for(var i=0;i<rowsindexes.length;i++)
			    {
				var ind=rowsindexes[i];
				userDeletedFavorites.splice(ind-count_cc,1);
				count_cc++;
			    }
			    disactiveSource.localdata = userDeletedFavorites;
			    $('#disactiveJqxgrid').jqxGrid('updatebounddata','cells');
			    if(short_elems.length > 0 ) {
				r = await call_api_command('post','AddUserFavoriteDatasets',{
				    SessionToken:sessionToken,
				    Series:short_elems,
				});
				if(r.Status > 204 ) return;
			    }
			} else return;
			
			if(short_elems.length == 0 ) message = 'All selected series were already active.';//message = existed+' series '+were_or_was(existed)+' already active.';
			else if(existed!=0 && short_elems.length != 0) message = short_elems.length+' series '+were_or_was(short_elems.length)+' restored correctly<br>'+existed+' series '+were_or_was(existed)+' already active."';
			else message = 'All selected series were restored: "'+short_elems.length+' series '+were_or_was(short_elems.length)+' restored correctly"'
			
			functionNotificationMessage({text: message});

			if(short_elems.length > 0 )
			{
			    folderStructure[0].value.items = folderStructure[0].value.items.concat(short_elems);
    			    userFavorites = userFavorites.concat(long_elems);
			    refreshFavouritesGrid();
			    var items = $('#jqxTree').jqxTree('getItems');
			    items.every(function(item)
			    {
				item.label = item.value.items.length == 0 ? item.value.name : item.value.name + " (" + (item.value.items.length) + ")"
				$('#jqxTree').jqxTree('updateItem', item, item);
				return false;
			    });
			}
		}
		function deleteFavorite() 
		{
			return;
			var rowsindexes = $('#disactiveJqxgrid').jqxGrid('getselectedrowindexes');
			if (rowsindexes.length < 1) return;
			rowsindexes.sort(function(a,b){ return a-b; });
			var elems = [];
			var short_elems = [];
			var count_cc=0;
			for(var i=0;i<rowsindexes.length;i++)
			{
				var ind=rowsindexes[i];
				var elem = $('#disactiveJqxgrid').jqxGrid('getrowdata', ind);
				elems.push(elem);
				userDeletedFavorites.splice(ind-count_cc,1);
				count_cc++;
				short_elems.push({Datasource:elem.Datasource,Datacategory:elem.Datacategory,Symbol:elem.Symbol});
			}
			r = call_api_command('post','RemoveUserFavoriteDatasets',{
				SessionToken:sessionToken,
				Series:short_elems
			},true);
			var dt = r.ServerDateTime.substr(0,10)+' '+r.ServerDateTime.substr(11,8);
//			userDeleteFavorites
			disactiveSource.localdata = userDeletedFavorites;
			$('#disactiveJqxgrid').jqxGrid('updatebounddata','cells');
			
			var var_case;
			if(count_cc > 1) var_case = " symbols have ";
			else var_case = " symbol has ";
			updateDatasetsOfDatasourceGrid();
			functionNotificationMessage({text: count_cc + var_case + 'been deleted successfully'});
		}
		
		function exportFavorites(){
			var url = "/user-favourites/export";
			var win = window.open(url, '_blank');
			win.focus();
		}
		
		function exportSeries(){
			var export_format = $('input[name="export_format"]:checked').val();
			
			var symbolOnly;
			if(document.getElementById("symbolOnly") && document.getElementById("symbolOnly").checked)
				symbolOnly = true;
			else
				symbolOnly = false;
			
			var url = "/user-favourites/export?export_format="
					+ export_format + "&symbolOnly=" + symbolOnly;
			
			var win = window.open(url, '_blank');
			win.focus();
			
		}
		
		$(document).ready(function(){ 
//			document.getElementById("jqxTabs").style.visibility="visible";
			//document.getElementById("warningWindow").style.visibility="visible";
			document.getElementById("windowBackups").style.visibility="visible";
			document.getElementById("addFolderWindow").style.visibility="visible";
			//document.getElementById("deleteFolderWindow").style.visibility="visible";
			//document.getElementById("addBackupWindow").style.visibility="visible";
			//document.getElementById("editBackupWindow").style.visibility="visible";
//			document.getElementById("jqxWidget").style.visibility="visible";
			console.log('become visible');
		}); 

    $(function(){
    $(".dropdown").hover(            
            function() {
                $('.dropdown-menu', this).stop( true, true ).fadeIn("fast");
                $(this).toggleClass('open');
                $('b', this).toggleClass("caret caret-up");                
            },
            function() {
                $('.dropdown-menu', this).stop( true, true ).fadeOut("fast");
                $(this).toggleClass('open');
                $('b', this).toggleClass("caret caret-up");                
            });
    });
	
	 function toggleChevron(e) {
    $(e.target)
        .prev('.panel-heading')
        .find("i.indicator")
        .toggleClass('glyphicon-triangle-bottom glyphicon-triangle-right');
}
$('#accordion').on('hidden.bs.collapse', toggleChevron);
$('#accordion').on('shown.bs.collapse', toggleChevron);

 $('.accordion').on('show', function (e) {
         $(e.target).prev('.accordion-heading').find('.accordion-toggle').addClass('active');
    });
    
       
   $(document).ready(function() {
  $('.panel-collapse').on('show.bs.collapse', function () {
    $(this).siblings('.panel-heading').addClass('active');
  });

  $('.panel-collapse').on('hide.bs.collapse', function () {
    $(this).siblings('.panel-heading').removeClass('active');
  });
});

	async function loadDropdown()
	{
		
		var source =
	{
	    datatype: "json",
	    datafields: [
	        { name: 'Name' },
	        { name: 'Datasource' },
	        { name: 'Description' },
	        { name: 'DatasourceInfo' },
	        { name: 'group' },
		],
		localdata: userDatasources,
	    async: false
	};
	var dataAdapter = new $.jqx.dataAdapter(source);

	$("#databaseDropdown").jqxDropDownList({source: dataAdapter, displayMember: "Name", valueMember: "DatasourceInfo", 
		width: 350, height: 25, autoDropDownHeight: true, 
		renderer: function (index, label, DatasourceInfo) {
		    if(!DatasourceInfo)return label;
		    if( DatasourceInfo.Premium === false) imgurl = 'resources/css/icons/starDis_16.png';
		    else imgurl = 'resources/css/icons/star_icon.png';
        	    return '<img height="17" width="17" src="' + imgurl + '"></img> ' + "<span style='left: 3px; top: 2px; position: relative;'>" + label + "</span>";
    	    },
    	    selectionRenderer: function (element, index, label, DatasourceInfo) {
    		if(!DatasourceInfo) return label;
    		if( DatasourceInfo.Premium===false) imgurl = 'resources/css/icons/starDis_16.png';
    		else imgurl = 'resources/css/icons/star_icon.png';
    		return '<img height="17" width="17" src="' + imgurl + '" style="top:2px;position: relative;"></img> ' + "<span style='left: 3px; top: 4px; position: relative;'>" + label + "</span>";
    	    }
	});
	$("#databaseDropdown").on('select', async function (event) {
	    if (event.args) {
	        var item = event.args.item;
	        if (item) {
	        	if( DatasetsOfDatasourceSet.Request.Filter != '' )
	        	{
	        		functionConfirmMessage({
	        			text:"You are about to change datasource to '"+item.originalItem.Datasource+"'. Do you want to clear filter for the datasource?",
		        		yes:async function()
		        		{
		        			DatasetsOfDatasourceSet.Request.Filter = "";
		        			$("#searchSeriesBox").val('');
	        				await loadDatabaseDataToGrid(item.originalItem.DatasourceInfo, item.originalItem.Datasource, item.originalItem.Name);
		        		},
		        		cancel:async function()
	        			{
	        				await loadDatabaseDataToGrid(item.originalItem.DatasourceInfo, item.originalItem.Datasource, item.originalItem.Name);
		        		}
	        		});
	        	}
	        	else{
	        		await loadDatabaseDataToGrid(item.originalItem.DatasourceInfo, item.originalItem.Datasource, item.originalItem.Name);
	        	}
	        }
	    }
	});
	$("#databaseDropdown").jqxDropDownList('selectIndex', 0); 

	}
	
	function refreshPagination()
	{
		var rows = $('#gridDatasetsOfDatasource').jqxGrid('getrows');
//		var tmp = (DatasetsOfDatasourceSet.pageCounter - 1) * DatasetsOfDatasourceSet.pageSize + rows.length+'';
//		$('#gridDatasetsOfDatasource').jqxGrid('beginupdate');
//		$('#gridDatasetsOfDatasource').jqxGrid('endupdate');
		console.log($('#gridDatasetsOfDatasource').jqxGrid('getcolumnproperty','id','width'));
//		tmp.length
		DatasetsOfDatasourceSet.label.text(
		(1 + (DatasetsOfDatasourceSet.pageCounter - 1) * DatasetsOfDatasourceSet.pageSize) + "-" + 
		Math.min((DatasetsOfDatasourceSet.pageCounter - 1) * DatasetsOfDatasourceSet.pageSize + rows.length, DatasetsOfDatasourceSet.pageCounter * DatasetsOfDatasourceSet.pageSize) + ' of ' + DatasetsOfDatasourceSet.SeriesCount);
	}

	let DatasetsOfDatasourceSet =
	{
		pageSelectedIndex:0,
		pageCounter:1,
		pageSize:50,
		pagesCount:-1,
		Request: {
			Datasource: '',
			SessionToken: sessionToken,
			CaseSensitive: false,
			Filter: "",
			SortOrder: "asc",
			SortColumns: "CategoryName",
			Rows: 50,
			Page: 1,
			ShortRecord:true
		},

		source: {
			datatype: "json",
			sort: function(column,ascending)
			{
				switch(column)
				{
					case "Symbol":
					case "CategoryName":
					case "Description":
						if(ascending == null ) 
						{
							column="CategoryName";
							ascending=true;
						}
					break;
					default: return;
				}
				$('#gridDatasetsOfDatasource').jqxGrid('showloadelement');
				DatasetsOfDatasourceSet.Request.SortColumns = column;
				let seq;
				if(ascending === true ) seq='asc';
				else seq='desc';
				DatasetsOfDatasourceSet.Request.SortOrder = seq;
				var e = getDatasourceMetadata( DatasetsOfDatasourceSet.Request );
				e.then(function(r)
				{
					DatasetsOfDatasourceSet.source.localdata = r;
					$("#gridDatasetsOfDatasource").jqxGrid('updatebounddata','sort');
					$("#gridDatasetsOfDatasource").jqxGrid('hideloadelement');
				});
				e.catch(function(a)
				{
					$("#gridDatasetsOfDatasource").jqxGrid('hideloadelement');
				});
				
				
			},
			datafields: [
				{ name: 'Datasource', type: 'string' },
				{ name: 'Datacategory', type: 'string' },
				{ name: 'Symbol', type: 'string' },
				{ name: 'Favorite', type: 'boolean' },
				{ name: 'Description', type: 'string'},
				{ name: 'Frequency', type: 'string' },
				{ name: 'Values', type: 'int' },
				{ name: 'StartDate', type: 'date'},
				{ name: 'EndDate', type: 'date'},
				{ name: 'Currency', type: 'string' },
				{ name: 'Unit', type: 'string' },
				{ name: 'Additional', type: 'string' },
				{ name: 'DecimalPlaces', type: 'int' }
			],
			localdata: []
		},
	};
	DatasetsOfDatasourceSet.dataAdapter = new $.jqx.dataAdapter(  DatasetsOfDatasourceSet.source, {async: true, autoBind: false})
	
	let showAdditionalInformation = false;
	async function updateDatasetsOfDatasourceGrid(updatepages,updatetype,resizecolumns)
	{
		updatetype = updatetype==undefined ? 'all':updatetype;
		updatepages = updatepages==undefined ? true:updatepages;
		resizecolumns = resizecolumns==undefined ? true:resizecolumns;
		$('#gridDatasetsOfDatasource').jqxGrid('showloadelement');
		
		var r = await getDatasourceMetadata( DatasetsOfDatasourceSet.Request, true );
		DatasetsOfDatasourceSet.source.localdata = r.Datasets;
		
		DatasetsOfDatasourceSet.SeriesCount = r.Metadata.Datasets;
		DatasetsOfDatasourceSet.pagesCount = r.Metadata.PagesCount;
		DatasetsOfDatasourceSet.pageCounter = r.Metadata.Page;
		
		$("#gridDatasetsOfDatasource").jqxGrid('updatebounddata',updatetype);
//		console.log(r.Metadata.Rows);

		$("#gridDatasetsOfDatasource").jqxGrid({pagesize:r.Metadata.Rows});
		
		if(updatepages == true ) refreshPagination();
//		console.log(resizecolumns);
//		if(resizecolumns == true ) {
//			$("#gridDatasetsOfDatasource").jqxGrid('autoresizecolumns');
//		}1

		$('#gridDatasetsOfDatasource').jqxGrid('hideloadelement');
		resizeColumns("gridDatasetsOfDatasource");
		var tmp = DatasetsOfDatasourceSet.pageCounter * DatasetsOfDatasourceSet.pageSize;
		tmp = tmp+'';
		console.log(tmp);
		$('#gridDatasetsOfDatasource').jqxGrid('setcolumnproperty','id','width',tmp.length*10);

	}	
	
         var ColumnsHideShow = ['Additional','Currency','Unit','DecimalPlaces','Conversions'];
         function hideAdditInfo(elem) {
         	$('#'+elem).jqxGrid('showloadelement');
         	for(i=0;i<ColumnsHideShow.length;i++) $('#'+elem).jqxGrid('hidecolumn',ColumnsHideShow[i] ); 
         	$('#'+elem).jqxGrid('hideloadelement');
         	resizeColumns(elem);         	
         }
         
         var isWasShownDescription = false;
         function showAdditInfo(elem) {
         	$('#'+elem).jqxGrid('showloadelement');
         	
         	for(i=0;i<ColumnsHideShow.length;i++) {
         	    $('#'+elem).jqxGrid('showcolumn',ColumnsHideShow[i] );
         	}
         	$('#'+elem).jqxGrid('hideloadelement');
         	resizeColumns(elem);
         }
	
	var keyboardNavigation = function(event)
	{
		var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
		if( event.currentTarget.id == undefined ) return;
		if( key != 37 && key != 39 ) return;
			var id = event.currentTarget.id;
			var scrollbar = $('#'+id).jqxGrid('hScrollBar');
			var min = scrollbar.jqxScrollBar('min');
			var max= scrollbar.jqxScrollBar('max');
			if(max == 1 ) return; 
			var v = scrollbar.jqxScrollBar('value');
			var step = 20;
			switch(key)
			{
				case 39:// right
					if( v < max) v+=step;
					if(v > max) v= max;
				break;
				case 37: // left
					if( v > min) v -= step;
					if( v < 0 ) v = 0;
				break;
				default: return;
			}
			scrollbar.jqxScrollBar('setPosition',v);
	}
	
	function initGridDatasetsOfDatasource()
	{
	}
			var dsColumns = [
		{ text: '#', sortable: false, filterable: false, editable: false, cellsalign: 'left',groupable: false, 
			draggable: false, resizable: true, datafield: 'id', columntype: 'number', width: 10,
			cellsrenderer: function (row, column, value) 
			{
				return "<div style='margin-left:4px;margin-top:13px;'>" + (value + 1 + (DatasetsOfDatasourceSet.pageCounter - 1) * DatasetsOfDatasourceSet.pageSize) + "</div>";
			}
		},
		{ text: 'Category', datafield: 'Datacategory', cellsalign: 'left', align: 'center', sortable: false, filterable: false, width: 75,minwidth:75},
		{ text: '<img height="18" width="18" src="resources/css/icons/StarGrey.ico"></img>', sortable: false, width:30,minwidth:30,datafield: 'Favorite', cellsalign: 'center', filterable: false, align: 'center',
			cellsrenderer: function (row, datafield, value) 
			{
				if(value) return '<div><img style="margin-top:12.5px;display: block;margin-left: auto; margin-right: auto;" ' +
				' height="17" width="17" ' +
				'src="resources/css/icons/star_icon.png"></img></div>';
		     		return '';
			}
		}
		];

	dsColumns = dsColumns.concat(baseGridColumns);
	$("#gridDatasetsOfDatasource").jqxGrid( {
		enableellipsis: true,
		handlekeyboardnavigation:keyboardNavigation,
		theme:theme,
		columns: dsColumns,
		ready: function()
		{
			resizeColumns('gridDatasetsOfDatasource');
		},
		pagerrenderer:function () 
		{
			var element = $("<div style='margin-right: 10px; margin-top: 5px; height: 100%;float:right;'></div>");
			var datainfo = $("#gridDatasetsOfDatasource").jqxGrid('getdatainformation');
			var paginginfo = datainfo.paginginformation;
			var label = $("<div style='font-size: 13px; margin-right:3px; float: left; '></div>");
			label.appendTo(element);
			var leftPageButton = $("<div id='leftPageButton' style='padding: 0px; float: left;'><div style='margin-left: 9px; width: 16px; height: 16px;'></div></div>");
			leftPageButton.find('div').addClass('jqx-icon-arrow-left');
			leftPageButton.width(36);
			leftPageButton.jqxButton({ theme: theme });

			var rightPageButton = $("<div id='rightPageButton' style='padding: 0px; margin: 0px 3px; float: left;'><div style='margin-left: 9px; width: 16px; height: 16px;'></div></div>");
			rightPageButton.find('div').addClass('jqx-icon-arrow-right');
			rightPageButton.width(36);
			rightPageButton.jqxButton({ theme: theme });
			leftPageButton.appendTo(element);
			rightPageButton.appendTo(element);
			var label2 = $("<div style='padding: 0px; margin: 0px 3px; float: left;'> Rows: </div>");
			label2.appendTo(element);
			
			var dropdown = $('<div id="jqxPageDropDownList" style="float: left;"></div>');
			dropdown.jqxDropDownList({ source: ['50', '100', '250', '500'], selectedIndex: 
			DatasetsOfDatasourceSet.pageSelectedIndex, width: 55, height: 17, autoDropDownHeight: true, enableBrowserBoundsDetection:true });
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
//					$('#gridDatasetsOfDatasource').jqxGrid({ pagesize: DatasetsOfDatasourceSet.pageSize}); 
		         	}
			});
			dropdown.appendTo(element);
			DatasetsOfDatasourceSet.label = label;
			refreshPagination();
			//
			// update buttons states.
			//
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
		     	rightPageButton.click(async function () 
		     	{
//		     		var rows = $('#gridDatasetsOfDatasource').jqxGrid('getrows');
//		     		if(rows.length != DatasetsOfDatasourceSet.pageSize) return;
				if(DatasetsOfDatasourceSet.pageCounter == DatasetsOfDatasourceSet.pagesCount) return;
				DatasetsOfDatasourceSet.pageCounter++;
				DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
				updateDatasetsOfDatasourceGrid(true,'all',false);
				
		     	});
		     	leftPageButton.click(async function () {
		     		if(DatasetsOfDatasourceSet.pageCounter == 1) return;
				DatasetsOfDatasourceSet.pageCounter--;
				DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
				updateDatasetsOfDatasourceGrid(true,'all',false);				
		     	});
		     	return element;
		},
		width: '100%',
		height: '100%',
		rowsheight: 40,
		scrollbarsize: 10,
		source: DatasetsOfDatasourceSet.dataAdapter,
		columnsresize: true,
		sortable: true,
		showtoolbar: true,
		pageable: true,
		enablebrowserselection: false,
//		pagesize:DatasetsOfDatasourceSet.Request.Rows,
		selectionmode: 'multiplerowsadvanced',
//		deferreddatafields: ['Description'],
//		scrollmode: 'deferred',
		toolbarheight:37,
		rendertoolbar: function (toolbar) {
			var me = this;
			var container = $("<div style='margin: 5px;width:100%;'></div>");
			toolbar.append(container);
					
			var toolbarContent = '<table class="toolbar-table" style="width:100%;"><tr>' + 
				'<td><input id="btnCopySeriesToFavorite" style="margin-left: 5px;" type="button" value="Add to Favorites" ></td>'+
				'<td><img src="resources/css/icons/search.png" style="float:left;margin-left:10px;"></td>'+
				'<td><input id="searchSeriesBox" style="float:left;margin-left:5px;"></td>'+
				'<td style="width:100%;" align="right"><input id="btnAutosize" title="Autosize Columns" style="margin-right:10px;" type="button"></td>' +
				'<td><input id="btnHideShowEmptyRecords" style="margin-right: 5px;" type="button"></td>'+
				'<td><input id="btnHideAdditInfo_datasource" title="Show additional data columns" style="margin-right: 5px;" type="button"></td>'+
				'<td><input class="fullWidthPage" id="fullWidth3" title="Toggle grid to full screen width" style="margin-right:10px;"></td>' +
			'</tr></table>';
			container.append(toolbarContent);
			// Define buttons
			$("#btnCopySeriesToFavorite").jqxButton({ imgSrc: "resources/css/icons/starAdd16.png", imgPosition: "left", width: 120, height: 25, textPosition: "right"});
			$("#fullWidth3").jqxButton({imgSrc: "resources/css/icons/fullscreen.png", imgPosition: "left", width: '26', textPosition: "right"});
			$("#btnAutosize").jqxButton({imgSrc: "resources/css/icons/autosize.png", imgPosition: "center", width: '30'});
			$("#btnAutosize").tooltip();
			$("#btnHideAdditInfo_datasource").jqxToggleButton({ imgSrc: "resources/css/icons/table_plus.png", imgPosition: "center", width: 25, height: 25 });
			$("#btnHideShowEmptyRecords").jqxToggleButton({ imgSrc: "resources/css/icons/ShowRows2_16.png", imgPosition: "center", width: 25, height: 25});
			$("#searchSeriesBox").jqxInput({height: 22, width:250, minLength: 1, placeHolder: "Enter filter text"});
			// Events
			$('#searchSeriesBox').keypress(async function (e) {
				if (e.which == 13) 
				{																																																																																																																																																																														
					var filter = $("#searchSeriesBox").val();
					if( DatasetsOfDatasourceSet.Request.Filter!=filter) {
						DatasetsOfDatasourceSet.Request.Filter = filter;
						updateDatasetsOfDatasourceGrid();						
					}
				}
			});
			
			$("#searchSeriesBox").bind("input", function (evt) {
				if (window.event && event.type == "propertychange" && event.propertyName != "value") return;
				window.clearTimeout($(this).data("timeout"));
				$(this).data("timeout", setTimeout(async function () {
					var filter = $("#searchSeriesBox").val();
					if( DatasetsOfDatasourceSet.Request.Filter!=filter) {
						DatasetsOfDatasourceSet.Request.Filter = filter;
						updateDatasetsOfDatasourceGrid(true,'sort');
					}
					
				}, 900));
			});
			$("#btnCopySeriesToFavorite").on('click', function () {
				copySeriesToFavorite();
			});
			$("#btnAutosize").on('click', function () {
//				$("#gridDatasetsOfDatasource").jqxGrid('autoresizecolumns');
				resizeColumns('gridDatasetsOfDatasource');
//				autoresizeColumnsManually();
//				autoresizeDescriptionManually();
			});
			$("#fullWidth3").on('click', function ()
			{
				if(fullWidthFlag === 1)
				{
					$(".fullWidthPage").jqxButton({imgSrc: "resources/css/icons/fullscreen1.png", imgPosition: "left", width: '26', textPosition: "right"});
						document.getElementsByClassName("fixpage")[0].style.maxWidth = "100%";
				}
				else
				{
					$(".fullWidthPage").jqxButton({imgSrc: "resources/css/icons/fullscreen.png", imgPosition: "left", width: '26', textPosition: "right"});
					document.getElementsByClassName("fixpage")[0].style.maxWidth = "1200px";
				}
				fullWidthFlag *= -1;
				window.dispatchEvent(new Event('resize'));
				resizeColumns('gridDatasetsOfDatasource');
			});
			$("#btnHideAdditInfo_datasource").on('click', function (event) {
				var current_grid = "gridDatasetsOfDatasource";
				var id = event.currentTarget.id;
				console.log(id);
				var toggled = $('#'+id).jqxToggleButton('toggled');
				if (toggled) {
					$("#"+current_grid).jqxGrid('beginupdate');
					showAdditInfo(current_grid);
					document.getElementById(id).title = "Hide additional data columns";
					$("#"+current_grid).jqxGrid('endupdate');
					DatasetsOfDatasourceSet.Request.ShortRecord=false;
					updateDatasetsOfDatasourceGrid();			
					
				} else {
					$("#"+current_grid).jqxGrid('beginupdate');
					hideAdditInfo(current_grid);
					document.getElementById(id).title = "Show additional data columns";
					$("#"+current_grid).jqxGrid('endupdate');
					
					DatasetsOfDatasourceSet.Request.ShortRecord=true;
					updateDatasetsOfDatasourceGrid();			
				}
			});

			
			$("#btnHideShowEmptyRecords").on('click', function () {
				var toggled = $("#btnHideShowEmptyRecords").jqxToggleButton('toggled');
				hideEmpty = !toggled;
				if (toggled) {
//					showEmptyRecords();
					DatasetsOfDatasourceSet.Request.Page = 1;
					DatasetsOfDatasourceSet.Request.IgnoreEmpty=false;
					updateDatasetsOfDatasourceGrid();			
					
					document.getElementById("btnHideShowEmptyRecords").title = "Hide records with no values";
					$("#btnHideShowEmptyRecords").tooltip();
					$("#showHideEmptyRecords").text("Hide empty records");
					$("#btnHideShowEmptyRecords").jqxToggleButton({ imgSrc: "resources/css/icons/HideRowsGn_16.png", imgPosition: "center", width: 25, height: 25});
				} else {
//					hideEmptyRecords();
					DatasetsOfDatasourceSet.Request.Page = 1;
					DatasetsOfDatasourceSet.Request.IgnoreEmpty=true;
					updateDatasetsOfDatasourceGrid();			
					
					document.getElementById("btnHideShowEmptyRecords").title = "Show records with no values";
					$("#btnHideShowEmptyRecords").tooltip();
					$("#showHideEmptyRecords").text("Show empty records");
					$("#btnHideShowEmptyRecords").jqxToggleButton({ imgSrc: "resources/css/icons/ShowRows2_16.png", imgPosition: "center", width: 25, height: 25});
				}
			});
			/*
			document.getElementById("btnHideAdditInfo").title = "Show additional data columns";
			$("#btnHideAdditInfo").tooltip();
			*/
			document.getElementById("btnHideShowEmptyRecords").title = "Show records with no values";
			$("#btnHideShowEmptyRecords").tooltip();
			
			$("#fullWidth3").tooltip();
			document.getElementById("jqxTabs").style.visibility="visible";
			
//			document.getElementById("jqxWidget").style.display="block";

		}
	});
//	}
	// create context menu
	var databaseJqxgridContextMenu = $("#databaseJqxgridMenu").jqxMenu({ width: 160, height: 29, autoOpenPopup: false, mode: 'popup'});
	$("#gridDatasetsOfDatasource").on('contextmenu', function () { return false; });
	// handle context menu clicks.
	$("#databaseJqxgridMenu").on('itemclick', function (event) {
		var args = event.args;
		if ($.trim($(args).text()) == "Add to Favorites") {
			copySeriesToFavorite();
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
	$("#gridDatasetsOfDatasource").on('contextmenu',function(e) {
		e.preventDefault();
	});
	
	async function loadDatabaseDataToGrid(DatasourceInfo, databaseCode, databaseAlias) 
	{
		console.log(DatasourceInfo);
		DatasetsOfDatasourceSet.pageCounter = 1;
		DatasetsOfDatasourceSet.Request.Datasource = databaseCode;
		DatasetsOfDatasourceSet.Request.Rows = DatasetsOfDatasourceSet.pageSize;
		DatasetsOfDatasourceSet.Request.Page = DatasetsOfDatasourceSet.pageCounter;
		
		$("#gridDatasetsOfDatasource").jqxGrid('beginupdate');		
		if(DatasourceInfo.CategoryDS == true ) $("#gridDatasetsOfDatasource").jqxGrid('showcolumn','Datacategory');
		else $("#gridDatasetsOfDatasource").jqxGrid('hidecolumn','Datacategory');
		$("#gridDatasetsOfDatasource").jqxGrid('endupdate');
		
		await updateDatasetsOfDatasourceGrid();
		
		let a = $("#gridDatasetsOfDatasource").jqxGrid('getcolumnproperty','Description','width');
//		console.log(a);
		
		//$("#gridDatasetsOfDatasource").jqxGrid('autoresizecolumns');
		
		 
         

         
	         
         function showEmptyRecords() {
         	DatasetsOfDatasourceSet.pageCounter = 1;
         }
         
         function hideEmptyRecords() {
	     	DatasetsOfDatasourceSet.pageCounter = 1;
         }

         
	function searchSeries()
	{
		
/*	
		pageCounter = 1;
		pagingCodes = [];
		
		source.url = "/databases/" + databaseAlias + "/loadSeries?pageSize=" + pageSize + "&sortcolumn=" 
				+ sortcolumn + "&desc=" + desc + "&hideEmpty=" + hideEmpty + "&search=" + encodeURIComponent($("#searchSeriesBox").val());
		$("#gridDatasetsOfDatasource").jqxGrid('updatebounddata', 'cells');
*/		
	}
	
	// autoresizeColumnsManually();
	// autoresizeDescriptionManually();
				 
	
	}
	
	async function copySeriesToFavorite()
	{
		var indexes = $('#gridDatasetsOfDatasource').jqxGrid('getselectedrowindexes');
		if( indexes.length < 1 ) return;
		var duplicates = [];
		for(var i=0;i<indexes.length;i++)
		{
			var row = $('#gridDatasetsOfDatasource').jqxGrid('getrowdata', indexes[i]);
			if(row.Favorite == true ) duplicates.push(row.Symbol);
		}
		if(duplicates.length > 0)
		{
			var h = duplicates.length  == 1? 'was': 'were';
			functionNotificationMessage({text:'Series: '+duplicates.join(',')+' '+h+' already marked as "Favorites"'});
		}
		else
		functionConfirmMessage({
			text:"Do you want to add "+indexes.length+" series to favorites list?",
			yes:async function()
			{
				var series=[];
				for(var i=0;i<indexes.length;i++)
				{
					var row = $('#gridDatasetsOfDatasource').jqxGrid('getrowdata', indexes[i]);
					if(row.Datacategory!=undefined && row.Datacategory!="") series.push({Datasource:row.Datasource,Symbol:row.Symbol,Datacategory:row.Datacategory});
					else series.push({Datasource:row.Datasource,Symbol:row.Symbol});
				}
				var r;
				try {
					r = await call_api_command('post','AddUserFavoriteDatasets',{
						SessionToken:sessionToken,
						Series:series
					});
					if(r.Added != undefined && r.Added > 0 )
					{
						var to_add = [];
						var fields = ['Additional','Currency','Datacategory','Datasource','DecimalPlaces','Description','EndDate','Favorite','Frequency','StartDate','Symbol','Unit','Values'];
						for(var i=0;i<indexes.length;i++)
						{
							var row = $('#gridDatasetsOfDatasource').jqxGrid('getrowdata', indexes[i]);
							row.Favorite = true;
							$('#gridDatasetsOfDatasource').jqxGrid('updaterow', indexes[i],row);
/*							var found=false;
							for( var j=0; j< userFavorites.length; j++)
							{
								var u = userFavorites[j];
								if( row.Datasource == u.Datasource && row.Symbol == u.Symbol )
								{
									found=true;
									break;
								}
							}
							if( found == false )*/
							{
								var elem={},fj;
								for(var j=0;j<fields.length;j++)
								{
									fj = fields[j];
									if(row[fj] != undefined && row[fj]!="" ) elem[fj] = row[fj];
								}
								to_add.push(elem);
								folderStructure[0].value.items.push({Datasource:elem.Datasource,Datacategory:elem.Datacategory,Symbol:elem.Symbol});
							}
						}
						if(to_add.length > 0 )
						{
							userFavorites = userFavorites.concat(to_add);
							refreshFavouritesGrid();
						}
						functionNotificationMessage({text:"You have successfully added "+r.Added+" series to your Favorites list"});
					}
				}
				catch(e)
				{
					console.log(e);
					functionNotificationMessage({text:e});
				}
			}
		});
	}	
	
	function openSeriesInNewTab(database, series) {
		 confirmMessage("Do you want to view the series " + database + "/" + series + " in a new tab?", 
			 function() {
	        	var win = window.open("/databases/" + database + "/" + series, '_blank');
   				win.focus();
   			});
	}
	 
	 function confirmMessage(msg, callback) {
		 
		 if(msg.indexOf("leave the favorites page") != -1)
		 {
			$("#confirmWindowContent").text(msg);
			$("#confirmWindow").dialog({
				resizable: true,
				autoOpen: true,
				height: "auto",
				width: "auto",
				modal: true,
					open: function(){
						$(this).css('padding', '25px');
					},
				buttons: {
					Ok: function() {
						callback();
						$( this ).dialog( "close" );
					},
					Cancel: function() {
						$( this ).dialog( "close" );
					}
				}
				});
		 }

		 	$("#confirmWindowContent").text(msg);
			$("#confirmWindow").dialog({
				resizable: true,
				autoOpen: true,
				height: "auto",
				width: "auto",
				modal: true,
				buttons: {
					Ok: function() {
						callback();
						$( this ).dialog( "close" );
					},
					Cancel: function() {
						$( this ).dialog( "close" );
					}
				}
				});
			
	 };
	 
	 function infoMessage(msg) {
		 $("#infoWindowContent").text(msg);
		 $("#infoWindow").dialog({
  		      resizable: false,
              autoOpen: true,
  		      height: "auto",
  		      width: "auto",
  		      modal: true,
  		      buttons: {
  		        Ok: function() {
  		          	$( this ).dialog( "close" );
  		        }
  		      }
  		 });
	 };
	 
	 function handleCloseFavoritesPage(link) {
		 confirmMessage("Are you sure you want to leave the favorites page?", 
			 function() {
	        	window.open(link, "_self");
   			});
	 }
	 async function handleLogout()
	 {
		 confirmMessage("Are you sure you want to logout?", 
		    async () => {
			console.log('sessionToken='+sessionToken); 
			try {
			    await call_api_command('get','RevokeSessionToken',{SessionToken:sessionToken});
			    window.location.href = "/";
			}
			catch(e)
			{
			    console.log('exception ');
			    alert(e);
			}
		    }
		);
	 }
	 
	 function autoresizeColumnsManually(dataAdapter, gridName) {
     	var gridRecords = [];//dataAdapter.records;
     	var maxCodeCharactersCount = Math.max.apply(Math, gridRecords.map(function(o){  return o.Symbol.length;}));
     	var maxNameCharactersCount = Math.max.apply(Math, gridRecords.filter(s => s.name != null)
     			.map(function(o){return o.name.length;}));	 

			//	 console.log("test me");
			//	 console.log(maxCodeCharactersCount);
     	resizeColumnsRegardingCharactersCount('Symbol', maxCodeCharactersCount, gridName); 
     	resizeColumnsRegardingCharactersCount('name', maxNameCharactersCount, gridName);
		resizeColumnsRegardingCharactersCount('first_date', 11, gridName);
		resizeColumnsRegardingCharactersCount('last_date', 11, gridName);
		resizeColumnsRegardingCharactersCount('frequency', 9, gridName);
		resizeColumnsRegardingCharactersCount('prices', 9, gridName);


    	if(gridRecords.length > 0 && gridRecords[0].link != null) {
         	resizeColumnsRegardingCharactersCount('link', maxCodeCharactersCount, gridName);
     	}
     }
     
     function resizeColumnsRegardingCharactersCount(column, charactersCount, gridName) {
     	var k;
     	if( charactersCount < 50) {
     		k = 7.5;
     	} else if ( charactersCount < 100) {
     		k = 6.5;
     	} else {
     		k = 6;
     	}
     	$("#" + gridName).jqxGrid('setcolumnproperty', column, 'width', charactersCount*k +30);
    }