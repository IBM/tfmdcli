const { assert, util } = require("chai");
const cli = require("../lib/cli");
const fs = require("fs");
const chalk = require("chalk")

describe("cli", () => {
  describe("getAllFlags", () => {
    it("should get all flags", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-f=1',
        '-b=2',
        '-c=3'
      ]
      let expectedData = {
        "-f": "1",
        "-b": "2",
        "-c": "3"
      }
      let actualData = cli.getAllFlags(arguments);
      assert.deepEqual(actualData, expectedData, "it should return an object with the correct flags")
    });
    it("should throw an error if duplicate flags are added", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-f=1',
        '-f=2',
        '-c=3'
      ]
      let task = () => {
        cli.getAllFlags(arguments)
      }
      assert.throws(task, "error, duplicate flag passed", "it should throw an error")
    });
    it("should throw an error if duplicate aliases for flags are added", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-b',
        '--breaks',
      ]
      let task = () => {
        cli.getAllFlags(arguments)
      }
      assert.throws(task, "error, duplicate flag passed", "it should throw an error")
    })
  });
  describe("getAllFlagsNoEquals", () => {
    let getAllFlagsNoEquals = cli.getAllFlagsNoEquals
    it("should get all the flags with no equal sign", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-f',
        '1',
        '-b',
        '2',
        '-c',
        '3'
      ]
      let expectedData = {
        "-f": "1",
        "-b": "2",
        "-c": "3"
      }
      let actualData = cli.getAllFlagsNoEquals(arguments);
      assert.deepEqual(actualData, expectedData, "it should return an object with the correct flags")
    })
    it("should get all the flags with no equal when no params are passed", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-f',
        '-b',
        '-c'
      ]
      let expectedData = {
        "-f": true,
        "-b": true,
        "-c": true
      }
      let actualData = cli.getAllFlagsNoEquals(arguments);
      assert.deepEqual(actualData, expectedData, "it should return an object with the correct flags")
    })
    it("should return an empty object if no flags are passed", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf'
      ]
      let expectedData = {}
      let actualData = cli.getAllFlagsNoEquals(arguments);
      assert.deepEqual(actualData, expectedData, "it should return an object with the correct flags")
    })
  })
  describe("checkFlags", () => {
    it("should throw an error if an invalid key is passed", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-f=1'
      ]
      let task = () => {
        cli.checkFlags(arguments)
      }
      assert.throws(task, "Invalid flag -f", "It should throw an error")
    })
    it("should throw an error if invalid keys are passed", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-f', 
        '1',
        '-b', 
        '2',
        '-c', 
        '3'
      ]
      let task = () => {
        cli.checkFlags(arguments)
      }
      assert.throws(task, "Invalid flags -f, -c", "It should throw an error")
    })
    it("should return the correct object if only valid flags are passed", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-b'
      ]
      let expectedData = {
        "-b": true,
      }
      let actualData = cli.getAllFlags(arguments);
      assert.deepEqual(actualData, expectedData, "it should return an object with the correct flags")
    })
    it("should throw an error if extra parameters are passed with flags", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '1',
        '-a',
        '2',
        "--breaks",
        '3',
      ]
      let task = () => {
        cli.checkFlags(arguments)
      }
      assert.throws(task, `Expected additional arguments to all be valid flags. Invalid arguments: ["1","3"]`, "It should throw an error")
    })
    it("should throw an error if extra parameters are passed with no flags", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '1',
        '2',
        '3'
      ]
      let task = () => {
        cli.checkFlags(arguments)
      }
      assert.throws(task, `Expected additional arguments to all be valid flags. Invalid arguments: ["1","2","3"]`, "It should throw an error")
    })
  })
  describe("getFlagData", () => {
    let getFlagData = cli.getFlagData
    it("should throw an error if -b is not undefined", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-b', 
        'test'
      ]
      let task = () => {
        getFlagData(arguments)
      }
      assert.throws(task, "Expected -b not to be passed with additional parameters", "it should throw the correct error")
    })
    it("should throw an error if -o is not a comma separated list", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-o', 
        'frogfrog/frog;sdarf'
      ]
      let task = () => {
        getFlagData(arguments)
      }
      assert.throws(task, "Expected -o to be a comma separated list of lower case strings, got frogfrog/frog;sdarf", "it should throw the correct error")
    })
    it("should throw an error if -a is not a comma separated list", () => {
      let arguments = [
        'nodepath',
        './test',
        'variable',
        '-a', 
        'frogfrog/frog;sdarf'
      ]
      let task = () => {
        getFlagData(arguments, "variable")
      }
      assert.throws(task, "Expected -a to be a comma separated list of lower case strings, got frogfrog/frog;sdarf", "it should throw the correct error")
    })
    it("should throw an error if -a contains fields already in the table", () => {
      let arguments = [
        'nodepath',
        './test',
        'variable',
        '-a', 
        'default'
      ]
      let task = () => {
        getFlagData(arguments, "variable")
      }
      assert.throws(task, `Only columns that do not share a name with existing fields can be added. Exsiting fields are ["name","type","description","sensitive","default"]. Got ["default"]`, "it should throw the correct error")
    })
    it("should return an object if an include only flag has a correctly formatted comma separated list", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-o',
        'name,default,sensitive'
      ]
      let expectedData = {
        include_only: ["name", "default", "sensitive"]
      }
      let actualData = getFlagData(arguments, "variable");
      assert.deepEqual(actualData, expectedData, "it should return the correct object")
    })
    it("should return an empty object if no flags passed", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf'
      ]
      let expectedData = {}
      let actualData = getFlagData(arguments);
      assert.deepEqual(actualData, expectedData, "it should return the correct object")
    })
    it("should throw an error if an invalid include only tag is passed", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-o', 
        'name,default,sensitive'
      ]
      let task = () => {
        getFlagData(arguments, "output")
      }
      assert.throws(task, `Keys for output can be only ["name","description","sensitive","depends_on","value"]. Got ["name","default","sensitive"] `, "It should throw the correct error")
    })
    it("should return an object if an add columns flag has a correctly formatted comma separated list", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-a', 
        'required,test'
      ]
      let expectedData = {
        add_columns: ["required", "test"]
      }
      let actualData = getFlagData(arguments, "variable");
      assert.deepEqual(actualData, expectedData, "it should return the correct object")
    })
    it("should throw an error if `-m` and `-s` are passed with any other flags", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-a', 
        'required,test',
        '-m', 
        'test',
        '-s', 
        'test'
      ]
      let task = () => {
        getFlagData(arguments, "variable")
      }
      assert.throws(task, `Expected only ["-m","-s"] passed, got ["-a","-m","-s"]`)
    })
    it("should throw an error if `-m` is passed without `-s`", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-m', 
        'test'
      ]
      let task = () => {
        getFlagData(arguments, "variable")
      }
      assert.throws(task, `Expected -m flag to be passed with one of ["-s","--source"]`)
    })
    it("should throw an error if `-m` and `-s` are passed with an output file", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-m', 
        'test',
        '-s', 
        'test'
      ]
      let task = () => {
        getFlagData(arguments, "output")
      }
      assert.throws(task, `["-m","-s"] can only be used with variable files. Got output.`)
    })
    it("should throw an error if -m is not a string of letters, numbers, dashes, and underscores", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-m', 
        'dsf,,,>>>Wuhusdf\\dfjdksjdf',
        '-s', 
        'test'
      ]
      let task = () => {
        getFlagData(arguments, "variable")
      }
      assert.throws(task, `Module names must match the regular expression /^([A-z]|[0-9]|-|_)+$/`)
    })
    it("should throw an error if -s is not a valid source path", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-m', 
        'test',
        '-s', 
        '9898sfdgjskdfj3u9284091[02312k1lw2kesasz,,ccxz./z09211'
      ]
      let task = () => {
        getFlagData(arguments, "variable")
      }
      assert.throws(task, `Source must be a valid source path. Got 9898sfdgjskdfj3u9284091[02312k1lw2kesasz,,ccxz./z09211`)
    })
    it("should return the correct object if -m and -s are valid", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-m', 
        'test',
        '-s', 
        'test'
      ]
      let expectedData = {
        module: "test",
        source: "test"
      }
      let actualData = getFlagData(arguments, "variable")
      assert.deepEqual(actualData, expectedData, "should get the correct data object")
    })
    it("should throw an error if -i is passed without -t", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-i'
      ]
      let task = () => {
        getFlagData(arguments, "variable")
      }
      assert.throws(task, `Expected -i flag to be passed with one of ["-t","--tfvars"]`)
    })
    it("should create the correct return object if -t is passed alone", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-t'
      ]
      let expectedData = {
        tfvars: true
      }
      let actualData = getFlagData(arguments, "variable")
      assert.deepEqual(actualData, expectedData, "it should return the correct object")
    })
    it("should create the correct return object if -t is passed with -i", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-t',
        "-i"
      ]
      let expectedData = {
        tfvars: true,
        ignore_defaults: true
      }
      let actualData = getFlagData(arguments, "variable")
      assert.deepEqual(actualData, expectedData, "it should return the correct object")
    })
    it("should create the correct return object if -i is passed with -t", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-i',
        '-t'
      ]
      let expectedData = {
        tfvars: true,
        ignore_defaults: true
      }
      let actualData = getFlagData(arguments, "variable")
      assert.deepEqual(actualData, expectedData, "it should return the correct object")
    })
    it("should throw an error if -t is passed with a flag that is not -i", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-t',
        '-b'
      ]
      let task = () => {
        getFlagData(arguments, "variable")
      }
      assert.throws(task, `Expected only ["-t"] passed, got ["-t","-b"]`)
    })
    it("should throw an error if -t is passed with a non variable file", () => {
      let arguments = [
        'nodepath',
        './test',
        'variables.tf',
        '-t'
      ]
      let task = () => {
        getFlagData(arguments, "output")
      }
      assert.throws(task, `["-t"] can only be used with variable files. Got output.`)
    })
  })
  describe("readFile", () => {
    let readFile = cli.readFile;
    it("should get the file data", () => {
      let expectedFile = fs.readFileSync(
        "./unit-tests/test-files/variables.tf",
        "utf8"
      );
      let actualFile = readFile("./unit-tests/test-files/variables.tf");
      assert.deepEqual(
        actualFile,
        expectedFile,
        "It should return the same data as the file"
      );
    });
    it("should throw an error if the file passed is not a `.tf` file", () => {
      let task = () => {
        readFile("./unit-tests/test-files/variables.md");
      };
      assert.throws(
        task,
        "File specified must be .tf",
        "it should throw an error"
      );
    });
  });
  describe("checkFile", () => {
    let checkFile = cli.checkFile;
    it("should throw an error if blocks other than `variable` or `output` or block comments are present", () => {
      let badFileData = `resource ibm_is_subnet gateway_management_subnet {
name            = "\${var.unique_id}-gateway-management-subnet"
vpc             = var.vpc_id
resource_group  = var.resource_group_id
zone            = "\${var.ibm_region}-\${var.zone}"
ipv4_cidr_block = ibm_is_vpc_address_prefix.subnet_prefix[0].cidr
network_acl     = var.acl_id
public_gateway  = ibm_is_public_gateway.public_gateway.id
            }`;
      let task = () => {
        checkFile(badFileData);
      };
      assert.throws(
        task,
        "Files may only contain either `output` or `variable` blocks",
        "It should throw an error"
      );
    });
    it("should throw an error if neither `variable` or `output` blocks are found", () => {
      let badFileData = "########";
      let task = () => {
        checkFile(badFileData);
      };
      assert.throws(
        task,
        "Files may only contain either `output` or `variable` blocks, found neither",
        "It should throw an error"
      );
    });
    it("should throw an error if both `output` and `variable` blocks are found", () => {
      let badFileData = `
output bucket_name {
    description = "Name of the bucket created"
    value       = module.bucket.buckets[var.bucket_info.bucket_name].bucket_name
}
variable ibmcloud_api_key {
    description = "The IBM Cloud platform API key needed to deploy IAM enabled resources"
    type        = string
}`;
      let task = () => {
        checkFile(badFileData);
      };
      assert.throws(
        task,
        "Files may only contain either `output` or `variable` blocks, found both",
        "It should throw an error"
      );
    });
    it("should return `output` if the file is an output file", () => {
      let fieldData = `
output bucket_name {
    description = "Name of the bucket created"
    value       = module.bucket.buckets[var.bucket_info.bucket_name].bucket_name
}`;
      let returnedData = checkFile(fieldData);
      assert.deepEqual(returnedData, "output", "It should return output");
    });
    it("should return `variable` if the file is a variable file", () => {
      let fieldData = `variable ibmcloud_api_key {
    description = "The IBM Cloud platform API key needed to deploy IAM enabled resources"
    type        = string
}`;
      let returnedData = checkFile(fieldData);
      assert.deepEqual(returnedData, "variable", "It should return variable");
    });
    it("should return an error if bad or incomplete file data is found", () => {
      let badFileData = `
errorvariable eror {{ v
ar}variable {
test "test"
`;
      let task = () => {
        checkFile(badFileData);
      };
      assert.throws(
        task,
        "Files may only contain either `output` or `variable` blocks",
        "It should throw an error"
      );
    });
  });
  describe("printTable", () => {
    let printTable = cli.printTable;
    it("should print the correct default table for a variable file", () => {
      let expectedTable = fs.readFileSync(
        "./unit-tests/test-files/variables.md",
        "utf8"
      );
      let fileData = fs.readFileSync(
        "./unit-tests/test-files/variables.tf",
        "utf8"
      );
      let actualTable = printTable("variable", fileData);
      assert.deepEqual(
        actualTable,
        expectedTable,
        "it should print out the correct default table"
      );
    });
    it("should print the correct default table for a variable file with default line breaks added", () => {
      let expectedTable = fs.readFileSync(
        "./unit-tests/test-files/variables-with-br.md",
        "utf8"
      );
      let fileData = fs.readFileSync(
        "./unit-tests/test-files/variables.tf",
        "utf8"
      );
      let actualTable = printTable("variable", fileData, false, true);
      assert.deepEqual(
        actualTable,
        expectedTable,
        "it should print out the correct default table"
      );
    });
    it("should print the correct default table for an output file", () => {
      let expectedTable = fs.readFileSync(
        "./unit-tests/test-files/outputs.md",
        "utf8"
      );
      let fileData = fs.readFileSync(
        "./unit-tests/test-files/outputs.tf",
        "utf8"
      );
      let actualTable = printTable("output", fileData);
      assert.deepEqual(
        actualTable,
        expectedTable,
        "it should print out the correct default table"
      );
    });
    it("should print a table with only selected values included", () => {
      let expectedTable = `Name                   | Sensitive
---------------------- | ---------
cloudfunction_endpoint | 
bucket_name            | 
cos_id                 | 
bucket_api_endpoint    | 
cos_apikey             | true`;
      let fileData = fs.readFileSync(
        "./unit-tests/test-files/outputs.tf",
        "utf8"
      );
      let actualTable = printTable("output", fileData, ["name", "sensitive"]);
      assert.deepEqual(
        actualTable,
        expectedTable,
        "it should print out the correct default table"
      );
    });
  });
  describe("help", () => {
    it("should return a table that shows how to use the CLI", () => {
      let helpText = `
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
  
`
      assert.deepEqual(helpText, cli.help(), "It should return the help text.")
    })
  })
  describe("main", () => {
    let main = cli.main;
    let helpText = `
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
  
`
    it("should run help if -h is passed", () => {
      let args = [
        "nodepath",
        "cmd",
        "-h"
      ]
      let actualData = main(args);
      assert.deepEqual(actualData, helpText, "it should return the help text");
    })
    it("should run help if --help is passed", () => {
      let args = [
        "nodepath",
        "cmd",
        "--help"
      ]
      let actualData = main(args);
      assert.deepEqual(actualData, helpText, "it should return the help text");
    })
    it("should return an error message if fewer than three args are passed", () => {
      let args = [
        "one",
        "two"
      ]
      let message = main(args)
      let expectedData = "\ntfmdcli Error: \u001b[31mNo file specified\u001b[39m\n\nFor more information on usage run " + chalk.cyan("tfmdcli --help \n")
      assert.deepEqual(message, expectedData, "it should throw the correct error")
    })
    it("should return the variable table with no flags", () => {
      let args = [
        "nodepath",
        "cmd",
        "./unit-tests/test-files/variables.tf"
      ]
      let actualData = main(args)
      let expectedData = fs.readFileSync("./unit-tests/test-files/variables.md", "utf8")
      assert.deepEqual(actualData, expectedData, "It should print the correct markdown file")
    })
    it("should return the variable table with breaks flag", () => {
      let args = [
        "nodepath",
        "cmd",
        "./unit-tests/test-files/variables.tf",
        "-b"
      ]
      let actualData = main(args)
      let expectedData = fs.readFileSync("./unit-tests/test-files/variables-with-br.md", "utf8")
      assert.deepEqual(actualData, expectedData, "It should print the correct markdown file")
    })
    it("should return the variable table with breaks flag and include only flag", () => {
      let args = [
        "nodepath",
        "cmd",
        "./unit-tests/test-files/variables.tf",
        "-b",
        "-o", 
        "name,default"
      ]
      let actualData = main(args)
      let expectedData = fs.readFileSync("./unit-tests/test-files/variables-br-o.md", "utf8")
      assert.deepEqual(actualData, expectedData, "It should print the correct markdown file")
    })
    it("should return the variable table with breaks flag and include only flag and add columns flag", () => {
      let args = [
        "nodepath",
        "cmd",
        "./unit-tests/test-files/variables.tf",
        "-b",
        "-o", 
        "name,default",
        "-a", 
        "required"
      ]
      let actualData = main(args)
      let expectedData = fs.readFileSync("./unit-tests/test-files/variables-br-o-required.md", "utf8")
      assert.deepEqual(actualData, expectedData, "It should print the correct markdown file")
    })
    it("should return the example module when the module and source flags are passed", () => {
      let args = [
        "nodepath",
        "cmd",
        "./unit-tests/test-files/variables.tf",
        "--source", 
        "test",
        "--module", 
        "test"
      ]
      let actualData = main(args)
      let expectedData = `\`\`\`terraform
module test {
  source                     = "test"
  TF_VERSION                 = var.TF_VERSION
  ibmcloud_api_key           = var.ibmcloud_api_key
  ibm_region                 = var.ibm_region
  created_resource_group     = var.created_resource_group
  default_resource_group     = var.default_resource_group
  function_namespace         = var.function_namespace
  cms_plan                   = var.cms_plan
  project_short_name         = var.project_short_name
  top_domain                 = var.top_domain
  log_name                   = var.log_name
  log_plan                   = var.log_plan
  monitor_name               = var.monitor_name
  monitor_plan               = var.monitor_plan
  cos_name                   = var.cos_name
  bucket_info                = var.bucket_info
  vpc_name                   = var.vpc_name
  subnets_cidr               = var.subnets_cidr
  provision_activity_tracker = var.provision_activity_tracker
  activity_tracker_name      = var.activity_tracker_name
  activity_tracker_endpoint  = var.activity_tracker_endpoint
  activity_tracker_plan      = var.activity_tracker_plan
  backend_function_namespace = var.backend_function_namespace
  backend_cos_name           = var.backend_cos_name
  backend_bucket_info        = var.backend_bucket_info
  environment                = var.environment
  roles_group                = var.roles_group
  invite_users               = var.invite_users
  account                    = var.account
  cis_name                   = var.cis_name
  subdomains                 = var.subdomains
  ssl                        = var.ssl
  min_tls_version            = var.min_tls_version
  automatic_https_rewrites   = var.automatic_https_rewrites
}
\`\`\``
      assert.deepEqual(actualData, expectedData, "It should print the correct markdown file")
    })
    it("should return the tfvars file when the tfvars flag is passed", () => {
      let args = [
        "nodepath",
        "cmd",
        "./unit-tests/test-files/variables-extract-types.tf",
        "-t"
      ]
      let actualData = main(args);
      let expectedData = `create_load_balancer=true

name=null

subnet_ids=[]

type="public"

security_group_ids=null

logging=null

resource_group_id=null

tags=null

lb_pools=[]

lb_listeners=[]`
      assert.deepEqual(actualData, expectedData, "It should return the correct tfvars file")
    })
    it("should return the tfvars file when the tfvars and ignore defaults flags are passed", () => {
      let args = [
        "nodepath",
        "cmd",
        "./unit-tests/test-files/variables-extract-types.tf",
        "-t",
        "-i"
      ]
      let actualData = main(args);
      let expectedData = fs.readFileSync(
        "./unit-tests/test-files/extract-types.tfvars",
        "utf-8"
      );
      assert.deepEqual(actualData, expectedData, "It should return the correct tfvars file")
    })
  })
});
