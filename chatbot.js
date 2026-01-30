/* ===================================
   CACTUS COMUNIDAD CREATIVA
   Chatbot con IA
   =================================== */

class CactusBot {
    constructor() {
        this.container = document.getElementById('chatbot');
        this.toggle = document.getElementById('chatbotToggle');
        this.window = document.getElementById('chatbotWindow');
        this.messagesContainer = document.getElementById('chatbotMessages');
        this.input = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendMessage');
        this.isOpen = false;

        this.init();
    }

    init() {
        // Toggle chatbot
        this.toggle.addEventListener('click', () => this.toggleChat());

        // Send message on button click
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // Send message on Enter key
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Quick replies
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-reply')) {
                this.handleQuickReply(e.target.dataset.message);
            }
        });

        // Update initial greeting based on language
        this.updateGreeting();
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.container.classList.toggle('open', this.isOpen);

        if (this.isOpen) {
            this.input.focus();
        }
    }

    updateGreeting() {
        const lang = getCurrentLang();
        const chatbotData = TRANSLATIONS[lang].chatbot;

        // Update chatbot name and status
        const nameEl = this.window.querySelector('.chatbot-name');
        const statusEl = this.window.querySelector('.chatbot-status .status-text');
        const inputEl = this.input;

        if (nameEl) nameEl.textContent = chatbotData.name;
        if (statusEl) statusEl.textContent = chatbotData.status;
        if (inputEl) inputEl.placeholder = chatbotData.placeholder;

        // Update greeting message
        const firstMessage = this.messagesContainer.querySelector('.message.bot .message-content');
        if (firstMessage) {
            const greeting = chatbotData.greeting.split('\n\n');
            firstMessage.innerHTML = greeting.map(p => `<p>${p}</p>`).join('');
        }

        // Update quick replies
        this.updateQuickReplies(chatbotData.quickReplies);
    }

    updateQuickReplies(replies) {
        const quickRepliesContainer = this.messagesContainer.querySelector('.quick-replies');
        if (quickRepliesContainer && replies) {
            quickRepliesContainer.innerHTML = replies.map(reply =>
                `<button class="quick-reply" data-message="${reply}">${reply}</button>`
            ).join('');
        }
    }

    sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        this.input.value = '';

        // Remove quick replies after first message
        const quickReplies = this.messagesContainer.querySelector('.quick-replies');
        if (quickReplies) {
            quickReplies.remove();
        }

        // Show typing indicator
        this.showTyping();

        // Process and respond
        setTimeout(() => {
            this.hideTyping();

            // Detectar y guardar datos de contacto
            const isContactData = this.detectAndSaveContact(message);

            let response;
            if (isContactData) {
                // Respuesta especial cuando detectamos datos de contacto
                const lang = getCurrentLang();
                const thankYouMessages = {
                    es: "¡Gracias por tus datos! 🙌\n\nTe hemos registrado. Nos pondremos en contacto contigo muy pronto.\n\n¿Prefieres escribirnos directamente por WhatsApp?",
                    en: "Thanks for your info! 🙌\n\nWe've registered you. We'll get in touch with you very soon.\n\nWould you prefer to message us directly on WhatsApp?",
                    pt: "Obrigado pelos seus dados! 🙌\n\nVocê foi registrado. Entraremos em contato em breve.\n\nPrefere nos enviar uma mensagem diretamente pelo WhatsApp?"
                };
                response = {
                    text: thankYouMessages[lang] || thankYouMessages.es,
                    actionButton: {
                        es: { text: "💬 Ir a WhatsApp", url: `https://wa.me/${GLOBAL_DATA.company.whatsapp}` },
                        en: { text: "💬 Go to WhatsApp", url: `https://wa.me/${GLOBAL_DATA.company.whatsapp}` },
                        pt: { text: "💬 Ir para WhatsApp", url: `https://wa.me/${GLOBAL_DATA.company.whatsapp}` }
                    }[lang]
                };
            } else {
                response = this.getResponse(message);
            }

            this.addMessage(response.text, 'bot');

            // Add action button if available (for contact data)
            if (response.actionButton) {
                this.addActionButton(response.actionButton);
            }

            // Add new quick replies if available
            if (response.quickReplies) {
                this.addQuickReplies(response.quickReplies);
            }
        }, 1000 + Math.random() * 1000);
    }

    handleQuickReply(message) {
        // Remove current quick replies
        const quickReplies = this.messagesContainer.querySelector('.quick-replies');
        if (quickReplies) {
            quickReplies.remove();
        }

        // Add user message
        this.addMessage(message, 'user');

        // Show typing indicator
        this.showTyping();

        // Process and respond
        setTimeout(() => {
            this.hideTyping();
            const response = this.getResponse(message);
            this.addMessage(response.text, 'bot');

            // Add new quick replies if available
            if (response.quickReplies) {
                this.addQuickReplies(response.quickReplies);
            }
        }, 800 + Math.random() * 800);
    }

    getResponse(message) {
        const lang = getCurrentLang();
        const responses = TRANSLATIONS[lang].chatbot.responses;
        const messageLower = message.toLowerCase();

        // Check for keywords
        if (this.containsKeywords(messageLower, ['servicio', 'service', 'serviço', 'qué hacen', 'what do you do', 'o que fazem'])) {
            return {
                text: responses.services,
                quickReplies: this.getQuickReplies(lang, ['social', 'automation', 'pricing'])
            };
        }

        if (this.containsKeywords(messageLower, ['precio', 'price', 'preço', 'cuánto', 'how much', 'quanto', 'costo', 'cost', 'custo'])) {
            return {
                text: responses.pricing,
                quickReplies: this.getQuickReplies(lang, ['proposal', 'services'])
            };
        }

        if (this.containsKeywords(messageLower, ['rowi', 'workflow', 'automatiz'])) {
            return {
                text: responses.rowi,
                quickReplies: this.getQuickReplies(lang, ['proposal', 'pricing'])
            };
        }

        if (this.containsKeywords(messageLower, ['propuesta', 'proposal', 'proposta', 'cotiz', 'quote', 'orçamento'])) {
            return {
                text: responses.proposal,
                quickReplies: this.getQuickReplies(lang, ['contact', 'whatsapp'])
            };
        }

        if (this.containsKeywords(messageLower, ['contactar', 'contact', 'contato', 'contacto', 'escribir', 'mensaje', 'hablar', 'comunicar'])) {
            return {
                text: responses.contact,
                quickReplies: this.getQuickReplies(lang, ['whatsapp', 'proposal'])
            };
        }

        if (this.containsKeywords(messageLower, ['whatsapp', 'wsp', 'wa'])) {
            return {
                text: responses.whatsapp,
                quickReplies: this.getQuickReplies(lang, ['services', 'pricing'])
            };
        }

        if (this.containsKeywords(messageLower, ['social', 'redes', 'instagram', 'facebook', 'tiktok'])) {
            return {
                text: responses.services,
                quickReplies: this.getQuickReplies(lang, ['pricing', 'proposal'])
            };
        }

        if (this.containsKeywords(messageLower, ['hola', 'hello', 'hi', 'olá', 'oi', 'buenas', 'hey'])) {
            return {
                text: TRANSLATIONS[lang].chatbot.greeting.split('\n\n').join('\n'),
                quickReplies: TRANSLATIONS[lang].chatbot.quickReplies
            };
        }

        // Default response
        return {
            text: responses.default,
            quickReplies: TRANSLATIONS[lang].chatbot.quickReplies
        };
    }

    containsKeywords(message, keywords) {
        return keywords.some(keyword => message.includes(keyword));
    }

    getQuickReplies(lang, keys) {
        const quickRepliesMap = {
            es: {
                services: 'Servicios',
                pricing: 'Precios',
                proposal: 'Propuesta',
                social: 'Social Media',
                automation: 'Automatización',
                contact: 'Contactar',
                whatsapp: 'WhatsApp'
            },
            en: {
                services: 'Services',
                pricing: 'Pricing',
                proposal: 'Proposal',
                social: 'Social Media',
                automation: 'Automation',
                contact: 'Contact',
                whatsapp: 'WhatsApp'
            },
            pt: {
                services: 'Serviços',
                pricing: 'Preços',
                proposal: 'Proposta',
                social: 'Social Media',
                automation: 'Automação',
                contact: 'Contato',
                whatsapp: 'WhatsApp'
            }
        };

        return keys.map(key => quickRepliesMap[lang][key] || key);
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        const avatar = sender === 'bot' ? '🌵' : '👤';
        const paragraphs = text.split('\n').filter(p => p.trim());

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                ${paragraphs.map(p => `<p>${p}</p>`).join('')}
            </div>
        `;

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addQuickReplies(replies) {
        const quickRepliesDiv = document.createElement('div');
        quickRepliesDiv.classList.add('quick-replies');
        quickRepliesDiv.innerHTML = replies.map(reply =>
            `<button class="quick-reply" data-message="${reply}">${reply}</button>`
        ).join('');

        this.messagesContainer.appendChild(quickRepliesDiv);
        this.scrollToBottom();
    }

    addActionButton(button) {
        const actionDiv = document.createElement('div');
        actionDiv.classList.add('chatbot-action');
        actionDiv.innerHTML = `
            <a href="${button.url}" target="_blank" class="chatbot-action-btn">
                ${button.text}
            </a>
        `;

        this.messagesContainer.appendChild(actionDiv);
        this.scrollToBottom();
    }

    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'bot', 'typing-message');
        typingDiv.innerHTML = `
            <div class="message-avatar">🌵</div>
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;

        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        const typingMessage = this.messagesContainer.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    // Detectar y guardar datos de contacto
    detectAndSaveContact(message) {
        const contactData = {};

        // Detectar teléfono (varios formatos)
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
        const phones = message.match(phoneRegex);
        if (phones) {
            contactData.phone = phones[0].trim();
        }

        // Detectar email
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = message.match(emailRegex);
        if (emails) {
            contactData.email = emails[0].toLowerCase();
        }

        // Detectar nombre (texto antes del teléfono/email, o todo si no hay)
        let possibleName = message;
        if (phones) {
            possibleName = message.split(phones[0])[0].trim();
        }
        if (emails) {
            possibleName = possibleName.split(emails[0])[0].trim();
        }
        // Limpiar y validar nombre (solo letras y espacios, mínimo 2 palabras o 3 letras)
        possibleName = possibleName.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').trim();
        if (possibleName.length >= 3) {
            contactData.name = possibleName;
        }

        // Si detectamos al menos teléfono o email, guardar el contacto
        if (contactData.phone || contactData.email) {
            this.saveContact(contactData);
            return true;
        }
        return false;
    }

    saveContact(contactData) {
        // Agregar timestamp y fuente
        contactData.timestamp = new Date().toISOString();
        contactData.source = 'chatbot';
        contactData.lang = getCurrentLang();

        // Obtener contactos existentes
        let contacts = [];
        try {
            const stored = localStorage.getItem('cactus_leads');
            if (stored) {
                contacts = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading contacts:', e);
        }

        // Agregar nuevo contacto
        contacts.push(contactData);

        // Guardar
        try {
            localStorage.setItem('cactus_leads', JSON.stringify(contacts));
            console.log('📧 Nuevo lead guardado:', contactData);
        } catch (e) {
            console.error('Error saving contact:', e);
        }
    }

    // Obtener todos los leads guardados (para admin)
    static getLeads() {
        try {
            const stored = localStorage.getItem('cactus_leads');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading leads:', e);
            return [];
        }
    }

    // Exportar leads a CSV
    static exportLeadsCSV() {
        const leads = CactusBot.getLeads();
        if (leads.length === 0) {
            alert('No hay leads para exportar');
            return;
        }

        const headers = ['Nombre', 'Teléfono', 'Email', 'Fecha', 'Idioma', 'Fuente'];
        const rows = leads.map(lead => [
            lead.name || '',
            lead.phone || '',
            lead.email || '',
            lead.timestamp ? new Date(lead.timestamp).toLocaleString() : '',
            lead.lang || '',
            lead.source || ''
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cactus_leads_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cactusBot = new CactusBot();
});
