'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    initializeUser?: () => Promise<void>;
    setupEventListeners?: () => void;
  }
}

export default function MessagingPage() {
  useEffect(() => {
    const clearClientCachesOnce = async () => {
      try {
        if (sessionStorage.getItem("messaging_cache_cleared") === "1") return;

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }

        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }

        sessionStorage.setItem("messaging_cache_cleared", "1");
      } catch (err) {
        console.warn("⚠️ Impossible de vider le cache client:", err);
      }
    };

    // Première étape: charger l'utilisateur courant pour déterminer le rôle
    const loadAndInitialize = async () => {
      try {
        await clearClientCachesOnce();

        // Récupérer l'utilisateur courant pour connaître son rôle
        const userResponse = await fetch('/api/user/current');
        let userRole = 'STUDENT'; // défaut
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userRole = userData.role?.name || 'STUDENT';
        }

        // Passer le rôle à la fenêtre globale
        (window as any).USER_ROLE = userRole;
        const isAdmin = ["SUPERADMIN", "QUALITY_OFFICER", "SECRETARY", "STUDENT_MANAGER"].includes(userRole);
        (window as any).IS_ADMIN_INTERFACE = isAdmin;

        // Vérifier si le script a déjà été chargé
        const existingScript = document.querySelector('script[data-messaging-app]');
        if (existingScript) {
          if (window.initializeUser) {
            setTimeout(() => {
              window.initializeUser!().then(() => {
                console.log("✅ initializeUser complété");
                if (window.setupEventListeners) {
                  window.setupEventListeners();
                }
              }).catch((err: any) => {
                console.error("❌ Erreur initializeUser:", err);
              });
            }, 100);
          }
          return;
        }

        // Charger le fichier approprié selon le rôle - fichiers séparés pour éviter les mélanges
        const scriptFile = isAdmin ? 'messaging-admin.js' : 'messaging-student.js';
        const script = document.createElement('script');
        script.src = '/' + scriptFile + '?v=' + Date.now();
        script.setAttribute('data-messaging-app', 'true');
        script.onload = () => {
          setTimeout(() => {
            if (window.initializeUser) {
              console.log(`✅ Initialisation de la messagerie (${isAdmin ? 'ADMIN' : 'STUDENT'})...`);
              window.initializeUser!().then(() => {
                console.log("✅ initializeUser complété");
                if (window.setupEventListeners) {
                  window.setupEventListeners();
                }
              }).catch((err: any) => {
                console.error("❌ Erreur initializeUser:", err);
              });
            } else {
              console.warn("⚠️ initializeUser n'est pas disponible");
            }
          }, 100);
        };
        script.onerror = () => {
          console.error("❌ Erreur lors du chargement du script");
        };
        document.body.appendChild(script);
      } catch (err) {
        console.error("❌ Erreur lors de la détermination du rôle:", err);
      }
    };

    loadAndInitialize();
  }, []);

  return (
    <>
      {/* CSS des discussions */}
      <link rel="stylesheet" href="/stylepagedeDiscussion.css" />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />

      <div style={{ 
        margin: 0, 
        padding: 0, 
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* LAYOUT ADMIN */}
        <div className="app-wrapper" id="appMainAdmin" style={{ display: 'none' }}>
          <div className="sidebar" id="sidebar">
            <header className="header-left">
              <div className="header-actions">
                <button
                  className="icon-btn"
                  onClick={() => { window.location.href = '/admin/dashboard'; }}
                  title="Retour au Dashboard"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <button
                  className="icon-btn"
                  onClick={() => (window as any).ouvrirConfig?.('groupe')}
                  title="Nouveau Groupe"
                >
                  <i className="fas fa-users"></i>
                </button>
                <button
                  className="icon-btn"
                  onClick={() => (window as any).ouvrirConfig?.('diffusion')}
                  title="Diffusion"
                >
                  <i className="fas fa-bullhorn"></i>
                </button>
                <select
                  id="themeSelector"
                  className="theme-select"
                  onChange={(e) => (window as any).changerTheme?.(e.target.value)}
                >
                  <option value="theme-dark">🌑 Sombre</option>
                  <option value="theme-light">☀️ Clair</option>
                </select>
              </div>
            </header>

            <nav className="nav-tabs-main" id="navTabsAdmin">
              <button
                className="tab-main active"
                onClick={() => (window as any).switchTab?.('discussions')}
              >
                <i className="fas fa-comment"></i> Discussions
              </button>
              <button
                className="tab-main"
                onClick={() => (window as any).switchTab?.('groupes')}
              >
                <i className="fas fa-users"></i> Groupes
              </button>
              <button
                className="tab-main"
                onClick={() => (window as any).switchTab?.('diffusions')}
              >
                <i className="fas fa-bullhorn"></i> Diffusions
              </button>
            </nav>

            <div
              id="contactsListAdmin"
              className="contacts-list"
              style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}
            >
              <h3 style={{ color: 'var(--gold)', fontSize: '0.9em', marginBottom: '8px' }}>
                👥 Contacts
              </h3>
              <div
                id="contactsGridAdmin"
                style={{ display: 'flex', gap: '8px', overflow: 'auto', padding: '4px 0' }}
              ></div>
            </div>

            <div className="chat-list" id="chatList"></div>
          </div>

          <div className="main-chat" id="mainChat">
            <header className="header-right" id="chatHeader">
              <button className="mobile-back" onClick={() => (window as any).toggleMobileView?.(false)}>
                <i className="fas fa-arrow-left"></i>
              </button>
              <div id="chatHeaderTitle" style={{ flex: 1 }}>
                Sélectionnez une discussion
              </div>
            </header>

            <div className="messages-container" id="messages"></div>

            <div id="replyPreview" className="reply-preview-bar" style={{ display: 'none' }}>
              <div className="reply-content">
                <small id="replySender" style={{ color: 'var(--gold)', fontWeight: 'bold' }}></small>
                <div id="replyText" className="truncate"></div>
              </div>
              <button className="icon-btn" onClick={() => (window as any).annulerReponse?.()}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div id="voiceOverlay" className="voice-overlay" style={{ display: 'none' }}>
              <div className="vocal-anim">
                <i className="fas fa-microphone"></i>
                <div className="pulse-ring"></div>
              </div>
              <div id="voiceTimer" style={{ color: 'var(--gold)', fontWeight: 'bold' }}>0:00</div>
            </div>

            <footer className="footer-chat">
              <button className="icon-btn" onClick={() => (window as any).triggerFileUpload?.()}>
                <i className="fas fa-paperclip"></i>
              </button>
              <input
                type="file"
                id="fileInput"
                style={{ display: 'none' }}
                onChange={(e) => (window as any).handleFileUpload?.(e)}
              />
              <div className="message-input-wrapper">
                <input
                  type="text"
                  id="msgInput"
                  placeholder="Tapez un message"
                  autoComplete="off"
                />
              </div>
              <div className="send-actions">
                <button id="micBtn" className="icon-btn mic-btn">
                  <i className="fas fa-microphone" id="micIcon"></i>
                </button>
                <button
                  id="btnEnvoyer"
                  className="icon-btn send-btn"
                  onClick={() => (window as any).envoyerMessageAction?.()}
                  style={{ display: 'none' }}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </footer>
          </div>
        </div>

        {/* LAYOUT STUDENT */}
        <div className="app-wrapper" id="appMainStudent" style={{ display: 'none' }}>
          <div className="sidebar" id="sidebarStudent">
            <header className="header-left">
              <div className="header-actions">
                <select
                  id="themeSelectorStudent"
                  className="theme-select"
                  onChange={(e) => (window as any).changerTheme?.(e.target.value)}
                >
                  <option value="theme-dark">🌑 Sombre</option>
                  <option value="theme-light">☀️ Clair</option>
                </select>
              </div>
            </header>

            <nav className="nav-tabs-main" id="navTabsStudent">
              <button
                className="tab-main active"
                onClick={() => (window as any).switchTab?.('discussions')}
              >
                <i className="fas fa-comment"></i> Discussions
              </button>
            </nav>

            <div
              id="socialWorkerListStudent"
              className="contacts-list"
              style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}
            >
              <h3 style={{ color: 'var(--gold)', fontSize: '0.9em', marginBottom: '8px' }}>
                👤 Assistant Social
              </h3>
              <div id="socialWorkerGridStudent" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}></div>
            </div>

            <div
              id="contactsListStudent"
              className="contacts-list"
              style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}
            >
              <h3 style={{ color: 'var(--gold)', fontSize: '0.9em', marginBottom: '8px' }}>
                👥 Mes Groupes
              </h3>
              <div id="contactsGridStudent" style={{ display: 'grid', gap: '8px' }}></div>
            </div>

            <div className="chat-list" id="chatListStudent"></div>
          </div>

          <div className="main-chat" id="mainChatStudent">
            <header className="header-right" id="chatHeaderStudent">
              <button
                className="mobile-back"
                onClick={() => (window as any).toggleMobileView?.(false)}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <div id="chatHeaderTitleStudent" style={{ flex: 1 }}>
                Sélectionnez une discussion
              </div>
            </header>

            <div className="messages-container" id="messagesStudent"></div>

            <div id="replyPreviewStudent" className="reply-preview-bar" style={{ display: 'none' }}>
              <div className="reply-content">
                <small id="replySenderStudent" style={{ color: 'var(--gold)', fontWeight: 'bold' }}></small>
                <div id="replyTextStudent" className="truncate"></div>
              </div>
              <button className="icon-btn" onClick={() => (window as any).annulerReponse?.()}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div id="voiceOverlayStudent" className="voice-overlay" style={{ display: 'none' }}>
              <div className="vocal-anim">
                <i className="fas fa-microphone"></i>
                <div className="pulse-ring"></div>
              </div>
              <div id="voiceTimerStudent" style={{ color: 'var(--gold)', fontWeight: 'bold' }}>0:00</div>
            </div>

            <footer className="footer-chat">
              <button className="icon-btn" onClick={() => (window as any).triggerFileUpload?.()}>
                <i className="fas fa-paperclip"></i>
              </button>
              <input
                type="file"
                id="fileInputStudent"
                style={{ display: 'none' }}
                onChange={(e) => (window as any).handleFileUpload?.(e)}
              />
              <div className="message-input-wrapper">
                <input
                  type="text"
                  id="msgInputStudent"
                  placeholder="Tapez un message"
                  autoComplete="off"
                />
              </div>
              <div className="send-actions">
                <button id="micBtnStudent" className="icon-btn mic-btn">
                  <i className="fas fa-microphone" id="micIconStudent"></i>
                </button>
                <button
                  id="btnEnvoyerStudent"
                  className="icon-btn send-btn"
                  onClick={() => (window as any).envoyerMessageAction?.()}
                  style={{ display: 'none' }}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </footer>
          </div>
        </div>

        {/* LIGHTBOX */}
        <div id="lightbox" className="lightbox-overlay" style={{ display: 'none' }}>
          <div className="lightbox-content">
            <button
              className="lightbox-close"
              onClick={() => (window as any).closeLightbox?.()}
            >
              <i className="fas fa-times"></i>
            </button>
            <img id="lightboxImg" style={{ display: 'none' }} />
            <video id="lightboxVideo" controls style={{ display: 'none' }} />
          </div>
        </div>

        {/* CONTEXT MENU */}
        <div
          id="contextMenu"
          style={{
            position: 'fixed',
            background: 'var(--bg-main)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 0',
            zIndex: 999,
            display: 'none',
            minWidth: '180px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <button
            id="ctxReplyBtn"
            onClick={() => (window as any).prepReply?.()}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '0.9em',
            }}
          >
            💬 Répondre
          </button>
          <button
            id="ctxEditBtn"
            onClick={() => (window as any).prepEdit?.()}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '0.9em',
            }}
          >
            ✏️ Éditer
          </button>
          <button
            id="ctxRetransferBtn"
            onClick={() => (window as any).retransfererMessage?.()}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '0.9em',
              display: 'none',
            }}
          >
            📤 Retransférer
          </button>
          <button
            className="danger"
            onClick={() => (window as any).confirmSuppression?.()}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              color: '#ff4444',
              cursor: 'pointer',
              fontSize: '0.9em',
              display: 'none',
            }}
          >
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </>
  );
}

