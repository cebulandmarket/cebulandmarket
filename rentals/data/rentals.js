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
 * - When marking as "rented", add "rented_date": "March 2026" (or whenever)
 *   The listing will show a RENTED badge and disable contact buttons
 */

var RENTALS_DATA = [
  {
    id: "R1",
    title: "2BR Condo Unit in IT Park",
    description: "Fully furnished 2-bedroom condo in Cebu IT Park. Walking distance to restaurants, cafes, and offices. Perfect for professionals or small families. Includes parking slot.",
    type: "condo",
    bedrooms: 2,
    bathrooms: 1,
    floor_area: "56 sqm",
    monthly_rent: 18000,
    location: "IT Park, Cebu City",
    location_slug: "cebu-city",
    furnish_status: "fully-furnished",
    photo_url: "images/r1-condo-2br.jpg",
    photo_urls: "images/r1-condo-2br.jpg",
    status: "rented",
    rented_date: "March 2026",
    date_listed: "2026-02-20"
  },
  {
    id: "R4",
    title: "1BR Condo in Mandaue",
    description: "Affordable 1-bedroom condo near J Centre Mall, Mandaue. Fully furnished with WiFi-ready unit. Building has pool, gym, and 24/7 security.",
    type: "condo",
    bedrooms: 1,
    bathrooms: 1,
    floor_area: "32 sqm",
    monthly_rent: 9800,
    location: "A.S. Fortuna, Mandaue City",
    location_slug: "mandaue",
    furnish_status: "fully-furnished",
    photo_url: "images/r4-condo-1br.jpg",
    photo_urls: "images/r4-condo-1br.jpg",
    status: "rented",
    rented_date: "March 2026",
    date_listed: "2026-02-25"
  }
];
