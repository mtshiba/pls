export type TokenKind = 'number' | 'string' | 'name' | 'let' | 'equal' | 'plus' | 'lparen' | 'rparen' | 'newline' | 'eof' | 'dummy';

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
    plusToken: Token;
    right: Expr;
};

export type LetStmt = {
    type: 'LetStmt';
    letToken: Token;
    name: Token;
    value: Expr;
};

export type DummyExpr = {
    type: 'DummyExpr';
    tokens: Token[];
};

export type DummyStmt = {
    type: 'DummyStmt';
    tokens: Token[];
};

export type PrimaryExpr = NumberExpr | StringExpr | NameExpr | DummyExpr;
export type Expr = PrimaryExpr | PlusExpr;
export type Stmt = LetStmt | Expr | DummyStmt;
export type Program = Stmt[];

export function spanOf(stmt: Stmt): Span {
    switch (stmt.type) {
        case 'LetStmt': {
            return {
                start: stmt.letToken.span.start,
                end: spanOfExpr(stmt.value).end,
            };
        }
        case 'DummyStmt': {
            return {
                start: stmt.tokens[0].span.start,
                end: stmt.tokens[stmt.tokens.length - 1].span.end,
            };
        }
        default: {
            return spanOfExpr(stmt);
        }
    }
}
export function spanOfExpr(expr: Expr): Span {
    switch (expr.type) {
        case 'NumberExpr':
        case 'StringExpr':
        case 'NameExpr':
            return expr.token.span;
        case 'BinaryExpr': {
            return {
                start: spanOfExpr(expr.left).start,
                end: spanOfExpr(expr.right).end,
            };
        }
        case 'DummyExpr': {
            return {
                start: expr.tokens[0].span.start,
                end: expr.tokens[expr.tokens.length - 1].span.end,
            };
        }
    }
}
