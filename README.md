# 🎯 ICP Prediction Market dApp

**A decentralized prediction market platform built on the Internet Computer Protocol (ICP) with Automated Market Maker (AMM) mechanics and AI-powered market analysis.**

[![CI/CD](https://github.com/DZ-Ramzy/ICP_ramzy/actions/workflows/e2e.yml/badge.svg)](https://github.com/DZ-Ramzy/ICP_ramzy/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![ICP](https://img.shields.io/badge/platform-Internet%20Computer-green.svg)](https://internetcomputer.org/)

---

## 🌟 Features

### 🔄 **Automated Market Maker (AMM)**

- **Constant Product Formula**: Dynamic pricing using `x * y = k` mechanism
- **Dynamic Token Pricing**: Prices automatically adjust based on trading activity
- **Liquidity Pools**: Decentralized liquidity with 0.3% trading fees
- **Slippage Protection**: Built-in MEV protection with minimum output guarantees

### 🎯 **Prediction Markets**

- **Binary Markets**: YES/NO token trading for any prediction
- **Market Creation**: Anyone can create markets with initial ICP deposit
- **Admin Controls**: Market resolution and management functions
- **Reward Distribution**: Proportional ICP payouts to winning token holders

### 🤖 **AI-Powered Analytics**

- **LLM Integration**: Ollama-powered market sentiment analysis
- **Real-time Insights**: AI-generated market reports and risk assessments
- **Price Impact Calculator**: Advanced trading simulations and predictions

### 💼 **User Experience**

- **Modern React Interface**: Responsive design with Tailwind CSS
- **Real-time Updates**: Live market data and price feeds
- **Wallet Integration**: Seamless ICP token management
- **Trading Dashboard**: Complete portfolio and position tracking

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v20+)
- **DFX** (v0.16.1+)
- **Rust** (stable)
- **Ollama** (for AI features)

### 1. Clone & Setup

```bash
git clone https://github.com/your-username/ICP_ramzy.git
cd ICP_ramzy
npm install
```

### 2. Start Ollama (for AI features)

```bash
# Start Ollama server
ollama serve

# Download the LLM model (in another terminal)
ollama run llama3.1:8b
# Type /bye to exit once loaded
```

### 3. Deploy to ICP

```bash
# Start local ICP network
dfx start --clean

# Deploy canisters
dfx deploy

# Deploy LLM canister
dfx deps pull
dfx deps deploy
```

### 4. Start Frontend

```bash
npm start
# Access at http://localhost:5174
```

---

## 🏗️ Architecture

```
src/
├── backend/                 # Rust canister backend
│   ├── src/lib.rs          # AMM core logic
│   └── Cargo.toml          # Rust dependencies
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── services/       # Canister integration services
│   │   └── views/          # Page components
│   └── package.json
└── declarations/           # Auto-generated canister interfaces
```

### Core Components

- **🦀 Backend Canister**: Rust-based AMM smart contract
- **⚛️ Frontend**: React with TypeScript and Tailwind CSS
- **🤖 LLM Integration**: AI-powered market analysis
- **🧪 Test Suite**: Comprehensive PocketIC and Vitest tests

---

## 💡 How It Works

### 1. **Market Creation**

```rust
// Anyone can create a prediction market
create_market(
    "Will Bitcoin reach $100k by 2025?",
    "Yes if BTC >= $100,000 by Dec 31, 2025",
    5000 // Initial ICP liquidity
)
```

### 2. **Token Trading**

```rust
// Buy YES tokens using AMM formula
buy_yes_tokens(market_id, icp_amount, min_tokens_out)

// Sell tokens back to the pool
sell_yes_tokens(market_id, token_amount, min_icp_out)
```

### 3. **Market Resolution**

```rust
// Admin resolves market with outcome
resolve_market(market_id, TokenType::Yes)

// Users claim proportional rewards
claim_reward(market_id)
```

### 4. **AI Analysis**

```rust
// Get AI-powered market insights
analyze_market(market_id) // Returns sentiment analysis
```

---

## 🎮 Usage Examples

### Creating Your First Market

1. **Connect Wallet**: Use the wallet integration to connect
2. **Deposit ICP**: Add funds to your trading balance
3. **Create Market**: Set title, description, and initial liquidity
4. **Start Trading**: Buy YES/NO tokens based on your predictions

### Trading Mechanics

- **Dynamic Pricing**: Prices change based on token reserves
- **Trading Fees**: 0.3% fee goes to the liquidity pool
- **Price Impact**: Large trades have proportional price impact
- **Slippage Protection**: Set minimum outputs to protect against MEV

### Claiming Rewards

1. **Wait for Resolution**: Market admin resolves with final outcome
2. **Check Position**: Verify your winning token balance
3. **Claim Rewards**: Receive ICP proportional to your winning tokens

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Backend Tests (PocketIC)

```bash
npm test tests/src/backend.test.ts
```

### Frontend Tests (Vitest)

```bash
cd src/frontend && npm test
```

### Test Coverage

- ✅ AMM trading mechanics
- ✅ Market creation and resolution
- ✅ Reward distribution
- ✅ Edge cases and error handling
- ✅ Frontend component integration

---

## 📊 AMM Mathematics

The platform uses the **Constant Product** formula for automated market making:

```
x * y = k

Where:
- x = YES token reserve
- y = NO token reserve
- k = constant product (liquidity)
```

### Price Calculation

```
YES price = NO_reserve / (YES_reserve + NO_reserve)
NO price = YES_reserve / (YES_reserve + NO_reserve)
```

### Trade Execution

```
new_x = k / (y + tokens_out)
tokens_in = new_x - x
```

_See [AMM_DOCUMENTATION.md](AMM_DOCUMENTATION.md) for detailed mathematics._

---

## 🔧 Configuration

### Environment Variables

```bash
# Ollama API endpoint
OLLAMA_BASE_URL=http://localhost:11434

# Network configuration
DFX_NETWORK=local
```

### Canister Settings

```json
{
  "INITIAL_LIQUIDITY": 500,
  "TRADE_FEE": 3,
  "MIN_DEPOSIT": 1000
}
```

---

## 🛠️ Development

### Backend Development

```bash
# Check Rust code
cargo check

# Generate Candid interfaces
npm run generate-candid

# Format code
cargo fmt
```

### Frontend Development

```bash
# Start dev server
npm start

# Type checking
npx tsc --noEmit

# Lint and format
npm run format
```

### Code Quality

- **Prettier**: TypeScript/JavaScript formatting
- **Rust-analyzer**: Rust formatting and linting
- **Clippy**: Rust best practices
- **Husky**: Pre-commit hooks

---

## 🚢 Deployment

### Local Development

```bash
dfx start --clean
dfx deploy
npm start
```

### IC Mainnet

```bash
dfx deploy --network ic
```

### Vercel Frontend

```bash
npm run build
# Deploy dist/ folder to Vercel
```

---

## 📈 Roadmap

### ✅ **Current Features**

- [x] AMM-based prediction markets
- [x] Dynamic token pricing
- [x] AI-powered market analysis
- [x] Modern React interface
- [x] Comprehensive test suite

### 🔄 **In Progress**

- [ ] Advanced charting and analytics
- [ ] Multi-outcome markets (beyond binary)
- [ ] Liquidity provider rewards
- [ ] Mobile app

### 🎯 **Future Plans**

- [ ] Cross-chain integration
- [ ] Governance token
- [ ] Advanced AI trading bots
- [ ] Social features and leaderboards

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Run `npm run format` before committing

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Internet Computer Protocol** for the blockchain infrastructure
- **Ollama** for AI integration capabilities
- **IC Vibe Coding Bootcamp** for inspiration and template
- **Community** for feedback and contributions

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/DZ-Ramzy/ICP_ramzy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DZ-Ramzy/ICP_ramzy/discussions)
- **Documentation**: [Wiki](https://github.com/DZ-Ramzy/ICP_ramzy/wiki)

---

**Ready to predict the future? Start trading! 🚀📈**
