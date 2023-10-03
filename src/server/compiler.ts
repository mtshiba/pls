import { Token, Span, Program } from "./ast.ts";

class Lexer {
    lex(input: string): Token[] {
        let tokens: Token[] = [];
        let line = 1;
        let character = 0;

        return tokens;
    }
}

type ParseError = {
    message: string;
    span: Span;
};
export type TypeCheckError = ParseError;
type ParseResult = {
    errors: ParseError[];
    program: Program;
}

class Parser {
    parse(tokens: Token[]): ParseResult {
        let errors: ParseError[] = [];
        let program: Program = [];

        return { program, errors };
    }
}

class TypeChecker {
    check(program: Program): TypeCheckError[] {
        return [];
    }
}

export type CompilerArtifact = {
    program: Program;
    errors: TypeCheckError[];
};

export class Compiler {
    public compile(input: string): CompilerArtifact {
        let lexer = new Lexer();
        let parser = new Parser();
        let checker = new TypeChecker();

        let tokens = lexer.lex(input);
        let { program, errors } = parser.parse(tokens);
        let typeCheckErrors = checker.check(program);

        return {
            program,
            errors: [...errors, ...typeCheckErrors],
        };
    }
}
