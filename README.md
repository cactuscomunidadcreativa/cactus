# Cactus Comunidad Creativa - Sitio Web

Sitio web moderno para agencia de marketing y comunicaciones potenciada por IA.

## Archivos del Proyecto

```
cactus/
├── index.html          # Página principal
├── admin.html          # Panel de administración (guía)
├── styles.css          # Estilos CSS
├── main.js             # JavaScript principal
├── chatbot.js          # Chatbot con IA
├── data.js             # DATOS EDITABLES (contenido, traducciones)
├── MODELO_NEGOCIO.md   # Documentación del modelo de negocio
├── BENCHMARK.md        # Análisis competitivo
└── README.md           # Este archivo
```

## Cómo Iniciar

1. Abre `index.html` en un navegador para ver el sitio
2. Abre `admin.html` para ver la guía de administración

## Cómo Editar el Contenido

**Todo el contenido editable está en `data.js`**

### Cambiar información de contacto:
```javascript
GLOBAL_DATA.company = {
    name: "Cactus",
    email: "tuemail@ejemplo.com",
    phone: "+1 234 567 8900",
    whatsapp: "12345678900"  // Solo números
}
```

### Cambiar redes sociales:
```javascript
GLOBAL_DATA.social = {
    instagram: "https://instagram.com/tuusuario",
    linkedin: "https://linkedin.com/company/tuempresa",
    tiktok: "https://tiktok.com/@tuusuario"
}
```

### Cambiar estadísticas del hero:
```javascript
GLOBAL_DATA.stats = {
    clients: 50,     // Número de clientes
    projects: 200,   // Número de proyectos
    countries: 15    // Número de países
}
```

### Cambiar precios:
```javascript
GLOBAL_DATA.pricing = {
    currency: "USD",
    starter: { monthly: 500, annual: 400 },
    growth: { monthly: 1500, annual: 1200 },
    scale: { monthly: 3500, annual: 2800 }
}
```

### Agregar proyecto al portafolio:
1. En `GLOBAL_DATA.portfolio` agrega:
```javascript
{
    id: 7,
    category: "social",  // social, automation, content, strategy
    image: "https://url-de-tu-imagen.jpg"
}
```

2. En `TRANSLATIONS.es.portfolio.items` agrega:
```javascript
{
    id: 7,
    title: "Nombre del Proyecto",
    description: "Descripción del proyecto"
}
```

3. Repite el paso 2 para `en` y `pt`

## Multi-Idioma

El sitio soporta 3 idiomas:
- Español (es) - Por defecto
- English (en)
- Português (pt)

### Cambiar idioma por defecto:
```javascript
const DEFAULT_LANG = 'es';  // Cambia a 'en' o 'pt'
```

### Agregar un nuevo idioma:
1. En `AVAILABLE_LANGUAGES` agrega: `fr: { name: 'Français', flag: '🇫🇷' }`
2. Copia toda la estructura de `TRANSLATIONS.es` a `TRANSLATIONS.fr`
3. Traduce todos los textos

## Chatbot

El chatbot responde automáticamente basado en palabras clave.

### Personalizar respuestas:
Edita `TRANSLATIONS.es.chatbot.responses` (y otros idiomas)

### Agregar palabras clave:
Edita `chatbot.js` en la función `getResponse()`

## Despliegue

El sitio es estático (HTML/CSS/JS puro), puedes desplegarlo en:

- **GitHub Pages**: Gratis, solo sube los archivos
- **Netlify**: Gratis, drag & drop
- **Vercel**: Gratis, conecta con GitHub
- **Cualquier hosting**: Sube los archivos por FTP

## Personalización Avanzada

### Colores (en styles.css):
```css
:root {
    --primary: #00D9FF;      /* Cyan - color principal */
    --secondary: #7C3AED;    /* Violeta */
    --accent: #F472B6;       /* Rosa */
}
```

### Fuentes:
El sitio usa:
- Space Grotesk (títulos)
- Inter (texto)

Puedes cambiarlas en el `<head>` de `index.html`

## Soporte

Para problemas técnicos o preguntas sobre el código, consulta la documentación en `admin.html`.

---

Creado con IA para Cactus Comunidad Creativa
