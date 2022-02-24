##############################################################################
# Variables
##############################################################################

variable api_key {
  description = "The API key needed to deploy resources"
  type        = string
  sensitive   = true
}

variable "security_group_rules" {
  description = "Map of security group rules to be added to default security group"
  default     = {
    allow_all_inbound = {
      source    = "0.0.0.0/0"
      direction = "inbound"
    }
  }
}

variable disable_public_service_endpoint {
    description = "Disable public service endpoint for cluster"
    type        = bool
    default     = false
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

variable tags {
    description = "A list of tags to add to the cluster"
    type        = list(string)
    default     = ["tag-1", "tag-2"]
}

##############################################################################