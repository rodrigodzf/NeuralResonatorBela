// src
import type { Point, Polygon } from './types'

export function normalisePolygon(P: Polygon): Polygon {
	/*
	This function takes a polygon, centers it across the x and y axis, then
	normalises the vertices to the unit interval ℝ^2.
	*/

	// first find minmax in both x & y
	const X: number[] = []
	const Y: number[] = []
	P.map((p: Point) => {
		X.push(p.x)
		Y.push(p.y)
	})
	const x_min_max: [number, number] = [Math.min(...X), Math.max(...X)]
	const y_min_max: [number, number] = [Math.min(...Y), Math.max(...Y)]
	// center along x and y axes
	const x_shift: number = (x_min_max[0] + x_min_max[1]) / 2
	const y_shift: number = (y_min_max[0] + y_min_max[1]) / 2
	P = P.map((p: Point) => {
		return { x: p.x - x_shift, y: p.y - y_shift }
	})
	x_min_max[0] -= x_shift
	x_min_max[1] -= x_shift
	y_min_max[0] -= y_shift
	y_min_max[1] -= y_shift
	// find v_min and v_d (v_d = v_max - v_min)
	const v_min: number = x_min_max[0] < y_min_max[0] ? x_min_max[0] : y_min_max[0]
	const v_d: number = (x_min_max[1] > y_min_max[1] ? x_min_max[1] : y_min_max[1]) - v_min
	// normalise
	return P.map((p: Point) => {
		return { x: (p.x - v_min) / v_d, y: (p.y - v_min) / v_d }
	})
}
