// to be used by remote procedure calls
var rpc = (function () {
    function rpc() {
    }
    return rpc;
}());
var FieldDef = (function () {
    function FieldDef(_name, _view, _sqlBinding) {
        this.name = _name;
        this.view = _view;
        this.sqlBinding = _sqlBinding;
    }
    return FieldDef;
}());
var TableItem = (function () {
    function TableItem() {
    }
    TableItem.setRemoteReady = function (item) {
        item['@@Remote'] = 'ready';
    };
    TableItem.isRemoteReady = function (item) {
        return item['@@Remote'] == 'ready';
    };
    TableItem.setRemoteSynchronizing = function (item) {
        item['@@Remote'] = 'synchronizing';
    };
    TableItem.isRemoteSynchronizing = function (item) {
        return item['@@Remote'] == 'synchronizing';
    };
    TableItem.markType = function (def, item) {
        item['@@Table'] = def._TableName;
        item['@@Schema'] = def._SchemaName;
    };
    TableItem.getStatus = function (item) {
        return item['@@Status'];
    };
    TableItem.getTable = function (item) {
        return item['@@Table'];
    };
    TableItem.getSchema = function (item) {
        return item['@@Schema'];
    };
    TableItem.setStatus = function (item, value) {
        item['@@Status'] = value;
    };
    TableItem.setNew = function (item) {
        item['@@Status'] = 'new';
    };
    TableItem.setLoaded = function (item) {
        item['@@Status'] = 'loaded';
    };
    TableItem.requiresUpdate = function (item) {
        if (item['@@Remote'] != 'synchronizing' && (item['@@Status'] == 'new' || item['@@Status'] == 'to be deleted' || item['@@Status'] == 'changed')) {
            item['@@hashKey'] = item['$$hashKey'];
            item['@@Error'] = undefined;
            item['@@Remote'] = 'synchronizing';
            return true;
        }
        else {
            return false;
        }
    };
    TableItem.hashKey = function (item) {
        return item['$$hashKey'];
    };
    TableItem.setRemoteHashKey = function (item) {
        if (item['$$hashKey']) {
            item['@@hashKey'] = item['$$hashKey'];
            return true;
        }
        else {
            return false;
        }
    };
    TableItem.getRemoteHashKey = function (item) {
        return item['@@hashKey'];
    };
    TableItem.setToBeDeleted = function (item) {
        item['@@Status'] = 'to be deleted';
    };
    TableItem.isToBeDeleted = function (item) {
        return item['@@Status'] == 'to be deleted';
    };
    TableItem.setChanged = function (item) {
        if (item['@@Status'] == 'new' || item['@@Status'] == 'to be deleted') {
        }
        else {
            item['@@Status'] = 'changed';
        }
    };
    TableItem.setInserted = function (item) {
        item['@@Status'] = 'inserted';
    };
    TableItem.isInserted = function (item) {
        return item['@@Status'] == 'inserted';
    };
    TableItem.setUpdated = function (item) {
        item['@@Status'] = 'updated';
    };
    TableItem.isUpdated = function (item) {
        return item['@@Status'] == 'updated';
    };
    TableItem.isError = function (item) {
        return item['@@Status'] == 'error';
    };
    TableItem.setDeleted = function (item) {
        item['@@Status'] = 'deleted';
    };
    TableItem.clearError = function (item) {
        item['@@Error'] = undefined;
    };
    TableItem.setError = function (item, value) {
        item['@@Status'] = 'error';
        item['@@Error'] = value;
    };
    TableItem.getError = function (item) {
        return item['@@Error'];
    };
    TableItem.setBackChanged = function (item) {
        item['@@Status'] = 'changed';
    };
    TableItem.isNew = function (item) {
        return item['@@Status'] == 'new';
    };
    TableItem.isLoaded = function (item) {
        return item['@@Status'] == 'loaded';
    };
    TableItem.isChanged = function (item) {
        return item['@@Status'] == 'changed';
    };
    TableItem.isDeleted = function (item) {
        return item['@@Status'] == 'deleted';
    };
    return TableItem;
}());
//# sourceMappingURL=rpcdef.js.map