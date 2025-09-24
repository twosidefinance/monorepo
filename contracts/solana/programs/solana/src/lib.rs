use anchor_lang::prelude::*;
use anchor_lang::system_program::{create_account, CreateAccount};
use anchor_lang::solana_program::program::{invoke};
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, mint_to, Burn, TransferChecked};
use mpl_token_metadata::accounts::Metadata;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{
        spl_token_2022::{
            extension::ExtensionType
        },
        InitializeMint2, initialize_mint2,
    },
    token_interface::{spl_token_metadata_interface::instruction::initialize},
};
use anchor_spl::token::transfer_checked;
use anchor_spl::token_interface::spl_token_2022;
use anchor_spl::token_2022::spl_token_2022::state::Mint as Token2022Mint;

declare_id!("Dua4QHV8oHr8Mxna9jngcTgACVVpitrAdDK4xVHufjCG");

#[program]
pub mod buffcat {
    use super::*;

    pub fn initialize_program(
        ctx: Context<InitializeProgram>,
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

        let token_mint = &ctx.accounts.token_mint;
        let derivative_mint_acc = &ctx.accounts.derivative_mint;
        let derivative_authority = &ctx.accounts.derivative_authority;
        let token_info = &mut ctx.accounts.token_info;
        let vault_authority = &ctx.accounts.vault_authority;
        let vault_ata = &ctx.accounts.vault_ata;

        let global_info = &ctx.accounts.global_info;
        let founder_ata = &ctx.accounts.founder_ata;
        let developer_ata = &ctx.accounts.developer_ata;

        let signer = &ctx.accounts.signer;
        let signer_token_ata = &ctx.accounts.signer_token_ata;
        let signer_derivative_ata = &ctx.accounts.signer_derivative_ata;

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

        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        if (token_info.derivative_mint == Pubkey::default()) {
            let metadata: Metadata = Metadata::safe_deserialize(
                &ctx.accounts.metadata.data.borrow()
            )?;
            let derivative_name = "Liquid ".to_string() + &metadata.name;
            let derivative_symbol = "li".to_string() + &metadata.symbol;

            let space = ExtensionType::try_calculate_account_len::<Token2022Mint>(&[
                ExtensionType::MetadataPointer,
            ]).unwrap();
            let metadata_space = 500;
            let lamports_required = (Rent::get()?).minimum_balance(space + metadata_space);

            create_account(
                CpiContext::new(
                    system_program.to_account_info(),
                    CreateAccount {
                        from: signer.to_account_info(),
                        to: derivative_mint_acc.to_account_info(),
                    },
                ),
                lamports_required,
                (space + metadata_space) as u64,
                &token_program.key(),
            )?;

            initialize_mint2(
                CpiContext::new(
                    token_program.to_account_info(),
                    InitializeMint2 {
                        mint:derivative_mint_acc.to_account_info(),
                    },
                ),
                9,
                &derivative_authority.key(),
                Some(&derivative_authority.key()),
            )?;

            let initialize_metadata_ix = initialize(
                &spl_token_2022::ID,
                &derivative_mint_acc.key(),
                &derivative_authority.key(),
                &derivative_mint_acc.key(),
                &derivative_authority.key(),
                derivative_name,
                derivative_symbol,
                metadata.uri,
            );

            invoke(
                &initialize_metadata_ix,
                &[derivative_mint_acc.to_account_info()],
            )?;

            token_info.derivative_mint = derivative_mint_acc.key();

            emit!(DerivativeTokenMinted {
                token: token_mint.key(),
                derivative: derivative_mint_acc.key(),
                timestamp: current_timestamp
            });
        }

        require!(
            derivative_mint_acc.key() == token_info.derivative_mint, 
            BuffcatErrorCodes::InvalidDerivativeAddress
        );

        let cpi_accounts = TransferChecked {
            mint: token_mint.to_account_info(),
            from: signer_token_ata.to_account_info(),
            to: vault_ata.to_account_info(),
            authority: signer.to_account_info(),
        };
        let cpi_program = token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        transfer_checked(cpi_context, amount, token_mint.decimals)?;

        let fee = calculate_fee(
            amount, 
            global_info.fee_percentage, 
            global_info.fee_percentage_divider
        );
        let deducted_amount = amount - fee;
        
        distribute_fee(
            token_mint, 
            fee, 
            current_timestamp, 
            global_info, 
            developer_ata, 
            founder_ata, 
            vault_authority, 
            vault_ata, 
            token_program
        )?;

        let cpi_accounts = MintTo {
            mint: derivative_mint_acc.to_account_info(),
            to: signer_derivative_ata.to_account_info(),
            authority: derivative_authority.to_account_info()
        };
        let cpi_program = token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        mint_to(cpi_ctx, deducted_amount)?;

        emit!(AssetsLocked { 
            account: signer.key(),
            token: token_mint.key(),
            amount: amount,
            timestamp: current_timestamp
        });

        Ok(())
    }

    pub fn unlock(
        ctx: Context<Unlock>,
        amount: u64
    ) -> Result<()> {
        let token_program = &ctx.accounts.token_program;

        let token_mint = &ctx.accounts.token_mint;
        let derivative_mint_acc = &ctx.accounts.derivative_mint;
        let token_info = &ctx.accounts.token_info;
        let vault_authority = &ctx.accounts.vault_authority;
        let vault_ata = &ctx.accounts.vault_ata;

        let global_info = &ctx.accounts.global_info;
        let founder_ata = &ctx.accounts.founder_ata;
        let developer_ata = &ctx.accounts.developer_ata;

        let signer = &ctx.accounts.signer;
        let signer_token_ata = &ctx.accounts.signer_token_ata;
        let signer_derivative_ata = &ctx.accounts.signer_derivative_ata;

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
        require!(
            token_info.derivative_mint != Pubkey::default(),
            BuffcatErrorCodes::NoDerivativeDeployed
        );

        let fee = calculate_fee(
            amount, 
            global_info.fee_percentage, 
            global_info.fee_percentage_divider
        );
        let deducted_amount = amount - fee;

        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        distribute_fee(
            token_mint, 
            fee, 
            current_timestamp, 
            global_info, 
            developer_ata, 
            founder_ata, 
            vault_authority, 
            vault_ata, 
            token_program
        )?;

        let cpi_accounts = Burn {
            from: signer_derivative_ata.to_account_info(),
            mint: derivative_mint_acc.to_account_info(),
            authority: signer.to_account_info(),
        };
        let cpi_program = token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, amount)?;
    
        let cpi_accounts = TransferChecked {
            mint: token_mint.to_account_info(),
            from: vault_ata.to_account_info(),
            to: signer_token_ata.to_account_info(),
            authority: vault_authority.to_account_info(),
        };
        let cpi_program = token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        transfer_checked(cpi_context, deducted_amount, token_mint.decimals)?;

        emit!(AssetsUnlocked { 
            account: signer.key(),
            token: token_mint.key(),
            amount: amount,
            timestamp: current_timestamp
        });

        Ok(())
    }

    pub fn whitelist(ctx: Context<Whitelist>) -> Result<()> {
        let token_mint = &ctx.accounts.token_mint;
        let token_info = &mut ctx.accounts.token_info;
        token_info.original_mint = token_mint.key();
        token_info.whitelisted = true;
        token_info.vault_authority_bump = ctx.bumps.vault_authority;
        Ok(())
    }

    pub fn add_authorized_updater(
        ctx: Context<AddAuthorizedUpdater>,
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

pub fn distribute_fee<'info>(
    token_mint: &Account<'info, Mint>,
    fee: u64,
    timestamp: i64,
    global_info: &Account<'info, GlobalInfo>,
    developer_ata: &Account<'info, TokenAccount>,
    founder_ata: &Account<'info, TokenAccount>,
    vault_authority: &SystemAccount<'info>,
    vault_ata: &Account<'info, TokenAccount>,
    token_program: &Program<'info, Token>
) -> Result<()> {
    let developer_share = (fee * global_info.developer_fee_share) / 100;
    let founder_share = (fee * global_info.founder_fee_share) / 100;
 
    let cpi_accounts = TransferChecked {
        mint: token_mint.to_account_info(),
        from: vault_ata.to_account_info(),
        to: developer_ata.to_account_info(),
        authority: vault_authority.to_account_info(),
    };
    let cpi_program = token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    transfer_checked(cpi_context, developer_share, token_mint.decimals)?;

    let cpi_accounts = TransferChecked {
        mint: token_mint.to_account_info(),
        from: vault_ata.to_account_info(),
        to: founder_ata.to_account_info(),
        authority: vault_authority.to_account_info(),
    };
    let cpi_program = token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    transfer_checked(cpi_context, founder_share, token_mint.decimals)?;

    // add ata field
    emit!(DeveloperFeeShareDistributed { 
        developer_wallet: global_info.developer_wallet,
        token: token_mint.key(),
        amount: developer_share,
        timestamp: timestamp
    });
    emit!(FounderFeeShareDistributed { 
        founder_wallet: global_info.founder_wallet,
        token: token_mint.key(),
        amount: founder_share,
        timestamp: timestamp
    });
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeProgram<'info> {
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
    pub metadata: AccountInfo<'info>,

    /// CHECK: This account will be created and initialized conditionally
    #[account(mut)]
    pub derivative_mint: UncheckedAccount<'info>,
    #[account(
        seeds = [
        DERIVATIVE_AUTHORITY_SEED,
        token_mint.key().as_ref()
        ], bump
    )]
    pub derivative_authority: UncheckedAccount<'info>,

    // User :-
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        constraint = signer_token_ata.owner == signer.key()
        && signer_token_ata.mint == token_mint.key()
    )]
    pub signer_token_ata: Account<'info, TokenAccount>,
    #[account(
        constraint = signer_derivative_ata.owner == signer.key()
        && signer_derivative_ata.mint == derivative_mint.key()
    )]
    pub signer_derivative_ata: Account<'info, TokenAccount>,

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
        mut,
        seeds = [
            VAULT_AUTHORITY_STATIC_SEED, 
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
    pub vault_ata: Account<'info, TokenAccount>,

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
    pub associated_token_program: Program<'info, AssociatedToken>,

    // Unlock Token Mint :-
    #[account(
        constraint = token_mint.is_initialized
        @ ProgramError::UninitializedAccount
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = derivative_mint.key() == token_info.derivative_mint
        @ BuffcatErrorCodes::InvalidDerivativeAddress
    )]
    pub derivative_mint: UncheckedAccount<'info>,

    // User :-
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        constraint = signer_token_ata.owner == signer.key()
        && signer_token_ata.mint == token_mint.key()
    )]
    pub signer_token_ata: Account<'info, TokenAccount>,
    #[account(
        constraint = signer_derivative_ata.owner == signer.key()
        && signer_derivative_ata.mint == derivative_mint.key()
    )]
    pub signer_derivative_ata: Account<'info, TokenAccount>,

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
            VAULT_AUTHORITY_STATIC_SEED, 
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
    pub vault_ata: Account<'info, TokenAccount>,

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
pub struct AddAuthorizedUpdater<'info> {
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
        seeds = [
            VAULT_AUTHORITY_STATIC_SEED, 
            token_mint.key().as_ref()
        ],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,
}

pub const GLOBAL_INFO_STATIC_SEED: &[u8] = b"global_info";
pub const TOKEN_INFO_STATIC_SEED: &[u8] = b"token_info";
pub const VAULT_AUTHORITY_STATIC_SEED: &[u8] = b"vault_authority";
pub const AUTHORIZED_UPDATER_INFO_STATIC_SEED: &[u8] = b"authorized_updater_info";
pub const METADATA_STATIC_SEED: &[u8] = b"metadata";
pub const DERIVATIVE_AUTHORITY_SEED: &[u8] = b"derivative_authority";

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
pub struct DeveloperFeeShareDistributed {
    pub developer_wallet: Pubkey,
    pub token: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct FounderFeeShareDistributed {
    pub founder_wallet: Pubkey,
    pub token: Pubkey,
    pub amount: u64,
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