var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var viewmodel;
(function (viewmodel) {
    var ContentTemplate = (function () {
        function ContentTemplate() {
        }
        return ContentTemplate;
    }());
    viewmodel.ContentTemplate = ContentTemplate;
    var ContentDirective = (function (_super) {
        __extends(ContentDirective, _super);
        function ContentDirective($compile, $http) {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.E;
            this.link = function (scope, element, attrs) {
                //this will remove all the templates in the content;
                element.children('template').each(function (index, elem) {
                    var $elem = $(elem);
                    var template = new ContentTemplate();
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
                            if (scope.selector)
                                if (scope.view != scope.selector(scope.data, scope.templates)) {
                                    //if view is affected, view must be updated.
                                    scope.view = scope.selector(scope.data, scope.templates);
                                }
                        });
                    }
                    else {
                        template.template = $elem.html();
                    }
                    scope.templates.push(template);
                });
                element.children('template').remove();
                scope.presentor = element.find('div[presentor]');
                if (!scope.presentor) {
                    console.log('Fetal Error in Content Directive: No <div presentor></div> node was found. You must provide one <div presentor></div> in the Content Directive to present the data.');
                }
                scope.$watch('data', function (newValue, oldValue) {
                    if (scope.modelbuilder) {
                        scope.model = scope.modelbuilder(newValue);
                    }
                    if (scope.selector) {
                        var template = scope.selector(newValue, scope.templates);
                        if (template)
                            scope.view = template;
                    }
                });
                scope.$watch('view', function (newValue, oldValue) {
                    //distroy all child elements in the element.
                    if (scope.childscope) {
                        scope.childscope.$destroy(); //destroy the child scope
                        element.children().remove(); //remove each of the child elments
                    }
                    //create a new child scope.
                    scope.childscope = scope.$new();
                    //append the complied element
                    if (scope.presentor)
                        scope.presentor.append($compile(newValue)(scope.childscope));
                });
                ;
            };
        }
        return ContentDirective;
    }(ngstd.AngularDirective));
    viewmodel.ContentDirective = ContentDirective;
})(viewmodel || (viewmodel = {}));
//# sourceMappingURL=viewmodel.js.map