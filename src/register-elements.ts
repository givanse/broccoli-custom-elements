/**
 * 
 * imports will be dynamically added at build time
 * 
 * const CUSTOM_ELEMENTS: CustomElement[] = [];
 */

function registerCustomElement(CustomElement) {
  const importDoc = document.currentScript.ownerDocument;

  if (false) {
    // Chrome >= 80
    // The proposal is to use ES modules, but it isn't a standard.
  } else if (window.customElements && window.customElements.define) {
    // Chrome <= 80
    // Deprecated HTML Imports
    // https://www.chromestatus.com/feature/5144752345317376
    window.customElements.define(CustomElement.tagName, CustomElement);
  } else {
    // Chrome <= 54
    // Deprecated Custom Elements V0
    // https://www.chromestatus.com/features/4642138092470272
    importDoc.registerElement(CustomElement.tagName, {
      prototype: Object.create(CustomElement.prototype)
    });
  }
}

export default function registerCustomElements() {
  for (const CustomElement of CUSTOM_ELEMENTS) {
    registerCustomElement(CustomElement);
  }
}
