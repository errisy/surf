var LogServiceClient;
(function (LogServiceClient) {
    var Debug = (function () {
        function Debug() {
        }
        Debug.___DefaultErrorCallback = function (data, status, headers, config) {
            console.log('Client HTTP Error:');
            console.log('Error.data:');
            console.log(data);
            console.log('Error.status:');
            console.log(status);
        };
        Debug.clear = function (_SuccessCallback, _ErrorCallback) {
            if (!_ErrorCallback)
                _ErrorCallback = Debug.___DefaultErrorCallback;
            var _RemoteProcedureCallObject = {
                service: 'Debug', method: 'clear', parameters: []
            };
            RPC.post('LogService.php', _RemoteProcedureCallObject, 'boolean', _SuccessCallback, _ErrorCallback);
        };
        Debug.write = function (value, _SuccessCallback, _ErrorCallback) {
            if (!_ErrorCallback)
                _ErrorCallback = Debug.___DefaultErrorCallback;
            var _RemoteProcedureCallObject = {
                service: 'Debug', method: 'write', parameters: [value]
            };
            RPC.post('LogService.php', _RemoteProcedureCallObject, 'boolean', _SuccessCallback, _ErrorCallback);
        };
        return Debug;
    }());
    LogServiceClient.Debug = Debug;
})(LogServiceClient || (LogServiceClient = {}));
//# sourceMappingURL=logClient.js.map