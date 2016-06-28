var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
function ngInject() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var services = [];
    for (var i = 0; i < args.length; i++) {
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
var ns;
(function (ns) {
    ns[ns["http"] = 0] = "http";
    ns[ns["scope"] = 1] = "scope";
    ns[ns["rootScope"] = 2] = "rootScope";
    ns[ns["element"] = 3] = "element";
})(ns || (ns = {}));
/**
 * This class allows you to genenerate url encoded form data;
 * the key-value pairs will be presented as 'key=value&key=value&....' in the data property.
 */
var FormUrlEncoded = (function () {
    function FormUrlEncoded() {
        var _this = this;
        this.values = [];
        /**
         * append key-value pairs to the form;
         */
        this.append = function (key, value) {
            _this.values.push(key + '=' + value);
        };
    }
    Object.defineProperty(FormUrlEncoded, "config", {
        /**
         * A config that set 'Content-type' to 'application/x-www-form-urlencoded';
         */
        get: function () {
            return {
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded'
                }
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FormUrlEncoded.prototype, "data", {
        /**
         * Get the string value with data in as 'key=value&key=value&....' format;
         */
        get: function () {
            return this.values.join('&');
        },
        enumerable: true,
        configurable: true
    });
    return FormUrlEncoded;
}());
var DeferredScript = (function () {
    function DeferredScript() {
        var _this = this;
        this.onSuccess = function (data) {
            _this.value = data;
            //console.log('script loaded:');
            //console.log(this.value);
            if (_this.callback)
                _this.callback();
        };
        this.load = function () {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.text = _this.value;
            //script.src = this.src;
            document.body.appendChild(script);
            //console.log('script loaded: ' + this.src);
        };
        /**
        * Guard Function: if ({DeferredScript}.isNotReady(() => this.{Current Function}(map))) return;
        * This function allows you to call back to the function that runs the call so that you can keep waiting until all scripts are loaded.
        */
        this.isNotReady = function (callback) {
            //console.log('isNotReady Called: ' + this.src);
            _this.callback = callback;
            if (_this.value) {
                //console.log('start script loading: ' + this.src);
                _this.load();
                //this.callback();
                return false;
            }
            else {
                return true;
            }
        };
    }
    return DeferredScript;
}());
var DeferredScriptLoaderService = (function () {
    function DeferredScriptLoaderService($http) {
        //console.log('DeferredScriptLoaderFactory: ');
        for (var i = 0; i < DeferredScriptLoaderService.scripts.length; i++) {
            var script = DeferredScriptLoaderService.scripts[i];
            $http.get(script.src).success(script.onSuccess);
        }
    }
    DeferredScriptLoaderService.add = function (src) {
        var script = new DeferredScript();
        script.src = src;
        DeferredScriptLoaderService.scripts.push(script);
        return script;
    };
    DeferredScriptLoaderService.$inject = ['$http'];
    DeferredScriptLoaderService.scripts = [];
    return DeferredScriptLoaderService;
}());
var ngstd;
(function (ngstd) {
    var debugging = false;
    /**
     * the base class for types that can be used for model, where name of the type is important for selecting the template.
     */
    var NamedObject = (function () {
        function NamedObject() {
        }
        Object.defineProperty(NamedObject.prototype, "TypeName", {
            get: function () {
                var funcNameRegex = /function (.{1,})\(/;
                var results = (funcNameRegex).exec((this).constructor.toString());
                return (results && results.length > 1) ? results[1] : "";
            },
            enumerable: true,
            configurable: true
        });
        ;
        NamedObject.prototype.clone = function (value) {
            for (var attr in value) {
                //console.log(this.TypeName + ".hasOwnProperty" + attr + " :" + this.hasOwnProperty(attr));
                if (attr != "TypeName" && value.hasOwnProperty(attr))
                    this[attr] = value[attr];
            }
        };
        return NamedObject;
    }());
    ngstd.NamedObject = NamedObject;
    /**
     * This function deserializes json object by the TypeName property. Your TypeName must contains the module name and class name for eval() call;
     * @param json
     */
    function TypedJSON(json) {
        var copy;
        // Handle the 3 simple types, and null or undefined
        if (null == json || "object" != typeof json)
            return json;
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
            var name;
            if (json.hasOwnProperty(TypeName)) {
                //to use eval to create new class;
                name = json[TypeName];
                copy = eval("new " + name + "()");
            }
            else {
                copy = {};
            }
            for (var attr in json) {
                if (attr != "TypeName" && json.hasOwnProperty(attr))
                    copy[attr] = TypedJSON(json[attr]);
            }
            return copy;
        }
    }
    ngstd.TypedJSON = TypedJSON;
    function SerializeJSON(object) {
        //console.log('Serizlizing: ' + object);
        if (typeof object === 'boolean')
            return JSON.stringify(object);
        if (object instanceof Date)
            return JSON.stringify(object);
        if (typeof object === 'string')
            return JSON.stringify(object);
        if (typeof object === 'number')
            return JSON.stringify(object);
        if (object instanceof RegExp)
            return JSON.stringify(object);
        //Handle null
        if (!object)
            return 'null';
        //Handle Array
        if (object instanceof Array) {
            var codes = [];
            for (var i = 0; i < object.length; i++) {
                codes.push(SerializeJSON(object[i]));
            }
            return '[' + codes.join(',') + ']';
        }
        if (object instanceof Object) {
            var codes = [];
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
            }
            return '{' + codes.join(',') + '}';
        }
    }
    ngstd.SerializeJSON = SerializeJSON;
    var PathModel = (function () {
        function PathModel() {
        }
        return PathModel;
    }());
    ngstd.PathModel = PathModel;
    /**
     * An implementation of Angular Module. A few important setting features are provided as standard functions.
     */
    var AngularModule = (function () {
        function AngularModule(name, modules, configFn) {
            var _this = this;
            /**
             * enables html5 mode for using base<path> and location service;
             */
            this.LocationHtml5Mode = function () {
                _this.app.config(['$locationProvider',
                    function ($locationProvider) {
                        $locationProvider.html5Mode(true);
                    }
                ]);
            };
            /**
             * Include Content Directive in this module;
             */
            this.includeContentDirective = function () {
                _this.addDirective('content', function () { return new ContentDirective(); });
            };
            /**
             *
             */
            this.includeTreeDirective = function () {
                _this.addDirective('tree', function ($compile, $http) { return new TreeDirective($compile, $http); });
            };
            /**
             * Include Sheet Directive in this module;
             */
            this.includeSheetDirective = function () {
                _this.addDirective('sheet', function () { return new SheetDirective(); });
            };
            /**
             * Include Image Directive in this module;
             */
            this.includePictureDirective = function () {
                _this.addDirective('picture', function () { return new PictureDirective(); });
            };
            this.includeOpenFileDirective = function () {
                _this.addDirective('openfile', function ($compile) { return new OpenFileDirective($compile); });
            };
            this.includeMenuGroupDirective = function () {
                _this.addDirective('menuGroup', function () { return new MenuGroupDirective(); });
            };
            this.includeImageSlideDirective = function (name) {
                _this.addDirective(name ? name : 'imageslide', function () { return new ImageSlideDirective(); });
            };
            this.includeCaptchaDirecive = function (name) {
                _this.addDirective(name ? name : 'captcha', function () { return new ngstd.CaptchaDirective(); });
            };
            this.includeFileUploadDirective = function (name) {
                _this.addDirective(name ? name : 'fileupload', function () { return new ngstd.FileUploadDirective(); });
            };
            this.includeMouseSelectDirective = function (name) {
                _this.addDirective(name ? name : 'mouseselect', function ($window) { return new ngstd.MouseSelectDirective($window); });
            };
            this.includePagesFilter = function () {
                //split the string and return empty
                _this.app.filter('pages', function () {
                    return function (input, numberPerPage) {
                        var arr = [];
                        for (var i = 0; i < Math.ceil(input / numberPerPage); i++) {
                            arr.push({ index: i * numberPerPage, page: i + 1 });
                        }
                        return arr;
                    };
                });
            };
            /**
             * convert a number of PHP date to string date format. By default, the format is 'YYYY-MM-DD HH:mm:ss';
             */
            this.includePHPDateFilter = function () {
                //split the string and return empty
                _this.app.filter('phpdate', function () {
                    return function (input, format) {
                        if (!format)
                            format = 'YYYY-MM-DD HH:mm:ss';
                        return moment('1970-01-01 00:00:00').add(input, 'second').format(format);
                    };
                });
            };
            this.includeStartFromFilter = function () {
                //split the string and return empty
                _this.app.filter('startFrom', function () {
                    return function (input, start) {
                        if (typeof start != 'number' || isNaN(start) || start < 0)
                            start = 0;
                        start = start; //parse to int
                        if (!input)
                            return [];
                        if (!Array.isArray(input))
                            return input;
                        return input.slice(start);
                    };
                });
            };
            this.includePageDirective = function (name) {
                //split the string and return empty
                _this.addDirective(name ? name : 'page', function () { return new ngstd.PageDirective(); });
            };
            this.includeSplitFilter = function () {
                //split the string and return empty
                _this.app.filter('split', function () {
                    return function (input, splitchar) {
                        var arr = [];
                        if (input)
                            input.split(splitchar)
                                .forEach(function (value, index, source) {
                                if (value)
                                    if (value.length > 0)
                                        arr.push(value);
                            });
                        return arr;
                    };
                });
            };
            this.includeGalleryFilter = function () {
                //split the string and return empty
                _this.app.filter('gallery', function () {
                    return function (input, splitchar) {
                        var arr = [];
                        if (input)
                            input.split(splitchar)
                                .forEach(function (value, index, source) {
                                if (value)
                                    if (value.length > 0)
                                        arr.push({ thumb: value, img: value, description: null });
                            });
                        return arr;
                    };
                });
            };
            this.includeFirstImageFilter = function () {
                //split the string and return empty
                _this.app.filter('firstimage', function () {
                    return function (input, splitchar) {
                        var arr = [];
                        if (input)
                            input.split(splitchar)
                                .forEach(function (value, index, source) {
                                if (value)
                                    if (value.length > 0)
                                        arr.push(value);
                            });
                        return arr[0];
                    };
                });
            };
            this.includeString2DateFilter = function () {
                //split the string and return empty
                _this.app.filter('string2date', function () {
                    return function (input) {
                        return moment(input).toDate();
                    };
                });
            };
            this.includeDecimal = function (name) {
                _this.addDirective(name ? name : 'decimal', function () { return new DecimalDirective(); });
            };
            this.includeImageEditorDirective = function (name) {
                _this.addDirective(name ? name : 'imageEditor', function () { return new ImageEditorDirective(); });
            };
            this.includeString2DateDirective = function (name) {
                _this.addDirective(name ? name : 'string2date', function () { return new String2DateModelConversionDirective(); });
            };
            /**
            * include DynamicTBody directive with default name 'dynamic';
            */
            this.includeDynamicTBody = function (name) {
                _this.addDirective(name ? name : 'dynamic', function ($compile) { return new DynamicTBodyDirective($compile); });
            };
            this.includeTimeDrirective = function (name) {
                _this.addDirective(name ? name : 'time', function ($compile) { return new TimeDirective($compile); });
            };
            this.includeDateTimeDrirective = function (name) {
                _this.addDirective(name ? name : 'datetime', function ($compile) { return new DateTimeDirective($compile); });
            };
            this.includeNum2StrDirective = function (name) {
                _this.addDirective(name ? name : 'num2str', function () { return new Num2StrModelConversionDirective(); });
            };
            this.includeBool2StrDirective = function (name) {
                _this.addDirective(name ? name : 'bool2str', function () { return new TinyInt2BoolModelConverstionDirective(); });
            };
            this.includeGalleryDirective = function (name) {
                _this.addDirective(name ? name : 'gallery', function () { return new GalleryDirective(); });
            };
            if (!modules)
                modules = [];
            this.app = angular.module(name, modules, configFn);
        }
        AngularModule.prototype.config = function (configFn) {
            this.app.config(configFn);
        };
        AngularModule.prototype.trustUrl = function (pattern) {
            this.app.config(function ($compileProvider) {
                $compileProvider.aHrefSanitizationWhitelist(pattern);
            });
        };
        AngularModule.prototype.addController = function (name, controller) {
            this.app.controller(name, controller);
        };
        /**
         * Add a directive to the Angular Module;
         * @param name is the name of the directive
         * @param factory is the factory function such as ()=>new Directive(). Directive name won't work.
         */
        AngularModule.prototype.addDirective = function (name, factory) {
            this.app.directive(name, factory);
        };
        AngularModule.prototype.addStdDirective = function (name, templateUrl, Controller) {
            this.app.directive(name, function () {
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
        };
        AngularModule.prototype.addFactory = function (name, factory) {
            this.app.factory(name, factory);
        };
        AngularModule.prototype.addService = function (name, service) {
            this.app.service(name, service);
        };
        Object.defineProperty(AngularModule.prototype, "Base", {
            /**
             * Provide access to the ng.IModule;
             */
            get: function () {
                return this.app;
            },
            enumerable: true,
            configurable: true
        });
        return AngularModule;
    }());
    ngstd.AngularModule = AngularModule;
    /**
     *
     */
    var AppController = (function () {
        function AppController() {
            /**
             * Template Selector by Type, this is a default selector
             */
            this.TemplateTypeSelector = function (data, templates) {
                var nType;
                var name;
                if (data) {
                    if (data instanceof Array) {
                        if (data.length)
                            if (data.length > 0) {
                                nType = data[0];
                                name = nType.TypeName + '[]';
                            }
                            else {
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
                if (debugging)
                    console.log(name); //debugging swtich
                var result = '';
                templates.forEach(function (value, index, array) {
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
            this.TemplateFirstSelector = function (data, templates) {
                if (templates)
                    if (templates.length > 0) {
                        return templates[0].template;
                    }
                    else {
                        return '';
                    }
            };
        }
        return AppController;
    }());
    ngstd.AppController = AppController;
    var DirectiveRestrict = (function () {
        function DirectiveRestrict() {
        }
        DirectiveRestrict.E = 'E';
        DirectiveRestrict.A = 'A';
        DirectiveRestrict.AE = 'AE';
        DirectiveRestrict.C = 'C';
        return DirectiveRestrict;
    }());
    ngstd.DirectiveRestrict = DirectiveRestrict;
    var BindingRestrict = (function () {
        function BindingRestrict() {
        }
        BindingRestrict.Both = '=';
        BindingRestrict.In = '@';
        BindingRestrict.Out = '&';
        BindingRestrict.OptionalBoth = '=?';
        return BindingRestrict;
    }());
    ngstd.BindingRestrict = BindingRestrict;
    var AngularDirective = (function () {
        function AngularDirective() {
            this.scope = {};
            return this;
        }
        return AngularDirective;
    }());
    ngstd.AngularDirective = AngularDirective;
    var PageDirective = (function (_super) {
        __extends(PageDirective, _super);
        function PageDirective() {
            _super.call(this);
            this.restrict = DirectiveRestrict.A;
            this.scope.limit = BindingRestrict.OptionalBoth;
            this.scope.total = BindingRestrict.OptionalBoth;
            this.scope.pages = BindingRestrict.OptionalBoth;
            this.link = function (scope) {
                var buildPages = function () {
                    var nLimit = scope.limit;
                    var nTotal = scope.total;
                    if (typeof nLimit == 'number' && !isNaN(nLimit)) {
                        if (nLimit < 1)
                            nLimit = 1;
                    }
                    if (typeof nTotal == 'number' && !isNaN(nTotal)) {
                        if (nTotal < 0)
                            nTotal = 0;
                    }
                    var arr = [];
                    for (var i = 0; i < Math.ceil(nTotal / nLimit); i++) {
                        arr.push({ index: i * nLimit, page: i + 1 });
                    }
                    scope.pages = arr;
                    //console.log(scope.pages, arr, nLimit, nTotal);
                };
                scope.$watch('limit', function (nLimit, oLimit) {
                    buildPages();
                });
                scope.$watch('total', function (nTotal, oTotal) {
                    buildPages();
                });
            };
        }
        return PageDirective;
    }(AngularDirective));
    ngstd.PageDirective = PageDirective;
    var MouseSelectDirective = (function (_super) {
        __extends(MouseSelectDirective, _super);
        function MouseSelectDirective($window) {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.A;
            this.scope = null;
            this.link = function (scope, element, attrs) {
                element.bind('mouseenter', function (ev) {
                    if (!$window.getSelection().toString()) {
                        var input = element[0];
                        input.setSelectionRange(0, input.value.length);
                    }
                });
            };
        }
        return MouseSelectDirective;
    }(ngstd.AngularDirective));
    ngstd.MouseSelectDirective = MouseSelectDirective;
    var GalleryDirective = (function (_super) {
        __extends(GalleryDirective, _super);
        function GalleryDirective() {
            _super.call(this);
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
            this.link = function (scope, element, attributes) {
                var index = 0;
                element.css('background-color', 'rgba(0,0,0,0.6)');
                element.css('border', '1px solid red');
                element.css('border-radius', '10px');
                element.on('keydown', function (ev) {
                    console.log(ev.keyCode);
                });
                scope.previous = function () {
                    if (scope.images) {
                        if (Array.isArray(scope.images)) {
                            if (scope.images.length > 0) {
                                index += 1;
                                if (index >= scope.images.length)
                                    index = 0;
                                scope.image = scope.images[index];
                            }
                        }
                    }
                };
                scope.next = function () {
                    if (scope.images) {
                        if (Array.isArray(scope.images)) {
                            if (scope.images.length > 0) {
                                index -= 1;
                                if (index < 0)
                                    index = scope.images.length - 1;
                                scope.image = scope.images[index];
                            }
                        }
                    }
                };
                scope.$watch('images', function (nValue, oValue) {
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
            };
        }
        return GalleryDirective;
    }(ngstd.AngularDirective));
    ngstd.GalleryDirective = GalleryDirective;
    /**
     * DataTemplate definition for Conent control.
     */
    var DataTemplate = (function () {
        function DataTemplate() {
        }
        return DataTemplate;
    }());
    ngstd.DataTemplate = DataTemplate;
    /**
     * Content control controller. It accepts template elements to generate views for data.
     * It will invoke the selector to evaluate what view to use.
     * We suggest building a TabControl based on Content control.
     * Content control use $compile method to build element within subscope. subscope will be destroyed on the removal of corresponding element.
     */
    var ContentController = (function () {
        function ContentController($compile, $element, $http, $scope) {
            //this.compiled = this.$compile("<test></test>")(this.$scope);
            //this.$element.append(this.compiled);
            //console.log(this.compiled);
            var _this = this;
            this.$compile = $compile;
            this.$element = $element;
            this.$http = $http;
            this.$scope = $scope;
            this.templates = [];
            //this section will collect each of the view template from the inner of this model and they can be applied to each of the software.
            $element.children('template').each(function (index, elem) {
                var $elem = $(elem);
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
                        .success(function (data) {
                        template.template = data;
                        //we must check if the return value can affect the view of the content control.
                        if ($scope.selector)
                            if ($scope.view != $scope.selector($scope.data, _this.templates)) {
                                //if view is affected, view must be updated.
                                $scope.view = $scope.selector($scope.data, _this.templates);
                            }
                    });
                }
                else {
                    template.template = $elem.html();
                }
                _this.templates.push(template);
            });
            $element.children().remove();
            $scope.$watch('data', function (newValue, oldValue) {
                if ($scope.selector) {
                    var template = $scope.selector(newValue, _this.templates);
                    if (template)
                        $scope.view = template;
                }
                else {
                    console.log('Content View Warning: selector is undefined.\n' +
                        'Please provide a valid selector function:\n' +
                        'selector: (data: any, templates: DataTemplate[]) => string');
                }
            });
            //this is the way to set up a watch.
            $scope.$watch('view', function (newValue, oldValue) {
                console.log('$watch view');
                //distroy all child elements in the element.
                if (_this.childscope) {
                    _this.childscope.$destroy(); //destroy the child scope
                    $element.children().remove(); //remove each of the child elments
                }
                //create a new child scope.
                _this.childscope = $scope.$new();
                //append the complied element
                $element.append($compile(newValue)(_this.childscope));
            });
        }
        ContentController.$inject = ['$compile', '$element', '$http', '$scope'];
        return ContentController;
    }());
    ngstd.ContentController = ContentController;
    /**
 * Control directive.
 */
    var ContentDirective = (function (_super) {
        __extends(ContentDirective, _super);
        function ContentDirective() {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.E;
            this.template = '';
            this.scope.data = ngstd.BindingRestrict.Both;
            this.scope.view = ngstd.BindingRestrict.OptionalBoth;
            this.scope.controller = ngstd.BindingRestrict.OptionalBoth;
            this.scope.app = ngstd.BindingRestrict.OptionalBoth;
            this.scope.selector = ngstd.BindingRestrict.OptionalBoth;
            this.controller = ContentController;
        }
        return ContentDirective;
    }(ngstd.AngularDirective));
    ngstd.ContentDirective = ContentDirective;
    var TreeTemplate = (function () {
        function TreeTemplate() {
        }
        return TreeTemplate;
    }());
    ngstd.TreeTemplate = TreeTemplate;
    /**
     * To use this directive, you must use the observable interface 'add(), remove(), removeAt(), clear()'
     */
    var TreeDirective = (function (_super) {
        __extends(TreeDirective, _super);
        function TreeDirective($compile, $http) {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.A;
            this.scope.tree = ngstd.BindingRestrict.Both;
            this.scope.app = ngstd.BindingRestrict.Both;
            this.scope.controller = ngstd.BindingRestrict.Both;
            this.scope.modelBuilder = ngstd.BindingRestrict.Both;
            this.scope.childrenSelector = ngstd.BindingRestrict.Both;
            this.scope.templateSelector = ngstd.BindingRestrict.Both;
            this.scope.templates = ngstd.BindingRestrict.OptionalBoth;
            this.link = function (scope, element, attrs) {
                if (!scope.templates)
                    scope.templates = [];
                if (!Array.isArray(scope.templates))
                    scope.templates = [];
                //this will remove all the templates in the content;
                element.children('template').each(function (index, elem) {
                    var $elem = $(elem);
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
                            .success(function (data) {
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
            };
        }
        return TreeDirective;
    }(ngstd.AngularDirective));
    ngstd.TreeDirective = TreeDirective;
    var TreeItemBase = (function () {
        function TreeItemBase() {
            var _this = this;
            this.children = [];
            /**
             * For observable interface of ItemsSource Watching, do not use this function;
             * @param array
             * @param item
             * @param index
             */
            this.onInsert = function (array, item, index) {
                _this.insert(item, index);
            };
            /**
             * For observable interface of ItemsSource Watching, do not use this function;
             * @param array
             * @param item
             * @param index
             */
            this.onRemoveAt = function (array, item, index) {
                _this.removeAt(index);
            };
            /**
             * For observable interface of ItemsSource Watching, do not use this function;
             * @param array
             */
            this.onClear = function (array) {
                _this.clear();
            };
            /**
             * For observable interface of ItemsSource Watching, do not use this function;
             * @param array
             * @param item
             * @param from
             * @param to
             */
            this.onMoveTo = function (array, item, from, to) {
                _this.moveTo(from, to);
            };
            // protected functions for TreeView logic
            this.updateApp = function () {
                for (var i = 0; i < _this.children.length; i++) {
                    _this.children[i].scope.app = _this.root.app;
                }
            };
            this.updateController = function () {
                for (var i = 0; i < _this.children.length; i++) {
                    _this.children[i].scope.controller = _this.root.controller;
                }
            };
            this.updateModelBuilder = function () {
                if (_this.root.modelBuilder) {
                    for (var i = 0; i < _this.children.length; i++) {
                        _this.children[i].scope.model = _this.root.modelBuilder(_this.children[i].data, _this.children[i]);
                    }
                }
                else {
                    for (var i = 0; i < _this.children.length; i++) {
                        _this.children[i].scope.model = null;
                    }
                }
            };
            this.updateChildrenView = function () {
                for (var i = 0; i < _this.children.length; i++) {
                    _this.children[i].buildView();
                }
                _this.renderChildren();
            };
            /**
             * For watch children array;
             * @param newValue
             * @param oldValue
             */
            this.childrenChanged = function (newChildren, oldChildren) {
                _this.clearChildren();
                //detach all listeners;
                if (oldChildren) {
                    oldChildren.onInsert = null;
                    oldChildren.onRemoveAt = null;
                    oldChildren.onClear = null;
                    oldChildren.onMoveTo = null;
                }
                if (newChildren) {
                    //attach listeners to new value;
                    newChildren.onInsert = _this.onInsert;
                    newChildren.onRemoveAt = _this.onRemoveAt;
                    newChildren.onClear = _this.onClear;
                    newChildren.onMoveTo = _this.onMoveTo;
                    for (var i = 0; i < newChildren.length; i++) {
                        var data = newChildren[i];
                        var child = new TreeItem(data, _this, _this.level + 1);
                        child.index = i;
                        child.buildView();
                        _this.children.push(child);
                    }
                    _this.renderChildren();
                }
            };
            /**
             * clear children (perform remove on each child) but it doesn't update the children view; you need to call renderChildren to update view;
             * this function is for internal call;
             */
            this.clearChildren = function () {
                for (var i = 0; i < _this.children.length; i++) {
                    _this.children[i].destroy();
                }
            };
            //public functions:
            /**
             * clear chilren (perform remove on each child), destory scope, remove view;
             */
            this.destroy = function () {
                for (var i = 0; i < _this.children.length; i++) {
                    _this.children[i].destroy();
                }
                if (_this.scope)
                    _this.scope.$destroy();
                if (_this.view)
                    _this.view.remove();
                _this.scope = null;
                _this.view = null;
            };
            this.clear = function () {
                _this.clearChildren();
                _this.renderChildren();
            };
            /**
            * present the children in the order of children;
            */
            this.renderChildren = function () {
                if (_this.presentor) {
                    //detach all children;
                    _this.presentor.children().detach();
                    //append all children;
                    for (var i = 0; i < _this.children.length; i++) {
                        _this.children[i].index = i;
                        if (_this.children[i].view)
                            _this.presentor.append(_this.children[i].view);
                    }
                }
            };
            /**
             * insert a data at 'index'
             * @param data
             * @param index
             */
            this.insert = function (data, index) {
                var child = new TreeItem(data, _this, _this.level + 1);
                if (index < 0)
                    index = 0;
                if (index > _this.children.length)
                    index = _this.children.length;
                child.index = index;
                child.buildView();
                _this.children.splice(index, 0, child);
                //we also need to take care of the view;
                _this.renderChildren();
            };
            this.removeAt = function (index) {
                var child = _this.children[index];
                if (child) {
                    child.destroy();
                    _this.children.splice(index, 1);
                    _this.renderChildren();
                }
            };
            /**
             * Move a child from 'from' to 'to';
             * @param from
             * @param to
             */
            this.moveTo = function (from, to) {
                var child = _this.children.splice(from, 1)[0];
                _this.children.splice(to, 0, child);
                _this.renderChildren();
            };
            /**
             * Move a child from 'from' position of this item to the 'to' position of the target item;
             * This function allows simple 'drag-drop' operation for the tree view.
             * @param from
             * @param target
             * @param to
             */
            this.moveToTreeItem = function (from, target, to, rebuildView) {
                var child = _this.children.splice(from, 1)[0];
                _this.renderChildren();
                child.parent = target;
                child.root = target.root;
                if (rebuildView)
                    child.buildView();
                target.children.splice(to, 1, child);
                target.renderChildren();
            };
            /**
             * Allow viewmodel to update the view;
             */
            this.refresh = function () {
                _this.buildView();
                _this.render();
            };
        }
        return TreeItemBase;
    }());
    ngstd.TreeItemBase = TreeItemBase;
    var TreeItem = (function (_super) {
        __extends(TreeItem, _super);
        function TreeItem(data, parent, level) {
            var _this = this;
            _super.call(this);
            this.buildView = function () {
                _this.destroy();
                var tempalte;
                if (_this.root.templateSelector)
                    tempalte = _this.root.templateSelector(_this.data, _this.root.templates);
                if (!tempalte)
                    if (_this.root.templates)
                        tempalte = _this.root.templates[0]; // by default use the first template;
                var templateHTML = '{{data}}<div presenter></div>';
                var childrenSource;
                if (tempalte) {
                    templateHTML = tempalte.template; //this is the default view for the tree view;
                    childrenSource = tempalte.children;
                }
                //echo('templateHTML: ' + templateHTML);
                _this.scope = _this.parent.scope.$new(true, _this.parent.scope);
                _this.scope.data = _this.data;
                _this.scope.controller = _this.root.controller;
                if (_this.root.modelBuilder)
                    _this.scope.model = _this.root.modelBuilder(_this.data, _this);
                _this.scope.app = _this.root.app;
                //add watch here?
                if (_this.root.childrenSelector) {
                    var childrenSourceFromSelector = _this.root.childrenSelector(_this.data, _this.parent.data, _this.level);
                    if (childrenSourceFromSelector)
                        childrenSource = childrenSourceFromSelector;
                }
                if (childrenSource)
                    _this.childrenWatchUnregister = _this.scope.$watch('data.' + childrenSource, _this.childrenChanged);
                _this.view = _this.root.compile(templateHTML)(_this.scope);
                _this.presentor = _this.view.filter('div[presenter]');
                if (!_this.presentor)
                    _this.presentor = _this.view.find('div[presenter]');
            };
            this.render = function () {
                _this.parent.renderChildren();
                //this.parent.scope.$apply();
            };
            this.data = data;
            this.parent = parent;
            this.root = parent.root;
            //from root;
        }
        return TreeItem;
    }(TreeItemBase));
    ngstd.TreeItem = TreeItem;
    var TreeRoot = (function (_super) {
        __extends(TreeRoot, _super);
        function TreeRoot(scope, element, complie) {
            var _this = this;
            _super.call(this);
            this.templates = [];
            this.buildView = function () {
                //we must watch the data;
                _this.childrenWatchUnregister = _this.scope.$watch('tree', _this.childrenChanged);
            };
            this.render = function () {
                //nothing to do;
                //this.scope.$apply();
            };
            this.appWatcher = function (newApp, oldApp) {
                _this.updateApp();
            };
            this.controllerWatcher = function (newController, oldController) {
                _this.updateController();
            };
            this.modelBuilderWatcher = function (newModelBuilder, oldModelBuilder) {
                _this.updateModelBuilder();
            };
            this.templatesWatcher = function (newTemplates, oldTemplates) {
                _this.updateChildrenView();
            };
            this.templateSelectorWatcher = function (newTemplateSelector, oldTemplateSelector) {
                _this.updateChildrenView();
            };
            this.childrenSelectorWatcher = function (newChildrenSelector, oldChildrenSelector) {
                _this.updateChildrenView();
            };
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
        return TreeRoot;
    }(TreeItemBase));
    ngstd.TreeRoot = TreeRoot;
    /**
     * Decimal directive that make the Input Text only accept numbers and dot.
     */
    var DecimalDirective = (function (_super) {
        __extends(DecimalDirective, _super);
        function DecimalDirective() {
            _super.call(this);
            this.link = function (scope, element, attr, ngModel) {
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
                element.on('keydown', function (e) {
                    //console.log(e.keyCode);
                    switch (e.keyCode) {
                        case 48:
                        case 49:
                        case 50:
                        case 51:
                        case 52:
                        case 53:
                        case 54:
                        case 55:
                        case 56:
                        case 57:
                        case 96:
                        case 97:
                        case 98:
                        case 99:
                        case 100:
                        case 101:
                        case 102:
                        case 103:
                        case 104:
                        case 105:
                            break;
                        case 8:
                            break;
                        case 46:
                            break;
                        case 39:
                        case 37:
                            break;
                        case 38:
                        case 40:
                            break;
                        case 110:
                        case 190:
                            if (!acceptDecimal)
                                e.preventDefault();
                            break;
                        case 109:
                        case 189:
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
            };
            this.restrict = ngstd.DirectiveRestrict.A;
            this.scope.accuracy = ngstd.BindingRestrict.In;
            this.scope.acceptNegative = ngstd.BindingRestrict.In;
            this.scope.acceptDecimal = ngstd.BindingRestrict.In;
            this.require = 'ngModel';
        }
        DecimalDirective.DecimalFormatter = function (accuracy) {
            return function (value) { return (new DecimalNumber(value)).toDecimal(accuracy); };
        };
        return DecimalDirective;
    }(ngstd.AngularDirective));
    ngstd.DecimalDirective = DecimalDirective;
    var String2DateModelConversionDirective = (function (_super) {
        __extends(String2DateModelConversionDirective, _super);
        function String2DateModelConversionDirective() {
            _super.call(this);
            this.link = function (scope, element, attr, ngModel) {
                //console.log('string2date link called');
                ngModel.$parsers.push(String2DateModelConversionDirective.Date2String);
                ngModel.$formatters.push(String2DateModelConversionDirective.String2Date);
            };
            //console.log('string2date directive init');
            this.restrict = ngstd.DirectiveRestrict.A;
            this.require = 'ngModel';
            this.scope = null;
        }
        String2DateModelConversionDirective.String2Date = function (value) {
            //console.log('string to date: ' + value);
            //console.log(moment(value).toDate());
            return moment(value).toDate();
        };
        String2DateModelConversionDirective.Date2String = function (value) {
            return moment(value).format('YYYY-MM-DD HH:mm:ss');
        };
        return String2DateModelConversionDirective;
    }(ngstd.AngularDirective));
    ngstd.String2DateModelConversionDirective = String2DateModelConversionDirective;
    //dynamic directive
    var DynamicDirective = (function () {
        function DynamicDirective() {
            this.scope = {};
            return this;
        }
        return DynamicDirective;
    }());
    ngstd.DynamicDirective = DynamicDirective;
    //we need a view directive that does not require a content, instead it will use a define viewbase, but not a complex directive view;
    var ViewBase = (function () {
        function ViewBase() {
            var _this = this;
            this.destroy = function () {
                _this.scope.$destroy();
                _this.scope = null;
            };
        }
        return ViewBase;
    }());
    ngstd.ViewBase = ViewBase;
    var ViewDirectiveController = (function () {
        function ViewDirectiveController($compile, $element, $http, $scope) {
            var _this = this;
            this.onViewChanged = function (newValue, oldValue) {
                //distroy all child elements in the element.
                if (oldValue) {
                    _this.element.children().detach(); //remove each of the child elments
                }
                if (newValue) {
                    if (newValue.scope) {
                        _this.element.append(newValue.element);
                    }
                    else {
                        //append the complied element
                        newValue.scope = _this.scope.$new();
                        newValue.element = _this.compile(newValue.template)(newValue.scope);
                        _this.element.append(newValue.element);
                    }
                }
            };
            this.compile = $compile;
            this.element = $element;
            this.scope = $scope;
            $scope.$watch(function () { return $scope.view; }, this.onViewChanged);
        }
        ViewDirectiveController.$inject = ['$compile', '$element', '$http', '$scope'];
        return ViewDirectiveController;
    }());
    ngstd.ViewDirectiveController = ViewDirectiveController;
    var ViewDirective = (function (_super) {
        __extends(ViewDirective, _super);
        function ViewDirective() {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.A;
            this.template = '';
            this.scope.view = ngstd.BindingRestrict.Both;
        }
        return ViewDirective;
    }(ngstd.AngularDirective));
    ngstd.ViewDirective = ViewDirective;
    var MenuGroupController = (function () {
        function MenuGroupController($element, $scope) {
            var _this = this;
            this.$element = $element;
            this.$scope = $scope;
            //use $scope to watch size change and work out height for view panel;
            this.element = $element;
            this.parent = $element.parent();
            this.view = $element.children('.view');
            this.title = $element.children('.title');
            $scope.$watch(function () { return _this.parent.height(); }, function (newValue, oldValue) {
                _this.view.height(_this.element.innerHeight() - _this.title.outerHeight() - 2);
            });
        }
        MenuGroupController.$inject = ['$element', '$scope'];
        return MenuGroupController;
    }());
    ngstd.MenuGroupController = MenuGroupController;
    var MenuGroupAlignmentColumn = (function () {
        function MenuGroupAlignmentColumn() {
            var _this = this;
            this.width = 0;
            this.height = 0;
            this.currentHeight = 0;
            this.alignElement = function (elem) {
                console.log(elem);
                console.log('clientSize: ' + elem.clientWidth + ', ' + elem.clientHeight);
                if (_this.currentHeight == 0) {
                    //it must fit in even it is bigger than the view;
                    _this.currentHeight = elem.clientHeight;
                    _this.width = Math.max(elem.clientWidth, _this.width);
                    return true;
                }
                else {
                    //it won't fit in if there is already something in the column;
                    if (_this.currentHeight + elem.clientHeight > _this.height) {
                        return false;
                    }
                    else {
                        _this.currentHeight += elem.clientHeight;
                        _this.width = Math.max(elem.clientWidth, _this.width);
                        return true;
                    }
                }
            };
        }
        return MenuGroupAlignmentColumn;
    }());
    ngstd.MenuGroupAlignmentColumn = MenuGroupAlignmentColumn;
    /**
     * This directive shall be used to automatically adjust tab group view panel height;
     */
    var MenuGroupDirective = (function (_super) {
        __extends(MenuGroupDirective, _super);
        function MenuGroupDirective() {
            _super.call(this);
            this.restrict = DirectiveRestrict.C;
            this.controller = MenuGroupController;
        }
        return MenuGroupDirective;
    }(AngularDirective));
    ngstd.MenuGroupDirective = MenuGroupDirective;
    var DynamicTBodyDirective = (function (_super) {
        __extends(DynamicTBodyDirective, _super);
        function DynamicTBodyDirective($compile) {
            _super.call(this);
            this.restrict = DirectiveRestrict.A;
            this.scope.items = BindingRestrict.Both;
            this.scope.template = BindingRestrict.Both;
            this.scope.controller = BindingRestrict.Both;
            this.link = function (scope, element) {
                var childScope;
                scope.$watch('template', function (nValue, oValue) {
                    element.children().remove();
                    var template = '<tr ng-repeat="item in items">' + nValue + '</tr>';
                    if (childScope)
                        childScope.$destroy();
                    childScope = scope.$new();
                    var elem = $compile(template)(childScope);
                    element.append(elem);
                });
            };
        }
        return DynamicTBodyDirective;
    }(ngstd.AngularDirective));
    ngstd.DynamicTBodyDirective = DynamicTBodyDirective;
    var ImageEditorController = (function () {
        function ImageEditorController($scope) {
            var _this = this;
            this.onImageChanged = function (newValue) {
                if (newValue) {
                    _this.images = newValue.split(';').filter(function (value) {
                        if (value)
                            return value.length > 0;
                        return false;
                    });
                }
                else {
                    _this.images = [];
                }
            };
            this.removeImage = function ($index) {
                //console.log('$index: ' + $index);
                if (_this.scope.multiple) {
                    var arr = _this.scope.getImage().split(';').filter(function (value) {
                        if (value)
                            return value.length > 0;
                        return false;
                    });
                    arr.splice($index, 1);
                    if (arr.length > 0) {
                        _this.scope.setImage(arr.join(';') + ';');
                    }
                    else {
                        _this.scope.setImage('');
                    }
                }
                else {
                    _this.scope.setImage('');
                }
                //console.log(this.scope.image);
                //console.log(this.images);
            };
            this.imageUploaded = function (image) {
                //console.log('image uploaded: '+ image);
                if (_this.scope.multiple) {
                    if (_this.scope.getImage()) {
                        _this.scope.setImage(_this.scope.getImage() + image + ';');
                    }
                    else {
                        _this.scope.setImage(image + ';');
                    }
                }
                else {
                    _this.scope.setImage(image + ';');
                }
            };
            this.scope = $scope;
            //this watch will automatically generate the images from string, so the event handler only has to handle this 'image' string;
            //this.scope.$watch('image', this.onImageChanged );
            this.scope.imageChanged = this.onImageChanged;
        }
        ImageEditorController.$inject = ['$scope'];
        return ImageEditorController;
    }());
    ngstd.ImageEditorController = ImageEditorController;
    var ImageEditorDirective = (function (_super) {
        __extends(ImageEditorDirective, _super);
        function ImageEditorDirective() {
            _super.call(this);
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
            this.link = function (scope, element, attributes, ngModel) {
                if (!scope.width)
                    scope.width = 160;
                if (!scope.height)
                    scope.height = 160;
                if (!scope.multiple)
                    scope.multiple = false;
                scope.setImage = function (value) {
                    ngModel.$setViewValue(value);
                };
                scope.getImage = function () {
                    return ngModel.$viewValue;
                };
                scope.$watch(function () { return ngModel.$modelValue; }, function (nValue, oValue) {
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
        return ImageEditorDirective;
    }(ngstd.AngularDirective));
    ngstd.ImageEditorDirective = ImageEditorDirective;
    //ImageSet Classes
    var ImageSet = (function (_super) {
        __extends(ImageSet, _super);
        function ImageSet() {
            _super.apply(this, arguments);
        }
        return ImageSet;
    }(ngstd.NamedObject));
    ngstd.ImageSet = ImageSet;
    //Table classes:
    var Table = (function (_super) {
        __extends(Table, _super);
        function Table() {
            _super.apply(this, arguments);
        }
        return Table;
    }(ngstd.NamedObject));
    ngstd.Table = Table;
    var TableHeader = (function (_super) {
        __extends(TableHeader, _super);
        function TableHeader() {
            _super.apply(this, arguments);
        }
        return TableHeader;
    }(ngstd.NamedObject));
    ngstd.TableHeader = TableHeader;
    var TableHeadCell = (function (_super) {
        __extends(TableHeadCell, _super);
        function TableHeadCell() {
            _super.apply(this, arguments);
        }
        return TableHeadCell;
    }(ngstd.NamedObject));
    ngstd.TableHeadCell = TableHeadCell;
    var TableRow = (function (_super) {
        __extends(TableRow, _super);
        function TableRow() {
            _super.apply(this, arguments);
        }
        return TableRow;
    }(ngstd.NamedObject));
    ngstd.TableRow = TableRow;
    //export interface SheetScope extends ng.IScope {
    //    data: ngstd.Table;
    //}
    //export class SheetDirectiveController {
    //    static $inject = ['$element', '$scope'];
    //    constructor(public $element: JQuery, public $scope: SheetScope) {
    //        $scope.controller = this;
    //    }
    //}
    var SheetDirective = (function (_super) {
        __extends(SheetDirective, _super);
        function SheetDirective() {
            _super.call(this);
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
        return SheetDirective;
    }(ngstd.AngularDirective));
    ngstd.SheetDirective = SheetDirective;
    var PictureDirectiveController = (function () {
        function PictureDirectiveController($http, $scope, $interval) {
            var _this = this;
            this.$http = $http;
            this.$scope = $scope;
            this.$interval = $interval;
            this.start = function () {
                if (_this.invervalCall) {
                    _this.interval.cancel(_this.invervalCall);
                    _this.invervalCall = null;
                }
                _this.index = 0;
                if (_this.scope.data)
                    if (_this.scope.data.length > _this.index) {
                        _this.scope.link = _this.scope.data[_this.index];
                        _this.index += 1;
                        if (_this.scope.data.length <= _this.index)
                            _this.index = 0;
                    }
                _this.invervalCall = _this.interval(function () { _this.next(); }, _this.scope.interval);
            };
            this.count = 0;
            this.index = 0;
            this.next = function () {
                _this.count += 1;
                if (_this.scope.data)
                    if (_this.scope.data.length > _this.index) {
                        _this.scope.link = _this.scope.data[_this.index];
                        _this.index += 1;
                        if (_this.scope.data.length <= _this.index)
                            _this.index = 0;
                    }
            };
            this.scope = $scope;
            this.interval = $interval;
            //watch for changes of data;
            $scope.$watch(function () { return $scope.data; }, function (newValue, oldValue) {
                _this.start();
            });
            $scope.$watch(function () { return $scope.interval; }, function (newValue, oldValue) {
                _this.start();
            });
            $scope.$on('$destroy', function () {
                console.log('picture interval destroyed!');
                if (_this.invervalCall) {
                    _this.interval.cancel(_this.invervalCall);
                    _this.invervalCall = null;
                }
            });
        }
        PictureDirectiveController.$inject = ["$http", "$scope", "$interval"];
        return PictureDirectiveController;
    }());
    ngstd.PictureDirectiveController = PictureDirectiveController;
    var PictureDirective = (function (_super) {
        __extends(PictureDirective, _super);
        function PictureDirective() {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.E;
            this.template = '<img ng-src="{{link}}" width="{{width}}" height="{{height}}"/>';
            this.scope.data = ngstd.BindingRestrict.Both;
            this.scope.width = ngstd.BindingRestrict.In;
            this.scope.height = ngstd.BindingRestrict.In;
            this.scope.interval = ngstd.BindingRestrict.In;
            this.controller = PictureDirectiveController;
        }
        return PictureDirective;
    }(ngstd.AngularDirective));
    ngstd.PictureDirective = PictureDirective;
    var Num2StrModelConversionDirective = (function (_super) {
        __extends(Num2StrModelConversionDirective, _super);
        function Num2StrModelConversionDirective() {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.A;
            this.template = null;
            this.require = 'ngModel';
            this.scope = null;
            this.link = function (scope, element, attributes, ngModel) {
                //Add parsers to ngModel;
                ngModel.$formatters.push(function (value) {
                    if (!value)
                        return '0';
                    return value.toString();
                });
                ngModel.$parsers.push(function (value) {
                    if (!value)
                        return 0;
                    if (isNaN(Number(value)))
                        return 0;
                    return Number(value);
                });
            };
        }
        return Num2StrModelConversionDirective;
    }(ngstd.AngularDirective));
    ngstd.Num2StrModelConversionDirective = Num2StrModelConversionDirective;
    var TinyInt2BoolModelConverstionDirective = (function (_super) {
        __extends(TinyInt2BoolModelConverstionDirective, _super);
        function TinyInt2BoolModelConverstionDirective() {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.A;
            this.template = null;
            this.require = 'ngModel';
            this.scope = null;
            this.link = function (scope, element, attributes, ngModel) {
                //Add parsers to ngModel;
                ngModel.$formatters.push(function (value) {
                    if (!value)
                        return false;
                    if (isNaN(value))
                        return false;
                    if (value != 0)
                        return true;
                    return false;
                });
                ngModel.$parsers.push(function (value) {
                    if (value) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
            };
        }
        return TinyInt2BoolModelConverstionDirective;
    }(ngstd.AngularDirective));
    ngstd.TinyInt2BoolModelConverstionDirective = TinyInt2BoolModelConverstionDirective;
    var OpenFileDirective = (function (_super) {
        __extends(OpenFileDirective, _super);
        function OpenFileDirective($compile) {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.A;
            this.template = null; //'{{label}}<input type= "file" accept="{{accept}}"/>'; //class = fileinputs
            this.scope.accept = ngstd.BindingRestrict.Both;
            this.require = 'ngModel';
            this.link = function (scope, element, attributes, ngModel) {
                //instead of using template, we here only use the $compile service to compile code into element and append it into the parent div.
                var input = $compile('<input type= "file" accept="{{accept}}"/>')(scope);
                element.append(input);
                var file = input[0];
                file.onchange = function () {
                    ngModel.$setViewValue(file.files);
                    file.value = null;
                };
            };
        }
        return OpenFileDirective;
    }(ngstd.AngularDirective));
    ngstd.OpenFileDirective = OpenFileDirective;
    /**
     * attribute directive that should be applied on empty div element;
     */
    var TimeDirective = (function (_super) {
        __extends(TimeDirective, _super);
        function TimeDirective($compile) {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.A;
            this.template = null;
            this.require = 'ngModel';
            this.link = function (scope, element, attributes, ngModel) {
                //instead of using template, we here only use the $compile service to compile code into element and append it into the parent div.
                var input = $compile('<input ng-model="hours" size="2" ng-change="hoursChanged()" type="text"/>:<input ng-model="minutes" size="2" ng-change="minutesChanged()" type="text"/>:<input ng-model="seconds" size="2" ng-change="secondsChanged()" type="text"/>')(scope);
                element.append(input);
                var changed = function () {
                    var h = Number(scope.hours);
                    if (isNaN(h))
                        h = 0;
                    var m = Number(scope.minutes);
                    if (isNaN(m))
                        m = 0;
                    var s = Number(scope.seconds);
                    if (isNaN(s))
                        s = 0;
                    var mmt = moment().year(1).month(0).date(1).hour(h).minute(m).second(s);
                    ngModel.$setViewValue(mmt.toDate());
                };
                scope.hoursChanged = changed;
                scope.minutesChanged = changed;
                scope.secondsChanged = changed;
                var hour = input[0];
                var minute = input[2];
                var second = input[4];
                //console.log('time viewValue: ' + ngModel.$viewValue.toString());
                var init = ngModel.$viewValue ? moment(ngModel.$viewValue) : moment();
                scope.$watch(function () { return ngModel.$viewValue; }, function (nValue, oValue) {
                    //console.log('time ngModel $viewValue changed.');
                    //console.log(nValue);
                    var mmt = moment(nValue);
                    scope.hours = mmt.hours().toString();
                    scope.minutes = mmt.minutes().toString();
                    scope.seconds = mmt.seconds().toString();
                });
                var value;
                value = init.hours();
                scope.hours = isNaN(value) ? '0' : value.toString();
                value = init.minutes();
                scope.minutes = isNaN(value) ? '0' : value.toString();
                value = init.seconds();
                scope.seconds = isNaN(value) ? '0' : value.toString();
                var focused = function (e) {
                    var input = e.target;
                    input.selectionStart = 0;
                    input.selectionEnd = input.value.length;
                };
                hour.onfocus = focused;
                minute.onfocus = focused;
                second.onfocus = focused;
                hour.onwheel = function (e) {
                    var value = Number(scope.hours);
                    if (isNaN(value))
                        value = 0;
                    value += Math.round(e.deltaY / 100);
                    value = value % 24;
                    if (value < 0)
                        value += 24;
                    scope.hours = value.toString();
                    e.preventDefault();
                    changed();
                    scope.$apply();
                };
                hour.onkeydown = function (e) {
                    switch (e.keyCode) {
                        case 9:
                        case 16:
                        case 48:
                        case 49:
                        case 50:
                        case 51:
                        case 52:
                        case 53:
                        case 54:
                        case 55:
                        case 56:
                        case 57:
                        case 96:
                        case 97:
                        case 98:
                        case 99:
                        case 100:
                        case 101:
                        case 102:
                        case 103:
                        case 104:
                        case 105:
                            break;
                        case 8:
                            break;
                        case 46:
                            break;
                        case 39:
                        case 37:
                            break;
                        case 38:
                            var value = Number(scope.hours);
                            if (isNaN(value))
                                value = 0;
                            value += 1;
                            value = value % 24;
                            if (value < 0)
                                value += 24;
                            scope.hours = value.toString();
                            e.preventDefault();
                            changed();
                            scope.$apply();
                            break;
                        case 40:
                            var value = Number(scope.hours);
                            if (isNaN(value))
                                value = 0;
                            value -= 1;
                            value = value % 24;
                            if (value < 0)
                                value += 24;
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
                minute.onwheel = function (e) {
                    var value = Number(scope.minutes);
                    if (isNaN(value))
                        value = 0;
                    value += Math.round(e.deltaY / 100);
                    value = value % 60;
                    if (value < 0)
                        value += 60;
                    scope.minutes = value.toString();
                    e.preventDefault();
                    changed();
                    scope.$apply();
                };
                minute.onkeydown = function (e) {
                    switch (e.keyCode) {
                        case 9:
                        case 16:
                        case 48:
                        case 49:
                        case 50:
                        case 51:
                        case 52:
                        case 53:
                        case 54:
                        case 55:
                        case 56:
                        case 57:
                        case 96:
                        case 97:
                        case 98:
                        case 99:
                        case 100:
                        case 101:
                        case 102:
                        case 103:
                        case 104:
                        case 105:
                            break;
                        case 8:
                            break;
                        case 46:
                            break;
                        case 39:
                        case 37:
                            break;
                        case 38:
                            var value = Number(scope.minutes);
                            if (isNaN(value))
                                value = 0;
                            value += 1;
                            value = value % 60;
                            if (value < 0)
                                value += 60;
                            scope.minutes = value.toString();
                            e.preventDefault();
                            changed();
                            scope.$apply();
                            break;
                        case 40:
                            var value = Number(scope.minutes);
                            if (isNaN(value))
                                value = 0;
                            value -= 1;
                            value = value % 60;
                            if (value < 0)
                                value += 60;
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
                second.onwheel = function (e) {
                    var value = Number(scope.seconds);
                    if (isNaN(value))
                        value = 0;
                    value += Math.round(e.deltaY / 100);
                    value = value % 60;
                    if (value < 0)
                        value += 60;
                    scope.seconds = value.toString();
                    e.preventDefault();
                    changed();
                    scope.$apply();
                };
                second.onkeydown = function (e) {
                    switch (e.keyCode) {
                        case 9:
                        case 16:
                        case 48:
                        case 49:
                        case 50:
                        case 51:
                        case 52:
                        case 53:
                        case 54:
                        case 55:
                        case 56:
                        case 57:
                        case 96:
                        case 97:
                        case 98:
                        case 99:
                        case 100:
                        case 101:
                        case 102:
                        case 103:
                        case 104:
                        case 105:
                            break;
                        case 8:
                            break;
                        case 46:
                            break;
                        case 39:
                        case 37:
                            break;
                        case 38:
                            var value = Number(scope.seconds);
                            if (isNaN(value))
                                value = 0;
                            value += 1;
                            value = value % 60;
                            if (value < 0)
                                value += 60;
                            scope.seconds = value.toString();
                            e.preventDefault();
                            changed();
                            scope.$apply();
                            break;
                        case 40:
                            var value = Number(scope.seconds);
                            if (isNaN(value))
                                value = 0;
                            value -= 1;
                            value = value % 60;
                            if (value < 0)
                                value += 60;
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
            };
        }
        return TimeDirective;
    }(ngstd.AngularDirective));
    ngstd.TimeDirective = TimeDirective;
    var DateTimeDirective = (function (_super) {
        __extends(DateTimeDirective, _super);
        function DateTimeDirective($compile) {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.A;
            this.template = null;
            this.require = 'ngModel';
            this.link = function (scope, element, attributes, ngModel) {
                //instead of using template, we here only use the $compile service to compile code into element and append it into the parent div.
                var input = $compile('<md-datepicker ng-model="date" ng-change="dateChanged()"></md-datepicker><div time ng-model="time" ng-change="timeChanged()"></div>')(scope);
                element.append(input);
                var init = ngModel.$viewValue ? moment(ngModel.$viewValue) : moment();
                scope.date = init.toDate();
                scope.time = init.toDate();
                scope.dateChanged = function () {
                    var mmtDate = moment(scope.date);
                    var mmtTime = moment(scope.time);
                    var mmt = moment().year(mmtDate.year()).month(mmtDate.month()).date(mmtDate.date()).hour(mmtTime.hours()).minute(mmtTime.minutes()).second(mmtTime.seconds());
                    ngModel.$setViewValue(mmt.toDate());
                };
                scope.timeChanged = function () {
                    var mmtDate = moment(scope.date);
                    var mmtTime = moment(scope.time);
                    var mmt = moment().year(mmtDate.year()).month(mmtDate.month()).date(mmtDate.date()).hour(mmtTime.hours()).minute(mmtTime.minutes()).second(mmtTime.seconds());
                    ngModel.$setViewValue(mmt.toDate());
                };
                scope.$watch(function () { return ngModel.$viewValue; }, function (nValue, oValue) {
                    var mmt = moment(nValue);
                    scope.date = mmt.toDate();
                    scope.time = mmt.toDate();
                });
            };
        }
        return DateTimeDirective;
    }(ngstd.AngularDirective));
    ngstd.DateTimeDirective = DateTimeDirective;
    //menu 
    var TabControl = (function (_super) {
        __extends(TabControl, _super);
        function TabControl() {
            var _this = this;
            _super.apply(this, arguments);
            this.items = [];
            this.addTabItem = function (item) {
                _this.items.push(item);
                item.parent = _this;
                return item;
            };
        }
        TabControl.prototype.selectTab = function (item) {
            var _this = this;
            this.items.forEach(function (value, index, array) {
                if (value === item) {
                    value.style = "'tab-pane active'";
                    _this.selectedContent = item.content;
                }
                else {
                    value.style = "";
                }
            });
        };
        return TabControl;
    }(NamedObject));
    ngstd.TabControl = TabControl;
    var TabItem = (function (_super) {
        __extends(TabItem, _super);
        function TabItem() {
            _super.apply(this, arguments);
        }
        TabItem.prototype.select = function () {
            if (this.parent)
                this.parent.selectTab(this);
        };
        ;
        return TabItem;
    }(NamedObject));
    ngstd.TabItem = TabItem;
    var TabContent = (function (_super) {
        __extends(TabContent, _super);
        function TabContent() {
            var _this = this;
            _super.apply(this, arguments);
            this.groups = [];
            this.addGroup = function (item) {
                _this.groups.push(item);
            };
        }
        return TabContent;
    }(NamedObject));
    ngstd.TabContent = TabContent;
    var MenuGroup = (function (_super) {
        __extends(MenuGroup, _super);
        function MenuGroup() {
            var _this = this;
            _super.apply(this, arguments);
            this.width = 'auto';
            this.items = [];
            this.addItem = function (item) {
                _this.items.push(item);
            };
        }
        return MenuGroup;
    }(NamedObject));
    ngstd.MenuGroup = MenuGroup;
    var MenuItem = (function (_super) {
        __extends(MenuItem, _super);
        function MenuItem() {
            _super.apply(this, arguments);
        }
        return MenuItem;
    }(NamedObject));
    ngstd.MenuItem = MenuItem;
    var FileMenuItem = (function (_super) {
        __extends(FileMenuItem, _super);
        function FileMenuItem() {
            _super.apply(this, arguments);
        }
        return FileMenuItem;
    }(NamedObject));
    ngstd.FileMenuItem = FileMenuItem;
    var ImageSlideController = (function () {
        function ImageSlideController($element, $scope, $interval) {
            this.$element = $element;
            this.$scope = $scope;
            this.$interval = $interval;
            this.$inject = ['$element', '$scope', '$interval'];
            var host = $element.children('div');
            var divs = host.children('div');
            var div1 = jQuery(divs[0]);
            var div2 = jQuery(divs[1]);
            var countDown = 0;
            var index = 0;
            var mode = true;
            var getNextImage = function () {
                index += 1;
                if (index >= $scope.images.length)
                    index = 0;
                if ($scope.images.length == 0)
                    return '';
                return $scope.images[index];
            };
            if ($scope.images.length > 0) {
                $scope.img1 = $scope.images[0];
                $scope.img2 = getNextImage();
            }
            //var watch = $scope.$watch(() => host.width(), (newValue: number, oldValue: number) => {
            //    //div1.width(newValue+'px');
            //    div2.width(newValue+'px');
            //});
            var int = $interval(function () {
                countDown += 1;
                var interval = Number($scope.interval);
                var transition = Number($scope.transition);
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
            $scope.$on('$destroy', function (event) {
                if (angular.isDefined(int))
                    $interval.cancel(int);
            });
        }
        return ImageSlideController;
    }());
    ngstd.ImageSlideController = ImageSlideController;
    var ImageSlideDirective = (function (_super) {
        __extends(ImageSlideDirective, _super);
        function ImageSlideDirective() {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.E;
            this.templateUrl = 'ImageSlide.html';
            this.scope.images = ngstd.BindingRestrict.OptionalBoth;
            this.scope.interval = ngstd.BindingRestrict.In;
            this.scope.transition = ngstd.BindingRestrict.In;
            this.controller = ImageSlideController;
        }
        return ImageSlideDirective;
    }(ngstd.AngularDirective));
    ngstd.ImageSlideDirective = ImageSlideDirective;
    var CaptchaController = (function () {
        function CaptchaController($http, $scope, $element) {
            var _this = this;
            this.refresh = function () {
                _this.link = 'captcha.php?rand=' + Math.random() * 1000;
            };
            this.codeLoaded = function (e) {
                if (_this.scope.changed)
                    _this.scope.changed();
            };
            this.scope = $scope;
            $scope.refresh = this.refresh;
            var img = $element.children('img');
            img.on('load', this.codeLoaded);
            this.refresh();
        }
        CaptchaController.$inject = ngInject[ns.http, ns.scope, ns.element];
        return CaptchaController;
    }());
    ngstd.CaptchaController = CaptchaController;
    var CaptchaDirective = (function (_super) {
        __extends(CaptchaDirective, _super);
        function CaptchaDirective() {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.E;
            this.template = '<img ng-src="{{cap.link}}">';
            this.scope.refresh = ngstd.BindingRestrict.Both;
            this.scope.changed = ngstd.BindingRestrict.OptionalBoth;
            this.controller = CaptchaController;
            this.controllerAs = 'cap';
        }
        return CaptchaDirective;
    }(ngstd.AngularDirective));
    ngstd.CaptchaDirective = CaptchaDirective;
    var FileUploadInfo = (function () {
        function FileUploadInfo() {
        }
        return FileUploadInfo;
    }());
    ngstd.FileUploadInfo = FileUploadInfo;
    var FileUploadController = (function () {
        function FileUploadController($http, $scope, $element) {
            var _this = this;
            this.$inject = ['$http', '$scope', '$element'];
            this.uploadFile = function () {
                if (_this.file.files.length == 0)
                    return;
                var inputFile = _this.file.files[0];
                if (_this.scope.sizeLimit) {
                    if (inputFile.size > _this.scope.sizeLimit) {
                        var _limit = '';
                        if (_this.scope.sizeLimit > 1024 * 1024) {
                            _limit = Math.round(_this.scope.sizeLimit / 1024 / 1024) + "MB";
                        }
                        else {
                            if (_this.scope.sizeLimit > 1024) {
                                _limit = Math.round(_this.scope.sizeLimit / 1024) + "KB";
                            }
                            else {
                                _limit = Math.round(_this.scope.sizeLimit) + "B";
                            }
                        }
                        _this.scope.message = "File must be smaller than " + _limit + ".";
                        return;
                    }
                }
                var data = new FormData();
                data.append('file', inputFile);
                data.append('path', _this.scope.path);
                _this.scope.disabled = true;
                _this.scope.message = 'Uploading...';
                //console.log(data);
                _this.http.post('fileupload.php', data, {
                    withCredentials: true,
                    headers: { 'Content-Type': undefined },
                    transformRequest: angular.identity
                })
                    .success(_this.uploadSuccess)
                    .error(_this.uploadError);
                //console.log('input type:file value = ' + this.file.value);
                _this.file.value = null;
            };
            this.uploadSuccess = function (data) {
                //console.log(data);
                _this.scope.disabled = false;
                _this.scope.message = 'Uploaded';
                _this.scope.filename = data.filename;
                if (_this.scope.uploaded) {
                    _this.scope.uploaded(data.filename, _this.scope.context);
                }
            };
            this.uploadError = function (data) {
                console.log(data);
            };
            this.http = $http;
            this.scope = $scope;
            this.element = $element;
            this.file = ($element.children("input")[0]);
            this.file.onchange = this.uploadFile;
        }
        return FileUploadController;
    }());
    ngstd.FileUploadController = FileUploadController;
    var FileUploadDirective = (function (_super) {
        __extends(FileUploadDirective, _super);
        function FileUploadDirective() {
            _super.call(this);
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
        return FileUploadDirective;
    }(ngstd.AngularDirective));
    ngstd.FileUploadDirective = FileUploadDirective;
})(ngstd || (ngstd = {}));
/**
 * PHPPostObj is used to post command to the php service; It is used by the rpc.html and php.html;
 */
var PHPPostObj = (function () {
    function PHPPostObj() {
        this.value = [];
    }
    return PHPPostObj;
}());
/**
 * FileBuilder is the interface to make php service to create/write specific file on the server side; It is used by rpc.html and php.html;
 */
var FileBuiler = (function () {
    function FileBuiler() {
    }
    return FileBuiler;
}());
/**
 * CompilerInclude defines patterns required by RPC and PHP compiler;
 */
var CompilerPattern = (function () {
    function CompilerPattern() {
    }
    CompilerPattern.ptnRPCInclude = /\/\/rpc(\s+include\s+(('[\w\d]+'\s*)*)|)\s*/ig;
    CompilerPattern.ptnIncludeFile = /'([\w\-]+)'/ig;
    CompilerPattern.ptnPHPInclude = /\/\/php(\s+include\s+(('[\w\d]+'\s*)*)|)\s*/ig;
    CompilerPattern.ptnService = /(^|\n)\s*(export\s+|)(interface|class)\s+(\w+)\s*\{/g;
    return CompilerPattern;
}());
/**
 * The standard pattern libraries for analyzing typescript entities;
 */
var StdPatterns = (function () {
    function StdPatterns() {
    }
    StdPatterns.ptnModule = /(^|\n)\s*module\s+(\w+)\s*\{/g;
    StdPatterns.ptnClass = /(^|\n)\s*(export\s+|)class\s+(\w+)\s*\{/g;
    StdPatterns.ptnInterface = /(^|\n)\s*(export\s+|)interface\s+(\w+)\s*\{/g;
    StdPatterns.ptnInterfaceMethod = /([\w][\w\d\.]*)\s*\(((\s*([\w][\w\d\.]*)\s*\:\s*([\w][\w\d\.]*)(|\s*\[\s*\])\s*(|\,))*)\)\s*\:\s*(([\w][\w\d\.]*)(\s*\[\s*\]|))/g;
    StdPatterns.ptnParameter = /\s*([\w][\w\d\.]*)\s*\:\s*(([\w][\w\d\.]*)\s*(\[\s*\]|))/g;
    return StdPatterns;
}());
/**
 * class for registering RPC calls for remote service; you must pass the $http service to this class so as to make RPC calls work;
 */
var RPC = (function () {
    function RPC() {
    }
    RPC.post = function (url, data, returntype, _SuccessCallback, _ErrorCallback) {
        switch (returntype) {
            case 'boolean':
                RPC.http.post(url, data)
                    .success(function (data, status, headers, config) {
                    var value = false;
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
                                    if (num)
                                        value = true;
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
                    else if (typeof data == "object") {
                        if (data)
                            value = true;
                    }
                    _SuccessCallback(value, status, headers, config);
                })
                    .error(_ErrorCallback);
                break;
            case 'number':
                RPC.http.post(url, data)
                    .success(function (data, status, headers, config) {
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
                    .success(function (data, status, headers, config) {
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
    };
    return RPC;
}());
var CancelBeforeTimeout = (function () {
    function CancelBeforeTimeout($timeout, $interval, $call) {
        var _this = this;
        this.trigger = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            _this.timeout.cancel(_this.promise);
            _this.promise = _this.timeout(_this.call, _this.interval, false, args);
            //this.lastTriggerTime = Date.now();
        };
        this.timeout = $timeout;
        this.interval = $interval;
        this.call = $call;
    }
    return CancelBeforeTimeout;
}());
var DecimalNumber = (function () {
    function DecimalNumber(value) {
        var _this = this;
        this.add = function (value) {
            var min = Math.min(value.minIndex, _this.minIndex);
            var max = Math.max(value.maxIndex, _this.maxIndex);
            var res = new DecimalNumber();
            res.minIndex = min;
            res.maxIndex = max;
            for (var i = min; i <= max; i++) {
                res.digits[i] = (value.positive ? 1 : -1) * (value.digits[i] ? value.digits[i] : 0) +
                    (_this.positive ? 1 : -1) * (_this.digits[i] ? _this.digits[i] : 0);
            }
            res.cleanDigits();
            return res;
        };
        this.subtract = function (value) {
            var min = Math.min(value.minIndex, _this.minIndex);
            var max = Math.max(value.maxIndex, _this.maxIndex);
            var res = new DecimalNumber();
            res.minIndex = min;
            res.maxIndex = max;
            for (var i = min; i <= max; i++) {
                res.digits[i] = (value.positive ? -1 : 1) * (value.digits[i] ? value.digits[i] : 0) +
                    (_this.positive ? 1 : -1) * (_this.digits[i] ? _this.digits[i] : 0);
            }
            res.cleanDigits();
            return res;
        };
        this.multiply = function (value) {
            var decimalValue = new DecimalNumber(value);
            var res = new DecimalNumber();
            res.minIndex = _this.minIndex + decimalValue.minIndex;
            res.maxIndex = _this.maxIndex + decimalValue.maxIndex;
            for (var i = _this.minIndex; i <= _this.maxIndex; i++) {
                for (var j = decimalValue.minIndex; j <= decimalValue.maxIndex; j++) {
                    if (!res.digits[i + j])
                        res.digits[i + j] = 0;
                    res.digits[i + j] += (decimalValue.positive ? 1 : -1) * (decimalValue.digits[j] ? decimalValue.digits[j] : 0) *
                        (_this.positive ? 1 : -1) * (_this.digits[i] ? _this.digits[i] : 0);
                }
            }
            res.cleanDigits();
            return res;
        };
        this.times = function (value) {
            if (!value)
                value = 0;
            var min = _this.minIndex;
            var max = _this.maxIndex;
            var res = new DecimalNumber();
            res.minIndex = min;
            res.maxIndex = max;
            for (var i = min; i <= max; i++) {
                res.digits[i] = (_this.positive ? value : -value) * (_this.digits[i] ? _this.digits[i] : 0);
            }
            res.cleanDigits();
            return res;
        };
        this.divide = function (value, accuracy) {
            //default accuracy is 6 digits;
            var decimalValue = new DecimalNumber(1 / (new DecimalNumber(value)).toNumber());
            decimalValue.dropDigitsAfter(accuracy);
            return _this.multiply(decimalValue);
        };
        this.divideby = function (value, accuracy) {
            //default accuracy is 6 digits;
            var divider = new DecimalNumber(value);
            var res = new DecimalNumber();
            //res.positive = this.positive ? divider.positive : !divider.positive;
            accuracy = Math.abs(DecimalNumber.validateNumber(accuracy, 6));
            var dec = _this.clone();
            if (!divider.positive) {
                dec.positive = !dec.positive;
                divider.positive = true;
            }
            var dec2sci = function (dValue) {
                var foundFirst = false;
                var values = [];
                //if (!dValue.positive) values.push('-');
                for (var i = dValue.maxIndex; i >= dValue.minIndex; i--) {
                    if (foundFirst) {
                        values.push(dValue.digits[i] ? dValue.digits[i].toString() : '0');
                    }
                    else {
                        if (dValue.digits[i])
                            if (dValue.digits[i] != 0) {
                                values.push(dValue.digits[i].toString(), '.');
                                foundFirst = true;
                            }
                    }
                }
                return Number(values.join(''));
            };
            var subtracttimes = function (host, base, multiplier) {
                var remover = base.multiply(multiplier);
                //console.log('      host: ' + host.toString());
                //console.log('      base: ' + base.toString());
                //console.log('multiplier: ' + multiplier.toString());
                //console.log('   remover: ' + remover.toString());
                return host.subtract(remover);
            };
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
                if (dec.isZero)
                    break;
                if (whilecount > DecimalNumber.dividingLimit)
                    break;
            }
            return res;
        };
        this.digitOffset = function (value) {
            value = DecimalNumber.validateNumber(value, 0);
            var dec = new DecimalNumber();
            for (var i = _this.minIndex; i <= _this.maxIndex; i++) {
                dec.digits[i + value] = _this.digits[i];
            }
            dec.maxIndex = _this.maxIndex + value;
            dec.minIndex = _this.minIndex + value;
            dec.positive = _this.positive;
            return dec;
        };
        this.clone = function () {
            var dec = new DecimalNumber();
            dec.minIndex = _this.minIndex;
            dec.maxIndex = _this.maxIndex;
            dec.positive = _this.positive;
            for (var i = _this.minIndex; i <= _this.maxIndex; i++) {
                dec.digits[i] = _this.digits[i];
            }
            return dec;
        };
        this.dropDigitsAfter = function (accuracy) {
            accuracy = Math.abs(DecimalNumber.validateNumber(accuracy, 6));
            for (var i = -accuracy - 1; i >= _this.minIndex; i--) {
                _this.digits[i] = undefined;
            }
            _this.minIndex = -accuracy;
        };
        this.keepDigitsOf = function (accuracy) {
            accuracy = Math.abs(DecimalNumber.validateNumber(accuracy, 6));
            for (var i = _this.maxIndex - accuracy - 1; i >= _this.minIndex; i--) {
                _this.digits[i] = undefined;
            }
            _this.minIndex = _this.maxIndex - accuracy;
        };
        this.cleanDigits = function () {
            var index = _this.minIndex;
            var forNext = 0;
            var whilecount = 0;
            while (index <= _this.maxIndex || forNext != 0) {
                if (!_this.digits[index])
                    _this.digits[index] = 0;
                //console.log(index.toString() + ' before: ' + this.digits[index].toString());
                _this.digits[index] += forNext;
                forNext = 0;
                if (_this.digits[index] > 9) {
                    forNext = (_this.digits[index] - (_this.digits[index] % 10)) / 10;
                    _this.digits[index] = _this.digits[index] % 10;
                }
                if (_this.digits[index] < -9) {
                    forNext = (_this.digits[index] + ((-_this.digits[index]) % 10)) / 10;
                    _this.digits[index] = _this.digits[index] % 10;
                }
                //console.log(index.toString() + ' after: ' + this.digits[index].toString());
                //console.log(index.toString() + ' forNext: ' + forNext.toString());
                index += 1;
                whilecount += 1;
            }
            //console.log(this.toListString());
            if (_this.maxIndex < index)
                _this.maxIndex = index;
            whilecount = 0;
            //work out positive or negative;
            for (var i = _this.maxIndex; i >= _this.minIndex; i--) {
                if (!_this.digits[i])
                    _this.digits[i] = 0;
                if (_this.digits[i] != 0) {
                    if (_this.digits[i] > 0) {
                        _this.positive = true;
                    }
                    else {
                        _this.positive = false;
                    }
                    break;
                }
            }
            //turn to positive
            if (!_this.positive) {
                for (var i = _this.maxIndex; i >= _this.minIndex; i--) {
                    _this.digits[i] = -_this.digits[i];
                }
            }
            //clean negatives
            forNext = 0;
            for (var i = _this.minIndex; i <= _this.maxIndex; i++) {
                _this.digits[i] += forNext;
                forNext = 0;
                if (_this.digits[i] < 0) {
                    _this.digits[i] += 10;
                    forNext = -1;
                }
            }
            //clear zeros;
            while ((!_this.digits[_this.maxIndex] || _this.digits[_this.maxIndex] == 0) && _this.maxIndex > 0) {
                _this.digits[_this.maxIndex] = undefined;
                _this.maxIndex -= 1;
            }
            while ((!_this.digits[_this.minIndex] || _this.digits[_this.minIndex] == 0) && _this.minIndex < 0) {
                _this.digits[_this.minIndex] = undefined;
                _this.minIndex += 1;
            }
        };
        this.toString = function () {
            var builder = [];
            for (var i = Math.max(0, _this.maxIndex); i >= _this.minIndex; i--) {
                builder.push(_this.digits[i] ? _this.digits[i].toString() : '0');
                if (i == 0)
                    builder.push('.');
            }
            return (_this.positive ? '' : '-') + builder.join('');
        };
        this.toNumber = function () {
            return Number(_this.toString());
        };
        this.toDecimal = function (accuracy) {
            accuracy = Math.abs(Math.round(accuracy));
            var builder = [];
            for (var i = Math.max(0, _this.maxIndex); i >= (-accuracy); i--) {
                builder.push(_this.digits[i] ? _this.digits[i].toString() : '0');
                if (i == 0)
                    builder.push('.');
            }
            return (_this.positive ? '' : '-') + builder.join('');
        };
        this.toListString = function () {
            var builder = [];
            for (var i = _this.maxIndex; i >= _this.minIndex; i--) {
                builder.push(_this.digits[i] ? _this.digits[i].toString() : '0');
                if (i == 0)
                    builder.push('.');
            }
            return (_this.positive ? '' : '-') + builder.join(' ');
        };
        var stringValue;
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
                    var dec = value;
                    var minKey = 0;
                    var maxKey = 0;
                    if (dec.digits)
                        if (Array.isArray(dec.digits)) {
                            this.digits = [];
                            for (var key in dec.digits) {
                                if (!isNaN(Number(key))) {
                                    var _key = Math.round(Number(key));
                                    if (_key < minKey)
                                        minKey = _key;
                                    if (_key > maxKey)
                                        maxKey = _key;
                                    this.digits[_key] = 0;
                                    if (dec.digits[key])
                                        if (!isNaN(Number(dec.digits[key]))) {
                                            this.digits[_key] = Number(dec.digits[key]);
                                        }
                                }
                            }
                            this.minIndex = minKey;
                            this.maxIndex = maxKey;
                            this.positive = true;
                            this.cleanDigits();
                            return; //can stop here as we have parsed the object;
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
            }
            else {
                this.positive = true;
            }
            var dotIndex = stringValue.indexOf('.');
            this.digits = [];
            if (dotIndex == -1) {
                this.maxIndex = stringValue.length - 1;
                this.minIndex = 0;
                for (var i = 0; i < stringValue.length; i++) {
                    this.digits[stringValue.length - i - 1] = Number(stringValue.charAt(i));
                }
            }
            else {
                this.maxIndex = dotIndex - 1;
                this.minIndex = dotIndex - stringValue.length + 1;
                for (var i = 0; i < dotIndex; i++) {
                    this.digits[dotIndex - i - 1] = Number(stringValue.charAt(i));
                }
                for (var i = dotIndex + 1; i < stringValue.length; i++) {
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
    DecimalNumber.formatter = function (value) {
        var hasNegative = value.indexOf('-') > -1;
        var firstDot = value.indexOf('.');
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
        if (firstDot == 0)
            value = '0' + value;
        return hasNegative ? '-' + value : value;
    };
    Object.defineProperty(DecimalNumber.prototype, "isZero", {
        get: function () {
            for (var i = this.maxIndex; i >= this.minIndex; i--) {
                if (this.digits[i])
                    if (this.digits[i] != 0) {
                        return false;
                    }
            }
            return true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DecimalNumber.prototype, "realMaxIndex", {
        get: function () {
            for (var i = this.maxIndex; i >= this.minIndex; i--) {
                if (this.digits[i])
                    if (this.digits[i] != 0) {
                        return i;
                    }
            }
            console.log('getting minIndex: ' + this.minIndex.toString() + ' while maxIndex: ' + this.maxIndex.toString());
            return this.minIndex;
        },
        enumerable: true,
        configurable: true
    });
    DecimalNumber.validateNumber = function (value, defalutValue) {
        if (!defalutValue)
            defalutValue = 0;
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
    };
    DecimalNumber.dividingLimit = 100;
    return DecimalNumber;
}());
var FieldViews = (function () {
    function FieldViews() {
    }
    FieldViews.BuildView = function (view, model, placeholder, attributes) {
        var builder = [];
        switch (view) {
            case FieldViews.Input_Number_Readonly:
                builder.push('<input type="number" class="form-control" ng-readonly="true" ng-model="', model, '" placeholder="', placeholder, '" ', attributes, '/>');
                break;
            case FieldViews.Input_Number:
                builder.push('<input type="number" class="form-control" ng-model="', model, '" placeholder="', placeholder, '" ', attributes, '/>');
                break;
            case FieldViews.Input_Text:
                builder.push('<input type="text" class="form-control" ng-model="', model, '" placeholder="', placeholder, '" ', attributes, '/>');
                break;
            case FieldViews.Input_Text_Decimal:
                builder.push('<input type="text" decimal class="form-control" ng-model="', model, '" placeholder="', placeholder, '" ', attributes, '/>');
                break;
            case FieldViews.Input_Checkbox:
                builder.push('<label><input type="checkbox" class="form-control" ng-model="', model, '" ', attributes, ' bool2str/>', placeholder, '</label>');
                break;
            case FieldViews.TextArea:
                builder.push('<textarea class="form-control" ng-model="', model, '" placeholder="', placeholder, '" ', attributes, '></textarea>');
                break;
            case FieldViews.ImageMultiple:
                builder.push('<image-editor multiple="true" ng-model="', model, '" ', attributes, '></image-editor>');
                break;
            case FieldViews.ImageSingle:
                builder.push('<image-editor ng-model="', model, '" ', attributes, '></image-editor>');
                break;
            case FieldViews.Date:
                builder.push('<md-datepicker ng-model="', model, '" string2date md-placeholder="', placeholder, '" ', attributes, '></md-datepicker>');
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
    };
    FieldViews.Input_Number_Readonly = 'input/number:readonly';
    FieldViews.Input_Number = 'input/number';
    FieldViews.Input_Text = 'input/text';
    FieldViews.Input_Text_Decimal = 'input/text:decimal';
    FieldViews.Input_Checkbox = 'input/checkbox';
    FieldViews.TextArea = 'textarea';
    FieldViews.ImageMultiple = 'image/multiple';
    FieldViews.ImageSingle = 'image/single';
    FieldViews.Date = 'date';
    FieldViews.Time = 'time';
    FieldViews.DateTime = 'datetime';
    return FieldViews;
}());
var StdDataHandler = (function () {
    function StdDataHandler(_items, _tableDef, _itemBuilder) {
        var _this = this;
        this.getModifedItems = function () {
            var arr = [];
            var items = _this.items();
            if (items) {
                for (var i = 0; i < items.length; i++) {
                    if (TableItem.requiresUpdate(items[i])) {
                        arr.push(items[i]);
                    }
                }
            }
            return arr;
        };
        this.findItemByHashKey = function (key) {
            var items = _this.items();
            if (items) {
                for (var i = 0; i < items.length; i++) {
                    if (TableItem.hashKey(items[i]) == key)
                        return items[i];
                }
            }
            else
                return null;
        };
        this.updateItemsCallback = function (_items) {
            var items = _this.items();
            var arr = jsonArray2Array(_items);
            var def = _this.tableDef();
            for (var i = 0; i < arr.length; i++) {
                var item = arr[i];
                var local = _this.findItemByHashKey(TableItem.getRemoteHashKey(item));
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
        };
        this.items = _items;
        this.tableDef = _tableDef;
        this.itemBuilder = _itemBuilder;
    }
    StdDataHandler.prototype.insert = function () {
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
    };
    StdDataHandler.prototype.change = function (item) {
        TableItem.setChanged(item);
    };
    StdDataHandler.prototype.delete = function (item) {
        TableItem.setToBeDeleted(item);
        var items = this.items();
        if (TableItem.isNew(item)) {
            var index = items.indexOf(item);
            if (index > -1)
                items.splice(index, 1);
        }
    };
    StdDataHandler.prototype.canDelete = function (item) {
        return !TableItem.isToBeDeleted(item);
    };
    StdDataHandler.prototype.canRecover = function (item) {
        return TableItem.isToBeDeleted(item);
    };
    StdDataHandler.prototype.recover = function (item) {
        TableItem.setBackChanged(item);
    };
    StdDataHandler.singleItemCallback = function (def, _callbackItem, _localItem) {
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
    };
    StdDataHandler.useAsLocal = function (obj) {
        if (Array.isArray(obj)) {
            var arr = obj;
            for (var i = 0; i < arr.length; i++) {
                StdDataHandler.useAsLocal(arr[i]);
            }
        }
        else {
            if (obj['@@Table'] && obj['@@Schema']) {
                obj['@@Remote'] = 'ready';
            }
        }
        return obj;
    };
    return StdDataHandler;
}());
//# sourceMappingURL=ngstd.js.map