const elGoldGram = document.getElementById("gold-gram");
const elGoldGramFinal = document.getElementById("gold-gram-final");
const elGoldOunce = document.getElementById("gold-ounce");
const elGoldOunceUsd = document.getElementById("gold-ounce-usd");
const elKitcoOunceUsd = document.getElementById("kitco-ounce-usd");
const elTrm = document.getElementById("trm");
const elTrmFinal = document.getElementById("trm-final");
const elFactor = document.getElementById("factor");
const elUpdated = document.getElementById("updated");

// Nuevos elementos para la funcionalidad de porcentajes
const elPercentageInput = document.getElementById("percentage-input");
const elPercentageInputLabel = document.getElementById(
  "percentage-input-label"
);
const elFirstResult = document.getElementById("first-result");
const elFirstResultLabel = document.getElementById("first-result-label");
const elSecondResult = document.getElementById("second-result");
const elSecondResultLabel = document.getElementById("second-result-label");
const elCalculatedResult = document.getElementById("calculated-result");
// Radio selector elements
const elPriceSourceRadios = document.getElementsByName("price-source");

function getSelectedPriceSource() {
  for (const r of elPriceSourceRadios) {
    if (r.checked) return r.value;
  }
  return "TRM"; // default
}

function updateLabels() {
  const source = getSelectedPriceSource();

  if (source === "TRM") {
    elPercentageInputLabel.textContent = "% TRM";
    elFirstResultLabel.textContent = "% Equivalente Gold Price";
    elSecondResultLabel.textContent = "% Equivalente KITCO";
  } else if (source === "GoldPrice") {
    elPercentageInputLabel.textContent = "% Gold Price";
    elFirstResultLabel.textContent = "% Equivalente TRM";
    elSecondResultLabel.textContent = "% Equivalente KITCO";
  } else if (source === "KITCO") {
    elPercentageInputLabel.textContent = "% KITCO";
    elFirstResultLabel.textContent = "% Equivalente TRM";
    elSecondResultLabel.textContent = "% Equivalente Gold Price";
  }
}

function updateCalculatedPrices() {
  if (!currentData) return;

  const source = getSelectedPriceSource();
  const goldOunceUsd = currentData.computed.goldUsdPerOunce;
  const kitcoOunceUsd = currentData.computed.kitcoUsdPerOunce;
  const trm = currentData.raw.trm;
  const trmFinal = currentData.computed.dollarFinal;
  const factor = currentData.computed.ounceToGram;

  let goldCopPerOunce, goldCopPerGramFinal;

  if (source === "TRM") {
    // 1. TRM: Precio por onza = "Precio onza Gold Price (USD)" × "Dólar TRM"
    goldCopPerOunce = goldOunceUsd * trm;
  } else if (source === "GoldPrice") {
    // 2. Gold Price: Precio por onza = "Precio onza Gold Price (USD)" × "Dólar precio final"
    goldCopPerOunce = goldOunceUsd * trmFinal;
  } else if (source === "KITCO") {
    // 3. KITCO: Precio por onza = "Precio onza Kitco (USD)" × "Dólar precio final"
    goldCopPerOunce = kitcoOunceUsd * trmFinal;
  } else {
    // Fallback a TRM
    goldCopPerOunce = goldOunceUsd * trm;
  }

  // Para todos los casos: Precio Oro/g precio final = Precio por onza ÷ Factor
  goldCopPerGramFinal = goldCopPerOunce / factor;

  // Actualizar las casillas calculadas
  elGoldOunce.textContent = "COP " + fmt(goldCopPerOunce.toFixed(2));
  elGoldGramFinal.textContent = "COP " + fmt(goldCopPerGramFinal.toFixed(2));

  // Actualizar currentData para que los cálculos de porcentaje usen los nuevos valores
  currentData.computed.goldCopPerOunce = Number(goldCopPerOunce.toFixed(2));
  currentData.computed.goldCopPerGramFinal = Number(
    goldCopPerGramFinal.toFixed(2)
  );
}

// Cuando cambia la fuente seleccionada, recalcular precios y porcentajes
for (const r of elPriceSourceRadios) {
  r.addEventListener("change", () => {
    console.log("Fuente seleccionada:", getSelectedPriceSource());
    updateLabels();
    updateCalculatedPrices();
    calculatePercentages();
  });
}

function fmt(n) {
  return new Intl.NumberFormat("es-CO").format(n);
}

// Variables globales para almacenar los datos
let currentData = null;

function calculatePercentages() {
  if (!currentData || !elPercentageInput.value) {
    elFirstResult.textContent = "-";
    elSecondResult.textContent = "-";
    elCalculatedResult.textContent = "-";
    return;
  }

  const percentage = parseFloat(elPercentageInput.value);
  if (isNaN(percentage) || percentage < 0 || percentage > 100) {
    elFirstResult.textContent = "Valor inválido";
    elSecondResult.textContent = "-";
    elCalculatedResult.textContent = "-";
    return;
  }

  const source = getSelectedPriceSource();

  // Obtener el valor actual de "Oro (oz)" que corresponde a elGoldGramFinal
  const oroOzText = elGoldGramFinal.textContent.replace("COP ", "");

  // Manejar formato español: 486.320,08 -> 486320.08
  // Reemplazar puntos (separadores de miles) por nada y comas (decimales) por puntos
  const cleanText = oroOzText.replace(/\./g, "").replace(",", ".");
  const oroOzValue = parseFloat(cleanText);

  if (isNaN(oroOzValue)) {
    elFirstResult.textContent = "Error en datos";
    elSecondResult.textContent = "-";
    elCalculatedResult.textContent = "-";
    return;
  }

  // Calcular el resultado en COP aplicando el porcentaje al valor de "Oro (oz)"
  const resultCOP = (oroOzValue * percentage) / 100;

  // Para calcular equivalencias, necesito obtener los valores que tendría "Oro (oz)"
  // para cada fuente, basándome en los datos actuales
  let trmOunceValue, goldPriceOunceValue, kitcoOunceValue;

  if (currentData) {
    const goldPriceUSD = currentData.computed.goldUsdPerOunce;
    const kitcoUSD = currentData.computed.kitcoUsdPerOunce;
    const trm = currentData.raw.trm;
    const trmFinal = currentData.computed.dollarFinal;

    // Estos serían los valores de "Oro (oz)" para cada fuente
    trmOunceValue = (goldPriceUSD * trm) / currentData.computed.ounceToGram;
    goldPriceOunceValue =
      (goldPriceUSD * trmFinal) / currentData.computed.ounceToGram;
    kitcoOunceValue = (kitcoUSD * trmFinal) / currentData.computed.ounceToGram;
  }

  let firstEquivalent, secondEquivalent;

  if (source === "TRM") {
    // Input es % TRM - calcular equivalentes para Gold Price y KITCO
    firstEquivalent = (resultCOP / goldPriceOunceValue) * 100; // % Gold Price
    secondEquivalent = (resultCOP / kitcoOunceValue) * 100; // % KITCO
  } else if (source === "GoldPrice") {
    // Input es % Gold Price - calcular equivalentes para TRM y KITCO
    firstEquivalent = (resultCOP / trmOunceValue) * 100; // % TRM
    secondEquivalent = (resultCOP / kitcoOunceValue) * 100; // % KITCO
  } else if (source === "KITCO") {
    // Input es % KITCO - calcular equivalentes para TRM y Gold Price
    firstEquivalent = (resultCOP / trmOunceValue) * 100; // % TRM
    secondEquivalent = (resultCOP / goldPriceOunceValue) * 100; // % Gold Price
  }

  // Mostrar los resultados
  elFirstResult.textContent = firstEquivalent.toFixed(2) + "%";
  elSecondResult.textContent = secondEquivalent.toFixed(2) + "%";
  elCalculatedResult.textContent = "COP " + fmt(resultCOP.toFixed(2));
}

async function load() {
  try {
    const r = await fetch("/api/data");
    const j = await r.json();
    if (r.status !== 200) throw new Error(j.error || "Error al obtener datos");

    // Almacenar los datos globalmente para los cálculos de porcentaje
    currentData = j;

    const gPerOunce = j.computed.ounceToGram;
    const goldGram = j.computed.goldCopPerGram;
    const goldGramFinal = j.computed.goldCopPerGramFinal;
    const goldOunce = j.computed.goldCopPerOunce;
    const goldOunceUsd = j.computed.goldUsdPerOunce;
    const kitcoOunceUsd = j.computed.kitcoUsdPerOunce;
    const trm = j.raw.trm;
    const trmFinal = j.computed.dollarFinal;

    elGoldGram.textContent = "COP " + fmt(goldGram.toFixed(2));
    elGoldOunceUsd.textContent = "USD " + fmt(goldOunceUsd.toFixed(2));
    elKitcoOunceUsd.textContent = "USD " + fmt(kitcoOunceUsd.toFixed(2));
    elTrm.textContent = "COP " + fmt(trm.toFixed(2));
    elTrmFinal.textContent = "COP " + fmt(trmFinal.toFixed(2));
    elFactor.textContent = gPerOunce;
    elUpdated.textContent = new Date(j.fetchedAt).toLocaleString();

    // Calcular precios según la fuente seleccionada
    updateCalculatedPrices();

    // Inicializar etiquetas dinámicas
    updateLabels();

    // Recalcular porcentajes si hay un valor en el input
    calculatePercentages();
  } catch (err) {
    elGoldGram.textContent = "Error";
    elGoldGramFinal.textContent = "Error";
    elGoldOunce.textContent = "Error";
    elGoldOunceUsd.textContent = "Error";
    elKitcoOunceUsd.textContent = "Error";
    elTrm.textContent = "Error";
    elTrmFinal.textContent = "Error";
    elUpdated.textContent = err.message;
    console.error(err);
    currentData = null;
  }
}

// Event listener para el input de porcentaje
elPercentageInput.addEventListener("input", calculatePercentages);

load();
