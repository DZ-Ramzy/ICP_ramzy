# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add comprehensive Automated Market Maker (AMM) prediction market system with constant product formula
- Add AMM-powered dynamic pricing that adjusts automatically based on trading activity
- Add YES/NO token trading with constant product formula (x \* y = k) pricing
- Add dynamic token pricing with automatic price discovery based on supply and demand
- Add market creation with configurable initial liquidity and 0.3% trading fees
- Add slippage protection for all buy/sell operations
- Add reward distribution system with proportional ICP payouts to winning token holders
- Add market resolution functionality (admin-only) with double-claim protection
- Add comprehensive unit test suite covering AMM mechanics, reward distribution, and edge cases
- Add price impact calculations and trading quotes without executing trades
- Add user position tracking with token balances and claim status
- Add admin functions for market management and user balance queries
- Add LLM-powered market analysis using Ollama integration with AMM-specific insights
- Add AI-based market insights with sentiment analysis and risk assessment
- Add React frontend with AMM mechanics visualization and market interaction
- Add AMM information displays showing constant product, liquidity pools, and trading fees
- Add real-time AMM slippage and price impact calculator with trade previews
- Add visual AMM liquidity pool balance displays showing token reserve ratios
- Add enhanced AMM educational tooltips explaining mechanics and terminology
- Add price impact warnings for high-impact trades (>5% impact)
- Add live AMM calculations showing estimated tokens, fees, and price changes
- Add comprehensive test suite for prediction market functionality
- Add set_count update method to allow setting the counter to a specific value
- Add frontend development server scripts (`npm run start`)
- Add LLM canister implementation

### Enhanced

- Improve AMM user experience with real-time calculations and visual feedback
- Enhance trading interface with live price impact and slippage calculations
- Improve AMM mechanics education with detailed explanations and visual representations
- Add visual indicators for trading fee impact and price slippage warnings

### Changed

- Update dependencies to latest versions

## [0.1.0] - 2025-04-24

### Added

- Basic canister structure with Rust
- Counter functionality with increment and get_count methods
- Greeting functionality
- PocketIC testing infrastructure
- Vitest test runner configuration
- GitHub CI workflow for automated end-to-end tests for all methods
- Project documentation
- Add custom instructions for github copilot
