import typescript from "broccoli-typescript-compiler";
import * as path from "path";

const tsconfigSrc = path.join(__dirname, "tsconfig.json");
const tsconfigTests = path.join(__dirname, "tests", "tsconfig.json");

export default function(options) {

  let tsconfig = tsconfigSrc;
  if (options.env === "tests") {
    tsconfig = tsconfigTests;
  }

  const cjs = typescript(".", {
    tsconfig,
    throwOnError: false,
    annotation: "compile program",
  });

  return cjs;
}

