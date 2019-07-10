//import FSTree from "fs-tree-diff"; // eslint-disable-line no-unused-vars
//import heimdall from "heimdalljs"; // eslint-disable-line no-unused-vars
//import { default as _logger } from "heimdalljs-logger";
import * as fs from "fs";
import * as path from "path";
const BroccoliPlugin = require("broccoli-plugin");

//const logger = _logger("broccoli-web-components"); // eslint-disable-line no-unused-vars

interface BroccoliPlugin {
  outputPath: string;
  inputPaths: string[];
  constructor(inputNodes: string[], options: BroccoliNodeOptions): void;
}

interface BroccoliNodeOptions {
   name: string;
   annotation: string;
   debugLog: boolean;
   persistentOutput: boolean;
 }

function readFile(filePath: string): Promise<string> {
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, "utf8", function(err, text) {
      if (err) {
        reject(err);
      }

      resolve(text);
    });
  });
}

export default class BroccoliCustomElements extends BroccoliPlugin {

  inputPaths: string[];
  outputPath: string;

  private debugLog: boolean;

  constructor(
    folderPath: string,
    options: BroccoliNodeOptions = {name: "", annotation: "", debugLog: false, persistentOutput: true}
  ) {
    super([folderPath], options);

    // Save references to options you may need later
    this.debugLog = options.debugLog === true;
  }

  log(...args: any[]) {
    if (!this.debugLog) {
      return;
    }

    console.log("BWC:", ...args);
  }

  validatePath(path: string) {
    if (!fs.existsSync(path)) {
      this.log(`Not found: ${path}`);
      return false;
    } else {
      this.log(`Found: ${path}`);
      return true;
    }
  }

  insertStyle(html: string, css: string): string {
    css = `<style>${css}</style>`;
    return html.replace(/^\w*<template[^>]*>/, "$&" + css);
  }

  buildWebComponent(folderPath: string): Promise<string> {
    const templatePath = path.join(folderPath, "template.html");
    const stylePath = path.join(folderPath, "style.css");

    if (!this.validatePath(templatePath) || !this.validatePath(stylePath)) {
      return Promise.resolve("");
    }

    return Promise.all([
      readFile(templatePath),
      readFile(stylePath),
    ]).then(([html, css]) => {
      return this.insertStyle(html, css);
    });
  }

  buildInputNode(inputNode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.readdir(inputNode, (err, filePaths: string[]) => {
        if (err) {
          reject(err);
        }

        const wcOutputs = [];
        for (const filePath of filePaths) {
          const wcFolderPath = path.join(inputNode, filePath);
          wcOutputs.push(this.buildWebComponent(wcFolderPath));
        }

        Promise.all(wcOutputs).then(outputs => {
          let output = ""; 

          for (const o of outputs) {
            output += o;
          }

          const outputPath = path.join(this.outputPath, "custom-elements.html");
          fs.writeFileSync(outputPath, output);

          resolve();
        });
      });
    });
  }

  build(): Promise<void> {
    const inputPath = this.inputPaths[0];
    return this.buildInputNode(inputPath);
  }
}

