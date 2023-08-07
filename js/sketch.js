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
        return {x: p.x + 0.5, y: p.y + 0.5}
    })
    
    // this excludes the last point
    // interpolated_points.pop()
    return interpolated_points
}

const default_n_vertices = 13
const default_n_samples = 32
const pixel_multiplier = 200
g_vertices = []
function setup() {

    //Create a canvas of dimensions given by current browser window
    canvas_dimensions = [windowWidth, windowHeight];
    createCanvas(canvas_dimensions[0], canvas_dimensions[1]);

    //Text
    p1 = createP("Density:");
    p1.position(
        windowWidth / 3,
        windowHeight / 1.5
    );

    // Slider
    fSlider = createSlider(
        0,
        100,
        1
    );

    fSlider.input(() => {
        obj = {
            rho: fSlider.value()
        };
        console.log("Sending ", obj);
        Bela.control.send(obj);
    });

    fSlider.position(
        p1.x + p1.size().width,
        p1.y + p1.size().height * 0.8
    );

    // vertex generate button
    generate_mesh_btn = createButton('Generate Mesh');
    generate_mesh_btn.position(
        p1.x + p1.size().width,
        p1.y + p1.size().height + 50
    )
    generate_mesh_btn.mousePressed(() => {
        g_vertices = generateVertices(
            default_n_vertices,
            default_n_samples
        )
      
        obj = {
            // add 0.5 to vertices to be in range [0, 1]
            vertices: g_vertices
        };
      
        // print(g_vertices)
        // print(Math.max(...g_vertices.map(o => o.x)))
        // print(Math.min(...g_vertices.map(o => o.x)))
        // print(Math.max(...g_vertices.map(o => o.y)))
        // print(Math.min(...g_vertices.map(o => o.y)))
        Bela.control.send(obj);
    })

    // impulse button
    generate_mesh_btn = createButton('Hit');
    generate_mesh_btn.position(
        p1.x + p1.size().width,
        p1.y + p1.size().height + 75
    )
    generate_mesh_btn.mousePressed(() => {
        obj = {
            // add 0.5 to vertices to be in range [0, 1]
            hit: true
        };
        Bela.control.send(obj);
    })

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