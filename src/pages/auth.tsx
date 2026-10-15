import { useRef, useState } from 'react'
import { Link, useRouter, useSearch } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { login, problemFrom, register } from '../api/account'
import { defaultSearch } from '../api/catalog'
import { acceptSession } from '../auth/session-cache'
import { fieldErrors, loginSchema, registerSchema, safeReturnTo } from '../domain/account'
import { FormField } from '../components/form-field'
import { Button } from '../components/ui/button'

const signUpSchema = registerSchema
  .extend({ confirmPassword: registerSchema.shape.password })
  .refine((input) => input.password === input.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas devem ser iguais.',
  })

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const search = useSearch({ strict: false })
  const returnTo = safeReturnTo(search.redirect)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const formRef = useRef<HTMLFormElement>(null)
  const isRegister = mode === 'register'
  const auth = useMutation({
    mutationKey: ['account-auth'],
    gcTime: 0,
    mutationFn: (input: { name?: string; email: string; password: string }) =>
      isRegister ? register({ ...input, name: input.name ?? '' }) : login(input),
    onSuccess: async (session) => {
      await acceptSession(session)
      await router.navigate({ href: returnTo, replace: true })
    },
    onError: (error) => {
      const fields = problemFrom(error).fields ?? {}
      setErrors(fields)
      const input = formRef.current?.elements.namedItem(Object.keys(fields)[0])
      if (input instanceof HTMLElement) input.focus()
    },
  })
  return (
    <div className="kurio-app account-page">
      <main className="auth-card">
        <Link to="/" search={defaultSearch} className="brand">
          KURIO
        </Link>
        <p className="eyebrow">Sua próxima coleção começa aqui</p>
        <h1>{isRegister ? 'Crie sua conta' : 'Bem-vindo de volta'}</h1>
        <p className="muted">
          {isRegister
            ? 'Descubra arte digital e construa sua coleção.'
            : 'Entre para continuar sua jornada na Kurio.'}
        </p>
        <form
          ref={formRef}
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (auth.isPending) return
            const data = Object.fromEntries(new FormData(event.currentTarget))
            const result = (isRegister ? signUpSchema : loginSchema).safeParse(data)
            if (!result.success) {
              const fields = fieldErrors(result.error)
              setErrors(fields)
              const input = event.currentTarget.elements.namedItem(Object.keys(fields)[0])
              if (input instanceof HTMLElement) input.focus()
              return
            }
            setErrors({})
            auth.mutate(result.data)
          }}
        >
          {isRegister && (
            <FormField
              label="Nome"
              name="name"
              autoComplete="name"
              required
              maxLength={80}
              error={errors.name}
            />
          )}
          <FormField
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={errors.email}
          />
          <FormField
            label="Senha"
            name="password"
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            required
            error={errors.password}
          />
          {isRegister && (
            <>
              <p className="muted">Use pelo menos 10 caracteres, incluindo letras e números.</p>
              <FormField
                label="Confirmar senha"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                error={errors.confirmPassword}
              />
            </>
          )}
          {auth.isError && (
            <p role="alert" className="form-message error">
              {problemFrom(auth.error).message}
            </p>
          )}
          <Button type="submit" disabled={auth.isPending}>
            {auth.isPending ? 'Aguarde…' : isRegister ? 'Criar conta' : 'Entrar'}
          </Button>
        </form>
        <p>
          {isRegister ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
          <Link
            to={isRegister ? '/login' : '/cadastro'}
            search={{ redirect: returnTo }}
            className="text-link"
          >
            {isRegister ? 'Entrar' : 'Cadastre-se'}
          </Link>
        </p>
        <Link to="/" search={defaultSearch} className="text-link">
          Voltar ao mercado
        </Link>
      </main>
    </div>
  )
}
