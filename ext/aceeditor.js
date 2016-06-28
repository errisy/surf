var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var AceEditor;
(function (AceEditor) {
    /**
     * The editor directve must be initialized when it is visible; if it is not visible at the very beginning of your app, you need to specifiy init same as the ngShow condition
     * @param app
     */
    function EnableAceDirective(app) {
        app.addDirective('ace', function () { return new AceEditorDirective(); });
    }
    AceEditor.EnableAceDirective = EnableAceDirective;
    var AceEditorDirective = (function (_super) {
        __extends(AceEditorDirective, _super);
        function AceEditorDirective() {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.A;
            this.scope.ace = ngstd.BindingRestrict.OptionalBoth;
            this.scope.theme = ngstd.BindingRestrict.OptionalBoth;
            this.scope.session = ngstd.BindingRestrict.OptionalBoth;
            this.scope.init = ngstd.BindingRestrict.Out;
            this.link = function (scope, element, attr) {
                var editor = ace.edit(element[0]);
                if (!scope.theme)
                    scope.theme = 'ace/theme/monokai';
                if (!scope.session)
                    scope.session = 'ace/mode/javascript';
                if (scope.init) {
                    var watcher = scope.$watch(function () { return scope.init(); }, function (nValue, oValue) {
                        if (nValue) {
                            editor.setTheme(scope.theme);
                            editor.getSession().setMode(scope.session);
                            editor.$blockScrolling = Infinity;
                            scope.ace = editor;
                            watcher(); //Cancel the watch;
                        }
                    });
                }
                else {
                    editor.setTheme(scope.theme);
                    editor.getSession().setMode(scope.session);
                    editor.$blockScrolling = Infinity;
                    scope.ace = editor;
                    console.log('editor initialized.');
                }
                //scope.ace.setValue('hello');
            };
        }
        return AceEditorDirective;
    }(ngstd.AngularDirective));
})(AceEditor || (AceEditor = {}));
//# sourceMappingURL=aceeditor.js.map