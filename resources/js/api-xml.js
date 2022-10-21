$(document).ready(function ()
{
    var sections_order, sections = [];

    $.ajax({
        type: "GET",
        url: "../../api.xml",
        dataType: "xml",
        success: ( data ) => {
            sections_order = JSON.parse( $( data ).find('sections_order')[0].textContent );
            sections = [];

            let items = $( data ).find('sections > item');
            sections = items.map(function ( i, item )
            {
                let arr = {};
                arr[ $( item ).find('order')[0].textContent ] = {
                    post_title: $( item ).find('post_title')[0].textContent,
                    post_content: $( item ).find('post_content')[0].textContent,
                    menu_title: $( item ).find('menu_title')[0].textContent,
                    post_type: $( item ).find('post_type')[0].textContent,
                    order: parseInt( $( item ).find('order')[0].textContent ),
                    section_title: $( item ).find('section_title')[0].textContent
                };
                return arr;
            });
        },
        async: false
    });
    sections = Object.assign({}, ...sections);
    console.log( sections_order, sections );
    
    // function menu ( sections_order, content = $('<ol>') )
    // {
    //     sections_order.map(function( v )
    //     {
    //         let item = sections[ v.id ],
    //         list = $('<li>');
    //         list.append('<a class="next" href="#">'+ item.menu_title +'</a>');

    //         if ( v.children !== undefined )
    //         {
    //             let new_menu = $('<ol>');
    //             new_menu = menu( v.children, new_menu );
    //             list.append( new_menu );
    //         }

    //         content.append( list )
    //     });
    //     return content;
    // }
    // $('.api-left-links').html( menu( sections_order ) )
    $('.api-left-links > ol > li:nth-of-type(1)').addClass('active');
});