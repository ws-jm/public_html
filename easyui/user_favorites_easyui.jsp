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

<spring:url value="/resources/js/jquery.easyui.min.js" var="easyuiJs" />
<spring:url value="/resources/js/jquery-1.12.3.js" var="jqueryJS" />
<spring:url value="/resources/js/bootstrap.min.js" var="bootstrapJS" />
<spring:url value="/resources/js/bootstrap-dropdown.js" var="dropdownJS" />

<script src="${jqueryJS}"></script>
<script src="${easyuiJs}"></script>
<script src="${bootstrapJS}"></script>
<script src="${dropdownJS}"></script>

<link href="${easyuiCSS}" rel="stylesheet" />
<link href="${iconCSS}" rel="stylesheet" />
<link href="${demoCSS}" rel="stylesheet" />
<link href="${colorCSS}" rel="stylesheet" />
<link href="${bootstrapCSS}" rel="stylesheet" />
<link href="${bootstrapThemeCSS}" rel="stylesheet" />

<link rel="icon" type="image/x-icon" href="/idm-service/favicon.ico">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>User Favorites</title>
</head>
<body style="overflow: hidden;">
	<%@ include file="navbar.html"%>
	
	<div id="page_content" style="visibility:hidden;">
		<div class="easyui-tabs" style="width:100%;height: 100%">
	        <div id="favorite_series_tab" title="Favorite Series" style="padding:5px;width:100%">
	        	<table class="easyui-datagrid" style="width:500px;" toolbar="#tbActiveFavorites"></table>
				<table id="tgActiveFavories" class="easyui-treegrid" style="width:500px;height:100%;"
		            data-options="
		                url: '/idm-service/user-favourites/loadActiveUserFavourites',
		                method: 'get',
		                rownumbers: true,
		                idField: 'name',
		                treeField: 'name'
		            ">
		        <thead>
		            <tr>
		                <th data-options="field:'name'" width="220">Symbol</th>
		                <th data-options="field:'active'" width="100" align="right">Active</th>
		            </tr>
		        </thead>
		    </table>
			<div id="tbActiveFavorites">
				<a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-remove" plain="true" onclick="disactiveFavorite()">Remove series</a>
				<a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-save" plain="true" onclick="exportFavorites()">Export</a>
			</div>
			</div>
	        
	        
	        
	        <div id="removed_favorite_series_tab" title="Removed" style="padding:5px;width: 100%">
	        	<table id="dgDisactiveFavorites" class="easyui-datagrid" 
					style="height:100%;width:100%" 
					data-options="
	                singleSelect: true,
	                toolbar: '#tbDisactiveFavorite',
	                url: '/idm-service/user-favourites/loadDisactiveUserFavourites',
	                fitColumns: 'true'">
			    	<thead>
			        	<tr>
			            	<th field="database_code">Database</th>
			            	<th field="dataset_code">Symbol</th>
							<th field="name">Description</th>
							<th field="prices" align="right"># Prices</th>
							<th field="frequency">Frequency</th>
							<th field="first_date" align="center">First date</th>
							<th field="last_date" align="center">Last date</th>
							<th field="description">Additional information</th>
			   			</tr>
					</thead>
				</table> 
				
				<div id="tbDisactiveFavorite" style="height:auto">
					<a href="javascript:void(0)" class="easyui-linkbutton" data-options="iconCls:'icon-remove',plain:true" plain="true" onclick="deleteFavorite()">Delete</a>
				    <a href="javascript:void(0)" class="easyui-linkbutton" data-options="iconCls:'icon-add',plain:true" onclick="restoreFavorite()">Restore to Favourites</a>
				</div>
		    </div>	
	    </div>
    </div>
    
    <script type="text/javascript">
    	var page_content;
		function fullScreen(){
			page_content = document.querySelector("#page_content");
			var scrollTop = $(window).scrollTop(), elementOffset = page_content.offsetTop, distance = (elementOffset - scrollTop);
			page_content.style.height = window.innerHeight - distance;
		}
		fullScreen();
		$( window ).resize(function() {
			fullScreen();
		});
		
		
		function disactiveFavorite() {
			var row = $('#tgActiveFavories').treegrid('getSelected');
			if(!row)
				return;
			
			var parameters;
			if(row._parentId != null)
				parameters = {
						database_code : row._parentId,
						dataset_code : row.name
					};
			else
				parameters = {
					database_code : row.name
				};
			
			$.post("/idm-service/user-favourites/disactive",
					parameters, function(result) {
						if (!result.success) {
							$.messager.show({
								title : 'Error',
								msg : result.errorMsg,
								showType : 'show',
								style : {
									right : '',
									bottom : ''
								}
							});
						} else {
							$('#tgActiveFavories').treegrid('reload');
							$('#dgDisactiveFavorites').datagrid('reload');
						}
					}, 'json');
		}
		
		
		function restoreFavorite() {
			var row = $('#dgDisactiveFavorites').datagrid('getSelected');
			if(!row)
				return;
			
			var parameters = {
					database_code : row.database_code,
					dataset_code : row.dataset_code
				};
			
			$.post("/idm-service/user-favourites/restore",
					parameters, function(result) {
						if (!result.success) {
							$.messager.show({
								title : 'Error',
								msg : result.errorMsg,
								showType : 'show',
								style : {
									right : '',
									bottom : ''
								}
							});
						} else {
							$('#tgActiveFavories').treegrid('reload');
							$('#dgDisactiveFavorites').datagrid('reload');
						}
					}, 'json');
		}
		
		function deleteFavorite() {
			var row = $('#dgDisactiveFavorites').datagrid('getSelected');
			if(!row)
				return;
			
			var parameters = {
					database_code : row.database_code,
					dataset_code : row.dataset_code
				};
			
			$.post("/idm-service/user-favourites/delete",
					parameters, function(result) {
						if (!result.success) {
							$.messager.show({
								title : 'Error',
								msg : result.errorMsg,
								showType : 'show',
								style : {
									right : '',
									bottom : ''
								}
							});
						} else {
							$('#tgActiveFavories').treegrid('reload');
							$('#dgDisactiveFavorites').datagrid('reload');
						}
					}, 'json');
		}
		
		function exportFavorites(){
			var url = "/idm-service/user-favourites/export";
			var win = window.open(url, '_blank');
			win.focus();
		}
		
		page_content.style.visibility = "visible";
    </script>
</body>
</html>