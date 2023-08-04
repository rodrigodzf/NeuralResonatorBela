
#include <cstdio>
#include <memory>

#include <Bela.h>
#include "AudioFilePlayer.h"
#include "Filterbank.h"

std::unique_ptr<AudioFilePlayer> player;
std::unique_ptr<Filterbank> filterbank;

bool setup(BelaContext *context, void *userData)
{   
    // Initialize player
    player = std::make_unique<AudioFilePlayer>("audio/loop.wav");

    // Initialize filter
    filterbank = std::make_unique<Filterbank>(32, 2);

    return true;
}

void render(BelaContext *context, void *userData)
{
    // Loop over each audio frame (multi-channel sample)
    for(unsigned int n = 0; n < context->audioFrames; n++)
    {
        float out = 0;

        // Loop over each audio channel
        for (unsigned int ch = 0; ch < context->audioOutChannels; ch++)
        {
            out += player->tick();
            audioWrite(context, n, ch, out);
        }
    }
}

void cleanup(BelaContext *context, void *userData)
{
    fprintf(stdout, "Exiting...\n");
    player->reset();
    filterbank->reset();
}
