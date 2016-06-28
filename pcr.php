<?php 
namespace {
    $data = file_get_contents("php://input");
    $postObj = json_decode($data);
    switch($postObj->method){
        case 'ScanRPC':
            $arr = array();
            if ($handle = opendir('.')) {
                $ext = '/\.ts$/i';
                $rpc = '/^[\s\S]{0,3}\s*\/\/\s*rpc/iu';
                while (false !== ($entry = readdir($handle))) {
                    if ($entry != "." && $entry != "..") {
                        preg_match($ext, $entry, $match);
                        if(count($match)>0){
                            $content = file_get_contents($entry);
                            preg_match($rpc,  $content, $match);
                            if(count($match)>0){
                                array_push($arr, $entry);
                            }
                        }
                    }
                }
                closedir($handle);
            }
            echo json_encode($arr);
            break;
        case 'ScanPHP':
            $arr = array();
            if ($handle = opendir('.')) {
                $ext = '/\.ts$/i';
                $rpc = '/^[\s\S]{0,3}\s*\/\/\s*php/iu';
                while (false !== ($entry = readdir($handle))) {
                    if ($entry != "." && $entry != "..") {
                        preg_match($ext, $entry, $match);
                        if(count($match)>0){
                            $content = file_get_contents($entry);
                            preg_match($rpc,  $content, $match);
                            if(count($match)>0){
                                array_push($arr, $entry);
                            }
                        }
                    }
                }
                closedir($handle);
            }
            echo json_encode($arr);
            break;
        case 'ScanCF':
            $arr = array();
            if ($handle = opendir('.')) {
                $ext = '/\.ts$/i';
                $rpc = '/^[\s\S]{0,3}\s*\/\/\s*cf/iu';
                while (false !== ($entry = readdir($handle))) {
                    if ($entry != "." && $entry != "..") {
                        preg_match($ext, $entry, $match);
                        if(count($match)>0){
                            $content = file_get_contents($entry);
                            preg_match($rpc,  $content, $match);
                            if(count($match)>0){
                                array_push($arr, $entry);
                            }
                        }
                    }
                }
                closedir($handle);
            }
            echo json_encode($arr);
            break;
        case 'Write':
            $cnt = 0;
            foreach ($postObj->value as $fileObj) {
                echo($fileObj->content);
                file_put_contents($fileObj->filename, $fileObj->content);
                $cnt +=1;
            }
            echo $cnt;
            break;
        case 'Get':
            $arr = array();
            foreach ($postObj->value as $fileObj) {
                if(file_exists($fileObj->filename)){
                    $content = file_get_contents($fileObj->filename);
                    array_push($arr, $content);
                }
                else{
                    array_push($arr, null);
                }
            }
            echo json_encode($arr);
            break;
    }
}
?>