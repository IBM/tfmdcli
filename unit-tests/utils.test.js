const { assert, util } = require("chai");
const utils = require("../lib/utils");
const fs = require("fs");
const { isRegExp, isSymbol } = require("util");
const { makeExampleTfvar, parseFileData } = require("../lib/utils");

describe("utils", () => {
  describe("getLongest", () => {
    const testData = [
      {
        test: "test",
        testEntry: "testEntry",
        longTestEntry: "longTestEntry",
      },
      {
        test: "1",
        testEntry: "2",
        longTestEntry: "3",
      },
      {
        test: "aVeryLongTestEntry",
        noValueLengthTest: "",
      },
    ];
    it("Should correctly return the longest value for a single entry", () => {
      let longest = utils.getLongest(testData, "test");
      assert.deepEqual(
        longest,
        18,
        "It should correctly count the number of chatacters"
      );
    });
    it("Should return the length of the key if the longest entry is shorter than the key name length", () => {
      let longest = utils.getLongest(testData, "noValueLengthTest");
      assert.deepEqual(longest, 17, "It should be equal to the length `17`");
    });
  });
  describe("getAllLongest", () => {
    const testData = [
      {
        test: "test",
        testEntry: "testEntry",
        longTestEntry: "longTestEntry",
      },
      {
        test: "1",
        testEntry: "2",
        longTestEntry: "3",
      },
      {
        test: "aVeryLongTestEntry",
        noValueLengthTest: "",
      },
    ];
    it("should return an object containing the longest values for each key", () => {
      let allLongest = utils.getAllLongest(testData);
      let expectedLongest = {
        longTestEntry: 13,
        noValueLengthTest: 17,
        test: 18,
        testEntry: 9,
      };
      assert.deepEqual(
        allLongest,
        expectedLongest,
        "It should return the correct object"
      );
    });
    it("should not return any values where the length of the key is greater than the length of the value", () => {
      let allLongest = utils.getAllLongest(testData);
      let longer = [];
      Object.keys(allLongest).forEach((key) => {
        if (key.length > allLongest[key].length) longer.push(key);
      });
      assert.deepEqual(
        longer,
        [],
        "The number of keys with lengths greater than their values should be 0"
      );
    });
    it("should return the length of the fields for any fields not found in `order` if order array is passed", () => {
      let allLongest = utils.getAllLongest(testData, ["order_field"]);
      let expectedLongest = {
        longTestEntry: 13,
        noValueLengthTest: 17,
        test: 18,
        testEntry: 9,
        order_field: 11,
      };
      assert.deepEqual(
        allLongest,
        expectedLongest,
        "It should add the additional fields"
      );
    });
  });
  describe("matchLength", () => {
    it("should add spaces to the length of a string until it is the same as the number passed", () => {
      let matchedString = utils.matchLength("test", 17);
      assert.deepEqual(
        matchedString.length,
        17,
        "It should contain 17 characters"
      );
    });
    it("should remove chatacters until the string is the same length as the number passed if the number is smaller", () => {
      let matchedString = utils.matchLength("test", 1);
      assert.deepEqual(matchedString, "t", "It should return one characer");
    });
    it("should return dashes if `useDashes` is true", () => {
      let matchedString = utils.matchLength("", 5, true);
      assert.deepEqual(matchedString, "-----", "It should return 5 dashes");
    });
    it("should return a matching number of spaces if the string is null", () => {
      let matchedString = utils.matchLength(null, 1);
      assert.deepEqual(matchedString, " ", "It should return one characer");
    });
  });
  describe("pullSubStrData", () => {
    const testFields = ["description", "default", "type"];
    it("should return the correct data when given an object", () => {
      let testData = ` ibm_region { description = "IBM Cloud region where all resources will be deployed" type = string default = "eu-de" validation { error_message = "Must use an IBM Cloud region. Use \`ibmcloud regions\` with the IBM Cloud CLI to see valid regions." condition = can( contains([ "au-syd", "jp-tok", "eu-de", "eu-gb", "us-south", "us-east" ], var.ibm_region) ) } }`;
      let expectedData = {
        name: "ibm_region",
        description: `IBM Cloud region where all resources will be deployed`,
        type: "string",
        default: "eu-de",
      };
      let actualData = utils.pullSubStrData(testFields, testData);
      assert.deepEqual(actualData, expectedData, "JSON objects should match");
    });
    it("should remove quotes from variable names", () => {
      let testData = ` "ibm_region" { description = "IBM Cloud region where all resources will be deployed" type = string default = "eu-de" validation { error_message = "Must use an IBM Cloud region. Use \`ibmcloud regions\` with the IBM Cloud CLI to see valid regions." condition = can( contains([ "au-syd", "jp-tok", "eu-de", "eu-gb", "us-south", "us-east" ], var.ibm_region) ) } }`;
      let expectedData = {
        name: 'ibm_region',
        description: `IBM Cloud region where all resources will be deployed`,
        type: "string",
        default: "eu-de",
      };
      let actualData = utils.pullSubStrData(testFields, testData);
      assert.deepEqual(actualData, expectedData, "JSON objects should match");
    })
    it("should return the correct data when given an object if the validation field is in the middle", () => {
      let testData = ` ibm_region { description = "IBM Cloud region where all resources will be deployed" validation { error_message = "Must use an IBM Cloud region. Use \`ibmcloud regions\` with the IBM Cloud CLI to see valid regions." condition = can( contains([ "au-syd", "jp-tok", "eu-de", "eu-gb", "us-south", "us-east" ], var.ibm_region) ) } type = string default = "eu-de" }`;
      let expectedData = {
        name: "ibm_region",
        description: `IBM Cloud region where all resources will be deployed`,
        type: "string",
        default: "eu-de",
      };
      let actualData = utils.pullSubStrData(testFields, testData);
      assert.deepEqual(actualData, expectedData, "JSON objects should match");
    });
    it("should return the correct data when only one field is passed", () => {
      let testData = ` ibm_region { description = "IBM Cloud region where all resources will be deployed" }`;
      let expectedData = {
        name: "ibm_region",
        description: `IBM Cloud region where all resources will be deployed`,
      };
      let actualData = utils.pullSubStrData(testFields, testData);
      assert.deepEqual(actualData, expectedData, "JSON objects should match");
    });
    it("should add line breaks to the default field if addDefaultBreaks is passed", () => {
      let testData = ` test { default = [ { test = "test" test_list = [ "test" ] test_map = { test = "test" } } ] }`;
      let actualData = utils.pullSubStrData(testFields, testData, true).default;
      let expectedString = `[<br>{<br>test = "test"<br>test_list = [<br>"test"<br>]<br>test_map = {<br>test = "test"<br>}<br>}`;
      assert.deepEqual(
        actualData,
        expectedString,
        "should return expected string"
      );
    });
    it("should correctly get the default of an empty array", () => {
      let testData = `  test_array { description = "a test array" type = list(string) default = [] }`;
      let expectedData = {
        name: "test_array",
        description: "a test array",
        type: "list(string)",
        default: "[]",
      };
      let actualData = utils.pullSubStrData(testFields, testData);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct object"
      );
    });
    it("should correctly get the default of an empty array from a complex variable", () => {
      let testData = `  lb_listeners { description = "List of Load Balancer Listeners" type = list(object({ port = number protocol = string default_pool = string certificate_instance = string connection_limit = number accept_proxy_protocol = bool lb_listener_policies = list(object({ name = string action = string priority = number target_id = string target_http_status_code = number target_url = string rules = object({ condition = string type = string field = string value = string }) lb_listener_policy_rules = list(object({ name = string condition = string type = string field = string value = string })) })) })) default = [] }
      `;
      let expectedData = {
        default: "[]",
        description: "List of Load Balancer Listeners",
        name: "lb_listeners",
        type: "list(object({ port = number protocol = string default_pool = string certificate_instance = string connection_limit = number accept_proxy_protocol = bool lb_listener_policies = list(object({ name = string action = string priority = number target_id = string target_http_status_code = number target_url = string rules = object({ condition = string type = string field = string value = string }) lb_listener_policy_rules = list(object({ name = string condition = string type = string field = string value = string })) })) }))",
      };
      let actualData = utils.pullSubStrData(testFields, testData, false);
      assert.deepEqual(
        actualData,
        expectedData,
        "It should return the correct object"
      );
    });
  });
  describe("removeTrailingSpaces", () => {
    it("should remove spaces from the end of a string", () => {
      let testString = "test    ";
      let expectedString = "test";
      let actualString = utils.removeTrailingSpaces(testString);
      assert.deepEqual(
        actualString,
        expectedString,
        "It should return the string with no spaces at the end"
      );
    });
    it("should not remove chatacters if spaces are absent", () => {
      let testString = "test";
      let expectedString = "test";
      let actualString = utils.removeTrailingSpaces(testString);
      assert.deepEqual(
        actualString,
        expectedString,
        "It should return the string with no spaces at the end"
      );
    });
  });
  describe("makeLine", () => {
    let testData = [
      {
        test: "test",
        name: "test name",
        value: "value",
      },
    ];
    let longest = utils.getAllLongest(testData);
    let makeLine = utils.makeLine;
    it("should make a correctly formatted line", () => {
      let expectedString = "test name | test | value";
      let actualString = makeLine(
        ["name", "test", "value"],
        longest,
        testData[0]
      );
      assert.deepEqual(
        actualString,
        expectedString,
        "It should create a properly formatted line"
      );
    });
    it("should make a correctly formatted line with dashes", () => {
      let expectedString = "--------- | ---- | -----";
      let actualString = makeLine(
        ["name", "test", "value"],
        longest,
        testData[0],
        true
      );
      assert.deepEqual(
        actualString,
        expectedString,
        "It should create a properly formatted line"
      );
    });
  });
  describe("buildEntries", () => {
    let buildEntries = utils.buildEntries;
    it("should return the correctly formatted entries", () => {
      let testData = [
        ' cloudfunction_endpoint { description = "Function endpoint URL" value = ibm_function_action.backend.target_endpoint_url }',
        ' bucket_name { description = "Name of the bucket created" value = module.bucket.buckets[var.bucket_info.bucket_name].bucket_name }',
        ' cos_id { description = "ID of COS instance where bucket is created" value = module.bucket.cos_id }',
        ' bucket_api_endpoint { description = "API endpoint for COS bucket" value = module.bucket.buckets[var.bucket_info.bucket_name].s3_endpoint_private }',
        ' cos_apikey { description = "API key for COS instance where bucket is created" value = module.bucket.api_key sensitive = true }',
      ];
      let expectedData = [
        {
          description: "Function endpoint URL",
          name: "cloudfunction_endpoint",
          value: "ibm_function_action.backend.target_endpoint_url",
        },
        {
          description: "Name of the bucket created",
          name: "bucket_name",
          value:
            "module.bucket.buckets[var.bucket_info.bucket_name].bucket_name",
        },
        {
          description: "ID of COS instance where bucket is created",
          name: "cos_id",
          value: "module.bucket.cos_id",
        },
        {
          description: "API endpoint for COS bucket",
          name: "bucket_api_endpoint",
          value:
            "module.bucket.buckets[var.bucket_info.bucket_name].s3_endpoint_private",
        },
        {
          description: "API key for COS instance where bucket is created",
          name: "cos_apikey",
          value: "module.bucket.api_key",
          sensitive: "true",
        },
      ];
      let actualData = buildEntries(testData, [
        "description",
        "value",
        "sensitive",
      ]);
      assert.deepEqual(expectedData, actualData);
    });
    it("should return the correctly formatted entries and ignore lines that only contain spaces", () => {
      let testData = [
        " ",
        ' cloudfunction_endpoint { description = "Function endpoint URL" value = ibm_function_action.backend.target_endpoint_url }',
        ' bucket_name { description = "Name of the bucket created" value = module.bucket.buckets[var.bucket_info.bucket_name].bucket_name }',
        ' cos_id { description = "ID of COS instance where bucket is created" value = module.bucket.cos_id }',
        "      ",
        ' bucket_api_endpoint { description = "API endpoint for COS bucket" value = module.bucket.buckets[var.bucket_info.bucket_name].s3_endpoint_private }',
        ' cos_apikey { description = "API key for COS instance where bucket is created" value = module.bucket.api_key sensitive = true }',
      ];
      let expectedData = [
        {
          description: "Function endpoint URL",
          name: "cloudfunction_endpoint",
          value: "ibm_function_action.backend.target_endpoint_url",
        },
        {
          description: "Name of the bucket created",
          name: "bucket_name",
          value:
            "module.bucket.buckets[var.bucket_info.bucket_name].bucket_name",
        },
        {
          description: "ID of COS instance where bucket is created",
          name: "cos_id",
          value: "module.bucket.cos_id",
        },
        {
          description: "API endpoint for COS bucket",
          name: "bucket_api_endpoint",
          value:
            "module.bucket.buckets[var.bucket_info.bucket_name].s3_endpoint_private",
        },
        {
          description: "API key for COS instance where bucket is created",
          name: "cos_apikey",
          value: "module.bucket.api_key",
          sensitive: "true",
        },
      ];
      let actualData = buildEntries(testData, [
        "description",
        "value",
        "sensitive",
      ]);
      assert.deepEqual(expectedData, actualData);
    });
  });
  describe("buildTable", () => {
    let buildTable = utils.buildTable;
    it("should return a markdown formatted table", () => {
      let testData = [
        {
          description: "Function endpoint URL",
          name: "cloudfunction_endpoint",
          value: "ibm_function_action.backend.target_endpoint_url",
        },
        {
          description: "Name of the bucket created",
          name: "bucket_name",
          value:
            "module.bucket.buckets[var.bucket_info.bucket_name].bucket_name",
        },
        {
          description: "ID of COS instance where bucket is created",
          name: "cos_id",
          value: "module.bucket.cos_id",
        },
        {
          description: "API endpoint for COS bucket",
          name: "bucket_api_endpoint",
          value:
            "module.bucket.buckets[var.bucket_info.bucket_name].s3_endpoint_private",
        },
        {
          description: "API key for COS instance where bucket is created",
          name: "cos_apikey",
          value: "module.bucket.api_key",
          sensitive: "true",
        },
      ];
      let longest = utils.getAllLongest(testData);
      let expectedTable = `Name                   | Description                                      | Sensitive | Value
---------------------- | ------------------------------------------------ | --------- | ----------------------------------------------------------------------
cloudfunction_endpoint | Function endpoint URL                            |           | ibm_function_action.backend.target_endpoint_url
bucket_name            | Name of the bucket created                       |           | module.bucket.buckets[var.bucket_info.bucket_name].bucket_name
cos_id                 | ID of COS instance where bucket is created       |           | module.bucket.cos_id
bucket_api_endpoint    | API endpoint for COS bucket                      |           | module.bucket.buckets[var.bucket_info.bucket_name].s3_endpoint_private
cos_apikey             | API key for COS instance where bucket is created | true      | module.bucket.api_key`;
      let actualTable = buildTable(
        ["name", "description", "sensitive", "value"],
        longest,
        testData
      );
      assert.deepEqual(
        actualTable,
        expectedTable,
        "it should correctly show the table"
      );
    });
  });
  describe("parseFileData", () => {
    let parseFileData = utils.parseFileData;
    it("should return the correct data for a variable file", () => {
      let input = fs.readFileSync(
        "./unit-tests/test-files/variables.tf",
        "utf8"
      );
      let expectedOutput = JSON.parse(
        fs.readFileSync("./unit-tests/test-files/parsed-variables.json", "utf8")
      );
      let actualOutput = parseFileData("variable", input);
      assert.deepEqual(
        actualOutput,
        expectedOutput,
        "it should create properly formatted file data"
      );
    });
    it("should return the correct data for an outputs file", () => {
      let input = fs.readFileSync("./unit-tests/test-files/outputs.tf", "utf8");
      let expectedOutput = JSON.parse(
        fs.readFileSync("./unit-tests/test-files/parsed-outputs.json", "utf8")
      );
      let actualOutput = parseFileData("output", input);
      assert.deepEqual(
        actualOutput,
        expectedOutput,
        "it should create properly formatted file data"
      );
    });
    it("should remove any empty strings from the beginning of the data after parsing", () => {
      let input = "\nfrog";
      let actualOutput = parseFileData("output", input)[0];
      assert.notDeepEqual(
        actualOutput,
        "",
        "it should not lead with empty spaces"
      );
    });
    it("should return the correct data for an outputs file with multiline fields", () => {
      let input = fs.readFileSync(
        "./unit-tests/test-files/multiline-outputs.tf",
        "utf8"
      );
      let expectedOutput = JSON.parse(
        fs.readFileSync(
          "./unit-tests/test-files/parsed-multiline-outputs.json",
          "utf8"
        )
      );
      let actualOutput = parseFileData("output", input);
      assert.deepEqual(
        actualOutput,
        expectedOutput,
        "it should create properly formatted file data"
      );
    });
    it("should remove single line comments made with //", () => {
      let fileData = `

      variable test {
  // default = "frog"
}`;
      let expectedData = [`test { }`];
      let actualData = parseFileData("variable", fileData);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct string"
      );
    });
    it("should remove block comments made with /**/", () => {
      let fileData = `

      variable test {
  // default = "frog"
}
/*******
      variable commented_out {

      }**/`;
      let expectedData = [`test { } `];
      let actualData = parseFileData("variable", fileData);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct string"
      );
    });
  });
  describe("parseAndPrint", () => {
    let parseAndPrint = utils.parseAndPrint;
    it("should parse the information in a variables.tf file and output the correct markdown table", () => {
      let input = fs.readFileSync(
        "./unit-tests/test-files/variables.tf",
        "utf8"
      );
      let expectedOutput = fs.readFileSync(
        "./unit-tests/test-files/variables.md",
        "utf8"
      );
      let actualOutput = parseAndPrint(
        "variable",
        input,
        ["name", "type", "description", "sensitive", "default"],
        false,
        ["name", "type", "description", "sensitive", "default"]
      );
      assert.deepEqual(
        actualOutput,
        expectedOutput,
        "it should create properly formatted file data"
      );
    });
    it("should parse the information in an outputs.tf file and output the correct markdown table", () => {
      let input = fs.readFileSync("./unit-tests/test-files/outputs.tf", "utf8");
      let expectedOutput = fs.readFileSync(
        "./unit-tests/test-files/outputs.md",
        "utf8"
      );
      let actualOutput = parseAndPrint(
        "output",
        input,
        ["name", "description", "sensitive", "depends_on", "value"],
        false,
        ["name", "description", "sensitive", "depends_on", "value"]
      );
      assert.deepEqual(
        actualOutput,
        expectedOutput,
        "it should create properly formatted file data"
      );
    });
    it("should parse the information and return a table when only one value is present", () => {
      let input = `
variable ibmcloud_api_key {
  description = "The IBM Cloud platform API key needed to deploy IAM enabled resources"
}
`;
      let expectedOutput = `Name             | Type | Description                                                           | Sensitive | Default
---------------- | ---- | --------------------------------------------------------------------- | --------- | -------
ibmcloud_api_key |      | The IBM Cloud platform API key needed to deploy IAM enabled resources |           | `;
      let actualOutput = parseAndPrint(
        "variable",
        input,
        ["name", "type", "description", "sensitive", "default"],
        false,
        ["name", "type", "description", "sensitive", "default"]
      );
      assert.deepEqual(
        actualOutput,
        expectedOutput,
        "It should return the correct table"
      );
    });
    it("should parse the information in an outputs.tf file with multiple like breaks and output the correct markdown table", () => {
      let input = fs.readFileSync(
        "./unit-tests/test-files/multiline-outputs.tf",
        "utf8"
      );
      let expectedOutput = fs.readFileSync(
        "./unit-tests/test-files/parsed-multiline-outputs.md",
        "utf8"
      );
      let actualOutput = parseAndPrint(
        "output",
        input,
        ["name", "description", "sensitive", "depends_on", "value"],
        true,
        ["name", "description", "sensitive", "depends_on", "value"]
      );
      assert.deepEqual(
        actualOutput,
        expectedOutput,
        "it should create properly formatted file data"
      );
    });
  });
  describe("parseAndPrintExample", () => {
    it("should correctly print out an example", () => {
      let input = fs.readFileSync(
        "./unit-tests/test-files/variables.tf",
        "utf8"
      );
      let expectedOutput = `\`\`\`terraform
module test {
  source                     = "./test"
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
\`\`\``;
      let actualOutput = utils.parseAndPrintExample(input, "test", "./test");
      assert.deepEqual(
        actualOutput,
        expectedOutput,
        "It should print out the correct example"
      );
    });
  });
  describe("addDefaultLineBreaks", () => {
    let addDefaultLineBreaks = utils.addDefaultLineBreaks;
    it("should break up a list", () => {
      let list = `[ "one", "two", "three" ]`;
      let expectedString = `[<br>"one",<br>"two",<br>"three"<br>]`;
      let actualString = addDefaultLineBreaks(list);
      assert.deepEqual(actualString, expectedString, "strings should match");
    });
    it("should break up a map", () => {
      let map = `{ one = true two = "two" three = 3 }`;
      let expectedString = `{<br>one = true<br>two = "two"<br>three = 3<br>}`;
      let actualString = addDefaultLineBreaks(map);
      assert.deepEqual(actualString, expectedString, "strings should match");
    });
    it("should break up a list of maps", () => {
      let listOfMaps = `[ { one = true two = "two" three = 3 }, { one = true two = "two" three = 3 }, { one = true two = "two" three = 3 } ]`;
      let expectedString = `[<br>{<br>one = true<br>two = "two"<br>three = 3<br>},<br>{<br>one = true<br>two = "two"<br>three = 3<br>},<br>{<br>one = true<br>two = "two"<br>three = 3<br>}<br>]`;
      let actualString = addDefaultLineBreaks(listOfMaps);
      assert.deepEqual(actualString, expectedString, "strings should match");
    });
    it("should break up a map of lists", () => {
      let mapOfLists = `{ one = [ "one", "two", "three" ] two = [ "one", "two", "three" ] three = [ "one", "two", "three" ] }`;
      let expectedString = `{<br>one = [<br>"one",<br>"two",<br>"three"<br>]<br>two = [<br>"one",<br>"two",<br>"three"<br>]<br>three = [<br>"one",<br>"two",<br>"three"<br>]<br>}`;
      let actualString = addDefaultLineBreaks(mapOfLists);
      assert.deepEqual(
        actualString,
        expectedString,
        "it should return the correct string"
      );
    });
    it("should break up a map of maps", () => {
      let mapOfMaps = `{ one = { one = true two = "two" three = 3 } two = { one = true two = "two" three = 3 } three = { one = true two = "two" three = 3 } }`;
      let expectedString = `{<br>one = {<br>one = true<br>two = "two"<br>three = 3<br>}<br>two = {<br>one = true<br>two = "two"<br>three = 3<br>}<br>three = {<br>one = true<br>two = "two"<br>three = 3<br>}<br>}`;
      let actualString = addDefaultLineBreaks(mapOfMaps);
      assert.deepEqual(actualString, expectedString, "strings should match");
    });
    it("should break up a list of lists", () => {
      let listOfLists = `[ [ "one", "two", "three" ], [ "one", "two", "three" ], [ "one", "two", "three" ] ]`;
      let expectedString = `[<br>[<br>"one",<br>"two",<br>"three"<br>],<br>[<br>"one",<br>"two",<br>"three"<br>],<br>[<br>"one",<br>"two",<br>"three"<br>]<br>]`;
      let actualString = addDefaultLineBreaks(listOfLists);
      assert.deepEqual(actualString, expectedString, "strings should match");
    });
  });
  describe("formatSimpleTfvar", () => {
    let formatSimpleTfvar = utils.formatSimpleTfvar;
    it("should return the correct example for a string type variable and no default", () => {
      let entry = {
        name: "test",
        type: "string",
      };
      let expectedData = 'test=""';
      let actualData = formatSimpleTfvar(entry.name, entry.type);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return the correct example for a string type variable with a default", () => {
      let entry = {
        name: "test",
        type: "string",
        default: "test",
      };
      let expectedData = 'test="test"';
      let actualData = formatSimpleTfvar(entry.name, entry.type, entry.default);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return the correct example for a string type variable where null is passed as a default for a string", () => {
      let entry = {
        name: "test",
        type: "string",
        default: "null",
      };
      let expectedData = "test=null";
      let actualData = formatSimpleTfvar(entry.name, entry.type, entry.default);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return the correct example for a number or boolean type variable where null is passed as a default for a string", () => {
      let entry = {
        name: "test",
        type: "number",
        default: "null",
      };
      let expectedData = "test=null";
      let actualData = formatSimpleTfvar(entry.name, entry.type, entry.default);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return the correct example for a number type variable and no default", () => {
      let entry = {
        name: "test",
        type: "number",
      };
      let expectedData = "test=0";
      let actualData = formatSimpleTfvar(entry.name, entry.type);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return the correct example for a number type variable with a default", () => {
      let entry = {
        name: "test",
        type: "number",
        default: "12",
      };
      let expectedData = "test=12";
      let actualData = formatSimpleTfvar(entry.name, entry.type, entry.default);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return the correct example for a bool type variable and no default", () => {
      let entry = {
        name: "test",
        type: "bool",
      };
      let expectedData = "test=true";
      let actualData = formatSimpleTfvar(entry.name, entry.type);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return the correct example for a bool type variable with a default", () => {
      let entry = {
        name: "test",
        type: "bool",
        default: "false",
      };
      let expectedData = "test=false";
      let actualData = formatSimpleTfvar(entry.name, entry.type, entry.default);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should throw an error if the type passed is not `string`, `number`, or `bool`", () => {
      let varName = "test";
      let varType = "list(string)";
      let task = () => {
        formatSimpleTfvar(varName, varType);
      };
      assert.throws(
        task,
        "Type for formatSimpleTfvar must be `string`, `number`, or `bool`. Got: list(string)",
        "it should throw the correct error"
      );
    });
  });
  describe("formatObjectTfvar", () => {
    let formatObjectTfvar = utils.formatObjectTfvar;
    it("should return the correct object when a list is passed", () => {
      let data = `test = string test = number test = bool`;
      let expectedData = `test=""\ntest=0\ntest=true`;
      let actualData = formatObjectTfvar(data);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return properly formatted data"
      );
    });
    it("should return the correct object when a list is passed with spaces", () => {
      let data = `test = string test = number test = bool`;
      let expectedData = `  test=""\n  test=0\n  test=true`;
      let actualData = formatObjectTfvar(data, "  ");
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return properly formatted data"
      );
    });
    it("should remove the optional argument when printing a variable marked with optional()", () => {
      let data = `test = optional(string)`
      let expectedData = `test=""`
      let actualData = formatObjectTfvar(data)
      assert.deepEqual(expectedData, actualData, "it should return correctly formatted")
    })
  });
  describe("getSpaces", () => {
    let getSpaces = utils.getSpaces;
    it("should return no spaces if 0 is passed as count", () => {
      let expectedOutput = "";
      let actualOutput = getSpaces(0);
      assert.deepEqual(
        actualOutput,
        expectedOutput,
        "it should return no spaces"
      );
    });
    it("should return no spaces if a negative number is passed as count", () => {
      let expectedOutput = "";
      let actualOutput = getSpaces(-10);
      assert.deepEqual(
        actualOutput,
        expectedOutput,
        "it should return no spaces"
      );
    });
    it("should return spaces if a positive number is passed as count", () => {
      let expectedOutput = "          ";
      let actualOutput = getSpaces(10);
      assert.deepEqual(
        actualOutput,
        expectedOutput,
        "it should return the correct number of spaces"
      );
    });
  });
  describe("makeExampleTfvar", () => {
    let makeExampleTfvar = utils.makeExampleTfvar;
    it("should use string if no type is provided in the entry", () => {
      let entry = {
        name: "test",
      };
      let expectedData = 'test=""';
      let actualData = makeExampleTfvar(entry);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return correct simple tfvar types", () => {
      let entry = {
        name: "test",
        type: "string",
      };
      let expectedData = 'test=""';
      let actualData = makeExampleTfvar(entry);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return the correct entry for a list of a simple type with no default", () => {
      let entry = {
        name: "test",
        type: "list(string)",
      };
      let expectedData = "test=[]";
      let actualData = makeExampleTfvar(entry);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return the correct entry for a list of a simple type with a default", () => {
      let entry = {
        name: "test",
        type: "list(string)",
        default: '["test"]',
      };
      let expectedData = 'test=["test"]';
      let actualData = makeExampleTfvar(entry);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return the correct entry for an object that contains only simple types with no default", () => {
      let entry = {
        name: "test",
        type: "object({ bucket_name = string force_delete = bool })",
      };
      let expectedData = `{
  bucket_name=""
  force_delete=true
}`;
      let actualData = makeExampleTfvar(entry);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return the correct entry for an object that contains only simple types with a default", () => {
      let entry = {
        name: "test",
        type: "object({ bucket_name = string force_delete = bool })",
        default: `{ bucket_name = "test" force_delete = true }`,
      };
      let expectedData = `test={ bucket_name = "test" force_delete = true }`;
      let actualData = makeExampleTfvar(entry);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct variable"
      );
    });
    it("should return the correct entry for a complex object of lists and objects", () => {
      let entry = {
        type: `list(object({ port = number protocol = string default_pool = string certificate_instance = string connection_limit = number accept_proxy_protocol = bool lb_listener_policies = list(object({ name = string action = string priority = number target_id = string target_http_status_code = number target_url = string rules = object({ condition = string type = string field = string value = string }) lb_listener_policy_rules = list(object({ name = string condition = string type = string field = string value = string })) test = bool })) frog = string test_list = list(string) number_list = list(number) }))`,
        name: "test",
      };
      let expectedData = `test=[
    {
        port=0
        protocol=""
        default_pool=""
        certificate_instance=""
        connection_limit=0
        accept_proxy_protocol=true
        lb_listener_policies = [
            {
                name=""
                action=""
                priority=0
                target_id=""
                target_http_status_code=0
                target_url=""
                rules = {
                    condition=""
                    type=""
                    field=""
                    value=""
                }
                lb_listener_policy_rules = [
                    {
                        name=""
                        condition=""
                        type=""
                        field=""
                        value=""
                    }
                ]
                test=true
            }
        ]
        frog=""
        test_list=[""]
        number_list=[0]
    }
]`;
      let actualData = makeExampleTfvar(entry);
      assert.deepEqual(
        expectedData,
        actualData,
        "it should return the correct data"
      );
    });
  });
  describe("parseAndPrintTfvars", () => {
    let parseAndPrintTfvars = utils.parseAndPrintTfvars;
    it("should return a tfvar file from a variables file with defaults", () => {
      let input = fs.readFileSync(
        "./unit-tests/test-files/variables-extract-types.tf",
        "utf8"
      );
      let expectedData = `create_load_balancer=true
name=null
subnet_ids=[]
type="public"
security_group_ids=null
logging=null
resource_group_id=null
tags=null
lb_pools=[]
lb_listeners=[]`;
      let actualData = parseAndPrintTfvars(input);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct tfvars"
      );
    });
    it("should return a tfvar file from a variables file with defaults overridden", () => {
      let input = fs.readFileSync(
        "./unit-tests/test-files/variables-extract-types.tf",
        "utf8"
      );
      let expectedData = fs.readFileSync(
        "./unit-tests/test-files/extract-types.tfvars",
        "utf-8"
      );
      let actualData = parseAndPrintTfvars(input, true);
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return the correct tfvars"
      );
    });
  });
});
