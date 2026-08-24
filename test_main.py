import json
import sqlite3
import os
print("Running db checks")
conn = sqlite3.connect("dev.db")
c = conn.cursor()
c.execute("SELECT * FROM metrics_snapshot ORDER BY created_at DESC LIMIT 1")
row = c.fetchone()
print(row)
