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
const elDollarTypeRadios = document.getElementsByName("dollar-type");

function getSelectedPriceSource() {
  for (const r of elPriceSourceRadios) {
    if (r.checked) return r.value;
  }
  return "TRM"; // default
}

function getSelectedDollarType() {
  for (const r of elDollarTypeRadios) {
    if (r.checked) return r.value;
  }
  return "full"; // default
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
  const dollarType = getSelectedDollarType();
  const goldOunceUsd = currentData.computed.goldUsdPerOunce;
  const kitcoOunceUsd = currentData.computed.kitcoUsdPerOunce;
  const trm = currentData.raw.trm;
  const trmFinal = currentData.computed.dollarFinal;
  const factor = currentData.computed.ounceToGram;

  // Determinar qué tasa de cambio usar según el tipo de dólar seleccionado
  const exchangeRate = dollarType === "full" ? trm : trmFinal;

  let goldCopPerOunce, goldCopPerGramFinal;

  if (source === "TRM") {
    // TRM: Precio por onza = "Precio onza Gold Price (USD)" × tasa de cambio
    goldCopPerOunce = goldOunceUsd * exchangeRate;
  } else if (source === "GoldPrice") {
    // Gold Price: Precio por onza = "Precio onza Gold Price (USD)" × tasa de cambio
    goldCopPerOunce = goldOunceUsd * exchangeRate;
  } else if (source === "KITCO") {
    // KITCO: Precio por onza = "Precio onza Kitco (USD)" × tasa de cambio
    goldCopPerOunce = kitcoOunceUsd * exchangeRate;
  } else {
    // Fallback a TRM
    goldCopPerOunce = goldOunceUsd * exchangeRate;
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

  // Determinar qué valor usar para el cálculo del porcentaje según la fuente seleccionada
  let baseValueText;
  if (source === "GoldPrice") {
    // Para Gold Price, usar el valor de la primera card "Oro (g) Gold Price"
    baseValueText = elGoldGram.textContent.replace("COP ", "");
  } else {
    // Para TRM y KITCO, usar el valor de "Oro (oz)" como antes
    baseValueText = elGoldGramFinal.textContent.replace("COP ", "");
  }

  // Manejar formato español: 486.320,08 -> 486320.08
  // Reemplazar puntos (separadores de miles) por nada y comas (decimales) por puntos
  const cleanText = baseValueText.replace(/\./g, "").replace(",", ".");
  const baseValue = parseFloat(cleanText);

  if (isNaN(baseValue)) {
    elFirstResult.textContent = "Error en datos";
    elSecondResult.textContent = "-";
    elCalculatedResult.textContent = "-";
    return;
  }

  // Calcular el resultado en COP aplicando el porcentaje al valor base
  const resultCOP = (baseValue * percentage) / 100;

  // Para calcular equivalencias, necesito los valores que tendría cada fuente cuando está seleccionada
  // Pero TODOS normalizados a la misma unidad (por onza)
  let trmBaseValue, goldPriceBaseValue, kitcoBaseValue;

  if (currentData) {
    const goldPriceUSD = currentData.computed.goldUsdPerOunce;
    const kitcoUSD = currentData.computed.kitcoUsdPerOunce;
    const dollarType = getSelectedDollarType();
    const trm = currentData.raw.trm;
    const trmFinal = currentData.computed.dollarFinal;
    const factor = currentData.computed.ounceToGram;

    // Determinar qué tasa de cambio usar según el tipo de dólar seleccionado
    const exchangeRate = dollarType === "full" ? trm : trmFinal;

    // Calcular los valores base que tendría cada fuente cuando está seleccionada:
    // TODOS NORMALIZADOS A "POR ONZA" para hacer equivalencias justas

    // TRM: usa Gold Price USD con la tasa de cambio seleccionada, valor por onza
    trmBaseValue = (goldPriceUSD * exchangeRate) / factor;

    // Gold Price: usa Gold Price USD con la tasa de cambio seleccionada, valor por onza
    goldPriceBaseValue = (goldPriceUSD * exchangeRate) / factor;

    // KITCO: usa Kitco USD con la tasa de cambio seleccionada, valor por onza
    kitcoBaseValue = (kitcoUSD * exchangeRate) / factor;

    // Debug para entender los valores
    console.log("Debug equivalencias:", {
      source,
      goldPriceUSD,
      kitcoUSD,
      exchangeRate,
      factor,
      trmBaseValue,
      goldPriceBaseValue,
      kitcoBaseValue,
      resultCOP,
    });
  }

  let firstEquivalent, secondEquivalent;

  if (source === "TRM") {
    // Input es % TRM (sobre Oro oz) - calcular qué % equivale en otras fuentes
    firstEquivalent = (resultCOP / goldPriceBaseValue) * 100; // % equivalente en Gold Price (normalizado a oz)
    secondEquivalent = (resultCOP / kitcoBaseValue) * 100; // % equivalente en KITCO (sobre Oro oz)
  } else if (source === "GoldPrice") {
    // Input es % Gold Price (sobre Oro g) - resultCOP ya está en escala de gramos
    // No necesito multiplicar por factor, las equivalencias son directas
    firstEquivalent = (resultCOP / trmBaseValue) * 100; // % equivalente en TRM (sobre Oro oz)
    secondEquivalent = (resultCOP / kitcoBaseValue) * 100; // % equivalente en KITCO (sobre Oro oz)
  } else if (source === "KITCO") {
    // Input es % KITCO (sobre Oro oz) - calcular qué % equivale en otras fuentes
    firstEquivalent = (resultCOP / trmBaseValue) * 100; // % equivalente en TRM (sobre Oro oz)
    secondEquivalent = (resultCOP / goldPriceBaseValue) * 100; // % equivalente en Gold Price (normalizado a oz)
  }

  // Verificar que los valores sean válidos antes de mostrar
  if (isNaN(firstEquivalent) || !isFinite(firstEquivalent)) {
    elFirstResult.textContent = "Error";
  } else {
    elFirstResult.textContent = firstEquivalent.toFixed(2) + "%";
  }

  if (isNaN(secondEquivalent) || !isFinite(secondEquivalent)) {
    elSecondResult.textContent = "Error";
  } else {
    elSecondResult.textContent = secondEquivalent.toFixed(2) + "%";
  }

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

// Event listeners para los radio buttons de tipo de dólar
elDollarTypeRadios.forEach((radio) => {
  radio.addEventListener("change", function () {
    updateCalculatedPrices();
    calculatePercentages();
  });
});

load();
