# 3D model drop-in folder

Put real product models here as `.glb` files (recommended: Draco- or Meshopt-compressed, < 5 MB, real-world scale in metres, +Y up, front facing +Z).

Then point the product at the file in `data/products.json`:

```json
"model3d": { "type": "glb", "glb": "assets/models/neunorton-s9.glb" }
```

The viewer centres the model, puts it on the floor and normalises its size automatically. No code changes are needed. Procedural models are only used when `glb` is `null`.
