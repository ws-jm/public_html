<?php
    require_once('/home/marketdata/monitor_api/0.6/clsAPIRequest.php');
    require_once('/home/marketdata/monitor_api/utils.php');
    require_once('/home/marketdata/monitor_api/logging.php');
$global_log_file_name = "myfavorites_emails.log";    

function send_email($subject,$message,$type_message,$sender,$to)
{
    if( !($type_message == "text" || $type_message == "html") )$type_message = "text";
    $url = "api.smtp2go.com";
    $port = 443;
    $api_key = "api-EB274C844E8C11EA947BF23C91BBF4A0";
    $sto = [ $to ];
    $data = array('api_key' => $api_key, 'to' => $sto, 'sender' => $sender, 'subject' => $subject, $type_message.'_body' => $message);
    $req = new clsAPIRequest($url,$port,1,"1.1",1);
    $res_api = $req->request("/v3/email/send",$data,'POST');
    $res = ['code'=>200];
    ToLog('Answer: '.$res_api['body']);    
    switch( $res_api['answer_code'] )
    {
	case 200:
	    $body = json_decode($res_api['body'],true);
	    if( $body['data']['succeeded'] == 1 ) break;;
	    $res['code'] = 400;
	    $res['error'] = $body['data']['failures'][0];
	    ToLog("Error sending email to $to");	    
	    break;
	default:
	    $body = json_decode($res_api['body'],true);
	    $res['code'] = 400;
	    $res['error'] = $body['data']['error'];
	    ToLog("Error sending email to $to");
	    break;
    }
    return $res;
}
?>