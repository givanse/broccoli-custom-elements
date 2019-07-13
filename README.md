# broccoli-custom-elements

## Usage

```js
// Brocfile.ts
import BroccoliCustomElements from "broccoli-custom-elements";

export default function() {
  new BroccoliWebComponents("src/custom-elements");
};
```

## Development

### Installation

 ```
git clone <repository-url>
cd broccoli-custom-elements
yarn install
yarn watch
```

### Building

* `yarn build`

### Testing

* `yarn test` or `yarn test:debug`
