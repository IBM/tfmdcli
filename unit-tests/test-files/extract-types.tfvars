create_load_balancer=true

name=""

subnet_ids=[]

type=""

security_group_ids=[]

logging=true

resource_group_id=""

tags={
    test=[""]
    test2 = {
        test=0
    }
}

lb_pools=[
    {
        name=""
        algorithm=""
        protocol=""
        health_delay=0
        health_retries=0
        health_timeout=0
        health_type=""
        health_monitor_url=""
        health_monitor_port=0
        session_persistence_type=""
        session_persistence_cookie_name=""
        lb_pool_members = [
            {
                port=0
                target_address=""
                target_id=""
                weight=0
            }
        ]
    }
]

lb_listeners=[
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
            }
        ]
    }
]