<?php
	session_start();
	include("./phptextClass.php");	
	
	/*create class object*/
	$phptextObj = new phptextClass();	
	/*phptext function to genrate image with text*/
	$font = '#'.substr("00".dechex(rand(0,255)),-2).substr("00".dechex(rand(0,255)),-2).substr("00".dechex(rand(0,255)),-2);
	$back = '#'.substr("00".dechex(rand(0,255)),-2).substr("00".dechex(rand(0,255)),-2).substr("00".dechex(rand(0,255)),-2);
	$phptextObj->phpcaptcha($font,$back,120,40,10,25);	
 ?>