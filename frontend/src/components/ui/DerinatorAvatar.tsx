import deriPensando from '../../assets/DeriPensando2.png'
import deriConcelu from '../../assets/Dericoncelu2.png'
import deriSonriente from '../../assets/Derisonriente.png'

export type DerinatorEmotion =
  | 'thinking'
  | 'confident'
  | 'surprised'
  | 'worried'
  | 'triumphant'
  | 'defeated'
  | 'neutral'

interface DerinatorAvatarProps {
  emotion: DerinatorEmotion
  isThinking?: boolean
  bubbleText?: string
  className?: string
}

const EMOTION_IMAGES: Record<DerinatorEmotion, string> = {
  thinking: deriPensando,
  confident: deriConcelu,
  surprised: deriPensando,
  worried: deriPensando,
  triumphant: deriSonriente,
  defeated: deriConcelu,
  neutral: deriPensando,
}

const EMOTION_FILTERS: Record<DerinatorEmotion, string> = {
  thinking: 'none',
  confident: 'brightness(1.1) contrast(1.05)',
  surprised: 'brightness(1.2) saturate(1.3)',
  worried: 'brightness(0.85) saturate(0.7) contrast(0.95)',
  triumphant: 'brightness(1.15) saturate(1.2)',
  defeated: 'grayscale(0.4) brightness(0.75)',
  neutral: 'none',
}

export default function DerinatorAvatar({
  emotion,
  isThinking = false,
  bubbleText,
  className = '',
}: DerinatorAvatarProps) {
  const image = EMOTION_IMAGES[emotion]
  const filter = EMOTION_FILTERS[emotion]

  return (
    <div className={`akinator-image ${className}`}>
      <img
        src={image}
        alt={`Derinator ${emotion}`}
        style={{ filter }}
        className={`avatar-img avatar-${emotion} ${isThinking ? 'avatar-thinking' : ''}`}
      />
      {bubbleText && (
        <div key={bubbleText} className={`speech-bubble ${isThinking ? 'thinking' : ''}`}>
          <span className="bubble-text">{bubbleText}</span>
        </div>
      )}
    </div>
  )
}
