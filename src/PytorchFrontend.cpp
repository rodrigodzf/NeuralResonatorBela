#include "PytorchFrontend.h"

PytorchFrontend::PytorchFrontend()
{}

PytorchFrontend::~PytorchFrontend()
{
}

void PytorchFrontend::printDebug()
{

}

bool PytorchFrontend::load(const std::string &filename)
{
    c10::InferenceMode guard;
    torch::jit::setGraphExecutorOptimize(false);
    torch::jit::getProfilingMode() = false;
    try
    {
        // Deserialize the ScriptModule from a file using torch::jit::load().
        mModule = torch::jit::load(filename);
        mModule.eval();

    }
    catch (const std::exception &e)
    {
        fprintf(stderr, "Error loading model: %s\n", e.what());
        return false;
    }

    fprintf(stdout, "Model %s loaded\n", filename.c_str());

    return true;
}
