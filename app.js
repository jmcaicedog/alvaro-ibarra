const elGoldGram = document.getElementById("gold-gram");
const elGoldGramFinal = document.getElementById("gold-gram-final");
const elGoldOunce = document.getElementById("gold-ounce");
const elGoldOunceUsd = document.getElementById("gold-ounce-usd");
const elTrm = document.getElementById("trm");
const elTrmFinal = document.getElementById("trm-final");
const elFactor = document.getElementById("factor");
const elUpdated = document.getElementById("updated");

// Nuevos elementos para la funcionalidad de porcentajes
const elPercentageInput = document.getElementById("percentage-input");
const elPercentageResult = document.getElementById("percentage-result");
const elCalculatedPercentage = document.getElementById("calculated-percentage");
const elApproximatedResult = document.getElementById("approximated-result");
// Radio selector elements
const elPriceSourceRadios = document.getElementsByName("price-source");

function getSelectedPriceSource() {
  for (const r of elPriceSourceRadios) {
    if (r.checked) return r.value;
  }
  return "TRM"; // default
}

function updateCalculatedPrices() {
  if (!currentData) return;

  const source = getSelectedPriceSource();
  const goldOunceUsd = currentData.computed.goldUsdPerOunce;
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
  } else {
    // KITCO: por ahora usar el mismo cálculo que Gold Price
    goldCopPerOunce = goldOunceUsd * trmFinal;
  }

  // Para ambos casos: Precio Oro/g precio final = Precio por onza ÷ Factor
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
    elPercentageResult.textContent = "-";
    elCalculatedPercentage.textContent = "-";
    elApproximatedResult.textContent = "-";
    return;
  }

  const percentage = parseFloat(elPercentageInput.value);
  if (isNaN(percentage) || percentage < 0 || percentage > 100) {
    elPercentageResult.textContent = "Valor inválido";
    elCalculatedPercentage.textContent = "-";
    elApproximatedResult.textContent = "-";
    return;
  }

  // 1. Calcular el porcentaje sobre el Gold Price (primer card)
  const goldGramValue = currentData.computed.goldCopPerGram;
  const percentageResult = (goldGramValue * percentage) / 100;

  // 2. Mostrar el resultado
  elPercentageResult.textContent = "COP " + fmt(percentageResult.toFixed(2));

  // 3. Calcular qué porcentaje del último card (Precio Oro/g precio final) se aproxima más
  const goldGramFinalValue = currentData.computed.goldCopPerGramFinal;
  const calculatedPercentage = (percentageResult / goldGramFinalValue) * 100;

  // 4. Calcular el resultado de aplicar ese porcentaje
  const approximatedResult = (goldGramFinalValue * calculatedPercentage) / 100;

  // 5. Mostrar los resultados
  elCalculatedPercentage.textContent = calculatedPercentage.toFixed(2) + "%";
  elApproximatedResult.textContent =
    "COP " + fmt(approximatedResult.toFixed(2));
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
    const trm = j.raw.trm;
    const trmFinal = j.computed.dollarFinal;

    elGoldGram.textContent = "COP " + fmt(goldGram.toFixed(2));
    elGoldOunceUsd.textContent = "USD " + fmt(goldOunceUsd.toFixed(2));
    elTrm.textContent = "COP " + fmt(trm.toFixed(2));
    elTrmFinal.textContent = "COP " + fmt(trmFinal.toFixed(2));
    elFactor.textContent = gPerOunce;
    elUpdated.textContent = new Date(j.fetchedAt).toLocaleString();

    // Calcular precios según la fuente seleccionada
    updateCalculatedPrices();

    // Recalcular porcentajes si hay un valor en el input
    calculatePercentages();
  } catch (err) {
    elGoldGram.textContent = "Error";
    elGoldGramFinal.textContent = "Error";
    elGoldOunce.textContent = "Error";
    elGoldOunceUsd.textContent = "Error";
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
