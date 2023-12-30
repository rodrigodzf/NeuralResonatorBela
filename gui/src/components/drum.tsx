// dependencies
import { useEffect, useState } from 'react'

// src
import { Point, Polygon, generateConvexPolygon, normalisePolygon } from '../geometry'
import { Vertex } from './vertex'

export const Drum: React.FC<{
	N?: number
	onPolygonChange?: (P: Polygon) => void
	onStrikeChange?: (p: Point) => void
}> = ({ N = 10, onPolygonChange = () => {}, onStrikeChange = () => {} }) => {
	const [polygon, updatePolygon] = useState<Polygon>(
		normalisePolygon(generateConvexPolygon(N)).map((p: Point) => {
			return { x: p.x * 0.8 + 0.1, y: p.y * 0.8 + 0.1 }
		}),
	)
	const [strike, updateStrike] = useState<Point>({ x: 0.5, y: 0.5 })

	useEffect(() => {
		onPolygonChange(polygon)
		onStrikeChange(strike)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<div className='drum'>
			<svg version='1.1' x='0px' y='0px' viewBox='0 0 100 100' xmlSpace='preserve'>
				<polygon
					points={polygon.map((p: Point) => `${p.x * 100},${p.y * 100}`).join(' ')}
				/>
			</svg>
			{polygon.map((p: Point, i: number) => (
				<Vertex
					key={i}
					point={p}
					onDrag={(v: Point, callback: boolean) => {
						const tmp: Polygon = [...polygon]
						tmp[i] = v
						if (callback) {
							// tmp = two_opt(tmp)
							updatePolygon(tmp)
							onPolygonChange(tmp)
						} else {
							updatePolygon(tmp)
						}
					}}
				/>
			))}
			<Vertex
				className='strike'
				point={strike}
				onDrag={(p: Point, callback: boolean) => {
					if (!callback) {
						// if (isPointInsidePolygon(p, polygon)){
						updateStrike(p)
						onStrikeChange(p)
						// }
					}
				}}
			/>
		</div>
	)
}
