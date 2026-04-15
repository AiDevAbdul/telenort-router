"""
Database initialization script for Phase 2
Creates all tables and indexes
"""

from db_config import engine, Base
from models import User, Tunnel, ExitAgent, APIKey, ConnectionLog

def init_db():
    """Initialize database with all tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully")
    print("\nTables created:")
    print("  - users")
    print("  - tunnels")
    print("  - exit_agents")
    print("  - api_keys")
    print("  - connection_logs")

if __name__ == "__main__":
    init_db()
