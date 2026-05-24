/**
 * CebuVehicleMarket - Vehicle Listings Data
 *
 * HOW TO ADD A NEW VEHICLE:
 * 1. Open this file on GitHub (vehicles/data/vehicles.js)
 * 2. Click the pencil icon to edit
 * 3. Copy an existing listing block (from { to },)
 * 4. Paste it below the last listing
 * 5. Change the values (make sure "id" is unique, e.g. "V1", "V2", etc.)
 * 6. Set "status" to "active"
 * 7. Set price to the asking price in PHP (no commas, no peso sign)
 * 8. Set type to: "car", "motorbike", "truck", "suv", "van", or "other"
 * 9. Save/commit the file
 *
 * IMPORTANT:
 * - price is the BASE price (seller's asking price). 1% platform fee is added automatically.
 * - All prices are in Philippine Pesos (PHP)
 * - photo_url = main photo, photo_urls = comma-separated list of all photos
 * - Leave photo_url and photo_urls empty ("") if no photos yet
 * - Set status to "active" for live, "sold" when sold
 * - When marking sold, add "sold_date": "March 2026"
 */

var VEHICLES_DATA = [
  {
    id: "V1",
    title: "2019 Toyota Vios E 1.3 Manual",
    type: "car",
    brand: "Toyota",
    model: "Vios E",
    year: 2019,
    transmission: "manual",
    fuel: "gasoline",
    mileage_km: 42000,
    color: "Silver",
    price: 525000,
    location: "Cebu City",
    description: "Well-maintained 2019 Toyota Vios E 1.3 manual transmission. Single owner, complete service history at Toyota dealership. Tires replaced last year. Aircon ice-cold. No accidents, no flood history. Casa-maintained. OR/CR clean and updated. Plate ending: odd.",
    features: "Single Owner,Casa-Maintained,Complete Service History,No Accidents,No Flood History,New Tires,Ice-Cold AC,Clean OR/CR",
    photo_url: "images/sample-vios.jpg",
    photo_urls: "",
    messenger: "https://m.me/aCueRaCa68",
    viber: "639687512330",
    whatsapp: "639687512330",
    phone: "09687512330",
    owner_name: "CebuVehicleMarket",
    status: "active",
    date_listed: "2026-05-24",
    verification: {
      code: "CVM-2026-V001",
      date: "2026-05-24",
      checks: {
        or_cr_verified: true,
        no_encumbrance: true,
        chassis_match: true,
        owner_confirmed: true,
        no_flood_history: true,
        no_accidents: true,
        photos_authentic: true
      }
    }
  }
];
