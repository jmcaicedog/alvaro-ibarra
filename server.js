import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUNCE_TO_GRAM = 31.1034768;

async function fetchGoldPriceCOPPerGram() {
  console.log("🔗 Obteniendo precio del oro en COP desde GoldPrice...");

  const apiUrl = "https://data-asg.goldprice.org/dbXRates/COP";
  const apiResponse = await fetch(apiUrl, {
    headers: {
      "Accept": "*/*",
      "Accept-Language": "es-CO,es;q=0.9",
      "Origin": "https://goldprice.org",
      "Referer": "https://goldprice.org/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
    },
  });

  if (!apiResponse.ok) {
    throw new Error(`GoldPrice COP API respondió con status ${apiResponse.status}`);
  }

  const jsonData = await apiResponse.json();

  // Estructura: { "items": [{ "xauPrice": 19065819.2719 }] } - COP por onza troy
  if (
    jsonData &&
    jsonData.items &&
    jsonData.items[0] &&
    jsonData.items[0].xauPrice
  ) {
    const copPerOunce = jsonData.items[0].xauPrice;
    
    if (typeof copPerOunce === "number" && copPerOunce > 10000000) {
      const copPerGram = copPerOunce / OUNCE_TO_GRAM;
      console.log(`✅ GoldPrice COP/g: ${copPerGram.toFixed(2)}`);
      return copPerGram;
    }
  }

  throw new Error("GoldPrice COP: estructura de respuesta inválida");
}

async function fetchTRM() {
  console.log("🔗 Obteniendo TRM desde Banco de Bogotá...");

  const url = "https://pbit.bancodebogota.com/Indicadores/Indicadores.aspx";
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`TRM API respondió con status ${response.status}`);
  }

  const html = await response.text();

  // Buscar valores en formato 3,697.36 o 4,123.45
  const trmMatches = html.match(/([3-5][,][0-9]{3}\.[0-9]{2})/g);
  if (trmMatches) {
    for (const match of trmMatches) {
      const cleaned = match.replace(/,/g, "");
      const val = parseFloat(cleaned);
      if (val >= 3000 && val <= 6000) {
        console.log(`✅ TRM: ${val}`);
        return val;
      }
    }
  }

  throw new Error("TRM: No se encontró valor válido en la página");
}

async function fetchGoldPriceUSDPerOunce() {
  console.log("🔗 Obteniendo precio del oro en USD desde GoldPrice...");

  const apiUrl = "https://data-asg.goldprice.org/dbXRates/USD";
  const apiResponse = await fetch(apiUrl, {
    headers: {
      "Accept": "*/*",
      "Accept-Language": "es-CO,es;q=0.9",
      "Origin": "https://goldprice.org",
      "Referer": "https://goldprice.org/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
    },
  });

  if (!apiResponse.ok) {
    throw new Error(`GoldPrice API respondió con status ${apiResponse.status}`);
  }

  const jsonData = await apiResponse.json();

  if (
    jsonData &&
    jsonData.items &&
    jsonData.items[0] &&
    jsonData.items[0].xauPrice
  ) {
    const usdPerOunce = jsonData.items[0].xauPrice;
    console.log(`✅ GoldPrice USD/oz: ${usdPerOunce}`);
    return usdPerOunce;
  }

  throw new Error("GoldPrice: estructura de respuesta inválida");
}

async function fetchKitcoGoldPrice() {
  console.log("🔗 Obteniendo precio del oro desde Kitco...");

  const url = "https://www.kitco.com/charts/gold";
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(`Kitco respondió con status ${response.status}`);
  }

  const html = await response.text();

  // Buscar precios en formato X,XXX.XX (rango 2000-9000 USD para futuro)
  const patterns = [
    // Patrón para precio como 5,157.40
    /([2-9],[0-9]{3}\.[0-9]{2})/g,
    // Patrón para precio como 5157.40 (sin coma)
    /([2-9][0-9]{3}\.[0-9]{2})/g,
  ];

  for (const pattern of patterns) {
    const matches = html.match(pattern);
    if (matches) {
      for (const match of matches) {
        const price = parseFloat(match.replace(/,/g, ""));
        // Rango razonable para precio del oro en USD/oz
        if (price >= 2000 && price <= 10000) {
          console.log(`✅ Kitco USD/oz: ${price}`);
          return price;
        }
      }
    }
  }

  throw new Error("Kitco: No se encontró precio válido en la página");
}

const app = express();

// Middleware CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  next();
});

// Servir archivos estáticos con headers MIME correctos
app.use(
  express.static(__dirname, {
    setHeaders: (res, path) => {
      if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
      if (path.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html");
      }
    },
  })
);

// Rutas específicas para archivos estáticos
app.get("/styles.css", (req, res) => {
  res.setHeader("Content-Type", "text/css");
  res.sendFile(path.join(__dirname, "styles.css"));
});

app.get("/app.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.sendFile(path.join(__dirname, "app.js"));
});

// API endpoint
app.get("/api/data", async (req, res) => {
  // Función helper para capturar resultado o error
  const safeCall = async (fn, name) => {
    try {
      const value = await fn();
      return { value, error: null };
    } catch (err) {
      console.error(`❌ Error en ${name}:`, err.message);
      return { value: null, error: err.message };
    }
  };

  // Ejecutar todas las llamadas en paralelo
  const [goldCopResult, trmResult, goldUsdResult, kitcoResult] =
    await Promise.all([
      safeCall(fetchGoldPriceCOPPerGram, "GoldPrice COP"),
      safeCall(fetchTRM, "TRM"),
      safeCall(fetchGoldPriceUSDPerOunce, "GoldPrice USD"),
      safeCall(fetchKitcoGoldPrice, "Kitco"),
    ]);

  // Extraer valores (pueden ser null si fallaron)
  const goldCopPerGram = goldCopResult.value;
  const trm = trmResult.value;
  const goldUsdPerOunce = goldUsdResult.value;
  const kitcoUsdPerOunce = kitcoResult.value;

  // Calcular valores derivados solo si tenemos los datos necesarios
  let goldCopPerOunce = null;
  let dollarFinal = null;
  let goldUsdPerGram = null;
  let goldCopPerGramFinal = null;

  if (goldCopPerGram !== null) {
    goldCopPerOunce = goldCopPerGram * OUNCE_TO_GRAM;
  }

  if (trm !== null) {
    dollarFinal = trm - 100;
    if (goldCopPerGram !== null) {
      goldUsdPerGram = goldCopPerGram / trm;
      goldCopPerGramFinal = goldUsdPerGram * dollarFinal;
    }
  }

  res.json({
    source: {
      goldPriceSource: "goldprice.org",
      kitcoSource: "kitco.com",
      trmSource: "pbit.bancodebogota.com",
    },
    raw: {
      goldCopPerGram: goldCopPerGram,
      goldUsdPerOunce: goldUsdPerOunce,
      kitcoUsdPerOunce: kitcoUsdPerOunce,
      trm: trm,
    },
    computed: {
      goldCopPerOunce: goldCopPerOunce !== null ? Number(goldCopPerOunce.toFixed(2)) : null,
      goldCopPerGram: goldCopPerGram !== null ? Number(goldCopPerGram.toFixed(2)) : null,
      goldCopPerGramFinal: goldCopPerGramFinal !== null ? Number(goldCopPerGramFinal.toFixed(2)) : null,
      goldUsdPerOunce: goldUsdPerOunce !== null ? Number(goldUsdPerOunce.toFixed(2)) : null,
      kitcoUsdPerOunce: kitcoUsdPerOunce !== null ? Number(kitcoUsdPerOunce.toFixed(2)) : null,
      ounceToGram: OUNCE_TO_GRAM,
      dollarFinal: dollarFinal !== null ? Number(dollarFinal.toFixed(2)) : null,
    },
    errors: {
      goldCop: goldCopResult.error,
      trm: trmResult.error,
      goldUsd: goldUsdResult.error,
      kitco: kitcoResult.error,
    },
    fetchedAt: new Date().toISOString(),
  });
});

// Ruta de salud para debug
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Ruta principal
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor local corriendo en http://localhost:${PORT}`);
    console.log("📱 Abre la URL en tu navegador para ver la aplicación");
    console.log("🔄 Usa Ctrl+C para detener el servidor");
  });
}

// Export para Vercel
export default app;
