from flask import Flask, request, jsonify
import subprocess
import json
import os

app = Flask(__name__)

# You can switch between 'ollama', 'lmstudio', or 'simulated'
AI_MODE = os.getenv("AI_MODE", "ollama")  # Default to Ollama


@app.route("/")
def home():
    return jsonify({"status": "Backend running", "mode": AI_MODE})


@app.route("/chat", methods=["POST"])
def chat():
    """
    Handles chat messages sent from the frontend.
    Tries to get a response from a local AI model (Ollama or LM Studio),
    or falls back to a simulated response if the local backend isn't running.
    """
    data = request.get_json()
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    try:
        # --- 🧠 Mode 1: Ollama ---
        if AI_MODE == "ollama":
            response = run_ollama(user_message)
        # --- 🧠 Mode 2: LM Studio (via localhost:1234 by default) ---
        elif AI_MODE == "lmstudio":
            response = run_lmstudio(user_message)
        # --- 🧠 Mode 3: Simulated fallback ---
        else:
            response = f"[Simulated AI] You said: {user_message}"

        return jsonify({"response": response})

    except Exception as e:
        print(f"⚠️ Error: {e}")
        return jsonify({"response": f"[Error] {str(e)}"}), 500


# ----------------------------
# Helper functions
# ----------------------------

def run_ollama(prompt):
    """Run Ollama locally using subprocess"""
    process = subprocess.Popen(
        ["ollama", "run", "llama3"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    response, error = process.communicate(prompt)

    if error:
        raise Exception(f"Ollama error: {error.strip()}")
    if not response.strip():
        raise Exception("Empty response from Ollama")

    return response.strip()


def run_lmstudio(prompt):
    """Run LM Studio local API on port 1234 (default)"""
    import requests

    url = "http://localhost:1234/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    payload = {
        "model": "lmstudio",  # Replace with your model name if needed
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }

    res = requests.post(url, headers=headers, data=json.dumps(payload))
    res.raise_for_status()
    data = res.json()

    # Parse the response
    return data["choices"][0]["message"]["content"].strip()


if __name__ == "__main__":
    print(f"🧩 Starting Flask backend (mode: {AI_MODE})")
    app.run(host="127.0.0.1", port=5000, debug=True)
