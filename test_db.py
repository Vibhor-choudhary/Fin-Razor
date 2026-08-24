import sys
import os
from migrate import Session as DbSession, Event, Intervention, MetricsSnapshot
from sqlalchemy import create_engine, desc, func
from sqlalchemy.orm import sessionmaker

engine = create_engine("sqlite:///./dev.db")
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("Testing query 1")
try:
    verified_sessions = db.query(DbSession.id).select_from(DbSession).join(Intervention, DbSession.id == Intervention.session_id).join(Event, DbSession.id == Event.session_id).filter(
        Intervention.type == "retry",
        Intervention.outcome == "succeeded",
        Event.type == "succeeded",
        Event.raw_payload_json != None
    ).distinct().subquery()

    amt = db.query(func.sum(DbSession.cart_value)).filter(DbSession.id.in_(verified_sessions)).scalar() or 0.0
    print("Amt:", amt)
except Exception as e:
    import traceback
    traceback.print_exc()

