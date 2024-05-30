'use strict';

function isBoolean(obj) {
  return typeof obj === "boolean";
}

function isNumber(obj) {
  return typeof obj === "number" && !Number.isNaN(obj) && Number.isFinite(obj);
}

function isNumeric(obj) {
  if (isString(obj)) {
    return !Number.isNaN(parseFloat(obj)) && Number.isFinite(parseFloat(obj));
  } else {
    return isNumber(obj);
  }
}

function isString(obj) {
  return typeof obj === "string";
}

function isEmptyString(obj) {
  return isString(obj) && obj.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "") === ""; // trim
}

function isObject(obj) {
  return typeof obj === "object" && obj !== null && obj.constructor === Object && Object.getPrototypeOf(obj) === Object.prototype;
}

function isEmptyObject(obj) {
  return isObject(obj) && Object.keys(obj).length === 0;
}

function isNull(obj) {
  return typeof obj === "object" && obj === null;
}

function isArray(obj) {
  if (Array && Array.isArray) {
    return Array.isArray(obj);
  } else {
    return Object.prototype.toString.call(obj) === "[object Array]";
  }
}

function isBooleanArray(obj) {
  if (!isArray(obj)) {
    return false;
  }
  for (const item of obj) {
    if (!isBoolean(item)) {
      return false;
    }
  }
  return true;
}

function isNumberArray(obj) {
  if (!isArray(obj)) {
    return false;
  }
  for (const item of obj) {
    if (!isNumber(item)) {
      return false;
    }
  }
  return true;
}

function isStringArray(obj) {
  if (!isArray(obj)) {
    return false;
  }
  for (const item of obj) {
    if (!isString(item)) {
      return false;
    }
  }
  return true;
}

function isObjectArray(obj) {
  if (!isArray(obj)) {
    return false;
  }
  for (const item of obj) {
    if (!isObject(item)) {
      return false;
    }
  }
  return true;
}

function isEmptyArray(obj) {
  return isArray(obj) && obj.length === 0;
}

function isFunction(obj) {
  return typeof obj === "function";
}

function isEmpty(obj) {
  return obj === undefined || isNull(obj);
}

function isUndefined(obj) {
  return obj === undefined;
}

function isSameType(objA, objB) {
  return typeof objA === typeof objB && objA.constructor === objB.constructor;
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function splitInt(str) {
  return str.split(/([0-9]+)/);
}

function splitFloat(str) {
  return str.split(/([0-9]{0,}\.{0,1}[0-9]{1,})+/);
}

function toHalfWidth(str) {
  return str
    .replace(/[！-～]/g, function(ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
    })
    .replace(/[^\S\r\n]/g, function(ch) {
      return " ";
    });
}

function toFullWidth(str) {
  return str
    .replace(/[!-~]/g, function(ch) {
      return String.fromCharCode(ch.charCodeAt(0) + 0xfee0);
    })
    .replace(/[^\S\r\n]/g, function(ch) {
      return "　";
    });
}

// get diff between two strings
function compareStrings(strA, strB) {
  // create dp
  function C(a, b) {
    const dp = [];
    for (let i = 0; i < a.length + 1; i++) {
      dp.push([]);
      for (let j = 0; j < b.length + 1; j++) {
        dp[i][j] = 0;
      }
    }
    return dp;
  }

  // match a to b
  function M(dp, a, b) {
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        // 1 more characters in dp
        if (a[i-1] === b[j-1]) {
          dp[i][j] = dp[i-1][j-1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
        }
      }
    }
    return dp;
  }

  // get diffs
  function P(dp, a, b) {
    let res = [],
        matches = 0,
        mat = 0, 
        ins = 1, 
        del = -1, 
        i = a.length, 
        j = b.length;
    while (i > 0 || j > 0) {
      const prev = res[res.length - 1];
      const itemA = a[i-1];
      const itemB = b[j-1];
      if (i > 0 && j > 0 && itemA === itemB) {
        // matched
        if (prev && prev.type === mat) {
          prev.data = itemA + prev.data; // add to prev
        } else {
          res.push({ type: mat, data: itemA });
        }
        matches++;
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
        // inserted
        if (prev && prev.type === ins) {
          prev.data = itemB + prev.data; // add to prev
        } else {
          res.push({ type: ins, data: itemB });
        }
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j-1] < dp[i-1][j])) {
        // deleted
        if (prev && prev.type === del) {
          prev.data = itemA + prev.data; // add to prev
        } else {
          res.push({ type: del, data: itemA });
        }
        i--;
      }
    }
    return {
      acc: matches * 2 / (a.length + b.length),
      diff: res.reverse(),
    }
  }

  return P(M(C(strA, strB), strA, strB), strA, strB);
}

// mongodb objectId
let __uniq__ = 0;
function id() {
  return Math.floor(new Date().getTime() / 1000).toString(16) + "xxxxxx".replace(/x/g, function(v) {
    return Math.floor(Math.random() * 16).toString(16);
  }) + (__uniq__++).toString(16).padStart(6, "0");
}

// encrypt string with XOR Cipher
function xor(str, salt) {
  if (salt.length === 0) {
    return str;
  }
  let res = "", i = 0;
  while(salt.length < str.length) {
    salt += salt;
  }
  while(i < str.length) {
    res += String.fromCharCode(str.charCodeAt(i) ^ salt.charCodeAt(i));
    i++;
  }
  return res;
}

// parse string command to array
// node.js ./myscript.js myfile1 -v -debug -host there.com -port 8081 myfile2 "\"File\" not found"
function parseCommand(str) {
  let result = [],
      i = 0,
      tmp = str.replace(/\\'|\\"/g, "00"),
      bracket = null,
      part = "";
  while(i < str.length) {
    if (!bracket) {
      if (tmp[i] === "\'" || tmp[i] === "\"") {
        bracket = str[i];
      } else if (tmp[i] === " ") {
        if (part !== "") {
          result.push(part);
          part = "";
        }
      } else {
        part += str[i];
      }
    } else {
      if (tmp[i] === bracket) {
        result.push(part);
        part = "";
        bracket = null;
      } else {
        part += str[i];
      }
    }
    i++;
  }
  if (part.trim() !== "") {
    result.push(part);
  }
  return result;
}

// parse query string in url
function pasreQuery(str) {
  const qs = str.indexOf("?") > -1 ? str.split("?").pop() : str;
  let result = {};
  for (const [key, value] of new URLSearchParams(qs).entries()) {
    if (!result[key]) {
      result[key] = [value];
    } else {
      result[key].push(value);
    }
  }
  return result;
}

// fill array to deepcopied value 
function createArray(len, value) {
  let arr = new Array(len);
  if (isFunction(value)) {
    for (let i = 0; i < len; i++) {
      arr[i] = value(i);
    }
  } else if (isObject(value)) {
    for (let i = 0; i < len; i++) {
      arr[i] = clone(value);
    }
  } else if (isArray(value)) {
    for (let i = 0; i < len; i++) {
      arr[i] = clone(value);
    }
  } else if (typeof value !== "undefined") {
    for (let i = 0; i < len; i++) {
      arr[i] = value;
    }
  }
  return arr;
}

function getMinValue(arr) {
  return arr && arr.length > 0 ? arr.reduce(function(prev, curr) {
    return curr < prev ? curr : prev;
  }, arr[0]) : undefined;
}

function getMaxValue(arr) {
  return arr && arr.length > 0 ? arr.reduce(function(prev, curr) {
    return curr > prev ? curr : prev;
  }, arr[0]) : undefined;
}

// Arithmetic mean
function getMeanValue(arr) {
  return arr && arr.length > 0 ? arr.reduce(function(prev, curr) {
    return prev + curr;
  }, 0) / arr.length : undefined;
}

// Most frequent
function getModeValue(arr) {
  if (!arr) {
    return;
  };
  let seen = {}, 
      maxValue = arr[0], 
      maxCount = 1;
  for (let i = 0; i < arr.length; i++) {
    const value = arr[i];
    seen[value] = seen[value] ? seen[value] + 1 : 1;
    if (seen[value] > maxCount) {
      maxValue = value;
      maxCount = seen[value];
    }
  }
  return maxValue;
}

// sort array ascending order
function sortArray(arr) {
  const priorities = [
    isUndefined,
    isNull,
    isBoolean,
    isNumber,
    isString,
    isObject,
    isArray,
    isFunction,
  ];
  return arr.sort(function(a, b) {
    const aIdx = priorities.findIndex(function(fn) {
      return fn(a);
    });

    const bIdx = priorities.findIndex(function(fn) {
      return fn(b);
    });

    if (aIdx !== bIdx) {
      return aIdx - bIdx;
    } else if (aIdx === 0 || aIdx === 1) {
      // undefined, null
      return 0;
    } else if (aIdx === 2) {
      // boolean
      return a !== b ? (a ? 1 : -1) : 0;
    } else if (aIdx === 3) {
      // number
      return a - b;
    } else if (aIdx === 4) {
      // string
      return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    } else if (aIdx === 5) {
      // object
      return Object.keys(a).length - Object.keys(b).length;
    } else if (aIdx === 6) {
      // array
      return a.length - b.length;
    } else {
      // function, others
      return 0;
    }
  });
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(arr) {
  let i = arr.length;
  while (i > 0) {
    let j = Math.floor(Math.random() * i);
    i--;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getRandomValue(arr) {
  return arr[Math.floor(random(0, arr.length))];
}

function getAllCases(arr) {
  function getFirstIndexes(a) {
    if (a.length < 1) {
      return;
    }
    const result = [];
    for (let i = 0; i < a.length; i++) {
      result.push(0);
    }
    return result;
  }
  function getNextIndexes(a, indexes) {
    for (let i = a.length - 1; i >= 0; i--) {
      // decrease current index
      if (indexes[i] < a[i].length - 1) {
        indexes[i] += 1;
        return indexes;
      }
      // reset current index
      indexes[i] = 0;
    }
    return;
  }
  function getValues(a, indexes) {
    const result = [];
    for (let i = 0; i < a.length; i++) {
      result.push(a[i][indexes[i]]);
    }
    return result;
  }

  const result = [];
  let indexes = getFirstIndexes(arr);
  while(indexes) {
    const values = getValues(arr, indexes);
    result.push(values);
    indexes = getNextIndexes(arr, indexes);
  }
  return result;
}

function copyObject(obj) {
  const res = isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    res[key] = isObject(value) && !isNull(value) ? clone(value) : value;
  }
  return res;
}

function queryObject(obj, qry) {
  const QUERY_OPERATORS = {
    and: ["$and"],
    notAnd: ["$notAnd", "$nand"],
    or: ["$or"],
    notOr: ["$notOr", "$nor"],
    not: ["$not"],
    include: ["$include", "$in"],
    exclude: ["$exclude", "$nin"],
    greaterThan: ["$greaterThan", "$gt"],
    greaterThanOrEqual: ["$greaterThanOrEqual", "$gte"],
    lessThan: ["$lessThan", "$lt"],
    lessThanOrEqual: ["$lessThanOrEqual", "$lte"],
    equal: ["$equal", "$eq"],
    notEqual: ["$notEqual", "$neq", "$ne"],
    function: ["$function", "$func", "$fn"],
  }

  function A(d, q) {
    for (const [key, value] of Object.entries(q)) {
      if (!B(d, value, key.split("\."))) {
        return false;
      }
    }
    return true;
  }

  function B(d, q, k) {
    const o = k.shift();
    if (k.length > 0) {
      if (isObject(d)) {
        return B(d[o], q, k);
      } else {
        return false;
      }
    }
    return C(d, q, o);
  }

  function C(d, q, o) {
    if (QUERY_OPERATORS.and.indexOf(o) > -1) {
      for (const v of q) {
        if (!A(d, v)) {
          return false;
        }
      }
      return true;
    } else if (QUERY_OPERATORS.notAnd.indexOf(o) > -1) {
      return !C(d, q, "$and");
    } else if (QUERY_OPERATORS.or.indexOf(o) > -1) {
      for (const v of q) {
        if (A(d, v)) {
          return true;
        }
      }
      return false;
    } else if (QUERY_OPERATORS.notOr.indexOf(o) > -1) {
      return !C(d, q, "$or");
    } else if (QUERY_OPERATORS.not.indexOf(o) > -1) {
      return !A(d, q);
    } else if (QUERY_OPERATORS.include.indexOf(o) > -1) {
      if (isArray(d)) {
        for (const v of d) {
          if (!C(v, q, "$include")) {
            return false;
          }
        }
        return true;
      } else {
        for (const v  of q) {
          if (C(d, v, "$equal")) {
            return true;
          }
        }
        return false;
      }
    } else if (QUERY_OPERATORS.exclude.indexOf(o) > -1) {
      return !C(d, q, "$include");
    } else if (QUERY_OPERATORS.greaterThan.indexOf(o) > -1) {
      return d > q;
    } else if (QUERY_OPERATORS.greaterThanOrEqual.indexOf(o) > -1) {
      return d >= q;
    } else if (QUERY_OPERATORS.lessThan.indexOf(o) > -1) {
      return d < q;
    } else if (QUERY_OPERATORS.lessThanOrEqual.indexOf(o) > -1) {
      return d <= q;
    } else if (QUERY_OPERATORS.equal.indexOf(o) > -1) {
      if (isArray(d) && isArray(q)) {
        if (d.length !== q.length) {
          return false;
        }
        for (let i = 0; i < q.length; i++) {
          if (d[i] !== q[i]) {
            return false;
          }
        }
        return true;
      } else {
        return d === q;
      }
    } else if (QUERY_OPERATORS.notEqual.indexOf(o) > -1) {
      return !C(d, q, "$equal");
    } else if (QUERY_OPERATORS.function.indexOf(o) > -1) {
      return q(d);
    } else if (!isObject(d)) {
      return false;
    } else if (isObject(q)) {
      return A(d[o], q);
    } else {
      return C(d[o], q, "$equal");
    }
  }
  
  return A(obj, qry);
}

function getContainedSize(src, dst) {
  const aspectRatio = src.width / src.height;
  if (aspectRatio < dst.width / dst.height) {
    return {
      width: dst.height * aspectRatio,
      height: dst.height,
    }
  } else {
    return {
      width: dst.width,
      height: dst.width / aspectRatio,
    }
  }
}

function getCoveredSize(src, dst) {
  const aspectRatio = src.width / src.height;
  if (aspectRatio < dst.width / dst.height) {
    return {
      width: dst.width,
      height: dst.width / aspectRatio,
    }
  } else {
    return {
      width: dst.height * aspectRatio,
      height: dst.height,
    }
  }
}

const wait = function(delay) {
  return new Promise(function(resolve) {
    return setTimeout(resolve, delay);
  });
}

const __module__ = {
  isBoolean,
  isNumber,
  isNumeric,
  isString,
  isEmptyString,
  isObject,
  isEmptyObject,
  isNull,
  isArray,
  isBooleanArray,
  isNumberArray,
  isStringArray,
  isObjectArray,
  isEmptyArray,
  isFunction,
  isEmpty,
  isSameType,

  random,
  rand: random,
  id,
  xor, // XOR

  splitInt,
  splitFloat,

  toHalfWidth,
  toFullWidth,

  compare: compareStrings,

  parseCommand,
  pasreQuery,

  min: getMinValue,
  minimum: getMinValue,
  max: getMaxValue,
  maximum: getMaxValue,
  avg: getMeanValue,
  average: getMeanValue,
  mean: getMeanValue,
  mode: getModeValue,
  mostFrequent: getModeValue,
  
  choose: getRandomValue,
  array: createArray,
  sort: sortArray,
  shuffle: shuffleArray,
  cases: getAllCases,

  copy: copyObject,
  query: queryObject,

  contain: getContainedSize,
  cover: getCoveredSize,

  wait,
}

// esm
export default __module__;

// cjs
// module.exports = __module__;

// browser
// window.jsu = __module__;