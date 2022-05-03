/*--------------------------------------------------------------------------------
 * Copyright (C) Wendao Lee (https://github.com/WendaoLee).All rights reserved.
 *--------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

/**
 * SearcherList用于约束从configuration中获取的关于搜索方式的数据的内容。
 * @member name 是显示在Lightbulb上的名字
 * @member url 是对应的链接与参数
 * @member enabled TODO(leewendao@outlook.com):待定使用的参数，用于指示该搜索方式是否启用。目前来看VSCode并没有便捷更改配置文件的API，故而暂时不用。
 */
interface SearcherList{
    name:string,
    url:string,
    enabled?:boolean
}

/**
 * ProblemSearcher类用于注册搜索方式对应的CodeAction
 * @implements vscode.CodeActionProvider 提供CodeAction
 * 
 * @member searcher_list_:SearcherList[] 储存配置的搜索方式信息。由接口SearcherList约束。
 * 
 * @function provideCodeActions 继承自CodeActionProvider,返回CodeAction[]，里面包括了所有搜索方式的名字与搜索参数。每一次插件激活时都会被调用。
 */
export class ProblemSearcher implements vscode.CodeActionProvider {

    private searcher_list_:SearcherList[];

    /**
     * 初始化配置文件信息与搜索命令的注册
     * @param context  VSCode Extension Context
     */
    constructor(context:vscode.ExtensionContext){

        const kConfig = vscode.workspace.getConfiguration("a-soul-codehelper").problemSearcher.list;
        this.searcher_list_ = kConfig;

        const command  = vscode.commands.registerCommand("a-soul-codehelper.problemsearcher",this.CodeAction);
        context.subscriptions.push(command)    
    }


    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[]{

        let code_action_array:vscode.CodeAction[] = [];

        this.searcher_list_.forEach(element => {
            let code_action_item:vscode.CodeAction = new vscode.CodeAction(element.name,vscode.CodeActionKind.QuickFix);
            code_action_item.command = {
                command:"a-soul-codehelper.problemsearcher",
                title:"a-soul-codehelper.problemsearcher",
                arguments:[context.diagnostics[0],document.languageId,element.url]
            }
            code_action_array.push(code_action_item);
        });
        return code_action_array;
    }

    /**
     * 初始化时所注册命令对应的回调函数。用于指定CodeAction对应的具体行为。它将打开浏览器进行搜索
     * @param context 诊断信息。具体的错误信息。
     * @param lan 该错误信息所对应的具体语言。它将通过标签"[]"绑定搜索内容，这对于网站精确搜索范围（尤其是stackoverflow一类支持tag搜索的网站）具有很大帮助。
     * @param url 使用的搜索url。
     */
    private CodeAction = (context:vscode.Diagnostic,lan:string,url:string)=>{  
        if(context == undefined){
            vscode.window.showInformationMessage("非常抱歉，这里并没有报错或警告信息哦~")
            return;
        }     
        let tag = "[" + lan + "]"
        let uri = url + tag + context.message;
        vscode.env.openExternal(vscode.Uri.parse(uri));   

    }

}