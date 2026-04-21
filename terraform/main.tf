terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
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

# VPC Network
resource "google_compute_network" "relay_network" {
  name                    = "ip-relay-network"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.compute]
}

# Subnet for primary region
resource "google_compute_subnetwork" "relay_subnet" {
  name          = "ip-relay-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = var.primary_region
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

# IAM roles for relay VMs
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

# Relay VM instance
resource "google_compute_instance" "relay_vm" {
  name         = "ip-relay-vm"
  machine_type = var.machine_type
  zone         = "${var.primary_region}-a"

  boot_disk {
    initialize_params {
      image = "debian-12"
      size  = var.boot_disk_size
    }
  }

  network_interface {
    network    = google_compute_network.relay_network.id
    subnetwork = google_compute_subnetwork.relay_subnet.id

    access_config {
      # Ephemeral public IP
    }
  }

  service_account {
    email  = google_service_account.relay_vm.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    startup-script = base64encode(templatefile("${path.module}/modules/relay-vm/startup.sh", {
      database_url     = var.database_url
      clerk_secret_key = var.clerk_secret_key
      environment      = var.environment
      region           = var.primary_region
    }))
  }

  depends_on = [
    google_project_service.compute,
    google_compute_firewall.allow_wireguard,
    google_compute_firewall.allow_api,
    google_compute_firewall.allow_ssh
  ]
}

# Reserve static IP for load balancer
resource "google_compute_address" "relay_lb_ip" {
  name          = "ip-relay-lb-ip"
  address_type  = "EXTERNAL"
  ip_version    = "IPV4"
  region        = var.primary_region
}

# Output the load balancer IP
output "load_balancer_ip" {
  value       = google_compute_address.relay_lb_ip.address
  description = "Load balancer external IP"
}

output "relay_vm_ip" {
  value       = google_compute_instance.relay_vm.network_interface[0].access_config[0].nat_ip
  description = "External IP of relay VM"
}
