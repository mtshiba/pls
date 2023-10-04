# Poor Language Server (PLS)

The language server for the Poor programming language

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
