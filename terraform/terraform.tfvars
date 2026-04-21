# Terraform variables for IP-Relay deployment

gcp_project_id = "ip-relay-prod"
primary_region = "us-central1"

relay_regions = [
  "us-central1",
  "europe-west1",
  "asia-southeast1"
]

machine_type   = "e2-medium"
boot_disk_size = 20

# TODO: Get these from your Neon PostgreSQL project
database_url = "postgresql://neondb_owner:npg_placeholder@ep-placeholder.c-2.aws.neon.tech/neondb?sslmode=require"

# TODO: Get this from your Clerk dashboard
clerk_secret_key = "sk_live_placeholder"

environment = "prod"
