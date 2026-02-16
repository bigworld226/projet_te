import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, query, orderBy, 
    serverTimestamp, doc, getDocs, where, setDoc, updateDoc, deleteDoc, arrayUnion 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = { 
    apiKey: "AIzaSyBry73jG370W3OdmZBqEd-6w-BWaHwjtwg", 
    authDomain: "discussion-web-travel-express.firebaseapp.com", 
    projectId: "discussion-web-travel-express", 
    storageBucket: "discussion-web-travel-express.appspot.com", 
    messagingSenderId: "678997422000", 
    appId: "1:678997422000:web:4786a85770f4a8dd8cf075" 
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- CONSTANTES ---
const CL_URL = "https://api.cloudinary.com/v1_1/daec8eyaj/upload";
const CL_PRESET = "travel_express_preset";
const DEFAULT_IMG = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const NOTIF_SOUND = "https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3";
const ADMIN_EMAIL = "travelexpress@gmail.com";
const ADMIN_NAME = "Assistant-Travel Express"; 

// --- VARIABLES D'ÉTAT ---
let currentUser = null;
let currentSalon = null;
let activeMainTab = "discussions"; 
let adminSubTab = "parents"; 
let replyData = null;
let msgContextId = null;
let salonContextId = null; 
let currentDeleteTarget = ""; 
let isEditing = false;
let configMode = ""; 
let selectedUids = []; 
let mediaRecorder = null;
let audioChunks = [];
let isSignUpMode = false;
let unreadListeners = {};

// Variables pour la Lightbox (Zoom/Rotation)
let currentZoom = 1;
let currentRotation = 0;

// Variables pour la navigation dans la Lightbox
let lightboxMediaList = [];
let currentLightboxIndex = -1;

// --- STYLE DYNAMIQUE (CSS JS) ---
const style = document.createElement('style');
style.innerHTML = `
    #configPanel { z-index: 10000 !important; }
    .tab-main.active, .sub-tab.active { background-color: #f39c12 !important; color: white !important; border-color: #f39c12 !important; }
    .read-status { font-size: 0.8em; margin-left: 4px; }
    .unread-badge {
        background-color: #25d366; color: white; border-radius: 50%; padding: 2px 7px;
        font-size: 0.75rem; font-weight: bold; margin-left: auto; min-width: 18px;
        text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .list-item { display: flex; align-items: center; position: relative; padding: 12px; cursor: pointer; }
    .list-item b { flex: 1; }
    .file-attachment { 
        display: flex; align-items: center; gap: 8px; padding: 8px; 
        background: rgba(255,255,255,0.1); border-radius: 6px; margin-top: 5px;
    }
`;
document.head.appendChild(style);

// --- FONCTIONS UTILITAIRES ---
async function requestNotifPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
        await Notification.requestPermission();
    }
}

// --- GESTION DES BADGES NON LUS ---
function listenUnreadCount(salonId, isGroup = false) {
    if (unreadListeners[salonId]) return; 
    const path = isGroup ? collection(db, "groups", salonId, "messages") : collection(db, "chats", salonId, "messages");
    const myName = (currentUser.email === ADMIN_EMAIL) ? ADMIN_NAME : currentUser.nom;

    const unsubscribe = onSnapshot(path, (snap) => {
        let unread = 0;
        snap.forEach(d => {
            const m = d.data();
            if (m.sender !== myName && (!m.luPar || !m.luPar.includes(myName))) {
                unread++;
            }
        });
        const badge = document.getElementById(`badge-${salonId}`);
        if (badge) {
            if (unread > 0) { badge.innerText = unread; badge.style.display = "block"; }
            else { badge.style.display = "none"; }
        }
    });
    unreadListeners[salonId] = unsubscribe;
}

// --- NAVIGATION & INTERFACE ---
window.toggleMobileView = (showChat) => {
    const sidebar = document.getElementById("sidebar");
    if (showChat) sidebar.classList.add("mobile-hidden");
    else {
        sidebar.classList.remove("mobile-hidden");
        currentSalon = null;
    }
};

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
    const themeSelector = document.getElementById("themeSelector");
    if (savedTheme === "light") {
        document.body.classList.add("theme-light");
        if(themeSelector) themeSelector.value = "theme-light";
    } else {
        document.body.classList.remove("theme-light");
        if(themeSelector) themeSelector.value = "theme-dark";
    }
}

window.switchTab = (tabName) => {
    activeMainTab = tabName;
    currentSalon = null;
    window.toggleMobileView(false);

    document.querySelectorAll('.tab-main').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(tabName));
    });

    const isAdmin = currentUser?.email === ADMIN_EMAIL;
    
    document.querySelectorAll('.tab-main').forEach(tab => {
        const action = tab.getAttribute('onclick');
        if (action && (action.includes('groupes') || action.includes('diffusions'))) {
            tab.style.display = isAdmin ? "flex" : "none";
        }
    });

    document.querySelectorAll('[onclick*="ouvrirConfig"]').forEach(el => {
        const isGroupBtn = el.getAttribute('onclick').includes("'groupe'");
        if (isAdmin) {
            if (isGroupBtn) el.style.display = (tabName === "groupes") ? "inline-block" : "none";
            else el.style.display = (tabName === "diffusions") ? "inline-block" : "none";
        } else {
            el.style.display = "none";
        }
    });

    const adminControls = document.getElementById("adminControls");
    if (adminControls) {
        adminControls.style.display = (tabName === "discussions" && isAdmin) ? "block" : "none";
        updateAdminSubTabUI();
    }

    document.getElementById("chatList").innerHTML = "";
    if (tabName === "discussions") chargerContacts();
    else if (tabName === "groupes") chargerGroupes();
    else if (tabName === "diffusions") chargerDiffusions();
};

function updateAdminSubTabUI() {
    const btnParents = document.getElementById("tabParents");
    const btnEnfants = document.getElementById("tabEnfants");
    if (btnParents && btnEnfants) {
        btnParents.classList.toggle("active", adminSubTab === "parents");
        btnEnfants.classList.toggle("active", adminSubTab === "enf");
    }
}

// --- AUTHENTIFICATION ---
const toggleAuthMode = () => {
    isSignUpMode = !isSignUpMode;
    const groupNom = document.getElementById("groupNom");
    const groupAge = document.getElementById("groupAge");
    document.getElementById("authTitle").innerText = isSignUpMode ? "INSCRIPTION" : "TRAVEL EXPRESS";
    document.getElementById("mainAuthBtn").innerText = isSignUpMode ? "S'INSCRIRE" : "SE CONNECTER";
    if (groupNom) groupNom.style.display = isSignUpMode ? "flex" : "none";
    if (groupAge) groupAge.style.display = isSignUpMode ? "flex" : "none";
};

const handleAuthAction = async () => {
    const email = document.getElementById("authEmail").value.trim().toLowerCase();
    const password = document.getElementById("authPassword").value;

    if (isSignUpMode) {
        const nom = document.getElementById("authNom").value.trim();
        const age = document.getElementById("authAge").value;
        if (!nom || !email || !password || !age) return alert("Champs vides");
        try {
            await addDoc(collection(db, "users"), {
                nom, email, password, age: parseInt(age), photo: DEFAULT_IMG, createdAt: serverTimestamp()
            });
            alert("Compte créé !"); toggleAuthMode();
        } catch (e) { alert("Erreur lors de l'inscription"); }
    } else {
        if (!email || !password) return;
        if (email === ADMIN_EMAIL && password === "Travel2026") {
            loginSuccess({ nom: ADMIN_NAME, email: email, photo: DEFAULT_IMG, role: "admin" }, true);
        } else {
            const q = query(collection(db, "users"), where("email", "==", email));
            const snap = await getDocs(q);
            if (!snap.empty && snap.docs[0].data().password === password) {
                loginSuccess(snap.docs[0].data(), document.getElementById("rememberMe").checked);
            } else alert("Identifiants incorrects");
        }
    }
};

// Attach to window for HTML onclick
window.toggleAuthMode = toggleAuthMode;
window.handleAuthAction = handleAuthAction;

function loginSuccess(user, remember) {
    currentUser = user;
    if (remember) localStorage.setItem("travelExpressUser", JSON.stringify(user));
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appMain").style.display = "flex";
    document.getElementById("myAvatar").src = user.photo || DEFAULT_IMG;
    applySavedTheme();
    requestNotifPermission();
    window.switchTab("discussions");
}

window.logout = () => {
    localStorage.removeItem("travelExpressUser");
    location.reload();
};

// --- CHARGEMENT LISTES ---
function chargerContacts() {
    const list = document.getElementById("chatList");
    if (!list) return;

    const isAdmin = currentUser?.email === ADMIN_EMAIL;
    const myName = isAdmin ? ADMIN_NAME : currentUser.nom;

    onSnapshot(collection(db, "users"), (snapshot) => {
        if (activeMainTab !== "discussions") return;
        list.innerHTML = "";

        snapshot.forEach(d => {
            const u = d.data();
            if (!u.email || u.email === currentUser?.email) return;

            if (isAdmin) {
                const age = parseInt(u.age) || 0;
                if (adminSubTab === "parents" && age < 30) return;
                if (adminSubTab === "enf" && age >= 30) return;
            } else {
                if (u.email !== ADMIN_EMAIL) return; 
            }

            const displayName = (u.email === ADMIN_EMAIL) ? ADMIN_NAME : u.nom;
            const salonId = [myName, displayName].sort().join("_");
            
            const item = document.createElement("div");
            item.className = "list-item item-user"; 
            item.innerHTML = `
                <img src="${u.photo || DEFAULT_IMG}" class="avatar-circle" style="width:45px; height:45px; margin-right:12px; border-radius:50%;">
                <div style="flex:1">
                    <div style="font-weight:bold;">${displayName}</div>
                    <small style="color:var(--gold);">${u.email === ADMIN_EMAIL ? 'Support' : 'Client'}</small>
                </div>
                <span id="badge-${salonId}" class="unread-badge" style="display:none;"></span>
            `;
            
            item.onclick = () => window.ouvrirChat(salonId, displayName);
            list.appendChild(item);
            listenUnreadCount(salonId, false);
        });
    });
}

function chargerGroupes() {
    onSnapshot(collection(db, "groups"), (snap) => {
        if (activeMainTab !== "groupes") return;
        const list = document.getElementById("chatList"); list.innerHTML = "";
        snap.forEach(d => {
            const g = d.data();
            const item = document.createElement("div");
            item.className = "list-item";
            item.innerHTML = `<i class="fas fa-users" style="margin-right:12px;"></i><div><b>${g.nom}</b></div><span id="badge-${d.id}" class="unread-badge" style="display:none;"></span>`;
            item.onclick = () => window.ouvrirChat(d.id, g.nom, true);
            item.oncontextmenu = (e) => {
                e.preventDefault(); salonContextId = d.id; currentDeleteTarget = "groups";
                const menu = document.getElementById("salonContextMenu");
                if(menu) { menu.style.display = "block"; menu.style.top = e.pageY + "px"; menu.style.left = e.pageX + "px"; }
            };
            list.appendChild(item);
            listenUnreadCount(d.id, true);
        });
    });
}

function chargerDiffusions() {
    onSnapshot(collection(db, "diffusions"), (snap) => {
        if (activeMainTab !== "diffusions") return;
        const list = document.getElementById("chatList"); list.innerHTML = "";
        snap.forEach(d => {
            const data = d.data();
            const item = document.createElement("div");
            item.className = "list-item";
            item.innerHTML = `<i class="fas fa-bullhorn" style="margin-right:12px; color:#f39c12;"></i><div><b>${data.nom}</b></div>`;
            item.onclick = () => { 
                currentSalon = "diff_" + d.id; 
                selectedUids = data.destinataires;
                document.getElementById("chatHeaderTitle").innerHTML = `<b>Diffusion: ${data.nom}</b>`; 
                window.toggleMobileView(true); 
                document.getElementById("messages").innerHTML = `<div style="text-align:center; padding:20px; color:#999;">Mode Diffusion activé.</div>`;
            };
            item.oncontextmenu = (e) => {
                e.preventDefault(); salonContextId = d.id; currentDeleteTarget = "diffusions";
                const menu = document.getElementById("salonContextMenu");
                if(menu) { menu.style.display = "block"; menu.style.top = e.pageY + "px"; menu.style.left = e.pageX + "px"; }
            };
            list.appendChild(item);
        });
    });
}

// --- GESTION DES MESSAGES ---
window.ouvrirChat = (salonId, titre, isGroup = false) => {
    currentSalon = salonId;
    isEditing = false;
    document.getElementById("chatHeaderTitle").innerHTML = `<b style="color:var(--gold);">${titre}</b>`;
    window.toggleMobileView(true);

    const isPrivate = salonId.includes("_");
    const collectionName = isPrivate ? "chats" : "groups";

    const messagesRef = collection(db, collectionName, salonId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    onSnapshot(q, (snap) => {
        const container = document.getElementById("messages");
        if (!container) return;

        const myName = (currentUser.email === ADMIN_EMAIL) ? ADMIN_NAME : currentUser.nom;
        container.innerHTML = "";

        // Collect all media for lightbox navigation
        lightboxMediaList = [];

        snap.forEach((d) => {
            const m = d.data();
            const isMe = m.sender === myName;

            if (!isMe && (!m.luPar || !m.luPar.includes(myName))) {
                updateDoc(doc(db, collectionName, salonId, "messages", d.id), { luPar: arrayUnion(myName) });
            }

            const div = document.createElement("div");
            div.className = `message ${isMe ? 'sent' : 'received'}`;

            let html = "";
            if (m.replyTo) {
                html += `<div class="reply-quote" style="background:rgba(0,0,0,0.1); padding:5px; border-left:3px solid var(--gold); margin-bottom:5px; font-size:0.8em; border-radius:4px;">
                            <b style="color:var(--gold);">${m.replyTo.sender}</b><br>${m.replyTo.text}
                         </div>`;
            }

            if (m.fileUrl) {
                const fileName = m.fileName || '';
                const fileType = m.fileType || '';
                if (fileType.includes("image")) {
                    lightboxMediaList.push({ url: m.fileUrl, type: 'image' });
                    const mediaIndex = lightboxMediaList.length - 1;
                    html += `<img src="${m.fileUrl}" style="max-width:200px; border-radius:8px; cursor:pointer;" onclick="window.ouvrirPleinEcran('${m.fileUrl}', 'image', ${mediaIndex})">`;
                } else if (fileType.includes("video") || fileName.toLowerCase().match(/\.(mp4|webm|ogg|avi|mov)$/)) {
                    lightboxMediaList.push({ url: m.fileUrl, type: 'video' });
                    const mediaIndex = lightboxMediaList.length - 1;
                    html += `<video src="${m.fileUrl}" style="max-width:200px; border-radius:8px; cursor:pointer;" onclick="window.ouvrirPleinEcran('${m.fileUrl}', 'video', ${mediaIndex})" controls></video>`;
                } else if (fileName.toLowerCase().endsWith('.pdf') || fileType.includes("pdf")) {
                    html += `<div class="file-attachment">
                                <i class="fas fa-file-pdf" style="color: #ff4444; font-size: 20px;"></i>
                                <a href="${m.fileUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--gold); text-decoration: none; font-weight: bold;">
                                    ${fileName || 'Document PDF'}
                                </a>
                             </div>`;
                } else if (fileName.toLowerCase().endsWith('.apk') || fileType.includes("android") || fileType.includes("apk")) {
                    html += `<div class="file-attachment">
                                <i class="fas fa-mobile-alt" style="color: #4CAF50; font-size: 20px;"></i>
                                <a href="${m.fileUrl}" download style="color: var(--gold); text-decoration: none; font-weight: bold;">
                                    ${fileName || 'Fichier APK'}
                                </a>
                             </div>`;
                } else {
                    html += `<audio src="${m.fileUrl}" controls style="width:100%;"></audio>`;
                }
            }

            if (m.text) html += `<div class="text-content">${m.text}</div>`;

            const time = m.createdAt ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "...";
            const status = isMe ? (m.luPar && m.luPar.length > 0 ? '<span style="color:#34B7F1">✓✓</span>' : '✓') : "";
            const editedTag = m.edited ? '<i style="font-size:0.6em; margin-left:5px;">(modifié)</i>' : '';

            div.innerHTML = `${html}<div class="status-meta" style="font-size:0.7em; text-align:right; margin-top:4px; opacity:0.7;">${time} ${status} ${editedTag}</div>`;

            div.oncontextmenu = (e) => {
                e.preventDefault();
                window.showContextMenu(e, d.id, m);
            };

            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    });
};

// --- MENU CONTEXTUEL & ACTIONS ---
window.showContextMenu = (e, msgId, data) => {
    msgContextId = msgId;
    replyData = data;
    const menu = document.getElementById("contextMenu");
    if(!menu) return;

    const deleteBtn = menu.querySelector('.danger');
    if (deleteBtn) {
        deleteBtn.style.display = (currentUser?.email === ADMIN_EMAIL) ? "block" : "none";
    }

    const editBtn = document.getElementById("ctxEditBtn");
    if (editBtn) {
        const msgTime = data.createdAt?.toDate().getTime() || Date.now();
        const diffMin = (Date.now() - msgTime) / 60000;
        const myName = (currentUser.email === ADMIN_EMAIL) ? ADMIN_NAME : currentUser.nom;
        editBtn.style.display = (diffMin < 15 && data.sender === myName) ? "block" : "none";
    }

    menu.style.display = "block";
    menu.style.top = `${e.pageY}px`;
    menu.style.left = `${e.pageX}px`;
};

window.prepReply = () => {
    document.getElementById("replyPreview").style.display = "flex";
    document.getElementById("replySender").innerText = replyData.sender;
    document.getElementById("replyText").innerText = replyData.text || "Fichier média";
};

window.prepEdit = () => {
    const input = document.getElementById("msgInput");
    input.value = replyData.text; isEditing = true; input.focus();
};

window.annulerReponse = () => {
    replyData = null; document.getElementById("replyPreview").style.display = "none";
};

window.confirmSuppression = async () => {
    if(!confirm("Supprimer ce message ?")) return;
    const path = currentSalon.includes("_") ? "chats" : "groups";
    await deleteDoc(doc(db, path, currentSalon, "messages", msgContextId));
};

window.envoyerMessageAction = async () => {
    const input = document.getElementById("msgInput");
    const texte = input.value.trim();
    if (!texte || !currentSalon) return;
    const senderName = (currentUser.email === ADMIN_EMAIL) ? ADMIN_NAME : currentUser.nom;

    if (currentSalon.startsWith("diff_")) {
        for (const destName of selectedUids) {
            const pairId = [senderName, destName].sort().join("_");
            await addDoc(collection(db, "chats", pairId, "messages"), { text: texte, sender: senderName, createdAt: serverTimestamp(), luPar: [] });
        }
        input.value = ""; return;
    }

    const collPath = currentSalon.includes("_") ? "chats" : "groups";
    
    if (isEditing) {
        await updateDoc(doc(db, collPath, currentSalon, "messages", msgContextId), { text: texte, edited: true });
        isEditing = false;
    } else {
        const msg = { text: texte, sender: senderName, createdAt: serverTimestamp(), luPar: [] };
        if (document.getElementById("replyPreview").style.display === "flex") { 
            msg.replyTo = { sender: replyData.sender, text: replyData.text || "Fichier" }; 
            window.annulerReponse(); 
        }
        await addDoc(collection(db, collPath, currentSalon, "messages"), msg);
    }
    
    input.value = ""; 
    document.getElementById("btnEnvoyer").style.display = "none";
    document.getElementById("micBtn").style.display = "block";
};

// --- LIGHTBOX ---
const appliquerTransformations = () => {
    const img = document.getElementById("lightboxImg");
    if (img) {
        img.style.transform = `scale(${currentZoom}) rotate(${currentRotation}deg)`;
        img.style.transition = "transform 0.2s ease";
    }
};

window.ouvrirPleinEcran = (url, type = 'image', mediaIndex = -1) => {
    console.log("🚀 ouvrirPleinEcran called with url:", url, "type:", type, "mediaIndex:", mediaIndex);
    console.log("Current lightboxMediaList:", lightboxMediaList);
    console.log("📋 lightboxMediaList:", lightboxMediaList);

    const lb = document.getElementById("lightbox");
    const img = document.getElementById("lightboxImg");
    const video = document.getElementById("lightboxVideo");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");

    console.log("🔍 lightbox elements found:", !!lb, !!img, !!video, !!prevBtn, !!nextBtn);
    if (!lb) {
        console.error("❌ Lightbox element not found");
        return;
    }

    // Set current index
    currentLightboxIndex = mediaIndex;
    console.log("📍 currentLightboxIndex set to:", currentLightboxIndex);

    // Show/hide navigation buttons
    const hasMultipleMedia = lightboxMediaList.length > 1;
    console.log("🔄 hasMultipleMedia:", hasMultipleMedia, "lightboxMediaList.length:", lightboxMediaList.length);

    if (prevBtn) {
        prevBtn.style.display = hasMultipleMedia ? 'flex' : 'none';
        console.log("⬅️ prevBtn display set to:", prevBtn.style.display);
    }
    if (nextBtn) {
        nextBtn.style.display = hasMultipleMedia ? 'flex' : 'none';
        console.log("➡️ nextBtn display set to:", nextBtn.style.display);
    }

    if (type === 'image' && img) {
        img.src = url;
        img.style.display = "block";
        if (video) video.style.display = "none";
        lb.style.display = "flex";
        window.resetImage();
        // Show zoom controls for images
        const zoomControls = document.querySelectorAll('.lightbox-zoom-in, .lightbox-zoom-out, .lightbox-rotate, .lightbox-reset');
        zoomControls.forEach(ctrl => ctrl.style.display = 'flex');
        console.log("🖼️ Image lightbox opened successfully");
    } else if (type === 'video' && video) {
        video.src = url;
        video.style.display = "block";
        if (img) img.style.display = "none";
        lb.style.display = "flex";
        // Hide zoom controls for videos
        const zoomControls = document.querySelectorAll('.lightbox-zoom-in, .lightbox-zoom-out, .lightbox-rotate, .lightbox-reset');
        zoomControls.forEach(ctrl => ctrl.style.display = 'none');
        console.log("🎥 Video lightbox opened successfully");
    } else {
        console.error("❌ Unsupported media type or element not found:", type);
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


// --- CONFIG GROUPES/DIFFUSIONS ---
window.ouvrirConfig = async (mode) => {
    window.toggleMobileView(false); 
    configMode = mode; selectedUids = [];
    document.getElementById("configPanel").style.display = "flex";
    document.getElementById("configTitle").innerText = mode === "groupe" ? "Nouveau Groupe" : "Nouvelle Diffusion";
    const grid = document.getElementById("configGrid");
    grid.innerHTML = "Chargement...";
    const snap = await getDocs(collection(db, "users"));
    grid.innerHTML = "";
    snap.forEach(d => {
        const u = d.data();
        if (!u.email || u.email === ADMIN_EMAIL) return;
        const card = document.createElement("div");
        card.className = "contact-card";
        card.setAttribute("data-uid", u.nom);
        card.innerHTML = `<img src="${u.photo || DEFAULT_IMG}"><p>${u.nom}</p>`;
        card.onclick = () => {
            card.classList.toggle("selected");
            const uid = card.getAttribute("data-uid");
            if (card.classList.contains("selected")) selectedUids.push(uid);
            else selectedUids = selectedUids.filter(id => id !== uid);
        };
        grid.appendChild(card);
    });
};

window.toggleSelectAll = () => {
    const cards = document.querySelectorAll(".contact-card");
    const allSelected = Array.from(cards).every(c => c.classList.contains("selected"));
    selectedUids = [];
    cards.forEach(c => {
        const uid = c.getAttribute("data-uid");
        if (!allSelected) { c.classList.add("selected"); selectedUids.push(uid); }
        else c.classList.remove("selected");
    });
};

window.validerConfig = async () => {
    const nom = document.getElementById("groupNameInput").value.trim();
    if (!nom || selectedUids.length === 0) return alert("Champs manquants");
    if (configMode === "groupe") {
        await setDoc(doc(db, "groups", nom), { nom, membres: [...selectedUids, ADMIN_NAME], admin: ADMIN_NAME, createdAt: serverTimestamp() });
    } else {
        await addDoc(collection(db, "diffusions"), { nom, createur: ADMIN_NAME, destinataires: selectedUids, createdAt: serverTimestamp() });
    }
    window.fermerConfig();
};

window.fermerConfig = () => {
    document.getElementById("configPanel").style.display = "none";
    document.getElementById("groupNameInput").value = "";
};

// --- UPLOAD FICHIERS & VOCAL (MODIFIÉ POUR MULTIPLE & 401) ---
window.triggerFileUpload = () => document.getElementById("fileInput").click();
window.handleFileUpload = async (e) => {
    console.log("handleFileUpload called", e.target.files);
    const files = Array.from(e.target.files);
    console.log("files array:", files);
    if (files.length === 0) {
        console.log("No files selected");
        return;
    }
    if (!currentSalon) {
        console.log("No currentSalon selected");
        return;
    }

    const senderName = (currentUser.email === ADMIN_EMAIL) ? ADMIN_NAME : currentUser.nom;
    const collPath = currentSalon.includes("_") ? "chats" : "groups";

    for (const file of files) {
        console.log("Uploading file:", file.name, file.type);
        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", CL_PRESET);

        try {
            const res = await fetch(CL_URL, { method: "POST", body: form });
            const d = await res.json();
            console.log("Upload response:", d);

            if (d.secure_url) {
                await addDoc(collection(db, collPath, currentSalon, "messages"), {
                    fileUrl: d.secure_url,
                    fileName: file.name,
                    fileType: file.type,
                    sender: senderName,
                    createdAt: serverTimestamp(),
                    luPar: []
                });
                console.log("File uploaded and message added");
            } else {
                console.error("No secure_url in response");
            }
        } catch (err) {
            console.error("Erreur lors de l'envoi du fichier " + file.name, err);
        }
    }
    e.target.value = "";
};

// --- INITIALISATION FINALE ---
window.onload = () => {
    console.log("Page loaded, initializing...");
    const saved = localStorage.getItem("travelExpressUser");
    if (saved) loginSuccess(JSON.parse(saved), true);
    applySavedTheme();

    const btnParents = document.getElementById("tabParents");
    const btnEnfants = document.getElementById("tabEnfants");
    if (btnParents) btnParents.onclick = () => { adminSubTab = "parents"; updateAdminSubTabUI(); chargerContacts(); };
    if (btnEnfants) btnEnfants.onclick = () => { adminSubTab = "enf"; updateAdminSubTabUI(); chargerContacts(); };

    const input = document.getElementById("msgInput");
    if(input) {
        input.oninput = (e) => {
            const hasText = e.target.value.trim().length > 0;
            document.getElementById("btnEnvoyer").style.display = hasText ? "block" : "none";
            document.getElementById("micBtn").style.display = hasText ? "none" : "block";
        };
        input.addEventListener("keypress", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); window.envoyerMessageAction(); } });
    }

    const micBtn = document.getElementById("micBtn");
    if(micBtn) {
        micBtn.onmousedown = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream); audioChunks = [];
                mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                mediaRecorder.onstart = () => document.getElementById("voiceOverlay").style.display = "flex";
                mediaRecorder.onstop = async () => {
                    document.getElementById("voiceOverlay").style.display = "none";
                    const blob = new Blob(audioChunks, { type: 'audio/webm' });
                    const form = new FormData(); 
                    form.append("file", blob); 
                    form.append("upload_preset", CL_PRESET);
                    form.append("access_mode", "public");

                    const res = await fetch(CL_URL, { method: "POST", body: form });
                    const d = await res.json();
                    const collPath = currentSalon.includes("_") ? "chats" : "groups";
                    const senderName = (currentUser.email === ADMIN_EMAIL) ? ADMIN_NAME : currentUser.nom;
                    await addDoc(collection(db, collPath, currentSalon, "messages"), { fileUrl: d.secure_url, fileType: "audio/webm", sender: senderName, createdAt: serverTimestamp(), luPar: [] });
                };
                mediaRecorder.start();
            } catch(e) { alert("Micro inaccessible."); }
        };
        window.onmouseup = () => { if(mediaRecorder?.state === "recording") mediaRecorder.stop(); };
    }

    window.onclick = (e) => {
        const ctxMenu = document.getElementById("contextMenu");
        const slnMenu = document.getElementById("salonContextMenu");
        const lb = document.getElementById("lightbox");
        if(ctxMenu && ctxMenu.style.display === "block" && !ctxMenu.contains(e.target)) ctxMenu.style.display = "none";
        if(slnMenu && slnMenu.style.display === "block" && !slnMenu.contains(e.target)) slnMenu.style.display = "none";
        if(lb && e.target === lb) window.closeLightbox();
    };
};