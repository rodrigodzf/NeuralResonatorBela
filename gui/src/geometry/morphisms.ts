// src
import type { Point, Polygon } from './types.d.ts'

export function normalisePolygon(P: Polygon): Polygon {
	/*
	This function takes a polygon, centers it across the x and y axis, then
	normalises the vertices to the unit interval ℝ^2.
	*/

	// first find minmax in both x & y
	const X: number[] = []
	const Y: number[] = []
	for (const p of P) {
		X.push(p.x)
		Y.push(p.y)
	}
	const x_min_max: [number, number] = [Math.min(...X), Math.max(...X)]
	const y_min_max: [number, number] = [Math.min(...Y), Math.max(...Y)]
	// center along x and y axes
	const x_shift: number = (x_min_max[0] + x_min_max[1]) * 0.5
	const y_shift: number = (y_min_max[0] + y_min_max[1]) * 0.5
	// find v_min and v_d (v_d = v_max - v_min)
	const v_min: number = Math.min(x_min_max[0] - x_shift, y_min_max[0] - y_shift)
	const v_d: number = Math.max(x_min_max[1] - x_shift, y_min_max[1] - y_shift) - v_min
	// normalise
	return P.map((p: Point) => ({ x: (p.x - x_shift - v_min) / v_d, y: (p.y - y_shift - v_min) / v_d }))
}
