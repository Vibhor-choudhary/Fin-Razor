import os
import sys
from sqlalchemy import create_engine, Column, String, Float, Integer, text
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./dev.db")
engine = create_engine(DATABASE_URL)
Base = declarative_base()

class Session(Base):
    __tablename__ = 'sessions'
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    cart_value = Column(Float, nullable=False)
    initial_status = Column(String, nullable=False)
    final_status = Column(String, nullable=False, index=True)
    at_risk = Column(Integer, nullable=False, default=0, index=True)
    ground_truth_self_convert = Column(Integer, nullable=False, default=0)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)

class Event(Base):
    __tablename__ = 'events'
    id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False, index=True)
    timestamp = Column(String, nullable=False)
    metadata_json = Column('metadata', String, nullable=True)

class Intervention(Base):
    __tablename__ = 'interventions'
    id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False, unique=True, index=True)
    type = Column(String, nullable=False, index=True)
    outcome = Column(String, nullable=False, default='pending', index=True)
    confidence_score = Column(Float, nullable=False)
    agent_reasoning = Column(String, nullable=True)
    sentry_event_id = Column(String, nullable=True)
    applied_at = Column(String, nullable=False)

class MetricsSnapshot(Base):
    __tablename__ = 'metrics_snapshot'
    id = Column(String, primary_key=True)
    batch_id = Column(String, nullable=False, index=True)
    control_sessions = Column(Integer, nullable=False)
    control_successful = Column(Integer, nullable=False)
    baseline_conversion = Column(Float, nullable=False)
    treatment_sessions = Column(Integer, nullable=False)
    treatment_successful = Column(Integer, nullable=False)
    agent_conversion = Column(Float, nullable=False)
    interventions_applied = Column(Integer, nullable=False)
    false_positives = Column(Integer, nullable=False)
    false_positive_cost_inr = Column(Float, nullable=False)
    abstentions = Column(Integer, nullable=False)
    unresolvable = Column(Integer, nullable=False)
    created_at = Column(String, nullable=False, index=True)

if __name__ == "__main__":
    print(f"Creating tables in {DATABASE_URL}...")
    try:
        Base.metadata.create_all(engine)
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
