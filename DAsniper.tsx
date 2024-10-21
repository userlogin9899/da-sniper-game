"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { VolumeX, Volume2 } from 'lucide-react'

interface MousePosition {
  x: number
  y: number
  timestamp: number
}

export default function FrustratingDodgingLogo() {
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

        // Reverse mouse movement for levels 4 and 5
        if (level > 3 && level <= 5) {
          mouseX = rect.width - mouseX
          mouseY = rect.height - mouseY
        }

        // Increase mouse speed after level 5
        if (level > 5) {
          const speedMultiplier = 1 + (level - 5) * 0.2 // Increase speed by 20% for each level above 5
          mouseX = rect.width / 2 + (mouseX - rect.width / 2) * speedMultiplier
          mouseY = rect.height / 2 + (mouseY - rect.height / 2) * speedMultiplier
        }

        // Clamp mouse position within the container
        mouseX = Math.max(0, Math.min(mouseX, rect.width))
        mouseY = Math.max(0, Math.min(mouseY, rect.height))

        setCursorPosition({ x: mouseX, y: mouseY })

        // Store current mouse position with timestamp
        const currentTime = Date.now()
        lastMousePositions.current.push({ x: mouseX, y: mouseY, timestamp: currentTime })
        if (lastMousePositions.current.length > 5) {
          lastMousePositions.current.shift()
        }

        // Calculate mouse velocity and direction
        let velocityX = 0
        let velocityY = 0
        if (lastMousePositions.current.length > 1) {
          const oldestPosition = lastMousePositions.current[0]
          const timeElapsed = (currentTime - oldestPosition.timestamp) / 1000 // in seconds
          velocityX = (mouseX - oldestPosition.x) / timeElapsed
          velocityY = (mouseY - oldestPosition.y) / timeElapsed
        }

        // Predict future mouse position
        const predictionTime = 0.2 // Predict 0.2 seconds into the future for faster reaction
        const predictedX = mouseX + velocityX * predictionTime
        const predictedY = mouseY + velocityY * predictionTime

        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const angleToMouse = Math.atan2(predictedY - centerY, predictedX - centerX)
        const distanceToMouse = Math.sqrt(Math.pow(predictedX - centerX, 2) + Math.pow(predictedY - centerY, 2))
        
        // Dodge with increased range and add erratic motion
        const maxDodge = 200 + (level * 10) // Maximum pixels to move from center, increases with level
        const dodgeDistance = Math.min(distanceToMouse / 2, maxDodge)
        const time = currentTime / 1000 // current time in seconds
        const erraticMotionX = (50 + level * 5) * Math.sin(time * 5) + (30 + level * 3) * Math.cos(time * 7)
        const erraticMotionY = (50 + level * 5) * Math.cos(time * 6) + (30 + level * 3) * Math.sin(time * 8)

        const newX = centerX - Math.cos(angleToMouse) * dodgeDistance + erraticMotionX
        const newY = centerY - Math.sin(angleToMouse) * dodgeDistance + erraticMotionY

        setPosition({ x: newX, y: newY })

        // Check if cursor is near the center of the object
        const objectCenterX = newX
        const objectCenterY = newY
        const distanceToObjectCenter = Math.sqrt(Math.pow(mouseX - objectCenterX, 2) + Math.pow(mouseY - objectCenterY, 2))
        setIsNearCenter(distanceToObjectCenter < 50 - (level * 2)) // Sniper scope range decreases with level

        // Erratic jump when mouse gets close
        if (distanceToMouse < 200 - (level * 10)) {
          controls.start({
            y: [null, -60, 0, -30, 0],
            x: [null, 40, -40, 20, 0],
            rotate: [0, -15, 15, -10, 10, 0],
            transition: { duration: 0.5 - (level * 0.02), ease: "easeOut" }
          })
        }

        // Show taunt message and increment miss count
        const now = Date.now()
        if (distanceToMouse < 150 && now - lastTauntTimeRef.current > 3000 - (level * 100)) { // Reduced taunt frequency
          setMissCount(prev => {
            const newCount = prev + 1
            return newCount
          })
          
          // Show a taunt when within range
          setCurrentTaunt(tauntMessages[Math.floor(Math.random() * tauntMessages.length)])
          setShowTaunt(true)
          setTimeout(() => setShowTaunt(false), 4000 - (level * 50)) // Updated timeout to 4 seconds
          lastTauntTimeRef.current = now
        }
      }
    }

    const handleMouseClick = (e: MouseEvent) => {
      if (isNearCenter && !isCaught) {
        setIsCaught(true)
        setCurrentTaunt("I CAN'T BELIEVE YOU GOT ME!")
        setShowTaunt(true)
        setIsNearCenter(false) // Remove the scope after successful click
        setTimeout(() => {
          setShowWinMessage(true)
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

  const handleNextLevel = () => {
    setLevel(prevLevel => prevLevel + 1)
    setIsCaught(false)
    setShowWinMessage(false)
    setMissCount(0)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      setPosition({ x: centerX, y: centerY })
    }
    if (instrumentalRef.current) {
      instrumentalRef.current.currentTime = 0
      instrumentalRef.current.play()
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
  }

  return (
    <div ref={containerRef} className={`relative w-full h-screen bg-gray-900 overflow-hidden ${!gameStarted || showWinMessage ? '' : 'cursor-none'}`}>
      <audio
        ref={audioRef}
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mchammer-EoflBCFwAiTGe1hecswL1vuqgDLVG9.mp3"
        loop
      />
      <audio
        ref={instrumentalRef}
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/intstrumental-pye6EVhTzsIwmavS8xb9WNuwBwO1JX.mp3"
      />
      {!gameStarted ? (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-4xl font-bold text-white mb-8">DA Sniper</h1>
          <button
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105"
            onClick={startGame}
          >
            Play
          </button>
        </div>
      ) : (
        <>
          <div className="absolute top-4 left-4 text-white text-xl font-bold">
            Level: {level}
          </div>
          <motion.div
            className="absolute w-[150px] h-[150px] rounded-2xl shadow-lg"
            style={{
              backgroundImage: "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DA-Logo-v1-STK_C-fvOGs1sBh0UtSgHL9DjSIHAmSIq7d5.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            animate={{
              x: position.x - 75,
              y: position.y - 75,
              transition: { type: "spring", stiffness: 800 + (level * 50), damping: 15 - (level * 0.5) }
            }}
            whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 10, 0] }}
          >
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{
                boxShadow: [
                  '0 0 20px 8px rgba(0, 255, 255, 0.7)',
                  '0 0 25px 12px rgba(255, 105, 180, 0.7)',
                  '0 0 20px 8px rgba(0, 255, 255, 0.7)',
                ],
              }}
              transition={{
                duration: 0.5 - (level * 0.02),
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            {showTaunt && (
              <motion.div
                className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold w-48 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {currentTaunt}
              </motion.div>
            )}
          </motion.div>
          {!showWinMessage && (
            <div 
              className={`cursor ${isNearCenter ? 'sniper-scope' : 'point'}`}
              style={{
                position: 'fixed',
                left:  `${cursorPosition.x}px`,
                top: `${cursorPosition.y}px`,
                width: isNearCenter ? '60px' : '10px',
                height: isNearCenter ? '60px' : '10px',
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)',
                zIndex: 9999,
              }}
            >
              {!isNearCenter && (
                <div 
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                  }}
                />
              )}
              
              {isNearCenter && (
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="28" stroke="#00FF00" strokeWidth="2" fill="none" />
                  <line x1="0" y1="30" x2="60" y2="30" stroke="#00FF00" strokeWidth="1" />
                  <line x1="30" y1="0" x2="30" y2="60" stroke="#00FF00" strokeWidth="1" />
                  <circle cx="30" cy="30" r="2" fill="#00FF00" />
                </svg>
              )}
            </div>
          )}
          {showWinMessage && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
              <div className="bg-white p-8 rounded-lg text-center">
                <h2 className="text-3xl font-bold mb-4">Level {level} Completed!</h2>
                <button
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105"
                  onClick={handleNextLevel}
                >
                  Next Level
                </button>
              </div>
            </div>
          )}
          <button
            className="fixed top-4 right-4 bg-gray-800 p-2 rounded-full cursor-pointer z-50"
            onClick={toggleMusic}
            style={{ pointerEvents: 'auto' }}
          >
            {isMusicPlaying ? (
              <Volume2 size={24} color="white" />
            ) : (
              <VolumeX size={24} color="white" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={audioRef.current?.volume || 1}
            onChange={(e) => {
              const volume = parseFloat(e.target.value)
              if (audioRef.current) audioRef.current.volume = volume
            }}
            className="fixed top-16 right-4 w-32 z-50"
          />
        </>
      )}
      <style jsx global>{`
        body {
          cursor: ${!gameStarted || showWinMessage ? 'default' : 'none'};
        }
      `}</style>
    </div>
  )
}