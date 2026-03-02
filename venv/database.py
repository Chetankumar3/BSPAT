import os
from dotenv import load_dotenv
from sqlalchemy import create_all, Column, Integer, String
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

# 1. Get the URL from .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Create the Engine
# 'check_same_thread' is only needed for SQLite to allow multi-threading
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# 3. Create a Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Create the Base class for models to inherit from
Base = declarative_base()

# 5. Helper function to create tables
def init_db():
    Base.metadata.create_all(bind=engine)
    print("Tables created!")

# 6. Dependency/Helper to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    init_db()