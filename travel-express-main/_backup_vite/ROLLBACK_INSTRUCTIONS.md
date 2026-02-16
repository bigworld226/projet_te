# 🔄 Instructions de Rollback - Intégration Vite/Messaging

## ⏮️ Comment revenir en arrière

Si l'intégration ne fonctionne pas ou que vous voulez revenir à la version Vite indépendante:

### Étape 1: Arrêter le serveur Next.js
```bash
# Terminal 1: Arrêter Next.js
Ctrl+C
```

### Étape 2: Supprimer les fichiers d'intégration
```bash
# Supprimer la route messaging
Remove-Item app/messaging -Recurse -Force

# Supprimer les styles intégrés (si applicable)
Remove-Item public/messaging-styles* -Force -ErrorAction SilentlyContinue
```

### Étape 3: Relancer Vite
```bash
cd c:\Users\user\Desktop\projet_te\travel_express
npm run dev
# Vite redémarrera sur http://localhost:5173
```

### Étape 4: Restaurer depuis backup (si besoin)
```bash
# Les fichiers originaux sont sauvegardés ici:
# c:\Users\user\Desktop\projet_te\travel-express-main\_backup_vite\
# Vous pouvez les copier si vous avez un problème
```

---

## 📋 Fichiers créés pour l'intégration

Voici tous les fichiers qui seront créés:
- `app/messaging/page.tsx` - Page Next.js de messagerie
- `app/messaging/layout.tsx` - Layout spécifique (optionnel)
- `public/pagedeDiscussion.js` - Copie du script
- `public/stylepagedeDiscussion.css` - CSS de messagerie

**Tous ces fichiers peuvent être supprimés pour revenir à l'état précédent.**

---

## ✅ Vérification du rollback

Après le rollback, vérifiez:
1. Vite redémarre bien sur http://localhost:5173
2. La page se charge sans erreurs
3. localStorage n'est pas affecté

Si tout est OK, vous êtes revenu à l'état initial! 🎉

---

**Date de création:** 15 Février 2026  
**Intégration créée par:** GitHub Copilot
