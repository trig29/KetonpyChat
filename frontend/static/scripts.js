document.addEventListener('DOMContentLoaded', function() {
    // ==================================================================
    // 定义和启用 marked.js 的 LaTeX 扩展
    // ==================================================================
    if (window.marked && window.katex) {
        const latexExtension = {
            name: 'latex',
            level: 'inline', // 处理行内和块级
            
            // Tokenizer: 用于识别 LaTeX 语法的正则表达式
            tokenizer(src) {
                // 块级公式 $$...$$
                const blockRule = /^\s*\$\$((?:[^\$]|\$[^\$])+?)\$\$\s*(?:\n|$)/;
                let match = blockRule.exec(src);
                if (match) {
                    return {
                        type: 'latex',
                        raw: match[0],
                        text: match[1].trim(),
                        displayMode: true // 标记为块级显示
                    };
                }

                // 行内公式 $...$
                const inlineRule = /^\$((?:[^\$]|\$[^\$])+?)\$/;
                match = inlineRule.exec(src);
                if (match) {
                    return {
                        type: 'latex',
                        raw: match[0],
                        text: match[1].trim(),
                        displayMode: false // 标记为行内显示
                    };
                }
            },
            
            // Renderer: 将识别到的 token 转换为 HTML
            renderer(token) {
                try {
                    // 调用 KaTeX 将 LaTeX 字符串渲染为 HTML
                    return katex.renderToString(token.text, {
                        displayMode: token.displayMode,
                        throwOnError: false // 非常重要：如果公式有错，不抛出异常，而是显示错误信息
                    });
                } catch (e) {
                    console.error('KaTeX rendering error:', e);
                    // 如果渲染出错，返回原始文本并附带错误提示
                    return `<span style="color: red;">LaTeX Error: ${e.message}</span><br><code>${token.raw}</code>`;
                }
            }
        };

        // 将扩展应用到 marked
        marked.use({ extensions: [latexExtension] });
    }
    // ==================================================================

    // 登录页面逻辑
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const token = document.getElementById('token').value;
            
            console.log('提交的访问令牌:', token);

            if (token.trim() === '') {
                alert('请输入访问令牌');
                return;
            }
            
            // 存储token并跳转
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `token=${encodeURIComponent(token)}`
            })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                }
            })
            .catch(error => {
                console.error('登录错误:', error);
                alert('登录失败，请重试');
            });
        });
    }
    
    // 聊天页面逻辑
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const reduceHistoryBtn = document.getElementById('reduce-history-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const menuToggleBtn = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mobileOverlay = document.querySelector('.mobile-overlay');

    if (messageInput) {
        // 自动调整输入框高度
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            if (this.scrollHeight > 200) {
                this.style.overflowY = 'auto';
            } else {
                this.style.overflowY = 'hidden';
            }
        });
        
        // 发送消息
        function sendMessage() {
            const message = messageInput.value.trim();
            if (message === '') return;
            
            // 添加用户消息到界面
            addMessageToUI('user', message);
            
            // 清空输入框
            messageInput.value = '';
            messageInput.style.height = 'auto';
            messageInput.focus();
            
            // 显示加载状态
            addLoadingIndicator();
            
            // 发送到后端
            fetch('/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            })
            .then(response => response.json())
            .then(data => {
                // 移除加载状态
                removeLoadingIndicator();
                
                if (data.error) {
                    addMessageToUI('assistant', `错误: ${data.message}`);
                } else {
                    addMessageToUI('assistant', data.response);
                }
            })
            .catch(error => {
                removeLoadingIndicator();
                addMessageToUI('assistant', `请求失败: ${error.message}`);
            });
        }
        
        // 发送按钮点击事件
        sendBtn.addEventListener('click', sendMessage);
        
        // 按Enter发送消息，Shift+Enter换行
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (menuToggleBtn) {
        function closeMenu() {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('active');
        }

        menuToggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            mobileOverlay.classList.toggle('active');
        });

        mobileOverlay.addEventListener('click', closeMenu);
    }

/*  旧函数
    // 添加消息到UI
    function addMessageToUI(role, content) {
        // 移除欢迎消息
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        const roleClass = role === 'assistant' ? 'ai-message' : 'user-message';
        messageDiv.className = `message ${roleClass}`;
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        const icon = document.createElement('i');
        icon.className = role === 'assistant' ? 'fas fa-robot' : 'fas fa-user';
        const headerText = document.createElement('strong');
        headerText.textContent = role === 'assistant' ? 'DeepSeek助手' : '您';
        messageHeader.appendChild(icon);
        messageHeader.appendChild(headerText);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        messageDiv.appendChild(messageHeader);
        messageDiv.appendChild(messageContent);
        
        chatMessages.appendChild(messageDiv);
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
*/
    // 添加消息到UI（支持Markdown版本）
    function addMessageToUI(role, content) {
    // 移除欢迎消息
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        const messageDiv = document.createElement('div');
        const roleClass = role === 'assistant' ? 'ai-message' : 'user-message';
        messageDiv.className = `message ${roleClass}`;
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';

        const icon = document.createElement('i');
        icon.className = role === 'assistant' ? 'fas fa-robot' : 'fas fa-user';
        const headerText = document.createElement('strong');
        headerText.textContent = role === 'assistant' ? 'DeepSeek助手' : '您';
        messageHeader.appendChild(icon);
        messageHeader.appendChild(headerText);

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // --- 修改开始 ---
        if (role === 'assistant') {
            // 1. 使用 marked.js 将 Markdown 字符串解析为 HTML
            const unsafeHtml = marked.parse(content);
            // 2. 使用 DOMPurify 清理 HTML，防止 XSS 攻击
            messageContent.innerHTML = DOMPurify.sanitize(unsafeHtml);
        } else {
            // 用户的消息仍然使用 textContent，以纯文本显示
            messageContent.textContent = content;
        }
        // --- 修改结束 ---

        messageDiv.appendChild(messageHeader);
        messageDiv.appendChild(messageContent);

        chatMessages.appendChild(messageDiv);

        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    // 添加加载指示器
    function addLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai-message';
        loadingDiv.id = 'loading-indicator';
        
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-robot';
        
        const headerText = document.createElement('strong');
        headerText.textContent = 'DeepSeek助手';
        
        messageHeader.appendChild(icon);
        messageHeader.appendChild(headerText);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = '<div class="loading-dots"><span>.</span><span>.</span><span>.</span></div>';
        
        loadingDiv.appendChild(messageHeader);
        loadingDiv.appendChild(messageContent);
        
        chatMessages.appendChild(loadingDiv);
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 移除加载指示器
    function removeLoadingIndicator() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
    
    // 清除历史
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            if (confirm('确定要清除所有聊天历史吗？此操作不可撤销。')) {
                fetch('/clear_history', {
                    method: 'POST'
                })
                .then(() => {
                    // 清空聊天界面
                    chatMessages.innerHTML = `
                        <div class="welcome-message">
                            <h2>聊天历史已清除</h2>
                            <p>开始新的对话</p>
                        </div>
                    `;
                })
                .catch(error => {
                    console.error('清除历史错误:', error);
                    alert('清除历史失败');
                });
            }
        });
    }
    
    // 精简历史
    if (reduceHistoryBtn) {
        reduceHistoryBtn.addEventListener('click', function() {
            fetch('/reduce_history', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.history) {
                    // 清空聊天界面
                    chatMessages.innerHTML = '';
                    
                    // 添加精简后的历史
                    data.history.forEach(msg => {
                        if (msg.role !== 'system') {
                            addMessageToUI(msg.role, msg.content);
                        }
                    });
                    
                    // 添加成功提示
                    const notice = document.createElement('div');
                    notice.className = 'message ai-message';
                    notice.innerHTML = `
                        <div class="message-content">
                            <p><i class="fas fa-check-circle"></i> 聊天历史已精简，保留了最近的对话</p>
                        </div>
                    `;
                    chatMessages.appendChild(notice);
                }
            })
            .catch(error => {
                console.error('精简历史错误:', error);
                alert('精简历史失败');
            });
        });
    }
    
    // 新对话
    if (newChatBtn) {
        newChatBtn.addEventListener('click', function() {
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <h2>开始新的对话</h2>
                    <p>输入消息开始与DeepSeek助手交流</p>
                </div>
            `;
        });
    }
    
    // 退出登录
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            fetch('/logout', {
                method: 'POST'
            })
            .then(() => {
                window.location.href = '/login';
            })
            .catch(error => {
                console.error('退出错误:', error);
            });
        });
    }
    
    // 初始加载时获取历史记录
    if (chatMessages) {
        fetch('/get_history')
        .then(response => response.json())
        .then(data => {
            if (data.history && data.history.length > 0) {
                // 清空欢迎消息
                const welcomeMessage = document.querySelector('.welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.remove();
                }
                
                // 添加历史消息
                data.history.forEach(msg => {
                    if (msg.role !== 'system') {
                        addMessageToUI(msg.role, msg.content);
                    }
                });
            }
        })
        .catch(error => {
            console.error('获取历史错误:', error);
        });
    }
});