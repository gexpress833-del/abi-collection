// Configuration Supabase pour Abi-Collection
// Remplace ces valeurs par tes propres clés Supabase

const SUPABASE_CONFIG = {
  url: "https://ulfprhnyhrsoqggkhhdj.supabase.co", // Exemple: https://xxxxx.supabase.co
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZnByaG55aHJzb3FnZ2toaGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODgzNjcsImV4cCI6MjA4MjM2NDM2N30.VC___nORowaUZKttzXBmscH1JMvIGVAHJmZ9QadYrk8", // Clé publique anonyme
};

// Initialisation du client Supabase
let supabaseClient = null;

function initSupabase() {
  if (typeof supabase !== "undefined") {
    supabaseClient = supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey
    );
    console.log("Supabase initialisé");
    return true;
  } else {
    console.error("Bibliothèque Supabase non chargée");
    return false;
  }
}

// Fonction pour vérifier la connexion
async function testSupabaseConnection() {
  if (!supabaseClient) {
    initSupabase();
  }
  
  try {
    const { data, error } = await supabaseClient.from("products").select("count").limit(1);
    if (error) {
      console.error("Erreur de connexion Supabase:", error);
      return false;
    }
    console.log("Connexion Supabase réussie");
    return true;
  } catch (e) {
    console.error("Erreur lors du test de connexion:", e);
    return false;
  }
}

