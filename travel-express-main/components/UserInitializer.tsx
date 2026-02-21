'use client';

import { useEffect } from 'react';

/**
 * Composant qui initialise localStorage avec les données utilisateur et le token
 * à mettre dans le layout au niveau root ou dans chaque page client
 */
export function UserInitializer() {
  useEffect(() => {
    const setupNotificationPermissionPrompt = () => {
      if (typeof window === "undefined") return;
      if (!("Notification" in window)) return;
      if (Notification.permission !== "default") return;
      if (localStorage.getItem("notif_prompt_registered") === "1") return;

      const requestOnce = async () => {
        try {
          await Notification.requestPermission();
        } catch {}
        window.removeEventListener("click", requestOnce);
        window.removeEventListener("touchstart", requestOnce);
        localStorage.setItem("notif_prompt_registered", "1");
      };

      window.addEventListener("click", requestOnce, { once: true });
      window.addEventListener("touchstart", requestOnce, { once: true });
    };

    const initializeUser = async () => {
      try {
        // Récupérer les infos utilisateur ET le token en parallèle
        const [userRes, tokenRes] = await Promise.all([
          fetch('/api/user/current').catch(() => null),
          fetch('/api/auth/token').catch(() => null)
        ]);

        // Sauvegarder l'utilisateur
        if (userRes?.ok) {
          const user = await userRes.json();
          localStorage.setItem('travelExpressUser', JSON.stringify(user));
          console.log('✅ Données utilisateur sauvegardées dans localStorage');
        }

        // Sauvegarder le token
        if (tokenRes?.ok) {
          const { token } = await tokenRes.json();
          if (token) {
            localStorage.setItem('authToken', token);
            localStorage.setItem('travelExpressToken', token);
            console.log('✅ Token sauvegardé dans localStorage');
          }
        } else if (tokenRes) {
          console.warn('⚠️ Impossible de récupérer le token:', tokenRes.status);
        }
      } catch (error) {
        console.error('Erreur initialisation utilisateur:', error);
      }
    };

    setupNotificationPermissionPrompt();
    initializeUser();
  }, []);

  // Ce composant n'affiche rien
  return null;
}
