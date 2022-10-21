<%@page import="java.util.*,java.sql.*"%><html>
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<!DOCTYPE html>
<html>
<head>
<spring:url value="/resources/css/bootstrap-navbar.css" var="bootstrapCSS" />
<spring:url value="/resources/css/bootstrap-theme-navbar.css" var="bootstrapThemeCSS" />
<spring:url value="/resources/css/easyui.css" var="easyuiCSS" />
<spring:url value="/resources/css/icon.css" var="iconCSS" />
<spring:url value="/resources/css/demo.css" var="demoCSS" />

<spring:url value="/resources/js/jquery.easyui.min.js" var="easyuiJS" />
<spring:url value="/resources/js/jquery-1.4.4.min.js" var="jquery114JS" />
<spring:url value="/resources/js/datagrid-detailview.js" var="detailviewJS" />
<spring:url value="/resources/js/jquery.datagrid.js" var="datagridJS" />

<link href="${easyuiCSS}" rel="stylesheet" />
<link href="${iconCSS}" rel="stylesheet" />
<link href="${demoCSS}" rel="stylesheet" />
<link href="${bootstrapCSS}" rel="stylesheet" />
<link href="${bootstrapThemeCSS}" rel="stylesheet" />

<script src="${jquery114JS}"></script>
<script src="${easyuiJS}"></script>
<script src="${datagridJS}"></script>
<script src="${detailviewJS}"></script>

<link rel="icon" type="image/x-icon" href="/idm-service/resources/favicon.ico">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Data Sources</title>
</head>
<body>
	<%@ include file="navbar.html"%>
	
		<table id="databases_table" class="easyui-datagrid" title="Databases" style="width:100%;height:85%"
	            data-options="singleSelect:true"
	            fitColumns="true" toolbar="#toolbar"
                url="/idm-service/databases/get_all_databases">
	        <thead>
	            <tr>
	                <th field="name"           width="350px" formatter="formatName">Database Name</th>
	                <th field="free"           width="65px" align="center" styler="freeStyler">Free</th>
	                <th field="update_type"    width="85px" align="center" styler="fullStyler">Full update</th>
					<th field="series_num"     width="60px" align="center"># series</th>
					<th field="refreshed_at"   width="150px">Last Refreshed</th>
					<th field="hours_ago"      width="80px" align="center">Hours ago</th>
	            </tr>
	        </thead>
	    </table>
	    
	    <div id="toolbar">
	        <a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-search" plain="true" onclick="viewDatabase()">View</a>
	        <a href="javascript:void(0)" class="easyui-linkbutton" iconCls="icon-edit" plain="true" onclick="openSettings()">Settings</a>
	    </div>
	    
    <script type="text/javascript">
	    var objTable = document.querySelector("#databases_table");
		var scrollTop = $(window).scrollTop(), elementOffset = objTable.offsetTop, distance = (elementOffset - scrollTop);
		objTable.style.height = window.innerHeight - distance;
		
		function formatName(val,row){
			return '<span style="font-size:16px;">'+val+'</span>';
		}
		
		function viewDatabase(){
            var row = $('#databases_table').datagrid('getSelected');
            if(row){
            	location.href = "/idm-service/databases/" + row.code + "?page=1";
            }
        }
		
		function openSettings(){
            var row = $('#databases_table').datagrid('getSelected');
            if(row){
            	location.href = "/idm-service/databases/" + row.code + "/settings";
            }
        }
		
	    $('#databases_table').datagrid({
	        nowrap: true,
	        view: detailview,                
	        detailFormatter: function(index, row) {
	                return "<div>" + row.description + "</div>";
	        }
	    });
    
	    function freeStyler(value,row,index){
	        if (value == "FREE"){
	            return 'background-color:#009900;color:black;';
	        } else {
	        	return 'background-color:#6600cc;color:black;';
	        }
	    }
	    function fullStyler(value,row,index){
	        if (value == "UPDATE ALL"){
	            return 'background-color:#ffee00;color:black;';
	        } else {
	        	return 'background-color:#0099ff;color:black;';
	        }
	    }
	    
    </script>
</body>
</html>