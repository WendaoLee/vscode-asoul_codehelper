/*--------------------------------------------------------------------------------
 * Copyright (C) Wendao Lee (https://github.com/WendaoLee).All rights reserved.
 *--------------------------------------------------------------------------------*/

import * as io from 'fs';
import { FileIOException } from './ErrorException';

enum ErrorInfo{
    ERROR_GET_DATA_RESULT = "Getting data failed in ",
    ERROR_GET_WEBVIEW_TEMPLATE = "Getting webview template failded in",
    ERROR_UPDATE_DATA_RESULT = "Updating data failed in ",
    ERROR_CREATE_FOLDER_RESULT = "Creating folder failed in ",
    ERROR_CREATE_FILE_RESULT = "Creating file failed in "
}

/**
 * 获取本地数据。返回一个JSON对象用于操作。
 * @param url 数据文件所在路径。
 * @param context 指示该函数调用时所处的状态。用于错误抛出。
 * @returns Object:JSON
 */
export let getLocalData = (url:string,context:string) =>{
    try {
        return JSON.parse(io.readFileSync(url,"utf-8"));
    } catch (error) {  
        throw new FileIOException(ErrorInfo.ERROR_GET_DATA_RESULT+`"${url}"`,context,error);
    }
};

/**
 * 获取本地Webview的视觉模板。
 * @param url 数据文件所在路径。
 * @param context 指示该函数调用时所处的状态。用于错误抛出。
 * @returns string
 */
export let getWebviewTemplate = (url:string,context:string) =>{
    try {
        return io.readFileSync(url,"utf-8");
    } catch (error) {  
        throw new FileIOException(ErrorInfo.ERROR_GET_WEBVIEW_TEMPLATE+`"${url}"`,context,error);
    }
}

/**
 * 更新本地数据。如果数据文件不存在，它会自动创建。
 * @param url 数据文件所在路径。
 * @param data 数据内容。可为字符串或JSON对象。
 * @param context 指示该函数调用时所处的状态。用于错误抛出。
 */
export let updateLocalData = (url:string,data:string|Object,context:string)=>{
    try {
        typeof(data)=="string"?io.writeFileSync(url,data):io.writeFileSync(url,JSON.stringify(data));
    } catch (error) {
        throw new FileIOException(ErrorInfo.ERROR_UPDATE_DATA_RESULT+`"${url}"`,context,error);
    }
}

/**
 * 创建文件夹。它同时支持多级文件夹的创建。如'/a/b/c' 。
 * 已经存在该文件夹不会影响它的正常执行，也不会影响存放在该文件夹的数据。
 * @param url 文件夹所在父目录的位置。通常为vscode.extensions.getExtension获取的位置。
 * @param context 指示该函数调用时所处的状态。用于错误抛出。
 * @returns path
 */
export let createFolder = (url:string,context:string) =>{
    try{
        io.mkdirSync(url,{recursive:true}); //同步执行。无必要异步。
        return url;
    }catch(error){
        throw new FileIOException(ErrorInfo.ERROR_CREATE_FOLDER_RESULT+`"${url}"`,context,error);
    }
}

/**
 * [非常用函数]创建文件。
 * 警告：调用它的目的只为创建文件。如果该文件已存在，则会将该文件的内容重置为空。它不会是一个常用函数。
 * 务必在通过checkExitence()函数后决定是否调用。
 * @deprecated 请使用updateLocalData
 * @param url 文件所在父目录的位置。
 * @param context 指示该函数调用时所处的状态。用于错误抛出。
 */
export let createFile = (url:string,context:string)=>{
    try {
        io.writeFileSync(url,"",{flag:'w'});
    } catch (error) {
        throw new FileIOException(ErrorInfo.ERROR_CREATE_FILE_RESULT+`"${url}"`,context,error);
    }
}

/**
 * 检查文件/路径是否存在。
 * 通常用于检查文件存在性。
 * @param url 文件路径。
 * @returns 存在则返回true，反之则false
 */
export let existUrl = (url:string):boolean=>{
    return io.existsSync(url);
}

