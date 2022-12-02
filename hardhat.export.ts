import * as dotenv from 'dotenv';

import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-vyper';
import { HardhatUserConfig } from 'hardhat/config';
import 'hardhat-deploy';
import 'hardhat-contract-sizer';
import 'hardhat-gas-reporter';
import SDK from 'tapioca-sdk';
import { HttpNetworkConfig } from 'hardhat/types';
require('@primitivefi/hardhat-dodoc');

dotenv.config({ path: './env/.env' });
let NODE_ENV = 'mainnet';
if (!NODE_ENV || NODE_ENV === '') {
    throw `Please specify witch environment file you want to use\n \
    E.g: NODE_ENV={environmentFileHere} yarn hardhat ${process.argv
        .slice(2, process.argv.length)
        .join(' ')}`;
}
dotenv.config({ path: `./env/${process.env.NODE_ENV}.env` });

const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1;
const PUBLIC_KEY_1 = process.env.PUBLIC_KEY_1;

let supportedChains: { [key: string]: HttpNetworkConfig } = SDK.API.utils
    .getSupportedChains()
    .reduce(
        (sdkChains, chain) => ({
            ...sdkChains,
            [chain.name]: <HttpNetworkConfig>{
                accounts:
                    process.env.PRIVATE_KEY !== undefined
                        ? [process.env.PRIVATE_KEY]
                        : [],
                live: true,
                url: chain.rpc.replace('<api_key>', process.env.ALCHEMY_KEY),
                gasMultiplier: chain.tags.includes('testnet') ? 2 : 1,
                chainId: Number(chain.chainId),
            },
        }),
        {},
    );

const config: HardhatUserConfig & { dodoc?: any; vyper: any } = {
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
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.8.15',
                settings: {
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
            forking: {
                url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
            },
            hardfork: 'merge',
        },

        //mainnets
        ethereum: supportedChains['ethereum'],
    },
    dodoc: {
        runOnCompile: true,
        freshOutput: true,
        exclude: [],
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_KEY,
        customChains: [],
    },
    mocha: {
        timeout: 50000000,
    },
};

export default config;
