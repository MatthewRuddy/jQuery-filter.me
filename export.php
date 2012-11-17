<?php

// Bail if no data has been received
if ( !$_POST )
    return;

// Extract variables
extract( $_POST );

// Bail if variables we need don't exist
if ( !isset( $data ) || !isset( $filename ) || !isset( $filter ) )
    return;

// Get the image data URI
$uri = substr( $data, strpos( $data,"," )+1 );
$uri = str_replace( ' ','+', $uri );

// Sterilize the filter name
$filter = strtolower( str_replace( ' ', '_', $filter ) );

// Download the file
header( "Content-Description: File Transfer" );
header( "Content-Disposition: attachment; filename={$filename}-{$filter}.jpeg" );
header( "Content-Type: image/jpeg" );
    echo base64_decode( $uri );
die();