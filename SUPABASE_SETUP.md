# Guide de configuration Supabase pour Abi-Collection

## 📋 Étapes de configuration

### 1. Créer un compte Supabase

1. Va sur [https://supabase.com](https://supabase.com)
2. Crée un compte gratuit
3. Crée un nouveau projet
4. Note ton **URL du projet** et ta **clé anonyme (anon key)**

### 2. Configurer la base de données

1. Dans ton projet Supabase, va dans **SQL Editor**
2. Copie le contenu du fichier `supabase-schema.sql`
3. Colle-le dans l'éditeur SQL et exécute-le
4. Cela créera toutes les tables nécessaires

### 3. Configurer les clés API

1. Ouvre le fichier `supabase-config.js`
2. Remplace `YOUR_SUPABASE_URL` par ton URL Supabase
3. Remplace `YOUR_SUPABASE_ANON_KEY` par ta clé anonyme

Exemple :
```javascript
const SUPABASE_CONFIG = {
  url: "https://abcdefghijklmnop.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};
```

### 4. Activer Supabase dans l'application

1. Ouvre le fichier `supabase-integration.js`
2. Trouve la ligne : `const USE_SUPABASE = false;`
3. Change-la en : `const USE_SUPABASE = true;`

### 5. Configurer l'authentification (optionnel)

Si tu veux utiliser l'authentification Supabase :

1. Dans Supabase, va dans **Authentication** > **Providers**
2. Active les providers que tu veux (Email, Google, etc.)
3. Configure les paramètres selon tes besoins

### 6. Tester la connexion

1. Ouvre la console du navigateur (F12)
2. Recharge la page
3. Tu devrais voir "✅ Supabase initialisé" dans la console
4. Si tu vois des erreurs, vérifie tes clés API

## 🔄 Migration des données LocalStorage vers Supabase

Un script de migration sera créé pour transférer tes données existantes.

## 📝 Notes importantes

- **Sécurité** : Ne partage jamais ta clé de service (service_role key) publiquement
- **RLS** : Les politiques de sécurité (RLS) sont déjà configurées dans le schéma SQL
- **Fallback** : L'application utilise LocalStorage comme fallback si Supabase n'est pas configuré
- **Performance** : Supabase est beaucoup plus rapide et scalable que LocalStorage

## 🆘 Dépannage

### Erreur "Bibliothèque Supabase non chargée"
- Vérifie que le script Supabase est chargé avant `supabase-integration.js`
- Vérifie ta connexion internet

### Erreur "Invalid API key"
- Vérifie que tu as utilisé la bonne clé (anon key, pas service_role key)
- Vérifie que l'URL est correcte

### Les données ne s'affichent pas
- Vérifie que `USE_SUPABASE = true` dans `supabase-integration.js`
- Vérifie les politiques RLS dans Supabase
- Regarde la console pour les erreurs

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Guide JavaScript Supabase](https://supabase.com/docs/reference/javascript/introduction)

