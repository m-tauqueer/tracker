// Constants & Elements
const API_BASE = "https://api.coinlore.net/api";
const elements = {
  topCoinsList: document.getElementById("topCoins"),
  coinInfo: document.getElementById("coinInfo"),
  searchInput: document.getElementById("searchInput"),
  suggestions: document.getElementById("suggestions"),
  coinStats: document.getElementById("coinStats"),
};

// State
let chart, currentCoin, currentPeriod = '7d';
let coinCache = new Map();
let isLoading = false;

// Market Insights Data
const marketInsights = [
  {
    title: "Market Sentiment",
    description: "Current market sentiment based on price movements and volume",
    indicators: ["Fear & Greed Index", "Market Momentum", "Volume Analysis"]
  },
  {
    title: "Top Performers",
    description: "Best performing cryptocurrencies in the last 24 hours",
    metrics: ["Price Change", "Volume Increase", "Market Cap Growth"]
  },
  {
    title: "Market Trends",
    description: "Key trends shaping the cryptocurrency market",
    trends: ["DeFi Growth", "NFT Adoption", "Institutional Interest"]
  },
  {
    title: "Risk Assessment",
    description: "Current market risks and volatility indicators",
    risks: ["Market Volatility", "Regulatory Changes", "Technical Risks"]
  }
];

// Enhanced Crypto Info Data with more details
const cryptoInfoData = [
  {
    name: 'Bitcoin (BTC)',
    desc: 'The first and most well-known decentralized digital currency, created in 2009 by Satoshi Nakamoto. Bitcoin operates on a peer-to-peer network without the need for intermediaries.',
    features: ['Decentralized', 'Limited Supply', 'Proof of Work', 'Store of Value'],
    marketCap: 'Largest by market cap',
    useCase: 'Digital gold, payments, store of value'
  },
  {
    name: 'Ethereum (ETH)',
    desc: 'A decentralized platform that enables smart contracts and decentralized applications (DApps). Ethereum 2.0 introduced proof-of-stake consensus mechanism.',
    features: ['Smart Contracts', 'DApps Platform', 'Proof of Stake', 'DeFi Ecosystem'],
    marketCap: 'Second largest by market cap',
    useCase: 'Smart contracts, DeFi, NFTs, DApps'
  },
  {
    name: 'Binance Coin (BNB)',
    desc: 'The native cryptocurrency of the Binance ecosystem, used for trading fees, participating in token sales, and powering the Binance Smart Chain.',
    features: ['Exchange Token', 'Trading Fees', 'BSC Network', 'Token Sales'],
    marketCap: 'Major exchange token',
    useCase: 'Trading fees, BSC transactions, staking'
  },
  {
    name: 'Cardano (ADA)',
    desc: 'A proof-of-stake blockchain platform that aims to be a more secure and sustainable ecosystem for DApps. Built with peer-reviewed research and evidence-based methods.',
    features: ['Proof of Stake', 'Peer Reviewed', 'Sustainability', 'Scalability'],
    marketCap: 'Top 10 by market cap',
    useCase: 'Smart contracts, DeFi, identity management'
  },
  {
    name: 'Solana (SOL)',
    desc: 'A high-performance blockchain known for its fast transaction speeds and low costs. Uses proof-of-history consensus for high throughput.',
    features: ['High Speed', 'Low Cost', 'Proof of History', 'Scalable'],
    marketCap: 'High-performance blockchain',
    useCase: 'DeFi, NFTs, gaming, high-frequency trading'
  },
  {
    name: 'Ripple (XRP)',
    desc: 'A digital payment protocol designed for fast and low-cost international money transfers. RippleNet connects banks and payment providers globally.',
    features: ['Fast Transfers', 'Low Fees', 'Bank Partnerships', 'Cross-border'],
    marketCap: 'Major exchange token',
    useCase: 'International remittances, bank transfers'
  },
  {
    name: 'Polkadot (DOT)',
    desc: 'A multi-chain protocol that allows different blockchains to connect and communicate with each other. Enables cross-chain transfers and shared security.',
    features: ['Interoperability', 'Parachains', 'Shared Security', 'Scalability'],
    marketCap: 'Interoperability platform',
    useCase: 'Cross-chain communication, parachain development'
  },
  {
    name: 'Dogecoin (DOGE)',
    desc: 'Originally created as a meme, it has become a popular cryptocurrency for tipping and small transactions. Known for its friendly community and low transaction fees.',
    features: ['Meme Coin', 'Low Fees', 'Community Driven', 'Fast Transactions'],
    marketCap: 'Popular meme coin',
    useCase: 'Tipping, small payments, community rewards'
  },
  {
    name: 'Avalanche (AVAX)',
    desc: 'A platform for decentralized applications and custom blockchain networks, focusing on scalability and interoperability. Uses multiple consensus mechanisms.',
    features: ['Subnets', 'High Throughput', 'Interoperable', 'Customizable'],
    marketCap: 'Scalable blockchain platform',
    useCase: 'DeFi, NFTs, enterprise solutions, custom blockchains'
  },
  {
    name: 'Litecoin (LTC)',
    desc: 'One of the earliest altcoins, designed to be a "silver" to Bitcoin\'s "gold" with faster transaction times and different mining algorithm.',
    features: ['Faster Blocks', 'Scrypt Algorithm', 'Silver to Bitcoin', 'Established'],
    marketCap: 'Early altcoin',
    useCase: 'Faster payments, digital silver, transactions'
  },
];

// Utility Functions
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), delay);
  };
};

const formatCurrency = value => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatNumber = value => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString();
};

const safeParseFloat = (value) => parseFloat(value) || 0;

const showLoading = (element, text = 'Loading...') => {
  element.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="loading-spinner"></div>
      <p style="color: var(--text-secondary); margin-top: 1rem;">${text}</p>
    </div>
  `;
};

const showError = (element, message = 'An error occurred') => {
  element.innerHTML = `
    <div style="text-align: center; padding: 2rem; color: #f87171;">
      <p style="font-size: 1.2rem; margin-bottom: 1rem;">⚠️ ${message}</p>
      <button onclick="location.reload()" class="nav-btn" style="margin: 0 auto;">Retry</button>
    </div>
  `;
};

const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
};

// API Function with better error handling
async function fetchWithCache(url, key) {
  const cached = coinCache.get(key);
  if (cached && (Date.now() - cached.timestamp < 60000)) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    coinCache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

// Main Functions
async function loadTopCoins(showNotification = false) {
  if (isLoading) return;
  isLoading = true;

  try {
    if (showNotification) {
      showNotification('Refreshing cryptocurrency data...', 'info');
    }

    showLoading(elements.topCoinsList, 'Loading top coins...');
    const data = await fetchWithCache(`${API_BASE}/tickers/?start=0&limit=10`, 'topCoins');

    elements.topCoinsList.innerHTML = data.data.map(coin => {
      const change24h = safeParseFloat(coin.percent_change_24h);
      const changeColor = change24h >= 0 ? '#10B981' : '#EF4444';
      const changeIcon = change24h >= 0 ? '↗' : '↘';

      return `
        <li onclick="showCoinDetails(${coin.id})" class="coin-list-item">
          <div class="coin-info">
            <span class="coin-name">${coin.name}</span>
            <span class="coin-symbol">${coin.symbol}</span>
            <div class="coin-change" style="color: ${changeColor}; font-size: 0.8rem;">
              ${changeIcon} ${Math.abs(change24h).toFixed(2)}%
            </div>
          </div>
          <span class="coin-price">${formatCurrency(coin.price_usd)}</span>
        </li>
      `;
    }).join('');

    if (showNotification) {
      showNotification('Cryptocurrency data updated successfully!', 'success');
    }
  } catch (error) {
    showError(elements.topCoinsList, 'Could not load coins. Please check your connection.');
    if (showNotification) {
      showNotification('Failed to update cryptocurrency data. Please try again.', 'error');
    }
  } finally {
    isLoading = false;
  }
}

async function showCoinDetails(id) {
  try {
    showLoading(elements.coinInfo, 'Loading coin details...');
    const data = await fetchWithCache(`${API_BASE}/ticker/?id=${id}`, `coin_${id}`);
    currentCoin = data[0];

    const price = safeParseFloat(currentCoin.price_usd);
    const change24h = safeParseFloat(currentCoin.percent_change_24h);
    const changeColor = change24h >= 0 ? '#10B981' : '#EF4444';
    const changeIcon = change24h >= 0 ? '↗' : '↘';

    elements.coinInfo.className = 'card coin-info-header';
    elements.coinInfo.innerHTML = `
        <div class="coin-details">
            <span class="coin-title">${currentCoin.name} <span class="symbol">${currentCoin.symbol}</span></span>
            <div class="coin-change-large" style="color: ${changeColor}; font-size: 1.2rem; margin-top: 0.5rem;">
              ${changeIcon} ${change24h.toFixed(2)}% (24h)
            </div>
        </div>
        <div class="price-section">
            <span class="coin-price-large">${formatCurrency(price)}</span>
        </div>
    `;

    // Enhanced stats with better formatting
    const marketCap = safeParseFloat(currentCoin.market_cap_usd);
    const volume24h = safeParseFloat(currentCoin.volume24);
    const supply = safeParseFloat(currentCoin.csupply);
    const maxSupply = safeParseFloat(currentCoin.msupply);

    elements.coinStats.innerHTML = `
        <div class="stat-card">
            <div class="label">Price</div>
            <div class="value">${formatCurrency(price)}</div>
        </div>
        <div class="stat-card">
            <div class="label">Symbol</div>
            <div class="value">${currentCoin.symbol}</div>
        </div>
    `;

    createChart(price, change24h, currentPeriod);

    // Update market details
    updateMarketDetails(currentCoin);
  } catch (error) {
    showError(elements.coinInfo, 'Could not load coin details. Please try again.');
  }
}

function updateMarketDetails(coin) {
  try {
    // 1H Change (simulated since API doesn't provide this)
    const change1h = (Math.random() - 0.5) * 10; // Random change between -5% and +5%
    const change1hElement = document.getElementById('1hChange');
    if (change1hElement) {
      change1hElement.textContent = `${change1h >= 0 ? '+' : ''}${change1h.toFixed(2)}%`;
      change1hElement.className = `detail-value ${change1h >= 0 ? 'positive' : 'negative'}`;
    }

    // 24H Change
    const change24h = safeParseFloat(coin.percent_change_24h);
    const change24hElement = document.getElementById('24hChange');
    if (change24hElement) {
      change24hElement.textContent = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
      change24hElement.className = `detail-value ${change24h >= 0 ? 'positive' : 'negative'}`;
    }

    // 7D Change
    const change7d = safeParseFloat(coin.percent_change_7d);
    const change7dElement = document.getElementById('7dChange');
    if (change7dElement) {
      change7dElement.textContent = `${change7d >= 0 ? '+' : ''}${change7d.toFixed(2)}%`;
      change7dElement.className = `detail-value ${change7d >= 0 ? 'positive' : 'negative'}`;
    }

    // Market Cap
    const marketCap = safeParseFloat(coin.market_cap_usd);
    const marketCapElement = document.getElementById('marketCap');
    if (marketCapElement) {
      marketCapElement.textContent = formatCurrency(marketCap);
    }

    // Volume (24h)
    const volume24h = safeParseFloat(coin.volume24);
    const volume24hElement = document.getElementById('volume24h');
    if (volume24hElement) {
      volume24hElement.textContent = formatCurrency(volume24h);
    }

    // Total Supply
    const totalSupply = safeParseFloat(coin.msupply);
    const totalSupplyElement = document.getElementById('totalSupply');
    if (totalSupplyElement) {
      totalSupplyElement.textContent = totalSupply > 0 ? formatNumber(totalSupply) : 'N/A';
    }

    // Circulating Supply
    const circulatingSupply = safeParseFloat(coin.csupply);
    const circulatingSupplyElement = document.getElementById('circulatingSupply');
    if (circulatingSupplyElement) {
      circulatingSupplyElement.textContent = formatNumber(circulatingSupply);
    }

    // Max Supply
    const maxSupply = safeParseFloat(coin.msupply);
    const maxSupplyElement = document.getElementById('maxSupply');
    if (maxSupplyElement) {
      maxSupplyElement.textContent = maxSupply > 0 ? formatNumber(maxSupply) : 'N/A';
    }

    // Market Cap Rank
    const marketCapRank = coin.rank;
    const marketCapRankElement = document.getElementById('marketCapRank');
    if (marketCapRankElement) {
      marketCapRankElement.textContent = `#${marketCapRank}`;
    }
  } catch (error) {
    console.error('Error updating market details:', error);
  }
}

function createChart(price, change, period) {
  const ctx = document.getElementById("coinChart").getContext("2d");
  if (chart) chart.destroy();

  const generateData = (points) => {
    let data = [price];
    const volatility = Math.abs(change) / 100;

    for (let i = 1; i < points; i++) {
      let prev = data[i - 1];
      let fluctuation = (Math.random() - 0.5) * (price * volatility * 0.1);
      data.push(Math.max(prev + fluctuation, prev * 0.8));
    }
    return data;
  };

  const labels = {
    '1d': Array.from({ length: 24 }, (_, i) => `${i}:00`),
    '7d': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    '1m': Array.from({ length: 30 }, (_, i) => i + 1),
    '1y': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };

  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
  gradient.addColorStop(1, 'rgba(56, 189, 248, 0.05)');

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels[period],
      datasets: [{
        label: "Price (USD)",
        data: generateData(labels[period].length),
        borderColor: "#38BDF8",
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'rgba(255, 255, 255, 0.7)' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            callback: function (value) { return '$' + value.toFixed(2); }
          }
        }
      },
      interaction: { intersect: false, mode: 'index' }
    }
  });
}

const performSearch = debounce(async (query) => {
  if (!query.trim()) {
    elements.suggestions.style.display = "none";
    return;
  }

  try {
    const data = await fetchWithCache(`${API_BASE}/tickers/?start=0&limit=100`, 'allCoins');
    const results = data.data.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.symbol.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);

    if (results.length === 0) {
      elements.suggestions.innerHTML = `
        <li style="color: var(--text-secondary); text-align: center; padding: 1rem;">
          No coins found matching "${query}"
        </li>
      `;
    } else {
      elements.suggestions.innerHTML = results.map(coin => {
        const change24h = safeParseFloat(coin.percent_change_24h);
        const changeColor = change24h >= 0 ? '#10B981' : '#EF4444';
        const changeIcon = change24h >= 0 ? '↗' : '↘';

        return `
          <li onclick="showCoinDetails(${coin.id}); elements.suggestions.style.display='none';">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div>
                <div style="font-weight: 500;">${coin.name} (${coin.symbol})</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                  ${formatCurrency(coin.price_usd)}
                </div>
              </div>
              <div style="color: ${changeColor}; font-size: 0.8rem;">
                ${changeIcon} ${Math.abs(change24h).toFixed(2)}%
              </div>
            </div>
          </li>
        `;
      }).join('');
    }

    elements.suggestions.style.display = 'block';
  } catch (error) {
    console.error("Search error:", error);
    elements.suggestions.innerHTML = `
      <li style="color: #f87171; text-align: center; padding: 1rem;">
        Search error. Please try again.
      </li>
    `;
    elements.suggestions.style.display = 'block';
  }
}, 300);

// Price Converter Functions
function openConverterModal() {
  const modal = document.getElementById('converterModal');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';

  // Load popular currencies for conversion
  loadConverterCurrencies();
}

function closeConverterModal() {
  const modal = document.getElementById('converterModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

async function loadConverterCurrencies() {
  try {
    const toSelect = document.getElementById('toCurrency');
    const resultElement = document.getElementById('result');

    // Show loading state
    toSelect.innerHTML = '<option value="">Loading cryptocurrencies...</option>';
    if (resultElement) {
      resultElement.textContent = 'Loading...';
      resultElement.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
    }

    const data = await fetchWithCache(`${API_BASE}/tickers/?start=0&limit=50`, 'converterCoins');
    const currencies = data.data.slice(0, 20); // Limit to top 20 for performance

    // Only populate the "To" dropdown with cryptocurrencies
    const options = currencies.map(coin =>
      `<option value="${coin.price_usd}" data-symbol="${coin.symbol}">${coin.name} (${coin.symbol})</option>`
    ).join('');

    toSelect.innerHTML = options;

    // Set default value for cryptocurrency
    toSelect.value = currencies[0]?.price_usd || '1';

    // Add event listeners for real-time conversion
    addConverterEventListeners();

    calculateConversion();

    showNotification('Cryptocurrencies loaded successfully!', 'success');
  } catch (error) {
    console.error('Error loading currencies for converter:', error);
    toSelect.innerHTML = '<option value="">Error loading cryptocurrencies</option>';
    if (resultElement) {
      resultElement.textContent = 'Error loading data';
      resultElement.style.color = getComputedStyle(document.documentElement).getPropertyValue('--error-color');
    }
    showNotification('Failed to load cryptocurrencies for converter', 'error');
  }
}

function addConverterEventListeners() {
  // Add event listeners for real-time conversion
  const amountInput = document.getElementById('amount');
  const fromSelect = document.getElementById('fromCurrency');
  const toSelect = document.getElementById('toCurrency');

  if (amountInput) {
    amountInput.addEventListener('input', calculateConversion);
    amountInput.addEventListener('change', validateAmount);
    amountInput.addEventListener('focus', () => {
      amountInput.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
    });
    amountInput.addEventListener('blur', () => {
      amountInput.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--glass-border');
    });
  }

  if (fromSelect) {
    fromSelect.addEventListener('change', calculateConversion);
    fromSelect.addEventListener('focus', () => {
      fromSelect.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
    });
    fromSelect.addEventListener('blur', () => {
      fromSelect.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--glass-border');
    });
  }

  if (toSelect) {
    toSelect.addEventListener('change', calculateConversion);
    toSelect.addEventListener('focus', () => {
      toSelect.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
    });
    toSelect.addEventListener('blur', () => {
      toSelect.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--glass-border');
    });
  }
}

function validateAmount() {
  const amountInput = document.getElementById('amount');
  const amount = parseFloat(amountInput.value);

  if (isNaN(amount)) {
    amountInput.value = 0;
    showNotification('Please enter a valid number', 'warning');
  } else if (amount < 0) {
    amountInput.value = 0;
    showNotification('Amount cannot be negative', 'warning');
  } else if (amount > 1000000) {
    amountInput.value = 1000000;
    showNotification('Amount cannot exceed 1,000,000', 'warning');
  } else if (amount === 0) {
    showNotification('Amount cannot be zero', 'warning');
  }

  calculateConversion();
}

function calculateConversion() {
  const amount = parseFloat(document.getElementById('amount').value) || 0;
  const fromCurrency = document.getElementById('fromCurrency').value;
  const toCurrency = document.getElementById('toCurrency');

  if (!toCurrency.value || toCurrency.value === 'Loading cryptocurrencies...') {
    return;
  }

  const toPrice = parseFloat(toCurrency.value);

  if (amount && toPrice) {
    
    let result;

    if (fromCurrency === 'USD') {
      result = amount / toPrice;
    } else {
      result = amount / toPrice;
    }

    const resultElement = document.getElementById('result');
    if (resultElement) {
      
      const selectedOption = toCurrency.options[toCurrency.selectedIndex];
      const symbol = selectedOption.getAttribute('data-symbol');

      if (symbol) {
        resultElement.textContent = `${result.toFixed(6)} ${symbol}`;
      } else {
        resultElement.textContent = result.toFixed(6);
      }

      
      resultElement.style.color = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
      resultElement.style.fontWeight = '700';
    }

    showCurrentPrice(toPrice, fromCurrency);

    showConversionRate(amount, result, fromCurrency);
  } else {

    const resultElement = document.getElementById('result');
    if (resultElement) {
      resultElement.textContent = '0.000000';
      resultElement.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
    }

    
    hideCurrentPrice();
    hideConversionRate();
  }
}

function showCurrentPrice(price, fromCurrency) {
  const currentPriceDiv = document.getElementById('currentPrice');
  const priceValueSpan = document.getElementById('priceValue');

  if (currentPriceDiv && priceValueSpan) {
    priceValueSpan.textContent = `${fromCurrency} ${price.toFixed(6)}`;
    currentPriceDiv.style.display = 'block';
  }
}

function hideCurrentPrice() {
  const currentPriceDiv = document.getElementById('currentPrice');
  if (currentPriceDiv) {
    currentPriceDiv.style.display = 'none';
  }
}

function showConversionRate(amount, result, fromCurrency) {
  const conversionRateDiv = document.getElementById('conversionRate');
  const rateValueSpan = document.getElementById('rateValue');

  if (conversionRateDiv && rateValueSpan) {
    const rate = amount / result;

    // Format the rate based on its size
    let formattedRate;
    if (rate < 0.000001) {
      formattedRate = rate.toExponential(2);
    } else if (rate < 0.01) {
      formattedRate = rate.toFixed(8);
    } else if (rate < 1) {
      formattedRate = rate.toFixed(6);
    } else if (rate < 1000) {
      formattedRate = rate.toFixed(4);
    } else {
      formattedRate = rate.toFixed(2);
    }

    rateValueSpan.textContent = `1 ${fromCurrency} = ${formattedRate} crypto`;
    conversionRateDiv.style.display = 'block';
  }
}

function hideConversionRate() {
  const conversionRateDiv = document.getElementById('conversionRate');
  if (conversionRateDiv) {
    conversionRateDiv.style.display = 'none';
  }
}

function swapCurrencies() {
  const fromSelect = document.getElementById('fromCurrency');
  const toSelect = document.getElementById('toCurrency');

  // Check if we can swap (both should have valid values)
  if (!fromSelect.value || !toSelect.value || toSelect.value === 'Loading cryptocurrencies...') {
    showNotification('Cannot swap currencies at this time', 'warning');
    return;
  }

  // Store current values
  const fromValue = fromSelect.value;
  const fromIndex = fromSelect.selectedIndex;

  // Swap the values
  fromSelect.value = toSelect.value;
  fromSelect.selectedIndex = toSelect.selectedIndex;

  toSelect.value = fromValue;
  toSelect.selectedIndex = fromIndex;

  // Recalculate conversion
  calculateConversion();

  showNotification('Currencies swapped successfully!', 'success');
}

function resetConverter() {
  const amountInput = document.getElementById('amount');
  const fromSelect = document.getElementById('fromCurrency');
  const toSelect = document.getElementById('toCurrency');

  if (amountInput) amountInput.value = '1';
  if (fromSelect) fromSelect.selectedIndex = 0;
  if (toSelect && toSelect.options.length > 0) toSelect.selectedIndex = 0;

  calculateConversion();
  showNotification('Converter reset to default values', 'info');
}

// Enhanced Modal Functions
const openModal = (id) => {
  document.getElementById(id).style.display = 'block';
  document.body.style.overflow = 'hidden';
};

const closeModal = (id) => {
  document.getElementById(id).style.display = 'none';
  document.body.style.overflow = 'auto';
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Enhanced crypto info content with market insights
  const cryptoInfoTab = document.getElementById('crypto-info-content');
  cryptoInfoTab.innerHTML = `
    <div class="market-insights-section">
      <h3>Market Insights</h3>
      <div class="insights-grid">
        ${marketInsights.map(insight => `
          <div class="insight-card">
            <h4>${insight.title}</h4>
            <p>${insight.description}</p>
            <div class="insight-details">
              ${insight.indicators ? insight.indicators.map(item => `<span class="insight-tag">${item}</span>`).join('') : ''}
              ${insight.metrics ? insight.metrics.map(item => `<span class="insight-tag">${item}</span>`).join('') : ''}
              ${insight.trends ? insight.trends.map(item => `<span class="insight-tag">${item}</span>`).join('') : ''}
              ${insight.risks ? insight.risks.map(item => `<span class="insight-tag">${item}</span>`).join('') : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="crypto-education-section">
      <h3>Cryptocurrency Education</h3>
      ${cryptoInfoData.map(crypto => `
        <div class="crypto-card">
            <h4>${crypto.name}</h4>
            <p>${crypto.desc}</p>
            <div class="crypto-features">
                <div class="feature-tags">
                    ${crypto.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                </div>
                <div class="crypto-details">
                    <div class="detail-item">
                        <span class="detail-label">Market Position:</span>
                        <span class="detail-value">${crypto.marketCap}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Primary Use:</span>
                        <span class="detail-value">${crypto.useCase}</span>
                    </div>
                </div>
            </div>
        </div>
      `).join('')}
    </div>
  `;

  // Search functionality
  elements.searchInput.addEventListener("input", e => performSearch(e.target.value));

  // Close search suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      elements.suggestions.style.display = 'none';
    }
  });



  // Modal buttons
  document.getElementById('learnBtn').addEventListener('click', () => openModal('learnModal'));
  document.getElementById('infoBtn').addEventListener('click', () => openModal('infoModal'));

  // Converter button
  document.getElementById('converterBtn').addEventListener('click', openConverterModal);

  // Time period buttons
  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;
      if (currentCoin) showCoinDetails(currentCoin.id);
    });
  });

  // Info tabs
  document.querySelectorAll('.info-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.info-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('#infoModal .tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
    });
  });

  // Close modal when clicking outside
  window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
      closeModal(event.target.id);
    }
  };

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal[style*="block"]');
      if (openModal) {
        closeModal(openModal.id);
      }
    }
  });

  // Initial load
  loadTopCoins();

  // Auto-refresh every 2 minutes (reduced from 1 minute for better performance)
  setInterval(loadTopCoins, 120000);

  // Additional CSS

  
  const style = document.createElement('style');
  style.textContent = `
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(56, 189, 248, 0.3);
      border-top: 3px solid var(--accent-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .coin-list-item {
      transition: all 0.2s ease;
    }
    
    .coin-list-item:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateX(3px);
    }
    
    .feature-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 1rem 0;
    }
    
    .feature-tag {
      background: rgba(56, 189, 248, 0.2);
      color: var(--accent-color);
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    
    .crypto-details {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--glass-border);
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    
    .detail-label {
      color: var(--text-secondary);
      font-weight: 500;
    }
    
    .detail-value {
      color: var(--accent-color);
      font-weight: 600;
    }
    
    .market-insights-section {
      margin-bottom: 2rem;
    }
    
    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .insight-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.2s ease;
    }
    
    .insight-card:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
    }
    
    .insight-card h4 {
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
    }
    
    .insight-card p {
      color: var(--text-secondary);
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    
    .insight-tag {
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent-color);
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.8rem;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
      display: inline-block;
    }
    
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 4000;
      max-width: 400px;
      animation: slideInRight 0.3s ease;
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    .notification-content {
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      padding: 1rem 1.5rem;
      backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .notification-message {
      color: var(--text-primary);
      font-weight: 500;
    }
    
    .notification-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    
    .notification-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
    }
    
    .notification-info { border-left: 4px solid var(--accent-color); }
    .notification-success { border-left: 4px solid #10B981; }
    .notification-error { border-left: 4px solid #EF4444; }
    .notification-warning { border-left: 4px solid #F59E0B; }
  `;
  document.head.appendChild(style);
});