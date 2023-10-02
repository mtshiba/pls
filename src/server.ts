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
    compiler: Compiler = new Compiler();
    program: Program | null = null;
    fs: VirtualFileSystem = new VirtualFileSystem();

    public run() {
        while (true) {
            let msg = this.recv();
            this.dispatch(msg);
        }
    }

    recv(): Message {
        return {
            jsonrpc: '2.0',
            params: {},
        };
    }

    dispatch(msg: Message) {
        switch (msg.method) {
            case 'textDocument/didOpen': {
                this.fs.write(msg.params.textDocument.uri, msg.params.textDocument.text);
                this.check(msg.params.textDocument.text);
                break;
            }
            case 'textDocument/didChange':
            case 'textDocument/didSave': {
                this.check(msg.params.textDocument.text);
                break;
            }
            default: {
                // console.log('Unknown method');
            }
        }
    }

    check(input: string) {
        let { program, errors } = this.compiler.compile(input);
        this.program = program;
        this.send_diagnostics(errors);
    }

    send_diagnostics(errors: TypeCheckError[]) {
        // console.log('Sending diagnostics');
    }
}
