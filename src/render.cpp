
#include <cstdio>
#include <memory>

#include <Bela.h>
#include "AudioFilePlayer.h"
#include "Filterbank.h"
#include "AppOptions.h"
#include "libraries/AudioFile/AudioFile.h"
#include "PytorchFrontend.h"

std::unique_ptr<AudioFilePlayer> player;
std::unique_ptr<Filterbank> filterbank;
std::unique_ptr<PytorchFrontend> nn;

// Auxiliary task for running the nn
// AuxiliaryTask gNNTask;

// debug
bool run_1000 = true;
int run_index = 0;
std::vector<std::vector<float>> debug_mono_output;
bool impulse = true;
//! debug

bool setup(BelaContext *context, void *userData)
{   
    // Get options
    AppOptions *options = static_cast<AppOptions *>(userData);

    fprintf(stdout, "Audio file: %s\n", options->audioFile.c_str());
    fprintf(stdout, "Model file: %s\n", options->modelPath.c_str());
    fprintf(stdout, "Buffer size: %d\n", context->audioFrames);
    fprintf(stdout, "Number of input channels: %d\n", context->audioInChannels);
    fprintf(stdout, "Number of output channels: %d\n", context->audioOutChannels);
    fprintf(stdout, "Sample rate: %f\n", context->audioSampleRate);

    // Initialize player
    player = std::make_unique<AudioFilePlayer>(options->audioFile);

    // Initialize filter
    filterbank = std::make_unique<Filterbank>(1, 1);

    // pole = 0.99 * np.exp(1j * np.pi * 0.1)
    // a = np.poly([pole, np.conj(pole)])
    filterbank->setCoefficients(
        {0.1, 0.0, 0.0, 1.0, -1.93522916, 0.998001}
    );

    // Initialize Pytorch frontend
    nn = std::make_unique<PytorchFrontend>();
    if(!nn->load(options->modelPath))
    {
        std::exit(1);
    }

    // Initialize debug output
    debug_mono_output.resize(2);
    debug_mono_output[0].resize(context->audioFrames * 1000);
    debug_mono_output[1].resize(context->audioFrames * 1000);

    return true;
}

void render(BelaContext *context, void *userData)
{
    if (run_1000)
    {
        // Loop over each audio frame (multi-channel sample)
        for(unsigned int n = 0; n < context->audioFrames; n++)
        {
            float out = 0;

            // out = player->tick();
            if (impulse)
            {
                out = 1.0;
                impulse = false;
            }
            out = filterbank->tick(out);

            // Loop over each audio channel
            for (unsigned int ch = 0; ch < context->audioOutChannels; ch++)
            {
                audioWrite(context, n, ch, out);
                debug_mono_output[ch][n + run_index * context->audioFrames] = out;
            }
        }

        if (run_index++ >= 999)
        {
            run_1000 = false;
            printf("Done!\n");
        }
    }
}

void cleanup(BelaContext *context, void *userData)
{
    // Save the output to a file
    AudioFileUtilities::write(
        "debug_mono_output.wav",
        debug_mono_output,
        16000 // sample rate of the input file
    );

    fprintf(stdout, "Exiting...\n");
    player.reset();
    filterbank.reset();
    nn.reset();
}
