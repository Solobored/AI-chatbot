"""
AI Mode configurations for specialized chatbot behaviors.
Each mode has specific prompts and response styles.
"""

AI_MODES = {
    'general': {
        'name': 'General Assistant',
        'description': 'Helpful AI assistant for general questions and conversations',
        'system_prompt': 'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and helpful responses to user questions.',
        'max_length': 100,
        'temperature': 0.7
    },
    'coding': {
        'name': 'Coding Assistant',
        'description': 'Specialized AI for programming help, code review, and technical guidance',
        'system_prompt': 'You are an expert programming assistant. Help with code, debugging, best practices, and technical explanations. Be precise and provide practical solutions.',
        'max_length': 150,
        'temperature': 0.5
    },
    'business': {
        'name': 'Business Consultant',
        'description': 'Professional business advice, strategy, and consulting guidance',
        'system_prompt': 'You are a professional business consultant with expertise in strategy, operations, and management. Provide actionable business advice and insights.',
        'max_length': 120,
        'temperature': 0.6
    },
    'creative': {
        'name': 'Creative Writing',
        'description': 'Creative writing assistance, storytelling, and content creation',
        'system_prompt': 'You are a creative writing assistant. Help with storytelling, creative content, writing techniques, and imaginative ideas. Be inspiring and creative.',
        'max_length': 130,
        'temperature': 0.8
    }
}

def get_mode_config(mode):
    """Get configuration for a specific AI mode."""
    return AI_MODES.get(mode, AI_MODES['general'])

def get_all_modes():
    """Get all available AI modes."""
    return [
        {
            'id': mode_id,
            'name': config['name'],
            'description': config['description']
        }
        for mode_id, config in AI_MODES.items()
    ]

def format_prompt_for_mode(user_message, mode, conversation_history=None):
    """
    Format the user message with mode-specific prompting.
    """
    config = get_mode_config(mode)
    
    # Build context from conversation history
    context = ""
    if conversation_history:
        recent_messages = conversation_history[-3:]  # Last 3 exchanges for context
        for msg in recent_messages:
            context += f"Human: {msg['user_message']}\nAI: {msg['ai_response']}\n"
    
    # Format the prompt based on mode
    if mode == 'coding':
        prompt = f"{config['system_prompt']}\n\n"
        if context:
            prompt += f"Previous conversation:\n{context}\n"
        prompt += f"Human: {user_message}\nAI: Here's how I can help with your coding question:"
        
    elif mode == 'business':
        prompt = f"{config['system_prompt']}\n\n"
        if context:
            prompt += f"Previous discussion:\n{context}\n"
        prompt += f"Human: {user_message}\nAI: From a business perspective:"
        
    elif mode == 'creative':
        prompt = f"{config['system_prompt']}\n\n"
        if context:
            prompt += f"Previous creative exchange:\n{context}\n"
        prompt += f"Human: {user_message}\nAI: Let me help you with this creative challenge:"
        
    else:  # general mode
        prompt = f"{config['system_prompt']}\n\n"
        if context:
            prompt += f"Previous conversation:\n{context}\n"
        prompt += f"Human: {user_message}\nAI:"
    
    return prompt
def get_mode_prompt(mode_id):
    """Get the system prompt for a specific AI mode"""
    mode = AI_MODES.get(mode_id, AI_MODES['general'])
    return mode['system_prompt']

def analyze_request_for_mode(description):
    """Analyze a user's request description and suggest the best AI mode"""
    description_lower = description.lower()
    
    # Keywords for different modes
    coding_keywords = ['code', 'programming', 'debug', 'python', 'javascript', 'html', 'css', 'function', 'algorithm', 'bug', 'error', 'script', 'development', 'software', 'api', 'database']
    business_keywords = ['business', 'strategy', 'marketing', 'sales', 'finance', 'investment', 'startup', 'company', 'revenue', 'profit', 'market', 'customer', 'plan', 'growth', 'management']
    creative_keywords = ['story', 'write', 'creative', 'poem', 'novel', 'character', 'plot', 'fiction', 'narrative', 'blog', 'article', 'content', 'writing', 'author', 'book']
    
    # Count keyword matches
    coding_score = sum(1 for keyword in coding_keywords if keyword in description_lower)
    business_score = sum(1 for keyword in business_keywords if keyword in description_lower)
    creative_score = sum(1 for keyword in creative_keywords if keyword in description_lower)
    
    # Determine best mode
    if coding_score > business_score and coding_score > creative_score:
        return 'coding'
    elif business_score > creative_score:
        return 'business'
    elif creative_score > 0:
        return 'creative'
    else:
        return 'general'

def generate_session_name(description, mode_id):
    """Generate a smart session name based on description and mode"""
    description_lower = description.lower()
    
    # Extract key topics
    if mode_id == 'coding':
        if 'python' in description_lower:
            return "Python Help"
        elif 'javascript' in description_lower or 'js' in description_lower:
            return "JavaScript Help"
        elif 'debug' in description_lower:
            return "Debug Session"
        elif 'api' in description_lower:
            return "API Development"
        else:
            return "Coding Session"
    
    elif mode_id == 'business':
        if 'strategy' in description_lower:
            return "Business Strategy"
        elif 'marketing' in description_lower:
            return "Marketing Plan"
        elif 'startup' in description_lower:
            return "Startup Advice"
        elif 'finance' in description_lower:
            return "Financial Planning"
        else:
            return "Business Consultation"
    
    elif mode_id == 'creative':
        if 'story' in description_lower:
            return "Story Writing"
        elif 'poem' in description_lower:
            return "Poetry Session"
        elif 'blog' in description_lower:
            return "Blog Writing"
        elif 'novel' in description_lower:
            return "Novel Planning"
        else:
            return "Creative Writing"
    
    else:
        # General mode - extract first few words
        words = description.split()[:3]
        if len(words) >= 2:
            return " ".join(words).title()
        else:
            return "General Chat"
