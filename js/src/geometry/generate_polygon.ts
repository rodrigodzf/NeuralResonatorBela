// src
import { Point, Polygon } from './types'

export function generateConvexPolygon(N: number): Polygon {
	/*
	Generate convex shapes according to Pavel Valtr's 1995 algorithm.
	Adapted from Sander Verdonschot's Java version, found here:
	https://cglab.ca/~sander/misc/ConvexGeneration/ValtrAlgorithm.java
	input:
		N = the number of vertices
	output:
		P = a polygon of N random vertices
	*/

	// initialise variables
	let P: Polygon = new Array(N)
	const X = Array.from({ length: N }, () => 0)
	const Y = Array.from({ length: N }, () => 0)
	const X_rand = Array.from({ length: N }, () => Math.random()).sort()
	const Y_rand = Array.from({ length: N }, () => Math.random()).sort()
	let last_true: number = 0
	let last_false: number = 0
	// divide the interior points into two chains
	for (let i = 1; i < N; i++) {
		if (i != N - 1) {
			if (Math.round(Math.random())) {
				X[i] = X_rand[i]! - X_rand[last_true]!
				Y[i] = Y_rand[i]! - Y_rand[last_true]!
				last_true = i
			} else {
				X[i] = X_rand[last_false]! - X_rand[i]!
				Y[i] = Y_rand[last_false]! - Y_rand[i]!
				last_false = i
			}
		} else {
			X[0] = X_rand[i]! - X_rand[last_true]!
			Y[0] = Y_rand[i]! - Y_rand[last_true]!
			X[i] = X_rand[last_false]! - X_rand[i]!
			Y[i] = Y_rand[last_false]! - Y_rand[i]!
		}
	}
	// randomly combine x and y
	Y.sort(() => Math.random() - 0.5)
	for (let i = 0; i < N; i++) {
		P[i] = { x: X[i]!, y: Y[i]! }
	}
	// sort by polar angle
	P.sort((a: Point, b: Point) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x))
	// arrange points end to end to form a polygon
	let x_min: number = 0
	let x_max: number = 0
	let y_min: number = 0
	let y_max: number = 0
	let x: number = 0.0
	let y: number = 0.0
	for (let i = 0; i < N; i++) {
		let p: Point = { x, y }
		x += P[i]!.x
		y += P[i]!.y
		P[i] = p
		x_min = Math.min(P[i]!.x, x_min)
		x_max = Math.max(P[i]!.x, x_max)
		y_min = Math.min(P[i]!.y, y_min)
		y_max = Math.max(P[i]!.y, y_max)
	}
	// center around origin
	for (let i = 0; i < N; i++) {
		P[i]!.x += (x_max - x_min) / 2.0 - x_max
		P[i]!.y += (y_max - y_min) / 2.0 - y_max
	}
	return P
}
