import sqlite3
import os

DATABASE_PATH = 'chatbot.db'

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            mode TEXT NOT NULL DEFAULT 'general',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            is_special BOOLEAN DEFAULT FALSE
        )
    ''')
    
    # Create messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_message TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            mode TEXT NOT NULL DEFAULT 'general',
            timestamp TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
        )
    ''')
    
    # Create indexes for better performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_mode ON sessions(mode)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_is_special ON sessions(is_special)')
    
    # Check if we need to add the is_special column to existing sessions table
    cursor.execute("PRAGMA table_info(sessions)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'is_special' not in columns:
        cursor.execute('ALTER TABLE sessions ADD COLUMN is_special BOOLEAN DEFAULT FALSE')
    
    conn.commit()
    conn.close()
    
    print(f"Database initialized at {DATABASE_PATH}")

if __name__ == '__main__':
    init_db()