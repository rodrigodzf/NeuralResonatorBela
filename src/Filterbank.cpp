#include <cstdio>

#include "Filterbank.h"

Filterbank::Filterbank()
{
    mNumParallel = 0;
    mNumBiquads = 0;
    mStride = 0;
}

Filterbank::Filterbank(int numParallel, int numBiquads)
{
    setup(numParallel, numBiquads);
}

void Filterbank::setup(int numParallel, int numBiquads)
{
    mNumParallel = numParallel;
    mNumBiquads = numBiquads;
    mStride = mNumBiquads * 3;

    // Set up the IIR filters
    mIIRFilters.resize(mNumParallel);
    for (int i = 0; i < mNumParallel; i++)
    {
        mIIRFilters[i].resize(mNumBiquads);
    }

    for (int i = 0; i < mNumParallel; i++)
    {
        for (int j = 0; j < mNumBiquads; j++)
        {
            mIIRFilters[i][j].set_coefficients(0.0, 0.0, 0.0, 0.0, 0.0);
        }
    }
}

Filterbank::~Filterbank()
{
    cleanup();
}

void Filterbank::cleanup()
{
    fprintf(stdout, "Cleaning up filterbank...\n");
    for (int i = 0; i < mNumParallel; i++)
    {
        for (int j = 0; j < mNumBiquads; j++) { mIIRFilters[i][j].cleanup(); }
    }
}

void Filterbank::setCoefficients(
    const std::vector<float>& coeffs,
    bool interpolate
)
{
    // TODO we need some lock here
    for (int i = 0; i < mNumParallel; i++)
    {
        for (int j = 0; j < mNumBiquads; j++)
        {
            int idx = i * mNumBiquads * mStride + j * mStride;
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

double Filterbank::tick(double in)
{
    // TODO we need some lock here
    double out = 0.0;

    // for each filter
    for (int i = 0; i < mNumParallel; i++)
    {
        double in_for_this_filter = in;
        // process through each biquad
        for (int j = 0; j < mNumBiquads; j++)
        {
            in_for_this_filter = mIIRFilters[i][j].process(in_for_this_filter);
        }

        // add to the output
        out += in_for_this_filter;
    }

    return out;
}