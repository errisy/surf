var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var CORS;
(function (CORS) {
    var CORSTestDirective = (function (_super) {
        __extends(CORSTestDirective, _super);
        function CORSTestDirective($http, $compile) {
            _super.call(this);
            this.link = function (scope, element, attr) {
                //test if Allow-Control-Allow-Origin is available;
                var _success = function (value) {
                };
                var _error = function (value) {
                };
                $http.get('http://rest.kegg.jp/info/kegg')
                    .success(_success)
                    .error(_error);
            };
        }
        return CORSTestDirective;
    }(ngstd.AngularDirective));
    CORS.CORSTestDirective = CORSTestDirective;
})(CORS || (CORS = {}));
//# sourceMappingURL=warning.js.map