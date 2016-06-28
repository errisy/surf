var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var CORS;
(function (CORS) {
    CORS.enabled = false;
    function onCORSError(value) {
    }
    CORS.onCORSError = onCORSError;
    function corsget(url, config) {
        return CORS.http.get(url, config);
    }
    CORS.corsget = corsget;
    function corsput(url, data, config) {
        return CORS.http.put(url, data, config);
    }
    CORS.corsput = corsput;
    function corspost(url, data, config) {
        return CORS.http.post(url, data, config);
    }
    CORS.corspost = corspost;
    CORS.get = corsget;
    CORS.put = corsput;
    CORS.post = corspost;
    var CORSTestDirective = (function (_super) {
        __extends(CORSTestDirective, _super);
        function CORSTestDirective($http, $compile) {
            _super.call(this);
            CORS.http = $http;
            this.link = function (scope, element, attr) {
                //test if Allow-Control-Allow-Origin is available;
                scope.close = function () {
                    element.children().remove();
                };
                var _success = function (value) {
                    CORS.enabled = true;
                    CORS.get = CORS.corsget;
                    CORS.put = CORS.corsput;
                    CORS.post = CORS.corspost;
                };
                var _error = function (value) {
                    var code = '<div style="background-color: lemonchiffon; font-size: 16px; border-radius: 4px;" >'
                        + '                <div class="btn btn-danger btn-xs" style="position:absolute; right:0px; top:0px;" ng-click="close();">Close this Warning</div>'
                        + '                <div><span style="color: red; font-weight:bold;">Warning:</span><span>Cross-Origin Resource Sharing (CORS) is not supported in your browser.</span></div>'
                        + '                <div><span style="color: blue; font-weight:bold;">Suggestion:</span><span>We suggest your using <a href="https://www.google.com/chrome/" target="_googlechrome">Google Chrome</a> browser and installing <a href="https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?hl=en" target="_cors">Allow-Control-Allow-Origin</a> extension to enable CORS and refreshing this page. However, you can still continute to use this app without CORS, if you find it working at reasonable speed.</span></div>'
                        + '                <div><span style="color: mediumvioletred; font-weight:bold;">Why?</span>'
                        + '                <ol>'
                        + '                    <li>The Javascript algorithms of this web app may run faster in Google Chrome\'s V8 Engine.</li>'
                        + '                    <li>CORS allows this web app to circumvent our proxy and access KEGG and NCBI directly. Otherwise, this web app has to access KEGG, EMBL, PDB, Unitprot or NCBI via our server\'s proxy in Australia and thus become slower when it\'s retrieving data from them.</li>'
                        + '                </ol>'
                        + '            </div>';
                    var warning = $compile(code)(scope);
                    element.append(warning);
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
//# sourceMappingURL=cors.js.map