<?php
	echo file_put_contents('task/testwrite.ts','hello world');
    echo 'success.';
    echo file_get_contents('task/testwrite.ts');
?>