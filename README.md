## tfmdcli

Terraform Markdown CLI is a tool to convert your terraform variables or outputs into a markdown table, or to create markdown formatted example `module` blocks.

## Usage

```
tfmdcli <file_path> <flags>
```

## Flags

Flag                   | Description                                                                      | Example
-----------------------|----------------------------------------------------------------------------------|--------
-o \| --output-only    | Output only the given fields in the table. A comma separated list must be passed | `tfmdcli <file_path> -o name,default`
-b \| --breaks         | Add line breaks to the 'default' field of a variable file                        | `tfmdcli <file_path> -b`
-a \| --add-columns    | Add additional empty columns to the table. A comma separated list must be passed.| `tfmdcli <file_path> -a name,default`
-m \| --module         | The module name to use when creating an example module from a variables file. A string is required. This must be used with the --source tag. This cannot be used with any tags other than -s. | `tfmdcli <file_path> -m example -s ./module/example`
-s \| --source         | The file path to use when creating an example module from a variables file. A string is required. This must be used with the --module tag.This cannot be used with any tags other than -m. | `tfmdcli <file_path> -m example -s ./module/example`
-t \| --tfvars         | Create a tfvars from a variables file. This cannot be used with any tags other than -i | `tfmdcli <file_path> -t`
-i \| --ignore-defaults| Ignore defaults when creating a tfvars file. This will create an empty tfvar variable for each of variables in the file. Can only be used with -t | `tfmdcli <file_path> -t -i`
  

## Examples

### Example Variable Table

This is an example table from [an example variable file](./example.tf) using `tfmdcli example.tf -b`

Name                            | Type                                                                          | Description                                                                                | Sensitive | Default
------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------
api_key                         | string                                                                        | The API key needed to deploy resources                                                     | true      | 
security_group_rules            |                                                                               | Map of security group rules to be added to default security group                          |           | {<br>allow_all_inbound = {<br>source = "0.0.0.0/0"<br>direction = "inbound"<br>}<br>}
disable_public_service_endpoint | bool                                                                          | Disable public service endpoint for cluster                                                |           | false
spoke_vpc_cidr_blocks           | object({ zone-1 = list(string) zone-2 = list(string) zone-3 = list(string) }) | An object containing lists of CIDR blocks. Each CIDR block will be used to create a subnet |           | {<br>zone-1 = [<br>"10.10.10.0/24"<br>],<br>zone-2 = [<br>"10.40.10.0/24"<br>],<br>zone-3 = [<br>"10.70.10.0/24"<br>]<br>}
tags                            | list(string)                                                                  | A list of tags to add to the cluster                                                       |           | ["tag-1",<br>"tag-2"]

### Example Module

This is an example table from [an example variable file](./example.tf) using `tfmdcli example.tf -m=example -s=example/`

```terraform
module example {
  source                          = "example/"
  api_key                         = var.api_key
  security_group_rules            = var.security_group_rules
  disable_public_service_endpoint = var.disable_public_service_endpoint
  spoke_vpc_cidr_blocks           = var.spoke_vpc_cidr_blocks
  tags                            = var.tags
}
```

### Example Tfvars

This is an example table from [an example variable file](./example.tf) using `tfmdcli example.tf -t -i`

```
api_key=""
security_group_rules=""
disable_public_service_endpoint=true
spoke_vpc_cidr_blocks={
    zone-1=[""]
    zone-2=[""]
    zone-3=[""]
}
tags=[]
```
>>>>>>> 278029ff5f607e47a1ece9c74d7022a17187a62e
