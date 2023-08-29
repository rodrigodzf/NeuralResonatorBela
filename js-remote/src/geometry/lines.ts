// src
import { Line, Point } from './types'

export function isColinear(a: Readonly<Point>, b: Readonly<Point>, c: Readonly<Point>): boolean {
	/*
	Determines whether or not a given set of three vertices are colinear.
	*/

	return (c.y - b.y) * (b.x - a.x) == (b.y - a.y) * (c.x - b.x)
}

export function lineIntersection(A: Readonly<Line>, B: Readonly<Line>): [string, Point] {
	/*
	This function determines whether a line has an intersection, and returns it's type as well
	as the point of intersection (if one exists).
	input:
		A, B - Line segments to compare.
	output:
		type -
			'none'		No intersection.
			'intersect' The general case where lines intersect one another.
			'vertex'	This is the special case when two lines share a vertex.
			'branch'	This is the special case when a vertex lies within another line. For
						example, B creates an intersection at point B.a when B.a lies on the
						open interval (A.a, A.b).
			'colinear'	This is the special case when the two lines overlap.
		point -
			'none'		Empty point.
			'intersect' The point of intersection ∈ (A.a, A.b) & (B.a, B.b).
			'vertex'	The shared vertex.
			'branch'	The branching vertex.
			'colinear'	The midpoint between all 4 vertices.
	*/

	// search for shared vertices
	if ((A[0].x == B[0].x && A[0].y == B[0].y) || (A[0].x == B[1].x && A[0].y == B[1].y)) {
		return ['vertex', A[0]]
	} else if ((A[1].x == B[0].x && A[1].y == B[0].y) || (A[1].x == B[1].x && A[1].y == B[1].y)) {
		return ['vertex', A[1]]
	}
	// test for colinear cases.
	let colinearities: number = 0
	colinearities += isColinear(A[0], A[1], B[0]) ? 1 : 0
	colinearities += isColinear(A[1], B[0], B[1]) ? 1 : 0
	colinearities += isColinear(B[0], B[1], A[0]) ? 1 : 0
	colinearities += isColinear(B[1], A[0], A[1]) ? 1 : 0
	if (colinearities == 4) {
		return [
			'colinear',
			{
				x: (A[0].x + A[1].x + B[0].x + B[1].x) / 4,
				y: (A[0].y + A[1].y + B[0].y + B[1].y) / 4,
			},
		]
	}
	// calculate the general case using distance to intersection point.
	const u_A: number =
		((B[1].x - B[0].x) * (A[0].y - B[0].y) - (B[1].y - B[0].y) * (A[0].x - B[0].x)) /
		((B[1].y - B[0].y) * (A[1].x - A[0].x) - (B[1].x - B[0].x) * (A[1].y - A[0].y))
	const u_B: number =
		((A[1].x - A[0].x) * (A[0].y - B[0].y) - (A[1].y - A[0].y) * (A[0].x - B[0].x)) /
		((B[1].y - B[0].y) * (A[1].x - A[0].x) - (B[1].x - B[0].x) * (A[1].y - A[0].y))
	if (u_A >= 0 && u_A <= 1 && u_B >= 0 && u_B <= 1) {
		const p: Point = {
			x: A[0].x + u_A * (A[1].x - A[0].x),
			y: A[0].y + u_A * (A[1].y - A[0].y),
		}
		// test for adjacent case
		if (A[0].x == p.x && A[0].y == p.y) {
			return ['adjacent', A[0]]
		} else if (A[1].x == p.x && A[1].y == p.y) {
			return ['adjacent', A[1]]
		} else if (B[0].x == p.x && B[0].y == p.y) {
			return ['adjacent', B[0]]
		} else if (B[1].x == p.x && B[1].y == p.y) {
			return ['adjacent', B[1]]
		}
		// return general case
		return ['intersect', p]
	}
	// return the null case
	return ['none', { x: 0, y: 0 }]
}
