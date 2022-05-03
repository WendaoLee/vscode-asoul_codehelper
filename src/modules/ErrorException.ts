/*--------------------------------------------------------------------------------
 * Copyright (C) Wendao Lee (https://github.com/WendaoLee).All rights reserved.
 *--------------------------------------------------------------------------------*/

/**
 * 抛出文件读写异常。它包括文件/文件夹创建与读取时发生的异常。
 * @constructor result: 错误造成的结果。
 * @constructor context：错误上下文，指示错误发生的地方。
 * @constructor error: 错误的详细原因。
 * @example constructor("When intialize","代码统计关闭",error) ->
 * 代码统计关闭 ||When intialize||SyntaxError: Unexpected token h in JSON at position 0.
 */
export class FileIOException extends Error{
    /**
     * 
     * @param result 错误造成的结果。
     * @param context 错误上下文，指示错误发生的地方。
     * @param error 错误的详细原因。
     */
    constructor(result:string,context:string,error:any){
        let message = result + "\n ||" + context +"\n ||" + error;
        console.log(message)
        super(message)
    }
}