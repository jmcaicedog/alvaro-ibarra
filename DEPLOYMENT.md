# Guía de Deployment en Vercel

## 📦 Preparación del Proyecto

El proyecto ya está configurado para Vercel con:

- ✅ Función serverless en `api/data.js`
- ✅ Archivos estáticos en `public/`
- ✅ Configuración `vercel.json`
- ✅ HTML principal en la raíz
- ✅ CORS habilitado
- ✅ Dependencias actualizadas

## 🚀 Deployment

### Método 1: GitHub + Vercel (Recomendado)

1. **Crear repositorio en GitHub:**

   ```bash
   git init
   git add .
   git commit -m "Initial commit - Precio Oro app"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/precio-oro.git
   git push -u origin main
   ```

2. **Conectar a Vercel:**
   - Ir a https://vercel.com
   - Hacer clic en "New Project"
   - Importar desde GitHub
   - Seleccionar el repositorio
   - ¡Deploy automático!

### Método 2: CLI de Vercel

1. **Instalar CLI:**

   ```bash
   npm i -g vercel
   ```

2. **Deploy:**

   ```bash
   vercel
   ```

3. **Seguir instrucciones:**
   - Login con GitHub/email
   - Confirmar configuración del proyecto
   - ¡Listo!

## 🌐 URLs Resultantes

Después del deployment tendrás:

- **App:** `https://tu-proyecto.vercel.app`
- **API:** `https://tu-proyecto.vercel.app/api/data`

## ⚡ Funcionalidades en Producción

- ✅ Scraping automático de goldprice.org
- ✅ Scraping automático de Banco de Bogotá
- ✅ Cálculos automáticos de precios
- ✅ UI responsive para móviles
- ✅ Actualización en tiempo real
- ✅ Fallbacks si las APIs fallan

## 🛠️ Monitoreo

En el dashboard de Vercel puedes ver:

- Logs de las funciones serverless
- Métricas de uso
- Errores en tiempo real
- Analytics de visitantes

## 🔧 Troubleshooting

**Si el scraping falla:**

- Los valores de fallback se activarán automáticamente
- Revisar logs en Vercel dashboard
- Las páginas target pueden haber cambiado estructura

**Para updates:**

- Push a GitHub = auto-redeploy
- O usar `vercel --prod` para deployment directo
