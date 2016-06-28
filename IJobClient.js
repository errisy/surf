var JobServiceClient;
(function (JobServiceClient) {
    var Manager = (function () {
        function Manager() {
        }
        Manager.___DefaultErrorCallback = function (data, status, headers, config) {
            console.log('Client HTTP Error:');
            console.log('Error.data:');
            console.log(data);
            console.log('Error.status:');
            console.log(status);
        };
        Manager.submitJob = function (job, _SuccessCallback, _ErrorCallback) {
            if (!_ErrorCallback)
                _ErrorCallback = Manager.___DefaultErrorCallback;
            var _RemoteProcedureCallObject = {
                service: 'Manager', method: 'submitJob', parameters: [job]
            };
            RPC.post('JobService.php', _RemoteProcedureCallObject, 'Solubility.JobStatus', _SuccessCallback, _ErrorCallback);
        };
        Manager.applyForJob = function (jobID, _SuccessCallback, _ErrorCallback) {
            if (!_ErrorCallback)
                _ErrorCallback = Manager.___DefaultErrorCallback;
            var _RemoteProcedureCallObject = {
                service: 'Manager', method: 'applyForJob', parameters: [jobID]
            };
            RPC.post('JobService.php', _RemoteProcedureCallObject, 'Solubility.Task', _SuccessCallback, _ErrorCallback);
        };
        Manager.reportStatus = function (jobID, status, _SuccessCallback, _ErrorCallback) {
            if (!_ErrorCallback)
                _ErrorCallback = Manager.___DefaultErrorCallback;
            var _RemoteProcedureCallObject = {
                service: 'Manager', method: 'reportStatus', parameters: [jobID, status]
            };
            RPC.post('JobService.php', _RemoteProcedureCallObject, 'Solubility.JobStatus', _SuccessCallback, _ErrorCallback);
        };
        Manager.finishJob = function (jobID, chain, _SuccessCallback, _ErrorCallback) {
            if (!_ErrorCallback)
                _ErrorCallback = Manager.___DefaultErrorCallback;
            var _RemoteProcedureCallObject = {
                service: 'Manager', method: 'finishJob', parameters: [jobID, chain]
            };
            RPC.post('JobService.php', _RemoteProcedureCallObject, 'Solubility.JobFinishResponse', _SuccessCallback, _ErrorCallback);
        };
        Manager.downloadChains = function (list, _SuccessCallback, _ErrorCallback) {
            if (!_ErrorCallback)
                _ErrorCallback = Manager.___DefaultErrorCallback;
            var _RemoteProcedureCallObject = {
                service: 'Manager', method: 'downloadChains', parameters: [list]
            };
            RPC.post('JobService.php', _RemoteProcedureCallObject, 'Solubility.ChainResponse', _SuccessCallback, _ErrorCallback);
        };
        return Manager;
    }());
    JobServiceClient.Manager = Manager;
})(JobServiceClient || (JobServiceClient = {}));
//# sourceMappingURL=IJobClient.js.map