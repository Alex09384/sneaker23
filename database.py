import sqlite3
import os

DB_FILE = 'users.db'

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def setup_db():
    if not os.path.exists(DB_FILE):
        conn = get_connection()
        cursor = conn.cursor()
        # Создаем упрощенную таблицу только для хранения измерений (опционально)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS measurements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                foot_length REAL,
                foot_width REAL,
                oblique_circumference REAL,
                foot_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
