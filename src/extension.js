import { commands, window } from "vscode";
import { LanguageClient } from "vscode-languageclient/node";

let client; // : LanguageClient | undefined;

async function startLanguageClient(context) {
	try {
        const serverOptions = {
			command: "pls",
            args: [],
        };
		const clientOptions = {
			documentSelector: [
				{
					scheme: "file",
					language: "poor",
				},
			],
		};
		client = new LanguageClient("pls", serverOptions, clientOptions);
		await client.start();
	} catch (e) {
		window.showErrorMessage("Failed to start PLS (Poor Language Server).");
		window.showErrorMessage(`${e}`);
	}
}

async function restartLanguageClient() {
	try {
		if (client === undefined) {
			throw new Error();
		}
		await client.restart();
	} catch (e) {
		window.showErrorMessage("Failed to restart PLS (Poor Language Server).");
		window.showErrorMessage(`${e}`);
	}
}

export async function activate(context) {
	context.subscriptions.push(
		commands.registerCommand("poor.restartLanguageServer", () => restartLanguageClient())
	);
	await startLanguageClient(context);
}

export function deactivate() {
	if (client) {
		return client.stop();
	}
}
