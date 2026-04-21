"""
Database initialization script for Phase 2
Creates all tables and indexes
"""

import os
import uuid
from sqlalchemy import text
from db_config import engine, SessionLocal, Base
from models import User, Tunnel, ExitAgent, APIKey, ConnectionLog

def verify_connection():
    """Verify database connection"""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        print("✓ Database connection successful")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        print("  Set DATABASE_URL environment variable")
        return False

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

def create_test_user():
    """Create a test user for development"""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "test@example.com").first()
        if existing:
            print("✓ Test user already exists")
            return existing

        test_user = User(
            id=uuid.uuid4(),
            email="test@example.com",
            clerk_id="clerk_test_user_123",
            full_name="Test User",
            subscription_tier="free"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"✓ Test user created: {test_user.email}")
        return test_user
    except Exception as e:
        db.rollback()
        print(f"✗ Error creating test user: {e}")
        return None
    finally:
        db.close()

def create_test_tunnel(user_id):
    """Create a test tunnel"""
    db = SessionLocal()
    try:
        test_tunnel = Tunnel(
            id=uuid.uuid4(),
            user_id=user_id,
            name="Test Tunnel",
            relay_region="us-central1",
            tunnel_ip_range="10.0.0.0/24",
            is_active=True
        )
        db.add(test_tunnel)
        db.commit()
        db.refresh(test_tunnel)
        print(f"✓ Test tunnel created: {test_tunnel.name}")
        return test_tunnel
    except Exception as e:
        db.rollback()
        print(f"✗ Error creating test tunnel: {e}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 50)
    print("IP-Relay Database Initialization")
    print("=" * 50)

    if not verify_connection():
        exit(1)

    init_db()

    test_user = create_test_user()
    if test_user:
        create_test_tunnel(test_user.id)

    print("\n" + "=" * 50)
    print("Database initialization complete!")
    print("=" * 50)
