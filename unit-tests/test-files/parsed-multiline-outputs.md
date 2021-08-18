Name     | Description                                            | Sensitive | Depends On                  | Value
-------- | ------------------------------------------------------ | --------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------
count    | The number of subnets created                          |           |                             | length(local.subnet_output[*].id)
ids      | The ids of the created subnets                         |           |                             | local.subnet_output[*].id
names    | The ids of the created subnets                         |           |                             | local.subnet_output[*].name
subnets  | The subnets that were created                          |           |                             | [<br>for subnet in local.subnet_output:<br>{<br>id = subnet.id<br>zone = subnet.zone<br>label = var.label<br>}<br>]
acl_id   | The id of the network acl for the subnets              |           |                             | local.use_data<br>? data.ibm_is_subnet.vpc_subnet[0].network_acl<br>: ibm_is_network_acl.subnet_acl[0].id
vpc_name | The name of the VPC where the subnets were provisioned |           | [null_resource.print_names] | var.vpc_name
vpc_id   | The id of the VPC where the subnets were provisioned   |           |                             | data.ibm_is_vpc.vpc.id