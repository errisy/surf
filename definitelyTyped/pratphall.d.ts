declare module Pratphall {
    export class BrowserCompiler {
        public compile(options: PhpEmitOptions, code: string, callback: (compiled: string, errors: any[], warnings: any[]) => void);
    }
    export class PhpEmitOptions {
        public alwaysPreferSingleQuotes: boolean;
        public comments: boolean;
        public typeHint: boolean;
        public useElseif: boolean;
        public forceBlockOnControlStructures: boolean;
        public openingTypeBraceOnNextLine: boolean;
        public openingFunctionBraceNextLine: boolean;
        public indent: string;
    }
}
