// Global variables
let uploadedFiles = [];
let chatMessages = [];
let currentTheme = 'light';

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadedFilesContainer = document.getElementById('uploadedFiles');
const chatMessages_container = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const summaryContent = document.getElementById('summaryContent');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeUpload();
    initializeChat();
    initializeSearch();
    initializeSmoothScrolling();
});

// Theme Management
function initializeTheme() {
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    themeToggle.addEventListener('click', toggleTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
    
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// File Upload Management
function initializeUpload() {
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Prevent default drag behaviors on document
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

function processFiles(files) {
    const validFiles = files.filter(file => {
        const validTypes = ['.pdf', '.docx', '.txt', '.md'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        return validTypes.includes(fileExtension);
    });
    
    if (validFiles.length === 0) {
        showNotification('Please select valid file types (PDF, DOCX, TXT, MD)', 'error');
        return;
    }
    
    validFiles.forEach(file => {
        if (!uploadedFiles.find(f => f.name === file.name)) {
            uploadedFiles.push(file);
            addFileToUI(file);
            processFileContent(file);
        }
    });
    
    showNotification(`${validFiles.length} file(s) uploaded successfully!`, 'success');
}

function addFileToUI(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <div class="file-info">
            <div class="file-icon">
                <i class="${getFileIcon(file.name)}"></i>
            </div>
            <div class="file-details">
                <h4>${file.name}</h4>
                <p>${formatFileSize(file.size)} • ${getFileType(file.name)}</p>
            </div>
        </div>
        <button class="btn btn-small" onclick="removeFile('${file.name}')">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    uploadedFilesContainer.appendChild(fileItem);
}

function removeFile(fileName) {
    uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
    updateUploadedFilesUI();
    showNotification('File removed successfully', 'info');
}

function updateUploadedFilesUI() {
    uploadedFilesContainer.innerHTML = '';
    uploadedFiles.forEach(file => addFileToUI(file));
}

function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'fas fa-file-pdf',
        'docx': 'fas fa-file-word',
        'txt': 'fas fa-file-alt',
        'md': 'fas fa-file-code'
    };
    return iconMap[extension] || 'fas fa-file';
}

function getFileType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    return extension.toUpperCase();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function processFileContent(file) {
    // Simulate file processing and generate summary
    setTimeout(() => {
        generateFileSummary(file);
        addAIMessage(`I've processed "${file.name}". You can now ask me questions about its content!`);
    }, 1000);
}

function generateFileSummary(file) {
    // Simulate AI-generated summary
    const summaries = [
        "This document contains important information about project requirements and specifications. Key topics include implementation guidelines, technical architecture, and delivery timelines.",
        "The document outlines strategic business objectives and market analysis. It covers competitive landscape, target demographics, and growth opportunities.",
        "This file contains technical documentation with code examples, API references, and best practices for development teams.",
        "The document presents research findings and data analysis with statistical insights, trends, and recommendations for future actions."
    ];
    
    const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];
    
    summaryContent.innerHTML = `
        <div class="summary-item">
            <h4><i class="${getFileIcon(file.name)}"></i> ${file.name}</h4>
            <p>${randomSummary}</p>
            <div class="summary-tags">
                <span class="tag">Key Document</span>
                <span class="tag">Processed</span>
            </div>
        </div>
    `;
}

// Chat Management
function initializeChat() {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addUserMessage(message);
    chatInput.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        generateAIResponse(message);
    }, 1000);
}

function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    messageElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    chatMessages_container.appendChild(messageElement);
    scrollToBottom();
}

function addAIMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message ai-message';
    messageElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    chatMessages_container.appendChild(messageElement);
    scrollToBottom();
}

function generateAIResponse(userMessage) {
    // Show typing indicator
    const typingElement = document.createElement('div');
    typingElement.className = 'message ai-message typing';
    typingElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="loading"></div>
        </div>
    `;
    
    chatMessages_container.appendChild(typingElement);
    scrollToBottom();
    
    // Generate response based on user message
    setTimeout(() => {
        chatMessages_container.removeChild(typingElement);
        
        let response = generateContextualResponse(userMessage);
        addAIMessage(response);
    }, 2000);
}

function generateContextualResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (uploadedFiles.length === 0) {
        return "I'd be happy to help! Please upload a document first so I can analyze its content and answer your questions.";
    }
    
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
        return `Based on the uploaded documents, here's a summary: The documents contain valuable information across multiple topics. Key themes include strategic planning, technical implementation, and data analysis. Would you like me to focus on any specific aspect?`;
    }
    
    if (lowerMessage.includes('key points') || lowerMessage.includes('main points')) {
        return `Here are the key points from your documents:\n• Strategic objectives and implementation roadmap\n• Technical specifications and requirements\n• Data insights and analytical findings\n• Recommendations for next steps`;
    }
    
    if (lowerMessage.includes('question') || lowerMessage.includes('?')) {
        return `Great question! Based on the document content, I can provide detailed insights. The information suggests multiple approaches to consider. Would you like me to elaborate on any specific section?`;
    }
    
    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
        return `I can help you search through your documents. Use the semantic search panel on the right to find specific information, or ask me about particular topics you're looking for.`;
    }
    
    // Default responses
    const responses = [
        `That's an interesting point about your document. Based on the content I've analyzed, there are several relevant aspects to consider. Would you like me to dive deeper into any specific area?`,
        `I understand your question about the document content. The information suggests multiple perspectives on this topic. Let me know if you'd like me to focus on particular sections.`,
        `Good question! The documents contain relevant information about this topic. I can provide more detailed analysis if you specify which aspect interests you most.`,
        `Based on my analysis of your uploaded documents, I can see connections to your query. Would you like me to highlight specific sections or provide a broader overview?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function clearChat() {
    const messages = chatMessages_container.querySelectorAll('.message:not(.ai-message:first-child)');
    messages.forEach(message => message.remove());
    showNotification('Chat cleared successfully', 'info');
}

function scrollToBottom() {
    chatMessages_container.scrollTop = chatMessages_container.scrollHeight;
}

// Search Management
function initializeSearch() {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    if (uploadedFiles.length === 0) {
        searchResults.innerHTML = '<p class="placeholder">Please upload documents first to enable search.</p>';
        return;
    }
    
    // Show loading
    searchResults.innerHTML = '<div class="loading"></div>';
    
    // Simulate search
    setTimeout(() => {
        const results = generateSearchResults(query);
        displaySearchResults(results);
    }, 1500);
}

function generateSearchResults(query) {
    // Simulate search results
    const mockResults = [
        {
            file: uploadedFiles[0]?.name || 'Document 1.pdf',
            snippet: `...relevant content about ${query} can be found in this section. The document discusses important aspects related to your search query...`,
            relevance: 95
        },
        {
            file: uploadedFiles[1]?.name || 'Document 2.docx',
            snippet: `...additional information regarding ${query} is mentioned here. This provides context and supporting details...`,
            relevance: 87
        },
        {
            file: uploadedFiles[0]?.name || 'Document 1.pdf',
            snippet: `...further references to ${query} appear in the conclusion section, offering insights and recommendations...`,
            relevance: 78
        }
    ];
    
    return mockResults.slice(0, Math.min(3, uploadedFiles.length));
}

function displaySearchResults(results) {
    if (results.length === 0) {
        searchResults.innerHTML = '<p class="placeholder">No results found for your search query.</p>';
        return;
    }
    
    const resultsHTML = results.map(result => `
        <div class="search-result-item">
            <div class="result-header">
                <h4><i class="${getFileIcon(result.file)}"></i> ${result.file}</h4>
                <span class="relevance">${result.relevance}% match</span>
            </div>
            <p class="result-snippet">${result.snippet}</p>
        </div>
    `).join('');
    
    searchResults.innerHTML = resultsHTML;
}

// Utility Functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function initializeSmoothScrolling() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles for notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--surface-glass);
        backdrop-filter: blur(10px);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 1rem;
        max-width: 300px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 20px var(--shadow);
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-primary);
    }
    
    .notification-close {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: all 0.3s ease;
    }
    
    .notification-close:hover {
        background: var(--border);
        color: var(--text-primary);
    }
    
    .notification-success .notification-content i {
        color: #10b981;
    }
    
    .notification-error .notification-content i {
        color: #ef4444;
    }
    
    .notification-warning .notification-content i {
        color: #f59e0b;
    }
    
    .notification-info .notification-content i {
        color: var(--primary-color);
    }
    
    .search-result-item {
        padding: 1rem;
        border-bottom: 1px solid var(--border);
        transition: background-color 0.3s ease;
    }
    
    .search-result-item:hover {
        background: var(--surface);
    }
    
    .search-result-item:last-child {
        border-bottom: none;
    }
    
    .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .result-header h4 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .relevance {
        font-size: 0.75rem;
        color: var(--primary-color);
        font-weight: 600;
    }
    
    .result-snippet {
        font-size: 0.875rem;
        color: var(--text-secondary);
        line-height: 1.5;
    }
    
    .summary-item {
        padding: 1rem 0;
    }
    
    .summary-item h4 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        color: var(--text-primary);
        font-size: 1rem;
    }
    
    .summary-item p {
        color: var(--text-secondary);
        line-height: 1.6;
        margin-bottom: 1rem;
    }
    
    .summary-tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .tag {
        background: var(--primary-color);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
    }
`;

document.head.appendChild(notificationStyles);

// Initialize demo content
function initializeDemoContent() {
    // Add some demo search results if no files are uploaded
    setTimeout(() => {
        if (uploadedFiles.length === 0) {
            summaryContent.innerHTML = `
                <div class="demo-content">
                    <p class="placeholder">Upload documents to see AI-generated summaries here.</p>
                    <div class="demo-features">
                        <h4>Summary Features:</h4>
                        <ul>
                            <li>Key points extraction</li>
                            <li>Topic identification</li>
                            <li>Content categorization</li>
                            <li>Relevance scoring</li>
                        </ul>
                    </div>
                </div>
            `;
        }
    }, 1000);
}

// Call demo initialization
initializeDemoContent();

// Export functions for global access
window.scrollToSection = scrollToSection;
window.sendMessage = sendMessage;
window.clearChat = clearChat;
window.performSearch = performSearch;
window.removeFile = removeFile;
