#pragma once

#include <vector>
#include <string>
#include <sstream>

#define N_COEFFICIENTS_TWO_POLE 5
template <typename T>
class TwoPole
{
public:
    TwoPole()
    : m_s0(0.0F)
    , m_s1(0.0F)
    {
        for (int i = 0; i < N_COEFFICIENTS_TWO_POLE; i++)
        {
            m_coeff[i] = 0.0F;
        }
    }

    void cleanup()
    {
        m_s0 = 0.0F;
        m_s1 = 0.0F;
        for (int i = 0; i < N_COEFFICIENTS_TWO_POLE; i++)
        {
            m_coeff[i] = 0.0F;
        }
    }

    void set_coefficients(T b0, T b1, T b2, T a1, T a2)
    {
        m_coeff[0] = a1;
        m_coeff[1] = a2;
        m_coeff[2] = b0;
        m_coeff[3] = b1;
        m_coeff[4] = b2;
    }

    void set_coefficients(const T* coefficients, unsigned int nCoefficients)
    {
        if (nCoefficients == N_COEFFICIENTS_TWO_POLE)
        {
            m_coeff[0] = coefficients[0];
            m_coeff[1] = coefficients[1];
            m_coeff[2] = coefficients[2];
            m_coeff[3] = coefficients[3];
            m_coeff[4] = coefficients[4];
        }
    }

    template <typename A>
    void set_coefficients(const std::vector<T, A>& coefficients)
    {
        if (coefficients.size() == N_COEFFICIENTS_TWO_POLE)
        {
            set_coefficients(coefficients.data(), coefficients.size());
        }
    }

    std::vector<T> get_coefficients_vector()
    {
        std::vector<T> coefficients(std::begin(m_coeff), std::end(m_coeff));
        return coefficients;
    }

    T* get_coefficients_ptr() { return &m_coeff[0]; }

    const T& get_coefficients_ref() { return m_coeff; }

    T get_coefficient(unsigned int index) { return m_coeff[index]; }

    T process(const T x)
    {
        T y = m_coeff[2] * x + m_s0;
        m_s0 = m_coeff[3] * x - m_coeff[0] * y + m_s1;
        m_s1 = m_coeff[4] * x - m_coeff[1] * y;
        return y;
    }

    std::string to_string()
    {
        std::stringstream ss;
        ss << "a1: " << m_coeff[0] << " a2: " << m_coeff[1]
           << " b0: " << m_coeff[2] << " b1: " << m_coeff[3]
           << " b2: " << m_coeff[4];
        return ss.str();
    }

    unsigned int get_n_coefficients() { return N_COEFFICIENTS_TWO_POLE; }

    T m_coeff[N_COEFFICIENTS_TWO_POLE];  // a1, a2, b0, b1, b2
private:
    T m_s0;
    T m_s1;
};
