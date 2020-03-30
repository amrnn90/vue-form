import isEqual from "fast-deep-equal";
import { copy as cloneDeep } from "copy-anything";

const isArray = obj => Array.isArray(obj);

const isObject = obj =>
  typeof obj == "object" && obj instanceof Object && !isArray(obj);

const get = (obj, path, defaultValue) => {
  const result = path
    .split(".")
    .filter(Boolean)
    .reduce(
      (res, key) => (res !== null && res !== undefined ? res[key] : res),
      obj
    );
  return result === undefined || result === obj ? defaultValue : result;
};

const set = (obj, path, value) => {
  if (!obj) return;

  if (typeof path === "string") path = path.split(".");

  if (path.length > 1) {
    const prop = path.shift();
    set(
      (obj[prop] =
        isObject(obj[prop]) || isArray(obj[prop])
          ? obj[prop]
          : isNaN(path[0])
          ? {}
          : []),
      path,
      value
    );
  } else obj[path[0]] = value;

  return obj;
};

const omit = (obj, props) =>
  Object.keys(obj)
    .filter(key => props.indexOf(key) < 0)
    .reduce((newObj, key) => Object.assign(newObj, { [key]: obj[key] }), {});

const pick = (obj, props) =>
  Object.keys(obj)
    .filter(key => props.indexOf(key) >= 0)
    .reduce((newObj, key) => Object.assign(newObj, { [key]: obj[key] }), {});

export default { cloneDeep, isEqual, isObject, isArray, get, set, omit, pick };
