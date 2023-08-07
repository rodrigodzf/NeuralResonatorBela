/**
  \ingroup NNLib
  \file    PytorchFrontend
  \brief   This file contains the implementation for class PytorchFrontend.
  \author  rodrigodzf@gmail.com
  \date    2022-03-28
*/

#pragma once

#include <ATen/TensorIndexing.h>
#include <c10/core/TensorOptions.h>
#include <string>
#include <vector>
#include <array>
#include <memory>

#include <torch/script.h>


class PytorchFrontend
{

private:
    torch::jit::script::Module mModule;
    void printDebug();
    torch::TensorOptions options;

public:
    std::vector<float> coefficients;

public:
    PytorchFrontend();
    ~PytorchFrontend();

    bool load(const std::string &filename);

    template <typename T>
    bool process(
        std::vector<T> &feature_vector,
        std::vector<T> &coords_vector,
        std::vector<T> &materials_vector
    )
    {
        c10::InferenceMode guard;

        torch::Tensor feature_tensor = torch::from_blob(
            feature_vector.data(),
            {1, 32},
            options
        );

        // Get a pointer to the input tensors
        torch::Tensor material_tensor = torch::from_blob(
            materials_vector.data(),
            {1, 5},
            options
        );

        torch::Tensor coords_tensor = torch::from_blob(
            coords_vector.data(),
            {1, 2},
            options
        );

        torch::Tensor input_tensor = torch::cat(
            {feature_tensor, coords_tensor, material_tensor},
            1
        );
        
        // print the shape of the input tensor
        // std::cout << "Input tensor shape: " << input_tensor.sizes() << "\n";
        // std::cout << "Input tensor: " << input_tensor << "\n";

        // Execute the model and turn its output into a tensor.
        auto coefficientTensor = mModule.forward({input_tensor}).toTensor();
        
        // print the shape of the output tensor
        // std::cout << "Output tensor shape: " << coefficientTensor.sizes() << "\n";

        // print the first 10 coefficients along the last dimension
        // auto b = coefficientTensor.index(
        //     {0, 0, 0, torch::indexing::Slice(torch::indexing::None, 3)}
        // );
        // auto a = coefficientTensor.index(
        //     {0, 0, 0, torch::indexing::Slice(3, torch::indexing::None)}
        // );

        // std::cout << "b: " << b << "\n";
        // std::cout << "a: " << a << "\n";

        std::memcpy(
            coefficients.data(),
            coefficientTensor.data_ptr(),
            coefficientTensor.numel() * sizeof(float)
        );

        return true;
    }
};
