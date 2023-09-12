# NeuralResonatorBela

This is the adaption of [Neural Resonator](https://github.com/rodrigodzf/NeuralResonatorVST) to run on the [Bela](https://bela.io/) platform.

There are some changes to the [original](https://github.com/rodrigodzf/neuralresonator) project, so that it can run on the Bela. The main changes are:

- The shape is encoded using the FFT coefficients of the shape boundary, instead of features from a CNN, which alleviates the feature extraction process.
- The material parameters are used in a post-processing step, instead of being used as input to the model, which makes the model more robust and faster to changes in the material parameters. The simulation is however a bit less accurate w.r.t. to the FEM simulation.
- The MLP model used here is smaller than the original model.


## How to build this project

### Flashing the Bela

It is necessary to flash the Bela with the latest experimental image. It can be downloaded **[here](https://github.com/BelaPlatform/bela-image-builder/releases/tag/v0.5.0alpha2)**

### Install extensions in VS Code

Before you start, make sure you have installed the following extensions in VS Code: **Remote Development Extension Pack**

This extension pack includes the "Remote - Containers" extension which is necessary to work with .devcontainer.json.

### Clone and build the project

Clone this repository and open it in VS Code using the "Remote - Containers" extension.

Connect the Bela to your computer via USB and run the following command in the terminal:

```bash
$ bash build.sh
```

## Running the project

### Connect to the Bela

Connect the Bela to your computer via USB and run the following command in the terminal:

```bash
$ ssh root@bela.local
```

### Navigate to the project folder

```bash
$ cd /root/Bela/projects/NeuralResonatorBela
```

### Run executable

```bash
$ ./NeuralResonatorBela --modelPath optimized_curious-salad-167.pt 
```

### Interact with the Bela

In a web browser, navigate to the Bela IDE at http://bela.local/gui

There you should be able to interact with the Bela and see the output of the program.

## Running the Pepper build

This project can also build a version that can run on the Bela [Pepper](https://www.youtube.com/watch?v=VLHxIMeSU-c). For this you need to switch to the **pepper** branch and run the build script again. This version utilises the Bela's analog inputs to control the parameters.

Note that the Pepper build uses a custom web interface which is served by a server on a remote machine. For this you need to start a server on your computer, not the Bela. This can be done by navigating to the `gui` folder and running the following command in the terminal:

```bash
cd gui
npm install --include=dev
npm run build
npm run preview
```
