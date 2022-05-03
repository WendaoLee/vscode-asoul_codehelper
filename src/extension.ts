/*--------------------------------------------------------------------------------
 * Copyright (C) Wendao Lee (https://github.com/WendaoLee).All rights reserved.
 *--------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { ProblemSearcher } from './ProblemSearcher'
import { CodingStatistic } from './CodingStatistic';


var caculator: CodingStatistic

export function activate(context: vscode.ExtensionContext) {

	let conf = vscode.workspace.getConfiguration('a-soul-codehelper');

	const modules = ['problemSearcher','codingStatistic'];

	const modulesLoader = {
		'loadproblemSearcher':function(){
			const kProblemSearcher = vscode.languages.registerCodeActionsProvider(
				"*",
				new ProblemSearcher(context)
			);
			context.subscriptions.push(kProblemSearcher);
		},
		'loadcodingStatistic':function(){
			caculator = new CodingStatistic(context, new Date());
		}
	}

	for(const i of modules){
		conf.get(i+'.enable') == true?modulesLoader['load'+i]():console.log('The module ' + i + "is disabled");
	}

	/**
	 * 注册打开本地资源文件的命令。
	 * 它应该是一个通用命令，故而放在了插件初始化之中。
	 */
	vscode.commands.registerCommand("a-soul-codehelper.openResourcesFolder",()=>{
		vscode.env.openExternal(vscode.Uri.file(context.extensionPath));
	})

	/**
	 * 注册当设置更改时的消息提醒。
	 */
	vscode.workspace.onDidChangeConfiguration(()=>{
		vscode.window.showInformationMessage("来自ASoul_CodeHelper：一些设置可能要重新打开窗口才能生效。","立刻重启").then((click)=>{
			if(click){
				vscode.commands.executeCommand("workbench.action.reloadWindow");
			}		
		}
	)})
}

/**
 * vscode关闭或插件卸载时调用的函数，它将尝试保存最新数据到本地。但是因为vscode的设计问题，有概率失败。
 */
export function deactivate() {
	vscode.commands.executeCommand("a-soul-codehelper.updateData");
}
