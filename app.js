const elGoldGram = document.getElementById("gold-gram");
const elGoldGramFinal = document.getElementById("gold-gram-final");
const elGoldOunce = document.getElementById("gold-ounce");
const elTrm = document.getElementById("trm");
const elTrmFinal = document.getElementById("trm-final");
const elFactor = document.getElementById("factor");
const elUpdated = document.getElementById("updated");

function fmt(n) {
  return new Intl.NumberFormat("es-CO").format(n);
}

async function load() {
  try {
    const r = await fetch("/api/data");
    const j = await r.json();
    if (r.status !== 200) throw new Error(j.error || "Error al obtener datos");

    const gPerOunce = j.computed.ounceToGram;
    const goldGram = j.computed.goldCopPerGram;
    const goldGramFinal = j.computed.goldCopPerGramFinal;
    const goldOunce = j.computed.goldCopPerOunce;
    const trm = j.raw.trm;
    const trmFinal = j.computed.dollarFinal;

    elGoldGram.textContent = "COP " + fmt(goldGram.toFixed(2));
    elGoldGramFinal.textContent = "COP " + fmt(goldGramFinal.toFixed(2));
    elGoldOunce.textContent = "COP " + fmt(goldOunce.toFixed(2));
    elTrm.textContent = "COP " + fmt(trm.toFixed(2));
    elTrmFinal.textContent = "COP " + fmt(trmFinal.toFixed(2));
    elFactor.textContent = gPerOunce;
    elUpdated.textContent = new Date(j.fetchedAt).toLocaleString();
  } catch (err) {
    elGoldGram.textContent = "Error";
    elGoldGramFinal.textContent = "Error";
    elGoldOunce.textContent = "Error";
    elTrm.textContent = "Error";
    elTrmFinal.textContent = "Error";
    elUpdated.textContent = err.message;
    console.error(err);
  }
}

load();
