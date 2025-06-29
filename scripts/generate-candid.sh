#!/bin/bash

# Install candid-extractor if needed
bash ./scripts/install-cargo-extractor.sh

# Function to generate candid for a specific canister
generate_candid_for_canister() {
  local canister=$1
  echo "Generating Candid for canister: $canister"
  
  # Build the Wasm for the canister
  cargo build --target wasm32-unknown-unknown --release --package $canister
  
  if [ $? -ne 0 ]; then
    echo "Error: Failed to build Wasm for canister $canister"
    return 1
  fi
  
  # Extract the Candid interface
  candid-extractor target/wasm32-unknown-unknown/release/$canister.wasm > src/$canister/$canister.did
  
  if [ $? -ne 0 ]; then
    echo "Error: Failed to extract Candid interface for canister $canister"
    return 1
  fi
  
  echo "Successfully generated Candid for $canister"
}

# Check if a specific canister was requested
if [ "$1" != "" ]; then
  # Verify the canister exists in dfx.json and is a Rust canister
  canister_type=$(jq -r ".canisters.\"$1\".type // empty" dfx.json)
  if [ "$canister_type" = "rust" ]; then
    generate_candid_for_canister "$1"
  else
    echo "Error: Canister '$1' is not a Rust canister (type: $canister_type)"
    exit 1
  fi
else
  # No canister specified, generate for all Rust canisters only
  # Get all Rust canister names from dfx.json
  canister_names=$(jq -r '.canisters | to_entries[] | select(.value.type == "rust") | .key' dfx.json)
  
  for canister in $canister_names; do
    generate_candid_for_canister "$canister"
  done
fi

# Always refresh the did files
if [ "$1" != "" ]; then
  # Generate declarations for the specific canister
  dfx generate "$1"
else
  # Generate declarations for all canisters
  dfx generate
fi