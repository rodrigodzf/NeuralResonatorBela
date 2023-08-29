import { Polygon, lineIntersection } from '../geometry'

export function two_opt(P: Polygon): Polygon {
	// 2 opt loop
	let indices: [number, number][] = []
	let intersection_type: string
	const N: number = P.length
	let intersections = true
	while (intersections) {
		for (let i = 0; i < N - 2; i++) {
			for (let j = i + 1; j < N; j++) {
				// collect indices of lines which should be crossed
				intersection_type = lineIntersection(
					[P[i]!, P[i + 1]!],
					[P[j]!, P[(j + 1) % N]!],
				)[0]
				if (intersection_type == 'none' || intersection_type == 'vertex') {
					continue
				} else if (intersection_type == 'intersect') {
					indices.push([i + 1, j + 1])
				} else if (intersection_type == 'adjacent') {
					indices.push([i, j])
				} else if (intersection_type == 'colinear') {
					indices.push([
						i + (P[i]!.x < P[i + 1]!.x ? 0 : 1),
						j + (P[j]!.x > P[j + 1]!.x ? 0 : 1),
					])
				}
			}
		}
		if (indices.length > 0) {
			// randomly swap one pair
			let swap: [number, number] = indices[Math.floor(Math.random() * indices.length)]!
			let tmp: Polygon = P
			tmp[swap[0]] = P[swap[1]]!
			tmp[swap[1]] = P[swap[0]]!
			P = tmp
			// restart loop
			indices = []
		} else {
			// close loop
			intersections = false
		}
	}
	return P
}
