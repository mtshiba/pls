import { Expr, Program, Span, Stmt, spanOfExpr } from "./ast.ts";
import { Parser, ParseError } from "./parser.ts";

export type TypeCheckError = ParseError;

type Type = 'number' | 'string' | 'null' | 'failure';

type VarInfo = {
    name: string,
    def_name_span: Span,
    type: Type,
}

class Context {
    names: { [key: string]: VarInfo } = {};
}

export class TypeChecker {
    errors: TypeCheckError[] = [];
    context: Context = new Context();

    check(program: Program): TypeCheckError[] {
        for (let stmt of program) {
            this.checkStmt(stmt);
        }
        return this.errors;
    }

    checkStmt(stmt: Stmt) {
        switch (stmt.type) {
            case "LetStmt": {
                let name = stmt.name.value;
                let type = this.checkExpr(stmt.value);
                if (this.context.names[name] !== undefined) {
                    this.errors.push({
                        message: `Variable ${name} is already defined`,
                        span: stmt.name.span,
                    });
                    return;
                }
                let varInfo: VarInfo = {
                    name,
                    def_name_span: stmt.name.span,
                    type,
                };
                this.context.names[name] = varInfo;
                break;
            }
            case "DummyStmt": {
                break;
            }
            default: {
                this.checkExpr(stmt);
            }
        }
    }

    checkExpr(expr: Expr): Type {
        switch (expr.type) {
            case "NumberExpr": {
                return "number";
            }
            case "StringExpr": {
                return "string";
            }
            case "NameExpr": {
                let res = this.context.names[expr.token.value];
                if (res === undefined) {
                    this.errors.push({
                        message: `Undefined variable ${expr.token.value}`,
                        span: expr.token.span,
                    });
                    return "failure";
                }
                return res.type;
            }
            case "BinaryExpr": {
                let left = this.checkExpr(expr.left);
                let right = this.checkExpr(expr.right);
                if (left === "failure" || right === "failure") {
                    return "failure";
                }
                // NOTE: switch cannot compare arrays.
                switch ([left, right].toString()) {
                    case ["number", "number"].toString(): {
                        return "number";
                    }
                    case ["string", "string"].toString(): {
                        return "string";
                    }
                    default: {
                        this.errors.push({
                            message: `Type mismatch: ${left} + ${right}`,
                            span: spanOfExpr(expr),
                        });
                        return "failure";
                    }
                }
            }
            case "DummyExpr": {
                return "failure";
            }
        }
    }
}

import { Lexer } from "./lexer.ts";
function main() {
    let lexer = new Lexer();
    let parser = new Parser();
    let checker = new TypeChecker();
    let { tokens } = lexer.lex(`let x = 1 + 2\nx + 1\nx + "hello"`);
    let { program } = parser.parse(tokens);
    let checkErrors = checker.check(program);
    console.log(`Program: ${JSON.stringify(program, null, 4)}`);
    console.log(`Errors: ${JSON.stringify(checkErrors, null, 4)}`);
}

if (import.meta["main"]) {
    main();
}
