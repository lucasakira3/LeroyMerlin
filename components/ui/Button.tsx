import { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  // Primário escurece no hover (clarear, como era, baixava o contraste do texto branco).
  primary: 'bg-lm-green text-white hover:bg-green-700',
  // `hover-verde` é o hover padrão de botão secundário — ver app/globals.css.
  secondary: 'bg-white text-lm-green border border-lm-green/30 hover-verde',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
  // red-700 e não red-600: sobre o rosado do hover (red-50) o 600 ficava em 4,4:1.
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
