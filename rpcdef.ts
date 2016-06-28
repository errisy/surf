// to be used by remote procedure calls
class rpc {
    service: string;
    method: string;
    parameters: any[];
}
class FieldDef {
    constructor(_name: string, _view: string, _sqlBinding: string) {
        this.name = _name;
        this.view = _view;
        this.sqlBinding = _sqlBinding;
    }
    public name: string;
    public view: string;
    public sqlBinding: string;
}
interface ITableDef {
    _TableName: string;
    _AllFields: FieldDef[];
    //_AllViews: string[];
    _TableCreate: string;
    _TableDrop: string;
    _SchemaName: string;
    _Insert(port: data.port, data: any): mysqli_stmt;
    _Update(port: data.port, data: any): mysqli_stmt;
    _Fetch(port: data.port, id: number): mysqli_stmt;
    _Delete(port: data.port, id: number): mysqli_stmt;
    _New(): any;
    _PrimaryKey: string;
    _getKey(item: any): any;
    _setKey(item: any, key: any): void;
}

class TableItem {
    static setRemoteReady(item: any): void {
        item['@@Remote'] = 'ready';
    }
    static isRemoteReady(item: any):boolean {
        return item['@@Remote'] == 'ready';
    }
    static setRemoteSynchronizing(item: any): void {
        item['@@Remote'] = 'synchronizing';
    }
    static isRemoteSynchronizing(item: any): boolean {
        return item['@@Remote'] == 'synchronizing';
    }
    static markType(def: ITableDef, item: any) {
        item['@@Table'] = def._TableName;
        item['@@Schema'] = def._SchemaName;
    }
    static getStatus(item: any): string {
        return item['@@Status'];
    }
    static getTable(item: any): string {
        return item['@@Table'];
    }
    static getSchema(item: any): string {
        return item['@@Schema'];
    }
    static setStatus(item: any, value: string) {
        item['@@Status'] = value;
    }
    static setNew(item: any):void {
        item['@@Status'] = 'new';
    }
    static setLoaded(item: any):void {
        item['@@Status'] = 'loaded';
    }
    static requiresUpdate(item: any): boolean {
        if (item['@@Remote'] != 'synchronizing' && (item['@@Status'] == 'new' || item['@@Status'] == 'to be deleted' || item['@@Status'] == 'changed')) {
            item['@@hashKey'] = item['$$hashKey'];
            item['@@Error'] = undefined;
            item['@@Remote'] = 'synchronizing';
            return true;
        }
        else {
            return false;
        }
    }
    static hashKey(item: any): string {
        return item['$$hashKey'];
    }
    static setRemoteHashKey(item: any): boolean {
        if (item['$$hashKey']) {
            item['@@hashKey'] = item['$$hashKey'];
            return true;
        }
        else {
            return false;
        }
    }
    static getRemoteHashKey(item: any): string {
        return item['@@hashKey'];
    }
    static setToBeDeleted(item: any): void {
        item['@@Status'] = 'to be deleted';
    }
    static isToBeDeleted(item: any): boolean {
        return item['@@Status'] == 'to be deleted';
    }
    static setChanged(item: any) {
        if (item['@@Status'] == 'new' || item['@@Status'] == 'to be deleted') {
        }
        else {
            item['@@Status'] = 'changed';
        }
    }
    static setInserted(item: any): void {
        item['@@Status'] = 'inserted';
    }
    static isInserted(item: any): boolean {
        return item['@@Status'] == 'inserted';
    }
    static setUpdated(item: any) {
        item['@@Status'] = 'updated';
    }
    static isUpdated(item: any): boolean {
        return item['@@Status'] == 'updated';
    }
    static isError(item: any): boolean {
        return item['@@Status'] == 'error';
    }
    static setDeleted(item: any): void {
        item['@@Status'] = 'deleted';
    }
    static clearError(item: any): void {
        item['@@Error'] = undefined;
    }
    static setError(item: any, value: string) {
        item['@@Status'] = 'error';
        item['@@Error'] = value;
    }
    static getError(item: any): string {
        return item['@@Error'];
    }
    static setBackChanged(item: any): void {
        item['@@Status'] = 'changed';
    }
    static isNew(item: any): boolean {
        return item['@@Status'] == 'new';
    }
    static isLoaded(item: any): boolean {
        return item['@@Status'] == 'loaded';
    }
    static isChanged(item: any): boolean {
        return item['@@Status'] == 'changed';
    }
    static isDeleted(item: any): boolean {
        return item['@@Status'] == 'deleted';
    }
}