##############################################################################
# Account Variables
##############################################################################

variable TF_VERSION {
 default     = "0.13"
 description = "The version of the Terraform engine that's used in the Schematics workspace."
}

variable ibmcloud_api_key {
  description = "The IBM Cloud platform API key needed to deploy IAM enabled resources"
  type        = string
  sensitive   = true
}

variable ibm_region {
    description = "IBM Cloud region where all resources will be deployed"
    type        = string
    default     = "eu-de"

    validation  {
      error_message = "Must use an IBM Cloud region. Use `ibmcloud regions` with the IBM Cloud CLI to see valid regions."
      condition     = can(
        contains([
          "au-syd",
          "jp-tok",
          "eu-de",
          "eu-gb",
          "us-south",
          "us-east"
        ], var.ibm_region)
      )
    }
}

##############################################################################


##############################################################################
# Resource Group Variables
##############################################################################

variable created_resource_group {
  description = "The name of the resource group that will be created when running the terraform"
  type        = string
  default     = "markdown"
}

variable default_resource_group {
  description = "The name of the existing resource group to use by default"
  type        = string
  default     = "asset-development"
}

##############################################################################


##############################################################################
##############################################################################\
## COMPONENT VARIABLES
##############################################################################
##############################################################################

##############################################################################
# Cloud Function Variables
##############################################################################

variable function_namespace {
  description = "Namespace for the cloud function"
  type        = string
  default     = "markdown-components"
}

##############################################################################


##############################################################################
# CMS Variables
##############################################################################

variable cms_plan {
  description = "Plan for CMS Instance"
  type        = string
  default     = "free"
}

variable project_short_name {
  description = "Shortname for project"
  type        = string
  default     = "md"
}

variable top_domain {
  default     = "example.com"
  type        = string
  description = "Top level domain for CMS instance"
}

##############################################################################


##############################################################################
# LogDNA Variables
##############################################################################

variable log_name {
  description = "Name of LogDNA instance that will be created"
  type        = string
  default     = "md-logdna"
}

variable log_plan {
  description = "Plan for the LogDNA instance that will be created"
  type        = string
  default     = "30-day"
}

##############################################################################


##############################################################################
# Sysdig Variables
##############################################################################

variable monitor_name {
  default     = "md-sysdig"
  type        = string
  description = "Name of the Sysdig instance to be created"
}

variable monitor_plan {
  description = "Plan for Sysdig"
  type        = string
  default     = "graduated-tier"
}

##############################################################################


##############################################################################
# COS Variables
##############################################################################

variable cos_name {
  description = "Name of the COS instance to create"
  type        = string
  default     = "md-cos"
}

variable bucket_info {
    description = "Info for the creation of COS bucket"
    type = object({
        bucket_name       = string
        force_delete      = bool
    })
    default = {
      bucket_name  = "md-test-bucket"
      force_delete = true
    }
}

##############################################################################


##############################################################################
##############################################################################
##############################################################################
##############################################################################
##############################################################################


##############################################################################
##############################################################################
# VPC Variables
##############################################################################
##############################################################################

variable vpc_name {
  description = "Name of the VPC that will be created"
  type        = string
  default     = "markdown-vpc"
}

variable subnets_cidr {
  description = "The number for the second value in the subnets CIDR"
  type        = number
  default     = 10
}

##############################################################################
##############################################################################
##############################################################################
##############################################################################
##############################################################################



##############################################################################
##############################################################################
## Backend Variables
##############################################################################
##############################################################################


##############################################################################
# Logging Variables
##############################################################################

variable provision_activity_tracker {
    description = "Provision activity tracker. Only one instance of Activity Tracker can be created in a region. Can be `true` or `false`"
    type        = bool
    default     = false
}

variable activity_tracker_name {
    description = "Activity tracker name. Only needed if creating activity tracker"
    type        = string
    default     = "activity-tracker"
}

variable activity_tracker_endpoint {
    description = "API endpoint prefix for activity tracker (private, public)"
    type        = string
    default     = "private"
}

variable activity_tracker_plan {
    description = "Only required when creating resource. Plan for activity  instance."
    type        = string
    default     = "7-day"
}

##############################################################################


##############################################################################
# Cloud Function Variables
##############################################################################

variable backend_function_namespace {
  description = "Namespace for the cloud function"
  type        = string
  default     = "md-backend-fn-namespace"
}

##############################################################################


##############################################################################
# Bucket Variables
##############################################################################

variable backend_cos_name {
  description = "Name of COS instance to be created"
  type        = string
  default     = "md-backend-cos"
}

variable backend_bucket_info {
    description = "Info for the creation of COS bucket"
    type = object({
        bucket_name       = string
        force_delete      = bool
    })
    default = {
      bucket_name  = "md-test-backend-bucket"
      force_delete = true
    }
}

##############################################################################

##############################################################################
##############################################################################
##############################################################################
##############################################################################
##############################################################################


##############################################################################
##############################################################################
# IAM Variables
##############################################################################
##############################################################################

variable environment {
    description = "Environment where access groups will be created"
    type        = string
    default     = "candidate"
}

variable roles_group {
    description = "Roles group to apply to IAM Access policies"
    type        = string
    default     = "roles_group_candidate"
}

variable invite_users {
    description = "A map containing lists of users to add."
    default = {
        operations = [
            "test.test.test@ibm.com"
        ]
        support = [
            "test.test.test@ibm.com"
        ]
        security = [
            "test.test.test@ibm.com"
        ]
        superadmin = [
            "test.test.test@ibm.com"
        ]
        usermanagement = [
            "test.test.test@ibm.com"
        ]
    }
}

##############################################################################
##############################################################################
##############################################################################
##############################################################################
##############################################################################


##############################################################################
##############################################################################
## CIS Variables
##############################################################################
##############################################################################

variable account {
    description = "Name of the account"
    type        = string
    default     = "gcat-md-test"
}

variable cis_name {
    description = "Name for the CIS instance that will be created for the project"
    type        = string
    default     = "md-shared-cis"
}

variable subdomains {
    description = "A list of subdomains to be added"
    type        = list 
    default     = ["test1.example.com","test2.example.com","test3.example.com"]
}

variable ssl {
    description = "SSL type for subdomains"
    type        = string
    default     = "strict"
}

variable min_tls_version {
    description = "Minimum TLS version for subdomains"
    type        = string
    default     = "1.3"
}

variable automatic_https_rewrites {
    description = "Enable automatic HTTPS rewrites"
    type        = string
    default     = "on"
}

##############################################################################
##############################################################################
##############################################################################
##############################################################################
##############################################################################
