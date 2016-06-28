//php include 'rpcdef' 
module LogServiceService {
	export class Debug {
		public clear ():boolean{
            return file_put_contents('log.txt', '');
		}
		public write (value:string):boolean{
            return file_put_contents('log.txt', value, FILE_APPEND);
		}
	}

}
//---AUTOGENERATED CODE BELOW: typescript dispatcher for php, please do not modify any code blow 
include('phputil.php');
var postInput = file_get_contents("php://input");
var jsonObject: rpc = json_decode(postInput);
switch (jsonObject.service) {
	case 'Debug':
		var LogService_Debug = new LogServiceService.Debug();
		switch (jsonObject.method) {
			case 'clear':
				var LogService_Debug_clearResult = LogService_Debug.clear();
				echo(json_encode(LogService_Debug_clearResult));
				break;
			case 'write':
				var LogService_Debug_write_parameter_0: string =  jsonObject.parameters[0];
				var LogService_Debug_writeResult = LogService_Debug.write(LogService_Debug_write_parameter_0);
				echo(json_encode(LogService_Debug_writeResult));
				break;
		}
	break;
}
