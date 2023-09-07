// dependencies
import { useEffect, useState } from 'react'

// src
import '../scss/App.scss'
import Bela from '../BelaAPI'
import { Point, Polygon } from '../geometry'
import { Drum } from './drum'
import { interpolateLineRange } from './polygon2buffer'

export default function App(): JSX.Element {
	// is the Bela ws connected?
	const [belaLoaded, updateBelaLoaded] = useState<boolean>(
		Bela.ws.readyState === 1 ? true : false,
	)
	useEffect(() => {
		// listeners for when Bela is connected/disconnected
		const belaOn = () => updateBelaLoaded(true)
		const belaOff = () => updateBelaLoaded(false)
		window.addEventListener('BelaConnected', belaOn)
		window.addEventListener('BelaDisconnected', belaOff)
		return () => {
			window.removeEventListener('BelaConnected', belaOn)
			window.removeEventListener('Beladisconnected', belaOff)
		}
	}, [])

	return (
		<>
			{/* {true ? ( */}
			{belaLoaded ? (
				<Drum
					N={10} // will add controls for this later
					// onPolygonChange={(P: Polygon) => console.log(`Polygon changed: ${P}`)}
					onPolygonChange={(P: Polygon) => {
						console.log(P)
						console.log(P.length)
					    P = interpolateLineRange(P, 64)
						console.log(P)
						console.log(P.length)
						Bela.sendBuffer(0, 'float', P.map((p: Point) => [p.x, p.y]).flat())
					}}
					// onStrikeChange={(p: Point) => console.log(`Polygon changed: ${p}`)}
					onStrikeChange={(p: Point) => Bela.sendBuffer(1, 'float', [p.x, p.y])}
				/>
			) : (
				<p>There is no Bela connected... 🧑‍💻</p>
			)}
		</>
	)
}
