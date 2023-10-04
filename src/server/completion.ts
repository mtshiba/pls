import { Request, Server } from "./server.ts";

export function handle_completion(server: Server, msg: Request) {
    // let uri = msg.params.textDocument.uri;
    // let position = msg.params.position;
    let items = [];
    for (let [name, varInfo] of Object.entries(server.compiler.checker.context.names)) {
        items.push({
            label: name,
            kind: 6, // VARIABLE
            detail: varInfo.type,
        });
    }
    let result = {
        isIncomplete: false,
        items,
    };
    server.send_response(msg.id, result);
}
