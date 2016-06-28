/**
 * PHP Function: return char from ascii code ;
 * @param code
 */
declare function chr(code: number): string;
/**
 * PHP Function: generate random number code ;
 * @param length
 */
declare function random_number(length: number): string;
/**
 * PHP Function: get the integer value from a string;
 * @param value
 */
declare function intval(value: string): number;
/**
 * PHP Function: get the string value from a variable;
 * @param value
 */
declare function strval(value: any): string;
/**
 * PHP Function: begin a session;
 */
declare function session_start(): void;
/**
 * PHP Function: include a file;
 * @param value
 */
declare function include(value: string):void;
/**
 * PHP Function: generate a random number between from and to (including from and to);
 * @param from
 * @param to
 */
declare function rand(from: number, to: number): number;
/**
 * PHP Function: get subsection of a string;
 * @param value
 */
declare function substr(value: string, start: number, length?: number): number;
/**
 * PHP Function: get the length of a string;
 * @param value
 */
declare function strlen(value: string): number;
/**
 * PHP Function: server values;
 */
declare var _SERVER:string[];
/**
 * PHP Function: sessoin values;
 */
declare var _SESSION: string[];
/**
 * PHP Function: get values;
 */
declare var _GET: string[];
/**
 * PHP Function: post values;
 */
declare var _POST: string[];
/**
 * PHP Function: decode json string into object
 * @param value
 */
declare function json_decode(value: string): any;
/**
 * PHP Function: encode object into json string
 * @param value
 */
declare function json_encode(value: any): string;
/**
 * PHP and TS Defined Function: convert json object to class object;
 * @param source
 */
declare function json2object(source: any): any;
/**
 * PHP and TS Defined Function: convert array of json objects to array of class objects
 * @param source
 */
declare function jsonArray2Array(source: any[]): any[];
/**
 * 
 * @param value
 */
declare function file_get_contents(value: string): any;
/**
 * PHP Function: send string value to output stream;
 * @param value
 */
declare function echo(value: string): void;
/**
 * PHP Function: convert a string to lower case;
 * @param value
 */
declare function strtolower(value: string): string;
/**
 * convert a string to upper case;
 * @param value
 */
declare function strtoupper(value: string): string;
/**
 * PHP Function: list all files in a directory
 * @param directory
 */
declare function scandir(directory: string): string[];
/**
 * PHP Function: initialize an array; 
 */
declare function array(...args: any[]): any[];
/**
 * PHP Function: determine if a value is in the array;
 * @param value
 * @param arr
 */
declare function in_array(value: any, arr: any[]): boolean;
/**
 * PHP Function: determine if a value is an array;
 * @param value
 * @param arr
 */
declare function is_array(value: any): boolean;
/**
 * remove the values of arr2 from arr1 to produce a new array
 * @param arr1
 * @param arr2
 */
declare function array_diff(arr1: any[], arr2: any[]): any[];
/**
 * PHP Functoin: join the strings with joiner
 * @param joiner
 * @param strings
 */
declare function implode(joiner: string, strings: string[]): string;
/**
 * PHP Function: count the length of the array
 * @param arr
 */
declare function count(_array: any): number;
/**
 * PHP Function: add a value to the end of an PHP array;
 * @param arr
 * @param value
 */
declare function array_push(arr: any[], value: any);
/**
 * PHP Function: add a value to the end of an PHP array; the return value is the removed array of values;
 * @param arr
 * @param value
 */
declare function array_splice(arr: any[], index: number, numberofremovad: number, ...insertedvalues: any[]): any[];
/**
 * PHP Function: build the reference array of the give values;
 * @param values
 */
declare function build_ref_array(values: any[]): any[]; 
/**
 * PHP Function: get the size of the array;
 * @param arr
 */
declare function sizeof(arr: any[]): number;
/**
 * PHP Function:
 * @param resultmetadata
 */
declare function mysqli_fetch_field(resultmetadata: mysqli_result): MySQLiField;
/**
 * PHP Function: fetch the array from the mysql result;
 * @param result
 */
declare function mysqli_fetch_array(result: mysqli_result): any[];
/**
 * PHP Function: determine if a function exists. it could return a null if not existing. better to use if( ) to check its result.
 * @param functionname
 */
declare function function_exists(functionname: string): boolean; 
/**
 * PHP Function: release the resources held by the mysql result;
 * @param result
 */
declare function mysqli_free_result(result: mysqli_result): boolean;
/**
 * PHP Function: write value to the output stream;
 * @param value
 */
declare function echo(value: any);
/**
 * PHP Function: write value to the output stream;
 * @param value
 */
declare function print(value: string);
/**
 * PHP Function: write value to the output stream and close the transcation;
 * @param value
 */
declare function die(value: string);
/**
 * PHP Function: determine if a variable is set and is not NULL;
 * @param value
 */
declare function isset(value: any);
/**
 * PHP Function: perform a regular expression match, it only returns one match;
 * @param pattern
 * @param subject
 * @param matches
 */
declare function preg_match(pattern: string, subject: string, matches: string[][]): boolean;
/**
 * PHP Function: perform global regular expression match and returns all matches;
 * @param pattern
 * @param subject
 * @param matches
 */
declare function preg_match_all(pattern: string, subject: string, matches: string[][]): boolean;
/**
 * PHP Function: replace all the patterns in the input with replacement;
 * @param pattern
 * @param replacement
 * @param input
 */
declare function preg_replace(pattern: string, replacement: string, input: string): string;
/**
 * PHP Function: connect MySQL with mysqli interface; the new mysqli(....) method can cause typescript-php compiler error, so we don't use that;
 * @param server
 * @param username
 * @param password
 * @param database
 */
declare function mysqli_connect(server: string, username: string, password: string, database: string): mysqli;
/**
 * PHP Function: return the time in a number format, the unit is second;
 */
declare function time(): number;
/**
 * PHP Function: generae a unique id with given prefix;
 * @param prefix
 */
declare function uniqid(prefix?: string): string;
/**
 * PHP Function: write the given content to the file path;
 * @param filename
 * @param content
 * @flags null for overwrite, FILE_APPEND for appending.
 */
declare function file_put_contents(filename: string, content: string, flags?:any): boolean;
declare var FILE_APPEND;
/**
 * PHP Function: check if the file exists;
 * @param filename
 */
declare function file_exists(filename: string): boolean;
/**
 * PHP Function: delete a file;
 * @param filename
 */
declare function unlink (filename: string): boolean;
/**
 * PHP Function: convert string to number, compatible in ts and php;
 * @param value
 */
declare function str2num(value: string): number;
/**
 * PHP Function: convert number to string, compatible in ts and php;
 * @param value
 */
declare function num2str(value: string): number;
/**
 * PHP Function: get the number of current function's arguments;
 */
declare function func_num_args(): number;
/**
 * PHP Function: get the array of current function's arguments;
 */
declare function func_get_args(): any[];
/**
 * PHP Function: call the function by name and use the array as arguments for a function;
 */
declare function call_user_func_array(functionname: any, arguments: any[]): any;
declare class mysqli {
    public connect_error: string;
    public query(sql: string): mysqli_result;
    public stmt_init(): mysqli_stmt;
    insert_id: string;
    /**
     * PHP Function: close the MySQLi connection;
     */
    public close(): void;
    public error: string;
    public affected_rows: number;
    /**
     * PHP Function: this may be more supported by the hosting servers;
     * @param sql
     */
    public prepare(sql: string): mysqli_stmt;
}

declare class MySQLiField {
    public name: string;
}
declare class mysqli_result {
    
}
    

declare class mysqli_stmt {
    /**
     * get result metadata from mysql statement after 'execute'.
     */
    public result_metadata(): mysqli_result;
    /**
     * set the query string to the mysql statement;
     * @param sql
     */
    public prepare(sql: string): void;
    /**
     * Bind variables to the ? in the mysql query string;
     * @param types: i for int, d for double, s for string, b for blob;
     * @param args: arguments, the number of arguments must match the number of types; 
     */
    public bind_param(types: string, ...args: any[]): boolean;
    /**
     * execute the mysql statment so as to perform the query;
     */
    public execute(): boolean;
    /**
     * get result from MySql statement after 'execute';
     */
    public get_result(): mysqli_result; 

    insert_id: string;
    
    error: string;
    affected_rows: number;
}

declare class MySQLiResultMetadata extends mysqli_result {

}



//customized functions:

declare function GetStatementResults(stmt: mysqli_stmt): any[][];
declare function GetTypedStatementResults(stmt: mysqli_stmt, initializationcode: string): any[];
