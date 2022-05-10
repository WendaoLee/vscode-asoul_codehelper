/*--------------------------------------------------------------------------------
 * Copyright (C) Wendao Lee (https://github.com/WendaoLee).All rights reserved.
 *--------------------------------------------------------------------------------*/
import { randomInt } from 'crypto';
import * as vscode from 'vscode'
import * as io from './modules/fileIO'
import { Maintainer } from './modules/Maintainer';

/**
 * 约束初始化维护器时传递的语料。它将为维护器指明当前记录的使用语言和打开的项目。
 */
interface MaintainerContext {
    language: string | undefined,
    projectname: string | undefined
}

/**
 * 用于定义CodingStatistic模块与插件本身的交互。
 * @deprecated saveData()原先用于插件在 deactivate时通过实例调用手动保存数据。
 * 但由于VSCode本身的设计问题，这个设计接口近于无用。我们改用vscode.command.excuteCommands实现关闭vscode时的数据保存。
 * @annotaion 详情可见github/vscode/issues/47881
 */
interface onStateChanged{
    saveData():void;
}

/**
 * 指示语料。主要用于提升代码的可读性。
 * @todo 分离运行环境语料与策略语料。
 */
enum ContextInfo {
    CONTEXT_INITIAL = "When initialization",
    CONTEXT_COMMAND = "When using related commonds",
    CONTEXT_WEBVIEW = "When openning Webview",
    CONTEXT_PACKDATA = "When packing data for webview",

    CONTEXT_PERIODIC = "periodic",
    CONTEXT_CACULATENUM = "caculateTime"
}

enum InitialContext{

}

enum ActivityContext{
    
}

/**
 * 提升代码可读性而考虑的枚举类。
 */
enum ArgsInfo {
    JSON = ".json",
    LOCALS = 'zh',
    AddSymbol = "\\"
}

/**
 * Coding时长统计模块。它将作为一个CodingStatistic实例存在在插件的Lifetime内（如果该功能块在设置中被启用的话）。
 * 
 * @todo 精简代码。
 * 
 * @module fileIO 用于本地数据的读写，它封装了Node.fs模块。
 * @module theMaintainer 维护器，它将维护统计数据，包括当日数据与本月数据。
 * @module theScheduler 调度器。它用于控制UI的显示与对维护器的操作。
 * 
 * @event event_PeriodUpdate 周期更新事件。它本身是一个无限循环的计时器，即timer。它每隔一段时间周期性保存数据到本地。
 * 
 * @constant kDataFolder 本地数据存储目录。
 * @constant kDataPath 本地数据的存储路径。
 * @constant kDateTime 当日时间。
 * 
 * 
 * @member theStatusBar 模块的显示UI控件。
 */
export class CodingStatistic implements onStateChanged{

    /**
     * 本地统计数据所存储的根目录。
     * @example kDataFolder:'theExtensionPath/data/'
     */
    private kDataFolder:string;

    /**
     * 今日统计数据所在的数据存储目录。
     * @example ifTime:'2022/4/22' kDataPath:'theExtensionPath/data/2022/'
     */
    private kDataPath: string;

    /**
     * 今日日期，统一采用中国时制（'zh'）
     * @example kDateTime:'2022/04/22'
     */
    private kDateTime: string;

    /**
     * 插件所需的一些依赖资源的存储根目录。
     * @example kResourcePath:'theExtensionPath/resources'
     */
    private kResourcePath:string;

    /**
     * @module theMaintainer 维护器，它将维护统计数据，包括当日数据与本月数据。
     */
    private theMaintainer: Maintainer;


    /**
     * @event event_PeriodUpdate 周期更新事件。它本身是一个无限循环的计时器。每隔一段时间周期性更新数据。
     */
    private event_PeriodUpdate: NodeJS.Timeout;


    /**
     * @module theScheduler 调度器。它用于控制UI的显示与对维护器的操作。
     */
    private theScheduler: object = {};


    /**
     * @member theStatusBar 模块的显示UI控件。
     */
    private theStatusBar: vscode.StatusBarItem;

    constructor(vscode_context: vscode.ExtensionContext, t: Date) {

        let conf = vscode.workspace.getConfiguration('a-soul-codehelper');
        
        this.kDataFolder = vscode_context.extensionPath + "\\data\\";
        this.kDataPath = vscode_context.extensionPath + "\\data\\" + t.getFullYear();
        this.kDateTime = t.toLocaleDateString(ArgsInfo.LOCALS);

        this.kResourcePath = vscode_context.extensionPath + "\\resources\\";

        this.theScheduler = this.initialScheduler();

        this.theStatusBar = this.initialStatusBar();
        this.theStatusBar.show()

        //下面是创建必备的数据文件及初始化维护器
        io.createFolder(
            this.kDataPath,
            ContextInfo.CONTEXT_INITIAL);

        this.theMaintainer = this.initialMaintainer(
            this.kDataPath + "\\" + (t.getMonth() + 1) + ArgsInfo.JSON,
            {
                "language": vscode.window.activeTextEditor?.document.languageId,
                "projectname": vscode.workspace.name
            });

        /**
         * 保存本地数据数据命令。它将在一个周期中调用。
         */
        const updateLocalData = vscode.commands.registerCommand("a-soul-codehelper.updateData", () => {
            this.theScheduler["saveLocalData"]();
            this.theScheduler["packLatestData"]();
            console.log("works!")
        })

        /**
         * 注册打开Webview页面的命令
         * 它同时定义了：
         * Webview --> Extension
         * Extension --> Webview 
         * 的消息传输
         */
        const kWebView = vscode.commands.registerCommand("a-soul-codehelper.openWebview", () => {
            const panel = vscode.window.createWebviewPanel(
                'codingStatistic',
                '代码日历~',
                vscode.ViewColumn.One,
                {
                    enableScripts: true
                }
            );

            this.theScheduler["saveLocalData"]();//对于当天第一次打开Webview时本地数据未保存进而造成无法查阅当日数据的临时解决方案。之后会改。@todo 等日后有更好方案进行更改。
            this.theScheduler["packLatestData"](); //打包最新数据。

            /**
             * 随机图片以及渲染方式的参数设置
             */
            let pics = conf.get<Array<string>>("codingStatistic.WebviewPic") as Array<string>;
            let choose;
            if(pics != undefined){
                choose =  panel.webview.asWebviewUri(vscode.Uri.file(this.kResourcePath + "pic\\" + pics[randomInt(pics.length)])).toString();
            }
            let render = conf.get<string>('codingStatistic.WebviewRenderKind') as string;

            //将资源文件路径转为vscode访问的路径
            const expr = /(?<=src=")(.+?\/)|(?<=href=")(.+?\/)/g;
            const uri = vscode.Uri.file(this.kResourcePath).with({scheme:'vscode-resource'}).toString();
            
            panel.webview.html = io.getWebviewTemplate(
                vscode_context.extensionPath + "/resources/index.html",
                ContextInfo.CONTEXT_WEBVIEW
            ).toString().replace(expr,uri);

    
            /**
             * 初始化时，Extension发送至Webview的消息数据。它包括日历数据、图片以及渲染方式的指定。
             */
            panel.webview.postMessage(
                {
                    type:"initial",
                    data:io.getLocalData(this.kDataFolder + "pack_data.json",ContextInfo.CONTEXT_WEBVIEW),
                    pic:choose,
                    renderKind:render
                }
            );

            /**
             * 从Webview中接受响应。而后从本地读取对应数据后返回数据给Webview进行渲染
             * @example message:'2022/4/25'
             */
            panel.webview.onDidReceiveMessage(message =>{
                let target = message.split("/");
                let operObj =  io.getLocalData(this.kDataFolder + "\\" + target[0] + "\\" + target[1] + ArgsInfo.JSON,ContextInfo.CONTEXT_WEBVIEW);
                panel.webview.postMessage(
                    {
                        type:"update",
                        data:operObj[message]
                    }
                )
            })

        })


        this.theScheduler["periodicUpdate"]();//在statusbar上显示今日代码时长

        // vscode_context.subscriptions.push(this.theStatusBar);
        
        this.initialListener();

        //初始化周期更新事件。
        this.event_PeriodUpdate = this.initialTimeCycle(conf.get<number>('codingStatistic.timecycle') as number);       

    }

    /**
     * @deprecated 见定义其的接口描述。
     */
    saveData(): void {
        clearInterval(this.event_PeriodUpdate);
        this.theScheduler["saveLocalData"]();
    }

    /**
     * 初始化调度器。它是一个使用策略模式封装了函数、从而实现多态的对象。
     * @function periodicUpdate() 唤起维护器更新当日统计数据,并更新StatusBar的状态。
     * @function saveLocalData() 唤起维护器更新当日统计数据后保存所有数据至本地。
     * @function packLatestData() [experiment]将最新数据打包，存储至数据概览性的pack_data.json文件中。该数据主要用于Webview的日历展示。@todo 在未来有更好的方式时改写。 @todo 数据清空时无法写入文件。
     */
    private initialScheduler() {
        let that = this;
        return {
            periodicUpdate: function () {
                that.theStatusBar.text ="$(clock) "+that.theMaintainer.updateData(ContextInfo.CONTEXT_PERIODIC) as string;
            },
            saveLocalData:function(){
                io.updateLocalData(that.kDataPath + "\\" + (that.kDateTime.split("/")[1]) + ArgsInfo.JSON,
                  that.theMaintainer.getLocalData(), ContextInfo.CONTEXT_COMMAND)
            },
            /**
             * @todo 精简并改写代码。
             */
            packLatestData:function(){
                let args:string;
                if(io.existUrl(args = that.kDataFolder + "pack_data.json")){
                    let temp = io.getLocalData(args,ContextInfo.CONTEXT_PACKDATA);
                    //不想嵌套if，好丑......之后再改吧。
                    if(temp[temp.length - 1][0] == that.kDateTime){
                        temp[temp.length - 1] = [
                            that.kDateTime,
                            that.theMaintainer.updateData(ContextInfo.CONTEXT_CACULATENUM)
                        ]
                        io.updateLocalData(args,temp,ContextInfo.CONTEXT_PACKDATA);
                        return;
                    }
                    else{
                        temp[temp.length] = [
                            that.kDateTime,
                            that.theMaintainer.updateData(ContextInfo.CONTEXT_CACULATENUM)
                        ]
                        io.updateLocalData(args,temp,ContextInfo.CONTEXT_PACKDATA);
                    }
                }
                else{
                    let temp = [
                        [
                            that.kDateTime,
                            that.theMaintainer.updateData(ContextInfo.CONTEXT_CACULATENUM)
                        ]
                    ];
                    io.updateLocalData(args,temp,ContextInfo.CONTEXT_PACKDATA);
                }
            },
            changeLanguage:function(){
                
                if(vscode.window.activeTextEditor?.document.languageId != undefined){
                    console.log("language change activate at " + vscode.window.activeTextEditor?.document.languageId);
                    that.theMaintainer.updateData("changedLanguage");
                }
            }
        }
    }

    /**
     * 初始化维护器。它将从本地数据文件中读取数据储存至维护器中。
     * @param path 本地数据存储路径,具体到文件名。如果储存文件不存在，则它会创建该文件。
     * @param maintainContext 维护器初始化所需的语料。它包括当前Project-name与language-name
     * @returns object:Maintainer
     */
    private initialMaintainer(path: string, maintainContext: MaintainerContext) {
        if (io.existUrl(path)) {
            return new Maintainer(maintainContext, io.getLocalData(path, ContextInfo.CONTEXT_INITIAL));
        } else {
            let temp = new Maintainer(maintainContext);
            io.updateLocalData(path, temp.getLocalData(), ContextInfo.CONTEXT_INITIAL);
            return temp;
        }
    }

    private initialStatusBar(){
        let temp = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        temp.text = "$(clock) initializing...";
        temp.tooltip = "今日代码时长~点击即可查看详细统计"
        temp.command = "a-soul-codehelper.openWebview";
        return temp;
    }

    private initialTimeCycle(cycle:number){
        return setInterval(() => {
            this.theScheduler["periodicUpdate"]();
            this.theScheduler["saveLocalData"]();
            this.theScheduler["packLatestData"]();
        }, cycle * 60000)
    }

    private initialListener(){
        vscode.window.onDidChangeActiveTextEditor(this.theScheduler["changeLanguage"])
    }



}
