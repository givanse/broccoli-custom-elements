import {readFile} from "./io";

interface Bundle {
  [key: string]: string;
}

class Bundler {

  private bundle: Bundle;
  private filesInProgress: Promise<string[]>[];

  constructor() {
    this.bundle = {};
    this.filesInProgress = [];
  }

  addCustomElementJSToBundle(filePath: string) {
    const filePromise = readFile(filePath);

    const tuplePromise = filePromise.then(function(jsText) {
      return [filePath, jsText];
    });

    this.filesInProgress.push(tuplePromise);
  }

  async getJSText() {
    const filesTuples = await Promise.all(this.filesInProgress);
    
    let bundleText = "";

    for (const fileTuple of filesTuples) {
      const [filePath, jsText] = fileTuple;
      this.bundle[filePath] = jsText;
      bundleText += "\n" + jsText;
    }

    return bundleText;
  }

}

export default new Bundler();
