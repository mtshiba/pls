import { Token, TokenKind, Span } from "./ast.ts";

export type LexerError = {
    message: string;
    span: Span;
};
export type LexResult = {
    errors: LexerError[];
    tokens: Token[];
}

export class Lexer {
    errors: LexerError[] = [];
    tokens: Token[] = [];
    cursor: number = 0;
    line: number = 0;
    character: number = 0;
    input: string = "";

    peek(): string {
        return this.input.charAt(this.cursor);
    }

    // At this time, we assume that there is no multi-line token.
    consume(type: TokenKind, content: string): Token {
        let start = { line: this.line, character: this.character };
        let end = { line: this.line, character: this.character + content.length };
        this.character += content.length;
        let span = { start, end };
        return new Token(type, content, span);
    }

    lex(input: string): LexResult {
        this.input = input.replace("\r\n", "\n");
        while (true) {
            switch (this.peek()) {
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9": {
                    this.tokens.push(this.lexNumber());
                    break;
                }
                case "\"": {
                    this.cursor++;
                    this.tokens.push(this.lexString());
                    break;
                }
                case "=": {
                    this.cursor++;
                    this.tokens.push(this.consume("equal", "="));
                    break;
                }
                case "+": {
                    this.cursor++;
                    this.tokens.push(this.consume("plus", "+"));
                    break;
                }
                case "(": {
                    this.cursor++;
                    this.tokens.push(this.consume("lparen", "("));
                    break;
                }
                case ")": {
                    this.cursor++;
                    this.tokens.push(this.consume("rparen", ")"));
                    break;
                }
                case "l": {
                    if (this.input.substring(this.cursor, this.cursor + 3) === "let") {
                        this.cursor += 3;
                        this.tokens.push(this.consume("let", "let"));
                    } else {
                        this.tokens.push(this.lexName());
                    }
                }
                case " ": {
                    this.cursor++;
                    this.character++;
                    break;
                }
                case "\n": {
                    this.cursor++;
                    this.tokens.push(this.consume("newline", "\n"));
                    this.line++;
                    this.character = 0;
                    break;
                }
                case "": {
                    this.tokens.push(this.consume("eof", ""));
                    return {
                        errors: this.errors,
                        tokens: this.tokens,
                    }
                }
                default: {
                    this.tokens.push(this.lexName());
                }
            }
        }
    }

    lexNumber(): Token {
        let content = "";
        while (true) {
            switch (this.peek()) {
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9": {
                    content += this.peek();
                    this.cursor++;
                    break;
                }
                default: {
                    return this.consume("number", content);
                }
            }
        }
    }

    lexString(): Token {
        let content = "\"";
        while (true) {
            switch (this.peek()) {
                case "\"": {
                    content += "\"";
                    this.cursor++;
                    return this.consume("string", content);
                }
                case "\n": {
                    this.cursor++;
                    this.line++;
                    this.character = 0;
                    break;
                }
                case "": {
                    this.errors.push({
                        message: "Unexpected EOF while lexing string",
                        span: {
                            start: { line: this.line, character: this.character },
                            end: { line: this.line, character: this.character },
                        },
                    });
                    return this.consume("string", content);
                }
                default: {
                    content += this.peek();
                    this.cursor++;
                    break;
                }
            }
        }
    }

    lexName(): Token {
        let content = "";
        while (true) {
            switch (this.peek()) {
                case "=":
                case "+":
                case "\n":
                case "(":
                case ")":
                case " ":
                case "": {
                    return this.consume("name", content);
                }
                default: {
                    content += this.peek();
                    this.cursor++;
                    break;
                }
            }
        }
    }
}

function main() {
    const lexer = new Lexer();
    let { tokens } = lexer.lex("let x = 1 + 2\n1");
    console.log(`Tokens: ${JSON.stringify(tokens)}`);
}

if (import.meta.main) {
    main();
}
