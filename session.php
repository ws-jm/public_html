<?php
    header("Access-Control-Allow-Origin: *");
    session_start();

    $type = $_POST["type"];
    $action = $_POST["action"];

    if ( $action !== "sessionToken" )
    {
        if ( $type == "set" ) {
            $_SESSION[ $action ] = $_POST["value"];
        }
        else if ( $type == "get" ) {
            if ( isset($_SESSION[ $action ]) )
                echo $_SESSION[ $action ];
            else
                echo "";
        }
    }
    else {
        if ( $type == "set" ) {
            $_SESSION["SessionToken"] = $_POST["value"];
        }
        else if ( $type == "get" ) {
            if ( isset($_SESSION["SessionToken"]) )
                echo $_SESSION["SessionToken"];
            else
                echo "";
        }
    }
?>