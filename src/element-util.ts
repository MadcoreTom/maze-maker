export function findParentOfType() {}

export function createElement(tag: string, attributes: { [key: string]: any }): HTMLElement {
  const elem = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    elem.setAttribute(key, value);
  });
  return elem;
}

export function applyStyle(elem: HTMLElement, style: Partial<CSSStyleDeclaration>) {
  Object.assign(elem.style, style);
}
