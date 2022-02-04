##############################################################################
# Variables
##############################################################################

variable no_fields {}

variable api_key {
  description = "The API key needed to deploy resources"
  type        = string
  sensitive   = true
}

variable security_group_rules {
  description = "Map of security group rules to be added to default security group"
  default     = {
    allow_all_inbound = {
      source    = "0.0.0.0/0" // Inline comment
      direction = "inbound"
    }
  }
}

/**
block comment
variable should_not_print {}
*/

variable disable_public_service_endpoint {
    description = "Disable public service endpoint for cluster"
    type        = bool
    default     = false
}

variable tags {
    description = "A list of tags to add to the cluster"
    type        = list(string)
    default     = ["tag-1", "tag-2"]
}

variable lb_listeners {
  description = "List of Load Balancer Listeners"
  type = list(object({
    port                  = number
    protocol              = string
    default_pool          = string
    certificate_instance  = string
    connection_limit      = number
    accept_proxy_protocol = bool # Inline Comment
    lb_listener_policies = list(object({
      name                    = string
      action                  = string
      priority                = number
      target_id               = string
      target_http_status_code = number
      target_url              = string
      rules = object({
        condition = string
        type      = string
        field     = string
        value     = string
      })
      lb_listener_policy_rules = list(object({
        name      = string
        condition = string
        type      = string
        field     = string
        value     = string
      })) }))
  }))
  default = []
}


variable spoke_vpc_cidr_blocks {
  description = "An object containing lists of CIDR blocks. Each CIDR block will be used to create a subnet"

  type        = object({
    zone-1 = list(string)
    zone-2 = list(string)
    zone-3 = list(string)
  })

  default     = {
    zone-1 = [
      "10.10.10.0/24"
    ],

    zone-2 = [
      "10.40.10.0/24"
    ],

    zone-3 = [
      "10.70.10.0/24"
    ]
  }

  validation {
    error_message = "The var.cidr_blocks objects must have 1, 2, or 3 keys."
    condition     = length(keys(var.spoke_vpc_cidr_blocks)) <= 3 && length(keys(var.spoke_vpc_cidr_blocks)) >= 1
  }

  validation {
    error_message = "Each list must have at least one CIDR block."
    condition     = length(distinct(
      [
        for zone in keys(var.spoke_vpc_cidr_blocks):
        false if length(var.spoke_vpc_cidr_blocks[zone]) == 0
      ]
    )) == 0
  }

  validation {
    error_message = "Each item in each list must contain a valid CIDR block."
    condition     = length(
      distinct(
        flatten([
          for zone in keys(var.spoke_vpc_cidr_blocks):
          false if length([
            for cidr in var.spoke_vpc_cidr_blocks[zone]:
            false if !can(regex("^(2[0-5][0-9]|1[0-9]{1,2}|[0-9]{1,2}).(2[0-5][0-9]|1[0-9]{1,2}|[0-9]{1,2}).(2[0-5][0-9]|1[0-9]{1,2}|[0-9]{1,2}).(2[0-5][0-9]|1[0-9]{1,2}|[0-9]{1,2})\\/(3[0-2]|2[0-9]|1[0-9]|[0-9])$", cidr))
          ]) > 0
        ])
      )
    ) == 0
  }
}

##############################################################################

##############################################################################
# VPC Variables
##############################################################################

variable classic_access {
  description = "Enable VPC Classic Access. Note: only one VPC per region can have classic access"
  type        = bool
  default     = false
}

variable subnet_tiers {
  description = "List of subnets tiers for the vpc."
  type        = list(
    object({
      name     = string
      acl_name = string
      subnets  = object({
        zone-1 = list(
          object({
            name           = string
            cidr           = string
            public_gateway = optional(bool)
          })
        )
        zone-2 = optional(list(
          object({
            name           = string
            cidr           = string
            public_gateway = optional(bool)
          })
        ))
        zone-3 = optional(list(
          object({
            name           = string
            cidr           = string
            public_gateway = optional(bool)
          })
        ))
      })
    })
  )
  default = [
    {
      name     = "vpc"
      acl_name = "vpc-acl"
      subnets  = {
        zone-1 = [
          {
            name           = "subnet-a"
            cidr           = "10.10.10.0/24"
            public_gateway = true
          }
        ],
        zone-2 = [
          {
            name           = "subnet-b"
            cidr           = "10.20.10.0/24"
            public_gateway = true
          }
        ],
        zone-3 = [
          {
            name           = "subnet-c"
            cidr           = "10.30.10.0/24"
            public_gateway = true
          }
        ] 
      }
    }
  ]

  validation {
    error_message = "Each tier must have a unique name."
    condition     = length(distinct(var.subnet_tiers.*.name)) == length(var.subnet_tiers)
  }
}

variable use_public_gateways {
  description = "Create a public gateway in any of the three zones with `true`."
  type        = object({
    zone-1 = optional(bool)
    zone-2 = optional(bool)
    zone-3 = optional(bool)
  })
  default     = {
    zone-1 = true
    zone-2 = false
    zone-3 = false
  }

  validation {
    error_message = "Keys for `use_public_gateways` must be in the order `zone-1`, `zone-2`, `zone-3`."
    condition     = keys(var.use_public_gateways)[0] == "zone-1" && keys(var.use_public_gateways)[1] == "zone-2" && keys(var.use_public_gateways)[2] == "zone-3"
  }
}

variable network_acls {
  description = "List of ACLs to create. Rules can be automatically created to allow inbound and outbound traffic from a VPC tier by adding the name of that tier to the `network_connections` list. Rules automatically generated by these network connections will be added at the beginning of a list, and will be web-tierlied to traffic first. At least one rule must be provided for each ACL."
  type        = list(
    object({
      name                = string
      network_connections = optional(list(string))
      add_cluster_rules   = optional(bool)
      rules               = list(
        object({
          name        = string
          action      = string
          destination = string
          direction   = string
          source      = string
          tcp         = optional(
            object({
              port_max        = optional(number)
              port_min        = optional(number)
              source_port_max = optional(number)
              source_port_min = optional(number)
            })
          )
          udp         = optional(
            object({
              port_max        = optional(number)
              port_min        = optional(number)
              source_port_max = optional(number)
              source_port_min = optional(number)
            })
          )
          icmp        = optional(
            object({
              type = optional(number)
              code = optional(number)
            })
          )
        })
      )
    })
  )
  
  default     = [
    { 
      name                = "vpc-acl"
      network_connections = [] 
      add_cluster_rules   = true
      rules               = [
        {
          name        = "allow-all-inbound"
          action      = "allow"
          direction   = "inbound"
          destination = "0.0.0.0/0"
          source      = "0.0.0.0/0"
        },
        {
          name        = "allow-all-outbound"
          action      = "allow"
          direction   = "outbound"
          destination = "0.0.0.0/0"
          source      = "0.0.0.0/0"
        }
      ]
    }
  ]

  validation {
    error_message = "ACL rules can only have one of `icmp`, `udp`, or `tcp`."
    condition     = length(distinct(
      # Get flat list of results
      flatten([
        # Check through rules
        for rule in flatten([ var.network_acls.*.rules ]):
        # Return true if there is more than one of `icmp`, `udp`, or `tcp`
        true if length(
          [
            for type in ["tcp", "udp", "icmp"]:
            true if rule[type] != null
          ]
        ) > 1
      ])
    )) == 0 # Checks for length. If all fields all correct, array will be empty
  }

  validation {
    error_message = "ACL rule actions can only be `allow` or `deny`."
    condition     = length(distinct(
      flatten([
        # Check through rules
        for rule in flatten([ var.network_acls.*.rules ]):
        # Return false action is not valid
        false if !contains(["allow", "deny"], rule.action)
      ])
    )) == 0
  }

  validation {
    error_message = "ACL rule direction can only be `inbound` or `outbound`."
    condition     = length(distinct(
      flatten([
        # Check through rules
        for rule in flatten([ var.network_acls.*.rules ]):
        # Return false if direction is not valid
        false if !contains(["inbound", "outbound"], rule.direction)
      ])
    )) == 0
  }

  validation {
    error_message = "ACL rule names must match the regex pattern ^([a-z]|[a-z][-a-z0-9]*[a-z0-9])$."
    condition     = length(distinct(
      flatten([
        # Check through rules
        for rule in flatten([ var.network_acls.*.rules ]):
        # Return false if direction is not valid
        false if !can(regex("^([a-z]|[a-z][-a-z0-9]*[a-z0-9])$", rule.name))
      ])
    )) == 0
  }

}

variable security_group_rules {
  description = "A list of security group rules to be added to the default vpc security group"
  type        = list(
    object({
      name        = string
      direction   = string
      remote      = string
      tcp         = optional(
        object({
          port_max = optional(number)
          port_min = optional(number)
        })
      )
      udp         = optional(
        object({
          port_max = optional(number)
          port_min = optional(number)
        })
      )
      icmp        = optional(
        object({
          type = optional(number)
          code = optional(number)
        })
      )
    })
  )

  default = [
    {
      name      = "allow-inbound"
      direction = "inbound"
      remote    = "0.0.0.0/0"
    }
  ]

  validation {
    error_message = "Security group rules can only have one of `icmp`, `udp`, or `tcp`."
    condition     = length(distinct(
      # Get flat list of results
      flatten([
        # Check through rules
        for rule in var.security_group_rules:
        # Return true if there is more than one of `icmp`, `udp`, or `tcp`
        true if length(
          [
            for type in ["tcp", "udp", "icmp"]:
            true if rule[type] != null
          ]
        ) > 1
      ])
    )) == 0 # Checks for length. If all fields all correct, array will be empty
  }  

  validation {
    error_message = "Security group rule direction can only be `inbound` or `outbound`."
    condition     = length(distinct(
      flatten([
        # Check through rules
        for rule in var.security_group_rules:
        # Return false if direction is not valid
        false if !contains(["inbound", "outbound"], rule.direction)
      ])
    )) == 0
  }

  validation {
    error_message = "Security group rule names must match the regex pattern ^([a-z]|[a-z][-a-z0-9]*[a-z0-9])$."
    condition     = length(distinct(
      flatten([
        # Check through rules
        for rule in var.security_group_rules:
        # Return false if direction is not valid
        false if !can(regex("^([a-z]|[a-z][-a-z0-9]*[a-z0-9])$", rule.name))
      ])
    )) == 0
  }
}


##############################################################################
