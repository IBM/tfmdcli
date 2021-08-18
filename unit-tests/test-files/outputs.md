Name                   | Description                                      | Sensitive | Depends On                      | Value
---------------------- | ------------------------------------------------ | --------- | ------------------------------- | ----------------------------------------------------------------------
cloudfunction_endpoint | Function endpoint URL                            |           |                                 | ibm_function_action.backend.target_endpoint_url
bucket_name            | Name of the bucket created                       |           |                                 | module.bucket.buckets[var.bucket_info.bucket_name].bucket_name
cos_id                 | ID of COS instance where bucket is created       |           |                                 | module.bucket.cos_id
bucket_api_endpoint    | API endpoint for COS bucket                      |           | [ ibm_function_action.backend ] | module.bucket.buckets[var.bucket_info.bucket_name].s3_endpoint_private
cos_apikey             | API key for COS instance where bucket is created | true      |                                 | module.bucket.api_key