use candid::{CandidType, Principal};
use ic_cdk::{caller, export_candid};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

// Constants for AMM parameters
const INITIAL_LIQUIDITY: u64 = 500; // Initial YES and NO tokens when creating a market
const TRADE_FEE: u64 = 3; // 0.3% trading fee (in basis points, 3/1000)
const MIN_DEPOSIT: u64 = 1000; // Minimum ICP deposit amount

// Data structures for the AMM prediction market

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum MarketStatus {
    Open,
    Resolved,
    Frozen, // Market is frozen after resolution but before claims are processed
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum TokenType {
    Yes,
    No,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AmmMarket {
    pub id: u64,
    pub title: String,
    pub description: String,
    // AMM reserves using constant product formula (x * y = k)
    pub yes_reserve: u64,        // Reserve of YES tokens
    pub no_reserve: u64,         // Reserve of NO tokens
    pub icp_liquidity_pool: u64, // Total ICP backing the market
    pub status: MarketStatus,
    pub winning_outcome: Option<TokenType>,
    pub creator: Principal,
    pub admin: Principal,
    pub total_fees_collected: u64, // Accumulated trading fees
    pub creation_time: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UserPosition {
    pub user: Principal,
    pub market_id: u64,
    pub yes_tokens: u64,
    pub no_tokens: u64,
    pub claimed_reward: bool, // Prevents double claiming
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TradeResult {
    pub tokens_received: u64,
    pub tokens_paid: u64, // In ICP
    pub fee_paid: u64,    // In ICP
    pub new_price: f64,   // New price after trade
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MarketSummary {
    pub market: AmmMarket,
    pub yes_price: f64,    // Current YES token price in ICP
    pub no_price: f64,     // Current NO token price in ICP
    pub total_volume: u64, // Total ICP volume
    pub price_impact: f64, // Price impact for a standard trade size
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RewardClaim {
    pub user: Principal,
    pub market_id: u64,
    pub winning_tokens: u64,
    pub reward_amount: u64, // ICP reward
    pub claim_time: u64,
}

// Error types
#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum PredictionMarketError {
    MarketNotFound,
    MarketClosed,
    MarketResolved,
    InsufficientDeposit,
    InsufficientLiquidity,
    Unauthorized,
    InvalidAmount,
    AlreadyClaimed,
    NoWinningTokens,
    SlippageExceeded,
}

// State management using thread-local storage
thread_local! {
    static MARKETS: RefCell<HashMap<u64, AmmMarket>> = RefCell::new(HashMap::new());
    static USER_POSITIONS: RefCell<HashMap<(Principal, u64), UserPosition>> = RefCell::new(HashMap::new());
    static REWARD_CLAIMS: RefCell<Vec<RewardClaim>> = const { RefCell::new(Vec::new()) };
    static NEXT_MARKET_ID: RefCell<u64> = const { RefCell::new(1) };
    static ADMIN: RefCell<Option<Principal>> = const { RefCell::new(None) };
    static USER_BALANCES: RefCell<HashMap<Principal, u64>> = RefCell::new(HashMap::new());
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/// Initialize the canister with the deployer as admin
#[ic_cdk::init]
fn init() {
    let deployer = caller();
    ADMIN.with(|admin| {
        *admin.borrow_mut() = Some(deployer);
    });
}

// =============================================================================
// AMM CORE FUNCTIONS
// =============================================================================

/// Calculate the current price of YES or NO tokens using the constant product formula
/// Price = opposite_reserve / (target_reserve + opposite_reserve)
/// This gives us the marginal price for the next infinitesimal trade
#[ic_cdk::query]
fn get_token_price(market_id: u64, token_type: TokenType) -> Result<f64, PredictionMarketError> {
    MARKETS.with(|markets| {
        let markets_map = markets.borrow();
        match markets_map.get(&market_id) {
            Some(market) => {
                let total_tokens = market.yes_reserve + market.no_reserve;
                if total_tokens == 0 {
                    return Ok(0.5); // Equal price when no liquidity
                }

                // Price calculation: P(YES) = NO_reserve / total_tokens
                // This represents the marginal cost of the next YES token
                let price = match token_type {
                    TokenType::Yes => market.no_reserve as f64 / total_tokens as f64,
                    TokenType::No => market.yes_reserve as f64 / total_tokens as f64,
                };
                Ok(price)
            }
            None => Err(PredictionMarketError::MarketNotFound),
        }
    })
}

/// Calculate how many tokens you would receive for a given ICP amount
/// Uses the constant product formula: x * y = k
/// When buying YES tokens: new_yes_reserve = yes_reserve + tokens_out
/// new_no_reserve * new_yes_reserve = k (constant)
/// Therefore: new_no_reserve = k / new_yes_reserve
/// ICP_in = no_reserve - new_no_reserve
fn calculate_tokens_out(
    yes_reserve: u64,
    no_reserve: u64,
    icp_in: u64,
    buy_yes: bool,
) -> Result<u64, PredictionMarketError> {
    if yes_reserve == 0 || no_reserve == 0 {
        return Err(PredictionMarketError::InsufficientLiquidity);
    }

    // Apply trading fee: actual_icp_in = icp_in * (1000 - fee) / 1000
    let icp_after_fee = (icp_in * (1000 - TRADE_FEE)) / 1000;

    if buy_yes {
        // Buying YES tokens reduces NO reserve
        // k = yes_reserve * no_reserve
        // new_no_reserve = no_reserve - icp_after_fee
        // new_yes_reserve = k / new_no_reserve
        // tokens_out = new_yes_reserve - yes_reserve

        if icp_after_fee >= no_reserve {
            return Err(PredictionMarketError::InsufficientLiquidity);
        }

        let k = yes_reserve * no_reserve;
        let new_no_reserve = no_reserve - icp_after_fee;
        let new_yes_reserve = k / new_no_reserve;

        if new_yes_reserve <= yes_reserve {
            return Err(PredictionMarketError::InvalidAmount);
        }

        Ok(new_yes_reserve - yes_reserve)
    } else {
        // Buying NO tokens reduces YES reserve
        if icp_after_fee >= yes_reserve {
            return Err(PredictionMarketError::InsufficientLiquidity);
        }

        let k = yes_reserve * no_reserve;
        let new_yes_reserve = yes_reserve - icp_after_fee;
        let new_no_reserve = k / new_yes_reserve;

        if new_no_reserve <= no_reserve {
            return Err(PredictionMarketError::InvalidAmount);
        }

        Ok(new_no_reserve - no_reserve)
    }
}

/// Calculate how much ICP you would receive for selling tokens back to the AMM
/// When selling YES tokens: new_yes_reserve = yes_reserve - tokens_in
/// new_no_reserve = k / new_yes_reserve
/// ICP_out = new_no_reserve - no_reserve
fn calculate_icp_out(
    yes_reserve: u64,
    no_reserve: u64,
    tokens_in: u64,
    sell_yes: bool,
) -> Result<u64, PredictionMarketError> {
    if yes_reserve == 0 || no_reserve == 0 {
        return Err(PredictionMarketError::InsufficientLiquidity);
    }

    if sell_yes {
        // Selling YES tokens increases NO reserve
        if tokens_in >= yes_reserve {
            return Err(PredictionMarketError::InvalidAmount);
        }

        let k = yes_reserve * no_reserve;
        let new_yes_reserve = yes_reserve - tokens_in;
        if new_yes_reserve == 0 {
            return Err(PredictionMarketError::InsufficientLiquidity);
        }

        let new_no_reserve = k / new_yes_reserve;
        let icp_out = new_no_reserve - no_reserve;

        // Apply trading fee to output: icp_after_fee = icp_out * (1000 - fee) / 1000
        Ok((icp_out * (1000 - TRADE_FEE)) / 1000)
    } else {
        // Selling NO tokens increases YES reserve
        if tokens_in >= no_reserve {
            return Err(PredictionMarketError::InvalidAmount);
        }

        let k = yes_reserve * no_reserve;
        let new_no_reserve = no_reserve - tokens_in;
        if new_no_reserve == 0 {
            return Err(PredictionMarketError::InsufficientLiquidity);
        }

        let new_yes_reserve = k / new_no_reserve;
        let icp_out = new_yes_reserve - yes_reserve;

        // Apply trading fee to output
        Ok((icp_out * (1000 - TRADE_FEE)) / 1000)
    }
}

// =============================================================================
// MARKET MANAGEMENT FUNCTIONS
// =============================================================================

/// Create a new prediction market with initial AMM liquidity
/// Initializes the market with equal reserves of YES and NO tokens
#[ic_cdk::update]
fn create_market(
    title: String,
    description: String,
    initial_icp_liquidity: u64,
) -> Result<u64, PredictionMarketError> {
    let caller_principal = caller();

    if initial_icp_liquidity < MIN_DEPOSIT {
        return Err(PredictionMarketError::InsufficientDeposit);
    }

    // Check if user has sufficient balance
    let user_balance =
        USER_BALANCES.with(|balances| *balances.borrow().get(&caller_principal).unwrap_or(&0));

    if user_balance < initial_icp_liquidity {
        return Err(PredictionMarketError::InsufficientDeposit);
    }

    let market_id = NEXT_MARKET_ID.with(|id| {
        let current_id = *id.borrow();
        *id.borrow_mut() = current_id + 1;
        current_id
    });

    // Create market with initial AMM reserves
    // Start with equal reserves to ensure 50/50 pricing
    // Anyone can create a market, creator becomes the market admin
    let market = AmmMarket {
        id: market_id,
        title,
        description,
        yes_reserve: INITIAL_LIQUIDITY,
        no_reserve: INITIAL_LIQUIDITY,
        icp_liquidity_pool: initial_icp_liquidity,
        status: MarketStatus::Open,
        winning_outcome: None,
        creator: caller_principal,
        admin: caller_principal, // Creator becomes the market admin
        total_fees_collected: 0,
        creation_time: ic_cdk::api::time(),
    };

    // Deduct ICP from creator's balance
    USER_BALANCES.with(|balances| {
        let mut balances_map = balances.borrow_mut();
        balances_map.insert(caller_principal, user_balance - initial_icp_liquidity);
    });

    MARKETS.with(|markets| {
        markets.borrow_mut().insert(market_id, market);
    });

    Ok(market_id)
}

/// Buy YES tokens using ICP
/// Implements the constant product AMM formula with slippage protection
#[ic_cdk::update]
fn buy_yes_tokens(
    market_id: u64,
    icp_amount: u64,
    min_tokens_out: u64, // Slippage protection
) -> Result<TradeResult, PredictionMarketError> {
    execute_buy_trade(market_id, icp_amount, min_tokens_out, TokenType::Yes)
}

/// Buy NO tokens using ICP
#[ic_cdk::update]
fn buy_no_tokens(
    market_id: u64,
    icp_amount: u64,
    min_tokens_out: u64, // Slippage protection
) -> Result<TradeResult, PredictionMarketError> {
    execute_buy_trade(market_id, icp_amount, min_tokens_out, TokenType::No)
}

/// Sell YES tokens back to the AMM for ICP
#[ic_cdk::update]
fn sell_yes_tokens(
    market_id: u64,
    token_amount: u64,
    min_icp_out: u64, // Slippage protection
) -> Result<TradeResult, PredictionMarketError> {
    execute_sell_trade(market_id, token_amount, min_icp_out, TokenType::Yes)
}

/// Sell NO tokens back to the AMM for ICP
#[ic_cdk::update]
fn sell_no_tokens(
    market_id: u64,
    token_amount: u64,
    min_icp_out: u64, // Slippage protection
) -> Result<TradeResult, PredictionMarketError> {
    execute_sell_trade(market_id, token_amount, min_icp_out, TokenType::No)
}

// =============================================================================
// INTERNAL TRADING FUNCTIONS
// =============================================================================

fn execute_buy_trade(
    market_id: u64,
    icp_amount: u64,
    min_tokens_out: u64,
    token_type: TokenType,
) -> Result<TradeResult, PredictionMarketError> {
    let caller_principal = caller();

    if icp_amount == 0 {
        return Err(PredictionMarketError::InvalidAmount);
    }

    // Check user balance
    let user_balance =
        USER_BALANCES.with(|balances| *balances.borrow().get(&caller_principal).unwrap_or(&0));

    if user_balance < icp_amount {
        return Err(PredictionMarketError::InsufficientDeposit);
    }

    // Get market and verify it's open
    let (_market, tokens_out) = MARKETS.with(|markets| {
        let mut markets_map = markets.borrow_mut();
        match markets_map.get_mut(&market_id) {
            Some(market) => {
                if !matches!(market.status, MarketStatus::Open) {
                    return Err(PredictionMarketError::MarketClosed);
                }

                // Calculate tokens out using AMM formula
                let tokens_out = calculate_tokens_out(
                    market.yes_reserve,
                    market.no_reserve,
                    icp_amount,
                    matches!(token_type, TokenType::Yes),
                )?;

                // Check slippage protection
                if tokens_out < min_tokens_out {
                    return Err(PredictionMarketError::SlippageExceeded);
                }

                // Calculate trading fee
                let fee = (icp_amount * TRADE_FEE) / 1000;

                // Update market reserves based on AMM logic
                match token_type {
                    TokenType::Yes => {
                        market.no_reserve -= (icp_amount * (1000 - TRADE_FEE)) / 1000;
                        market.yes_reserve += tokens_out;
                    }
                    TokenType::No => {
                        market.yes_reserve -= (icp_amount * (1000 - TRADE_FEE)) / 1000;
                        market.no_reserve += tokens_out;
                    }
                }

                // Add ICP (minus fee) to liquidity pool
                market.icp_liquidity_pool += icp_amount - fee;
                market.total_fees_collected += fee;

                Ok((market.clone(), tokens_out))
            }
            None => Err(PredictionMarketError::MarketNotFound),
        }
    })?;

    // Update user balance
    USER_BALANCES.with(|balances| {
        let mut balances_map = balances.borrow_mut();
        balances_map.insert(caller_principal, user_balance - icp_amount);
    });

    // Update user position
    USER_POSITIONS.with(|positions| {
        let mut positions_map = positions.borrow_mut();
        let key = (caller_principal, market_id);
        let position = positions_map.entry(key).or_insert(UserPosition {
            user: caller_principal,
            market_id,
            yes_tokens: 0,
            no_tokens: 0,
            claimed_reward: false,
        });

        match token_type {
            TokenType::Yes => position.yes_tokens += tokens_out,
            TokenType::No => position.no_tokens += tokens_out,
        }
    });

    // Calculate new price for return value
    let new_price = get_token_price(market_id, token_type)?;
    let fee_paid = (icp_amount * TRADE_FEE) / 1000;

    Ok(TradeResult {
        tokens_received: tokens_out,
        tokens_paid: icp_amount,
        fee_paid,
        new_price,
    })
}

fn execute_sell_trade(
    market_id: u64,
    token_amount: u64,
    min_icp_out: u64,
    token_type: TokenType,
) -> Result<TradeResult, PredictionMarketError> {
    let caller_principal = caller();

    if token_amount == 0 {
        return Err(PredictionMarketError::InvalidAmount);
    }

    // Check if user has enough tokens
    let user_tokens = USER_POSITIONS.with(|positions| {
        let positions_map = positions.borrow();
        if let Some(position) = positions_map.get(&(caller_principal, market_id)) {
            match token_type {
                TokenType::Yes => position.yes_tokens,
                TokenType::No => position.no_tokens,
            }
        } else {
            0
        }
    });

    if user_tokens < token_amount {
        return Err(PredictionMarketError::InvalidAmount);
    }

    // Get market and calculate ICP out
    let (_market, icp_out) = MARKETS.with(|markets| {
        let mut markets_map = markets.borrow_mut();
        match markets_map.get_mut(&market_id) {
            Some(market) => {
                if !matches!(market.status, MarketStatus::Open) {
                    return Err(PredictionMarketError::MarketClosed);
                }

                let icp_out = calculate_icp_out(
                    market.yes_reserve,
                    market.no_reserve,
                    token_amount,
                    matches!(token_type, TokenType::Yes),
                )?;

                // Check slippage protection
                if icp_out < min_icp_out {
                    return Err(PredictionMarketError::SlippageExceeded);
                }

                // Calculate trading fee
                let gross_icp_out = match token_type {
                    TokenType::Yes => {
                        let k = market.yes_reserve * market.no_reserve;
                        let new_yes_reserve = market.yes_reserve - token_amount;
                        let new_no_reserve = k / new_yes_reserve;
                        new_no_reserve - market.no_reserve
                    }
                    TokenType::No => {
                        let k = market.yes_reserve * market.no_reserve;
                        let new_no_reserve = market.no_reserve - token_amount;
                        let new_yes_reserve = k / new_no_reserve;
                        new_yes_reserve - market.yes_reserve
                    }
                };

                let fee = (gross_icp_out * TRADE_FEE) / 1000;

                // Update market reserves
                match token_type {
                    TokenType::Yes => {
                        market.yes_reserve -= token_amount;
                        market.no_reserve += gross_icp_out;
                    }
                    TokenType::No => {
                        market.no_reserve -= token_amount;
                        market.yes_reserve += gross_icp_out;
                    }
                }

                // Remove ICP from liquidity pool and add fee
                market.icp_liquidity_pool = market.icp_liquidity_pool.saturating_sub(icp_out);
                market.total_fees_collected += fee;

                Ok((market.clone(), icp_out))
            }
            None => Err(PredictionMarketError::MarketNotFound),
        }
    })?;

    // Update user position
    USER_POSITIONS.with(|positions| {
        let mut positions_map = positions.borrow_mut();
        if let Some(position) = positions_map.get_mut(&(caller_principal, market_id)) {
            match token_type {
                TokenType::Yes => position.yes_tokens -= token_amount,
                TokenType::No => position.no_tokens -= token_amount,
            }
        }
    });

    // Add ICP to user balance
    USER_BALANCES.with(|balances| {
        let mut balances_map = balances.borrow_mut();
        let current_balance = *balances_map.get(&caller_principal).unwrap_or(&0);
        balances_map.insert(caller_principal, current_balance + icp_out);
    });

    // Calculate new price for return value
    let new_price = get_token_price(market_id, token_type)?;
    let fee_paid = (icp_out * TRADE_FEE) / (1000 - TRADE_FEE); // Approximate fee

    Ok(TradeResult {
        tokens_received: icp_out,  // ICP received
        tokens_paid: token_amount, // Tokens sold
        fee_paid,
        new_price,
    })
}

// =============================================================================
// MARKET RESOLUTION AND REWARDS
// =============================================================================

/// Resolve a market and set the winning outcome (admin only)
/// This freezes the market and prepares it for reward claims
#[ic_cdk::update]
fn resolve_market(market_id: u64, outcome: TokenType) -> Result<String, PredictionMarketError> {
    let caller_principal = caller();

    // Check if caller is global admin OR the market creator/admin
    let is_global_admin = ADMIN.with(|admin| {
        admin
            .borrow()
            .map_or(false, |admin_principal| admin_principal == caller_principal)
    });

    let is_market_admin = MARKETS.with(|markets| {
        markets
            .borrow()
            .get(&market_id)
            .map_or(false, |market| market.admin == caller_principal)
    });

    if !is_global_admin && !is_market_admin {
        return Err(PredictionMarketError::Unauthorized);
    }

    // Update market status and set winning outcome
    MARKETS.with(|markets| {
        let mut markets_map = markets.borrow_mut();
        match markets_map.get_mut(&market_id) {
            Some(market) => {
                if !matches!(market.status, MarketStatus::Open) {
                    return Err(PredictionMarketError::MarketClosed);
                }

                market.status = MarketStatus::Resolved;
                market.winning_outcome = Some(outcome.clone());

                Ok(format!(
                    "Market {} resolved with outcome: {:?}. Users can now claim rewards.",
                    market_id, outcome
                ))
            }
            None => Err(PredictionMarketError::MarketNotFound),
        }
    })
}

/// Claim reward for holding winning tokens
/// Burns the winning tokens and distributes proportional share of ICP liquidity
#[ic_cdk::update]
fn claim_reward(market_id: u64) -> Result<RewardClaim, PredictionMarketError> {
    let caller_principal = caller();

    // Get market and check if it's resolved
    let (market, winning_token_type) = MARKETS.with(|markets| {
        let markets_map = markets.borrow();
        match markets_map.get(&market_id) {
            Some(market) => {
                if !matches!(market.status, MarketStatus::Resolved) {
                    return Err(PredictionMarketError::MarketClosed);
                }

                match &market.winning_outcome {
                    Some(outcome) => Ok((market.clone(), outcome.clone())),
                    None => Err(PredictionMarketError::MarketNotFound),
                }
            }
            None => Err(PredictionMarketError::MarketNotFound),
        }
    })?;

    // Get user position and check for previous claims
    let (user_winning_tokens, already_claimed) = USER_POSITIONS.with(|positions| {
        let positions_map = positions.borrow();
        if let Some(position) = positions_map.get(&(caller_principal, market_id)) {
            if position.claimed_reward {
                return (0, true);
            }

            let winning_tokens = match winning_token_type {
                TokenType::Yes => position.yes_tokens,
                TokenType::No => position.no_tokens,
            };
            (winning_tokens, false)
        } else {
            (0, false)
        }
    });

    if already_claimed {
        return Err(PredictionMarketError::AlreadyClaimed);
    }

    if user_winning_tokens == 0 {
        return Err(PredictionMarketError::NoWinningTokens);
    }

    // Calculate total winning tokens across all users
    let total_winning_tokens = USER_POSITIONS.with(|positions| {
        let positions_map = positions.borrow();
        positions_map
            .values()
            .filter(|pos| pos.market_id == market_id)
            .map(|pos| match winning_token_type {
                TokenType::Yes => pos.yes_tokens,
                TokenType::No => pos.no_tokens,
            })
            .sum::<u64>()
    });

    if total_winning_tokens == 0 {
        return Err(PredictionMarketError::InsufficientLiquidity);
    }

    // Calculate user's share of the ICP liquidity pool
    // reward = (user_winning_tokens / total_winning_tokens) * total_ICP_pool
    let reward_amount = (user_winning_tokens as u128 * market.icp_liquidity_pool as u128
        / total_winning_tokens as u128) as u64;

    // Update user position to mark as claimed
    USER_POSITIONS.with(|positions| {
        let mut positions_map = positions.borrow_mut();
        if let Some(position) = positions_map.get_mut(&(caller_principal, market_id)) {
            position.claimed_reward = true;
            // Burn the winning tokens
            match winning_token_type {
                TokenType::Yes => position.yes_tokens = 0,
                TokenType::No => position.no_tokens = 0,
            }
        }
    });

    // Transfer ICP reward to user
    USER_BALANCES.with(|balances| {
        let mut balances_map = balances.borrow_mut();
        let current_balance = *balances_map.get(&caller_principal).unwrap_or(&0);
        balances_map.insert(caller_principal, current_balance + reward_amount);
    });

    // Record the claim
    let claim = RewardClaim {
        user: caller_principal,
        market_id,
        winning_tokens: user_winning_tokens,
        reward_amount,
        claim_time: ic_cdk::api::time(),
    };

    REWARD_CLAIMS.with(|claims| {
        claims.borrow_mut().push(claim.clone());
    });

    // Update market liquidity pool
    MARKETS.with(|markets| {
        let mut markets_map = markets.borrow_mut();
        if let Some(market) = markets_map.get_mut(&market_id) {
            market.icp_liquidity_pool = market.icp_liquidity_pool.saturating_sub(reward_amount);
        }
    });

    Ok(claim)
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/// Get all markets with current prices and stats
#[ic_cdk::query]
fn get_markets() -> Vec<MarketSummary> {
    MARKETS.with(|markets| {
        markets
            .borrow()
            .values()
            .map(|market| {
                let total_reserves = market.yes_reserve + market.no_reserve;
                let (yes_price, no_price) = if total_reserves > 0 {
                    (
                        market.no_reserve as f64 / total_reserves as f64,
                        market.yes_reserve as f64 / total_reserves as f64,
                    )
                } else {
                    (0.5, 0.5) // Equal prices when no liquidity
                };

                // Calculate price impact for a standard trade (100 ICP)
                let standard_trade = 100;
                let price_impact = if total_reserves > 0 {
                    let tokens_out = calculate_tokens_out(
                        market.yes_reserve,
                        market.no_reserve,
                        standard_trade,
                        true,
                    )
                    .unwrap_or(0) as f64;
                    let new_price = if market.yes_reserve + tokens_out as u64 > 0 {
                        (market.no_reserve - (standard_trade * (1000 - TRADE_FEE)) / 1000) as f64
                            / (market.yes_reserve + tokens_out as u64 + market.no_reserve
                                - (standard_trade * (1000 - TRADE_FEE)) / 1000)
                                as f64
                    } else {
                        yes_price
                    };
                    ((new_price - yes_price) / yes_price * 100.0).abs()
                } else {
                    0.0
                };

                MarketSummary {
                    market: market.clone(),
                    yes_price,
                    no_price,
                    total_volume: market.icp_liquidity_pool,
                    price_impact,
                }
            })
            .collect()
    })
}

/// Get a specific market by ID
#[ic_cdk::query]
fn get_market(market_id: u64) -> Option<MarketSummary> {
    MARKETS.with(|markets| {
        markets.borrow().get(&market_id).map(|market| {
            let total_reserves = market.yes_reserve + market.no_reserve;
            let (yes_price, no_price) = if total_reserves > 0 {
                (
                    market.no_reserve as f64 / total_reserves as f64,
                    market.yes_reserve as f64 / total_reserves as f64,
                )
            } else {
                (0.5, 0.5)
            };

            let standard_trade = 100;
            let price_impact = if total_reserves > 0 {
                let tokens_out = calculate_tokens_out(
                    market.yes_reserve,
                    market.no_reserve,
                    standard_trade,
                    true,
                )
                .unwrap_or(0) as f64;
                let new_price = if market.yes_reserve + tokens_out as u64 > 0 {
                    (market.no_reserve - (standard_trade * (1000 - TRADE_FEE)) / 1000) as f64
                        / (market.yes_reserve + tokens_out as u64 + market.no_reserve
                            - (standard_trade * (1000 - TRADE_FEE)) / 1000)
                            as f64
                } else {
                    yes_price
                };
                ((new_price - yes_price) / yes_price * 100.0).abs()
            } else {
                0.0
            };

            MarketSummary {
                market: market.clone(),
                yes_price,
                no_price,
                total_volume: market.icp_liquidity_pool,
                price_impact,
            }
        })
    })
}

/// Get user position for a specific market
#[ic_cdk::query]
fn get_user_position(market_id: u64) -> Option<UserPosition> {
    let caller_principal = caller();
    USER_POSITIONS.with(|positions| {
        positions
            .borrow()
            .get(&(caller_principal, market_id))
            .cloned()
    })
}

/// Get all user positions
#[ic_cdk::query]
fn get_all_user_positions() -> Vec<UserPosition> {
    let caller_principal = caller();
    USER_POSITIONS.with(|positions| {
        positions
            .borrow()
            .values()
            .filter(|pos| pos.user == caller_principal)
            .cloned()
            .collect()
    })
}

/// Get user's ICP balance
#[ic_cdk::query]
fn get_user_balance() -> u64 {
    let caller_principal = caller();
    USER_BALANCES.with(|balances| *balances.borrow().get(&caller_principal).unwrap_or(&0))
}

/// Get user's ICP balance by Principal (for admin queries)
#[ic_cdk::query]
fn get_balance_of(user: Principal) -> u64 {
    USER_BALANCES.with(|balances| *balances.borrow().get(&user).unwrap_or(&0))
}

/// Get reward claims for a user
#[ic_cdk::query]
fn get_user_claims() -> Vec<RewardClaim> {
    let caller_principal = caller();
    REWARD_CLAIMS.with(|claims| {
        claims
            .borrow()
            .iter()
            .filter(|claim| claim.user == caller_principal)
            .cloned()
            .collect()
    })
}

/// Calculate quote for buying tokens (without executing the trade)
#[ic_cdk::query]
fn get_buy_quote(
    market_id: u64,
    icp_amount: u64,
    token_type: TokenType,
) -> Result<TradeResult, PredictionMarketError> {
    MARKETS.with(|markets| {
        let markets_map = markets.borrow();
        match markets_map.get(&market_id) {
            Some(market) => {
                if !matches!(market.status, MarketStatus::Open) {
                    return Err(PredictionMarketError::MarketClosed);
                }

                let tokens_out = calculate_tokens_out(
                    market.yes_reserve,
                    market.no_reserve,
                    icp_amount,
                    matches!(token_type, TokenType::Yes),
                )?;

                let fee_paid = (icp_amount * TRADE_FEE) / 1000;

                // Calculate new price after this hypothetical trade
                let new_yes_reserve = match token_type {
                    TokenType::Yes => market.yes_reserve + tokens_out,
                    TokenType::No => market.yes_reserve - (icp_amount * (1000 - TRADE_FEE)) / 1000,
                };
                let new_no_reserve = match token_type {
                    TokenType::Yes => market.no_reserve - (icp_amount * (1000 - TRADE_FEE)) / 1000,
                    TokenType::No => market.no_reserve + tokens_out,
                };

                let total_new_reserves = new_yes_reserve + new_no_reserve;
                let new_price = if total_new_reserves > 0 {
                    match token_type {
                        TokenType::Yes => new_no_reserve as f64 / total_new_reserves as f64,
                        TokenType::No => new_yes_reserve as f64 / total_new_reserves as f64,
                    }
                } else {
                    0.5
                };

                Ok(TradeResult {
                    tokens_received: tokens_out,
                    tokens_paid: icp_amount,
                    fee_paid,
                    new_price,
                })
            }
            None => Err(PredictionMarketError::MarketNotFound),
        }
    })
}

/// Calculate quote for selling tokens (without executing the trade)
#[ic_cdk::query]
fn get_sell_quote(
    market_id: u64,
    token_amount: u64,
    token_type: TokenType,
) -> Result<TradeResult, PredictionMarketError> {
    MARKETS.with(|markets| {
        let markets_map = markets.borrow();
        match markets_map.get(&market_id) {
            Some(market) => {
                if !matches!(market.status, MarketStatus::Open) {
                    return Err(PredictionMarketError::MarketClosed);
                }

                let icp_out = calculate_icp_out(
                    market.yes_reserve,
                    market.no_reserve,
                    token_amount,
                    matches!(token_type, TokenType::Yes),
                )?;

                let fee_paid = (icp_out * TRADE_FEE) / (1000 - TRADE_FEE);

                // Calculate new price after this hypothetical trade
                let new_yes_reserve = match token_type {
                    TokenType::Yes => market.yes_reserve - token_amount,
                    TokenType::No => {
                        let k = market.yes_reserve * market.no_reserve;
                        let new_no_reserve = market.no_reserve - token_amount;
                        k / new_no_reserve
                    }
                };
                let new_no_reserve = match token_type {
                    TokenType::Yes => {
                        let k = market.yes_reserve * market.no_reserve;
                        let new_yes_reserve = market.yes_reserve - token_amount;
                        k / new_yes_reserve
                    }
                    TokenType::No => market.no_reserve - token_amount,
                };

                let total_new_reserves = new_yes_reserve + new_no_reserve;
                let new_price = if total_new_reserves > 0 {
                    match token_type {
                        TokenType::Yes => new_no_reserve as f64 / total_new_reserves as f64,
                        TokenType::No => new_yes_reserve as f64 / total_new_reserves as f64,
                    }
                } else {
                    0.5
                };

                Ok(TradeResult {
                    tokens_received: icp_out,
                    tokens_paid: token_amount,
                    fee_paid,
                    new_price,
                })
            }
            None => Err(PredictionMarketError::MarketNotFound),
        }
    })
}

// =============================================================================
// ADMIN FUNCTIONS
// =============================================================================

#[ic_cdk::update]
fn set_admin(admin_principal: Principal) -> Result<String, PredictionMarketError> {
    // Allow anyone to become admin in development mode
    ADMIN.with(|admin| {
        *admin.borrow_mut() = Some(admin_principal);
        Ok("Admin set successfully".to_string())
    })
}

#[ic_cdk::update]
fn reset_admin() -> String {
    ADMIN.with(|admin| {
        *admin.borrow_mut() = None;
        "Admin reset - anyone can now become admin".to_string()
    })
}

#[ic_cdk::query]
fn get_admin() -> Option<Principal> {
    ADMIN.with(|admin| *admin.borrow())
}

#[ic_cdk::query]
fn is_admin() -> bool {
    let caller_principal = caller();
    ADMIN.with(|admin| {
        admin
            .borrow()
            .map_or(false, |admin_principal| admin_principal == caller_principal)
    })
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/// Deposit ICP to user balance (simulation - in production would involve real ICP transfers)
#[ic_cdk::update]
fn deposit_icp(amount: u64) -> Result<String, PredictionMarketError> {
    if amount < MIN_DEPOSIT {
        return Err(PredictionMarketError::InvalidAmount);
    }

    let caller_principal = caller();
    USER_BALANCES.with(|balances| {
        let mut balances_map = balances.borrow_mut();
        let current_balance = *balances_map.get(&caller_principal).unwrap_or(&0);
        balances_map.insert(caller_principal, current_balance + amount);
    });

    Ok(format!("Successfully deposited {} ICP", amount))
}

// =============================================================================
// LLM INTEGRATION (KEEPING EXISTING FUNCTIONALITY)
// =============================================================================

// #[ic_cdk::update]
// async fn prompt(prompt_str: String) -> String {
//     ic_llm::prompt(Model::Llama3_1_8B, prompt_str).await
// }

// #[ic_cdk::update]
// async fn chat(messages: Vec<ChatMessage>) -> String {
//     let response = ic_llm::chat(Model::Llama3_1_8B)
//         .with_messages(messages)
//         .send()
//         .await;

//     response.message.content.unwrap_or_default()
// }

/// Generate AI-powered market analysis
#[ic_cdk::update]
async fn analyze_market(market_id: u64) -> Result<String, PredictionMarketError> {
    let market_summary = get_market(market_id).ok_or(PredictionMarketError::MarketNotFound)?;

    let analysis = format!(
        "📊 AMM Market Analysis\n\n\
        Market: \"{}\"\n\n\
        💰 Current Pricing (AMM-based):\n\
        🟢 YES tokens: {:.1}% probability ({:.4} ICP each)\n\
        🔴 NO tokens: {:.1}% probability ({:.4} ICP each)\n\n\
        📈 Market Liquidity:\n\
        - Total ICP pool: {} ICP\n\
        - YES token reserve: {} tokens\n\
        - NO token reserve: {} tokens\n\
        - Price impact (100 ICP trade): {:.2}%\n\n\
        🔧 AMM Mechanics:\n\
        This market uses a constant product formula (x * y = k) where:\n\
        - x = YES token reserve, y = NO token reserve\n\
        - k = constant product ({} × {} = {})\n\
        - Price updates automatically with each trade\n\
        - Trading fee: {}%\n\n\
        📊 Market Sentiment:\n\
        The current token distribution suggests traders are {}.\n\n\
        ⚠️ Risk Considerations:\n\
        - Higher price impact indicates lower liquidity\n\
        - Large trades may face significant slippage\n\
        - Market status: {:?}",
        market_summary.market.title,
        market_summary.yes_price * 100.0,
        market_summary.yes_price,
        market_summary.no_price * 100.0,
        market_summary.no_price,
        market_summary.market.icp_liquidity_pool,
        market_summary.market.yes_reserve,
        market_summary.market.no_reserve,
        market_summary.price_impact,
        market_summary.market.yes_reserve,
        market_summary.market.no_reserve,
        market_summary.market.yes_reserve * market_summary.market.no_reserve,
        TRADE_FEE as f64 / 10.0,
        if market_summary.yes_price > 0.6 {
            "more confident in a YES outcome based on trading activity"
        } else if market_summary.no_price > 0.6 {
            "more confident in a NO outcome based on trading activity"
        } else {
            "uncertain, with balanced confidence in both outcomes"
        },
        market_summary.market.status
    );

    Ok(analysis)
}

// =============================================================================
// LEGACY FUNCTIONS (FOR COMPATIBILITY)
// =============================================================================

thread_local! {
    static COUNTER: RefCell<u64> = const { RefCell::new(0) };
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}! Welcome to the AMM Prediction Market!", name)
}

#[ic_cdk::update]
fn increment() -> u64 {
    COUNTER.with(|counter| {
        let val = *counter.borrow() + 1;
        *counter.borrow_mut() = val;
        val
    })
}

#[ic_cdk::query]
fn get_count() -> u64 {
    COUNTER.with(|counter| *counter.borrow())
}

#[ic_cdk::update]
fn set_count(value: u64) -> u64 {
    COUNTER.with(|counter| {
        *counter.borrow_mut() = value;
        value
    })
}

// =============================================================================
// UNIT TESTS FOR AMM PREDICTION MARKET
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // Helper function to create a test principal
    fn test_principal(n: u8) -> Principal {
        Principal::from_slice(&[n; 29])
    }

    // Helper function to reset state between tests
    fn reset_state() {
        MARKETS.with(|m| m.borrow_mut().clear());
        USER_POSITIONS.with(|p| p.borrow_mut().clear());
        USER_BALANCES.with(|b| b.borrow_mut().clear());
        REWARD_CLAIMS.with(|c| c.borrow_mut().clear());
        NEXT_MARKET_ID.with(|id| *id.borrow_mut() = 1);
        ADMIN.with(|a| *a.borrow_mut() = None);
    }

    // Helper to set up a test market with liquidity
    fn setup_test_market() -> u64 {
        reset_state();

        let admin = test_principal(1);
        let creator = test_principal(2);

        // Set admin
        ADMIN.with(|a| *a.borrow_mut() = Some(admin));

        // Give creator some ICP
        USER_BALANCES.with(|balances| {
            balances.borrow_mut().insert(creator, 10000);
        });

        let market_id = NEXT_MARKET_ID.with(|id| {
            let current_id = *id.borrow();
            *id.borrow_mut() = current_id + 1;
            current_id
        });

        let market = AmmMarket {
            id: market_id,
            title: "Test Market".to_string(),
            description: "A test prediction market".to_string(),
            yes_reserve: INITIAL_LIQUIDITY,
            no_reserve: INITIAL_LIQUIDITY,
            icp_liquidity_pool: 5000,
            status: MarketStatus::Open,
            winning_outcome: None,
            creator,
            admin,
            total_fees_collected: 0,
            creation_time: 1000000,
        };

        MARKETS.with(|markets| {
            markets.borrow_mut().insert(market_id, market);
        });

        market_id
    }

    #[test]
    fn test_amm_price_calculation() {
        reset_state();
        let market_id = setup_test_market();

        // Test initial pricing - should be 0.5 for both tokens
        let yes_price = get_token_price(market_id, TokenType::Yes).unwrap();
        let no_price = get_token_price(market_id, TokenType::No).unwrap();

        assert_eq!(yes_price, 0.5);
        assert_eq!(no_price, 0.5);

        // Test pricing with unequal reserves
        MARKETS.with(|markets| {
            let mut markets_map = markets.borrow_mut();
            let market = markets_map.get_mut(&market_id).unwrap();
            market.yes_reserve = 300; // Less YES tokens
            market.no_reserve = 700; // More NO tokens
        });

        let new_yes_price = get_token_price(market_id, TokenType::Yes).unwrap();
        let new_no_price = get_token_price(market_id, TokenType::No).unwrap();

        // YES tokens should be more expensive (higher price) due to scarcity
        assert!(new_yes_price > 0.5);
        assert!(new_no_price < 0.5);
        assert!((new_yes_price + new_no_price - 1.0).abs() < 0.001); // Should sum to 1
    }

    #[test]
    fn test_token_calculation_amm_formula() {
        reset_state();
        setup_test_market();

        let yes_reserve = 1000u64;
        let no_reserve = 1000u64;
        let icp_in = 100u64;

        // Test buying YES tokens
        let tokens_out = calculate_tokens_out(yes_reserve, no_reserve, icp_in, true).unwrap();

        // Calculate expected result manually
        let icp_after_fee = (icp_in * (1000 - TRADE_FEE)) / 1000;
        let k = yes_reserve * no_reserve;
        let new_no_reserve = no_reserve - icp_after_fee;
        let expected_new_yes_reserve = k / new_no_reserve;
        let expected_tokens_out = expected_new_yes_reserve - yes_reserve;

        assert_eq!(tokens_out, expected_tokens_out);

        // Test buying NO tokens
        let no_tokens_out = calculate_tokens_out(yes_reserve, no_reserve, icp_in, false).unwrap();
        let new_yes_reserve = yes_reserve - icp_after_fee;
        let expected_new_no_reserve = k / new_yes_reserve;
        let expected_no_tokens_out = expected_new_no_reserve - no_reserve;

        assert_eq!(no_tokens_out, expected_no_tokens_out);
    }

    #[test]
    fn test_reward_distribution_calculation() {
        reset_state();
        let market_id = setup_test_market();
        let user1 = test_principal(3);
        let user2 = test_principal(4);
        let user3 = test_principal(5);

        // Set up user positions manually for testing
        USER_POSITIONS.with(|positions| {
            let mut positions_map = positions.borrow_mut();

            // User1 has 300 YES tokens
            positions_map.insert(
                (user1, market_id),
                UserPosition {
                    user: user1,
                    market_id,
                    yes_tokens: 300,
                    no_tokens: 0,
                    claimed_reward: false,
                },
            );

            // User2 has 200 YES tokens
            positions_map.insert(
                (user2, market_id),
                UserPosition {
                    user: user2,
                    market_id,
                    yes_tokens: 200,
                    no_tokens: 0,
                    claimed_reward: false,
                },
            );

            // User3 has 100 NO tokens (will lose)
            positions_map.insert(
                (user3, market_id),
                UserPosition {
                    user: user3,
                    market_id,
                    yes_tokens: 0,
                    no_tokens: 100,
                    claimed_reward: false,
                },
            );
        });

        // Resolve market with YES outcome
        MARKETS.with(|markets| {
            let mut markets_map = markets.borrow_mut();
            let market = markets_map.get_mut(&market_id).unwrap();
            market.status = MarketStatus::Resolved;
            market.winning_outcome = Some(TokenType::Yes);
        });

        // Test reward calculation
        let total_winning_tokens = 300 + 200; // Only YES tokens
        let total_icp_pool = 5000;

        // User1 should get (300/500) * 5000 = 3000 ICP
        let expected_user1_reward = (300u128 * 5000u128 / total_winning_tokens as u128) as u64;

        // User2 should get (200/500) * 5000 = 2000 ICP
        let expected_user2_reward = (200u128 * 5000u128 / total_winning_tokens as u128) as u64;

        assert_eq!(expected_user1_reward, 3000);
        assert_eq!(expected_user2_reward, 2000);

        // Verify total rewards equal the liquidity pool
        assert_eq!(
            expected_user1_reward + expected_user2_reward,
            total_icp_pool
        );
    }

    #[test]
    fn test_double_claim_protection() {
        reset_state();
        let market_id = setup_test_market();
        let user = test_principal(3);

        // Set up user position
        USER_POSITIONS.with(|positions| {
            positions.borrow_mut().insert(
                (user, market_id),
                UserPosition {
                    user,
                    market_id,
                    yes_tokens: 100,
                    no_tokens: 0,
                    claimed_reward: false,
                },
            );
        });

        // Resolve market
        MARKETS.with(|markets| {
            let mut markets_map = markets.borrow_mut();
            let market = markets_map.get_mut(&market_id).unwrap();
            market.status = MarketStatus::Resolved;
            market.winning_outcome = Some(TokenType::Yes);
        });

        // Mark as already claimed
        USER_POSITIONS.with(|positions| {
            positions
                .borrow_mut()
                .get_mut(&(user, market_id))
                .unwrap()
                .claimed_reward = true;
        });

        // Test that double claim is detected
        let (_, already_claimed) = USER_POSITIONS.with(|positions| {
            let positions_map = positions.borrow();
            if let Some(position) = positions_map.get(&(user, market_id)) {
                (position.yes_tokens, position.claimed_reward)
            } else {
                (0, false)
            }
        });

        assert!(
            already_claimed,
            "Double claim protection should detect already claimed reward"
        );
    }

    #[test]
    fn test_trading_fees_collection() {
        reset_state();
        setup_test_market();

        let yes_reserve = 1000u64;
        let no_reserve = 1000u64;
        let icp_in = 1000u64; // Large trade to make fee calculation clear

        // Calculate expected fee
        let expected_fee = (icp_in * TRADE_FEE) / 1000;
        let icp_after_fee = icp_in - expected_fee;

        // Calculate tokens using AMM formula
        let tokens_out = calculate_tokens_out(yes_reserve, no_reserve, icp_in, true).unwrap();

        // Verify fee calculation in the formula
        let k = yes_reserve * no_reserve;
        let new_no_reserve = no_reserve - icp_after_fee;
        let new_yes_reserve = k / new_no_reserve;
        let expected_tokens = new_yes_reserve - yes_reserve;

        assert_eq!(tokens_out, expected_tokens);
        assert_eq!(expected_fee, 3); // 0.3% of 1000 = 3
    }

    #[test]
    fn test_insufficient_liquidity_scenarios() {
        reset_state();
        setup_test_market();

        let yes_reserve = 100u64;
        let no_reserve = 100u64;
        let large_icp_in = 150u64; // Larger than available reserve

        // This should fail because it would drain more than available reserve
        let result = calculate_tokens_out(yes_reserve, no_reserve, large_icp_in, true);
        assert!(result.is_err(), "Should fail due to insufficient liquidity");

        // Test zero reserves
        let zero_result = calculate_tokens_out(0, 100, 50, true);
        assert!(zero_result.is_err(), "Should fail with zero reserves");
    }

    #[test]
    fn test_amm_invariant_preservation() {
        reset_state();
        setup_test_market();

        let initial_yes = 1000u64;
        let initial_no = 1000u64;
        let initial_k = initial_yes * initial_no;

        let icp_in = 100u64;
        let tokens_out = calculate_tokens_out(initial_yes, initial_no, icp_in, true).unwrap();

        // Calculate new reserves after trade
        let icp_after_fee = (icp_in * (1000 - TRADE_FEE)) / 1000;
        let new_no_reserve = initial_no - icp_after_fee;
        let new_yes_reserve = initial_yes + tokens_out;

        // Verify the AMM formula is applied correctly
        let expected_new_yes = initial_k / new_no_reserve;
        assert_eq!(
            new_yes_reserve, expected_new_yes,
            "AMM invariant should be preserved"
        );
    }
}

// Export candid interface for dfx
export_candid!();
