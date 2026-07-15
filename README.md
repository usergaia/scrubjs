# scrubjs

[![CI](https://github.com/usergaia/scrubjs/actions/workflows/ci.yml/badge.svg)](https://github.com/usergaia/scrubjs/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40usergaia%2Fscrubjs)](https://www.npmjs.com/package/@usergaia/scrubjs)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/usergaia/scrubjs/blob/main/LICENSE)
<!-- Enable once the package has downloads:
[![npm downloads](https://img.shields.io/npm/dm/%40usergaia%2Fscrubjs)](https://www.npmjs.com/package/@usergaia/scrubjs)
-->

> AST-precise CLI to remove or comment out leftover `console.*` and `debugger` statements in JavaScript, TypeScript, JSX, and TSX.

`scrubjs` finds actual debug statements while ignoring strings and comments, then either removes them or comments them out. It edits the original source using exact AST offsets, preserving **formatting and line endings (LF or CRLF)** so diffs stay minimal. By default, it targets `console.log` and `debugger`.

## Demo

![scrubjs-demo](https://raw.githubusercontent.com/usergaia/scrubjs/main/demo/demo.gif)

## Install

```sh
npm install -g @usergaia/scrubjs
```

## Usage

```sh
scrubjs scan [path] [options]
```

```sh
scrubjs scan --staged
```

```sh
scrubjs scan --staged --check
```

- `[path]`: file or directory to scan (defaults to the current directory). Directories are scanned recursively, excluding dotfolders and `node_modules`.
- `-r, --remove`: remove matched statements.
- `-c, --comment`: comment out matched statements.
- `-a, --all`: apply to every detected statement without showing the interactive picker.
- `-d, --dry-run`: preview the changes without writing files.
- `-s, --staged`: scan only Git staged files.
- `--check`: exit with a non-zero status if any statements are found without modifying files (useful for CI).
- `-m, --methods <list>`: comma-separated `console` methods to target (default: `log`, e.g. `--methods log,warn,error`).
- Without `--remove` or `--comment`, `scrubjs` asks which action to perform.

By default, `scrubjs` shows an interactive checkbox list of every matching statement (all pre-selected) so you can choose exactly what to change before any files are modified. As you move through the list, a preview panel highlights the selected statement in its surrounding code and shows the resulting change (`space` toggles, `a` selects all, `i` inverts the selection, `enter` confirms, `esc` cancels).

Use `--all` to skip the interactive picker. Combining `--all` with an action flag runs completely non-interactively, for example:

```sh
scrubjs scan ./src --remove --all
```

Supported extensions:

- `.js`
- `.ts`
- `.jsx`
- `.tsx`

## Example

```sh
scrubjs scan ./src --comment
```

```diff
  function greet(name) {
-   console.log("debug", name);
+   // console.log("debug", name);
    return name;
  }
```

## What it matches

By default, `scrubjs` targets standalone `console.log` and `debugger` statements. Standalone statements are the only ones that can be safely removed or commented out without changing surrounding code.

It intentionally leaves the following untouched:

- other `console` methods (`console.error`, `console.warn`, `console.info`, etc.);
- logs used as part of an expression, e.g. `cond && console.log(x)` or `cond ? a : console.log(x)`;
- logs inside JSX expressions, e.g. `{console.log(x)}` or `{void console.log(x)}`;
- logs used as function arguments or arrow-function return values, e.g. `f(console.log(x))` or `() => console.log(x)`;
- text inside strings or comments;
- non-global `console` objects such as `obj.console.log(...)`.

## Keeping intentional statements

Sometimes a debug statement is intentional (for example, CLI output or a temporary logger), or an entire file should be skipped.

### `.scrubjsignore`

Ignore files or directories using gitignore-style patterns:

```text
scripts/
*.config.js
build/**
```

### `// scrubjs-keep`

Prevent a specific statement from being matched by placing `// scrubjs-keep` on the same line or directly above it:

```js
console.log("real output"); // scrubjs-keep

// scrubjs-keep
console.log("also kept");
```

## Pre-commit and CI

`--check` scans for matching statements and exits with a non-zero status if any are found without modifying files. Combined with `--staged`, it checks only the files you're about to commit.

Pre-commit hook (for example, with Husky):

```sh
npx scrubjs scan --staged --check
```

CI:

```sh
npx scrubjs scan --check
```

Statements marked with `// scrubjs-keep` and files ignored by `.scrubjsignore` are excluded, so the check only reports statements you haven't intentionally kept.