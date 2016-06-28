declare module ace {
    export function edit(el: string | HTMLElement): Editor; 

    export class Editor {
        public setTheme(theme: string);
        public getSession(): EditSession;
        public getValue(): string;
        public setValue(code: string);
        public $blockScrolling: number;
    }
    export class EditSession {
        public setMode(mode: string);
    }
}