/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/twoside.json`.
 */
export type Twoside = {
  address: "Dua4QHV8oHr8Mxna9jngcTgACVVpitrAdDK4xVHufjCG";
  metadata: {
    name: "twoside";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "addAuthorizedUpdater";
      discriminator: [16, 116, 173, 76, 1, 216, 209, 153];
      accounts: [
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "authorizedUpdaterInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  122,
                  101,
                  100,
                  95,
                  117,
                  112,
                  100,
                  97,
                  116,
                  101,
                  114,
                  95,
                  105,
                  110,
                  102,
                  111,
                ];
              },
              {
                kind: "arg";
                path: "updater";
              },
            ];
          };
        },
        {
          name: "globalInfo";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108, 95, 105, 110, 102, 111];
              },
            ];
          };
        },
      ];
      args: [
        {
          name: "updater";
          type: "pubkey";
        },
      ];
    },
    {
      name: "initializeProgram";
      discriminator: [176, 107, 205, 168, 24, 157, 175, 103];
      accounts: [
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "globalInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108, 95, 105, 110, 102, 111];
              },
            ];
          };
        },
      ];
      args: [
        {
          name: "developerWallet";
          type: "pubkey";
        },
        {
          name: "founderWallet";
          type: "pubkey";
        },
      ];
    },
    {
      name: "lock";
      discriminator: [21, 19, 208, 43, 237, 62, 255, 87];
      accounts: [
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "mplTokenMetadataProgram";
        },
        {
          name: "sysvarInstructions";
          address: "Sysvar1111111111111111111111111111111111111";
        },
        {
          name: "rent";
          address: "SysvarRent111111111111111111111111111111111";
        },
        {
          name: "tokenMint";
          writable: true;
        },
        {
          name: "tokenMetadata";
          writable: true;
        },
        {
          name: "derivativeAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  100,
                  101,
                  114,
                  105,
                  118,
                  97,
                  116,
                  105,
                  118,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
              {
                kind: "account";
                path: "tokenMint";
              },
            ];
          };
        },
        {
          name: "derivativeMint";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  100,
                  101,
                  114,
                  105,
                  118,
                  97,
                  116,
                  105,
                  118,
                  101,
                  95,
                  109,
                  105,
                  110,
                  116,
                ];
              },
              {
                kind: "account";
                path: "tokenMint";
              },
            ];
          };
        },
        {
          name: "derivativeMetadata";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: "account";
                path: "mplTokenMetadataProgram";
              },
              {
                kind: "account";
                path: "derivativeMint";
              },
            ];
            program: {
              kind: "account";
              path: "mplTokenMetadataProgram";
            };
          };
        },
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "signerTokenAta";
          writable: true;
        },
        {
          name: "signerDerivativeAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "signer";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169,
                ];
              },
              {
                kind: "account";
                path: "derivativeMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "tokenInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [116, 111, 107, 101, 110, 95, 105, 110, 102, 111];
              },
              {
                kind: "account";
                path: "tokenMint";
              },
            ];
          };
        },
        {
          name: "vaultAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
              {
                kind: "account";
                path: "tokenMint";
              },
            ];
          };
        },
        {
          name: "vaultAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "vaultAuthority";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169,
                ];
              },
              {
                kind: "account";
                path: "tokenMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "globalInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108, 95, 105, 110, 102, 111];
              },
            ];
          };
        },
        {
          name: "founderAta";
          writable: true;
        },
        {
          name: "developerAta";
          writable: true;
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
      ];
    },
    {
      name: "unlock";
      discriminator: [101, 155, 40, 21, 158, 189, 56, 203];
      accounts: [
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "tokenMint";
          writable: true;
        },
        {
          name: "derivativeAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  100,
                  101,
                  114,
                  105,
                  118,
                  97,
                  116,
                  105,
                  118,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
              {
                kind: "account";
                path: "tokenMint";
              },
            ];
          };
        },
        {
          name: "derivativeMint";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  100,
                  101,
                  114,
                  105,
                  118,
                  97,
                  116,
                  105,
                  118,
                  101,
                  95,
                  109,
                  105,
                  110,
                  116,
                ];
              },
              {
                kind: "account";
                path: "tokenMint";
              },
            ];
          };
        },
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "signerTokenAta";
          writable: true;
        },
        {
          name: "signerDerivativeAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "signer";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169,
                ];
              },
              {
                kind: "account";
                path: "derivativeMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "tokenInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [116, 111, 107, 101, 110, 95, 105, 110, 102, 111];
              },
              {
                kind: "account";
                path: "tokenMint";
              },
            ];
          };
        },
        {
          name: "vaultAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
              {
                kind: "account";
                path: "tokenMint";
              },
            ];
          };
        },
        {
          name: "vaultAta";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "vaultAuthority";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169,
                ];
              },
              {
                kind: "account";
                path: "tokenMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "globalInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [103, 108, 111, 98, 97, 108, 95, 105, 110, 102, 111];
              },
            ];
          };
        },
        {
          name: "founderAta";
          writable: true;
        },
        {
          name: "developerAta";
          writable: true;
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
      ];
    },
    {
      name: "whitelist";
      discriminator: [0, 143, 193, 93, 69, 29, 183, 140];
      accounts: [
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenMint";
        },
        {
          name: "authorizedUpdaterInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  122,
                  101,
                  100,
                  95,
                  117,
                  112,
                  100,
                  97,
                  116,
                  101,
                  114,
                  95,
                  105,
                  110,
                  102,
                  111,
                ];
              },
              {
                kind: "account";
                path: "signer";
              },
            ];
          };
        },
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "tokenInfo";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [116, 111, 107, 101, 110, 95, 105, 110, 102, 111];
              },
              {
                kind: "account";
                path: "tokenMint";
              },
            ];
          };
        },
        {
          name: "vaultAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
              {
                kind: "account";
                path: "tokenMint";
              },
            ];
          };
        },
      ];
      args: [];
    },
  ];
  accounts: [
    {
      name: "authorizedUpdaterInfo";
      discriminator: [243, 83, 94, 208, 11, 40, 65, 7];
    },
    {
      name: "globalInfo";
      discriminator: [241, 51, 8, 81, 11, 62, 44, 62];
    },
    {
      name: "tokenInfo";
      discriminator: [109, 162, 52, 125, 77, 166, 37, 202];
    },
  ];
  events: [
    {
      name: "assetsLocked";
      discriminator: [143, 254, 107, 98, 210, 27, 108, 148];
    },
    {
      name: "assetsUnlocked";
      discriminator: [210, 69, 198, 141, 18, 85, 145, 99];
    },
    {
      name: "derivativeTokenMinted";
      discriminator: [3, 37, 227, 26, 202, 33, 171, 52];
    },
    {
      name: "developerFeeShareDistributed";
      discriminator: [143, 207, 171, 75, 248, 217, 69, 13];
    },
    {
      name: "founderFeeShareDistributed";
      discriminator: [205, 104, 95, 216, 225, 117, 50, 31];
    },
    {
      name: "tokenWhitelisted";
      discriminator: [65, 3, 231, 165, 235, 116, 154, 51];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "notAuthorized";
      msg: "Account not authorized.";
    },
    {
      code: 6001;
      name: "zeroAmountValue";
      msg: "Amount value sent is zero.";
    },
    {
      code: 6002;
      name: "invalidPubkey";
      msg: "Provided pubkey cannot be default / zero";
    },
    {
      code: 6003;
      name: "invalidAmount";
      msg: "Amount value < Minimum amount.";
    },
    {
      code: 6004;
      name: "noDerivativeDeployed";
      msg: "Derivative not minted.";
    },
    {
      code: 6005;
      name: "invalidDerivativeAddress";
      msg: "Derivative sent is not for this token.";
    },
    {
      code: 6006;
      name: "notWhitelisted";
      msg: "Token not whitelisted.";
    },
    {
      code: 6007;
      name: "invalidMetadataProgram";
      msg: "Now owned by official program";
    },
    {
      code: 6008;
      name: "uninitializedMetadata";
      msg: "Not metaplex metadata.";
    },
    {
      code: 6009;
      name: "metadataMintMismatch";
      msg: "Metadata is not of token submitted.";
    },
    {
      code: 6010;
      name: "invalidAta";
      msg: "ATA submitted is invalid";
    },
    {
      code: 6011;
      name: "invalidMetaplexProgram";
      msg: "Invalid program sent as metaplex program";
    },
    {
      code: 6012;
      name: "invalidDerivativeMetadataAddress";
      msg: "Invalid derivative metadata address";
    },
    {
      code: 6013;
      name: "invalidTokenMetadataAddress";
      msg: "Invalid token metadata address";
    },
    {
      code: 6014;
      name: "amountInsufficientAfterFee";
      msg: "Fee >= amount (insufficient after fee)";
    },
    {
      code: 6015;
      name: "overflow";
      msg: "overflow";
    },
  ];
  types: [
    {
      name: "assetsLocked";
      type: {
        kind: "struct";
        fields: [
          {
            name: "account";
            type: "pubkey";
          },
          {
            name: "token";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "assetsUnlocked";
      type: {
        kind: "struct";
        fields: [
          {
            name: "account";
            type: "pubkey";
          },
          {
            name: "token";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "authorizedUpdaterInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "isInitialized";
            type: "bool";
          },
          {
            name: "key";
            type: "pubkey";
          },
          {
            name: "active";
            type: "bool";
          },
        ];
      };
    },
    {
      name: "derivativeTokenMinted";
      type: {
        kind: "struct";
        fields: [
          {
            name: "token";
            type: "pubkey";
          },
          {
            name: "derivative";
            type: "pubkey";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "developerFeeShareDistributed";
      type: {
        kind: "struct";
        fields: [
          {
            name: "developerWallet";
            type: "pubkey";
          },
          {
            name: "token";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "founderFeeShareDistributed";
      type: {
        kind: "struct";
        fields: [
          {
            name: "founderWallet";
            type: "pubkey";
          },
          {
            name: "token";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "globalInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "isInitialized";
            type: "bool";
          },
          {
            name: "developerWallet";
            type: "pubkey";
          },
          {
            name: "founderWallet";
            type: "pubkey";
          },
          {
            name: "feePercentage";
            type: "u8";
          },
          {
            name: "feePercentageDivider";
            type: "u16";
          },
          {
            name: "minFeeForDistribution";
            type: "u8";
          },
          {
            name: "minFee";
            type: "u8";
          },
          {
            name: "developerFeeShare";
            type: "u8";
          },
          {
            name: "founderFeeShare";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "tokenInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "isInitialized";
            type: "bool";
          },
          {
            name: "originalMint";
            type: "pubkey";
          },
          {
            name: "whitelisted";
            type: "bool";
          },
          {
            name: "derivativeMint";
            type: "pubkey";
          },
          {
            name: "vaultAuthorityBump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "tokenWhitelisted";
      type: {
        kind: "struct";
        fields: [
          {
            name: "token";
            type: "pubkey";
          },
          {
            name: "timestamp";
            type: "i64";
          },
        ];
      };
    },
  ];
};
