terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "zone" {
  description = "GCP zone"
  type        = string
}

variable "network_id" {
  description = "VPC network ID"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID"
  type        = string
}

variable "service_account" {
  description = "Service account email"
  type        = string
}

variable "machine_type" {
  description = "Machine type"
  type        = string
  default     = "e2-medium"
}

variable "boot_disk_size" {
  description = "Boot disk size in GB"
  type        = number
  default     = 20
}

variable "database_url" {
  description = "Database connection string"
  type        = string
  sensitive   = true
}

variable "clerk_secret_key" {
  description = "Clerk secret key"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "prod"
}

# Startup script for relay VM
locals {
  startup_script = base64encode(templatefile("${path.module}/startup.sh", {
    database_url     = var.database_url
    clerk_secret_key = var.clerk_secret_key
    environment      = var.environment
    region           = var.region
  }))
}

# Compute instance for relay VM
resource "google_compute_instance" "relay_vm" {
  name         = "ip-relay-vm-${var.region}"
  machine_type = var.machine_type
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "debian-12-amd64-v20240415"
      size  = var.boot_disk_size
    }
  }

  network_interface {
    network    = var.network_id
    subnetwork = var.subnet_id

    access_config {
      # Ephemeral public IP
    }
  }

  service_account {
    email  = var.service_account
    scopes = ["cloud-platform"]
  }

  metadata = {
    startup-script-base64 = local.startup_script
    enable-oslogin        = "TRUE"
  }

  tags = ["relay-vm", "wireguard", "http-server", "https-server"]

  labels = {
    environment = var.environment
    region      = var.region
    component   = "relay-vm"
  }
}

# Instance group for load balancing
resource "google_compute_instance_group" "relay_group" {
  name        = "ip-relay-group-${var.region}"
  description = "Instance group for relay VMs in ${var.region}"
  zone        = var.zone

  instances = [google_compute_instance.relay_vm.id]

  named_port {
    name = "relay-api"
    port = 8000
  }

  named_port {
    name = "wireguard"
    port = 51820
  }
}

# Outputs
output "instance_id" {
  value       = google_compute_instance.relay_vm.id
  description = "Instance ID"
}

output "external_ip" {
  value       = google_compute_instance.relay_vm.network_interface[0].access_config[0].nat_ip
  description = "External IP address"
}

output "internal_ip" {
  value       = google_compute_instance.relay_vm.network_interface[0].network_ip
  description = "Internal IP address"
}

output "instance_group_id" {
  value       = google_compute_instance_group.relay_group.id
  description = "Instance group ID for load balancing"
}
