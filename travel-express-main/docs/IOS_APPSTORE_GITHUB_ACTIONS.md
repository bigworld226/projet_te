# iOS App Store via GitHub Actions (sans Mac local)

Ce projet inclut un workflow manuel: `.github/workflows/ios-appstore.yml`.

## 1) Prérequis Apple

- Compte Apple Developer actif (99$/an)
- App créée dans App Store Connect avec le bundle id:
  - `com.travel.express`
- Certificat **Apple Distribution** exporté en `.p12`
- Provisioning profile iOS App Store pour `com.travel.express` (fichier `.mobileprovision`)
- Clé API App Store Connect (Key ID + Issuer ID)

## 2) Secrets GitHub à ajouter

Dans GitHub > `Settings` > `Secrets and variables` > `Actions`:

- `APPLE_TEAM_ID`
- `BUILD_CERTIFICATE_BASE64` (contenu base64 du `.p12`)
- `P12_PASSWORD`
- `BUILD_PROVISION_PROFILE_BASE64` (contenu base64 du `.mobileprovision`)
- `KEYCHAIN_PASSWORD` (mot de passe temporaire pour la keychain CI)
- `APPSTORE_API_KEY_ID`
- `APPSTORE_API_ISSUER_ID`
- `APPSTORE_API_PRIVATE_KEY` (contenu texte complet du fichier `AuthKey_XXXXXX.p8`)

## 3) Générer le base64 (Windows PowerShell)

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\dist-cert.p12")) | Set-Clipboard
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\profile.mobileprovision")) | Set-Clipboard
```

Colle les valeurs dans `BUILD_CERTIFICATE_BASE64` et `BUILD_PROVISION_PROFILE_BASE64`.

## 4) Lancer le workflow

- GitHub > `Actions` > `iOS App Store` > `Run workflow`

Le workflow:
- crée/synchronise le projet iOS Capacitor
- archive + exporte le `.ipa`
- upload vers App Store Connect
- publie aussi le `.ipa` en artifact GitHub

## 5) Où valider ensuite

- App Store Connect > TestFlight:
  - build en cours de processing
  - puis distribution test interne/externe
