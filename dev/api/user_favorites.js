"use strict";

function getUserFavorites(sessionToken) {
    let results;
    call_api_ajax('GetUserFavoritesMetadata', 'get', {
        SessionToken:sessionToken,
        ReturnFavoritesTree:true
//,
//        Rows:2500
    }, false, (data) => { results = data.Result });
    return results;
}

function getDeletedUserFavorites(sessionToken) {
    var r;
    call_api_ajax('GetDeletedUserFavoriteDatasets', 'get', {
	    SessionToken:sessionToken,
    }, false, ( data ) => {
        r = data.Result;
    });
    return r;
}

function getBackupsList(sessionToken) {
    var r;
    call_api_ajax('GetBackupsList', 'get', {
	    SessionToken:sessionToken
    }, false, () => {
        r = data.Result;
    });
    return r;
}

function getUserDataSources(sessionToken) 
{
    var us;
    call_api_ajax('GetUserDatasources', 'get', {
        SessionToken:sessionToken,
        ReturnCategoryList:false
    }, false, ( data ) => {
        us = data.Result;
    });

    if ( us !== undefined )
        us.forEach(function(e) { e.DatasourceInfo = e; });

    return us;
}

async function getDatasourceMetadata(params, full) {
	var isFull = full||false;
	var r;
    call_api_ajax('GetDatasourceMetadata', 'post', params, false, ( data ) => {
        r = data.Result;
    });
	if ( r === false ) return r.Datasets;
	return r;
}

function createImageMap(data) {

    let imageMap = {};
    data.forEach(function(element) {
//        imageMap[element.Datasource] = element.Icon;
        imageMap[element.Datasource] = element.Logo;
    });
    return imageMap;
}


async function createNameMap(data) {
    let nameMap = {};
    await data.forEach(function(e) {
        nameMap[e.Datasource] = e.Name;
    });
    return nameMap;
}
