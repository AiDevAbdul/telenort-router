.PHONY: help start start-dev start-prod stop logs clean install build test health status

# IP-Relay Project Makefile
# Provides convenient commands for managing the entire project

PROJECT_NAME := ip-relay
DOCKER_COMPOSE := docker-compose
FRONTEND_DIR := frontend
BACKEND_DIR := backend
SHELL := /bin/bash

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
YELLOW := \033[1;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)IP-Relay Project - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BLUE)Examples:$(NC)"
	@echo "  make start          # Start all services in development mode"
	@echo "  make start-prod     # Start all services in production mode"
	@echo "  make stop           # Stop all services"
	@echo "  make logs           # View logs from all services"
	@echo "  make clean          # Remove all containers and volumes"

start: start-dev ## Start all services (alias for start-dev)

start-dev: install ## Start all services in development mode
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(BLUE)Starting IP-Relay in Development Mode$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@$(DOCKER_COMPOSE) up -d relay-vm
	@echo "$(GREEN)✓ Relay VM started$(NC)"
	@echo ""
	@echo "$(BLUE)Waiting for Relay API to be ready...$(NC)"
	@for i in {1..30}; do \
		if curl -s http://localhost:8000/health > /dev/null 2>&1; then \
			echo "$(GREEN)✓ Relay API is ready$(NC)"; \
			break; \
		fi; \
		sleep 1; \
	done
	@echo ""
	@echo "$(BLUE)Starting Dashboard in development mode...$(NC)"
	@cd $(FRONTEND_DIR) && npm run dev &
	@echo "$(GREEN)✓ Dashboard started$(NC)"
	@echo ""
	@$(MAKE) status
	@echo ""
	@echo "$(GREEN)✓ All services started successfully!$(NC)"
	@echo "$(BLUE)ℹ Dashboard: http://localhost:3000$(NC)"
	@echo "$(BLUE)ℹ Relay API: http://localhost:8000$(NC)"
	@echo "$(BLUE)ℹ API Docs: http://localhost:8000/docs$(NC)"

start-prod: build ## Start all services in production mode
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(BLUE)Starting IP-Relay in Production Mode$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✓ All services started in production mode$(NC)"
	@echo ""
	@$(MAKE) status
	@echo ""
	@echo "$(BLUE)ℹ Dashboard: http://localhost:3000$(NC)"
	@echo "$(BLUE)ℹ Relay API: http://localhost:8000$(NC)"

stop: ## Stop all services
	@echo "$(BLUE)Stopping all services...$(NC)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ All services stopped$(NC)"

restart: stop start ## Restart all services

logs: ## View logs from all services
	@$(DOCKER_COMPOSE) logs -f

logs-relay: ## View logs from relay VM only
	@$(DOCKER_COMPOSE) logs -f relay-vm

logs-dashboard: ## View logs from dashboard only
	@cd $(DASHBOARD_DIR) && npm run dev

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@if [ ! -d "$(FRONTEND_DIR)/node_modules" ]; then \
		cd $(FRONTEND_DIR) && npm install && cd ..; \
		echo "$(GREEN)✓ Frontend dependencies installed$(NC)"; \
	else \
		echo "$(GREEN)✓ Frontend dependencies already installed$(NC)"; \
	fi

build: ## Build all services for production
	@echo "$(BLUE)Building services for production...$(NC)"
	@$(DOCKER_COMPOSE) build
	@cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

clean: ## Remove all containers, volumes, and build artifacts
	@echo "$(YELLOW)⚠ This will remove all containers and volumes$(NC)"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(DOCKER_COMPOSE) down -v; \
		rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/.next; \
		echo "$(GREEN)✓ Cleanup complete$(NC)"; \
	else \
		echo "$(BLUE)Cleanup cancelled$(NC)"; \
	fi

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	@cd $(FRONTEND_DIR) && npm run type-check
	@echo "$(GREEN)✓ Tests passed$(NC)"

health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo "$(BLUE)Relay API:$(NC)"
	@curl -s http://localhost:8000/health | jq . || echo "$(RED)✗ Not responding$(NC)"
	@echo ""
	@echo "$(BLUE)Dashboard:$(NC)"
	@curl -s http://localhost:3000 > /dev/null && echo "$(GREEN)✓ Running$(NC)" || echo "$(RED)✗ Not responding$(NC)"

status: ## Show status of all services
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(BLUE)System Status$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(BLUE)Docker Containers:$(NC)"
	@$(DOCKER_COMPOSE) ps
	@echo ""
	@echo "$(BLUE)Service URLs:$(NC)"
	@echo "  Dashboard:  http://localhost:3000"
	@echo "  Relay API:  http://localhost:8000"
	@echo "  API Docs:   http://localhost:8000/docs"
	@echo ""

shell-relay: ## Open shell in relay VM container
	@$(DOCKER_COMPOSE) exec relay-vm /bin/bash

shell-dashboard: ## Open shell in dashboard container
	@$(DOCKER_COMPOSE) exec dashboard /bin/bash

env-setup: ## Setup environment files from examples
	@echo "$(BLUE)Setting up environment files...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)✓ Created .env from .env.example$(NC)"; \
		echo "$(YELLOW)⚠ Please update .env with your configuration$(NC)"; \
	else \
		echo "$(GREEN)✓ .env already exists$(NC)"; \
	fi
	@if [ ! -f $(FRONTEND_DIR)/.env.local ]; then \
		cp $(FRONTEND_DIR)/.env.example $(FRONTEND_DIR)/.env.local; \
		echo "$(GREEN)✓ Created $(FRONTEND_DIR)/.env.local$(NC)"; \
	else \
		echo "$(GREEN)✓ $(FRONTEND_DIR)/.env.local already exists$(NC)"; \
	fi

.DEFAULT_GOAL := help
