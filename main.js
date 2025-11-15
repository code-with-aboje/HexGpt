const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const chatHistory = document.querySelector('.chat-history');

// Chat management
let chats = [];
let currentChatId = null;

// Initialize with a default chat on page load
window.addEventListener('DOMContentLoaded', () => {
  loadChatsFromStorage();
  if (chats.length === 0) {
    createNewChat();
  } else {
    switchToChat(chats[0].id);
  }
});

function generateId() {
  return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createNewChat() {
  const newChat = {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date().toISOString()
  };
  
  chats.unshift(newChat); // Add to beginning
  currentChatId = newChat.id;
  
  saveChatsToStorage();
  renderChatHistory();
  renderEmptyState();
  messageInput.focus();
}

function generateChatTitle(firstMessage) {
  // Generate a title from the first message (max 40 chars)
  let title = firstMessage.trim();
  if (title.length > 40) {
    title = title.substring(0, 40) + '...';
  }
  return title || 'New Chat';
}

function saveChatsToStorage() {
  try {
    localStorage.setItem('hexgpt_chats', JSON.stringify(chats));
  } catch (e) {
    console.error('Failed to save chats:', e);
  }
}

function loadChatsFromStorage() {
  try {
    const saved = localStorage.getItem('hexgpt_chats');
    if (saved) {
      chats = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load chats:', e);
    chats = [];
  }
}

function getCurrentChat() {
  return chats.find(chat => chat.id === currentChatId);
}

function switchToChat(chatId) {
  currentChatId = chatId;
  const chat = getCurrentChat();
  
  if (!chat) return;
  
  renderChatHistory();
  renderMessages(chat.messages);
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function deleteChat(chatId, event) {
  event.stopPropagation(); // Prevent switching to the chat
  
  chats = chats.filter(chat => chat.id !== chatId);
  
  // If we deleted the current chat, switch to another or create new
  if (currentChatId === chatId) {
    if (chats.length > 0) {
      switchToChat(chats[0].id);
    } else {
      createNewChat();
    }
  }
  
  saveChatsToStorage();
  renderChatHistory();
}

function renderChatHistory() {
  chatHistory.innerHTML = '';
  
  chats.forEach(chat => {
    // Only show chats that have messages (skip empty "New Chat")
    if (chat.messages.length === 0 && chat.id !== currentChatId) {
      return;
    }
    
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item' + (chat.id === currentChatId ? ' active' : '');
    chatItem.onclick = () => switchToChat(chat.id);
    
    chatItem.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">${chat.title}</span>
        <button class="delete-chat-btn" onclick="deleteChat('${chat.id}', event)" title="Delete chat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
    
    chatHistory.appendChild(chatItem);
  });
}

function renderMessages(messages) {
  chatMessages.innerHTML = '';
  
  if (messages.length === 0) {
    renderEmptyState();
    return;
  }
  
  messages.forEach(msg => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.role}`;
    messageDiv.innerHTML = `
      <div class="message-avatar">${msg.role === 'user' ? 'U' : 'H'}</div>
      <div class="message-content">${msg.content}</div>
    `;
    chatMessages.appendChild(messageDiv);
  });
  
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderEmptyState() {
  chatMessages.innerHTML = `
    <div class="empty-state">
      <div class="hex-logo">
        <img src="../Assets/icon.png" alt="">
      </div>
      <div class="ai_name">
        <h1 class="empty-title">HexGpt</h1>
        <p class="empty-subtitle">Build with bluey</p>
      </div>
    </div>
  `;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function useSuggestion(text) {
  messageInput.value = text;
  messageInput.focus();
}

function newChat() {
  createNewChat();
}

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;
  
  const chat = getCurrentChat();
  if (!chat) return;
  
  // If this is the first message, update the chat title
  if (chat.messages.length === 0) {
    chat.title = generateChatTitle(message);
  }
  
  // Add user message
  chat.messages.push({
    role: 'user',
    content: message
  });
  
  // Clear input
  messageInput.value = '';
  messageInput.style.height = 'auto';
  
  // Render updated messages
  renderMessages(chat.messages);
  renderChatHistory();
  saveChatsToStorage();
  
  // Show typing indicator
  const typingMessage = document.createElement('div');
  typingMessage.className = 'message assistant';
  typingMessage.innerHTML = `
    <div class="message-avatar">H</div>
    <div class="message-content">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  chatMessages.appendChild(typingMessage);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Simulate AI response
  setTimeout(() => {
    typingMessage.remove();
    
    const aiResponse = `This is a demo response from HexGpt. In a real implementation, this would be connected to your AI backend or API to generate actual responses based on: "${message}"`;
    
    // Add AI message to chat
    chat.messages.push({
      role: 'assistant',
      content: aiResponse
    });
    
    renderMessages(chat.messages);
    saveChatsToStorage();
  }, 2000);
}

// User profile dropdown toggle
function toggleUserMenu() {
  const dropdown = document.querySelector('.user-dropdown');
  dropdown.classList.toggle('show');
}

// Handle logout
function handleLogout() {
  if (confirm('Are you sure you want to log out?')) {
    // Clear all chats
    localStorage.removeItem('hexgpt_chats');
    chats = [];
    
    // Reset to initial state
    createNewChat();
    
    alert('Logged out successfully!');
    window.location.href = 'logout.html';
  }
}

// Clear all chats
function clearAllChats() {
  if (confirm('Are you sure you want to clear all chats? This cannot be undone.')) {
    localStorage.removeItem('hexgpt_chats');
    chats = [];
    createNewChat();
  }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.querySelector('.menu-toggle');
  const userProfile = document.querySelector('.user-profile');
  const userDropdown = document.querySelector('.user-dropdown');
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768 &&
    sidebar.classList.contains('open') &&
    !sidebar.contains(e.target) &&
    !menuToggle.contains(e.target)) {
    sidebar.classList.remove('open');
  }
  
  // Close user dropdown if clicking outside
  if (userDropdown && !userProfile.contains(e.target)) {
    userDropdown.classList.remove('show');
  }
});

