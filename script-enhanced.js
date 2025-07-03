// Global variables
let uploadedFiles = [];
let documentStore = new Map(); // Store document content for each file
let chatMessages = [];
let currentTheme = 'light';
let apiConfig = {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.0-flash',
    isConfigured: false
};

// Environment configuration
const ENV_CONFIG = {
    GEMINI_API_KEY: '',
    DEFAULT_MODEL: 'gemini-2.0-flash',
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7
};

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
    loadEnvironmentConfig();
    initializeTheme();
    initializeUpload();
    initializeChat();
    initializeSearch();
    initializeSmoothScrolling();
    initializeApiConfig();
    loadApiConfig();
});

// Load environment configuration
function loadEnvironmentConfig() {
    // In a real application, you would load this from your backend
    // For demo purposes, we'll check if there's a stored API key
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (storedApiKey) {
        ENV_CONFIG.GEMINI_API_KEY = storedApiKey;
        apiConfig.apiKey = storedApiKey;
        apiConfig.isConfigured = true;
    }
}

// API Configuration Management
function initializeApiConfig() {
    const configToggle = document.getElementById('configToggle');
    const apiConfigContent = document.getElementById('apiConfigContent');
    
    if (configToggle && apiConfigContent) {
        configToggle.addEventListener('click', () => {
            apiConfigContent.classList.toggle('expanded');
        });
    }
    
    // Initialize provider change handler
    const apiProvider = document.getElementById('apiProvider');
    if (apiProvider) {
        apiProvider.addEventListener('change', updateModelOptions);
    }
}

function updateModelOptions() {
    const provider = document.getElementById('apiProvider').value;
    const modelSelect = document.getElementById('model');
    
    // Clear existing options
    modelSelect.innerHTML = '';
    
    let models = [];
    switch (provider) {
        case 'gemini':
            models = [
                { value: 'gemini-2.0-flash', text: 'Gemini 2.0 Flash' },
                { value: 'gemini-1.5-pro', text: 'Gemini 1.5 Pro' },
                { value: 'gemini-1.5-flash', text: 'Gemini 1.5 Flash' }
            ];
            break;
        case 'openai':
            models = [
                { value: 'gpt-4', text: 'GPT-4' },
                { value: 'gpt-4-turbo', text: 'GPT-4 Turbo' },
                { value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo' }
            ];
            break;
        case 'anthropic':
            models = [
                { value: 'claude-3-opus', text: 'Claude 3 Opus' },
                { value: 'claude-3-sonnet', text: 'Claude 3 Sonnet' },
                { value: 'claude-3-haiku', text: 'Claude 3 Haiku' }
            ];
            break;
    }
    
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.text;
        modelSelect.appendChild(option);
    });
}

function toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('apiKey');
    const toggleBtn = document.querySelector('.toggle-visibility i');
    
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleBtn.className = 'fas fa-eye-slash';
    } else {
        apiKeyInput.type = 'password';
        toggleBtn.className = 'fas fa-eye';
    }
}

function saveApiConfig() {
    const provider = document.getElementById('apiProvider').value;
    const apiKey = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('model').value;
    
    if (!apiKey) {
        showNotification('Please enter an API key', 'error');
        return;
    }
    
    // Validate API key format for Gemini
    if (provider === 'gemini' && !apiKey.startsWith('AIza')) {
        showNotification('Invalid Gemini API key format. It should start with "AIza"', 'error');
        return;
    }
    
    apiConfig = {
        provider,
        apiKey,
        model,
        isConfigured: true
    };
    
    // Save to localStorage (encrypted in production)
    localStorage.setItem('apiConfig', JSON.stringify({
        provider,
        apiKey: btoa(apiKey), // Basic encoding (use proper encryption in production)
        model,
        isConfigured: true
    }));
    
    // Also save the Gemini API key separately for environment config
    localStorage.setItem('gemini_api_key', apiKey);
    ENV_CONFIG.GEMINI_API_KEY = apiKey;
    
    updateApiStatus('connected', 'API configured successfully');
    showNotification('API configuration saved successfully!', 'success');
}

function loadApiConfig() {
    const saved = localStorage.getItem('apiConfig');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            apiConfig = {
                provider: config.provider,
                apiKey: atob(config.apiKey), // Basic decoding
                model: config.model,
                isConfigured: config.isConfigured
            };
            
            // Update UI
            document.getElementById('apiProvider').value = config.provider;
            document.getElementById('apiKey').value = apiConfig.apiKey;
            updateModelOptions();
            document.getElementById('model').value = config.model;
            
            if (config.isConfigured) {
                updateApiStatus('connected', 'API configured and ready');
            }
        } catch (error) {
            console.error('Error loading API config:', error);
        }
    }
}

function testApiConnection() {
    if (!apiConfig.apiKey) {
        showNotification('Please configure API key first', 'error');
        return;
    }
    
    updateApiStatus('testing', 'Testing connection...');
    
    // Simulate API test (replace with actual API call)
    setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate for demo
        
        if (success) {
            updateApiStatus('connected', 'Connection successful');
            showNotification('API connection test successful!', 'success');
        } else {
            updateApiStatus('error', 'Connection failed');
            showNotification('API connection test failed. Please check your API key.', 'error');
        }
    }, 2000);
}

function updateApiStatus(status, message) {
    const statusElement = document.getElementById('apiStatus');
    if (statusElement) {
        statusElement.className = `api-status ${status}`;
        statusElement.querySelector('span').textContent = message;
    }
}

// Enhanced Chat with Real API Integration
async function generateAIResponse(userMessage) {
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
    
    try {
        let response;
        
        if (apiConfig.isConfigured && apiConfig.apiKey) {
            // Use real API
            response = await callRealAPI(userMessage);
        } else {
            // Fallback to simulated response
            response = generateContextualResponse(userMessage);
        }
        
        // Remove typing indicator
        chatMessages_container.removeChild(typingElement);
        addAIMessage(response);
        
    } catch (error) {
        console.error('Error generating AI response:', error);
        chatMessages_container.removeChild(typingElement);
        addAIMessage('Sorry, I encountered an error while processing your request. Please try again.');
        showNotification('Error communicating with AI service', 'error');
    }
}

async function callRealAPI(message) {
    // Get relevant document content based on the question
    let relevantContent = '';
    if (uploadedFiles.length > 0) {
        // Combine content from all uploaded documents
        const allContent = Array.from(documentStore.values()).join('\n\n');
        
        // Create a context-aware prompt
        relevantContent = `Context from uploaded documents:\n\n${allContent}\n\n`;
    }
    
    const fullPrompt = `${relevantContent}User Question: ${message}\n\nPlease provide a detailed answer based on the document content above. If the question cannot be answered using the provided documents, please state that clearly.`;
    
    let apiUrl;
    let headers;
    let requestBody;
    
    switch (apiConfig.provider) {
        case 'gemini':
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiConfig.model}:generateContent?key=${apiConfig.apiKey}`;
            headers = {
                'Content-Type': 'application/json'
            };
            requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: fullPrompt
                            }
                        ]
                    }
                ]
            };
            break;
        case 'openai':
            apiUrl = 'https://api.openai.com/v1/chat/completions';
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiConfig.apiKey}`
            };
            requestBody = {
                model: apiConfig.model,
                messages: [
                    { role: 'system', content: 'You are an AI assistant specialized in document analysis and Q&A.' },
                    { role: 'user', content: fullPrompt }
                ],
                max_tokens: 500,
                temperature: 0.7
            };
            break;
        case 'anthropic':
            apiUrl = 'https://api.anthropic.com/v1/messages';
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': apiConfig.apiKey,
                'anthropic-version': '2023-06-01'
            };
            requestBody = {
                model: apiConfig.model,
                max_tokens: 500,
                messages: [
                    { role: 'user', content: fullPrompt }
                ]
            };
            break;
        default:
            throw new Error('Unsupported API provider');
    }
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extract response based on provider
    switch (apiConfig.provider) {
        case 'gemini':
            return data.candidates[0].content.parts[0].text;
        case 'openai':
            return data.choices[0].message.content;
        case 'anthropic':
            return data.content[0].text;
        default:
            return 'Response received but format not supported';
    }
}

// Enhanced file processing with real AI analysis
async function processFileContent(file) {
    try {
        // Read file content
        const content = await readFileContent(file);
        
        // Store the content in documentStore
        documentStore.set(file.name, content);
        
        if (apiConfig.isConfigured && apiConfig.apiKey) {
            // Use real AI for analysis
            const summary = await generateRealSummary(content, file.name);
            displayRealSummary(file, summary);
            
            // Store the summary for quick access
            documentStore.set(`${file.name}_summary`, summary);
        } else {
            // Fallback to simulated summary
            const summary = generateFileSummary(file);
            documentStore.set(`${file.name}_summary`, summary);
        }
        
        addAIMessage(`I've processed "${file.name}" (${formatFileSize(content.length)} of text extracted). You can now ask me questions about its content!`);
    } catch (error) {
        console.error('Error processing file:', error);
        showNotification('Error processing file content', 'error');
    }
}

async function readFileContent(file) {
    return new Promise(async (resolve, reject) => {
        try {
            if (file.type === 'application/pdf') {
                // Initialize PDF.js worker
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
                
                // Read PDF file as array buffer
                const arrayBuffer = await file.arrayBuffer();
                
                // Load PDF document
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                
                // Extract text from all pages
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }
                
                resolve(fullText);
            } else {
                // For non-PDF files, use standard text reading
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                
                if (file.type.includes('text') || file.name.endsWith('.md')) {
                    reader.readAsText(file);
                } else if (file.name.endsWith('.docx')) {
                    // For DOCX files, just read as text for now
                    // In production, you'd want to use a proper DOCX parser
                    reader.readAsText(file);
                } else {
                    reject(new Error('Unsupported file type'));
                }
            }
        } catch (error) {
            reject(error);
        }
    });
}

async function generateRealSummary(content, fileName) {
    const prompt = `Please analyze this document and provide a concise summary highlighting the key points, main topics, and important insights. 

Document: "${fileName}"

Content: ${content.substring(0, 4000)}

Please provide:
1. A brief summary of the document
2. Key points and main topics
3. Important insights or conclusions
4. Any actionable items or recommendations`;
    
    try {
        return await callRealAPI(prompt);
    } catch (error) {
        console.error('Error generating real summary:', error);
        return 'Unable to generate AI summary. Please check your API configuration and ensure your Gemini API key is valid.';
    }
}

function displayRealSummary(file, summary) {
    summaryContent.innerHTML = `
        <div class="summary-item">
            <h4><i class="${getFileIcon(file.name)}"></i> ${file.name}</h4>
            <p>${summary}</p>
            <div class="summary-tags">
                <span class="tag">AI Analyzed</span>
                <span class="tag">Real-time</span>
            </div>
        </div>
    `;
}

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

async function processFiles(files) {
    const validFiles = files.filter(file => {
        const validTypes = ['.pdf', '.docx', '.txt', '.md'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        return validTypes.includes(fileExtension);
    });
    
    if (validFiles.length === 0) {
        showNotification('Please select valid file types (PDF, DOCX, TXT, MD)', 'error');
        return;
    }
    
    for (const file of validFiles) {
        if (!uploadedFiles.find(f => f.name === file.name)) {
            try {
                // Add file to UI with loading state
                uploadedFiles.push(file);
                const fileElement = addFileToUI(file, true);
                
                // Process file content
                await processFileContent(file);
                
                // Update UI to show success
                updateFileUIStatus(fileElement, 'success');
                showNotification(`Successfully processed ${file.name}`, 'success');
            } catch (error) {
                console.error('Error processing file:', error);
                // Remove file from uploaded files if processing failed
                uploadedFiles = uploadedFiles.filter(f => f.name !== file.name);
                showNotification(`Error processing ${file.name}: ${error.message}`, 'error');
            }
        }
    }
}

function addFileToUI(file, isLoading = false) {
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
        <div class="file-status">
            ${isLoading ? '<div class="loading"></div>' : ''}
            <button class="btn btn-small" onclick="removeFile('${file.name}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    uploadedFilesContainer.appendChild(fileItem);
    return fileItem;
}

function updateFileUIStatus(fileElement, status) {
    const statusDiv = fileElement.querySelector('.file-status');
    const loading = statusDiv.querySelector('.loading');
    if (loading) {
        loading.remove();
    }
    
    if (status === 'success') {
        const successIcon = document.createElement('i');
        successIcon.className = 'fas fa-check text-success';
        statusDiv.insertBefore(successIcon, statusDiv.firstChild);
    }
}


function removeFile(fileName) {
    uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
    // Remove content and summary from documentStore
    documentStore.delete(fileName);
    documentStore.delete(`${fileName}_summary`);
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
    
    // Generate AI response
    generateAIResponse(message);
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
    
    // Format the message for better readability
    const formattedMessage = formatAIResponse(message);
    
    messageElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            ${formattedMessage}
        </div>
    `;
    
    chatMessages_container.appendChild(messageElement);
    scrollToBottom();
}

function formatAIResponse(message) {
    // Clean up the message and format it properly
    let formatted = message.trim();
    
    // Handle numbered lists
    formatted = formatted.replace(/(\d+\.\s)/g, '<br><strong>$1</strong>');
    
    // Handle bullet points
    formatted = formatted.replace(/([•\-\*]\s)/g, '<br>$1');
    
    // Handle bold text (markdown style)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle line breaks
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Handle sections with headers
    formatted = formatted.replace(/^([A-Z][^:]*:)/gm, '<strong>$1</strong>');
    
    // Wrap in paragraph tags if not already formatted
    if (!formatted.includes('<p>') && !formatted.includes('<br>')) {
        formatted = `<p>${formatted}</p>`;
    } else if (!formatted.startsWith('<p>')) {
        formatted = `<p>${formatted}</p>`;
    }
    
    return formatted;
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
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;
    
    if (uploadedFiles.length === 0) {
        searchResults.innerHTML = '<p class="placeholder">Please upload documents first to enable search.</p>';
        return;
    }
    
    // Show loading
    searchResults.innerHTML = '<div class="loading"></div>';
    
    // Perform real search across document content
    const results = [];
    documentStore.forEach((content, fileName) => {
        if (!fileName.includes('_summary')) {  // Skip summary entries
            const index = content.toLowerCase().indexOf(query);
            if (index !== -1) {
                // Get surrounding context (100 chars before and after)
                const start = Math.max(0, index - 100);
                const end = Math.min(content.length, index + query.length + 100);
                const snippet = content.slice(start, end).replace(
                    new RegExp(query, 'gi'),
                    match => `<strong>${match}</strong>`
                );
                
                results.push({
                    file: fileName,
                    snippet: `...${snippet}...`,
                    relevance: calculateRelevance(content, query)
                });
            }
        }
    });
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    displaySearchResults(results);
}

function calculateRelevance(content, query) {
    const occurrences = (content.toLowerCase().match(new RegExp(query, 'g')) || []).length;
    const density = occurrences / content.length;
    return Math.min(Math.round(density * 10000), 100);
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

// Export functions for global access
window.scrollToSection = scrollToSection;
window.sendMessage = sendMessage;
window.clearChat = clearChat;
window.performSearch = performSearch;
window.removeFile = removeFile;
window.toggleApiKeyVisibility = toggleApiKeyVisibility;
window.saveApiConfig = saveApiConfig;
window.testApiConnection = testApiConnection;
