use anchor_lang::prelude::*;
use anchor_lang::{
    system_program::{create_account, CreateAccount},
    solana_program::program::{invoke}
};

use anchor_spl::{
    token::{
        self, 
        Mint, 
        Token, 
        TokenAccount, 
        MintTo, 
        mint_to, 
        Burn, 
        TransferChecked, 
        initialize_mint, 
        InitializeMint, 
        transfer_checked
    },
    associated_token::{AssociatedToken, get_associated_token_address}
};

use mpl_token_metadata::{
    ID as metaplex_id,
    accounts::Metadata,
    instructions::{CreateV1Cpi, CreateV1CpiAccounts, CreateV1InstructionArgs},
    types::TokenStandard::Fungible
};

use spl_associated_token_account::instruction::create_associated_token_account;

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
        let associated_token_program = &ctx.accounts.associated_token_program;
        let mpl_token_metadata_program = &ctx.accounts.mpl_token_metadata_program;
        let rent = &ctx.accounts.rent;

        let token_mint = &ctx.accounts.token_mint;
        let derivative_mint_acc = &ctx.accounts.derivative_mint;
        let derivative_authority = &ctx.accounts.derivative_authority;
        let derivative_metadata_authority = &ctx.accounts.derivative_metadata_authority;
        let token_info = &mut ctx.accounts.token_info;
        let vault_authority = &ctx.accounts.vault_authority;
        let vault_ata = &ctx.accounts.vault_ata;
        let metadata = &ctx.accounts.metadata;

        let global_info = &ctx.accounts.global_info;
        let founder_ata = &ctx.accounts.founder_ata;
        let developer_ata = &ctx.accounts.developer_ata;

        let signer = &ctx.accounts.signer;
        let signer_token_ata = &ctx.accounts.signer_token_ata;
        let signer_derivative_ata = &ctx.accounts.signer_derivative_ata;

        require_keys_eq!(
            mpl_token_metadata_program.key(),
            metaplex_id,
            BuffcatErrorCodes::InvalidMetaplexProgram
        );

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

        let expected_ata = get_associated_token_address(
            &signer.key(), 
            &derivative_mint_acc.key()
        );

        require_keys_eq!(
            signer_derivative_ata.key(),
            expected_ata,
            BuffcatErrorCodes::InvalidATA
        );

        // inside your instruction:
        if token_info.derivative_mint == Pubkey::default() {
            // 0) sanity: check the incoming metadata account is from Metaplex and non-empty
            if metadata.owner != &metaplex_id {
                return Err(BuffcatErrorCodes::InvalidMetadataProgram.into());
            }
            if metadata.data_is_empty() {
                return Err(BuffcatErrorCodes::UninitializedMetadata.into());
            }

            // deserialize the on-chain metadata (you already had this)
            let metadata: Metadata = Metadata::safe_deserialize(&metadata.data.borrow())?;

            // ensure mint in the metadata matches the token_mint we expect
            require_keys_eq!(metadata.mint, token_mint.key(), BuffcatErrorCodes::MetadataMintMismatch);

            // build derivative name & symbol (same as your logic)
            let derivative_name = format!("Liquid {}", metadata.name.trim_end()); // trim to be safe
            let derivative_symbol = format!("li{}", metadata.symbol.trim_end());

            // --- Create the standard SPL Token Mint ---
            let mint_lamports = (Rent::get()?).minimum_balance(Mint::LEN);
            
            // Create account for the new mint
            create_account(
                CpiContext::new(
                    system_program.to_account_info(),
                    CreateAccount {
                        from: signer.to_account_info(),
                        to: derivative_mint_acc.to_account_info(),
                    },
                ),
                mint_lamports,
                Mint::LEN as u64,
                &anchor_spl::token::ID, // Use standard token program ID
            )?;

            // Initialize the new mint
            initialize_mint(
                CpiContext::new(
                    token_program.to_account_info(),
                    InitializeMint {
                        mint: derivative_mint_acc.to_account_info(),
                        rent: rent.to_account_info(),
                    },
                ),
                9, // Decimals
                &derivative_authority.key(), // Mint Authority
                Some(&derivative_authority.key()), // Freeze Authority (optional)
            )?;

            // --- Create Metaplex Metadata Account ---
            
            // Derive the Metadata PDA address
            let (metadata_address, _bump) = Pubkey::find_program_address(
                &[
                    b"metadata",
                    metaplex_id.as_ref(),
                    derivative_mint_acc.key().as_ref(),
                ],
                &metaplex_id,
            );

            require_eq!(
                ctx.accounts.derivative_metadata.key(),
                metadata_address,
                BuffcatErrorCodes::InvalidDerivativeMetadataAddress
            );

            // Create the metadata account using CreateV1
            CreateV1Cpi::new(
                &mpl_token_metadata_program,
                CreateV1CpiAccounts {
                    authority: &derivative_metadata_authority.to_account_info(), // Update authority
                    mint: (&derivative_mint_acc.to_account_info(), true),
                    metadata: &ctx.accounts.derivative_metadata.to_account_info(), // Your metadata account
                    payer: &signer.to_account_info(),
                    system_program: &system_program.to_account_info(),
                    sysvar_instructions: &ctx.accounts.sysvar_instructions.to_account_info(),
                    update_authority: (&derivative_metadata_authority.to_account_info(), true),
                    spl_token_program: Some(&token_program.to_account_info()), // Pass standard token program
                    master_edition: None
                },
                CreateV1InstructionArgs {
                    name: derivative_name,
                    symbol: derivative_symbol,
                    uri: metadata.uri,
                    seller_fee_basis_points: 0, // Typically 0 for fungible tokens
                    creators: None, // Optional
                    primary_sale_happened: false,
                    is_mutable: true, // Set to false if immutable
                    token_standard: Fungible, // Important for fungible
                    collection: None, // Optional
                    uses: None, // Typically for NFTs
                    collection_details: None, // Typically for NFTs
                    rule_set: None, // For Programmable NFTs
                    decimals: Some(9), // Match mint decimals
                    print_supply: None, // For NFTs
                },
            ).invoke()?;

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

        if signer_derivative_ata.data_is_empty() {
            let ix = create_associated_token_account(
                &signer.key(),
                &signer.key(),
                &derivative_mint_acc.key(),
                &associated_token_program.key()
            );

            let account_infos = &[
                signer.to_account_info(),
                signer_derivative_ata.to_account_info(),
                signer.to_account_info(),
                derivative_mint_acc.to_account_info(),
                system_program.to_account_info(),
                token_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
                associated_token_program.to_account_info(),
            ];

            invoke(
                &ix,
                account_infos,
            )?;
        }

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
            BuffcatErrorCodes::NotAuthorized
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
    vault_authority: &UncheckedAccount<'info>,
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
    /// CHECK: This is the Metaplex Token Metadata program
    pub mpl_token_metadata_program: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: Instructions sysvar must be passed in
    #[account(address = anchor_lang::solana_program::sysvar::ID)]
    pub sysvar_instructions: UncheckedAccount<'info>,

    // Lock Token Mint :-
    #[account(
        constraint = token_mint.is_initialized
        @ ProgramError::UninitializedAccount
    )]
    pub token_mint: Account<'info, Mint>,
    /// CHECK: Metaplex Metadata account. Its validity is verified in the instruction logic
    /// using mpl_token_metadata::accounts::Metadata or by checking the program ID.
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
    /// CHECK: Derivative Token's Mint Authority.
    pub derivative_authority: UncheckedAccount<'info>,
    /// CHECK: Metaplex Metadata account PDA, derived from mint and Metaplex program ID
    #[account(
        mut,
        seeds = [
            b"metadata",
            mpl_token_metadata_program.key().as_ref(),
            derivative_mint.key().as_ref()
        ],
        bump,
        seeds::program = mpl_token_metadata_program.key()
    )]
    pub derivative_metadata: UncheckedAccount<'info>,
        /// CHECK: Token Vault's Authority.
    #[account(
        seeds = [
            DERIVATIVE_METADATA_AUTHORITY_STATIC_SEED, 
            token_mint.key().as_ref()
        ],
        bump
    )]
    pub derivative_metadata_authority: UncheckedAccount<'info>,

    // User :-
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        constraint = signer_token_ata.owner == signer.key()
        && signer_token_ata.mint == token_mint.key()
    )]
    pub signer_token_ata: Account<'info, TokenAccount>,
    /// CHECK: User Derivative Token ATA
    pub signer_derivative_ata: UncheckedAccount<'info>,

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
    /// CHECK: Token Vault's Authority.
    #[account(
        mut,
        seeds = [
            VAULT_AUTHORITY_STATIC_SEED, 
            token_mint.key().as_ref()
        ], 
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,
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
    pub derivative_mint: Account<'info, Mint>,

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
    /// CHECK: Token Vault's Authority.
    #[account(
        seeds = [
            VAULT_AUTHORITY_STATIC_SEED, 
            token_mint.key().as_ref()
        ], 
        bump,
    )]
    pub vault_authority: UncheckedAccount<'info>,
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
    /// CHECK: Token Vault's Authority.
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
pub const DERIVATIVE_METADATA_AUTHORITY_STATIC_SEED: &[u8] = b"derivative_metadata_authority";

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
    #[msg("Now owned by official program")]
    InvalidMetadataProgram,
    #[msg("Not metaplex metadata.")]
    UninitializedMetadata,
    #[msg("Metadata is not of token submitted.")]
    MetadataMintMismatch,
    #[msg("ATA submitted is invalid")]
    InvalidATA,
    #[msg("Invalid program sent as metaplex program")]
    InvalidMetaplexProgram,
    #[msg("Invalid derivative metadata address")]
    InvalidDerivativeMetadataAddress,
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