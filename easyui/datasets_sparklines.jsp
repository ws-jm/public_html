<%@page import="java.util.*,java.sql.*"%><html>
<%@page import="java.util.*,java.sql.*"%><html>
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<!DOCTYPE html>
<html>
<head>
<spring:url value="/resources/css/bootstrap-navbar.css"	var="bootstrapCSS" />
<spring:url value="/resources/css/bootstrap-theme-navbar.css"	var="bootstrapThemeCSS" />
<spring:url value="/resources/css/apprise.css"	var="appriseCSS" />


<spring:url value="/resources/js/jquery-1.11.1.min.js" var="jqueryJS" />
<spring:url value="/resources/js/bootstrap.min.js" var="bootstrapJS" />
<spring:url value="/resources/js/bootstrap-dropdown.js" var="dropdownJS" />
<spring:url value="/resources/js/apprise.js" var="appriseJS" />


<spring:url value="/resources/jqwidgets/styles/jqx.base.css" var="jqxbasecss" />
<spring:url value="/resources/jqwidgets/styles/jqx.arctic.css" var="jqxarcticcss" />
<spring:url value="/resources/jqwidgets/styles/jqx.bootstrap.css" var="jqxbootstrapcss" />
<spring:url value="/resources/jqwidgets/jqxcore.js" var="jqxcorejs" />
<spring:url value="/resources/jqwidgets/jqxdata.js" var="jqxdatajs" />
<spring:url value="/resources/jqwidgets/jqxbuttons.js" var="jqxbuttonsjs" />
<spring:url value="/resources/jqwidgets/jqxscrollbar.js" var="jqxscrollbarjs" />
<spring:url value="/resources/jqwidgets/jqxmenu.js" var="jqxmenujs" />
<spring:url value="/resources/jqwidgets/jqxlistbox.js" var="jqxlistboxjs" />
<spring:url value="/resources/jqwidgets/jqxdropdownlist.js" var="jqxdropdownlistjs" />
<spring:url value="/resources/jqwidgets/jqxwindow.js" var="jqxwindowjs" />
<spring:url value="/resources/jqwidgets/jqxinput.js" var="jqxinputjs" />
<spring:url value="/resources/jqwidgets/jqxtextarea.js" var="jqxtextareajs" />
<spring:url value="/resources/jqwidgets/jqxchart.core.js" var="jqxchartcorejs" />
<spring:url value="/resources/jqwidgets/jqxpopover.js" var="jqxpopoverjs" />
<spring:url value="/resources/jqwidgets/jqxcalendar.js" var="jqxcalendarjs" />
<spring:url value="/resources/jqwidgets/jqxdatetimeinput.js" var="jqxdatetimeinputjs" />
<spring:url value="/resources/jqwidgets/jqxswitchbutton.js" var="jqxswitchbuttonjs" />
<spring:url value="/resources/jqwidgets/jqxdraw.js" var="jqxdrawjs" />
<spring:url value="/resources/jqwidgets/jqxdatatable.js" var="jqxdatatablejs" />


<script src="${jqueryJS}"></script>
<script src="${bootstrapJS}"></script>
<script src="${dropdownJS}"></script>
<script src="${appriseJS}"></script>

<script src="${jqxcorejs}"></script>
<script src="${jqxdatajs}"></script>
<script src="${jqxbuttonsjs}"></script>
<script src="${jqxscrollbarjs}"></script>
<script src="${jqxmenujs}"></script>
<script src="${jqxdropdownlistjs}"></script>
<script src="${jqxlistboxjs}"></script>
<script src="${jqxwindowjs}"></script>
<script src="${jqxinputjs}"></script>
<script src="${jqxtextareajs}"></script>
<script src="${jqxdrawjs}"></script>
<script src="${jqxchartcorejs}"></script>
<script src="${jqxpopoverjs}"></script>
<script src="${jqxcalendarjs}"></script>
<script src="${jqxdatetimeinputjs}"></script>
<script src="${jqxswitchbuttonjs}"></script>
<script src="${jqxdatatablejs}"></script>


<link href="${jqxbasecss}" rel="stylesheet" />
<link href="${jqxbootstrapcss}" rel="stylesheet" />
<link href="${jqxarcticcss}" rel="stylesheet" />
<link href="${bootstrapCSS}" rel="stylesheet" />
<link href="${bootstrapThemeCSS}" rel="stylesheet" />
<link href="${appriseCSS}" rel="stylesheet" />

<link rel="icon" type="image/x-icon" href="/idm-service/favicon.ico">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>${alias} database</title>
</head>
<body style="overflow-y:hidden;">
	<%@ include file="navbar.html"%>

	<div id="page_content" style="padding: 5px;width:100%;" >
		<div style="width:100%;padding:10px;">
	        <span style="font-size: 18px;font-family:Tahoma, Geneva, sans-serif;float:left;margin-right:10px;margin-bottom:10px;">Database: ${alias}</span>
	        <input id="searchBox" style="float:left;margin-right:10px;"> <input style="float:left;" type="button" id="searchBtn"/>
	    </div>
	    
		<div id='jqxWidget' style="font-size: 13px; width:100%;">
			<div id="jqxgrid"></div>
			
			<div id="categoryAddDialogWindow">
				<div>
                    <span id="categoryAddDialogWindowHeader"></span>
                </div>
	            <div style="overflow: hidden;" id="categoryAddDialogContent">
		            <form id="formAddSeriesToCategory" method="post" style="margin:0;padding:20px 50px">
			        	<div style="margin-bottom:10px">
			                Dataset ID: <input id="add_dataset_code">
			            </div>
			            <div style="margin-bottom:10px">
			                Dataset Name: <input id="add_dataset_name">
			            </div>
			            <div style="margin-bottom:10px">
			               Category: <div name="addToCategory" id="categoryDropdownList"></div>
			            </div>
			        </form>
			        
			        <div style="float: right">
                    	<input type="button" value="Add" id="addCategoryButton" />
                     	<input type="button" value="Cancel" id="cancelCategoryButton" />
                    </div>
	            </div>
            </div>
            
            <div id="exportDialogWindow">
				<div>
                    <span>Export Series</span>
                </div>
	            <div style="overflow: hidden;" id="categoryAddDialogContent">
		             <form id="formExportSeries" method="post" style="margin:0;padding:20px 20px">
			            <div style="margin-bottom:10px">
				            <input type="radio" name="export_type" style="margin-bottom:10px;" value="selected" checked="checked"> Selected Records<br>
			   				<input type="radio" name="export_type" style="margin-bottom:10px;" value="all"> All Records in the database<br>
			   				<sec:authorize access="hasAuthority('ADMIN') and isAuthenticated()">
			   					<input type="checkbox" id="import_format"> Import Format<br>
			   				</sec:authorize>
			            </div>
			        </form>
			        
			        <div style="float: right;">
                    	<input type="button" value="Export" id="exportSeriesBtn" />
                     	<input type="button" value="Cancel" id="cancelExportDialog" />
                    </div>
	            </div>
            </div>
		</div>
	</div>

	<script type="text/javascript">
		$.jqx.theme = 'Arctic';
		var empty_series = true;
		var search = '';
		var url;
		var source;
		var cols;
		$(document).ready(function () {
            url = "/idm-service/databases/${database}/loadSeries?empty_series=" 
            		+ empty_series + "&search=" + search;
            // prepare the data
            source =
            {
                datatype: "json",
                datafields: [
                    { name: 'code', type: 'string' },
                    { name: 'name', type: 'string' },
                    { name: 'favorite', type: 'boolean' },
                    { name: 'description', type: 'string'},
                    { name: 'frequency', type: 'string' },
                    { name: 'prices', type: 'int' },
                    { name: 'first_date', type: 'date'},
                    { name: 'last_date', type: 'date'},
                    { name: 'last_refreshed', type: 'string' },
                    { name: 'accessed', type: 'int' },
                    { name: 'last_accessed', type: 'string' },
                    { name: 'sparkline_list', type: 'array' }
                ],
                url: url
            };
            var dataAdapter = new $.jqx.dataAdapter(source, {
                downloadComplete: function (data, status, xhr) { },
                loadComplete: function (data) { },
                loadError: function (xhr, status, error) { }
            });
            
            var imagerenderer = function (row, datafield, value) {
            	if(value)
                	return '<div><img style="margin-top:5px;display: block;margin-left: auto; margin-right: auto;" ' +
                		' height="17" width="17" ' +
                		'src="/idm-service/resources/css/icons/star_icon.png"/></div>';
                else
                	return '';
            }
            
            // initialize jqxGrid
            $("#jqxgrid").jqxDataTable(
            {
            	width: '100%',
                height: '100%',
                source: dataAdapter,
                sortable: true,
                columnsResize: true,
                pageable: true,
                pagerMode: 'advanced',
                showtoolbar: true,
                scrollBarSize: 10,
                filterable: true,
                filterMode: 'advanced',
                selectionMode: 'multiplerowsadvanced',
                pageSizeOptions: [25, 50, 100, 200, 500],
                pageSize: 25,
                ready: function () {
                },
                rendered: function () {
                	for (var i = 0; i < dataAdapter.loadedData.length; i++) {
                     	createSparkline('#sparklineContainer' + i, dataAdapter.loadedData[i].sparkline_list, 'line');
                	}
                },
                rendertoolbar: function (toolbar) {
                    var me = this;
                    var container = $("<div style='margin: 5px;width:100%;'></div>");
                    toolbar.append(container);
    				
                    container.append('<table><tr><td><input id="btnReloadSelectedSeries" onclick="reloadSelectedSeries()" type="button" value="Refresh" /></td>' + 
                    '<td><input id="btnCopyToClipboard" style="margin-left: 5px;" type="button" value="Copy" /></td>'+

                   <sec:authorize access="hasAuthority('ADMIN') and isAuthenticated()">
                    	'<td><input id="btnCopySeriesToCategory" style="margin-left: 5px;" type="button" value="Category+" /></td>'+
    				</sec:authorize>
    				
    				<sec:authorize access="hasAuthority('USER') and isAuthenticated()">
                    	'<td><input id="btnCopySeriesToFavorite" style="margin-left: 5px;" type="button" value="Add to Favorites" /></td>'+
    				</sec:authorize>
                    
                    '<td><input id="btnExportSeries" style="margin-left: 5px;" type="button" value="Export" /></td>' +
                    '<td><input id="btnDisactiveSparklines" style="margin-left: 5px;" type="button" /></td>'+
                    '</tr></table>');
                    
                    // Define buttons
                    $("#btnReloadSelectedSeries").jqxButton({ imgSrc: "/idm-service/resources/css/icons/reload.png", imgPosition: "left", width: 70, height: 25, textPosition: "right"});
                    $("#btnCopyToClipboard").jqxButton({ imgSrc: "/idm-service/resources/css/icons/cut.png", imgPosition: "left", width: 60, height: 25, textPosition: "right"});
                    <sec:authorize access="hasAuthority('ADMIN') and isAuthenticated()">
                    	$("#btnCopySeriesToCategory").jqxButton({ imgSrc: "/idm-service/resources/css/icons/edit_add.png", imgPosition: "left", width: 85, height: 25, textPosition: "right"});
                    </sec:authorize>
                    <sec:authorize access="hasAuthority('USER') and isAuthenticated()">
                    	$("#btnCopySeriesToFavorite").jqxButton({ imgSrc: "/idm-service/resources/css/icons/starAdd16.ico", imgPosition: "left", width: 120, height: 25, textPosition: "right"});
                    </sec:authorize>
                    $("#btnExportSeries").jqxButton({ imgSrc: "/idm-service/resources/css/icons/filesave.png", imgPosition: "left", width: 65, height: 25, textPosition: "right"});
                    $("#btnDisactiveSparklines").jqxToggleButton({ imgSrc: "/idm-service/resources/css/icons/large_chart.png", imgPosition: "center", width: 25, height: 25, toggled: true});
                    
                    // Eventes
                    $("#btnExportSeries").on('click', function () {
                    	makeExportSeriesDialog();
            	    });
                    $("#btnReloadSelectedSeries").on('click', function () {
                    	refreshSeries();
            	    });
                    $("#btnCopyToClipboard").on('click', function () {
                    	copyToClipboard();
            	    });
                    $("#btnCopySeriesToCategory").on('click', function () {
                    	copySeriesToCategory();
            	    });
                    $("#btnCopySeriesToFavorite").on('click', function () {
                    	copySeriesToFavorite();
            	    });
                    $("#btnDisactiveSparklines").on('click', function () {
                    	window.location = "/idm-service/databases/${database}";
            	    });
                },
                columns: [
				  {
					    text: '#', sortable: false, filterable: false, editable: false, cellsalign: 'left',
					    groupable: false, draggable: false, resizable: false,
					    datafield: '', columntype: 'number', width: 50,
					    cellsrenderer: function (row, column, value) {
					        return "<div style='margin:4px;'>" + (row + 1) + "</div>";
					    }
				  },
                  { text: 'Symbol', datafield: 'code', cellsalign: 'left', align: 'center', minwidth: 100},
                  { text: '<img height="18" width="18" src="/idm-service/resources/css/icons/large_chart.png"/>', datafield: 'sparkline_list', cellsalign: 'center', 
                	  align: 'center', width: 150, sortable: false, filterable: false,
                	  cellsRenderer: function (row, column, value, rowData) {
                          var div = "<div id=sparklineContainer" + row + " style='margin: 0px; margin-bottom: 0px; width: 100%; height:60px;'></div>";
                          return div;
                      }
				  },
                  { text: '<img height="18" width="18" src="/idm-service/resources/css/icons/StarGrey.ico"/>', width:'25', datafield: 'favorite', cellsalign: 'center', 
					  cellsrenderer: imagerenderer, align: 'center', sortable: false, filterable: false},
                  { text: 'Description', datafield: 'name', cellsalign: 'left', align: 'center'},
                  { text: '# Prices', datafield: 'prices', filtertype: 'number', cellsalign: 'center', align: 'center', minwidth: 60},
                  { text: 'Frequency', datafield: 'frequency', cellsalign: 'center', align: 'center', minwidth: 60},
                  { text: 'From',datafield: 'first_date', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'center', align: 'center', minwidth: 80},
                  { text: 'To', datafield: 'last_date', filtertype: 'range', cellsformat: 'yyyy-MM-dd', cellsalign: 'center', align: 'center', minwidth: 80},
                  { text: 'Last refreshed', datafield: 'last_refreshed', cellsalign: 'left', align: 'center', minwidth: 180},
                  <sec:authorize access="hasAuthority('ADMIN') and isAuthenticated()">{ text: '# Accessed', datafield: 'accessed', filtertype: 'number', cellsalign: 'center', align: 'center'},</sec:authorize>
                  { text: 'Last accessed', datafield: 'last_accessed', cellsalign: 'center', align: 'center', minwidth: 90},
                  { text: 'Additional information', datafield: 'description', cellsalign: 'left', align: 'center', maxwidth: 350}
                ]
            });
            
            function createSparkline(selector, data, type)
            {
            	console.log("start rendering");
                var settings = {
                    title: '',
                    description: '',
                    showLegend: false,
                    enableAnimations: false,
                    showBorderLine: false,
                    showToolTips: false,
                    backgroundColor: 'transparent',
                    padding: { left: 0, top: 0, right: 0, bottom: 0 },
                    titlePadding: { left: 0, top: 0, right: 0, bottom: 0 },
                    source: data,
                    xAxis:
                    {
                        visible: false,
                        valuesOnTicks: false
                    },
                    colorScheme: 'scheme01',
                    seriesGroups:
                        [
                           {
                               type: type,
                                valueAxis:
                                {
                                	axisSize: 'auto',
                                    visible: false
                                },
                                series: [
                                        {
                                            linesUnselectMode: 'click',
                                            lineWidth: 2,
                                            colorFunction: function (value, itemIndex, serie, group) {
                                                return '#db6630';
                                            }
                                        }
                                    ]
                            }
                        ]
                };

                if($(selector).length > 0)
                	$(selector).jqxChart(settings);
            }            
        });

		
		
		var page_content;
		function resizeElements(){
			page_content = document.getElementById('page_content');
			var scrollTop = $(window).scrollTop(), elementOffset = page_content.offsetTop, distance = (elementOffset - scrollTop);
			page_content.style.height = window.innerHeight - distance - 45;
		}
		
		$( window ).resize(function() {
			resizeElements();
		});
		
		(function () {
			resizeElements();
		}());
		
		function searchSeries(){
			url = "/idm-service/databases/${database}/loadSeries?empty_series=" 
        		+ empty_series + "&search=" + $("#searchBox").val();
		    source.url = url;
			$("#jqxgrid").jqxGrid('updatebounddata', 'cells');
		}
		
		$('#searchBtn').jqxButton({imgSrc: '/idm-service/resources/css/icons/Search32.ico', imgPosition: 'center', width: '27'});
		$("#searchBox").jqxInput({height: 22, width:300, minLength: 1});
		$("#searchBtn").on('click', function () {
			searchSeries();
 	   	});
		
		$('#searchBox').keypress(function (e) {
			  if (e.which == 13) {
				  searchSeries();
			    return false;
			  }
		});
		
		function onDblClickRow(index,row){
			var url = "/idm-service/databases/${database}/" + row.code;
			var win = window.open(url, '_blank');
			win.focus();
		}
		
		$("#jqxgrid").on("rowDoubleClick", function (event)
		{
			var row = event.args.row;
			var url = "/idm-service/databases/${database}/" + row.code;
			var win = window.open(url, '_blank');
			win.focus();
		}); 
		
		function refreshSeries(){
			var indexes = $('#jqxgrid').jqxDataTable('getSelection')
			indexes.forEach(function(row, i, indexes) {
				
				var url = "/idm-service/databases/${database}/" + row.code + "/reload";
	            $.post(url,function(result){
	            	if (!result.success)
	            		apprise("Failed reload series " + row.code);
	            	else (i == (indexes.length - 1)) 
	    				$("#jqxgrid").jqxDataTable('updateBoundData');
	            	
	        	},'json');
			});
		}
		 
		function copyToClipboard(){
			var indexes = $('#jqxgrid').jqxDataTable('getSelection')
	        if(indexes.length < 1)
	        	return;
	        
	        var text = '';
	        indexes.forEach(function(row, i, indexes) {
	        	text += "${database}" + "," + row.code + "," + row.name + "," + row.description + "\n";
	        });
	        window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
		}
		
		function copySeriesToFavorite(){
			var indexes = $('#jqxgrid').jqxDataTable('getSelection');
	        if(indexes.length < 1)
	        	return;
			
	        indexes.forEach(function(row, i, indexes) {
	        	var parameters = {database:"${database}", dataset:row.code};
		    	$.post("/idm-service/user-favourites/add", parameters, function(result){
		    		 if (!result.success){
		    			 apprise(result.errorMsg);
		             } else {
		            	 row.favorite = true;
		            	 $("#jqxgrid").jqxDataTable('updateRow', row.uid, row);
		             }
		    	},'json');
	        });
	        
		}
		
		 function createCategoryWindow() {
	         var jqxWidget = $('#jqxWidget');
	         var offset = jqxWidget.offset();
	         $('#categoryAddDialogWindow').jqxWindow({ showCollapseButton: false, resizable: false, height: 280, width: 450,
	             initContent: function () {
	                 $('#addCategoryButton').jqxButton({ width: '80px'});
	                 $("#addCategoryButton").on('click', function () {
	                	 addToCategorySelectedSeries();
	         	   	 });
	                 
	                 $('#cancelCategoryButton').jqxButton({ width: '80px'});
	                 $("#cancelCategoryButton").on('click', function () {
	                	 $('#categoryAddDialogWindow').jqxWindow('close');
	          	   	 });
	             }
	         });
	     }
		 
		 function initCategoryList(){
	         var source =
	         {
	             datatype: "json",
	             datafields: [
	                 { name: 'code' }
	             ],
	             url: "/idm-service/idm-customer-categories/loadAllCategoryAsList",
	             async: false
	         };
	         var dataAdapter = new $.jqx.dataAdapter(source);
	         // Create a jqxDropDownList
	         $("#categoryDropdownList").jqxDropDownList({ source: dataAdapter, displayMember: 'code', valueMember: 'code', selectedIndex: 0, width:'100%', height: '25'});
	 	}
		 
		function makeAndFillCategotyWindow(){
			var indexes = $('#jqxgrid').jqxDataTable('getSelection');
			if(indexes.length < 1)
				return;
	        var row = indexes[0];

			createCategoryWindow();
	        $('#categoryAddDialogWindow').jqxWindow('open');
			initCategoryList();
	
			document.getElementById('categoryAddDialogWindowHeader').innerHTML = "Add " + row.code + " series to category";
			$("#add_dataset_code").jqxInput({height: 25, width:'100%', minLength: 1, value: row.code, disabled: true});
			$("#add_dataset_name").jqxInput({height: 25, width:'100%', minLength: 4, value: row.name, disabled: true});
		}
		
		function addToCategorySelectedSeries(){
			var indexes = $('#jqxgrid').jqxDataTable('getSelection');
			var category = $("#categoryDropdownList").jqxDropDownList('getSelectedItem').value;
			
			indexes.forEach(function(row, i, indexes) {
	        	addToCategory(row, category);
	        });
		}	
		
		function addToCategory(row, category){
	    	var parameters = {database_code:"${database}", dataset_code:row.code};
	    	
	    	var url = "/idm-service/idm-customer-categories/settings/" + category + "/addSeries";
	    	$.post(url, parameters, function(result){
	    		 if (!result.success && result.code == 0){
	    			 apprise(result.errorMsg);
	             } else if(!result.success && result.code == 1) {
	            	var message = "Symbol  ${database}/" + row.code + " already exists in " + category + " category. Do you want replace it?";
	            	apprise(message, {'verify':true}, function(r){
	            		if(r){ 
	            			var parameters = {database_code:"${database}", dataset_code:row.code};
	                    	var url = "/idm-service/idm-customer-categories/settings/" + category + "/updateSeries";
	             			$.post(url, parameters);
	                   	 	$('#categoryAddDialogWindow').jqxWindow('close');
	            		}
	            	});
	             } else {
	            	 $('#categoryAddDialogWindow').jqxWindow('close');
	             }
	    	},'json');
		}
		
		
		function createExportWindow() {
	        var jqxWidget = $('#jqxWidget');
	        var offset = jqxWidget.offset();
	        $('#exportDialogWindow').jqxWindow({
	            showCollapseButton: false, resizable: false, height: 200, width: 320,
	            initContent: function () {
	                $('#exportSeriesBtn').jqxButton({ width: '80px'});
	                $("#exportSeriesBtn").on('click', function () {
	                	exportSeries();
	        	   	});
	                
	                $('#cancelExportDialog').jqxButton({ width: '80px'});
	                $("#cancelExportDialog").on('click', function () {
	               	 $('#exportDialogWindow').jqxWindow('close');
	         	   });
	            }
	        });
	    }
		
	
		function makeExportSeriesDialog(){
			createExportWindow();
            $('#exportDialogWindow').jqxWindow('open');
		}
		
		
		function exportSeries(){
			var export_type = $('input[name="export_type"]:checked').val();
			
			var datasets = new Array(0);
			if(export_type == "selected") {
				var indexes = $('#jqxgrid').jqxDataTable('getSelection');
				
				if(indexes.length == 0) {
					apprise("Please, select at least one series");
					return;
				}
				
				datasets = new Array(indexes.length);
				
				indexes.forEach(function(row, i, indexes) {
		        	datasets[i]=row.code;
		        });
			} else if(export_type == "all_page") {
				var rows = $('#jqxgrid').jqxDataTable('getRows');
				
				datasets = new Array(rows.length);
				rows.forEach(function(item, i, rows) {
		        	datasets[i]=item.code;
		        });
			}
			
			var import_format;
			if(document.getElementById("import_format") && document.getElementById("import_format").checked)
				import_format = true;
			else
				import_format = false;
			
			var url = "/idm-service/databases/${database}/export?datasets="
					+ datasets + "&import_format=" + import_format;
			
			var win = window.open(url, '_blank');
			win.focus();
			
	      	$('#exportDialogWindow').jqxWindow('close');
		}
		
	</script>
</body>
</html>