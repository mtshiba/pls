import { Expr, Position, Program, Stmt, contains, spanOf } from "../compiler/ast.ts";

export class Visitor {
    program: Program;

    constructor(program: Program) {
        this.program = program;
    }

    get(pos: Position): Expr | null {
        for (let stmt of this.program) {
            let expr = this.get_min_expr(stmt, pos);
            if (expr !== null) {
                return expr;
            }
        }
        return null;
    }

    get_min_expr(stmt: Stmt, pos: Position): Expr | null {
        switch (stmt.type) {
            case "LetStmt": {
                return this.get_min_expr(stmt.value, pos);
            }
            case "DummyStmt": {
                return null;
            }
            case "DummyExpr":
            case "NumberExpr":
            case "StringExpr":
            case "NameExpr": {
                if (contains(spanOf(stmt), pos)) {
                    return stmt;
                }
                break;
            }
            case "BinaryExpr": {
                let left = this.get_min_expr(stmt.left, pos);
                if (left !== null) {
                    return left;
                }
                let right = this.get_min_expr(stmt.right, pos);
                if (right !== null) {
                    return right;
                }
                break;
            }
        }
        return null;
    }
}
