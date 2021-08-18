const fs = require("fs");
const utils = require("./utils");
const chalk = require("chalk");

// Order for TF vars to be in the table
const order = {
  output: ["name", "description", "sensitive", "depends_on", "value"],
  variable: ["name", "type", "description", "sensitive", "default"],
};

// Argument aliases
const aliases = {
  "-b": "--breaks",
  "-o": "--include-only",
  "-h": "--help",
  "--breaks": "-b",
  "--include-only": "-o",
  "-a": "--add-columns",
  "--add-columns": "-a",
  "-m": "--module",
  "-s": "--source",
  "--module": "-m",
  "--source": "-s",
  "-t": "--tfvars",
  "--tfvars": "-t",
  "-i": "--ignore-defaults",
  "--ignore-defaults": "-i",
};

// Accepted args
const acceptedArgs = Object.keys(aliases);

/**
 * Use FS to read a file
 * @param {string} filePath Path to the file
 * @returns The utf8 data from the filepath
 */
function readFile(filePath) {
  if (filePath.match(/.*\.tf$/)) return fs.readFileSync(filePath, "utf8");
  else throw new Error(`File specified must be .tf. Got ${filePath}`);
}

/**
 * Checks to make sure file data is valid
 * @param {string} fileData utf8 file data
 * @returns variable or output
 */
function checkFile(fileData) {
  // Throw error function
  let errorOut = (text) => {
    throw new Error(
      "Files may only contain either `output` or `variable` blocks" +
        (text || "")
    );
  };
  if (
    fileData.match(/(resource|data)\s+[\w\"]+\s+\w+\s\{/) ||
    fileData.match(/(locals|provider|terraform)\s+\{/)
  ) {
    // Error for resource, data blocks, and locals
    errorOut();
  } else if (!fileData.match(/(^|\n)(variable|output)\s+[\w\"]+\s\{/)) {
    // Error out if neither variables or outputs are found
    errorOut(", found neither.");
  } else if (
    fileData.match(/variable\s+[\w\"]+\s\{/) &&
    fileData.match(/output\s+[\w\"]+\s\{/)
  ) {
    // Error out for both
    errorOut(", found both.");
  } else if (fileData.match(/variable\s+[\w\"]+\s\{/)) {
    return "variable";
  } else {
    return "output";
  }
}

/**
 * Prints a table from filedata
 * @param {string} blockType the type of block to be formatted into a table
 * @param {string} fileData utf8 file data
 * @param {?Array<string>} includeOnly values to be retirned by the table
 * @param {?boolean} addDefaultBreaks add default line breaks
 * @param {Array} addColumns A list of empty columns to add to the table
 * @returns A markdown formatted table
 */
function printTable(
  blockType,
  fileData,
  includeOnly,
  addDefaultBreaks,
  addColumns
) {
  // Create table
  let table = utils.parseAndPrint(
    blockType,
    fileData,
    order[blockType],
    addDefaultBreaks || false,
    includeOnly || order[blockType],
    addColumns
  );
  return table;
}

/**
 * Allow flags to be passed without an equal sign.
 * @param {Array<string>} arguments process.argv
 * @return An object with each flag
 */
function getAllFlagsNoEquals(args) {
  let flagArgs = []; // List of flag arguments
  let flagObject = {};
  // Get all the flags that arent the first three (nodepath, file, input file)
  for (let i = 3; i < args.length; i++) {
    flagArgs.push(args[i]);
  }
  if (flagArgs.length > 0) {
    // Join all entries with an equal sign
    let joinedArgs = flagArgs.join("=");
    if (!joinedArgs.match(/^(-+(=?[^\s]+\=?)*)+$/)) {
      let invalidArgs = joinedArgs;
      // Ignore sort function. Get arguments from longest to shortest
      /* istanbul ignore next */
      let argsLongToStort = acceptedArgs.sort((a, b) => {
        if (a.length > b.length) return -1;
        else return 1;
      });
      // For each accepted argument, replace the regular expression followed by optional parameters with empty string
      argsLongToStort.forEach((key) => {
        let exp = new RegExp(`(^|=)${key}=?[^\s-]*(?==)`, "g");
        invalidArgs = invalidArgs.replace(exp, "");
      });
      // Split replaining args with =
      invalidArgs = invalidArgs.split("=");
      throw new Error(
        `Expected additional arguments to all be valid flags. Invalid arguments: ${JSON.stringify(
          invalidArgs
        )}`
      );
    }
    // Split arguments where an equal sign is in front of a hyphen denoting a flag
    let resplitArgs = joinedArgs.split(/\=(?=-)/);
    // Get all flags
    flagObject = getAllFlags(resplitArgs);
  }
  return flagObject;
}

/**
 * Get flags from a string of arguments
 * @param {Array<string>} arguments process.argv
 * @return An object with each flag
 */
function getAllFlags(args) {
  // Key value pair of arguments
  let argsObject = {};
  // Aliases found, if there are duplicates will throw an error
  let foundAliases = [];
  args.forEach((line) => {
    // Check for valid flags
    if (line.search(/\-\-?\w/) === 0) {
      // Split by =
      let splitLine = line.split("=");
      if (
        argsObject[splitLine[0]] ||
        foundAliases.indexOf(splitLine[0]) !== -1
      ) {
        // Throw an error if an alias exists or a duplicate key would be added to the object
        throw new Error("error, duplicate flag passed");
      } else {
        // If no params are passed, set value to `true`
        argsObject[splitLine[0]] = splitLine[1] || true;
        // If a key is found, add the alias to found aliases
        foundAliases.push(aliases[splitLine[0]]);
      }
    }
  });
  return argsObject;
}

/**
 * Checks for valid flags in a list of argumets
 * @param {Array<string>} args A list of arguments passed
 * @returns An object contiang the arguments and data
 */
function checkFlags(args) {
  let argObject = getAllFlagsNoEquals(args);
  let erroredKeys = [];
  // Search flags for accepted flags
  Object.keys(argObject).forEach((key) => {
    // If an unaccepted flag is found add to error array
    if (acceptedArgs.indexOf(key) === -1) {
      erroredKeys.push(key);
    }
  });
  // If errors are found throw an error
  if (erroredKeys.length > 0) {
    let errorString = "";
    erroredKeys.forEach((key) => {
      let addComma =
        erroredKeys.indexOf(key) < erroredKeys.length - 1 ? ", " : "";
      errorString += key + addComma;
    });
    throw new Error(
      `Invalid flag${erroredKeys.length > 1 ? "s" : ""} ` + errorString
    );
  } else {
    // Otherwise return object
    return argObject;
  }
}

/**
 * Gets data from flags
 * @param {Array<string>} args List of arguments passed
 * @param {string} fileType Type of file to search
 * @returns An object describing the calues passed
 */
function getFlagData(args, fileType) {
  // check args for errors
  let argObject = checkFlags(args);
  // flags with no parameters
  let noParams = [
    "-b",
    "--breaks",
    "-t",
    "--tfvars",
    "-i",
    "--ignore-defaults",
  ];
  // flags with parameters
  let params = [
    "-o",
    "--include-only",
    "-a",
    "--add-columns",
    "-m",
    "--module",
    "-s",
    "--source",
  ];
  // flags that can only be passed together
  let exclusive = {
    "-m": {
      name: "-m | --module",
      requires: ["-s", "--source"],
      fileType: "variable",
    },
    "--module": {
      name: "-m | --module",
      requires: ["-s", "--source"],
      fileType: "variable",
    },
    "-s": {
      name: "-s | --source",
      requires: ["-m", "--module"],
      fileType: "variable",
    },
    "--source": {
      name: "-s | --source",
      requires: ["-m", "--module"],
      fileType: "variable",
    },
    "-i": {
      name: "-i | --ignore-defaults",
      requires: ["-t", "--tfvars"],
      fileType: "variable",
    },
    "--ignore-defaults": {
      name: "-i | --ignore-defaults",
      requires: ["-t", "--tfvars"],
      fileType: "variable",
    },
    "-t": {
      name: "-t | --tfvars",
      requires: [],
      optionalKeys: ["-i", "--ignore-defaults"],
      fileType: "variable",
    },
    "--tfvars": {
      name: "-t | --tfvars",
      requires: [],
      optionalKeys: ["-i", "--ignore-defaults"],
      fileType: "variable",
    },
  };
  // Object to be returned
  let returnObject = {};
  // Check for no params
  noParams.forEach((entry) => {
    if (argObject[entry]) {
      if (argObject[entry] !== true) {
        throw new Error(
          `Expected ${entry} not to be passed with additional parameters`
        );
      } else if (["-b", "--breaks"].indexOf(entry) !== -1) {
        returnObject.add_breaks = true;
      }
    }
  });
  // Check for additional flags with exclusives
  let isExclusive = false;
  // List of exclusive keys
  let exclusiveKeys = Object.keys(exclusive);
  // All args passed
  let argArr = Object.keys(argObject);
  // Check for exclusive keys
  argArr.forEach((entry) => {
    if (exclusiveKeys.indexOf(entry) !== -1) {
      isExclusive = true;
    }
  });

  if (isExclusive) {
    // Error keys for exclusivity check
    let erroredKeys = [];
    let firstExclusiveKey = "";
    let requiredKeys = [];
    // Get first required key
    argArr.forEach((entry) => {
      if (exclusiveKeys.indexOf(entry) !== -1 && firstExclusiveKey === "") {
        firstExclusiveKey = entry;
        requiredKeys.push(entry);
      }
    });
    // Get optional keys
    let optionalKeys = exclusive[firstExclusiveKey].optionalKeys || false;
    // Get required keys from exclusive object
    exclusive[firstExclusiveKey].requires.forEach((entry) => {
      // If the alias of a key is not in the array, add it to the array
      if (
        requiredKeys.indexOf(aliases[entry]) === -1 &&
        requiredKeys.indexOf(entry) === -1
      )
        requiredKeys.push(entry);
    });
    // Get errored keys
    argArr.forEach((entry) => {
      if (
        requiredKeys.indexOf(entry) === -1 &&
        requiredKeys.indexOf(aliases[entry]) === -1
      ) {
        if (!optionalKeys) {
          // if no optional keys, push entry
          erroredKeys.push(entry);
        } else if (optionalKeys.indexOf(entry) === -1) {
          // if key is not in optional keys, push entry
          erroredKeys.push(entry);
        }
      }
    });
    if (
      argArr.length < requiredKeys.length &&
      erroredKeys.length == 0 &&
      !optionalKeys
    ) {
      throw new Error(
        `Expected ${firstExclusiveKey} flag to be passed with one of ${JSON.stringify(
          exclusive[firstExclusiveKey].requires
        )}`
      );
    } else if (erroredKeys.length > 0) {
      throw new Error(
        `Expected only ${JSON.stringify(
          requiredKeys
        )} passed, got ${JSON.stringify(argArr)}.`
      );
    } else if (fileType !== exclusive[firstExclusiveKey].fileType) {
      throw new Error(
        `${JSON.stringify(requiredKeys)} can only be used with ${
          exclusive[firstExclusiveKey].fileType
        } files. Got ${fileType}.`
      );
    } else {
      let moduleTypes = ["-m", "-s", "--module", "--source"];

      if (moduleTypes.indexOf(firstExclusiveKey) !== -1) {
        // Get module variable
        let module =
          argArr.indexOf("-m") === -1 ? argObject["--module"] : argObject["-m"];
        // Get source Variable
        let source =
          argArr.indexOf("-s") === -1 ? argObject["--source"] : argObject["-s"];
        if (!module.match(/^([A-z]|[0-9]|-|_)+$/)) {
          throw new Error(
            "Module names must match the regular expression /^([A-z]|[0-9]|-|_)+$/"
          );
        } else if (!source.match(/^([A-z:]|[0-9]|-|_|\/|\.)+$/)) {
          throw new Error(`Source must be a valid source path. Got ${source}`);
        }
        // Change return object
        returnObject = {
          module: module,
          source: source,
        };
      } else {
        // let tfvarTypes = ["-t", "--tfvars", "-i", "--ignore-defaults"];
        // if (tfvarTypes.indexOf(firstExclusiveKey) !== -1) {
        let returnObject = {
          tfvars: true,
        };
        if (
          argArr.indexOf("-i") !== -1 ||
          argArr.indexOf("--ignore-defaults") !== -1
        ) {
          returnObject.ignore_defaults = true;
        }
        return returnObject;
      }
    }
  } else {
    // Check for params
    params.forEach((entry) => {
      if (argObject[entry]) {
        if (!argObject[entry].match(/^[a-z]+(,[a-z]+)*$/g)) {
          throw new Error(
            `Expected ${entry} to be a comma separated list of lower case strings, got ${argObject[entry]}`
          );
        } else if (entry == "-o" || entry == "--include-only") {
          let includeKeys = argObject[entry].split(",");
          let errorKeys = [];
          includeKeys.forEach((key) => {
            if (order[fileType].indexOf(key) === -1) {
              errorKeys.push(key);
            }
          });
          if (errorKeys.length > 0) {
            throw new Error(
              `Keys for ${fileType} can be only ${JSON.stringify(
                order[fileType]
              )}. Got ${JSON.stringify(includeKeys)} `
            );
          }
          returnObject.include_only = includeKeys;
        } else {
          let includeKeys = argObject[entry].split(",");
          let errorKeys = [];
          includeKeys.forEach((key) => {
            if (order[fileType].indexOf(key) !== -1) errorKeys.push(key);
          });
          if (errorKeys.length > 0) {
            throw new Error(
              `Only columns that do not share a name with existing fields can be added. Exsiting fields are ${JSON.stringify(
                order[fileType]
              )}. Got ${JSON.stringify(includeKeys)}`
            );
          }
          returnObject.add_columns = includeKeys;
        }
      }
    });
  }
  return returnObject;
}

/**
 * Returns help data
 * @returns Help text
 */
function help() {
  return `
${chalk.cyan
  .bold(`###############################################################################
################################### tfmdcli ###################################
###############################################################################`)}

Terraform Markdown CLI is a tool to convert your terraform variables or outputs 
into a markdown table.

${chalk.cyan.bold(`Usage: tfmdcli <file_path> <flags>`)}

${chalk.cyan.bold(`File Path:`)} 
  The file path to a '.tf' file containing either only variables or only outputs.

${chalk.cyan.bold("Flags:")}
  -o | --output-only:
    Output only the given fields in the table. A comma separated list must be passed
    Example Usage:
    ${chalk.cyan(`tfmdcli <file_path> -o name,default`)}
  -b | --breaks:
    Add line breaks to the 'default' field of a variable file or the 'value' field of an output file
    Example Usage:
    ${chalk.cyan(`tfmdcli <file_path> -b`)}
  -a | --add-columns:
    Add additional empty columns to the table. A comma separated list must be passed.
    Example Usage:
    ${chalk.cyan(`tfmdcli <file_path> -a name,default`)}
  -m | --module:
    The module name to use when creating an example module from a variables file. A string is required.
    This must be used with the --source tag. This cannot be used with tags other than -s.
    Example Usage:
    ${chalk.cyan(`tfmdcli <file_path> -m example -s ./module/example`)}
  -s | --source:
    The file path to use when creating an example module from a variables file. A string is required.
    This must be used with the --module tag.This cannot be used with any tags other than -m.
    Example Usage:
    ${chalk.cyan(`tfmdcli <file_path> -m example -s ./module/example`)}
  -t | --tfvars:
    Create a tfvars from a variables file. This cannot be used with any tags other than -i
    Example Usage:
    ${chalk.cyan(`tfmdcli <file_path> -t`)}
  -i | --ignore-defaults:
    Ignore defaults when creating a tfvars file. This will create an empty tfvar variable for each
    of variables in the file. Can only be used with -t.
    Example Usage:
    ${chalk.cyan(`tfmdcli <file_path> -t -i`)}
  
`;
}

/**
 * Main function
 * @param {Array<string>} args A list of node arguments
 * @returns A markdown formatted table
 */

function main(args) {
  try {
    if (args.length < 3) {
      throw new Error("No file specified");
    } else if (args[2] === "--help" || args[2] === "-h") {
      return help();
    } else {
      let fileData = readFile(args[2]);
      let blockType = checkFile(fileData);
      let flagData = getFlagData(args, blockType);
      if (flagData.module) {
        return utils.parseAndPrintExample(
          fileData,
          flagData.module,
          flagData.source
        );
      } else if (flagData.tfvars) {
        return utils.parseAndPrintTfvars(fileData, flagData.ignore_defaults);
      } else {
        let includeOnly = flagData.include_only ? flagData.include_only : false;
        let addBreaks = flagData.add_breaks ? true : false;
        let addColumns = flagData.add_columns ? flagData.add_columns : false;
        return printTable(
          blockType,
          fileData,
          includeOnly,
          addBreaks,
          addColumns
        );
      }
    }
  } catch (err) {
    // Show errors
    let errorMessage =
      "\ntfmdcli Error: " +
      chalk.red(err.message) +
      "\n\nFor more information on usage run " +
      chalk.cyan("tfmdcli --help \n");
    return errorMessage;
  }
}

module.exports = {
  readFile: readFile,
  checkFile: checkFile,
  printTable: printTable,
  getAllFlags: getAllFlags,
  checkFlags: checkFlags,
  getFlagData: getFlagData,
  main: main,
  help: help,
  getAllFlagsNoEquals: getAllFlagsNoEquals,
};
