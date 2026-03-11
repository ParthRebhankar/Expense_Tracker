import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import NET from 'vanta/dist/vanta.net.min'

const VantaBackground = () => {
    const [vantaEffect, setVantaEffect] = useState(null)
    const vantaRef = useRef(null)

    useEffect(() => {
        let effect = null
        const initVanta = () => {
            if (vantaRef.current && !effect && typeof window !== 'undefined') {
                window.THREE = THREE // Make THREE global for Vanta
                try {
                    effect = NET({
                        el: vantaRef.current,
                        THREE: THREE,
                        mouseControls: true,
                        touchControls: true,
                        gyroControls: false,
                        minHeight: 200.00,
                        minWidth: 200.00,
                        scale: 1.00,
                        scaleMobile: 1.00,
                        color: 0xffffff,
                        backgroundColor: 0x0,
                        points: 7.00,
                        maxDistance: 19.00,
                        spacing: 15.00
                    })
                    setVantaEffect(effect)
                } catch (err) {
                    console.error("Vanta initialization failed:", err)
                }
            }
        }

        const timer = setTimeout(initVanta, 100)

        return () => {
            clearTimeout(timer)
            if (effect) effect.destroy()
        }
    }, [])

    return (
        <div
            ref={vantaRef}
            className="absolute inset-0 w-full h-full z-0"
        />
    )
}

export default VantaBackground
