const BASE_URL = "https://www.fueleconomy.gov/ws/rest";

function mpgToLitersPer100Km(mpg) {
  return Number((235.214583 / mpg).toFixed(2));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function normalizeMenuItems(data) {
  if (!data.menuItem) return [];
  return Array.isArray(data.menuItem) ? data.menuItem : [data.menuItem];
}

async function main() {
  const year = "2020";
  const make = "Mercedes-Benz";

  console.log("1. Отримуємо моделі...");

  const modelsData = await fetchJson(
    `${BASE_URL}/vehicle/menu/model?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`
  );

  const models = normalizeMenuItems(modelsData);

  console.log("Знайдені моделі:");
  console.log(models.slice(0, 10));

  const model = models[0].value;

  console.log("\n2. Беремо першу модель:", model);

  const optionsData = await fetchJson(
    `${BASE_URL}/vehicle/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
  );

  const options = normalizeMenuItems(optionsData);

  console.log("\nЗнайдені комплектації:");
  console.log(options.slice(0, 5));

  const vehicleId = options[0].value;

  console.log("\n3. Беремо vehicleId:", vehicleId);

  const vehicle = await fetchJson(`${BASE_URL}/vehicle/${vehicleId}`);

  const cityMpg = Number(vehicle.city08);
  const highwayMpg = Number(vehicle.highway08);
  const combinedMpg = Number(vehicle.comb08);

  const result = {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: Number(vehicle.year),
    transmission: vehicle.trany,
    fuelType: vehicle.fuelType,
    cityMpg,
    highwayMpg,
    combinedMpg,
    cityConsumptionL100: mpgToLitersPer100Km(cityMpg),
    highwayConsumptionL100: mpgToLitersPer100Km(highwayMpg),
    combinedConsumptionL100: mpgToLitersPer100Km(combinedMpg),
  };

  console.log("\n4. Результат:");
  console.log(result);
}

main().catch((error) => {
  console.error("Помилка:", error.message);
});