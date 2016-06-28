<?php 
namespace {
	function json2object($source){
		//print_r($source);
        if(!is_object($source)) return $source;
		if($source->{'@@Table'} && $source->{'@@Schema'}){
			//check code security;
			if(!preg_match('/^\w+$/', $source->{'@@Schema'})) die('Access denied: json object security error.');
			if(!preg_match('/^\w+$/', $source->{'@@Table'})) die('Access denied: json object security error.');
			
			$code = 'return new \\'.$source->{'@@Schema'}.'\\'.$source->{'@@Table'}.'();';
			$target = eval($code);
			foreach($source as $key => $value){
                if(is_array($value)){
                    $target->{$key} = jsonArray2Array($value);
                }
                else{
                    $target->{$key} = json2object($value);
                }
			}
			return $target;
		}
		else{
			return $source;
		}
	}
	function jsonArray2Array($source){
		$arr = array();
		for($i=0;$i<count($source); $i++){
            if(is_array($source[$i])){
                array_push($arr, jsonArray2Array($source[$i]));
            }
            else{
                array_push($arr, json2object($source[$i]));
            }
		}
		return $arr;
	}
	function str2num($value){
		return strval($value);
	}
	function num2str($value){
		return intval($value);
	}
	function build_ref_array($values){
		$arr = array();
		for($i=0;$i<count($values);$i++){
			array_push($arr, get_reference($value[$i]));
		}
		return $arr;
	}
	function get_reference(&$value){
		return $value;
	}
	function random_number($length)
	{
		$characters = '0123456789';
		$randstring = '';
		for ($i = 0; $i < $length; $i++) {
			$randstring .= $characters[rand(0, strlen($characters)-1)];
		}
		return $randstring;
	}
	
	function GetStatementResults($stmt){
		$resultMetaData = mysqli_stmt_result_metadata($stmt);
		$obj = array();
		if($resultMetaData){
			$stmtRow = array();
			$rowReferences = array();
			while ($field = mysqli_fetch_field($resultMetaData)) {
				$rowReferences[] = &$stmtRow[$field->name];
			}
			mysqli_free_result($resultMetaData);
			$bindResultMethod = new ReflectionMethod('mysqli_stmt', 'bind_result');
			$bindResultMethod->invokeArgs($stmt, $rowReferences);
			while(mysqli_stmt_fetch($stmt)){
				$row = array();
				foreach($stmtRow as $key => $value){
					$row[$key] = $value;
					//echo" $key:$value ";
				}
				array_push($obj, $row);
			}
		}
		return $obj;
	}
	function GetTypedStatementResults($stmt, $initializationcode){
		$resultMetaData = mysqli_stmt_result_metadata($stmt);
		$obj = array();
		if($resultMetaData){
			$stmtRow = array();
			$rowReferences = array();
			while ($field = mysqli_fetch_field($resultMetaData)) {
				$rowReferences[] = &$stmtRow[$field->name];
			}
			mysqli_free_result($resultMetaData);
			$bindResultMethod = new ReflectionMethod('mysqli_stmt', 'bind_result');
			$bindResultMethod->invokeArgs($stmt, $rowReferences);
			while(mysqli_stmt_fetch($stmt)){
				$row = eval($initializationcode);
				foreach($stmtRow as $key => $value){
					$row->{$key} = $value;
					//echo" $key:$value ";
				}
				array_push($obj, $row);
			}
		}
		return $obj;
	}
}
?>