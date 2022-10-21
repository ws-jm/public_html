<?php
class Arguments extends Exception
{
    public function __construct()
    {
	parent::__construct('Invalid or missed arguments');
    }
};

    require_once('send_email.php');
    
    $domain = '@sarus.com';
    $emails = ['support'=>'support','sales'=>'sales','partners'=>'partners','marketdata'=>'marketdata','databases'=>'databases'];
    $R = $_REQUEST;
    $result = [];
    ToLog('request is '.print_r($_REQUEST,true));
    header('Content-Type: application/json');
    try 
    {
//	throw new Arguments;
	if( !( isset($R['service_id']) && isset($R['body']) && isset($R['subject']) ) ) throw new Arguments;
	$result['code'] = 200;
	if( !isset($emails[$R['service_id']] ) ) throw new Exception('Argument service_id is invalid');
	if( isset($R['body_type']) ) $body_type = $R['body_type'];
	else $body_type = "text";
	$mail = $emails[$R['service_id']].$domain;
	$result = send_email($R['subject'],$R['body'],$body_type,$mail,$mail);
    }
    catch(Exception $ex)
    {
	header("HTTP/1.1 400 Bad Request");    
	$result['code'] = 400;
	$result['error'] = $ex->getMessage();
    }
    echo json_encode($result);
?>