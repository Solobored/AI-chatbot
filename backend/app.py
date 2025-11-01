from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import uuid
from datetime import datetime
import logging
from models import init_db, get_db_connection
from ai_modes import AI_MODES, get_mode_prompt
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize database
init_db()

def analyze_special_request(description):
    """
    Analyze the special request description and suggest the best AI mode.
    This is a simple rule-based approach that can be enhanced with actual AI.
    """
    description_lower = description.lower()
    
    # Keywords for different modes
    coding_keywords = ['code', 'programming', 'debug', 'algorithm', 'software', 'development', 'python', 'javascript', 'react', 'api', 'database', 'function', 'class', 'variable', 'syntax', 'error', 'bug', 'framework', 'library']
    business_keywords = ['business', 'strategy', 'marketing', 'sales', 'revenue', 'profit', 'market', 'customer', 'client', 'proposal', 'presentation', 'meeting', 'project', 'team', 'management', 'leadership', 'finance', 'budget', 'investment']
    creative_keywords = ['story', 'write', 'creative', 'poem', 'novel', 'character', 'plot', 'narrative', 'fiction', 'blog', 'article', 'content', 'copywriting', 'script', 'dialogue', 'brainstorm', 'idea', 'inspiration']
    
    # Count keyword matches
    coding_score = sum(1 for keyword in coding_keywords if keyword in description_lower)
    business_score = sum(1 for keyword in business_keywords if keyword in description_lower)
    creative_score = sum(1 for keyword in creative_keywords if keyword in description_lower)
    
    # Determine best mode
    scores = {
        'coding': coding_score,
        'business': business_score,
        'creative': creative_score
    }
    
    best_mode = max(scores, key=scores.get)
    
    # If no clear winner or very low scores, default to general
    if scores[best_mode] < 2:
        best_mode = 'general'
    
    return best_mode

def generate_session_name(description, mode):
    """
    Generate a smart session name based on the description and mode.
    """
    # Extract key phrases from description
    words = re.findall(r'\b\w+\b', description.lower())
    
    # Remove common words
    stop_words = {'i', 'need', 'help', 'with', 'want', 'to', 'can', 'you', 'please', 'how', 'what', 'where', 'when', 'why', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'by', 'for', 'of', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall'}
    
    meaningful_words = [word for word in words if word not in stop_words and len(word) > 2]
    
    # Take first few meaningful words
    key_words = meaningful_words[:3]
    
    if key_words:
        base_name = ' '.join(key_words).title()
        # Limit length
        if len(base_name) > 30:
            base_name = base_name[:27] + '...'
    else:
        # Fallback based on mode
        mode_names = {
            'coding': 'Coding Help',
            'business': 'Business Chat',
            'creative': 'Creative Project',
            'general': 'General Chat'
        }
        base_name = mode_names.get(mode, 'Special Chat')
    
    return base_name

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/modes', methods=['GET'])
def get_modes():
    """Get available AI modes"""
    try:
        modes = [
            {
                "id": mode_id,
                "name": mode_data["name"],
                "description": mode_data["description"]
            }
            for mode_id, mode_data in AI_MODES.items()
        ]
        return jsonify(modes)
    except Exception as e:
        logger.error(f"Error fetching modes: {str(e)}")
        return jsonify({"error": "Failed to fetch modes"}), 500

@app.route('/analyze-request', methods=['POST'])
def analyze_request():
    """Analyze special request and suggest mode and name"""
    try:
        data = request.get_json()
        description = data.get('description', '').strip()
        
        if not description:
            return jsonify({"error": "Description is required"}), 400
        
        # Analyze and suggest mode
        suggested_mode = analyze_special_request(description)
        
        # Generate session name
        suggested_name = generate_session_name(description, suggested_mode)
        
        # Get mode info
        mode_info = AI_MODES.get(suggested_mode, AI_MODES['general'])
        
        return jsonify({
            "suggested_mode": suggested_mode,
            "suggested_name": suggested_name,
            "mode_info": {
                "id": suggested_mode,
                "name": mode_info["name"],
                "description": mode_info["description"]
            }
        })
    
    except Exception as e:
        logger.error(f"Error analyzing request: {str(e)}")
        return jsonify({"error": "Failed to analyze request"}), 500

@app.route('/sessions', methods=['GET'])
def get_sessions():
    """Get all chat sessions"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT s.id, s.name, s.mode, s.created_at, s.updated_at, s.is_special,
                   COUNT(m.id) as message_count
            FROM sessions s
            LEFT JOIN messages m ON s.id = m.session_id
            GROUP BY s.id
            ORDER BY s.updated_at DESC
        ''')
        
        sessions = []
        for row in cursor.fetchall():
            sessions.append({
                "id": row[0],
                "name": row[1],
                "mode": row[2],
                "created_at": row[3],
                "updated_at": row[4],
                "is_special": bool(row[5]),
                "message_count": row[6]
            })
        
        conn.close()
        return jsonify(sessions)
    
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        return jsonify({"error": "Failed to fetch sessions"}), 500

@app.route('/sessions', methods=['POST'])
def create_session():
    """Create a new chat session"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        mode = data.get('mode', 'general')
        is_special = data.get('is_special', False)
        
        if not name:
            return jsonify({"error": "Session name is required"}), 400
        
        if mode not in AI_MODES:
            return jsonify({"error": "Invalid mode"}), 400
        
        session_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO sessions (id, name, mode, created_at, updated_at, is_special)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (session_id, name, mode, now, now, is_special))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "id": session_id,
            "name": name,
            "mode": mode,
            "created_at": now,
            "updated_at": now,
            "is_special": is_special,
            "message_count": 0
        })
    
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        return jsonify({"error": "Failed to create session"}), 500

@app.route('/sessions/quick', methods=['POST'])
def create_quick_session():
    """Create a quick general session with auto-generated name"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Count existing general sessions to generate name
        cursor.execute('SELECT COUNT(*) FROM sessions WHERE mode = ? AND is_special = ?', ('general', False))
        count = cursor.fetchone()[0]
        
        session_name = f"Chat {count + 1}"
        session_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO sessions (id, name, mode, created_at, updated_at, is_special)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (session_id, session_name, 'general', now, now, False))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "id": session_id,
            "name": session_name,
            "mode": "general",
            "created_at": now,
            "updated_at": now,
            "is_special": False,
            "message_count": 0
        })
    
    except Exception as e:
        logger.error(f"Error creating quick session: {str(e)}")
        return jsonify({"error": "Failed to create quick session"}), 500

@app.route('/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a chat session and all its messages"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Delete messages first (foreign key constraint)
        cursor.execute('DELETE FROM messages WHERE session_id = ?', (session_id,))
        
        # Delete session
        cursor.execute('DELETE FROM sessions WHERE id = ?', (session_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Session not found"}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Session deleted successfully"})
    
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        return jsonify({"error": "Failed to delete session"}), 500

@app.route('/sessions/<session_id>/messages', methods=['GET'])
def get_session_messages(session_id):
    """Get all messages for a specific session"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, user_message, ai_response, mode, timestamp
            FROM messages 
            WHERE session_id = ? 
            ORDER BY timestamp ASC
        ''', (session_id,))
        
        messages = []
        for row in cursor.fetchall():
            messages.append({
                "id": row[0],
                "session_id": session_id,
                "user_message": row[1],
                "ai_response": row[2],
                "mode": row[3],
                "timestamp": row[4]
            })
        
        conn.close()
        return jsonify(messages)
    
    except Exception as e:
        logger.error(f"Error fetching session messages: {str(e)}")
        return jsonify({"error": "Failed to fetch messages"}), 500

@app.route('/sessions/<session_id>/export', methods=['GET'])
def export_session(session_id):
    """Export session data as JSON"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get session info
        cursor.execute('SELECT * FROM sessions WHERE id = ?', (session_id,))
        session_row = cursor.fetchone()
        
        if not session_row:
            conn.close()
            return jsonify({"error": "Session not found"}), 404
        
        # Get messages
        cursor.execute('''
            SELECT id, user_message, ai_response, mode, timestamp
            FROM messages 
            WHERE session_id = ? 
            ORDER BY timestamp ASC
        ''', (session_id,))
        
        messages = []
        for row in cursor.fetchall():
            messages.append({
                "id": row[0],
                "user_message": row[1],
                "ai_response": row[2],
                "mode": row[3],
                "timestamp": row[4]
            })
        
        conn.close()
        
        export_data = {
            "session": {
                "id": session_row[0],
                "name": session_row[1],
                "mode": session_row[2],
                "created_at": session_row[3],
                "updated_at": session_row[4],
                "is_special": bool(session_row[5])
            },
            "messages": messages,
            "exported_at": datetime.now().isoformat()
        }
        
        return jsonify(export_data)
    
    except Exception as e:
        logger.error(f"Error exporting session: {str(e)}")
        return jsonify({"error": "Failed to export session"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id')
        mode = data.get('mode', 'general')
        save_history = data.get('save_history', True)
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
        
        if mode not in AI_MODES:
            mode = 'general'
        
        # Get mode-specific prompt
        system_prompt = get_mode_prompt(mode)
        
        # Simulate AI response (replace with actual AI integration)
        ai_response = f"[{AI_MODES[mode]['name']} Mode] I understand you're asking: '{user_message}'. {system_prompt[:100]}... This is a simulated response. In a real implementation, this would be processed by an AI model with the appropriate context and specialization."
        
        message_id = None
        
        if save_history:
            # Create session if it doesn't exist
            if not session_id:
                session_id = str(uuid.uuid4())
                now = datetime.now().isoformat()
                
                conn = get_db_connection()
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO sessions (id, name, mode, created_at, updated_at, is_special)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (session_id, "New Chat", mode, now, now, False))
                
                conn.commit()
                conn.close()
            
            # Save message
            message_id = str(uuid.uuid4())
            now = datetime.now().isoformat()
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO messages (id, session_id, user_message, ai_response, mode, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (message_id, session_id, user_message, ai_response, mode, now))
            
            # Update session timestamp
            cursor.execute('''
                UPDATE sessions SET updated_at = ? WHERE id = ?
            ''', (now, session_id))
            
            conn.commit()
            conn.close()
        
        return jsonify({
            "response": ai_response,
            "message_id": message_id,
            "session_id": session_id,
            "mode": mode
        })
    
    except Exception as e:
        logger.error(f"Error processing chat: {str(e)}")
        return jsonify({"error": "Failed to process message"}), 500

@app.route('/erase', methods=['POST'])
def erase_all_data():
    """Erase all chat data and create a new default session"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Delete all messages and sessions
        cursor.execute('DELETE FROM messages')
        cursor.execute('DELETE FROM sessions')
        
        # Create a new default session
        session_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO sessions (id, name, mode, created_at, updated_at, is_special)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (session_id, "Chat 1", "general", now, now, False))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": "All data erased successfully",
            "new_session_id": session_id
        })
    
    except Exception as e:
        logger.error(f"Error erasing data: {str(e)}")
        return jsonify({"error": "Failed to erase data"}), 500

@app.route('/history', methods=['GET'])
def get_chat_history():
    """Get chat history (legacy endpoint)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT m.id, m.session_id, m.user_message, m.ai_response, m.mode, m.timestamp, s.name
            FROM messages m
            JOIN sessions s ON m.session_id = s.id
            ORDER BY m.timestamp DESC
            LIMIT 100
        ''')
        
        history = []
        for row in cursor.fetchall():
            history.append({
                "id": row[0],
                "session_id": row[1],
                "user_message": row[2],
                "ai_response": row[3],
                "mode": row[4],
                "timestamp": row[5],
                "session_name": row[6]
            })
        
        conn.close()
        return jsonify(history)
    
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        return jsonify({"error": "Failed to fetch history"}), 500

if __name__ == '__main__':
    print("Starting Private AI Chatbot Backend...")
    print("Available endpoints:")
    print("- GET  /health - Health check")
    print("- GET  /modes - Get AI modes")
    print("- POST /analyze-request - Analyze special request")
    print("- GET  /sessions - Get all sessions")
    print("- POST /sessions - Create new session")
    print("- POST /sessions/quick - Create quick general session")
    print("- DELETE /sessions/<id> - Delete session")
    print("- GET  /sessions/<id>/messages - Get session messages")
    print("- GET  /sessions/<id>/export - Export session")
    print("- POST /chat - Send chat message")
    print("- POST /erase - Erase all data")
    print("- GET  /history - Get chat history (legacy)")
    
    app.run(debug=True, host='0.0.0.0', port=5000)