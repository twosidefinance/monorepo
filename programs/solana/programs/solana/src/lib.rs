use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::{get_associated_token_address, AssociatedToken};

declare_id!("Dua4QHV8oHr8Mxna9jngcTgACVVpitrAdDK4xVHufjCG");

#[program]
pub mod buffcat {
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

    pub fn lock(
        ctx: Context<Lock>,
        amount: u64
    ) -> Result<()> {
        let system_program = &ctx.accounts.system_program;
        let token_program = &ctx.accounts.token_program;
        let associated_token_program = &ctx.accounts.associated_token_program;

        let token_mint = &ctx.accounts.token_mint;
        let token_info = &ctx.accounts.token_info;
        let vault_authority = &ctx.accounts.vault_authority;
        let vault_token_account = &ctx.accounts.vault_token_account;

        let global_info = &ctx.accounts.global_info;
        let founder_ata = &ctx.accounts.founder_ata;
        let developer_ata = &ctx.accounts.developer_ata;

        let signer = &ctx.accounts.signer;

        require!(
            amount != 0, 
            BuffcatErrorCodes::ZeroAmountValue
        );
        require!(
            amount >= global_info.min_lock_value as u64, 
            BuffcatErrorCodes::InvalidAmount
        );
        require!(
            token_info.whitelisted, 
            BuffcatErrorCodes::NotWhitelisted
        );

        // check if derivative has been deployed by 
        // checking derivative_mint field in token_info
        // if not then
        // fetch token name, symbol and decimals
        // modify name to have "Liquid " at start
        // modify symbol to have "li" at start
        // deploy new derivative token mint
        // transfer lock token mint to vault
        // deduct fee and distribute to founder & developer wallet
        // mint derivative tokens equal to fee
        // fee deducted amount to user's derivative ata
        // emit the event

        Ok(())
    }

    pub fn unlock(
        ctx: Context<Unlock>,
        amount: u64
    ) -> Result<()> {
        Ok(())
    }

    pub fn whitelist(ctx: Context<Whitelist>) -> Result<()> {
        let signer = &ctx.accounts.signer;
        let authorized_updater_info = &ctx.accounts.authorized_updater_info;
        let token_mint = &ctx.accounts.token_mint;
        let token_info = &mut ctx.accounts.token_info;
        token_info.original_mint = token_mint.key();
        token_info.whitelisted = true;
        token_info.vault_authority_bump = ctx.bumps.vault_authority;
        Ok(())
    }

    pub fn add_authorized_updater(
        ctx: Context<AddAuthorizedUpdaters>,
        updater: Pubkey
    ) -> Result<()> {
        let signer = &ctx.accounts.signer;
        let global_info = &ctx.accounts.global_info;
        require!(
            signer.key() == global_info.founder_wallet, 
            BuffcatErrorCodes::InvalidPubkey
        );
        let authorized_updater  = &mut ctx.accounts.authorized_updater_info;
        authorized_updater.key = updater;
        authorized_updater.active = true;
        Ok(())
    }
}

pub fn calculate_fee(
    amount: u64,
    fee_percentage: u64,
    fee_percentage_divider: u64
) -> u64 {
    return (amount * fee_percentage) / fee_percentage_divider;
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init, 
        seeds = [GLOBAL_INFO_STATIC_SEED], 
        bump,
        payer = signer,
        space = 8 + GlobalInfo::LEN,
    )]
    pub global_info: Account<'info, GlobalInfo>,
}

#[derive(Accounts)]
pub struct Lock<'info> {
    // System Accounts :-
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    // Lock Token Mint :-
    #[account(
        constraint = token_mint.is_initialized
        @ ProgramError::UninitializedAccount
    )]
    pub token_mint: Account<'info, Mint>,

    // User :-
    #[account(mut)]
    pub signer: Signer<'info>,

    // Token Accounts :-
    #[account(
        mut, 
        seeds = [
            TOKEN_INFO_STATIC_SEED, 
            token_mint.key().as_ref()
        ], 
        bump,
        constraint = token_info.original_mint == token_mint.key()
    )]
    pub token_info: Account<'info, TokenInfo>,
    #[account(
        seeds = [
            VAULT_STATIC_SEED, 
            token_mint.key().as_ref()
        ], 
        bump,
    )]
    pub vault_authority: SystemAccount<'info>,
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = token_mint,
        associated_token::authority = vault_authority
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    // Contract Accounts :-
    #[account(
        seeds = [GLOBAL_INFO_STATIC_SEED], 
        bump,
    )]
    pub global_info: Account<'info, GlobalInfo>,
    #[account(
        constraint = founder_ata.owner == global_info.founder_wallet
        && founder_ata.mint == token_mint.key()
    )]
    pub founder_ata: Account<'info, TokenAccount>,
    #[account(
        constraint = developer_ata.owner == global_info.developer_wallet
        && developer_ata.mint == token_mint.key()
    )]
    pub developer_ata: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct Unlock<'info> {
    // System Accounts :-
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,

    // Lock Token Mint :-
    #[account(
        constraint = token_mint.is_initialized
        @ ProgramError::UninitializedAccount
    )]
    pub token_mint: Account<'info, Mint>,

    // User :-
    pub signer: Signer<'info>,
    #[account(
        mut,
        constraint = original_token_account.owner == signer.key() && 
        original_token_account.mint == token_mint.key()
    )]
    pub original_token_account: Account<'info, TokenAccount>,
        #[account(
        mut,
        constraint = derivative_token_account.owner == signer.key() && 
        derivative_token_account.mint == token_info.derivative_mint
    )]
    pub derivative_token_account: Account<'info, TokenAccount>,

    // Token Accounts :-
    #[account(
        mut, 
        seeds = [
            TOKEN_INFO_STATIC_SEED, 
            token_mint.key().as_ref()
        ], 
        bump,
        constraint = token_info.original_mint == token_mint.key()
    )]
    pub token_info: Account<'info, TokenInfo>,
    #[account(
        seeds = [
            VAULT_STATIC_SEED, 
            token_mint.key().as_ref()
        ], 
        bump,
    )]
    pub vault_authority: SystemAccount<'info>,
    #[account(
        mut,
        constraint = vault_token_account.mint == token_mint.key() && 
        vault_token_account.owner == vault_authority.key(),
        address = get_associated_token_address(
            &vault_authority.key(), 
            &token_mint.key()
        ))]
    pub vault_token_account: Account<'info, TokenAccount>,

    // Contract Accounts :-
    #[account(
        seeds = [GLOBAL_INFO_STATIC_SEED], 
        bump,
    )]
    pub global_info: Account<'info, GlobalInfo>,
    #[account(
        constraint = founder_ata.owner == global_info.founder_wallet
        && founder_ata.mint == token_mint.key()
    )]
    pub founder_ata: Account<'info, TokenAccount>,
    #[account(
        constraint = developer_ata.owner == global_info.developer_wallet
        && developer_ata.mint == token_mint.key()
    )]
    pub developer_ata: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
#[instruction(updater: Pubkey)]
pub struct AddAuthorizedUpdaters<'info> {
    // System Accounts :-
    pub system_program: Program<'info, System>,

    // User :-
    #[account(mut)]
    pub signer: Signer<'info>,

    // Initialized PDA
    #[account(
        init,
        seeds = [
            AUTHORIZED_UPDATER_INFO_STATIC_SEED,
            updater.as_ref()
        ], 
        bump,
        payer = signer,
        space = 8 + AuthorizedUpdaterInfo::LEN,
    )]
    pub authorized_updater_info: Account<'info, AuthorizedUpdaterInfo>,

    // Contract Accounts :-
    #[account( 
        seeds = [GLOBAL_INFO_STATIC_SEED], 
        bump,
    )]
    pub global_info: Account<'info, GlobalInfo>,
}

#[derive(Accounts)]
pub struct Whitelist<'info> {
    // System Accounts :-
    pub system_program: Program<'info, System>,

    // Whitelist Token Mint :-
    #[account(
        constraint = token_mint.is_initialized
        @ ProgramError::UninitializedAccount
    )]
    pub token_mint: Account<'info, Mint>,

    // User :-
    #[account(
        mut, 
        seeds = [
            AUTHORIZED_UPDATER_INFO_STATIC_SEED, 
            signer.key().as_ref()
        ], 
        bump,
        constraint = authorized_updater_info.active
        @ BuffcatErrorCodes::NotAuthorized
    )]
    pub authorized_updater_info: Account<'info, AuthorizedUpdaterInfo>,
    #[account(mut)]
    pub signer: Signer<'info>,

    // Initialized PDAs
    #[account(
        init,
        seeds = [
            TOKEN_INFO_STATIC_SEED, 
            token_mint.key().as_ref()
        ], 
        bump,
        payer = signer,
        space = 8 + TokenInfo::LEN,
    )]
    pub token_info: Account<'info, TokenInfo>,
    #[account(
        seeds = [b"vault_authority", token_mint.key().as_ref()],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,
}

pub const GLOBAL_INFO_STATIC_SEED: &[u8] = b"global_info";
pub const TOKEN_INFO_STATIC_SEED: &[u8] = b"token_info";
pub const VAULT_STATIC_SEED: &[u8] = b"vault";
pub const AUTHORIZED_UPDATER_INFO_STATIC_SEED: &[u8] = b"authorized_updater_info";

#[account]
pub struct GlobalInfo {
    pub developer_wallet: Pubkey, // 32
    pub founder_wallet: Pubkey, // 32
    pub fee_percentage: u64, // 64 / 8 = 8
    pub fee_percentage_divider: u64, // 64 / 8 = 8
    pub developer_fee_share: u64, // 64 / 8 = 8
    pub founder_fee_share: u64, // 64 / 8 = 8
    pub min_lock_value: u16, // 16 / 8 = 2
}

impl GlobalInfo {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 8 + 8 + 2;
}

#[account]
pub struct TokenInfo {
    pub original_mint: Pubkey, // 32
    pub whitelisted: bool, // 1
    pub derivative_mint: Pubkey, // 32
    pub vault_authority_bump: u8, // 8 / 8 = 1
}

impl TokenInfo {
    pub const LEN: usize = 32 + 1 + 32 + 1;
}

#[account]
pub struct AuthorizedUpdaterInfo {
    pub key: Pubkey, // 32
    pub active: bool, // 1
}

impl AuthorizedUpdaterInfo {
    pub const LEN: usize = 32 + 1;
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