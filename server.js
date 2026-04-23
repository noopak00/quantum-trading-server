const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 실시간 주가 데이터 캐시 (5분)
const cache = {};
const CACHE_TIME = 5 * 60 * 1000;

// ================ 한국 주식 데이터 ================
async function getKoreanStockData(code) {
  const cacheKey = `KR_${code}`;
  
  if (cache[cacheKey] && Date.now() - cache[cacheKey].time < CACHE_TIME) {
    return cache[cacheKey].data;
  }

  try {
    // 한국 주식 - Yahoo Finance 사용
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${code}.KS?modules=price,chart,summaryDetail`;
    const response = await fetch(url, { timeout: 5000 });
    const data = await response.json();

    if (data.quoteSummary && data.quoteSummary.result && data.quoteSummary.result[0]) {
      const quote = data.quoteSummary.result[0];
      const price = quote.price;
      const chart = quote.chart?.result?.[0];

      let historicalData = [];
      if (chart && chart.timestamp) {
        historicalData = chart.timestamp.slice(0, 60).map((ts, i) => ({
          date: new Date(ts * 1000).toISOString().split('T')[0],
          close: chart.indicators[0].quote[0].close[i],
          high: chart.indicators[0].quote[0].high[i],
          low: chart.indicators[0].quote[0].low[i],
          volume: chart.indicators[0].quote[0].volume[i]
        })).reverse();
      }

      const result = {
        symbol: code,
        currency: '₩',
        currentPrice: price.regularMarketPrice?.raw || 0,
        change: price.regularMarketChange?.raw || 0,
        changePercent: price.regularMarketChangePercent?.raw || 0,
        high52w: price.fiftyTwoWeekHigh?.raw || 0,
        low52w: price.fiftyTwoWeekLow?.raw || 0,
        volume: price.regularMarketVolume?.raw || 0,
        marketCap: price.marketCap?.raw || 0,
        historicalData,
        timestamp: new Date()
      };

      cache[cacheKey] = { data: result, time: Date.now() };
      return result;
    }
  } catch (error) {
    console.error(`한국 주식 데이터 오류 (${code}):`, error.message);
  }

  return null;
}

// ================ 미국 주식 데이터 ================
async function getUSStockData(ticker) {
  const cacheKey = `US_${ticker}`;
  
  if (cache[cacheKey] && Date.now() - cache[cacheKey].time < CACHE_TIME) {
    return cache[cacheKey].data;
  }

  try {
    // 미국 주식 - Alpha Vantage (데모 키 또는 실제 키)
    const apiKey = 'demo'; // 실제 사용 시 유료 키 필요
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=full&apikey=${apiKey}`;
    
    const response = await fetch(url, { timeout: 5000 });
    const data = await response.json();

    if (data['Time Series (Daily)']) {
      const timeSeries = Object.entries(data['Time Series (Daily)']).slice(0, 60);
      const historicalData = timeSeries.reverse().map(([date, values]) => ({
        date,
        close: parseFloat(values['4. close']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        volume: parseInt(values['5. volume'])
      }));

      const latestPrice = parseFloat(historicalData[historicalData.length - 1].close);
      const prevPrice = historicalData.length > 1 ? parseFloat(historicalData[historicalData.length - 2].close) : latestPrice;
      const change = latestPrice - prevPrice;
      const changePercent = (change / prevPrice) * 100;

      const result = {
        symbol: ticker,
        currency: '$',
        currentPrice: latestPrice,
        change: change,
        changePercent: changePercent,
        high52w: Math.max(...historicalData.map(d => d.high)),
        low52w: Math.min(...historicalData.map(d => d.low)),
        volume: historicalData[historicalData.length - 1].volume,
        marketCap: 0, // Alpha Vantage에서 제공 안 함
        historicalData,
        timestamp: new Date()
      };

      cache[cacheKey] = { data: result, time: Date.now() };
      return result;
    }

    // 대체: Yahoo Finance
    const yUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=price,chart,summaryDetail`;
    const yResponse = await fetch(yUrl, { timeout: 5000 });
    const yData = await yResponse.json();

    if (yData.quoteSummary && yData.quoteSummary.result && yData.quoteSummary.result[0]) {
      const quote = yData.quoteSummary.result[0];
      const price = quote.price;
      const chart = quote.chart?.result?.[0];

      let historicalData = [];
      if (chart && chart.timestamp) {
        historicalData = chart.timestamp.slice(0, 60).map((ts, i) => ({
          date: new Date(ts * 1000).toISOString().split('T')[0],
          close: chart.indicators[0].quote[0].close[i],
          high: chart.indicators[0].quote[0].high[i],
          low: chart.indicators[0].quote[0].low[i],
          volume: chart.indicators[0].quote[0].volume[i]
        })).reverse();
      }

      const result = {
        symbol: ticker,
        currency: '$',
        currentPrice: price.regularMarketPrice?.raw || 0,
        change: price.regularMarketChange?.raw || 0,
        changePercent: price.regularMarketChangePercent?.raw || 0,
        high52w: price.fiftyTwoWeekHigh?.raw || 0,
        low52w: price.fiftyTwoWeekLow?.raw || 0,
        volume: price.regularMarketVolume?.raw || 0,
        marketCap: price.marketCap?.raw || 0,
        historicalData,
        timestamp: new Date()
      };

      cache[cacheKey] = { data: result, time: Date.now() };
      return result;
    }
  } catch (error) {
    console.error(`미국 주식 데이터 오류 (${ticker}):`, error.message);
  }

  return null;
}

// ================ API 엔드포인트 ================

// 한국 주식 데이터
app.get('/api/stock/kr/:code', async (req, res) => {
  const { code } = req.params;
  const data = await getKoreanStockData(code);
  
  if (data) {
    res.json({ success: true, data });
  } else {
    res.status(404).json({ success: false, error: '데이터를 불러올 수 없습니다' });
  }
});

// 미국 주식 데이터
app.get('/api/stock/us/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const data = await getUSStockData(ticker);
  
  if (data) {
    res.json({ success: true, data });
  } else {
    res.status(404).json({ success: false, error: '데이터를 불러올 수 없습니다' });
  }
});

// 기술 지표 계산
app.post('/api/analyze', (req, res) => {
  const { prices, strategy, risk } = req.body;

  if (!prices || prices.length < 14) {
    return res.status(400).json({ error: '최소 14개의 가격 데이터 필요' });
  }

  const closes = prices.map(p => typeof p === 'number' ? p : p.close);

  // RSI 계산
  let gains = 0, losses = 0;
  for (let i = 1; i < 14; i++) {
    const diff = closes[i] - closes[i-1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  // SMA
  const sma20 = closes.slice(0, 20).reduce((a, b) => a + b) / 20;
  const sma50 = closes.slice(0, 50).reduce((a, b) => a + b) / 50;

  // Volatility
  let sumSq = 0;
  for (let i = 0; i < 20; i++) {
    const ret = (closes[i] - closes[i+1]) / closes[i+1];
    sumSq += ret * ret;
  }
  const volatility = Math.sqrt(sumSq / 20) * 100;

  // Trend
  const trend = closes[0] > closes[19] ? 1 : closes[0] < closes[19] ? -1 : 0;

  // Momentum
  const momentum = ((closes[0] - closes[9]) / closes[9]) * 100;

  // 신호 결정
  let buyScore = 0, sellScore = 0;

  if (rsi < 35) buyScore += 25;
  if (rsi > 70) sellScore += 25;

  if (closes[0] > sma20 && sma20 > sma50) buyScore += 20;
  if (closes[0] < sma20 && sma20 < sma50) sellScore += 20;

  if (momentum > 5) buyScore += 15;
  if (momentum < -5) sellScore += 15;

  if (strategy === 'momentum' && trend > 0) buyScore += 15;
  if (strategy === 'momentum' && trend < 0) sellScore += 15;

  const threshold = { low: 55, mid: 45, high: 35 }[risk] || 45;

  let signal;
  if (buyScore >= threshold && buyScore > sellScore + 10) signal = 'BUY';
  else if (sellScore >= threshold && sellScore > buyScore + 10) signal = 'SELL';
  else signal = 'HOLD';

  const confidence = Math.min(95, Math.max(45, Math.round(Math.max(buyScore, sellScore) * 0.9)));

  res.json({
    signal,
    confidence,
    rsi: Math.round(rsi),
    sma20,
    sma50,
    volatility: Math.round(volatility),
    trend,
    momentum: Math.round(momentum),
    buyScore,
    sellScore
  });
});

// 상태 확인
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Quantum Trading Server running on port ${PORT}`);
});
