module JobServiceClient {
	export class Manager {
		static ___DefaultErrorCallback(data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig): void {
			console.log('Client HTTP Error:');
			console.log('Error.data:');
			console.log(data);
			console.log('Error.status:');
			console.log(status);
		}
		public static submitJob (job:Solubility.Job, 
			_SuccessCallback: ng.IHttpPromiseCallback<Solubility.JobStatus>, 
			_ErrorCallback?: ng.IHttpPromiseCallback<Solubility.JobStatus>) {
			if(!_ErrorCallback) _ErrorCallback = Manager.___DefaultErrorCallback;
			var _RemoteProcedureCallObject: rpc = {
					service: 'Manager', method: 'submitJob', parameters: [job]
				}
			RPC.post('JobService.php', _RemoteProcedureCallObject, 'Solubility.JobStatus', _SuccessCallback, _ErrorCallback);
		}
		public static applyForJob (jobID:string, 
			_SuccessCallback: ng.IHttpPromiseCallback<Solubility.Task>, 
			_ErrorCallback?: ng.IHttpPromiseCallback<Solubility.Task>) {
			if(!_ErrorCallback) _ErrorCallback = Manager.___DefaultErrorCallback;
			var _RemoteProcedureCallObject: rpc = {
					service: 'Manager', method: 'applyForJob', parameters: [jobID]
				}
			RPC.post('JobService.php', _RemoteProcedureCallObject, 'Solubility.Task', _SuccessCallback, _ErrorCallback);
		}
		public static reportStatus (jobID:string, status:Solubility.JobStatus, 
			_SuccessCallback: ng.IHttpPromiseCallback<Solubility.JobStatus>, 
			_ErrorCallback?: ng.IHttpPromiseCallback<Solubility.JobStatus>) {
			if(!_ErrorCallback) _ErrorCallback = Manager.___DefaultErrorCallback;
			var _RemoteProcedureCallObject: rpc = {
					service: 'Manager', method: 'reportStatus', parameters: [jobID, status]
				}
			RPC.post('JobService.php', _RemoteProcedureCallObject, 'Solubility.JobStatus', _SuccessCallback, _ErrorCallback);
		}
		public static finishJob (jobID:string, chain:Solubility.ChainData, 
			_SuccessCallback: ng.IHttpPromiseCallback<Solubility.JobFinishResponse>, 
			_ErrorCallback?: ng.IHttpPromiseCallback<Solubility.JobFinishResponse>) {
			if(!_ErrorCallback) _ErrorCallback = Manager.___DefaultErrorCallback;
			var _RemoteProcedureCallObject: rpc = {
					service: 'Manager', method: 'finishJob', parameters: [jobID, chain]
				}
			RPC.post('JobService.php', _RemoteProcedureCallObject, 'Solubility.JobFinishResponse', _SuccessCallback, _ErrorCallback);
		}
		public static downloadChains (list:string[], 
			_SuccessCallback: ng.IHttpPromiseCallback<Solubility.ChainResponse>, 
			_ErrorCallback?: ng.IHttpPromiseCallback<Solubility.ChainResponse>) {
			if(!_ErrorCallback) _ErrorCallback = Manager.___DefaultErrorCallback;
			var _RemoteProcedureCallObject: rpc = {
					service: 'Manager', method: 'downloadChains', parameters: [list]
				}
			RPC.post('JobService.php', _RemoteProcedureCallObject, 'Solubility.ChainResponse', _SuccessCallback, _ErrorCallback);
		}
	}

}
