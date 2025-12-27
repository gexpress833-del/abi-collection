# Structure des images pour Abi-Collection

Ce dossier contient toutes les images des produits et catégories.

## Organisation recommandée

### Pour les produits individuels

Placez les images des produits dans l'une des structures suivantes :

1. **Par catégorie et nom de produit** (recommandé) :
   ```
   images/
     parfum/
       parfum-elegance-nuit.jpg
       autre-parfum.jpg
     lunette/
       lunettes-lumina-or-rose.jpg
     montre/
       montre-stella-or.jpg
     bague/
       bague-aura-cristal.jpg
     gourmette/
       gourmette-or-lumiere.jpg
     foulard/
       foulard-rose-nebula.jpg
     deodorant/
       deodorant-crystal-fresh.jpg
   ```

2. **Par ID de produit** :
   ```
   images/
     products/
       p_xxxxx_xxxxx.jpg
       p_yyyyy_yyyyy.jpg
   ```

3. **Par catégorie avec sous-dossiers** :
   ```
   images/
     categories/
       parfum/
         parfum-elegance-nuit.jpg
         default.jpg
       lunette/
         lunettes-lumina-or-rose.jpg
         default.jpg
   ```

### Pour les images de catégories

Placez les images représentatives des catégories dans :

```
images/
  categories/
    parfum.jpg
    lunette.jpg
    montre.jpg
    bague.jpg
    gourmette.jpg
    foulard.jpg
    deodorant.jpg
```

Ou dans des sous-dossiers :

```
images/
  categories/
    parfum/
      category.jpg
    lunette/
      category.jpg
```

## Format des noms de fichiers

- Les noms de fichiers sont générés automatiquement à partir du nom du produit
- Les caractères spéciaux sont remplacés par des tirets
- Exemple : "Parfum Élégance Nuit" → `parfum-elegance-nuit.jpg`

## Formats supportés

- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.gif`

## Image par défaut

Si une image de produit n'est pas trouvée, le système utilisera :
- `images/default-product.jpg`

Assurez-vous de créer cette image pour les produits sans image spécifique.

## Notes

- Les images externes (URLs commençant par `http`) sont toujours prioritaires
- Si une image locale est définie dans les données du produit, elle sera utilisée
- Le système essaie automatiquement plusieurs chemins pour trouver les images

