# OScript Language Server

[![NPM version](https://badge.fury.io/js/oscript-language-server.png)](http://badge.fury.io/js/oscript-language-server)

A language server (implementing the [language server protocol]) for the [OScript language].

Requires Node 12 or newer.

## What is a language server?

From https://microsoft.github.io/language-server-protocol/overview

> The idea behind a Language Server is to provide the language-specific smarts inside a server that can communicate with development tooling over a protocol that enables inter-process communication.

In simpler terms, this allows editor and addon devs to add support for the OScript language (e.g. diagnostics, autocomplete, etc) to any editor without reinventing the wheel.

## Features

* Diagnostic messages for syntax problems
* Autocompletion of built-in objects and methods
* Hover info for built-in objects and methods
* Symbol outline
* Symbol definition
* Symbol references
* Symbol renaming
* Quick-fixes for recoverable syntax errors

## Planned

* Improve autocompletion, hover, definition, references and renaming
* Method signature help
* Snippets
* WebLingo support

## How can I use it?

Install a plugin for your editor:

* [Visual Studio Code](../..#readme)

[language server protocol]: https://microsoft.github.io/language-server-protocol/
[OScript language]: https://github.com/prantlf/oscript-parser/blob/master/doc/grammar.md#oscript-language-grammar
