import { Token, TokenKind, Program, Stmt, LetStmt, Expr, PrimaryExpr, NumberExpr, StringExpr, NameExpr, PlusExpr } from "./ast.ts";
import { LexerError } from "./lexer.ts";

export type ParseError = LexerError;
export type ParseResult = {
    errors: ParseError[];
    program: Program;
}

export class Parser {
    errors: ParseError[] = [];
    program: Program = [];
    tokens: Token[] = [];
    cursor: number = 0;

    peek(): Token {
        return this.tokens[this.cursor];
    }

    next() {
        if (!this.cur_is("eof")) {
            this.cursor++;
        }
    }

    cur_is(type: TokenKind): boolean {
        return this.peek().type === type;
    }

    next_line() {
        while (!this.cur_is("newline")) {
            this.next();
        }
        this.next();
    }

    expect(type: TokenKind) {
        if (!this.cur_is(type)) {
            this.errors.push({
                message: `Expected ${type}, but got ${this.peek().type}`,
                span: this.peek().span,
            });
        }
    }

    parse(tokens: Token[]): ParseResult {
        this.tokens = tokens;
        while (!this.cur_is("eof")) {
            this.program.push(this.parseStmt());
            while (this.cur_is("newline")) {
                this.next();
            }
        }
        return {
            errors: this.errors,
            program: this.program,
        };
    }

    parseString(input: string): ParseResult {
        let lexer = new Lexer();
        let { tokens, errors } = lexer.lex(input);
        let { program, errors: parseErrors } = this.parse(tokens);
        return {
            errors: [...errors, ...parseErrors],
            program,
        };
    }

    parseStmt(): Stmt {
        while (this.cur_is("newline")) {
            this.next();
        }
        switch (this.peek().type) {
            case "let": {
                return this.parseLetStmt();
            }
            default: {
                return this.parseExpr();
            }
        }
    }

    parseLetStmt(): LetStmt {
        this.expect("let");
        let letToken = this.peek();
        this.next();
        this.expect("name");
        let name = this.peek();
        this.next();
        this.expect("equal");
        let _equal = this.peek();
        this.next();
        let value = this.parseExpr();
        return {
            type: "LetStmt",
            letToken,
            name,
            value,
        };
    }

    parsePrimary(): PrimaryExpr {
        switch (this.peek().type) {
            case "number": {
                return this.parseNumberExpr();
            }
            case "string": {
                return this.parseStringExpr();
            }
            case "name": {
                return this.parseNameExpr();
            }
            default: {
                this.errors.push({
                    message: `Expected number, string, or name, but got ${this.peek().type}`,
                    span: this.peek().span,
                });
                let token = this.peek();
                if (!this.cur_is("eof")) {
                    this.next();
                }
                return {
                    type: "DummyExpr",
                    tokens: [token],
                };
            }
        }
    }

    parseExpr(): Expr {
        let left: Expr = this.parsePrimary();
        while (this.cur_is("plus")) {
            left = this.parseBinaryExpr(left);
        }
        return left;
    }

    parseNumberExpr(): NumberExpr {
        let token = this.peek();
        this.next();
        return {
            type: "NumberExpr",
            token,
        };
    }

    parseStringExpr(): StringExpr {
        let token = this.peek();
        this.next();
        return {
            type: "StringExpr",
            token,
        };
    }

    parseNameExpr(): NameExpr {
        let token = this.peek();
        this.next();
        return {
            type: "NameExpr",
            token,
        };
    }

    parseBinaryExpr(left: Expr): PlusExpr {
        this.expect("plus");
        let plusToken = this.peek();
        this.next();
        let right = this.parsePrimary();
        return {
            type: "BinaryExpr",
            left,
            plusToken,
            right,
        };
    }
}

import { Lexer } from "./lexer.ts";
function main() {
    let lexer = new Lexer();
    let parser = new Parser();
    let { tokens } = lexer.lex("let x = 1 + 2 + 3\n1");
    let { program, errors } = parser.parse(tokens);
    console.log(`Program: ${JSON.stringify(program, null, 4)}`);
    console.log(`Errors: ${JSON.stringify(errors)}`);
}

if (import.meta.main) {
    main();
}
