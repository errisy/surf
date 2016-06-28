module AceEditor {
    /**
     * The editor directve must be initialized when it is visible; if it is not visible at the very beginning of your app, you need to specifiy init same as the ngShow condition
     * @param app
     */
    export function EnableAceDirective(app: ngstd.AngularModule) {
        app.addDirective('ace', () => new AceEditorDirective());
    }
    interface IAceEditorScope extends ng.IScope {
        ace: ace.Editor;
        theme: string;
        session: string;
        init: () => boolean;
    }
    interface IAceEditorDirectiveScope extends ng.IScope {
        ace: string;
        theme: string;
        session: string;
        init: string;
    }
    class AceEditorDirective extends ngstd.AngularDirective<IAceEditorDirectiveScope>{
        constructor() {
            super();
            this.restrict = ngstd.DirectiveRestrict.A;
            this.scope.ace = ngstd.BindingRestrict.OptionalBoth;
            this.scope.theme = ngstd.BindingRestrict.OptionalBoth;
            this.scope.session = ngstd.BindingRestrict.OptionalBoth;
            this.scope.init = ngstd.BindingRestrict.Out;
            this.link = (scope: IAceEditorScope, element: ng.IAugmentedJQuery, attr: ng.IAttributes) => {
                var editor = ace.edit(element[0]);
                if (!scope.theme) scope.theme = 'ace/theme/monokai';
                if (!scope.session) scope.session = 'ace/mode/javascript';
                if (scope.init) {
                    var watcher: Function = scope.$watch(() => scope.init(), (nValue: boolean, oValue: boolean) => {
                        if (nValue) {
                            editor.setTheme(scope.theme);
                            editor.getSession().setMode(scope.session);
                            editor.$blockScrolling = Infinity;
                            scope.ace = editor;
                            watcher();//Cancel the watch;
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
            }
        }
    }
}