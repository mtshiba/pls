import { Lexer } from '../compiler/lexer.ts';
import { TypeCheckError } from '../compiler/checker.ts';
import { Compiler } from '../compiler/compiler.ts';
import { Program, Token } from '../compiler/ast.ts';

import * as process from 'node:process';

type JSONRPC = {
    jsonrpc: '2.0';
    id?: number;
    method?: string;
    params?: any;
    result?: any;
    error?: any;
};

type Message = {
    jsonrpc: '2.0';
    id?: number;
    method?: string;
    params: any;
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

class Server {
    compiler: Compiler;
    program: Program;
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

    receive(): Message | null {
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
        let body = this.buffer.split("\r\n\r\n")[1];
        let payload = body.slice(0, length);
        if (payload.length == 0) {
            return null;
        }
        this.buffer = body.slice(length);
        try {
            return JSON.parse(payload);
        } catch (_e) {
            let fallback = JSON.parse(payload + this.buffer);
            this.buffer = "";
            return fallback;
        }
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

    dispatch(msg: Message) {
        if (msg.method == undefined) {
            this.handle_response(msg);
        } else if (msg.id == undefined) {
            this.handle_notification(msg);
        } else {
            this.handle_request(msg);
        }
    }

    handle_notification(msg: Message) {
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

    handle_request(msg: Message) {
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
                this.handle_semantic_tokens_full(msg);
                break;
            }
            default: {
                this.send_log(`Unknown request: ${msg.method}`);
            }
        }
    }

    handle_response(msg: Message) {
        this.send_log(`Unknown response: ${msg}`);
    }

    initialize(msg: Message) {
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
                    }
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

    handle_semantic_tokens_full(msg: Message) {
        let uri = msg.params.textDocument.uri;
        let input = this.fs.read(uri);
        let lexer = new Lexer();
        let { tokens } = lexer.lex(input);
        let data = [];
        let prev_token: Token = {
            type: "dummy",
            span: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 0 },
            },
            value: "",
        };
        for (let token of tokens) {
            let type: number;
            switch (token.type) {
                case "number": {
                    type = 0;
                    break;
                }
                case "string": {
                    type = 1;
                    break;
                }
                case "name": {
                    type = 2;
                    break;
                }
                case "equal":
                case "plus": {
                    type = 3;
                    break;
                }
                case "let": {
                    type =  4;
                    break;
                }
                default: {
                    continue;
                }
            }
            let deltaLine = token.span.start.line - prev_token.span.end.line;
            let deltaChar: number;
            if (deltaLine != 0) {
                deltaChar = token.span.start.character;
            } else {
                deltaChar = token.span.start.character - prev_token.span.start.character;
            }
            let length = token.value.length;
            let tokenModifiers = 0;
            data.push(deltaLine, deltaChar, length, type, tokenModifiers);
            prev_token = token;
        }
        let params = {
            data,
        };
        this.send_response(msg.id, params);
    }
}

function main() {
    const server = new Server();
    server.run();
}

if (import.meta["main"]) {
    main();
}
