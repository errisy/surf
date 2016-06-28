class SectionDivider {
    static sectionsBeforeEachPattern(value: string, pattern: RegExp, includePattern?: boolean): string[] {
        var sections: string[] = [];
        var lastPos: number = 0;
        var mc = pattern.Matches(value);
        for (var i: number = 0; i < mc.length; i++) {
            var m = mc[i];
            sections.push(value.substring(lastPos, includePattern? m.lastIndex: m.index));
            lastPos = includePattern ? m.lastIndex : m.index;
        }
        return sections;
    }
    static sectionsAfterEachPattern(value: string, pattern: RegExp, includePattern?: boolean): string[] {
        var sections: string[] = [];
        var nextPos: number = -1;
        var mc = pattern.Matches(value);
        //console.log('number of sections: '+  mc.length.toString());
        for (var i: number = 0; i < mc.length; i++) {
            var m = mc[i];
            if (i < mc.length - 1) {
                nextPos = mc[i + 1].index;
            }
            else {
                nextPos = value.length;
            }
            sections.push(value.substring(m.index, nextPos));
        }
        return sections;
    }
    static Divide(value: string, pattern: RegExp): string[] {
        var Sections: string[] =[];
        var lastPos: number = -1;
        pattern.Matches(value).forEach((match: RegularExpressionMatch, index: number, array: RegularExpressionMatch[]) => {
            if (lastPos > -1) {
                if (lastPos == 0) {
                    //console.log(value.substr(lastPos, match.index - lastPos));
                    Sections.push(value.substr(lastPos, match.index - lastPos));
                }
                else {
                    //console.log(value.substr(lastPos + 1, match.index - lastPos));
                    Sections.push(value.substr(lastPos + 1, match.index - lastPos));
                }
            }
            lastPos = match.index;
        });
        if (lastPos == 0) {
            Sections.push(value.substr(lastPos));
        }
        else {
            Sections.push(value.substr(lastPos + 1));
        }
        return Sections;
    }
    static DivideWith(value: string, pattern: RegExp, groupIndex: number): string[] {
        var Sections: string[] = [];
        var lastPos: number = -1;
        pattern.Matches(value).forEach((match: RegularExpressionMatch, index: number, array: RegularExpressionMatch[]) => {
            Sections.push(value.substr(lastPos, match.index - lastPos) + (match.groups[2] ? match.groups[2] : ''));
            lastPos = match.index + match.length;
        });
        if (lastPos == 0) {
            Sections.push(value.substr(lastPos));
        }
        else {
            Sections.push(value.substr(lastPos + 1));
        }
        return Sections;
    }
    static SelectSection(Sections: string[], pattern: RegExp): string[] {
        return Sections.filter((value)=>pattern.IsMatch(value));
    }
    static RemoveQuotation(Value: string): string {
        return Value.replace(/^\s*"/g, '').replace(/"\s*$/g, '');
    }
}

class RegularExpressionMatch {
    public index: number;
    public length: number;
    public lastIndex: number;
    public groups: RegExpMatchArray;
}
interface RegExp {
    Matches(value: string): RegularExpressionMatch[];
    Match(value: string): RegularExpressionMatch;
    IsMatch(value: string): boolean;
}

interface String {
    encodeXML(): string;
    /**
     * Replace {N} with Nth object in the augment array;
     * @param args 
     */
    format(...args: any[]): string;
    apply(obj: Object): string;
}
String.prototype.encodeXML = (): string => {
    var that: string = <string>eval('this');
    return that.replace(/[<>&'"]/g, (char:string):string => {
        switch (char) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}
String.prototype.format =  (...args: string[]):string => {
    var that: string = <string>eval('this');
    return that.replace(/{\d+}/g, (char: string): string => {
        var index: number = Number(char.substr(1, char.length - 2));
        return args[index].toString();
    });
}
String.prototype.apply = (obj: Object): string => {
    var that: string = <string>eval('this');
    console.log('String.apply:', obj);
    return that.replace(/\{[\w+\.]+\}/g, (char: string): string => {
        var fields: string[] = char.substr(1, char.length - 2).split('.').filter((field) => field.length > 0);
        console.log('String.apply:', char, obj, fields);
        var value: any = obj;
        while (fields.length > 0) {
            value = value[fields.shift()];
        }
        return value;
    });
}
RegExp.prototype.Matches = (value: string): RegularExpressionMatch[] => {
    var hit: RegExpExecArray;
    var result: RegularExpressionMatch[] = [];
    var that = <RegExp>eval('this');
    while (hit = that.exec(value)) {
        var match: RegularExpressionMatch = new RegularExpressionMatch();
        match.index = hit.index;
        match.lastIndex = that.lastIndex;
        match.length = match.lastIndex - match.index;
        match.groups = hit;
        //console.log('from ' + match.index.toString() + ' to ' + match.lastIndex.toString());
        result.push(match);
    }
    that.lastIndex = 0;
    return result;
}
RegExp.prototype.Match = (value: string): RegularExpressionMatch => {
    var hit: RegExpMatchArray;
    var result: RegularExpressionMatch = null;
    var that = <RegExp>eval('this');
    that.lastIndex = 0;
    if (hit = that.exec(value)) {
        result = new RegularExpressionMatch();
        result.index = hit.index;
        result.lastIndex = that.lastIndex;
        result.length = result.lastIndex - result.index;
        result.groups = hit;
    }
    return result;
}
RegExp.prototype.IsMatch = (value: string): boolean => {
    var that = <RegExp>eval('this');
    that.lastIndex = 0;
    return that.test(value);
}

class Insertion {
    public index: number;
    public value: string;
    static Compare(a: Insertion, b: Insertion): number {
        return (a.index > b.index) ? 1 : ((a.index < b.index) ? -1 : 0);
    }
}

class PasswordUtil {
    static checkPasswordStrength(password: string) {
        var score: number = 0;
        if (password.length < 6) return 0;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score += 1;
        if (password.match(/\d+/)) score += 1;
        if (password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/)) score += 1;
        if (password.length > 12) score += 1;
        return score;
    }
}

class EmailUtil {
    static pattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    static isValid(email: string): boolean {
        return EmailUtil.pattern.IsMatch(email);
    }
}
interface Array<T> {
    onInsert: (array: Array<T>, item: T, index: number) => void;
    onRemoveAt: (array: Array<T>, item: T, index: number) => void;
    onClear: (array: Array<T>) => void;
    onMoveTo: (array: Array<T>, item: T, from: number, to: number) => void;
    /**
     * Observable extension: add item to array;
     * This method will trigger onInsert: (array: Array<T>, item: T, index: number) => void;
     * @param item
     */
    add(item: T);
    /**
     * Observable extension: index item to array at the index position;
     * This method will trigger onInsert: (array: Array<T>, item: T, index: number) => void;
     * @param index
     * @param item
     */
    insert(index: number, item: T);
    /**
     * Observable extension: clear array;
     * This method will trigger onClear: (array: Array<T>) => void;
     */
    clear();
    /**
     * Observable extension: remove item from array;
     * This method will trigger onRemoveAt: (array: Array<T>, item: T, index: number) => void;
     * @param item
     */
    remove(item: T);
    /**
     * Observable extension: remove the indexed item from array;
     * This method will trigger onRemoveAt: (array: Array<T>, item: T, index: number) => void;
     * @param index
     */
    removeAt(index: number);
    /**
     * Observable extension: move item from 'from' to 'to' postion in array;
     * This method will trigger onMoveTo: (array: Array<T>, item: T, from: number, to: number) => void;
     * @param from
     * @param to
     */
    moveTo(from: number, to: number);

    addUnique(item: T): boolean;
    uniqueComparer: (x: T, y: T) => boolean;
    intersectWith(arr: T[]): T[];
    unionWith(arr: T[]): T[];
    contains(item: T): boolean;
    addRange(items: T[]);
    combine(items: T[]): T[];
    clone(): T[];
    count(filter: (value: T, index: number, arr: T[]) => boolean): number;
    sum(accumulator: (value: T, index: number, arr: T[]) => number): number;
    collect<U>(callback: (value: T, index: number, arr: T[]) => U[]): U[];
    collectUnique<U>(callback: (value: T, index: number, arr: T[]) => U[]): U[];
}
Array.prototype.add = (item: any) => {
    var that: any[] = eval('this');
    that.push(item);
    if (that.onInsert) that.onInsert(that, item, that.length);
};
Array.prototype.insert = (item: any, index: number) => {
    var that: any[] = eval('this');
    that.splice(index, 0, item);
    if (that.onInsert) that.onInsert(that, item, index);
};
Array.prototype.clear = () => {
    var that: any[] = eval('this');
    that.splice(0, that.length);
    if (that.onClear) that.onClear(that);
};
Array.prototype.removeAt = (index: number) => {
    var that: any[] = eval('this');
    var item = that[index];
    that.splice(index, 1);
    if (that.onRemoveAt) that.onRemoveAt(that, item, index);
};
Array.prototype.remove = (item: any) => {
    var that: any[] = eval('this');
    var index: number = that.indexOf(item);
    that.splice(index, 1);
    if (that.onRemoveAt) that.onRemoveAt(that, item, index);
};
Array.prototype.moveTo = (from: number, to: number) => {
    var that: any[] = eval('this');
    var item: number = that[from];
    that.splice(from, 1);
    that.splice(to, 0, item);
    if (that.onMoveTo) that.onMoveTo(that, item, from, to);
};
Array.prototype.addUnique = (item: any): boolean => {
    var that: any[] = eval('this');
    if (that.uniqueComparer) {
        if (!that.some((value: any, index: number, array: any[]) => that.uniqueComparer(value, item))) {
            that.add(item);
            return true;
        }
        else {
            return false;
        }
    }
    else {
        if (!that.some((value: any, index: number, array: any[]) => value === item)) {
            that.add(item);
            return true;
        }
        else {
            return false;
        }
    }
};
Array.prototype.contains = (item: any):boolean => {
    var that: any[] = eval('this');
    if (that.uniqueComparer) {
        return that.some((value: any, index: number, array: any[]) => that.uniqueComparer(value, item));
    }
    else {
        return that.some((value: any, index: number, array: any[]) => value === item);
    }
};
Array.prototype.intersectWith = (arr: any[]):any[] => {
    var that: any[] = eval('this');
    var results: any[] = [];
    if (that.uniqueComparer) {
        results.uniqueComparer = that.uniqueComparer;
    }
    else {
        results.uniqueComparer = arr.uniqueComparer;
    }
    for (var i: number = 0; i < that.length; i++) {
        var item = that[i];
        if (that.contains(item) && arr.contains(item))results.addUnique(item);
    }
    for (var i: number = 0; i < arr.length; i++) {
        var item = arr[i];
        if (that.contains(item) && arr.contains(item)) results.addUnique(item);
    }
    return results;
}
Array.prototype.unionWith = (arr: any[]): any[] => {
    var that: any[] = eval('this');
    var results: any[] = [];
    if (that.uniqueComparer) {
        results.uniqueComparer = that.uniqueComparer;
    }
    else {
        results.uniqueComparer = arr.uniqueComparer;
    }
    for (var i: number = 0; i < that.length; i++) {
        results.addUnique(that[i]);
    }
    for (var i: number = 0; i < arr.length; i++) {
        results.addUnique(arr[i]);
    }
    return results;
}
Array.prototype.addRange = (items: any[]) => {
    var that: any[] = eval('this');
    items.forEach((item) => {
        that.push(item);
        if (that.onInsert) that.onInsert(that, item, that.length);
    });
};

Array.prototype.combine = (items: any[]):any[] => {
    var that: any[] = eval('this');
    var arr: any[] = [];
    that.forEach((item) => {
        arr.push(item);
    });
    items.forEach((item) => {
        arr.push(item);
    });
    return arr;
};
Array.prototype.count = (filter: (value: any, index: number, arr: any[]) => boolean): number => {
    var that: any[] = eval('this');
    if (filter) {
        var count: number = 0;
        for (var i: number = 0; i < that.length; i++) {
            var index: number = i;
            count += filter(that[index], index, that) ? 1 : 0;
        }
        return count;
    }
    else {
        return that.length;
    }
}
Array.prototype.sum = (accumulator: (value: any, index: number, arr: any[]) => number): number => {
    var that: any[] = eval('this');
    if (accumulator) {
        var sum: number = 0;
        for (var i: number = 0; i < that.length; i++) {
            var index: number = i;
            sum += accumulator(that[index], index, that);
        }
        return sum;
    }
    else {
        return that.length;
    }
}
Array.prototype.collect = (callback: (value: any, index: number, arr: any[]) => any[]): any[] => {
    var that: any[] = eval('this');
    var results: any[] = [];
    if (callback) {
        for (var i: number = 0; i < that.length; i++) {
            var index: number = i;
            callback(that[index], index, that).forEach((value) => results.push(value));
        }
    }
    return results;
}

Array.prototype.collectUnique = (callback: (value: any, index: number, arr: any[]) => any[]): any[] => {
    var that: any[] = eval('this');
    var results: any[] = [];
    if (callback) {
        for (var i: number = 0; i < that.length; i++) {
            var index: number = i;
            callback(that[index], index, that).forEach((value) => results.addUnique(value));
        }
    }
    return results;
}

class PHPDate {
    static num2date(value: number): string {
        return moment('1970-01-01 00:00:00').add(value, 'second').format('YYYY-MM-DD HH:mm:ss');
    }
    static date2num(value: string): number {
        return moment.duration(moment(value).diff(moment('1970-01-01 00:00:00'))).asSeconds();
    }
    static now(): number {
        return moment.duration(moment().diff(moment('1970-01-01 00:00:00'))).asSeconds();
    }
}

function isValidNumber(value: any):boolean {
    if (typeof value == 'number') {
        return !isNaN(value);
    }
    return false;
}