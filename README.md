# NeuralResonatorBela

## How to build this project

### Flashing the Bela

It is neccesary to flash the Bela with the latest experimental image. It can be downloaded **[here](https://github.com/BelaPlatform/bela-image-builder/releases/tag/v0.5.0alpha2)**

### Install extensions in VS Code

Before you start, make sure you have installed the following extensions in VS Code: **Remote Development Extension Pack**

This extension pack includes the "Remote - Containers" extension which is necessary to work with .devcontainer.json.

### Clone and build the project

Clone this repository and open it in VS Code using the "Remote - Containers" extension.

Connect the Bela to your computer via USB and run the following command in the terminal:

```bash
$ bash build.sh
```
## Running the Pepper build

This project can also build a version that can run on the Bela [Pepper](https://www.youtube.com/watch?v=VLHxIMeSU-c). For this you need to switch to the **pepper** branch and run the build script again.

Note that the Pepper build uses a custom web interface which is served by a server on a remote machine and not in the Bela. For this you need to start a server on your computer. This can be done by navigating to the `gui` folder and running the following command in the terminal:

```bash
npm install --include=dev
npm run build
npm run preview
```

For information about how to develop the web interface, see the [gui/readme.md](gui/readme.md) file.

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

### Interact with the Bela (without Pepper build)

From your local machine, run the gui using:

```bash
cd gui
npm install --include=dev
npm run build
npm run preview
```