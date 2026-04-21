terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Uncomment for remote state (after first apply)
  # backend "gcs" {
  #   bucket = "ip-relay-terraform-state"
  #   prefix = "terraform/state"
  # }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.primary_region
}

# Enable required APIs
resource "google_project_service" "compute" {
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloudresourcemanager" {
  service            = "cloudresourcemanager.googleapis.com"
  disable_on_destroy = false
}

# VPC Network
resource "google_compute_network" "relay_network" {
  name                    = "ip-relay-network"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.compute]
}

# Subnets for each region
resource "google_compute_subnetwork" "relay_subnet" {
  for_each      = toset(var.relay_regions)
  name          = "ip-relay-subnet-${each.value}"
  ip_cidr_range = "10.${index(var.relay_regions, each.value)}.0.0/20"
  region        = each.value
  network       = google_compute_network.relay_network.id
}

# Firewall rules
resource "google_compute_firewall" "allow_wireguard" {
  name    = "allow-wireguard"
  network = google_compute_network.relay_network.name

  allow {
    protocol = "udp"
    ports    = ["51820"]
  }

  source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_firewall" "allow_api" {
  name    = "allow-relay-api"
  network = google_compute_network.relay_network.name

  allow {
    protocol = "tcp"
    ports    = ["8000"]
  }

  source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "allow-ssh"
  network = google_compute_network.relay_network.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
}

# Service account for relay VMs
resource "google_service_account" "relay_vm" {
  account_id   = "ip-relay-vm"
  display_name = "IP-Relay VM Service Account"
}

# IAM role for relay VMs
resource "google_project_iam_member" "relay_vm_logs" {
  project = var.gcp_project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.relay_vm.email}"
}

resource "google_project_iam_member" "relay_vm_metrics" {
  project = var.gcp_project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.relay_vm.email}"
}

# Relay VMs in each region
module "relay_vm" {
  for_each = toset(var.relay_regions)

  source = "./modules/relay-vm"

  region              = each.value
  zone                = "${each.value}-a"
  network_id          = google_compute_network.relay_network.id
  subnet_id           = google_compute_subnetwork.relay_subnet[each.value].id
  service_account     = google_service_account.relay_vm.email
  machine_type        = var.machine_type
  boot_disk_size      = var.boot_disk_size
  database_url        = var.database_url
  clerk_secret_key    = var.clerk_secret_key
  environment         = var.environment

  depends_on = [
    google_project_service.compute,
    google_compute_firewall.allow_wireguard,
    google_compute_firewall.allow_api,
    google_compute_firewall.allow_ssh
  ]
}

# Health check for load balancer
resource "google_compute_health_check" "relay_health" {
  name = "ip-relay-health-check"

  tcp_health_check {
    port = "8000"
  }

  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3
}

# Backend service for load balancer
resource "google_compute_backend_service" "relay_backend" {
  name            = "ip-relay-backend"
  protocol        = "TCP"
  health_checks   = [google_compute_health_check.relay_health.id]
  session_affinity = "CLIENT_IP"
  timeout_sec     = 30

  dynamic "backend" {
    for_each = module.relay_vm
    content {
      group           = backend.value.instance_group_id
      balancing_mode  = "RATE"
      max_rate_per_endpoint = 1000
    }
  }
}

# Global forwarding rule
resource "google_compute_global_forwarding_rule" "relay_lb" {
  name       = "ip-relay-lb"
  ip_version = "IPV4"
  load_balancing_scheme = "EXTERNAL"
  service    = google_compute_backend_service.relay_backend.id
}

# Reserve static IP for load balancer
resource "google_compute_address" "relay_lb_ip" {
  name          = "ip-relay-lb-ip"
  address_type  = "EXTERNAL"
  ip_version    = "IPV4"
}

# Output the load balancer IP
output "load_balancer_ip" {
  value       = google_compute_address.relay_lb_ip.address
  description = "Load balancer external IP"
}

output "relay_vm_ips" {
  value = {
    for region, vm in module.relay_vm : region => vm.external_ip
  }
  description = "External IPs of relay VMs by region"
}

output "relay_vm_internal_ips" {
  value = {
    for region, vm in module.relay_vm : region => vm.internal_ip
  }
  description = "Internal IPs of relay VMs by region"
}
