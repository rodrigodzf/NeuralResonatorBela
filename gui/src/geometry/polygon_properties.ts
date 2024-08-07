// src
import { lineIntersection } from './lines'
import type { Point, Polygon } from './types'

type _Point = NonNullable<Point>

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
	const clockwise: boolean = crossProductZ(P[0] as _Point, P[1] as _Point, P[N - 1] as _Point) < 0
	// loop over remaining points
	for (let n = 1; n < N; n++) {
		if (crossProductZ(P[n] as _Point, P[(n + 1) % N] as _Point, P[n - 1] as _Point) < 0 !== clockwise) {
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
				[P[i] as _Point, P[i + 1] as _Point],
				[P[j] as _Point, P[(j + 1) % N] as _Point],
			)[0]
			if (intersection_type !== 'none' && intersection_type !== 'vertex') {
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

	const N = P.length
	let vec_max = 0
	let index_i = 0
	let index_j = 0
	for (let i = 0; i < N; i++) {
		for (let j = i + 1; j < N; j++) {
			const vec: number =
				(((P[i] as _Point).x - (P[j] as _Point).x) ** 2 + ((P[i] as _Point).y - (P[j] as _Point).y) ** 2) ** 0.5
			if (vec > vec_max) {
				vec_max = vec
				index_i = i
				index_j = j
			}
		}
	}
	return [vec_max, [index_i, index_j]]
}
