// dependencies
import { type FC, useEffect, useState } from 'react'

// src
import { type Point, type Polygon, generateConvexPolygon, normalisePolygon, isSimple } from '../geometry'
import { Vertex } from './vertex'

export const Drum: FC<{
	N?: number
	onPolygonChange?: (P: Polygon) => void
	onStrikeChange?: (p: Point) => void
}> = ({
	N = 10,
	onPolygonChange = () => {
		/* */
	},
	onStrikeChange = () => {
		/* */
	},
}) => {
	const [polygon, updatePolygon] = useState<Polygon>(
		normalisePolygon(generateConvexPolygon(N)).map((p: Point) => {
			return { x: p.x * 0.8 + 0.1, y: p.y * 0.8 + 0.1 }
		}),
	)
	const [strike, updateStrike] = useState<Point>({ x: 0.5, y: 0.5 })

	/* eslint-disable react-hooks/exhaustive-deps */
	useEffect(() => {
		onPolygonChange(polygon)
		onStrikeChange(strike)
	}, [])
	/* eslint-enable react-hooks/exhaustive-deps */

	return (
		<div className='drum'>
			<svg version='1.1' x='0px' y='0px' viewBox='0 0 100 100' xmlSpace='preserve'>
				<polygon
					points={polygon.map((p: Point) => `${(p.x * 100).toString()},${(p.y * 100).toString()}`).join(' ')}
				/>
			</svg>
			{polygon.map((p: Point, i: number) => (
				<Vertex
					key={i.toString()}
					point={p}
					onDrag={(v: Point, callback: boolean) => {
						const tmp: Polygon = [...polygon]
						tmp[i] = v
						if (isSimple(tmp)) {
							updatePolygon(tmp)
							callback && onPolygonChange(tmp)
						}
					}}
				/>
			))}
			<Vertex
				className='strike'
				point={strike}
				onDrag={(p: Point, callback: boolean) => {
					// if (isPointInsidePolygon(p, polygon)){
					updateStrike(p)
					callback && onStrikeChange(p)
					// }
				}}
			/>
		</div>
	)
}
