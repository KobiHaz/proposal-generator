#!/usr/bin/env bash
# Deploy Firestore rules. Run: ./scripts/deploy-rules.sh
# If you get "credentials no longer valid", run: firebase login --reauth
set -e
cd "$(dirname "$0")/.."
firebase deploy --only firestore:rules
