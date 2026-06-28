"""Entry point for database seeding — creates schema and populates data."""
import os
from schema_v2 import create_schema
from seed_samosa_high import seed_samosa_high

def seed_db(db_path):
    create_schema(db_path)
    seed_samosa_high(db_path)

if __name__ == "__main__":
    DB_PATH = os.path.join(os.path.dirname(__file__), "database.sqlite")
    seed_db(DB_PATH)
