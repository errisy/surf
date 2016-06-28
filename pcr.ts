/**
 * This class is for the definition of MySQL database from Typescript;
 * Basically, it will generate queries for accessing proper type of database;
 * Each access must be verified by username and password check.
 */
class cf {
    /**
     * Define a variable char with speicific length;
     * @param length
     */
    static VarChar(length: number): string {
        return '';
    };
    /**
     * Define a text field in MySQL
     */
    static Text(): string {
        return '';
    }
    /**
     * Define a decimal number with specific length and scale;
     * @param length
     * @param scale
     */
    static Decimal(length: number, scale: number): string {
        return '';
    };
    /**
     * Define an int number;
     */
    static Int(): number {
        return 0;
    }
    static Bool(): boolean {
        return false;
    }
    /**
     * Define a small int;
     */
    static SmallInt(): number {
        return 0;
    }
    static TinyInt(): number {
        return 0;
    }
    static BigInt(): number {
        return 0;
    }
    static Date(): string {
        return new Date().getDate().toString();
    }
    static Time(): string {
        return new Date().getTime().toString();
    }
    static Datetime(): string {
        return Date.now().toString();
    }
    static TimeStamp(): string {
        return Date.now().toString();
    }
    //Specify default type of view that you may use;
    static InputNumberView():typeof cf {
        return cf;
    }
    static SingleImageView(): typeof cf {
        return cf;
    }
    static MultipleImageView(): typeof cf {
        return cf;
    }
    static TextAreaView(): typeof cf {
        return cf;
    }
    static InputTextView(): typeof cf {
        return cf;
    }
    static DateView(): typeof cf {
        return cf;
    }
    /**
     * Define how a field is linked to other classes;
     * @param keyField You must use '(new Classname).property' expression to assign this;
     */
    static ArrayOf<T>(keyField: string) {
        return null;
    }
    static ReferenceOf<T>(keyField: string) {
        return null;
    }
    static MD5Password() {
        return cf;
    }
    /**
     * By speicify the login method, the php side will create a login method for you to call;
     * However, in order to simplify server logic, we will not create a very complex php query script with built-in login verification.
     * @param info
     */
    static Username() {
        return cf;
    }
    static Password() {
        return cf;
    }
    /**
     * It allows the creation of a new kind of table by the name of that system.
     * @param name
     */
    static SubTable(name: string): string {
        return '';
    }
    static PrimaryKey() {
        return cf;
    }
    static Unique() {
        return cf;
    }
    static ZeroFill() {
        return cf;
    }
    static AutoIncrement() {
        return cf;
    }
    static NotNull() {
        return cf;
    }
    static DefaultString(value: string) {
        return cf;
    }
    static DefaultNumber(value: number) {
        return cf;
    }
    static Verify(entity: Function) {
        return cf;
    }
    static Login<T>(): (http: ng.IHttpService, entity: T) => boolean {
        return (http: ng.IHttpService, entity: T) => { return true };
    }
    static Update<T>(): (http: ng.IHttpService, entity: T) => boolean {
        return (http: ng.IHttpService, entity: T) => { return true };
    }
    static UpdateArray<T>(): (http: ng.IHttpService, entity: T[]) => boolean {
        return (http: ng.IHttpService, entity: T[]) => { return true };
    }
}

interface IQuery {
    query();
}

class CFCompiler {
    public code: string;
    public databases: CFDatabase[] = [];
    constructor(code: string) {
        var arr: CFDatabase[] = [];
        var codeSections = SectionDivider.Divide(code, CFDatabase.ptnModule);
        for (var i: number = 0; i < codeSections.length; i++) {
            var mt = CFDatabase.ptnModule.Match(codeSections[i]);
            var mDatabase = new CFDatabase(codeSections[i]);
            arr.push(mDatabase);
        }
        this.code = code;
        var mc = StdPatterns.ptnModule.Matches(this.code);
        for (var i: number = 0; i < mc.length; i++) {
            var mt = mc[i];
            var begin = this.code.indexOf('{', mt.index) + 1;
            var end: number;
            if (mc[i + 1]) {
                end = this.code.lastIndexOf('}', mc[i + 1].index);
            }
            else {
                end = this.code.lastIndexOf('}', this.code.length);
            }
            var _database = new CFDatabase(this.code.substring(begin, end));
            _database.name = mt.groups[2];
            _database.begin = begin;
            _database.parent = this;
            this.databases.push(_database);
        }
    }
}
class CFDatabase {
    static ptnModule = /^\s*module\s+(\w+)\s*\{/g;
    constructor(value: string) {
        //analyze value to obtain the name of table;
        this.code = value;
        var mc = CompilerPattern.ptnService.Matches(this.code);
        for (var i: number = 0; i < mc.length; i++) {
            var mt = mc[i];
            var begin = this.code.indexOf('{', mt.index) + 1;
            var end: number;
            if (mc[i + 1]) {
                end = this.code.lastIndexOf('}', mc[i + 1].index);
            }
            else {
                end = this.code.lastIndexOf('}', this.code.length);
            }
            var _table = new CFTable(this.code.substring(begin, end));
            _table.parent = this;
            _table.name = mt.groups[4];
            _table.begin = begin;
            this.tables.push(_table);
        }

    }
    public name: string;
    public begin: number;
    public parent: CFCompiler;
    public code: string;
    public tables: CFTable[] = [];
    public getDatabaseCreateQuery(): string {
        var CreateQueries: string[] = [];
        for (var i: number = 0; i < this.tables.length; i++) {
            CreateQueries.push(this.tables[i].create);
        }
        return CreateQueries.join(';');
    }
    get ts(): string {
        var builder: string[] = [];
        builder.push('module ' + this.name + 'Data {\n');
        for (var i: number = 0; i < this.tables.length; i++) {
            builder.push(this.tables[i].ts);
        }
        //codes for clone objects;
        builder.push('\texport class cloneBuilder {\n');
        for (var i: number = 0; i < this.tables.length; i++) {
            var table = this.tables[i];
            builder.push('\t\tstatic clone', table.name, '( source: ', table.name, '): ', table.name, ' {;\n');
            builder.push('\t\t\tvar value = new ', table.name, '();\n');
            for (var j: number = 0; j < table.fields.length; j++) {
                var field = table.fields[j];
                builder.push('\t\t\tvalue.', field.name, ' = source.', field.name, ';\n');
            }
            builder.push('\t\t\treturn value;\n');
            builder.push('\t\t}\n');
        }
        builder.push('\t}\n');
        //export class Clone {
        //    static cloneUser(_User: User): User {
        //        var value = new User();
        //        value.name = _User.name;

        //        return value;
        //    }
        //}

        //codes for create and drop tables;
        builder.push('\texport class TableCreation {\n');
        for (var i: number = 0; i < this.tables.length; i++) {
            builder.push('\t\tpublic ', this.name, '_', this.tables[i].name, ':string = "', this.tables[i].create, '";\n');
        }
        builder.push('\t}\n');

        for (var i: number = 0; i < this.tables.length; i++) {
            var table = this.tables[i];
            console.log('has table: ')
            console.log(table);
            var primary: CFField = null;
            var variable: string[] = [];
            var types: string[] = [];
            var inserts: string[] = [];
            var updatesets: string[] = [];
            var updates: string[] = [];
            var updatetypes: string[] = [];
            builder.push('\texport class ', table.name, 'TableDef implements ITableDef{\n');
            builder.push('\t\tconstructor(){\n');
            builder.push('\t\t\tthis[\'@@Table\'] = \'', table.name, 'TableDef\';\n');
            builder.push('\t\t\tthis[\'@@Schema\'] = \'', this.name, 'Data\';\n');
            builder.push('\t\t}\n');
            builder.push('\t\tpublic _TableName: string = \'', table.name, '\';\n');
            //builder.push('\t\tpublic _tsTableNew: string = \'new ', table.parent.name , 'Data.' , table.name , '()\';\n');
            //builder.push('\t\tpublic _phpTableNew: string = \'return new \\\\', table.parent.name, 'Data\\\\', table.name, '();\';\n'); 
            builder.push('\t\tpublic _SchemaName: string = \'', table.parent.name, 'Data\';\n');
            builder.push('\t\tpublic _AllFields: FieldDef[] = array(', table.fieldDefs.join(', '), ');\n');

            //builder.push('\t\tpublic _AllViews: string[] = array(\'', table.fieldviews.join('\', \''), '\');\n');
            //public _tsNew(): any {
            //    var item = eval(this._tsTableNew);
            //    item['@@status'] = 'new';
            //    return item;
            //}
            //public _phpNew(): any {
            //    var item = eval(this._phpTableNew);
            //    item['@@status'] = 'new';
            //    return item;
            //}

            //this _New will work for both php and ts;
            builder.push('\t\tpublic _New():any {\n');
            builder.push('\t\t\tvar item = new '+ this.name + 'Data.' + table.name+'();\n');
            builder.push('\t\t\titem[\'@@Table\'] = this._TableName;\n');
            builder.push('\t\t\titem[\'@@Schema\'] = this._SchemaName;\n');
            builder.push('\t\t\treturn item;\n');
            builder.push('\t\t}\n');
            //builder.push('\t\tpublic _phpNew():any {\n');
            //builder.push('\t\t\tvar item = new \\'+ this.name + '\\' + table.name + '();\n');
            //builder.push('\t\t\titem[\'@@Table\'] = this._TableName;\n');
            //builder.push('\t\t\titem[\'@@Schema\'] = this._SchemaName;\n');
            //builder.push('\t\t\treturn item;\n');
            //builder.push('\t\t}\n');
            
            for (var j: number = 0; j < table.fields.length; j++) {
                var field = table.fields[j];
                if (primary) {
                    updatetypes.push(field.bindType);
                    updatesets.push(' ' + field.name + ' = ?');
                    updates.push('_' + table.name + '.' + field.name);
                }
                else {
                    if (field.isPrimaryKey) {
                        primary = field
                    }
                    else {
                        updatetypes.push(field.bindType);
                        updatesets.push(' ' + field.name + ' = ?');
                        updates.push('_' + table.name + '.' + field.name);
                    }
                };
                variable.push('?');
                types.push(field.bindType);
                inserts.push('_' + table.name + '.' + field.name);
                builder.push('\t\tpublic ', field.name, ': string = \'', field.name, '\';\n');
            }
            
            //we need simple codes that set up all tables;
            
            if (primary) {

                builder.push('\t\tpublic _Insert(port: data.port, _', table.name, ': any): mysqli_stmt {\n');
                builder.push('\t\t\tvar stmt = port.statement(\'insert into ', table.name, ' (', table.fieldnames.join(', '), ') values (', variable.join(', '), ');\');\n');
                builder.push('\t\t\tstmt.bind_param(\'', types.join(''), '\', ', inserts.join(' ,'), ');\n');
                builder.push('\t\t\treturn stmt;\n');
                builder.push('\t\t}\n');

                //public _Update(port: data.port, _User: User): mysqli_stmt {
                //    var stmt = port.statement('update User set name = ?, password  = ? where id = ?;');
                //    stmt.bind_param('', _User.name, _User.password, _User.id);
                //    return stmt;
                //}
                builder.push('\t\tpublic _Update(port: data.port, _', table.name, ': any): mysqli_stmt {\n');
                builder.push('\t\t\tvar stmt = port.statement(\'update ', table.name, ' set', updatesets.join(','), ' where ', primary.name, ' = ?;\');\n');
                builder.push('\t\t\tstmt.bind_param(\'', updatetypes.join(''), primary.bindType, '\', ', updates.join(', '), ', _' + table.name + '.' + primary.name, ');\n');
                builder.push('\t\t\treturn stmt;\n');
                builder.push('\t\t}\n');

                builder.push('\t\tpublic _Fetch(port: data.port, ', primary.name,': number): mysqli_stmt {\n');
                builder.push('\t\t\tvar stmt = port.statement(\'select * from ', table.name, ' where ', primary.name, ' = ?;\');\n');
                builder.push('\t\t\tstmt.bind_param(\'', primary.bindType, '\', ', primary.name, ');\n');
                builder.push('\t\t\treturn stmt;\n');
                builder.push('\t\t}\n');

                builder.push('\t\tpublic _Delete(port: data.port, ', primary.name,': number): mysqli_stmt {\n');
                builder.push('\t\t\tvar stmt = port.statement(\'delete from ', table.name, ' where ', primary.name, ' = ?;\');\n');
                builder.push('\t\t\tstmt.bind_param(\'', primary.bindType, '\', ', primary.name, ');\n');
                builder.push('\t\t\treturn stmt;\n');
                builder.push('\t\t}\n');

                builder.push('\t\tpublic _PrimaryKey: string = \'', primary.name, '\';\n');
                builder.push('\t\tpublic _getKey(item: any): any {\n');
                builder.push('\t\t\treturn item[this._PrimaryKey];\n');
                builder.push('\t\t}\n');
                builder.push('\t\tpublic _setKey(item: any, key: any): any {\n');
                if (primary.tsType == 'number') {
                    builder.push('\t\t\titem[this._PrimaryKey] = str2num(key);\n');
                }
                if (primary.tsType == 'string') {
                    builder.push('\t\t\titem[this._PrimaryKey] = num2str(key);\n');
                }
                builder.push('\t\t}\n');
            }

            builder.push('\t\tpublic _TableCreate: string = \'', table.create, '\';\n');
            builder.push('\t\tpublic _TableDrop: string = \'', table.drop, '\';\n');

            builder.push('\t}\n');
        }

        //codes to access all tables;
        builder.push('\texport class _AllTables {\n');
        //public list(): any[] {
        //    var _tablelist = array();
        //    array_push(_tablelist, new CodeVerificationTableDef());
        //    return _tablelist;
        //}
        builder.push('\t\tpublic defs(): any[] {\n');
        builder.push('\t\t\tvar _tablelist = array();\n');
        //builder.push('\t\t\t\n');
        for (var i: number = 0; i < this.tables.length; i++) {
            var table = this.tables[i];
            builder.push('\t\t\tarray_push(_tablelist, new ',table.name, 'TableDef());\n');
        }
        builder.push('\t\t\treturn _tablelist;\n');
        builder.push('\t\t}\n');
        builder.push('\t}\n');

    //public _Insert(port: data.port, _CarCategory: CarCategory): mysqli_stmt {
    //    var stmt = port.createStatement('insert into CarCategory ( ) values (?, ?, ?, ?);');
    //    stmt.bind_param('issi', _CarCategory.id, _CarCategory.name, _CarCategory.descriptoin, _CarCategory.category);
    //    return stmt;
    //}
    //public _Fetch(port: data.port, id: number): mysqli_stmt {
    //    var stmt = port.createStatement('select * from CarCategory where id = ?;');
    //    stmt.bind_param('i', id);
    //    return stmt;
    //}
    //public _Delete(port: data.port, id: number): mysqli_stmt {
    //    var stmt = port.createStatement('delete from CarCategory where id = ?;');
    //    stmt.bind_param('i', id);
    //    return stmt;
    //}
        
        builder.push('}\n');
        return builder.join('');
    }
}
class CFTable {
    static ptnTable = /(^|\n)\s*(export\s+|)class\s+(\w+)\s*\{/g;
    constructor(value: string) {
        //analyze value to obtain the name of table;
        this.code = value;
        var fieldSections = SectionDivider.DivideWith(this.code, /(^\s*|(;)[\s^\n]*\n[\s^\n]*)/g, 2);

        //console.log(fieldSections);
        for (var j: number = 0; j < fieldSections.length; j++) {
            //var mt = CFDatabase.ptnModule.Match(fieldSections[i]);

            var mt: RegularExpressionMatch;
            var fieldcode = fieldSections[j];
            console.log(fieldcode);

            for (var i: number = 0; i < FieldModels.length; i++) {
                var fm = FieldModels[i];
                if (fm.pattern.IsMatch(fieldcode)) {
                    //console.log(fieldcode);
                    var field = new CFField(fieldcode);
                    var mt = fm.pattern.Match(fieldcode);
                    fm.setFeild(mt, field);
                    //this.Name = mt.groups[3];
                    //this.Model = fm;
                    //this.Attributes = mt.groups[4];
                    //this.FieldType = mt.groups[6];
                    //if (mt.groups[7]) this.Length = Number(mt.groups[7]);
                    //if (mt.groups[8]) this.Scale = Number(mt.groups[8]);
                    if (CFField.ptnPrimaryKey.IsMatch(field.attributes)) {
                        console.log('PrimaryKey ' + field.name);
                        field.isPrimaryKey = true;
                        field.isNotNull = true;
                    }
                    if (CFField.ptnNotNull.IsMatch(field.attributes)) {
                        field.isNotNull = true;
                    }
                    if (CFField.ptnAutoIncrement.IsMatch(field.attributes) && fm.canAutoIncrement) {
                        field.isAutoIncrement = true;
                    }

                    //static ptnInputNumberView = /InputNumberView\s*\(\s*\)/g;
                    if (CFField.ptnInputNumberView.IsMatch(field.attributes)) {
                        field.defaultView = FieldViews.Input_Number;
                    }
                    //static ptnSingleImageView = /SingleImageView\s*\(\s*\)/g;
                    if (CFField.ptnSingleImageView.IsMatch(field.attributes)) {
                        field.defaultView = FieldViews.ImageSingle;
                    }
                    //static ptnMultipleImageView = /MultipleImageView\s*\(\s*\)/g;
                    if (CFField.ptnMultipleImageView.IsMatch(field.attributes)) {
                        field.defaultView = FieldViews.ImageMultiple;
                    }
                    //static ptnTextAreaView = /TextAreaView\s*\(\s*\)/g;
                    if (CFField.ptnTextAreaView.IsMatch(field.attributes)) {
                        field.defaultView = FieldViews.TextArea;
                    }
                    //static ptnInputTextView = /InputTextView\s*\(\s*\)/g;
                    if (CFField.ptnInputTextView.IsMatch(field.attributes)) {
                        field.defaultView = FieldViews.Input_Text;
                    }
                    //static ptnDateView = /DateView\s*\(\s*\)/g;
                    if (CFField.ptnDateView.IsMatch(field.attributes)) {
                        field.defaultView = FieldViews.Date;
                    }

                    if (field.defaultView == FieldViews.Input_Number) {
                        if (field.isAutoIncrement) {
                            field.defaultView = FieldViews.Input_Number_Readonly;
                        }
                    }

                    if (fm.canDefaultString) if (CFField.ptnDefaultString.IsMatch(field.attributes)) {
                        var md = CFField.ptnDefaultString.Match(field.attributes);
                        field.hasDefaultValue = true;
                        field.defaultValue = md.groups[1];
                        console.log('default string: ' + field.defaultValue);
                    }
                    if (fm.canDefaultNumber) if (CFField.ptnDefaultNumber.IsMatch(field.attributes)) {
                        var md = CFField.ptnDefaultNumber.Match(field.attributes);
                        field.hasDefaultValue = true;
                        field.defaultValue = md.groups[1];
                        console.log('default number: ' + field.defaultValue);
                    }
                    console.log(field);
                    this.fields.push(field);
                }
            }
        }
    }
    public name: string;
    public code: string;
    public begin: number;
    public parent: CFDatabase;
    public fields: CFField[] = [];
    get create(): string {
        var builder: Array<string> = [];
        builder.push('Create Table ', this.name, '('); //',  this.parent.name , '. database name removed to avoid troubles;
        var primaryKeyField: CFField;

        var defs: Array<string> = [];

        for (var i: number = 0; i < this.fields.length; i++) {
            //the first primary key field is valid.
            if (!primaryKeyField && this.fields[i].isPrimaryKey) primaryKeyField = this.fields[i];
            defs.push(this.fields[i].definition);
            //console.log('def: ' + this.Fields[i].getFieldDefinition());
        }

        if (primaryKeyField) {
            defs.push("Primary Key (" + primaryKeyField.name + ')')
        }

        builder.push(defs.join(', '));
        builder.push(');');
        return builder.join('');
    }
    get drop(): string {
        var builder: string[] = [];
        builder.push('Drop Table If Exists ', this.name, ';'); //', this.parent.name, '.
        return builder.join('');
    }
    get fieldnames(): string[] {
        var names: string[] = [];
        for (var i: number = 0; i < this.fields.length; i++) {
            names.push(this.fields[i].name);
        }
        return names;
    }
    get fieldviews(): string[] {
        var views: string[] = [];
        for (var i: number = 0; i < this.fields.length; i++) {
            views.push(this.fields[i].defaultView);
        }
        return views;
    }
    get fieldDefs(): string[] {
        var defs: string[] = [];
        for (var i: number = 0; i < this.fields.length; i++) {

            defs.push('new FieldDef(\'' +
                this.fields[i].name +
                '\', \'' +
                this.fields[i].defaultView +
                '\', \'' +
                this.fields[i].bindType + 
                '\')');
        }
        return defs;
    }
    get ts(): string {
        var builder: string[] = [];
        builder.push('\texport class ' + this.name + '{\n');
        builder.push('\t\tconstructor(){\n');
        builder.push('\t\t\tthis[\'@@Schema\'] = \'' + this.parent.name + 'Data\';\n');
        builder.push('\t\t\tthis[\'@@Table\'] = \'' + this.name + '\';\n');
        builder.push('\t\t}\n');
        for (var i: number = 0; i < this.fields.length; i++) {
            builder.push(this.fields[i].ts);
        }
        builder.push('\t}\n');
        return builder.join('');
    }
    get dts(): string {
        return '';
    }
}

class FieldModel {
    public name: string;
    public pattern: RegExp;
    public canAutoIncrement: boolean;
    public canDefaultString: boolean;
    public canDefaultNumber: boolean;
    public setFeild: (match: RegularExpressionMatch, field: CFField) => void;
}

var FieldModels: FieldModel[] = [
    {
        name: 'VarChar',
        setFeild: (m: RegularExpressionMatch, f: CFField) => { f.defaultView = FieldViews.Input_Text; f.model = f.model; f.bindType = 's'; f.tsType = 'string'; f.name = m.groups[3]; f.attributes = m.groups[4]; f.fieldType = m.groups[6]; f.length = Number(m.groups[7]); },
        canAutoIncrement: false, canDefaultString: true, canDefaultNumber: false, pattern: /(^|\n)\s*(|public\s+)(\w+)\s*\:\s*string\s*=\s*cf\s*\.((?:\s*\w+\s*\((\s*|\s*[\d\.]+\s*|\s*'[\w\W]*'\s*|\s*"[\w\W]*"\s*)\)\s*\.)*)\s*(VarChar)\s*\(\s*(\d+)\s*\)\s*;/g
    },
    {
        name: 'Decimal', 
        setFeild: (m: RegularExpressionMatch, f: CFField) => { f.defaultView = FieldViews.Input_Text_Decimal; f.model = f.model; f.bindType = 's'; f.tsType = 'string'; f.name = m.groups[3]; f.attributes = m.groups[4]; f.fieldType = m.groups[6]; f.length = Number(m.groups[7]); f.scale = Number(m.groups[8]); },
        canAutoIncrement: false, canDefaultString: false, canDefaultNumber: true, pattern: /(^|\n)\s*(|public\s+)(\w+)\s*\:\s*string\s*=\s*cf\s*\.((?:\s*\w+\s*\((\s*|\s*[\d\.]+\s*|\s*'[\w\W]*'\s*|\s*"[\w\W]*"\s*)\)\s*\.)*)\s*(Decimal)\s*\(\s*(\d+)\s*\,\s*(\d+)\s*\)\s*;/g
    },
    {
        name: 'Int',
        setFeild: (m: RegularExpressionMatch, f: CFField) => { f.defaultView = FieldViews.Input_Number; f.model = f.model; f.bindType = 'i'; f.tsType = 'number'; f.name = m.groups[3]; f.attributes = m.groups[4]; f.fieldType = m.groups[6]; },
        canAutoIncrement: true, canDefaultString: false, canDefaultNumber: true, pattern: /(^|\n)\s*(|public\s+)(\w+)\s*\:\s*number\s*=\s*cf\s*\.((?:\s*\w+\s*\((\s*|\s*[\d\.]+\s*|\s*'[\w\W]*'\s*|\s*"[\w\W]*"\s*)\)\s*\.)*)\s*(Int)\s*\(\s*\)\s*;/g
    },
    {
        name: 'BigInt',
        setFeild: (m: RegularExpressionMatch, f: CFField) => { f.defaultView = FieldViews.Input_Number; f.model = f.model; f.bindType = 'i'; f.tsType = 'number'; f.name = m.groups[3]; f.attributes = m.groups[4]; f.fieldType = m.groups[6]; },
        canAutoIncrement: true, canDefaultString: false, canDefaultNumber: true, pattern: /(^|\n)\s*(|public\s+)(\w+)\s*\:\s*number\s*=\s*cf\s*\.((?:\s*\w+\s*\((\s*|\s*[\d\.]+\s*|\s*'[\w\W]*'\s*|\s*"[\w\W]*"\s*)\)\s*\.)*)\s*(BigInt)\s*\(\s*\)\s*;/g
    },
    {
        name: 'TinyInt',
        setFeild: (m: RegularExpressionMatch, f: CFField) => { f.defaultView = FieldViews.Input_Number; f.model = f.model; f.bindType = 'i'; f.tsType = 'number'; f.name = m.groups[3]; f.attributes = m.groups[4]; f.fieldType = m.groups[6]; },
        canAutoIncrement: false, canDefaultString: false, canDefaultNumber: true, pattern: /(^|\n)\s*(|public\s+)(\w+)\s*\:\s*number\s*=\s*cf\s*\.((?:\s*\w+\s*\((\s*|\s*[\d\.]+\s*|\s*'[\w\W]*'\s*|\s*"[\w\W]*"\s*)\)\s*\.)*)\s*(TinyInt)\s*\(\s*\)\s*;/g
    },
    {
        name: 'Bool', 
        setFeild: (m: RegularExpressionMatch, f: CFField) => { f.defaultView = FieldViews.Input_Checkbox; f.model = f.model; f.bindType = 'i'; f.tsType = 'boolean'; f.name = m.groups[3]; f.attributes = m.groups[4]; f.fieldType = m.groups[6]; },
        canAutoIncrement: false, canDefaultString: false, canDefaultNumber: true, pattern: /(^|\n)\s*(|public\s+)(\w+)\s*\:\s*boolean\s*=\s*cf\s*\.((?:\s*\w+\s*\((\s*|\s*[\d\.]+\s*|\s*'[\w\W]*'\s*|\s*"[\w\W]*"\s*)\)\s*\.)*)\s*(Bool)\s*\(\s*\)\s*;/g
    },
    {
        name: 'Text', 
        setFeild: (m: RegularExpressionMatch, f: CFField) => { f.defaultView = FieldViews.TextArea; f.model = f.model; f.bindType = 's'; f.tsType = 'string'; f.name = m.groups[3]; f.attributes = m.groups[4]; f.fieldType = m.groups[6]; },
        canAutoIncrement: false, canDefaultString: true, canDefaultNumber: false, pattern: /(^|\n)\s*(|public\s+)(\w+)\s*\:\s*string\s*=\s*cf\s*\.((?:\s*\w+\s*\((\s*|\s*[\d\.]+\s*|\s*'[\w\W]*'\s*|\s*"[\w\W]*"\s*)\)\s*\.)*)\s*(Text)\s*\(\s*\)\s*;/g
    },
    {
        name: 'Date',
        setFeild: (m: RegularExpressionMatch, f: CFField) => { f.defaultView = FieldViews.Date; f.model = f.model; f.bindType = 's'; f.tsType = 'string'; f.name = m.groups[3]; f.attributes = m.groups[4]; f.fieldType = m.groups[6]; },
        canAutoIncrement: false, canDefaultString: true, canDefaultNumber: false, pattern: /(^|\n)\s*(|public\s+)(\w+)\s*\:\s*string\s*=\s*cf\s*\.((?:\s*\w+\s*\((\s*|\s*[\d\.]+\s*|\s*'[\w\W]*'\s*|\s*"[\w\W]*"\s*)\)\s*\.)*)\s*(Date)\s*\(\s*\)\s*;/g
    },
    {
        name: 'Time', 
        setFeild: (m: RegularExpressionMatch, f: CFField) => { f.defaultView = FieldViews.Time; f.model = f.model; f.bindType = 's'; f.tsType = 'string'; f.name = m.groups[3]; f.attributes = m.groups[4]; f.fieldType = m.groups[6]; },
        canAutoIncrement: false, canDefaultString: true, canDefaultNumber: false, pattern: /(^|\n)\s*(|public\s+)(\w+)\s*\:\s*string\s*=\s*cf\s*\.((?:\s*\w+\s*\((\s*|\s*[\d\.]+\s*|\s*'[\w\W]*'\s*|\s*"[\w\W]*"\s*)\)\s*\.)*)\s*(Time)\s*\(\s*\)\s*;/g
    },
    {
        name: 'Datetime', 
        setFeild: (m: RegularExpressionMatch, f: CFField) => { f.defaultView = FieldViews.DateTime; f.model = f.model; f.bindType = 's'; f.tsType = 'string'; f.name = m.groups[3]; f.attributes = m.groups[4]; f.fieldType = m.groups[6]; },
        canAutoIncrement: false, canDefaultString: true, canDefaultNumber: false, pattern: /(^|\n)\s*(|public\s+)(\w+)\s*\:\s*string\s*=\s*cf\s*\.((?:\s*\w+\s*\((\s*|\s*[\d\.]+\s*|\s*'[\w\W]*'\s*|\s*"[\w\W]*"\s*)\)\s*\.)*)\s*(Datetime)\s*\(\s*\)\s*;/g
    },
    {
        name: 'Timestamp',
        setFeild: (m: RegularExpressionMatch, f: CFField) => { f.defaultView = FieldViews.DateTime; f.model = f.model; f.bindType = 's'; f.tsType = 'string'; f.name = m.groups[3]; f.attributes = m.groups[4]; f.fieldType = m.groups[6]; },
        canAutoIncrement: false, canDefaultString: true, canDefaultNumber: false, pattern: /(^|\n)\s*(|public\s+)(\w+)\s*\:\s*string\s*=\s*cf\s*\.((?:\s*\w+\s*\((\s*|\s*[\d\.]+\s*|\s*'[\w\W]*'\s*|\s*"[\w\W]*"\s*)\)\s*\.)*)\s*(Timestamp)\s*\(\s*\)\s*;/g
    }
];

class CFField {
    static ptnPrimaryKey = /PrimaryKey\s*\(\s*\)/g;
    static ptnNotNull = /NotNull\s*\(\s*\)/g;
    static ptnAutoIncrement = /AutoIncrement\s*\(\s*\)/g;
    static ptnDefaultString = /DefaultString\s*\(\s*(('|")[^']+('|"))\s*\)/g;
    static ptnDefaultNumber = /DefaultNumber\s*\(\s*((\-|)[\d\.]+)\s*\)/g;
    static ptnInputNumberView = /InputNumberView\s*\(\s*\)/g;
    static ptnSingleImageView = /SingleImageView\s*\(\s*\)/g;
    static ptnMultipleImageView = /MultipleImageView\s*\(\s*\)/g;
    static ptnTextAreaView = /TextAreaView\s*\(\s*\)/g;
    static ptnInputTextView = /InputTextView\s*\(\s*\)/g;
    static ptnDateView = /DateView\s*\(\s*\)/g;
    constructor(value: string) {
        this.code = value;
    }
    public name: string;
    public attributes: string;
    public parent: CFTable;
    public code: string;
    public model: FieldModel;
    public defaultValue: string;
    public fieldType: string;
    public tsType: string;
    public bindType: string;
    public length: number;
    public scale: number;
    public isPrimaryKey: boolean;
    public isNotNull: boolean;
    public isUnique: boolean;
    public isZeroFill: boolean;
    public isAutoIncrement: boolean;
    public hasDefaultValue: boolean;
    public defaultView: string;
    get definition(): string {
        //console.log('Name: ' + this.Name);
        //console.log(this.FieldType);
        switch (this.fieldType) {
            case 'VarChar':
                //console.log('case: VarChar');
                return  this.name 
                    + ' VARCHAR(' + this.length + ')'
                    + ((this.isPrimaryKey || this.isNotNull) ? ' Not Null' : '')
                    + ((this.hasDefaultValue) ? 'Default \'' + this.defaultValue + '\'': '');
            case 'Int':
                return  this.name 
                    + ' Int '
                    + ((this.isPrimaryKey || this.isNotNull) ? ' Not Null' : '')
                    + ((this.isAutoIncrement) ? ' AUTO_INCREMENT ' : '')
                    + ((this.hasDefaultValue) ? ' Default ' + this.defaultValue : '');
            case 'Decimal':
                return  this.name 
                    + ' Decimal(' + this.length + ',' + this.scale + ')'
                    + ((this.isPrimaryKey || this.isNotNull) ? ' Not Null' : '')
                    + ((this.hasDefaultValue) ? ' Default ' + this.defaultValue : '');
            case 'TinyInt':
                return  this.name 
                    + ' TinyInt'
                    + ((this.isPrimaryKey || this.isNotNull) ? ' Not Null' : '')
                    + ((this.hasDefaultValue) ? ' Default ' + this.defaultValue : '');
            case 'BigInt':
                return this.name 
                    + ' BigInt'
                    + ((this.isPrimaryKey || this.isNotNull) ? ' Not Null' : '')
                    + ((this.hasDefaultValue) ? ' Default ' + this.defaultValue : '');
            case 'Bool':
                return this.name
                    + ' TinyInt(1)'
                    + ((this.isPrimaryKey || this.isNotNull) ? ' Not Null' : '')
                    + ((this.hasDefaultValue) ? ' Default ' + this.defaultValue : '');
            case 'Text':
                return this.name
                    + ' Text'
                    + ((this.isPrimaryKey || this.isNotNull) ? ' Not Null' : '')
                    + ((this.hasDefaultValue) ? 'Default \'' + this.defaultValue + '\'' : '');
            case 'Date':
                return this.name
                    + ' Date'
                    + ((this.isPrimaryKey || this.isNotNull) ? ' Not Null' : '')
                    + ((this.hasDefaultValue) ? 'Default \'' + this.defaultValue + '\'' : '');
            case 'Time':
                return this.name
                    + ' Time'
                    + ((this.isPrimaryKey || this.isNotNull) ? ' Not Null' : '')
                    + ((this.hasDefaultValue) ? 'Default \'' + this.defaultValue + '\'' : '');
            case 'Datetime':
                return this.name
                    + ' Datetime'
                    + ((this.isPrimaryKey || this.isNotNull) ? ' Not Null' : '')
                    + ((this.hasDefaultValue) ? 'Default \'' + this.defaultValue + '\'' : '');
            case 'Timestamp':
                return this.name
                    + ' Timestamp'
                    + ((this.isPrimaryKey || this.isNotNull) ? ' Not Null' : '')
                    + ((this.hasDefaultValue) ? 'Default \'' + this.defaultValue + '\'' : '');
        }
    }

    get ts(): string {
        return '\t\tpublic ' + this.name + ':' + this.tsType + ';\n';
    }
}

//rpc
//this file defines classes that can convert interfaces to PHP based remote procedure calls;

class RPCCompiler {
    public code: string;
    public modules: RPCModule[] = [];

    public references: string[] = [];
    constructor(value: string) {
        console.log('****** Compiler Code: '+ value);
        this.code = value;
        var mi = CompilerPattern.ptnRPCInclude.Match(value);
        var includevalues = mi.groups[2];
        console.log('rpc includes: ' + value); 
        if (includevalues) if (includevalues.length > 0) {
            var includes = CompilerPattern.ptnIncludeFile.Matches(includevalues);
            for (var i: number = 0; i < includes.length; i++) {
                var inc = includes[i];
                this.references.push(inc.groups[1]);
            }
        }
        var mc = StdPatterns.ptnModule.Matches(this.code);
        for (var i: number = 0; i < mc.length; i++) {
            var mt = mc[i];
            var begin = this.code.indexOf('{', mt.index) + 1;
            var end: number;
            if (mc[i + 1]) {
                end = this.code.lastIndexOf('}', mc[i + 1].index);
            }
            else {
                end = this.code.lastIndexOf('}', this.code.length);
            }
            var _module = new RPCModule(this.code.substring(begin, end));
            _module.name = mt.groups[2];
            _module.begin = begin;
            _module.parent = this;
            this.modules.push(_module);
        }
        console.log(this.modules);
    }
    get client(): string {
        var builder: string[] = [];
        for (var i: number = 0; i < this.modules.length; i++) {
            builder.push(this.modules[i].client);
        }
        return builder.join('');
    }
    get service(): string {
        var builder: string[] = [];
        for (var i: number = 0; i < this.modules.length; i++) {
            builder.push(this.modules[i].service);
        }
        return builder.join('\n');
    }
}
class RPCModule {
    public name: string;
    public services: RPCService[] = [];
    public code: string;
    public begin: number;
    public parent: RPCCompiler;

    constructor(value: string) {
        console.log('****** module section: ' + value);
        this.code = value;
        var mc = CompilerPattern.ptnService.Matches(this.code);
        for (var i: number = 0; i < mc.length; i++) {
            var mt = mc[i];
            var begin = this.code.indexOf('{', mt.index) + 1;
            var end: number;
            if (mc[i + 1]) {
                end = this.code.lastIndexOf('}', mc[i + 1].index);
            }
            else {
                end = this.code.lastIndexOf('}', this.code.length);
            }
            var _service = new RPCService(this.code.substring(begin, end));
            _service.parent = this;
            _service.name = mt.groups[4];
            _service.begin = begin;
            this.services.push(_service);
        }
    }
    get client(): string {
        var builder: string[] = [];
        builder.push('module ', this.name, 'Client', ' {\n');
        for (var i: number = 0; i < this.services.length; i++) {
            builder.push(this.services[i].client);
        }
        builder.push('\n}\n');
        return builder.join('');
    }
    public implant = (old: string, name: string): string => {
        //console.log('******implanted code: ' + old);
        name = name + 'Service';
        if (!old) return this.service;

        var ptnAUTO = /\/\/\-\-\-AUTOGENERATED\sCODE\sBELOW/g;
        var mtAUTO = ptnAUTO.Match(old);
        var end: number;
        if (mtAUTO) {
            end = mtAUTO.index;
        }
        else {
            end = old.length;
        }
        var start: number;
        var mtPHP = CompilerPattern.ptnPHPInclude.Match(old);
        if (mtPHP) {
            start = mtPHP.length;
        }
        else {
            start = 0;
        }
        var mod: string = old.substring(start, end);

        var _oldModule: RPCModule;
        //the following codes will find out the module matching this name;
        //console.log('mod code:');
        //console.log(mod);
        var mc = StdPatterns.ptnModule.Matches(mod);
        for (var i: number = 0; i < mc.length; i++) {
            var mt = mc[i];
            var begin = mod.indexOf('{', mt.index) + 1;
            var end: number;
            if (mc[i + 1]) {
                end = mod.lastIndexOf('}', mc[i + 1].index);
            }
            else {
                end = mod.lastIndexOf('}', mod.length);
            }
            if (mt.groups[2] == name) {
                _oldModule = new RPCModule(mod.substring(begin, end));
                _oldModule.begin = begin;
                _oldModule.name = name;
            }
        }

        if (_oldModule) {
            console.log('module found');
            console.log(this.code);
            var _insertions = _oldModule.update(this);
            console.log(_insertions);
            _insertions.sort(Insertion.Compare);
            var index = 0;
            var builder: string[] = [];
            builder.push(this.reference);
            for (var i: number = 0; i < _insertions.length; i++) {
                console.log('Section ' + i.toString() + ' at ' + _insertions[i].index.toString() + ': ' + mod.substring(0, _insertions[i].index));
                builder.push(mod.substring(index, _insertions[i].index));
                console.log('Insertion ' + i.toString() + ': ' + _insertions[i].value);
                builder.push(_insertions[i].value);
                index = _insertions[i].index;
            }
            if (_insertions.length > 0) {
                //console.log('final: ' + mod.substring(_insertions[_insertions.length - 1].index, mod.length));
                builder.push(mod.substring(index, mod.length));
            }
            else {
                builder.push(mod);
            }
            builder.push(this.dispatcher);
            return builder.join('');
        }
        else {
            console.log('module not found');
            return this.service;
        }
    }
    public update = (updated: RPCModule): Insertion[] => {
        console.log(this);
        console.log(updated);
        var _insertions: Insertion[] = [];
        var newServices: RPCService[] = [];
        console.log('updated services: ');
        console.log(updated.services);
        for (var i: number = 0; i < updated.services.length; i++) {
            if (this.hasService(updated.services[i])) {
                console.log('has Service: ' + updated.services[i].name);
                var _service = this.getService(updated.services[i].name);
                _insertions.push(_service.update(updated.services[i]));
            }
            else {
                //put the new services in the array, they will be added at the end of the update;
                console.log('not has Service: ' + updated.services[i].name);
                newServices.push(updated.services[i]);
            }
        }
        var builder: string[] = [];
        for (var i: number = 0; i < newServices.length; i++) {
            builder.push('\n', newServices[i].service);
        }
        if (newServices.length > 0) {
            //builder.push('\n');
        }
        var _insertion = new Insertion();
        _insertion.index = this.begin;
        _insertion.value = builder.join('');
        _insertions.push(_insertion);
        return _insertions;
    }
    public hasService = (service: RPCService): boolean => {
        for (var i: number = 0; i < this.services.length; i++) {
            if (this.services[i].name == service.name) return true;
        }
        return false;
    }
    public getService = (name: string): RPCService => {
        for (var i: number = 0; i < this.services.length; i++) {
            if (this.services[i].name == name) return this.services[i];
        }
        return null;
    }
    get reference(): string {

        var refbuilder: string[] = [];
        refbuilder.push('\'rpcdef\'');
        console.log('references: ');
        console.log(this.parent.references);
        for (var i: number = 0; i < this.parent.references.length; i++) {
            refbuilder.push('\'' + this.parent.references[i] + '\'');
        }
        return '//php include ' + refbuilder.join(' ') + ' \n';
    }
    get service(): string {
        var builder: string[] = [];
        /*
var postInput = file_get_contents("php://input");
var jsonObject: rpc = json_decode(postInput);
//call dispatcher;
switch (jsonObject.service) {

}
        */
        builder.push(this.reference);

        builder.push('module ', this.name, 'Service', ' {\n');
        for (var i: number = 0; i < this.services.length; i++) {
            builder.push(this.services[i].service);
        }
        builder.push('\n}\n');


        builder.push(this.dispatcher);
        return builder.join('');
    }
    get dispatcher(): string {
        var builder: string[] = [];
        builder.push('//---AUTOGENERATED CODE BELOW: typescript dispatcher for php, please do not modify any code blow \n');
        builder.push('include(\'phputil.php\');\n');
        builder.push('var postInput = file_get_contents("php://input");\n');
        builder.push('var jsonObject: rpc = json_decode(postInput);\n');
        //builder.push('//Dispatch serices and calls to object;\n');
        builder.push('switch (jsonObject.service) {\n');

        for (var i: number = 0; i < this.services.length; i++) {
            builder.push(this.services[i].dispatcher);
        }
        builder.push('}\n');
        return builder.join('');
    }

}
class RPCService {
    public name: string;
    public methods: RPCMethod[] = [];
    public code: string;
    public begin: number;
    public parent: RPCModule;
    constructor(value: string) {
        this.code = value;
        var mc = StdPatterns.ptnInterfaceMethod.Matches(this.code);
        for (var i: number = 0; i < mc.length; i++) {
            var mt = mc[i];
            var _method = new RPCMethod(mt.groups[2]);
            _method.name = mt.groups[1];
            _method.returnType = mt.groups[8].split(' ').join('');
            _method.parent = this;
            this.methods.push(_method);
        }
    }
    public update = (updated: RPCService): Insertion => {
        var newMethods: RPCMethod[] = [];
        for (var i: number = 0; i < updated.methods.length; i++) {
            if (this.hasMethod(updated.methods[i])) {
                var _method = this.getMethod(updated.methods[i].name);
                if (!_method.isIndentical(updated.methods[i])) {
                    //if the new method is different from the old one, we still need to insert the new methods;
                    newMethods.push(updated.methods[i]);
                }
            }
            else {
                //put the new methods in the array, they will be added at the end of the update;
                newMethods.push(updated.methods[i]);
            }
        }
        var builder: string[] = [];
        for (var i: number = 0; i < newMethods.length; i++) {
            builder.push('\n', newMethods[i].service);
        }
        //if (newMethods.length > 0) builder.push('\n');
        var _insertion = new Insertion();
        _insertion.index = this.parent.begin + this.begin;
        _insertion.value = builder.join('');
        return _insertion;
    }
    public hasMethod = (method: RPCMethod): boolean => {
        for (var i: number = 0; i < this.methods.length; i++) {
            if (this.methods[i].name == method.name) return true;
        }
        return false;
    }
    public getMethod = (name: string): RPCMethod => {
        for (var i: number = 0; i < this.methods.length; i++) {
            if (this.methods[i].name == name) return this.methods[i];
        }
        return null;
    }
    get client(): string {
        var builder: string[] = [];
        builder.push('\texport class ', this.name, ' {\n');
        builder.push('\t\tstatic ___DefaultErrorCallback(data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig): void {\n');
        builder.push('\t\t\tconsole.log(\'Client HTTP Error:\');\n');
        builder.push('\t\t\tconsole.log(\'Error.data:\');\n');
        builder.push('\t\t\tconsole.log(data);\n');
        builder.push('\t\t\tconsole.log(\'Error.status:\');\n');
        builder.push('\t\t\tconsole.log(status);\n');
        builder.push('\t\t}\n');
        for (var i: number = 0; i < this.methods.length; i++) {
            builder.push(this.methods[i].client);
        }
        builder.push('\t}\n');
        return builder.join('');
    }
    get dispatcher(): string {
        var builder: string[] = [];
        /*
    case 'newcall':
        var serviceObject = new newcallService();
        switch (jsonObject.method) {

        }
        break;
        */
        builder.push('\tcase \'', this.name, '\':\n');
        builder.push('\t\tvar ', this.parent.name, '_', this.name, ' = new ', this.parent.name, 'Service.', this.name, '();\n');
        builder.push('\t\tswitch (jsonObject.method) {\n');
        for (var i: number = 0; i < this.methods.length; i++) {
            builder.push(this.methods[i].dispatcher);
        }
        builder.push('\t\t}\n');
        builder.push('\tbreak;\n');
        return builder.join('');
    }
    get service(): string {
        var builder: string[] = [];
        builder.push('\texport class ', this.name, ' {\n');
        for (var i: number = 0; i < this.methods.length; i++) {
            builder.push(this.methods[i].service);
        }
        builder.push('\t}\n');
        return builder.join('');
    }
}
class RPCMethod {
    public name: string;
    public parameters: RPCParameter[] = [];
    public returnType: string;
    public parent: RPCService;
    public code: string;
    constructor(value: string) {
        this.code = value;
        var mc = StdPatterns.ptnParameter.Matches(this.code);
        for (var i: number = 0; i < mc.length; i++) {
            var mt = mc[i];
            var _parameter = new RPCParameter();
            _parameter.name = mt.groups[1];
            _parameter.type = mt.groups[2].split(' ').join('');
            this.parameters.push(_parameter);
        }
    }
    public isIndentical = (updated: RPCMethod): boolean => {
        //Check if the method is the same one;
        if (this.name != updated.name) return false;
        if (this.returnType != updated.returnType) return false;
        if (this.parameters.length != updated.parameters.length) return false;
        for (var i: number = 0; i < this.parameters.length; i++) {
            if (this.parameters[i].service != updated.parameters[i].service) return false;
        }
        return true;
    }
    get client(): string {
        var builder: string[] = [];
        var pmNames: string[] = [];
        builder.push('\t\tpublic static ', this.name, ' (');
        for (var i: number = 0; i < this.parameters.length; i++) {
            builder.push(this.parameters[i].client);
            builder.push(', ');
            pmNames.push(this.parameters[i].name);
        }
        builder.push('\n');
        builder.push('\t\t\t_SuccessCallback: ng.IHttpPromiseCallback<', this.returnType, '>');
        builder.push(', \n');
        builder.push('\t\t\t_ErrorCallback?: ng.IHttpPromiseCallback<', this.returnType, '>');
        builder.push(') {\n');
        builder.push('\t\t\tif(!_ErrorCallback) _ErrorCallback = ', this.parent.name, '.___DefaultErrorCallback;\n');
        builder.push('\t\t\tvar _RemoteProcedureCallObject: rpc = {\n');
        builder.push('\t\t\t\t\tservice: \'', this.parent.name, '\', method: \'', this.name, '\', parameters: [', pmNames.join(', '), ']\n');
        builder.push('\t\t\t\t}\n');
        builder.push('\t\t\tRPC.post(\'', this.parent.parent.name, '.php\', _RemoteProcedureCallObject, \'', this.returnType,'\', _SuccessCallback, _ErrorCallback);\n');
        //builder.push('\t\t\t\t.success(_SuccessCallback)\n');
        //builder.push('\t\t\t\t.error(_ErrorCallback);\n');
        builder.push('\t\t}\n');
        return builder.join('');
    }
    get dispatcher(): string {
        var builder: string[] = [];
        /*
            case 'query':
                var remoteCallResult = serviceObject.query(jsonObject.parameters[0]);
                echo(json_encode(remoteCallResult));
        */
        builder.push('\t\t\tcase \'', this.name, '\':\n');
        var pmbase: string = this.parent.parent.name + '_' + this.parent.name + '_' + this.name + '_parameter_';
        var pmValues: string[] = [];
        for (var i: number = 0; i < this.parameters.length; i++) {

            ////string number boolean
            //var UserUtils_User_create_parameter_1: string = jsonObject.parameters[0];
            ////else
            //var UserUtils_User_create_parameter_1 = new ShopMapData.User();
            //var UserUtils_User_create_parameter_1_json: any[] = jsonObject.parameters[0];
            //for (var key in jsonObject.parameters[0]) {
            //    UserUtils_User_create_parameter_1[key] = jsonObject.parameters[0][key];
            //}
            var pmname: string = pmbase + i.toString();
            var pjname: string = pmname + '_json';
            pmValues.push(pmname);
            switch (this.parameters[i].type) {
                case 'string':
                case 'boolean':
                case 'number':
                case 'any':
                case 'string[]':
                case 'boolean[]':
                case 'number[]':
                case 'any[]':
                    builder.push('\t\t\t\tvar ', pmname, ': ', this.parameters[i].type, ' =  jsonObject.parameters[', i.toString(), '];\n');
                    break;
                default:
                    if (this.parameters[i].type.lastIndexOf('[]') > -1) {
                        var objectType = this.parameters[i].type.substring(0, this.parameters[i].type.lastIndexOf('[]'));
                        //builder.push('\t\t\t\tvar ', pmname, ': ', this.parameters[i].type, ' =  array();\n');
                        builder.push('\t\t\t\tvar ', pmname, ': any[] = jsonArray2Array(jsonObject.parameters[', i.toString(), ']);\n');
                        //builder.push('\t\t\t\tfor(var i:number = 0; i<count(', pjname, '); i++){\n');
                        //builder.push('\t\t\t\t\t', pmname, '[i] = new ', objectType, '();\n');
                        //builder.push('\t\t\t\t\tjson2object(', pmname, '[i],',pjname, '[i]);\n');
                        //builder.push('\t\t\t\t}\n');
                        //builder.push('\t\t\t\tjson2object(', pmname, ', ', pjname, ');\n');
                    }
                    else {
                        //builder.push('\t\t\t\tvar ', pmname, ': ', this.parameters[i].type, ' =  new ', this.parameters[i].type, '();\n');
                        builder.push('\t\t\t\tvar ', pmname, ': any = json2object(jsonObject.parameters[', i.toString(), ']);\n');
                        //builder.push('\t\t\t\tjson2object(', pmname, ', ', pjname, ');\n');
                    }
                    break;
            }
            //pmValues.push(pmname);
        }
        builder.push('\t\t\t\tvar ', this.parent.parent.name, '_', this.parent.name, '_', this.name, 'Result = ', this.parent.parent.name, '_', this.parent.name, '.', this.name, '(');





        
        //for (var i: number = 0; i < this.parameters.length; i++) {
        //    pmValues.push(pmbase + i.toString());
        //    //pmValues.push('<' + this.parameters[i].type + '>(jsonObject.parameters[' + i.toString() + '])');
        //}
        builder.push(pmValues.join(', '));
        builder.push(');\n');
        builder.push('\t\t\t\techo(json_encode(', this.parent.parent.name, '_', this.parent.name, '_', this.name, 'Result));\n');
        builder.push('\t\t\t\tbreak;\n');
        return builder.join('');
    }
    get service(): string {
        var builder: string[] = [];
        var pmNames: string[] = [];
        builder.push('\t\tpublic ', this.name, ' (');
        for (var i: number = 0; i < this.parameters.length; i++) {
            pmNames.push(this.parameters[i].client);
        }
        builder.push(pmNames.join(', '));
        builder.push('):', this.returnType, '{\n');
        builder.push('\t\t\treturn null;\n');
        builder.push('\t\t}\n');
        return builder.join('');
    }
}
class RPCParameter {
    public name: string;
    public type: string;
    get client(): string {
        return [this.name, ':', this.type].join('');
    }
    get service(): string {
        return [this.name, ':', this.type].join('');
    }
}


var appSoluble = new ngstd.AngularModule('pcr', []);

//this file defines the UI for php.html.
class CFCompileTask {
    public name: string;
    public compiled: boolean;
    public include: string;
    public status: string;
    public output: string[];
}
class CFController {
    static $inject = ['$http', '$scope'];

    public test: string;
    public http: ng.IHttpService;
    public scope: ng.IScope;
    public root: Root;
    constructor(public $http: ng.IHttpService, public $scope: ng.IScope) {
        this.http = $http;
        this.scope = $scope;
        this.scan();
    }
    public files: CFCompileTask[];
    public scan = () => {
        var po = new PHPPostObj();
        po.method = 'ScanCF';
        this.http.post('pcr.php', po)
            .success(this.onReceiveFiles);
    }
    public onReceiveFiles = (data: string[]) => {
        console.log(data);
        this.files = [];
        for (var i: number = 0; i < data.length; i++) {
            this.files.push({
                name: data[i], compiled: false, include: '',status:'detected', output: []
            });
        }
    }
    public compilerIndex: number = -1;
    public compile = () => {
        for (var i: number = 0; i < this.files.length; i++) {
            this.files[i].output = [];
        }
        //needs to get file from the server and compile them;
        if (this.compilerIndex < 0) {
            this.compilerIndex = 0;
            this.compileNext();
        }
    }
    public compileNext = () => {
        if (this.files[this.compilerIndex]) {
            var file = this.files[this.compilerIndex];
            this.http.get(file.name)
                .success(this.onReceiveCode);
        } else {
            //end of compiling
            this.compilerIndex = -1;
        }
    }
    public onError = (data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig): void => {
        console.log(headers);
        console.log('status: ' + status.toString());
    }

    public onReceiveCode = (code: string) => {


        var compiler = new CFCompiler(code);
        var file = this.files[this.compilerIndex];
        var po = new PHPPostObj()
        po.method = 'Write';

        //work out the //php and include
        var builder: string[] = [];
        //builder.push('<?php\n');
        //var phpincludes: string[] = [];

        for (var i: number = 0; i < compiler.databases.length; i++) {
            builder.push(compiler.databases[i].ts);
        }

        //builder.push('?>');

        var phpfile = new FileBuiler()
        phpfile.filename = file.name.replace('.ts', 'Data.ts');
        phpfile.content = builder.join('');

        file.status = 'compiled';
        file.output.push(phpfile.filename);

        po.value.push(phpfile);
        console.log(po);
        this.http.post('pcr.php', po)
            .success(this.onWritten)
            .error(this.onError);


    }
    public onWritten = (value: string) => {
        console.log(value);
        this.files[this.compilerIndex].compiled = true;
        //this.scope.$apply();
        this.compilerIndex += 1;
        this.compileNext();
    }
}

//app.addController('cf', CFController);

class RPCCompileTask {
    public name: string;
    public compiled: boolean;
    public compiler: RPCCompiler;
    public status: string;
    public output: string[];
}
class RPCController {
    static $inject = ['$http', '$scope'];

    public test: string;
    public http: ng.IHttpService;
    public scope: ng.IScope;
    public root: Root;
    constructor(public $http: ng.IHttpService, public $scope: ng.IScope) {
        this.http = $http;
        this.scope = $scope;
        this.scan();
    }
    public files: RPCCompileTask[];
    public scan = () => {
        var po = new PHPPostObj();
        po.method = 'ScanRPC';
        this.http.post('pcr.php', po)
            .success(this.onReceiveFiles);
    }
    public onReceiveFiles = (data: string[]) => {
        console.log(data);
        this.files = [];
        for (var i: number = 0; i < data.length; i++) {
            this.files.push({
                name: data[i], compiled: false, compiler: null, status: 'detected', output: []
            });
        }
    }
    public compilerIndex: number = -1;
    public compile = () => {
        //clear all the existing file outputs
        for (var i: number = 0; i < this.files.length; i++) {
            this.files[i].output = [];
        }
        //needs to get file from the server and compile them;
        if (this.compilerIndex < 0) {
            this.compilerIndex = 0;
            this.compileNext();
        }
    }
    public compileNext = () => {
        if (this.files[this.compilerIndex]) {
            var file = this.files[this.compilerIndex];
            this.http.get(file.name)
                .success(this.onReceiveCode);
        } else {
            //end of compiling
            this.compilerIndex = -1;
            this.root.php.scan();
        }
    }
    public onError = (data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig): void => {
        console.log(headers);
        console.log('status: ' + status.toString());
    }
    public onReceiveCode = (code: string) => {
        var compiler = new RPCCompiler(code);
        this.files[this.compilerIndex].compiler = compiler;
        var po = new PHPPostObj()
        po.method = 'Get';
        var filename = this.files[this.compilerIndex].name;
        //var fClient = new FileBuiler();
        //fClient.filename = filename.substr(0,filename.length-3) + 'Client.ts';
        //fClient.content = compiler.client;
        //po.value.push(fClient);
        for (var i: number = 0; i < compiler.modules.length; i++) {
            var fServer = new FileBuiler();
            fServer.filename = compiler.modules[i].name + '.ts';
            fServer.content = '';// compiler.modules[i].service;
            po.value.push(fServer);
        }
        //console.log(po);
        this.http.post('pcr.php', po)
            .success(this.onResovleCode)
            .error(this.onError);
    }
    public onResovleCode = (code: string[]) => {
        //console.log(code);
        var file = this.files[this.compilerIndex];
        var compiler = file.compiler;
        var po = new PHPPostObj()
        po.method = 'Write';
        var filename = this.files[this.compilerIndex].name;
        var fClient = new FileBuiler();
        fClient.filename = filename.substr(0, filename.length - 3) + 'Client.ts';
        fClient.content = compiler.client;
        file.output.push(fClient.filename);
        po.value.push(fClient);
        for (var i: number = 0; i < compiler.modules.length; i++) {
            var fServer = new FileBuiler();
            fServer.filename = compiler.modules[i].name + '.ts';
            fServer.content = compiler.modules[i].implant(code[i], compiler.modules[i].name);
            po.value.push(fServer);
            file.output.push(fServer.filename);
        }
        file.status = 'compiled';
        //console.log(po);
        this.http.post('pcr.php', po)
            .success(this.onCompiled)
            .error(this.onError);
    }
    public onCompiled = (value: string) => {
        //console.log(value);
        this.files[this.compilerIndex].compiled = true;
        //this.scope.$apply();
        this.compilerIndex += 1;
        this.compileNext();
    }
}


//app.addController('rpc', RPCController);

//this file defines the UI for php.html.
class PHPCompileTask {
    public name: string;
    public compiled: boolean;
    public include: string[];
    public require: string[];
    public code: string;
    public status: string;
    public output: string[];
    public prepared: string;
}
class PHPController {
    static $inject = ['$http', '$scope'];

    public test: string;
    public http: ng.IHttpService;
    public scope: ng.IScope;
    public root: Root;
    constructor(public $http: ng.IHttpService, public $scope: ng.IScope) {
        this.http = $http;
        this.scope = $scope;
        this.scan();
    }
    public files: PHPCompileTask[];
    public scan = () => {
        var po = new PHPPostObj();
        po.method = 'ScanPHP';
        this.http.post('pcr.php', po)
            .success(this.onReceiveFiles);
    }
    public onReceiveFiles = (data: string[]) => {
        console.log(data);
        this.files = [];
        for (var i: number = 0; i < data.length; i++) {
            this.files.push({
                name: data[i], compiled: false, include: [], require: [], code: '', status: 'detected', output: [], prepared: null
            });
        }
    }
    public compilerIndex: number = -1;
    public compile = () => {
        for (var i: number = 0; i < this.files.length; i++) {
            this.files[i].output = [];
        }
        //needs to get file from the server and compile them;
        if (this.compilerIndex < 0) {
            this.compilerIndex = 0;
            this.compileNext();
        }
    }
    public compileNext = () => {
        if (this.files[this.compilerIndex]) {
            var file = this.files[this.compilerIndex];
            this.http.get(file.name)
                .success(this.onReceiveCode);
        } else {
            //end of compiling
            this.compilerIndex = -1;
        }
    }
    public onError = (data: any, status: number, headers: ng.IHttpHeadersGetter, config: ng.IRequestConfig): void => {
        console.log(headers);
        console.log('status: ' + status.toString());
    }

    public onReceiveCode = (code: string) => {
        //console.log(code);
        var mi = CompilerPattern.ptnPHPInclude.Match(code);
        var includevalues = mi.groups[2];
        //var requirevalues = mi.groups[5];
        var file: PHPCompileTask = this.files[this.compilerIndex];
        file.include = [];
        file.code = code;
        //console.log('onReceiveCode' + includevalues);
        if (includevalues) {
            if (includevalues.length > 0) {
                var mcIncludes = CompilerPattern.ptnIncludeFile.Matches(includevalues);
                for (var i: number = 0; i < mcIncludes.length; i++) {
                    //php includes.push(mcIncludes[i].groups[1]);
                    file.include.push(mcIncludes[i].groups[1])
                }
            }
            //here we need to get all the dependent files and check the modules
            var po = new PHPPostObj();
            po.method = 'Get';
            for (var i: number = 0; i < file.include.length; i++) {
                var fb = new FileBuiler();
                fb.filename = file.include[i] + '.ts';
                fb.content = '';
                po.value.push(fb);
            }
            for (var i: number = 0; i < file.require.length; i++) {
                var fb = new FileBuiler();
                fb.filename = file.include[i] + '.ts'; 
                fb.content = '';
                po.value.push(fb);
            }
            this.http.post('pcr.php', po)
                .success(this.onReceiveIncludes)
                .error(this.onError);
        }
        else {
            console.log('start compile');
            file.include = [];
            var compiler = new Pratphall.BrowserCompiler();
            var op = new Pratphall.PhpEmitOptions();
            var compiledcode: string;
            op.comments = true;
            op.indent = '\t';
            op.useElseif = true;
            op.openingFunctionBraceNextLine = true;
            op.openingTypeBraceOnNextLine = true;
            compiler.compile(op, 'module _PhpGeneralNamespaceEnforcingModule { }\n' + file.code, this.onCompiled);
        }
    }
    public onReceiveIncludes = (code: string[]) => {
        console.log(code);
        var file: PHPCompileTask = this.files[this.compilerIndex];
        var compiler = new Pratphall.BrowserCompiler();
        var op = new Pratphall.PhpEmitOptions();
        var compiledcode: string;
        op.comments = true;
        op.indent = '\t';
        op.useElseif = true;
        op.openingFunctionBraceNextLine = true;
        op.openingTypeBraceOnNextLine = true;
        for (var i: number = 0; i < code.length; i++) {
            var mt = /[\w\/]/.Match(code[i]);
            code[i] = code[i].substr(mt.index);
        }
        file.prepared = code.join('\n') + '\n module _PhpGeneralNamespaceEnforcingModule { }\n' + file.code;
        console.log(code[0].charCodeAt(0));
        //console.log(prepared);
        
        compiler.compile(op, file.prepared, this.onCompiled);
    }
    public onCompiled = (compiled: string, errors: any[], warnings: any[]) => {
        var file: PHPCompileTask = this.files[this.compilerIndex];
        var po = new PHPPostObj()
        po.method = 'Write';
        //work out the //php and include
        var builder: string[] = [];
        builder.push('<?php\n');
        var phpfile = new FileBuiler()
        phpfile.filename = this.files[this.compilerIndex].name.replace('.ts', '.php');
        var hasCode: boolean = false;
        if (compiled) if (compiled.length > 0) {
            builder.push(compiled);
            hasCode = true;
        }
        if (!hasCode) builder.push(file.prepared);
        //builder.push(compiled.split(/namespace\s+[\w]+\s+\{\s*\}/g).join(''));
        builder.push('?>');
        phpfile.content = builder.join('');
        file.status = 'compiled';
        file.output.push(phpfile.filename);
        po.value.push(phpfile);
        //console.log(po);
        this.http.post('pcr.php', po)
            .success(this.onWritten)
            .error(this.onError);
    }
    public onWritten = (value: string) => {
        //console.log(value);
        this.files[this.compilerIndex].compiled = true;
        //this.scope.$apply();
        this.compilerIndex += 1;
        this.compileNext();
    }
}

//app.addController('php', PHPController);

class Root {
    static $inject = ['$http', '$scope'];
    public http: ng.IHttpService;
    public scope: ng.IScope;
    public cf: CFController;
    public rpc: RPCController; 
    public php: PHPController;
    constructor(public $http: ng.IHttpService, public $scope: ng.IScope) {
        this.http = $http;
        this.scope = $scope;
        this.cf = new CFController($http, $scope);
        this.rpc = new RPCController($http, $scope);
        this.php = new PHPController($http, $scope);
        this.cf.root = this;
        this.rpc.root = this;
        this.php.root = this;
    }

}
appSoluble.addController('root', Root);