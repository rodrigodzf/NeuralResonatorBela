#!/bin/bash

# check if pytorch is in /opt/pytorch-install

if [ ! -d "/opt/pytorch-install" ]; then
    echo "Pytorch not found in /opt/pytorch-install"

    # Download pytorch to /opt/pytorch-install
    url=https://github.com/rodrigodzf/bela-torch/releases/download/master/pytorch-install.tar.gz
    echo "Downloading Pytorch from $url"
    wget -O - $url | tar -xz -C /opt
fi

echo "Building Neural Resonator Bela"

cmake -S . -B build \
-DENABLE_PYTORCH_FRONTEND=ON \
-DCMAKE_TOOLCHAIN_FILE=Toolchain.cmake

cmake --build build -j

echo "Copying files to Bela"

rsync \
--timeout=10 \
-avzP build/bin/NeuralResonatorBela \
root@192.168.7.2:~/Bela/projects/NeuralResonatorBela

# Copy sketch.js to Bela
rsync \
--timeout=10 \
-avzP js/sketch.js \
root@192.168.7.2:~/Bela/projects/NeuralResonatorBela

# Copy the ckpt file to Bela
rsync \
--timeout=10 \
-avzP checkpoints/optimized_curious-salad-167.pt \
root@192.168.7.2:~/Bela/projects/NeuralResonatorBela
