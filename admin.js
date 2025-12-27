// Abi-Collection - Dashboard admin
// Gestion LocalStorage : products, orders, adminCredentials

(function () {
  const LS_KEYS = {
    PRODUCTS: "products",
    ORDERS: "orders",
    ADMIN_CREDENTIALS: "adminCredentials",
    ADMIN_LOGGED_IN: "adminLoggedIn",
    CATEGORIES: "categories",
  };

  function readLS(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error("Erreur lecture LocalStorage admin", key, e);
      return fallback;
    }
  }

  function writeLS(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Erreur écriture LocalStorage admin", key, e);
    }
  }

  function getProducts() {
    return readLS(LS_KEYS.PRODUCTS, []);
  }

  function setProducts(products) {
    writeLS(LS_KEYS.PRODUCTS, products);
  }

  function getOrders() {
    return readLS(LS_KEYS.ORDERS, []);
  }

  function setOrders(orders) {
    writeLS(LS_KEYS.ORDERS, orders);
  }

  function getAdminCreds() {
    return readLS(LS_KEYS.ADMIN_CREDENTIALS, null);
  }

  function isAdminLoggedIn() {
    return readLS(LS_KEYS.ADMIN_LOGGED_IN, false) === true;
  }

  function setAdminLoggedIn(flag) {
    writeLS(LS_KEYS.ADMIN_LOGGED_IN, !!flag);
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

  function setCategories(categories) {
    // Ne stocker que les catégories personnalisées (non-default)
    const custom = categories.filter((c) => !c.isDefault);
    writeLS(LS_KEYS.CATEGORIES, custom);
  }

  function addCategory(name) {
    const normalizedName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    if (!normalizedName) return false;

    const categories = getCategories();
    // Vérifier si la catégorie existe déjà
    if (categories.some((c) => c.name === normalizedName)) {
      return false;
    }

    const newCategory = {
      name: normalizedName,
      displayName: name.trim(),
      isDefault: false,
    };

    const custom = categories.filter((c) => !c.isDefault);
    custom.push(newCategory);
    setCategories(custom);
    return true;
  }

  function deleteCategory(name) {
    const categories = getCategories();
    const category = categories.find((c) => c.name === name);
    if (!category || category.isDefault) return false; // Ne pas supprimer les catégories par défaut

    const custom = categories.filter((c) => !c.isDefault && c.name !== name);
    setCategories(custom);
    return true;
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

  function generateId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).substring(2, 8)
    );
  }

  // ---------- Gestion des images locales ----------
  function getProductImage(product) {
    // Image par défaut à utiliser (une image existante)
    const defaultImage = "images/parfums.jpg";
    if (!product) return defaultImage;

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
      img.src = defaultImage;
      img.onerror = null;
      return;
    }
    img.dataset.tried = "true";
    
    // Essayer d'abord une image de catégorie
    if (category && categoryImageMap[category]) {
      img.src = categoryImageMap[category];
      return;
    }
    
    if (fallbackUrl && fallbackUrl.startsWith("http")) {
      img.src = fallbackUrl;
    } else {
      img.src = defaultImage;
      img.onerror = null;
    }
  };

  // ---------- Login admin ----------
  function initAdminLogin() {
    const form = document.getElementById("admin-login-form");
    const msg = document.getElementById("admin-login-message");
    const loginSection = document.getElementById("admin-login-section");
    const dashboard = document.getElementById("admin-dashboard");

    if (!form || !loginSection || !dashboard) return;

    function showDashboard() {
      loginSection.classList.add("hidden");
      dashboard.classList.remove("hidden");
      renderAll();
    }

    if (isAdminLoggedIn()) {
      showDashboard();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("admin-email").value.trim();
      const password = document.getElementById("admin-password").value;
      
      // S'assurer que les identifiants sont initialisés
      seedAdminCredentials();
      const creds = getAdminCreds();

      if (!creds) {
        if (msg) {
          msg.style.color = "#ef4444";
          msg.textContent = "Aucun identifiant admin configuré. Veuillez rafraîchir la page.";
        }
        return;
      }

      // Debug: vérifier les valeurs (à retirer en production)
      console.log("Email saisi:", email);
      console.log("Email attendu:", creds.email);
      console.log("Mot de passe saisi:", password ? "***" : "(vide)");
      console.log("Mot de passe attendu:", creds.password ? "***" : "(vide)");
      console.log("Email match:", email.toLowerCase() === creds.email.toLowerCase());
      console.log("Password match:", password === creds.password);

      if (
        email.toLowerCase() === creds.email.toLowerCase() &&
        password === creds.password
      ) {
        setAdminLoggedIn(true);
        if (msg) {
          msg.style.color = "#C9A961";
          msg.textContent = "Connexion réussie.";
        }
        setTimeout(showDashboard, 400);
      } else {
        if (msg) {
          msg.style.color = "#ef4444";
          msg.textContent = "Identifiants incorrects. Vérifiez l'email et le mot de passe.";
        }
      }
    });

    const logoutBtn = document.getElementById("admin-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        setAdminLoggedIn(false);
        window.location.reload();
      });
    }

    // Bouton pour réinitialiser les identifiants
    const resetCredsBtn = document.getElementById("reset-admin-creds");
    if (resetCredsBtn) {
      resetCredsBtn.addEventListener("click", function () {
        if (confirm("Voulez-vous réinitialiser les identifiants admin aux valeurs par défaut ?")) {
          writeLS(LS_KEYS.ADMIN_CREDENTIALS, {
            email: "admin@abi-collection.com",
            password: "AbiCollection2025!",
          });
          if (msg) {
            msg.style.color = "#C9A961";
            msg.textContent = "Identifiants réinitialisés. Vous pouvez maintenant vous connecter.";
          }
        }
      });
    }
  }

  // ---------- Statistiques ----------
  function computeStats() {
    const orders = getOrders();
    const stats = {
      ordersCount: orders.length,
      totalSales: 0,
      topProductName: "—",
    };

    if (!orders.length) return stats;

    const productCount = {};
    orders.forEach((o) => {
      stats.totalSales += o.total || 0;
      (o.items || []).forEach((it) => {
        if (!productCount[it.id]) {
          productCount[it.id] = { name: it.name, qty: 0 };
        }
        productCount[it.id].qty += it.quantity || 0;
      });
    });

    let top = null;
    Object.values(productCount).forEach((entry) => {
      if (!top || entry.qty > top.qty) top = entry;
    });
    if (top) stats.topProductName = top.name;

    return stats;
  }

  function renderStats() {
    const stats = computeStats();
    const ordersCountEl = document.getElementById("stat-orders-count");
    const totalSalesEl = document.getElementById("stat-total-sales");
    const topProductEl = document.getElementById("stat-top-product");

    if (ordersCountEl) ordersCountEl.textContent = String(stats.ordersCount);
    if (totalSalesEl)
      totalSalesEl.textContent = formatCDF(stats.totalSales || 0);
    if (topProductEl) topProductEl.textContent = stats.topProductName;
  }

  // ---------- Commandes ----------
  function renderOrdersList() {
    const container = document.getElementById("admin-orders-list");
    const filterSelect = document.getElementById("orders-filter");
    if (!container || !filterSelect) return;

    const filter = filterSelect.value || "all";
    let orders = getOrders();

    if (filter !== "all") {
      orders = orders.filter((o) => (o.status || "en attente") === filter);
    }

    orders = orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (!orders.length) {
      container.innerHTML =
        '<p class="text-xs text-white/60">Aucune commande trouvée.</p>';
      return;
    }

    container.innerHTML = orders
      .map((o) => {
        const date = o.createdAt
          ? new Date(o.createdAt).toLocaleString("fr-CD")
          : "";
        const paymentStatus = o.paymentStatus || "non payé";
        const paymentLabel =
          paymentStatus === "payé" ? "Payé" : "Non payé / en attente";
        const paymentColor =
          paymentStatus === "payé" ? "text-emerald-300" : "text-white/60";
        const items = (o.items || [])
          .map(
            (it) =>
              `<li class="flex justify-between gap-2"><span class="truncate">${it.name}${
                it.quantity && it.quantity > 1 ? " x" + it.quantity : ""
              }</span><span>${formatCDF(it.total || 0)}</span></li>`
          )
          .join("");
        return `
        <article class="glass-card text-xs">
          <div class="flex items-center justify-between gap-2 mb-1">
            <p class="text-[11px] text-white/60">#${o.id}</p>
            <span class="text-[11px] ${
              (o.status || "en attente") === "livré"
                ? "text-emerald-300"
                : "text-amber-300"
            }">${o.status || "en attente"}</span>
          </div>
          <p class="text-[11px] text-white/50 mb-1">${date}</p>
          <p class="text-[11px] text-white/70 mb-1">${o.clientName || ""} • ${
          o.phone || ""
        }</p>
          <p class="text-[11px] ${paymentColor} mb-1">Paiement : ${paymentLabel}${
          o.paymentMethod ? " (" + o.paymentMethod + ")" : ""
        }</p>
          <ul class="space-y-1 mb-2">
            ${items}
          </ul>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[11px] text-white/70">Total : <span class="text-primary font-semibold">${formatCDF(
              o.total || 0
            )}</span></p>
            <div class="flex flex-wrap gap-2">
              <button class="px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-[11px]" data-toggle-status="${
                o.id
              }">
                ${
                  (o.status || "en attente") === "livré"
                    ? "Repasser en attente"
                    : "Marquer livré"
                }
              </button>
              <button class="px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-[11px]" data-record-payment="${
                o.id
              }">
                Enregistrer paiement
              </button>
              <button class="px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-[11px]" data-send-invoice="${
                o.id
              }">
                Envoyer facture
              </button>
            </div>
          </div>
        </article>
      `;
      })
      .join("");

    container.addEventListener("click", function (e) {
      const toggleBtn = e.target.closest("[data-toggle-status]");
      const payBtn = e.target.closest("[data-record-payment]");
      const invoiceBtn = e.target.closest("[data-send-invoice]");

      if (toggleBtn) {
        const id = toggleBtn.getAttribute("data-toggle-status");
        let orders = getOrders();
        const index = orders.findIndex((o) => o.id === id);
        if (index === -1) return;
        const current = orders[index].status || "en attente";
        orders[index].status = current === "livré" ? "en attente" : "livré";
        setOrders(orders);
        renderOrdersList();
        renderStats();
      } else if (payBtn) {
        const id = payBtn.getAttribute("data-record-payment");
        let orders = getOrders();
        const index = orders.findIndex((o) => o.id === id);
        if (index === -1) return;
        const order = orders[index];
        const method =
          window.prompt(
            "Mode de paiement (ex: Mobile Money, Cash, Carte) :",
            order.paymentMethod || "Mobile Money"
          ) || "";
        if (!method.trim()) return;
        const reference =
          window.prompt(
            "Référence ou ID de transaction (facultatif) :",
            order.paymentReference || ""
          ) || "";
        order.paymentStatus = "payé";
        order.paymentMethod = method.trim();
        order.paymentReference = reference.trim();
        order.paidAmount = order.total || 0;
        order.paidAt = Date.now();
        orders[index] = order;
        setOrders(orders);
        renderOrdersList();
      } else if (invoiceBtn) {
        const id = invoiceBtn.getAttribute("data-send-invoice");
        const orders = getOrders();
        const order = orders.find((o) => o.id === id);
        if (!order) return;
        const phoneRaw = order.phone || "";
        const phoneDigits = phoneRaw.replace(/[^\d]/g, "");
        if (!phoneDigits) {
          window.alert(
            "Impossible d’envoyer la facture : numéro de téléphone client manquant ou invalide."
          );
          return;
        }

        const dateStr = order.paidAt
          ? new Date(order.paidAt).toLocaleString("fr-CD")
          : new Date().toLocaleString("fr-CD");
        const paymentStatus = order.paymentStatus || "non payé";
        const lines = [];
        lines.push("Facture Abi-Collection");
        lines.push("N° : " + order.id);
        lines.push("Date : " + dateStr);
        lines.push("");
        lines.push("Client : " + (order.clientName || ""));
        lines.push("Téléphone : " + (order.phone || ""));
        lines.push("Adresse : " + (order.address || ""));
        lines.push("");
        lines.push("Articles :");
        (order.items || []).forEach((it) => {
          const label =
            (it.quantity && it.quantity > 1
              ? `${it.name} (x${it.quantity})`
              : it.name) +
            " — " +
            formatCDF(it.total || 0);
          lines.push("- " + label);
        });
        lines.push("");
        lines.push("Total : " + formatCDF(order.total || 0));
        if (paymentStatus === "payé") {
          lines.push("Montant payé : " + formatCDF(order.paidAmount || 0));
        }
        if (order.paymentMethod) {
          lines.push("Mode de paiement : " + order.paymentMethod);
        }
        if (order.paymentReference) {
          lines.push("Référence paiement : " + order.paymentReference);
        }
        lines.push("");
        lines.push("Merci pour votre achat chez Abi-Collection.");

        const message = encodeURIComponent(lines.join("\n"));
        const url = "https://wa.me/" + phoneDigits + "?text=" + message;
        window.open(url, "_blank");
      }
    });

    filterSelect.addEventListener("change", function () {
      renderOrdersList();
    });
  }

  // ---------- Catégories ----------
  function renderCategoriesList() {
    const container = document.getElementById("admin-categories-list");
    if (!container) return;

    const categories = getCategories();
    if (!categories.length) {
      container.innerHTML = '<p class="text-xs text-white/60">Aucune catégorie.</p>';
      return;
    }

    container.innerHTML = categories
      .map(
        (cat) => `
      <div class="glass-card flex items-center justify-between gap-2 text-[11px]">
        <div>
          <span class="font-semibold">${cat.displayName}</span>
          ${cat.isDefault ? '<span class="text-white/40 text-[10px] ml-2">(par défaut)</span>' : ''}
        </div>
        ${!cat.isDefault ? `<button class="px-2 py-1 rounded-full bg-red-500/20 text-red-200 text-[10px]" data-delete-category="${cat.name}">Supprimer</button>` : ''}
      </div>
    `
      )
      .join("");

    // Supprimer les anciens listeners pour éviter les doublons
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);

    newContainer.addEventListener("click", function (e) {
      const del = e.target.closest("[data-delete-category]");
      if (del) {
        const name = del.getAttribute("data-delete-category");
        // Vérifier si des produits utilisent cette catégorie
        const products = getProducts();
        const productsUsingCategory = products.filter((p) => p.category === name);
        const msg = document.getElementById("admin-category-message");
        if (productsUsingCategory.length > 0) {
          if (msg) {
            msg.style.color = "#ef4444";
            msg.textContent = `Impossible de supprimer : ${productsUsingCategory.length} produit(s) utilisent cette catégorie.`;
          }
          return;
        }
        if (deleteCategory(name)) {
          renderCategoriesList();
          updateCategorySelect();
          if (msg) {
            msg.style.color = "#C9A961";
            msg.textContent = "Catégorie supprimée.";
            setTimeout(() => { msg.textContent = ""; }, 2000);
          }
        }
      }
    });
  }

  function updateCategorySelect() {
    const select = document.getElementById("admin-product-category");
    if (!select) return;

    const categories = getCategories();
    const currentValue = select.value;

    select.innerHTML = categories
      .map((cat) => `<option value="${cat.name}">${cat.displayName}</option>`)
      .join("");

    // Restaurer la valeur sélectionnée si elle existe toujours
    if (categories.some((cat) => cat.name === currentValue)) {
      select.value = currentValue;
    } else {
      select.value = categories[0]?.name || "parfum";
    }
    
    return select.value; // Retourner la valeur définie
  }

  function initCategoryForm() {
    const form = document.getElementById("admin-category-form");
    if (!form) return;

    const nameInput = document.getElementById("admin-category-name");
    const msg = document.getElementById("admin-category-message");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = nameInput ? nameInput.value.trim() : "";

      if (!name) {
        if (msg) {
          msg.style.color = "#ef4444";
          msg.textContent = "Le nom de la catégorie est obligatoire.";
        }
        return;
      }

      if (addCategory(name)) {
        renderCategoriesList();
        updateCategorySelect();
        if (nameInput) nameInput.value = "";
        if (msg) {
          msg.style.color = "#C9A961";
          msg.textContent = "Catégorie ajoutée.";
          setTimeout(() => { msg.textContent = ""; }, 2000);
        }
      } else {
        if (msg) {
          msg.style.color = "#ef4444";
          msg.textContent = "Cette catégorie existe déjà.";
        }
      }
    });
  }

  // ---------- Produits ----------
  function renderProductsList() {
    const container = document.getElementById("admin-products-list");
    if (!container) return;

    const products = getProducts();
    if (!products.length) {
      container.innerHTML =
        '<p class="text-xs text-white/60">Aucun produit configuré.</p>';
      return;
    }

    container.innerHTML = products
      .map(
        (p) => {
          // S'assurer que l'ID est bien une chaîne et échapper les caractères spéciaux
          const productId = String(p.id || "");
          const escapedId = productId.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          console.log("Rendu produit:", p.name, "ID:", productId);
          return `
      <article class="glass-card flex items-center gap-2 text-[11px]">
        <div class="w-14 h-14 rounded-xl overflow-hidden bg-black/40 flex-shrink-0">
          <img src="${getProductImage(p)}" alt="${p.name}" class="w-full h-full object-cover" onerror="handleImageError(this, '${(p.image || '').replace(/'/g, "\\'")}');" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="uppercase tracking-[0.15em] text-white/50">${
            p.category || ""
          }</p>
          <p class="font-semibold truncate">${p.name}</p>
          <p class="text-primary font-semibold">${formatCDF(p.price)}</p>
          ${p.stock !== undefined && p.stock !== null 
            ? `<p class="text-[10px] ${p.stock > 0 ? 'text-emerald-300' : 'text-red-300'} mt-1">Stock: ${p.stock > 0 ? p.stock + ' disponible' + (p.stock === 1 ? '' : 's') : 'Rupture'}</p>`
            : '<p class="text-[10px] text-white/40 mt-1">Stock: Illimité</p>'
          }
        </div>
        <div class="flex flex-col gap-1">
          <button class="px-3 py-1 rounded-full bg-white/10" data-edit-product="${escapedId}">Modifier</button>
          <button class="px-3 py-1 rounded-full bg-red-500/20 text-red-200" data-delete-product="${escapedId}">Supprimer</button>
        </div>
      </article>
    `;
        }
      )
      .join("");

    // Supprimer les anciens listeners pour éviter les doublons
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);

    newContainer.addEventListener("click", function (e) {
      const edit = e.target.closest("[data-edit-product]");
      const del = e.target.closest("[data-delete-product]");
      if (edit) {
        const id = edit.getAttribute("data-edit-product");
        console.log("Modification du produit avec l'ID:", id);
        console.log("Type de l'ID:", typeof id);
        console.log("Tous les produits:", getProducts().map(p => ({ id: p.id, name: p.name })));
        loadProductToForm(id);
      } else if (del) {
        const id = del.getAttribute("data-delete-product");
        if (confirm("Voulez-vous vraiment supprimer ce produit ?")) {
          const products = getProducts().filter((p) => p.id !== id);
          setProducts(products);
          renderProductsList();
        }
      }
    });
  }

  function loadProductToForm(id) {
    const products = getProducts();
    // Essayer de trouver le produit avec l'ID exact
    let p = products.find((prod) => String(prod.id) === String(id));
    
    // Si pas trouvé, essayer une recherche plus flexible
    if (!p) {
      console.log("Recherche flexible pour l'ID:", id);
      p = products.find((prod) => {
        const prodId = String(prod.id || "");
        const searchId = String(id || "");
        return prodId.includes(searchId) || searchId.includes(prodId);
      });
    }
    
    if (!p) {
      console.error("Produit non trouvé avec l'ID:", id);
      console.error("IDs disponibles:", products.map(prod => prod.id));
      return;
    }

    console.log("Chargement du produit:", p.name, "ID:", p.id);

    const idInput = document.getElementById("admin-product-id");
    const nameInput = document.getElementById("admin-product-name");
    const priceInput = document.getElementById("admin-product-price");
    const categorySelect = document.getElementById("admin-product-category");
    const imageUrlInput = document.getElementById("admin-product-image-url");
    const imageFileInput = document.getElementById("admin-product-image-file");
    const imagePreview = document.getElementById("admin-product-image-preview");
    const imagePreviewImg = document.getElementById("admin-product-image-preview-img");
    const descInput = document.getElementById("admin-product-description");
    const featuredInput = document.getElementById("admin-product-featured");
    const stockInput = document.getElementById("admin-product-stock");

    if (!idInput || !nameInput || !priceInput || !categorySelect) {
      console.error("Éléments du formulaire non trouvés");
      return;
    }

    // Mettre à jour le select de catégories d'abord
    updateCategorySelect();
    
    // Mapper les catégories alternatives vers les catégories standard
    function normalizeCategoryForSelect(category) {
      if (!category) return "parfum";
      const cat = category.toLowerCase();
      // Mapping des variantes vers les catégories standard
      if (cat === "bijoux") return "bague";
      if (cat === "parfums") return "parfum";
      if (cat === "lunettes") return "lunette";
      if (cat === "montres") return "montre";
      if (cat === "bagues") return "bague";
      if (cat === "gourmettes") return "gourmette";
      if (cat === "foulards") return "foulard";
      if (cat === "deodorants") return "deodorant";
      return cat;
    }
    
    const submitText = document.getElementById("admin-product-submit-text");
    
    // Attendre un peu pour que le DOM soit mis à jour
    setTimeout(() => {
      if (idInput) idInput.value = String(p.id || ""); // Convertir en string pour être sûr
      if (nameInput) nameInput.value = p.name || "";
      if (priceInput) priceInput.value = p.price || "";
      
      // Mettre à jour le texte du bouton
      if (submitText) {
        submitText.textContent = p.id ? "Modifier" : "Ajouter";
      }
      
      if (categorySelect) {
        const categoryValue = normalizeCategoryForSelect(p.category);
        // Vérifier que la catégorie existe dans le select
        const categories = getCategories();
        const categoryExists = categories.some(cat => cat.name === categoryValue);
        if (categoryExists) {
          categorySelect.value = categoryValue;
          console.log("Catégorie définie:", categoryValue, "Valeur actuelle du select:", categorySelect.value);
        } else {
          // Si la catégorie n'existe pas, utiliser la première disponible
          categorySelect.value = categories[0]?.name || "parfum";
          console.warn("Catégorie non trouvée:", p.category, "Utilisation de:", categorySelect.value);
        }
      }
      
      // Gérer l'image : si c'est une data URL (base64), afficher l'aperçu, sinon utiliser l'URL
      if (p.image) {
        if (p.image.startsWith("data:image/")) {
          // C'est une image uploadée (base64)
          if (imagePreviewImg) imagePreviewImg.src = p.image;
          if (imagePreview) imagePreview.classList.remove("hidden");
          if (imageUrlInput) imageUrlInput.value = "";
          if (imageFileInput) imageFileInput.value = ""; // Ne pas réafficher le fichier, mais l'image est déjà là
        } else {
          // C'est une URL
          if (imageUrlInput) imageUrlInput.value = p.image;
          if (imagePreview) imagePreview.classList.add("hidden");
          if (imageFileInput) imageFileInput.value = "";
        }
      } else {
        if (imageUrlInput) imageUrlInput.value = "";
        if (imagePreview) imagePreview.classList.add("hidden");
        if (imageFileInput) imageFileInput.value = "";
      }
      
      if (descInput) descInput.value = p.description || "";
      if (featuredInput) featuredInput.checked = !!p.featured;
      if (stockInput) {
        stockInput.value = p.stock !== undefined && p.stock !== null ? p.stock : "";
      }
      
      // Mettre à jour le texte du bouton
      const submitText = document.getElementById("admin-product-submit-text");
      if (submitText) {
        submitText.textContent = p.id ? "Modifier" : "Ajouter";
      }
      
      // Faire défiler jusqu'au formulaire pour que l'utilisateur voie les modifications
      const form = document.getElementById("admin-product-form");
      if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
  }

  function initProductForm() {
    const form = document.getElementById("admin-product-form");
    if (!form) return;

    const idInput = document.getElementById("admin-product-id");
    const nameInput = document.getElementById("admin-product-name");
    const priceInput = document.getElementById("admin-product-price");
    const categorySelect = document.getElementById("admin-product-category");
    const imageUrlInput = document.getElementById("admin-product-image-url");
    const imageFileInput = document.getElementById("admin-product-image-file");
    const imagePreview = document.getElementById("admin-product-image-preview");
    const imagePreviewImg = document.getElementById("admin-product-image-preview-img");
    const imageRemoveBtn = document.getElementById("admin-product-image-remove");
    const descInput = document.getElementById("admin-product-description");
    const featuredInput = document.getElementById("admin-product-featured");
    const stockInput = document.getElementById("admin-product-stock");
    const resetBtn = document.getElementById("admin-product-reset");
    const newBtn = document.getElementById("admin-product-new-btn");
    const submitBtn = document.getElementById("admin-product-submit-btn");
    const submitText = document.getElementById("admin-product-submit-text");
    const msg = document.getElementById("admin-product-message");

    function updateSubmitButton() {
      const hasId = idInput && idInput.value.trim();
      if (submitText) {
        submitText.textContent = hasId ? "Modifier" : "Ajouter";
      }
    }

    function resetForm() {
      if (idInput) idInput.value = "";
      if (nameInput) nameInput.value = "";
      if (priceInput) priceInput.value = "";
      if (categorySelect) categorySelect.value = "parfum";
      if (imageUrlInput) imageUrlInput.value = "";
      if (imageFileInput) imageFileInput.value = "";
      if (imagePreview) imagePreview.classList.add("hidden");
      if (imagePreviewImg) imagePreviewImg.src = "";
      if (descInput) descInput.value = "";
      if (featuredInput) featuredInput.checked = false;
      if (stockInput) stockInput.value = "";
      if (msg) msg.textContent = "";
      updateSubmitButton();
    }

    // Gestion de l'upload d'image
    if (imageFileInput) {
      imageFileInput.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
          // Vérifier la taille (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            if (msg) {
              msg.style.color = "#ef4444";
              msg.textContent = "L'image est trop grande. Taille maximale : 5MB.";
            }
            imageFileInput.value = "";
            return;
          }

          // Vérifier le type
          if (!file.type.startsWith("image/")) {
            if (msg) {
              msg.style.color = "#ef4444";
              msg.textContent = "Veuillez sélectionner un fichier image.";
            }
            imageFileInput.value = "";
            return;
          }

          const reader = new FileReader();
          reader.onload = function (event) {
            const dataUrl = event.target.result;
            if (imagePreviewImg) imagePreviewImg.src = dataUrl;
            if (imagePreview) imagePreview.classList.remove("hidden");
            // Effacer l'URL si une image est uploadée
            if (imageUrlInput) imageUrlInput.value = "";
            if (msg) msg.textContent = "";
          };
          reader.onerror = function () {
            if (msg) {
              msg.style.color = "#ef4444";
              msg.textContent = "Erreur lors du chargement de l'image.";
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Supprimer l'image uploadée
    if (imageRemoveBtn) {
      imageRemoveBtn.addEventListener("click", function () {
        if (imageFileInput) imageFileInput.value = "";
        if (imagePreview) imagePreview.classList.add("hidden");
        if (imagePreviewImg) imagePreviewImg.src = "";
      });
    }

    // Si on entre une URL, masquer l'aperçu de l'upload
    if (imageUrlInput) {
      imageUrlInput.addEventListener("input", function () {
        if (this.value.trim()) {
          if (imageFileInput) imageFileInput.value = "";
          if (imagePreview) imagePreview.classList.add("hidden");
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        resetForm();
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = nameInput ? nameInput.value.trim() : "";
      const price = Number(priceInput ? priceInput.value : 0) || 0;
      const category = categorySelect ? categorySelect.value : "parfum";
      
      // Priorité : image uploadée > URL
      let image = "";
      if (imageFileInput && imageFileInput.files && imageFileInput.files[0]) {
        // L'image sera convertie en base64 et stockée dans le produit
        // Pour l'instant, on va utiliser un FileReader pour obtenir la data URL
        const file = imageFileInput.files[0];
        const reader = new FileReader();
        reader.onload = function (event) {
          const dataUrl = event.target.result;
          saveProductWithImage(dataUrl);
        };
        reader.readAsDataURL(file);
        return; // Sortir ici, la sauvegarde se fera dans le callback
      } else if (imageUrlInput && imageUrlInput.value.trim()) {
        image = imageUrlInput.value.trim();
      }
      
      const description = descInput ? descInput.value.trim() : "";
      const featured = featuredInput ? featuredInput.checked : false;
      const stockValue = stockInput ? stockInput.value.trim() : "";
      const stock = stockValue === "" ? null : Number(stockValue);
      
      saveProduct(image, stock);
    });

    function saveProduct(image, stock) {
      const name = nameInput ? nameInput.value.trim() : "";
      const price = Number(priceInput ? priceInput.value : 0) || 0;
      const category = categorySelect ? categorySelect.value : "parfum";
      const description = descInput ? descInput.value.trim() : "";
      const featured = featuredInput ? featuredInput.checked : false;

      if (!name || !price) {
        if (msg) {
          msg.style.color = "#ef4444";
          msg.textContent = "Nom et prix sont obligatoires.";
        }
        return;
      }

      let products = getProducts();
      const existingId = idInput ? String(idInput.value).trim() : "";

      if (existingId) {
        // Rechercher le produit avec comparaison flexible (string)
        const index = products.findIndex((p) => String(p.id) === String(existingId));
        console.log("Modification du produit existant, index:", index, "ID recherché:", existingId);
        console.log("IDs disponibles:", products.map(p => ({ id: p.id, name: p.name })));
        
        if (index !== -1) {
          products[index] = {
            ...products[index],
            name,
            price,
            category,
            image,
            description,
            featured,
            stock: stock !== null ? stock : undefined,
          };
          console.log("Produit modifié:", products[index]);
        } else {
          console.error("Produit non trouvé pour modification, ID:", existingId);
          console.error("Type de l'ID recherché:", typeof existingId);
          console.error("Types des IDs dans les produits:", products.map(p => ({ id: p.id, type: typeof p.id })));
          if (msg) {
            msg.style.color = "#ef4444";
            msg.textContent = `Erreur : produit non trouvé pour modification (ID: ${existingId}).`;
          }
          return;
        }
      } else {
        const newProduct = {
          id: generateId("p"),
          name,
          price,
          category,
          image,
          description,
          featured,
          stock: stock !== null ? stock : undefined,
        };
        products.push(newProduct);
      }

      setProducts(products);
      renderProductsList();
      if (msg) {
        msg.style.color = "#C9A961";
        msg.textContent = "Produit enregistré.";
      }
      resetForm();
    }

    function saveProductWithImage(imageDataUrl) {
      const name = nameInput ? nameInput.value.trim() : "";
      const price = Number(priceInput ? priceInput.value : 0) || 0;
      const category = categorySelect ? categorySelect.value : "parfum";
      const description = descInput ? descInput.value.trim() : "";
      const featured = featuredInput ? featuredInput.checked : false;
      const stockValue = stockInput ? stockInput.value.trim() : "";
      const stock = stockValue === "" ? null : Number(stockValue);

      if (!name || !price) {
        if (msg) {
          msg.style.color = "#ef4444";
          msg.textContent = "Nom et prix sont obligatoires.";
        }
        return;
      }

      let products = getProducts();
      const existingId = idInput ? idInput.value : "";

      if (existingId) {
        // Rechercher le produit avec comparaison flexible (string)
        const index = products.findIndex((p) => String(p.id) === String(existingId));
        console.log("Modification du produit avec image uploadée, index:", index, "ID:", existingId);
        if (index !== -1) {
          products[index] = {
            ...products[index],
            name,
            price,
            category,
            image: imageDataUrl, // Stocker la data URL (base64)
            description,
            featured,
            stock: stock !== null ? stock : undefined,
          };
          console.log("Produit modifié avec image:", products[index]);
        } else {
          console.error("Produit non trouvé pour modification avec image, ID:", existingId);
          if (msg) {
            msg.style.color = "#ef4444";
            msg.textContent = `Erreur : produit non trouvé (ID: ${existingId}).`;
          }
          return;
        }
      } else {
        const newProduct = {
          id: generateId("p"),
          name,
          price,
          category,
          image: imageDataUrl, // Stocker la data URL (base64)
          description,
          featured,
          stock: stock !== null ? stock : undefined,
        };
        products.push(newProduct);
      }

      setProducts(products);
      renderProductsList();
      if (msg) {
        msg.style.color = "#C9A961";
        msg.textContent = "Produit enregistré avec image uploadée.";
      }
      resetForm();
    }
  }

  function renderAll() {
    renderStats();
    renderOrdersList();
    renderCategoriesList();
    updateCategorySelect();
    renderProductsList();
  }

  // Initialiser les identifiants admin s'ils n'existent pas
  function seedAdminCredentials() {
    const existing = readLS(LS_KEYS.ADMIN_CREDENTIALS, null);
    if (!existing) {
      writeLS(LS_KEYS.ADMIN_CREDENTIALS, {
        email: "admin@abi-collection.com",
        password: "AbiCollection2025!",
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    seedAdminCredentials(); // Initialiser les identifiants admin
    initAdminLogin();
    initCategoryForm();
    initProductForm();
    renderCategoriesList();
    updateCategorySelect();
  });
})();


