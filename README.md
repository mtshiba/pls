# Poor Language Server (PLS)

The language server for the Poor programming language

この言語および言語サーバーは、Web書籍[Language Server Protocol の仕様 及び実装方法](https://zenn.dev/mtshiba/books/language_server_protocol)の付録として実装されたものです。

Poor言語の文法は[こちら](syntax.md)。

## Capabilities

- [x] Diagnostics
- [x] Completion
- [x] Hover
- [x] Semantic tokens

## Requirement

* npm
* deno

## Installing PLS

```sh
deno install --allow-read --allow-run --force --name pls src/server/server.ts
```

## Building the PLS extension

```sh
npm install
npx vsce package
```

## License

[CC0 1.0 Universal](LICENSE)
