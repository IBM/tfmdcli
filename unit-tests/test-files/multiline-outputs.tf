##############################################################################
# Subnet Outputs
##############################################################################

output count {
  description = "The number of subnets created"
  value       = length(local.subnet_output[*].id)
}

output ids {
  description = "The ids of the created subnets"
  value       = local.subnet_output[*].id
}

output names {
  description = "The ids of the created subnets"
  value       = local.subnet_output[*].name
}

output subnets {
  description = "The subnets that were created"
  value       = [ 
    for subnet in local.subnet_output: 
    {
      id    = subnet.id
      zone  = subnet.zone
      label = var.label
    }
  ]
}

##############################################################################


##############################################################################
# ACL Outputs
##############################################################################

output acl_id {
  description = "The id of the network acl for the subnets"
  value       = local.use_data ? data.ibm_is_subnet.vpc_subnet[0].network_acl : ibm_is_network_acl.subnet_acl[0].id
}

##############################################################################


##############################################################################
# VPC Outputs
##############################################################################

output vpc_name {
  description = "The name of the VPC where the subnets were provisioned"
  value       = var.vpc_name
  depends_on = [null_resource.print_names]
}

output vpc_id {
  description = "The id of the VPC where the subnets were provisioned"
  value       = data.ibm_is_vpc.vpc.id
}

##############################################################################