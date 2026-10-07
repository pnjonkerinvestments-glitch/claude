#!/usr/bin/env bash
cd "$(dirname "$0")/.."
while pgrep -f "funfacts.sh 11 20" >/dev/null; do sleep 20; done
build/funny10.sh > out/funny10.log 2>&1
build/viral.sh > out/viral.log 2>&1
echo CHAINDONE > out/chain.done
