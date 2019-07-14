//import FSTree from "fs-tree-diff"; // eslint-disable-line no-unused-vars
//import { default as _logger } from "heimdalljs-logger";
import * as fs from "fs";
import * as path from "path";
import {readFile, readFolderFiles} from "./io";
import bundler from "./bundler";
const BroccoliPlugin = require("broccoli-plugin");

//const logger = _logger("broccoli-web-components"); // eslint-disable-line no-unused-vars

interface BroccoliNodeOptions {
  name: string;
  annotation: string;
  persistentOutput: boolean;
}

export default class BroccoliCustomElements extends BroccoliPlugin {

  inputPaths: string[];
  outputPath: string;

  constructor(
    folderPath: string,
    options: BroccoliNodeOptions = {
      name: "Broccoli Custom Elements",
      annotation: "Broccoli Custom Elements",
      persistentOutput: true
  }) {
    super([folderPath], options);

    // Save references to options you may need later
  }

  insertStyle(html: string, css: string): string {
    css = `<style>${css}</style>`;
    return html.replace(/^\w*<template[^>]*>/, "$&" + css);
  }

  buildWebComponent(folderPath: string): Promise<string> {
    const templatePath = path.join(folderPath, "template.html");
    const stylePath = path.join(folderPath, "style.css");

    if (!fs.existsSync(templatePath) || !fs.existsSync(stylePath)) {
      return Promise.resolve("");
    }

    return Promise.all([
      readFile(templatePath),
      readFile(stylePath),
    ]).then(([html, css]) => {
      return this.insertStyle(html, css);
    });
  }

  buildWebComponents(folderPath: string): Promise<void> {
    return readFolderFiles(folderPath).then(filePaths => {

      const wcOutputs: Promise<string>[] = [];

      for (const filePath of filePaths) {
        const wcFolderPath = path.join(folderPath, filePath);
        wcOutputs.push(this.buildWebComponent(wcFolderPath));

        const jsFilePath = path.join(folderPath, filePath, "index.ts");
        bundler.addCustomElementJSToBundle(jsFilePath);
      }

      return Promise.all([bundler.getJSText(), ...wcOutputs]).then(results => {
        const jsText = results.shift();

        let output = ""; 
        for (const o of results) {
          output += o;
        }

        let outputPath = path.join(this.outputPath, "custom-elements.html");
        fs.writeFileSync(outputPath, output);

        outputPath = path.join(this.outputPath, "custom-elements.js");
        fs.writeFileSync(outputPath, jsText);
      });
    });
  }

  build(): Promise<void> {
    const inputPath = this.inputPaths[0];
    return this.buildWebComponents(inputPath)
  }
}
