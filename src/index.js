import Plugin from 'broccoli-plugin';
import FSTree from 'fs-tree-diff'; // eslint-disable-line no-unused-vars
import heimdall from 'heimdalljs'; // eslint-disable-line no-unused-vars
import { default as _logger } from 'heimdalljs-logger';
import fs from "fs";
import path from "path";

const logger = _logger('broccoli-web-components'); // eslint-disable-line no-unused-vars

function readFile(filePath) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, 'utf8', function(err, text) {
      if (err) {
        reject(err);
      }

      resolve(text);
    });
  });
}

export default class BroccoliWebComponents extends Plugin {
  constructor(folderPath, options = {}) {
    super([folderPath], {
      name: options.name,
      annotation: options.annotation,
      persistentOutput: true
    });

    // Save references to options you may need later
    this.debugLog = options.debugLog === true;
  }

  log() {
    if (!this.debugLog) {
      return;
    }

    console.log('BWC:', ...arguments);
  }

  validatePath(path) {
    if (!fs.existsSync(path)) {
      this.log(`Not found: ${path}`);
      return false;
    } else {
      this.log(`Found: ${path}`);
      return true;
    }
  }

  buildWebComponent(folderPath) {
    const templatePath = path.join(folderPath, "template.html");
    const stylePath = path.join(folderPath, "style.css");

    if (!this.validatePath(templatePath) || !this.validatePath(stylePath)) {
      return;
    }

    return Promise.all([
      readFile(templatePath),
      readFile(stylePath),
    ]).then(function([html, css]) {
      css = `<style>${css}</style>`;
      return html.replace('{{style}}', css);
    });

    //const webComponentName = path.basename(path.dirname(templatePath));
    //const outputPath = path.join(this.outputPath, `${webComponentName}.html`);
    //fs.writeFileSync(outputPath, output);
  }

  buildInputNode(inputNode) {
    const plugin = this; //TODO: transpiled code was wrong, wrong config? old Babel?

    return new Promise((resolve, reject) => {
      fs.readdir(inputNode, {}, function(err, filePaths) {
        if (err) {
          reject(err);
        }

        const wcOutputs = [];
        for (const filePath of filePaths) {
          const wcFolderPath = path.join(inputNode, filePath);
          wcOutputs.push(plugin.buildWebComponent(wcFolderPath));
        }

        Promise.all(wcOutputs).then(outputs => {
          let output = ''; 

          for (const o of outputs) {
            output += o;
          }

          const outputPath = path.join(plugin.outputPath, 'custom-elements.html');
          fs.writeFileSync(outputPath, output);

          resolve();
        });
      });
    });
  }

  build() {
    const inputPath = this.inputPaths[0];
    return this.buildInputNode(inputPath);
  }
}

