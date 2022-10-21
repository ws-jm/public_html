<?php
    // session_start();

    // $type = $_POST["type"];
    // $action = $_POST["action"];

    // if ( $action !== "sessionToken" )
    // {
    //     if ( $type == "set" ) {
    //         $_SESSION[ $action ] = $_POST["value"];
    //     }
    //     else if ( $type == "get" ) {
    //         if ( isset($_SESSION[ $action ]) )
    //             echo $_SESSION[ $action ];
    //         else
    //             echo "";
    //     }
    // }
    // else {
    //     if ( $type == "set" ) {
    //         $_SESSION["SessionToken"] = $_POST["value"];
    //     }
    //     else if ( $type == "get" ) {
    //         if ( isset($_SESSION["SessionToken"]) )
    //             echo $_SESSION["SessionToken"];
    //         else
    //             echo "";
    //     }
    // }

    $subject = $_POST["sub_name"]." Message from Sarus web site on ".$_POST["sub_date"]." at ".$_POST["sub_dateT"];
    $message = "Name\r\n" . "-------------------------" . "\r\n"
                    . $_POST['m_name']
                    . "\r\n\r\nCompany\r\n" . "-------------------------" . "\r\n"
                    . $_POST['m_companyName']
                    . "\r\n\r\nCountry\r\n" . "-------------------------" . "\r\n"
                    . $_POST['m_country']
                    . "\r\n\r\nEmail\r\n" . "-------------------------" . "\r\n"
                    . $_POST['m_email']
                    . "\r\n\r\nPhone\r\n" . "-------------------------" . "\r\n"
                    . $_POST['m_telephone']
                    . "\r\n\r\nMessage\r\n" . "-------------------------" . "\r\n"
                    . $_POST['m_comment'];
    $api_key = "api-EB274C844E8C11EA947BF23C91BBF4A0";
    $to = [
        "Support <support@sarus.com>"
    ];
    $sender = $_POST['m_name']." <".$_POST['m_email'].">";

    $data = array('api_key' => $api_key, 'to' => $to, 'sender' => $sender, 'subject' => $subject, 'message' => $message);

    echo json_encode($data);
?>