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
    const categoryImageMap = {
      // Singulier
      "parfum": "images/parfums.jpg",
      "montre": "images/Montre Femmes.webp",
      "bague": "images/Bague.webp",
      "gourmette": "images/Gourmette.jpg",
      "foulard": "images/foulard-soie-boheme.jpg",
      "deodorant": "images/Déodorant.jpg",
      "lunette": "images/Lunettes.jpg",
      // Pluriel (pour compatibilité avec les produits existants)
      "parfums": "images/parfums.jpg",
      "montres": "images/Montre Femmes.webp",
      "bijoux": "images/Bague.webp",
      "gourmettes": "images/Gourmette.jpg",
      "foulards": "images/foulard-soie-boheme.jpg",
      "deodorants": "images/Déodorant.jpg",
      "lunettes": "images/Lunettes.jpg",
      "accessoires": "images/Lunettes.jpg",
      "vetements": "images/foulard-soie-boheme.jpg",
      "hygiene": "images/Déodorant.jpg"
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

    // 2. Si aucune image spécifique, utiliser l'image de catégorie par défaut
    if (category && categoryImageMap[category]) {
      return categoryImageMap[category];
    }
    
    // 3. Image par défaut si aucune catégorie n'est trouvée
    return defaultImage;
  }

  // Fonction pour gérer les erreurs de chargement d'images (accessible globalement)
  window.handleImageError = function(img, fallbackUrl) {
    const category = img.dataset.category || "";
    const categoryImageMap = {
      // Singulier
      "parfum": "images/parfums.jpg",
      "montre": "images/Montre Femmes.webp",
      "bague": "images/Bague.webp",
      "gourmette": "images/Gourmette.jpg",
      "foulard": "images/foulard-soie-boheme.jpg",
      "deodorant": "images/Déodorant.jpg",
      "lunette": "images/Lunettes.jpg",
      // Pluriel
      "parfums": "images/parfums.jpg",
      "montres": "images/Montre Femmes.webp",
      "bijoux": "images/Bague.webp",
      "gourmettes": "images/Gourmette.jpg",
      "foulards": "images/foulard-soie-boheme.jpg",
      "deodorants": "images/Déodorant.jpg",
      "lunettes": "images/Lunettes.jpg",
      "accessoires": "images/Lunettes.jpg",
      "vetements": "images/foulard-soie-boheme.jpg",
      "hygiene": "images/Déodorant.jpg"
    };
    
    const defaultImage = "images/parfums.jpg";
    
    if (img.dataset.tried === "true") {
      // Si on a déjà essayé, utiliser l'image par défaut
      img.src = defaultImage;
      img.onerror = null;
      return;
    }
    
    // Marquer qu'on a essayé
    img.dataset.tried = "true";
    
    // Essayer d'abord une image de catégorie
    if (category && categoryImageMap[category]) {
      img.src = categoryImageMap[category];
      return;
    }
    
    // Si une URL externe existe, l'essayer
    if (fallbackUrl && fallbackUrl.startsWith("http")) {
      img.src = fallbackUrl;
    } else {
      // Sinon, utiliser l'image par défaut
      img.src = defaultImage;
      img.onerror = null;
    }
  };

  function getCategoryImage(category) {
    if (!category) return null;
    
    // Utiliser le même mapping que pour les produits
    const categoryImageMap = {
      // Singulier
      "parfum": "images/parfums.jpg",
      "montre": "images/Montre Femmes.webp",
      "bague": "images/Bague.webp",
      "gourmette": "images/Gourmette.jpg",
      "foulard": "images/foulard-soie-boheme.jpg",
      "deodorant": "images/Déodorant.jpg",
      "lunette": "images/Lunettes.jpg",
      // Pluriel
      "parfums": "images/parfums.jpg",
      "montres": "images/Montre Femmes.webp",
      "bijoux": "images/Bague.webp",
      "gourmettes": "images/Gourmette.jpg",
      "foulards": "images/foulard-soie-boheme.jpg",
      "deodorants": "images/Déodorant.jpg",
      "lunettes": "images/Lunettes.jpg",
      "accessoires": "images/Lunettes.jpg",
      "vetements": "images/foulard-soie-boheme.jpg",
      "hygiene": "images/Déodorant.jpg"
    };
    
    // Retourner l'image correspondante ou une image par défaut
    return categoryImageMap[category.toLowerCase()] || "images/parfums.jpg";
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
    const user = getCurrentUser();

    if (!loginBtn && !chip) return;

    if (user) {
      if (loginBtn) loginBtn.style.display = "none";
      if (chip && nameSpan) {
        nameSpan.textContent = user.name || user.email || "Client";
        chip.style.display = "inline-flex";
        chip.addEventListener("click", function () {
          window.location.href = "account.html";
        });
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
        if (msg) msg.textContent = "Les mots de passe ne correspondent pas.";
        return;
      }

      const users = readLS(LS_KEYS.USERS, []);
      const exists = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (exists) {
        if (msg) msg.textContent = "Un compte existe déjà avec cet email.";
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
        msg.textContent = "Compte créé avec succès. Redirection...";
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

  // Connexion
  function initLoginPage() {
    const form = document.getElementById("login-form");
    if (!form) return;

    const msg = document.getElementById("login-message");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      const users = readLS(LS_KEYS.USERS, []);
      const user = users.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password
      );

      if (!user) {
        if (msg) msg.textContent = "Identifiants incorrects.";
        return;
      }

      setCurrentUser(user);
      if (msg) {
        msg.style.color = "#C9A961";
        msg.textContent = "Connexion réussie. Redirection...";
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

    if (nameInput) nameInput.value = user.name || "";
    if (emailInput) emailInput.value = user.email || "";
    if (phoneInput) phoneInput.value = user.phone || "";
    if (addressInput) addressInput.value = user.address || "";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const updatedUser = {
        ...user,
        name: nameInput ? nameInput.value.trim() : user.name,
        phone: phoneInput ? phoneInput.value.trim() : user.phone,
        address: addressInput ? addressInput.value.trim() : user.address,
      };

      const users = readLS(LS_KEYS.USERS, []);
      const index = users.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        users[index] = updatedUser;
        writeLS(LS_KEYS.USERS, users);
      }
      setCurrentUser(updatedUser);
      if (msg) {
        msg.style.color = "#C9A961";
        msg.textContent = "Profil mis à jour.";
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
          if (msg) msg.textContent = "Votre panier est vide.";
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
            msg.textContent = "❌ Votre panier est vide. Impossible de soumettre une commande vide.";
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
            msg.textContent = "❌ Aucun produit valide dans votre panier. Veuillez ajouter des produits avant de commander.";
            msg.style.color = "#ef4444";
          }
          return;
        }
        
        // Calculer le total actuel
        const currentTotal = currentItems.reduce((sum, item) => sum + (item.total || 0), 0);
        
        if (currentTotal <= 0) {
          if (msg) {
            msg.textContent = "❌ Le total de votre commande est invalide. Veuillez vérifier votre panier.";
            msg.style.color = "#ef4444";
          }
          return;
        }

        try {
          // Désactiver le bouton pendant le traitement
          if (btn) {
            btn.disabled = true;
            btn.textContent = "Traitement en cours...";
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
          const url = "https://wa.me/243828796100?text=" + message;

          window.open(url, "_blank");
          if (msg) {
            msg.style.color = "#C9A961";
            msg.textContent =
              "✅ Commande enregistrée avec succès ! WhatsApp devrait s'ouvrir dans un nouvel onglet.";
          }
        } catch (error) {
        // Réactiver le bouton en cas d'erreur
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Confirmer et ouvrir WhatsApp";
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

  // ---------- Bootstrap ----------
  document.addEventListener("DOMContentLoaded", async function () {
    seedAdminCredentials();
    seedProducts();
    initNavbar();
    initCategories();
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


