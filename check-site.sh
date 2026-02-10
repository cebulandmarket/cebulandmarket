#!/bin/bash
# CebuLandMarket - Site Health Check
# Run this anytime: bash check-site.sh

cd "$(dirname "$0")"
ERRORS=0
WARNINGS=0

echo "==============================="
echo "  CebuLandMarket Health Check"
echo "==============================="
echo ""

# 1. Check all photo/video files referenced in listings.js
echo "--- Checking listing photos & videos ---"
PHOTOS=$(grep -oE '"(photo_url|photo_urls|video_url)": "[^"]*"' data/listings.js | sed 's/.*: "//;s/"//' | tr ',' '\n')
for file in $PHOTOS; do
  if [ ! -f "$file" ]; then
    echo "  MISSING: $file"
    ERRORS=$((ERRORS+1))
  else
    echo "  OK: $file"
  fi
done
echo ""

# 2. Check all HTML pages exist
echo "--- Checking HTML pages ---"
for page in index.html listings.html submit.html about.html faq.html property.html listing-1.html privacy.html 404.html; do
  if [ ! -f "$page" ]; then
    echo "  MISSING: $page"
    ERRORS=$((ERRORS+1))
  else
    echo "  OK: $page"
  fi
done
echo ""

# 3. Check key JS/CSS files
echo "--- Checking JS & CSS ---"
for file in js/app.js js/listings.js js/submit.js js/analytics.js css/style.css data/listings.js; do
  if [ ! -f "$file" ]; then
    echo "  MISSING: $file"
    ERRORS=$((ERRORS+1))
  else
    echo "  OK: $file"
  fi
done
echo ""

# 4. Check for placeholder/dummy values
echo "--- Checking for placeholders ---"
if grep -q "YOUR_GOATCOUNTER_CODE" js/analytics.js; then
  echo "  WARNING: GoatCounter not configured"
  WARNINGS=$((WARNINGS+1))
else
  echo "  OK: GoatCounter configured"
fi

if grep -q "YOUR_FORMSPREE_ID" submit.html 2>/dev/null; then
  echo "  WARNING: Formspree not configured"
  WARNINGS=$((WARNINGS+1))
else
  echo "  OK: Formspree configured"
fi
echo ""

# 5. Check listing count
echo "--- Listing stats ---"
ACTIVE=$(grep -c '"status": "active"' data/listings.js)
echo "  Active listings: $ACTIVE"
echo ""

# 6. Check WhatsApp format (should be 63, not 09)
echo "--- Checking WhatsApp links ---"
BAD_WA=$(grep -rl "wa\.me/09" *.html 2>/dev/null)
if [ -n "$BAD_WA" ]; then
  echo "  ERROR: Wrong WhatsApp format (needs +63) in:"
  echo "  $BAD_WA"
  ERRORS=$((ERRORS+1))
else
  echo "  OK: All WhatsApp links use correct format"
fi
echo ""

# 7. Check CNAME
echo "--- Checking domain ---"
if [ -f "CNAME" ]; then
  echo "  Domain: $(cat CNAME)"
else
  echo "  WARNING: No CNAME file (no custom domain)"
  WARNINGS=$((WARNINGS+1))
fi
echo ""

# Summary
echo "==============================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "  ALL GOOD! Site is healthy."
elif [ $ERRORS -eq 0 ]; then
  echo "  $WARNINGS warning(s), but no errors."
else
  echo "  $ERRORS ERROR(S) found! Fix before pushing."
fi
echo "==============================="
