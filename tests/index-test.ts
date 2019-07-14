import { expect } from 'chai';
import { createBuilder, createTempDir } from 'broccoli-test-helper';
import BroccoliCustomElements from '../src';

describe('BroccoliCustomElements', function() {
  let input;

  beforeEach(function() {
    return createTempDir().then(tempDir => (input = tempDir));
  });

  afterEach(function() {
    return input.dispose();
  });

  it('should build', async function() {
    input.write({
      //"components-root": {
      "lorem-ipsum": {
        "template.html": "<template></template>",
        "style.css": ":host{}",
        "index.ts": "class CE {}",
      }
      //}
    });

    let node = new BroccoliCustomElements(input.path());

    let output = await createBuilder(node);

    await output.build();

    expect(output.read()).to.deep.equal({
      "custom-elements.html": "<template><style>:host{}</style></template>",
      "custom-elements.js": "\nclass CE {}",
    });
    //expect(output.read()["custom-elements.js"]).to.equal("\nclass CE {}");

    expect(output.changes()).to.deep.equal({
      "custom-elements.html": "create",
      "custom-elements.js": "create",
    });

    // Update
    input.write({
      "lorem-ipsum": {
        "style.css": ":host{color: pink;}",
      }
    });
    await output.build();

    expect(output.read()["custom-elements.html"]).to.equal("<template><style>:host{color: pink;}</style></template>");

    expect(output.changes()).to.deep.equal({
      "custom-elements.html": "change",
      //TODO: improvement, the JS didn't need to change
      "custom-elements.js": "change",
    });

    // NOOP
    //TODO: ideal behavior
    //await output.build();
    //expect(output.changes()).to.deep.equal({});
  });
});
