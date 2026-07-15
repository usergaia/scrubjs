# scrubjs

[![CI](https://github.com/usergaia/scrubjs/actions/workflows/ci.yml/badge.svg)](https://github.com/usergaia/scrubjs/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/scrubjs.svg)](https://www.npmjs.com/package/scrubjs)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/usergaia/scrubjs/blob/main/LICENSE)
<!-- Enable once published and it has downloads:
[![npm downloads](https://img.shields.io/npm/dm/scrubjs.svg)](https://www.npmjs.com/package/scrubjs)
-->

> AST-precise CLI to safely remove or comment out leftover debug statements (`console.*`, `debugger`) in JavaScript, TypeScript, JSX, and TSX.

`scrubjs` finds real debug statements (not ones hiding in strings or comments) and either deletes them or comments them out. It edits the original source by splicing text at exact AST offsets, so **your formatting and line endings (LF or CRLF) are preserved** and diffs stay minimal. By default it targets `console.log` and `debugger`.

## Demo

![scrubjs-demo](https://raw.githubusercontent.com/usergaia/scrubjs/main/demo/demo.gif)


## Install

```sh
npm install -g scrubjs
# or run without installing:
npx scrubjs scan <path>
```

## Usage

```sh
scrubjs scan [path] [options]
```

- `[path]`: a file or directory (defaults to the current directory). Directories are scanned recursively (skipping dotfolders and `node_modules`).
- `-r, --remove`: remove the matched statements.
- `-c, --comment`: comment them out.
- `-a, --all`: apply to every detected statement without the interactive pick list (scriptable / non-interactive).
- `-d, --dry-run`: print a colored diff of what would change and write nothing.
- `-s, --staged`: scan only git-staged files.
- `--check`: exit non-zero if any statements are found, and change nothing (for CI).
- `-m, --methods <list>`: comma-separated `console` methods to target (default `log`, e.g. `--methods log,warn,error`).
- With neither action flag, `scrubjs` asks whether to remove or comment.

By default `scrubjs` shows an interactive checkbox list of every log it found (all pre-selected) so you can **choose exactly which ones to change** before it touches anything. As you move through the list, a panel shows the highlighted log **in its surrounding code with the exact change** it would make (`space` toggles, `a` all, `i` invert, `enter` confirms, `esc` cancels). Use `--all` to skip that step. Combining an action flag with `--all` runs fully non-interactively, e.g. `scrubjs scan ./src --remove --all`.

Supported extensions: `.js`, `.ts`, `.jsx`, `.tsx`.

### Example

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

Only `console.log` calls that stand alone as their own statement are touched, which are exactly the ones safe to both comment and remove. `scrubjs` deliberately leaves the following alone:

- other console methods (`console.error`, `console.warn`, `console.info`, …);
- logs used as logic, e.g. `cond && console.log(x)` or `cond ? a : console.log(x)`;
- logs inside JSX expression braces, e.g. `{console.log(x)}` or `{void console.log(x)}`;
- logs that are call arguments or arrow-return bodies, e.g. `f(console.log(x))`, `() => console.log(x)`;
- `console.log` text inside strings or comments, and non-global `obj.console.log(...)`.

## Keeping intentional statements

Some debug statements are intentional (real CLI output, a deliberate logger), and some files are not app code (bootstrap, seed, config scripts). Two ways to keep them:

**`.scrubjsignore`** at the project root skips whole files or folders. It uses gitignore-style globs:

```
scripts/
*.config.js
build/**
```

**`// scrubjs-keep`** keeps a single statement. Put it at the end of the line, or on the line directly above:

```js
console.log("real output, keep this"); // scrubjs-keep

// scrubjs-keep
console.log("also kept");
```

## Pre-commit and CI

`--check` scans and exits non-zero when it finds any statements, without changing files. Combined with `--staged`, it checks only what you are about to commit.

As a pre-commit hook (for example with husky, in `.husky/pre-commit`):

```sh
npx scrubjs scan --staged --check
```

In CI, check the whole project:

```sh
npx scrubjs scan --check
```

Statements marked with `// scrubjs-keep` and files listed in `.scrubjsignore` are excluded, so the check only fails on real leftover debug statements.
