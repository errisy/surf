function ngInject(...args: ns[]): string[] {
    var services: string[] = [];
    for (var i: number = 0; i < args.length; i++) {
        switch (args[i]) {
            case ns.http:
                services.push('$http');
                break;
            case ns.scope:
                services.push('$scope');
                break;
            case ns.element:
                services.push('$element');
                break;
        }
    }
    return services;
}

enum ns {
    http,
    scope,
    rootScope,
    element
}

/**
 * This class allows you to genenerate url encoded form data;
 * the key-value pairs will be presented as 'key=value&key=value&....' in the data property.
 */
class FormUrlEncoded {
    /**
     * A config that set 'Content-type' to 'application/x-www-form-urlencoded';
     */
    static get config(): ng.IRequestConfig {
        return <any>{
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            }
        };
    }
    private values: string[] = [];
    /**
     * append key-value pairs to the form;
     */
    public append = (key: string, value: string) => {
        this.values.push(key + '=' + value);
    }
    /**
     * Get the string value with data in as 'key=value&key=value&....' format;
     */
    get data(): string {
        return this.values.join('&');
    }
}

class DeferredScript {
    public src: string;
    public value: string;
    private callback: () => void;
    public onSuccess = (data: string) => {
        this.value = data;
        //console.log('script loaded:');
        //console.log(this.value);
        if (this.callback) this.callback();
    };
    public load = (): void => {
        var script: HTMLScriptElement = document.createElement('script');
        script.type = 'text/javascript';
        script.text = this.value;
        //script.src = this.src;
        document.body.appendChild(script);
        //console.log('script loaded: ' + this.src);

    }
    /**
    * Guard Function: if ({DeferredScript}.isNotReady(() => this.{Current Function}(map))) return;
    * This function allows you to call back to the function that runs the call so that you can keep waiting until all scripts are loaded.
    */
    public isNotReady = (callback: () => void): boolean => {
        //console.log('isNotReady Called: ' + this.src);
        this.callback = callback;
        if (this.value) {
            //console.log('start script loading: ' + this.src);
            this.load();
            //this.callback();
            return false;
        }
        else {
            return true;
        }
    }
}

class DeferredScriptLoaderService {
    static $inject = ['$http'];
    constructor($http: ng.IHttpService) {
        //console.log('DeferredScriptLoaderFactory: ');
        for (var i: number = 0; i < DeferredScriptLoaderService.scripts.length; i++) {
            var script = DeferredScriptLoaderService.scripts[i];
            $http.get(script.src).success(script.onSuccess);
        }
    }
    static add(src: string): DeferredScript {
        var script = new DeferredScript();
        script.src = src;
        DeferredScriptLoaderService.scripts.push(script);
        return script;
    }
    static scripts: DeferredScript[] = [];
}

module ngstd {
    var debugging: boolean = false;

    export interface INamed {
        TypeName: string;
        clone: (value: any) => any;
    }
    /**
     * the base class for types that can be used for model, where name of the type is important for selecting the template.
     */
    export class NamedObject implements INamed {
        get TypeName(): string {
            var funcNameRegex = /function (.{1,})\(/;
            var results = (funcNameRegex).exec((this).constructor.toString());
            return (results && results.length > 1) ? results[1] : "";
        };
        clone(value: any) {
            for (var attr in value) {
                //console.log(this.TypeName + ".hasOwnProperty" + attr + " :" + this.hasOwnProperty(attr));
                if (attr != "TypeName" && value.hasOwnProperty(attr)) this[attr] = value[attr];
            }
        }
    }
    /**
     * This function deserializes json object by the TypeName property. Your TypeName must contains the module name and class name for eval() call;
     * @param json
     */
    export function TypedJSON(json: any) {
        var copy;
        // Handle the 3 simple types, and null or undefined
        if (null == json || "object" != typeof json) return json;

        // Handle Date
        if (json instanceof Date) {
            copy = new Date();
            copy.setTime(json.getTime());
            return copy;
        }

        // Handle Array
        if (json instanceof Array) {
            copy = [];
            for (var i = 0, len = json.length; i < len; i++) {
                copy[i] = TypedJSON(json[i]);
            }
            return copy;
        }

        // Handle Object
        if (json instanceof Object) {
            var TypeName = "TypeName";
            var name: string;
            if (json.hasOwnProperty(TypeName)) {

                //to use eval to create new class;
                name = json[TypeName];
                copy = eval("new " + name + "()");
                //console.log(copy);
            }
            else {
                copy = {};
            }

            for (var attr in json) {
                if (attr != "TypeName" && json.hasOwnProperty(attr)) copy[attr] = TypedJSON(json[attr]);
            }
            return copy;
        }
    }
    export function SerializeJSON(object: any): string {
        //console.log('Serizlizing: ' + object);
        if (typeof object === 'boolean') return JSON.stringify(object);
        if (object instanceof Date) return JSON.stringify(object);
        if (typeof object === 'string') return JSON.stringify(object);
        if (typeof object === 'number') return JSON.stringify(object);
        if (object instanceof RegExp) return JSON.stringify(object);
        //Handle null
        if (!object) return 'null';

        //Handle Array
        if (object instanceof Array) {
            var codes: string[] = [];
            for (var i: number = 0; i < object.length; i++) {
                codes.push(SerializeJSON(object[i]));
            }
            return '[' + codes.join(',') + ']';
        }

        if (object instanceof Object) {
            var codes: string[] = [];
            //console.log(object instanceof ngstd.NamedObject);
            if (object instanceof ngstd.NamedObject) {
                codes.push('"TypeName": "' + object.TypeName + '"');
            }
            for (var attr in object) {
                //console.log('Attribute: ' + attr + '; OwnProperty: ' + object.hasOwnProperty(attr));
                if (object.hasOwnProperty(attr)) {
                    //console.log('"' + attr + '":' + SerializeJSON(object[attr]));
                    //console.log(object[attr]);
                    codes.push('"' + attr + '":' + SerializeJSON(object[attr]));
                }
                //else {
                //    if (attr = 'TypeName') {
                //        codes.push('"TypeName": "' + object.TypeName + '"');
                //    }
                //}
            }
            return '{' + codes.join(',') + '}';
        }

    }
    export interface AngularLink {
        (scope: ng.IScope, element: JQuery): void;
    }
    export class PathModel {
        public path: string;
        public selectedModel: PathModel;
        public parameters: {}; //use for(key in object) to get all parameters
    }
    /**
     * A controller the provide standard viewmodel control
     */
    //export class StdController<TApp, TData, TModel> {
    //    static $inject = ['$scope'];
    //    constructor($scope: IStdScope<TApp, TData, TModel>) {
            
    //    }
    //}
    export interface IStdScope<TApp, TData, TModel, TParent> extends ng.IScope {
        app: TApp,
        data: TData,
        model: TModel,
        parent: TParent
    }
    export interface IPage {
        index: number;
        page: number;
    }
/**
 * An implementation of Angular Module. A few important setting features are provided as standard functions.
 */
    export class AngularModule {
        app: ng.IModule;
        constructor(name: string, modules: Array<string>, configFn?: Function) {
            if (!modules) modules = [];
            this.app = angular.module(name, modules, configFn);
        }
        config(configFn?: Function) {
            this.app.config(configFn);
        }
        trustUrl(pattern: RegExp) {
            this.app.config(function ($compileProvider: ng.ICompileProvider) {
                $compileProvider.aHrefSanitizationWhitelist(pattern);
            });
        }
        addController(name: string, controller: Function) {
            this.app.controller(name, controller);
        }
        /**
         * Add a directive to the Angular Module;
         * @param name is the name of the directive
         * @param factory is the factory function such as ()=>new Directive(). Directive name won't work.
         */
        addDirective(name: string, factory: ng.IDirectiveFactory) {
            this.app.directive(name, factory);
        }
        addStdDirective(name: string, templateUrl: string, Controller: Function) {
            this.app.directive(name, () => {
                return {
                    restrict: 'E',
                    templateUrl: templateUrl,
                    controller: Controller,
                    scope: {
                        app: '=',
                        data: '=',
                        model: '=',
                        parent: '='
                    },
                    controllerAs: 'controller'
                };
            });
        }
        addFactory(name: string, factory: Function) {
            this.app.factory(name, factory);
        }
        addService(name: string, service: Function) {
            this.app.service(name, service);
        }
        /**
         * Provide access to the ng.IModule;
         */
        get Base(): ng.IModule {
            return this.app;
        }

        /**
         * enables html5 mode for using base<path> and location service;
         */
        public LocationHtml5Mode = () => {
            this.app.config(
                ['$locationProvider',
                    ($locationProvider: ng.ILocationProvider) => {
                        $locationProvider.html5Mode(true);
                    }
                ]
            );
        };
        /**
         * Include Content Directive in this module;
         */
        public includeContentDirective = () => {
            this.addDirective('content', () => new ContentDirective());
        };
        /**
         * 
         */
        public includeTreeDirective = () => {
            this.addDirective('tree', ($compile: ng.ICompileService, $http: ng.IHttpService) => new TreeDirective($compile, $http));
        }
        /**
         * Include Sheet Directive in this module;
         */
        public includeSheetDirective = () => {
            this.addDirective('sheet', () => new SheetDirective());
        }
        /**
         * Include Image Directive in this module;
         */
        public includePictureDirective = () => {
            this.addDirective('picture', () => new PictureDirective());
        }
        public includeOpenFileDirective = () => {
            this.addDirective('openfile', ($compile: ng.ICompileService) => new OpenFileDirective($compile));
        }
        public includeMenuGroupDirective = () => {
            this.addDirective('menuGroup', () => new MenuGroupDirective());
        }
        public includeImageSlideDirective = (name?: string) => {
            this.addDirective(name ? name : 'imageslide', () => new ImageSlideDirective());
        }
        public includeCaptchaDirecive = (name?: string) => {
            this.addDirective(name ? name : 'captcha', () => new ngstd.CaptchaDirective());
        }
        public includeFileUploadDirective = (name?: string) => {
            this.addDirective(name ? name : 'fileupload', () => new ngstd.FileUploadDirective());
        }
        public includeMouseSelectDirective = (name?: string) => {
            this.addDirective(name ? name : 'mouseselect', ($window: ng.IWindowService) => new ngstd.MouseSelectDirective($window));
        }
        public includePagesFilter = () => {
            //split the string and return empty
            this.app.filter('pages', () => {
                return (input:number, numberPerPage: number) => {
                    var arr: IPage[] = [];
                    for (var i = 0; i < Math.ceil(input / numberPerPage); i++) {
                        arr.push({ index: i * numberPerPage, page: i + 1 });
                    }
                    return arr;
                }
            });
        }
        /**
         * convert a number of PHP date to string date format. By default, the format is 'YYYY-MM-DD HH:mm:ss';
         */
        public includePHPDateFilter = () => {
            //split the string and return empty
            this.app.filter('phpdate', () => {
                return (input: number, format?: string) => {
                    if (!format) format = 'YYYY-MM-DD HH:mm:ss';
                    return moment('1970-01-01 00:00:00').add(input, 'second').format(format);
                }
            });
        }
        public includeStartFromFilter = () => {
            //split the string and return empty
            this.app.filter('startFrom', () => {
                return (input: any[], start: number) => {
                    if (typeof start != 'number' || isNaN(start) || start < 0) start = 0;
                    start = start; //parse to int
                    if (!input) return [];
                    if (!Array.isArray(input)) return input;
                    return input.slice(start);
                }
            });
        }
        public includePageDirective = (name?: string) => {
            //split the string and return empty
            this.addDirective(name ? name : 'page', () => new ngstd.PageDirective());
        }
        public includeSplitFilter = () => {
            //split the string and return empty
            this.app.filter('split', () => {
                return (input: string, splitchar: string) => {
                    var arr: string[] = [];
                    if(input)input.split(splitchar)
                        .forEach((value: string, index: number, source: string[]) => {
                            if (value) if (value.length > 0) arr.push(value);
                        });
                    return arr;
                }
            });
        }
        public includeGalleryFilter = () => {
            //split the string and return empty
            this.app.filter('gallery', () => {
                return (input: string, splitchar: string) => {
                    var arr: any[] = [];
                    if (input) input.split(splitchar)
                        .forEach((value: string, index: number, source: string[]) => {
                            if (value) if (value.length > 0)
                                arr.push({ thumb: value, img: value, description: null });
                        });
                    return arr;
                }
            });
        }
        public includeFirstImageFilter = () => {
            //split the string and return empty
            this.app.filter('firstimage', () => {
                return (input: string, splitchar: string) => {
                    var arr: string[] = [];
                    if (input) input.split(splitchar)
                        .forEach((value: string, index: number, source: string[]) => {
                            if (value) if (value.length > 0) arr.push(value);
                        });
                    return arr[0];
                }
            });
        }
        public includeString2DateFilter = () => {
            //split the string and return empty
            this.app.filter('string2date', () => {
                return (input: string) => {
                    return moment(input).toDate();
                }
            });
        }
        public includeDecimal = (name?:string) => {
            this.addDirective(name? name:'decimal', () => new DecimalDirective());
        }
        public includeImageEditorDirective = (name?: string) => {
            this.addDirective(name ? name : 'imageEditor', () => new ImageEditorDirective());
        }
        public includeString2DateDirective = (name?: string) => {
            this.addDirective(name ? name : 'string2date', () => new String2DateModelConversionDirective());
        }
        /**
        * include DynamicTBody directive with default name 'dynamic';
        */
        public includeDynamicTBody = (name?: string) => {
            this.addDirective(name ? name : 'dynamic', ($compile: ng.ICompileService) => new DynamicTBodyDirective($compile));
        }
        public includeTimeDrirective = (name?: string) => {
            this.addDirective(name ? name : 'time', ($compile: ng.ICompileService) => new TimeDirective($compile));
        }
        public includeDateTimeDrirective = (name?: string) => {
            this.addDirective(name ? name : 'datetime', ($compile: ng.ICompileService) => new DateTimeDirective($compile));
        }
        public includeNum2StrDirective = (name?: string) => {
            this.addDirective(name ? name : 'num2str', () => new Num2StrModelConversionDirective());
        }
        public includeBool2StrDirective = (name?: string) => {
            this.addDirective(name ? name : 'bool2str', () => new TinyInt2BoolModelConverstionDirective());
        }
        public includeGalleryDirective = (name?: string) => {
            this.addDirective(name ? name : 'gallery', () => new GalleryDirective());
        }
    }

    /**
     * 
     */
    export class AppController {
        /**
         * Template Selector by Type, this is a default selector
         */
        public TemplateTypeSelector = (data: any, templates: DataTemplate[]) => {
            var nType: ngstd.NamedObject;
            var name: string;
            if (data) {
                if (data instanceof Array) {
                    if (data.length) if (data.length > 0) {
                        nType = data[0];
                        name = nType.TypeName + '[]';
                    } else {
                        name = '';
                    }
                }
                else {
                    nType = data;
                    name = nType.TypeName;
                }
            }
            else {
                name = '';
            }
            //var resolver = new research.metadata.NameResolver();
            //console.log(resolver.getFullClassNameFromInstance(data, window));
            if (debugging) console.log(name); //debugging swtich
            var result: string = '';
            templates.forEach((value: DataTemplate, index: number, array: DataTemplate[]) => {
                if (value.type == name) {
                    result = value.template;
                    return;
                }
            });
            return result;
        };
        /**
         * Template Selector. Always selector the first template.
         */
        public TemplateFirstSelector = (data: any, templates: DataTemplate[]) => {
            if (templates) if (templates.length > 0) {
                return templates[0].template;
            }
            else {
                return '';
            }
        };
    }
    export class DirectiveRestrict {
        static E: string = 'E';
        static A: string = 'A';
        static AE: string = 'AE';
        static C: string = 'C';
    }
    export class BindingRestrict {
        static Both: string = '=';
        static In: string = '@';
        static Out: string = '&';
        static OptionalBoth: string = '=?';
    }
    export class AngularDirective<Scope extends ng.IScope> implements ng.IDirective {
        public restrict: string;
        public template: string;
        public templateUrl: string;
        public scope: Scope = <Scope>{};
        public controller: Function | any[];
        public link: (scope: ng.IScope, element: ng.IAugmentedJQuery, attr:ng.IAttributes, ...args: any[]) => void;
        constructor() {
            return this;
        }
        public require: string;
        public controllerAs: string;
    }

    export interface IPageScope extends ng.IScope{
        limit: number;
        total: number;
        pages: IPage[];
    }
    export interface IPageDirectiveScope extends ng.IScope{
        limit: string;
        total: string;
        pages: string;
    }
    export class PageDirective extends AngularDirective<IPageDirectiveScope>{
        constructor() {
            super();
            this.restrict = DirectiveRestrict.A;
            this.scope.limit = BindingRestrict.OptionalBoth;
            this.scope.total = BindingRestrict.OptionalBoth;
            this.scope.pages = BindingRestrict.OptionalBoth;
            this.link = (scope: IPageScope) => {
                var buildPages = () => {
                    var nLimit: number = scope.limit;
                    var nTotal: number = scope.total;               
                    if (typeof nLimit == 'number' && !isNaN(nLimit)) {
                        if (nLimit < 1) nLimit = 1;
                    }
                    if (typeof nTotal == 'number' && !isNaN(nTotal)) {
                        if (nTotal < 0) nTotal = 0;
                    }
                    var arr: IPage[] = [];
                    for (var i = 0; i < Math.ceil(nTotal / nLimit); i++) {
                        arr.push({ index: i * nLimit, page: i + 1 });
                    }
                    scope.pages = arr;
                    //console.log(scope.pages, arr, nLimit, nTotal);
                }
                scope.$watch('limit', (nLimit: number, oLimit: number) => {
                    buildPages();
                });
                scope.$watch('total', (nTotal: number, oTotal: number) => {
                    buildPages();
                });

            };
        }
        
    }
    export class MouseSelectDirective extends ngstd.AngularDirective<ng.IScope>{
        constructor($window: ng.IWindowService) {
            super();
            this.restrict = ngstd.DirectiveRestrict.A;
            this.scope = null;
            this.link = (scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes) => {
                element.bind('mouseenter', (ev: JQueryEventObject) => {
                    if (!$window.getSelection().toString()) {
                        var input: HTMLInputElement = <any>element[0];
                        input.setSelectionRange(0, input.value.length);
                    }
                });
            }
        }
    }
    export interface IGalleryScope extends ng.IScope {
        image: string;
        images: string[];
        previous: () => void; 
        next: () => void;
        close: () => void;
    }
    export interface IGalleryDirectiveScope extends ng.IScope {
        images: string;
        close: string;
    }
    export class GalleryDirective extends ngstd.AngularDirective<IGalleryDirectiveScope > {
        constructor() {
            super();
            //this.scope = null;
            this.restrict = ngstd.DirectiveRestrict.E;
            this.scope.images = ngstd.BindingRestrict.Both;
            this.scope.close = ngstd.BindingRestrict.Out;
            this.template = '<div style="display: inline-flex;align-items: center;position: absolute;top:0;bottom:0;left:0;right:0;">'
                + '  <div style="width:100%;display: block;text-align:center;">'
                + '    <img height="300" ng-src="{{image}}"/>'
                + '  </div>'
                + '</div>'
                + '<div style="display: inline-flex;align-items: center;position: absolute;top:0;bottom:0;left:0;right:0;">'
                + '        <svg width="36" height="36" style="position: absolute; top:0;right:0;cursor:pointer;" ng-click="close()">'
                + '            <line x1="4" x2="32" y1="4" y2="32" style="stroke:rgb(255,0,0);stroke-width:6" />'
                + '            <line x1="32" x2="4" y1="4" y2="32" style="stroke:rgb(255,0,0);stroke-width:6" />'
                + '        </svg>'
                + '<div style="width:100%;display: block;">'
                + '<svg width="24" height="80" style="cursor: pointer; float: left; left: 0;" ng-click="previous()">'
                + '  <line x1="3" x2="21" y1="41" y2="0" stroke="white" stroke-width="6" />'
                + '  <line x1="3" x2="21" y1="39" y2="80" stroke="white" stroke-width="6" />'
                + '</svg>'
                + ''
                + '<svg width="24" height="80" style="cursor: pointer; float: right; right: 0;" ng-click="next()">'
                + '  <line x1="21" x2="3" y1="41" y2="0" stroke="white" stroke-width="6" />'
                + '  <line x1="21" x2="3" y1="39" y2="80" stroke="white" stroke-width="6" />'
                + '</svg>'
                + '</div>'
                + '</div>';
            this.link = (scope: IGalleryScope, element: ng.IAugmentedJQuery, attributes: ng.IAttributes) => {
                var index: number = 0;
                element.css('background-color', 'rgba(0,0,0,0.6)');
                element.css('border', '1px solid red');
                element.css('border-radius', '10px');
                element.on('keydown', (ev: JQueryKeyEventObject) => {
                    console.log(ev.keyCode);
                });
                scope.previous = () => {
                    if (scope.images) {
                        if (Array.isArray(scope.images)) {
                            if (scope.images.length > 0) {
                                index += 1;
                                if (index >= scope.images.length) index = 0;
                                scope.image = scope.images[index];
                            }

                        }
                    }
                };
                scope.next = () => {
                    if (scope.images) {
                        if (Array.isArray(scope.images)) {
                            if (scope.images.length > 0) {
                                index -= 1;
                                if (index < 0) index = scope.images.length - 1;
                                scope.image = scope.images[index];
                            }
                        }
                    }
                };
                scope.$watch('images', (nValue: string[], oValue: string[]) => {
                    console.log('images changed: ');
                    console.log(scope.images);
                    index = 0; 
                    if (nValue) {
                        if (Array.isArray(nValue)) {
                            if (scope.images.length > 0) {
                                scope.image = scope.images[index];
                            }
                        }
                    }
                });
            }
        }
    }

    //export interface IAvatarScope extends ng.IScope {
    //    entries: string[];
    //    data: any[];
    //}
    //export interface IAvatarDirectiveScope extends ng.IScope {
    //    entries: string;
    //    data: string;
    //}
    //export class AvatarDirective extends ngstd.AngularDirective<IAvatarDirectiveScope>{
    //    constructor($compile: ng.ICompileService) {
    //        super();
    //        this.scope.entries = ngstd.BindingRestrict.Both;
    //        this.link = (scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes) => {
    //            //allow user to define the model name by dataSource;
    //        };
    //    }
    //}



    /**
     * Directive Scope for Content control.
     */
    export interface ContentDirectiveScope extends ng.IScope {
        data: string;
        view: string;
        controller: string;
        app: string;
        selector: string;
    }
    /**
     * Controller Scope for Content control.
     */
    export interface ContentScope extends ng.IScope {
        data: any;
        view: string;
        controller: any;
        app: any;
        selector: (data: any, templates: DataTemplate[]) => string;
    }
    /**
     * DataTemplate definition for Conent control.
     */
    export class DataTemplate {
        key: string;
        path: string;
        type: string;
        url: string;
        template: string;
        jQuery: JQuery; 
    }
    /**
     * Content control controller. It accepts template elements to generate views for data. 
     * It will invoke the selector to evaluate what view to use.
     * We suggest building a TabControl based on Content control.
     * Content control use $compile method to build element within subscope. subscope will be destroyed on the removal of corresponding element.
     */
    export class ContentController {
        static $inject = ['$compile', '$element', '$http', '$scope'];
        private childscope: ng.IScope;
        private templates: DataTemplate[] = [];
        constructor(public $compile: ng.ICompileService, public $element: ng.IAugmentedJQuery, public $http: ng.IHttpService, public $scope: ContentScope) {
            //this.compiled = this.$compile("<test></test>")(this.$scope);
            //this.$element.append(this.compiled);
            //console.log(this.compiled);

            //this section will collect each of the view template from the inner of this model and they can be applied to each of the software.
            $element.children('template').each((index: number, elem: Element) => {
                var $elem: JQuery = $(elem);
                var template = new DataTemplate();
                template.key = $elem.attr('key');
                template.path = $elem.attr('path');
                template.type = $elem.attr('type');
                template.url = $elem.attr('url');
                template.jQuery = $elem;
                if (template.url) {
                    //the embedded template is used for loading process;
                    template.template = $elem.html();
                    $http.get(template.url)
                        .success((data: string) => {
                            template.template = data;
                            //we must check if the return value can affect the view of the content control.
                            if ($scope.selector) if ($scope.view != $scope.selector($scope.data, this.templates)) {
                                //if view is affected, view must be updated.
                                $scope.view = $scope.selector($scope.data, this.templates);
                            }
                        });
                }
                else {
                    template.template = $elem.html();
                }
                this.templates.push(template);
            });
            $element.children().remove();
            $scope.$watch('data', (newValue: any, oldValue: any) => {
                if ($scope.selector) {
                    var template: string = $scope.selector(newValue, this.templates);
                    if (template) $scope.view = template;
                }
                else {
                    console.log('Content View Warning: selector is undefined.\n' +
                        'Please provide a valid selector function:\n' +
                        'selector: (data: any, templates: DataTemplate[]) => string');
                }
            })
            //this is the way to set up a watch.
            $scope.$watch('view', (newValue: string, oldValue: string) => {
                console.log('$watch view');
                //distroy all child elements in the element.
                if (this.childscope) {
                    this.childscope.$destroy();//destroy the child scope
                    $element.children().remove();//remove each of the child elments
                }
                //create a new child scope.
                this.childscope = $scope.$new();
                //append the complied element
                $element.append($compile(newValue)(this.childscope));
            });
        }
    }
    /**
 * Control directive.
 */
    export class ContentDirective extends ngstd.AngularDirective<ContentDirectiveScope>{
        constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.E;
            this.template = '';
            this.scope.data = ngstd.BindingRestrict.Both;
            this.scope.view = ngstd.BindingRestrict.OptionalBoth;
            this.scope.controller = ngstd.BindingRestrict.OptionalBoth;
            this.scope.app = ngstd.BindingRestrict.OptionalBoth;
            this.scope.selector = ngstd.BindingRestrict.OptionalBoth;
            this.controller = ContentController;
        }
    }

    export class TreeTemplate {
        key: string;
        path: string;
        type: string;
        url: string;
        template: string;
        children: string;
        jQuery: JQuery;
    }

    export interface ITreeItemScope extends ng.IScope {
        data: any; //data for the template;
        controller: any; //user can specify the 
        model: any; //the model generated by modelbuilder
        app: any; //the app, if the user wants to pass app to the content;
    }
    export interface ITreeScope extends ITreeItemScope {
        tree: any[]; //data is an array;
        modelBuilder: (data: any) => any; //a function that will create a viewmodel for a data;
        childrenSelector: (item: any, parent: any, level: number) => string;// a fucntion that will tell the tree view which property to watch for sub items;
        templates: TreeTemplate[];//tempaltes that is used to save all templates;
        templateSelector: (data: any, templates: TreeTemplate[]) => TreeTemplate;
    }
    export interface ITreeDirectiveScope extends ng.IScope {
        tree: string;
        app: string;
        controller: string;
        modelBuilder: string;
        childrenSelector: string;
        templates: string;
        templateSelector: string;
    }
    export interface ITreeTemplateSelector<TData> {
        (data: TData, templates: ngstd.TreeTemplate[]);
    }
    export interface ITreeModelBuilder<TData> {
        (data: TData, item: ngstd.TreeItemBase);
    }
    /**
     * To use this directive, you must use the observable interface 'add(), remove(), removeAt(), clear()'
     */
    export class TreeDirective extends ngstd.AngularDirective<ITreeDirectiveScope>{
        constructor($compile: ng.ICompileService, $http: ng.IHttpService) {
            super();
            this.restrict = ngstd.DirectiveRestrict.A;
            this.scope.tree = ngstd.BindingRestrict.Both;
            this.scope.app = ngstd.BindingRestrict.Both;
            this.scope.controller = ngstd.BindingRestrict.Both;
            this.scope.modelBuilder = ngstd.BindingRestrict.Both;
            this.scope.childrenSelector = ngstd.BindingRestrict.Both;
            this.scope.templateSelector = ngstd.BindingRestrict.Both;
            this.scope.templates = ngstd.BindingRestrict.OptionalBoth;

            this.link = (scope: ITreeScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes) => {
                if (!scope.templates) scope.templates = [];
                if (!Array.isArray(scope.templates)) scope.templates = [];
                //this will remove all the templates in the content;
                element.children('template').each((index: number, elem: Element) => {
                    var $elem: JQuery = $(elem);
                    var template = new TreeTemplate();
                    template.key = $elem.attr('key');
                    template.path = $elem.attr('path');
                    template.type = $elem.attr('type');
                    template.url = $elem.attr('url');
                    template.children = $elem.attr('children');
                    template.jQuery = $elem;
                    if (template.url) {
                        //the embedded template is used for loading process;
                        template.template = $elem.html();
                        $http.get(template.url)
                            .success((data: string) => {
                                template.template = data;
                                //we must check if the return value can affect the view of the content control.
                                //if (scope.selector) if (scope.view != scope.selector(scope.data, scope.templates)) {
                                //    //if view is affected, view must be updated.
                                //    scope.view = scope.selector(scope.data, scope.templates);
                                //}
                            });
                    }
                    else {
                        template.template = $elem.html();
                    }
                    scope.templates.push(template);
                });

                element.children('template').remove();
                var root = new TreeRoot(scope, element, $compile);
                root.refresh();
            }
        }
    }

    export class TreeItemBase {
        public root: TreeRoot;
        public scope: ITreeItemScope;

        public view: ng.IAugmentedJQuery;
        public presentor: JQuery;
        public children: TreeItemBase[] = [];

        public data: any;
        public index: number;



        public childrenWatchUnregister: any;
        public parent: TreeItemBase;
        public level: number;

        /**
         * For observable interface of ItemsSource Watching, do not use this function;
         * @param array
         * @param item
         * @param index
         */
        private onInsert = (array: any[], item: any, index: number) => {
            this.insert(item, index);
        }
        /**
         * For observable interface of ItemsSource Watching, do not use this function;
         * @param array
         * @param item
         * @param index
         */
        private onRemoveAt = (array: any[], item: any, index: number) => {
            this.removeAt(index);
        }
        /**
         * For observable interface of ItemsSource Watching, do not use this function;
         * @param array
         */
        private onClear = (array: any[]) => {
            this.clear();
        }
        /**
         * For observable interface of ItemsSource Watching, do not use this function;
         * @param array
         * @param item
         * @param from
         * @param to
         */
        private onMoveTo = (array: any[], item: any, from: number, to: number) => {
            this.moveTo(from, to);
        }
        // protected functions for TreeView logic

        protected updateApp = () => {
            for (var i: number = 0; i < this.children.length; i++) {
                this.children[i].scope.app = this.root.app;
            }
        }
        protected updateController = () => {
            for (var i: number = 0; i < this.children.length; i++) {
                this.children[i].scope.controller = this.root.controller;
            }
        }
        protected updateModelBuilder = () => {
            if (this.root.modelBuilder) {
                for (var i: number = 0; i < this.children.length; i++) {
                    this.children[i].scope.model = this.root.modelBuilder(this.children[i].data, this.children[i]);
                }
            }
            else {
                for (var i: number = 0; i < this.children.length; i++) {
                    this.children[i].scope.model = null;
                }
            }
        }
        protected updateChildrenView = () => {
            for (var i: number = 0; i < this.children.length; i++) {
                this.children[i].buildView();
            }
            this.renderChildren();
        }

        /**
         * For watch children array;
         * @param newValue
         * @param oldValue
         */
        protected childrenChanged = (newChildren: any[], oldChildren: any[]) => {
            this.clearChildren();
            //detach all listeners;
            if (oldChildren) {
                oldChildren.onInsert = null;
                oldChildren.onRemoveAt = null;
                oldChildren.onClear = null;
                oldChildren.onMoveTo = null;
            }
            if (newChildren) {
                //attach listeners to new value;
                newChildren.onInsert = this.onInsert;
                newChildren.onRemoveAt = this.onRemoveAt;
                newChildren.onClear = this.onClear;
                newChildren.onMoveTo = this.onMoveTo;

                for (var i: number = 0; i < newChildren.length; i++) {
                    var data = newChildren[i];
                    var child = new TreeItem(data, this, this.level + 1);
                    child.index = i;
                    child.buildView();
                    this.children.push(child);
                }
                this.renderChildren();
            }
        }
        /**
         * clear children (perform remove on each child) but it doesn't update the children view; you need to call renderChildren to update view;
         * this function is for internal call;
         */
        protected clearChildren = () => {
            for (var i: number = 0; i < this.children.length; i++) {
                this.children[i].destroy();
            }
        }
        /**
         * destroy and rebuild the view, then it has to find the presentor;
         */
        protected buildView: () => void;
        protected render: () => void;
        //public functions:

        /**
         * clear chilren (perform remove on each child), destory scope, remove view;
         */
        public destroy = () => {
            for (var i: number = 0; i < this.children.length; i++) {
                this.children[i].destroy();
            }
            if (this.scope) this.scope.$destroy();
            if (this.view) this.view.remove();
            this.scope = null;
            this.view = null;
        }
        public clear = () => {
            this.clearChildren();
            this.renderChildren();
        }
        /**
        * present the children in the order of children;
        */
        public renderChildren = () => {
            if (this.presentor) {
                //detach all children;
                this.presentor.children().detach();
                //append all children;
                for (var i: number = 0; i < this.children.length; i++) {
                    this.children[i].index = i;
                    if (this.children[i].view) this.presentor.append(this.children[i].view);
                }
            }
        }
        /**
         * insert a data at 'index'
         * @param data
         * @param index
         */
        public insert = (data: any, index: number) => {
            var child = new TreeItem(data, this, this.level + 1);
            if (index < 0) index = 0;
            if (index > this.children.length) index = this.children.length;
            child.index = index;
            child.buildView();
            this.children.splice(index, 0, child);
            //we also need to take care of the view;
            this.renderChildren();
        }
        public removeAt = (index: number) => {
            var child = this.children[index];
            if (child) {
                child.destroy();
                this.children.splice(index, 1);
                this.renderChildren();
            }
        }
        /**
         * Move a child from 'from' to 'to';
         * @param from
         * @param to
         */
        public moveTo = (from: number, to: number) => {
            var child = this.children.splice(from, 1)[0];
            this.children.splice(to, 0, child);
            this.renderChildren();
        }
        /**
         * Move a child from 'from' position of this item to the 'to' position of the target item;
         * This function allows simple 'drag-drop' operation for the tree view.
         * @param from
         * @param target
         * @param to
         */
        public moveToTreeItem = (from: number, target: TreeItemBase, to: number, rebuildView?: boolean) => {
            var child = this.children.splice(from, 1)[0];
            this.renderChildren();
            child.parent = target;
            child.root = target.root;
            if (rebuildView) child.buildView();
            target.children.splice(to, 1, child);
            target.renderChildren();
        }
        /**
         * Allow viewmodel to update the view;
         */
        public refresh = () => {
            this.buildView();
            this.render();
        }
    }
    export class TreeItem extends TreeItemBase {
        constructor(data: any, parent: TreeItemBase, level: number) {
            super();
            this.data = data;
            this.parent = parent;
            this.root = parent.root;
            //from root;
        }
        public buildView = () => {
            this.destroy();
            var tempalte: TreeTemplate;
            if (this.root.templateSelector) tempalte = this.root.templateSelector(this.data, this.root.templates);
            if (!tempalte) if (this.root.templates) tempalte = this.root.templates[0]; // by default use the first template;
            var templateHTML = '{{data}}<div presenter></div>';
            var childrenSource: string;
            if (tempalte) {
                templateHTML = tempalte.template; //this is the default view for the tree view;
                childrenSource = tempalte.children;
            }
            //echo('templateHTML: ' + templateHTML);
            this.scope = <any>this.parent.scope.$new(true, this.parent.scope);
            this.scope.data = this.data;
            this.scope.controller = this.root.controller;
            if (this.root.modelBuilder) this.scope.model = this.root.modelBuilder(this.data, this);
            this.scope.app = this.root.app;
            //add watch here?
            if (this.root.childrenSelector) {
                var childrenSourceFromSelector = this.root.childrenSelector(this.data, this.parent.data, this.level);
                if (childrenSourceFromSelector) childrenSource = childrenSourceFromSelector;
            }
            if (childrenSource) this.childrenWatchUnregister = this.scope.$watch('data.' + childrenSource, this.childrenChanged);
            this.view = this.root.compile(templateHTML)(this.scope);
            this.presentor = this.view.filter('div[presenter]');
            if (!this.presentor) this.presentor = this.view.find('div[presenter]');
        }
        public render = () => {
            this.parent.renderChildren();
            //this.parent.scope.$apply();
        }
    }
    export class TreeRoot extends TreeItemBase {
        public controller: any;
        public app: any;
        public compile: ng.ICompileService;
        public templateSelector: (data: any, templates: TreeTemplate[]) => TreeTemplate;
        public modelBuilder: (data: any, treeItem: TreeItemBase) => any;
        public childrenSelector: (child: any, parent: any, level: number) => string;
        public templates: TreeTemplate[] = [];
        constructor(scope: ITreeScope, element: ng.IAugmentedJQuery, complie: ng.ICompileService) {
            super();
            this.level = 0;
            this.scope = scope;
            this.compile = complie;
            this.view = element;

            this.presentor = element.find('div[presenter]');


            this.app = scope.app;
            this.controller = scope.controller;
            this.templates = scope.templates;
            this.modelBuilder = scope.modelBuilder;
            this.templateSelector = scope.templateSelector;
            this.childrenSelector = scope.childrenSelector;

            scope.$watch('app', this.appWatcher);
            scope.$watch('controller', this.controllerWatcher);

            this.root = this;
            if (!this.presentor) {
                console.log('Fetal Error in Tree Directive: No <div presentor></div> node was found. You must provide one <div presentor></div> in the Tree Directive to present the data.');
            }
        }
        public buildView = () => {
            //we must watch the data;
            this.childrenWatchUnregister = this.scope.$watch('tree', this.childrenChanged);
        }
        public render = () => {
            //nothing to do;
            //this.scope.$apply();
        }
        private appWatcher = (newApp: any, oldApp: any) => {
            this.updateApp();
        }
        private controllerWatcher = (newController: any, oldController: any) => {
            this.updateController();
        }
        private modelBuilderWatcher = (newModelBuilder: any, oldModelBuilder: any) => {
            this.updateModelBuilder();
        }
        private templatesWatcher = (newTemplates: any, oldTemplates: any) => {
            this.updateChildrenView();
        }
        private templateSelectorWatcher = (newTemplateSelector: any, oldTemplateSelector: any) => {
            this.updateChildrenView();
        }
        private childrenSelectorWatcher = (newChildrenSelector: any, oldChildrenSelector: any) => {
            this.updateChildrenView();
        }
    }

    export interface IDecimalScope extends ng.IScope {
        accuracy: number;
        acceptNegative: boolean;
        acceptDecimal: boolean;
    }
    export interface IDecimalDirectiveScope extends ng.IScope {
        accuracy: string;
        acceptNegative: string;
        acceptDecimal: string;
    }
    /**
     * Decimal directive that make the Input Text only accept numbers and dot.
     */
    export class DecimalDirective extends ngstd.AngularDirective<IDecimalDirectiveScope>{
        public constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.A;
            this.scope.accuracy = ngstd.BindingRestrict.In;
            this.scope.acceptNegative = ngstd.BindingRestrict.In;
            this.scope.acceptDecimal = ngstd.BindingRestrict.In;
            this.require = 'ngModel';
        }
        static DecimalFormatter(accuracy: number): (value: string) => string {
            return (value: string) =>  (new DecimalNumber(value)).toDecimal(accuracy);
        }
        public link = (scope: IDecimalScope, element: ng.IAugmentedJQuery, attr: ng.IAttributes, ngModel: ng.INgModelController) => {

            var acceptNegative = false;
            if (scope.acceptNegative) {
                acceptNegative = Boolean(scope.acceptNegative);
            }
            var acceptDecimal = true;
            if (scope.acceptDecimal) {
                acceptDecimal = Boolean(scope.acceptDecimal);
            }
            var converter = DecimalDirective.DecimalFormatter(DecimalNumber.validateNumber(scope.accuracy, 2));
            ngModel.$parsers.push(converter);
            ngModel.$formatters.push(converter);
            element.on('keydown', (e: JQueryKeyEventObject) => {
                //console.log(e.keyCode);
                switch (e.keyCode) {
                    case 48: case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57:
                    case 96: case 97: case 98: case 99: case 100: case 101: case 102: case 103: case 104: case 105:
                        break;
                    case 8://back
                        break;
                    case 46://delete
                        break;
                    case 39: case 37: //right left
                        break;
                    case 38: case 40: //up down
                        break;
                    case 110: case 190: //dot .
                        if (!acceptDecimal) e.preventDefault();
                        break;
                    case 109: case 189:
                        //console.log('acceptNegative: ' + acceptNegative.toString());
                        if (acceptNegative) {
                            var dec = new DecimalNumber(ngModel.$viewValue);
                            dec.positive = !dec.positive;
                            ngModel.$setViewValue(dec.toDecimal(DecimalNumber.validateNumber(scope.accuracy, 2)));
                            //console.log('ngModel.$viewValue: ' + ngModel.$viewValue);
                            ngModel.$render();
                        }
                        e.preventDefault();
                        break;
                    default:
                        e.preventDefault();
                        break;
                }
            });
        }
    }
    export class String2DateModelConversionDirective extends ngstd.AngularDirective<ng.IScope>{
        public constructor() {
            super();
            //console.log('string2date directive init');
            this.restrict = ngstd.DirectiveRestrict.A;
            this.require = 'ngModel';
            this.scope = null;
        }
        static String2Date(value: string): Date {
            //console.log('string to date: ' + value);
            //console.log(moment(value).toDate());
            return moment(value).toDate();
        }
        static Date2String(value: Date): string {
            return moment(value).format('YYYY-MM-DD HH:mm:ss');
        }
        public link = (scope: IDecimalScope, element: ng.IAugmentedJQuery, attr: ng.IAttributes, ngModel: ng.INgModelController) => {
            //console.log('string2date link called');
            ngModel.$parsers.push(String2DateModelConversionDirective.Date2String);
            ngModel.$formatters.push(String2DateModelConversionDirective.String2Date);
        }
    }

    //dynamic directive
    export class DynamicDirective<Scope extends ng.IScope> implements ng.IDirective {
        public restrict: string;
        public template: string;
        public templateUrl: string;
        public scope: Scope = <Scope>{};
        public controller: Function;
        public link: (scope: ng.IScope, element: ng.IAugmentedJQuery) => void;
        constructor() {
            return this;
        }
        public controllerAs: string;
        public createDirective: string;
    }


    //we need a view directive that does not require a content, instead it will use a define viewbase, but not a complex directive view;
    export class ViewBase {
        public templateUrl: string;
        public template: string;
        public scope: ng.IScope;
        public element: JQuery;
        public destroy = () => {
            this.scope.$destroy();
            this.scope = null;
        }
    }
    export class ViewDirectiveController {
        static $inject = ['$compile', '$element', '$http', '$scope'];
        public compile: ng.ICompileService;
        public element: JQuery;
        public scope: IViewScope;
        constructor($compile: ng.ICompileService, $element: JQuery, $http: ng.IHttpService, $scope: IViewScope) {
            this.compile = $compile;
            this.element = $element;
            this.scope = $scope;
            $scope.$watch(() => $scope.view, this.onViewChanged);
        }
        public onViewChanged = (newValue: ViewBase, oldValue: ViewBase) => {
            //distroy all child elements in the element.
            if (oldValue) {
                this.element.children().detach();//remove each of the child elments
            }
            if (newValue) {
                if (newValue.scope) {
                    this.element.append(newValue.element);
                }
                else {
                    //append the complied element
                    newValue.scope = this.scope.$new();
                    newValue.element = this.compile(newValue.template)(newValue.scope);
                    this.element.append(newValue.element);
                }
            }
        }
    }
    export interface IViewScope extends ng.IScope {
        view: ViewBase;
    }
    export interface IViewDirectiveScope extends ng.IScope {
        view: string;
    }
    export class ViewDirective extends ngstd.AngularDirective<IViewDirectiveScope>{
        constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.A;
            this.template = '';
            this.scope.view = ngstd.BindingRestrict.Both;
        }
    }

    export class MenuGroupController {
        static $inject = ['$element', '$scope'];
        public element: JQuery;
        public view: JQuery;
        public title: JQuery;
        public parent: JQuery;
        public subScope: ng.IScope;
        constructor(public $element: JQuery, public $scope: ng.IScope) {
            //use $scope to watch size change and work out height for view panel;
            this.element = $element;
            this.parent = $element.parent();
            this.view = $element.children('.view');
            this.title = $element.children('.title');
            $scope.$watch(() => this.parent.height(), (newValue: number, oldValue: number) => {
                this.view.height(this.element.innerHeight() - this.title.outerHeight() - 2);
            });
        }
    }
    export class MenuGroupAlignmentColumn {
        public width: number = 0;
        public height: number = 0;
        public currentHeight: number = 0;
        public alignElement = (elem: Element): boolean => {
            console.log(elem);
            console.log('clientSize: ' + elem.clientWidth + ', ' + elem.clientHeight);
            if (this.currentHeight == 0) {
                //it must fit in even it is bigger than the view;
                this.currentHeight = elem.clientHeight;
                this.width = Math.max(elem.clientWidth, this.width);
                return true;
            } else {
                //it won't fit in if there is already something in the column;
                if (this.currentHeight + elem.clientHeight > this.height) {
                    return false;
                }
                else {
                    this.currentHeight += elem.clientHeight;
                    this.width = Math.max(elem.clientWidth, this.width);
                    return true;
                }
            }
        };
    }
    /**
     * This directive shall be used to automatically adjust tab group view panel height;
     */
    export class MenuGroupDirective extends AngularDirective<ng.IScope>{
        constructor() {
            super();
            this.restrict = DirectiveRestrict.C;
            this.controller = MenuGroupController;
        }
    }
    //export class DynamicTBodyController {
    //    static $inject = ['$scope', '$element', '$compile'];
    //    public scope: IDynamicTBodyScope;
    //    public element: ng.IAugmentedJQuery;
    //    public compile: ng.ICompileService;
    //    public childScope: ng.IScope;
    //    constructor($scope: IDynamicTBodyScope, $element: ng.IAugmentedJQuery, $compile: ng.ICompileService) {
    //        this.scope = $scope;
    //        this.element = $element;
    //        this.compile = $compile;
    //        this.scope.$watch('template', this.templateChanged);
    //    }
    //    public templateChanged = (nValue: string, oValue: string) => {
    //        this.element.children().remove();
    //        var template = '<tr ng-repeat="item in items">' + nValue + '</tr>';
    //        if (this.childScope) this.childScope.$destroy();
    //        this.childScope = this.scope.$new();
    //        var elem = this.compile(template)(this.childScope);
    //        this.element.append(elem);
    //    }
    //}
    export interface IDynamicTBodyScope extends ng.IScope {
        items: any[];
        template: string;
        controller: any;
    }
    export interface IDynamicTBodyDirectiveScope extends ng.IScope {
        items: string;
        template: string;
        controller: string;
    }
    export class DynamicTBodyDirective extends ngstd.AngularDirective<IDynamicTBodyDirectiveScope>{
        constructor($compile:ng.ICompileService) {
            super();
            this.restrict = DirectiveRestrict.A
            this.scope.items = BindingRestrict.Both;
            this.scope.template = BindingRestrict.Both;
            this.scope.controller = BindingRestrict.Both;
            this.link = function (scope: IDynamicTBodyScope, element: ng.IAugmentedJQuery) {
                var childScope: ng.IScope;
                
                scope.$watch('template', (nValue: string, oValue: string) => {
                    element.children().remove();
                    var template = '<tr ng-repeat="item in items">' + nValue + '</tr>';
                    if (childScope) childScope.$destroy();
                    childScope = scope.$new();
                    var elem = $compile(template)(childScope);
                    element.append(elem);
                });
            };
        }
    }
    export class ImageEditorController {
        static $inject = ['$scope'];
        public scope: IImageEditorScope;
        public constructor($scope: IImageEditorScope) {
            this.scope = $scope;
            //this watch will automatically generate the images from string, so the event handler only has to handle this 'image' string;
            //this.scope.$watch('image', this.onImageChanged );
            this.scope.imageChanged = this.onImageChanged;
        }
        public onImageChanged = (newValue: string) => {
            if (newValue) {
                this.images = newValue.split(';').filter((value: string) => {
                    if (value) return value.length > 0;
                    return false;
                });
            }
            else {
                this.images = [];
            }
        }
        public images: string[];
        public removeImage = ($index: number) => {
            //console.log('$index: ' + $index);
            if (this.scope.multiple) {
                var arr = this.scope.getImage().split(';').filter((value: string) => {
                    if (value) return value.length > 0;
                    return false;
                });
                arr.splice($index, 1);
                if (arr.length > 0) {
                    this.scope.setImage(arr.join(';') + ';');
                }
                else {
                    this.scope.setImage('');
                }

                //var index = arr.indexOf(value);
                //if (index > -1) {
                //    arr.splice(index, 1);
                //    //rebuild the image string;
                //    if (arr.length > 0) {
                //        this.scope.setImage(arr.join(';') + ';');
                //    }
                //    else {
                //        this.scope.setImage('');
                //    }
                //}
                //do nothing as there is no need to remove anything;
            }
            else {
                this.scope.setImage('');
            }
            //console.log(this.scope.image);
            //console.log(this.images);
        }
        public imageUploaded = (image: string) => {
            //console.log('image uploaded: '+ image);
            if (this.scope.multiple) {
                if (this.scope.getImage()) {
                    this.scope.setImage(this.scope.getImage() + image + ';');
                }
                else {
                    this.scope.setImage(image + ';');
                }
            }
            else {
                this.scope.setImage(image + ';');
            }
        }
    }
    export interface IImageEditorScope extends ng.IScope {
        imageChanged: (value: string) => void;
        setImage: (value: string) => void;
        getImage: () => string;
        multiple: boolean;
        uploadpath: string;
        width: number;
        height: number;
    }
    export interface IImageEditorDirectiveScope extends ng.IScope {
        //image: string; 
        multiple: string;
        uploadpath: string;
        width: string;
        height: string;
    }
    export class ImageEditorDirective extends ngstd.AngularDirective<IImageEditorDirectiveScope>{
        constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.E;
            //this.scope.image = ngstd.BindingRestrict.Both;
            this.scope.multiple = ngstd.BindingRestrict.OptionalBoth;
            this.scope.uploadpath = ngstd.BindingRestrict.Both;
            this.scope.width = ngstd.BindingRestrict.OptionalBoth;
            this.scope.height = ngstd.BindingRestrict.OptionalBoth;
            this.require = 'ngModel';
            
            this.controllerAs = 'controller';
            this.template =
                '<div class="fileupload btn btn-default btn-xs menu" label="\'Upload\'" style="background-color: forestgreen; color: white;" accept="\'image/*\'" uploaded="controller.imageUploaded" message="message" path="uploadpath"></div>' +
                '<div ng-repeat="image in controller.images track by $index" style="width: {{width}}px; height:{{height}}px; position: relative;">' +
                    '<img width="{{width}}" height="{{height}}" ng-src="{{image}}" />' +
                    '<div class="btn btn-danger btn-xs" ng-click="controller.removeImage($index)" style="width:30px;height:30px;padding:3px;position:absolute;right:0px;top:1px;">' +
                    '<svg width="24" height="24"><line x1="1.5" y1="1.5" x2="21.5" y2="21.5" stroke-width="3" stroke="black" ></line><line x1="1.5" y1="21.5" x2="21.5" y2="1.5" stroke-width="3" stroke="black"></line></svg>' +
                '</div></div>';
            this.link = (scope: IImageEditorScope, element: ng.IAugmentedJQuery, attributes: ng.IAttributes, ngModel: ng.INgModelController) => {
                if (!scope.width) scope.width = 160;
                if (!scope.height) scope.height = 160;
                if (!scope.multiple) scope.multiple = false;
                scope.setImage = (value: string) => {
                    ngModel.$setViewValue(value);
                }
                scope.getImage = () => {
                    return ngModel.$viewValue;
                }
                scope.$watch(() => ngModel.$modelValue, (nValue: string, oValue: string) => {
                    //console.log('Image Editor model changed: ' + nValue);
                    scope.imageChanged(ngModel.$modelValue);
                });
                //ngModel.$viewChangeListeners.push(() => {
                //    console.log('view changed');
                //    if (scope.imageChanged) scope.imageChanged(ngModel.$viewValue);
                //});
            };
            this.controller = ImageEditorController;
        } 
    }

    //ImageSet Classes
    export class ImageSet extends ngstd.NamedObject {
        interval: number;
        width: string;
        height: string;
        images: string[];
    }

    //Table classes:
    export class Table extends ngstd.NamedObject {
        title: string;
        style: string;
        width: string;
        header: TableHeader;
        rows: TableRow[];
    }
    export class TableHeader extends ngstd.NamedObject {
        style: string;
        cells: TableHeadCell[];
    }
    export class TableHeadCell extends ngstd.NamedObject {
        style: string;
        value: string;
    }
    export class TableRow extends ngstd.NamedObject {
        style: string;
        cells: string[];
    }
    export interface SheetDirectiveScope extends ng.IScope {
        data: string;
    }
    //export interface SheetScope extends ng.IScope {
    //    data: ngstd.Table;
    //}
    //export class SheetDirectiveController {
    //    static $inject = ['$element', '$scope'];
    //    constructor(public $element: JQuery, public $scope: SheetScope) {
    //        $scope.controller = this;
    //    }
    //}
    export class SheetDirective extends ngstd.AngularDirective<SheetDirectiveScope> {
        constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.E;
            this.templateUrl = 'table.html';
            //'<table>' +
            //'<tr ng-repeat="row in ctrl.rows">' +
            //'<td ng-repeat="cell in row.cells">' +
            //'</td>' +
            //'</tr>' +
            //'</table>';
            this.scope.data = ngstd.BindingRestrict.Both;
            //this.controller = SheetDirectiveController;
            //this.controllerAs = 'ctrl';
        }
    }

    export class PictureDirectiveController {
        static $inject = ["$http", "$scope", "$interval"];
        private scope: PictureScope;
        private interval: ng.IIntervalService;
        private invervalCall: ng.IPromise<any>;
        constructor(public $http: ng.IHttpService, public $scope: PictureScope, public $interval: ng.IIntervalService) {
            this.scope = $scope;
            this.interval = $interval;
            //watch for changes of data;
            $scope.$watch(() => $scope.data, (newValue: string[], oldValue: string[]) => {
                this.start();
            });
            $scope.$watch(() => $scope.interval, (newValue: number, oldValue: number) => {
                this.start();
            });
            $scope.$on('$destroy', () => {
                console.log('picture interval destroyed!');
                if (this.invervalCall) {
                    this.interval.cancel(this.invervalCall);
                    this.invervalCall = null;
                }
            });
        }
        private start = () => {
            if (this.invervalCall) {
                this.interval.cancel(this.invervalCall);
                this.invervalCall = null;
            }
            this.index = 0;
            if (this.scope.data) if (this.scope.data.length > this.index) {
                this.scope.link = this.scope.data[this.index];
                this.index += 1;
                if (this.scope.data.length <= this.index) this.index = 0;
            }
            this.invervalCall = this.interval(() => { this.next(); }, this.scope.interval);
        }
        private count: number = 0;
        private index: number = 0;
        private next = () => {
            this.count += 1;
            if (this.scope.data) if (this.scope.data.length > this.index) {
                this.scope.link = this.scope.data[this.index];
                this.index += 1;
                if (this.scope.data.length <= this.index) this.index = 0;
            }
        }
    }
    export interface PictureDirectiveScope extends ng.IScope {
        data: string;
        width: string;
        height: string;
        interval: string;
    }
    export interface PictureScope extends ng.IScope {
        data: string[];
        link: string;
        width: string;
        height: string;
        interval: number;
    }
    export class PictureDirective extends ngstd.AngularDirective<PictureDirectiveScope>{
        constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.E;
            this.template = '<img ng-src="{{link}}" width="{{width}}" height="{{height}}"/>';
            this.scope.data = ngstd.BindingRestrict.Both;
            this.scope.width = ngstd.BindingRestrict.In;
            this.scope.height = ngstd.BindingRestrict.In;
            this.scope.interval = ngstd.BindingRestrict.In;
            this.controller = PictureDirectiveController;
        }
    }


    export class Num2StrModelConversionDirective extends ngstd.AngularDirective<ng.IScope>{
        constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.A;
            this.template = null;
            this.require = 'ngModel';
            this.scope = null;
            this.link = (scope: OpenFileScope, element: ng.IAugmentedJQuery, attributes: ng.IAttributes, ngModel: ng.INgModelController) => {
                //Add parsers to ngModel;
                ngModel.$formatters.push((value: number) => {
                    if (!value) return '0';
                    return value.toString();
                });
                ngModel.$parsers.push((value: string) => {
                    if (!value) return 0;
                    if (isNaN(Number(value))) return 0;
                    return Number(value);
                });
            }
        }
    }
    export class TinyInt2BoolModelConverstionDirective extends ngstd.AngularDirective<ng.IScope>{
        constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.A;
            this.template = null;
            this.require = 'ngModel';
            this.scope = null;
            this.link = (scope: OpenFileScope, element: ng.IAugmentedJQuery, attributes: ng.IAttributes, ngModel: ng.INgModelController) => {
                //Add parsers to ngModel;
                ngModel.$formatters.push((value: number) => {
                    if (!value) return false;
                    if (isNaN(value)) return false;
                    if (value != 0) return true;
                    return false;
                });
                ngModel.$parsers.push((value: boolean) => {
                    if (value) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
            }
        }
    }
    export interface OpenFileScope extends ng.IScope {
        accept: string;
    }
    export interface OpenFileDirectiveScope extends ng.IScope {
        accept: string;
    }
    export class OpenFileDirective extends ngstd.AngularDirective<OpenFileDirectiveScope>{
        constructor($compile: ng.ICompileService) {
            super();
            this.restrict = ngstd.DirectiveRestrict.A;
            this.template = null; //'{{label}}<input type= "file" accept="{{accept}}"/>'; //class = fileinputs
            this.scope.accept = ngstd.BindingRestrict.Both;
            this.require = 'ngModel';
            this.link = (scope: OpenFileScope, element: ng.IAugmentedJQuery, attributes: ng.IAttributes, ngModel: ng.INgModelController) => {
                //instead of using template, we here only use the $compile service to compile code into element and append it into the parent div.
                var input = $compile('<input type= "file" accept="{{accept}}"/>')(scope);
                element.append(input);
                var file: HTMLInputElement = <HTMLInputElement>input[0];
                file.onchange = () => {
                    ngModel.$setViewValue(file.files);
                    file.value = null;
                };
            }
        }
    }
    export interface ITimeScope extends ng.IScope {
        hours: string;
        minutes: string;
        seconds: string;
        hoursChanged: () => void;
        minutesChanged: () => void;
        secondsChanged: () => void;
    }
    /**
     * attribute directive that should be applied on empty div element;
     */
    export class TimeDirective extends ngstd.AngularDirective<ng.IScope> {
        constructor($compile: ng.ICompileService) {
            super();
            this.restrict = ngstd.DirectiveRestrict.A;
            this.template = null;
            this.require = 'ngModel';
            this.link = (scope: ITimeScope, element: ng.IAugmentedJQuery, attributes: ng.IAttributes, ngModel: ng.INgModelController) => {
                //instead of using template, we here only use the $compile service to compile code into element and append it into the parent div.
                var input = $compile('<input ng-model="hours" size="2" ng-change="hoursChanged()" type="text"/>:<input ng-model="minutes" size="2" ng-change="minutesChanged()" type="text"/>:<input ng-model="seconds" size="2" ng-change="secondsChanged()" type="text"/>')(scope);
                element.append(input);
                var changed = (): void => {
                    var h = Number(scope.hours);
                    if (isNaN(h)) h = 0;
                    var m = Number(scope.minutes);
                    if (isNaN(m)) m = 0;
                    var s = Number(scope.seconds);
                    if (isNaN(s)) s = 0;
                    var mmt = moment().year(1).month(0).date(1).hour(h).minute(m).second(s);
                    ngModel.$setViewValue(mmt.toDate());
                };
                scope.hoursChanged = changed;
                scope.minutesChanged = changed;
                scope.secondsChanged = changed;
                var hour: HTMLInputElement = <HTMLInputElement>input[0];
                var minute: HTMLInputElement = <HTMLInputElement>input[2];
                var second: HTMLInputElement = <HTMLInputElement>input[4];
                //console.log('time viewValue: ' + ngModel.$viewValue.toString());
                var init = ngModel.$viewValue ? moment(ngModel.$viewValue) : moment();
                scope.$watch(() => ngModel.$viewValue, (nValue, oValue) => {
                    //console.log('time ngModel $viewValue changed.');
                    //console.log(nValue);
                    var mmt = moment(nValue);
                    scope.hours = mmt.hours().toString();
                    scope.minutes = mmt.minutes().toString();
                    scope.seconds = mmt.seconds().toString();
                });
                var value: number;
                value = init.hours();
                scope.hours = isNaN(value) ? '0' : value.toString();
                value = init.minutes();
                scope.minutes = isNaN(value) ? '0' : value.toString();
                value = init.seconds();
                scope.seconds = isNaN(value) ? '0' : value.toString();
                var focused = (e: FocusEvent) => {
                    var input = <HTMLInputElement>e.target;
                    input.selectionStart = 0;
                    input.selectionEnd = input.value.length;
                };
                hour.onfocus = focused;
                minute.onfocus = focused;
                second.onfocus = focused;
                hour.onwheel = (e: WheelEvent) => {
                    var value: number = Number(scope.hours);
                    if (isNaN(value)) value = 0;
                    value += Math.round(e.deltaY / 100);
                    value = value % 24;
                    if (value < 0) value += 24;
                    scope.hours = value.toString();
                    e.preventDefault();
                    changed();
                    scope.$apply();
                };
                hour.onkeydown = (e: KeyboardEvent) => {
                    switch (e.keyCode) {
                        case 9: case 16:
                        case 48: case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57:
                        case 96: case 97: case 98: case 99: case 100: case 101: case 102: case 103: case 104: case 105:
                            break;
                        case 8://back
                            break;
                        case 46://delete
                            break;
                        case 39: case 37: //right left
                            break;
                        case 38:  //up down
                            var value: number = Number(scope.hours);
                            if (isNaN(value)) value = 0;
                            value += 1;
                            value = value % 24;
                            if (value < 0) value += 24;
                            scope.hours = value.toString();
                            e.preventDefault();
                            changed();
                            scope.$apply();
                            break;
                        case 40:
                            var value: number = Number(scope.hours);
                            if (isNaN(value)) value = 0;
                            value -= 1;
                            value = value % 24;
                            if (value < 0) value += 24;
                            scope.hours = value.toString();
                            e.preventDefault();
                            changed();
                            scope.$apply();
                            break;
                        default:
                            e.preventDefault();
                            break;
                    }
                };
                minute.onwheel = (e: WheelEvent) => {
                    var value: number = Number(scope.minutes);
                    if (isNaN(value)) value = 0;
                    value += Math.round(e.deltaY / 100);
                    value = value % 60;
                    if (value < 0) value += 60;
                    scope.minutes = value.toString();
                    e.preventDefault();
                    changed();
                    scope.$apply();
                };
                minute.onkeydown = (e: KeyboardEvent) => {
                    switch (e.keyCode) {
                        case 9: case 16:
                        case 48: case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57:
                        case 96: case 97: case 98: case 99: case 100: case 101: case 102: case 103: case 104: case 105:
                            break;
                        case 8://back
                            break;
                        case 46://delete
                            break;
                        case 39: case 37: //right left
                            break;
                        case 38:  //up down
                            var value: number = Number(scope.minutes);
                            if (isNaN(value)) value = 0;
                            value += 1;
                            value = value % 60;
                            if (value < 0) value += 60;
                            scope.minutes = value.toString();
                            e.preventDefault();
                            changed();
                            scope.$apply();
                            break;
                        case 40:
                            var value: number = Number(scope.minutes);
                            if (isNaN(value)) value = 0;
                            value -= 1;
                            value = value % 60;
                            if (value < 0) value += 60;
                            scope.minutes = value.toString();
                            e.preventDefault();
                            changed();
                            scope.$apply();
                            break;
                        default:
                            e.preventDefault();
                            break;
                    }
                };
                second.onwheel = (e: WheelEvent) => {
                    var value: number = Number(scope.seconds);
                    if (isNaN(value)) value = 0;
                    value += Math.round(e.deltaY / 100);
                    value = value % 60;
                    if (value < 0) value += 60;
                    scope.seconds = value.toString();
                    e.preventDefault();
                    changed();
                    scope.$apply();
                };
                second.onkeydown = (e: KeyboardEvent) => {
                    switch (e.keyCode) {
                        case 9: case 16:
                        case 48: case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57:
                        case 96: case 97: case 98: case 99: case 100: case 101: case 102: case 103: case 104: case 105:
                            break;
                        case 8://back
                            break;
                        case 46://delete
                            break;
                        case 39: case 37: //right left
                            break;
                        case 38:  //up down
                            var value: number = Number(scope.seconds);
                            if (isNaN(value)) value = 0;
                            value += 1;
                            value = value % 60;
                            if (value < 0) value += 60;
                            scope.seconds = value.toString();
                            e.preventDefault();
                            changed();
                            scope.$apply();
                            break;
                        case 40:
                            var value: number = Number(scope.seconds);
                            if (isNaN(value)) value = 0;
                            value -= 1;
                            value = value % 60;
                            if (value < 0) value += 60;
                            scope.seconds = value.toString();
                            e.preventDefault();
                            changed();
                            scope.$apply();
                            break;
                        default:
                            e.preventDefault();
                            break;
                    }
                };

            }
        }
    }
    export interface IDateTimeScope extends ng.IScope {
        date: Date;
        time: Date;
        dateChanged: () => void;
        timeChanged: () => void;
    }
    export class DateTimeDirective extends ngstd.AngularDirective<ng.IScope>{
        constructor($compile: ng.ICompileService) {
            super();
            this.restrict = ngstd.DirectiveRestrict.A;
            this.template = null;
            this.require = 'ngModel';
            this.link = (scope: IDateTimeScope, element: ng.IAugmentedJQuery, attributes: ng.IAttributes, ngModel: ng.INgModelController) => {
                //instead of using template, we here only use the $compile service to compile code into element and append it into the parent div.
                var input = $compile('<md-datepicker ng-model="date" ng-change="dateChanged()"></md-datepicker><div time ng-model="time" ng-change="timeChanged()"></div>')(scope);
                element.append(input);

                var init = ngModel.$viewValue ? moment(ngModel.$viewValue) : moment();
                scope.date = init.toDate();
                scope.time = init.toDate();

                scope.dateChanged = () => {
                    var mmtDate = moment(scope.date);
                    var mmtTime = moment(scope.time);
                    var mmt = moment().year(mmtDate.year()).month(mmtDate.month()).date(mmtDate.date()).hour(mmtTime.hours()).minute(mmtTime.minutes()).second(mmtTime.seconds());
                    ngModel.$setViewValue(mmt.toDate());
                };
                scope.timeChanged = () => {
                    var mmtDate = moment(scope.date);
                    var mmtTime = moment(scope.time);
                    var mmt = moment().year(mmtDate.year()).month(mmtDate.month()).date(mmtDate.date()).hour(mmtTime.hours()).minute(mmtTime.minutes()).second(mmtTime.seconds());
                    ngModel.$setViewValue(mmt.toDate());
                };
                scope.$watch(() => ngModel.$viewValue, (nValue, oValue) => {
                    var mmt = moment(nValue);
                    scope.date = mmt.toDate();
                    scope.time = mmt.toDate();
                });
            }
        }
    }
    //menu 
    export class TabControl extends NamedObject {
        public items: TabItem[] = [];
        public addTabItem = (item: TabItem) => {
            this.items.push(item);
            item.parent = this;
            return item;
        }
        public selectedContent: any;
        public selectTab(item: TabItem) {
            this.items.forEach((value: TabItem, index: number, array: TabItem[]) => {
                if (value === item) {
                    value.style = "'tab-pane active'";
                    this.selectedContent = item.content;
                }
                else {
                    value.style = "";
                }
            });
        }
    }
    export class TabItem extends NamedObject {
        public name: string;
        public style: string;
        public parent: TabControl;
        public select() {
            if (this.parent) this.parent.selectTab(this);
        };
        public content: any;//this is the content object for the tab menu;
    }
    export class TabContent extends NamedObject {
        public groups: MenuGroup[] = [];
        public addGroup = (item: MenuGroup) => {
            this.groups.push(item);
        }
    }
    export class MenuGroup extends NamedObject {
        public name: string;
        public width: string = 'auto';
        public items: any[] = [];
        public addItem = (item: any) => {
            this.items.push(item);
        }
    }
    export class MenuItem extends NamedObject {
        public name: string;
        public click: () => void;
    }
    export class FileMenuItem extends NamedObject {
        public name: string;
        public accept: string;
        public click: (files: FileList) => void;
    }


    export class ImageSlideController {
        $inject = ['$element', '$scope', '$interval'];
        constructor(public $element: JQuery, public $scope: ImageSlideScope, public $interval: ng.IIntervalService) {
            var host = $element.children('div');
            var divs = host.children('div');
            var div1 = jQuery(divs[0]);
            var div2 = jQuery(divs[1]);

            var countDown: number = 0;
            var index: number = 0;
            var mode: boolean = true;

            var getNextImage: () => string = () => {
                index += 1;
                if (index >= $scope.images.length) index = 0;
                if ($scope.images.length == 0) return '';
                return $scope.images[index];
            }

            if ($scope.images.length > 0) {
                $scope.img1 = $scope.images[0];
                $scope.img2 = getNextImage();
            }
            //var watch = $scope.$watch(() => host.width(), (newValue: number, oldValue: number) => {
            //    //div1.width(newValue+'px');
            //    div2.width(newValue+'px');
            //});
            var int = $interval(() => {
                countDown += 1;
                var interval: number = Number($scope.interval);
                var transition: number = Number($scope.transition);
                if (countDown >= (interval + transition)) {
                    console.log('greater');
                    countDown = 0;
                    mode = !mode;
                    if (mode) {
                        $scope.img2 = getNextImage();
                    }
                    else {
                        $scope.img1 = getNextImage();
                    }
                }
                //if (countDown == 0) {
                //    console.log(div1);
                //    console.log(div2);
                //    if (mode) {
                //        //console.log('true div1 set to 0%');
                //        div1.css('left', '0%');
                //        div2.css('left', '101%');
                //        $scope.img2 = getNextImage();
                //    }
                //    else {
                //        //console.log('false div2 set to 0%');
                //        div2.css('left', '0%');
                //        div1.css('left', '101%');
                //        $scope.img1 = getNextImage();
                //    }
                //}
                if (countDown > interval) {
                    var value = Math.round(-((countDown - interval) / transition) * 100);
                    if (mode) {
                        //console.log('true div1: ' + value);
                        //console.log('true div2: ' + (100+value));
                        //div1.css('left', value.toString() + '%');
                        //div2.css('left', (100 + value).toString() + '%');

                        div1.fadeOut(transition * 25);
                        div2.fadeIn(transition * 25);
                    }
                    else {
                        //console.log('false div1: ' + (100 + value));
                        //console.log('false div2: ' + value);
                        //div2.css('left', value.toString() + '%');
                        //div1.css('left', (100 + value).toString() + '%');
                        div2.fadeOut(transition * 25);
                        div1.fadeIn(transition * 25);
                    }
                }

                //console.log('div1 left:'+ div1.css('left'));
                //console.log('div2 left:'+div2.css('left'));
                //console.log(interval + transition);
                //console.log(countDown);
            }, 50);
            $scope.$on('$destroy', (event) => {
                if (angular.isDefined(int))
                    $interval.cancel(int);
            });
        }
    }
    export interface ImageSlideScope extends ng.IScope {
        images: string[];
        interval: string;
        transition: string;
        img1: string;
        img2: string;
    }
    export interface ImageSlideDirectiveScope extends ng.IScope {
        images: string;
        interval: string;
        transition: string;
    }
    export class ImageSlideDirective extends ngstd.AngularDirective<ImageSlideDirectiveScope>{
        constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.E;
            this.templateUrl = 'ImageSlide.html';
            this.scope.images = ngstd.BindingRestrict.OptionalBoth;
            this.scope.interval = ngstd.BindingRestrict.In;
            this.scope.transition = ngstd.BindingRestrict.In;
            this.controller = ImageSlideController;
        }
    }

    export class CaptchaController {
        static $inject = ngInject[ns.http, ns.scope, ns.element];
        public scope: CaptchaScope;
        public link: string;
        public constructor($http: ng.IHttpService, $scope: CaptchaScope, $element: ng.IAugmentedJQuery) {
            this.scope = $scope;
            $scope.refresh = this.refresh;
            var img = $element.children('img');
            img.on('load', this.codeLoaded);
            this.refresh();
        }
        
        public refresh = (): void => {
            this.link = 'captcha.php?rand=' + Math.random() * 1000;
        }
        public codeLoaded = (e: Event) => {
            if (this.scope.changed) this.scope.changed();
        }
    }
    export interface CaptchaScope extends ng.IScope {
        refresh: () => void;
        changed: () => void;
    }
    export interface CaptchaDirectiveScope extends ng.IScope {
        refresh: string;
        changed: string;
    }
    export class CaptchaDirective extends ngstd.AngularDirective<CaptchaDirectiveScope> {
        constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.E;
            this.template = '<img ng-src="{{cap.link}}">';
            this.scope.refresh = ngstd.BindingRestrict.Both;
            this.scope.changed = ngstd.BindingRestrict.OptionalBoth;
            this.controller = CaptchaController;
            this.controllerAs = 'cap';
        }
    }
    export class FileUploadInfo {
        public filename: string;
    }
    export class FileUploadController {
        $inject = ['$http', '$scope', '$element'];
        public http: ng.IHttpService;
        public scope: FileUploadScope;
        public element: JQuery;
        public file: HTMLInputElement;
        public constructor($http: ng.IHttpService, $scope: FileUploadScope, $element: JQuery) {
            this.http = $http;
            this.scope = $scope;
            this.element = $element;
            this.file = <HTMLInputElement>($element.children("input")[0]);
            this.file.onchange = this.uploadFile;
        }
        public uploadFile = () => {
            if (this.file.files.length == 0) return;
            var inputFile = this.file.files[0];
            if (this.scope.sizeLimit) {
                if (inputFile.size > this.scope.sizeLimit) {
                    var _limit: string = '';
                    if (this.scope.sizeLimit > 1024 * 1024) {
                        _limit = Math.round(this.scope.sizeLimit / 1024 / 1024) + "MB";
                    } else {
                        if (this.scope.sizeLimit > 1024) {
                            _limit = Math.round(this.scope.sizeLimit / 1024) + "KB";
                        } else {
                            _limit = Math.round(this.scope.sizeLimit) + "B";
                        }
                    }
                    this.scope.message = "File must be smaller than " + _limit + ".";
                    return;
                }
            }
            var data = new FormData();
            data.append('file', inputFile);
            data.append('path', this.scope.path);
            this.scope.disabled = true;
            this.scope.message = 'Uploading...';
            //console.log(data);
            this.http.post('fileupload.php', data, {
                withCredentials: true,
                headers: { 'Content-Type': undefined },
                transformRequest: angular.identity
            })
                .success(this.uploadSuccess)
                .error(this.uploadError);
            //console.log('input type:file value = ' + this.file.value);
            this.file.value = null;

        }
        public uploadSuccess = (data: any) => {
            //console.log(data);
            this.scope.disabled = false;
            this.scope.message = 'Uploaded';
            this.scope.filename = data.filename;
            if (this.scope.uploaded) {
                this.scope.uploaded(data.filename, this.scope.context);
            }
        }
        public uploadError = (data: any) => {
            console.log(data);
        }
    }
    export interface FileUploadScope extends ng.IScope {
        filename: string;
        sizeLimit: number;
        href: string;
        message: string;
        disabled: boolean;
        path: string;
        uploaded: (name: string, contenxt?:any) => void;
        label: string;
        accept: string;
        context: any;
    }
    export interface FileUploadDirectiveScope extends ng.IScope {
        filename: string;
        sizeLimit: string;
        href: string;
        message: string;
        disabled: string;
        path: string;
        uploaded: string;
        label: string;
        accept: string;
        context: string;
    }
    export class FileUploadDirective extends ngstd.AngularDirective<FileUploadDirectiveScope> {
        constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.C;
            this.template = '{{label}}<input type= "file" accept="{{accept}}"/>'; //class="fileinputs"
            this.scope.filename = ngstd.BindingRestrict.OptionalBoth;
            this.scope.sizeLimit = ngstd.BindingRestrict.OptionalBoth;
            this.scope.href = ngstd.BindingRestrict.OptionalBoth;
            this.scope.message = ngstd.BindingRestrict.OptionalBoth;
            this.scope.disabled = ngstd.BindingRestrict.OptionalBoth;
            this.scope.path = ngstd.BindingRestrict.OptionalBoth;
            this.scope.uploaded = ngstd.BindingRestrict.OptionalBoth;
            this.scope.label = ngstd.BindingRestrict.OptionalBoth;
            this.scope.accept = ngstd.BindingRestrict.OptionalBoth;
            this.scope.context = ngstd.BindingRestrict.OptionalBoth;
            this.require = 'ngModel';
            this.controller = FileUploadController;
        }
        //public link = (scope: FileUploadScope, element: ng.IAugmentedJQuery) => {
        //    var host = element.children("div");
        //    var div = <HTMLDivElement>(element.children("div").children("div")[0]);
        //    var input: JQuery = element.children("div").children("input");
        //    var file = <HTMLInputElement>(input[0]);
        //    //file.clientWidth = div.clientWidth + 100;
        //    console.log('link div width: ' + div.clientWidth);
        //    input.width(div.clientWidth + 100);
        //    scope.$watch(() => div.clientWidth, (newValue: number, oldValue: number) => { //a good method to watch for/detect element size change;
        //        console.log('fileupload client width changed;')
        //        //file.clientHeight = div.clientWidth + 100;
        //        host.width(div.clientWidth);
        //        input.width(div.clientWidth + 100);
        //    });

        //    console.log('file upload link is working!');
        //}
    }
}



/**
 * PHPPostObj is used to post command to the php service; It is used by the rpc.html and php.html;
 */
class PHPPostObj {
    public method: string;
    public value: FileBuiler[] = [];
}
/**
 * FileBuilder is the interface to make php service to create/write specific file on the server side; It is used by rpc.html and php.html;
 */
class FileBuiler {
    public filename: string;
    public content: string;
}
/**
 * CompilerInclude defines patterns required by RPC and PHP compiler;
 */
class CompilerPattern {
    static ptnRPCInclude = /\/\/rpc(\s+include\s+(('[\w\d]+'\s*)*)|)\s*/ig;
    static ptnIncludeFile = /'([\w\-]+)'/ig;
    static ptnPHPInclude = /\/\/php(\s+include\s+(('[\w\d]+'\s*)*)|)\s*/ig;
    static ptnService = /(^|\n)\s*(export\s+|)(interface|class)\s+(\w+)\s*\{/g;
}
/**
 * The standard pattern libraries for analyzing typescript entities;
 */
class StdPatterns {
    static ptnModule = /(^|\n)\s*module\s+(\w+)\s*\{/g;
    static ptnClass = /(^|\n)\s*(export\s+|)class\s+(\w+)\s*\{/g;
    static ptnInterface = /(^|\n)\s*(export\s+|)interface\s+(\w+)\s*\{/g;
    static ptnInterfaceMethod = /([\w][\w\d\.]*)\s*\(((\s*([\w][\w\d\.]*)\s*\:\s*([\w][\w\d\.]*)(|\s*\[\s*\])\s*(|\,))*)\)\s*\:\s*(([\w][\w\d\.]*)(\s*\[\s*\]|))/g;
    static ptnParameter = /\s*([\w][\w\d\.]*)\s*\:\s*(([\w][\w\d\.]*)\s*(\[\s*\]|))/g;
}

/**
 * class for registering RPC calls for remote service; you must pass the $http service to this class so as to make RPC calls work;
 */
class RPC {
    static http: ng.IHttpService;
    static post(url: string, data: any, returntype: string, _SuccessCallback: ng.IHttpPromiseCallback<any>,
        _ErrorCallback?: ng.IHttpPromiseCallback<any>) {
        switch (returntype) {
            case 'boolean':
                RPC.http.post(url, data)
                    .success((data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig) => {
                        var value: boolean = false;
                        if (typeof data == 'string') {

                            //try string
                            switch (data) {
                                case 'true':
                                    value = true;
                                    break;
                                case 'false':
                                    break;
                                default:
                                    //try number
                                    var num = Number(data);
                                    if (typeof num == 'number' && !isNaN(num)) {
                                        if (num) value = true;
                                    }
                                    else {
                                        console.log(data);
                                        console.log('Potential RPC ' + returntype + ' Callback Error: ' + data);
                                        console.log('status: ' + status.toString());
                                        console.log('headers: ');
                                        console.log(headers());
                                    }
                                    break;
                            }
                        }
                        else if (typeof data == "object"){
                            if (data) value = true;
                        }
                        _SuccessCallback(value, status, headers, config);
                    })
                    .error(_ErrorCallback);
                break;
            case 'number':
                RPC.http.post(url, data)
                    .success((data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig) => {
                        if (isNaN(Number(data))) {
                            console.log('Potential RPC ' + returntype + ' Callback Error: ' + data);
                            console.log('status: ' + status.toString());
                            console.log('headers: ');
                            console.log(headers());
                        }
                        _SuccessCallback(Number(data), status, headers, config);
                    })
                    .error(_ErrorCallback);
                break;
            case 'string':
                RPC.http.post(url, data)
                    .success(_SuccessCallback)
                    .error(_ErrorCallback);
                break;
            default:
                RPC.http.post(url, data)
                    .success((data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig) => {
                        if (typeof data == 'string') {
                            console.log('Potential RPC ' + returntype + ' Callback Error: ' + data);
                            console.log('status: ' + status.toString());
                            console.log('headers: ');
                            console.log(headers());
                        }
                        if (Array.isArray(data)) {
                            _SuccessCallback(jsonArray2Array(data), status, headers, config);
                        }
                        else {
                            _SuccessCallback(json2object(data), status, headers, config);
                        }
                    })
                    .error(_ErrorCallback);
                break;
        }
    }
}

class CancelBeforeTimeout<T> {
    //public lastTriggerTime: number = Date.now();
    public timeout: ng.ITimeoutService;
    public interval: number;
    public call: (...args: any[]) => T;
    public promise: ng.IPromise<T>;
    constructor($timeout: ng.ITimeoutService, $interval: number, $call: (...args: any[]) => T) {
        this.timeout = $timeout;
        this.interval = $interval;
        this.call = $call;
    }
    public trigger = (...args: any[]) => {
        this.timeout.cancel(this.promise);
        this.promise = this.timeout<T>(this.call, this.interval, false, args);
        //this.lastTriggerTime = Date.now();
    }
}

class DecimalNumber {
    static formatter(value: string): string {
        var hasNegative = value.indexOf('-') > -1;
        var firstDot: number = value.indexOf('.');
        if (firstDot > -1) {
            var int = value.substr(0, firstDot).replace(/\D/g, '');
            var dcm = value.substr(firstDot + 1).replace(/\D/g, '');
            dcm = dcm.replace(/0+$/, '');
            value = int + '.' + dcm;
        }
        else {
            value = value.replace(/\D/g, '');
        }
        value = value.replace(/^0+/, '');
        firstDot = value.indexOf('.');
        if (firstDot == 0) value = '0' + value;
        return hasNegative ? '-' + value : value;
    }
    constructor(value?: DecimalNumber | string | number | boolean) {
        var stringValue: string;
        if (value) {
            switch (typeof value) {
                case 'string':
                    //console.log('string');
                    stringValue = value.toString();
                    break;
                case 'number':
                    //console.log('number' + value.toString());
                    stringValue = value.toString();
                    break;
                case 'boolean':
                    stringValue = value ? '1' : '-1';
                    break;
                case 'object':
                    var dec: DecimalNumber = <any>value;
                    var minKey: number = 0;
                    var maxKey: number = 0;
                    if (dec.digits) if (Array.isArray(dec.digits)) {
                        this.digits = [];
                        for (var key in dec.digits) {
                            if (!isNaN(Number(key))) {
                                var _key: number = Math.round(Number(key));
                                if (_key < minKey) minKey = _key;
                                if (_key > maxKey) maxKey = _key;
                                this.digits[_key] = 0;
                                if (dec.digits[key]) if (!isNaN(Number(dec.digits[key]))) {
                                    this.digits[_key] = Number(dec.digits[key]);
                                }
                            }
                        }
                        this.minIndex = minKey;
                        this.maxIndex = maxKey;
                        this.positive = true;
                        this.cleanDigits();
                        return;//can stop here as we have parsed the object;
                    }
                    else {
                        stringValue = '0';
                    }
                    break;
                default:
                    stringValue = '0';
                    break;
            }
        }
        else {
            stringValue = '0';
        }
        if (stringValue) {
            //console.log(stringValue);
            var stringValue = DecimalNumber.formatter(stringValue);
            if (stringValue.indexOf('-') == 0) {
                this.positive = false;
                stringValue = stringValue.substr(1);
                //console.log(stringValue);
            }
            else {
                this.positive = true;
            }
            var dotIndex = stringValue.indexOf('.');
            this.digits = [];
            if (dotIndex == -1) {
                this.maxIndex = stringValue.length - 1;
                this.minIndex = 0;
                for (var i: number = 0; i < stringValue.length; i++) {
                    this.digits[stringValue.length - i - 1] = Number(stringValue.charAt(i));
                }
            }
            else {
                this.maxIndex = dotIndex - 1;
                this.minIndex = dotIndex - stringValue.length + 1;
                for (var i: number = 0; i < dotIndex; i++) {
                    this.digits[dotIndex - i - 1] = Number(stringValue.charAt(i));
                }
                for (var i: number = dotIndex + 1; i < stringValue.length; i++) {
                    this.digits[dotIndex - i] = Number(stringValue.charAt(i));
                }
            }

        }
        else {
            this.digits = [];
            this.minIndex = 0;
            this.maxIndex = 0;
            this.positive = true;
        }
    }
    public add = (value: DecimalNumber): DecimalNumber => {
        var min = Math.min(value.minIndex, this.minIndex);
        var max = Math.max(value.maxIndex, this.maxIndex);
        var res = new DecimalNumber();
        res.minIndex = min;
        res.maxIndex = max;
        for (var i: number = min; i <= max; i++) {
            res.digits[i] = (value.positive ? 1 : -1) * (value.digits[i] ? value.digits[i] : 0) +
                (this.positive ? 1 : -1) * (this.digits[i] ? this.digits[i] : 0);
        }
        res.cleanDigits();
        return res;
    }
    public subtract = (value: DecimalNumber): DecimalNumber => {
        var min = Math.min(value.minIndex, this.minIndex);
        var max = Math.max(value.maxIndex, this.maxIndex);
        var res = new DecimalNumber();
        res.minIndex = min;
        res.maxIndex = max;
        for (var i: number = min; i <= max; i++) {
            res.digits[i] = (value.positive ? -1 : 1) * (value.digits[i] ? value.digits[i] : 0) +
                (this.positive ? 1 : -1) * (this.digits[i] ? this.digits[i] : 0);
        }
        res.cleanDigits();
        return res;
    }
    public multiply = (value: DecimalNumber | string | number | boolean) => {
        var decimalValue: DecimalNumber = new DecimalNumber(value);
        var res = new DecimalNumber();
        res.minIndex = this.minIndex + decimalValue.minIndex;
        res.maxIndex = this.maxIndex + decimalValue.maxIndex;

        for (var i: number = this.minIndex; i <= this.maxIndex; i++) {
            for (var j: number = decimalValue.minIndex; j <= decimalValue.maxIndex; j++) {
                if (!res.digits[i + j]) res.digits[i + j] = 0;
                res.digits[i + j] += (decimalValue.positive ? 1 : -1) * (decimalValue.digits[j] ? decimalValue.digits[j] : 0) *
                    (this.positive ? 1 : -1) * (this.digits[i] ? this.digits[i] : 0);
            }
        }

        res.cleanDigits();
        return res;
    }
    public times = (value: number): DecimalNumber => {
        if (!value) value = 0;
        var min = this.minIndex;
        var max = this.maxIndex;
        var res = new DecimalNumber();
        res.minIndex = min;
        res.maxIndex = max;
        for (var i: number = min; i <= max; i++) {
            res.digits[i] = (this.positive ? value : -value) * (this.digits[i] ? this.digits[i] : 0);
        }
        res.cleanDigits();
        return res;
    }
    public divide = (value: DecimalNumber | string | number | boolean, accuracy?: number) => {
        //default accuracy is 6 digits;
        var decimalValue: DecimalNumber = new DecimalNumber(1 / (new DecimalNumber(value)).toNumber());
        decimalValue.dropDigitsAfter(accuracy);
        return this.multiply(decimalValue);
    }
    public divideby = (value: DecimalNumber | string | number | boolean, accuracy?: number): DecimalNumber => {
        //default accuracy is 6 digits;
        var divider: DecimalNumber = new DecimalNumber(value);
        var res = new DecimalNumber();
        //res.positive = this.positive ? divider.positive : !divider.positive;
        accuracy = Math.abs(DecimalNumber.validateNumber(accuracy, 6));
        var dec = this.clone();
        if (!divider.positive) {
            dec.positive = !dec.positive;
            divider.positive = true;
            //res.positive = dec.positive;
        }
        var dec2sci = (dValue: DecimalNumber): number => {
            var foundFirst: boolean = false;
            var values: string[] = [];
            //if (!dValue.positive) values.push('-');
            for (var i: number = dValue.maxIndex; i >= dValue.minIndex; i--) {
                if (foundFirst) {
                    values.push(dValue.digits[i] ? dValue.digits[i].toString() : '0');
                }
                else {
                    if (dValue.digits[i]) if (dValue.digits[i] != 0) {
                        values.push(dValue.digits[i].toString(), '.');
                        foundFirst = true;
                    }
                }
            }
            return Number(values.join(''));
        };
        var subtracttimes = (host: DecimalNumber, base: DecimalNumber, multiplier: DecimalNumber): DecimalNumber => {
            var remover = base.multiply(multiplier);
            //console.log('      host: ' + host.toString());
            //console.log('      base: ' + base.toString());
            //console.log('multiplier: ' + multiplier.toString());
            //console.log('   remover: ' + remover.toString());
            return host.subtract(remover);
        }

        var whilecount = 0;
        while (res.minIndex > -accuracy) {
            var sDec = dec2sci(dec);
            var sDiv = dec2sci(divider);
            var times = new DecimalNumber(sDec / sDiv);
            //console.log('times: ' + times.toString());
            //console.log('real max diff: ' + (dec.realMaxIndex - divider.realMaxIndex).toString());

            //console.log('dec before: ' + dec.toString());


            var multipler = times.digitOffset(dec.realMaxIndex - divider.realMaxIndex);
            multipler.keepDigitsOf(6);
            multipler.positive = dec.positive;

            //console.log('multipler: ' + multipler.toString());
            dec = subtracttimes(dec, divider, multipler);

            //console.log('dec after: ' + dec.toString());
            res = res.subtract(multipler);
            //console.log('current res: ' + res.toString());
            whilecount += 1;
            //console.log('res.minIndex: ' + res.minIndex.toString());
            //console.log('----------------------------');
            if (dec.isZero) break;
            if (whilecount > DecimalNumber.dividingLimit) break;

        }
        return res;
    }
    static dividingLimit: number = 100;
    get isZero(): boolean {
        for (var i: number = this.maxIndex; i >= this.minIndex; i--) {
            if (this.digits[i]) if (this.digits[i] != 0) {
                return false;
            }
        }
        return true;
    }
    get realMaxIndex(): number {
        for (var i: number = this.maxIndex; i >= this.minIndex; i--) {
            if (this.digits[i]) if (this.digits[i] != 0) {
                return i;
            }
        }
        console.log('getting minIndex: ' + this.minIndex.toString() + ' while maxIndex: ' + this.maxIndex.toString());
        return this.minIndex;
    }
    public digitOffset = (value: number): DecimalNumber => {
        value = DecimalNumber.validateNumber(value, 0);
        var dec = new DecimalNumber();
        for (var i: number = this.minIndex; i <= this.maxIndex; i++) {
            dec.digits[i + value] = this.digits[i];
        }
        dec.maxIndex = this.maxIndex + value;
        dec.minIndex = this.minIndex + value;
        dec.positive = this.positive;
        return dec;
    }
    public clone = (): DecimalNumber => {
        var dec = new DecimalNumber();
        dec.minIndex = this.minIndex;
        dec.maxIndex = this.maxIndex;
        dec.positive = this.positive;
        for (var i: number = this.minIndex; i <= this.maxIndex; i++) {
            dec.digits[i] = this.digits[i];
        }
        return dec;
    }
    static validateNumber(value?: number, defalutValue?: number): number {
        if (!defalutValue) defalutValue = 0;
        if (value) {
            switch (typeof value) {
                case 'number':
                    value = Math.round(value);
                    break;
                case 'string':
                    var sNumber = Number(value);
                    if (isNaN) {
                        value = sNumber;
                    }
                    else {
                        value = defalutValue;
                    }
                    break;
                default:
                    value = defalutValue;
                    break;
            }
        }
        else {
            value = defalutValue;
        }
        return value;
    }
    public dropDigitsAfter = (accuracy?: number) => {
        accuracy = Math.abs(DecimalNumber.validateNumber(accuracy, 6));
        for (var i: number = - accuracy - 1; i >= this.minIndex; i--) {
            this.digits[i] = undefined;
        }
        this.minIndex = -accuracy;
    }
    public keepDigitsOf = (accuracy?: number) => {
        accuracy = Math.abs(DecimalNumber.validateNumber(accuracy, 6));
        for (var i: number = this.maxIndex - accuracy - 1; i >= this.minIndex; i--) {
            this.digits[i] = undefined;
        }
        this.minIndex = this.maxIndex - accuracy;
    }
    public cleanDigits = () => {
        var index = this.minIndex;
        var forNext: number = 0;
        var whilecount = 0;
        while (index <= this.maxIndex || forNext != 0) {
            if (!this.digits[index]) this.digits[index] = 0;
            //console.log(index.toString() + ' before: ' + this.digits[index].toString());
            this.digits[index] += forNext;
            forNext = 0;
            if (this.digits[index] > 9) {
                forNext = (this.digits[index] - (this.digits[index] % 10)) / 10;
                this.digits[index] = this.digits[index] % 10;
            }
            if (this.digits[index] < -9) {
                forNext = (this.digits[index] + ((-this.digits[index]) % 10)) / 10;
                this.digits[index] = this.digits[index] % 10;
            }
            //console.log(index.toString() + ' after: ' + this.digits[index].toString());
            //console.log(index.toString() + ' forNext: ' + forNext.toString());
            index += 1;
            whilecount += 1;
            //if(whilecount>30) break;
        }
        //console.log(this.toListString());
        if (this.maxIndex < index) this.maxIndex = index;
        whilecount = 0;
        //work out positive or negative;
        for (var i = this.maxIndex; i >= this.minIndex; i--) {
            if (!this.digits[i]) this.digits[i] = 0;
            if (this.digits[i] != 0) {
                if (this.digits[i] > 0) {
                    this.positive = true;
                }
                else {
                    this.positive = false;
                }
                break;
            }
        }
        //turn to positive
        if (!this.positive) {
            for (var i = this.maxIndex; i >= this.minIndex; i--) {
                this.digits[i] = -this.digits[i];
            }
        }
        //clean negatives
        forNext = 0;
        for (var i = this.minIndex; i <= this.maxIndex; i++) {
            this.digits[i] += forNext;
            forNext = 0;
            if (this.digits[i] < 0) {
                this.digits[i] += 10;
                forNext = -1;
            }
        }
        //clear zeros;
        while ((!this.digits[this.maxIndex] || this.digits[this.maxIndex] == 0) && this.maxIndex > 0) {
            this.digits[this.maxIndex] = undefined;
            this.maxIndex -= 1;
        }
        while ((!this.digits[this.minIndex] || this.digits[this.minIndex] == 0) && this.minIndex < 0) {
            this.digits[this.minIndex] = undefined;
            this.minIndex += 1;
        }
    }
    public toString = (): string => {
        var builder: string[] = [];
        for (var i = Math.max(0, this.maxIndex); i >= this.minIndex; i--) {
            builder.push(this.digits[i] ? this.digits[i].toString() : '0');
            if (i == 0) builder.push('.');
        }
        return (this.positive ? '' : '-') + builder.join('');
    }
    public toNumber = (): number => {
        return Number(this.toString());
    }
    public toDecimal = (accuracy: number): string => {
        accuracy = Math.abs(Math.round(accuracy));
        var builder: string[] = [];
        for (var i = Math.max(0, this.maxIndex); i >= (-accuracy); i--) {
            builder.push(this.digits[i] ? this.digits[i].toString() : '0');
            if (i == 0) builder.push('.');
        }
        return (this.positive ? '' : '-') + builder.join('');
    }
    public toListString = (): string => {
        var builder: string[] = [];
        for (var i = this.maxIndex; i >= this.minIndex; i--) {
            builder.push(this.digits[i] ? this.digits[i].toString() : '0');
            if (i == 0) builder.push('.');
        }
        return (this.positive ? '' : '-') + builder.join(' ');
    }
    digits: number[];
    minIndex: number;
    maxIndex: number;
    positive: boolean;
}

class FieldViews {
    static Input_Number_Readonly = 'input/number:readonly';
    static Input_Number = 'input/number';
    static Input_Text = 'input/text';
    static Input_Text_Decimal = 'input/text:decimal';
    static Input_Checkbox = 'input/checkbox';
    static TextArea = 'textarea';
    static ImageMultiple = 'image/multiple';
    static ImageSingle = 'image/single';
    static Date = 'date';
    static Time = 'time';
    static DateTime = 'datetime';
    static BuildView(view: string, model: string, placeholder: string, attributes: string): string {
        var builder: string[] = [];
        switch (view) {
            case FieldViews.Input_Number_Readonly:
                builder.push('<input type="number" class="form-control" ng-readonly="true" ng-model="', model, '" placeholder="', placeholder, '" ', attributes,'/>');
                break;
            case FieldViews.Input_Number:
                builder.push('<input type="number" class="form-control" ng-model="', model, '" placeholder="', placeholder, '" ', attributes,'/>');
                break;
            case FieldViews.Input_Text:
                builder.push('<input type="text" class="form-control" ng-model="', model, '" placeholder="', placeholder, '" ', attributes,'/>');
                break;
            case FieldViews.Input_Text_Decimal:
                builder.push('<input type="text" decimal class="form-control" ng-model="', model, '" placeholder="', placeholder, '" ', attributes,'/>');
                break;
            case FieldViews.Input_Checkbox:
                builder.push('<label><input type="checkbox" class="form-control" ng-model="', model, '" ', attributes,' bool2str/>', placeholder, '</label>');
                break;
            case FieldViews.TextArea:
                builder.push('<textarea class="form-control" ng-model="', model, '" placeholder="', placeholder, '" ', attributes,'></textarea>');
                break;
            case FieldViews.ImageMultiple:
                builder.push('<image-editor multiple="true" ng-model="', model, '" ',attributes ,'></image-editor>');
                break;
            case FieldViews.ImageSingle:
                builder.push('<image-editor ng-model="', model, '" ', attributes, '></image-editor>');
                break;
            case FieldViews.Date:
                builder.push('<md-datepicker ng-model="', model, '" string2date md-placeholder="', placeholder, '" ', attributes,'></md-datepicker>');
                break;
            case FieldViews.Time:
                builder.push('<div time ng-model="', model, '" ', attributes, '></div>');
                break;
            case FieldViews.DateTime:
                //builder.push('{{', model, '}}');
                builder.push('<div datetime ng-model="', model, '" string2date ', attributes, '></div>');
                break;
        }
        return builder.join('');
    }
}

class StdDataHandler {
    constructor(_items: () => any[], _tableDef:()=> ITableDef, _itemBuilder?: ()=>any) {
        this.items = _items;
        this.tableDef = _tableDef;
        this.itemBuilder = _itemBuilder;
    }
    public items: () => any[];
    public setItems: (value: any[]) => void;
    public tableDef:()=> ITableDef;
    public itemBuilder: () => any; //return a new item
    public insert() {
        var item;
        if (this.itemBuilder) {
            item = this.itemBuilder();
            console.log('itembuilder called');
        }
        if (!item) {
            item = this.tableDef()._New();
            console.log('def new() called');
        }
        TableItem.setNew(item);
        this.items().push(item);
    }
    public change(item: any) {
        TableItem.setChanged(item);
    }
    public delete(item: any) {
        TableItem.setToBeDeleted(item);
        var items = this.items();
        if (TableItem.isNew(item)) {
            var index = items.indexOf(item);
            if (index>-1)items.splice(index, 1);
        }
    }
    public canDelete(item): boolean {
        return !TableItem.isToBeDeleted(item);
    }
    public canRecover(item): boolean {
        return TableItem.isToBeDeleted(item);
    }
    public recover(item: any) {
        TableItem.setBackChanged(item);
    }
    public getModifedItems = () => {
        var arr: any[] = [];
        var items = this.items();
        if (items) {
            for (var i: number = 0; i < items.length; i++) {
                if (TableItem.requiresUpdate(items[i])) {
                    arr.push(items[i]);
                }
            }
        }
        return arr;
    }
    public findItemByHashKey = (key: string) => {
        var items = this.items();
        if (items) {
            for (var i: number = 0; i < items.length; i++) {
                if (TableItem.hashKey(items[i]) == key) return items[i];
            }
        }
        else return null;
    }
    public updateItemsCallback = (_items: any[]) => {
        var items = this.items();
        var arr = jsonArray2Array(_items);
        var def = this.tableDef();
        for (var i: number = 0; i < arr.length; i++) {
            var item = arr[i];
            var local = this.findItemByHashKey(TableItem.getRemoteHashKey(item));
            if (local) {
                TableItem.setRemoteReady(local);
                if (TableItem.isInserted(item)) {
                    def._setKey(local, def._getKey(item));
                    TableItem.setInserted(local);
                    TableItem.clearError(local);
                }
                if (TableItem.isDeleted(item)) {
                    items.splice(items.indexOf(local), 1);
                    TableItem.setDeleted(local);
                    TableItem.clearError(local);
                }
                if (TableItem.isUpdated(item)) {
                    TableItem.setUpdated(local);
                    TableItem.clearError(local);
                }
                if (TableItem.isError(item)) {
                    TableItem.setError(local, TableItem.getError(item));
                }
            }
            else {
                console.log('can not find local copy for item:');
                console.log(item);
            }
        }
    }
    static singleItemCallback(def: ITableDef, _callbackItem: any, _localItem: any){
        if (_localItem) {
            TableItem.setRemoteReady(_localItem);
            if (TableItem.isInserted(_callbackItem)) {
                def._setKey(_localItem, def._getKey(_callbackItem));
                TableItem.clearError(_localItem);
            }
            if (TableItem.isDeleted(_callbackItem)) {
                TableItem.setDeleted(_localItem);
                TableItem.clearError(_localItem);
            }
            if (TableItem.isUpdated(_callbackItem)) {
                TableItem.setUpdated(_localItem);
                TableItem.clearError(_localItem);
            }
            if (TableItem.isError(_callbackItem)) {
                TableItem.setError(_localItem, TableItem.getError(_callbackItem));
            }
        }
        else {
            console.log('can not find local copy for item:');
            console.log(_callbackItem);
        }
    }
    static useAsLocal(obj: any): any {
        if (Array.isArray(obj)) {
            var arr: any[] = obj;
            for (var i: number = 0; i < arr.length; i++) {
                StdDataHandler.useAsLocal(arr[i]);
            }
        }
        else {
            if (obj['@@Table'] && obj['@@Schema']) {
                obj['@@Remote'] = 'ready';
            }
        }
        return obj;
    }
}