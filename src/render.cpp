
#include <cstdio>
#include <cstdlib>
#include <memory>

#include <Bela.h>
#include <libraries/AudioFile/AudioFile.h>
#include <libraries/Gui/Gui.h>

#include "AudioFilePlayer.h"
#include "Filterbank.h"
#include "AppOptions.h"
#include "ShapeFFT.h"
#include "PytorchFrontend.h"

std::unique_ptr<AudioFilePlayer> player;
std::unique_ptr<Filterbank> filterbank;
std::unique_ptr<PytorchFrontend> nn;
std::unique_ptr<ShapeFFT> fft;

// Auxiliary task for running the nn
AuxiliaryTask gNNTask;
void process_nn_background(void*);
bool gNewCoefficients = false;

// GUI
std::unique_ptr<Gui> gui;

// Communcation
FixedPointsArray g_points_x;
FixedPointsArray g_points_y;

// debug
bool run_1000 = true;
int run_index = 0;
std::vector<std::vector<float>> debug_mono_output;
bool g_impulse = false;
bool do_once = false;
//! debug


bool existsAndIsNumber(JSONObject& json, const std::wstring& str)
{
	return (json.find(str) != json.end() && json[str]->IsNumber());
}

double retrieveAsNumber(JSONObject& json, const std::string& str)
{
	std::wstring ws = JSON::s2ws(str);
	if(existsAndIsNumber(json, ws))
	{
		double ret = json[ws]->AsNumber();
		return ret;
	}
	else
		throw(std::runtime_error("Value " + str + "not found\n"));
}

bool retrieve_points(
    JSONObject& json,
    const std::string& str,
    FixedPointsArray& points_x,
    FixedPointsArray& points_y
)
{
    std::wstring ws = JSON::s2ws(str);
    bool ret = false;
    if(json[ws]->IsArray())
    {
        // printf("Found array\n");
        JSONArray arr = json[ws]->AsArray();
        if (arr.size() != SAMPLES)
        {
            fprintf(stderr, "Expected exactly points, got %d\n", arr.size());
            std::exit(1);
            ret = false;
        }
        for(int i = 0; i < arr.size(); i++)
        {
            if(arr[i]->IsObject())
            {
                auto point = arr[i]->AsObject();
                auto x_wstr = JSON::s2ws("x");
                auto y_wstr = JSON::s2ws("y");
                if(point[x_wstr]->IsNumber())
                {
                    points_x[i] = point[x_wstr]->AsNumber();
                }

                if(point[y_wstr]->IsNumber())
                {
                    points_y[i] = point[y_wstr]->AsNumber();
                }
                ret = true;
            }
        }
    }

    return ret;
}

bool gui_callback(JSONObject& json, void*)
{    
    if (json.find(JSON::s2ws("rho")) != json.end())
    {
        auto rho = retrieveAsNumber(json, "rho");
        // fprintf(stdout, "Received rho: %f\n", rho);
    }
    else if(json.find(JSON::s2ws("vertices")) != json.end())
    {
        if (retrieve_points(json, "vertices", g_points_x, g_points_y))
        {
            Bela_scheduleAuxiliaryTask(gNNTask);
        }
    }
    else if (json.find(JSON::s2ws("hit")) != json.end())
    {
        g_impulse = true;
        fprintf(stdout, "Received hit\n");
    }

    return false;
}

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
    fprintf(stdout, "Project name: %s\n", context->projectName);

    // Initialize player
    player = std::make_unique<AudioFilePlayer>(options->audioFile);

    // Initialize filter
    filterbank = std::make_unique<Filterbank>();
    filterbank->setup(32, 2);

    // pole = 0.99 * np.exp(1j * np.pi * 0.1)
    // a = np.poly([pole, np.conj(pole)])
    // filterbank->setCoefficients(
    //     {0.1, 0.0, 0.0, 1.0, -1.93522916, 0.998001}
    // );

    // Initialize Pytorch frontend
    nn = std::make_unique<PytorchFrontend>();
    if(!nn->load(options->modelPath))
    {
        std::exit(1);
    }

    // Initialize FFT
    fft = std::make_unique<ShapeFFT>();

	// Initialise auxiliary tasks
	if(
        (gNNTask = Bela_createAuxiliaryTask(&process_nn_background, 90, "process_nn")) == 0
    )
    {
        fprintf(stderr, "Error creating auxiliary task\n");
		return false;
    }

    // Initialize the gui
    gui = std::make_unique<Gui>();
    gui->setup(context->projectName);
    gui->setControlDataCallback(gui_callback, nullptr);

    // Initialize debug output
    debug_mono_output.resize(2);
    debug_mono_output[0].resize(context->audioFrames * 1000);
    debug_mono_output[1].resize(context->audioFrames * 1000);

    return true;
}

void render(BelaContext *context, void *userData)
{
    // if (run_1000)
    // {
    // Loop over each audio frame (multi-channel sample)
    for(unsigned int n = 0; n < context->audioFrames; n++)
    {
        float out = 0;

        // out = player->tick();
        if (g_impulse)
        {
            out = 1.0;
            g_impulse = false;
        }

        out = static_cast<float>(filterbank->tick(out));

        // Loop over each audio channel
        for (unsigned int ch = 0; ch < context->audioOutChannels; ch++)
        {
            audioWrite(context, n, ch, out);
            // debug_mono_output[ch][n + run_index * context->audioFrames] = out;
        }
    }

    // do_once = false;

        // if (run_index++ >= 999)
        // {
        //     run_1000 = false;
        //     printf("Done!\n");
        // }
    // }

    // received new coefficients
    // we can probably do this also with pipes
    if (gNewCoefficients)
    {
        fprintf(stdout, "New coefficients received\n");
        filterbank->setCoefficients(nn->coefficients);
        // print the first 10 coefficients and the last 10
        for (int i = 0; i < 10; i++)
        {
            fprintf(stdout, "%f ", nn->coefficients[i]);
        }
        fprintf(stdout, "\n");

        for (int i = nn->coefficients.size() - 10; i < nn->coefficients.size(); i++)
        {
            fprintf(stdout, "%f ", nn->coefficients[i]);
        }
        fprintf(stdout, "\n");

        gNewCoefficients = false;
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

void process_nn_background(void*)
{
    // TODO: here we need to read the GUI parameters and also the sensor data
    std::vector<float> material_params = {
        0.07263158, 0.0014014, 0.74, -0.01724138, 0.1959799
    };

    std::vector<float> coords = {
        0.72396886, 0.3139989
    };


    // g_points_x = {
    //     0.8379998,  0.7519936,  0.6659874,  0.5799812,  0.49397498, 0.40796876,
    //     0.32710645, 0.24999724, 0.17517596, 0.13158184, 0.09858637, 0.06559091,
    //     0.03422932, 0.08377543, 0.1671142,  0.25045297, 0.3337917,  0.42014742,
    //     0.5068236,  0.5934997,  0.6801759,  0.766852,   0.8354631,  0.88813186,
    //     0.940648,   0.9626781,  0.97272366, 0.97465295, 0.97464085, 0.97305685,
    //     0.924498,   0.8379998
    // };

    // g_points_y = {
    //     0.81074345, 0.79867345, 0.7866034,  0.7745334,  0.7624634,  0.75039333,
    //     0.71973205, 0.68017864, 0.6360818,  0.564928,   0.48459086, 0.40425372,
    //     0.3232834,  0.28176603, 0.25732416, 0.2328823,  0.20844044, 0.20114243,
    //     0.19566542, 0.1901884,  0.18471138, 0.17923436, 0.21753444, 0.28658152,
    //     0.3557538,  0.43719634, 0.5234624,  0.610199,   0.697048,   0.7838793,
    //     0.81854194, 0.81074345
    // };

    // print the first 10 points
    // for (int i = 0; i < 10; i++)
    // {
    //     printf("Point %f %f\n", g_points_x[i], g_points_y[i]);
    // }


    // points must be in the range [0, 1] range
    fft->fft_magnitude(
        g_points_x,
        g_points_y
    );

    std::vector<float> features(
        std::begin(fft->mag),
        std::end(fft->mag)
    );

    // print the first 10 values of the magnitude
    // for (int i = 0; i < 10; i++)
    // {
    //     printf("FFT Mag %f\n", features[i]);
    // }

    nn->process(
        features,
        coords,
        material_params
    );

    // print the first 20 values of the output
    // for (int i = 0; i < 20; i++)
    // {
    //     printf("Output %f\n", nn->coefficients[i]);
    // }
    gNewCoefficients = true;

}