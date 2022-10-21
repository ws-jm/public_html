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
<spring:url value="/resources/css/easyui.css" var="easyuiCSS" />
<spring:url value="/resources/css/icon.css" var="iconCSS" />
<spring:url value="/resources/css/demo.css" var="demoCSS" />
<spring:url value="/resources/css/color.css" var="colorCSS" />
<spring:url value="/resources/js/jquery.easyui.min.js" var="easyuiJs" />
<spring:url value="/resources/js/datagrid-filter.js" var="dataGridFilterJs" />
<spring:url value="/resources/js/jquery-1.12.3.js" var="jqueryJS" />
<spring:url value="/resources/js/bootstrap.min.js" var="bootstrapJS" />
<spring:url value="/resources/js/bootstrap-dropdown.js" var="dropdownJS" />

<script src="${jqueryJS}"></script>
<script src="${easyuiJs}"></script>
<script src="${dataGridFilterJs}"></script>
<script src="${bootstrapJS}"></script>
<script src="${dropdownJS}"></script>

<link href="${bootstrapCSS}" rel="stylesheet" />
<link href="${bootstrapThemeCSS}" rel="stylesheet" />
<link href="${easyuiCSS}" rel="stylesheet" />
<link href="${iconCSS}" rel="stylesheet" />
<link href="${demoCSS}" rel="stylesheet" />
<link href="${colorCSS}" rel="stylesheet" />

<link rel="icon" type="image/x-icon" href="/idm-service/favicon.ico">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>${alias} database</title>
</head>
<body style="overflow-y:hidden;">

	<%@ include file="navbar.html"%>

	<div id="page_content" style="padding: 5px;visibility:hidden;">
	
		<div style="width:100%;padding:10px;">
	        <span style="font-size: 18px;font-family:Tahoma, Geneva, sans-serif;">Database: ${alias}</span>  &ensp;&ensp;<input class="easyui-searchbox" id="search" data-options="prompt:'Enter search text',searcher:doSearch" style="width:300px;">
	    </div>
		<table id="tableSeries" class="easyui-datagrid"
			style="height:100%"
			url="/idm-service/databases/${database}/loadSeries" rownumbers="true"
			pagination="true" fitColumns="true" toolbar="#tbSeries" singleSelect="false"
			sortName="name" sortOrder="asc" pageSize="100" pageList="[25,50,75,100,200,500]",
			ctrlSelect="true" rownumberWidth="100" data-options="onDblClickRow:onDblClickRow">
			<thead>
				<tr>
					<th data-options="field:'ck',checkbox:true"></th>
					<th field="code" sortable="true">Symbol</th>
					<th field="name" sortable="true">Description</th>
					<th field="prices" sortable="true" align="right"># Prices</th>
					<th field="frequency" align="center">Frequency</th>
					<th field="first_date" align="center" sortable="true">First date</th>
					<th field="last_date" align="center" sortable="true">Last date</th>
					<th field="last_refreshed" align="center" sortable="true">Last refreshed</th>
					<th field="acessed" align="center" sortable="true"># Accessed</th>
					<th field="last_acessed" align="center" sortable="true">Last accessed</th>
					<th field="description">Additional information</th>
				</tr>
			</thead>
		</table>
		
		<div id="tbSeries">
			<a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-reload" plain="true" onclick="reloadSelectedSeries()">Refresh</a>
			<a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-cut" plain="true" onclick="copyToClipboard()">Copy</a>
			
			<sec:authorize access="hasAuthority('ADMIN') and isAuthenticated()">
				<a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-add" plain="true" onclick="copySeriesToCategory()">Category+</a>
			</sec:authorize>
			<sec:authorize access="hasAuthority('USER') and isAuthenticated()">
				<a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-add" plain="true" onclick="copySeriesToCategory()">Add to my Series</a>
			</sec:authorize>
			<a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-save" plain="true" onclick="javascript:$('#dlg-export').dialog('open')">Export</a>
			<input type="checkbox" id="checkboxHideEmprySeries" checked style="margin:display: table-cell;vertical-align: middle;"> Hide Empty Series
		</div>
		
		<div id="dlg" class="easyui-dialog" style="width:450px"
            	closed="true" buttons="#dlg-buttons" title="Title">
	        <form id="formAddSeriesToCategory" method="post" style="margin:0;padding:20px 50px">
	        	<div style="margin-bottom:10px">
	                Dataset ID: <input id="add_dataset_code" data-options="readonly:true" 
	                	class="easyui-textbox"  style="width:100%">
	            </div>
	           <div style="margin-bottom:10px">
	                Dataset Name: <input id="add_dataset_name" data-options="readonly:true,multiline:true" 
	                	class="easyui-textbox"  style="width:100%;height:60px;">
	            </div>
	            <div style="margin-bottom:10px">
	               Category: <input name="addToCategory" data-options="valueField:'code',textField:'code',url:'/idm-service/idm-customer-categories/loadAllCategoryAsList'" 
	                	class="easyui-combobox" required="true" label="Category:" style="width:100%">
	            </div>
	        </form>
    	</div>
    	<div id="dlg-buttons">
	        <a href="javascript:void(0)" class="easyui-linkbutton c6" iconCls="icon-ok" onclick="addAllSelectedSeriesToCategory()" style="width:90px">Add</a>
	        <a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-cancel" onclick="javascript:$('#dlg').dialog('close')" style="width:90px">Cancel</a>
	    </div>
	    
	    <div id="dlg-export" class="easyui-dialog" style="width:400px"
            	closed="true" buttons="#dlg-export-buttons" title="Export Series">
	        <form id="formExportSeries" method="post" style="margin:0;padding:20px 50px">
	            <div style="margin-bottom:10px">
		            <input type="radio" name="export_type" value="selected" checked="checked"> Selected Records<br>
	   				<input type="radio" name="export_type" value="all_page"> All record on this page<br>
	   				<input type="radio" name="export_type" value="all"> All Records in the database<br>
	   				<input type="checkbox" id="import_format"> Import Format<br>
	            </div>
	        </form>
    	</div>
    	<div id="dlg-export-buttons">
	        <a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-ok" onclick="exportSeries()" style="width:90px">Export</a>
	        <a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-cancel" onclick="javascript:$('#dlg-export').dialog('close')" style="width:90px">Cancel</a>
	    </div>
	</div>

	<script type="text/javascript">
		var pageContent = document.getElementById('page_content');
		var scrollTop = $(window).scrollTop(), elementOffset = pageContent.offsetTop, distance = (elementOffset - scrollTop);
		pageContent.style.height = window.innerHeight - distance - 45;
		
		function onDblClickRow(index,row){
			var url = "/idm-service/databases/${database}/" + row.code;
			var win = window.open(url, '_blank');
			win.focus();
		}
		/* function enableFiltering(){
	            var tableSeries = $('#tableSeries').datagrid({
	                remoteFilter: true,
	                filterDelay:2000
	            });
	            tableSeries.datagrid('enableFilter', [{
	                field:'name',
	                type:'textbox'
	            }]);
	    } */
		
		function exportSeries(){
			var export_type = $('input[name="export_type"]:checked').val();
			
			
			var datasets = new Array(0);
			if(export_type == "selected") {
				var rows = $('#tableSeries').datagrid('getSelections');
				
				if(rows.length == 0) {
					$.messager.show({
	                	title: 'Error',
	                	msg: "Please, select at least one series"});
					
					return;
				}
				
				datasets = new Array(rows.length);
				
		        for(var i=0; i<rows.length; i++){
		            var row = rows[i];
		            if (row){
		            	datasets[i]=row.code;
		            }
		        }
			} else if(export_type == "all_page") {
				data = $("#tableSeries").datagrid("getData");
				var rows = data.rows;
				
				datasets = new Array(rows.length);
		        for(var i=0; i<rows.length; i++){
		            var row = rows[i];
		            if (row){
		            	datasets[i]=row.code;
		            }
		        }
			}
			
			var import_format = document.getElementById("import_format").checked;
			
			var url = "/idm-service/databases/${database}/export?datasets="
					+ datasets + "&import_format=" + import_format;
			
			var win = window.open(url, '_blank');
			win.focus();
			
			$('#dlg-export').dialog('close');
		}
		
		function reloadSeries(row){
           	var url = "/idm-service/databases/${database}/" + row.code + "/reload";
            $.post(url,function(result){
            	if (result.success){
            		$('#tableSeries').datagrid('reload');    // reload the user data
            	} else {
            		$.messager.show({
                	title: 'Error',
                	msg: result.errorMsg});
            	}
        	},'json');
		}
		
		function reloadSelectedSeries(){
			var rows = $('#tableSeries').datagrid('getSelections');
	        for(var i=0; i<rows.length; i++){
	            var row = rows[i];
	            if (row){
	            	reloadSeries(row);
	            }
	        }
		}
		
		function copyToClipboard(){
            var rows = $('#tableSeries').datagrid('getSelections');
            var text = '';
	        for(var i=0; i<rows.length; i++){
	            var row = rows[i];
	            if (row){
	            	text += "${database}" + "," + row.code + "," + row.name + "," + row.description + "\n";
	            }
	        }
	        window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
		}
		
		$("#checkboxHideEmprySeries").change(function() {
		    if(this.checked) {
		    	$('#tableSeries').datagrid('load', {
        		    empty_series: false
        		});
		    } else {
		    	$('#tableSeries').datagrid('load', {
        		    empty_series: true
        		});
		    }
		});
	    
		
		function copySeriesToCategory(){
			var row = $('#tableSeries').datagrid('getSelected');
            if(row){
            	var title = "Add " + row.code + " series to category";
            	
            	$('#add_dataset_code').textbox('setValue', row.code);
            	$('#add_dataset_name').textbox('setValue', row.name);
            	
				$('#dlg').dialog('open').dialog('center').dialog('setTitle', title);
            }
		}
		
		function addAllSelectedSeriesToCategory(){
			if(!$('#formAddSeriesToCategory').form('validate'))
				return;
			
			var category = document.getElementsByName("addToCategory")[0].value;
			
			var rows = $('#tableSeries').datagrid('getSelections');
	        for(var i=0; i<rows.length; i++){
	            var row = rows[i];
	            if (row){
	            	addToCategory(row, category);
	            }
	        }
		}
		
		function addToCategory(row, category){
        	var parameters = {database_code:"${database}", dataset_code:row.code};
        	
        	var url = "/idm-service/idm-customer-categories/settings/" + category + "/addSeries";
	    	$.post(url, parameters, function(result){
	    		 if (!result.success && result.code == 0){
                     $.messager.show({
                         title: 'Error',
                         msg: result.errorMsg
                     });
                 } else if(!result.success && result.code == 1) {
                	var message = "Symbol  ${database}/" + row.code + " already exists in " + category + " category. Do you want replace it?";
                 	$.messager.confirm('Confirm', message, function(r){
                 		if (r){
                 			var parameters = {database_code:"${database}", dataset_code:row.code};
                        	var url = "/idm-service/idm-customer-categories/settings/" + category + "/updateSeries";
                 			$.post(url, parameters);
                 			 $('#dlg').dialog('close');
                 		}
                 	});
                 } else {
                     $('#dlg').dialog('close');
                 }
	    	},'json');
		}
		
		function doSearch() {
			$('#tableSeries').datagrid('load',{
				search: $('#search').val()
			});
		}
		
		pageContent.style.visibility = "visible";
	</script>
	
	<style>
		 .datagrid-header-rownumber{
            width:40px;
        }
        .datagrid-cell-rownumber{
            width:40px;
        }
	</style>
</body>
</html>