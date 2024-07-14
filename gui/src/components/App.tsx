/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// dependencies
import { type JSX, useEffect, useState } from 'react'

// src
import '../scss/App.scss'
import Bela from '../BelaAPI'
import type { Point, Polygon } from '../geometry'
import { Drum } from './drum'

export default function App(): JSX.Element {
	// is the Bela ws connected?
	const [belaLoaded, updateBelaLoaded] = useState<boolean>(Bela.ws.readyState === 1)
	useEffect(() => {
		// listeners for when Bela is connected/disconnected
		const belaOn = () => {
			updateBelaLoaded(true)
		}
		const belaOff = () => {
			updateBelaLoaded(false)
		}
		window.addEventListener('BelaConnected', belaOn)
		window.addEventListener('BelaDisconnected', belaOff)
		return () => {
			window.removeEventListener('BelaConnected', belaOn)
			window.removeEventListener('Beladisconnected', belaOff)
		}
	}, [])
	// handle bela callback
	const [polygonUpdated, setPolygonUpdated] = useState<0 | 1>(0)

	return (
		<>
			{belaLoaded ? (
				<Drum
					N={10} // will add controls for this later, and need to be aware of Bela's max buffer size
					// onPolygonChange={(P: Polygon) => console.log(`Polygon changed: ${P}`)}
					onPolygonChange={(P: Polygon) => {
						Bela.sendBuffer(0, 'float', polygonUpdated ? 0 : 1)
						setPolygonUpdated(polygonUpdated ? 0 : 1)
						Bela.sendBuffer(
							1,
							'float',
							P.flatMap((p: Point) => [p.x, p.y]),
						)
					}}
					// onStrikeChange={(p: Point) => console.log(`Polygon changed: ${p}`)}
					onStrikeChange={(p: Point) => Bela.sendBuffer(2, 'float', [p.x, p.y])}
				/>
			) : (
				<p>There is no Bela connected... 🧑‍💻</p>
			)}
		</>
	)
}
