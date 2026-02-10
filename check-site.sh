#!/bin/bash
# CebuLandMarket - Site Health Check
# Run this anytime: bash check-site.sh
# Checks BOTH local files AND live website

cd "$(dirname "$0")"
ERRORS=0
WARNINGS=0
SITE="https://cebulandmarket.com"

echo "==============================="
echo "  CebuLandMarket Health Check"
echo "==============================="
echo ""

# 1. Check all photo/video files referenced in listings.js
echo "--- Checking listing photos & videos (local) ---"
PHOTOS=$(grep -oE '"(photo_url|photo_urls|video_url)": "[^"]*"' data/listings.js | sed 's/.*: "//;s/"//' | tr ',' '\n' | sort -u)
for file in $PHOTOS; do
  if [ ! -f "$file" ]; then
    echo "  MISSING locally: $file"
    ERRORS=$((ERRORS+1))
  else
    echo "  OK: $file"
  fi
done
echo ""

# 2. Check all HTML pages exist locally
echo "--- Checking HTML pages (local) ---"
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
echo "--- Checking JS & CSS (local) ---"
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
if grep -q "var GC_CODE = 'YOUR_GOATCOUNTER_CODE'" js/analytics.js; then
  echo "  WARNING: GoatCounter not configured"
  WARNINGS=$((WARNINGS+1))
else
  GC_NAME=$(grep -oP "var GC_CODE = '\K[^']+" js/analytics.js 2>/dev/null || grep -o "var GC_CODE = '[^']*'" js/analytics.js | sed "s/var GC_CODE = '//;s/'//")
  echo "  OK: GoatCounter configured ($GC_NAME)"
fi

if grep -q "YOUR_FORM_ID" submit.html 2>/dev/null; then
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

# 6. Check WhatsApp & Viber format (should be 63, not 09)
echo "--- Checking contact links ---"
BAD_WA=$(grep -rl "wa\.me/09" *.html 2>/dev/null)
if [ -n "$BAD_WA" ]; then
  echo "  ERROR: Wrong WhatsApp format (needs 63) in: $BAD_WA"
  ERRORS=$((ERRORS+1))
else
  echo "  OK: WhatsApp links correct"
fi

BAD_VIBER=$(grep -rl "viber://chat?number=09" *.html 2>/dev/null)
if [ -n "$BAD_VIBER" ]; then
  echo "  ERROR: Wrong Viber format (needs 63) in: $BAD_VIBER"
  ERRORS=$((ERRORS+1))
else
  echo "  OK: Viber links correct"
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

# 8. Check git status for accidentally deleted files
echo "--- Checking for deleted files ---"
DELETED=$(git status --short 2>/dev/null | grep "^ D " | awk '{print $2}')
if [ -n "$DELETED" ]; then
  echo "  WARNING: Files deleted locally but still on GitHub:"
  for f in $DELETED; do
    echo "    - $f"
  done
  echo "  Run: git checkout -- <filename> to restore"
  WARNINGS=$((WARNINGS+1))
else
  echo "  OK: No accidentally deleted files"
fi
echo ""

# 9. Check if local is behind remote
echo "--- Checking git sync ---"
git fetch origin 2>/dev/null
LOCAL=$(git rev-parse HEAD 2>/dev/null)
REMOTE=$(git rev-parse origin/main 2>/dev/null)
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "  WARNING: Local and GitHub are out of sync"
  echo "  Run: git pull (to get latest) or git push (to upload)"
  WARNINGS=$((WARNINGS+1))
else
  echo "  OK: Local matches GitHub"
fi
echo ""

# 10. Check LIVE website (if internet available)
echo "--- Checking LIVE website ---"
if command -v curl &>/dev/null; then
  for page in "" "listings.html" "submit.html" "about.html" "faq.html"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/$page" 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
      echo "  OK: $SITE/$page ($STATUS)"
    else
      echo "  ERROR: $SITE/$page returned $STATUS"
      ERRORS=$((ERRORS+1))
    fi
  done

  # Check if key files load on live site
  for file in "js/app.js" "js/listings.js" "js/submit.js" "css/style.css" "data/listings.js"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/$file" 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
      echo "  OK: $SITE/$file ($STATUS)"
    else
      echo "  ERROR: $SITE/$file returned $STATUS"
      ERRORS=$((ERRORS+1))
    fi
  done

  # Check if photos load on live site
  echo ""
  echo "--- Checking LIVE photos ---"
  for file in $PHOTOS; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/$file" 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
      echo "  OK: $SITE/$file ($STATUS)"
    else
      echo "  ERROR: $SITE/$file returned $STATUS (photo not loading!)"
      ERRORS=$((ERRORS+1))
    fi
  done
else
  echo "  SKIPPED: curl not available"
fi
echo ""

# 11. Check all pages have analytics
echo "--- Checking analytics on all pages ---"
for page in index.html listings.html submit.html about.html faq.html property.html privacy.html 404.html; do
  if grep -q "analytics.js" "$page" 2>/dev/null; then
    echo "  OK: $page has analytics"
  else
    echo "  WARNING: $page missing analytics.js"
    WARNINGS=$((WARNINGS+1))
  fi
done
echo ""

# Summary
echo "==============================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "  ALL GOOD! Site is healthy."
elif [ $ERRORS -eq 0 ]; then
  echo "  $WARNINGS warning(s), but no errors."
else
  echo "  $ERRORS ERROR(S) found! Fix before sharing."
fi
echo "==============================="
