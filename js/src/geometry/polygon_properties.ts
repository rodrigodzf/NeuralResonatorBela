// src
import { lineIntersection } from './lines'
import { Point, Polygon } from './types'

export function isConvex(P: Readonly<Polygon>): boolean {
	/*
	Tests whether or not a given array of vertices forms a convex polygon.
	This is achieved using the resultant sign of the cross product for each
	vertex:
		[(x_i - x_i-1), (y_i - y_i-1)] × [(x_i+1 - x_i), (y_i+1 - y_i)]
	See => http://paulbourke.net/geometry/polygonmesh/ 'Determining whether
	or not a polygon (2D) has its vertices ordered clockwise or
	counter-clockwise'.
	*/

	// cross product - z component only, see np.cross =>
	// https://numpy.org/doc/stable/reference/generated/numpy.cross.html
	function crossProductZ(p: Point, p_plus: Point, p_minus: Point): number {
		return (p.x - p_minus.x) * (p_plus.y - p.y) - (p_plus.x - p.x) * (p.y - p_minus.y)
	}
	// determine the direction of the initial point using the cross product
	const N: number = P.length
	const clockwise: boolean = crossProductZ(P[0]!, P[1]!, P[N - 1]!) < 0
	// loop over remaining points
	for (let n = 1; n < N; n++) {
		if (crossProductZ(P[n]!, P[(n + 1) % N]!, P[n - 1]!) < 0 != clockwise) {
			return false
		}
	}
	return true
}

export function isSimple(P: Readonly<Polygon>): boolean {
	/*
	Determine if a polygon is simple by checking for intersections.
	*/

	const N = P.length
	for (let i = 0; i < N - 2; i++) {
		for (let j = i + 1; j < N; j++) {
			const intersection_type: string = lineIntersection(
				[P[i]!, P[i + 1]!],
				[P[j]!, P[(j + 1) % N]!],
			)[0]
			if (intersection_type == 'none' || intersection_type == 'vertex') {
				continue
			} else {
				return false
			}
		}
	}
	return true
}

export function largestVector(P: Readonly<Polygon>): [number, [number, number]] {
	/*
	This function tests each pair of vertices in a given polygon to find the
	largest vector, and returns the length of the vector and its indices.
	*/

	const N: number = P.length
	let vec_max: number = 0
	let index_i: number = 0
	let index_j: number = 0
	for (let i = 0; i < N; i++) {
		for (let j = i + 1; j < N; j++) {
			let vec: number = Math.sqrt(
				Math.pow(P[i]!.x - P[j]!.x, 2) + Math.pow(P[i]!.y - P[j]!.y, 2),
			)
			if (vec > vec_max) {
				vec_max = vec
				index_i = i
				index_j = j
			}
		}
	}
	return [vec_max, [index_i, index_j]]
}
