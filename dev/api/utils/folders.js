"use strict";

function WriteFavoritesTree(folders,sessionToken)
{
    call_api_ajax('WriteUserFavoritesMetadataTree', 'post',
	{
	    SessionToken: sessionToken,
	    Tree:folders
    });
}


function createFolderStructure(objectFavorites,sessionToken) {
    const folders = objectFavorites.Tree;

    let folderArray = [];

    objectFavorites.Datasets.forEach(fav => {
        folderArray.push({
            Datasource: fav.Datasource,
            Datacategory: fav.Datacategory,
            Symbol: fav.Symbol,
        });
    });

	function removeTittle(src)
	{		
		src.forEach((a)=>{
			a.label = a.value.name;
			if(a.items.length > 0) removeTittle(a.items);
			
		});
	}
	removeTittle(folders);

	let as = "All series"; 
    let mainFolders = [{
        label: as,
        icon: "resources/css/icons/folder.png",
        selected: true,
        expanded: true, //folders.length > 0 ? true:false,
        value: {
        	name: as,
        	items: userFavorites.length > 0 ? folderArray : [],
            	root: true
        }
    }];
	
   mainFolders[0].items = folders;
    return mainFolders;
}


