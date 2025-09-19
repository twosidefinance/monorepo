use anchor_lang::prelude::*;

declare_id!("Dua4QHV8oHr8Mxna9jngcTgACVVpitrAdDK4xVHufjCG");

#[program]
pub mod Buffcat {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        developer_wallet: Pubkey,
        founder_wallet: Pubkey
    ) -> Result<()> {
        require!(
            developer_wallet != Pubkey::default(),
            BuffcatErrorCodes::InvalidPubkey
        );
        require!(
            founder_wallet != Pubkey::default(),
            BuffcatErrorCodes::InvalidPubkey
        );
        let global_info = &mut ctx.accounts.global_info;
        global_info.developer_wallet = developer_wallet;
        global_info.founder_wallet = founder_wallet;
        global_info.fee_percentage = 5;
        global_info.fee_percentage_divider = 1000;
        global_info.developer_fee_share = 50;
        global_info.founder_fee_share = 50;
        global_info.min_lock_value = 400;
        Ok(())
    }

    pub fn calculate_fee(
        amount: u64,
        fee_percentage: u64,
        fee_percentage_divider: u64
    ) -> u64 {
        return (amount * fee_percentage) / fee_percentage_divider;
    }
}

#[derive(Accounts)]
pub struct Initialize {
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        mut, 
        seeds = [GLOBAL_INFO_STATIC_SEED], 
        bump,
        payer = signer,
        space = 8 + GlobalInfo::LEN,
    )]
    pub global_info: Account<'info, GlobalInfo>,
}

#[derive(Accounts)]
pub struct Lock {}

#[derive(Accounts)]
pub struct Unlock {}

#[derive(Accounts)]
pub struct AddAuthorizedUpdaters {}

#[derive(Accounts)]
pub struct Whitelist {}

pub const GLOBAL_INFO_STATIC_SEED: &[u8] = b"global_info";
pub const TOKEN_INFO_STATIC_SEED: &[u8] = b"token_info";
pub const VAULT_STATIC_SEED: &[u8] = b"vault";
pub const AUTHORIZED_UPDATER_STATIC_SEED: &[u8] = b"authorized_updater";

#[account]
pub struct GlobalInfo {
    pub developer_wallet: Pubkey, // 32
    pub founder_wallet: Pubkey, // 32
    pub fee_percentage: u64, // 64 / 8 = 8
    pub fee_percentage_divider: u64, // 64 / 8 = 8
    pub developer_fee_share: Pubkey, // 32
    pub founder_fee_share: Pubkey, // 32
    pub min_lock_value: u8, // 8 / 8 = 1
}

impl GlobalInfo {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 32 + 32 + 1;
}

#[account]
pub struct TokenInfo {
    pub original_mint: Pubkey,
    pub whitelisted: bool,
    pub derivative_mint: Pubkey,
    pub vault_authority_bump: u8,
}

// Error Codes 
#[error_code]
pub enum BuffcatErrorCodes {
    #[msg("Account not authorized.")]
    NotAuthorized,
    #[msg("Amount value sent is zero.")]
    ZeroAmountValue,
    #[msg("Provided pubkey cannot be default / zero")]
    InvalidPubkey,
    #[msg("Amount value < Minimum amount.")]
    InvalidAmount,
    #[msg("Derivative not minted.")]
    NoDerivativeDeployed,
    #[msg("Derivative sent is not for this token.")]
    InvalidDerivativeAddress,
    #[msg("Token not whitelisted.")]
    NotWhitelisted,
}

// Events
#[event]
pub struct DeveloperFeesDistributed {
    pub developer_wallet: Pubkey,
    pub token: Pubkey,
    pub fees: u64,
    pub timestamp: i64,
}

#[event]
pub struct FounderFeesDistributed {
    pub founder_wallet: Pubkey,
    pub token: Pubkey,
    pub fees: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokenWhitelisted {
    pub token: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AssetsLocked {
    pub account: Pubkey,
    pub token: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct AssetsUnlocked {
    pub account: Pubkey,
    pub token: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct DerivativeTokenMinted {
    pub token: Pubkey,
    pub derivative: Pubkey,
    pub timestamp: i64,
}