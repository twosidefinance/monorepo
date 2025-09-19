use anchor_lang::prelude::*;

declare_id!("Dua4QHV8oHr8Mxna9jngcTgACVVpitrAdDK4xVHufjCG");

#[program]
pub mod Buffcat {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

// Error Codes 
#[error_code]
pub enum BuffcatErrorCodes {
    #[msg("Account not authorized.")]
    NotAuthorized,
    #[msg("Amount value sent is zero.")]
    ZeroAmountValue,
    #[msg("Address cannot be zero.")]
    ZeroAddress,
    #[msg("Amount value < Minimum amount.")]
    InvalidAmount,
    #[msg("Derivative not minted.")]
    NoDerivativeDeployed,
    #[msg("Derivative sent is not for this token.")]
    InvalidDerivativeAddress,
    #[msg("Token not whitelisted.")]
    NotWhitelisted,
}
