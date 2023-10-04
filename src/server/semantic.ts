import { Token } from "../compiler/ast.ts";
import { Lexer } from "../compiler/lexer.ts";
import { Request, Server } from "./server.ts";

export function handle_semantic_tokens_full(server: Server, msg: Request) {
    let uri = msg.params.textDocument.uri;
    let input = server.fs.read(uri);
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
    let result = {
        data,
    };
    server.send_response(msg.id, result);
}
