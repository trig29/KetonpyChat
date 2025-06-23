from config import DEEPSEEK_API_KEY, SYSTEM_PROMPT
from history_manager import add_message, get_history
import requests

DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

def build_messages(system_prompt, history, user_message):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})
    return messages

def chat_with_deepseek(user_message, user_id):
    chat_history = get_history(user_id)
    system_prompt = SYSTEM_PROMPT.get(str(user_id), "")
    # print(f"CONSOLE_LOG: {system_prompt}")
    messages = build_messages(system_prompt, chat_history, user_message)

    payload = {
        "model": "deepseek-chat",
        "messages": messages,
        "temperature": 0.7
    }
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(DEEPSEEK_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        assistant_message = result["choices"][0]["message"]["content"]
    except requests.RequestException as e:
        return {"error": True, "message": f"请求失败: {e}"}

    add_message(user_id, "user", user_message)
    add_message(user_id, "assistant", assistant_message)

    return assistant_message

def get_summary(user_id):
    full_history = get_history(user_id)
    chat_history = full_history[:-10]

    summarize_messages = [
        {"role": "system", "content": "你是一个总结助手。请将下面的对话总结成200字的摘要，供未来继续对话使用。要求：总结内容客观真实，保留部分必要细节。"}
    ]
    summarize_messages.extend(chat_history)
    summarize_messages.append({"role": "user", "content": "请将以上对话内容总结为一段简洁的摘要，包含关键信息。"})

    payload = {
        "model": "deepseek-chat",
        "messages": summarize_messages,
        "temperature": 0.7
    }
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(DEEPSEEK_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except requests.RequestException as e:
        return {"error": True, "message": f"请求失败: {e}"}
