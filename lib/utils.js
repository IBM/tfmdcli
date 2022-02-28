/**
 * This file contains string parsing functions used by the CLI
 */

/**
 * Search through an array of objects and finds the longest length of a sting key value
 * @param {Array<Object>} arr  Array of objects
 * @param {string} field field name
 * @returns The length of the longest string
 */
function getLongest(arr, field) {
  let longest = field.length; // Initialize longest as name of field
  // For each entry in the array
  arr.forEach((entry) => {
    if (entry[field]) {
      // get length of current entry
      let strLength = entry[field].length;
      // If it's longer than longest, update longest
      if (strLength > longest) {
        longest = strLength;
      }
    }
  });
  // return number of characters
  return longest;
}

/**
 * Remove trailing spaces from the end of a string
 * @param {string} str The string to have spaces removed from
 * @returns The string with no trailing spaces
 */
function removeTrailingSpaces(str) {
  let splitStr = str.split("");
  while (splitStr[splitStr.length - 1] === " ") {
    splitStr.pop();
  }
  return splitStr.join("");
}

/**
 * Get all the data from a block of terraform code
 * @param {Array<string>} arr A list of fields to find in the terraform
 * @param {string} string The data string to search through
 * @param {boolean} addDefaultBreaks Add line breaks to
 * @returns An object containing the name and any found fields in the string
 */
function pullSubStrData(arr, string, addDefaultBreaks) {
  // Fing opening of block
  let firstOpenBrace = string.indexOf("{");
  // Get the name of the block
  let name = string.substr(0, firstOpenBrace).replace(/\s/g, "").replace(/\"/g, "");
  // Get the string without the data
  let dataSubStr = string.substr(firstOpenBrace + 1).split("");
  dataSubStr.pop(); // Remove last character "}"
  dataSubStr = dataSubStr
    .join("")
    .replace(/\s?validation\s\{.*\}/g, "")
    .replace(/(?<=\[\])\s?\}\n?/g, "") // Remove trailing } following empty array. WOW.
    .split(""); // Remove validation blocks
  // Remove leading spaces
  while (dataSubStr[0] === " ") {
    dataSubStr.shift();
  }
  dataSubStr = removeTrailingSpaces(dataSubStr.join(""));
  let fieldsArr = [];
  // Create an array of objects with the field names and the index of that field
  arr.forEach((field) => {
    // Stop searching for name field as it will be generated automatically
    if (field !== "name") {
      let fieldRegex = new RegExp(field + "\\s?=\\s?");
      if (dataSubStr.indexOf(field) !== -1)
        fieldsArr.push({
          [field]: dataSubStr.search(fieldRegex),
        });
    }
  });
  // Sort fields by index with the earliest index being first. Sort function is ignored for unit tests
  /* istanbul ignore next */
  fieldsArr.sort((a, b) => {
    let aIndex = a[Object.keys(a)[0]];
    let bIndex = b[Object.keys(b)[0]];
    if (aIndex > bIndex) {
      return 1;
    } else if (bIndex > aIndex) {
      return -1;
    }
  });
  // Create object to return
  let fieldsObject = {
    name: name,
  };
  for (let i = fieldsArr.length - 1; i >= 0; i--) {
    // Get the key of the field to search for
    let fieldKey = Object.keys(fieldsArr[i])[0];
    // Create a regex for that field
    let fieldRegex = new RegExp(fieldKey + "\\s?=\\s?");
    // Find the index of the field
    let firstIndex = fieldsArr[i][fieldKey];
    // Get a substring of the length of the string plus the index of the key
    let subStr = dataSubStr.substr(firstIndex, dataSubStr.length - 1);
    // Add substring to fieldObject
    fieldsObject[fieldKey] = removeTrailingSpaces(
      subStr.replace(fieldRegex, "")
    );
    let addLineBreaks =
      (fieldKey === "default" || fieldKey === "value") && addDefaultBreaks;
    // remove quotes from only string, number, and boolean types
    if (
      fieldsObject[fieldKey].indexOf("{") === -1 &&
      fieldsObject[fieldKey].indexOf("[") === -1
    ) {
      fieldsObject[fieldKey] = fieldsObject[fieldKey].replace(/\"/g, "");
    } else if (addLineBreaks) {
      fieldsObject[fieldKey] = addDefaultLineBreaks(fieldsObject[fieldKey]);
    }
    // Replace substring with empty characters
    dataSubStr = dataSubStr.replace(subStr, "");
  }
  // Return object
  return fieldsObject;
}

/**
 * Gets the longest length of each string in each object the array
 * @param {Array<object>} arr
 * @returns An object containing key value pairs where the keys are the name of the field,
 * and the value is the length of the longest entry
 */
function getAllLongest(arr, order) {
  // List of keys
  let keys = [];
  // Object to return
  let longestObject = {};
  // For each item in the array
  arr.forEach((item) => {
    // Check all the keys, if it's not in the list of keys, add it.
    Object.keys(item).forEach((key) => {
      if (keys.indexOf(key) === -1) keys.push(key);
    });
  });
  // Get the longest entry for each key
  keys.forEach((key) => {
    longestObject[key] = getLongest(arr, key);
  });
  // Add default length of each item in the order if order is passed
  if (order)
    order.forEach((field) => {
      if (!longestObject[field]) longestObject[field] = field.length;
    });
  // Return object
  return longestObject;
}

/**
 * Match the length of a string
 * @param {string} str The string that will match the legnth of the longest
 * @param {number} longest The length to match to
 * @param {boolean} useDashes Use dashes instad of spaces
 */

function matchLength(str, longest, useDashes) {
  let newStr = str === null || str === undefined ? " " : str;
  if (newStr.length < longest) {
    while (newStr.length < longest) {
      // While the string is less than the longest, add a space or a dash
      newStr += useDashes ? "-" : " ";
    }
  } else {
    // If the string is greater than the length, remove letters until it matches longest
    let split = newStr.split("");
    while (split.length > longest) {
      split.pop();
    }
    newStr = split.join("");
  }
  return newStr;
}

/**
 * Create a readme table line
 * @param {Array<string>} order List for the fields to appear in table
 * @param {Object} longest An object describing length of entries
 * @param {Object} entry The entry to add to the table
 * @param {?boolean} dashesOnly Use only dashes for the field
 * @returns A formatted string
 */
function makeLine(order, longest, entry, dashesOnly) {
  let line = "";
  order.forEach((key) => {
    let isLast = order.indexOf(key) === order.length - 1;
    let addPipe = isLast ? "" : " | ";
    if (dashesOnly) {
      line += matchLength("", longest[key], true) + addPipe;
    } else {
      // If entry is undefined, return empty string
      let entryData = entry[key] || "";
      line += isLast
        ? entryData
        : matchLength(entryData, longest[key], dashesOnly) + addPipe;
    }
  });
  return line;
}

/**
 * Builds a markdown table from a list of objects
 * @param {Array<string>} order An array of strings that shows the order of columns that will be output
 * @param {Object} longest An object containing the longest entry for each item in order
 * @param {Array<object>} entries List of entries
 * @returns A markdown formatted text field
 */
function buildTable(order, longest, entries) {
  // Object that will have names for each field
  let capitalizedFields = {};
  // Set the name of the field to equal the capitalized name
  order.forEach((key) => {
    if (key.indexOf("_") === -1) {
      let splitKey = key.split("");
      splitKey[0] = splitKey[0].toUpperCase();
      capitalizedFields[key] = splitKey.join("");
    } else {
      // For fields separated by a _ split the words by underscore and capitalize first letter
      let splitOne = key.split("_");
      let words = [];
      splitOne.forEach((word) => {
        let splitWord = word.split("");
        splitWord[0] = splitWord[0].toUpperCase();
        words.push(splitWord.join(""));
      });
      capitalizedFields[key] = words.join(" ");
    }
  });
  // Initialize text
  let readmeTableData = [
    // Create header row
    makeLine(order, longest, capitalizedFields),
    // Create Middle Row
    makeLine(order, longest, capitalizedFields, true),
  ];
  // Add data for each entry
  entries.forEach((entry) => {
    readmeTableData.push(makeLine(order, longest, entry));
  });
  // Return text
  return readmeTableData.join("\n");
}

/**
 * Build entries
 * @param {Array<string>} entries An array of terraform entries
 * @param {Array<string>} fields A list of fields to pull
 * @param {boolean} addDefaultBreaks Add line breaks to default entries
 * @returns An array of formatted objects to use with buildTable
 */
function buildEntries(entries, fields, addDefaultBreaks) {
  let formattedEntries = [];
  // For each entry add formatted entries if the line is not only whitespace
  entries.forEach((entry) => {
    if (!entry.match(/^\s+$/g))
      formattedEntries.push(pullSubStrData(fields, entry, addDefaultBreaks));
  });
  return formattedEntries;
}

/**
 * Create parsed file data to use in building entries
 * @param {string} blockType The type of block to be used. currently only `output` and `variable` are supported
 * @param {string} fileData The data of the file to read
 * @returns An array of values formatted so that the information for each is in a single string
 */
function parseFileData(blockType, fileData) {
  let dataArr = fileData
    .replace(/\/\*[^]*\*\//g, "") // Remove block comments made with /**/
    // look for /* any characters until */
    .replace(/(?<=(^|\s|\n))\/\/.*(?=(\n|$))/g, "")
    // Lookahead for beginning of string, space, or newline. fine // and any chatacter until newline or end of entry
    // Replace single line comments that are either a single line or that begin with a space or begin the file
    .replace(/#.*/g, "") // Replace all lines with comments to nothing
    .replace(/\n\n+/g, "") // Replace all multiple newline characters
    .replace(/[\s\t]+/g, " ") // Replace all spaces with a single space
    .split(blockType + " "); // split by `blocktype` to leave only the relevant fields
  if (dataArr[0] === "" || dataArr[0] === " ") {
    dataArr.shift();
  }
  return dataArr;
}

/**
 * Parse a file and return a markdown table
 * @param {string} blockType The type of block to use. Currently only `variable` and `output` are supported
 * @param {string} fileData plaintext file data
 * @param {Array} order The order of fields to print the table
 * @param {boolean} addDefaultBreaks Add line breaks to default entries
 * @param {Array} addColumns A list of empty columns to add to the table
 * @returns A markdown table
 */
function parseAndPrint(
  blockType,
  fileData,
  order,
  addDefaultBreaks,
  includeOnly,
  addColumns
) {
  // If add columns is passed, create new array with order
  let fieldOrder = addColumns ? [].concat(order, addColumns) : order;
  // If add columns is passed, create new array with include only
  let include = addColumns ? [].concat(includeOnly, addColumns) : includeOnly;
  let parsedData = parseFileData(blockType, fileData);
  let entries = buildEntries(parsedData, fieldOrder, addDefaultBreaks);
  let longest = getAllLongest(entries, fieldOrder);
  let table = buildTable(include, longest, entries);
  return table;
}

/**
 * Create an example module block from a variable file
 * @param {string} fileData plaintext file data
 * @param {string} moduleName Name of the module to be created
 * @param {string} source Path of the module to use
 * @returns A markdown formatted terraform module block
 */
function parseAndPrintExample(fileData, moduleName, source) {
  let parsedData = parseFileData("variable", fileData);
  let entries = buildEntries(parsedData, ["name"]);
  let longest = getAllLongest(entries, ["name"]);
  let moduleString = `\`\`\`terraform
module ${moduleName} {
  ${matchLength("source", longest.name)} = "${source}"
`;
  entries.forEach((entry) => {
    let name = entry.name;
    moduleString += `  ${matchLength(name, longest.name)} = var.${name}\n`;
  });
  moduleString += `}\n\`\`\``;
  return moduleString;
}

/**
 * Format a bool string or number tfvar
 * @param {string} varName Name of the variable
 * @param {string} varType Type of the variabke
 * @param {string} varDefault Variable default
 * @returns A formatted string
 */
function formatSimpleTfvar(varName, varType, varDefault) {
  // Return null as value if variable is null
  let printDefault = varDefault === "null" ? "null" : varDefault;
  // Replace optional in the variable type with nothing, remove trailing parenthesis
  let varTypeNotOptional = varType.replace(/(optional\s?\(\s?|(?<=optional.+)\))/g, "")
  if (varTypeNotOptional === "string") {
    return `${varName}=${
      printDefault === "null" ? printDefault : `"${printDefault || ""}"`
    }`;
  } else if (varTypeNotOptional === "number") {
    return `${varName}=${printDefault || 0}`;
  } else if (varTypeNotOptional === "bool") {
    return `${varName}=${printDefault || "true"}`;
  } else {
    throw new Error(
      "Type for formatSimpleTfvar must be `string`, `number`, or `bool`. Got: " +
      varTypeNotOptional
    );
  }
}

/**
 * Format the values inside a tfvar object
 * @param {string} str A list of values with names and types
 * @param {string} spaces A string of spaces to add before each entry
 * @returns A newline separated list of formatted variables
 */
function formatObjectTfvar(str, spaces) {
  // Replace object declaration and split by spaces between type name and following argument
  let typeArr = str.split(/\s(?=[\w\d-]+\s=)/);
  let returnString = "";
  // For each entry in the array, get simple variable value and add spaces and newline
  typeArr.forEach((entry) => {
    let subName = entry.split(/\s?\=\s?/)[0];
    let subType = entry.split(/\s?\=\s?/)[1];
    let isLast = typeArr[typeArr.length - 1] === entry ? "" : "\n";
    let addSpaces = spaces || "";
    returnString += addSpaces + formatSimpleTfvar(subName, subType) + isLast;
  });
  return returnString;
}

/**
 * Returns a number of spaces
 * @param {number} count How many spaces to return
 * @returns a string of spaces
 */
function getSpaces(count) {
  let spaces = "";
  while (spaces.length < count) {
    spaces += " ";
  }
  return spaces;
}

/**
 * Create an example tfvar from a variable entry
 * @param {Object} entry variable entry to use
 * @param {boolean} noDefault use none of the default variables
 * @returns A formatted tfvar string
 */
function makeExampleTfvar(entry, noDefault) {
  // Name of variable
  let varName = entry.name;
  // Type of variable. If no type is passed, use string
  let varType = entry.type != undefined ? entry.type : "string" //.replace(/optional\(\s?/g, "") : "string";
  // Simple types
  let simpleTypes = ["bool", "string", "number"];
  // Get variable default. If noDefault is passed, set to null
  let varDefault = noDefault ? null : entry.default || null;

  if (simpleTypes.indexOf(varType) !== -1) {
    return formatSimpleTfvar(varName, varType, varDefault);
  } else {
    if (varType.match(/^list\((string|bool|number)\)$/)) {
      return `${varName}=${varDefault || "[]"}`;
    } else if (varDefault) {
      // If the variable has a default, return default
      return `${varName}=${varDefault}`;
    } else if (varType.match(/^object\(\{[\s\w=_]+\}\)$/)) {
      // Replace object declaration and split by spaces between type name and following argument
      let objectStr = varType.replace(/object\(\{\s?|\s?\}|\)/g, "");
      let returnString = formatObjectTfvar(objectStr, "  ");
      // return object
      return `{\n${returnString}\n}`;
    } else {
      // Create list to turn into variable
      let varTypeNoOptional = [] 
      if (varType.split(/optional\(\s/g).length === 1) {
        varTypeNoOptional = [varType]
      } else {
        let splitType = varType.split(/\s(?=optional\()/g);
        splitType.forEach(type => {
          if (splitType.indexOf(type) === 0) {
            varTypeNoOptional.push(type)
          } else {
            varTypeNoOptional.push(type.replace(/\)$/g,"").replace(/optional\(\s/g, "").replace(/\)\s(?=(\w+\s=|\})$)/g,""))
          }
        })
        
      }
      let typeList = varTypeNoOptional.join("")
        // Add flag to single type lists
        .replace(
          /\s?=\s?list\(\s?(?=(string|bool|number))/g,
          "???SINGLE-TYPE-LIST???"
        )
        // Replace space before single type list with separator
        .replace(/(?<=(string|bool|number))\s(?=.+\?\?\?)/g, "[")
        // Replace equal sign followed by object or list declaration with separator `[`
        .replace(/\s?=\s?(?=(object|list))/g, "[[[")
        // Replace end of list of objects with end of list and separator
        .replace(/\)\s?\)\s?/g, "!!!END-OF-LIST!!![")
        // Replace end of object with end of object and separator
        .replace(/\}\s?/g, "!!!END-OF-OBJECT!!![")
        // Replace all leading and trailing object and list declaratrions with separator
        .replace(/\s?[\(\{\}\)]+\s?/g, "[")
        // Find spaces leading end of object/list and replace with separator
        .replace(/\s(?=!!!)/g, "[")
        // Split by separator
        .split(/\[+/);
      // Remove trailing whitespace
      while (typeList[typeList.length - 1] === "") {
        typeList.pop();
      }
      // String to be returned by function
      let returnString = [];
      // Running Tab count for while loop
      let tabCount = 0;
      // Variable to store object and list names
      let addNext = "";
      // While typeList still contain entries
      while (typeList.length > 0) {
        // Add spaces to object
        let tabs = getSpaces(tabCount * 4);
        // Reference to shifted item
        let item = typeList.shift();
        // Item to add to returnString
        let addString = "";
        if (item === "!!!END-OF-LIST!!!") {
          // Add end of list
          tabCount--;
          addString = getSpaces(tabCount * 4) + "]";
        } else if (item === "!!!END-OF-OBJECT!!!") {
          // Add end of object
          tabCount--;
          addString = getSpaces(tabCount * 4) + "}";
        } else if (item.indexOf("???SINGLE-TYPE-LIST???") !== -1) {
          // Create single type lists
          let splitItem = item.split("???SINGLE-TYPE-LIST???");
          let name = splitItem[0];
          let type = splitItem[1];
          addString =
            tabs + `${formatSimpleTfvar(name, type).replace("=", "=[")}]`;
        } else if (item.match(/(?<==\s(string|bool|number))\s(?!.+\=)/)) {
          // If item has a trailing argument definition make add next
          let splitItem = item.split(/\s/g);
          addNext = splitItem.pop();
          // Join to form rematining item
          item = splitItem.join(" ");
          // Add Formatted object to string
          addString = formatObjectTfvar(item, tabs);
        } else if (item === "list" || item === "object") {
          // Add tabs
          tabCount++;
          if (addNext) {
            // if there is a trailing declaration, add it to the string and reset addNext
            addString = `${tabs + addNext + " = "}${
              item === "list" ? "[" : "{"
            }`;
            addNext = "";
          } else {
            // Otherwise add opening brace or bracket
            addString = `${tabs}${item === "list" ? "[" : "{"}`;
          }
        } else if (item.indexOf("=") === -1) {
          // If there is no equal sign, add the header to addNext
          addNext = item;
        } else {
          // Otherwise format the object
          addString = formatObjectTfvar(item, tabs);
        }
        // If add string is not empty, add data to returnString
        if (addString !== "") returnString.push(addString);
      }
      // Add variable name to first line
      returnString[0] = `${varName}=` + returnString[0];
      // Return formatted string
      return returnString.join("\n");
    }
  }
}

/**
 * Parse and print tfvars from a variable file
 * @param {string} fileData Raw file data
 * @param {boolean} overrideDefault Print a default based on the object type instead of the listed default
 * @returns A formatted tfvars list
 */
function parseAndPrintTfvars(fileData, overrideDefault) {
  let parsedData = parseFileData("variable", fileData);
  let entries = buildEntries(parsedData, [
    "name",
    "type",
    "default",
    "sensitive",
    "description",
  ]);
  let tfvars = [];
  entries.forEach((entry) =>
    tfvars.push(makeExampleTfvar(entry, overrideDefault))
  );
  return tfvars.join("\n");
}

/**
 * This function returns a terraform `default` variable field that is an object or a list with the separate arguments
 * separated by the <br> line break
 * @param {string} str String to break up
 * @returns A string with line breaks
 */
function addDefaultLineBreaks(str) {
  // Looks for `[ [`
  // ((?<=\[)\s(?=\[))s
  // Looks for `[ "`
  // ((?<=\[)\s(?=\"))
  // Looks for a space following a key value variable pair followed by any number of: { ] \s _ , }
  // ((?<=(\w+\s?=\s[A-z0-9"/.-]+)[{\]\s},]+)\s)
  // Loooks for a space followed by ] or an argrument or a comma, or a }
  // (\s(?=(]\s\w+\s?=\s?)(]\s?(}|,))))
  // looks for [ {
  // ((?<=\[)\s(?=\{))
  // Looks for " ]
  // (?<=")\s(?=])
  // Looks for a space followed by a question mark
  // (\s(?=\?))
  // (?<=\?[.\d\s\w\[\]]+)\s(?=:)
  //  Looks for colon folowing expression
  // (?<=\[)\s(?=for[\s\w]+in[\s\w.]+:)
  // Look for space between opening brace or bracket and for expression
  // (?<=for[\s\w]+in[\s\w.]+:)\s(?=[\{\[])
  // Look for space following for
  return str.replace(
    /((?<=\[)\s(?=\[))|((?<=\[)\s(?=\"))|((?<=(\w+\s?=\s[A-z0-9"/.-]+)|[{\]\s},]+)\s)|(\s(?=(]\s\w+\s?=\s?)|(]\s?(}|,))))|((?<=\[)\s(?=\{))|((?<=")\s(?=]))|(\s(?=\?))|(?<=[\[\{])\s(?=for[\s\w]+in[\s\w.]+:)|(?<=\?[.\d\s\w\[\]]+)\s(?=:)|(?<=for[\s\w]+in[\s\w.]+:)\s(?=[\{\[])/g,
    "<br>"
  );
}

module.exports = {
  getLongest: getLongest,
  pullSubStrData: pullSubStrData,
  getAllLongest: getAllLongest,
  matchLength: matchLength,
  buildTable: buildTable,
  buildEntries: buildEntries,
  removeTrailingSpaces: removeTrailingSpaces,
  makeLine: makeLine,
  parseFileData: parseFileData,
  parseAndPrint: parseAndPrint,
  addDefaultLineBreaks: addDefaultLineBreaks,
  parseAndPrintExample: parseAndPrintExample,
  parseAndPrintTfvars: parseAndPrintTfvars,
  makeExampleTfvar: makeExampleTfvar,
  formatSimpleTfvar: formatSimpleTfvar,
  formatObjectTfvar: formatObjectTfvar,
  getSpaces: getSpaces,
};
