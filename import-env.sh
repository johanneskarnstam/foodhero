#!/bin/bash

# Kontrollera att .env-filen finns
if [ ! -f .env ]; then
  echo "Hittade ingen .env-fil i mappen!"
  exit 1
fi

# Steg 1: Ta bort alla befintliga variabler från GitLab som finns i .env
echo "Steg 1: Tar bort befintliga variabler från GitLab..."

while IFS= read -r line || [ -n "$line" ]; do
  # Hoppa över tomma rader och kommentarer
  [[ -z "$line" || "$line" =~ ^# ]] && continue

  key="${line%%=*}"
  key=$(echo "$key" | xargs)

  if [ -n "$key" ]; then
    echo "Tar bort (om den finns): $key"
    # Tar bort variabeln. 2>/dev/null ser till att det inte blir felmeddelande om den inte fanns sedan innan.
    glab variable delete "$key" 2>/dev/null || true
  fi
done < .env

echo "Rensning klar!"
echo "----------------------------------------"

# Steg 2: Läs in och lägg till alla variabler på nytt
echo "Steg 2: Läser in variabler från .env och laddar upp till GitLab..."

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

echo "Klart! Alla variabler har uppdaterats i GitLab."