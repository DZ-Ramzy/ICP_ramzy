use candid::{CandidType, Principal};
use ic_cdk::{caller, export_candid};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

use ic_llm::{ChatMessage, Model};

// Minimum deposit amount in tokens (adjust as needed)
const MIN_DEPOSIT: u64 = 1000;

// Data structures for the prediction market

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum MarketStatus {
    Open,
    Closed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum MarketResult {
    Yes,
    No,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum Side {
    Yes,
    No,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Market {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub yes_pool: u64,
    pub no_pool: u64,
    pub status: MarketStatus,
    pub result: Option<MarketResult>,
    pub creator: Principal,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Position {
    pub user_principal: Principal,
    pub market_id: u64,
    pub quantity: u64,
    pub side: Side,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MarketSummary {
    pub market: Market,
    pub yes_price: f64,
    pub no_price: f64,
    pub total_volume: u64,
}

// Error types
#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum PredictionMarketError {
    MarketNotFound,
    MarketClosed,
    InsufficientDeposit,
    Unauthorized,
    InvalidAmount,
}

// State management
thread_local! {
    static MARKETS: RefCell<HashMap<u64, Market>> = RefCell::new(HashMap::new());
    static POSITIONS: RefCell<Vec<Position>> = const { RefCell::new(Vec::new()) };
    static NEXT_MARKET_ID: RefCell<u64> = const { RefCell::new(1) };
    static ADMIN: RefCell<Option<Principal>> = const { RefCell::new(None) };
}

// LLM Integration functions (keeping existing functionality)

#[ic_cdk::update]
async fn prompt(prompt_str: String) -> String {
    ic_llm::prompt(Model::Llama3_1_8B, prompt_str).await
}

#[ic_cdk::update]
async fn chat(messages: Vec<ChatMessage>) -> String {
    let response = ic_llm::chat(Model::Llama3_1_8B)
        .with_messages(messages)
        .send()
        .await;

    // A response can contain tool calls, but we're not calling tools in this project,
    // so we can return the response message directly.
    response.message.content.unwrap_or_default()
}

// Admin functions

#[ic_cdk::update]
fn set_admin(admin_principal: Principal) -> Result<String, PredictionMarketError> {
    let caller_principal = caller();

    // Only allow setting admin if no admin is set, or if caller is current admin
    ADMIN.with(|admin| {
        let current_admin = *admin.borrow();
        if current_admin.is_none() || current_admin == Some(caller_principal) {
            *admin.borrow_mut() = Some(admin_principal);
            Ok("Admin set successfully".to_string())
        } else {
            Err(PredictionMarketError::Unauthorized)
        }
    })
}

#[ic_cdk::query]
fn get_admin() -> Option<Principal> {
    ADMIN.with(|admin| *admin.borrow())
}

// Market management functions

/// Initialize a new prediction market
#[ic_cdk::update]
fn initialize_market(title: String, description: String) -> Result<u64, PredictionMarketError> {
    let caller_principal = caller();

    let market_id = NEXT_MARKET_ID.with(|id| {
        let current_id = *id.borrow();
        *id.borrow_mut() = current_id + 1;
        current_id
    });

    let market = Market {
        id: market_id,
        title,
        description,
        yes_pool: 0,
        no_pool: 0,
        status: MarketStatus::Open,
        result: None,
        creator: caller_principal,
    };

    MARKETS.with(|markets| {
        markets.borrow_mut().insert(market_id, market);
    });

    Ok(market_id)
}

/// Buy YES or NO tokens for a specific market
#[ic_cdk::update]
fn buy_tokens(
    market_id: u64,
    side: Side,
    quantity: u64,
    deposit_amount: u64,
) -> Result<String, PredictionMarketError> {
    let caller_principal = caller();

    if deposit_amount < MIN_DEPOSIT {
        return Err(PredictionMarketError::InsufficientDeposit);
    }

    if quantity == 0 {
        return Err(PredictionMarketError::InvalidAmount);
    }

    // Check if market exists and is open
    let market_exists = MARKETS.with(|markets| {
        let markets_map = markets.borrow();
        match markets_map.get(&market_id) {
            Some(market) => match market.status {
                MarketStatus::Open => true,
                MarketStatus::Closed => false,
            },
            None => false,
        }
    });

    if !market_exists {
        return Err(PredictionMarketError::MarketNotFound);
    }

    // Update market pools
    MARKETS.with(|markets| {
        let mut markets_map = markets.borrow_mut();
        if let Some(market) = markets_map.get_mut(&market_id) {
            match side {
                Side::Yes => market.yes_pool += quantity,
                Side::No => market.no_pool += quantity,
            }
        }
    });

    // Record the position
    let position = Position {
        user_principal: caller_principal,
        market_id,
        quantity,
        side,
    };

    POSITIONS.with(|positions| {
        positions.borrow_mut().push(position);
    });

    Ok(format!("Successfully bought {} tokens", quantity))
}

/// Close a market and set the result
#[ic_cdk::update]
fn close_market(market_id: u64, result: MarketResult) -> Result<String, PredictionMarketError> {
    MARKETS.with(|markets| {
        let mut markets_map = markets.borrow_mut();
        match markets_map.get_mut(&market_id) {
            Some(market) => {
                market.status = MarketStatus::Closed;
                market.result = Some(result);
                Ok("Market closed successfully".to_string())
            }
            None => Err(PredictionMarketError::MarketNotFound),
        }
    })
}

// Query functions

/// Get all markets with their current prices
#[ic_cdk::query]
fn get_markets() -> Vec<MarketSummary> {
    MARKETS.with(|markets| {
        markets
            .borrow()
            .values()
            .map(|market| {
                let total_pool = market.yes_pool + market.no_pool;
                let (yes_price, no_price) = if total_pool > 0 {
                    (
                        market.yes_pool as f64 / total_pool as f64,
                        market.no_pool as f64 / total_pool as f64,
                    )
                } else {
                    (0.5, 0.5) // Default equal prices when no trades
                };

                MarketSummary {
                    market: market.clone(),
                    yes_price,
                    no_price,
                    total_volume: total_pool,
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
            let total_pool = market.yes_pool + market.no_pool;
            let (yes_price, no_price) = if total_pool > 0 {
                (
                    market.yes_pool as f64 / total_pool as f64,
                    market.no_pool as f64 / total_pool as f64,
                )
            } else {
                (0.5, 0.5)
            };

            MarketSummary {
                market: market.clone(),
                yes_price,
                no_price,
                total_volume: total_pool,
            }
        })
    })
}

/// Get user positions for a specific market
#[ic_cdk::query]
fn get_user_positions(market_id: u64) -> Vec<Position> {
    let caller_principal = caller();
    POSITIONS.with(|positions| {
        positions
            .borrow()
            .iter()
            .filter(|position| {
                position.user_principal == caller_principal && position.market_id == market_id
            })
            .cloned()
            .collect()
    })
}

/// Get all positions for a user
#[ic_cdk::query]
fn get_all_user_positions() -> Vec<Position> {
    let caller_principal = caller();
    POSITIONS.with(|positions| {
        positions
            .borrow()
            .iter()
            .filter(|position| position.user_principal == caller_principal)
            .cloned()
            .collect()
    })
}

// LLM-powered market analysis

/// Generate market analysis using LLM
#[ic_cdk::update]
async fn analyze_market(market_id: u64) -> Result<String, PredictionMarketError> {
    let market_summary = get_market(market_id).ok_or(PredictionMarketError::MarketNotFound)?;

    // Provide a comprehensive market analysis based on current data
    let analysis = format!(
        "📊 Market Analysis\n\n\
        Current market situation for \"{}\":\n\n\
        🟢 YES tokens: {:.1}% of the market\n\
        🔴 NO tokens: {:.1}% of the market\n\n\
        💰 Total trading volume: {} tokens\n\n\
        📈 Price Analysis:\n\
        The current prices suggest that traders are {}.\n\n\
        📋 Market Details:\n\
        - Status: {:?}\n\
        - YES pool size: {} tokens\n\
        - NO pool size: {} tokens\n\n\
        💡 This analysis is based on current market data. The prices reflect the collective \
        sentiment of traders who have purchased tokens on each side of this prediction market.",
        market_summary.market.title,
        market_summary.yes_price * 100.0,
        market_summary.no_price * 100.0,
        market_summary.total_volume,
        if market_summary.yes_price > 0.6 {
            "more confident in a YES outcome, with stronger buying pressure on YES tokens"
        } else if market_summary.no_price > 0.6 {
            "more confident in a NO outcome, with stronger buying pressure on NO tokens"
        } else {
            "uncertain, with roughly equal confidence in both outcomes. The market is balanced"
        },
        market_summary.market.status,
        market_summary.market.yes_pool,
        market_summary.market.no_pool
    );

    Ok(analysis)
}

// Legacy functions (keeping for compatibility)
thread_local! {
    static COUNTER: RefCell<u64> = const { RefCell::new(0) };
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
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

export_candid!();
