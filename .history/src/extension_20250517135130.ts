import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "png-to-jpg" is now active!');

	const disposable = vscode.commands.registerCommand('png-to-jpg.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from png to jpg!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
