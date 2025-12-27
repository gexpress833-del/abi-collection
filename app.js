// Abi-Collection - Front client
// Gestion LocalStorage : users, currentUser, products, orders, cart, adminCredentials (seed)

(function () {
  const LS_KEYS = {
    USERS: "users",
    CURRENT_USER: "currentUser",
    PRODUCTS: "products",
    ORDERS: "orders",
    CART: "cart",
    ADMIN_CREDENTIALS: "adminCredentials",
    ADMIN_LOGGED_IN: "adminLoggedIn",
    POST_LOGIN_REDIRECT: "postLoginRedirect",
    CATEGORIES: "categories",
  };

  // ---------- Utils LocalStorage ----------
  function readLS(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error("Erreur lecture LocalStorage", key, e);
      return fallback;
    }
  }

  function writeLS(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Erreur écriture LocalStorage", key, e);
    }
  }

  function getCurrentUser() {
    return readLS(LS_KEYS.CURRENT_USER, null);
  }

  function setCurrentUser(user) {
    if (user) {
      writeLS(LS_KEYS.CURRENT_USER, user);
    } else {
      window.localStorage.removeItem(LS_KEYS.CURRENT_USER);
    }
  }

  // ---------- Fonction utilitaire pour ouvrir WhatsApp ----------
  // Fonction globale accessible depuis n'importe où dans l'application
  window.openWhatsApp = function(url) {
    // Méthode 1 : Essayer window.open (peut être bloqué par les bloqueurs de popup)
    try {
      const popup = window.open(url, "_blank", "noopener,noreferrer");
      if (popup && !popup.closed) {
        // Vérifier après un court délai si la popup a été bloquée
        setTimeout(() => {
          if (popup.closed || popup.location.href === "about:blank") {
            // Popup bloquée, utiliser window.location
            window.location.href = url;
          }
        }, 100);
        return true;
      } else {
        // Popup bloquée, utiliser window.location
        window.location.href = url;
        return true;
      }
    } catch (e) {
      // En cas d'erreur, utiliser window.location
      try {
        window.location.href = url;
        return true;
      } catch (e2) {
        console.error("Impossible d'ouvrir WhatsApp:", e2);
        return false;
      }
    }
  };

  // ---------- Fonctions Supabase avec fallback LocalStorage ----------
  
  // Cache pour éviter les appels répétés
  let productsCache = null;
  let ordersCache = null;
  let cartCache = null;

  async function getProducts() {
    // Utiliser Supabase si disponible
    if (window.SupabaseIntegration && window.SupabaseIntegration.isConfigured()) {
      try {
        const products = await window.SupabaseIntegration.getProducts();
        productsCache = products;
        return products;
      } catch (e) {
        console.error("Erreur récupération produits Supabase:", e);
        return readLS(LS_KEYS.PRODUCTS, []);
      }
    }
    // Fallback LocalStorage
    return readLS(LS_KEYS.PRODUCTS, []);
  }

  async function setProducts(products) {
    // Utiliser Supabase si disponible
    if (window.SupabaseIntegration && window.SupabaseIntegration.isConfigured()) {
      // Note: setProducts n'est généralement pas utilisé avec Supabase
      // car les produits sont gérés individuellement via saveProduct/deleteProduct
      // On garde LocalStorage comme cache local
      writeLS(LS_KEYS.PRODUCTS, products);
      productsCache = products;
      return;
    }
    // Fallback LocalStorage
    writeLS(LS_KEYS.PRODUCTS, products);
  }

  async function getOrders(userId = null) {
    // Utiliser Supabase si disponible
    if (window.SupabaseIntegration && window.SupabaseIntegration.isConfigured()) {
      try {
        const orders = await window.SupabaseIntegration.getOrders(userId);
        ordersCache = orders;
        return orders;
      } catch (e) {
        console.error("Erreur récupération commandes Supabase:", e);
        return readLS(LS_KEYS.ORDERS, []);
      }
    }
    // Fallback LocalStorage
    const allOrders = readLS(LS_KEYS.ORDERS, []);
    if (userId) {
      return allOrders.filter((o) => o.userId === userId);
    }
    return allOrders;
  }

  async function setOrders(orders) {
    // Note: setOrders n'est généralement pas utilisé avec Supabase
    // car les commandes sont créées via saveOrder
    // On garde LocalStorage comme cache local
    writeLS(LS_KEYS.ORDERS, orders);
    ordersCache = orders;
  }

  function getCart() {
    // Le panier reste en LocalStorage pour l'instant (sera migré vers Supabase avec l'auth)
    return readLS(LS_KEYS.CART, []);
  }

  function setCart(cart) {
    // Le panier reste en LocalStorage pour l'instant
    writeLS(LS_KEYS.CART, cart);
    cartCache = cart;
  }

  function generateId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).substring(2, 8)
    );
  }

  function formatCDF(amount) {
    try {
      return (
        (amount || 0).toLocaleString("fr-CD", {
          maximumFractionDigits: 0,
        }) + " CDF"
      );
    } catch {
      return amount + " CDF";
    }
  }

  // ---------- Gestion des images locales ----------
  function getProductImage(product) {
    // Image par défaut à utiliser (une image existante)
    const defaultImage = "images/parfums.jpg";
    if (!product) return defaultImage;

    // Si une image locale est déjà définie, on l'utilise
    if (product.image && !product.image.startsWith("http")) {
      return product.image;
    }

    // Mapping des catégories vers les noms de fichiers d'images disponibles
    // Support des catégories au singulier et au pluriel
    // Chaque catégorie peut avoir plusieurs images pour éviter le dédoublement
    const categoryImageMap = {
      // Singulier
      "parfum": ["images/parfums.jpg"],
      "montre": ["images/Montre Femmes.webp", "images/Montres Hommes.jpg", "images/Montres pour Femme.jfif", "images/montres-de-luxe-insert-audemars.webp"],
      "bague": ["images/Bague.webp", "images/Bagues.jpg"],
      "gourmette": ["images/Gourmette.jpg", "images/Gourmette.webp"],
      "foulard": ["images/foulard-soie-boheme.jpg", "images/foulard.jfif", "images/Foulards.jpg"],
      "deodorant": ["images/Déodorant.jpg", "images/Deodorants-and-antiperspirant--scaled.jpg"],
      "lunette": ["images/Lunettes.jpg", "images/Lunette.jpeg"],
      // Pluriel (pour compatibilité avec les produits existants)
      "parfums": ["images/parfums.jpg"],
      "montres": ["images/Montre Femmes.webp", "images/Montres Hommes.jpg", "images/Montres pour Femme.jfif", "images/montres-de-luxe-insert-audemars.webp"],
      "bijoux": ["images/Bague.webp", "images/Bagues.jpg"],
      "gourmettes": ["images/Gourmette.jpg", "images/Gourmette.webp"],
      "foulards": ["images/foulard-soie-boheme.jpg", "images/foulard.jfif", "images/Foulards.jpg"],
      "deodorants": ["images/Déodorant.jpg", "images/Deodorants-and-antiperspirant--scaled.jpg"],
      "lunettes": ["images/Lunettes.jpg", "images/Lunette.jpeg"],
      "accessoires": ["images/Lunettes.jpg", "images/Lunette.jpeg"],
      "vetements": ["images/foulard-soie-boheme.jpg", "images/foulard.jfif", "images/Foulards.jpg"],
      "hygiene": ["images/Déodorant.jpg", "images/Deodorants-and-antiperspirant--scaled.jpg"]
    };

    const category = product.category || "";
    const productName = (product.name || "")
      .toLowerCase()
      .replace(/[éèêë]/g, "e")
      .replace(/[àâä]/g, "a")
      .replace(/[ùûü]/g, "u")
      .replace(/[ôö]/g, "o")
      .replace(/[îï]/g, "i")
      .replace(/[ç]/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const productId = product.id || "";

    // Ordre de priorité pour les chemins d'images :
    // 1. PRIORITÉ ABSOLUE : Si le produit a une image spécifique (URL externe, base64, ou chemin local), l'utiliser
    if (product.image && product.image.trim()) {
      // Image uploadée (base64)
      if (product.image.startsWith("data:image/")) {
        return product.image;
      }
      // URL externe
      if (product.image.startsWith("http")) {
        return product.image;
      }
      // Chemin local (commence par "images/")
      if (product.image.startsWith("images/")) {
        return product.image;
      }
    }

    // 2. Si aucune image spécifique, utiliser une image de catégorie différente selon l'ID du produit
    // Cela évite le dédoublement d'images pour les produits de la même catégorie
    if (category && categoryImageMap[category]) {
      const availableImages = categoryImageMap[category];
      
      // Si plusieurs images sont disponibles pour cette catégorie, en choisir une selon l'ID
      if (availableImages.length > 1 && productId) {
        // Créer un hash simple à partir de l'ID pour sélectionner une image
        let hash = 0;
        for (let i = 0; i < productId.length; i++) {
          hash = ((hash << 5) - hash) + productId.charCodeAt(i);
          hash = hash & hash; // Convertir en entier 32 bits
        }
        // Utiliser le hash pour sélectionner une image différente pour chaque produit
        const imageIndex = Math.abs(hash) % availableImages.length;
        return availableImages[imageIndex];
      }
      
      // Si une seule image disponible ou pas d'ID, utiliser la première image
      return Array.isArray(availableImages) ? availableImages[0] : availableImages;
    }
    
    // 3. Image par défaut si aucune catégorie n'est trouvée
    return defaultImage;
  }

  // Fonction pour gérer les erreurs de chargement d'images (accessible globalement)
  window.handleImageError = function(img, fallbackUrl) {
    // Éviter les boucles infinies et le dédoublement - si on a déjà essayé, arrêter
    if (img.dataset.tried === "true") {
      img.onerror = null;
      // Ne pas charger d'image de fallback si on a déjà essayé - laisser l'image cassée plutôt que de créer un dédoublement
      return;
    }
    
    // Vérifier si l'image actuelle est déjà une image locale (pour éviter de remplacer une image qui fonctionne)
    const currentSrc = img.src || "";
    if (currentSrc.includes("images/")) {
      // Si c'est déjà une image locale, ne rien faire pour éviter le dédoublement
      img.onerror = null;
      return;
    }
    
    // Vérifier si l'image actuelle est une URL externe qui a échoué
    // Si c'est le cas, seulement alors charger l'image de catégorie
    if (!currentSrc.startsWith("http") && !currentSrc.startsWith("data:image/")) {
      // Si ce n'est pas une URL externe, ne rien faire
      img.onerror = null;
      return;
    }
    
    const category = img.dataset.category || "";
    const categoryImageMap = {
      // Singulier
      "parfum": ["images/parfums.jpg"],
      "montre": ["images/Montre Femmes.webp", "images/Montres Hommes.jpg", "images/Montres pour Femme.jfif", "images/montres-de-luxe-insert-audemars.webp"],
      "bague": ["images/Bague.webp", "images/Bagues.jpg"],
      "gourmette": ["images/Gourmette.jpg", "images/Gourmette.webp"],
      "foulard": ["images/foulard-soie-boheme.jpg", "images/foulard.jfif", "images/Foulards.jpg"],
      "deodorant": ["images/Déodorant.jpg", "images/Deodorants-and-antiperspirant--scaled.jpg"],
      "lunette": ["images/Lunettes.jpg", "images/Lunette.jpeg"],
      // Pluriel
      "parfums": ["images/parfums.jpg"],
      "montres": ["images/Montre Femmes.webp", "images/Montres Hommes.jpg", "images/Montres pour Femme.jfif", "images/montres-de-luxe-insert-audemars.webp"],
      "bijoux": ["images/Bague.webp", "images/Bagues.jpg"],
      "gourmettes": ["images/Gourmette.jpg", "images/Gourmette.webp"],
      "foulards": ["images/foulard-soie-boheme.jpg", "images/foulard.jfif", "images/Foulards.jpg"],
      "deodorants": ["images/Déodorant.jpg", "images/Deodorants-and-antiperspirant--scaled.jpg"],
      "lunettes": ["images/Lunettes.jpg", "images/Lunette.jpeg"],
      "accessoires": ["images/Lunettes.jpg", "images/Lunette.jpeg"],
      "vetements": ["images/foulard-soie-boheme.jpg", "images/foulard.jfif", "images/Foulards.jpg"],
      "hygiene": ["images/Déodorant.jpg", "images/Deodorants-and-antiperspirant--scaled.jpg"]
    };
    
    const defaultImage = "images/parfums.jpg";
    
    // Marquer qu'on a essayé pour éviter les boucles
    img.dataset.tried = "true";
    
    // Seulement charger l'image de catégorie si l'URL externe a vraiment échoué
    if (category && categoryImageMap[category]) {
      const availableImages = categoryImageMap[category];
      // Utiliser la première image disponible
      const fallbackImage = Array.isArray(availableImages) ? availableImages[0] : availableImages;
      img.src = fallbackImage;
      // Désactiver complètement le gestionnaire d'erreur après le premier essai pour éviter le dédoublement
      img.onerror = function() {
        img.onerror = null;
        img.src = defaultImage;
      };
      return;
    }
    
    // Sinon, utiliser l'image par défaut directement
    img.src = defaultImage;
    img.onerror = null;
  };

  function getCategoryImage(category) {
    if (!category) return null;
    
    // Utiliser le même mapping que pour les produits
    const categoryImageMap = {
      // Singulier
      "parfum": ["images/parfums.jpg"],
      "montre": ["images/Montre Femmes.webp", "images/Montres Hommes.jpg", "images/Montres pour Femme.jfif", "images/montres-de-luxe-insert-audemars.webp"],
      "bague": ["images/Bague.webp", "images/Bagues.jpg"],
      "gourmette": ["images/Gourmette.jpg", "images/Gourmette.webp"],
      "foulard": ["images/foulard-soie-boheme.jpg", "images/foulard.jfif", "images/Foulards.jpg"],
      "deodorant": ["images/Déodorant.jpg", "images/Deodorants-and-antiperspirant--scaled.jpg"],
      "lunette": ["images/Lunettes.jpg", "images/Lunette.jpeg"],
      // Pluriel
      "parfums": ["images/parfums.jpg"],
      "montres": ["images/Montre Femmes.webp", "images/Montres Hommes.jpg", "images/Montres pour Femme.jfif", "images/montres-de-luxe-insert-audemars.webp"],
      "bijoux": ["images/Bague.webp", "images/Bagues.jpg"],
      "gourmettes": ["images/Gourmette.jpg", "images/Gourmette.webp"],
      "foulards": ["images/foulard-soie-boheme.jpg", "images/foulard.jfif", "images/Foulards.jpg"],
      "deodorants": ["images/Déodorant.jpg", "images/Deodorants-and-antiperspirant--scaled.jpg"],
      "lunettes": ["images/Lunettes.jpg", "images/Lunette.jpeg"],
      "accessoires": ["images/Lunettes.jpg", "images/Lunette.jpeg"],
      "vetements": ["images/foulard-soie-boheme.jpg", "images/foulard.jfif", "images/Foulards.jpg"],
      "hygiene": ["images/Déodorant.jpg", "images/Deodorants-and-antiperspirant--scaled.jpg"]
    };
    
    const images = categoryImageMap[category.toLowerCase()];
    // Retourner la première image disponible ou une image par défaut
    return (images && images.length > 0) ? images[0] : "images/parfums.jpg";
  }

  function initCategories() {
    const container = document.getElementById("categories-grid");
    if (!container) return;

    const categories = [
      {
        key: "parfum",
        name: "Parfums",
        description: "Notes florales et intenses pour le quotidien.",
      },
      {
        key: "lunette",
        name: "Lunettes & montres",
        description: "Accessoires élégants pour sublimer vos looks.",
      },
      {
        key: "bague",
        name: "Bijoux",
        description: "Bagues et gourmettes au style délicat.",
      },
      {
        key: "foulard",
        name: "Foulards & soins",
        description: "Foulards, déodorants et essentiels beauté.",
      },
    ];

    container.innerHTML = categories
      .map(
        (cat) => {
          const imagePath = getCategoryImage(cat.key);
          return `
          <div class="rounded-2xl bg-black/40 p-3 flex flex-col gap-1 overflow-hidden relative group cursor-pointer" onclick="window.location.href='products.html?category=${cat.key}'">
            ${imagePath ? `
            <div class="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <img src="${imagePath}" alt="${cat.name}" class="w-full h-full object-cover" onerror="this.style.display='none';" />
            </div>
            ` : ""}
            <p class="font-semibold relative z-10">${cat.name}</p>
            <p class="text-white/60 relative z-10">${cat.description}</p>
          </div>
        `;
        }
      )
      .join("");
  }

  // ---------- Seed initial data ----------
  function seedAdminCredentials() {
    const existing = readLS(LS_KEYS.ADMIN_CREDENTIALS, null);
    if (!existing) {
      writeLS(LS_KEYS.ADMIN_CREDENTIALS, {
        email: "admin@abi-collection.com",
        password: "AbiCollection2025!",
      });
    }
  }

  function seedProducts() {
    const existing = readLS(LS_KEYS.PRODUCTS, null);
    if (existing && Array.isArray(existing) && existing.length > 0) return;

    const defaults = [
      {
        id: generateId("p"),
        name: "Parfum Élégance Nuit",
        category: "parfum",
        price: 75000,
        description:
          "Un parfum envoûtant, notes florales et boisées, pour les soirées raffinées de Kolwezi.",
        image:
          "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=600",
        featured: true,
      },
      {
        id: generateId("p"),
        name: "Lunettes Lumina Or Rose",
        category: "lunette",
        price: 65000,
        description:
          "Monture or rose futuriste, protection UV, idéale pour un look audacieux.",
        image:
          "https://images.pexels.com/photos/46710/pexels-photo-46710.jpeg?auto=compress&cs=tinysrgb&w=600",
        featured: true,
      },
      {
        id: generateId("p"),
        name: "Montre Stella Or",
        category: "montre",
        price: 120000,
        description:
          "Montre dorée minimaliste, cadran lumineux, pour sublimer votre poignet.",
        image:
          "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=600",
        featured: true,
      },
      {
        id: generateId("p"),
        name: "Bague Aura Cristal",
        category: "bague",
        price: 45000,
        description:
          "Bague délicate avec cristal lumineux, parfaite pour un style féminin et futuriste.",
        image:
          "https://images.pexels.com/photos/1457801/pexels-photo-1457801.jpeg?auto=compress&cs=tinysrgb&w=600",
        featured: true,
      },
      {
        id: generateId("p"),
        name: "Gourmette Or Lumière",
        category: "gourmette",
        price: 80000,
        description:
          "Gourmette élégante en finition or, un classique intemporel revisité.",
        image:
          "https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=600",
        featured: false,
      },
      {
        id: generateId("p"),
        name: "Foulard Rose Nebula",
        category: "foulard",
        price: 35000,
        description:
          "Foulard léger rose poudré, effet soyeux, ajoute une touche cosmique à votre style.",
        image:
          "https://images.pexels.com/photos/3738088/pexels-photo-3738088.jpeg?auto=compress&cs=tinysrgb&w=600",
        featured: false,
      },
      {
        id: generateId("p"),
        name: "Déodorant Crystal Fresh",
        category: "deodorant",
        price: 18000,
        description:
          "Déodorant longue durée, fraîcheur cristalline adaptée au climat de Kolwezi.",
        image:
          "https://images.pexels.com/photos/3738341/pexels-photo-3738341.jpeg?auto=compress&cs=tinysrgb&w=600",
        featured: false,
      },
    ];

    writeLS(LS_KEYS.PRODUCTS, defaults);
  }

  // ---------- Panier ----------
  function getCartCount() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  async function addToCart(productId, quantity) {
    const qty = quantity || 1;
    const products = await getProducts();
    const product = products.find((p) => String(p.id) === String(productId));
    
    // Vérifier le stock
    if (product && product.stock !== undefined && product.stock !== null) {
      if (product.stock <= 0) {
        alert("Ce produit est en rupture de stock.");
        return;
      }
      const cart = getCart();
      const existing = cart.find((item) => item.productId === productId);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + qty > product.stock) {
        alert(`Stock insuffisant. Disponible : ${product.stock}`);
        return;
      }
    }
    
    const cart = getCart();
    const existing = cart.find((c) => c.productId === productId);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ productId, quantity: qty });
    }
    setCart(cart);
    updateNavbarCartCount();
  }

  function updateCartItem(productId, quantity) {
    let cart = getCart();
    cart = cart
      .map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
      .filter((item) => item.quantity > 0);
    setCart(cart);
    updateNavbarCartCount();
  }

  function removeCartItem(productId) {
    let cart = getCart();
    cart = cart.filter((item) => item.productId !== productId);
    setCart(cart);
    updateNavbarCartCount();
  }

  // Fonction globale pour ouvrir le modal de photo (accessible depuis partout)
  function openPhotoModal(photoSrc) {
    // Créer le modal s'il n'existe pas
    let photoModal = document.getElementById("photo-modal");
    let photoModalImage = document.getElementById("photo-modal-image");
    let photoModalClose = document.getElementById("photo-modal-close");
    
    if (!photoModal) {
      // Créer le modal dynamiquement
      photoModal = document.createElement("div");
      photoModal.id = "photo-modal";
      photoModal.className = "fixed inset-0 bg-black/90 z-50 flex items-center justify-center hidden";
      photoModal.innerHTML = `
        <div class="relative max-w-4xl max-h-[90vh] p-4">
          <button id="photo-modal-close" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition z-10 cursor-pointer">
            ✕
          </button>
          <img id="photo-modal-image" src="" alt="Photo de profil" class="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain" />
        </div>
      `;
      document.body.appendChild(photoModal);
      photoModalImage = document.getElementById("photo-modal-image");
      photoModalClose = document.getElementById("photo-modal-close");
    }
    
    // Attacher les event listeners (même si le modal existe déjà)
    if (photoModalClose && !photoModalClose.dataset.listenerAttached) {
      photoModalClose.addEventListener("click", function (e) {
        e.stopPropagation(); // Empêcher la propagation vers le modal
        closePhotoModal();
      });
      photoModalClose.dataset.listenerAttached = "true";
    }
    
    if (photoModal && !photoModal.dataset.listenerAttached) {
      photoModal.addEventListener("click", function (e) {
        if (e.target === photoModal || e.target.closest("#photo-modal-image")) {
          // Ne fermer que si on clique sur le fond, pas sur l'image
          if (e.target === photoModal) {
            closePhotoModal();
          }
        }
      });
      photoModal.dataset.listenerAttached = "true";
    }
    
    // Event listener pour Escape (une seule fois)
    if (!window.photoModalEscapeListener) {
      document.addEventListener("keydown", function (e) {
        const modal = document.getElementById("photo-modal");
        if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
          closePhotoModal();
        }
      });
      window.photoModalEscapeListener = true;
    }
    
    // Afficher le modal
    if (photoModal && photoModalImage && photoSrc) {
      photoModalImage.src = photoSrc;
      photoModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }
  }
  
  function closePhotoModal() {
    const photoModal = document.getElementById("photo-modal");
    if (photoModal) {
      photoModal.classList.add("hidden");
      document.body.style.overflow = "";
    }
  }

  // ---------- Navbar ----------
  function updateNavbarCartCount() {
    const el = document.getElementById("nav-cart-count");
    if (!el) return;
    const count = getCartCount();
    if (count > 0) {
      el.textContent = String(count);
      el.style.display = "inline-flex";
    } else {
      el.textContent = "";
      el.style.display = "none";
    }
  }

  function initNavbarUser() {
    const loginBtn = document.getElementById("nav-login-btn");
    const chip = document.getElementById("nav-user-chip");
    const nameSpan = document.getElementById("nav-user-name");
    const initialSpan = document.getElementById("nav-user-initial");
    const user = getCurrentUser();

    if (!loginBtn && !chip) return;

    if (user) {
      if (loginBtn) loginBtn.style.display = "none";
      if (chip && nameSpan) {
        const userName = user.name || user.email || "Client";
        nameSpan.textContent = userName;
        
        // Afficher la photo de profil si disponible, sinon l'initiale
        if (initialSpan && chip) {
          const container = initialSpan.parentElement;
          
          if (user.photo) {
            // Si l'utilisateur a une photo, créer/afficher une image
            let img = document.getElementById("nav-user-initial-img");
            if (!img) {
              // Créer l'image si elle n'existe pas
              img = document.createElement("img");
              img.id = "nav-user-initial-img";
              img.className = "w-6 h-6 rounded-full object-cover cursor-pointer hover:opacity-80 transition";
              img.title = "Cliquez pour voir en grand";
              // Remplacer le span par l'image
              if (initialSpan.parentNode) {
                initialSpan.parentNode.replaceChild(img, initialSpan);
              }
            }
            img.src = user.photo;
            img.alt = userName;
            
            // Ajouter un event listener pour voir la photo en grand
            img.addEventListener("click", function (e) {
              e.stopPropagation(); // Empêcher la navigation vers account.html
              openPhotoModal(user.photo);
            });
          } else {
            // Si pas de photo, afficher l'initiale
            let span = document.getElementById("nav-user-initial");
            if (!span || span.tagName === "IMG") {
              // Créer le span si il n'existe pas ou si c'est une image
              span = document.createElement("span");
              span.id = "nav-user-initial";
              span.className = "w-6 h-6 rounded-full bg-gradient-to-br from-primary/70 to-gold/70 flex items-center justify-center text-[11px] font-semibold text-dark";
              // Remplacer l'image par le span si nécessaire
              const existing = document.getElementById("nav-user-initial-img") || initialSpan;
              if (existing.parentNode) {
                existing.parentNode.replaceChild(span, existing);
              }
            }
            const initial = userName.charAt(0).toUpperCase();
            span.textContent = initial;
          }
        }
        
        chip.style.display = "inline-flex";
        
        // Retirer les anciens event listeners pour éviter les doublons
        const newChip = chip.cloneNode(true);
        chip.parentNode.replaceChild(newChip, chip);
        
        // Ajouter le nouvel event listener
        const updatedChip = document.getElementById("nav-user-chip");
        if (updatedChip) {
          updatedChip.addEventListener("click", function (e) {
            // Ne pas naviguer si on clique sur l'image de profil
            if (e.target.tagName === "IMG" && e.target.id === "nav-user-initial-img") {
              return;
            }
            window.location.href = "account.html";
          });
        }
      }
    } else {
      if (chip) chip.style.display = "none";
      if (loginBtn) loginBtn.style.display = "inline-flex";
    }
  }

  function initNavbar() {
    updateNavbarCartCount();
    initNavbarUser();
  }

  // ---------- Pages ----------

  // Accueil
  async function initHomePage() {
    const container = document.getElementById("popular-products");
    if (!container) return;

    const products = await getProducts();
    const popular =
      products.filter((p) => p.featured).slice(0, 4) || products.slice(0, 4);

    container.innerHTML = popular
      .map(
        (p) => `
      <article class="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-3 flex flex-col gap-2">
        <div class="aspect-[4/5] rounded-2xl overflow-hidden bg-black/40 mb-1">
          <img src="${getProductImage(p)}" alt="${p.name}" class="w-full h-full object-cover" data-category="${p.category || ''}" onerror="handleImageError(this, '${(p.image || '').replace(/'/g, "\\'")}');" />
        </div>
        <h3 class="text-[11px] font-semibold line-clamp-2">${p.name}</h3>
        <p class="text-[11px] text-primary font-semibold">${formatCDF(
          p.price
        )}</p>
        <div class="flex gap-2 mt-auto">
          <button
            class="flex-1 px-2 py-1.5 rounded-full bg-white/10 text-[11px] hover:bg-white/15 transition"
            onclick="window.location.href='product.html?id=${encodeURIComponent(
              p.id
            )}'"
          >
            Détails
          </button>
          <button
            class="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-gold text-dark text-[14px] flex items-center justify-center shadow-glow"
            data-add-cart="${p.id}"
          >
            +
          </button>
        </div>
      </article>
    `
      )
      .join("");

    container.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-add-cart]");
      if (!btn) return;
      const id = btn.getAttribute("data-add-cart");
      addToCart(id, 1);
    });
  }

  // ---------- Gestion des catégories ----------
  function getDefaultCategories() {
    return [
      { name: "parfum", displayName: "Parfum", isDefault: true },
      { name: "lunette", displayName: "Lunette", isDefault: true },
      { name: "montre", displayName: "Montre", isDefault: true },
      { name: "bague", displayName: "Bague", isDefault: true },
      { name: "gourmette", displayName: "Gourmette", isDefault: true },
      { name: "foulard", displayName: "Foulard", isDefault: true },
      { name: "deodorant", displayName: "Déodorant", isDefault: true },
    ];
  }

  function getCategories() {
    const custom = readLS(LS_KEYS.CATEGORIES, []);
    const defaults = getDefaultCategories();
    return [...defaults, ...custom];
  }

  // Catalogue
  async function initProductsPage() {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    const products = await getProducts();
    const chips = document.querySelectorAll(".chip-filter");

    // Mapping pour normaliser les catégories (singulier/pluriel/variantes)
    function normalizeCategory(category) {
      if (!category) return "";
      const normalized = category.toLowerCase().trim();
      
      // Mapping des variantes vers les catégories standard
      const categoryMap = {
        // Parfums
        "parfum": "parfum",
        "parfums": "parfum",
        // Lunettes
        "lunette": "lunette",
        "lunettes": "lunette",
        // Montres
        "montre": "montre",
        "montres": "montre",
        // Bagues
        "bague": "bague",
        "bagues": "bague",
        "bijoux": "bague", // Les bijoux incluent les bagues
        // Gourmettes
        "gourmette": "gourmette",
        "gourmettes": "gourmette",
        // Foulards
        "foulard": "foulard",
        "foulards": "foulard",
        "vetements": "foulard", // Les vêtements incluent les foulards
        // Déodorants
        "deodorant": "deodorant",
        "deodorants": "deodorant",
        "hygiene": "deodorant" // L'hygiène inclut les déodorants
        // Note: "accessoires" n'est pas mappé pour éviter les confusions
      };
      
      // Si la catégorie est dans le mapping, utiliser la valeur normalisée
      if (categoryMap[normalized]) {
        return categoryMap[normalized];
      }
      
      // Sinon, vérifier si c'est une catégorie personnalisée
      const categories = getCategories();
      const foundCategory = categories.find((c) => c.name === normalized);
      if (foundCategory) {
        return foundCategory.name;
      }
      
      // Sinon, retourner la valeur normalisée telle quelle
      return normalized;
    }

    // Variables globales pour la recherche et le tri
    let currentCategory = "all";
    let currentSearch = "";
    let currentSort = "featured";

    // Fonction de recherche
    function searchProducts(products, searchTerm) {
      if (!searchTerm || searchTerm.trim() === "") return products;
      
      const term = searchTerm.toLowerCase().trim();
      return products.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const description = (p.description || "").toLowerCase();
        const category = (p.category || "").toLowerCase();
        return name.includes(term) || description.includes(term) || category.includes(term);
      });
    }

    // Fonction de tri
    function sortProducts(products, sortBy) {
      const sorted = [...products];
      
      switch (sortBy) {
        case "name-asc":
          return sorted.sort((a, b) => (a.name || "").localeCompare(b.name || "", "fr"));
        case "name-desc":
          return sorted.sort((a, b) => (b.name || "").localeCompare(a.name || "", "fr"));
        case "price-asc":
          return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        case "price-desc":
          return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        case "featured":
          return sorted.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return 0;
          });
        case "newest":
          // Trier par ID (les plus récents ont des IDs plus grands si générés séquentiellement)
          return sorted.sort((a, b) => {
            const aId = String(a.id || "");
            const bId = String(b.id || "");
            return bId.localeCompare(aId);
          });
        default:
          return sorted;
      }
    }

    // Fonction pour vérifier le stock
    function isInStock(product) {
      // Si stock n'est pas défini, considérer comme disponible
      if (product.stock === undefined || product.stock === null) return true;
      return product.stock > 0;
    }

    function render(category, searchTerm = "", sortBy = "featured") {
      currentCategory = category || "all";
      currentSearch = searchTerm || "";
      currentSort = sortBy || "featured";
      
      let filtered = products;
      
      // Filtrage par catégorie
      if (currentCategory && currentCategory !== "all") {
        const normalizedFilter = normalizeCategory(currentCategory);
        if (!normalizedFilter) {
          filtered = [];
        } else {
          filtered = products.filter((p) => {
            if (!p.category) return false;
            const productCategory = normalizeCategory(p.category);
            return productCategory === normalizedFilter;
          });
        }
      }
      
      // Recherche
      filtered = searchProducts(filtered, currentSearch);
      
      // Tri
      filtered = sortProducts(filtered, currentSort);
      
      // Afficher le nombre de résultats
      const countEl = document.getElementById("products-count");
      if (countEl) {
        if (filtered.length === 0) {
          countEl.textContent = "Aucun produit trouvé";
        } else {
          countEl.textContent = `${filtered.length} produit${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`;
        }
      }
      
      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full text-center py-12">
            <p class="text-sm text-white/70 mb-2">Aucun produit trouvé.</p>
            <p class="text-xs text-white/50">${currentSearch ? "Essayez une autre recherche ou " : ""}Essayez une autre catégorie.</p>
          </div>
        `;
        return;
      }
      
      grid.innerHTML = filtered
        .map(
          (p) => {
            const inStock = isInStock(p);
            const stockQuantity = p.stock !== undefined && p.stock !== null ? p.stock : null;
            const stockBadge = stockQuantity !== null 
              ? (inStock ? `<span class="text-[9px] text-emerald-300">✓ En stock (${stockQuantity})</span>` : `<span class="text-[9px] text-red-300">✗ Rupture</span>`)
              : "";
            
            return `
        <article class="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-3 flex flex-col gap-2 text-xs ${!inStock ? 'opacity-60' : ''}">
          <div class="aspect-[4/5] rounded-2xl overflow-hidden bg-black/40 mb-1 relative">
            <img src="${getProductImage(p)}" alt="${p.name}" class="w-full h-full object-cover" data-category="${p.category || ''}" onerror="handleImageError(this, '${(p.image || '').replace(/'/g, "\\'")}');" />
            ${p.featured ? '<span class="absolute top-2 right-2 bg-primary text-dark text-[9px] px-2 py-0.5 rounded-full font-semibold">★ Populaire</span>' : ''}
            ${!inStock ? '<div class="absolute inset-0 bg-black/60 flex items-center justify-center"><span class="text-white font-semibold text-sm">Rupture de stock</span></div>' : ''}
          </div>
          <p class="text-[10px] uppercase tracking-[0.15em] text-white/50">${
            p.category || ""
          }</p>
          <h3 class="text-[11px] font-semibold line-clamp-2">${p.name}</h3>
          <p class="text-[11px] text-primary font-semibold">${formatCDF(
            p.price
          )}</p>
          ${stockBadge ? `<div class="mt-1">${stockBadge}</div>` : ''}
          <div class="flex gap-2 mt-auto pt-1">
            <button
              class="flex-1 px-2 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition"
              onclick="window.location.href='product.html?id=${encodeURIComponent(
                p.id
              )}'"
            >
              Voir
            </button>
            <button
              class="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-gold text-dark text-[14px] flex items-center justify-center shadow-glow ${!inStock ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'} transition"
              data-add-cart="${p.id}"
              ${!inStock ? 'disabled title="Rupture de stock"' : ''}
            >
              +
            </button>
          </div>
        </article>
      `;
          }
        )
        .join("");
    }

    // Éléments de recherche et tri
    const searchInput = document.getElementById("products-search");
    const searchClearBtn = document.getElementById("products-search-clear");
    const sortSelect = document.getElementById("products-sort");

    // Vérifier si une catégorie est passée en paramètre URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategory = urlParams.get("category");
    const urlSearch = urlParams.get("search") || "";
    const urlSort = urlParams.get("sort") || "featured";
    const initialCategory = urlCategory || "all";
    
    // Initialiser les valeurs
    if (searchInput && urlSearch) {
      searchInput.value = urlSearch;
      currentSearch = urlSearch;
    }
    if (sortSelect) {
      sortSelect.value = urlSort;
      currentSort = urlSort;
    }
    
    // Activer le bon filtre au chargement
    chips.forEach((chip) => {
      const chipCategory = chip.getAttribute("data-category");
      if (chipCategory === initialCategory) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
    
    render(initialCategory, currentSearch, currentSort);

    // Gestion de la recherche
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        const searchTerm = this.value;
        currentSearch = searchTerm;
        
        // Afficher/masquer le bouton de suppression
        if (searchClearBtn) {
          if (searchTerm.trim()) {
            searchClearBtn.classList.remove("hidden");
          } else {
            searchClearBtn.classList.add("hidden");
          }
        }
        
        render(currentCategory, currentSearch, currentSort);
        
        // Mettre à jour l'URL
        const url = new URL(window.location);
        if (searchTerm.trim()) {
          url.searchParams.set("search", searchTerm);
        } else {
          url.searchParams.delete("search");
        }
        window.history.pushState({}, "", url);
      });
    }

    // Bouton pour effacer la recherche
    if (searchClearBtn) {
      searchClearBtn.addEventListener("click", function () {
        if (searchInput) {
          searchInput.value = "";
          currentSearch = "";
          this.classList.add("hidden");
          render(currentCategory, currentSearch, currentSort);
          
          const url = new URL(window.location);
          url.searchParams.delete("search");
          window.history.pushState({}, "", url);
        }
      });
    }

    // Gestion du tri
    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        currentSort = this.value;
        render(currentCategory, currentSearch, currentSort);
        
        // Mettre à jour l'URL
        const url = new URL(window.location);
        url.searchParams.set("sort", currentSort);
        window.history.pushState({}, "", url);
      });
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", function () {
        chips.forEach((c) => c.classList.remove("active"));
        this.classList.add("active");
        const cat = this.getAttribute("data-category");
        currentCategory = cat;
        render(cat, currentSearch, currentSort);
        
        // Mettre à jour l'URL sans recharger la page
        const url = new URL(window.location);
        if (cat === "all") {
          url.searchParams.delete("category");
        } else {
          url.searchParams.set("category", cat);
        }
        window.history.pushState({}, "", url);
      });
    });

    grid.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-add-cart]");
      if (!btn) return;
      const id = btn.getAttribute("data-add-cart");
      addToCart(id, 1);
    });
  }

  // Page produit
  async function initProductDetailPage() {
    const container = document.getElementById("product-detail");
    if (!container) {
      // Le container n'existe que sur product.html, c'est normal sur les autres pages
      return;
    }

    // Fonction pour échapper les caractères spéciaux HTML
    const escapeHtml = (text) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = String(text);
      return div.innerHTML;
    };

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    
    if (!id) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-sm text-white/70 mb-2">Aucun ID de produit spécifié.</p>
          <a href="products.html" class="text-xs text-primary hover:text-primary/80">Retour à la boutique</a>
        </div>
      `;
      return;
    }
    
    // Décoder l'ID au cas où il serait encodé
    const decodedId = decodeURIComponent(id);
    const products = await getProducts();
    
    // Essayer de trouver le produit avec l'ID exact ou décodé
    let product = products.find((p) => p.id === id || p.id === decodedId);
    
    // Si toujours pas trouvé, essayer une recherche plus flexible
    if (!product) {
      product = products.find((p) => {
        if (!p.id) return false;
        const productId = String(p.id);
        const searchId = String(id);
        return productId.includes(searchId) || searchId.includes(productId);
      });
    }

    if (!product) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-sm text-white/70 mb-2">Produit introuvable.</p>
          <p class="text-xs text-white/50 mb-2">ID recherché : ${escapeHtml(id)}</p>
          <p class="text-xs text-white/50 mb-4">Nombre de produits disponibles : ${products.length}</p>
          <a href="products.html" class="text-xs text-primary hover:text-primary/80">Retour à la boutique</a>
        </div>
      `;
      console.error("Produit non trouvé", { id, decodedId, productsCount: products.length, products });
      return;
    }
    
    try {
      container.innerHTML = `
        <div class="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 sm:p-6">
          <div class="aspect-[4/5] rounded-2xl overflow-hidden bg-black/40">
            <img src="${getProductImage(product)}" alt="${escapeHtml(product.name || '')}" class="w-full h-full object-cover" data-category="${product.category || ''}" onerror="handleImageError(this, '${(product.image || '').replace(/'/g, "\\'")}');" />
          </div>
        </div>
        <div class="space-y-4 text-sm">
          <p class="text-[11px] uppercase tracking-[0.2em] text-white/60">${
            escapeHtml(product.category || "")
          }</p>
          <h1 class="text-xl sm:text-2xl font-semibold">${escapeHtml(product.name || "")}</h1>
          <p class="text-primary font-semibold text-lg">${formatCDF(
            product.price || 0
          )}</p>
          <p class="text-sm text-white/70">
            ${escapeHtml(product.description || "Découvrez ce produit exclusif Abi-Collection.")}
          </p>
          <div class="flex items-center gap-3 pt-2">
            <label class="text-xs text-white/70" for="detail-qty">Quantité</label>
            <input
              id="detail-qty"
              type="number"
              min="1"
              value="1"
              class="input-glass w-20 text-center"
            />
          </div>
          <button
            id="detail-add-cart"
            class="mt-4 w-full sm:w-auto px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-gold text-dark text-sm font-semibold shadow-glow hover:opacity-90 transition"
          >
            Ajouter au panier
          </button>
        </div>
      `;

      const btn = document.getElementById("detail-add-cart");
      const qtyInput = document.getElementById("detail-qty");
      if (btn && qtyInput) {
        btn.addEventListener("click", function () {
          const qty = Number(qtyInput.value) || 1;
          addToCart(product.id, qty);
          // Afficher un message de confirmation
          const msg = document.createElement("p");
          msg.className = "text-xs text-primary mt-2";
          msg.textContent = "Produit ajouté au panier !";
          btn.parentElement.appendChild(msg);
          setTimeout(() => {
            msg.remove();
          }, 2000);
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'affichage du produit:", error);
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-sm text-white/70 mb-2">Erreur lors du chargement du produit.</p>
          <p class="text-xs text-white/50 mb-4">${escapeHtml(error.message || 'Erreur inconnue')}</p>
          <a href="products.html" class="text-xs text-primary hover:text-primary/80">Retour à la boutique</a>
        </div>
      `;
    }
  }

  // Enregistrement
  function initRegisterPage() {
    const form = document.getElementById("register-form");
    if (!form) return;

    const msg = document.getElementById("register-message");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const phone = document.getElementById("reg-phone").value.trim();
      const address = document.getElementById("reg-address").value.trim();
      const password = document.getElementById("reg-password").value;
      const passwordConfirm = document.getElementById(
        "reg-password-confirm"
      ).value;

      if (password !== passwordConfirm) {
        if (msg) {
          msg.style.color = "#ef4444";
          msg.textContent = "❌ Les deux mots de passe doivent être identiques.";
        }
        return;
      }

      const users = readLS(LS_KEYS.USERS, []);
      const exists = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (exists) {
        if (msg) {
          msg.style.color = "#ef4444";
          msg.textContent = "❌ Cet email est déjà utilisé. Essayez de vous connecter ou utilisez un autre email.";
        }
        return;
      }

      const newUser = {
        id: generateId("u"),
        name,
        email,
        phone,
        address,
        password,
      };
      users.push(newUser);
      writeLS(LS_KEYS.USERS, users);
      setCurrentUser(newUser);
      if (msg) {
        msg.style.color = "#C9A961";
        msg.style.color = "#C9A961";
        msg.textContent = "✅ Compte créé avec succès ! Redirection en cours...";
      }
      setTimeout(() => {
        const redirect = readLS(LS_KEYS.POST_LOGIN_REDIRECT, null);
        if (redirect) {
          window.localStorage.removeItem(LS_KEYS.POST_LOGIN_REDIRECT);
          window.location.href = redirect;
        } else {
          window.location.href = "account.html";
        }
      }, 600);
    });
  }

  // Fonction pour vérifier et connecter l'admin
  function checkAndLoginAdmin(email, password) {
    // S'assurer que les identifiants admin sont initialisés
    seedAdminCredentials();
    const adminCreds = readLS(LS_KEYS.ADMIN_CREDENTIALS, null);
    
    if (!adminCreds) {
      return false;
    }

    // Vérifier si les identifiants correspondent à ceux de l'admin
    if (
      email.toLowerCase() === adminCreds.email.toLowerCase() &&
      password === adminCreds.password
    ) {
      // Connecter l'admin
      writeLS(LS_KEYS.ADMIN_LOGGED_IN, true);
      return true;
    }
    
    return false;
  }

  // Connexion (clients et admin)
  function initLoginPage() {
    const form = document.getElementById("login-form");
    if (!form) return;

    const msg = document.getElementById("login-message");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      // Vérifier d'abord si c'est un admin
      if (checkAndLoginAdmin(email, password)) {
        // C'est un admin, rediriger vers admin.html
        if (msg) {
          msg.style.color = "#C9A961";
          msg.textContent = "Connexion admin réussie. Redirection...";
        }
        setTimeout(() => {
          window.location.href = "admin.html";
        }, 600);
        return;
      }

      // Sinon, vérifier si c'est un client
      const users = readLS(LS_KEYS.USERS, []);
      const user = users.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password
      );

      if (!user) {
        if (msg) {
          msg.style.color = "#ef4444";
          msg.style.color = "#ef4444";
          msg.textContent = "❌ Email ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.";
        }
        return;
      }

      // C'est un client, connecter normalement
      setCurrentUser(user);
      if (msg) {
        msg.style.color = "#C9A961";
        msg.style.color = "#C9A961";
        msg.textContent = "✅ Connexion réussie ! Redirection en cours...";
      }
      setTimeout(() => {
        const redirect = readLS(LS_KEYS.POST_LOGIN_REDIRECT, null);
        if (redirect) {
          window.localStorage.removeItem(LS_KEYS.POST_LOGIN_REDIRECT);
          window.location.href = redirect;
        } else {
          window.location.href = "account.html";
        }
      }, 600);
    });
  }

  // Compte client
  async function initAccountPage() {
    const form = document.getElementById("profile-form");
    if (!form) return;

    const user = getCurrentUser();
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const nameInput = document.getElementById("profile-name");
    const emailInput = document.getElementById("profile-email");
    const phoneInput = document.getElementById("profile-phone");
    const addressInput = document.getElementById("profile-address");
    const msg = document.getElementById("profile-message");
    const logoutBtn = document.getElementById("logout-btn");
    const photoInput = document.getElementById("profile-photo-input");
    const photoPreview = document.getElementById("profile-photo-preview");
    const photoInitial = document.getElementById("profile-photo-initial");
    const photoContainer = document.getElementById("profile-photo-container");
    const photoRemoveBtn = document.getElementById("profile-photo-remove");

    // Variable pour stocker la photo en base64
    let profilePhotoData = user.photo || null;

    // Fonction pour afficher la photo de profil
    function displayProfilePhoto(photoData) {
      if (photoData && photoPreview && photoInitial) {
        photoPreview.src = photoData;
        photoPreview.classList.remove("hidden");
        photoInitial.classList.add("hidden");
        if (photoRemoveBtn) photoRemoveBtn.classList.remove("hidden");
        // Rendre la photo cliquable pour voir en grand
        if (photoContainer) {
          photoContainer.style.cursor = "pointer";
        }
      } else if (photoPreview && photoInitial) {
        photoPreview.classList.add("hidden");
        photoInitial.classList.remove("hidden");
        // Afficher l'initiale du nom
        const userName = user.name || user.email || "A";
        photoInitial.textContent = userName.charAt(0).toUpperCase();
        if (photoRemoveBtn) photoRemoveBtn.classList.add("hidden");
        // Retirer le curseur pointer si pas de photo
        if (photoContainer) {
          photoContainer.style.cursor = "default";
        }
      }
    }

    // Initialiser l'affichage de la photo
    displayProfilePhoto(profilePhotoData);

    // Ouvrir le modal en cliquant sur la photo
    if (photoContainer) {
      photoContainer.addEventListener("click", function (e) {
        // Ne pas ouvrir si on clique sur le bouton d'upload
        if (e.target.closest("label[for='profile-photo-input']")) {
          return;
        }
        if (profilePhotoData) {
          openPhotoModal(profilePhotoData);
        }
      });
    }

    if (nameInput) nameInput.value = user.name || "";
    if (emailInput) emailInput.value = user.email || "";
    if (phoneInput) phoneInput.value = user.phone || "";
    if (addressInput) addressInput.value = user.address || "";

    // Gestion de l'upload de photo
    if (photoInput) {
      photoInput.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
          // Vérifier la taille du fichier (max 2MB)
          if (file.size > 2 * 1024 * 1024) {
            if (msg) {
              msg.style.color = "#ef4444";
              msg.textContent = "❌ L'image est trop grande. Taille maximale : 2MB.";
            }
            return;
          }

          // Vérifier le type de fichier
          if (!file.type.startsWith("image/")) {
            if (msg) {
              msg.style.color = "#ef4444";
              msg.textContent = "❌ Veuillez sélectionner une image valide.";
            }
            return;
          }

          const reader = new FileReader();
          reader.onload = function (event) {
            profilePhotoData = event.target.result;
            displayProfilePhoto(profilePhotoData);
            if (msg) {
              msg.style.color = "#C9A961";
              msg.textContent = "✅ Photo chargée. Cliquez sur 'Mettre à jour' pour enregistrer.";
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Gestion de la suppression de la photo
    if (photoRemoveBtn) {
      photoRemoveBtn.addEventListener("click", function () {
        profilePhotoData = null;
        displayProfilePhoto(null);
        if (photoInput) photoInput.value = "";
        if (msg) {
          msg.style.color = "#C9A961";
          msg.textContent = "✅ Photo supprimée. Cliquez sur 'Mettre à jour' pour enregistrer.";
        }
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const updatedUser = {
        ...user,
        name: nameInput ? nameInput.value.trim() : user.name,
        phone: phoneInput ? phoneInput.value.trim() : user.phone,
        address: addressInput ? addressInput.value.trim() : user.address,
        photo: profilePhotoData || null,
      };

      const users = readLS(LS_KEYS.USERS, []);
      const index = users.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        users[index] = updatedUser;
        writeLS(LS_KEYS.USERS, users);
      }
      setCurrentUser(updatedUser);
      
      // Mettre à jour la navigation
      initNavbarUser();
      
      if (msg) {
        msg.style.color = "#C9A961";
        msg.textContent = "✅ Vos informations ont été mises à jour avec succès !";
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        setCurrentUser(null);
        window.location.href = "index.html";
      });
    }

    // Historique commandes
    const ordersContainer = document.getElementById("orders-list");
    if (ordersContainer) {
      const allOrders = await getOrders();
      const myOrders = allOrders
        .filter((o) => o.userEmail === user.email)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      if (myOrders.length === 0) {
        ordersContainer.innerHTML =
          '<p class="text-xs text-white/60">Aucune commande pour l’instant.</p>';
        return;
      }

      ordersContainer.innerHTML = myOrders
        .map((o) => {
          const date = o.createdAt
            ? new Date(o.createdAt).toLocaleString("fr-CD")
            : "";
          const itemsLines = (o.items || [])
            .map(
              (it) =>
                `<li class="flex justify-between gap-2"><span class="truncate">${it.name}${
                  it.quantity && it.quantity > 1 ? " x" + it.quantity : ""
                }</span><span>${formatCDF(it.total || 0)}</span></li>`
            )
            .join("");
          return `
          <article class="glass-card">
            <div class="flex items-center justify-between gap-2 mb-2">
              <p class="text-[11px] text-white/60">Commande #${o.id}</p>
              <span class="text-[11px] ${
                o.status === "livré"
                  ? "text-emerald-300"
                  : "text-amber-300"
              }">${o.status || "en attente"}</span>
            </div>
            <p class="text-[11px] text-white/50 mb-2">${date}</p>
            <ul class="space-y-1 text-[11px] mb-2">
              ${itemsLines}
            </ul>
            <p class="text-[11px] text-white/70">Total : <span class="text-primary font-semibold">${formatCDF(
              o.total
            )}</span></p>
          </article>
        `;
        })
        .join("");
    }
  }

  // Panier
  function initCartPage() {
    const list = document.getElementById("cart-items");
    if (!list) return;

    const totalEl = document.getElementById("cart-total");
    const msg = document.getElementById("cart-message");
    const btn = document.getElementById("checkout-btn");

    async function render() {
      const cart = getCart();
      const products = await getProducts();

      if (!cart.length) {
        list.innerHTML =
          '<p class="text-sm text-white/70">Votre panier est vide.</p>';
        if (totalEl) totalEl.textContent = formatCDF(0);
        return;
      }

      let total = 0;
      list.innerHTML = cart
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return "";
          const lineTotal = (product.price || 0) * (item.quantity || 0);
          total += lineTotal;
          return `
          <article class="glass-card flex gap-3 items-center text-xs">
            <div class="w-20 h-20 rounded-2xl overflow-hidden bg-black/40 flex-shrink-0">
              <img src="${getProductImage(product)}" alt="${product.name}" class="w-full h-full object-cover" data-category="${product.category || ''}" onerror="handleImageError(this, '${(product.image || '').replace(/'/g, "\\'")}');" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] uppercase tracking-[0.15em] text-white/50">${
                product.category || ""
              }</p>
              <h3 class="text-[12px] font-semibold truncate">${product.name}</h3>
              <p class="text-[11px] text-primary font-semibold">${formatCDF(
                product.price
              )}</p>
              <div class="flex items-center gap-2 mt-2">
                <button class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center" data-qty-dec="${
                  product.id
                }">-</button>
                <span class="w-7 text-center">${item.quantity}</span>
                <button class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center" data-qty-inc="${
                  product.id
                }">+</button>
                <button class="ml-3 text-[11px] text-red-300" data-remove="${
                  product.id
                }">Supprimer</button>
              </div>
            </div>
            <p class="text-[11px] text-white/70 ml-2">${formatCDF(
              lineTotal
            )}</p>
          </article>
        `;
        })
        .join("");

      if (totalEl) totalEl.textContent = formatCDF(total);
    }

    render();

    list.addEventListener("click", async function (e) {
      const dec = e.target.closest("[data-qty-dec]");
      const inc = e.target.closest("[data-qty-inc]");
      const rm = e.target.closest("[data-remove]");
      if (dec) {
        const id = dec.getAttribute("data-qty-dec");
        const cart = getCart();
        const item = cart.find((c) => c.productId === id);
        if (item) updateCartItem(id, Math.max(1, item.quantity - 1));
        await render();
      } else if (inc) {
        const id = inc.getAttribute("data-qty-inc");
        const cart = getCart();
        const item = cart.find((c) => c.productId === id);
        if (item) updateCartItem(id, item.quantity + 1);
        await render();
      } else if (rm) {
        const id = rm.getAttribute("data-remove");
        removeCartItem(id);
        await render();
      }
    });

    if (btn) {
      btn.addEventListener("click", function () {
        const cart = getCart();
        if (cart.length === 0) {
          if (msg) {
            msg.style.color = "#ef4444";
            msg.textContent = "❌ Votre panier est vide. Ajoutez des produits depuis la boutique.";
          }
          return;
        }
        const user = getCurrentUser();
        if (!user) {
          if (msg)
            msg.textContent =
              "Vous devez être connecté(e) pour valider la commande.";
          writeLS(LS_KEYS.POST_LOGIN_REDIRECT, "checkout.html");
          setTimeout(() => {
            window.location.href = "login.html";
          }, 600);
          return;
        }
        window.location.href = "checkout.html";
      });
    }
  }

  // Checkout
  async function initCheckoutPage() {
    const summary = document.getElementById("checkout-summary");
    if (!summary) return;

    const user = getCurrentUser();
    const cart = getCart();
    if (!user) {
      writeLS(LS_KEYS.POST_LOGIN_REDIRECT, "checkout.html");
      window.location.href = "login.html";
      return;
    }
    if (!cart.length) {
      window.location.href = "cart.html";
      return;
    }

    const products = await getProducts();
    let total = 0;
    const items = cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        const lineTotal = (product.price || 0) * (item.quantity || 0);
        total += lineTotal;
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          total: lineTotal,
        };
      })
      .filter(Boolean);

    summary.innerHTML = `
      <div class="space-y-2 border-b border-white/10 pb-3">
        <h2 class="text-sm font-semibold">Informations client</h2>
        <p class="text-xs text-white/70">${user.name || ""}</p>
        <p class="text-xs text-white/70">${user.phone || ""}</p>
        <p class="text-xs text-white/70">${user.address || ""}</p>
        <p class="text-[11px] text-white/50 mt-1">
          Pour modifier vos informations, retournez dans la page “Mon compte”.
        </p>
      </div>
      <div class="space-y-2">
        <h2 class="text-sm font-semibold">Articles</h2>
        <ul class="space-y-1 text-xs">
          ${items
            .map(
              (it) => `
            <li class="flex justify-between gap-2">
              <span class="truncate">${it.name}${
                it.quantity > 1 ? " x" + it.quantity : ""
              }</span>
              <span>${formatCDF(it.total)}</span>
            </li>
          `
            )
            .join("")}
        </ul>
        <p class="text-sm text-white/80 pt-1">
          Total : <span class="text-primary font-semibold">${formatCDF(
            total
          )}</span>
        </p>
      </div>
    `;

    const btn = document.getElementById("confirm-order-btn");
    const msg = document.getElementById("checkout-message");
    
    // Fonction pour vérifier et mettre à jour l'état du bouton
    function updateButtonState() {
      const currentCart = getCart();
      if (!currentCart || currentCart.length === 0) {
        if (btn) {
          btn.disabled = true;
          btn.classList.add("opacity-50", "cursor-not-allowed");
          btn.textContent = "Panier vide";
        }
        if (msg) {
          msg.textContent = "Votre panier est vide. Ajoutez des produits avant de commander.";
          msg.style.color = "#ef4444"; // red-500
        }
        return false;
      }
      
      // Vérifier que le panier contient des produits valides
      const validItems = currentCart.filter(item => {
        const product = products.find(p => p.id === item.productId);
        return product && item.quantity > 0;
      });
      
      if (validItems.length === 0) {
        if (btn) {
          btn.disabled = true;
          btn.classList.add("opacity-50", "cursor-not-allowed");
          btn.textContent = "Aucun produit valide";
        }
        if (msg) {
          msg.textContent = "Votre panier ne contient pas de produits valides.";
          msg.style.color = "#ef4444";
        }
        return false;
      }
      
      // Réactiver le bouton si tout est valide
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("opacity-50", "cursor-not-allowed");
        btn.textContent = "Confirmer et ouvrir WhatsApp";
      }
      if (msg) {
        msg.textContent = "";
      }
      return true;
    }
    
    // Vérifier l'état initial
    updateButtonState();
    
    if (btn) {
      btn.addEventListener("click", async function () {
        // Vérifier le panier actuel au moment du clic
        const currentCart = getCart();
        if (!currentCart || currentCart.length === 0) {
          if (msg) {
            msg.textContent = "❌ Votre panier est vide. Retournez à la boutique pour ajouter des produits.";
            msg.style.color = "#ef4444";
          }
          return;
        }
        
        // Recalculer les items avec le panier actuel
        const currentItems = currentCart
          .map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product || !item.quantity || item.quantity <= 0) return null;
            const lineTotal = (product.price || 0) * (item.quantity || 0);
            return {
              id: product.id,
              name: product.name,
              price: product.price,
              quantity: item.quantity,
              total: lineTotal,
            };
          })
          .filter(Boolean);
        
        // Validation stricte
        if (!currentItems || currentItems.length === 0) {
          if (msg) {
            msg.textContent = "❌ Aucun produit valide dans votre panier. Retournez à la boutique pour ajouter des produits.";
            msg.style.color = "#ef4444";
          }
          return;
        }
        
        // Calculer le total actuel
        const currentTotal = currentItems.reduce((sum, item) => sum + (item.total || 0), 0);
        
        if (currentTotal <= 0) {
          if (msg) {
            msg.textContent = "❌ Erreur dans votre panier. Retournez à la boutique et réessayez.";
            msg.style.color = "#ef4444";
          }
          return;
        }

        try {
          // Désactiver le bouton pendant le traitement
          if (btn) {
            btn.disabled = true;
            btn.textContent = "⏳ Traitement en cours...";
          }

          const order = {
            userId: user.id || null,
            userEmail: user.email,
            clientName: user.name,
            phone: user.phone,
            address: user.address,
            items: currentItems,
            total: currentTotal,
            status: "en attente",
            paymentStatus: "non payé",
            createdAt: Date.now(),
          };

          // Sauvegarder dans Supabase si disponible
          let orderSaved = false;
          if (window.SupabaseIntegration && window.SupabaseIntegration.isConfigured()) {
            try {
              const savedOrder = await window.SupabaseIntegration.saveOrder(order);
              order.id = savedOrder.id;
              orderSaved = true;
            } catch (e) {
              console.error("Erreur sauvegarde commande Supabase:", e);
              // Fallback LocalStorage
              const orders = await getOrders();
              const orderId = generateId("cmd");
              order.id = orderId;
              orders.push(order);
              await setOrders(orders);
              orderSaved = true;
            }
          } else {
            // Fallback LocalStorage
            const orders = await getOrders();
            const orderId = generateId("cmd");
            order.id = orderId;
            orders.push(order);
            await setOrders(orders);
            orderSaved = true;
          }

          // Vider le panier après la sauvegarde réussie de la commande
          if (orderSaved) {
            setCart([]);
            updateNavbarCartCount();
          }

          // Message WhatsApp sous forme de demande de commande
          const lines = [];
          lines.push("Demande de commande - Abi-Collection");
          lines.push("");
          lines.push("Bonjour, je souhaiterais commander les articles suivants :");
          lines.push("");
          order.items.forEach((it) => {
            const label =
              (it.quantity && it.quantity > 1
                ? `${it.name} (x${it.quantity})`
                : it.name) +
              " — " +
              formatCDF(it.total);
            lines.push("- " + label);
          });
          lines.push("");
          lines.push("TOTAL estimé : " + formatCDF(order.total));
          lines.push("");
          lines.push("Client : " + (user.name || ""));
          lines.push("Téléphone : " + (user.phone || ""));
          lines.push("Adresse : " + (user.address || ""));
          lines.push("");
          lines.push(
            "Merci de me confirmer la disponibilité et de m'indiquer les modalités de paiement."
          );

          const message = encodeURIComponent(lines.join("\n"));
          const whatsappNumber = "243828796100"; // Numéro WhatsApp de l'entreprise
          const url = "https://wa.me/" + whatsappNumber + "?text=" + message;

          // Ouvrir WhatsApp avec la fonction globale
          const whatsappOpened = window.openWhatsApp ? window.openWhatsApp(url) : (() => {
            // Fallback si la fonction globale n'est pas disponible
            try {
              window.location.href = url;
              return true;
            } catch (e) {
              return false;
            }
          })();
          
          if (msg) {
            msg.style.color = "#C9A961";
            if (whatsappOpened) {
              msg.textContent =
                "✅ Commande enregistrée avec succès ! WhatsApp devrait s'ouvrir dans un instant.";
            } else {
              msg.textContent =
                "✅ Commande enregistrée ! Cliquez ici pour ouvrir WhatsApp manuellement : " + url;
              msg.style.cursor = "pointer";
              msg.onclick = () => window.location.href = url;
            }
          }
        } catch (error) {
        // Réactiver le bouton en cas d'erreur
        if (btn) {
          btn.disabled = false;
          btn.textContent = "📱 Confirmer et ouvrir WhatsApp";
        }
        if (msg) {
          msg.style.color = "#ef4444";
          msg.textContent = `❌ Erreur lors de l'enregistrement de la commande : ${error.message || "Erreur inconnue"}`;
        }
        console.error("Erreur lors de la création de la commande:", error);
      }
      });
    }
    
    // Surveiller les changements du panier (si l'utilisateur modifie le panier dans un autre onglet)
    window.addEventListener("storage", function(e) {
      if (e.key === LS_KEYS.CART) {
        updateButtonState();
      }
    });
  }

  // Initialiser les event listeners du modal de photo au chargement
  function initPhotoModal() {
    const photoModal = document.getElementById("photo-modal");
    const photoModalClose = document.getElementById("photo-modal-close");
    
    if (photoModalClose && !photoModalClose.dataset.listenerAttached) {
      photoModalClose.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        closePhotoModal();
      });
      photoModalClose.dataset.listenerAttached = "true";
    }
    
    if (photoModal && !photoModal.dataset.listenerAttached) {
      photoModal.addEventListener("click", function (e) {
        // Fermer seulement si on clique sur le fond (pas sur l'image ou le bouton)
        if (e.target === photoModal) {
          closePhotoModal();
        }
      });
      photoModal.dataset.listenerAttached = "true";
    }
    
    // Event listener pour Escape (une seule fois)
    if (!window.photoModalEscapeListener) {
      document.addEventListener("keydown", function (e) {
        const modal = document.getElementById("photo-modal");
        if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
          closePhotoModal();
        }
      });
      window.photoModalEscapeListener = true;
    }
  }

  // ---------- Bootstrap ----------
  document.addEventListener("DOMContentLoaded", async function () {
    seedAdminCredentials();
    seedProducts();
    initNavbar();
    initCategories();
    initPhotoModal(); // Initialiser le modal de photo
    await initHomePage();
    await initProductsPage();
    await initProductDetailPage();
    initRegisterPage();
    initLoginPage();
    await initAccountPage();
    initCartPage();
    await initCheckoutPage();
  });
})();


