# CebuLandMarket

A property listing website for land, lots, and homes in Cebu, Philippines. Built with vanilla HTML/CSS/JavaScript, powered by Google Sheets as a database, and hosted for free on GitHub Pages.

## Quick Start

1. Open `index.html` in your browser to preview locally
2. The site works immediately with sample listings
3. Follow the setup steps below to connect Google Sheets and Formspree

## Setup Guide

### 1. Google Sheets (Listing Database)

1. Create a new Google Sheet with these column headers in Row 1:

   | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
   | id | title | type | location | address | lot_area | price_per_sqm | total_price | description | features | photo_url | photo_urls | messenger | viber | whatsapp | phone | owner_name | status | date_listed |

2. Add your first listing (the Ronda lot) in Row 2:
   - id: `1`
   - title: `14,724 sqm Lot in Ronda, Cebu`
   - type: `lot`
   - location: `ronda`
   - address: `Brgy. Cansabusab, Ronda, Cebu`
   - lot_area: `14724`
   - price_per_sqm: `750`
   - total_price: `11043000`
   - description: (your description)
   - features: `Road access,Mountain view,Near town center,Clean title`
   - photo_url: (main photo URL)
   - photo_urls: (comma-separated additional photo URLs)
   - messenger: `https://m.me/yourprofile`
   - viber: `09XXXXXXXXX`
   - whatsapp: `+639XXXXXXXXX`
   - phone: `09XXXXXXXXX`
   - owner_name: `Owner Name`
   - status: `active`
   - date_listed: `2025-01-01`

3. Publish the sheet: **File > Share > Publish to web** > select **Entire Document** > click **Publish**

4. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

5. Open `js/listings.js` and replace `YOUR_GOOGLE_SHEET_ID` with your Sheet ID

### 2. Formspree (Form Submissions)

1. Go to [formspree.io](https://formspree.io) and create a free account
2. Create a new form and copy the form endpoint (e.g., `https://formspree.io/f/xyzabc123`)
3. Open `submit.html` and replace `YOUR_FORM_ID` in the form action with your Formspree form ID

### 3. Payment Details

Open `submit.html` and update the payment section with your actual:
- GCash number
- Bank account numbers (BDO, BPI)
- Account name

### 4. Contact Details

Update your contact information in:
- `about.html` - phone number, messenger link
- Footer section in all HTML files - email address
- `submit.html` - help section

### 5. Deploy to GitHub Pages

1. Create a GitHub repository named `cebulandmarket` (or any name)
2. Push all files to the repository:
   ```bash
   cd cebu-property-hub
   git init
   git add .
   git commit -m "Initial launch of CebuLandMarket"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/cebulandmarket.git
   git push -u origin main
   ```
3. Go to repository **Settings > Pages**
4. Set source to **Deploy from a branch** > select **main** > click **Save**
5. Your site will be live at `https://YOUR_USERNAME.github.io/cebulandmarket/`

## Managing Listings

### Adding a New Listing
1. Receive property submission via email (Formspree)
2. Verify payment (GCash/Bank Transfer)
3. Add a new row in Google Sheet with property details
4. Set `status` column to `active`
5. The listing appears on the website automatically

### Removing a Listing
- Change the `status` column to `inactive` or `sold` in Google Sheet

### Property Types
Use these values in the `type` column:
- `lot` - Lot / Land
- `house-and-lot` - House & Lot
- `farm` - Farm Land
- `commercial` - Commercial
- `beach` - Beach Property

### Location Values
Use lowercase slugified municipality names in the `location` column:
- `cebu-city`, `mandaue`, `lapu-lapu`, `talisay`, `consolacion`, `liloan`, `minglanilla`, `naga`, `carcar`, `argao`, `moalboal`, `ronda`, `badian`, `oslob`, `santander`, `danao`, `compostela`, `toledo`, `balamban`, `other`

## File Structure

```
cebu-property-hub/
├── index.html          Home page
├── listings.html       All listings with filters
├── property.html       Property detail page
├── submit.html         Submit property form + payment
├── about.html          About & contact
├── css/
│   └── style.css       All styles
├── js/
│   ├── app.js          Navigation & utilities
│   ├── listings.js     Google Sheets integration & rendering
│   └── submit.js       Form submission handling
├── images/             Site images
└── README.md
```

## Tech Stack

- HTML5 / CSS3 (responsive, mobile-first)
- Vanilla JavaScript (no frameworks)
- Google Sheets (free database via published CSV/JSON)
- Formspree (free form submissions, 50/month)
- GitHub Pages (free hosting)
