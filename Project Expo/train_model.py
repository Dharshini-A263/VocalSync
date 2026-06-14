# ============================================
#   VocalEye v2.0 — ML Model Training
#   train_model.py
#
#   Trains TWO models:
#   1. Emotion Classifier (5 emotions)
#   2. Emergency Detector (binary)
#
#   Run: python train_model.py
# ============================================

import os
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import nltk

# Download NLTK data
print("[VocalEye] Downloading NLTK data...")
nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)
from nltk.corpus import stopwords

os.makedirs('models', exist_ok=True)

print("\n" + "="*50)
print("  VocalEye — ML Model Training")
print("="*50)


# ============================================
#   DATASET 1: EMOTION TRAINING DATA
#   Labels: happy, urgent, worried, calm, neutral
# ============================================
emotion_data = [

  # ---- HAPPY ----
  ("I am so happy today", "happy"),
  ("This is amazing and wonderful", "happy"),
  ("I love this so much", "happy"),
  ("That is fantastic news", "happy"),
  ("You are doing great", "happy"),
  ("I feel so excited about this", "happy"),
  ("Thank you so much for everything", "happy"),
  ("This made my day so good", "happy"),
  ("Wonderful job you did today", "happy"),
  ("I am really glad to hear that", "happy"),
  ("That was awesome performance", "happy"),
  ("I feel great and energetic today", "happy"),
  ("Yes that is perfect thank you", "happy"),
  ("Excellent work keep it up", "happy"),
  ("I really enjoyed that a lot", "happy"),
  ("That is brilliant news", "happy"),
  ("I am thrilled about this", "happy"),
  ("Everything is going really well", "happy"),
  ("You made me very happy today", "happy"),
  ("I feel so positive right now", "happy"),
  ("This is the best day ever", "happy"),
  ("I am overjoyed with the results", "happy"),
  ("Congratulations on your achievement", "happy"),
  ("I feel blessed and grateful", "happy"),
  ("What a beautiful day this is", "happy"),
  ("I am proud of what we did", "happy"),
  ("This is such good news", "happy"),
  ("I feel cheerful and confident", "happy"),
  ("Absolutely love what you did", "happy"),
  ("I am delighted to see you", "happy"),

  # ---- URGENT ----
  ("Please help me right now", "urgent"),
  ("I need this immediately", "urgent"),
  ("This is very urgent please hurry", "urgent"),
  ("Come quickly it is important", "urgent"),
  ("I must do this right now", "urgent"),
  ("Please respond as fast as possible", "urgent"),
  ("This cannot wait any longer", "urgent"),
  ("I need you here immediately", "urgent"),
  ("Do it now do not delay", "urgent"),
  ("Rush please this is critical", "urgent"),
  ("Time is running out hurry", "urgent"),
  ("This is extremely important now", "urgent"),
  ("Get here as fast as you can", "urgent"),
  ("I need urgent assistance please", "urgent"),
  ("This must be done immediately", "urgent"),
  ("Please act right away", "urgent"),
  ("There is no time to waste", "urgent"),
  ("Everything depends on this now", "urgent"),
  ("Move quickly we are running late", "urgent"),
  ("I need help right this instant", "urgent"),
  ("Send someone now immediately", "urgent"),
  ("This is a critical situation", "urgent"),
  ("Respond right now it is urgent", "urgent"),
  ("We need to act fast", "urgent"),
  ("Please come as soon as possible", "urgent"),
  ("This needs to happen now", "urgent"),
  ("Alert everyone immediately please", "urgent"),
  ("I need this done right now", "urgent"),
  ("Stop everything and help me", "urgent"),
  ("Drop what you are doing now", "urgent"),

  # ---- WORRIED ----
  ("I am very worried about this", "worried"),
  ("Something seems wrong here", "worried"),
  ("I am scared about what will happen", "worried"),
  ("I feel very anxious right now", "worried"),
  ("This is concerning me a lot", "worried"),
  ("I am afraid this might go wrong", "worried"),
  ("I have a bad feeling about this", "worried"),
  ("Something does not feel right", "worried"),
  ("I am nervous about the situation", "worried"),
  ("Please tell me everything is okay", "worried"),
  ("I keep thinking about the problem", "worried"),
  ("I am stressed and cannot think straight", "worried"),
  ("What if something bad happens", "worried"),
  ("I feel uneasy about all of this", "worried"),
  ("This situation is making me anxious", "worried"),
  ("I am concerned about the outcome", "worried"),
  ("There might be a serious problem", "worried"),
  ("I do not know what will happen", "worried"),
  ("This worries me deeply", "worried"),
  ("I am terrified of what comes next", "worried"),
  ("Everything feels uncertain right now", "worried"),
  ("I am not sure this will work out", "worried"),
  ("I fear the worst might happen", "worried"),
  ("Something is definitely wrong here", "worried"),
  ("I feel overwhelmed and scared", "worried"),
  ("This situation feels out of control", "worried"),
  ("I cannot stop thinking about it", "worried"),
  ("I am panicking a little bit", "worried"),
  ("What if we cannot fix this problem", "worried"),
  ("I feel lost and very confused", "worried"),

  # ---- CALM ----
  ("That sounds okay to me", "calm"),
  ("I think we can handle this", "calm"),
  ("Everything seems fine right now", "calm"),
  ("Let us take this step by step", "calm"),
  ("I understand the situation clearly", "calm"),
  ("That makes sense to me", "calm"),
  ("I feel at peace with this decision", "calm"),
  ("We can work through this together", "calm"),
  ("I am fine with whatever you decide", "calm"),
  ("Alright let us think about this", "calm"),
  ("Sure I will take care of it", "calm"),
  ("I believe things will work out", "calm"),
  ("There is no need to rush", "calm"),
  ("Let us approach this calmly", "calm"),
  ("I think we have time for this", "calm"),
  ("Maybe we should talk it through", "calm"),
  ("I feel relaxed and ready", "calm"),
  ("Everything is under control here", "calm"),
  ("We just need to be patient", "calm"),
  ("I am content with how things are", "calm"),
  ("Let us proceed at a steady pace", "calm"),
  ("I feel confident we can do this", "calm"),
  ("That is perfectly alright with me", "calm"),
  ("No problem we will figure it out", "calm"),
  ("I am comfortable with this plan", "calm"),
  ("Take your time there is no rush", "calm"),
  ("I am steady and focused right now", "calm"),
  ("Things are going according to plan", "calm"),
  ("I feel grounded and settled", "calm"),
  ("We are making good progress here", "calm"),

  # ---- NEUTRAL ----
  ("What time is the meeting today", "neutral"),
  ("Can you pass me that document", "neutral"),
  ("I will check the schedule later", "neutral"),
  ("The report is on the table", "neutral"),
  ("We need to discuss the agenda", "neutral"),
  ("The appointment is on Tuesday", "neutral"),
  ("Please send me the file", "neutral"),
  ("I will call you back later", "neutral"),
  ("The weather is cloudy today", "neutral"),
  ("There are three items on the list", "neutral"),
  ("The bus arrives at ten thirty", "neutral"),
  ("Can you repeat what you said", "neutral"),
  ("I need to check my messages", "neutral"),
  ("The office is on the second floor", "neutral"),
  ("Let me know when you are ready", "neutral"),
  ("The package arrived this morning", "neutral"),
  ("I have a meeting at three", "neutral"),
  ("Please write your name here", "neutral"),
  ("The document needs a signature", "neutral"),
  ("I will be there in ten minutes", "neutral"),
  ("The file is saved on the desktop", "neutral"),
  ("We have five people in the team", "neutral"),
  ("The project deadline is next week", "neutral"),
  ("Please check the email I sent", "neutral"),
  ("The phone number is on the card", "neutral"),
  ("I need to buy some groceries", "neutral"),
  ("The store closes at nine tonight", "neutral"),
  ("Can you hand me that pen please", "neutral"),
  ("The address is written on the note", "neutral"),
  ("I will finish this by tomorrow", "neutral"),
]

# ============================================
#   DATASET 2: EMERGENCY TRAINING DATA
#   Labels: emergency, not_emergency
# ============================================
emergency_data = [

  # ---- EMERGENCY ----
  ("help me please I am in danger", "emergency"),
  ("call the ambulance right now", "emergency"),
  ("there is a fire in the building", "emergency"),
  ("I am having a heart attack", "emergency"),
  ("someone call the police immediately", "emergency"),
  ("I cannot breathe please help", "emergency"),
  ("there has been a terrible accident", "emergency"),
  ("I am bleeding very badly", "emergency"),
  ("I need an ambulance right now", "emergency"),
  ("the building is on fire evacuate", "emergency"),
  ("someone is attacking me help", "emergency"),
  ("I feel severe pain in my chest", "emergency"),
  ("please call 108 immediately", "emergency"),
  ("I am dying please someone help", "emergency"),
  ("there is a gas leak in here", "emergency"),
  ("I have been badly injured", "emergency"),
  ("save me I cannot move at all", "emergency"),
  ("the child is not breathing help", "emergency"),
  ("I see smoke everywhere danger", "emergency"),
  ("emergency please help right now", "emergency"),
  ("I am trapped and cannot get out", "emergency"),
  ("someone collapsed on the floor", "emergency"),
  ("there is an intruder in the house", "emergency"),
  ("I feel unconscious and dizzy", "emergency"),
  ("please call for medical help now", "emergency"),
  ("there has been an explosion here", "emergency"),
  ("I am having a severe allergic reaction", "emergency"),
  ("the patient is not responding", "emergency"),
  ("dangerous situation call police now", "emergency"),
  ("flood is coming evacuate everyone", "emergency"),
  ("I swallowed something poisonous", "emergency"),
  ("someone fell from the building", "emergency"),
  ("there is a robbery happening now", "emergency"),
  ("I need immediate medical attention", "emergency"),
  ("the car crashed call for help", "emergency"),
  ("person is unconscious on road", "emergency"),
  ("I cannot stop the bleeding help", "emergency"),
  ("fire is spreading very fast now", "emergency"),
  ("call 911 this is an emergency", "emergency"),
  ("I think I am having a stroke", "emergency"),

  # ---- NOT EMERGENCY ----
  ("I would like some water please", "not_emergency"),
  ("what time is the appointment", "not_emergency"),
  ("can you help me find the keys", "not_emergency"),
  ("I need to check my email now", "not_emergency"),
  ("please repeat what you just said", "not_emergency"),
  ("I would like to order some food", "not_emergency"),
  ("can we reschedule the meeting", "not_emergency"),
  ("I need help with this homework", "not_emergency"),
  ("where is the nearest grocery store", "not_emergency"),
  ("I want to talk to the manager", "not_emergency"),
  ("can you please open the window", "not_emergency"),
  ("I need help with my computer", "not_emergency"),
  ("where did I leave my phone", "not_emergency"),
  ("I would like to sit down now", "not_emergency"),
  ("can you show me the way please", "not_emergency"),
  ("I need to charge my phone soon", "not_emergency"),
  ("what is the weather like today", "not_emergency"),
  ("I want to go home after this", "not_emergency"),
  ("can you turn on the fan please", "not_emergency"),
  ("I need help carrying this bag", "not_emergency"),
  ("where is the nearest bus stop", "not_emergency"),
  ("I would like some assistance please", "not_emergency"),
  ("can you help me with this form", "not_emergency"),
  ("I need directions to the hospital", "not_emergency"),
  ("please help me find my glasses", "not_emergency"),
  ("I want to speak with someone", "not_emergency"),
  ("can you write this down for me", "not_emergency"),
  ("I need a little bit of help here", "not_emergency"),
  ("please assist me with this task", "not_emergency"),
  ("I would appreciate some guidance", "not_emergency"),
  ("can you explain this to me again", "not_emergency"),
  ("I need to send a message", "not_emergency"),
  ("where can I find the restroom", "not_emergency"),
  ("I need help understanding this", "not_emergency"),
  ("please show me how this works", "not_emergency"),
  ("I want to know the schedule", "not_emergency"),
  ("can you help me read this sign", "not_emergency"),
  ("I need someone to talk to", "not_emergency"),
  ("please help me fill this form", "not_emergency"),
  ("I would like to know the price", "not_emergency"),
]


# ============================================
#   TRAIN EMOTION MODEL
# ============================================
print("\n📊 Training Emotion Classifier...")
print("-" * 40)

emotion_texts  = [d[0] for d in emotion_data]
emotion_labels = [d[1] for d in emotion_data]

X_train_e, X_test_e, y_train_e, y_test_e = train_test_split(
    emotion_texts, emotion_labels,
    test_size=0.2, random_state=42, stratify=emotion_labels
)

emotion_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=3000,
        stop_words='english',
        sublinear_tf=True
    )),
    ('clf', LinearSVC(max_iter=2000, C=1.0))
])

emotion_pipeline.fit(X_train_e, y_train_e)
y_pred_e = emotion_pipeline.predict(X_test_e)

emotion_acc = accuracy_score(y_test_e, y_pred_e)
print(f"✅ Emotion Model Accuracy : {emotion_acc * 100:.1f}%")
print("\nClassification Report:")
print(classification_report(y_test_e, y_pred_e))

# Cross validation
cv_scores = cross_val_score(emotion_pipeline, emotion_texts, emotion_labels, cv=5)
print(f"Cross-Validation Accuracy: {cv_scores.mean()*100:.1f}% ± {cv_scores.std()*100:.1f}%")

# Save model
with open('models/emotion_model.pkl', 'wb') as f:
    pickle.dump(emotion_pipeline, f)
print("💾 Emotion model saved → models/emotion_model.pkl")


# ============================================
#   TRAIN EMERGENCY MODEL
# ============================================
print("\n🚨 Training Emergency Detector...")
print("-" * 40)

emergency_texts  = [d[0] for d in emergency_data]
emergency_labels = [d[1] for d in emergency_data]

X_train_em, X_test_em, y_train_em, y_test_em = train_test_split(
    emergency_texts, emergency_labels,
    test_size=0.2, random_state=42, stratify=emergency_labels
)

emergency_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=2000,
        stop_words='english',
        sublinear_tf=True
    )),
    ('clf', MultinomialNB(alpha=0.1))
])

emergency_pipeline.fit(X_train_em, y_train_em)
y_pred_em = emergency_pipeline.predict(X_test_em)

emergency_acc = accuracy_score(y_test_em, y_pred_em)
print(f"✅ Emergency Model Accuracy: {emergency_acc * 100:.1f}%")
print("\nClassification Report:")
print(classification_report(y_test_em, y_pred_em))

# Cross validation
cv_scores_em = cross_val_score(emergency_pipeline, emergency_texts, emergency_labels, cv=5)
print(f"Cross-Validation Accuracy: {cv_scores_em.mean()*100:.1f}% ± {cv_scores_em.std()*100:.1f}%")

# Save model
with open('models/emergency_model.pkl', 'wb') as f:
    pickle.dump(emergency_pipeline, f)
print("💾 Emergency model saved → models/emergency_model.pkl")


# ============================================
#   FINAL SUMMARY
# ============================================
print("\n" + "="*50)
print("  ✅ ALL MODELS TRAINED SUCCESSFULLY")
print("="*50)
print(f"  Emotion Classifier  : {emotion_acc*100:.1f}% accuracy")
print(f"  Emergency Detector  : {emergency_acc*100:.1f}% accuracy")
print(f"  Models saved in     : models/")
print("="*50)
print("\n  Now run: python app.py")
print("  Open Chrome: http://localhost:5000\n")