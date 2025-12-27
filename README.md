# Abi-Collection

Boutique en ligne de beauté et élégance pour femmes et hommes, basée à Kolwezi, RDC.

## 🎨 Description

Abi-Collection est une boutique e-commerce moderne offrant une sélection raffinée de parfums, accessoires et soins. L'application propose une expérience utilisateur soignée avec un design futuriste aux accents dorés.

## ✨ Fonctionnalités

- 🛍️ **Catalogue de produits** : Parfums, lunettes, montres, bijoux, foulards, déodorants
- 🔍 **Recherche et filtrage** : Par catégorie, nom, prix
- 📦 **Gestion du panier** : Ajout, modification, suppression d'articles
- 💳 **Commandes** : Validation via WhatsApp
- 👤 **Compte utilisateur** : Inscription, connexion, historique des commandes
- 🔐 **Panneau administrateur** : Gestion des produits, catégories et commandes
- 📊 **Base de données Supabase** : Stockage cloud avec fallback LocalStorage

## 🚀 Technologies utilisées

- **Frontend** : HTML5, CSS3 (Tailwind CSS), JavaScript (Vanilla)
- **Base de données** : Supabase (PostgreSQL)
- **Stockage** : LocalStorage (fallback)
- **Design** : Thème doré futuriste avec effets glassmorphism

## 📋 Prérequis

- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Compte Supabase (optionnel, pour utiliser la base de données cloud)

## 🔧 Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/votre-username/Abi-Collection.git
cd Abi-Collection
```

2. Ouvrez `index.html` dans votre navigateur ou utilisez un serveur local :
```bash
# Avec Python
python -m http.server 8000

# Avec Node.js (http-server)
npx http-server
```

3. (Optionnel) Configurez Supabase :
   - Créez un projet sur [Supabase](https://supabase.com)
   - Exécutez le script SQL dans `supabase-schema.sql`
   - Mettez à jour les clés dans `supabase-config.js`
   - Utilisez `migrate.html` pour migrer vos données LocalStorage vers Supabase

## 📁 Structure du projet

```
Abi-Collection/
├── index.html              # Page d'accueil
├── products.html           # Liste des produits
├── product.html            # Détails d'un produit
├── cart.html              # Panier
├── checkout.html           # Validation de commande
├── login.html             # Connexion
├── register.html          # Inscription
├── account.html           # Compte utilisateur
├── admin.html             # Panneau administrateur
├── app.js                 # Logique principale
├── admin.js               # Logique admin
├── style.css              # Styles personnalisés
├── supabase-config.js     # Configuration Supabase
├── supabase-integration.js # Intégration Supabase
├── supabase-schema.sql    # Schéma de base de données
├── migrate.html           # Page de migration
├── images/                # Images des produits
└── README.md              # Ce fichier
```

## 🔐 Identifiants administrateur par défaut

- **Email** : `admin@abi-collection.com`
- **Mot de passe** : `AbiCollection2025!`

⚠️ **Important** : Changez ces identifiants en production !

## 📝 Notes

- L'application fonctionne avec LocalStorage par défaut
- L'intégration Supabase est optionnelle mais recommandée pour la production
- Les commandes sont envoyées via WhatsApp
- Le panier se vide automatiquement après validation d'une commande

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

## 📄 Licence

Ce projet est sous licence MIT.

## 👤 Auteur

Abi-Collection - Kolwezi, RDC

---

**Votre élégance, révélée.** ✨

