#!/bin/bash

echo "Pulling the debug sound file from Bela"

rsync \
--timeout=10 \
-avzP root@192.168.7.2:~/debug_mono_output.wav \
./debug_mono_output.wav