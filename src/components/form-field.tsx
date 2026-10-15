import { useId, type InputHTMLAttributes } from 'react'

export function FormField({
  label,
  error,
  containerClassName = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  containerClassName?: string
}) {
  const id = useId()
  return (
    <div className={`form-field ${containerClassName}`}>
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
