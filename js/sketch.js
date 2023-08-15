const Point = {
    x: 0,
    y: 0
}

function generateConvex(n) {

    // Generate and sort random coordinates
    const X_rand = Array.from({ length: n }, Math.random).sort((a, b) => a - b);
    const Y_rand = Array.from({ length: n }, Math.random).sort((a, b) => a - b);

    let last_true = 0;
    let last_false = 0;
    const X_new = new Array(n);
    const Y_new = new Array(n);

    for (let i = 0; i < n; i++) {
        if (i !== n - 1) {
            if (Math.random() < 0.5) {
                X_new[i] = X_rand[i] - X_rand[last_true];
                Y_new[i] = Y_rand[i] - Y_rand[last_true];
                last_true = i;
            } else {
                X_new[i] = X_rand[last_false] - X_rand[i];
                Y_new[i] = Y_rand[last_false] - Y_rand[i];
                last_false = i;
            }
        } else {
            X_new[0] = X_rand[i] - X_rand[last_true];
            Y_new[0] = Y_rand[i] - Y_rand[last_true];
            X_new[i] = X_rand[last_false] - X_rand[i];
            Y_new[i] = Y_rand[last_false] - Y_rand[i];
        }
    }

    // Shuffle Y_new in place
    for (let i = Y_new.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [Y_new[i], Y_new[j]] = [Y_new[j], Y_new[i]];
    }

    // Combine X_new and Y_new, then sort by polar angle
    const vertices = X_new.map((x, idx) => ({ x, y: Y_new[idx] }))
        .sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));

    // Compute the cumulative sum
    for (let i = 1; i < n; i++) {
        vertices[i].x += vertices[i - 1].x;
        vertices[i].y += vertices[i - 1].y;
    }

    // Center around the origin
    const x_max = Math.max(...vertices.map(v => v.x));
    const x_min = Math.min(...vertices.map(v => v.x));
    const y_max = Math.max(...vertices.map(v => v.y));
    const y_min = Math.min(...vertices.map(v => v.y));
    const xOffset = ((x_max - x_min) / 2) - x_max;
    const yOffset = ((y_max - y_min) / 2) - y_max;

    vertices.forEach(v => {
        v.x += xOffset;
        v.y += yOffset;
    });

    return vertices;
}

function interpolateLineRange(ctrlPoints, number, minGap = 0) {
    // adapted from https://gist.github.com/twelch/1ef68c532639f6d3a23e
    var totalDist = 0;
    var ctrlPtDists = [0];
    for (let pt = 1; pt < ctrlPoints.length; pt++) {
        const dist = distance(ctrlPoints[pt], ctrlPoints[pt - 1]);
        totalDist += dist;
        ctrlPtDists.push(totalDist);
    }

    if (totalDist / (number - 1) < minGap) {
        number = Math.floor(totalDist / minGap + 1);
    }

    var step = totalDist / (number - 1);
    var interpPoints = [ctrlPoints[0]];
    var prevCtrlPtInd = 0;
    var currDist = 0;
    var currPoint = ctrlPoints[0];
    var nextDist = step;

    for (let pt = 0; pt < number - 2; pt++) {
        while (nextDist > ctrlPtDists[prevCtrlPtInd + 1]) {
            prevCtrlPtInd++;
            currDist = ctrlPtDists[prevCtrlPtInd];
            currPoint = ctrlPoints[prevCtrlPtInd];
        }

        const remainingDist = nextDist - currDist;
        const ctrlPtsDeltaX = ctrlPoints[prevCtrlPtInd + 1].x - ctrlPoints[prevCtrlPtInd].x;
        const ctrlPtsDeltaY = ctrlPoints[prevCtrlPtInd + 1].y - ctrlPoints[prevCtrlPtInd].y;
        const ctrlPtsDist = ctrlPtDists[prevCtrlPtInd + 1] - ctrlPtDists[prevCtrlPtInd];
        const distRatio = remainingDist / ctrlPtsDist;

        currPoint = {
            x: currPoint.x + ctrlPtsDeltaX * distRatio,
            y: currPoint.y + ctrlPtsDeltaY * distRatio
        };

        interpPoints.push(currPoint);

        currDist = nextDist;
        nextDist += step;
    }

    interpPoints.push(ctrlPoints[ctrlPoints.length - 1]);

    return interpPoints;
}

function lerp_point(start, end, ratio) {
    return { x: lerp(start.x, end.x, ratio), y: lerp(start.y, end.y, ratio) }
}

function distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function findRatioBetweenPointsToGetDistanceWanted(start, end, distanceTraveled, distanceWanted) {
    const distanceFromStartToEnd = l2_norm(start, end);
    const distanceRemaining = distanceWanted - (distanceTraveled - distanceFromStartToEnd);
    return distanceRemaining / distanceFromStartToEnd;
}


function generateVertices(n_vertices, n_samples) {
    let points = generateConvex(n_vertices)
    // add last point 
    points.push(points[0])
    interpolated_points = interpolateLineRange(points, n_samples)

    // add 0.5 to each point
    interpolated_points = interpolated_points.map((p) => {
        return { x: p.x + 0.5, y: p.y + 0.5 }
    })

    // this excludes the last point
    // interpolated_points.pop()
    return interpolated_points
}

const default_n_vertices = 13
const default_n_samples = 64
const pixel_multiplier = 200
const scaling_parameters = {
    size: 1,
    rho: 1500,
    E: 0.5,
    alpha: 0,
    beta: 0.1
};
const coordinates = {
    x: 0.5,
    y: 0.5,
}

const buttons = {
    generate_mesh: () => {
        g_vertices = generateVertices(
            default_n_vertices,
            default_n_samples
        )
        Bela.control.send({ vertices: g_vertices });
    },
    hit: () => {
        Bela.control.send({ hit: true });
    }
};

g_vertices = []

function setup() {

    //Create a canvas of dimensions given by current browser window
    canvas_dimensions = [windowWidth, windowHeight];
    createCanvas(canvas_dimensions[0], canvas_dimensions[1]);

    gui = new dat.GUI({ name: "Parameters", width: 300 });

    scaling_folder = gui.addFolder("Scaling Parameters")
    scaling_folder.add(scaling_parameters, 'size', 0.1, 10).onChange((value) => {
        Bela.control.send({ size: value });
    });
    scaling_folder.add(scaling_parameters, 'rho', 1000, 15000).onChange((value) => {
        Bela.control.send({ rho: value });
    });
    scaling_folder.add(scaling_parameters, 'E', 0.0, 1.0).step(0.01).onChange((value) => {
        mapped = map(value, 0.0, 1, 1e+9, 1e+11)
        Bela.control.send({ E: mapped });
    });
    scaling_folder.add(scaling_parameters, 'alpha', 0.0, 1.0).step(0.01).onChange((value) => {
        mapped = map(value, 0.0, 1, 0, 5)
        Bela.control.send({ alpha: mapped });
    });
    scaling_folder.add(scaling_parameters, 'beta', 0.0, 1.0).step(0.01).onChange((value) => {
        mapped = map(value, 0.0, 1, 1e-8, 1e-6)
        Bela.control.send({ beta: mapped });
    });

    coordinates_folder = gui.addFolder("Coordinates")

    changed_coords = () => {
        Bela.control.send({ coords: { x: coordinates.x, y: coordinates.y} });
    }
    coordinates_folder.add(coordinates, 'x', 0.0, 1.0).step(0.01).onChange(changed_coords)
    coordinates_folder.add(coordinates, 'y', 0.0, 1.0).step(0.01).onChange(changed_coords)

    gui.add(buttons, 'generate_mesh').name("Generate Mesh")
    gui.add(buttons, 'hit').name("Hit!")

    // generate default vertices
    g_vertices = generateVertices(
        default_n_vertices,
        default_n_samples
    )

}

function draw() {
    clear();
    strokeWeight(0);

    background('#ED7D73');

    translate(windowWidth / 2, windowHeight / 2, 0);
    noFill();
    beginShape();
    for (let i = 0; i < g_vertices.length; i++) {
        vertex(g_vertices[i].x * pixel_multiplier, g_vertices[i].y * pixel_multiplier);
    }
    endShape();

    fill("#7DABE7");
    beginShape();
    for (let i = 0; i < g_vertices.length; i++) {
        vertex(g_vertices[i].x * pixel_multiplier, g_vertices[i].y * pixel_multiplier);
    }
    endShape();

    stroke('#F4F78E');
    strokeWeight(10);
    for (let i = 0; i < g_vertices.length; i++) {
        point(g_vertices[i].x * pixel_multiplier, g_vertices[i].y * pixel_multiplier);

    }

}