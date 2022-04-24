# Changelog

## 0.3.0

* Add a command runScript executing .e or .lxe files.
* Do not include built-in Node.js modules in the bundled output.

## 0.2.5

* Allow dereferencing `this` without the `this` keyword (chain the dot operators).

## 0.2.4

Fix locating a local variable identifier.

## 0.2.3

Fix parsing of the member expression without the explicit `this` object.

## 0.2.2

Fix parsing of the `switch` statement.

## 0.2.1

Fix the dependency on oscript-ast-walker.

## 0.2.0

* Add a language server with the syntax-checking, quick fixes, built-in type completion, hover hints, symbol outline, local identifier definition, references and renaming.
* Show a "what is new" notification after an upgrade.
* Recognize strings delimited by backticks in syntax highlighting.
* Add a problem matcher for `oslint`.

## [0.1.1](https://github.com/prantlf/vscode-oscript/compare/v0.1.0...v0.1.0) (2020-04-16)

### Fixes

* Recognise keywords "script" and "endscript" ([5d8838b](https://github.com/prantlf/vscode-oscript/commit/5d8838b60994f2b4d4f8083f05f44e7cfe25d31b))

## [0.1.0](https://github.com/prantlf/vscode-oscript/compare/v0.0.2...v0.1.0) (2020-04-15)

### Fixes

* Improve folding and indentation patterns ([454aae4](https://github.com/prantlf/vscode-oscript/commit/454aae4a52c38f9e830265fd764d55bade984d27))

## [0.0.2](https://github.com/prantlf/vscode-oscript/compare/v0.0.1...v0.0.2) (2020-04-14)

### Documentation

* Add examples of screenshots and related links ([b11597f](https://github.com/prantlf/vscode-oscript/commit/b11597fd348cd7631561e2077cd8a353935cfbd8))

## 0.0.1 (2020-04-13)

Initial commit with the basic syntax highlighting support.
