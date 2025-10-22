import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const OUNCE_TO_GRAM = 31.1034768;

async function fetchGoldPriceCOPPerGram() {
  try {
    const url = "https://goldprice.org/gold-price-per-gram.html";
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 8000,
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const bodyText = $("body").text();

    const priceMatches = bodyText.match(/([45][0-9]{5}[,.]?[0-9]{0,2})/g);
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

    const bodyTextClean = bodyText.replace(/,/g, "");
    const altMatches = bodyTextClean.match(/([45][0-9]{5}[.]?[0-9]{0,2})/g);
    if (altMatches) {
      for (const match of altMatches) {
        const num = parseFloat(match);
        if (num >= 400000 && num <= 600000) {
          console.log(`Precio del oro por gramo encontrado (alt): COP ${num}`);
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
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 8000,
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const bodyText = $("body").text();

    const strategies = [
      () => {
        const matches = bodyText.match(
          /TRM[\s\S]{0,50}?([3-4][,\.]?[0-9]{3}[,\.]?[0-9]{2})/gi
        );
        if (matches) {
          for (const match of matches) {
            const numMatch = match.match(/([3-4][,\.]?[0-9]{3}[,\.]?[0-9]{2})/);
            if (numMatch) {
              let cleaned = numMatch[1].replace(/,/g, "");
              if (cleaned.includes(".") && cleaned.split(".")[1].length === 2) {
                const val = parseFloat(cleaned);
                if (val >= 3000 && val <= 4500) {
                  return val;
                }
              }
            }
          }
        }
        return null;
      },

      () => {
        const matches = bodyText.match(
          /\$\s*([3-4][,]?[0-9]{3}[.]?[0-9]{0,2})/g
        );
        if (matches) {
          for (const match of matches) {
            const numStr = match.replace("$", "").trim().replace(/,/g, "");
            const val = parseFloat(numStr);
            if (val >= 3000 && val <= 4500) {
              return val;
            }
          }
        }
        return null;
      },

      () => {
        const rows = $("tr, td").filter((i, el) => {
          const text = $(el).text().toLowerCase();
          return text.includes("trm") || text.includes("tasa");
        });

        for (let i = 0; i < rows.length; i++) {
          const rowText = $(rows[i]).text();
          const numMatch = rowText.match(/([3-4][,\.]?[0-9]{3}[,\.]?[0-9]{2})/);
          if (numMatch) {
            const cleaned = numMatch[1].replace(/,/g, "");
            const val = parseFloat(cleaned);
            if (val >= 3000 && val <= 4500) {
              return val;
            }
          }
        }
        return null;
      },
    ];

    for (const strategy of strategies) {
      const result = strategy();
      if (result) {
        console.log(`TRM encontrada: ${result}`);
        return result;
      }
    }

    throw new Error("No se encontró TRM válida");
  } catch (error) {
    console.warn("Error al obtener TRM:", error.message);
    console.log("Usando TRM de referencia: 3876.60");
    return 3876.6;
  }
}

async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

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
}

export default handler;
