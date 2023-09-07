
#include <cstdio>
#include <cstdlib>
#include <memory>

#include <Bela.h>
#include <libraries/AudioFile/AudioFile.h>
#include <libraries/Gui/Gui.h>

#include "AppOptions.h"
#include "Filterbank.h"
#include "PytorchFrontend.h"
#include "ShapeFFT.h"
#include <libraries/Pipe/Pipe.h>
#include <vector>

std::unique_ptr<Filterbank> filterbank;
std::unique_ptr<PytorchFrontend> nn;
std::unique_ptr<ShapeFFT> fft;

// Auxiliary task for running the nn
AuxiliaryTask gNNTask;
AuxiliaryTask gScalingTask;
void process_nn_background(void*);
void process_scaling_background(void*);
bool gNewCoefficients = false;

// GUI
std::unique_ptr<Gui> gui;
float gPolygonChanged = 0.0;

// Communcation
Pipe g_pipe;
FixedPointsArray g_points_x;
FixedPointsArray g_points_y;
std::vector<float> g_scaling;
std::vector<float> g_coords;

bool once_every_n_blocks = true;
int n_blocks = 200;	   // 100ms -> 32000 / 16 = 2000 = 1 second
int block_counter = 0;

// analog frames
int gAudioFramesPerAnalogFrame = 0;

void initialize_parameters() {
	// Initialize default parameters

	g_scaling = {
		1.0F,			   // scale factor
		15000.0F,		   // rho
		8000000000.0F,	   // E
		1.0F,			   // alpha
		0.0000003F,		   // beta
		1.0F / 32000.0F	   // sampling period
	};

	g_points_x = {0.6670909,  0.6317929,  0.5964949,  0.5611969,  0.5258989,  0.4906009,
				  0.4553029,  0.4200049,  0.38470688, 0.3494089,  0.31411088, 0.2788129,
				  0.24351488, 0.20821688, 0.17291887, 0.13762087, 0.12366271, 0.11611941,
				  0.10857611, 0.10103282, 0.12304196, 0.1511757,  0.17930943, 0.20744316,
				  0.2355769,  0.26371062, 0.29184437, 0.3199781,  0.34811184, 0.37645793,
				  0.40781644, 0.43917498, 0.4705335,  0.5026827,  0.54357654, 0.58447045,
				  0.61232543, 0.6392445,  0.6661636,  0.6930827,  0.72000176, 0.7448338,
				  0.7694617,  0.79408956, 0.8187174,  0.83837587, 0.85631174, 0.8740561,
				  0.89127254, 0.8997585,  0.8966665,  0.8935746,  0.8904826,  0.8873906,
				  0.8842986,  0.88120663, 0.87811464, 0.87302023, 0.8470613,  0.8211023,
				  0.7911741,  0.7498131,  0.708452,	  0.6670909};

	g_points_y = {0.9445403,  0.92261666, 0.900693,	  0.87876934, 0.8568457,  0.834922,
				  0.81299835, 0.79107463, 0.769151,	  0.7472273,  0.72530365, 0.70338,
				  0.6814563,  0.65953267, 0.637609,	  0.6156853,  0.57920057, 0.53833866,
				  0.49747676, 0.45661485, 0.42427042, 0.39369118, 0.36311194, 0.33253273,
				  0.3019535,  0.27137426, 0.24079503, 0.2102158,  0.17963658, 0.14927578,
				  0.12201335, 0.09475093, 0.06748851, 0.04309765, 0.05046566, 0.05783366,
				  0.08786093, 0.11951467, 0.1511684,  0.18282214, 0.21447587, 0.24778159,
				  0.28124896, 0.31471634, 0.34818372, 0.38463232, 0.42211434, 0.45968664,
				  0.49747592, 0.5378278,  0.57926494, 0.6207021,  0.6621392,  0.7035763,
				  0.7450135,  0.7864506,  0.8278877,  0.8685375,  0.9009833,  0.9334291,
				  0.95648706, 0.9525048,  0.94852257, 0.9445403};

	g_coords = {0.70238614, 0.4862546};
}

bool existsAndIsNumber(JSONObject& json, const std::wstring& str) {
	return (json.find(str) != json.end() && json[str]->IsNumber());
}

double retrieveAsNumber(JSONObject& json, const std::string& str) {
	std::wstring ws = JSON::s2ws(str);
	if (existsAndIsNumber(json, ws)) {
		double ret = json[ws]->AsNumber();
		return ret;
	} else
		throw(std::runtime_error("Value " + str + "not found\n"));
}

bool retrieve_points(
	JSONObject& json, const std::string& str, FixedPointsArray& points_x, FixedPointsArray& points_y
) {
	std::wstring ws = JSON::s2ws(str);
	bool ret = false;
	if (json[ws]->IsArray()) {
		// printf("Found array\n");
		JSONArray arr = json[ws]->AsArray();
		if (arr.size() != SAMPLES) {
			fprintf(stderr, "Expected exactly %d points, got %d\n", SAMPLES, arr.size());
			std::exit(1);
			ret = false;
		}
		for (int i = 0; i < arr.size(); i++) {
			if (arr[i]->IsObject()) {
				auto point = arr[i]->AsObject();
				auto x_wstr = JSON::s2ws("x");
				auto y_wstr = JSON::s2ws("y");
				if (point[x_wstr]->IsNumber()) {
					points_x[i] = point[x_wstr]->AsNumber();
				}

				if (point[y_wstr]->IsNumber()) {
					points_y[i] = point[y_wstr]->AsNumber();
				}
				ret = true;
			}
		}
	}

	return ret;
}

bool setup(BelaContext* context, void* userData) {
	// Get options
	AppOptions* options = static_cast<AppOptions*>(userData);

	fprintf(stdout, "Audio file: %s\n", options->audioFile.c_str());
	fprintf(stdout, "Model file: %s\n", options->modelPath.c_str());
	fprintf(stdout, "Buffer size: %d\n", context->audioFrames);
	fprintf(stdout, "Number of input channels: %d\n", context->audioInChannels);
	fprintf(stdout, "Number of output channels: %d\n", context->audioOutChannels);
	fprintf(stdout, "Sample rate: %f\n", context->audioSampleRate);
	fprintf(stdout, "Project name: %s\n", context->projectName);

	// Initialize filter
	filterbank = std::make_unique<Filterbank>();
	filterbank->setup(32, 1);

	// Initialize Pytorch frontend
	nn = std::make_unique<PytorchFrontend>();
	if (!nn->load(options->modelPath)) {
		std::exit(1);
	}

	// Initialize FFT
	fft = std::make_unique<ShapeFFT>();

	// Initialise auxiliary tasks
	if ((gNNTask = Bela_createAuxiliaryTask(&process_nn_background, 80, "process_nn")) == 0) {
		fprintf(stderr, "Error creating auxiliary task\n");
		return false;
	}

	if ((gScalingTask =
			 Bela_createAuxiliaryTask(&process_scaling_background, 80, "process_scaling"))
		== 0) {
		fprintf(stderr, "Error creating auxiliary task\n");
		return false;
	}

	// Initialize the gui
	// gui = std::make_unique<Gui>();
	// gui->setup(context->projectName);
	// gui->setControlDataCallback(gui_callback, nullptr);
	gui = std::make_unique<Gui>();
	gui->setup(context->projectName);
	gui->setBuffer('f', 1);		 // Polygon Changes
	gui->setBuffer('f', 128);	 // Polygon
	gui->setBuffer('f', 2);		 // Point

								 // Initialize analog
	if (context->analogFrames) {
		gAudioFramesPerAnalogFrame = context->audioFrames / context->analogFrames;
		fprintf(stdout, "Audio Frames Per Analog Frame %d\n", gAudioFramesPerAnalogFrame);
	}

	// Initialize the pipe
	// g_pipe.setup("gui_to_rt");

	// Initialize default parameters
	initialize_parameters();

    // Do the inference once to warm up the model
    process_nn_background(nullptr);

	return true;
}

void render(BelaContext* context, void* userData) {
	float in_1;
	float in_2;
	float in_3;
	float in_4;
	float in_5;
	// float in_6;
	// float in_7;
	// float in_8;

	// update polygon
	if (gPolygonChanged != gui->getDataBuffer(0).getAsFloat()[0]) {
		gPolygonChanged = gui->getDataBuffer(0).getAsFloat()[0];
		float* Polygon = gui->getDataBuffer(1).getAsFloat();
		for (int i = 0; i < 128; i += 2) {
			g_points_x[i / 2] = Polygon[i];
			g_points_y[i / 2] = Polygon[i + 1];
		}
		Bela_scheduleAuxiliaryTask(gNNTask);
		// rt_printf("x1 %f \n", Polygon[0]);
		// rt_printf("y1 %f \n", Polygon[1]);
		// rt_printf("x2 %f \n", Polygon[2]);
		// rt_printf("y2 %f \n", Polygon[3]);
	}

	// update strike location
	float* strike = gui->getDataBuffer(2).getAsFloat();
	if (strike[0] != g_coords[0] || strike[1] != g_coords[1]) {
		g_coords[0] = strike[0];
		g_coords[1] = strike[1];
		// the inference is also fast but not fast enough
		// we do it in the background
		Bela_scheduleAuxiliaryTask(gNNTask);
		// rt_printf("strike %f %f \n", strike[0], strike[1]);
	}

	if ((++block_counter % n_blocks) == 0) {
		fprintf(stdout, "Tick\n");
		block_counter = 0;
		once_every_n_blocks = true;
	} else {
		once_every_n_blocks = false;
	}
#if 1
	for (unsigned int n = 0; n < context->audioFrames; n++) {
		if (gAudioFramesPerAnalogFrame && !(n % gAudioFramesPerAnalogFrame)) {

			in_1 = analogRead(context, n / gAudioFramesPerAnalogFrame, 0);
			in_2 = analogRead(context, n / gAudioFramesPerAnalogFrame, 1);
			in_3 = analogRead(context, n / gAudioFramesPerAnalogFrame, 2);
			in_4 = analogRead(context, n / gAudioFramesPerAnalogFrame, 3);
			in_5 = analogRead(context, n / gAudioFramesPerAnalogFrame, 4);
			// in_6 = analogRead(context, n / gAudioFramesPerAnalogFrame, 5);
			// in_7 = analogRead(context, n / gAudioFramesPerAnalogFrame, 6);
			// in_8 = analogRead(context, n / gAudioFramesPerAnalogFrame, 7);

			// Here choose an arbitrary range for the mapping
			// size
			in_1 =
				map(in_1,
					0,		 // in min
					1,		 // in max
					0.5F,	 // out min
					5.0F	 // out max
				);

			// rho
			in_2 =
				map(in_2,
					0,			// in min
					1,			// in max
					1000.0F,	// out min
					15000.0F	// out max
				);

			// E
			in_3 =
				map(in_3,
					0,		  // in min
					1,		  // in max
					1e+9F,	  // out min
					1e+11F	  // out max
				);

			// alpha
			in_4 =
				map(in_4,
					0,		 // in min
					1,		 // in max
					0.0F,	 // out min
					5.0F	 // out max
				);

			// beta
			in_5 =
				map(in_5,
					0,		  // in min
					1,		  // in max
					1e-8F,	  // out min
					1e-6F	  // out max
				);

			if (once_every_n_blocks) {
				g_scaling[0] = in_1;
				g_scaling[1] = in_2;
				g_scaling[2] = in_3;
				g_scaling[3] = in_4;
				g_scaling[4] = in_5;
				// the scaling is very fast but it cannot run as fast as the analog read @16Khz
				// so we schedule a background task
				Bela_scheduleAuxiliaryTask(gScalingTask);
			}
		}

		// apply audio input to filterbank
		float out = static_cast<float>(filterbank->tick(audioRead(context, n, 0)));
		// Loop over each audio channel
		for (unsigned int ch = 0; ch < context->audioOutChannels; ch++) {
			audioWrite(context, n, ch, out);
		}
	}

	// received new coefficients
	// we can probably do this also with pipes
	if (gNewCoefficients) {
		filterbank->setCoefficients(nn->coefficients);
		gNewCoefficients = false;
	}
#endif
}

void cleanup(BelaContext* context, void* userData) {
	fprintf(stdout, "Exiting...\n");
	filterbank.reset();
	nn.reset();
}

void process_scaling_background(void*) {
	nn->scale(g_scaling);

	gNewCoefficients = true;
}

void process_nn_background(void*) {

	// points must be in the range [0, 1] range
	fft->fft_magnitude(g_points_x, g_points_y);

	// points must be in the range [0, 1] range
	fft->fft_magnitude(g_points_x, g_points_y);

	std::vector<float> features(std::begin(fft->mag), std::end(fft->mag));

	nn->process(features, g_coords);

	nn->scale(g_scaling);

	gNewCoefficients = true;
}
