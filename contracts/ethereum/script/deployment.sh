#!/bin/bash
set -e

# Load environment variables from .env if it exists
if [ -f ".env" ]; then
  echo "Sourcing .env..."
  set -a
  source .env
  set +a
fi

# Deploy and create projects in one go
forge script Deploy.s.sol:DeployTwosideUpgradeableOnMainnet --via-ir --verbosity \
    --rpc-url $RPC_URL \
    --broadcast \
    --private-key $OWNER_PRIVATE_KEY
