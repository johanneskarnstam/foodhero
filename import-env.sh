#!/bin/bash

# Kontrollera att .env-filen finns
if [ ! -f .env ]; then
  echo "Hittade ingen .env-fil i mappen!"
  exit 1
fi

echo "Läser in variabler från .env och laddar upp till GitLab..."

while IFS= read -r line || [ -n "$line" ]; do
  # Hoppa över tomma rader och kommentarer
  [[ -z "$line" || "$line" =~ ^# ]] && continue

  # Dela upp raden vid första '='
  key="${line%%=*}"
  value="${line#*=}"

  # Rensa bort eventuella ledande/efterföljande mellanslag och citattecken (' eller ")
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | xargs)

  if [ -n "$key" ]; then
    echo "Skjuter in: $key"
    # Sätter variabeln via GitLab CLI (maskerad men ej protected)
    glab variable set "$key" "$value" --masked=true --protected=false
  fi
done < .env

echo "Klart! Alla variabler har skickats till GitLab."