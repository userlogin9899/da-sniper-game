"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Droplets, VolumeX, Volume2 } from 'lucide-react'

interface MousePosition {
  x: number
  y: number
  timestamp: number
}

const levelCompletionMessages = [
  "You got lucky this time!",
  "Don't get cocky, it was just a fluke!",
  "Beginner's luck, that's all!",
  "Oh great, now I have to try harder.",
  "You won't be so fortunate next time!",
  "Enjoy your moment, it won't last long!",
  "I let you win that one, obviously.",
  "Well, even a broken clock is right twice a day.",
  "Congratulations on your temporary victory!",
  "I'm just warming up, you know."
];

export default function DASniper() {
  const tauntMessages = [
    "Haha, too slow!",
    "You'll never catch me!",
    "Is that the best you can do?",
    "My grandma moves faster!",
    "Are you even trying?",
    "This is too easy!",
    "You're making this fun!",
    "I could do this all day!",
    "Yawn... boring!",
  ]

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showTaunt, setShowTaunt] = useState(false)
  const [currentTaunt, setCurrentTaunt] = useState("")
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [missCount, setMissCount] = useState(0)
  const [showWaterPistol, setShowWaterPistol] = useState(false)
  const [isNearCenter, setIsNearCenter] = useState(false)
  const [isCaught, setIsCaught] = useState(false)
  const [showWinMessage, setShowWinMessage] = useState(false)
  const [level, setLevel] = useState(1)
  const [isMusicPlaying, setIsMusicPlaying] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const lastMousePositions = useRef<MousePosition[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const instrumentalRef = useRef<HTMLAudioElement>(null)
  const lastTauntTimeRef = useRef(0)

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      setPosition({ x: centerX, y: centerY })
    }
  }, [])

  useEffect(() => {
    if (!gameStarted) return

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current && !isCaught) {
        const rect = containerRef.current.getBoundingClientRect()
        let mouseX = e.clientX - rect.left
        let mouseY = e.clientY - rect.top

        if (level > 3 && level <= 5) {
          mouseX = rect.width - mouseX
          mouseY = rect.height - mouseY
        }

        if (level > 5) {
          const speedMultiplier = 1 + (level - 5) * 0.2
          mouseX = rect.width / 2 + (mouseX - rect.width / 2) * speedMultiplier
          mouseY = rect.height / 2 + (mouseY - rect.height / 2) * speedMultiplier
        }

        mouseX = Math.max(0, Math.min(mouseX, rect.width))
        mouseY = Math.max(0, Math.min(mouseY, rect.height))

        setCursorPosition({ x: mouseX, y: mouseY })

        const currentTime = Date.now()
        lastMousePositions.current.push({ x: mouseX, y: mouseY, timestamp: currentTime })
        if (lastMousePositions.current.length > 5) {
          lastMousePositions.current.shift()
        }

        let velocityX = 0
        let velocityY = 0
        if (lastMousePositions.current.length > 1) {
          const oldestPosition = lastMousePositions.current[0]
          const timeElapsed = (currentTime - oldestPosition.timestamp) / 1000
          velocityX = (mouseX - oldestPosition.x) / timeElapsed
          velocityY = (mouseY - oldestPosition.y) / timeElapsed
        }

        const predictionTime = 0.2
        const predictedX = mouseX + velocityX * predictionTime
        const predictedY = mouseY + velocityY * predictionTime

        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const angleToMouse = Math.atan2(predictedY - centerY, predictedX - centerX)
        const distanceToMouse = Math.sqrt(Math.pow(predictedX - centerX, 2) + Math.pow(predictedY - centerY, 2))
        
        const maxDodge = 200 + (level * 10)
        const dodgeDistance = Math.min(distanceToMouse / 2, maxDodge)
        const time = currentTime / 1000
        const erraticMotionX = (50 + level * 5) * Math.sin(time * 5) + (30 + level * 3) * Math.cos(time * 7)
        const erraticMotionY = (50 + level * 5) * Math.cos(time * 6) + (30 + level * 3) * Math.sin(time * 8)

        const newX = centerX - Math.cos(angleToMouse) * dodgeDistance + erraticMotionX
        const newY = centerY - Math.sin(angleToMouse) * dodgeDistance + erraticMotionY

        setPosition({ x: newX, y: newY })

        const objectCenterX = newX
        const objectCenterY = newY
        const distanceToObjectCenter = Math.sqrt(Math.pow(mouseX - objectCenterX, 2) + Math.pow(mouseY - objectCenterY, 2))
        setIsNearCenter(distanceToObjectCenter < 50 - (level * 2))

        if (distanceToMouse < 200 - (level * 10)) {
          controls.start({
            y: [null, -60, 0, -30, 0],
            x: [null, 40, -40, 20, 0],
            rotate: [0, -15, 15, -10, 10, 0],
            transition: { duration: 0.5 - (level * 0.02), ease: "easeOut" }
          })
        }

        const now = Date.now()
        if (distanceToMouse < 150 && now - lastTauntTimeRef.current > 3000 - (level * 100)) {
          setMissCount(prev => {
            const newCount = prev + 1
            if (newCount % (3 - Math.min(level, 2)) === 0) {
              setShowWaterPistol(true)
            }
            return newCount
          })
          
          setCurrentTaunt(tauntMessages[Math.floor(Math.random() * tauntMessages.length)])
          setShowTaunt(true)
          setTimeout(() => setShowTaunt(false), 5000)
          lastTauntTimeRef.current = now + 15000
        }
      }
    }

    const handleMouseClick = (e: MouseEvent) => {
      if (isNearCenter && !isCaught) {
        setIsCaught(true)
        const randomMessage = levelCompletionMessages[Math.floor(Math.random() * levelCompletionMessages.length)];
        setCurrentTaunt(randomMessage)
        setShowTaunt(true)
        setIsNearCenter(false)
        setTimeout(() => {
          setShowWinMessage(true)
          if (instrumentalRef.current) {
            instrumentalRef.current.currentTime = 0
            instrumentalRef.current.play()
          }
        }, 1500)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleMouseClick)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleMouseClick)
    }
  }, [controls, isNearCenter, isCaught, level, gameStarted])

  const handleWaterPistolClick = () => {
    if (Math.random() < 0.7 - (level * 0.05)) {
      controls.start({
        scale: [1, 1.2, 0.8, 1],
        rotate: [0, -30, 30, -20, 20, 0],
        transition: { duration: 0.8 - (level * 0.05) }
      })
      setCurrentTaunt("Nice try, but you missed!")
    } else {
      controls.start({
        scale: [1, 0.8, 1.1, 1],
        rotate: [0, -15, 15, -10, 10, 0],
        transition: { duration: 0.6 - (level * 0.05) }
      })
      setCurrentTaunt("Lucky shot!")
    }
    setShowTaunt(true)
    setTimeout(() => setShowTaunt(false), 4000 - (level * 75))
    
    setMissCount(0)
    setShowWaterPistol(false)
  }

  const handleNextLevel = () => {
    setLevel(prevLevel => prevLevel + 1)
    setIsCaught(false)
    setShowWinMessage(false)
    setMissCount(0)
    setShowWaterPistol(false)
    setShowTaunt(false)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      setPosition({ x: centerX, y: centerY })
    }
    if (instrumentalRef.current) {
      instrumentalRef.current.pause()
      instrumentalRef.current.currentTime = 0
    }
  }

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsMusicPlaying(!isMusicPlaying)
    }
  }

  const startGame = () => {
    setGameStarted(true)
    if (audioRef.current) {
      audioRef.current.play()
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full h-screen bg-gray-900 overflow-hidden ${!gameStarted || showWinMessage ? '' : 'cursor-none'}`}>
      <audio
        ref={audioRef}
        
