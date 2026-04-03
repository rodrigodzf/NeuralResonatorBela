/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// remove when BelaAPI is not .js

// dependencies
import { type JSX, useEffect, useState } from 'react'

// src
import '../scss/App.scss'
import Bela from '../BelaAPI/index.ts'
import type { Point, Polygon } from '../geometry/index.ts'
import { Drum } from './drum.tsx'

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

	// event handlers
	const _onPolygonChange = (P: Polygon) => {
		// console.info(`Polygon changed: ${P}`)
		Bela.sendBuffer(0, 'float', polygonUpdated ? 0 : 1)
		setPolygonUpdated(polygonUpdated ? 0 : 1)
		Bela.sendBuffer(
			1,
			'float',
			P.flatMap((p: Point) => [p.x, p.y]),
		)
	}

	const _onStrikeChange = (p: Point) => {
		// console.info(`Strike changed: ${p}`)
		Bela.sendBuffer(2, 'float', [p.x, p.y])
	}

	return (
		<>
			{belaLoaded ? (
				// can add controls for N at a later point, though need to be aware of Bela's max buffer snpmize
				<Drum N={10} onPolygonChange={_onPolygonChange} onStrikeChange={_onStrikeChange} />
			) : (
				<p>There is no Bela connected... 🧑‍💻</p>
			)}
		</>
		// <Drum N={10} onPolygonChange={_onPolygonChange} onStrikeChange={_onStrikeChange} />
	)
}
