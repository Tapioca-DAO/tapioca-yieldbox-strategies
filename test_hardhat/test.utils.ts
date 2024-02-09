import { time } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, BigNumberish } from 'ethers';
import hre, { ethers, network } from 'hardhat';
import {
    UniswapV2Swapper__factory,
    UniswapV3Swapper__factory,
} from '@tapioca-sdk/typechain/tapioca-periphery';
import {
    ERC20Mock__factory,
    UniswapV2RouterMock__factory,
    MockSwapper__factory,
    UniswapV2Factory__factory,
    UniswapV2Router02__factory,
    ERC20Mock,
    UniswapV3SwapperMock__factory,
    OracleMock__factory,
    TOFTMock__factory,
    SavingsDaiMock__factory,
} from '@tapioca-sdk/typechain/tapioca-mocks';
import { ERC20WithoutStrategy__factory } from '@tapioca-sdk/typechain/YieldBox';

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR);

const verifyEtherscanQueue: { address: string; args: any[] }[] = [];
const verifyEtherscan = async (
    address: string,
    args: any[],
    staging?: boolean,
) => {
    if (staging) {
        verifyEtherscanQueue.push({ address, args });
    }
};

const log = (message: string, staging?: boolean) =>
    staging && console.log(message);

async function resetVM() {
    await ethers.provider.send('hardhat_reset', []);
}

const timeTravel = async (seconds: number) => {
    await time.increase(seconds);
};

export function BN(n: BigNumberish) {
    return ethers.BigNumber.from(n.toString());
}

export async function setBalance(addr: string, ether: number) {
    await ethers.provider.send('hardhat_setBalance', [
        addr,
        ethers.utils.hexStripZeros(ethers.utils.parseEther(String(ether))._hex),
    ]);
}

async function registerERC20Tokens(deployer: any, staging?: boolean) {
    const supplyStart = ethers.BigNumber.from((1e18).toString()).mul(1e9);

    // Deploy USDC and WETH
    const ERC20Mock = new ERC20Mock__factory(deployer);

    const usdc = await ERC20Mock.deploy(
        'USDC Mock',
        'USDCM',
        supplyStart,
        18,
        deployer.address,
    );
    const hasMintRetrictionsUsdc = await usdc.hasMintRestrictions();
    if (hasMintRetrictionsUsdc) {
        await usdc.toggleRestrictions();
    }
    await usdc.updateMintLimit(supplyStart.mul(10));
    log(`Deployed USDC ${usdc.address} with args [${supplyStart}]`, staging);

    const weth = await ERC20Mock.deploy(
        'WETH Mock',
        'WETHM',
        supplyStart,
        18,
        deployer.address,
    );
    const hasMintRetrictionsWeth = await weth.hasMintRestrictions();
    if (hasMintRetrictionsWeth) {
        await weth.toggleRestrictions();
    }
    await weth.updateMintLimit(supplyStart.mul(10));
    log(`Deployed WETH ${weth.address} with no arguments`, staging);

    await verifyEtherscan(usdc.address, [supplyStart], staging);
    await verifyEtherscan(weth.address, [], staging);

    return { usdc, weth };
}

async function registerYieldBox(wethAddress: string, staging?: boolean) {
    // Deploy URIBuilder
    const uriBuilder = await (
        await ethers.getContractFactory('YieldBoxURIBuilder')
    ).deploy();
    await uriBuilder.deployed();
    log(
        `Deployed YieldBoxURIBuilder ${uriBuilder.address} with no arguments`,
        staging,
    );

    // Deploy yieldBox
    const yieldBox = await (
        await ethers.getContractFactory('YieldBox')
    ).deploy(ethers.constants.AddressZero, uriBuilder.address);
    await yieldBox.deployed();
    log(
        `Deployed YieldBox ${yieldBox.address} with args [${ethers.constants.AddressZero}, ${uriBuilder.address}] `,
        staging,
    );

    await verifyEtherscan(uriBuilder.address, [], staging);
    await verifyEtherscan(
        yieldBox.address,
        [ethers.constants.AddressZero, uriBuilder.address],
        staging,
    );

    return { uriBuilder, yieldBox };
}

async function registerUniswapV3Swapper(
    yieldBoxAddress: string,
    swapRouterAddress: string,
    swapFactoryAddress: string,
    staging?: boolean,
) {
    const deployer = (await ethers.getSigners())[0];
    const UniswapV3Swapper = new UniswapV3Swapper__factory(deployer);
    const uniswapV3Swapper = await UniswapV3Swapper.deploy(
        yieldBoxAddress,
        swapRouterAddress,
        swapFactoryAddress,
        deployer.address,
    );

    log(
        `Deployed UniswapV3SwapperMock ${uniswapV3Swapper.address} with args [${yieldBoxAddress}, ${swapRouterAddress}, ${swapFactoryAddress}]`,
        staging,
    );

    await verifyEtherscan(
        uniswapV3Swapper.address,
        [yieldBoxAddress, swapRouterAddress, swapFactoryAddress],
        staging,
    );

    return { uniswapV3Swapper };
}

async function registerUniswapV3Mock(staging?: boolean) {
    const deployer = (await ethers.getSigners())[0];
    const UniswapV3SwapperMock = new UniswapV3SwapperMock__factory(deployer);
    const uniswapV3SwapperMock = await UniswapV3SwapperMock.deploy(
        deployer.address,
    );

    log(
        `Deployed UniswapV3SwapperMock ${uniswapV3SwapperMock.address} with args [${deployer.address}]`,
        staging,
    );

    await verifyEtherscan(
        uniswapV3SwapperMock.address,
        [deployer.address],
        staging,
    );

    return { uniswapV3SwapperMock };
}

async function registerSwapperMockNew(
    __uniRouterAddress: string,
    __uniFactoryAddress: string,
    yieldBox: any,
    staging?: boolean,
) {
    const deployer = (await ethers.getSigners())[0];
    const MultiSwapper = new UniswapV2Swapper__factory(deployer);
    const swapperMock = await MultiSwapper.deploy(
        __uniRouterAddress,
        __uniFactoryAddress,
        yieldBox.address,
        deployer.address,
    );

    log(
        `Deployed MultiSwapper ${swapperMock.address} with args [${__uniRouterAddress}, ${__uniFactoryAddress}, ${yieldBox.address}]`,
        staging,
    );

    await verifyEtherscan(
        swapperMock.address,
        [__uniRouterAddress, __uniFactoryAddress, yieldBox.address],
        staging,
    );

    return { swapperMock };
}

async function registerUniswapV2(staging?: boolean) {
    const deployer = (await ethers.getSigners())[0];
    const UniswapV2Factory = new UniswapV2Factory__factory(deployer);

    const __uniFactoryFee = ethers.Wallet.createRandom();
    const __uniFactory = await UniswapV2Factory.deploy(__uniFactoryFee.address);
    log(
        `Deployed UniswapV2Factory ${__uniFactory.address} with args [${__uniFactoryFee.address}]`,
        staging,
    );

    const UniswapV2Router02 = new UniswapV2Router02__factory(deployer);
    const __uniRouter = await UniswapV2Router02.deploy(
        __uniFactory.address,
        ethers.constants.AddressZero,
    );
    log(
        `Deployed UniswapV2Router02 ${__uniRouter.address} with args [${__uniFactory.address}, ${ethers.constants.AddressZero}]`,
        staging,
    );

    return { __uniFactory, __uniFactoryFee, __uniRouter };
}

const __wethUsdcPrice = BN(1000).mul((1e18).toString());

export async function uniV2EnvironnementSetup(
    deployerAddress: string,
    __uniFactory: any,
    __uniRouter: any,
    token1: ERC20Mock,
    token2: ERC20Mock,
    token1PairAmount: BigNumber,
    token2PairAmount: BigNumber,
) {
    // Deploy Uni factory, create pair and add liquidity
    await (
        await __uniFactory.createPair(token1.address, token2.address)
    ).wait();

    // Create WETH/USDC LP
    await (await token1.freeMint(token1PairAmount)).wait();
    await (await token2.freeMint(token2PairAmount)).wait();

    await (await token1.approve(__uniRouter.address, token1PairAmount)).wait();
    await (await token2.approve(__uniRouter.address, token2PairAmount)).wait();
    await (
        await __uniRouter.addLiquidity(
            token1.address,
            token2.address,
            token1PairAmount,
            token2PairAmount,
            token1PairAmount,
            token2PairAmount,
            deployerAddress,
            ethers.utils.parseEther('10'),
        )
    ).wait();
    const __wethUsdcMockPair = await __uniFactory.getPair(
        token1.address,
        token2.address,
    );
    await time.increase(86500);
    await time.increase(86500);
    return { __wethUsdcMockPair };
}

async function registersDaiStrategyFork(
    yieldBoxAddres: string,
    daiAddress: string,
    sDaiAddress: string,
    staging?: boolean,
) {
    const deployer = (await ethers.getSigners())[0];
    const TOFTMock = new TOFTMock__factory(deployer);
    const tDai = await TOFTMock.deploy(daiAddress);
    log('Deployed tDai', staging);

    const sDaiStrategyFactory = await ethers.getContractFactory('sDaiStrategy');
    const sDaiStrategy = await sDaiStrategyFactory.deploy(
        yieldBoxAddres,
        tDai.address,
        sDaiAddress,
        deployer.address,
        100, // 1%
        deployer.address,
    );
    await sDaiStrategy.deployed();
    log('Deployed sDaiStrategy', staging);

    return { tDai, sDaiStrategy };
}
async function registerSDaiStrategy(yieldBoxAddres: string, staging?: boolean) {
    const deployer = (await ethers.getSigners())[0];

    const ERC20Mock = new ERC20Mock__factory(deployer);
    const dai = await ERC20Mock.deploy(
        'DAI Mock',
        'DAIM',
        ethers.utils.parseEther('1000'),
        18,
        deployer.address,
    );
    log('Deployed Dai', staging);

    const hasMintRetrictions = await dai.hasMintRestrictions();
    if (hasMintRetrictions) {
        await dai.toggleRestrictions();
    }

    const TOFTMock = new TOFTMock__factory(deployer);
    const tDai = await TOFTMock.deploy(dai.address);
    log('Deployed tDai', staging);

    const SavingsDaiMock = new SavingsDaiMock__factory(deployer);
    const sDai = await SavingsDaiMock.deploy(dai.address);
    log('Deployed sDai', staging);

    const sDaiStrategyFactory = await ethers.getContractFactory('sDaiStrategy');
    const sDaiStrategy = await sDaiStrategyFactory.deploy(
        yieldBoxAddres,
        tDai.address,
        sDai.address,
        deployer.address,
        100,
        deployer.address,
    );
    await sDaiStrategy.deployed();
    log('Deployed sDaiStrategy', staging);

    return { dai, tDai, sDai, sDaiStrategy };
}
export async function createTokenEmptyStrategy(
    yieldBox: string,
    token: string,
) {
    const ERC20WithoutStrategy = new ERC20WithoutStrategy__factory(
        (await ethers.getSigners())[0],
    );
    const noStrategy = await ERC20WithoutStrategy.deploy(yieldBox, token);
    await noStrategy.deployed();
    return noStrategy;
}
export async function registerMocks(staging?: boolean) {
    /**
     * INITIAL SETUP
     */
    const deployer = (await ethers.getSigners())[0];

    log('Deploying Tokens', staging);
    const { usdc, weth } = await registerERC20Tokens(deployer, staging);
    log(
        `Deployed Tokens  USDC: ${usdc.address}, WETH: ${weth.address}`,
        staging,
    );

    log('Deploying UNIV2 Environment', staging);
    const { __uniFactory, __uniFactoryFee, __uniRouter } =
        await registerUniswapV2(staging);
    const wethPairAmount = ethers.BigNumber.from(1e6).mul((1e18).toString());
    const usdcPairAmount = wethPairAmount.mul(
        __wethUsdcPrice.div((1e18).toString()),
    );
    const { __wethUsdcMockPair } = await uniV2EnvironnementSetup(
        deployer.address,
        __uniFactory,
        __uniRouter,
        weth,
        usdc,
        wethPairAmount,
        usdcPairAmount,
    );
    log(
        `Deployed UNIV2 Environment WethUsdcMockPair: ${__wethUsdcMockPair}, UniswapV2Factory: ${__uniFactory.address}, UniswapV2Router02: ${__uniRouter.address}`,
        staging,
    );

    log('Deploying YieldBox', staging);
    const { yieldBox, uriBuilder } = await registerYieldBox(
        weth.address,
        staging,
    );
    log(`Deployed YieldBox ${yieldBox.address}`, staging);

    log('Registering MultiSwapper', staging);
    const { swapperMock } = await registerSwapperMockNew(
        __uniRouter.address,
        __uniFactory.address,
        yieldBox,
        staging,
    );
    log(`Deployed MultiSwapper ${swapperMock.address}`, staging);

    log('Registering UniswapV3SwapperMock', staging);
    const { uniswapV3SwapperMock } = await registerUniswapV3Mock(staging);
    log(
        `Deployed UniswapV3SwapperMock ${uniswapV3SwapperMock.address}`,
        staging,
    );
    log('Deploying sDaiStrategy', staging);
    const { dai, tDai, sDai, sDaiStrategy } = await registerSDaiStrategy(
        yieldBox.address,
        staging,
    );
    log(`Deployed sDaiStrategy ${sDaiStrategy.address}`, staging);
    const wethStrategy = await createTokenEmptyStrategy(
        yieldBox.address,
        weth.address,
    );
    await (
        await yieldBox.registerAsset(1, weth.address, wethStrategy.address, 0)
    ).wait();
    const wethAssetId = await yieldBox.ids(
        1,
        weth.address,
        wethStrategy.address,
        0,
    );

    const usdcStrategy = await createTokenEmptyStrategy(
        yieldBox.address,
        usdc.address,
    );
    await (
        await yieldBox.registerAsset(1, usdc.address, usdcStrategy.address, 0)
    ).wait();
    const usdcAssetId = await yieldBox.ids(
        1,
        usdc.address,
        usdcStrategy.address,
        0,
    );

    const initialSetup = {
        deployer,
        usdc,
        weth,
        dai,
        tDai,
        sDai,
        sDaiStrategy,
        usdcAssetId,
        wethAssetId,
        yieldBox,
        swapperMock,
        uniswapV3SwapperMock,
        wethStrategy,
        usdcStrategy,
        __uniFactory,
        __uniRouter,
        __wethUsdcMockPair,
        uniV2EnvironnementSetup,
    };

    const utilFuncs = {
        BN,
        timeTravel,
    };

    return { ...initialSetup, ...utilFuncs, verifyEtherscanQueue };
}

export async function impersonateAccount(address: string) {
    return network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address],
    });
}
export async function registerFork() {
    await impersonateAccount(process.env.BINANCE_WALLET_ADDRESS!);
    const binanceWallet = await ethers.getSigner(
        process.env.BINANCE_WALLET_ADDRESS!,
    );

    /**
     * INITIAL SETUP
     */
    const deployer = (await ethers.getSigners())[0];

    const eoa1 = new ethers.Wallet(
        ethers.Wallet.createRandom().privateKey,
        ethers.provider,
    );
    await setBalance(eoa1.address, 100000);

    const eoa2 = new ethers.Wallet(
        ethers.Wallet.createRandom().privateKey,
        ethers.provider,
    );
    await setBalance(eoa2.address, 100000);

    log('Using existing Tokens', false);
    const weth = await ethers.getContractAt(
        '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
        process.env.WETH_ADDRESS!,
    );
    const usdc = await ethers.getContractAt(
        '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
        process.env.USDC_ADDRESS!,
    );
    const usdt = await ethers.getContractAt(
        '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
        process.env.USDT_ADDRESS!,
    );
    const dai = await ethers.getContractAt(
        '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
        process.env.DAI_ADDRESS!,
    );

    log(
        `Initialized tokens  USDC: ${usdc.address}, WETH: ${weth.address}`,
        false,
    );

    log('Deploying YieldBox', false);
    const { yieldBox, uriBuilder } = await registerYieldBox(
        weth.address,
        false,
    );
    log(`Deployed YieldBox ${yieldBox.address}`, false);

    const wethStrategy = await createTokenEmptyStrategy(
        yieldBox.address,
        weth.address,
    );
    await (
        await yieldBox.registerAsset(1, weth.address, wethStrategy.address, 0)
    ).wait();
    const wethAssetId = await yieldBox.ids(
        1,
        weth.address,
        wethStrategy.address,
        0,
    );

    const usdcStrategy = await createTokenEmptyStrategy(
        yieldBox.address,
        usdc.address,
    );
    await (
        await yieldBox.registerAsset(1, usdc.address, usdcStrategy.address, 0)
    ).wait();
    const usdcAssetId = await yieldBox.ids(
        1,
        usdc.address,
        usdcStrategy.address,
        0,
    );

    log('Registering MultiSwapper', false);
    const { swapperMock } = await registerSwapperMockNew(
        process.env.UNISWAP_V2_ROUTER!,
        process.env.UNISWAP_V2_FACTORY!,
        yieldBox,
        false,
    );
    log(`Deployed MultiSwapper ${swapperMock.address}`, false);

    log('Registering UniswapV3Swapper', false);
    const { uniswapV3Swapper } = await registerUniswapV3Swapper(
        yieldBox.address,
        process.env.UNISWAP_V3_ROUTER!,
        process.env.UNISWAP_V3_FACTORY!,
    );
    log('Deploying sDaiStrategy', false);
    const { sDaiStrategy, tDai } = await registersDaiStrategyFork(
        yieldBox.address,
        process.env.DAI_ADDRESS!,
        process.env.SDAI!,
        false,
    );
    log(`Deployed sDaiStrategy ${sDaiStrategy.address}`, false);

    const initialSetup = {
        binanceWallet,
        deployer,
        usdc,
        usdt,
        weth,
        dai,
        tDai,
        usdcAssetId,
        wethAssetId,
        yieldBox,
        sDaiStrategy,
        swapperMock,
        eoa1,
        eoa2,
        wethStrategy,
        usdcStrategy,
    };

    const utilFuncs = {
        BN,
        timeTravel,
    };

    return { ...initialSetup, ...utilFuncs, verifyEtherscanQueue };
}

import * as dotenv from 'dotenv';
export function loadNetworkFork() {
    const { NETWORK } = process.env;
    if (!NETWORK || NETWORK === '') {
        throw `Please specify witch environment file you want to use\n \
    E.g: NETWORK={environmentFileHere} yarn hardhat ${process.argv
        .slice(2, process.argv.length)
        .join(' ')}`;
    }
    dotenv.config({ path: `./env/${process.env.NETWORK}.env` });
}
