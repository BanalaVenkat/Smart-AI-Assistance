const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');

let messageHistory = [];

chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.requestSubmit();
    }
});

newChatBtn.addEventListener('click', () => {
    chatMessages.innerHTML = `
        <div class="message ai">
            <div class="avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="message-content">New session started. What can I help you build?</div>
        </div>
    `;
    messageHistory = [];
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = chatInput.value.trim();
    if (!userText) return;

    chatInput.value = '';
    chatInput.style.height = 'auto';

    appendMessage(userText, 'user');
    messageHistory.push({ role: "user", content: userText });

    setLoadingState(true);
    const typingElement = appendTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: messageHistory })
        });

        typingElement.remove();

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        
        // Validate response structure safely
        if (!data || typeof data.reply !== 'string') {
            throw new Error("Malformed response received from server.");
        }

        appendMessage(data.reply, 'ai');
        messageHistory.push({ role: "assistant", content: data.reply });

    } catch (error) {
        console.error("Communication Error:", error);
        typingElement.remove();
        appendMessage(`⚠️ Error: ${error.message}`, 'error');
    } finally {
        setLoadingState(false);
    }
});

function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('avatar');
    avatarDiv.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : 
                          sender === 'error' ? '<i class="fa-solid fa-triangle-exclamation"></i>' : 
                          '<i class="fa-solid fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.textContent = text; // Safe rendering against XSS

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'ai');

    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('avatar');
    avatarDiv.innerHTML = '<i class="fa-solid fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

function setLoadingState(isLoading) {
    sendBtn.disabled = isLoading;
    chatInput.disabled = isLoading;
}
