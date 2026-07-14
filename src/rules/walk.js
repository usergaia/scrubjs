import { ancestor, base } from "acorn-walk";
import { extend } from "acorn-jsx-walk";

// acorn-walk needs the JSX extension to visit nodes in .jsx and .tsx files.
extend(base);

export { ancestor, base };
