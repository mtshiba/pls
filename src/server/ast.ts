export type TokenKind = 'number' | 'string' | 'name' | 'let' | 'plus';

export type Position = {
    line: number;
    character: number;
};
export type Span = {
    start: Position;
    end: Position;
};

export class Token {
    type: TokenKind;
    value: string;
    span: Span;

    constructor(type: TokenKind, value: string, span: Span) {
        this.type = type;
        this.value = value;
        this.span = span;
    }
}

export type NumberExpr = {
    type: 'NumberExpr';
    token: Token;
};

export type StringExpr = {
    type: 'StringExpr';
    token: Token;
};

export type NameExpr = {
    type: 'NameExpr';
    token: Token;
};

export type PlusExpr = {
    type: 'BinaryExpr';
    left: Expr;
    right: Expr;
};

export type LetStmt = {
    type: 'LetStmt';
    name: Token;
    value: Expr;
};

export type Expr = NumberExpr | StringExpr | NameExpr | PlusExpr;
export type Stmt = LetStmt | Expr;
export type Program = Stmt[];
