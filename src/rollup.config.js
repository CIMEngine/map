import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";

export default [
  {
    input: "src/index.js",
    output: {
      file: "dist/index.bundle.js",
      format: "iife",
      sourcemap: true,
    },
    context: "window",
    plugins: [
      resolve(),
      commonjs({ sourceMap: false }),
      copy({
        targets: [
          { src: "src/index.html", dest: "dist" },
          { src: "src/index.css", dest: "dist" },
        ],
      }),
    ],
  },
];
