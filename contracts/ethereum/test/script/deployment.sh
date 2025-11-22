#!/bin/bash
set -e

# Start local Anvil if not running by running command "anvil"
# If you installed foundry it will be available by default in your terminal

# Load environment variables from .env if it exists
if [ -f ".env.development" ]; then
  echo "Sourcing .env.development..."
  set -a
  source .env.development
  set +a
fi

# if [ -z "$RPC_URL" ]; then
#   echo "Sourcing .env for RPC_URL"
#   set -a
#   source .env
#   set +a
# fi

# Deploy and create projects in one go
forge script Testing.s.sol:DeployTwosideUpgradeableOnTestnet --via-ir \
    --rpc-url $RPC_URL \
    --broadcast \
    --private-key $USER1_PRIVATE_KEY
