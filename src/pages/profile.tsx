import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { changePassword, problemFrom, sessionOptions, updateProfile } from '../api/account'
import { queryClient } from '../app/query-client'
import { forgetSession } from '../auth/session-cache'
import {
  changePasswordSchema,
  fieldErrors,
  profileSchema,
  type Session,
  type User,
} from '../domain/account'
import { FormField } from '../components/form-field'
import { MarketHeader } from '../components/market-header'
import { Button } from '../components/ui/button'
import { sessionGeneration } from '../auth/events'

function ProfileForm({ user }: { user: User }) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [avatar, setAvatar] = useState(user.avatarUrl)
  const [avatarError, setAvatarError] = useState('')
  const mutation = useMutation({
    mutationKey: ['private', user.id, 'profile'],
    gcTime: 0,
    onMutate: () => ({ generation: sessionGeneration() }),
    mutationFn: updateProfile,
    onSuccess: (updated, _input, context) => {
      if (context?.generation === sessionGeneration())
        queryClient.setQueryData<Session>(['session'], (previous) =>
          previous?.user?.id === updated.id ? { ...previous, user: updated } : previous,
        )
    },
    onError: (error) => setErrors(problemFrom(error).fields ?? {}),
  })
  return (
    <form
      className="profile-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (mutation.isPending) return
        const input = Object.fromEntries(new FormData(event.currentTarget))
        const result = profileSchema.safeParse({ ...input, avatarUrl: avatar })
        if (!result.success) {
          setErrors(fieldErrors(result.error))
          return
        }
        setErrors({})
        mutation.mutate(result.data)
      }}
    >
      <h2>Dados do colecionador</h2>
      {avatar && <img src={avatar} alt={`Avatar de ${user.name}`} className="profile-avatar" />}
      <div className="form-field">
        <label htmlFor="avatar-file">Avatar</label>
        <input
          id="avatar-file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-describedby={avatarError ? 'avatar-error' : 'avatar-help'}
          aria-invalid={Boolean(avatarError)}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            if (
              file.size > 250_000 ||
              !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
            ) {
              setAvatarError('Use uma imagem PNG, JPEG ou WebP de até 250 KB.')
              return
            }
            const reader = new FileReader()
            reader.onload = () => {
              setAvatar(String(reader.result))
              setAvatarError('')
            }
            reader.onerror = () => setAvatarError('Não foi possível ler a imagem.')
            reader.readAsDataURL(file)
          }}
        />
        <p id="avatar-help" className="muted">
          PNG, JPEG ou WebP, até 250 KB.
        </p>
        {avatarError && (
          <p id="avatar-error" role="alert">
            {avatarError}
          </p>
        )}
      </div>
      {avatar && (
        <button type="button" className="text-link" onClick={() => setAvatar(null)}>
          Remover avatar
        </button>
      )}
      <FormField
        label="Nome"
        name="name"
        autoComplete="name"
        defaultValue={user.name}
        error={errors.name}
      />
      <FormField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={user.email}
        error={errors.email}
      />
      <FormField
        label="Telefone"
        name="phone"
        type="tel"
        autoComplete="tel"
        defaultValue={user.phone}
        error={errors.phone}
      />
      {mutation.isError && (
        <p role="alert" className="form-message error">
          {problemFrom(mutation.error).message}
        </p>
      )}
      {mutation.isSuccess && (
        <p role="status" className="form-message">
          Perfil atualizado.
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending || Boolean(avatarError)}>
        {mutation.isPending ? 'Salvando…' : 'Salvar perfil'}
      </Button>
    </form>
  )
}

function PasswordForm() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const mutation = useMutation({
    mutationKey: ['private', 'password'],
    gcTime: 0,
    mutationFn: changePassword,
    onMutate: () => ({ generation: sessionGeneration() }),
    onError: (error) => setErrors(problemFrom(error).fields ?? {}),
    onSuccess: async (_data, _input, context) => {
      if (context?.generation !== sessionGeneration()) return
      await forgetSession()
      await navigate({ to: '/login', search: { redirect: '/perfil' } })
    },
  })
  return (
    <form
      className="profile-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (mutation.isPending) return
        const result = changePasswordSchema.safeParse(
          Object.fromEntries(new FormData(event.currentTarget)),
        )
        if (!result.success) {
          setErrors(fieldErrors(result.error))
          return
        }
        setErrors({})
        mutation.mutate(result.data)
      }}
    >
      <h2>Alterar senha</h2>
      <p className="muted">Após a alteração, entre novamente com sua nova senha.</p>
      <FormField
        label="Senha atual"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword}
      />
      <FormField
        label="Nova senha"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword}
      />
      {mutation.isError && (
        <p role="alert" className="form-message error">
          {problemFrom(mutation.error).message}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        Alterar senha
      </Button>
    </form>
  )
}

export function ProfilePage() {
  const session = useQuery(sessionOptions)
  return (
    <div className="kurio-app">
      <MarketHeader />
      <main className="container commerce-page">
        <p className="eyebrow">Sua identidade na Kurio</p>
        <h1>Meu perfil</h1>
        <nav className="order-links" aria-label="Minha conta">
          <Link to="/carteiras" search={{ redirect: '/perfil' }} className="text-link">
            Minhas carteiras
          </Link>
          <Link to="/pedidos" className="text-link">
            Meus pedidos
          </Link>
        </nav>
        {session.data?.user && (
          <div className="profile-grid">
            <ProfileForm key={session.data.user.id} user={session.data.user} />
            <PasswordForm />
          </div>
        )}
      </main>
    </div>
  )
}
