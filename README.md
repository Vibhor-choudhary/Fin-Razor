# Checkout Recovery Agent

## Quickstart

```bash
# 1. Setup environment
python -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup configuration
cp .env.example .env

# 4. Run migrations
python migrate.py

# 5. Start the backend
uvicorn main:app --reload --port 8000
```
