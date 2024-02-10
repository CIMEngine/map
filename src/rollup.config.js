import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";
import css from "rollup-plugin-import-css";
import terser from "@rollup/plugin-terser";
import ejs from "rollup-plugin-ejs";

export default [
  {
    input: "src/index.js",
    output: {
      file: "dist/index.bundle.js",
      format: "esm",
      sourcemap: true,
      plugins: [terser()],
    },
    context: "window",
    plugins: [
      css({
        output: "index.css",
        minify: true,
      }),
      ejs(),
      resolve(),
      commonjs(),
      copy({
        targets: [
          { src: "src/index.html", dest: "dist" },
          { src: "icons/*", dest: "dist/icons" },
        ],
      }),
    ],
  },
];
