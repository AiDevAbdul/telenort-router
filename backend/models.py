"""
Database models for Phase 2
Users, Tunnels, Exit Agents, API Keys, Connection Logs
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from db_config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    clerk_id = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255))
    subscription_tier = Column(String(50), default="free")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tunnels = relationship("Tunnel", back_populates="user", cascade="all, delete-orphan")
    exit_agents = relationship("ExitAgent", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")

class Tunnel(Base):
    __tablename__ = "tunnels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    relay_region = Column(String(50), default="us-central1")
    tunnel_ip_range = Column(String(50), default="10.0.0.0/24")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="tunnels")
    exit_agents = relationship("ExitAgent", back_populates="tunnel", cascade="all, delete-orphan")
    connection_logs = relationship("ConnectionLog", back_populates="tunnel", cascade="all, delete-orphan")

class ExitAgent(Base):
    __tablename__ = "exit_agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tunnel_id = Column(UUID(as_uuid=True), ForeignKey("tunnels.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    public_ip = Column(String(50))
    status = Column(String(50), default="offline")  # online, offline, error
    last_seen = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="exit_agents")
    tunnel = relationship("Tunnel", back_populates="exit_agents")

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    key_hash = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="api_keys")

class ConnectionLog(Base):
    __tablename__ = "connection_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tunnel_id = Column(UUID(as_uuid=True), ForeignKey("tunnels.id", ondelete="CASCADE"), nullable=False)
    event = Column(String(255), nullable=False)
    details = Column(JSONB)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    tunnel = relationship("Tunnel", back_populates="connection_logs")
