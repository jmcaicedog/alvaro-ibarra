# Precio Oro - El Coronel

Aplicación web optimizada para móvil que muestra precios actualizados del oro en pesos colombianos.

## Funcionalidades

- **Precio Oro/g Gold Price (COP)**: Precio oficial por gramo desde goldprice.org
- **Dólar TRM**: Tasa representativa del mercado desde Banco de Bogotá
- **Dólar precio final**: TRM - 100 (tasa preferencial)
- **Factor onzas Troy → gramos**: 31.1034768
- **Precio por onza (COP)**: Precio por onza completa
- **Precio Oro/g precio final (COP)**: Precio por gramo con tasa preferencial

## Desarrollo Local

### Requisitos

- Node.js 14+ instalado

### Instalación y ejecución

```bash
npm install
npm start
```

Abrir en el navegador: http://localhost:3001

## Deployment en Vercel

### Opción 1: Desde GitHub

1. Subir el proyecto a un repositorio de GitHub
2. Conectar el repositorio a Vercel desde https://vercel.com
3. Vercel detectará automáticamente la configuración y hará el deploy

### Opción 2: CLI de Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde la carpeta del proyecto
vercel

# Seguir las instrucciones en pantalla
```

### Estructura para Vercel

```
├── api/
│   └── data.js          # Función serverless para datos
├── public/
│   ├── app.js           # JavaScript del frontend
│   └── styles.css       # Estilos CSS
├── index.html           # Página principal
├── vercel.json          # Configuración de Vercel
└── package.json         # Dependencias y scripts
```

## Notas Técnicas

- **APIs**: Hace scraping de goldprice.org y pbit.bancodebogota.com
- **Serverless**: Optimizado para funciones serverless de Vercel
- **CORS**: Habilitado para requests cross-origin
- **Responsive**: Diseño optimizado para dispositivos móviles
- **Fallbacks**: Valores de referencia si las APIs fallan

## URLs de Producción

Una vez desplegado en Vercel, la aplicación estará disponible en:

- `https://tu-proyecto.vercel.app`
- API endpoint: `https://tu-proyecto.vercel.app/api/data`
