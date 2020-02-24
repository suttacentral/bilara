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