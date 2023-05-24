import fs from 'fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { TContract } from 'tapioca-sdk/dist/shared';
import SDK from 'tapioca-sdk';
import _ from 'lodash';

let supportedChains: { [key: string]: any } = SDK.API.utils
    .getSupportedChains()
    .reduce(
        (sdkChains, chain) => ({
            ...sdkChains,
            [chain.name]: {
                ...chain,
            },
        }),
        {},
    );

export const constants: { [key: string]: any } = {
    //mainnet
    '1': {
        ...supportedChains['ethereum'],

        yieldBox: '',

        weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        usdt: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        wbtc: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        crv: '0xD533a949740bb3306d119CC777fa900bA034cd52',
        aave: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
        stkAave: '0x4da27a545c0c5b758a6ba100e3a049001de870f5',
        bal: '0xba100000625a3754423978a60c9317c58a424e3D',
        cEth: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
        lidoStEth: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',

        uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        uniswapV3Router02: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
        uniswapV2Router02: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        sushiRouter: '0x09e0f59C53a29EF813ab6de2D4308c13070709cB',
        aaveLendingPool: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9',
        aaveIncentivesController: '0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5',
        aaveReceiptToken: '0x030ba81f1c18d280636f32af80b9aad02cf0854e',

        yearnEthVault: '0xa258C4606Ca8206D8aA700cE2143D7db854D168c',

        stargateRouterEth: '0x150f94b44927f078737562f0fcf3c95c01cc2376',
        stargateLpStaking: '0xb0d502e938ed5f4df2e681fe6e419ff29631d62b',
        stargateLpStakingPid: 2,
        stargateLpToken: '0x101816545f6bd2b1076434b54383a1e633390a2e',
        stargateUniswapV3Pool: '0x6ce6d6d40a4c4088309293b0582372a2e6bb632e',

        tricryptoLiquidityPool: '0xD51a44d3FaE010294C616388b506AcdA1bfAAE46',
        tricryptoLpGauge: '0xDeFd8FdD20e0f34115C7018CCfb655796F6B2168',
        tricryptoMinter: '0xd061D61a4d941c39E5453435B6345Dc261C2fcE0',

        curveStEthPool: '0xdc24316b9ae028f1497c275eb9192a3ea0f67022',

        balancerPoolId:
            '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014',
        balancerPool: '0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56',
        balancerBalEthVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        balancerBalEthGauge: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        balancerRewardsCount: 0,
        balancerHelpers: '0x5aDDCCa35b7A0D07C74063c48700C8590E87864E',

        convexBooster: '0xF403C135812408BFbE8713b5A23a04b3D48AAE31',
        convexZap: '0xDd49A93FDcae579AE50B4b9923325e9e335ec82B',
        convexTricryptoRewardPool: '0x9D5C5E364D81DaB193b72db9E9BE9D8ee669B652',
    },
};

export const verify = async (
    hre: HardhatRuntimeEnvironment,
    artifact: string,
    args: any[],
) => {
    const { deployments } = hre;

    const deployed = await deployments.get(artifact);
    console.log(`[+] Verifying ${artifact}`);
    try {
        await hre.run('verify', {
            address: deployed.address,
            constructorArgsParams: args,
        });
        console.log('[+] Verified');
    } catch (err: any) {
        console.log(
            `[-] failed to verify ${artifact}; error: ${err.message}\n`,
        );
    }
};

export const readJSONFromFile = () => {
    //file should exist
    const rawContent = fs.readFileSync('./deployments.json', {
        encoding: 'utf8',
    });
    return JSON.parse(rawContent);
};

export const updateDeployments = async (
    contracts: TContract[],
    chainId: string,
) => {
    await SDK.API.utils.saveDeploymentOnDisk({
        [chainId]: contracts,
    });
};

export const getYieldBox = async (chainId: any, deployments: any, hre: any) => {
    let contractAddress = constants[chainId].yieldBox;
    if (
        hre.ethers.utils.isAddress(contractAddress!) &&
        contractAddress != hre.ethers.constants.AddressZero
    ) {
        contractAddress = (await deployments.get('YieldBox')).address;
    }
};

export const getTricryptoLPGetter = async (
    chainId: any,
    deployments: any,
    hre: any,
) => {
    let contractAddress = constants[chainId].tricryptoLpGetter;
    if (
        hre.ethers.utils.isAddress(contractAddress!) &&
        contractAddress != hre.ethers.constants.AddressZero
    ) {
        contractAddress = (await deployments.get('TricryptoLPGetter')).address;
    }
};
