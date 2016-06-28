//rpc
module LogService {
    export interface Debug {
        clear(): boolean;
        write(value: string): boolean;
    }
}