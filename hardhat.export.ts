import * as dotenv from 'dotenv';

import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-vyper';
import { HardhatUserConfig } from 'hardhat/config';
import 'hardhat-deploy';
import 'hardhat-contract-sizer';
import 'hardhat-gas-reporter';
import SDK from 'tapioca-sdk';
import { HttpNetworkConfig, NetworksUserConfig } from 'hardhat/types';
require('@primitivefi/hardhat-dodoc');
import 'hardhat-tracer';
import { TAPIOCA_PROJECTS_NAME } from './gitsub_tapioca-sdk/src/api/config';

dotenv.config({ path: './env/.env' });
const { NODE_ENV } = process.env;

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface ProcessEnv {
            ALCHEMY_API_KEY: string;
            NODE_ENV: string;
        }
    }
}

if (!NODE_ENV || NODE_ENV === '') {
    throw `Please specify witch environment file you want to use\n \
    E.g: NODE_ENV={environmentFileHere} yarn hardhat ${process.argv
        .slice(2, process.argv.length)
        .join(' ')}`;
}
dotenv.config({ path: `./env/${process.env.NODE_ENV}.env` });

type TNetwork = ReturnType<
    typeof SDK.API.utils.getSupportedChains
>[number]['name'];
const supportedChains = SDK.API.utils.getSupportedChains().reduce(
    (sdkChains, chain) => ({
        ...sdkChains,
        [chain.name]: <HttpNetworkConfig>{
            accounts:
                process.env.PRIVATE_KEY !== undefined
                    ? [process.env.PRIVATE_KEY]
                    : [],
            live: true,
            url: chain.rpc.replace('<api_key>', process.env.ALCHEMY_API_KEY),
            gasMultiplier: chain.tags[0] === 'testnet' ? 2 : 1,
            chainId: Number(chain.chainId),
            tags: [...chain.tags],
        },
    }),
    {} as { [key in TNetwork]: HttpNetworkConfig },
);

const forkNetwork = process.env.NETWORK as TNetwork;
const forkChainInfo = supportedChains[forkNetwork];
const forkInfo: NetworksUserConfig['hardhat'] = forkNetwork
    ? {
          chainId: forkChainInfo.chainId,
          forking: {
              url: forkChainInfo.url,
              ...(process.env.FROM_BLOCK
                  ? { blockNumber: Number(process.env.FROM_BLOCK) }
                  : {}),
          },
      }
    : {};

const config: HardhatUserConfig & { dodoc?: any; vyper: any } = {
    SDK: { project: TAPIOCA_PROJECTS_NAME.TapiocaStrategies },
    defaultNetwork: 'hardhat',
    namedAccounts: {
        deployer: 0,
    },
    solidity: {
        compilers: [
            {
                version: '0.6.12',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.7.6',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.8.9',
                settings: {
                    viaIR: false,
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.8.19',
                settings: {
                    viaIR: false,
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    vyper: {
        compilers: [{ version: '0.2.16' }],
    },

    networks: {
        hardhat: {
            saveDeployments: false,
            mining: { auto: true },
            hardfork: 'merge',
            allowUnlimitedContractSize: true,
            accounts: {
                mnemonic:
                    'test test test test test test test test test test test junk',
                count: 10,
                accountsBalance: '1000000000000000000000',
            },
            tags: ['local'],
            ...forkInfo,
        },
        ...supportedChains,
    },
    dodoc: {
        runOnCompile: true,
        freshOutput: true,
        exclude: [],
    },
    etherscan: {
        apiKey: {
            goerli: process.env.BLOCKSCAN_KEY ?? '',
            arbitrumGoerli: process.env.ARBITRUM_GOERLI_KEY ?? '',
            avalancheFujiTestnet: process.env.AVALANCHE_FUJI_KEY ?? '',
            bscTestnet: process.env.BSC_KEY ?? '',
            polygonMumbai: process.env.POLYGON_MUMBAI ?? '',
            ftmTestnet: process.env.FTM_TESTNET ?? '',
        },
        customChains: [],
    },
    mocha: {
        timeout: 50000000,
    },
    typechain: {
        outDir: 'typechain',
        target: 'ethers-v5',
    },
};

export default config;
