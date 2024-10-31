#pragma once

#include <vector>
#include <cstdio>
#include "TwoPole.h"

template <typename T>
class Filterbank
{
public:
    // Constructors and Destructor
    Filterbank() 
    : mNumParallel(0)
    , mNumBiquads(0)
    , mStride(0)
    {}

    Filterbank(int numParallel, int numBiquads)
    {
        setup(numParallel, numBiquads);
    }

    ~Filterbank()
    {
        cleanup();
    }

    // Setup function to initialize the filterbank
    void setup(int numParallel, int numBiquads)
    {
        mNumParallel = numParallel;
        mNumBiquads = numBiquads;
        mStride = mNumBiquads * 6;

        // Resize and initialize IIR filters
        mIIRFilters.assign(mNumParallel, std::vector<TwoPole<T>>(mNumBiquads));
    }

    // Cleanup function
    void cleanup()
    {
        std::printf("Cleaning up filterbank...\n");
        for (auto& filterRow : mIIRFilters)
        {
            for (auto& filter : filterRow)
            {
                filter.cleanup();
            }
        }
        mIIRFilters.clear();
    }

    /**
     * @brief Set the coefficients of the filterbank
     * @param coeffs: The coefficients in order [b0, b1, b2, a0, a1, a2]
     * @param interpolate: Flag for interpolation (not implemented in this example)
     */
    void setCoefficients(const std::vector<T>& coeffs)
    {
        if (coeffs.size() < mNumParallel * mNumBiquads * mStride)
        {
            throw std::invalid_argument("Insufficient coefficient size.");
        }

        for (int i = 0; i < mNumParallel; ++i)
        {
            for (int j = 0; j < mNumBiquads; ++j)
            {
                int idx = i * mStride + j * 6;
                mIIRFilters[i][j].set_coefficients(
                    coeffs[idx], 
                    coeffs[idx + 1], 
                    coeffs[idx + 2], 
                    coeffs[idx + 4], 
                    coeffs[idx + 5]
                );
            }
        }
    }

    void printCoefficients()
    {
        for (int i = 0; i < mNumParallel; i++)
        {
            for (int j = 0; j < mNumBiquads; j++)
            {
                std::printf("Filter %d Biquad %d: a1: %f a2: %f b0: %f b1: %f b2: %f\n",
                    i, j,
                    mIIRFilters[i][j].m_coeff[0],
                    mIIRFilters[i][j].m_coeff[1],
                    mIIRFilters[i][j].m_coeff[2],
                    mIIRFilters[i][j].m_coeff[3],
                    mIIRFilters[i][j].m_coeff[4]
                );
            }
        }
    }

    // Process a single sample through the filterbank
    T tick(T in)
    {
        T out = 0.0;

        // Process input through each parallel filter chain
        for (auto& filterRow : mIIRFilters)
        {
            T filterOut = in;

            // Sequentially process each biquad in the filter row
            for (auto& filter : filterRow)
            {
                filterOut = filter.process(filterOut);
            }

            out += filterOut;
        }

        return out;
    }

private:
    int mNumParallel = 0;
    int mNumBiquads = 0;
    int mStride = 0;

    std::vector<std::vector<TwoPole<T>>> mIIRFilters;
};
