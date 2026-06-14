# ============================================
#   VocalEye v2.0 — Flask Backend with ML
#   app.py
# ============================================

from flask import Flask, render_template, request, jsonify
import pickle
import os

app = Flask(__name__)

# ---- Load trained ML models ----
emotion_model   = None
emergency_model = None

def load_models():
    global emotion_model, emergency_model
    try:
        with open('models/emotion_model.pkl', 'rb') as f:
            emotion_model = pickle.load(f)
        print("[VocalEye] ✅ Emotion model loaded")
    except FileNotFoundError:
        print("[VocalEye] ⚠️  Emotion model not found. Run train_model.py first.")

    try:
        with open('models/emergency_model.pkl', 'rb') as f:
            emergency_model = pickle.load(f)
        print("[VocalEye] ✅ Emergency model loaded")
    except FileNotFoundError:
        print("[VocalEye] ⚠️  Emergency model not found. Run train_model.py first.")

load_models()

# Emotion display config
EMOTION_CONFIG = {
    'happy':   {'emoji': '😄', 'color': '#f59e0b', 'desc': 'Positive and cheerful tone'},
    'urgent':  {'emoji': '😰', 'color': '#ff4d6d', 'desc': 'Urgency detected in speech'},
    'worried': {'emoji': '😟', 'color': '#a78bfa', 'desc': 'Concern or anxiety detected'},
    'calm':    {'emoji': '😌', 'color': '#00e5b0', 'desc': 'Calm and steady tone'},
    'neutral': {'emoji': '😐', 'color': '#5a6175', 'desc': 'No strong emotion detected'},
}


# ============================================
#   HOME ROUTE
# ============================================
@app.route('/')
def index():
    return render_template('index.html')


# ============================================
#   PREDICT ROUTE
#   Receives transcribed text from browser
#   Returns emotion + emergency prediction
# ============================================
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        text = data.get('text', '').strip()

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        result = {}

        # ---- Emotion Prediction ----
        if emotion_model:
            emotion = emotion_model.predict([text])[0]
            config  = EMOTION_CONFIG.get(emotion, EMOTION_CONFIG['neutral'])
            result['emotion'] = {
                'label': emotion,
                'emoji': config['emoji'],
                'color': config['color'],
                'desc':  config['desc']
            }
        else:
            result['emotion'] = {
                'label': 'neutral',
                'emoji': '😐',
                'color': '#5a6175',
                'desc': 'Model not loaded'
            }

        # ---- Emergency Prediction ----
        if emergency_model:
            emergency = emergency_model.predict([text])[0]
            result['emergency'] = emergency == 'emergency'
        else:
            result['emergency'] = False

        return jsonify(result)

    except Exception as e:
        print(f'[ERROR] Prediction failed: {e}')
        return jsonify({'error': str(e)}), 500


# ============================================
#   RUN
# ============================================
if __name__ == '__main__':
    print("\n" + "="*45)
    print("  VocalEye v2.0")
    print("  AI Communication Assistant for the Hearing Impaired")
    print("  Open Chrome: http://localhost:5000")
    print("="*45 + "\n")
    app.run(debug=True, port=5000)