/**
 * CebuLandMarket - Property Coordinates
 *
 * Lat/Lng for each listing by ID. Used by map.html.
 * Coordinates are approximate (barangay/subdivision center) — accurate enough
 * for a map view without exposing exact addresses before a buyer commits.
 *
 * HOW TO ADD: when a new listing is added to data/listings.js,
 * look up the address on Google Maps, right-click → copy coordinates,
 * and add an entry here with the listing's id.
 */

var LISTING_COORDINATES = {
  "1":  { lat: 9.7465,  lng: 123.4090 }, // Sta. Cruz, Ronda
  "3":  { lat: 10.3033, lng: 123.9640 }, // Isuya Road, Mactan, Lapu-Lapu
  "4":  { lat: 10.2412, lng: 123.7927 }, // Lucena Homes, Pakigne, Minglanilla
  "5":  { lat: 10.3606, lng: 123.9176 }, // Ylaya, Talamban (2,029 sqm)
  "6":  { lat: 10.3615, lng: 123.9186 }, // Ylaya, Talamban (3,780 sqm) — jittered
  "7":  { lat: 10.4037, lng: 123.9825 }, // Brgy. Cotcot, Liloan
  "8":  { lat: 10.3329, lng: 123.9034 }, // BE Residences, Lahug
  "9":  { lat: 10.2485, lng: 123.7889 }, // Southplains, Pakigne, Minglanilla
  "10": { lat: 10.2787, lng: 123.9754 }, // Canjulao, Lapu-Lapu
  "11": { lat: 10.3713, lng: 123.9182 }, // Sta. Maria Village, Tigbao, Talamban
  "12": { lat: 10.2796, lng: 123.8430 }, // Saint Jude Acres, Bulacao
  "13": { lat: 10.3936, lng: 123.9957 }, // Vista La Playa, Yati, Liloan
  "14": { lat: 10.3810, lng: 123.9079 }, // Busay Heights
  "15": { lat: 10.3385, lng: 123.9075 }, // Banilad Town Centre
  "16": { lat: 10.3305, lng: 123.9063 }, // Vertex Central, IT Park
  "17": { lat: 10.3090, lng: 123.8910 }, // White Hills, Banawa
  "18": { lat: 10.3653, lng: 123.9194 }, // Mulberry Drive, Talamban
  "19": { lat: 10.3408, lng: 123.9049 }, // Mivesa Garden, Lahug
  "20": { lat: 10.2535, lng: 123.8217 }, // Deca Homes Phase 2, Dumlog, Talisay
  "21": { lat: 10.4042, lng: 123.9790 }, // El Monte Grande, San Vicente, Liloan
  "22": { lat: 10.3790, lng: 123.9217 }, // Montabor Hills, Talamban
  "23": { lat: 10.3096, lng: 123.9854 }, // Timpolok, Babag, Lapu-Lapu
  "24": { lat: 10.2616, lng: 123.8300 }  // Lawaan, Talisay
};
