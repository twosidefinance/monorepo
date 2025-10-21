use anchor_lang::prelude::*;

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
        transfer_checked
    },
    associated_token::AssociatedToken
};

use mpl_token_metadata::{
    ID as metaplex_id,
    accounts::Metadata,
    instructions::{CreateMetadataAccountV3Cpi, CreateMetadataAccountV3CpiAccounts, CreateMetadataAccountV3InstructionArgs},
    types::{DataV2}
};

declare_id!("Dua4QHV8oHr8Mxna9jngcTgACVVpitrAdDK4xVHufjCG");

#[program]
pub mod twoside {
    use super::*;

    pub fn initialize_program(
        ctx: Context<InitializeProgram>,
        developer_wallet: Pubkey,
        founder_wallet: Pubkey
    ) -> Result<()> {
        require!(
            developer_wallet != Pubkey::default(),
            TwosideErrorCodes::InvalidPubkey
        );
        require!(
            founder_wallet != Pubkey::default(),
            TwosideErrorCodes::InvalidPubkey
        );
        let global_info = &mut ctx.accounts.global_info;
        global_info.is_initialized = true;
        global_info.developer_wallet = developer_wallet;
        global_info.founder_wallet = founder_wallet;
        global_info.fee_percentage = 5;
        global_info.fee_percentage_divider = 1000;
        global_info.min_fee_for_distribution = 2;
        global_info.min_fee = 2;
        global_info.developer_fee_share = 50;
        global_info.founder_fee_share = 50;
        Ok(())
    }

    pub fn lock(
        ctx: Context<Lock>,
        amount: u64
    ) -> Result<()> {
        let system_program = &ctx.accounts.system_program;
        let token_program = &ctx.accounts.token_program;
        let mpl_token_metadata_program = &ctx.accounts.mpl_token_metadata_program;

        let token_mint = &ctx.accounts.token_mint;
        let derivative_mint = &ctx.accounts.derivative_mint;
        let derivative_authority = &ctx.accounts.derivative_authority;
        let token_info = &mut ctx.accounts.token_info;
        let vault_authority = &ctx.accounts.vault_authority;
        let vault_ata = &ctx.accounts.vault_ata;
        let token_metadata_acc = &ctx.accounts.token_metadata;
        let derivative_metadata_acc = &ctx.accounts.derivative_metadata;

        let global_info = &ctx.accounts.global_info;
        let founder_ata = &ctx.accounts.founder_ata;
        let developer_ata = &ctx.accounts.developer_ata;

        let signer = &ctx.accounts.signer;
        let signer_token_ata = &ctx.accounts.signer_token_ata;
        let signer_derivative_ata = &ctx.accounts.signer_derivative_ata;

        require_keys_eq!(
            mpl_token_metadata_program.key(),
            metaplex_id,
            TwosideErrorCodes::InvalidMetaplexProgram
        );

        require!(
            amount != 0, 
            TwosideErrorCodes::ZeroAmountValue
        );
        require!(
            token_info.whitelisted, 
            TwosideErrorCodes::NotWhitelisted
        );

        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        let mint_key = token_mint.key();
        let derivative_authority_seeds: &[&[u8]] = &[
            DERIVATIVE_AUTHORITY_SEED,
            mint_key.as_ref(),
            &[ctx.bumps.derivative_authority],
        ];
        let derivative_authority_slice: &[&[&[u8]]] = &[derivative_authority_seeds];

        if token_info.derivative_mint == Pubkey::default() {
            let (token_metadata_address, _token_metadata_bump) = Pubkey::find_program_address(
                &[
                    METADATA_STATIC_SEED,
                    metaplex_id.as_ref(),
                    token_mint.key().as_ref(),
                ],
                &metaplex_id,
            );

            require_eq!(
                token_metadata_acc.key(),
                token_metadata_address,
                TwosideErrorCodes::InvalidTokenMetadataAddress
            );

            let (derivative_metadata_address, _derivative_metadata_bump) = Pubkey::find_program_address(
                &[
                    METADATA_STATIC_SEED,
                    metaplex_id.as_ref(),
                    derivative_mint.key().as_ref(),
                ],
                &metaplex_id,
            );

            require_eq!(
                derivative_metadata_acc.key(),
                derivative_metadata_address,
                TwosideErrorCodes::InvalidDerivativeMetadataAddress
            );

            let token_metadata: Metadata = Metadata::safe_deserialize(&token_metadata_acc.data.borrow())
            .map_err(|_| TwosideErrorCodes::UninitializedMetadata)?;

            require_keys_eq!(token_metadata.mint, token_mint.key(), TwosideErrorCodes::MetadataMintMismatch);

            let mut derivative_name = format!("Liquid {}", token_metadata.name.trim_end()); 
            let mut derivative_symbol = format!("li{}", token_metadata.symbol.trim_end());

            if derivative_name.as_bytes().len() > 32 {
                derivative_name = String::from_utf8_lossy(&derivative_name.as_bytes()[..32]).to_string();
            }

            if derivative_symbol.as_bytes().len() > 10 {
                derivative_symbol = String::from_utf8_lossy(&derivative_symbol.as_bytes()[..10]).to_string();
            }

            let mint_key = token_mint.key();
            let derivative_mint_bump = ctx.bumps.derivative_mint;
            let derivative_mint_acc_seeds: &[&[u8]] = &[
                DERIVATIVE_MINT_STATIC_SEED,
                mint_key.as_ref(),
                &[derivative_mint_bump],
            ];
            let full_signer_seeds: &[&[&[u8]]] = &[derivative_authority_seeds, derivative_mint_acc_seeds];

            let rent_info = ctx.accounts.rent.to_account_info();
            let cpi_accounts = CreateMetadataAccountV3CpiAccounts {
                metadata: &derivative_metadata_acc.to_account_info(),
                mint: &derivative_mint.to_account_info(),
                mint_authority: &derivative_authority.to_account_info(),
                payer: &signer.to_account_info(),
                update_authority: (&derivative_authority.to_account_info(), true),
                system_program: &system_program.to_account_info(),
                rent: Some(&rent_info),
            };

            let cpi_args = CreateMetadataAccountV3InstructionArgs {
                data: DataV2 {
                    name: derivative_name,
                    symbol: derivative_symbol,
                    uri: token_metadata.uri,
                    seller_fee_basis_points: 0,
                    creators: None,
                    collection: None,
                    uses: None,
                },
                is_mutable: false,
                collection_details: None,
            };

            CreateMetadataAccountV3Cpi::new(
                &mpl_token_metadata_program.to_account_info(),
                cpi_accounts,
                cpi_args,
            ).invoke_signed(full_signer_seeds)?;

            token_info.derivative_mint = derivative_mint.key();
            emit!(DerivativeTokenMinted {
                token: token_mint.key(),
                derivative: derivative_mint.key(),
                timestamp: current_timestamp
            });
        }

        require!(
            derivative_mint.key() == token_info.derivative_mint, 
            TwosideErrorCodes::InvalidDerivativeAddress
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
            global_info.fee_percentage as u64, 
            global_info.fee_percentage_divider as u64,
            global_info.min_fee_for_distribution as u64,
            global_info.min_fee as u64
        )?;
        let deducted_amount = amount - fee;
        
        distribute_fee(
            token_mint, 
            fee, 
            current_timestamp, 
            global_info, 
            developer_ata, 
            founder_ata, 
            vault_authority,
            ctx.bumps.vault_authority,
            vault_ata, 
            token_program
        )?;

        let cpi_accounts = MintTo {
            mint: derivative_mint.to_account_info(),
            to: signer_derivative_ata.to_account_info(),
            authority: derivative_authority.to_account_info()
        };
        let cpi_program = token_program.to_account_info();
        let cpi_ctx = CpiContext::new(
            cpi_program, 
            cpi_accounts)
            .with_signer(derivative_authority_slice);

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
            TwosideErrorCodes::ZeroAmountValue
        );
        require!(
            token_info.whitelisted, 
            TwosideErrorCodes::NotWhitelisted
        );
        require!(
            token_info.derivative_mint != Pubkey::default(),
            TwosideErrorCodes::NoDerivativeDeployed
        );

        let fee = calculate_fee(
            amount,
            global_info.fee_percentage as u64, 
            global_info.fee_percentage_divider as u64,
            global_info.min_fee_for_distribution as u64,
            global_info.min_fee as u64
        )?;
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
            ctx.bumps.vault_authority,
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

        let mint_key = token_mint.key();
        let vault_authority_seeds: &[&[u8]] = &[
            VAULT_AUTHORITY_STATIC_SEED,
            mint_key.as_ref(),
            &[ctx.bumps.vault_authority],
        ];
        let vault_authority_slice: &[&[&[u8]]] = &[vault_authority_seeds];
    
        let cpi_accounts = TransferChecked {
            mint: token_mint.to_account_info(),
            from: vault_ata.to_account_info(),
            to: signer_token_ata.to_account_info(),
            authority: vault_authority.to_account_info(),
        };
        let cpi_program = token_program.to_account_info();
        let cpi_context = CpiContext::new(
            cpi_program, 
            cpi_accounts
        ).with_signer(vault_authority_slice);
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
        token_info.is_initialized = true;
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
            signer.key() == global_info.founder_wallet ||
            signer.key() == global_info.developer_wallet,
            TwosideErrorCodes::NotAuthorized
        );
        let authorized_updater  = &mut ctx.accounts.authorized_updater_info;
        authorized_updater.is_initialized = true;
        authorized_updater.key = updater;
        authorized_updater.active = true;
        Ok(())
    }
}

pub fn calculate_fee(
    amount: u64,
    fee_percentage: u64,
    fee_percentage_divider: u64,
    min_fee_for_distribution: u64,
    min_fee: u64
) -> Result<u64> {
    let amount128 = amount as u128;
    let fee_percentage128 = fee_percentage as u128;
    let fee_percentage_divider128 = fee_percentage_divider as u128;
    let min_fee_for_distribution128 = min_fee_for_distribution as u128;

    let numer = amount128
        .checked_mul(fee_percentage128)
        .ok_or(TwosideErrorCodes::Overflow)?;
    let half = fee_percentage_divider128
        .checked_div(2)
        .ok_or(TwosideErrorCodes::Overflow)?;
    let summed = numer
        .checked_add(half)
        .ok_or(TwosideErrorCodes::Overflow)?;
    let rounded = summed / fee_percentage_divider128;

    // if rounding produced zero use min_fee, otherwise try to convert to u64 (fail if too big)
    let fee_u64 = if rounded < min_fee_for_distribution128 {
        min_fee
    } else {
        u64::try_from(rounded).map_err(|_| TwosideErrorCodes::Overflow)?
    };

    // final sanity: ensure fee leaves something to lock
    require!(fee_u64 < amount, TwosideErrorCodes::AmountInsufficientAfterFee);

    Ok(fee_u64)
}


pub fn distribute_fee<'info>(
    token_mint: &Account<'info, Mint>,
    fee: u64,
    timestamp: i64,
    global_info: &Account<'info, GlobalInfo>,
    developer_ata: &Account<'info, TokenAccount>,
    founder_ata: &Account<'info, TokenAccount>,
    vault_authority: &UncheckedAccount<'info>,
    vault_authority_bump: u8,
    vault_ata: &Account<'info, TokenAccount>,
    token_program: &Program<'info, Token>
) -> Result<()> {
    let developer_share = fee / 2;
    let founder_share = fee / 2;

    let mint_key = token_mint.key();
    let seeds: &[&[u8]] = &[
        VAULT_AUTHORITY_STATIC_SEED,
        mint_key.as_ref(),
        &[vault_authority_bump],
    ];
    let signer_slice: &[&[&[u8]]] = &[seeds];
 
    let cpi_accounts = TransferChecked {
        mint: token_mint.to_account_info(),
        from: vault_ata.to_account_info(),
        to: developer_ata.to_account_info(),
        authority: vault_authority.to_account_info(),
    };
    let cpi_program = token_program.to_account_info();
    let cpi_context = CpiContext::new(
        cpi_program, 
        cpi_accounts)
        .with_signer(signer_slice);
    transfer_checked(cpi_context, developer_share, token_mint.decimals)?;

    let cpi_accounts = TransferChecked {
        mint: token_mint.to_account_info(),
        from: vault_ata.to_account_info(),
        to: founder_ata.to_account_info(),
        authority: vault_authority.to_account_info(),
    };
    let cpi_program = token_program.to_account_info();
    let cpi_context = CpiContext::new(
        cpi_program, 
        cpi_accounts)
        .with_signer(signer_slice);
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
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: This is the Metaplex Token Metadata program
    pub mpl_token_metadata_program: UncheckedAccount<'info>,

    /// CHECK: Instructions sysvar must be passed in
    #[account(address = anchor_lang::solana_program::sysvar::ID)]
    pub sysvar_instructions: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,

    #[account(
        mut,
        constraint = token_mint.is_initialized
        @ ProgramError::UninitializedAccount
    )]
    pub token_mint: Box<Account<'info, Mint>>,
    /// CHECK: Metadata for token being locked
    #[account(
        mut,
        constraint = token_metadata.owner == &metaplex_id
        @ ProgramError::IncorrectProgramId
    )]
    pub token_metadata: AccountInfo<'info>,

    /// CHECK: Derivative Token's Mint Authority.
    #[account(
        seeds = [
        DERIVATIVE_AUTHORITY_SEED,
        token_mint.key().as_ref()
        ], bump
    )]
    pub derivative_authority: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = signer,
        mint::decimals = token_mint.decimals,
        mint::authority = derivative_authority,
        mint::freeze_authority = derivative_authority,
        seeds = [DERIVATIVE_MINT_STATIC_SEED, token_mint.key().as_ref()],
        bump
    )]
    pub derivative_mint: Box<Account<'info, Mint>>,
    /// CHECK: Metaplex Metadata account PDA, derived from mint and Metaplex program ID
    #[account(
        mut,
        seeds = [
            METADATA_STATIC_SEED,
            mpl_token_metadata_program.key().as_ref(),
            derivative_mint.key().as_ref()
        ],
        bump,
        seeds::program = mpl_token_metadata_program.key()
    )]
    pub derivative_metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = signer,
    )]
    pub signer_token_ata: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = derivative_mint,
        associated_token::authority = signer,
    )]
    pub signer_derivative_ata: Account<'info, TokenAccount>,

    #[account(
        mut, 
        seeds = [
            TOKEN_INFO_STATIC_SEED, 
            token_mint.key().as_ref()
        ], 
        bump,
        constraint = token_info.original_mint == token_mint.key() 
        && token_info.is_initialized
    )]
    pub token_info: Box<Account<'info, TokenInfo>>,

    #[account(
        seeds = [
            VAULT_AUTHORITY_STATIC_SEED, 
            token_mint.key().as_ref()
        ], 
        bump,
    )]
    /// CHECK: Token Vault's Authority.
    pub vault_authority: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = token_mint,
        associated_token::authority = vault_authority,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [GLOBAL_INFO_STATIC_SEED], 
        bump,
        constraint = global_info.is_initialized 
        @ ProgramError::UninitializedAccount
    )]
    pub global_info: Box<Account<'info, GlobalInfo>>,

    #[account(
        mut,
        token::mint = token_mint,
        constraint = founder_ata.owner == global_info.founder_wallet
    )]
    pub founder_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = token_mint,
        constraint = developer_ata.owner == global_info.developer_wallet
    )]
    pub developer_ata: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct Unlock<'info> {
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(
        mut,
        constraint = token_mint.is_initialized
        @ ProgramError::UninitializedAccount
    )]
    pub token_mint: Box<Account<'info, Mint>>,

    /// CHECK: Derivative Token's Mint Authority.
    #[account(
        seeds = [
        DERIVATIVE_AUTHORITY_SEED,
        token_mint.key().as_ref()
        ], bump
    )]
    pub derivative_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        mint::decimals = token_mint.decimals,
        mint::authority = derivative_authority,
        mint::freeze_authority = derivative_authority,
        seeds = [DERIVATIVE_MINT_STATIC_SEED, token_mint.key().as_ref()],
        bump
    )]
    pub derivative_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = signer,
    )]
    pub signer_token_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = derivative_mint,
        associated_token::authority = signer,
    )]
    pub signer_derivative_ata: Account<'info, TokenAccount>,

    #[account(
        mut, 
        seeds = [
            TOKEN_INFO_STATIC_SEED, 
            token_mint.key().as_ref()
        ], 
        bump,
        constraint = token_info.original_mint == token_mint.key() &&
        token_info.is_initialized
    )]
    pub token_info: Box<Account<'info, TokenInfo>>,

    #[account(
        seeds = [
            VAULT_AUTHORITY_STATIC_SEED, 
            token_mint.key().as_ref()
        ], 
        bump,
    )]
    /// CHECK: Token Vault's Authority.
    pub vault_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = vault_authority,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [GLOBAL_INFO_STATIC_SEED], 
        bump,
        constraint = global_info.is_initialized 
        @ ProgramError::UninitializedAccount
    )]
    pub global_info: Box<Account<'info, GlobalInfo>>,

    #[account(
        mut,
        token::mint = token_mint,
        constraint = founder_ata.owner == global_info.founder_wallet
    )]
    pub founder_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = token_mint,
        constraint = developer_ata.owner == global_info.developer_wallet
    )]
    pub developer_ata: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
#[instruction(updater: Pubkey)]
pub struct AddAuthorizedUpdater<'info> {
    pub system_program: Program<'info, System>,

    #[account(mut)]
    pub signer: Signer<'info>,

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

    #[account( 
        seeds = [GLOBAL_INFO_STATIC_SEED], 
        bump,
        constraint = global_info.is_initialized 
        @ ProgramError::UninitializedAccount
    )]
    pub global_info: Account<'info, GlobalInfo>,
}

#[derive(Accounts)]
pub struct Whitelist<'info> {
    pub system_program: Program<'info, System>,

    #[account(
        constraint = token_mint.is_initialized
        @ ProgramError::UninitializedAccount
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut, 
        seeds = [
            AUTHORIZED_UPDATER_INFO_STATIC_SEED, 
            signer.key().as_ref()
        ], 
        bump,
        constraint = authorized_updater_info.active
        && authorized_updater_info.is_initialized
        && authorized_updater_info.key == signer.key()
    )]
    pub authorized_updater_info: Account<'info, AuthorizedUpdaterInfo>,
    #[account(mut)]
    pub signer: Signer<'info>,

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
    /// CHECK: Token Vault's Authority.
    pub vault_authority: UncheckedAccount<'info>,
}

pub const GLOBAL_INFO_STATIC_SEED: &[u8] = b"global_info";
pub const TOKEN_INFO_STATIC_SEED: &[u8] = b"token_info";
pub const VAULT_AUTHORITY_STATIC_SEED: &[u8] = b"vault_authority";
pub const AUTHORIZED_UPDATER_INFO_STATIC_SEED: &[u8] = b"authorized_updater_info";
pub const METADATA_STATIC_SEED: &[u8] = b"metadata";
pub const DERIVATIVE_AUTHORITY_SEED: &[u8] = b"derivative_authority";
pub const DERIVATIVE_METADATA_AUTHORITY_STATIC_SEED: &[u8] = b"derivative_metadata_authority";
pub const DERIVATIVE_MINT_STATIC_SEED: &[u8] = b"derivative_mint";

#[account]
pub struct GlobalInfo {
    pub is_initialized: bool, // 1
    pub developer_wallet: Pubkey, // 32
    pub founder_wallet: Pubkey, // 32
    pub fee_percentage: u8, // 8 / 8 = 1
    pub fee_percentage_divider: u16, // 16 / 8 = 2
    pub min_fee_for_distribution: u8, // 8 / 8 = 1
    pub min_fee: u8, // 8 / 8 = 1
    pub developer_fee_share: u8, // 8 / 8 = 1
    pub founder_fee_share: u8, // 8 / 8 = 1
}

impl GlobalInfo {
    pub const LEN: usize = 1 + 32 + 32 + 1 + 2 + 1 + 1 + 1 + 1;
}

#[account]
pub struct TokenInfo {
    pub is_initialized: bool, // 1
    pub original_mint: Pubkey, // 32
    pub whitelisted: bool, // 1
    pub derivative_mint: Pubkey, // 32
    pub vault_authority_bump: u8, // 8 / 8 = 1
}

impl TokenInfo {
    pub const LEN: usize = 1 + 32 + 1 + 32 + 1;
}

#[account]
pub struct AuthorizedUpdaterInfo {
    pub is_initialized: bool, // 1
    pub key: Pubkey, // 32
    pub active: bool, // 1
}

impl AuthorizedUpdaterInfo {
    pub const LEN: usize = 1 + 32 + 1;
}

// Error Codes 
#[error_code]
pub enum TwosideErrorCodes {
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
    #[msg("Invalid token metadata address")]
    InvalidTokenMetadataAddress,
    #[msg("Fee >= amount (insufficient after fee)")]
    AmountInsufficientAfterFee,
    #[msg("Overflow")]
    Overflow,
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