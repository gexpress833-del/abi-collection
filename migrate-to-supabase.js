// Script de migration des données LocalStorage vers Supabase
// Exécute ce script dans la console du navigateur une fois Supabase configuré

(async function migrateToSupabase() {
  console.log("🚀 Début de la migration vers Supabase...");

  // Vérifier que Supabase est configuré
  if (!window.SupabaseIntegration || !window.SupabaseIntegration.isConfigured()) {
    console.error("❌ Supabase n'est pas configuré. Configure d'abord supabase-config.js");
    return;
  }

  const supabase = window.supabase;
  if (!supabase) {
    console.error("❌ Client Supabase non initialisé");
    return;
  }

  let migrated = 0;
  let errors = 0;

  // 1. Migrer les produits
  try {
    console.log("📦 Migration des produits...");
    const products = JSON.parse(localStorage.getItem("products") || "[]");
    
    for (const product of products) {
      try {
        const productData = {
          name: product.name,
          description: product.description || "",
          price: product.price || 0,
          category: product.category || null,
          image: product.image || null,
          stock: product.stock !== undefined ? product.stock : null,
          featured: product.featured || false,
        };

        const { data, error } = await supabase.from("products").insert(productData).select().single();

        if (error) {
          // Si le produit existe déjà, essayer de le mettre à jour
          if (error.code === "23505") {
            console.log(`⚠️ Produit "${product.name}" existe déjà, mise à jour...`);
            const { error: updateError } = await supabase
              .from("products")
              .update(productData)
              .eq("name", product.name);
            if (updateError) throw updateError;
          } else {
            throw error;
          }
        }
        migrated++;
      } catch (e) {
        console.error(`❌ Erreur pour le produit "${product.name}":`, e);
        errors++;
      }
    }
    console.log(`✅ ${migrated} produits migrés, ${errors} erreurs`);
  } catch (e) {
    console.error("❌ Erreur lors de la migration des produits:", e);
  }

  // 2. Migrer les catégories personnalisées
  try {
    console.log("📁 Migration des catégories...");
    migrated = 0;
    errors = 0;
    
    const categories = JSON.parse(localStorage.getItem("categories") || "[]");
    
    for (const category of categories) {
      try {
        const categoryData = {
          name: category.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
          display_name: category.displayName || category.name,
          is_default: category.isDefault || false,
        };

        const { error } = await supabase.from("categories").insert(categoryData);

        if (error && error.code !== "23505") {
          // Ignorer les doublons (23505)
          throw error;
        }
        migrated++;
      } catch (e) {
        console.error(`❌ Erreur pour la catégorie "${category.name}":`, e);
        errors++;
      }
    }
    console.log(`✅ ${migrated} catégories migrées, ${errors} erreurs`);
  } catch (e) {
    console.error("❌ Erreur lors de la migration des catégories:", e);
  }

  // 3. Migrer les commandes (nécessite des utilisateurs)
  try {
    console.log("📋 Migration des commandes...");
    migrated = 0;
    errors = 0;
    
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    
    for (const order of orders) {
      try {
        const orderData = {
          user_id: order.userId || null,
          client_name: order.clientName || "",
          phone: order.phone || "",
          address: order.address || "",
          total: order.total || 0,
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

        // Migrer les articles de commande
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

        migrated++;
      } catch (e) {
        console.error(`❌ Erreur pour la commande "${order.id}":`, e);
        errors++;
      }
    }
    console.log(`✅ ${migrated} commandes migrées, ${errors} erreurs`);
  } catch (e) {
    console.error("❌ Erreur lors de la migration des commandes:", e);
  }

  console.log("🎉 Migration terminée !");
  console.log("💡 Tu peux maintenant activer Supabase en mettant USE_SUPABASE = true dans supabase-integration.js");
})();

