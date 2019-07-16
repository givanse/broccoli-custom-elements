//TODO: add caching, calculatePatch() etc.
//import FSTree from "fs-tree-diff"; // eslint-disable-line no-unused-vars
import * as fs from "fs";
import * as path from "path";
const MergeTrees: any = require("broccoli-merge-trees");
const BroccoliPlugin = require("broccoli-plugin");
import { BroccoliRollup, BroccoliRollupOptions, RollupOptions } from "broccoli-rollup";
const commonjs = require("rollup-plugin-commonjs");
const resolve = require("rollup-plugin-node-resolve");
const babel = require("rollup-plugin-babel");
const multiEntry = require("rollup-plugin-multi-entry");
const walkSync = require("walk-sync");
const stylus = require("stylus");

//TODO: Use MultiFilter css + html => html ?

export interface BroccoliNodeOptions {
  name: string;
  annotation: string;
  persistentOutput: boolean;
  rollupConfig: RollupOptions | null;
}

type WebComponentPromise = Promise<string>;
type WebComponentPromises = WebComponentPromise[]; 

const DEFAULT_ROLLUP_CONFIG: RollupOptions = {
  input: "**/*.ts",
  output: [
    {
      name: "customElements",
      file: "custom-elements.iife.js",
      format: "iife",
    },
    {
      file: "custom-elements.es.js",
      format: "esm",
    },
  ],
  plugins: [
    multiEntry(),
    commonjs(),
    resolve(),
    babel({
      presets: [
        "@babel/preset-env",
        "@babel/preset-typescript",
      ]
    }),
  ],
};

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

  private rollupConfig: RollupOptions | null = null;
  private broccoliRollup: BroccoliRollup;

  constructor(
    folderPath: string,
    options: BroccoliNodeOptions = {
      name: "Custom Elements",
      annotation: "Custom Elements",
      persistentOutput: true,
      rollupConfig: null,
  }) {
    super([folderPath], options);

    this.rollupConfig = options.rollupConfig;
  }

  private insertStyle(html: string, css: string): string {
    css = `<style>${css}</style>`;
    return html.replace(/^\w*<template[^>]*>/, "$&" + css);
  }

  public preprocessCSS(text: string): Promise<string> {
    const s = stylus(text);

    //TODO: add includes

    return new Promise(function(resolve, reject) {
      s.render(function (err, data) {
        if (err) {
          reject(err);
        }
  
        resolve(data);
      });
    });
  }

  private buildWebComponent(folderPath: string): Promise<string> {
    const templatePath = path.join(folderPath, "template.html");
    const stylePath = path.join(folderPath, "style.styl"); //TODO: css is valid too

    if (!fs.existsSync(templatePath) || !fs.existsSync(stylePath)) {
      const m = "Couldn't find either one of:\n" +
                `  ${templatePath}\n  ${stylePath}`; 
      throw new Error(m);
    }

    return Promise.all([
      readFile(templatePath),
      readFile(stylePath),
    ]).then(async ([html, style]) => {
      const css = await this.preprocessCSS(style);
      return this.insertStyle(html, css);
    });
  }

  private buildWebComponents(folderPath: string): Promise<string[]> {
    const folderNames = walkSync(folderPath, {
      directories: true,
      globs: ["*/"],
      includeBase: false,
    });

    const wcOutputs: Promise<string>[] = folderNames
    .reduce((acc: WebComponentPromises, folderName): WebComponentPromises => {
      const wcFolderPath = path.join(folderPath, folderName);
      const wcPromise = this.buildWebComponent(wcFolderPath);
      acc.push(wcPromise);
      return acc;
    }, []);

    return Promise.all(wcOutputs)
    .then((webComponents: string[]) => {
      const templates = webComponents.reduce(function(acc, webComponentTxt) {
        return acc + webComponentTxt;
      }, "");

      const outputPath = path.join(this.outputPath, "custom-elements.html");
      return [outputPath, templates];
    });
  }

  private getRollupConfig(): RollupOptions {
    return this.rollupConfig || DEFAULT_ROLLUP_CONFIG;
  }

  private async buildJS(inputPath: string): Promise<void> {
    if (!this.broccoliRollup) {
      const options: BroccoliRollupOptions = {
        annotation: "custom elements js",
        rollup: this.getRollupConfig()
      };

      this.broccoliRollup = new BroccoliRollup(inputPath, options);
    }

    return this.broccoliRollup.build();
  }

  public async build(): Promise<void> {
    const inputPath = this.inputPaths[0];

    const wcPromise = this.buildWebComponents(inputPath);

    //const jsPromise = this.buildJS(inputPath);

    const [wc] = await Promise.all([wcPromise/*, jsPromise*/]);

    const [outputPath, output] = wc;
    fs.writeFileSync(outputPath, output);

    //return new MergeTrees([js], {
      //annotation: "custom elements html + js"
    //});
  }
}
