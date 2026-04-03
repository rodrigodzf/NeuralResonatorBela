// src
import { isPointOnLine, lineIntersection } from './lines.ts'
import type { Line, Point, Polygon } from './types.d.ts'

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

	// AB x BC cross product - z component only, see np.cross =>
	// https://numpy.org/doc/stable/reference/generated/numpy.cross.html
	function crossProductZ(a: Point, b: Point, c: Point): number {
		return (b.x - a.x) * (c.y - b.y) - (c.x - b.x) * (b.y - a.y)
	}
	// determine the direction of the initial point using the cross product
	const N: number = P.length
	const clockwise: boolean = crossProductZ(P[N - 1] as _Point, P[0] as _Point, P[1] as _Point) < 0
	// loop over remaining points
	for (let n = 1; n < N; n += 1) {
		if (crossProductZ(P[n - 1] as _Point, P[0] as _Point, P[(n + 1) % N] as _Point) < 0 !== clockwise) {
			return false
		}
	}
	return true
}

export function isPointInsidePolygon(p: Readonly<Point>, P: Readonly<Polygon>): boolean {
	/*
	Determines whether or not a cartesian pair is within a polygon, including boundaries.
	This algorithm builds upon the ray tracing ideas shown in solution 1
		=> https://paulbourke.net/geometry/polygonmesh/
	*/

	const N: number = P.length
	// create a ray that extends to the right of the polygon
	const ray: Line = [
		p,
		{ x: P.reduce((max: number, a: Point) => Math.max(max, a.x), Number.NEGATIVE_INFINITY) + 1, y: p.y },
	]
	// count the number of times the ray is intersected
	let count = 0
	for (let n = 0; n < N; n += 1) {
		const A: Line = [P[n] as NonNullable<Point>, P[(n + 1) % N] as NonNullable<Point>]
		// return true if point is a vertex
		if (A[0].x === p.x && A[0].y === p.y) {
			return true
		}
		// return true if point is on the line
		if (isPointOnLine(p, A)) {
			return true
		}
		// general case
		if (lineIntersection(ray, A)[0] === 'intersect') {
			count += 1
		}
	}
	return count % 2 === 1
}

export function isSimple(P: Readonly<Polygon>): boolean {
	/*
	Determine if a polygon is simple by checking for intersections.
	*/

	const N = P.length
	for (let i = 0; i < N - 2; i += 1) {
		for (let j = i + 1; j < N; j += 1) {
			const [intersection_type] = lineIntersection(
				[P[i] as _Point, P[i + 1] as _Point],
				[P[j] as _Point, P[(j + 1) % N] as _Point],
			)
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
	let vec_max2 = 0
	let index: [number, number] = [0, 0]
	for (let i = 0; i < N; i += 1) {
		for (let j = i + 1; j < N; j += 1) {
			const dx: number = (P[i] as _Point).x - (P[j] as _Point).x
			const dy: number = (P[i] as _Point).y - (P[j] as _Point).y
			const vec2: number = dx * dx + dy * dy
			if (vec2 > vec_max2) {
				index = [i, j]
				vec_max2 = vec2
			}
		}
	}
	return [vec_max2 ** 0.5, index]
}
