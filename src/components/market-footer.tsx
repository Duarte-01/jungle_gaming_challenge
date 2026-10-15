import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { defaultSearch } from '../api/catalog'

export function MarketFooter() {
  const [notice, setNotice] = useState('')
  const auxiliary = () =>
    setNotice(
      'Este conteúdo não faz parte da demonstração. Explore o catálogo, sua conta e os fluxos de compra.',
    )
  return (
    <footer className="market-footer container">
      <section className="footer-benefits" aria-label="Conheça a Kurio">
        {[
          [
            'W',
            'Segurança da carteira',
            'Proteja sua carteira e colecione arte digital verificada com confiança.',
          ],
          [
            'C',
            'Criadores em destaque',
            'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
          ],
          [
            'D',
            'Alertas de lançamentos',
            'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
          ],
        ].map(([letter, title, copy]) => (
          <article key={letter}>
            <span className="benefit-symbol" aria-hidden="true">
              {letter}
            </span>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
        <form
          className="newsletter"
          onSubmit={(event) => {
            event.preventDefault()
            setNotice(
              'A inscrição em novidades não está disponível nesta demonstração. Nenhum e-mail foi enviado.',
            )
          }}
        >
          <h2>Antecipe-se ao próximo lançamento</h2>
          <label className="sr-only" htmlFor="newsletter-email">
            E-mail para novidades
          </label>
          <div>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="digite seu e-mail..."
              autoComplete="email"
            />
            <button type="submit" className="kurio-button">
              Enviar
            </button>
          </div>
          <p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
        </form>
      </section>
      <div className="footer-contact">
        <Link to="/" search={defaultSearch} className="brand">
          KURIO
        </Link>
        <p>
          Feito para colecionadores,
          <br />
          criadores e cultura
        </p>
        <a href="mailto:contato@example.com">contato@example.com</a>
        <span>+55 11 4002 8922</span>
      </div>
      <div className="footer-links">
        <section>
          <h2>Meu perfil</h2>
          <Link to="/perfil">Meu perfil</Link>
          <Link to="/pedidos">Minha coleção</Link>
          <Link to="/pedidos">Atividade</Link>
          <button type="button" onClick={auxiliary}>
            Estúdio do criador
          </button>
          <Link to="/favoritos">Lista de interesse</Link>
        </section>
        <section>
          <h2>Central de ajuda</h2>
          {[
            'Central de ajuda',
            'Como comprar NFTs',
            'Carteira e segurança',
            'Política do mercado',
            'Denunciar item',
          ].map((label) => (
            <button key={label} type="button" onClick={auxiliary}>
              {label}
            </button>
          ))}
        </section>
        <section>
          <h2>Coleções</h2>
          {['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'].map((category) => (
            <Link key={category} to="/" search={{ ...defaultSearch, category }} hash="catalogo">
              {category}
            </Link>
          ))}
        </section>
        <section>
          <h2>Redes sociais</h2>
          <div className="footer-social">
            {['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube'].map((label) => (
              <button type="button" key={label} aria-label={label} onClick={auxiliary}>
                <span aria-hidden="true">
                  {label === 'LinkedIn' ? 'in' : label.slice(0, 1).toLowerCase()}
                </span>
              </button>
            ))}
          </div>
          <h2>Carteiras compatíveis</h2>
          <Link to="/carteiras" search={{ redirect: '/' }} className="wallet-brands">
            METAMASK · WALLETCONNECT · COINBASE <ArrowUpRight size={10} />
          </Link>
        </section>
      </div>
      {notice && (
        <p className="footer-feedback" role="status">
          {notice}
        </p>
      )}
      <p className="footer-copyright">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
