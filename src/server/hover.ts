import { exprToString } from "../compiler/ast.ts";
import { Request, Server } from "./server.ts";
import { Visitor } from "./visitor.ts";

export function handle_hover(server: Server, msg: Request) {
    let uri = msg.params.textDocument.uri;
    let position = msg.params.position;
    if (server.program === null) {
        let input = server.fs.read(uri);
        let { program } = server.compiler.compile(input);
        server.program = program;
    }
    let visitor = new Visitor(server.program);
    let expr = visitor.get(position);
    if (expr !== null) {
        let type = server.compiler.checker.checkExpr(expr);
        let result = {
            contents: {
                kind: "markdown",
                value: `\`\`\`poor
${exprToString(expr)}: ${type}
\`\`\``,
            },
        }
        server.send_response(msg.id, result);
    } else {
        server.send_response(msg.id, null);
    }
}
