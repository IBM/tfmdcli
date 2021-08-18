##############################################################################
# Cloud Function Outputs
##############################################################################

output cloudfunction_endpoint {
    description = "Function endpoint URL"
    value       = ibm_function_action.backend.target_endpoint_url
}

##############################################################################

##############################################################################
# COS Bucket Outputs
##############################################################################

output bucket_name {
    description = "Name of the bucket created"
    value       = module.bucket.buckets[var.bucket_info.bucket_name].bucket_name
}

output cos_id {
    description = "ID of COS instance where bucket is created"
    value       = module.bucket.cos_id
}

output bucket_api_endpoint {
    description = "API endpoint for COS bucket"
    value       = module.bucket.buckets[var.bucket_info.bucket_name].s3_endpoint_private
    depends_on  = [ ibm_function_action.backend ]
}

output cos_apikey {
    description = "API key for COS instance where bucket is created"
    value       = module.bucket.api_key
    sensitive   = true
}

##############################################################################
