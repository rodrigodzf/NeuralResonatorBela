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