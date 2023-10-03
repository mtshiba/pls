import { Program } from "./ast.ts";
import { Lexer } from "./lexer.ts";
import { Parser, ParseError } from "./parser.ts";
import { TypeChecker, TypeCheckError } from "./checker.ts";

export type CompilerArtifact = {
    program: Program;
    errors: TypeCheckError[];
};

export class Compiler {
    public compile(input: string): CompilerArtifact {
        let lexer = new Lexer();
        let parser = new Parser();
        let checker = new TypeChecker();

        let { tokens, errors: lexErrors } = lexer.lex(input);
        let { program, errors: parseErrors } = parser.parse(tokens);
        let typeCheckErrors = checker.check(program);

        return {
            program,
            errors: [...lexErrors, ...parseErrors, ...typeCheckErrors],
        };
    }
}

function main() {
    let input = `
let i = 1

i + "aaa"
`;
    let compiler = new Compiler();
    let { program, errors } = compiler.compile(input);
    console.log(program);
    console.log(errors);
}

if (import.meta["main"]) {
    main();
}
