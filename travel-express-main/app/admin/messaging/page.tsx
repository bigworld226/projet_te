'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Plus, ArrowLeft, Users, Clock } from 'lucide-react';

interface Conversation {
  id: string;
  subject: string;
  studentName: string;
  studentEmail: string;
  universityName: string;
  participants: { id: string; fullName: string; role: string }[];
  lastMessage: { content: string; sender: string; date: string } | null;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  attachments: string[];
  sender: { id: string; fullName: string; role: { name: string } };
}

interface ConversationDetail {
  id: string;
  subject: string;
  application: {
    id: string;
    status: string;
    user: { id: string; fullName: string; email: string };
    university: { name: string } | null;
  } | null;
  participants: { user: { id: string; fullName: string; role: { name: string } } }[];
  messages: Message[];
}

export default function MessagingPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  // Suppression de la création manuelle de discussion
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Scroll vers le bas quand les messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  async function fetchConversations() {
    try {
      const res = await fetch('/api/admin/messaging');
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      console.error('Erreur chargement conversations:', e);
    } finally {
      setLoading(false);
    }
  }

  async function openConversation(convId: string) {
    try {
      const res = await fetch(`/api/admin/messaging/${convId}`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setSelectedConv(data.conversation);
    } catch (e) {
      console.error('Erreur ouverture conversation:', e);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);

    try {
      const res = await fetch(`/api/admin/messaging/${selectedConv.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();

      // Ajouter le message à la conversation
      setSelectedConv(prev => prev ? {
        ...prev,
        messages: [...prev.messages, data.message],
      } : null);
      setNewMessage('');
      fetchConversations(); // Rafraîchir la liste
    } catch (e) {
      console.error('Erreur envoi message:', e);
    } finally {
      setSending(false);
    }
  }

  // Suppression de la création manuelle de discussion

  function getRoleBadge(roleName: string) {
    const colors: Record<string, string> = {
      SUPERADMIN: 'bg-red-100 text-red-700',
      STUDENT_MANAGER: 'bg-blue-100 text-blue-700',
      QUALITY_OFFICER: 'bg-green-100 text-green-700',
      SECRETARY: 'bg-purple-100 text-purple-700',
      FINANCE_MANAGER: 'bg-yellow-100 text-yellow-700',
      STUDENT: 'bg-slate-100 text-slate-600',
    };
    return colors[roleName] || 'bg-slate-100 text-slate-600';
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffH < 1) return 'Il y a quelques minutes';
    if (diffH < 24) return `Il y a ${diffH}h`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* SIDEBAR - Liste des conversations */}
      <div className={`w-full md:w-[360px] border-r border-slate-100 flex flex-col ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-sm uppercase tracking-wider text-slate-900">
            <MessageSquare className="inline mr-2 text-[#db9b16]" size={18} />
            Messagerie
          </h2>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune conversation</p>
              <p className="text-xs mt-1">Créez une nouvelle discussion</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv.id)}
                className={`w-full p-4 border-b border-slate-50 text-left hover:bg-slate-50 transition-all ${
                  selectedConv?.id === conv.id ? 'bg-[#db9b16]/5 border-l-2 border-l-[#db9b16]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-900 truncate">
                      {conv.subject}
                    </p>
                    <p className="text-[10px] text-[#db9b16] font-semibold mt-0.5">
                      {conv.studentName} {conv.universityName ? `• ${conv.universityName}` : ''}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate">
                        <span className="font-semibold">{conv.lastMessage.sender}:</span> {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-300 whitespace-nowrap mt-0.5">
                    {formatDate(conv.updatedAt)}
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  {conv.participants.slice(0, 3).map(p => (
                    <span key={p.id} className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${getRoleBadge(p.role)}`}>
                      {p.fullName?.split(' ')[0] || p.role}
                    </span>
                  ))}
                  {conv.participants.length > 3 && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 font-bold">
                      +{conv.participants.length - 3}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ZONE DE CHAT */}
      <div className={`flex-1 flex flex-col ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
        {selectedConv ? (
          <>
            {/* Header conversation */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <button
                onClick={() => setSelectedConv(null)}
                className="md:hidden p-2 rounded-xl hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-slate-900">
                  {selectedConv.application
                    ? `Dossier de ${selectedConv.application.user.fullName}`
                    : 'Discussion'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Users size={12} className="text-slate-400" />
                  <span className="text-[10px] text-slate-400">
                    {selectedConv.participants.map(p => p.user.fullName).join(', ')}
                  </span>
                </div>
              </div>
              {selectedConv.application && (
                <span className="text-[9px] px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-bold uppercase">
                  {selectedConv.application.status.replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {selectedConv.messages.map(msg => (
                <div key={msg.id} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${getRoleBadge(msg.sender.role.name)}`}>
                      {msg.sender.fullName}
                    </span>
                    <span className="text-[9px] text-slate-300 flex items-center gap-0.5">
                      <Clock size={9} /> {new Date(msg.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 max-w-[80%]">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input message */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Écrire un message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#db9b16]/30 focus:border-[#db9b16]"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#db9b16] text-white font-bold text-xs uppercase hover:bg-[#c48a14] disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Send size={14} />
                  Envoyer
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={64} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 text-sm">Sélectionnez une conversation</p>
              <p className="text-slate-300 text-xs mt-1">ou créez-en une nouvelle</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
