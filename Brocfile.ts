//const typescript = require("broccoli-typescript-compiler").default;
import typescript from "broccoli-typescript-compiler";

export default function(/*options*/) {

  const cjs = typescript(".", {
    tsconfig: {
      compilerOptions: {
        module: "commonjs", 
        target: "es6",
        moduleResolution: "node",
        newLine: "LF",
        rootDir: "src",
        outDir: "dist",
        sourceMap: true,
        declaration: true,
      },
      files: ["src/index.ts"],
    },
    throwOnError: false,
    annotation: "compile program",
  });

  return cjs;
}

