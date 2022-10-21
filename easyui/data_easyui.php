<%@page import="java.util.*,java.sql.*"%><html>
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<!DOCTYPE html>
<html>
<head>
<spring:url value="/resources/css/bootstrap-navbar.css" var="bootstrapCSS" />
<spring:url value="/resources/css/bootstrap-theme-navbar.css" var="bootstrapThemeCSS" />
<spring:url value="/resources/css/easyui.css" var="easyuiCSS" />
<spring:url value="/resources/css/icon.css" var="iconCSS" />
<spring:url value="/resources/css/demo.css" var="demoCSS" />
<spring:url value="/resources/css/color.css" var="colorCSS" />
<spring:url value="/resources/css/anychart-ui.min.css" var="anychartCSS" />

<spring:url value="/resources/js/jquery.easyui.min.js" var="easyuiJs" />
<spring:url value="/resources/js/jquery-1.12.3.js" var="jqueryJS" />
<spring:url value="/resources/js/bootstrap.min.js" var="bootstrapJS" />
<spring:url value="/resources/js/bootstrap-dropdown.js" var="dropdownJS" />
<spring:url value="/resources/js/anychart-bundle.min.js" var="anychartJS" />

<script src="${jqueryJS}"></script>
<script src="${easyuiJs}"></script>
<script src="${bootstrapJS}"></script>
<script src="${dropdownJS}"></script>
<script src="${anychartJS}"></script>

<link href="${easyuiCSS}" rel="stylesheet" />
<link href="${iconCSS}" rel="stylesheet" />
<link href="${demoCSS}" rel="stylesheet" />
<link href="${colorCSS}" rel="stylesheet" />
<link href="${bootstrapCSS}" rel="stylesheet" />
<link href="${bootstrapThemeCSS}" rel="stylesheet" />
<link href="${anychartCSS}" rel="stylesheet" />

<link rel="icon" type="image/x-icon" href="/idm-service/resources/favicon.ico">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title><c:out value="${series.datasetCode}"/> Series</title>
</head>
<body style="overflow: hidden;">

	<%@ include file="navbar.html"%>

	<div id="page_content" style="visibility: hidden;">
       	<div class="easyui-layout" style="width:100%;height:100%;">
	        <div data-options="region:'north',split:true" style="height:150px; padding:5px">
				<span style="font-family:Tahoma, Geneva, sans-serif;font-size:19">${series.name}</span><br>
				<p style="font-family:Tahoma, Geneva, sans-serif;font-size:12"> <b>Ticker: </b>${series.datasetCode} <b>Exchange: </b>${database.databaseAlias} <b>Columns: </b>${columns}</p>
				<p style="font-family:Tahoma, Geneva, sans-serif;font-size:12"><c:out value="${series.description}" escapeXml="false" /></p>
				<p><span style="font-family:Tahoma, Geneva, sans-serif;font-size:12"><b>Symbol:</b> <font color="red">${database.databaseAlias}/${series.datasetCode}</font>
					</span> <span style="font-family:Tahoma, Geneva, sans-serif;font-size:12">${series.dataNum} prices. ${series.frequency} from ${series.firstDate} to ${series.lastDate}. Refreshed at ${series.refreshedAtStr}</span></p>
			</div>
			
			<div data-options="region:'center',split:true" style="overflow:hidden;">
				<div class="easyui-tabs" style="width:100%;height:100%;">
	        		<div id="prices_tab" title="Prices" style="height:100%;padding:5px;overflow-y:hidden;">
						<div style="width:100%;overflow:hidden;height:100%">
							<table id="dgData" title="Price Data" class="easyui-datagrid" singleSelect="true" style="width:100%;height:100%"
								pageSize="100" pageList="[25,50,75,100,200,500]" pagination="true"
								rownumbers="true" sortName="date" sortOrder="desc" toolbar="#toolbar">
							</table>
						</div>
						
						<div id="toolbar">
							Average: <select id="series_frequency">
							  <option value="daily">Daily</option>
							  <option value="weekly">Weekly</option>
							  <option value="monthly">Monthly</option>
							  <option value="quarterly">Quarterly</option>
							  <option value="half_annual">Half annual</option>
							  <option value="annual">Annual</option>
							</select>
							<a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-save" plain="true" onclick="javascript:$('#dlg-export').dialog('open')">Export</a>
						</div>
						
						<div id="dlg-export" class="easyui-dialog" style="width:400px"
				            	closed="true" buttons="#dlg-export-buttons" title="Export Series">
					        <form id="formExportSeries" method="post" style="margin:0;padding:20px 50px">
					            <div style="margin-bottom:10px">
						            <input type="radio" name="export_type" value="all" checked="checked"> Export all<br>
					   				<input type="radio" name="export_type" value="current_page"> Export current page<br>
					            </div>
					        </form>
				    	</div>
				    	<div id="dlg-export-buttons">
					        <a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-ok" onclick="exportData()" style="width:90px">Export</a>
					        <a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-cancel" onclick="javascript:$('#dlg-export').dialog('close')" style="width:90px">Cancel</a>
		   				</div>
					</div>
				
					<div id="chart_tab" title="Chart" style="padding:5px;width:100%;height:100%;">
						<div id="container" style="width:100%;height:100%;">
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<script>
		var page_content;
		function resizeElements(){
			page_content = document.querySelector("#page_content");
			var scrollTop = $(window).scrollTop(), elementOffset = page_content.offsetTop, distance = (elementOffset - scrollTop);
			page_content.style.height = window.innerHeight - distance;
			
		}
		
		$( window ).resize(function() {
			resizeElements();
		});
		
		(function () {
			resizeElements();
		}());
		
		$.get("/idm-service/databases/${database.databaseCode}/${series.datasetCode}/loadDataHeaders", function( data ) {
	        $('#dgData').datagrid({                     
		        columns: data
	    	});
	        
	        $('#dgData').datagrid('load',"/idm-service/databases/${database.databaseCode}/${series.datasetCode}/loadData");
		});
		
		
		function exportData(){
			var export_type = $('input[name="export_type"]:checked').val();
			
			var from, to;
			if(export_type == "current_page") {
				var rows = $("#dgData").datagrid("getData").rows;
				to = rows[0].date;
				from = rows[rows.length - 1].date;
			}
			
			var url = "/idm-service/databases/${database.databaseCode}/${series.datasetCode}/export";
			
			if(from && to)
				url += "?from=" +from + "&to=" + to;
			
			var win = window.open(url, '_blank');
			win.focus();
			
			$('#dlg-export').dialog('close');
		}
		
		function setFrequencyOfDropdown() {    
		    var dropdown = document.getElementById('series_frequency');
		    var frequency = "${series.frequency}";
		    dropdown.value = frequency.toLowerCase();
		    
		    switch(frequency.toLowerCase()){
		    case 'weekly':
		    	dropdown.options[0].disabled = true;
		    	break;
		    	
		    case 'monthly':
		    	dropdown.options[0].disabled = true;
		    	dropdown.options[1].disabled = true;
		    	break;
		    	
		    case 'quarterly':
		    	dropdown.options[0].disabled = true;
		    	dropdown.options[1].disabled = true;
		    	dropdown.options[2].disabled = true;
		    	break;
		    	
		    case 'annual':
		    	dropdown.options[0].disabled = true;
		    	dropdown.options[1].disabled = true;
		    	dropdown.options[2].disabled = true;
		    	dropdown.options[3].disabled = true;
		    	dropdown.options[4].disabled = true;
		    	break;
		    	
		    }
		    
		    dropdown.onchange=function(){
		    	var dropdownValue = document.getElementById('series_frequency').value;
		    	$('#dgData').datagrid('load', {
		    		frequency: dropdownValue
        		});
		    	makeChart();
		    };
		}
		setFrequencyOfDropdown();
		
		page_content.style.visibility = "visible";
		
		makeChart();
		
    	function makeChart() {
    		$('#container').empty();
		    anychart.onDocumentReady(function() {
	
	    	// create data tables on loaded data
	    	var dataTable = anychart.data.table();
	    	jQuery.ajaxSetup({async:false});
	    	
	    	var url = "/idm-service/databases/${database.databaseCode}/${series.datasetCode}/chartingData";
	    	var frequency = document.getElementById('series_frequency').value;
	    	if(frequency)
	    		url += "?frequency=" + frequency;
	    	$.get(url, function( result ) {
	    		if(result){
	    			dataTable.addData(result);
	    		}
	    	});
	    	
	    	var bates;
	    	$.get("/idm-service/databases/${database.databaseCode}/${series.datasetCode}/loadBates", function( result ) {
	    		bates = result;
	    	});
	    	
	    	chart = anychart.stock();
	    	
	    		
	    	// create plot on the chart with line series
	    	var plot = chart.plot(0);
	    	plot.grid().enabled(true);
	    	plot.grid(1).enabled(true).layout('vertical');
	    	plot.minorGrid().enabled(true);
	    	plot.minorGrid(1).enabled(true).layout('vertical');
	    	
	    	chart.tooltip().enabled(false);
	
	    	var collors = [ "blue", "red", "green", "black", "orange", "grey"];

	    	bates.forEach(function(item, i, bates) {
	    		if(item != 'Volume' && item != 'Prev. Day Open Interest' && item != 'Open Interest Previous Day')
	    		
	    		if(i < collors.length)
					plot.line(dataTable.mapAs({'value': i+1})).name(item).color(collors[i]);
	    		else
	    			plot.line(dataTable.mapAs({'value': i+1})).name(item);
			});
	    	
	    	// create scroller series with mapped data
	    	chart.scroller().line(dataTable.mapAs({'value': 1}));
		    		   
	    	
    		// Make Volume chart
			var volumeInx = $.inArray("Volume", bates);
	    	if(volumeInx > 0){
	    		console.log("Build volume plot");

	    		var maping = dataTable.mapAs({'low': volumeInx, 'high': volumeInx + 1});
	    		
	    		var plot = chart.plot(1);
	    		plot.rangeColumn(maping).name('Volume')
	    		        .fill('#1976d2 0.85').tooltip().useHtml(true).textFormatter(function(){
	    		            return 'Volume: ' + this.high;
	    		            });
	    		plot.height('25%');
	    		plot.xAxis().background().enabled(true);
	    	}
	    	
	    	//Make Opn. Interest chart
	    	var prDayIntInx = $.inArray("Prev. Day Open Interest", bates);
	    	prDayIntInx = prDayIntInx > 0 ? prDayIntInx : $.inArray("Open Interest Previous Day", bates);
	    	if(prDayIntInx > 0){
	    		console.log("Prev. Day Open Interest");
	    		
		    	// create plot on the chart with line series
		    	/* var plot = chart.plot(1); */
		    	plot.grid().enabled(true);
		    	plot.grid(1).enabled(true).layout('vertical');
		    	plot.minorGrid().enabled(true);
		    	plot.minorGrid(1).enabled(true).layout('vertical');
		
		    	if($.inArray("Prev. Day Open Interest", bates) > 0)
					plot.line(dataTable.mapAs({'value': prDayIntInx + 1})).name("Prev. Day Open Interest").color('green');
		    	else
					plot.line(dataTable.mapAs({'value': prDayIntInx + 1})).name("Open Interest Previous Day").color('orange');
				
				plot.height('25%');
		    	
		    	// create scroller series with mapped data
			    chart.scroller().line(dataTable.mapAs({'value': prDayIntInx+1}));
	    	}
	    	
	    	// set container id for the chart
	    	chart.container('container');
	
	    	// initiate chart drawing
	    	chart.draw();
	    	
	    	});
    	}
   </script>
</body>
</html>