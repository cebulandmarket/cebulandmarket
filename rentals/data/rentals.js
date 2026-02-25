/**
 * CebuRentMarket - Rental Listings Data
 *
 * HOW TO ADD A NEW RENTAL LISTING:
 * 1. Open this file on GitHub (rentals/data/rentals.js)
 * 2. Click the pencil icon to edit
 * 3. Copy an existing listing block (from { to },)
 * 4. Paste it below the last listing
 * 5. Change the values (make sure "id" is unique, e.g. "R4", "R5", etc.)
 * 6. Set "status" to "active"
 * 7. Set monthly_rent to the monthly rental price in PHP (no commas, no peso sign)
 * 8. Set furnish_status to: "fully-furnished", "semi-furnished", or "unfurnished"
 * 9. Set type to: "house", "condo", "room", or "commercial"
 * 10. Save/commit the file
 *
 * IMPORTANT:
 * - monthly_rent is the BASE rent (what the tenant pays per month)
 * - All prices are in Philippine Pesos (PHP)
 * - photo_url = main photo filename, photo_urls = comma-separated list of all photos
 * - Leave photo_url and photo_urls empty ("") if no photos yet
 * - Set status to "active" for live listings, "rented" when occupied
 */

var RENTALS_DATA = [
  {
    "id": "R1",
    "title": "Modern 2BR Condo in IT Park, Cebu City",
    "type": "condo",
    "location": "cebu-city",
    "address": "IT Park, Lahug, Cebu City",
    "monthly_rent": 25000,
    "bedrooms": 2,
    "bathrooms": 1,
    "floor_area": 48,
    "furnish_status": "fully-furnished",
    "lease_term": "1 year minimum",
    "deposit": "2 months advance + 1 month deposit",
    "availability_date": "2026-03-01",
    "pet_friendly": false,
    "parking": true,
    "description": "Fully furnished 2-bedroom condo unit in the heart of IT Park, Cebu City. Perfect for young professionals or small families who want to be close to offices, restaurants, and nightlife. The unit comes with WiFi, air conditioning in both bedrooms, a modern kitchen, and access to building amenities including a swimming pool, gym, and 24/7 security. Walking distance to Ayala Malls Central Bloc and major BPO offices.",
    "features": "WiFi included,Air conditioning,Swimming pool,Gym access,24/7 security,Near restaurants,Elevator,CCTV,Fire alarm system,Laundry area",
    "photo_url": "",
    "photo_urls": "",
    "map_url": "IT Park Cebu City",
    "video_url": "",
    "messenger": "https://m.me/61587469756965",
    "viber": "639687512330",
    "whatsapp": "639687512330",
    "phone": "09687512330",
    "owner_name": "CebuRentMarket",
    "status": "active",
    "date_listed": "2026-02-24",
    "verification": {
      "code": "CRM-2026-R001",
      "date": "2026-02-24",
      "checks": {
        "owner_verified": true,
        "property_exists": true,
        "photos_authentic": true,
        "lease_terms_clear": true,
        "no_disputes": true,
        "utilities_confirmed": true
      }
    }
  },
  {
    "id": "R2",
    "title": "Spacious 3BR House in Banilad with Garden",
    "type": "house",
    "location": "banilad",
    "address": "Banilad, Cebu City",
    "monthly_rent": 35000,
    "bedrooms": 3,
    "bathrooms": 2,
    "floor_area": 120,
    "furnish_status": "fully-furnished",
    "lease_term": "1 year minimum",
    "deposit": "2 months advance + 2 months deposit",
    "availability_date": "2026-03-15",
    "pet_friendly": true,
    "parking": true,
    "description": "Spacious 3-bedroom furnished house in the quiet residential area of Banilad. This home features a large garden perfect for pets and kids, a covered carport for 2 vehicles, and a modern open-plan kitchen and living area. All bedrooms are air-conditioned with built-in closets. Located near Banilad Town Centre, international schools, and major hospitals. Pet-friendly — dogs and cats welcome with a small additional deposit.",
    "features": "Garden,Covered parking for 2 cars,Air conditioning,Pet-friendly,Near schools,Near hospitals,Quiet neighborhood,Water heater,Backup water tank,Gated compound",
    "photo_url": "",
    "photo_urls": "",
    "map_url": "Banilad Cebu City",
    "video_url": "",
    "messenger": "https://m.me/61587469756965",
    "viber": "639687512330",
    "whatsapp": "639687512330",
    "phone": "09687512330",
    "owner_name": "CebuRentMarket",
    "status": "active",
    "date_listed": "2026-02-24",
    "verification": {
      "code": "CRM-2026-R002",
      "date": "2026-02-24",
      "checks": {
        "owner_verified": true,
        "property_exists": true,
        "photos_authentic": true,
        "lease_terms_clear": true,
        "no_disputes": true,
        "utilities_confirmed": true
      }
    }
  },
  {
    "id": "R3",
    "title": "Affordable Room/Bedspace in Mabolo near Ayala",
    "type": "room",
    "location": "cebu-city",
    "address": "Mabolo, Cebu City (near Ayala Center)",
    "monthly_rent": 5000,
    "bedrooms": 1,
    "bathrooms": 1,
    "floor_area": 12,
    "furnish_status": "semi-furnished",
    "lease_term": "3 months minimum",
    "deposit": "1 month advance + 1 month deposit",
    "availability_date": "2026-03-01",
    "pet_friendly": false,
    "parking": false,
    "description": "Budget-friendly room for rent in Mabolo, just a 5-minute jeepney ride to Ayala Center Cebu. Ideal for students, solo workers, or BPO employees looking for an affordable place near the city center. The room comes with a bed frame, cabinet, and electric fan. Shared bathroom and kitchen area. Utilities (water and electricity) are included in the rent up to a reasonable limit. Quiet boarding house with house rules for a peaceful living environment.",
    "features": "Utilities included,Near Ayala Center,Shared bathroom,Shared kitchen,Bed frame included,Cabinet included,Electric fan,Quiet environment,Near jeepney routes,Near convenience stores",
    "photo_url": "",
    "photo_urls": "",
    "map_url": "Mabolo Cebu City near Ayala",
    "video_url": "",
    "messenger": "https://m.me/61587469756965",
    "viber": "639687512330",
    "whatsapp": "639687512330",
    "phone": "09687512330",
    "owner_name": "CebuRentMarket",
    "status": "active",
    "date_listed": "2026-02-24",
    "verification": {
      "code": "CRM-2026-R003",
      "date": "2026-02-24",
      "checks": {
        "owner_verified": true,
        "property_exists": true,
        "photos_authentic": true,
        "lease_terms_clear": true,
        "no_disputes": true,
        "utilities_confirmed": true
      }
    }
  }
];
