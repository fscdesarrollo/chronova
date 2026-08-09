import { APP_NAME } from '../brand'

const PARTICLES = [
  { x: '4%', y: '24%', delay: '0.2s', duration: '3.8s' },
  { x: '15%', y: '76%', delay: '1.1s', duration: '4.4s' },
  { x: '30%', y: '14%', delay: '2.4s', duration: '3.5s' },
  { x: '48%', y: '84%', delay: '0.7s', duration: '4.1s' },
  { x: '66%', y: '18%', delay: '1.8s', duration: '3.9s' },
  { x: '79%', y: '72%', delay: '2.8s', duration: '4.6s' },
  { x: '92%', y: '30%', delay: '1.4s', duration: '3.6s' },
]

export default function BrandWordmark({ compact = false, className = '' }) {
  return (
    <span
      className={`brand-wordmark ${compact ? 'brand-wordmark--compact' : ''} ${className}`}
      data-text={APP_NAME}
    >
      <span className="brand-wordmark__text">{APP_NAME}</span>
      {!compact && (
        <span className="brand-wordmark__particles" aria-hidden="true">
          {PARTICLES.map((particle, index) => (
            <i
              key={index}
              style={{
                '--particle-x': particle.x,
                '--particle-y': particle.y,
                '--particle-delay': particle.delay,
                '--particle-duration': particle.duration,
              }}
            />
          ))}
        </span>
      )}
    </span>
  )
}
