
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
#include <libraries/Pipe/Pipe.h>
#include <vector>

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
Pipe g_pipe;
FixedPointsArray g_points_x;
FixedPointsArray g_points_y;
std::vector<float> g_scaling;
std::vector<float> g_coords;

// debug
bool run_1000 = true;
int run_index = 0;
std::vector<std::vector<float>> debug_mono_output;
bool g_impulse = false;
bool do_once = false;
//! debug

void initialize_parameters()
{
    // Initialize default parameters

    g_scaling = {
        1.0F, // scale factor
        15000.0F, // rho
        8000000000.0F, // E
        1.0F, // alpha
        0.0000003F, // beta
        1.0F / 32000.0F // sampling period
    };

    g_points_x = {
        0.6670909,  0.6317929,  0.5964949,  0.5611969,  0.5258989,  0.4906009,
        0.4553029,  0.4200049,  0.38470688, 0.3494089,  0.31411088, 0.2788129,
        0.24351488, 0.20821688, 0.17291887, 0.13762087, 0.12366271, 0.11611941,
        0.10857611, 0.10103282, 0.12304196, 0.1511757,  0.17930943, 0.20744316,
        0.2355769,  0.26371062, 0.29184437, 0.3199781,  0.34811184, 0.37645793,
        0.40781644, 0.43917498, 0.4705335,  0.5026827,  0.54357654, 0.58447045,
        0.61232543, 0.6392445,  0.6661636,  0.6930827,  0.72000176, 0.7448338,
        0.7694617,  0.79408956, 0.8187174,  0.83837587, 0.85631174, 0.8740561,
        0.89127254, 0.8997585,  0.8966665,  0.8935746,  0.8904826,  0.8873906,
        0.8842986,  0.88120663, 0.87811464, 0.87302023, 0.8470613,  0.8211023,
        0.7911741,  0.7498131,  0.708452,   0.6670909
    };

    g_points_y = {
        0.9445403,  0.92261666, 0.900693,   0.87876934, 0.8568457,  0.834922,
        0.81299835, 0.79107463, 0.769151,   0.7472273,  0.72530365, 0.70338,
        0.6814563,  0.65953267, 0.637609,   0.6156853,  0.57920057, 0.53833866,
        0.49747676, 0.45661485, 0.42427042, 0.39369118, 0.36311194, 0.33253273,
        0.3019535,  0.27137426, 0.24079503, 0.2102158,  0.17963658, 0.14927578,
        0.12201335, 0.09475093, 0.06748851, 0.04309765, 0.05046566, 0.05783366,
        0.08786093, 0.11951467, 0.1511684,  0.18282214, 0.21447587, 0.24778159,
        0.28124896, 0.31471634, 0.34818372, 0.38463232, 0.42211434, 0.45968664,
        0.49747592, 0.5378278,  0.57926494, 0.6207021,  0.6621392,  0.7035763,
        0.7450135,  0.7864506,  0.8278877,  0.8685375,  0.9009833,  0.9334291,
        0.95648706, 0.9525048,  0.94852257, 0.9445403
    };
    
    g_coords = {
        0.70238614, 0.4862546
    };
}

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
            fprintf(stderr, "Expected exactly %d points, got %d\n", SAMPLES, arr.size());
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
    if (json.find(JSON::s2ws("size")) != json.end())
    {
        auto param = retrieveAsNumber(json, "size");
        g_scaling[0] = static_cast<float>(param); // physical size

        nn->scale(
            g_scaling
        );
        
        gNewCoefficients = true;
    }
    else if (json.find(JSON::s2ws("rho")) != json.end())
    {
        auto param = retrieveAsNumber(json, "rho");
        g_scaling[1] = static_cast<float>(param); // rho

        // the scaling is very fast, so we can do it in the gui thread
        nn->scale(
            g_scaling
        );
        
        // write to the pipe
        // g_pipe.writeNonRt(nn->coefficients);
        gNewCoefficients = true;
        // fprintf(stdout, "Received rho: %f\n", rho);
    }
    else if (json.find(JSON::s2ws("E")) != json.end())
    {
        auto param = retrieveAsNumber(json, "E");
        g_scaling[2] = static_cast<float>(param); // E

        nn->scale(
            g_scaling
        );
        
        gNewCoefficients = true;
    }

    else if (json.find(JSON::s2ws("alpha")) != json.end())
    {
        auto param = retrieveAsNumber(json, "alpha");
        g_scaling[3] = static_cast<float>(param); // alpha

        nn->scale(
            g_scaling
        );
        
        gNewCoefficients = true;
    }
    else if (json.find(JSON::s2ws("beta")) != json.end())
    {
        auto param = retrieveAsNumber(json, "beta");
        g_scaling[4] = static_cast<float>(param); // beta

        nn->scale(
            g_scaling
        );
        
        gNewCoefficients = true;
    }
    else if(json.find(JSON::s2ws("coords")) != json.end())
    {
        if (json[JSON::s2ws("coords")]->IsObject())
        {
            auto coords = json[JSON::s2ws("coords")]->AsObject();
            auto x_wstr = JSON::s2ws("x");
            auto y_wstr = JSON::s2ws("y");
            if(coords[x_wstr]->IsNumber())
            {
                g_coords[0] = coords[x_wstr]->AsNumber();
            }

            if(coords[y_wstr]->IsNumber())
            {
                g_coords[1] = coords[y_wstr]->AsNumber();
            }

            // the inference is also fast but not fast enough
            // we do it in the background
            Bela_scheduleAuxiliaryTask(gNNTask);
        }
    }
    else if(json.find(JSON::s2ws("vertices")) != json.end())
    {
        if (retrieve_points(json, "vertices", g_points_x, g_points_y))
        {
            // the inference is also fast but not fast enough
            // we do it in the background
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
    filterbank->setup(32, 1);

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
        (gNNTask = Bela_createAuxiliaryTask(&process_nn_background, 80, "process_nn")) == 0
    )
    {
        fprintf(stderr, "Error creating auxiliary task\n");
		return false;
    }

    // Initialize the gui
    gui = std::make_unique<Gui>();
    gui->setup(context->projectName);
    gui->setControlDataCallback(gui_callback, nullptr);

    // Initialize the pipe
    g_pipe.setup("gui_to_rt");
    
    // Initialize default parameters
    initialize_parameters();

    // Do the inference once to warm up the model
    Bela_scheduleAuxiliaryTask(gNNTask);

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

    // std::vector<float> coefficients;
    // bool new_coefficients = false;
    // while(1 == g_pipe.readRt(coefficients))
	// {
    //     fprintf(stdout, "New coefficients received\n");
    //     new_coefficients = true;
    // }
    // if (new_coefficients)
    // {
    //     for (int i = 0; i < 10; i++)
    //     {
    //         fprintf(stdout, "%f ", coefficients[i]);
    //     }
    //     // filterbank->setCoefficients(coefficients);
    // }
    //     // filterbank->setCoefficients(coefficients);
    //     // print the first 10 coefficients and the last 10
    //     // for (int i = 0; i < 10; i++)
    //     // {
    //     //     fprintf(stdout, "%f ", coefficients[i]);
    //     // }
    //     // fprintf(stdout, "\n");

    //     // for (int i = coefficients.size() - 10; i < coefficients.size(); i++)
    //     // {
    //     //     fprintf(stdout, "%f ", coefficients[i]);
    //     // }
    //     // fprintf(stdout, "\n");

	// 	// in case more than one came through, we only care about the
	// 	// most recent
	// 	continue;
	// }


    for(unsigned int n = 0; n < context->audioFrames; n++)
    {
        float out = 0;

        // out = player->tick();
        if (g_impulse)
        {
            out = 0.9;
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
    //     // print the first 10 coefficients and the last 10
    //     for (int i = 0; i < 10; i++)
    //     {
    //         fprintf(stdout, "%f ", nn->coefficients[i]);
    //     }
    //     fprintf(stdout, "\n");

    //     for (int i = nn->coefficients.size() - 10; i < nn->coefficients.size(); i++)
    //     {
    //         fprintf(stdout, "%f ", nn->coefficients[i]);
    //     }
    //     fprintf(stdout, "\n");

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
    // std::vector<float> material_params = {
    //     0.07263158, 0.0014014, 0.74, -0.01724138, 0.1959799
    // };




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
        g_coords
    );

    nn->scale(
        g_scaling
    );
    
    // write to the pipe
    // g_pipe.writeNonRt(nn->coefficients);
    
    // std::vector<float> scaling = {
    //     1.0F, // scale factor
    //     15000.0F, // rho
    //     8000000000.0F, // E
    //     1.0F, // alpha
    //     0.0000003F, // beta
    //     1.0F / 32000.0F // sampling period
    // };
    // nn->scale(
    //     scaling
    // );

    // print the first 20 values of the output
    // for (int i = 0; i < 20; i++)
    // {
    //     printf("Output %f\n", nn->coefficients[i]);
    // }
    gNewCoefficients = true;

}