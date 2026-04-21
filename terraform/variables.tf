variable "gcp_project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "primary_region" {
  description = "Primary GCP region"
  type        = string
  default     = "us-central1"
}

variable "relay_regions" {
  description = "List of regions to deploy relay VMs"
  type        = list(string)
  default     = ["us-central1", "europe-west1", "asia-southeast1"]
}

variable "machine_type" {
  description = "GCP machine type for relay VMs"
  type        = string
  default     = "e2-medium"
}

variable "boot_disk_size" {
  description = "Boot disk size in GB"
  type        = number
  default     = 20
}

variable "database_url" {
  description = "Neon PostgreSQL connection string"
  type        = string
  sensitive   = true
}

variable "clerk_secret_key" {
  description = "Clerk secret key for authentication"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "relay_api_port" {
  description = "Port for relay API"
  type        = number
  default     = 8000
}

variable "wireguard_port" {
  description = "Port for WireGuard"
  type        = number
  default     = 51820
}
