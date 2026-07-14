# scrubjs

> AST-precise CLI to safely remove or comment out `console.log` statements in JavaScript, TypeScript, JSX, and TSX.

`scrubjs` finds real `console.log` calls (not ones hiding in strings, comments, or other `console.*` methods) and either deletes them or comments them out. It edits the original source by splicing text at exact AST offsets, so **your formatting and line endings (LF or CRLF) are preserved** and diffs stay minimal.

## Install

```sh
npm install -g scrubjs
# or run without installing:
npx scrubjs scan <path>
```

## Usage

```sh
scrubjs scan <path> [options]
```

- `<path>` — a file or directory. Directories are scanned recursively (skipping dotfolders and `node_modules`).
- `-r, --remove` — remove the matched statements.
- `-c, --comment` — comment them out.
- `-a, --all` — apply to every detected log without the interactive pick list (scriptable / non-interactive).
- `-d, --dry-run` — print a colored diff of what would change and write nothing.
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

Only `console.log` calls that stand alone as their own statement are touched — which are exactly the ones safe to both comment and remove. `scrubjs` deliberately leaves the following alone:

- other console methods (`console.error`, `console.warn`, `console.info`, …);
- logs used as logic, e.g. `cond && console.log(x)` or `cond ? a : console.log(x)`;
- logs inside JSX expression braces, e.g. `{console.log(x)}` or `{void console.log(x)}`;
- logs that are call arguments or arrow-return bodies, e.g. `f(console.log(x))`, `() => console.log(x)`;
- `console.log` text inside strings or comments, and non-global `obj.console.log(...)`.
