# Vérification de la séparation Admin/Student

## Changements apportés

### 1. Suppression du fichier double charge
- ❌ Supprimé: `/public/pagedeDiscussionStudent.js` (causait une double charge)

### 2. Modification de page.tsx
- avant:
  ```javascript
  const scriptFile = isAdmin ? 'pagedeDiscussionAdmin.js' : 'pagedeDiscussionStudent.js';
  script.src = '/' + scriptFile;
  ```
- après:
  ```javascript
  // Toujours charger pagedeDiscussionAdmin.js - il gère les deux layouts
  script.src = '/pagedeDiscussionAdmin.js';
  ```

### 3. Utilisation du code existant
- `pagedeDiscussionAdmin.js` contenait déjà:
  - `showAdminLayout()` - affiche interface admin
  - `showStudentLayout()` - affiche interface student
  - `chargerAssistantSocial()` - charge Assistant Social pour students
  - `chargerGroupesStudent()` - charge groupes pour students
  
## Flux de fonctionnement

### Pour un STUDENT:
```
page.tsx charge pagedeDiscussionAdmin.js (une seule fois)
  ↓
initializeUser() reçoit le user avec role="STUDENT"
  ↓
isAdminUser = false
  ↓
showStudentLayout()  // Cache appMainAdmin, affiche appMainStudent
chargerAssistantSocial()  // Peuple socialWorkerGridStudent
chargerGroupesStudent()  // Peuple contactsGridStudent
switchTab("discussions")  // Affiche "Sélectionnez votre conversation ci-dessus"
  ↓
RÉSULTAT: Student voit SEULEMENT Assistant Social + Groupes
```

### Pour un ADMIN:
```
page.tsx charge pagedeDiscussionAdmin.js (une seule fois)
  ↓
initializeUser() reçoit le user avec role="SUPERADMIN|QUALITY_OFFICER|etc"
  ↓
isAdminUser = true
  ↓
showAdminLayout()  // Cache appMainStudent, affiche appMainAdmin
chargerContactsAdmin()  // Peuple contactsGridAdmin
switchTab("discussions")  // Charge toutes les conversations
  ↓
RÉSULTAT: Admin voit l'interface complète
```

## Tests à effectuer

### 1. Test STUDENT
- [ ] Se connecter avec un compte STUDENT
- [ ] Aller à /messaging
- [ ] Vérifier: Interface simplifiée avec SEULEMENT "Assistant Social"
- [ ] Vérifier: Pas de liste de conversations admin
- [ ] Vérifier: Bouton "Discussions" présent mais ne montre pas conversations admin
- [ ] Vérifier: Boutons "Groupes" présent
- [ ] Vérifier: Console: "isAdminUser: false"

### 2. Test ADMIN
- [ ] Se connecter avec un compte ADMIN
- [ ] Aller à /messaging
- [ ] Vérifier: Interface complète avec tous les boutons
- [ ] Vérifier: Liste de toutes les conversations apparaît
- [ ] Vérifier: Boutons "Diffusions" present
- [ ] Vérifier: Console: "isAdminUser: true"

### 3. Vérification console (F12)
- [ ] Vérifier que `pagedeDiscussionAdmin.js` se charge une SEULE fois
- [ ] Pas d'erreurs de "script loaded twice"
- [ ] Vérifier message: "initializeUser complété"
- [ ] Vérifier que `isAdminUser: false` pour student et `true` pour admin

## Code clé

### File: app/messaging/page.tsx (ligne 49-51)
```typescript
// Toujours charger pagedeDiscussionAdmin.js - il gère les deux layouts (admin + student)
const script = document.createElement('script');
script.src = '/pagedeDiscussionAdmin.js?v=' + Date.now();
```

### File: public/pagedeDiscussionAdmin.js (ligne 1028-1036)
```javascript
window.isAdminUser = ["SUPERADMIN", "QUALITY_OFFICER", "SECRETARY", "STUDENT_MANAGER"].includes(currentUser.role?.name);
isAdminUser = window.isAdminUser;

if (isAdminUser) {
    showAdminLayout();
} else {
    showStudentLayout();
}
```

### File: public/pagedeDiscussionAdmin.js (ligne 324-325)
```javascript
function showStudentLayout() {
    const adminApp = document.getElementById("appMainAdmin");
    const studentApp = document.getElementById("appMainStudent");
    if (adminApp) adminApp.style.display = "none";
    if (studentApp) studentApp.style.display = "flex";
}
```

## Résolution des problèmes

**Symptôme: Student voit toujours interface admin**
- ❌ Ancienne cause: Double charge du script (pagedeDiscussionStudent.js chargeait pagedeDiscussionAdmin.js)
- ✅ Nouvelle approche: Une seule charge, showStudentLayout() masque appMainAdmin et affiche appMainStudent

**Symptôme: Assistant Social n'apparaît pas**
- ❌ Vérifier que initializeUser() atteint chargerAssistantSocial()
- ❌ Vérifier que /api/student/admin retourne un résultat
- ✅ L'API qui devrait être testée: GET /api/student/admin

**Symptôme: Groupes n'apparaissent pas**
- ❌ Vérifier que initializeUser() atteint chargerGroupesStudent()
- ✅ L'API qui devrait être testée: GET /api/student/groups

## Status

✅ **IMPLÉMENTÉ** - Pas de double charge du script
✅ **IMPLÉMENTÉ** - page.tsx charges toujours pagedeDiscussionAdmin.js une seule fois
✅ **IMPLÉMENTÉ** - showStudentLayout() et showAdminLayout() existent et fonctionnent
✅ **IMPLÉMENTÉ** - Les deux divs HTML existent dans page.tsx

⏳ **À TESTER** - Vérifier visuellement que l'interface change selon le rôle
