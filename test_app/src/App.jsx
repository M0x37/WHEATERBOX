import { useEffect, useRef, useState, useCallback } from 'react'
import './App.css'

const IS_NATIVE = typeof window !== 'undefined' && window.Capacitor?.isNative
const DEFAULT_URLS = IS_NATIVE
  ? ['http://192.168.178.100/', 'http://btq1527kep2zl2dk.myfritz.net/']
  : ['http://192.168.178.100/']

const HISTORY_KEY = 'tempbox_history'
const MAX_ENTRIES = 200

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveEntry(entry) {
  const history = loadHistory()
  history.push(entry)
  if (history.length > MAX_ENTRIES) history.splice(0, history.length - MAX_ENTRIES)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

async function fetchFromUrl(url, signal) {
  if (IS_NATIVE) {
    try {
      const CapacitorHttp = window.Capacitor?.Plugins?.CapacitorHttp
      if (CapacitorHttp?.get) {
        const res = await CapacitorHttp.get({ url, responseType: 'json', connectTimeout: 5000 })
        if (typeof res?.data?.temp === 'number') return res.data
      }
    } catch {}
  }
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}

function App() {
  const [data, setData] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [status, setStatus] = useState('connecting')
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [activeUrl, setActiveUrl] = useState('')
  const [customIp, setCustomIp] = useState('')
  const cached = useRef(null)
  const cachedTime = useRef(null)
  const timerRef = useRef(null)

  const isConnectedRef = useRef(false)

  const fetchData = useCallback(async () => {
    const urls = customIp ? [`http://${customIp}/`] : DEFAULT_URLS
    for (const url of urls) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      try {
        const json = await fetchFromUrl(url, controller.signal)
        const now = new Date().toLocaleTimeString()
        cached.current = json
        cachedTime.current = now
        setData(json)
        setLastUpdate(now)
        setActiveUrl(url)
        setStatus('connected')
        isConnectedRef.current = true
        saveEntry({ temp: json.temp, time: now })
        return
      } catch {
      } finally {
        clearTimeout(timeout)
      }
    }
    if (cached.current) {
      setData(cached.current)
      setLastUpdate(cachedTime.current)
    }
    setStatus('disconnected')
    isConnectedRef.current = false
  }, [customIp])

  useEffect(() => {
    fetchData()
    timerRef.current = setInterval(fetchData, 5000)
    return () => clearInterval(timerRef.current)
  }, [fetchData])

  const sleeping = status === 'disconnected' && data

  function openHistory() {
    setHistory(loadHistory().toReversed())
    setShowHistory(true)
  }

  if (showHistory) {
    return (
      <div className="container history-view">
        <div className="history-header">
          <button className="btn" onClick={() => setShowHistory(false)}>← Back</button>
          <span className="history-title">Temperature History</span>
        </div>
        <div className="history-list">
          {history.length === 0 && <div className="history-empty">no entries</div>}
          {history.map((e, i) => (
            <div className="history-item" key={i}>
              <span className="history-temp">{e.temp.toFixed(1)}°C</span>
              <span className="history-time">{e.time}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const noData = !data
  const dim = noData || sleeping

  return (
    <div className="container">
      <div className={dim ? 'temp dim' : 'temp'}>
        {data ? data.temp.toFixed(1) : '--'}
        <span className="temp-unit">°C</span>
      </div>
      <div className="extras">
        <div className="extra-item">
          <div className="extra-label">Humidity</div>
          <div className="extra-value">{data ? data.humidity.toFixed(0) : '--'}%</div>
        </div>
        <div className="extra-item">
          <div className="extra-label">Pressure</div>
          <div className="extra-value">{data ? data.pressure.toFixed(0) : '--'} hPa</div>
        </div>
      </div>
      {lastUpdate && (
        <div className={dim ? 'meta asleep' : 'meta'}>
          {sleeping ? 'last update' : 'updated'} <span>{lastUpdate}</span>
        </div>
      )}
      <div className="source">
        {activeUrl.includes('myfritz') ? 'via internet' : 'local'}
      </div>
      <button className="btn history-btn" onClick={openHistory}>HISTORY</button>
    </div>
  )
}

export default App
