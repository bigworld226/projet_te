// ============================================================
// CONFIGURATION API
// ============================================================
const API_BASE = window.location.origin || "http://localhost:3000";
const API_URL = `${API_BASE}/api`;

// ============================================================
// VERIFICATION DES DROITS (ADMIN vs STUDENT)
// ============================================================
// Cette variable est définie dans page.tsx selon le rôle
const IS_STUDENT_INTERFACE = !(window.IS_ADMIN_INTERFACE === true);
const USER_ROLE = window.USER_ROLE || 'STUDENT';
console.log(`🔐 Mode Interface: ${IS_STUDENT_INTERFACE ? 'STUDENT' : 'ADMIN'}, Rôle: ${USER_ROLE}`);

// ============================================================
// GESTION DU TOKEN (PERSISTANT)
// ============================================================
function getAuthToken() {
    const rawToken = localStorage.getItem("travelExpressToken");
    if (!rawToken || rawToken === "null" || rawToken === "undefined") return null;
    return rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;
}

function setAuthToken(token) {
    if (token && token !== "COOKIES_AUTO") {
        localStorage.setItem("travelExpressToken", token);
    }
}

// Fonction pour échapper l'HTML et éviter les injections XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getReadStatusMarkup(msg, isMe) {
    if (!isMe) return "";
    const readCount = Array.isArray(msg?.readReceipts) ? msg.readReceipts.length : 0;
    if (readCount > 0) {
        return `<span style="margin-left:4px; font-size:0.82em; color:#4fc3f7; letter-spacing:-1px;">✓✓</span>`;
    }
    return `<span style="margin-left:4px; font-size:0.82em; color:#a0a0a0; letter-spacing:-1px;">✓</span>`;
}

function getAttachmentType(att) {
    const normalized = String(att || "").toLowerCase().split("?")[0].split("#")[0];
    if (normalized.includes('/image/upload/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)$/.test(normalized)) return "image";
    if (normalized.includes('/audio/upload/') || /\.(mp3|wav|ogg|oga|m4a|aac|opus|webm)$/.test(normalized)) return "audio";
    if (normalized.includes('/video/upload/') || /\.(mp4|mov|mkv|avi|m4v)$/.test(normalized)) return "video";
    return "file";
}

// ============================================================
// HELPER: Wrapper pour fetch avec gestion du token
// ============================================================
async function apiFetch(url, options = {}) {
    const token = getAuthToken();
    const headers = options.headers || {};
    
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    
    if (token && token !== "COOKIES_AUTO") {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, {
        ...options,
        headers
    });
}

// Cloudinary
const CL_URL = "https://api.cloudinary.com/v1_1/daec8eyaj/auto/upload";
const CL_PRESET = "travel_express_preset";

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("Conversion audio base64 impossible"));
        };
        reader.onerror = () => reject(new Error("Erreur FileReader audio"));
        reader.readAsDataURL(blob);
    });
}


// Constantes
const DEFAULT_IMG = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const NOTIF_SOUND = "https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3";

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let currentUser = null;
let authToken = null;
let currentConversation = null;
let currentConversationType = null; // ✅ NEW: Track conversation type (direct, groupe, diffusion)
let currentTab = "discussions";
let replyData = null;
let messageContextId = null;
let messageListeners = {};
let conversationListeners = {};
let selectedRecipients = [];
let mediaRecorder = null;
let audioChunks = [];
let currentZoom = 1;
let currentRotation = 0;
let lightboxMediaList = [];
let currentLightboxIndex = -1;
let isEditing = false;
let isAdminUser = false;
let isConversationWithAssistantSocial = false;

// ============================================================
// STYLES DYNAMIQUES
// ============================================================
const styleEl = document.createElement('style');
styleEl.innerHTML = `
    .conversation-item { 
        padding: 12px; 
        cursor: pointer; 
        border-bottom: 1px solid var(--border); 
        transition: 0.2s;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .conversation-item:hover { background: var(--bg-header); }
    .conversation-item.active { background: var(--gold); color: white; }
    
    .contact-avatar { 
        width: 50px; 
        height: 50px; 
        border-radius: 50%; 
        object-fit: cover;
        border: 2px solid var(--gold);
    }
    
    .unread-badge {
        background: #25d366;
        color: white;
        border-radius: 50%;
        padding: 2px 7px;
        font-size: 0.75rem;
        font-weight: bold;
        margin-left: auto;
    }
    
    .message {
        margin: 8px 0;
        max-width: 76%;
        padding: 10px 14px;
        border-radius: 14px;
        font-size: 14px;
        line-height: 1.45;
        word-wrap: break-word;
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 6px 18px rgba(0,0,0,0.28);
    }
    
    .message.sent {
        background: linear-gradient(180deg, rgba(54,39,7,0.95), rgba(38,29,8,0.95));
        color: #fff;
        margin-left: auto;
        border: 1px solid rgba(212,160,22,0.9);
        border-left: 4px solid var(--gold);
        border-bottom-right-radius: 8px;
    }
    
    .message.received {
        background: linear-gradient(180deg, #25282d, #1f2227);
        color: #f4f5f7;
        margin-right: auto;
        border-top-left-radius: 8px;
    }
    
    .reply-quote {
        background: rgba(0,0,0,0.1);
        padding: 5px;
        border-left: 3px solid var(--gold);
        margin-bottom: 5px;
        font-size: 0.8em;
        border-radius: 4px;
    }
    
    .contact-card {
        padding: 12px;
        border: 2px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        transition: 0.2s;
        text-align: center;
    }
    
    .contact-card.selected {
        border-color: var(--gold);
        background: var(--gold);
        color: white;
    }
    
    .contact-card img {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        margin-bottom: 8px;
    }
    
    .voice-overlay {
        position: fixed;
        bottom: 88px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(90deg, #23181a 0%, #1c1f26 35%, #22262f 100%);
        display: flex;
        align-items: center;
        gap: 14px;
        z-index: 1000;
        padding: 10px 20px 10px 10px;
        border-radius: 999px;
        border: 2px solid var(--gold);
        box-shadow: 0 12px 30px rgba(0,0,0,0.55);
        min-width: 320px;
    }
    
    .vocal-anim {
        position: relative;
        width: 54px;
        height: 54px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, rgba(255, 77, 77, 0.28), rgba(255, 77, 77, 0.1));
        box-shadow: 0 0 0 1px rgba(255, 77, 77, 0.25);
    }
    
    .vocal-anim i {
        font-size: 20px;
        color: #ff5252;
        z-index: 2;
    }
    
    .pulse-ring {
        position: absolute;
        inset: -2px;
        border: 2px solid rgba(255, 82, 82, 0.65);
        border-radius: 50%;
        animation: pulse 1.2s ease-out infinite;
    }
    
    @keyframes pulse {
        0% {
            transform: scale(0.92);
            opacity: 0.95;
        }
        100% {
            transform: scale(1.5);
            opacity: 0;
        }
    }
    
    #voiceTimer, #voiceTimerStudent {
        color: #ff4b55;
        font-weight: 700;
        font-size: 20px;
        letter-spacing: 0.5px;
        font-family: 'Courier New', monospace;
    }
    
    .lightbox-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    }
    
    .lightbox-content {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 90vw;
        max-height: 90vh;
    }
    
    .lightbox-content img,
    .lightbox-content video {
        max-width: 100%;
        max-height: 100%;
        border-radius: 8px;
    }
    
    .lightbox-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: none;
        border: none;
        color: white;
        font-size: 30px;
        cursor: pointer;
        z-index: 2001;
    }
    
    .lightbox-prev,
    .lightbox-next {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        z-index: 2001;
    }
    
    .lightbox-prev { left: 20px; }
    .lightbox-next { right: 20px; }
    
    .lightbox-zoom-in,
    .lightbox-zoom-out,
    .lightbox-rotate,
    .lightbox-reset {
        position: absolute;
        bottom: 20px;
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2001;
    }
    
    .lightbox-zoom-in { left: 20px; }
    .lightbox-zoom-out { left: 70px; }
    .lightbox-rotate { left: 120px; }
    .lightbox-reset { left: 170px; }
`;
document.head.appendChild(styleEl);

// ============================================================
// HELPER FUNCTIONS - AFFICHER/MASQUER LAYOUTS
// ============================================================
function showAdminLayout() {
    const adminApp = document.getElementById("appMainAdmin");
    const studentApp = document.getElementById("appMainStudent");
    if (adminApp) adminApp.style.display = "flex";
    if (studentApp) studentApp.style.display = "none";
}

function showStudentLayout() {
    const adminApp = document.getElementById("appMainAdmin");
    const studentApp = document.getElementById("appMainStudent");
    if (adminApp) adminApp.style.display = "none";
    if (studentApp) studentApp.style.display = "flex";
}

// ============================================================
// CHARGER GROUPES POUR STUDENT
// ============================================================
async function chargerGroupesStudent() {
    try {
        console.log("📥 Chargement des groupes STUDENT...");
        
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = getAuthToken();
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/student/groups`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
        });
        
        if (!res.ok) {
            console.error("❌ Erreur API:", res.status, res.statusText);
            throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        const groups = data.groups || [];
        console.log("✅ Groupes chargés:", groups.length);
        
        const contactsGrid = document.getElementById("contactsGridStudent");
        const contactsLabel = document.querySelector('[style*="Contacts"]');
        
        if (!contactsGrid) {
            console.error("❌ Élément contactsGridStudent non trouvé!");
            return;
        }

        // Changer le titre de "Contacts" à "Groupes"
        if (contactsLabel) {
            const parent = contactsGrid.parentElement;
            if (parent) {
                const h3 = parent.querySelector('h3');
                if (h3) {
                    h3.textContent = '👥 Mes Groupes';
                }
            }
        }

        contactsGrid.innerHTML = "";

        if (groups.length === 0) {
            contactsGrid.innerHTML = `<p style="color:var(--text-muted); padding:10px; font-size:0.9em; text-align:center;">Aucun groupe</p>`;
            return;
        }

        groups.forEach(group => {
            const groupCard = document.createElement("div");
            groupCard.className = "group-card";
            groupCard.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                border: 1px solid var(--border);
                transition: 0.2s;
                background: var(--bg-input);
            `;
            
            const groupName = group.name || "Sans nom";
            const memberCount = group.memberCount || 0;

            groupCard.innerHTML = `
                <div style="font-size:0.85em; font-weight:bold; color:var(--gold); text-align:left;">${groupName}</div>
                <div style="font-size:0.7em; color:var(--text-muted); text-align:left;">${memberCount} membre${memberCount > 1 ? 's' : ''}</div>
            `;

            groupCard.onmouseover = () => {
                groupCard.style.background = "var(--bg-header)";
                groupCard.style.borderColor = "var(--gold)";
            };
            
            groupCard.onmouseout = () => {
                groupCard.style.background = "var(--bg-input)";
                groupCard.style.borderColor = "var(--border)";
            };

            groupCard.onclick = () => {
                console.log("📨 Ouverture du groupe:", group.name);
                // Afficher le groupe dans la liste des discussions
                ouvriGroupeChat(group.id, group.name, group);
            };
            groupCard.ontouchend = (e) => {
                e.preventDefault();
                ouvriGroupeChat(group.id, group.name, group);
            };

            contactsGrid.appendChild(groupCard);
        });

        console.log(`✅ ${groups.length} groupes affichés pour l'étudiant`);

    } catch (err) {
        console.error("❌ Erreur chargement groupes student:", err);
        const contactsGrid = document.getElementById("contactsGridStudent");
        if (contactsGrid) {
            contactsGrid.innerHTML = `<p style="color:red; padding:10px;">❌ Erreur: ${err.message}</p>`;
        }
    }
}

// ============================================================
// CHARGER ASSISTANT SOCIAL (Super Admin) POUR STUDENT
// ============================================================
async function chargerAssistantSocial() {
    try {
        console.log("📥 Chargement de l'Assistant Social...");
        
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = getAuthToken();
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/student/admin`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
        });
        
        if (!res.ok) {
            console.error("❌ Erreur API:", res.status, res.statusText);
            throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        const admin = data.admin;

        if (!admin) {
            console.error("❌ Aucun Assistant Social trouvé!");
            return;
        }

        console.log("✅ Assistant Social chargé:", admin.fullName);
        
        const socialWorkerGrid = document.getElementById("socialWorkerGridStudent");
        
        if (!socialWorkerGrid) {
            console.error("❌ Élément socialWorkerGridStudent non trouvé!");
            return;
        }

        socialWorkerGrid.innerHTML = "";

        // Créer la carte pour l'Assistant Social
        const adminCard = document.createElement("div");
        adminCard.className = "admin-card";
        adminCard.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid var(--gold);
            transition: 0.2s;
            background: var(--bg-input);
        `;
        
        const adminName = admin.displayName || admin.fullName || "Assistant Social";

        adminCard.innerHTML = `
            <div style="font-size:0.85em; font-weight:bold; color:var(--gold); text-align:left;">👤 ${adminName}</div>
            <div style="font-size:0.7em; color:var(--text-muted); text-align:left;">Toujours disponible</div>
        `;

        adminCard.onmouseover = () => {
            adminCard.style.background = "var(--bg-header)";
            adminCard.style.borderColor = "var(--gold)";
            adminCard.style.boxShadow = "0 0 8px rgba(255,215,0,0.3)";
        };
        
        adminCard.onmouseout = () => {
            adminCard.style.background = "var(--bg-input)";
            adminCard.style.borderColor = "var(--gold)";
            adminCard.style.boxShadow = "none";
        };

        adminCard.onclick = () => {
            console.log("📨 Ouverture de la conversation avec Assistant Social");
            // Ouvrir la conversation/message direct avec l'Assistant Social
            ouvrirConversationAssistantSocial(admin.id, "Assistant Social");
        };
        adminCard.ontouchend = (e) => {
            e.preventDefault();
            ouvrirConversationAssistantSocial(admin.id, "Assistant Social");
        };

        socialWorkerGrid.appendChild(adminCard);
        console.log(`✅ Assistant Social affiché`);

    } catch (err) {
        console.error("❌ Erreur chargement Assistant Social:", err);
        const socialWorkerGrid = document.getElementById("socialWorkerGridStudent");
        if (socialWorkerGrid) {
            socialWorkerGrid.innerHTML = `<p style="color:var(--text-muted); padding:10px; font-size:0.9em; text-align:center;">Non disponible</p>`;
        }
    }
}

// ============================================================
// CHARGER CONVERSATIONS POUR STUDENT (SANS CHANGER DE TAB)
// ============================================================
async function chargerConversationsStudent() {
    try {
        console.log("📥 Chargement des conversations STUDENT...");
        const token = getAuthToken();
        if (!token) return;
        
        const headers = { 'Content-Type': 'application/json' };
        if (token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        await fetch(`${API_URL}/conversations`, {
            headers, credentials: 'include'
        });
        console.log("✅ Conversations pré-chargées");
    } catch (err) {
        console.error("❌ Erreur pré-chargement conversations:", err);
    }
}

// ============================================================
// OUVRIR UN GROUPE DE CHAT
// ============================================================
async function ouvriGroupeChat(groupId, groupName, groupData) {
    try {
        console.log("👥 Ouverture du groupe:", groupName);
        
        // Mettre à jour les variables globales
        currentConversation = groupId;
        currentConversationType = 'group';
        currentTab = 'groupes';
        
        // Afficher le titre du groupe
        const headerTitle = document.getElementById('chatHeaderTitleStudent');
        if (headerTitle) {
            headerTitle.textContent = `👥 ${groupName} (${groupData.memberCount} membres)`;
        }
        
        // Charger les messages du groupe
        await chargerMessagesGroupe(groupId);
        
        // Afficher l'interface de chat
        const mainChat = document.getElementById('mainChatStudent');
        if (mainChat) {
            mainChat.style.display = 'flex';
        }
        
    } catch (err) {
        console.error("❌ Erreur ouverture groupe:", err);
    }
}

// ============================================================
// CHARGER MESSAGES DU GROUPE
// ============================================================
async function chargerMessagesGroupe(groupId) {
    try {
        console.log("📥 Chargement des messages du groupe...");
        
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = getAuthToken();
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/student/groups/${groupId}/messages`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
        });
        
        if (!res.ok) {
            console.error("❌ Erreur API:", res.status, res.statusText);
            throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        const messages = data.messages || [];
        console.log("✅ Messages chargés:", messages.length);
        
        // Afficher les messages
        const messagesContainer = document.getElementById('messagesStudent');
        if (messagesContainer) {
            // ✅ Vérifier si c'est le premier chargement
            const isFirstLoad = messagesContainer.innerHTML === "";
            const wasScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 50;
            
            messagesContainer.innerHTML = "";
            
            messages.forEach(msg => {
                const msgEl = document.createElement('div');
                msgEl.className = `message ${msg.senderId === currentUser.id ? 'sent' : 'received'}`;
                msgEl.style.display = 'flex';
                msgEl.style.flexDirection = 'column';
                
                const nameEl = document.createElement('strong');
                nameEl.style.color = 'var(--gold)';
                nameEl.style.fontSize = '0.9em';
                nameEl.textContent = msg.sender?.fullName || 'Utilisateur';
                
                const contentEl = document.createElement('p');
                contentEl.style.margin = '4px 0';
                contentEl.style.fontSize = '0.95em';
                contentEl.textContent = msg.content || '';
                
                const timeEl = document.createElement('small');
                timeEl.style.color = 'var(--text-muted)';
                timeEl.style.fontSize = '0.8em';
                timeEl.textContent = new Date(msg.createdAt).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
                
                msgEl.appendChild(nameEl);
                msgEl.appendChild(contentEl);
                msgEl.appendChild(timeEl);
                messagesContainer.appendChild(msgEl);
            });
            
            console.log("✅ Messages groupe chargés:", messages.length);
            
            // ✅ Scroller vers le bas seulement si c'est le premier chargement ou si on était déjà au bottom
            if (isFirstLoad || wasScrolledToBottom) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
        
    } catch (err) {
        console.error("❌ Erreur chargement messages groupe:", err);
    }
}

// ============================================================
// OUVRIR CONVERSATION AVEC ASSISTANT SOCIAL (UTILISE L'ID DE L'ADMIN)
// ============================================================
async function ouvrirConversationAssistantSocial(adminId, adminName) {
    try {
        console.log("📨 Chargement conversation Assistant Social...");
        
        // Utiliser directement l'adminId comme conversationId pour l'Assistant Social
        // Le backend gère automatiquement la conversation avec l'admin dans les messages
        console.log("✅ Conversation Assistant Social ouverte:", adminId);
        window.ouvrirConversationAssistantSocialMessages(adminId, adminName);
        
    } catch (err) {
        console.error("❌ Erreur ouverture Assistant Social:", err);
        alert("Erreur: " + err.message);
    }
}

// ============================================================
// OUVRIR MESSAGES AVEC ASSISTANT SOCIAL
// ============================================================
window.ouvrirConversationAssistantSocialMessages = (adminId, adminName) => {
    currentConversation = adminId;
    currentConversationType = "direct";
    isConversationWithAssistantSocial = true;
    window.toggleMobileView(true);
    
    const titleEl = document.getElementById("chatHeaderTitleStudent");
    if (titleEl) {
        titleEl.innerHTML = `<b style="color:var(--gold);">👤 ${adminName}</b>`;
    }

    const container = document.getElementById("messagesStudent");
    if (!container) return;

    lightboxMediaList = [];

    const loadMessages = async () => {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            const token = getAuthToken();
            if (token && token !== "COOKIES_AUTO") {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(`${API_URL}/student/admin/messages`, {
                method: 'GET',
                headers,
                credentials: 'include'
            });
            
            if (!res.ok) {
                console.error("❌ Erreur API:", res.status, res.statusText);
                throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            const messages = Array.isArray(data.messages) ? data.messages : [];

            console.log("✅ Messages chargés:", messages.length);

            container.innerHTML = "";

            messages.forEach((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const div = document.createElement("div");
                div.className = `message ${isMe ? 'sent' : 'received'}`;

                let html = "";

                if (msg.attachments && msg.attachments.length > 0) {
                    msg.attachments.forEach(att => {
                        if (att.match(/\.webm($|\?|\#)/i)) {
                            html += `<div style="display:flex; align-items:center; gap:6px; padding:4px 6px; background:rgba(212,175,55,0.1); border-radius:6px; margin:3px 0;">
                                <i class="fas fa-volume-up" style="color:var(--gold); font-size:14px; flex-shrink:0;"></i>
                                <audio src="${att}" controls style="height:24px; max-width:140px; cursor:pointer;"></audio>
                            </div>`;
                        } else if (getAttachmentType(att) === "image") {
                            lightboxMediaList.push({ url: att, type: 'image' });
                            const mediaIndex = lightboxMediaList.length - 1;
                            html += `<img src="${att}" style="max-width:200px; border-radius:8px; cursor:pointer; margin:5px 0;" onclick="window.ouvrirPleinEcran('${att}', 'image', ${mediaIndex})">`;
                        } else if (getAttachmentType(att) === "audio") {
                            html += `<div style="display:flex; align-items:center; gap:6px; padding:4px 6px; background:rgba(212,175,55,0.1); border-radius:6px; margin:3px 0;">
                                <i class="fas fa-volume-up" style="color:var(--gold); font-size:14px; flex-shrink:0;"></i>
                                <audio src="${att}" controls style="height:24px; max-width:140px; cursor:pointer;"></audio>
                            </div>`;
                        } else if (getAttachmentType(att) === "video") {
                            lightboxMediaList.push({ url: att, type: 'video' });
                            const mediaIndex = lightboxMediaList.length - 1;
                            html += `<video src="${att}" style="max-width:200px; border-radius:8px; cursor:pointer; margin:5px 0;" controls onclick="window.ouvrirPleinEcran('${att}', 'video', ${mediaIndex})"></video>`;
                        } else {
                            html += `<a href="${att}" target="_blank" style="color:var(--gold); display:block; margin-top:5px;">Fichier</a>`;
                        }
                    });
                }

                if (msg.content) {
                    html += `<div>${msg.content}</div>`;
                }
                const time = new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });

                const readStatus = getReadStatusMarkup(msg, isMe);
                div.innerHTML = `${html}<div style="font-size:0.7em; margin-top:4px; opacity:0.7; display:flex; align-items:center;">${time}${readStatus}</div>`;

                container.appendChild(div);
            });

            container.scrollTop = container.scrollHeight;
        } catch (err) {
            container.innerHTML = "<p style='color:red;'>❌ Erreur chargement messages</p>";
        }
    };

    loadMessages();
    if (messageListeners[adminId]) {
        clearInterval(messageListeners[adminId]);
    }
    messageListeners[adminId] = setInterval(() => {
        if (!getAuthToken() || getAuthToken() === "COOKIES_AUTO") {
            clearInterval(messageListeners[adminId]);
            return;
        }
        loadMessages();
    }, 10000);
};

// ============================================================
// CRÉER CONVERSATION AVEC CONTACT (OU OUVRIR EXISTANTE)
// ============================================================
async function creerConversationAvecContact(userId, userName, userImage) {
    try {
        console.log("📨 Ouverture conversation avec:", userName);
        
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // 1️⃣ Chercher une conversation existante
        // Pour les admins, chercher dans /api/admin/messaging, sinon dans /api/conversations
        let existingConv = null;
        if (isAdminUser) {
            try {
                const getRes = await fetch(`${API_URL}/admin/messaging`, {
                    headers,
                    credentials: 'include'
                });
                
                if (getRes.ok) {
                    const data = await getRes.json();
                    const conversations = data.conversations || data;
                    existingConv = conversations.find(conv => 
                        conv.participants && conv.participants.some(part => part.id === userId)
                    );
                }
            } catch (e) {
                console.warn("⚠️ Erreur recherche conversation admin:", e);
            }
        } else {
            try {
                const getRes = await fetch(`${API_URL}/conversations`, {
                    headers,
                    credentials: 'include'
                });
                
                if (getRes.ok) {
                    const conversations = await getRes.json();
                    existingConv = conversations.find(conv => 
                        conv.participants && conv.participants.length === 2 && 
                        conv.participants.some(part => part.user?.id === userId)
                    );
                }
            } catch (e) {
                console.warn("⚠️ Erreur recherche conversation étudiant:", e);
            }
        }
        
        if (existingConv) {
            console.log("✅ Conversation existante trouvée:", existingConv.id);
            window.ouvrirConversation(existingConv.id, userName);
            return;
        }
        
        // 2️⃣ Créer une nouvelle conversation
        console.log("✨ Création nouvelle conversation avec:", userName);
        
        let createRes;
        
        if (isAdminUser) {
            // Les admins utilisent /api/admin/messaging
            createRes = await fetch(`${API_URL}/admin/messaging`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    subject: `Conversation avec ${userName}`,
                    participantIds: [userId],
                    initialMessage: "Conversation créée"
                })
            });
        } else {
            // Les étudiants utilisent /api/conversations
            createRes = await fetch(`${API_URL}/conversations`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    participantId: userId,
                    subject: `Conversation avec ${userName}`
                })
            });
        }

        if (!createRes.ok) {
            const errorData = await createRes.text();
            console.error("❌ Erreur API:", createRes.status, errorData);
            throw new Error(`Erreur ${createRes.status}: ${createRes.statusText}`);
        }

        const data = await createRes.json();
        
        // Extraire l'ID selon le format de réponse
        let conversationId;
        if (isAdminUser) {
            // /api/admin/messaging retourne { conversation: { id, ... } }
            conversationId = data.conversation?.id;
        } else {
            // /api/conversations retourne { id, ... }
            conversationId = data.id || data.conversationId;
        }
        
        console.log("✅ Conversation créée:", conversationId);
        
        if (!conversationId) {
            throw new Error("ID de conversation introuvable dans la réponse");
        }
        
        window.ouvrirConversation(conversationId, userName);
    } catch (err) {
        console.error("❌ Erreur conversation:", err);
        alert("Erreur: " + err.message);
    }
}

// ============================================================
// THÈME
// ============================================================
window.changerTheme = (themeClass) => {
    if (themeClass === "theme-light") {
        document.body.classList.add("theme-light");
        localStorage.setItem("travelTheme", "light");
    } else {
        document.body.classList.remove("theme-light");
        localStorage.setItem("travelTheme", "dark");
    }
};

function applySavedTheme() {
    const savedTheme = localStorage.getItem("travelTheme");
    let themeSelector = document.getElementById("themeSelector");
    if (!themeSelector) themeSelector = document.getElementById("themeSelectorStudent");
    
    if (savedTheme === "light") {
        document.body.classList.add("theme-light");
        if (themeSelector) themeSelector.value = "theme-light";
    } else {
        document.body.classList.remove("theme-light");
        if (themeSelector) themeSelector.value = "theme-dark";
    }
}

// ============================================================
// FONCTION POUR RÉCUPÉRER UN COOKIE
// ============================================================
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}
// ============================================================
// INITIALISATION USER (depuis localStorage ou API)
// ============================================================
async function initializeUser() {
    const checkUserAsync = async () => {
        let user = null;
        let token = null;
        const saved = localStorage.getItem("travelExpressUser"); // Récupérer une fois au début
        
        // ✅ PRIORITÉ 1: localStorage est la source unique de vérité (resistant aux restart serveur)
        if (saved) {
            user = JSON.parse(saved);
            token = localStorage.getItem("travelExpressToken");
            console.log("✅ Utilisateur trouvé dans localStorage");
            console.log("   Email:", user?.email, "| Rôle:", user?.role?.name);
            
            // Essayer POST à temp-user pour les APIs qui en dépendent
            try {
                await fetch(`${API_BASE}/api/auth/temp-user`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(user)
                });
            } catch (err) {
                // Pas grave si ça échoue
            }
        }
        
        // 2️⃣ Si pas encore de user/token, essayer GET /api/auth/login-discussions
        // (cela utilise le user stocké temporairement par tmp-user-store)
        if (!user) {
            console.log("🔐 Tentative GET /api/auth/login-discussions...");
            try {
                const res = await fetch(`${API_BASE}/api/auth/login-discussions`, {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.token && data.user) {
                        user = data.user;
                        token = data.token;
                        console.log("✅ User + Token trouvés via API login-discussions");
                    }
                }
            } catch (err) {
                console.warn("⚠️ API login-discussions indisponible:", err.message);
            }
        }

        // 3️⃣ Fallback robuste: session cookie + /api/user/current
        if (!user) {
            console.log("🔐 Tentative GET /api/user/current...");
            try {
                const meRes = await fetch(`${API_BASE}/api/user/current`, {
                    credentials: 'include'
                });
                if (meRes.ok) {
                    user = await meRes.json();
                    token = localStorage.getItem("travelExpressToken");
                    console.log("✅ Utilisateur trouvé via /api/user/current");
                }
            } catch (err) {
                console.warn("⚠️ API /api/user/current indisponible:", err.message);
            }
        }
        
        // 4️⃣ Si toujours pas d'utilisateur
        if (!user) {
            console.warn("⚠️ Aucun utilisateur trouvé");
            const appMain = document.getElementById("appMainStudent") || document.getElementById("appMainAdmin");
            if (appMain) {
                appMain.style.display = "flex";
                appMain.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:center; height:100%; flex-direction:column; gap:20px;">
                        <i class="fas fa-lock" style="font-size:50px; color:var(--gold);"></i>
                        <p>Veuillez vous connecter d'abord</p>
                        <button onclick="window.parent.history.back()" class="icon-btn">
                            Retour à l'accueil
                        </button>
                    </div>
                `;
            }
            return;
        }

        currentUser = user;
        authToken = token || "COOKIES_AUTO";
        
        // ✅ SAUVEGARDER LE TOKEN DANS LOCALSTORAGE POUR LA PERSISTANCE
        setAuthToken(token);
        localStorage.setItem("travelExpressUser", JSON.stringify(user));
        
        console.log("📋 Structure complète de currentUser:", currentUser);
        console.log("📄 Clés disponibles:", Object.keys(currentUser));
        console.log("✅ Connecté :", currentUser.email, "Rôle:", currentUser.role?.name);
        console.log("🔑 Token trouvé:", token && token !== "COOKIES_AUTO" ? "OUI ✅" : "NON ❌ (utilisant cookies)");

        // Déterminer si ADMIN ou STUDENT
        window.isAdminUser = ["SUPERADMIN", "STUDENT_MANAGER"].includes(currentUser.role?.name);
        
        // ✅ IMPORTANT: Mettre à jour la variable globale qui sera utilisée dans switchTab
        isAdminUser = window.isAdminUser;

        console.log("🔍 Rôle détecté:", currentUser.role?.name, "| isAdminUser:", isAdminUser);

        if (isAdminUser) {
            showAdminLayout();
        } else {
            showStudentLayout();
        }

        applySavedTheme();
        
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        // ✅ CHARGER LES GROUPES ET L'ASSISTANT SOCIAL AVANT DE CHARGER LES DISCUSSIONS
        if (isAdminUser) {
            chargerContactsAdmin();
        } else {
            chargerAssistantSocial();   // Charger l'Assistant Social
            chargerGroupesStudent();      // Charger les groupes
        }

        // Initialiser la vue des discussions
        setTimeout(() => {
            window.switchTab("discussions");
        }, 500);

        // ✅ SETUP EVENT LISTENERS APRÈS initializeUser
        setTimeout(() => {
            setupEventListeners();
        }, 600);
    };
    
    // ✅ ATTENDRE checkUserAsync POUR QUE TOUT SOIT INITIALISÉ
    await checkUserAsync();
}

// ============================================================
// CHARGER CONTACTS POUR ADMIN (CORRIGÉ POUR LES COOKIES)
// ============================================================
async function chargerContactsAdmin() {
    try {
        console.log("📥 Chargement des contacts ADMIN...");
        const token = getAuthToken();
        console.log("🔑 Token utilisé:", token);
        
        const headers = {
            'Content-Type': 'application/json'
        };

        // ✅ Utiliser le token persistant
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/users`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
        });
        
        if (!res.ok) {
            console.error("❌ Erreur API:", res.status, res.statusText);
            const errorData = await res.text();
            console.error("📄 Réponse serveur:", errorData);
            throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        }

        const users = await res.json();
        console.log("✅ Utilisateurs chargés:", users.length);
        
        const contactsGrid = document.getElementById("contactsGridAdmin");
        
        if (!contactsGrid) {
            console.error("❌ Élément contactsGridAdmin non trouvé!");
            return;
        }

        contactsGrid.innerHTML = "";

        let count = 0;
        users.forEach(user => {
            if (user.id === currentUser.id) return;

            count++;
            const contactCard = document.createElement("div");
            contactCard.className = "contact-card";
            contactCard.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                border: 1px solid var(--border);
                transition: 0.2s;
                min-width: 70px;
                flex-shrink: 0;
            `;
            
            const avatar = user.profileImage || DEFAULT_IMG;
            const name = user.fullName || "Sans nom";

            contactCard.innerHTML = `
                <img src="${avatar}" style="width:36px; height:36px; border-radius:50%; border:2px solid var(--gold);">
                <div style="font-size:0.7em; font-weight:bold; color:var(--text); text-align:center; overflow:hidden; text-overflow:ellipsis;">${name.split(' ')[0]}</div>
            `;

            contactCard.onmouseover = () => {
                contactCard.style.background = "var(--bg-header)";
                contactCard.style.borderColor = "var(--gold)";
            };
            
            contactCard.onmouseout = () => {
                contactCard.style.background = "transparent";
                contactCard.style.borderColor = "var(--border)";
            };

            contactCard.onclick = () => afficherMenuContact(user.id, user.fullName, user.profileImage);

            contactsGrid.appendChild(contactCard);
        });

        console.log(`✅ ${count} contacts affichés pour l'admin`);

    } catch (err) {
        console.error("❌ Erreur contacts admin:", err);
        const contactsGrid = document.getElementById("contactsGridAdmin");
        if (contactsGrid) {
            contactsGrid.innerHTML = `<p style="color:red; padding:10px;">❌ Erreur: ${err.message}</p>`;
        }
    }
}

// ============================================================
// CHARGER CONVERSATIONS (CORRIGÉ POUR LES COOKIES)
// ============================================================
function chargerConversations() {
    const hasAccess = isAdminUser || currentUser?.role?.name === "STUDENT";
    const chatListId = getChatListId();
    const chatList = document.getElementById(chatListId);
    
    if (!hasAccess) {
        chatList.innerHTML = "<p style='color:#999; padding:20px;'>⚠️ Accès refusé aux discussions</p>";
        return;
    }

    const loadConvs = async () => {
        try {
            console.log("📥 Chargement conversations...");
            console.log("🔍 Rôle utilisateur:", { isAdminUser, role: currentUser?.role?.name });
            
            const headers = {
                'Content-Type': 'application/json'
            };

            const token = getAuthToken();
            if (token && token !== "COOKIES_AUTO") {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // 🔐 ADMIN: Utiliser /api/admin/messaging pour voir TOUTES les conversations
            // STUDENT: Utiliser /api/conversations pour voir seulement ses conversations
            const endpoint = isAdminUser ? `${API_URL}/admin/messaging` : `${API_URL}/conversations`;
            
            console.log("🌐 Endpoint:", endpoint);
            console.log("🔐 Token présent:", !!token);
            console.log("📤 Headers envoyés:", { Authorization: headers['Authorization'] ? '✅ Bearer ' + token.substring(0,20) + '...' : '❌ Manquant' });

            const res = await fetch(endpoint, {
                method: 'GET',
                headers: headers,
                credentials: 'include'  // ✅ IMPORTANT
            });
            
            console.log("📡 Réponse:", { status: res.status, ok: res.ok });

            if (!res.ok) {
                console.error("❌ Erreur API conversations:", res.status, res.statusText);
                throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            }

            // ✅ ADMIN: Format différent de /api/admin/messaging (inclut conversations)
            const responseData = await res.json(); 
            const rawConversations = isAdminUser ? (responseData.conversations || []) : (Array.isArray(responseData) ? responseData : []); 
            const conversations = rawConversations.filter(conv => conv.subject !== "Diffusion privée"); 
            
            console.log("✅ Conversations chargées:", conversations.length);
            
            if (currentTab !== "discussions") return;

            chatList.innerHTML = "";
            conversations.forEach(conv => {
                const item = document.createElement("div");
                item.className = "conversation-item";
                item.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border);
                    transition: 0.2s;
                    position: relative;
                `;
                
                // 🔐 ADMIN: Format différent (conversations.subject, participants)
                // STUDENT: Format conversions (participants)
                let displayName = "";
                let avatar = DEFAULT_IMG;
                let lastMessage = "Aucun message";
                
                if (isAdminUser) { 
                    // Toujours afficher le nom du contact visé dans la liste
                    const otherParticipant = conv.participants?.find(p => p.id !== currentUser?.id);
                    displayName = otherParticipant?.fullName || conv.studentName || conv.subject || "Conversation"; 
                    avatar = otherParticipant?.profileImage || conv.participants?.[0]?.avatar || DEFAULT_IMG; 
                    lastMessage = conv.lastMessage?.content || "Aucun message"; 
                } else { 
                    // Format student: conv.participants
                    const firstPart = conv.participants?.find(p => p.userId !== currentUser.id);
                    const otherUser = firstPart?.user;
                    displayName = otherUser?.fullName || "Sans nom";
                    avatar = otherUser?.profileImage || DEFAULT_IMG;
                    lastMessage = conv.messages?.[0]?.content || "Aucun message";
                }
                
                item.innerHTML = `
                    <img src="${avatar}" style="width:48px; height:48px; border-radius:50%; border:2px solid var(--gold); flex-shrink:0;">
                    <div style="flex:1; text-align:left; min-width:0;">
                        <div style="font-weight: bold; color:var(--text); margin-bottom:4px;">${displayName}</div>
                        <small style="color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block;">${lastMessage}</small>
                    </div>
                    ${isAdminUser ? `<button class="delete-conv-btn" style="background:none; border:none; color:var(--gold); cursor:pointer; font-size:18px; padding:4px;">×</button>` : ''}
                `;
                
                // Click sur la conversation
                item.querySelector('div') && item.querySelector('div').addEventListener('click', () => {
                    window.ouvrirConversation(conv.id, displayName);
                });
                
                // Click sur tout l'item sauf le bouton delete
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-conv-btn')) {
                        window.ouvrirConversation(conv.id, displayName);
                    }
                });
                item.addEventListener('touchend', (e) => {
                    if (!e.target.classList.contains('delete-conv-btn')) {
                        e.preventDefault();
                        window.ouvrirConversation(conv.id, displayName);
                    }
                }, { passive: false });
                
                // Bouton delete pour admin
                const deleteBtn = item.querySelector('.delete-conv-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        window.supprimerConversation(conv.id);
                    });
                }
                
                item.addEventListener('mouseover', () => {
                    item.style.background = "var(--bg-header)";
                });
                item.addEventListener('mouseout', () => {
                    item.style.background = "transparent";
                });
                
                chatList.appendChild(item);
            });
        } catch (err) {
            console.error("❌ Erreur chargerConversations:", err);
            chatList.innerHTML = "<p style='color:red; padding:20px;'>❌ Erreur de chargement: " + err.message + "</p>";
        }
    };

    loadConvs();
    // ✅ NE PAS AFFICHER LES GROUPES/DIFFUSIONS DANS L'ONGLET DISCUSSIONS
    clearInterval(conversationListeners['list']);
    // ✅ SI DÉJÀ UNE BOUCLE ACTIVE, L'ARRÊTER
    if (conversationListeners['list']) {
        clearInterval(conversationListeners['list']);
    }
    conversationListeners['list'] = setInterval(() => {
        if (!getAuthToken() || getAuthToken() === "COOKIES_AUTO") {
            clearInterval(conversationListeners['list']);
            return;
        }
        // ✅ RECHARGER UNIQUEMENT SI ON EST DANS L'ONGLET DISCUSSIONS ET AUCUNE CONVERSATION OUVERTE
        if (currentTab === "discussions" && !currentConversation) {
            loadConvs();
        }
    }, 15000);
}

// ============================================================
// RETOUR À TRAVEL EXPRESS MAIN
// ============================================================
window.retournerTravelExpressMain = () => {
    window.close();
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function getChatListId() {
    return isAdminUser ? "chatList" : "chatListStudent";
}

// ✅ Cleanup function to reset conversation state when switching types
function cleanupConversationState() {
    // Clear all message listeners
    Object.keys(messageListeners).forEach(key => {
        clearInterval(messageListeners[key]);
        delete messageListeners[key];
    });
    
    // Clear the message container
    const containerId = getMessagesContainerId();
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = "";
    }
    
    // Reset reply data
    replyData = null;
    messageContextId = null;
    lightboxMediaList = [];
    currentLightboxIndex = -1;
}

function getMessagesContainerId() {
    return isAdminUser ? "messages" : "messagesStudent";
}

function getChatHeaderTitleId() {
    return isAdminUser ? "chatHeaderTitle" : "chatHeaderTitleStudent";
}

function getInputId() {
    return isAdminUser ? "msgInput" : "msgInputStudent";
}

function getSendBtnId() {
    return isAdminUser ? "btnEnvoyer" : "btnEnvoyerStudent";
}

function getVoiceOverlayId() {
    return isAdminUser ? "voiceOverlay" : "voiceOverlayStudent";
}

function getFileInputId() {
    return isAdminUser ? "fileInput" : "fileInputStudent";
}

function getReplyPreviewId() {
    return isAdminUser ? "replyPreview" : "replyPreviewStudent";
}

// ============================================================
// NAVIGATION
// ============================================================
window.switchTab = (tabName) => {
    currentTab = tabName;
    currentConversation = null;

    const navSelectors = isAdminUser ? 
        document.querySelectorAll('#navTabsAdmin .tab-main') :
        document.querySelectorAll('#navTabsStudent .tab-main');

    navSelectors.forEach((btn) => {
        const isActive = btn.textContent.toLowerCase().includes(tabName.toLowerCase()) ||
                        (tabName === "discussions" && btn.textContent.includes("Discussions")) ||
                        (tabName === "groupes" && btn.textContent.includes("Groupes")) ||
                        (tabName === "diffusions" && btn.textContent.includes("Diffusions")) ||
                        (tabName === "parametres" && btn.textContent.includes("Paramètres"));
        btn.classList.toggle('active', isActive);
    });

    const chatListId = getChatListId();
    const chatList = document.getElementById(chatListId);
    if (chatList) chatList.innerHTML = "";

    if (tabName === "discussions") {
        // ✅ STUDENTS: Ne pas charger les conversations, ils voient seulement Assistant Social
        if (!isAdminUser) {
            chatList.innerHTML = "<p style='color:var(--text-muted); padding:20px; text-align:center; font-size:0.9em;'>Sélectionnez votre conversation ci-dessus</p>";
        } else {
            chargerConversations();
        }
    } else if (tabName === "groupes") {
        chargerGroupesList();
    } else if (tabName === "diffusions") {
        chargerDiffusionsList();
    }
};



window.toggleMobileView = (showChat) => {
    const sidebarId = isAdminUser ? "sidebar" : "sidebarStudent";
    const sidebar = document.getElementById(sidebarId);
    if (sidebar) {
        if (showChat) {
            sidebar.classList.add("mobile-hidden");
        } else {
            sidebar.classList.remove("mobile-hidden");
            currentConversation = null;
        }
    }
};

// ============================================================
// OUVRIR CONVERSATION
// ============================================================
window.ouvrirConversation = (conversationId, title = "Conversation") => {
    // ✅ Cleanup previous state and set new type
    cleanupConversationState();
    isConversationWithAssistantSocial = false;
    currentConversation = conversationId;
    currentConversationType = "direct"; // ✅ Set type for direct conversations
    // ✅ IMPORTANT: Mettre currentTab seulement pour l'étudiant (évite les reloads accidentels)
    // Pour l'admin, ne pas changer currentTab pour ne pas affecter la sidebar
    if (!isAdminUser) {
        currentTab = "discussions";
    }
    window.toggleMobileView(true);
    
    const titleId = getChatHeaderTitleId();
    const titleEl = document.getElementById(titleId);
    if (titleEl) {
        titleEl.innerHTML = `<b style="color:var(--gold);">${title}</b>`;
    }

    const containerId = getMessagesContainerId();
    const container = document.getElementById(containerId);
    if (!container) return;

    lightboxMediaList = [];

    const loadMessages = async () => {
        try {
            console.log("📥 Chargement messages pour conversation:", conversationId);
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            const token = getAuthToken();
            if (token && token !== "COOKIES_AUTO") {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // 🔐 Déterminer le bon endpoint selon le rôle et le type de conversation
            let endpoint = "";
            
            if (isAdminUser) {
                // ADMIN: Utiliser /api/admin/messaging/[id]
                endpoint = `${API_URL}/admin/messaging/${conversationId}`;
            } else if (isConversationWithAssistantSocial) {
                // STUDENT avec Assistant Social: Utiliser /api/student/admin/messages
                endpoint = `${API_URL}/student/admin/messages`;
            } else if (currentTab === "groupes") {
                // STUDENT avec groupes
                endpoint = `${API_URL}/student/groups/${conversationId}/messages`;
            } else if (currentTab === "diffusions") {
                // STUDENT avec diffusions
                endpoint = `${API_URL}/broadcasts/${conversationId}/messages`;
            } else {
                // STUDENT avec conversations
                endpoint = `${API_URL}/conversations/${conversationId}/messages`;
            }

            const res = await fetch(endpoint, {
                headers
            });
            
            if (!res.ok) {
                console.error("❌ Erreur API:", res.status, res.statusText);
                throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            }

            const responseData = await res.json();
            
            // Formater les messages selon le type de réponse
            let messages = [];
            if (isAdminUser) {
                // ADMIN: Format {conversation: {messages: [...]}}
                messages = responseData.conversation?.messages || [];
            } else if (isConversationWithAssistantSocial) {
                // STUDENT avec Assistant: Format {messages: [...]}
                messages = responseData.messages || [];
            } else {
                // Autres formats: array directement ou {messages: [...]}
                messages = Array.isArray(responseData) ? responseData : (responseData.messages || []);
            }

            console.log("✅ Messages chargés:", messages.length);

            container.innerHTML = "";

            messages.forEach((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const div = document.createElement("div");
                div.className = `message ${isMe ? 'sent' : 'received'}`;

                let html = "";
                
                if (msg.replyTo) {
                    html += `<div class="reply-quote">
                        <b style="color:var(--gold);">${msg.replyTo.sender?.fullName || "Utilisateur"}</b><br>
                        ${msg.replyTo.content}
                    </div>`;
                }

                if (msg.attachments && msg.attachments.length > 0) {
                    msg.attachments.forEach(att => {
                        // ✅ Priorité 1: .webm est toujours de l'audio (même si Cloudinary dit "video")
                        if (att.match(/\.webm($|\?|\#)/i)) {
                            html += `<div style="display:flex; align-items:center; gap:6px; padding:4px 6px; background:rgba(212,175,55,0.1); border-radius:6px; margin:3px 0;">
                                <i class="fas fa-volume-up" style="color:var(--gold); font-size:14px; flex-shrink:0;"></i>
                                <audio src="${att}" controls style="height:24px; max-width:140px; cursor:pointer;"></audio>
                            </div>`;
                        } else if (getAttachmentType(att) === "image") {
                            lightboxMediaList.push({ url: att, type: 'image' });
                            const mediaIndex = lightboxMediaList.length - 1;
                            html += `<img src="${att}" style="max-width:200px; border-radius:8px; cursor:pointer; margin:5px 0;" onclick="window.ouvrirPleinEcran('${att}', 'image', ${mediaIndex})">`;
                        } else if (getAttachmentType(att) === "audio") {
                            html += `<div style="display:flex; align-items:center; gap:6px; padding:4px 6px; background:rgba(212,175,55,0.1); border-radius:6px; margin:3px 0;">
                                <i class="fas fa-volume-up" style="color:var(--gold); font-size:14px; flex-shrink:0;"></i>
                                <audio src="${att}" controls style="height:24px; max-width:140px; cursor:pointer;"></audio>
                            </div>`;
                        } else if (getAttachmentType(att) === "video") {
                            lightboxMediaList.push({ url: att, type: 'video' });
                            const mediaIndex = lightboxMediaList.length - 1;
                            html += `<video src="${att}" style="max-width:200px; border-radius:8px; cursor:pointer; margin:5px 0;" controls onclick="window.ouvrirPleinEcran('${att}', 'video', ${mediaIndex})"></video>`;
                        } else {
                            html += `<a href="${att}" target="_blank" style="color:var(--gold); display:block; margin-top:5px;">📎 Fichier</a>`;
                        }
                    });
                }

                if (msg.content) {
                    html += `<div>${msg.content}</div>`;
                }

                const time = new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const readStatus = getReadStatusMarkup(msg, isMe);
div.innerHTML = `${html}<div style="font-size:0.7em; margin-top:4px; opacity:0.7; display:flex; align-items:center;">${time}${readStatus}</div>`;
                div.oncontextmenu = (e) => {
                    e.preventDefault();
                    showMessageContextMenu(e, msg.id, msg);
                };

                container.appendChild(div);
            });

            container.scrollTop = container.scrollHeight;
        } catch (err) {
            console.error("❌ Erreur chargement messages:", err);
            container.innerHTML = "<p style='color:red;'>❌ Erreur chargement messages: " + err.message + "</p>";
        }
    };

    loadMessages();
    if (messageListeners[conversationId]) {
        clearInterval(messageListeners[conversationId]);
    }
    messageListeners[conversationId] = setInterval(() => {
        if (!getAuthToken() || getAuthToken() === "COOKIES_AUTO") {
            clearInterval(messageListeners[conversationId]);
            return;
        }
        loadMessages();
    }, 10000);
};

// ============================================================
// ENVOYER MESSAGE
// ============================================================
window.envoyerMessageAction = async () => {
    const inputId = getInputId();
    const input = document.getElementById(inputId);
    const contenu = input.value.trim();

    if (!contenu || !currentConversation) return;

    try {
        console.log("📤 Action message...", { isEditing, currentConversation });
        
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = getAuthToken();
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // 🔄 SI ÉDITION: PATCH la prévious message
        if (isEditing && messageContextId) {
            console.log("✏️ Édition du message:", messageContextId);
            const res = await fetch(`${API_URL}/messages/${messageContextId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    content: contenu,
                    editedAt: new Date().toISOString()
                }),
                credentials: 'include'
            });

            if (!res.ok) {
                const errorData = await res.text();
                console.error("❌ Erreur édition API:", res.status, errorData);
                throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            }

            console.log("✅ Message modifié avec succès");
            isEditing = false;
            messageContextId = null;
        } else {
            // 📤 ENVOI nouveau message
            let endpoint = "";
            
            // 🔐 ADMIN: Utiliser /api/admin/messaging/[id] pour les conversations
            // STUDENT: Utiliser les endpoints spécifiques (groups, broadcasts, conversations, ou assistant social)
            if (isAdminUser && currentTab === "discussions") {
                // Les admins utilisent /api/admin/messaging pour les conversations directes
                endpoint = `${API_URL}/admin/messaging/${currentConversation}`;
            } else if (isConversationWithAssistantSocial) {
                // Les étudiants parlent avec l'assistant social via /api/student/admin/messages
                endpoint = `${API_URL}/student/admin/messages`;
            } else {
                // Déterminer l'endpoint basé sur l'onglet actif (groupes, diffusions, ou conversations student)
                if (currentTab === "groupes") {
                    endpoint = `${API_URL}/student/groups/${currentConversation}/messages`;
                } else if (currentTab === "diffusions") {
                    endpoint = `${API_URL}/broadcasts/${currentConversation}/messages`;
                } else {
                    endpoint = `${API_URL}/conversations/${currentConversation}/messages`;
                }
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    content: contenu,
                    senderId: currentUser.id
                }),
                credentials: 'include'
            });

            if (!res.ok) {
                const errorData = await res.text();
                console.error("❌ Erreur API:", res.status, errorData);
                throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            }

            console.log("✅ Message envoyé avec succès");
        }

        input.value = "";
        input.placeholder = "Tapez un message";
        replyData = null;
        const replyPreviewId = getReplyPreviewId();
        document.getElementById(replyPreviewId).style.display = "none";
        
        const titleId = getChatHeaderTitleId();
        const titleText = document.getElementById(titleId).innerText;
        
        // Recharger les messages basé sur le type
        if (isConversationWithAssistantSocial) {
            window.ouvrirConversationAssistantSocialMessages(currentConversation, titleText.replace(/👤\s*/, ""));
        } else if (currentTab === "groupes") {
            // Recharger simplement les messages du groupe sans réinitialiser toute l'interface
            const containerId = getMessagesContainerId();
            const container = document.getElementById(containerId);
            if (container) {
                chargerMessagesGroupe(currentConversation);
            }
        } else if (currentTab === "diffusions") {
            window.ouvrirDiffusion(currentConversation, titleText.replace(/^📢\s*/, ""));
        } else {
            window.ouvrirConversation(currentConversation, titleText);
        }
    } catch (err) {
        console.error("❌ Erreur action message:", err);
        alert("Erreur: " + err.message);
    }
};

// ============================================================
// MENU CONTEXTUEL
// ============================================================
function showMessageContextMenu(e, messageId, data) {
    messageContextId = messageId;
    replyData = data;
    const menu = document.getElementById("contextMenu");
    if (!menu) return;

    // Admin peut tout déleter, regular users seulement leurs propres messages
    const deleteBtn = menu.querySelector('.danger');
    if (deleteBtn) {
        deleteBtn.style.display = (isAdminUser || data.senderId === currentUser.id) ? "block" : "none";
    }

    // Admin peut éditer tous les messages, regular users seulement dans les 15 minutes de leurs propres messages
    const editBtn = document.getElementById("ctxEditBtn");
    if (editBtn) {
        let canEdit = false;
        if (isAdminUser) {
            canEdit = true; // Admin peut éditer tous les messages
        } else if (data.senderId === currentUser.id) {
            const msgTime = new Date(data.createdAt).getTime();
            const diffMin = (Date.now() - msgTime) / 60000;
            canEdit = diffMin < 15; // User peut éditer seulement dans les 15 minutes
        }
        editBtn.style.display = canEdit ? "block" : "none";
    }

    // Ajouter un bouton retransférer pour admin
    const retransferBtn = document.getElementById("ctxRetransferBtn");
    if (retransferBtn) {
        retransferBtn.style.display = isAdminUser ? "block" : "none";
    }

    menu.style.display = "block";
    menu.style.top = `${e.pageY}px`;
    menu.style.left = `${e.pageX}px`;
}

window.prepReply = () => {
    const replyPreviewId = getReplyPreviewId();
    const replySenderId = isAdminUser ? "replySender" : "replySenderStudent";
    const replyTextId = isAdminUser ? "replyText" : "replyTextStudent";
    
    document.getElementById(replyPreviewId).style.display = "flex";
    document.getElementById(replySenderId).innerText = replyData.sender?.fullName || "Utilisateur";
    document.getElementById(replyTextId).innerText = replyData.content || "Fichier média";
};

window.prepEdit = () => {
    const inputId = getInputId();
    const input = document.getElementById(inputId);
    input.value = replyData.content;
    isEditing = true;
    input.focus();
};

window.annulerReponse = () => {
    replyData = null;
    const replyPreviewId = getReplyPreviewId();
    document.getElementById(replyPreviewId).style.display = "none";
};

window.confirmSuppression = async () => {
    if (!confirm("Supprimer ce message ?")) return;

    try {
        const token = getAuthToken();
        const headers = {};
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/messages/${messageContextId}`, {
            method: 'DELETE',
            headers,
            credentials: 'include'
        });

        if (!res.ok) throw new Error("Erreur suppression");

        const titleId = getChatHeaderTitleId();
        const titleText = document.getElementById(titleId).innerText;
        
        // Recharger les messages du type actuel
        if (currentTab === "groupes") {
            chargerMessagesGroupe(currentConversation);
        } else if (currentTab === "diffusions") {
            window.ouvrirDiffusion(currentConversation, titleText.replace(/^📢\s*/, ""));
        } else {
            window.ouvrirConversation(currentConversation, titleText);
        }
    } catch (err) {
        console.error("Erreur:", err);
        alert("Erreur suppression");
    }
};

// ============================================================
// RETRANSFÉRER MESSAGE (ADMIN UNIQUEMENT)
// ============================================================
window.retransfererMessage = async () => {
    if (!isAdminUser) {
        alert("Seuls les admins peuvent retransférer les messages");
        return;
    }

    const messageData = replyData;
    if (!messageData || !messageContextId) {
        alert("Impossible de charger les données du message");
        return;
    }

    // Créer un modal pour sélectionner le destinataire
    const modal = document.createElement("div");
    modal.className = "modal-retransfer";
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    const content = document.createElement("div");
    content.style.cssText = `
        background: var(--bg-main);
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 500px;
        border: 1px solid var(--border);
        max-height: 80vh;
        overflow-y: auto;
    `;

    // Charger les contacts et les groupes/diffusions
    let users = [];
    let groups = [];
    let broadcasts = [];
    
    try {
        const token = getAuthToken();
        const headers = {'Content-Type': 'application/json'};
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Charger utilisateurs
        const usersRes = await fetch(`${API_URL}/users`, {headers, credentials: 'include'});
        if (usersRes.ok) {
            users = await usersRes.json();
            users = users.filter(u => u.id !== currentUser.id);
        }
        
        // Charger groupes
        const groupsRes = await fetch(`${API_URL}/groups`, {headers, credentials: 'include'});
        if (groupsRes.ok) {
            groups = await groupsRes.json();
        }
        
        // Charger broadcasts
        const broadcastsRes = await fetch(`${API_URL}/broadcasts`, {headers, credentials: 'include'});
        if (broadcastsRes.ok) {
            broadcasts = await broadcastsRes.json();
        }
    } catch (err) {
        console.error("❌ Erreur chargement contacts:", err);
    }

    content.innerHTML = `
        <h2 style="color: var(--gold); margin-bottom: 16px;">📤 Retransférer le message</h2>
        <p style="color: var(--text); margin-bottom: 12px; font-size: 0.9em;"><strong>Message:</strong> ${escapeHtml(messageData.content || "Fichier média").substring(0, 100)}</p>
        
        <div style="margin-bottom: 16px;">
            <label style="color: var(--text); font-weight: bold; display: block; margin-bottom: 8px;">👤 Utilisateurs:</label>
            <div id="usersContainer" style="display: flex; gap: 12px; flex-wrap: wrap; max-height: 120px; overflow-y: auto; padding: 8px; background: var(--bg-header); border-radius: 6px;"></div>
        </div>
        
        <div style="margin-bottom: 16px;">
            <label style="color: var(--text); font-weight: bold; display: block; margin-bottom: 8px;">📱 Groupes:</label>
            <div id="groupsContainer" style="display: flex; gap: 12px; flex-wrap: wrap; max-height: 120px; overflow-y: auto; padding: 8px; background: var(--bg-header); border-radius: 6px;"></div>
        </div>
        
        <div style="margin-bottom: 16px;">
            <label style="color: var(--text); font-weight: bold; display: block; margin-bottom: 8px;">📢 Diffusions:</label>
            <div id="broadcastsContainer" style="display: flex; gap: 12px; flex-wrap: wrap; max-height: 120px; overflow-y: auto; padding: 8px; background: var(--bg-header); border-radius: 6px;"></div>
        </div>
        
        <div style="display: flex; gap: 8px;">
            <button onclick="this.closest('[style*=z-index]').remove()" 
                    style="flex: 1; padding: 10px; background: #666; border: none; border-radius: 6px; color: white; cursor: pointer;">Annuler</button>
            <button onclick="window.confirmerRetransfer('${messageContextId}')" 
                    style="flex: 1; padding: 10px; background: var(--gold); border: none; border-radius: 6px; color: black; cursor: pointer; font-weight: bold;">Retransférer</button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Ajouter les utilisateurs
    const usersContainer = document.getElementById("usersContainer");
    users.forEach(user => {
        const card = document.createElement("div");
        card.className = "retransfer-option";
        card.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid var(--border);
            transition: 0.2s;
            min-width: 70px;
            flex-shrink: 0;
            background: transparent;
        `;
        
        card.innerHTML = `
            <input type="radio" name="destination" value="user_${user.id}" style="position: absolute; margin-top: -25px;">
            <img src="${user.profileImage || DEFAULT_IMG}" style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--gold);">
            <div style="font-size: 0.7em; color: var(--text); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65px;">${user.fullName.split(' ')[0]}</div>
        `;
        
        card.onclick = () => {
            card.querySelector('input[type="radio"]').checked = true;
            document.querySelectorAll('.retransfer-option').forEach(c => {
                c.style.borderColor = "var(--border)";
                c.style.background = "transparent";
            });
            card.style.borderColor = "var(--gold)";
            card.style.background = "rgba(212, 175, 55, 0.2)";
        };
        
        usersContainer.appendChild(card);
    });

    // Ajouter les groupes
    const groupsContainer = document.getElementById("groupsContainer");
    groups.forEach(group => {
        const card = document.createElement("div");
        card.className = "retransfer-option";
        card.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid var(--border);
            transition: 0.2s;
            min-width: 70px;
            flex-shrink: 0;
            background: transparent;
        `;
        
        card.innerHTML = `
            <input type="radio" name="destination" value="group_${group.id}" style="position: absolute; margin-top: -25px;">
            <div style="font-size: 20px; margin-bottom: 4px;">👥</div>
            <div style="font-size: 0.7em; color: var(--text); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65px;">${group.name}</div>
        `;
        
        card.onclick = () => {
            card.querySelector('input[type="radio"]').checked = true;
            document.querySelectorAll('.retransfer-option').forEach(c => {
                c.style.borderColor = "var(--border)";
                c.style.background = "transparent";
            });
            card.style.borderColor = "var(--gold)";
            card.style.background = "rgba(212, 175, 55, 0.2)";
        };
        
        groupsContainer.appendChild(card);
    });

    // Ajouter les broadcasts
    const broadcastsContainer = document.getElementById("broadcastsContainer");
    broadcasts.forEach(broadcast => {
        const card = document.createElement("div");
        card.className = "retransfer-option";
        card.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid var(--border);
            transition: 0.2s;
            min-width: 70px;
            flex-shrink: 0;
            background: transparent;
        `;
        
        card.innerHTML = `
            <input type="radio" name="destination" value="broadcast_${broadcast.id}" style="position: absolute; margin-top: -25px;">
            <div style="font-size: 20px; margin-bottom: 4px;">📢</div>
            <div style="font-size: 0.7em; color: var(--text); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65px;">${broadcast.name}</div>
        `;
        
        card.onclick = () => {
            card.querySelector('input[type="radio"]').checked = true;
            document.querySelectorAll('.retransfer-option').forEach(c => {
                c.style.borderColor = "var(--border)";
                c.style.background = "transparent";
            });
            card.style.borderColor = "var(--gold)";
            card.style.background = "rgba(212, 175, 55, 0.2)";
        };
        
        broadcastsContainer.appendChild(card);
    });

    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
};

window.confirmerRetransfer = async (messageId) => {
    const selected = document.querySelector('input[name="destination"]:checked');
    if (!selected) {
        alert("Veuillez sélectionner un destinataire");
        return;
    }

    const destination = selected.value;
    const [type, recipient] = destination.split('_');

    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const messageData = replyData;
        let endpoint = "";

        if (type === "user") {
            // 🔐 ADMIN: Créer/utiliser conversation via /api/admin/messaging
            // STUDENT: Utiliser /api/conversations
            endpoint = isAdminUser 
                ? `${API_URL}/admin/messaging/${recipient}` 
                : `${API_URL}/conversations/${recipient}/messages`;
        } else if (type === "group") {
            endpoint = `${API_URL}/student/groups/${recipient}/messages`;
        } else if (type === "broadcast") {
            endpoint = `${API_URL}/broadcasts/${recipient}/messages`;
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                content: messageData.content,
                attachments: messageData.attachments || [],
                senderId: currentUser.id,
                isRetransfer: true,
                originalMessageId: messageId
            }),
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error(`Erreur ${res.status}`);
        }

        alert("✅ Message retransféré avec succès!");
        document.querySelector('.modal-retransfer')?.parentElement?.remove();
    } catch (err) {
        console.error("❌ Erreur retransfer:", err);
        alert("❌ Erreur lors du retransfert: " + err.message);
    }
};

// ============================================================
// UPLOAD FICHIERS
// ============================================================
window.triggerFileUpload = () => {
    const fileInputId = getFileInputId();
    document.getElementById(fileInputId).click();
};

window.handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !currentConversation) return;

    for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", CL_PRESET);
        
        // Use resource_type: auto for documents, raw for any file type
        if (file.type.startsWith('image/')) {
            form.append("resource_type", "image");
        } else if (file.type.startsWith('audio/')) {
            form.append("resource_type", "auto");
        } else if (file.type.startsWith('video/')) {
            form.append("resource_type", "video");
        } else {
            // For documents and other files
            form.append("resource_type", "raw");
        }

        try {
            console.log(`📎 Uploading ${file.name} (${file.type})...`);
            
            const res = await fetch(CL_URL, { method: "POST", body: form });
            const data = await res.json();

            console.log("📊 Cloudinary response:", data);

            // Check for Cloudinary errors
            if (data.error) {
                console.error("❌ Cloudinary error:", data.error.message);
                throw new Error(`Cloudinary error: ${data.error.message}`);
            }

            if (data.secure_url) {
                // ✅ Utiliser le MÊME endpoint que envoyerMessageAction()
                let endpoint = "";
                
                if (isAdminUser && currentTab === "discussions") {
                    // Les admins utilisent /api/admin/messaging pour les conversations directes
                    endpoint = `${API_URL}/admin/messaging/${currentConversation}`;
                } else {
                    // Déterminer l'endpoint basé sur l'onglet actif (groupes, diffusions, ou conversations student)
                    if (currentTab === "groupes") {
                        endpoint = `${API_URL}/student/groups/${currentConversation}/messages`;
                    } else if (currentTab === "diffusions") {
                        endpoint = `${API_URL}/broadcasts/${currentConversation}/messages`;
                    } else {
                        endpoint = `${API_URL}/conversations/${currentConversation}/messages`;
                    }
                }

                console.log("📎 File upload endpoint:", endpoint);

                const token = getAuthToken();
                const headers = {
                    'Content-Type': 'application/json'
                };

                if (token && token !== "COOKIES_AUTO") {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const msgRes = await fetch(
                    endpoint,
                    {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({
                            content: `📎 ${file.name}`,
                            attachments: [data.secure_url],
                            senderId: currentUser.id
                        }),
                        credentials: 'include'
                    }
                );

                if (!msgRes.ok) {
                    const errorData = await msgRes.text();
                    console.error("❌ Erreur API:", msgRes.status, errorData);
                    throw new Error(`Erreur ${msgRes.status}: ${msgRes.statusText}`);
                }

                console.log("✅ Fichier uploadé et envoyé avec succès");
            } else {
                console.error("❌ No secure_url in Cloudinary response:", data);
                throw new Error("Cloudinary upload failed - no URL returned");
            }
        } catch (err) {
            console.error("❌ Erreur upload:", err);
            alert("❌ Erreur lors de l'upload: " + err.message);
        }
    }

    const fileInputId = getFileInputId();
    document.getElementById(fileInputId).value = "";
    const titleId = getChatHeaderTitleId();
    const titleText = document.getElementById(titleId).innerText;
    
    // ✅ Recharger selon le type
    setTimeout(() => {
        if (currentTab === "groupes") {
            chargerMessagesGroupe(currentConversation);
        } else if (currentTab === "diffusions") {
            window.ouvrirDiffusion(currentConversation, titleText.replace("📢 ", ""));
        } else {
            window.ouvrirConversation(currentConversation, titleText);
        }
    }, 1000);
};

// ============================================================
// MICROPHONE / VOICE MESSAGE
// ============================================================
const stopRecordingIfNeeded = () => {
    if (mediaRecorder?.state === "recording") {
        mediaRecorder.stop();
    }
};

window.onmouseup = stopRecordingIfNeeded;
window.ontouchend = stopRecordingIfNeeded;
window.onpointerup = stopRecordingIfNeeded;

const setupMicrophone = (micBtn) => {
    if (!micBtn) return;
    
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            
            mediaRecorder.onstart = () => {
                const voiceOverlayId = getVoiceOverlayId();
                document.getElementById(voiceOverlayId).style.display = "flex";
            };
            
            mediaRecorder.onstop = async () => {
                const voiceOverlayId = getVoiceOverlayId();
                document.getElementById(voiceOverlayId).style.display = "none";
                
                const blob = new Blob(audioChunks, { type: 'audio/ogg' });
                const form = new FormData();
                form.append("file", blob);
                form.append("upload_preset", CL_PRESET);
                form.append("resource_type", "auto");
                form.append("folder", "voice_notes");

                try {
                    const res = await fetch(CL_URL, { method: "POST", body: form });
                    const d = await res.json();
                    const attachmentUrl = d?.secure_url || await blobToDataUrl(blob);
                    if (!d?.secure_url) {
                        console.warn('Cloudinary audio refused, fallback base64');
                    }
                    
                    console.log("🎤 Cloudinary response:", {
                        secure_url: d.secure_url,
                        resource_type: d.resource_type,
                        format: d.format
                    });
                    // ✅ Utiliser le MÊME endpoint que envoyerMessageAction()
                    let endpoint = "";
                    
                    if (isConversationWithAssistantSocial) {
                        // Utiliser le nouvel endpoint pour l'Assistant Social (Super Admin)
                        endpoint = `${API_URL}/student/admin/messages`;
                    } else if (isAdminUser && currentTab === "discussions") {
                        // Les admins utilisent /api/admin/messaging pour les conversations directes
                        endpoint = `${API_URL}/admin/messaging/${currentConversation}`;
                    } else {
                        // Déterminer l'endpoint basé sur l'onglet actif (groupes, diffusions, ou conversations student)
                        if (currentTab === "groupes") {
                            endpoint = `${API_URL}/student/groups/${currentConversation}/messages`;
                        } else if (currentTab === "diffusions") {
                            endpoint = `${API_URL}/broadcasts/${currentConversation}/messages`;
                        } else {
                            endpoint = `${API_URL}/conversations/${currentConversation}/messages`;
                        }
                    }
                    
                    console.log("🎤 Voice message endpoint:", endpoint);
                    
                    const token = getAuthToken();
                    const headers = {
                        'Content-Type': 'application/json'
                    };

                    if (token && token !== "COOKIES_AUTO") {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                    
                    const msgRes = await fetch(
                        endpoint,
                        {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify({
                                content: "",
                                attachments: [attachmentUrl],
                                senderId: currentUser.id
                            }),
                            credentials: 'include'
                        }
                    );
                    
                    if (!msgRes.ok) {
                        const errorData = await msgRes.text();
                        console.error("❌ Erreur API:", msgRes.status, errorData);
                        throw new Error(`Erreur ${msgRes.status}: ${msgRes.statusText}`);
                    }
                    
                    console.log("✅ Message vocal envoyé avec succès");
                    
                    const titleId = getChatHeaderTitleId();
                    const titleText = document.getElementById(titleId).innerText;
                    
                    // ✅ Recharger selon le type de conversation
                    if (isConversationWithAssistantSocial) {
                        // Recharger les messages de l'Assistant Social
                        window.ouvrirConversationAssistantSocialMessages(currentConversation, titleText.replace(/👤\s*/, ""));
                    } else if (currentTab === "groupes") {
                        chargerMessagesGroupe(currentConversation);
                    } else if (currentTab === "diffusions") {
                        window.ouvrirDiffusion(currentConversation, titleText.replace("📢 ", ""));
                    } else {
                        window.ouvrirConversation(currentConversation, titleText);
                    }
                } catch (err) {
                    console.error("❌ Erreur audio:", err);
                    alert("❌ Erreur lors de l'envoi du message vocal: " + err.message);
                }
                
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
        } catch (e) {
            console.error("Microphone inaccessible:", e);
            alert("Microphone inaccessible. Autorisez le micro pour l'application puis réessayez.");
        }
    };

    micBtn.onmousedown = startRecording;
    micBtn.ontouchstart = (e) => {
        e.preventDefault();
        startRecording();
    };
    micBtn.onpointerdown = (e) => {
        e.preventDefault();
        startRecording();
    };
};

// ============================================================
// LIGHTBOX
// ============================================================
const appliquerTransformations = () => {
    const img = document.getElementById("lightboxImg");
    if (img) {
        img.style.transform = `scale(${currentZoom}) rotate(${currentRotation}deg)`;
        img.style.transition = "transform 0.2s ease";
    }
};

window.ouvrirPleinEcran = (url, type = 'image', mediaIndex = -1) => {
    const lb = document.getElementById("lightbox");
    const img = document.getElementById("lightboxImg");
    const video = document.getElementById("lightboxVideo");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");

    if (!lb) return;

    currentLightboxIndex = mediaIndex;
    const hasMultipleMedia = lightboxMediaList.length > 1;

    if (prevBtn) prevBtn.style.display = hasMultipleMedia ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = hasMultipleMedia ? 'flex' : 'none';

    if (type === 'image' && img) {
        img.src = url;
        img.style.display = "block";
        if (video) video.style.display = "none";
        lb.style.display = "flex";
        window.resetImage();
        const zoomControls = document.querySelectorAll('.lightbox-zoom-in, .lightbox-zoom-out, .lightbox-rotate, .lightbox-reset');
        zoomControls.forEach(ctrl => ctrl.style.display = 'flex');
    } else if (type === 'video' && video) {
        video.src = url;
        video.style.display = "block";
        if (img) img.style.display = "none";
        lb.style.display = "flex";
        const zoomControls = document.querySelectorAll('.lightbox-zoom-in, .lightbox-zoom-out, .lightbox-rotate, .lightbox-reset');
        zoomControls.forEach(ctrl => ctrl.style.display = 'none');
    }
};

window.closeLightbox = () => {
    const lb = document.getElementById("lightbox");
    const img = document.getElementById("lightboxImg");
    const video = document.getElementById("lightboxVideo");
    if (lb) lb.style.display = "none";
    if (img) {
        img.src = "";
        img.style.display = "none";
    }
    if (video) {
        video.src = "";
        video.style.display = "none";
    }
};

window.navigateLightbox = (direction) => {
    if (lightboxMediaList.length <= 1) return;
    const newIndex = currentLightboxIndex + direction;
    if (newIndex < 0 || newIndex >= lightboxMediaList.length) return;
    const media = lightboxMediaList[newIndex];
    window.ouvrirPleinEcran(media.url, media.type, newIndex);
};

window.zoomIn = () => { if (currentZoom < 4) { currentZoom += 0.2; appliquerTransformations(); } };
window.zoomOut = () => { if (currentZoom > 0.5) { currentZoom -= 0.2; appliquerTransformations(); } };
window.rotateImage = () => { currentRotation += 90; appliquerTransformations(); };
window.resetImage = () => { currentZoom = 1; currentRotation = 0; appliquerTransformations(); };

// ============================================================
// SETUP EVENT LISTENERS (appelé après initializeUser)
// ============================================================
function setupEventListeners() {
    console.log("🔧 Setup event listeners (isAdminUser=" + isAdminUser + ")");

    // ✅ Clone elements to remove ALL old listeners (prevents duplication)
    const cloneAndReplace = (id) => {
        const el = document.getElementById(id);
        if (el) {
            const newEl = el.cloneNode(true);
            if (el.parentNode) {
                el.parentNode.replaceChild(newEl, el);
            }
            return newEl;
        }
        return null;
    };

    // Clone input and button elements
    cloneAndReplace("msgInput");
    cloneAndReplace("msgInputStudent");
    cloneAndReplace("btnEnvoyer");
    cloneAndReplace("btnEnvoyerStudent");

    // Setup pour ADMIN
    const inputAdmin = document.getElementById("msgInput");
    if (inputAdmin) {
        inputAdmin.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                window.envoyerMessageAction();
            }
        });
        inputAdmin.oninput = (e) => {
            const sendBtn = document.getElementById("btnEnvoyer");
            const micBtn = document.getElementById("micBtn");
            const hasText = e.target.value.trim().length > 0;
            if (sendBtn) {
                sendBtn.style.display = hasText ? "block" : "none";
            }
            if (micBtn) {
                micBtn.style.display = hasText ? "none" : "block";
            }
        };
        console.log("✅ Setup keypress et oninput pour ADMIN");
    }

    // Setup pour STUDENT
    const inputStudent = document.getElementById("msgInputStudent");
    if (inputStudent) {
        inputStudent.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                window.envoyerMessageAction();
            }
        });
        inputStudent.oninput = (e) => {
            const sendBtn = document.getElementById("btnEnvoyerStudent");
            const micBtn = document.getElementById("micBtnStudent");
            const hasText = e.target.value.trim().length > 0;
            if (sendBtn) {
                sendBtn.style.display = hasText ? "block" : "none";
            }
            if (micBtn) {
                micBtn.style.display = hasText ? "none" : "block";
            }
        };
        console.log("✅ Setup keypress et oninput pour STUDENT");
    }

    // Setup send buttons AVEC listeners click
    const sendBtnAdmin = document.getElementById("btnEnvoyer");
    if (sendBtnAdmin) {
        sendBtnAdmin.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🖱️ Click btnEnvoyer");
            window.envoyerMessageAction();
        });
        console.log("✅ Listener click attaché à btnEnvoyer");
    } else {
        console.warn("❌ btnEnvoyer NOT FOUND!");
    }

    const sendBtnStudent = document.getElementById("btnEnvoyerStudent");
    if (sendBtnStudent) {
        sendBtnStudent.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🖱️ Click btnEnvoyerStudent");
            window.envoyerMessageAction();
        });
        console.log("✅ Listener click attaché à btnEnvoyerStudent");
    } else {
        console.warn("❌ btnEnvoyerStudent NOT FOUND!");
    }

    // Setup microphones
    const micBtn = document.getElementById("micBtn");
    if (micBtn) {
        console.log("🎤 Setup micBtn");
        setupMicrophone(micBtn);
    } else {
        console.warn("❌ micBtn NOT FOUND!");
    }

    const micBtnStudent = document.getElementById("micBtnStudent");
    if (micBtnStudent) {
        console.log("🎤 Setup micBtnStudent");
        setupMicrophone(micBtnStudent);
    } else {
        console.warn("❌ micBtnStudent NOT FOUND!");
    }

    // Setup context menu
    window.onclick = (e) => {
        const ctxMenu = document.getElementById("contextMenu");
        const lb = document.getElementById("lightbox");
        if (ctxMenu && ctxMenu.style.display === "block" && !ctxMenu.contains(e.target)) {
            ctxMenu.style.display = "none";
        }
        if (lb && e.target === lb) window.closeLightbox();
    };
    
    console.log("✅ Tous les event listeners sont configurés");
}

// ============================================================
// INITIALISATION
// ============================================================
window.onload = () => {
    console.log("🚀 window.onload called");
    setupEventListeners();
    if (!currentUser && typeof initializeUser === "function") {
        initializeUser().catch(err => console.error("❌ initializeUser onload:", err));
    }
};

// ============================================================
// CONFIGURATION GROUPE / DIFFUSION
// ============================================================
window.ouvrirConfig = async (type) => {
    const modal = document.createElement("div");
    modal.className = "modal-config";
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    const content = document.createElement("div");
    content.style.cssText = `
        background: var(--bg-main);
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 500px;
        border: 1px solid var(--border);
        max-height: 80vh;
        overflow-y: auto;
    `;

    // 🔄 Charger les contacts depuis l'API
    let users = [];
    try {
        const token = getAuthToken();
        const headers = {'Content-Type': 'application/json'};
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(`${API_URL}/users`, {headers, credentials: 'include'});
        if (res.ok) {
            users = await res.json();
            users = users.filter(u => u.id !== currentUser.id);
        }
    } catch (err) {
        console.error("❌ Erreur chargement contacts:", err);
    }

    const containerId = type === "groupe" ? "groupMembersContainer" : "broadcastMembersContainer";
    const toggleBtnId = type === "groupe" ? "toggleGroupBtn" : "toggleBroadcastBtn";

    if (type === "groupe") {
        content.innerHTML = `
            <h2 style="color: var(--gold); margin-bottom: 16px;">📱 Créer un Groupe</h2>
            <input type="text" id="groupName" placeholder="Nom du groupe" 
                   style="width:100%; padding:8px; margin-bottom:12px; background:var(--bg-header); border:1px solid var(--border); border-radius:6px; color:var(--text);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label style="color:var(--text); font-weight:bold;">Sélectionner les membres:</label>
                <button id="${toggleBtnId}" style="padding:4px 12px; background:var(--gold); border:none; border-radius:4px; color:black; cursor:pointer; font-weight:bold; font-size:12px;">
                    ✓ Tout sélectionner
                </button>
            </div>
            <div id="${containerId}" style="display:flex; gap:12px; overflow-x:auto; padding:12px 0; margin-bottom:16px; flex-wrap:wrap;">
                <!-- Les contacts seront ajoutés ici -->
            </div>
            <div style="display:flex; gap:8px;">
                <button onclick="this.closest('[style*=z-index]').remove()" 
                        style="flex:1; padding:10px; background:#666; border:none; border-radius:6px; color:white; cursor:pointer;">Annuler</button>
                <button onclick="window.creerGroupe()" 
                        style="flex:1; padding:10px; background:var(--gold); border:none; border-radius:6px; color:black; cursor:pointer; font-weight:bold;">Créer</button>
            </div>
        `;
    } else if (type === "diffusion") {
        content.innerHTML = `
            <h2 style="color: var(--gold); margin-bottom: 16px;">📢 Créer une Diffusion</h2>
            <input type="text" id="broadcastName" placeholder="Nom de la diffusion" 
                   style="width:100%; padding:8px; margin-bottom:12px; background:var(--bg-header); border:1px solid var(--border); border-radius:6px; color:var(--text);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label style="color:var(--text); font-weight:bold;">Sélectionner les destinataires:</label>
                <button id="${toggleBtnId}" style="padding:4px 12px; background:var(--gold); border:none; border-radius:4px; color:black; cursor:pointer; font-weight:bold; font-size:12px;">
                    ✓ Tout sélectionner
                </button>
            </div>
            <div id="${containerId}" style="display:flex; gap:12px; overflow-x:auto; padding:12px 0; margin-bottom:16px; flex-wrap:wrap;">
                <!-- Les contacts seront ajoutés ici -->
            </div>
            <div style="display:flex; gap:8px;">
                <button onclick="this.closest('[style*=z-index]').remove()" 
                        style="flex:1; padding:10px; background:#666; border:none; border-radius:6px; color:white; cursor:pointer;">Annuler</button>
                <button onclick="window.creerDiffusion()" 
                        style="flex:1; padding:10px; background:var(--gold); border:none; border-radius:6px; color:black; cursor:pointer; font-weight:bold;">Créer</button>
            </div>
        `;
    }

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Attacher le listener du button toggle
    const toggleBtn = document.getElementById(toggleBtnId);
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            window.toggleSelectAll(containerId);
        });
    }

    // Fonction utilitaire pour mettre à jour le style des cartes
    const updateCardStyle = (card, isSelected) => {
        if (!card) return;
        if (isSelected) {
            card.style.background = "var(--gold)";
            card.style.borderColor = "var(--gold)";
            card.style.boxShadow = "0 0 12px rgba(212, 175, 55, 0.5)";
        } else {
            card.style.background = "transparent";
            card.style.borderColor = "var(--border)";
            card.style.boxShadow = "none";
        }
    };

    // Ajouter les contacts comme cartes avec checkboxes
    const container = document.getElementById(containerId);
    users.forEach(user => {
        const checkboxId = `checkbox-${user.id}`;
        const contactCard = document.createElement("div");
        contactCard.className = "modal-contact-card";
        contactCard.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid var(--border);
            transition: 0.2s;
            min-width: 70px;
            flex-shrink: 0;
            position: relative;
        `;
        
        const avatar = user.profileImage || DEFAULT_IMG;
        const name = user.fullName || "Sans nom";

        contactCard.innerHTML = `
            <input type="checkbox" id="${checkboxId}" value="${user.id}" 
                   style="position:absolute; top:4px; right:4px; cursor:pointer; width:16px; height:16px;">
            <img src="${avatar}" style="width:36px; height:36px; border-radius:50%; border:2px solid var(--gold);">
            <div style="font-size:0.7em; font-weight:bold; color:var(--text); text-align:center; overflow:hidden; text-overflow:ellipsis; max-width:65px;">${name.split(' ')[0]}</div>
        `;

        const checkbox = contactCard.querySelector(`#${checkboxId}`);
        
        // Au clic sur la carte, toggle le checkbox
        contactCard.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            // Mettre à jour le style
            updateCardStyle(contactCard, checkbox.checked);
        });

        // Au clic sur le checkbox, le toggle se fait automatiquement
        checkbox.addEventListener('change', () => {
            updateCardStyle(contactCard, checkbox.checked);
        });

        container.appendChild(contactCard);
    });

    // Fermer quand on clique en dehors
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Stocker updateCardStyle dans le modal pour que toggleSelectAll puisse l'utiliser
    modal.updateCardStyle = updateCardStyle;
};

window.creerGroupe = async () => {
    const name = document.getElementById("groupName")?.value;
    const container = document.getElementById("groupMembersContainer");
    const checkboxes = container ? Array.from(container.querySelectorAll('input[type="checkbox"]:checked')) : [];
    const memberIds = checkboxes.map(cb => cb.value);
    
    if (!name) {
        alert("Veuillez entrer un nom de groupe");
        return;
    }
    if (memberIds.length === 0) {
        alert("Veuillez sélectionner au moins un membre");
        return;
    }
    
    try {
        console.log("📝 Création groupe:", name, "Membres:", memberIds);
        
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(`${API_URL}/groups`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
                name,
                memberIds
            })
        });
        
        if (!res.ok) {
            const error = await res.json();
            const errorMsg = error.message || error.error || 'Impossible de créer le groupe';
            console.error("❌ Erreur serveur:", error);
            alert(`❌ Erreur: ${errorMsg}`);
            return;
        }
        
        const group = await res.json();
        console.log("✅ Groupe créé:", group);
        alert(`✅ Groupe "${name}" créé avec ${memberIds.length} membre(s)!`);
        
        // Fermer le modal
        document.querySelector(".modal-config")?.parentElement?.remove();
        
        // Recharger les conversations/groupes
        chargerConversations();
    } catch (err) {
        console.error("❌ Erreur création groupe:", err);
        alert("❌ Erreur: " + err.message);
    }
};

window.creerDiffusion = async () => {
    const name = document.getElementById("broadcastName")?.value;
    const container = document.getElementById("broadcastMembersContainer");
    const checkboxes = container ? Array.from(container.querySelectorAll('input[type="checkbox"]:checked')) : [];
    const recipientIds = checkboxes.map(cb => cb.value);
    
    if (!name) {
        alert("Veuillez entrer un nom de diffusion");
        return;
    }
    if (recipientIds.length === 0) {
        alert("Veuillez sélectionner au moins un destinataire");
        return;
    }
    
    try {
        console.log("📢 Création diffusion:", name, "Destinataires:", recipientIds);
        
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(`${API_URL}/broadcasts`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
                name,
                recipientIds
            })
        });
        
        if (!res.ok) {
            const error = await res.json();
            const errorMsg = error.message || error.error || 'Impossible de créer la diffusion';
            console.error("❌ Erreur serveur:", error);
            alert(`❌ Erreur: ${errorMsg}`);
            return;
        }
        
        const broadcast = await res.json();
        console.log("✅ Diffusion créée:", broadcast);
        alert(`✅ Diffusion "${name}" créée pour ${recipientIds.length} contact(s)!`);
        
        // Fermer le modal
        document.querySelector(".modal-config")?.parentElement?.remove();
        
        // Recharger les conversations
        chargerConversations();
    } catch (err) {
        console.error("❌ Erreur création diffusion:", err);
        alert("❌ Erreur: " + err.message);
    }
};

// ============================================================
// TOGGLE SÉLECTIONNER/DÉSÉLECTIONNER TOUT
// ============================================================
window.toggleSelectAll = (containerId) => {
    const container = document.getElementById(containerId);
    const button = document.getElementById(
        containerId === "groupMembersContainer" ? "toggleGroupBtn" : "toggleBroadcastBtn"
    );
    
    if (!container || !button) return;
    
    // Récupérer tous les checkboxes
    const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    const allSelected = checkboxes.every(cb => cb.checked);
    
    // Inverser la sélection
    checkboxes.forEach((cb, index) => {
        const card = cb.closest('.modal-contact-card');
        cb.checked = !allSelected;
        // Mettre à jour le style de la carte
        if (card) {
            if (!allSelected) {
                card.style.background = "var(--gold)";
                card.style.borderColor = "var(--gold)";
                card.style.boxShadow = "0 0 12px rgba(212, 175, 55, 0.5)";
            } else {
                card.style.background = "transparent";
                card.style.borderColor = "var(--border)";
                card.style.boxShadow = "none";
            }
        }
    });
    
    // Mettre à jour le texte du bouton
    button.textContent = !allSelected ? "✓ Tout désélectionner" : "✓ Tout sélectionner";
    
    console.log(`${containerId}: ${!allSelected ? 'Tout sélectionné' : 'Tout désélectionné'}`);
};

// ============================================================
// AFFICHER MENU DE CONTACT (DISCUSSION OU AJOUTER AU GROUPE)
// ============================================================
window.afficherMenuContact = (userId, userName, userImage) => {
    const menu = document.createElement("div");
    menu.className = "contact-menu";
    menu.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--bg-main);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px;
        z-index: 999;
        min-width: 200px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    menu.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--border);">
            <img src="${userImage}" style="width:32px; height:32px; border-radius:50%; border:2px solid var(--gold);">
            <div>
                <strong style="color:var(--text);">${userName}</strong>
            </div>
        </div>
        <button onclick="creerConversationAvecContact('${userId}', '${userName}', '${userImage}'); document.querySelector('.contact-menu').remove();" 
                style="width:100%; padding:8px; background:var(--gold); border:none; border-radius:6px; color:black; cursor:pointer; font-weight:bold; margin-bottom:6px;">
            💬 Ouvrir discussion
        </button>
        <button onclick="window.ajouterContactAuGroupe('${userId}', '${userName}'); document.querySelector('.contact-menu').remove();" 
                style="width:100%; padding:8px; background:#666; border:none; border-radius:6px; color:white; cursor:pointer; font-weight:bold;">
            ➕ Ajouter au groupe/diffusion
        </button>
    `;

    document.body.appendChild(menu);

    // Fermer le menu au clic en dehors
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
};

// ============================================================
// AJOUTER CONTACT À UN GROUPE OU UNE DIFFUSION EXISTANTE
// ============================================================
window.ajouterContactAuGroupe = async (userId, userName) => {
    const modal = document.createElement("div");
    modal.className = "modal-add-to-group";
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
    `;

    const content = document.createElement("div");
    content.style.cssText = `
        background: var(--bg-main);
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 400px;
        border: 1px solid var(--border);
        max-height: 80vh;
        overflow-y: auto;
    `;

    try {
        const token = getAuthToken();
        const headers = {'Content-Type': 'application/json'};
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Charger les groupes et diffusions
        const [groupRes, broadcastRes] = await Promise.all([
            fetch(`${API_URL}/groups`, { headers, credentials: 'include' }),
            fetch(`${API_URL}/broadcasts`, { headers, credentials: 'include' })
        ]);

        let groups = [], broadcasts = [];
        if (groupRes.ok) groups = await groupRes.json();
        if (broadcastRes.ok) broadcasts = await broadcastRes.json();

        // Si l'utilisateur n'est pas admin, filtrer les groupes/diffusions qu'il a créés
        if (!isAdminUser) {
            groups = groups.filter(g => g.createdBy === currentUser.id);
            broadcasts = broadcasts.filter(b => b.createdBy === currentUser.id);
        }

        let html = `
            <h2 style="color: var(--gold); margin-bottom: 16px;">➕ Ajouter ${userName}</h2>
        `;

        // Groupes
        if (groups.length > 0) {
            html += `<h3 style="color:var(--gold); margin-top:16px;">📱 Groupes</h3>`;
            groups.forEach(group => {
                // Vérifier si l'utilisateur est déjà membre
                const isAlreadyMember = group.members.some(m => m.userId === userId);
                html += `
                    <div style="padding:8px; background:var(--bg-header); border-radius:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                        <span>${group.name}</span>
                        <button onclick="window.ajouterContactAGroupeAPI('${group.id}', '${userId}', this)" 
                                style="padding:4px 8px; background:var(--gold); border:none; border-radius:4px; color:black; cursor:pointer; font-weight:bold; font-size:12px;">
                            ${isAlreadyMember ? "✓ Membre" : "+ Ajouter"}
                        </button>
                    </div>
                `;
            });
        }

        // Diffusions
        if (broadcasts.length > 0) {
            html += `<h3 style="color:var(--gold); margin-top:16px;">📢 Diffusions</h3>`;
            broadcasts.forEach(bc => {
                const isAlreadyMember = bc.recipients.some(r => r.userId === userId);
                html += `
                    <div style="padding:8px; background:var(--bg-header); border-radius:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                        <span>${bc.name}</span>
                        <button onclick="window.ajouterContactADiffusionAPI('${bc.id}', '${userId}', this)" 
                                style="padding:4px 8px; background:var(--gold); border:none; border-radius:4px; color:black; cursor:pointer; font-weight:bold; font-size:12px;">
                            ${isAlreadyMember ? "✓ Membre" : "+ Ajouter"}
                        </button>
                    </div>
                `;
            });
        }

        if (groups.length === 0 && broadcasts.length === 0) {
            html += `<p style="color:var(--text-muted); text-align:center;">Aucun groupe ou diffusion disponible</p>`;
        }

        html += `
            <div style="display:flex; gap:8px; margin-top:16px;">
                <button onclick="this.closest('[style*=z-index]').remove()" 
                        style="flex:1; padding:10px; background:#666; border:none; border-radius:6px; color:white; cursor:pointer;">Fermer</button>
            </div>
        `;

        content.innerHTML = html;
        modal.appendChild(content);
        document.body.appendChild(modal);

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

    } catch (err) {
        console.error("❌ Erreur ajouterContactAuGroupe:", err);
        content.innerHTML = `
            <h2 style="color: var(--gold);">❌ Erreur</h2>
            <p style="color: #f00;">${err.message}</p>
            <button onclick="this.closest('[style*=z-index]').remove()" style="padding:10px; background:var(--gold); border:none; border-radius:6px; color:black; cursor:pointer; font-weight:bold;">Fermer</button>
        `;
        modal.appendChild(content);
        document.body.appendChild(modal);
    }
};

window.ajouterContactAGroupeAPI = async (groupId, userId, button) => {
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/groups/${groupId}`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ memberIds: [userId] })
        });

        if (res.ok) {
            button.textContent = "✓ Membre";
            button.disabled = true;
            button.style.opacity = "0.6";
            button.style.cursor = "default";
            console.log("✅ Contact ajouté au groupe");
        } else {
            const error = await res.json();
            alert(`❌ Erreur: ${error.error || 'Impossible d\'ajouter'}`);
        }
    } catch (err) {
        console.error("❌ Erreur ajouterContactAGroupeAPI:", err);
        alert("❌ Erreur: " + err.message);
    }
};

window.ajouterContactADiffusionAPI = async (broadcastId, userId, button) => {
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/broadcasts/${broadcastId}`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ recipientIds: [userId] })
        });

        if (res.ok) {
            button.textContent = "✓ Membre";
            button.disabled = true;
            button.style.opacity = "0.6";
            button.style.cursor = "default";
            console.log("✅ Contact ajouté à la diffusion");
        } else {
            const error = await res.json();
            alert(`❌ Erreur: ${error.error || 'Impossible d\'ajouter'}`);
        }
    } catch (err) {
        console.error("❌ Erreur ajouterContactADiffusionAPI:", err);
        alert("❌ Erreur: " + err.message);
    }
};

// ============================================================
// CHARGER LES GROUPES ET DIFFUSIONS
// ============================================================
// ============================================================
// CHARGER GROUPES UNIQUEMENT
// ============================================================
async function chargerGroupesList() {
    try {
        console.log("📥 Chargement groupes...");
        
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            'credentials': 'include'
        };
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const groupRes = await fetch(`${API_URL}/groups`, {
            headers,
            credentials: 'include'
        });

        if (!groupRes.ok) {
            console.error("❌ Erreur API groupes");
            return;
        }

        const groups = await groupRes.json();
        console.log("✅ Groupes chargés:", groups.length);

        const chatListId = getChatListId();
        const chatList = document.getElementById(chatListId);
        
        if (!chatList) return;
        
        chatList.innerHTML = groups.map(group => `
            <div onclick="window.ouvrirGroupe('${group.id}', '${group.name}')" 
                 style="padding:12px; border-bottom:1px solid var(--border); color:var(--text); font-size:0.9em; cursor:pointer; transition:0.2s;" 
                 onmouseover="this.style.background='var(--bg-header)'" 
                 onmouseout="this.style.background='transparent'">
                <strong style="color:var(--gold);">📱 ${group.name}</strong>
                <small style="display:block; margin-top:4px; color:var(--text-muted);">
                    Membres: ${group.memberDetails?.length || 0}
                    ${group.canManage ? '<button onclick="event.stopPropagation(); window.supprimerGroupe(\'' + group.id + '\', \'' + group.name + '\')" style="float:right; padding:4px 8px; background:red; border:none; border-radius:4px; color:white; cursor:pointer; font-size:11px;">Supprimer</button>' : ''}
                </small>
            </div>
        `).join('');

    } catch (err) {
        console.error("❌ Erreur chargerGroupesList:", err);
    }
}

// ============================================================
// CHARGER DIFFUSIONS UNIQUEMENT
// ============================================================
async function chargerDiffusionsList() {
    try {
        console.log("📥 Chargement diffusions...");
        
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            'credentials': 'include'
        };
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const broadcastRes = await fetch(`${API_URL}/broadcasts`, {
            headers,
            credentials: 'include'
        });

        if (!broadcastRes.ok) {
            console.error("❌ Erreur API diffusions");
            return;
        }

        const broadcasts = await broadcastRes.json();
        console.log("✅ Diffusions chargées:", broadcasts.length);

        const chatListId = getChatListId();
        const chatList = document.getElementById(chatListId);
        
        if (!chatList) return;
        
        chatList.innerHTML = broadcasts.map(bc => `
            <div onclick="window.ouvrirDiffusion('${bc.id}', '${bc.name}')" 
                 style="padding:12px; border-bottom:1px solid var(--border); color:var(--text); font-size:0.9em; cursor:pointer; transition:0.2s;" 
                 onmouseover="this.style.background='var(--bg-header)'" 
                 onmouseout="this.style.background='transparent'">
                <strong style="color:var(--gold);">📢 ${bc.name}</strong> 
                <small style="display:block; margin-top:4px; color:var(--text-muted);"> 
                    ${bc.canManage ? `Destinataires: ${bc.recipientDetails?.length || 0}` : ''} 
                    ${bc.canManage ? '<button onclick="event.stopPropagation(); window.supprimerDiffusion(\'' + bc.id + '\', \'' + bc.name + '\')" style="float:right; padding:4px 8px; background:red; border:none; border-radius:4px; color:white; cursor:pointer; font-size:11px;">Supprimer</button>' : ''} 
                </small> 
            </div> 
        `).join(''); 

    } catch (err) {
        console.error("❌ Erreur chargerDiffusionsList:", err);
    }
}

async function chargerGroupes() {
    try {
        console.log("📥 Chargement groupes et diffusions...");
        
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            'credentials': 'include'
        };
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Charger les groupes
        const groupRes = await fetch(`${API_URL}/groups`, {
            headers,
            credentials: 'include'
        });

        // Charger les diffusions
        const broadcastRes = await fetch(`${API_URL}/broadcasts`, {
            headers,
            credentials: 'include'
        });

        if (!groupRes.ok || !broadcastRes.ok) {
            console.error("❌ Erreur API groupes/diffusions");
            return;
        }

        const groups = await groupRes.json();
        const broadcasts = await broadcastRes.json();

        console.log("✅ Groupes chargés:", groups.length, "Diffusions:", broadcasts.length);

        const chatListId = getChatListId();
        const chatList = document.getElementById(chatListId);
        
        if (!chatList) return;
        
        // Afficher les groupes
        if (groups.length > 0) {
            const groupsHtml = groups.map(group => `
                <div style="padding:12px; border-bottom:1px solid var(--border); color:var(--text-muted); font-size:0.9em; margin-top:8px;">
                    <strong style="color:var(--gold);">📱 ${group.name}</strong>
                    <small style="display:block; margin-top:4px;">
                        Créé par: ${group.creator.fullName}<br>
                        Membres: ${group.memberDetails?.length || 0}
                    </small>
                </div>
            `).join('');
            
            chatList.innerHTML += `
                <div style="margin-top:16px; padding:8px; border-top:2px solid var(--gold);">
                    <h3 style="color:var(--gold); margin:0 0 8px 0;">📱 GROUPES (${groups.length})</h3>
                    ${groupsHtml}
                </div>
            `;
        }

        // Afficher les diffusions
        if (broadcasts.length > 0) {
            const broadcastsHtml = broadcasts.map(bc => `
                <div style="padding:12px; border-bottom:1px solid var(--border); color:var(--text-muted); font-size:0.9em;">
                    <strong style="color:var(--gold);">📢 ${bc.name}</strong> 
                    <small style="display:block; margin-top:4px;"> 
                        Créée par: ${bc.creator.fullName}
                        ${bc.canManage ? `<br>Destinataires: ${bc.recipientDetails?.length || 0}` : ''} 
                    </small> 
                </div> 
            `).join(''); 
            
            chatList.innerHTML += `
                <div style="margin-top:16px; padding:8px; border-top:2px solid var(--gold);">
                    <h3 style="color:var(--gold); margin:0 0 8px 0;">📢 DIFFUSIONS (${broadcasts.length})</h3>
                    ${broadcastsHtml}
                </div>
            `;
        }

    } catch (err) {
        console.error("❌ Erreur chargerGroupes:", err);
    }
}

// ============================================================
// SUPPRIMER UNE CONVERSATION
// ============================================================
window.supprimerConversation = async (conversationId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette conversation?")) {
        return;
    }
    
    try {
        console.log("🗑️ Suppression conversation:", conversationId);
        
        const token = getAuthToken();
        const headers = {'Content-Type': 'application/json'};
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // ✅ Utiliser le bon endpoint selon le rôle
        let endpoint;
        if (isAdminUser) {
            // Les admins utilisent /api/admin/messaging/{id}
            endpoint = `${API_URL}/admin/messaging/${conversationId}`;
        } else {
            // Les étudiants utilisent /api/conversations/{id}
            endpoint = `${API_URL}/conversations/${conversationId}`;
        }
        
        console.log("🗑️ Suppression endpoint:", endpoint);
        
        const res = await fetch(endpoint, {
            method: 'DELETE',
            headers,
            credentials: 'include'
        });
        
        if (!res.ok) {
            const errorData = await res.text();
            console.error("❌ Erreur API:", res.status, errorData);
            throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        }
        
        console.log("✅ Conversation supprimée");
        currentConversation = null;
        chargerConversations();
    } catch (err) {
        console.error("❌ Erreur suppression:", err);
        alert("Erreur lors de la suppression: " + err.message);
    }
};

// ============================================================
// SUPPRIMER UN GROUPE
// ============================================================
window.supprimerGroupe = async (groupId, groupName) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le groupe "${groupName}" ?`)) {
        return;
    }
    
    try {
        console.log("🗑️ Suppression groupe:", groupId);
        
        const token = getAuthToken();
        const headers = {'Content-Type': 'application/json'};
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // ✅ Utiliser /api/student/groups/{id} pour la suppression
        const res = await fetch(`${API_URL}/student/groups/${groupId}`, {
            method: 'DELETE',
            headers,
            credentials: 'include'
        });
        
        if (!res.ok) {
            const errorData = await res.text();
            console.error("❌ Erreur API:", res.status, errorData);
            throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        }
        
        console.log("✅ Groupe supprimé");
        alert('✅ Groupe supprimé');
        chargerGroupesList();
    } catch (err) {
        console.error("❌ Erreur suppression groupe:", err);
        alert("❌ Erreur lors de la suppression: " + err.message);
    }
};

// ============================================================
// SUPPRIMER UNE DIFFUSION
// ============================================================
window.supprimerDiffusion = async (broadcastId, broadcastName) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la diffusion "${broadcastName}" ?`)) {
        return;
    }
    
    try {
        console.log("🗑️ Suppression diffusion:", broadcastId);
        
        const token = getAuthToken();
        const headers = {'Content-Type': 'application/json'};
        if (token && token !== "COOKIES_AUTO") {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // ✅ Utiliser /api/broadcasts/{id} pour la suppression
        const res = await fetch(`${API_URL}/broadcasts/${broadcastId}`, {
            method: 'DELETE',
            headers,
            credentials: 'include'
        });
        
        if (!res.ok) {
            const errorData = await res.text();
            console.error("❌ Erreur API:", res.status, errorData);
            throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        }
        
        console.log("✅ Diffusion supprimée");
        alert('✅ Diffusion supprimée');
        chargerDiffusionsList();
    } catch (err) {
        console.error("❌ Erreur suppression diffusion:", err);
        alert("❌ Erreur lors de la suppression: " + err.message);
    }
};

// ============================================================
// OUVRIR UN GROUPE
// ============================================================
window.ouvrirGroupe = (groupId, groupName) => {
    // ✅ Cleanup previous state and set new type
    cleanupConversationState();
    isConversationWithAssistantSocial = false;
    currentConversation = groupId;
    currentConversationType = "groupe"; // ✅ Set type for group conversations
    // ✅ IMPORTANT: Mettre currentTab seulement pour l'étudiant
    if (!isAdminUser) {
        currentTab = "groupes";
    }
    window.toggleMobileView(true);
    
    const titleId = getChatHeaderTitleId();
    const titleEl = document.getElementById(titleId);
    if (titleEl) {
        titleEl.innerHTML = `<b style="color:var(--gold);">📱 ${groupName}</b>`;
    }
    
    const containerId = getMessagesContainerId();
    const container = document.getElementById(containerId);
    if (!container) return;

    lightboxMediaList = [];

    const loadMessages = async () => {
        try {
            console.log("📥 Chargement messages groupe:", groupId);
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (authToken && authToken !== "COOKIES_AUTO") {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const res = await fetch(`${API_URL}/student/groups/${groupId}/messages`, {
                headers,
                credentials: 'include'
            });
            
            if (!res.ok) {
                console.error("❌ Erreur API:", res.status, res.statusText);
                throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            const messages = Array.isArray(data) ? data : (data.messages || []);

            console.log("✅ Messages groupe chargés:", messages.length);

            // ✅ Vérifier si c'est le premier chargement
            const isFirstLoad = container.innerHTML === "";
            const wasScrolledToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;

            container.innerHTML = "";

            messages.forEach((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const div = document.createElement("div");
                div.className = `message ${isMe ? 'sent' : 'received'}`;

                let html = "";
                
                if (msg.attachments && msg.attachments.length > 0) {
                    msg.attachments.forEach(att => {
                        if (getAttachmentType(att) === "image") {
                            lightboxMediaList.push({ url: att, type: 'image' });
                            const mediaIndex = lightboxMediaList.length - 1;
                            html += `<img src="${att}" style="max-width:200px; border-radius:8px; cursor:pointer; margin:5px 0;" onclick="window.ouvrirPleinEcran('${att}', 'image', ${mediaIndex})">`;
                        } else if (getAttachmentType(att) === "audio") {
                            html += `<div style="display:flex; align-items:center; gap:6px; padding:4px 6px; background:rgba(212,175,55,0.1); border-radius:6px; margin:3px 0;">
                                <i class="fas fa-volume-up" style="color:var(--gold); font-size:14px; flex-shrink:0;"></i>
                                <audio src="${att}" controls style="height:24px; max-width:140px; cursor:pointer;"></audio>
                            </div>`;
                        } else if (getAttachmentType(att) === "video") {
                            lightboxMediaList.push({ url: att, type: 'video' });
                            const mediaIndex = lightboxMediaList.length - 1;
                            html += `<video src="${att}" style="max-width:200px; border-radius:8px; cursor:pointer; margin:5px 0;" controls onclick="window.ouvrirPleinEcran('${att}', 'video', ${mediaIndex})"></video>`;
                        } else {
                            html += `<a href="${att}" target="_blank" style="color:var(--gold); display:block; margin-top:5px;">📎 Fichier</a>`;
                        }
                    });
                }

                if (msg.content) {
                    html += `<div>${msg.content}</div>`;
                }

                const time = new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const readStatus = getReadStatusMarkup(msg, isMe);
div.innerHTML = `${html}<div style="font-size:0.7em; margin-top:4px; opacity:0.7; display:flex; align-items:center;">${time}${readStatus}</div>`;

                container.appendChild(div);
            });

            // ✅ Scroller vers le bas seulement si c'est le premier chargement ou si on était déjà au bottom
            if (isFirstLoad || wasScrolledToBottom) {
                container.scrollTop = container.scrollHeight;
            }
        } catch (err) {
            console.error("❌ Erreur chargement messages groupe:", err);
            container.innerHTML = "<p style='color:red;'>❌ Erreur chargement messages: " + err.message + "</p>";
        }
    };

    loadMessages();
    if (messageListeners[groupId]) {
        clearInterval(messageListeners[groupId]);
    }
    messageListeners[groupId] = setInterval(() => {
        if (!getAuthToken() || getAuthToken() === "COOKIES_AUTO") {
            clearInterval(messageListeners[groupId]);
            return;
        }
        loadMessages();
    }, 10000);
};

// ============================================================
// OUVRIR UNE DIFFUSION
// ============================================================
window.ouvrirDiffusion = (broadcastId, broadcastName) => {
    // ✅ Cleanup previous state and set new type
    cleanupConversationState();
    isConversationWithAssistantSocial = false;
    currentConversation = broadcastId;
    currentConversationType = "diffusion"; // ✅ Set type for broadcast/diffusion
    // ✅ IMPORTANT: Mettre currentTab seulement pour l'étudiant
    if (!isAdminUser) {
        currentTab = "diffusions";
    }
    window.toggleMobileView(true);
    
    const titleId = getChatHeaderTitleId();
    const titleEl = document.getElementById(titleId);
    if (titleEl) {
        titleEl.innerHTML = `<b style="color:var(--gold);">📢 ${broadcastName}</b>`;
    }
    
    const containerId = getMessagesContainerId();
    const container = document.getElementById(containerId);
    if (!container) return;

    lightboxMediaList = [];

    const loadMessages = async () => {
        try {
            console.log("📥 Chargement messages diffusion:", broadcastId);
            
            const token = getAuthToken();
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token && token !== "COOKIES_AUTO") {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // ✅ Charger les infos de la diffusion pour vérifier les permissions
            const broadcastRes = await fetch(`${API_URL}/broadcasts/${broadcastId}`, {
                headers,
                credentials: 'include'
            });
            
            const messagesRes = await fetch(`${API_URL}/broadcasts/${broadcastId}/messages`, {
                headers,
                credentials: 'include'
            });
            
            if (!messagesRes.ok) {
                console.error("❌ Erreur API:", messagesRes.status);
                throw new Error(`Erreur ${messagesRes.status}: ${messagesRes.statusText}`);
            }

            const broadcastData = broadcastRes.ok ? await broadcastRes.json() : null;
            const data = await messagesRes.json();
            const messages = Array.isArray(data) ? data : (data.messages || []);

            console.log("✅ Messages diffusion chargés:", messages.length);

            // ✅ VÉRIFIER SI L'UTILISATEUR PEUT MODIFIER (créateur ou admin)
            const canModify = isAdminUser || (broadcastData && broadcastData.createdBy === currentUser.id);
            
            // ✅ DÉSACTIVER L'INPUT SI C'EST UNE DIFFUSION ET QUE L'UTILISATEUR NE PEUT PAS MODIFIER
            const inputId = getInputId();
            const sendBtnId = getSendBtnId();
            const fileInputId = getFileInputId();
            const micBtnId = "micBtn";
            
            const input = document.getElementById(inputId);
            const sendBtn = document.getElementById(sendBtnId);
            const fileBtn = document.querySelector(`[onclick*="triggerFileUpload"]`);
            const micBtn = document.getElementById(micBtnId);
            
            if (!canModify) {
                // Mode lecture seule pour les destinataires
                if (input) input.disabled = true;
                if (input) input.placeholder = "📢 Diffusion en lecture seule";
                if (sendBtn) sendBtn.style.display = "none";
                if (fileBtn) fileBtn.style.opacity = "0.5";
                if (fileBtn) fileBtn.style.cursor = "not-allowed";
                if (fileBtn) fileBtn.style.pointerEvents = "none";
                if (micBtn) micBtn.style.opacity = "0.5";
                if (micBtn) micBtn.style.cursor = "not-allowed";
                if (micBtn) micBtn.style.pointerEvents = "none";
            } else {
                // Mode édition pour le créateur
                if (input) input.disabled = false;
                if (input) input.placeholder = "Tapez un message";
                if (fileBtn) fileBtn.style.opacity = "1";
                if (fileBtn) fileBtn.style.cursor = "pointer";
                if (fileBtn) fileBtn.style.pointerEvents = "auto";
                if (micBtn) micBtn.style.opacity = "1";
                if (micBtn) micBtn.style.cursor = "pointer";
                if (micBtn) micBtn.style.pointerEvents = "auto";
            }

            container.innerHTML = "";

            messages.forEach((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const div = document.createElement("div");
                div.className = `message ${isMe ? 'sent' : 'received'}`;

                let html = "";
                
                if (msg.attachments && msg.attachments.length > 0) {
                    msg.attachments.forEach(att => {
                        if (getAttachmentType(att) === "image") {
                            lightboxMediaList.push({ url: att, type: 'image' });
                            const mediaIndex = lightboxMediaList.length - 1;
                            html += `<img src="${att}" style="max-width:200px; border-radius:8px; cursor:pointer; margin:5px 0;" onclick="window.ouvrirPleinEcran('${att}', 'image', ${mediaIndex})">`;
                        } else if (getAttachmentType(att) === "audio") {
                            html += `<div style="display:flex; align-items:center; gap:6px; padding:4px 6px; background:rgba(212,175,55,0.1); border-radius:6px; margin:3px 0;">
                                <i class="fas fa-volume-up" style="color:var(--gold); font-size:14px; flex-shrink:0;"></i>
                                <audio src="${att}" controls style="height:24px; max-width:140px; cursor:pointer;"></audio>
                            </div>`;
                        } else if (getAttachmentType(att) === "video") {
                            lightboxMediaList.push({ url: att, type: 'video' });
                            const mediaIndex = lightboxMediaList.length - 1;
                            html += `<video src="${att}" style="max-width:200px; border-radius:8px; cursor:pointer; margin:5px 0;" controls onclick="window.ouvrirPleinEcran('${att}', 'video', ${mediaIndex})"></video>`;
                        } else {
                            html += `<a href="${att}" target="_blank" style="color:var(--gold); display:block; margin-top:5px;">📎 Fichier</a>`;
                        }
                    });
                }

                if (msg.content) {
                    html += `<div>${msg.content}</div>`;
                }

                const time = new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const readStatus = getReadStatusMarkup(msg, isMe);
div.innerHTML = `${html}<div style="font-size:0.7em; margin-top:4px; opacity:0.7; display:flex; align-items:center;">${time}${readStatus}</div>`;

                container.appendChild(div);
            });

            container.scrollTop = container.scrollHeight;
        } catch (err) {
            console.error("❌ Erreur chargement messages diffusion:", err);
            container.innerHTML = "<p style='color:red;'>❌ Erreur chargement messages: " + err.message + "</p>";
        }
    };

    loadMessages();
    if (messageListeners[broadcastId]) {
        clearInterval(messageListeners[broadcastId]);
    }
    messageListeners[broadcastId] = setInterval(() => {
        if (!getAuthToken() || getAuthToken() === "COOKIES_AUTO") {
            clearInterval(messageListeners[broadcastId]);
            return;
        }
        loadMessages();
    }, 10000);
};




