module LogServiceClient {
	export class Debug {
		static ___DefaultErrorCallback(data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig): void {
			console.log('Client HTTP Error:');
			console.log('Error.data:');
			console.log(data);
			console.log('Error.status:');
			console.log(status);
		}
		public static clear (
			_SuccessCallback: ng.IHttpPromiseCallback<boolean>, 
			_ErrorCallback?: ng.IHttpPromiseCallback<boolean>) {
			if(!_ErrorCallback) _ErrorCallback = Debug.___DefaultErrorCallback;
			var _RemoteProcedureCallObject: rpc = {
					service: 'Debug', method: 'clear', parameters: []
				}
			RPC.post('LogService.php', _RemoteProcedureCallObject, 'boolean', _SuccessCallback, _ErrorCallback);
		}
		public static write (value:string, 
			_SuccessCallback: ng.IHttpPromiseCallback<boolean>, 
			_ErrorCallback?: ng.IHttpPromiseCallback<boolean>) {
			if(!_ErrorCallback) _ErrorCallback = Debug.___DefaultErrorCallback;
			var _RemoteProcedureCallObject: rpc = {
					service: 'Debug', method: 'write', parameters: [value]
				}
			RPC.post('LogService.php', _RemoteProcedureCallObject, 'boolean', _SuccessCallback, _ErrorCallback);
		}
	}

}
