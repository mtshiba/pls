import { TypeCheckError } from '../compiler/checker.ts';
import { Compiler } from '../compiler/compiler.ts';
import { Program } from '../compiler/ast.ts';

import { handle_semantic_tokens_full } from './semantic.ts';
import { handle_completion } from './completion.ts';
import { handle_hover } from './hover.ts';

import * as process from 'node:process';

export type JSONRPC = {
    jsonrpc: '2.0';
    id?: number;
    method?: string;
    params?: any;
    result?: any;
    error?: any;
};
export type Request = {
    jsonrpc: '2.0';
    id: number;
    method: string;
    params: any;
};
export type Notification = {
    jsonrpc: '2.0';
    method: string;
    params: any;
};
export type Response = {
    jsonrpc: '2.0';
    id: number;
    result: any;
};

class VirtualFileSystem {
    files: { [path: string]: string } = {};

    public read(path: string): string {
        return this.files[path];
    }

    public write(path: string, contents: string) {
        this.files[path] = contents;
    }
}

export class Server {
    compiler: Compiler = new Compiler();
    program: Program | null = null;
    fs: VirtualFileSystem = new VirtualFileSystem();
    buffer: string = "";

    public run() {
        process.stdin.setEncoding('utf8');
        process.stdin.on('readable', () => {
            let msg = this.receive();
            if (msg !== null) {
                this.dispatch(msg);
            }
        });
    }

    receive(): JSONRPC | null {
        let input = process.stdin.read();
        // The message may be interrupted and `stdin.read()` may return `null`.
        // So, `Server` stores the message in a `buffer` until a complete message is ready.
        while (input !== null) {
            this.buffer += input;
            input = process.stdin.read();
        }
        let length: number;
        if (this.buffer.startsWith("Content-Length: ")) {
            length = parseInt(this.buffer.split("\r\n\r\n")[0].split(": ")[1]);
        } else {
            return null;
        }
        let body = this.buffer.split("\r\n\r\n").slice(1).join("\r\n\r\n");
        let payload = body.slice(0, length);
        if (payload.length == 0) {
            return null;
        }
        this.buffer = body.slice(length);
        return JSON.parse(payload);
    }

    send(json: JSONRPC) {
        let payload = JSON.stringify(json);
        let msg = `Content-Length: ${payload.length}\r\n\r\n${payload}`;
        process.stdout.write(msg);
    }

    send_notification(method: string, params: any) {
        this.send({
            jsonrpc: '2.0',
            method,
            params,
        });
    }

    send_response(id: number, result: any) {
        this.send({
            jsonrpc: '2.0',
            id,
            result,
        });
    }

    send_log(msg: string) {
        let params = {
            type: 3,
            message: msg,
        };
        this.send_notification('window/logMessage', params);
    }

    dispatch(msg: JSONRPC) {
        if (msg.method == undefined) {
            let resp = msg as Response;
            this.handle_response(resp);
        } else if (msg.id == undefined) {
            let notif = msg as Notification;
            this.handle_notification(notif);
        } else {
            let req = msg as Request;
            this.handle_request(req);
        }
    }

    handle_notification(msg: Notification) {
        switch (msg.method) {
            case "initialized": {
                this.send_log("successfully bounded");
                break;
            }
            case 'textDocument/didOpen': {
                this.send_log(`didOpen: ${JSON.stringify(msg)}`);
                let uri = msg.params.textDocument.uri;
                let input = msg.params.textDocument.text;
                this.fs.write(uri, input);
                this.check(uri, input);
                break;
            }
            case 'textDocument/didChange': {
                this.send_log(`didChange: ${JSON.stringify(msg)}`);
                let uri = msg.params.textDocument.uri;
                for (let change of msg.params.contentChanges) {
                    this.fs.write(uri, change.text);
                    // this.check(uri, change.text);
                }
                break;
            }
            case 'textDocument/didSave': {
                this.send_log(`didSave: ${JSON.stringify(msg)}`);
                let uri = msg.params.textDocument.uri;
                let input = this.fs.read(uri);
                this.check(uri, input);
                break;
            }
            default: {
                this.send_log(`Unknown notification: ${msg.method}`);
            }
        }
    }

    handle_request(msg: Request) {
        switch (msg.method) {
            case 'initialize': {
                this.initialize(msg);
                break;
            }
            case 'shutdown': {
                this.send_response(msg.id, null);
                break;
            }
            case 'exit': {
                process.exit(0);
            }
            case 'textDocument/semanticTokens/full': {
                this.send_log(`semanticTokens/full: ${JSON.stringify(msg)}`);
                handle_semantic_tokens_full(this, msg);
                break;
            }
            case 'textDocument/completion': {
                this.send_log(`completion: ${JSON.stringify(msg)}`);
                handle_completion(this, msg);
                break;
            }
            case 'textDocument/hover': {
                this.send_log(`hover: ${JSON.stringify(msg)}`);
                handle_hover(this, msg);
                break;
            }
            default: {
                this.send_log(`Unknown request: ${msg.method}`);
            }
        }
    }

    handle_response(msg: Response) {
        this.send_log(`Unknown response: ${msg}`);
    }

    initialize(msg: Request) {
        this.send_response(
            msg.id,
            {
                capabilities: {
                    textDocumentSync: 1, // FULL
                    semanticTokensProvider: {
                        range: false,
                        full: true,
                        legend: {
                            tokenTypes: [
                                "number",   // 0
                                "string",   // 1
                                "variable", // 2
                                "operator", // 3
                                "keyword",  // 4
                            ],
                            tokenModifiers: []
                        }
                    },
                    completionProvider: {
                        resolveProvider: false,
                        triggerCharacters: [" "]
                    },
                    hoverProvider: true,
                },
            },
        )
    }

    check(uri: string, input: string) {
        this.compiler = new Compiler();
        let { program, errors } = this.compiler.compile(input);
        this.program = program;
        this.send_diagnostics(uri, errors);
    }

    send_diagnostics(uri: string, errors: TypeCheckError[]) {
        let diags = [];
        for (let error of errors) {
            diags.push({
                range: error.span,
                severity: 1, // ERROR
                source: 'pls',
                message: error.message,
            });
        }
        let params = {
            uri,
            diagnostics: diags,
        };
        this.send_notification('textDocument/publishDiagnostics', params);
    }
}

function main() {
    const server = new Server();
    server.run();
}

if (import.meta.main) {
    main();
}
