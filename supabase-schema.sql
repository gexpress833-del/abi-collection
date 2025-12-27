-- Schéma de base de données Supabase pour Abi-Collection
-- Exécute ces commandes dans l'éditeur SQL de Supabase

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Prix en CDF
  category VARCHAR(50) REFERENCES categories(name),
  image TEXT, -- URL ou data URL base64
  stock INTEGER, -- NULL = stock illimité
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des utilisateurs (utilise l'auth de Supabase)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  client_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  total INTEGER NOT NULL, -- Total en CDF
  status VARCHAR(50) DEFAULT 'en attente', -- en attente, livré, annulé
  payment_status VARCHAR(50) DEFAULT 'non payé', -- non payé, payé
  payment_method VARCHAR(50), -- mobile_money, cash, etc.
  payment_reference VARCHAR(255),
  paid_amount INTEGER,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des articles de commande
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL, -- Sauvegarde du nom au moment de la commande
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL, -- Prix unitaire au moment de la commande
  total INTEGER NOT NULL, -- Total pour cet article
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table du panier (pour chaque utilisateur)
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Table des identifiants admin (pour l'authentification admin)
CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- Hash du mot de passe (utiliser bcrypt)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Politiques de sécurité
-- Activer RLS sur toutes les tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Politiques pour categories (lecture publique)
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Politique pour permettre l'insertion de catégories (pour la migration)
CREATE POLICY "Categories can be inserted by anyone" ON categories
  FOR INSERT WITH CHECK (true);

-- Politiques pour products (lecture publique)
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Politique pour permettre l'insertion de produits (pour la migration et l'admin)
CREATE POLICY "Products can be inserted by anyone" ON products
  FOR INSERT WITH CHECK (true);

-- Politique pour permettre la mise à jour de produits (pour l'admin)
CREATE POLICY "Products can be updated by anyone" ON products
  FOR UPDATE USING (true);

-- Politique pour permettre la suppression de produits (pour l'admin)
CREATE POLICY "Products can be deleted by anyone" ON products
  FOR DELETE USING (true);

-- Politiques pour user_profiles (lecture/écriture par l'utilisateur)
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques pour orders (lecture/écriture par l'utilisateur)
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Politique pour permettre l'insertion de commandes (pour la migration et les commandes anonymes)
CREATE POLICY "Orders can be created by anyone" ON orders
  FOR INSERT WITH CHECK (true);

-- Politique pour permettre la lecture de toutes les commandes (pour l'admin)
CREATE POLICY "All orders are viewable" ON orders
  FOR SELECT USING (true);

-- Politiques pour order_items (lecture par l'utilisateur propriétaire de la commande)
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

-- Politique pour permettre l'insertion d'articles de commande (pour la migration)
CREATE POLICY "Order items can be inserted by anyone" ON order_items
  FOR INSERT WITH CHECK (true);

-- Politique pour permettre la lecture de tous les articles de commande (pour l'admin)
CREATE POLICY "All order items are viewable" ON order_items
  FOR SELECT USING (true);

-- Politiques pour cart_items (lecture/écriture par l'utilisateur)
CREATE POLICY "Users can view own cart" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Insérer les catégories par défaut
INSERT INTO categories (name, display_name, is_default) VALUES
  ('parfum', 'Parfum', true),
  ('lunette', 'Lunette', true),
  ('montre', 'Montre', true),
  ('bague', 'Bague', true),
  ('gourmette', 'Gourmette', true),
  ('foulard', 'Foulard', true),
  ('deodorant', 'Déodorant', true)
ON CONFLICT (name) DO NOTHING;

