import os
import json

CHATLOG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "chatlogs"))
os.makedirs(CHATLOG_DIR, exist_ok=True)

def _get_chatlog_path(user_id):
    return os.path.join(CHATLOG_DIR, f"{user_id}.json")

def load_history(user_id):
    path = _get_chatlog_path(user_id)
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_history(user_id, history):
    path = _get_chatlog_path(user_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

def add_message(user_id, role, message):
    history = load_history(user_id)
    history.append({"role": role, "content": message})
    save_history(user_id, history)

def clear_history(user_id):
    save_history(user_id, [])

def get_history(user_id):
    return load_history(user_id)

def reduce_history(user_id):
    from backend.service.deepseek_chat import get_summary
    full_history = load_history(user_id)

    if len(full_history) <= 10:
        return
    summary = get_summary(user_id)
    recent = full_history[-10:]
    new_history = [{"role": "user", "content": f"[摘要]以下是此前对话的总结，请参考继续对话：{summary}"}] + recent
    save_history(user_id, new_history)
