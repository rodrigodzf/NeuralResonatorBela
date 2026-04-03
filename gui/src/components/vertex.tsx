// dependencies
import { type FC, type PointerEvent as ReactPointerEvent, useRef, useState } from 'react'

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

	// update the location of a point and fire callback
	function updatePoint(e: ReactPointerEvent<HTMLDivElement>, callback: boolean): void {
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

	// event handlers
	const _onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
		self.current?.setPointerCapture(e.pointerId)
		setMouseDown(true)
	}
	const _onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
		updatePoint(e, false)
	}
	const _onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
		updatePoint(e, true)
		setMouseDown(false)
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId)
		}
	}

	return (
		<div
			ref={self}
			className={`vertex ${className}`}
			onPointerDown={_onPointerDown}
			onPointerMove={_onPointerMove}
			onPointerUp={_onPointerUp}
			style={{
				left: `calc(${(point.x * 100).toString()}% - 5px)`,
				top: `calc(${(point.y * 100).toString()}% - 5px)`,
			}}
		/>
	)
}
