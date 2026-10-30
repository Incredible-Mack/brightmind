'use client'

interface ScallopDividerProps {
  topBg?: string
  bottomBg?: string
  className?: string
  variant?: 'scallop' | 'wave'
}

/**
 * Clean, seamless section transition dividers (inspired by KidsFM and ZemEz).
 * Zero glitching, zero dark bands, 100% SVG precision.
 */
export function ScallopRibbon({
  topBg = '#161338',
  bottomBg = '#fffdf8',
  className = '',
  variant = 'scallop',
}: ScallopDividerProps) {
  if (variant === 'wave') {
    return (
      <div className={`w-full leading-none overflow-hidden ${className}`} style={{ backgroundColor: topBg }}>
        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className="w-full h-8 sm:h-12 block"
          style={{ fill: bottomBg }}
        >
          <path d="M0,24 C360,60 720,0 1080,45 C1260,65 1380,30 1440,35 L1440,60 L0,60 Z" />
        </svg>
      </div>
    )
  }

  // Scalloped cloud mounds transitioning from topBg into bottomBg
  return (
    <div className={`w-full leading-none overflow-hidden -mt-0.5 ${className}`} style={{ backgroundColor: topBg }}>
      <svg
        viewBox="0 0 1440 32"
        preserveAspectRatio="none"
        className="w-full h-5 sm:h-7 block"
        style={{ fill: bottomBg }}
      >
        <path
          d="M 0,32 L 0,16 
             Q 15,-2 30,16 Q 45,-2 60,16 Q 75,-2 90,16 Q 105,-2 120,16 
             Q 135,-2 150,16 Q 165,-2 180,16 Q 195,-2 210,16 Q 225,-2 240,16 
             Q 255,-2 270,16 Q 285,-2 300,16 Q 315,-2 330,16 Q 345,-2 360,16 
             Q 375,-2 390,16 Q 405,-2 420,16 Q 435,-2 450,16 Q 465,-2 480,16 
             Q 495,-2 510,16 Q 525,-2 540,16 Q 555,-2 570,16 Q 585,-2 600,16 
             Q 615,-2 630,16 Q 645,-2 660,16 Q 675,-2 690,16 Q 705,-2 720,16 
             Q 735,-2 750,16 Q 765,-2 780,16 Q 795,-2 810,16 Q 825,-2 840,16 
             Q 855,-2 870,16 Q 885,-2 900,16 Q 915,-2 930,16 Q 945,-2 960,16 
             Q 975,-2 990,16 Q 1005,-2 1020,16 Q 1035,-2 1050,16 Q 1065,-2 1080,16 
             Q 1095,-2 1110,16 Q 1125,-2 1140,16 Q 1155,-2 1170,16 Q 1185,-2 1200,16 
             Q 1215,-2 1230,16 Q 1245,-2 1260,16 Q 1275,-2 1290,16 Q 1305,-2 1320,16 
             Q 1335,-2 1350,16 Q 1365,-2 1380,16 Q 1395,-2 1410,16 Q 1425,-2 1440,16 
             L 1440,32 Z"
        />
      </svg>
    </div>
  )
}
