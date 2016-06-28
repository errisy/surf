module CORS {
    export var http: ng.IHttpService;
    export var timeout: ng.ITimeoutService;
    export var interval: ng.IIntervalService;
    export var enabled: boolean = false;

    export function onCORSError(value: string) {
         

    }
    export function corsget(url: string, config?: ng.IRequestConfig) {
        return http.get(url, config);
    }
    export function corsput(url: string, data: any, config?: ng.IRequestConfig) {
        return http.put(url, data, config);
    }
    export function corspost(url: string, data: any, config?: ng.IRequestConfig) {
        return http.post(url, data, config);
    }

    export var get: (url: string, config?: ng.IRequestConfig) => ng.IHttpPromise<{}> = corsget;
    export var put: (url: string, data: any, config?: ng.IRequestConfig) => void = corsput;
    export var post: (url: string, data: any, config?: ng.IRequestConfig) => ng.IHttpPromise<{}> = corspost;


    export interface ICORSTestScope extends ng.IScope{
        close: () => void;
    }
    export class CORSTestDirective extends ngstd.AngularDirective<ng.IScope> {
        constructor($http: ng.IHttpService, $compile: ng.ICompileService) {
            super();
            CORS.http = $http;
            this.link = (scope: ICORSTestScope, element: ng.IAugmentedJQuery, attr: ng.IAttributes) => {
                //test if Allow-Control-Allow-Origin is available;
                scope.close = () => {
                    element.children().remove();
                };
                var _success = (value: string) => {
                    CORS.enabled = true;
                    CORS.get = CORS.corsget;
                    CORS.put = CORS.corsput;
                    CORS.post = CORS.corspost;
                };
                var _error = (value: string) => {
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
            }
        }
    }
}