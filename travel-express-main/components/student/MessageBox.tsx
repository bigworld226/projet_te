"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    role: { name: string };
  };
  readReceipts?: Array<{
    userId: string;
    user: {
      id: string;
      fullName: string;
    };
    readAt: string;
  }>;
}

interface MessageBoxProps {
  applicationId: string;
  currentUserId: string;
  className?: string;
}

export function MessageBox({ applicationId, currentUserId, className }: MessageBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les messages
  useEffect(() => {
    fetchMessages();
    // Recharger les messages toutes les 10 secondes
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [applicationId]);

  // Marquer comme lu + Scroll automatique vers le bas
  useEffect(() => {
    if (messages.length > 0) {
      markMessagesAsRead();
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function markMessagesAsRead() {
    try {
      await fetch(`/api/student/messages/${applicationId}/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Erreur marquage lecture:", error);
    }
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/student/messages/${applicationId}`);
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setMessages(data.conversation?.messages || []);
    } catch (error) {
      console.error("Erreur chargement messages:", error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending) return;
    setSending(true);

    try {
      const res = await fetch(`/api/student/messages/${applicationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();

      // Ajouter le message localement
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
      toast.success("Message envoyé");
    } catch (error) {
      console.error("Erreur envoi message:", error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (loading) {
    return (
      <div className={cn("bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm", className)}>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="font-bold text-xs uppercase tracking-widest">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col", className)}>
      {/* Header */}
      <div className="p-8 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center">
            <MessageCircle className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-black text-slate-950 uppercase italic tracking-tighter text-xl">
              Messagerie <span className="text-slate-200 not-italic">/</span> Agence
            </h3>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
              Posez vos questions sur votre dossier
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-125 min-h-75">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Aucun message pour le moment
            </p>
            <p className="text-slate-300 text-[10px] mt-2">
              Commencez la conversation avec votre conseiller
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === currentUserId;
            const isAdmin = msg.sender.role.name !== "STUDENT";

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4 items-start",
                  isMe ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
                    isAdmin
                      ? "bg-[#db9b16]/10 text-[#db9b16]"
                      : "bg-blue-50 text-blue-600"
                  )}
                >
                  {isAdmin ? <Shield size={18} strokeWidth={2.5} /> : <User size={18} strokeWidth={2.5} />}
                </div>

                {/* Message */}
                <div className={cn("flex-1 max-w-[70%]", isMe && "flex flex-col items-end")}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span
                      className={cn(
                        "font-black text-xs uppercase tracking-tight",
                        isAdmin ? "text-[#db9b16]" : "text-blue-600"
                      )}
                    >
                      {msg.sender.fullName || "Utilisateur"}
                    </span>
                    <span className="text-[9px] text-slate-300 font-medium">
                      {new Date(msg.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "px-6 py-4 rounded-3xl",
                      isMe
                        ? "bg-blue-600 text-white"
                        : "bg-slate-50 text-slate-800 border border-slate-100"
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    
                    {/* WhatsApp-style Read Receipt */}
                    {isMe && (
                      <div className="flex items-center justify-end gap-1 mt-2">
                        {msg.readReceipts && msg.readReceipts.length > 0 ? (
                          <>
                            <span className="text-blue-200 text-sm font-bold">✓</span>
                            <span className="text-blue-100 text-sm font-bold">✓</span>
                          </>
                        ) : (
                          <span className="text-blue-200 text-sm font-bold">✓</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Read Receipt Info */}
                  {isMe && msg.readReceipts && msg.readReceipts.length > 0 && (
                    <div className="mt-1 text-[9px] text-slate-400 font-medium">
                      Lu par {msg.readReceipts.length} {msg.readReceipts.length === 1 ? "personne" : "personnes"}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/30">
        <div className="flex gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Écrivez votre message... (Entrée pour envoyer)"
            className="flex-1 px-6 py-4 rounded-3xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none font-medium text-sm bg-white"
            rows={2}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-lg",
              newMessage.trim() && !sending
                ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            {sending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} strokeWidth={2.5} />
            )}
          </button>
        </div>
        <p className="text-[9px] text-slate-400 font-medium mt-3 px-2">
          Les messages sont visibles par l'équipe de l'agence. Réponse sous 24h en moyenne.
        </p>
      </div>
    </div>
  );
}
