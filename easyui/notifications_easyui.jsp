<%@page import="java.util.*,java.sql.*"%><html>
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<!DOCTYPE html>
<html>
<head>
<spring:url value="/resources/css/bootstrap-navbar.css" var="bootstrapCSS" />
<spring:url value="/resources/css/bootstrap-theme-navbar.css" var="bootstrapThemeCSS" />
<spring:url value="/resources/css/easyui.css" var="easyuiCSS" />
<spring:url value="/resources/css/icon.css" var="iconCSS" />
<spring:url value="/resources/css/demo.css" var="demoCSS" />

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
<link href="${bootstrapCSS}" rel="stylesheet" />
<link href="${bootstrapThemeCSS}" rel="stylesheet" />

<link rel="icon" type="image/x-icon" href="/idm-service/favicon.ico">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Notifications</title>
</head>
<body>
	<%@ include file="navbar.html"%>
	
		<div id="page_content" style="width:100%;visibility:hidden;">
	
			<table id="dg" class="easyui-datagrid" title="Notifications" style="height:100%"
		            data-options="
		            singleSelect:false,
					ctrlSelect: true,
		            toolbar:'#tb',
					rowStyler: function(index,row){
	                    if (row.readed == false){
	                        return 'font-weight:bold;';
	                    }
	                }"
	                sortName="time" sortOrder="desc"
	                url="/idm-service/notifications/load_data">
		        <thead>
		            <tr>
		            	<th data-options="field:'ck',checkbox:true"></th>
		                <th data-options="field:'database'" align="left" sortable="true">Database</th>
		                <th data-options="field:'dataset'" align="left" sortable="true">Symbol</th>
		                <th data-options="field:'status'" align="center" formatter="formatStatus">Status</th>
						<th data-options="field:'time',formatter:formatFixedAt" sortable="true">Reported</th>
		                <th data-options="field:'fixed_at'" align="center" formatter="formatFixedAt">Fixed at</th>
		                <th data-options="field:'start_date'" align="center">Start date</th>
		                <th data-options="field:'end_date'" align="center">End date</th>
						<th data-options="field:'message'">Description</th>
						<th data-options="field:'http_code'" align="center">Http code</th>
						<th data-options="field:'url'">Url</th>
		            </tr>
		        </thead>
		    </table>
		    
			<div id="tb" style="height:30px">
		        <a href="javascript:void(0)" class="easyui-linkbutton" plain="true" data-options="iconCls:'icon-clear'" onclick="removeit()">Remove</a>
		        <a href="javascript:void(0)" class="easyui-linkbutton" plain="true" data-options="" onclick="markAsRead()">Mark as read</a>
		        <a href="javascript:void(0)" class="easyui-linkbutton" plain="true" data-options="" onclick="markAsUnRead()">Mark as unread</a>
		    </div>
	    
    	</div>
    
    <script type="text/javascript">
    	var page_content;
	    function resizeTable(){
			page_content = document.querySelector("#page_content");
			var scrollTop = $(window).scrollTop(), elementOffset = page_content.offsetTop, distance = (elementOffset - scrollTop);
			page_content.style.height = window.innerHeight - distance;
	    }
	    resizeTable();
		
		window.onresize = function(event) {
			resizeTable();
		};
		
		function formatStatus(val,row){
            if (val == 0){
                return '<span style="color:red;">On hold</span>';
            } else {
                return '<span style="color:green;">Fixed</span>';
            }
        }
		
		function formatFixedAt(val,row){
            if (!val)
            	return val;
            
            var date = new Date(val);
            var year = date.getFullYear();
            var month = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
            var day = (date.getDate()<10?'0':'') + date.getDate();
            var hour = (date.getHours()<10?'0':'') + date.getHours();
            var minute = (date.getMinutes()<10?'0':'') + date.getMinutes();
            
            var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            return year + "-" + month + "-" + day + " " + hour + ":" + minute + " (" + days[date.getDay()] + ")";
        }
		
	    function formatTime(val,row){
	    	var d = new Date(parseInt(val));
			month = '' + (d.getMonth() + 1);
			day = '' + d.getDate();
			year = '' + d.getFullYear();
			
			var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
			weekDay = days[d.getDay()];

			if (month.length < 2) month = '0' + month;
			if (day.length < 2) day = '0' + day;
			
			return year + ',' + month  + ',' + day + "    " + 
			d.getHours() +':'+ d.getMinutes() +':'+ d.getSeconds() + " (" + weekDay + ")";
	    }
		
	    function getWeekDay(date) {
	  	  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	  	  return days[date.getDay()];
	  	}
    
	    function removeit(){
	    	var rows = $('#dg').datagrid('getSelections');
            for(var i=0; i<rows.length; i++){
                var row = rows[i];
                if (row){
                	 $.post( "/idm-service/notifications/remove", { databaseCode: row.database,	datetime: row.time},  function( data ) {
                 		$('#dg').datagrid('reload');
                     });
                }
            }
	    }
	    
	    function markAsRead(){
	    	var rows = $('#dg').datagrid('getSelections');
            for(var i=0; i<rows.length; i++){
                var row = rows[i];
                if (row){
                    $.post( "/idm-service/notifications/mark_as_read", { databaseCode: row.database,	datetime: row.time}, function( data ) {
                    		$('#dg').datagrid('reload');
                    });
                }
            }
	    }
	    
	    function markAsUnRead(){
	    	var rows = $('#dg').datagrid('getSelections');
            for(var i=0; i<rows.length; i++){
                var row = rows[i];
                if (row){
                    $.post( "/idm-service/notifications/mark_as_unread", { databaseCode: row.database,	datetime: row.time}, function( data ) {
                    		$('#dg').datagrid('reload');
                    });
                }
            }
	    }
	    
	    page_content.style.visibility = "visible";
    </script>
	<style type="text/css">
		.panel-title {
			font-size: 12px;
			font-weight: bold;
			color: #0E2D5F;
			height: 16px;
			line-height: 16px;
		}
	</style>
</body>
</html>