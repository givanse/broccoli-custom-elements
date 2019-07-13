//const typescript = require("broccoli-typescript-compiler").default;
import typescript from "broccoli-typescript-compiler";

export default function(/*options*/) {

  const cjs = typescript(".", {
    tsconfig: {
      compilerOptions: {
        module: "commonjs", 
        target: "es2017",
        lib: ["es2017"],
        moduleResolution: "node",
        newLine: "LF",
        //noEmitHelpers: true,
        rootDir: "src",
        outDir: "dist",
        sourceMap: true,
        strictNullChecks: true,
        declaration: true,
      },
      files: ["src/index.ts"],
    },
    throwOnError: false,
    annotation: "compile program",
  });

  return cjs;
}

