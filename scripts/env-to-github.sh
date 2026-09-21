#!/usr/bin/env bash
set -euo pipefail

# === KONFIGURATION ===
GITHUB_REPO="johanneskarnstam/foodhero"
ENV_FILE="${1:-.env}"

# 1. Kontrollera att .env-filen finns
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Hittade ingen fil på sökvägen: $ENV_FILE"
  exit 1
fi

echo "🔄 Läser variabler från '$ENV_FILE' och skickar till GitHub ($GITHUB_REPO)..."
echo "--------------------------------------------------"

COUNT=0

# 2. Läser filen rad för rad
while IFS= read -r line || [ -n "$line" ]; do
  # Hoppa över tomma rader och kommentarer (#)
  if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
    continue
  fi

  # Dela upp raden vid första likhetstecknet (=)
  KEY=$(echo "$line" | cut -d '=' -f 1 | xargs)
  VALUE=$(echo "$line" | cut -d '=' -f 2- | xargs)

  # Ta bort eventuella omslutande citattecken (" eller ') runt värdet
  VALUE=$(echo "$VALUE" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

  if [ -n "$KEY" ]; then
    echo -n "🚀 Överför $KEY till GitHub Secrets... "
    
    # Sätt som Secret i GitHub
    echo -n "$VALUE" | gh secret set "$KEY" --repo "$GITHUB_REPO"
    
    echo "✅ Klart!"
    COUNT=$((COUNT + 1))
  fi
done < "$ENV_FILE"

echo "--------------------------------------------------"
echo "🎉 Klart! Totalt $COUNT secrets har lagts till i $GITHUB_REPO."