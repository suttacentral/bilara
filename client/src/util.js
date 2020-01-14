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