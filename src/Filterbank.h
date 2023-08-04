#pragma once

#include <vector>
#include "TwoPole.h"

class Filterbank
{
public:
    Filterbank();
    ~Filterbank();

    Filterbank(int numParallel, int numBiquads);
    void setup(int numParallel, int numBiquads);

    void cleanup();
    /**
     * @brief  Set the coefficients of the filterbank
     * @note   The coefficients are expected to be in the following order:
     * b0, b1, b2, a0, a1, a2
     * @param  coeffs: The coefficients
     * @retval None
     */
    void setCoefficients(const std::vector<float>& coeffs, bool interpolate = false);

    double tick(double in);


private:
    std::vector<std::vector<TwoPole<double>>> mIIRFilters;

    int mNumParallel;
    int mNumBiquads;
    int mStride;
    unsigned int mInterpolationDelta;

};
