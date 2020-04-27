export function getChildMatchingKey(object, key, value) {
  return Object.values(object).find(obj => obj[key] == value)
}

export function sortByKeyFn(list, keyFn) {
  return list.sort( (a, b) => { 
    const x = keyFn(a);
    const y = keyFn(b);
    return x < y ? -1 : x > y ? 1 : 0;
  })
}

export function storageSave(namespace, key, value) {
  let keyString = namespace + JSON.stringify(key);
  localStorage.setItem(keyString, JSON.stringify(value));
}

export function storageLoad(namespace, key) {
  let keyString = namespace + JSON.stringify(key);
  try {
    return JSON.parse(localStorage.getItem(keyString));
  } catch (e) {
    localStorage.removeItem(keyString);
  }
  return undefined
}

export function setEquality(a, b){
  return JSON.stringify([...a].sort()) == JSON.stringify([...b])
}

export const contentEditableValue = (()=>{
  let div = document.createElement('div');
  div.setAttribute('contenteditable', 'PLAINTEXT-ONLY');
  return div.contentEditable === 'plaintext-only' ? 'plaintext-only' : 'true';
})();

export const featureFlags = {
  search: !!window.location.host.match(/localhost\b/)
}

console.log(featureFlags);

export function highlightMatch(string, searchString) {
  if (!searchString) {
    return string
  }
  const rex = searchString instanceof RegExp ? searchString : RegExp('('+searchString+')', 'gi');
  return string.replace(rex, '<mark>$1</mark>');
}

export function selectText(node) {
  if (document.body.createTextRange) {
      const range = document.body.createTextRange();
      range.moveToElementText(node);
      range.select();
  } else if (window.getSelection) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(range);
  } else {
      console.warn("Could not select text in node: Unsupported browser.");
  }
}