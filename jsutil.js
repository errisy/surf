//in order to make php functions compatible in js, we define js functions for php here.
function array() {
    var arr = [];
    for (i = 0 ; i < arguments.length; i++) {
        arr.push(arguments[i]);
    }
    return arr;
}

function array_push(arr, item) {
    arr.push(item);
}

//var callIteration = 0;
function json2object(source, level) {

    //callIteration += 1;
    //if (callIteration > 2000) return;
    if (typeof source == 'object') {
        if (source == null) return source;
        if (source['@@Table'] && source['@@Schema']) {

            var obj = eval('new ' + source['@@Schema'] + '.' + source['@@Table'] + '()');
            //console.log('json2object can new', source['@@Table'], 'level:', level);
            for (key in source) {
                if (key != '$$hashKey') {
                    var value = source[key];
                    if (Array.isArray(value)) {
                        //console.log('array:',key, value);
                        obj[key] = jsonArray2Array(value, level + 1);
                    }
                    else {
                        //console.log('object',key, value);
                        //if (value == null) console.log('null value: ', source, key);
                        obj[key] = json2object(value, level + 1);
                    }
                }
            }
            return obj;
        }
    }
    return source;

}

function jsonArray2Array(source, level) {
    //callIteration += 1;
    //if (callIteration > 2000) return;
        if (!level) level = 0;
        if (Array.isArray(source)) {
            //console.log('jsonArray2Array: is Array: begin parse:', source, 'level:', level);
            var arr = [];
            source.forEach((value) => {
                //console.log('jsonArray2Array', value)
                arr.push(json2object(value, level + 1));
            });
            return arr;
        }
        return source;

}

function num2str(value) {
    return value.toString();
}
function str2num(value) {
    return Number(value);
}
function echo(value) {
    console.log(value);
}
