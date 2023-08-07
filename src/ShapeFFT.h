#pragma once

#include <array>
#include <vector>
#include <cmath>
#include <libraries/ne10/NE10.h> // NEON FFT library

#define SAMPLES 32
using FixedPointsArray = std::array<double, SAMPLES>;

class ShapeFFT
{
public:
    ShapeFFT()
    {
        // Initialize the FFT
        cfg = ne10_fft_alloc_c2c_float32_neon(SAMPLES);
    }

    void fft_magnitude(
        const FixedPointsArray &x,
        const FixedPointsArray &y
    )
    {
        // Copy input to src
        for(int i = 0; i < SAMPLES; i++)
        {
            src[i].r = (ne10_float32_t)x[i];
            src[i].i = (ne10_float32_t)y[i];
        } 

        // Perform the FFT
        ne10_fft_c2c_1d_float32_neon(dst.data(), src.data(), cfg, 0);

        // Calculate the magnitudes
        for(int i = 0; i < SAMPLES; i++)
        {
            // Normalised magnitude
            mag[i] = sqrtf(dst[i].r * dst[i].r + dst[i].i * dst[i].i) / SAMPLES; 
        }
    }


public:
    FixedPointsArray mag;     // A magnitude array for the transformed data

private:
    // allocate the memory for the FFT in the heap (32 complex numbers)
    
    std::array<ne10_fft_cpx_float32_t, SAMPLES> src; // A source array of input data
    std::array<ne10_fft_cpx_float32_t, SAMPLES> dst; // A destination array for the transformed data
    ne10_fft_cfg_float32_t cfg;     // An FFT "configuration structure"
};
