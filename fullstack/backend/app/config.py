# filepath: c:\Users\apoll\OneDrive\Documents\Recommendation-System\thesis-project\backend\app\config.py
from dotenv import load_dotenv
import os
load_dotenv()
class Config:
    USER = os.getenv("SUPABASE_USER")
    PASSWORD = os.getenv("SUPABASE_PASSWORD")
    HOST = os.getenv("SUPABASE_HOST")
    PORT = os.getenv("SUPABASE_PORT")
    DBNAME = os.getenv("SUPABASE_DB")
    SECRET_KEY = os.getenv("SECRET_KEY") 
    SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"
    SQLALCHEMY_TRACK_MODIFICATIONS = False