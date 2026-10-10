import { useEffect, useMemo, useState } from 'react'
import './App.css'

const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' })

const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'NZD',
  'SEK', 'NOK', 'DKK', 'SGD', 'INR', 'KRW', 'MXN', 'BRL', 'RUB', 'TRY',
  'ZAR', 'PLN', 'THB', 'IDR', 'MYR', 'PHP', 'ILS', 'HUF', 'RON', 'CZK',
  'BGN', 'ISK', 'HRK'
].sort()

const popularCodes = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']
const currentYear = new Date().getFullYear()

function currencyName(code) {
  try {
    return displayNames.of(code) || code
  } catch {
    return code
  }
}

function formatMoney(value, currency, maximumFractionDigits = 2) {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits,
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

function App() {
  const [base, setBase] = useState('USD')
  const [target, setTarget] = useState('EUR')
  const [amount, setAmount] = useState('1')
  const [rates, setRates] = useState(null)
  const [updatedAt, setUpdatedAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadRates() {
      setLoading(true)
      setRates(null)
      setUpdatedAt('')
      setError('')
      try {
        const response = await fetch(`/api/rates/${base}`, { signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Rates could not be loaded.')
        setRates(data.rates)
        setUpdatedAt(data.updatedAt)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Rates could not be loaded. Check that the API server is running.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadRates()
    return () => controller.abort()
  }, [base])

  const currencyCodes = useMemo(() => {
    return rates ? Object.keys(rates).sort() : SUPPORTED_CURRENCIES
  }, [rates])

  const numericAmount = useMemo(() => {
    const parsed = Number.parseFloat(amount)
    return isNaN(parsed) || parsed < 0 ? 0 : parsed
  }, [amount])

  const rate = rates?.[target]
  const converted = rate == null ? null : numericAmount * rate
  const rateLabel = rate == null ? '—' : new Intl.NumberFormat('en', { maximumSignificantDigits: 8 }).format(rate)
  const dateLabel = updatedAt ? new Date(updatedAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  function swapCurrencies() {
    setBase(target)
    setTarget(base)
  }

  function handleAmountChange(event) {
    const value = event.target.value
    if (value === '' || Number(value) >= 0) {
      setAmount(value)
    }
  }

  async function copyResult() {
    if (converted == null) return
    try {
      await navigator.clipboard.writeText(`${formatMoney(converted, target, 4)} (${amount || '0'} ${base} → ${target})`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Clipboard access is not available in this browser.')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="freecurrencyapi.com home">
          <span className="brand-mark" aria-hidden="true">↗</span>
          <span>freecurrencyapi<span className="brand-period">.com</span></span>
        </a>
        <div className="topbar-note"><span className="live-dot" /> Rates updated daily</div>
      </header>

      <main id="top">
        <section className="intro">
          <div className="eyebrow"><span>✳</span> SIMPLE, CLEAR CURRENCY CONVERSION</div>
          <h1>Money moves.<br /><span>Know the rate.</span></h1>
          <p className="intro-copy">Convert currencies with the latest available exchange rates. No guesswork, just a clear number.</p>
        </section>

        <div className="workspace">
          <section className="converter-card" aria-labelledby="converter-heading">
            <div className="card-heading">
              <div>
                <p className="card-kicker">CONVERTER</p>
                <h2 id="converter-heading">Make a conversion</h2>
              </div>
              <span className="secure-mark" aria-label="Exchange rates">⇄</span>
            </div>

            <div className="currency-fields">
              <div className="currency-field">
                <label className="field-label" htmlFor="amount-input">You send</label>
                <span className="input-row">
                  <input
                    id="amount-input"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    aria-label={`Amount in ${base}`}
                  />
                  <span className="field-divider" />
                  <select value={base} onChange={(event) => setBase(event.target.value)} aria-label="From currency">
                    {currencyCodes.map((code) => <option key={code} value={code}>{code}</option>)}
                  </select>
                </span>
                <span className="currency-name">{currencyName(base)}</span>
              </div>

              <button className="swap-button" type="button" onClick={swapCurrencies} aria-label="Swap currencies" title="Swap currencies">
                <span aria-hidden="true">⇅</span>
              </button>

              <div className="currency-field">
                <span className="field-label">You receive</span>
                <span className="input-row target-row">
                  <span className="result-amount" aria-live="polite">{converted == null ? '—' : formatMoney(converted, target, 4)}</span>
                  <span className="field-divider" />
                  <select id="target-currency" value={target} onChange={(event) => setTarget(event.target.value)} aria-label="To currency">
                    {currencyCodes.map((code) => <option key={code} value={code}>{code}</option>)}
                  </select>
                </span>
                <span className="currency-name">{currencyName(target)}</span>
              </div>
            </div>

            <div className="rate-summary">
              <span className="rate-icon" aria-hidden="true">↗</span>
              <span>1 {base} <span className="muted-arrow">=</span> <strong>{rateLabel} {target}</strong></span>
              <button className="copy-button" type="button" onClick={copyResult} disabled={converted == null}>
                {copied ? 'Copied ✓' : 'Copy result'}
              </button>
            </div>

            {error && <div className="error-message" role="alert">{error} <span>Make sure the Express server is running.</span></div>}
            {loading && <div className="loading-line" role="status"><span className="spinner" /> Updating rates…</div>}
            {!loading && !error && updatedAt && <p className="updated-note">Rate data last updated {dateLabel} · indicative rates only</p>}
          </section>

          <aside className="side-card" aria-label="Rate details">
            <div className="side-card-top">
              <div>
                <p className="card-kicker">AT A GLANCE</p>
                <h2>Today’s rate</h2>
              </div>
              <span className="trend-mark" aria-hidden="true">⌁</span>
            </div>
            <div className="big-rate">{rateLabel}<span> {target}</span></div>
            <p className="rate-caption">for every 1 {base}</p>
            <div className="side-divider" />
            <div className="popular-heading"><span>Popular rates</span><span>1 {base}</span></div>
            <div className="popular-list">
              {popularCodes.filter((code) => code !== base && rates?.[code] != null).map((code) => (
                <button 
                  className={`popular-row ${target === code ? 'selected' : ''}`} 
                  key={code} 
                  type="button" 
                  onClick={() => setTarget(code)}
                >
                  <span className="popular-currency">
                    <span className="currency-token">{code.slice(0, 1)}</span>
                    <span>
                      <strong>{code}</strong>
                      <small>{currencyName(code)}</small>
                    </span>
                  </span>
                  <strong className="popular-value">
                    {new Intl.NumberFormat('en', { maximumFractionDigits: 4 }).format(rates[code])}
                  </strong>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </main>
      
      <footer className="footer-note">
        <p>© {currentYear} freecurrencyapi.com. Powered by open-access exchange data.</p>
      </footer>
    </div>
  )
}

export default App
