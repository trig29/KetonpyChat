from deepseek_chat import chat_with_deepseek
from history_manager import reduce_history, clear_history

user_id = 1
while True:
    print("请选择操作: 1-正常聊天 2-精简聊天记录 3-清理聊天记录 4-切换用户 5-结束运行")
    choice = input("输入选项: ")
    match choice:
        case "1":
            user_message = input("User: ")
            print(f"Assistant: {chat_with_deepseek(user_message, user_id)}")
        case "2":
            reduce_history(user_id)
        case "3":
            clear_history(user_id)
        case "4":
            user_id = int(input("User_id: "))
        case "5":
            print("程序结束。")
            break
