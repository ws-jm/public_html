<?php
session_start();

$type = $_POST["type"];
$password = $_POST["password"];
$method = "AES-256-CBC";
$key = "4a5f85ff59c3d6294aabd47ea0de8b42e7c8635c";

if ( $type == "encrypt" )
{
    $ivlen = openssl_cipher_iv_length( $method );
    $iv = openssl_random_pseudo_bytes( $ivlen );
    $ciphertext_raw = openssl_encrypt( $password, $method, $key, $options = OPENSSL_RAW_DATA, $iv );
    $hmac = hash_hmac( 'sha256', $ciphertext_raw, $key, $as_binary = true );
    $password = base64_encode( $iv.$hmac.$ciphertext_raw );
    echo $password;
}
else if ( $type == "decrypt" )
{
    $c = base64_decode( $password );
    $ivlen = openssl_cipher_iv_length( $method );
    $iv = substr( $c, 0, $ivlen );
    $hmac = substr( $c, $ivlen, $sha2len = 32 );
    $ciphertext_raw = substr( $c, $ivlen + $sha2len );
    $password = openssl_decrypt( $ciphertext_raw, $method, $key, $options = OPENSSL_RAW_DATA, $iv );
    $calcmac = hash_hmac( 'sha256', $ciphertext_raw, $key, $as_binary = true );

    if ( hash_equals( $hmac, $calcmac ) )
    {
        echo $password;
    }
}
else {
    return false;
}

?>