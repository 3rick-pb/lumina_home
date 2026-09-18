# 🤖 Guía del IA Brand Analyzer — Extracción de Identidad Visual

Esta guía detalla el protocolo para transformar capturas de pantalla (Instagram, feed, logo, catálogo, fotos de producto) en un **Brand Package** funcional para el E-Commerce Core Engine.

---

## 🎯 Principio Fundamental: NO INVENTAR INFORMACIÓN

El análisis mediante IA clasifica cada dato en uno de cuatro niveles de certeza:

| Nivel de Certeza | Significado | Ejemplo |
|:---|:---|:---|
| **`CONFIRMED`** | Visible directamente en el material o suministrado explícitamente por el cliente. | Nombre en el logo, URL web, teléfono en bio de Instagram. |
| **`INFERRED`** | Conclusión visual razonable con base empírica en las imágenes. | Colores dominantes del feed, estilo editorial de fotografía. |
| **`PROPOSED`** | Recomendación estratégica o creativa de la IA compatible con el Core. | Variante de Hero recomendada, slogan sugerido, tono de voz. |
| **`NEEDS_INFO`** | Información indispensable que no se puede deducir y requiere confirmación humana. | RUC para PayPhone, credenciales de correo SMTP, cuenta bancaria. |

Cada campo inferido o propuesto incluye un índice de confianza (**`confidence`**) entre `0.0` y `1.0`.

---

## 📋 Flujo de Trabajo

```
   1. Capturas de Instagram / Logos / Fotos
                      ↓
   2. Prompt Maestro en Gemini (con las imágenes)
                      ↓
   3. Generación de `brand-analysis.json` + `brand-analysis.md`
                      ↓
   4. Revisión Humana (Aprobación)
                      ↓
   5. Generador: .\brand.ps1 create "Marca" -Analysis ".\brand-analysis.json"
                      ↓
   6. Validación: .\brand.ps1 validate "slug"
                      ↓
   7. Previsualización: .\brand.ps1 preview "slug"
                      ↓
   8. Activación: .\brand.ps1 activate "slug"
```

---

## 📝 Prompt Maestro para Copiar y Pegar en Gemini

Cuando tengas imágenes de una marca (screenshot de Instagram, logo, fotos), abre una conversación con Gemini, adjunta las imágenes y pega el siguiente prompt:

```markdown
Actúa como Brand Visual Architect y Diseñador de Sistemas UI/UX para un motor E-Commerce Core.
Analiza las imágenes adjuntas (capturas de Instagram, logotipo, fotografías de productos o feed de la marca).

REGLAS ESTRICTAS:
1. NO INVENTES DATOS. Clasifica cada atributo en:
   - CONFIRMED: Texto o elementos 100% legibles en las imágenes.
   - INFERRED: Deducción visual directa (ej. paleta de color dominante extraída).
   - PROPOSED: Tu recomendación técnica para adaptar la marca al motor e-commerce.
   - NEEDS_INFO: Datos faltantes que el dueño de la marca debe proporcionar.
2. Añade un "confidence" (0.0 a 1.0) en cada deducción.
3. Las variantes de UI DEBEN seleccionarse exclusivamente del catálogo existente del Core:
   - headerStyle: 'floating-glass-pill' | 'fixed-minimal' | 'centered-classic'
   - heroStyle: 'immersive-glass' | 'split-editorial' | 'minimal-banner'
   - productCardStyle: 'luxury-editorial' | 'compact-grid' | 'minimal-modern'

Entrega DOS artefactos:
1. Un archivo JSON válido llamado `brand-analysis.json` con la estructura exacta:
{
  "brandId": "slug-de-la-marca",
  "sourceType": "instagram",
  "analyzedAt": "2026-09-18T00:00:00.000Z",
  "identity": {
    "name": { "value": "Nombre Marca", "status": "CONFIRMED", "confidence": 1.0 },
    "shortName": { "value": "NombreCorto", "status": "INFERRED", "confidence": 0.9 },
    "tagline": { "value": "Tagline detectado o propuesto", "status": "PROPOSED", "confidence": 0.8 },
    "slogan": { "value": "Slogan detectado o propuesto", "status": "PROPOSED", "confidence": 0.75 },
    "description": { "value": "Descripción basada en la biografía", "status": "CONFIRMED", "confidence": 1.0 },
    "niche": { "value": "Moda / Textiles / Joyería", "status": "CONFIRMED", "confidence": 1.0 },
    "toneOfVoice": { "value": "Sofisticado, minimalista, cercano", "status": "INFERRED", "confidence": 0.85 }
  },
  "visual": {
    "primaryColor": { "value": "#HEX", "status": "INFERRED", "confidence": 0.95 },
    "accentColor": { "value": "#HEX", "status": "INFERRED", "confidence": 0.90 },
    "brandAccent": { "value": "#HEX", "status": "PROPOSED", "confidence": 0.80 },
    "heroGold": { "value": "#HEX", "status": "PROPOSED", "confidence": 0.70 },
    "surface": {
      "backgroundLight": { "value": "#f8f9fa", "status": "PROPOSED", "confidence": 0.9 },
      "backgroundDark": { "value": "#161618", "status": "PROPOSED", "confidence": 0.9 }
    },
    "typography": {
      "candidateHeadingFont": { "value": "Lora", "status": "PROPOSED", "confidence": 0.75 },
      "candidateBodyFont": { "value": "Inter", "status": "PROPOSED", "confidence": 0.90 },
      "fontStyle": { "value": "editorial", "status": "INFERRED", "confidence": 0.85 }
    },
    "photographyStyle": { "value": "Luz natural, encuadres abiertos, lino", "status": "INFERRED", "confidence": 0.9 },
    "artDirection": { "value": "Minimalismo cálido, espacios negativos", "status": "INFERRED", "confidence": 0.88 }
  },
  "ecommerce": {
    "recommendedVariants": {
      "headerStyle": { "value": "floating-glass-pill", "status": "PROPOSED", "confidence": 0.85 },
      "heroStyle": { "value": "split-editorial", "status": "PROPOSED", "confidence": 0.85 },
      "productCardStyle": { "value": "luxury-editorial", "status": "PROPOSED", "confidence": 0.90 }
    }
  },
  "store": {
    "currency": { "value": { "code": "USD", "symbol": "$", "decimals": 2 }, "status": "PROPOSED", "confidence": 0.95 },
    "regional": { "value": { "country": "Ecuador", "countryCode": "EC", "locale": "es-EC", "defaultCity": "Quito" }, "status": "INFERRED", "confidence": 0.8 }
  },
  "missingInfo": [
    "Teléfono o WhatsApp oficial para pedidos",
    "RUC para pasarela de pagos PayPhone",
    "Credenciales de correo transaccional SMTP"
  ]
}

2. Un reporte ejecutivo en Markdown llamado `brand-analysis.md` explicando cada hallazgo y recomendación visual.
```

---

## ⚡ Ingesta en el Brand Generator

Una vez que guardes el `brand-analysis.json`, ejecutas:

```powershell
.\brand.ps1 create "Aura Studio" -Analysis ".\brand-analysis.json"
```

El motor automáticamente:
1. Extrae los colores primario y acento.
2. Genera las escalas tonales completas de 50 a 900 matemáticamente balanceadas.
3. Genera `brand.ts`, `theme.ts`, `store.ts`, `manifest.json` y `README.md`.
4. Deja registradas las advertencias y campos pendientes en el manifiesto.
