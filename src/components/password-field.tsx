import { useId, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function PasswordField({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  return (
    <div className="form-field password-field">
      <label htmlFor={id}>{label}</label>
      <div>
        <input
          {...props}
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <Eye size={19} /> : <EyeOff size={19} />}
        </button>
      </div>
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}
