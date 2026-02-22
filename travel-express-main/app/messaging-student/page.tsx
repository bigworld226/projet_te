'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    initializeUser?: () => Promise<void>;
    setupEventListeners?: () => void;
  }
}

export default function MessagingStudentPage() {
  useEffect(() => {
    const loadAndInitialize = async () => {
      try {
        // Vérifier si le script a déjà été chargé
        const existingScript = document.querySelector('script[data-messaging-student]');
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

        // Charger messaging-student.js
        const script = document.createElement('script');
        script.src = '/messaging-student.js?v=' + Date.now();
        script.setAttribute('data-messaging-student', 'true');
        script.onload = () => {
          setTimeout(() => {
            if (window.initializeUser) {
              console.log("✅ Initialisation interface STUDENT...");
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
          console.error("❌ Erreur lors du chargement de messaging-student.js");
        };
        document.body.appendChild(script);
      } catch (err) {
        console.error("❌ Erreur:", err);
      }
    };

    loadAndInitialize();
  }, []);

  return (
    <>
      <link rel="stylesheet" href="/stylepagedeDiscussion.css" />
            <div style={{ 
        margin: 0, 
        padding: 0, 
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* LAYOUT STUDENT */}
        <div className="app-wrapper" id="appMainStudent" style={{ display: 'none' }}>
          <div className="sidebar" id="sidebarStudent">
            <header className="header-left">
              <div className="header-actions">
                <button
                  className="icon-btn"
                  onClick={() => { window.location.href = '/student/dashboard'; }}
                  title="Retour au Dashboard"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
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

            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
              <input
                id="conversationSearchStudent"
                type="text"
                placeholder="Rechercher un contact..."
                style={{
                  width: '100%',
                  height: '36px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  outline: 'none'
                }}
              />
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
            id="ctxDeleteBtn"
            onClick={() => (window as any).supprimerMessage?.()}
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
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </>
  );
}



