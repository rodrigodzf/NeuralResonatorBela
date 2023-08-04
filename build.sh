#!/bin/bash

echo "Building Neural Resonator Bela"

cmake -S . -B build \
-DENABLE_PYTORCH_FRONTEND=ON \
-DCMAKE_TOOLCHAIN_FILE=Toolchain.cmake

cmake --build build -j

echo "Copying files to Bela"

rsync \
--timeout=10 \
-avzP build/bin/NeuralResonatorBela \
root@192.168.7.2:~