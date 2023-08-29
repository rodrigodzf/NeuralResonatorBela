// src
import { Polygon } from './types'

export function normalisePolygon(P: Polygon): Polygon {
	/*
	This function takes a polygon, centers it across the x and y axis, then
	normalises the vertices to the unit interval ℝ^2.
	*/

	// first find minmax in both x & y
	let X: number[] = []
	let Y: number[] = []
	const N: number = P.length
	for (let n = 0; n < N; n++) {
		X.push(P[n]!.x)
		Y.push(P[n]!.y)
	}
	const x_min_max: [number, number] = [Math.min(...X), Math.max(...X)]
	const y_min_max: [number, number] = [Math.min(...Y), Math.max(...Y)]
	// center along x and y axes
	const x_shift: number = (x_min_max[0] + x_min_max[1]) / 2
	const y_shift: number = (y_min_max[0] + y_min_max[1]) / 2
	for (let n = 0; n < N; n++) {
		P[n]!.x -= x_shift
		P[n]!.y -= y_shift
	}
	x_min_max[0] -= x_shift
	x_min_max[1] -= x_shift
	y_min_max[0] -= y_shift
	y_min_max[1] -= y_shift
	// find v_min and v_d (v_d = v_max - v_min)
	const v_min: number = x_min_max[0] < y_min_max[0] ? x_min_max[0] : y_min_max[0]
	const v_d: number = (x_min_max[1] > y_min_max[1] ? x_min_max[1] : y_min_max[1]) - v_min
	// normalise
	for (let n = 0; n < N; n++) {
		P[n]!.x = (P[n]!.x - v_min) / v_d
		P[n]!.y = (P[n]!.y - v_min) / v_d
	}
	return P
}
