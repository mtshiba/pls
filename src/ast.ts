type TokenKind = 'number' | 'string' | 'name' | 'let' | 'plus';

type Position = {
    line: number;
    character: number;
};
type Span = {
    start: Position;
    end: Position;
};

class Token {
    type: TokenKind;
    value: string;
    span: Span;

    constructor(type: TokenKind, value: string, span: Span) {
        this.type = type;
        this.value = value;
        this.span = span;
    }
}

type NumberExpr = {
    type: 'NumberExpr';
    token: Token;
};

type StringExpr = {
    type: 'StringExpr';
    token: Token;
};

type NameExpr = {
    type: 'NameExpr';
    token: Token;
};

type PlusExpr = {
    type: 'BinaryExpr';
    left: Expr;
    right: Expr;
};

type LetStmt = {
    type: 'LetStmt';
    name: Token;
    value: Expr;
};

type Expr = NumberExpr | StringExpr | NameExpr | PlusExpr;
type Stmt = LetStmt | Expr;
type Program = Stmt[];
