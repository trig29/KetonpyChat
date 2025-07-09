from flask import Flask, request, jsonify, redirect, url_for, session, render_template
from backend.service.deepseek_chat import chat_with_deepseek
from backend.service.history_manager import clear_history, reduce_history, get_history
import os
import hmac
import hashlib
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend'))

app = Flask(
    __name__,
    static_folder=os.path.join(FRONTEND_DIR, 'static'),
    template_folder=os.path.join(FRONTEND_DIR, 'templates'),
    static_url_path='/static'
)
app.secret_key = os.environ.get('SECRET_KEY', '31415926ssssbbbb')

WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', '111').encode('utf-8')

# Webhook自动部署路由
@app.route('/webhook', methods=['POST'])
def webhook():
    # 验证签名
    secret = WEBHOOK_SECRET
    signature = request.headers.get('X-Hub-Signature-256', '').split('sha256=')[-1].strip()
    payload = request.data
    
    # 计算签名
    computed_signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    
    if not hmac.compare_digest(signature, computed_signature):
        return jsonify({"error": "Invalid signature"}), 403
    
    # 执行部署脚本
    try:
        subprocess.run(["/var/www/KetonpyChat/deploy.sh"], check=True)
        return jsonify({"status": "success"}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"error": str(e)}), 500

# 登录路由 - 验证token并设置user_id
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        token = request.form.get('token')
        # 在实际应用中这里应该验证token有效性
        # 这里我们直接将token作为user_id使用
        session['user_id'] = token
        return redirect(url_for('chat'))
    return render_template('login.html')

# 主聊天页面
@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/chat')
def chat():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')

# 处理消息发送
@app.route('/send_message', methods=['POST'])
def send_message():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user_id = session['user_id']
    data = request.get_json()
    message = data.get('message')
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    response = chat_with_deepseek(message, user_id)
    
    if isinstance(response, dict) and response.get('error'):
        return jsonify(response), 500
    
    return jsonify({'response': response})

# 清除聊天历史
@app.route('/clear_history', methods=['POST'])
def clear_chat_history():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user_id = session['user_id']
    clear_history(user_id)
    return jsonify({'status': 'success'})

# 精简聊天历史
@app.route('/reduce_history', methods=['POST'])
def reduce_chat_history():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user_id = session['user_id']
    reduce_history(user_id)
    
    # 返回精简后的历史记录
    history = get_history(user_id)
    return jsonify({'history': history})

# 获取历史记录
@app.route('/get_history', methods=['GET'])
def get_chat_history():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user_id = session['user_id']
    history = get_history(user_id)
    return jsonify({'history': history})

# 登出路由
@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)