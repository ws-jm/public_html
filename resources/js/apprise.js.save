function apprise(string, args, callback)
	{
	var default_args =
		{
		'confirm'	:	false, 	// Ok and Cancel buttons
		'verify'	:	false,	// Yes and No buttons
		'input'		:	false, 	// Returns with user inputed text
		'animate'	:	false	// Groovy animation (can true or number, default is 400)
		}
	
	if(args) 
		{
		for(var index in default_args) 
			{ if(typeof args[index] == "undefined") args[index] = default_args[index]; } 
		}
	
	var aHeight = $(document).height();
	var aWidth = $(document).width();
	$('body').append('<div class="appriseOverlay" id="aOverlay"></div>');
	$('.appriseOverlay').css('height', aHeight).css('width', aWidth).fadeIn(100);
	$('body').append('<div class="appriseOuter"></div>');
	$('.appriseOuter').append('<div class="appriseInner"></div>');
	$('.appriseInner').append(string);
    $('.appriseOuter').css("left", ( $(window).width() - $('.appriseOuter').width() ) / 2+$(window).scrollLeft() + "px");
    
    if(args)
		{
		if(args['animate'])
			{ 
			var aniSpeed = args['animate'];
			if(isNaN(aniSpeed)) { aniSpeed = 400; }
			$('.appriseOuter').css('top', '-200px').show().animate({top:"100px"}, aniSpeed);
			}
		else
			{ $('.appriseOuter').css('top', '100px').fadeIn(200); }
		}
	else
		{ $('.appriseOuter').css('top', '100px').fadeIn(200); }
    
    if(args)
    	{
    	if(args['input'])
    		{
    		$('.appriseInner').append('<div class="aInput"><input type="text" class="aTextbox" t="aTextbox" /></div>');
    		$('.aTextbox').focus();
    		}
    	}
    
    $('.appriseInner').append('<div class="aButtons"></div>');
    if(args)
    	{
		if(args['confirm'] || args['input'])
			{ 
			$('.aButtons').append('<button value="ok">Ok</button>');
			$('.aButtons').append('<button value="cancel">Cancel</button>'); 
			}
		else if(args['verify'])
			{
			$('.aButtons').append('<button value="ok">Yes</button>');
			$('.aButtons').append('<button value="cancel">No</button>');
			}
		else
			{ $('.aButtons').append('<button value="ok">Ok</button>'); }
		}
    else
    	{ $('.aButtons').append('<button value="ok">Ok</button>'); }
	
	$(document).keypress(function(e) 
		{
		if($('.appriseOverlay').is(':visible'))
			{
			if(e.keyCode == 13) 
				{ $('.aButtons > button[value="ok"]').click(); }
			}
		});
	
	var aText = false;
	$('.aTextbox').keyup(function()
    	{ aText = $(this).val(); });
   
    $('.aButtons > button').click(function()
    	{
    	$('.appriseOverlay').remove();
		$('.appriseOuter').remove();
    	if(callback)
    		{
			var wButton = $(this).attr("value");
			if(wButton=='ok')
				{ 
				if(args)
					{
					if(args['input'])
						{ callback(aText); }
					else
						{ callback(true); }
					}
				else
					{ callback(true); }
				}
			else if(wButton=='cancel')
				{ callback(false); }
			}
		});
	}
