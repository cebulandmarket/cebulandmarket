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
    photo_url: "",
    photo_urls: "",
    status: "rented",
    rented_date: "March 2026",
    date_listed: "2026-02-20"
  },
  {
    id: "R2",
    title: "Studio Apartment near Ayala",
    description: "Cozy studio unit near Ayala Center Cebu. Semi-furnished with aircon and basic appliances. Great for students and young professionals. Near malls and transport.",
    type: "condo",
    bedrooms: 1,
    bathrooms: 1,
    floor_area: "28 sqm",
    monthly_rent: 12500,
    location: "Cebu Business Park, Cebu City",
    location_slug: "cebu-city",
    furnish_status: "semi-furnished",
    photo_url: "",
    photo_urls: "",
    status: "rented",
    rented_date: "March 2026",
    date_listed: "2026-02-18"
  },
  {
    id: "R3",
    title: "3BR House in Talamban",
    description: "Spacious 3-bedroom house in a quiet subdivision in Talamban. Unfurnished, with garage for 2 cars. Near schools and churches. Ideal for families.",
    type: "house",
    bedrooms: 3,
    bathrooms: 2,
    floor_area: "120 sqm",
    monthly_rent: 25000,
    location: "Talamban, Cebu City",
    location_slug: "cebu-city",
    furnish_status: "unfurnished",
    photo_url: "",
    photo_urls: "",
    status: "rented",
    rented_date: "February 2026",
    date_listed: "2026-02-12"
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
    photo_url: "",
    photo_urls: "",
    status: "rented",
    rented_date: "March 2026",
    date_listed: "2026-02-25"
  },
  {
    id: "R5",
    title: "Furnished Studio in Lahug",
    description: "Modern studio unit in Lahug near JY Square. Fully furnished with kitchen and balcony. Walking distance to restaurants and convenience stores.",
    type: "condo",
    bedrooms: 1,
    bathrooms: 1,
    floor_area: "24 sqm",
    monthly_rent: 15000,
    location: "Lahug, Cebu City",
    location_slug: "cebu-city",
    furnish_status: "fully-furnished",
    photo_url: "",
    photo_urls: "",
    status: "rented",
    rented_date: "March 2026",
    date_listed: "2026-03-01"
  },
  {
    id: "R6",
    title: "2BR Apartment in Mabolo",
    description: "Newly renovated 2-bedroom apartment in Mabolo. Close to Country Mall and SM City. Semi-furnished with aircon in both rooms. Water and WiFi included.",
    type: "condo",
    bedrooms: 2,
    bathrooms: 1,
    floor_area: "45 sqm",
    monthly_rent: 14000,
    location: "Mabolo, Cebu City",
    location_slug: "cebu-city",
    furnish_status: "semi-furnished",
    photo_url: "",
    photo_urls: "",
    status: "rented",
    rented_date: "March 2026",
    date_listed: "2026-03-05"
  },
  {
    id: "R7",
    title: "4BR House with Garden in Talisay",
    description: "Beautiful 4-bedroom house with garden and covered garage in Talisay City. Quiet neighborhood, near SRP and schools. Perfect for big families.",
    type: "house",
    bedrooms: 4,
    bathrooms: 3,
    floor_area: "180 sqm",
    monthly_rent: 35000,
    location: "Talisay City",
    location_slug: "talisay",
    furnish_status: "semi-furnished",
    photo_url: "",
    photo_urls: "",
    status: "rented",
    rented_date: "February 2026",
    date_listed: "2026-02-14"
  }
];
