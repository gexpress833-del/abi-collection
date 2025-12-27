// Intégration Supabase pour Abi-Collection
// Ce fichier remplace progressivement les fonctions LocalStorage

(function () {
  // Configuration Supabase (à remplir avec tes propres clés)
  const SUPABASE_CONFIG = {
    url: "https://ulfprhnyhrsoqggkhhdj.supabase.co", // Exemple: https://xxxxx.supabase.co
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZnByaG55aHJzb3FnZ2toaGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODgzNjcsImV4cCI6MjA4MjM2NDM2N30.VC___nORowaUZKttzXBmscH1JMvIGVAHJmZ9QadYrk8", // Clé publique anonyme
  };

  let supabase = null;

  // Initialiser Supabase
  function initSupabase() {
    if (typeof window.supabase !== "undefined") {
      supabase = window.supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey
      );
      // Exposer supabase globalement pour la migration
      window.supabaseClient = supabase;
      console.log("✅ Supabase initialisé");
      return true;
    } else {
      console.error("❌ Bibliothèque Supabase non chargée");
      return false;
    }
  }

  // Vérifier si Supabase est configuré
  function isSupabaseConfigured() {
    return (
      SUPABASE_CONFIG.url &&
      SUPABASE_CONFIG.url !== "YOUR_SUPABASE_URL" &&
      SUPABASE_CONFIG.anonKey &&
      SUPABASE_CONFIG.anonKey !== "YOUR_SUPABASE_ANON_KEY" &&
      supabase !== null
    );
  }

  // Mode fallback : utiliser LocalStorage si Supabase n'est pas configuré
  const USE_SUPABASE = true; // Passer à true une fois Supabase configuré

  // ========== PRODUITS ==========

  async function getProductsFromSupabase() {
    if (!isSupabaseConfigured() || !USE_SUPABASE) {
      return getProductsFromLocalStorage();
    }

    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur Supabase (produits):", error);
        return getProductsFromLocalStorage(); // Fallback
      }

      return data || [];
    } catch (e) {
      console.error("Erreur lors de la récupération des produits:", e);
      return getProductsFromLocalStorage(); // Fallback
    }
  }

  async function saveProductToSupabase(product) {
    if (!isSupabaseConfigured() || !USE_SUPABASE) {
      return saveProductToLocalStorage(product);
    }

    try {
      const productData = {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: product.image,
        stock: product.stock !== undefined ? product.stock : null,
        featured: product.featured || false,
      };

      if (product.id && product.id.startsWith("p_")) {
        // C'est un ID LocalStorage, créer un nouveau produit
        const { data, error } = await supabase.from("products").insert(productData).select().single();

        if (error) throw error;
        return data;
      } else {
        // Mise à jour d'un produit existant
        const { data, error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (e) {
      console.error("Erreur lors de la sauvegarde du produit:", e);
      return saveProductToLocalStorage(product); // Fallback
    }
  }

  async function deleteProductFromSupabase(productId) {
    if (!isSupabaseConfigured() || !USE_SUPABASE) {
      return deleteProductFromLocalStorage(productId);
    }

    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Erreur lors de la suppression du produit:", e);
      return deleteProductFromLocalStorage(productId); // Fallback
    }
  }

  // ========== COMMANDES ==========

  async function getOrdersFromSupabase(userId = null) {
    if (!isSupabaseConfigured() || !USE_SUPABASE) {
      return getOrdersFromLocalStorage();
    }

    try {
      let query = supabase.from("orders").select(`
        *,
        order_items (*)
      `).order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erreur Supabase (commandes):", error);
        return getOrdersFromLocalStorage(); // Fallback
      }

      // Transformer les données pour correspondre au format LocalStorage
      return (data || []).map((order) => ({
        id: order.id,
        userId: order.user_id,
        clientName: order.client_name,
        phone: order.phone,
        address: order.address,
        total: order.total,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        paymentReference: order.payment_reference,
        paidAmount: order.paid_amount,
        paidAt: order.paid_at,
        items: (order.order_items || []).map((item) => ({
          id: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        createdAt: order.created_at,
      }));
    } catch (e) {
      console.error("Erreur lors de la récupération des commandes:", e);
      return getOrdersFromLocalStorage(); // Fallback
    }
  }

  async function saveOrderToSupabase(order) {
    if (!isSupabaseConfigured() || !USE_SUPABASE) {
      return saveOrderToLocalStorage(order);
    }

    try {
      const orderData = {
        user_id: order.userId || null,
        client_name: order.clientName,
        phone: order.phone,
        address: order.address,
        total: order.total,
        status: order.status || "en attente",
        payment_status: order.paymentStatus || "non payé",
        payment_method: order.paymentMethod || null,
        payment_reference: order.paymentReference || null,
        paid_amount: order.paidAmount || null,
        paid_at: order.paidAt || null,
      };

      const { data: orderResult, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Insérer les articles de commande
      if (order.items && order.items.length > 0) {
        const orderItems = order.items.map((item) => ({
          order_id: orderResult.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        }));

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

        if (itemsError) throw itemsError;
      }

      return {
        id: orderResult.id,
        ...order,
      };
    } catch (e) {
      console.error("Erreur lors de la sauvegarde de la commande:", e);
      return saveOrderToLocalStorage(order); // Fallback
    }
  }

  // ========== CATÉGORIES ==========

  async function getCategoriesFromSupabase() {
    if (!isSupabaseConfigured() || !USE_SUPABASE) {
      return getCategoriesFromLocalStorage();
    }

    try {
      const { data, error } = await supabase.from("categories").select("*").order("is_default", { ascending: false });

      if (error) {
        console.error("Erreur Supabase (catégories):", error);
        return getCategoriesFromLocalStorage(); // Fallback
      }

      return (data || []).map((cat) => ({
        name: cat.name,
        displayName: cat.display_name,
        isDefault: cat.is_default,
      }));
    } catch (e) {
      console.error("Erreur lors de la récupération des catégories:", e);
      return getCategoriesFromLocalStorage(); // Fallback
    }
  }

  async function saveCategoryToSupabase(category) {
    if (!isSupabaseConfigured() || !USE_SUPABASE) {
      return saveCategoryToLocalStorage(category);
    }

    try {
      const categoryData = {
        name: category.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
        display_name: category.displayName,
        is_default: category.isDefault || false,
      };

      const { data, error } = await supabase.from("categories").insert(categoryData).select().single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Erreur lors de la sauvegarde de la catégorie:", e);
      return saveCategoryToLocalStorage(category); // Fallback
    }
  }

  // ========== PANIER ==========

  async function getCartFromSupabase(userId) {
    if (!isSupabaseConfigured() || !USE_SUPABASE || !userId) {
      return getCartFromLocalStorage();
    }

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("product_id, quantity")
        .eq("user_id", userId);

      if (error) {
        console.error("Erreur Supabase (panier):", error);
        return getCartFromLocalStorage(); // Fallback
      }

      return (data || []).map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
      }));
    } catch (e) {
      console.error("Erreur lors de la récupération du panier:", e);
      return getCartFromLocalStorage(); // Fallback
    }
  }

  async function saveCartToSupabase(userId, cart) {
    if (!isSupabaseConfigured() || !USE_SUPABASE || !userId) {
      return saveCartToLocalStorage(cart);
    }

    try {
      // Supprimer le panier existant
      await supabase.from("cart_items").delete().eq("user_id", userId);

      // Insérer les nouveaux articles
      if (cart && cart.length > 0) {
        const cartItems = cart.map((item) => ({
          user_id: userId,
          product_id: item.productId,
          quantity: item.quantity,
        }));

        const { error } = await supabase.from("cart_items").insert(cartItems);
        if (error) throw error;
      }

      return true;
    } catch (e) {
      console.error("Erreur lors de la sauvegarde du panier:", e);
      return saveCartToLocalStorage(cart); // Fallback
    }
  }

  // ========== FONCTIONS FALLBACK LOCALSTORAGE ==========
  // Ces fonctions seront utilisées si Supabase n'est pas configuré

  function getProductsFromLocalStorage() {
    try {
      const raw = localStorage.getItem("products");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveProductToLocalStorage(product) {
    const products = getProductsFromLocalStorage();
    const index = products.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem("products", JSON.stringify(products));
    return product;
  }

  function deleteProductFromLocalStorage(productId) {
    const products = getProductsFromLocalStorage();
    const filtered = products.filter((p) => p.id !== productId);
    localStorage.setItem("products", JSON.stringify(filtered));
    return true;
  }

  function getOrdersFromLocalStorage() {
    try {
      const raw = localStorage.getItem("orders");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveOrderToLocalStorage(order) {
    const orders = getOrdersFromLocalStorage();
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));
    return order;
  }

  function getCategoriesFromLocalStorage() {
    try {
      const raw = localStorage.getItem("categories");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCategoryToLocalStorage(category) {
    const categories = getCategoriesFromLocalStorage();
    categories.push(category);
    localStorage.setItem("categories", JSON.stringify(categories));
    return category;
  }

  function getCartFromLocalStorage() {
    try {
      const raw = localStorage.getItem("cart");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCartToLocalStorage(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    return true;
  }

  // ========== EXPORT DES FONCTIONS ==========

  window.SupabaseIntegration = {
    init: initSupabase,
    isConfigured: isSupabaseConfigured,
    // Produits
    getProducts: getProductsFromSupabase,
    saveProduct: saveProductToSupabase,
    deleteProduct: deleteProductFromSupabase,
    // Commandes
    getOrders: getOrdersFromSupabase,
    saveOrder: saveOrderToSupabase,
    // Catégories
    getCategories: getCategoriesFromSupabase,
    saveCategory: saveCategoryToSupabase,
    // Panier
    getCart: getCartFromSupabase,
    saveCart: saveCartToSupabase,
  };

  // Initialiser automatiquement au chargement
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSupabase);
  } else {
    initSupabase();
  }
})();

