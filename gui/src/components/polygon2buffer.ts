// src
import { Point, Polygon } from '../geometry'

export function interpolateLineRange(P: Readonly<Polygon>, max_N: number, min_gap: number = 0) {
	/*
	adapted from https://gist.github.com/twelch/1ef68c532639f6d3a23e
	*/

	let _P: Polygon = [...P]
	_P.push(P[0]!)
	// calculate distances
	let total_dist: number = 0
	let ctrl_pt_dists: number[] = [0]
	const distance = (a: Point, b: Point) => {
		const dx = b.x - a.x
		const dy = b.y - a.y
		return Math.sqrt(dx * dx + dy * dy)
	}
	for (let i = 1; i < _P.length; i++) {
		total_dist += distance(_P[i]!, _P[i - 1]!)
		ctrl_pt_dists.push(total_dist)
	}

	if (total_dist / (max_N - 1) < min_gap) {
		max_N = Math.floor(total_dist / min_gap + 1)
	}

	const step: number = total_dist / (max_N - 1)
	let interp_points: Point[] = [_P[0]!]
	let prev_ctrl_pt_ind: number = 0
	let curr_dist: number = 0
	let curr_point: Point = _P[0]!
	let next_dist: number = step

	for (let i = 0; i < max_N - 2; i++) {
		if (next_dist > ctrl_pt_dists[prev_ctrl_pt_ind + 1]!) {
			prev_ctrl_pt_ind++
			curr_dist = ctrl_pt_dists[prev_ctrl_pt_ind]!
			curr_point = _P[prev_ctrl_pt_ind]!
		}

		const remaining_dist: number = next_dist - curr_dist
		const ctrl_pts_deltaX = _P[prev_ctrl_pt_ind + 1]!.x - _P[prev_ctrl_pt_ind]!.x
		const ctrl_pts_deltaY = _P[prev_ctrl_pt_ind + 1]!.y - _P[prev_ctrl_pt_ind]!.y
		const ctrl_pts_dist =
			ctrl_pt_dists[prev_ctrl_pt_ind + 1]! - ctrl_pt_dists[prev_ctrl_pt_ind]!
		const distRatio = remaining_dist / ctrl_pts_dist

		curr_point = {
			x: curr_point.x + ctrl_pts_deltaX * distRatio,
			y: curr_point.y + ctrl_pts_deltaY * distRatio,
		}

		interp_points.push(curr_point)

		curr_dist = next_dist
		next_dist += step
	}

	interp_points.push(_P[_P.length - 1]!)

	return interp_points
}
