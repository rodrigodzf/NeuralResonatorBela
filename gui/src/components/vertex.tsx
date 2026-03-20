// dependencies
import { type FC, useEffect, useRef, useState } from 'react'

// src
import type { Point } from '../geometry/index.ts'

export const Vertex: FC<{
	point: Point
	onDrag: (p: Point, callback: boolean) => void
	className?: string
}> = ({ point, onDrag, className = '' }) => {
	/*
	A handle for a single vertex.
	*/

	const self = useRef<HTMLDivElement>(null)
	const [mouse_down, setMouseDown] = useState<boolean>(false)
	useEffect(() => {
		// update the location of a point and fire callback
		function updatePoint(e: PointerEvent, callback: boolean): void {
			if (mouse_down && self.current?.parentElement) {
				const parent = self.current.parentElement.getBoundingClientRect()
				if (
					e.clientX >= parent.left &&
					e.clientX <= parent.right &&
					e.clientY >= parent.top &&
					e.clientY <= parent.bottom
				) {
					onDrag(
						{
							x: (e.clientX - parent.left) / (parent.right - parent.left),
							y: (e.clientY - parent.top) / (parent.bottom - parent.top),
						},
						callback,
					)
				}
			}
		}
		// change position if mouse is down
		function changePosition(e: PointerEvent) {
			updatePoint(e, false)
		}
		// release mouse and fire callback if mouse down
		function releasePoint(e: PointerEvent) {
			updatePoint(e, true)
			setMouseDown(false)
		}
		window.addEventListener('pointermove', changePosition)
		window.addEventListener('pointerup', releasePoint)
		return () => {
			window.removeEventListener('pointermove', changePosition)
			window.removeEventListener('pointerup', releasePoint)
		}
	}, [mouse_down, onDrag])

	return (
		<div
			ref={self}
			className={`vertex ${className}`}
			style={{
				left: `calc(${(point.x * 100).toString()}% - 5px)`,
				top: `calc(${(point.y * 100).toString()}% - 5px)`,
			}}
			onPointerDown={(e) => {
				self.current?.setPointerCapture(e.pointerId)
				setMouseDown(true)
			}}
		/>
	)
}
