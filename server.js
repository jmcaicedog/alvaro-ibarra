import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUNCE_TO_GRAM = 31.1034768;

async function fetchGoldPriceCOPPerGram() {
  try {
    const url = "https://goldprice.org/gold-price-per-gram.html";
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const html = await response.text();

    const priceMatches = html.match(/([45][0-9]{5}[,.]?[0-9]{0,2})/g);
    if (priceMatches) {
      for (const match of priceMatches) {
        const cleaned = match.replace(/[,]/g, "");
        const num = parseFloat(cleaned);
        if (num >= 400000 && num <= 600000) {
          console.log(`Precio del oro por gramo encontrado: COP ${num}`);
          return num;
        }
      }
    }

    throw new Error("No se encontró precio del gramo en COP");
  } catch (error) {
    console.warn("Error al obtener precio del oro:", error.message);
    console.log("Usando precio de referencia actual: COP 511,775.46");
    return 511775.46;
  }
}

async function fetchTRM() {
  try {
    const url = "https://pbit.bancodebogota.com/Indicadores/Indicadores.aspx";
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const html = await response.text();

    const trmMatches = html.match(/([3-4][,\.]?[0-9]{3}[,\.]?[0-9]{2})/g);
    if (trmMatches) {
      for (const match of trmMatches) {
        const cleaned = match.replace(/,/g, "");
        const val = parseFloat(cleaned);
        if (val >= 3000 && val <= 4500) {
          console.log(`TRM encontrada: ${val}`);
          return val;
        }
      }
    }

    throw new Error("No se encontró TRM válida");
  } catch (error) {
    console.warn("Error al obtener TRM:", error.message);
    console.log("Usando TRM de referencia: 3876.60");
    return 3876.6;
  }
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
  try {
    const [goldCopPerGram, trm] = await Promise.all([
      fetchGoldPriceCOPPerGram(),
      fetchTRM(),
    ]);

    const goldCopPerOunce = goldCopPerGram * OUNCE_TO_GRAM;
    const dollarFinal = trm - 100;
    const goldUsdPerGram = goldCopPerGram / trm;
    const goldCopPerGramFinal = goldUsdPerGram * dollarFinal;

    res.json({
      source: {
        goldPriceSource: "goldprice.org/gold-price-per-gram.html",
        trmSource: "pbit.bancodebogota.com",
      },
      raw: {
        goldCopPerGram: goldCopPerGram,
        trm: trm,
      },
      computed: {
        goldCopPerOunce: Number(goldCopPerOunce.toFixed(2)),
        goldCopPerGram: Number(goldCopPerGram.toFixed(2)),
        goldCopPerGramFinal: Number(goldCopPerGramFinal.toFixed(2)),
        ounceToGram: OUNCE_TO_GRAM,
        dollarFinal: Number(dollarFinal.toFixed(2)),
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
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
