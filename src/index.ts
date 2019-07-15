//TODO: add caching, calculatePatch() etc.
//import FSTree from "fs-tree-diff"; // eslint-disable-line no-unused-vars
import * as fs from "fs";
import * as path from "path";
import {readFile, readFolderFiles} from "./io";
const MergeTrees: any = require("broccoli-merge-trees");
const BroccoliPlugin = require("broccoli-plugin");
import { BroccoliRollup, BroccoliRollupOptions, RollupOptions } from "broccoli-rollup";
const commonjs = require("rollup-plugin-commonjs");
const resolve = require("rollup-plugin-node-resolve");
const babel = require("rollup-plugin-babel");
const multiEntry = require("rollup-plugin-multi-entry");

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

  private buildWebComponent(folderPath: string): WebComponentPromise {
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

  private buildWebComponents(folderPath: string): Promise<string[]> {
    return readFolderFiles(folderPath).then(filePaths => {
      const wcOutputs = filePaths
      .reduce((acc: WebComponentPromises, filePath): WebComponentPromises => {
        const wcFolderPath = path.join(folderPath, filePath);
        acc.push(this.buildWebComponent(wcFolderPath));
        return acc;
      }, []);

      return Promise.all(wcOutputs).then((results: string[]) => {
        const output = results.reduce(function(acc, r) {
          return acc + r;
        });

        const outputPath = path.join(this.outputPath, "custom-elements.html");
        return [outputPath, output];
      });
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

    const jsPromise = this.buildJS(inputPath);

    const [wc] = await Promise.all([wcPromise, jsPromise]);

    const [outputPath, output] = wc;
    fs.writeFileSync(outputPath, output);

    //return new MergeTrees([js], {
      //annotation: "custom elements html + js"
    //});
  }
}
