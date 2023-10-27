import { time } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, BigNumberish } from 'ethers';
import hre, { ethers, network } from 'hardhat';
import {
    UniswapV2Swapper__factory,
    UniswapV3Swapper__factory,
} from '../gitsub_tapioca-sdk/src/typechain/tapioca-periphery';
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
} from '../gitsub_tapioca-sdk/src/typechain/tapioca-mocks';
import { ERC20WithoutStrategy__factory } from '../gitsub_tapioca-sdk/src/typechain/YieldBox';

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

/*
AAVE Strategy
*/

async function deployAaveLendingPoolMock(
    assetAddress: string,
    staging?: boolean,
) {
    const lendingPoolMock = await (
        await ethers.getContractFactory('LendingPoolMock')
    ).deploy(assetAddress);
    await lendingPoolMock.deployed();
    log(
        `Deployed LendingPoolMock ${lendingPoolMock.address} with args [${assetAddress}]`,
        staging,
    );
    await verifyEtherscan(lendingPoolMock.address, [assetAddress], staging);

    return { lendingPoolMock };
}

async function deployStkAaveMock(wethAddress: string, staging?: boolean) {
    const stkAaveMock = await (
        await ethers.getContractFactory('StkAaveMock')
    ).deploy();
    await stkAaveMock.deployed();

    log(`Deployed StkAaveMock ${stkAaveMock.address} with no args`, staging);
    await verifyEtherscan(stkAaveMock.address, [], staging);

    return { stkAaveMock };
}

async function deployAaveIncentivesControllerMock(
    stkAaveTokenAddress: string,
    wethAddress: string,
    staging?: boolean,
) {
    if (stkAaveTokenAddress == ethers.constants.AddressZero) {
        const { stkAaveMock } = await deployStkAaveMock(wethAddress, staging);
        stkAaveTokenAddress = stkAaveMock.address;
    }

    const incentivesControllerMock = await (
        await ethers.getContractFactory('IncentivesControllerMock')
    ).deploy(stkAaveTokenAddress);
    await incentivesControllerMock.deployed();

    log(
        `Deployed IncentivesControllerMock ${incentivesControllerMock.address} with args [${stkAaveTokenAddress}]`,
        staging,
    );
    await verifyEtherscan(
        incentivesControllerMock.address,
        [stkAaveTokenAddress],
        staging,
    );
    return { incentivesControllerMock };
}

async function deployAaveV3Pool(assetAddress: string, staging?: boolean) {
    const aaveV3Pool = await (
        await ethers.getContractFactory('AaveV3PoolMock')
    ).deploy(assetAddress);
    await aaveV3Pool.deployed();
    log(
        `Deployed AaveV3PoolMock ${aaveV3Pool.address} with args [${assetAddress}]`,
        staging,
    );
    await verifyEtherscan(aaveV3Pool.address, [assetAddress], staging);

    return { aaveV3Pool };
}

async function deployAaveV3ReceiptToken(staging?: boolean) {
    const deployer = (await ethers.getSigners())[0];
    const ERC20Mock = new ERC20Mock__factory(deployer);
    const receiptAaveV3 = await ERC20Mock.deploy(
        'AAtoken receipt',
        'aToken',
        ethers.utils.parseEther('100000'),
        18,
        deployer.address,
    );
    await receiptAaveV3['toggleRestrictions()']();
    log(
        `Deployed Receipt AAVE V3 ${
            receiptAaveV3.address
        } with args ['AAtoken receipt', 'aToken', ${
            (ethers.utils.parseEther('100000'), 18, deployer.address)
        }]`,
        staging,
    );
    await verifyEtherscan(
        receiptAaveV3.address,
        [
            'AAtoken receipt',
            'aToken',
            ethers.utils.parseEther('100000'),
            18,
            deployer.address,
        ],
        staging,
    );

    return { receiptAaveV3 };
}

async function registerAaveV3Strategy(
    wethAddress: string,
    yieldBoxAddress: string,
    aaveV3PoolAddress: string,
    receiptAaveV3Address: string,
    stkAaveAddress: string,
    aaveSwapperAddress: string,
    staging?: boolean,
) {
    if (aaveV3PoolAddress == ethers.constants.AddressZero) {
        const { aaveV3Pool } = await deployAaveV3Pool(wethAddress, staging);
        aaveV3PoolAddress = aaveV3Pool.address;
        if (receiptAaveV3Address == ethers.constants.AddressZero) {
            receiptAaveV3Address = await aaveV3Pool.aAsset();
        }
    }

    if (stkAaveAddress == ethers.constants.AddressZero) {
        const { stkAaveMock } = await deployStkAaveMock(wethAddress, staging);
        stkAaveAddress = stkAaveMock.address;
    }

    const deployer = (await ethers.getSigners())[0];
    const ERC20Mock = new ERC20Mock__factory(deployer);
    const lpTokenMock = await ERC20Mock.deploy(
        'LPTokenMock',
        'LPTM',
        ethers.utils.parseEther('100000'),
        18,
        deployer.address,
    );
    await lpTokenMock.updateMintLimit(ethers.utils.parseEther('1000000'));

    const aaveV3Strategy = await (
        await ethers.getContractFactory('AaveV3Strategy')
    ).deploy(
        yieldBoxAddress,
        wethAddress,
        aaveV3PoolAddress,
        receiptAaveV3Address,
        stkAaveAddress,
        aaveSwapperAddress,
    );
    await aaveV3Strategy.deployed();

    log(
        `Deployed AaveV3Strategy ${aaveV3Strategy.address} with args [${yieldBoxAddress},${wethAddress},${aaveV3PoolAddress},${receiptAaveV3Address},${stkAaveAddress},${aaveSwapperAddress}]`,
        staging,
    );
    await verifyEtherscan(
        aaveV3Strategy.address,
        [
            yieldBoxAddress,
            wethAddress,
            aaveV3PoolAddress,
            receiptAaveV3Address,
            stkAaveAddress,
            aaveSwapperAddress,
        ],
        staging,
    );
    return { aaveV3Strategy };
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

    const sDaiFactory = await ethers.getContractFactory('SavingsDaiMock');
    const sDai = await sDaiFactory.deploy(dai.address);
    await sDai.deployed();
    log('Deployed sDai', staging);

    const sDaiStrategyFactory = await ethers.getContractFactory('sDaiStrategy');
    const sDaiStrategy = await sDaiStrategyFactory.deploy(
        yieldBoxAddres,
        tDai.address,
        sDai.address,
        deployer.address,
        100,
    );
    await sDaiStrategy.deployed();
    log('Deployed sDaiStrategy', staging);

    return { dai, tDai, sDai, sDaiStrategy };
}
async function registerAaveStrategy(
    wethAddress: string,
    yieldBoxAddres: string,
    lendingPoolAddress: string,
    stkAaveAddress: string,
    receiptAaveAddress: string,
    incentivesControllerAddress: string,
    aaveSwapperAddress: string,
    staging?: boolean,
) {
    if (lendingPoolAddress == ethers.constants.AddressZero) {
        const { lendingPoolMock } = await deployAaveLendingPoolMock(
            wethAddress,
            staging,
        );
        lendingPoolAddress = lendingPoolMock.address;
    }

    if (stkAaveAddress == ethers.constants.AddressZero) {
        const { stkAaveMock } = await deployStkAaveMock(wethAddress, staging);
        stkAaveAddress = stkAaveMock.address;
    }
    if (incentivesControllerAddress == ethers.constants.AddressZero) {
        const { incentivesControllerMock } =
            await deployAaveIncentivesControllerMock(
                stkAaveAddress,
                wethAddress,
                staging,
            );
        incentivesControllerAddress = incentivesControllerMock.address;
    }

    const aaveStrategy = await (
        await ethers.getContractFactory('AaveStrategy')
    ).deploy(
        yieldBoxAddres,
        wethAddress,
        lendingPoolAddress,
        incentivesControllerAddress,
        receiptAaveAddress,
        aaveSwapperAddress,
    );
    await aaveStrategy.deployed();

    log(
        `Deployed AaveStrategy ${aaveStrategy.address} with args [${yieldBoxAddres},${wethAddress},${lendingPoolAddress}]`,
        staging,
    );
    await verifyEtherscan(
        aaveStrategy.address,
        [yieldBoxAddres, wethAddress, lendingPoolAddress],
        staging,
    );
    return { aaveStrategy };
}

/*
Yearn
*/
async function deployYearnVaultMock(assetAddress: string, staging?: boolean) {
    const vaultMock = await (
        await ethers.getContractFactory('YearnVaultMock')
    ).deploy(assetAddress);
    await vaultMock.deployed();
    log(
        `Deployed YearnVaultMock ${vaultMock.address} with args [${assetAddress}]`,
        staging,
    );
    await verifyEtherscan(vaultMock.address, [assetAddress], staging);

    return { vaultMock };
}
async function registerYearnStrategy(
    wethAddress: string,
    yieldBoxAddres: string,
    vaultAddress: string,
    staging?: boolean,
) {
    if (vaultAddress == ethers.constants.AddressZero) {
        const { vaultMock } = await deployYearnVaultMock(wethAddress, staging);
        vaultAddress = vaultMock.address;
    }

    const yearnStrategy = await (
        await ethers.getContractFactory('YearnStrategy')
    ).deploy(yieldBoxAddres, wethAddress, vaultAddress);
    await yearnStrategy.deployed();

    log(
        `Deployed YearnStrategy ${yearnStrategy.address} with args [${yieldBoxAddres},${wethAddress},${vaultAddress}]`,
        staging,
    );
    await verifyEtherscan(
        yearnStrategy.address,
        [yieldBoxAddres, wethAddress, vaultAddress],
        staging,
    );
    return { yearnStrategy };
}

/*
Stargate
*/

async function deployStargateRouterMock(
    wethAddress: string,
    staging?: boolean,
) {
    const stargateRouterMock = await (
        await ethers.getContractFactory('StargateRouterMock')
    ).deploy(wethAddress);
    await stargateRouterMock.deployed();

    log(
        `Deployed StargateRouterMock ${stargateRouterMock.address} with args [${wethAddress}]`,
        staging,
    );
    await verifyEtherscan(stargateRouterMock.address, [wethAddress], staging);

    return { stargateRouterMock };
}

async function deployStargateRouterETHMock(
    stargateRouterMockAddress: string,
    wethAddress: string,
    staging?: boolean,
) {
    if (stargateRouterMockAddress == ethers.constants.AddressZero) {
        const { stargateRouterMock } = await deployStargateRouterMock(
            wethAddress,
            staging,
        );
        stargateRouterMockAddress = stargateRouterMock.address;
    }

    const deployer = (await ethers.getSigners())[0];
    const ERC20Mock = new ERC20Mock__factory(deployer);
    const lpTokenMock = await ERC20Mock.deploy(
        'LPTokenMock',
        'LPTM',
        ethers.utils.parseEther('100000'),
        18,
        deployer.address,
    );
    await lpTokenMock.updateMintLimit(ethers.utils.parseEther('1000000'));

    const stargateRouterETHMock = await (
        await ethers.getContractFactory('RouterETHMock')
    ).deploy(stargateRouterMockAddress, lpTokenMock.address);
    await stargateRouterETHMock.deployed();
    log(
        `Deployed RouterETHMock ${stargateRouterETHMock.address} with args [${stargateRouterMockAddress}, ${lpTokenMock.address}]`,
        staging,
    );

    await verifyEtherscan(
        stargateRouterETHMock.address,
        [stargateRouterMockAddress, lpTokenMock.address],
        staging,
    );

    return { stargateRouterETHMock, lpTokenMock };
}

async function deployStargateLpStakingMock(
    stgRewardAddress: string,
    lpTokenAddress: string,
    staging?: boolean,
) {
    if (stgRewardAddress == ethers.constants.AddressZero) {
        const deployer = (await ethers.getSigners())[0];
        const ERC20Mock = new ERC20Mock__factory(deployer);
        const stgTokenMock = await ERC20Mock.deploy(
            'STGTokenMock',
            'STGM',
            ethers.utils.parseEther('100000'),
            18,
            deployer.address,
        );
        await stgTokenMock.updateMintLimit(ethers.utils.parseEther('1000000'));

        stgRewardAddress = stgTokenMock.address;
    }

    const lpStakingMock = await (
        await ethers.getContractFactory('LPStakingMock')
    ).deploy(lpTokenAddress, stgRewardAddress);
    await lpStakingMock.deployed();
    log(
        `Deployed LPStakingMock ${lpStakingMock.address} with args [${lpStakingMock.address},${stgRewardAddress}]`,
        staging,
    );
    await verifyEtherscan(
        lpStakingMock.address,
        [lpStakingMock.address, stgRewardAddress],
        staging,
    );

    return { lpStakingMock };
}

async function registerStargateStrategy(
    yieldBoxAddres: string,
    wethAddress: string,
    routerEth: string,
    lpStaking: string,
    lpStakingPid: string,
    lpToken: string,
    swapperAddress: string,
    poolAddress: string,
    staging?: boolean,
) {
    if (routerEth == ethers.constants.AddressZero) {
        const { stargateRouterETHMock, lpTokenMock } =
            await deployStargateRouterETHMock(
                ethers.constants.AddressZero,
                wethAddress,
                staging,
            );
        routerEth = stargateRouterETHMock.address;
        lpToken = lpTokenMock.address;
    }

    if (lpStaking == ethers.constants.AddressZero) {
        const { lpStakingMock } = await deployStargateLpStakingMock(
            ethers.constants.AddressZero,
            lpToken,
            staging,
        );
        lpStaking = lpStakingMock.address;
    }

    if (swapperAddress == ethers.constants.AddressZero) {
        const stargateUniV3SwapperMock = await (
            await ethers.getContractFactory('StargateSwapperV3Mock')
        ).deploy();
        await stargateUniV3SwapperMock.deployed();
        log(
            `Deployed StargateSwapperV3Mock ${stargateUniV3SwapperMock.address} with no arguments`,
            staging,
        );
        await verifyEtherscan(stargateUniV3SwapperMock.address, [], staging);

        swapperAddress = stargateUniV3SwapperMock.address;
    }

    const OracleMock = new OracleMock__factory((await ethers.getSigners())[0]);
    const oracle = await OracleMock.deploy(
        'STGETHLP-WETH',
        'STGETHLP',
        (1e18).toString(),
    );

    const stargateStrategy = await (
        await ethers.getContractFactory('StargateStrategy')
    ).deploy(
        yieldBoxAddres,
        wethAddress,
        routerEth,
        lpStaking,
        lpStakingPid,
        lpToken,
        swapperAddress,
        poolAddress,
        oracle.address,
        ethers.utils.toUtf8Bytes(''),
    );
    await stargateStrategy.deployed();

    log(
        `Deployed StargateStrategy ${stargateStrategy.address} with args [${yieldBoxAddres},${wethAddress},${routerEth},${lpStaking},${lpStakingPid},${lpToken},${swapperAddress},${poolAddress}]`,
        staging,
    );
    await verifyEtherscan(
        stargateStrategy.address,
        [
            yieldBoxAddres,
            wethAddress,
            routerEth,
            lpStaking,
            lpStakingPid,
            lpToken,
            swapperAddress,
            poolAddress,
        ],
        staging,
    );

    return { stargateStrategy };
}

/*
Tricrypto
*/

async function deployTricryptoMinter(
    rewardTokenAddress: string,
    staging?: boolean,
) {
    if (rewardTokenAddress == ethers.constants.AddressZero) {
        const deployer = (await ethers.getSigners())[0];
        const ERC20Mock = new ERC20Mock__factory(deployer);
        const crvTokenMock = await ERC20Mock.deploy(
            'STGTokenMock',
            'STGM',
            ethers.utils.parseEther('100000'),
            18,
            deployer.address,
        );
        await crvTokenMock.updateMintLimit(ethers.utils.parseEther('1000000'));

        rewardTokenAddress = crvTokenMock.address;
    }

    const curveMinterMock = await (
        await ethers.getContractFactory('CurveMinterMock')
    ).deploy(rewardTokenAddress);
    await curveMinterMock.deployed();

    log(
        `Deployed CurveMinterMock ${curveMinterMock.address} with args [${rewardTokenAddress}]`,
        staging,
    );
    await verifyEtherscan(
        curveMinterMock.address,
        [rewardTokenAddress],
        staging,
    );
    return { curveMinterMock };
}

async function deployTricryptoLpGaugeMock(
    liquidityPoolAddress: string,
    wethAddress: string,
    rewardAddress: string,
    staging?: boolean,
) {
    if (liquidityPoolAddress == ethers.constants.AddressZero) {
        const { liquidityPoolMock } = await deployTricryptoLiquidityPoolMock(
            wethAddress,
            staging,
        );
        liquidityPoolAddress = liquidityPoolMock.address;
    }

    const liquidityPoolContract = await ethers.getContractAt(
        'ITricryptoLiquidityPool',
        liquidityPoolAddress,
    );
    const lpTokenAddress = await liquidityPoolContract.token();
    const lpGaugeMock = await (
        await ethers.getContractFactory('TricryptoLPGaugeMock')
    ).deploy(lpTokenAddress, rewardAddress);
    await lpGaugeMock.deployed();

    log(
        `Deployed TricryptoLPGaugeMock ${lpGaugeMock.address} with args [${lpTokenAddress},${rewardAddress}]`,
        staging,
    );
    await verifyEtherscan(
        lpGaugeMock.address,
        [lpTokenAddress, rewardAddress],
        staging,
    );
    return { lpGaugeMock };
}

async function deployTricryptoLiquidityPoolMock(
    wethAddress: string,
    staging?: boolean,
) {
    const liquidityPoolMock = await (
        await ethers.getContractFactory('TricryptoLiquidityPoolMock')
    ).deploy(wethAddress);
    await liquidityPoolMock.deployed();

    log(
        `Deployed TricryptoLiquidityPoolMock ${liquidityPoolMock.address} with args [${wethAddress}]`,
        staging,
    );
    await verifyEtherscan(liquidityPoolMock.address, [wethAddress], staging);

    return { liquidityPoolMock };
}

async function deployTricryptoLPGetter(
    liquidityPoolAddress: string,
    wethAddress: string,
    wbtcAddress: string,
    usdtAddress: string,
    staging?: boolean,
) {
    const tricryptoLPGtter = await (
        await ethers.getContractFactory('TricryptoLPGetter')
    ).deploy(liquidityPoolAddress, usdtAddress, wbtcAddress, wethAddress);
    await tricryptoLPGtter.deployed();

    log(
        `Deployed TricryptoLPGetter ${tricryptoLPGtter.address} with args [${liquidityPoolAddress},${usdtAddress},${wbtcAddress},${wethAddress}]`,
        staging,
    );
    await verifyEtherscan(
        tricryptoLPGtter.address,
        [liquidityPoolAddress, usdtAddress, wbtcAddress, wethAddress],
        staging,
    );

    return { tricryptoLPGtter };
}

async function registerTricryptoNativeStrategy(
    wethAddress: string,
    usdtAddress: string,
    wbtcAddress: string,
    yieldBoxAddres: string,
    liquidityPoolAddress: string,
    lpGaugeAddress: string,
    lpGetterAddress: string,
    rewardTokenAddress: string,
    tricryptoMinterAddress: string,
    swapper: string,
    staging?: boolean,
) {
    if (liquidityPoolAddress == ethers.constants.AddressZero) {
        const { liquidityPoolMock } = await deployTricryptoLiquidityPoolMock(
            wethAddress,
            staging,
        );
        liquidityPoolAddress = liquidityPoolMock.address;
    }
    if (rewardTokenAddress == ethers.constants.AddressZero) {
        const deployer = (await ethers.getSigners())[0];
        const ERC20Mock = new ERC20Mock__factory(deployer);
        const crvTokenMock = await ERC20Mock.deploy(
            'STGTokenMock',
            'STGM',
            ethers.utils.parseEther('100000'),
            18,
            deployer.address,
        );
        const hasMintRetrictionsCrvToken =
            await crvTokenMock.hasMintRestrictions();
        if (hasMintRetrictionsCrvToken) {
            await crvTokenMock.toggleRestrictions();
        }
        await crvTokenMock.updateMintLimit(ethers.utils.parseEther('1000000'));

        rewardTokenAddress = crvTokenMock.address;
    }

    if (lpGaugeAddress == ethers.constants.AddressZero) {
        const { lpGaugeMock } = await deployTricryptoLpGaugeMock(
            liquidityPoolAddress,
            wethAddress,
            rewardTokenAddress,
            staging,
        );
        lpGaugeAddress = lpGaugeMock.address;
    }
    let tricryptoLPGtter: any;
    if (lpGetterAddress == ethers.constants.AddressZero) {
        const tricryptoLPGetterDeployment = await deployTricryptoLPGetter(
            liquidityPoolAddress,
            wethAddress,
            wbtcAddress,
            usdtAddress,
        );
        lpGetterAddress = tricryptoLPGetterDeployment.tricryptoLPGtter.address;
        tricryptoLPGtter = tricryptoLPGetterDeployment.tricryptoLPGtter;
    }

    if (tricryptoMinterAddress == ethers.constants.AddressZero) {
        const { curveMinterMock } = await deployTricryptoMinter(
            rewardTokenAddress,
            staging,
        );
        tricryptoMinterAddress = curveMinterMock.address;
    }

    const tricryptoNativeStrategy = await (
        await ethers.getContractFactory('TricryptoNativeStrategy')
    ).deploy(
        yieldBoxAddres,
        wethAddress,
        lpGaugeAddress,
        lpGetterAddress,
        tricryptoMinterAddress,
        swapper,
    );
    await tricryptoNativeStrategy.deployed();

    log(
        `Deployed TricryptoNativeStrategy ${tricryptoNativeStrategy.address} with args [${yieldBoxAddres},${wethAddress},${lpGaugeAddress},${lpGetterAddress},${tricryptoMinterAddress},${swapper}]`,
        staging,
    );
    await verifyEtherscan(
        tricryptoNativeStrategy.address,
        [
            yieldBoxAddres,
            wethAddress,
            lpGaugeAddress,
            lpGetterAddress,
            tricryptoMinterAddress,
            swapper,
        ],
        staging,
    );

    return { tricryptoNativeStrategy, tricryptoLPGtter };
}

async function registerTricryptoLPStrategy(
    wethAddress: string,
    usdtAddress: string,
    wbtcAddress: string,
    yieldBoxAddres: string,
    liquidityPoolAddress: string,
    lpGaugeAddress: string,
    lpGetterAddress: string,
    rewardTokenAddress: string,
    tricryptoMinterAddress: string,
    swapper: string,
    staging?: boolean,
) {
    if (liquidityPoolAddress == ethers.constants.AddressZero) {
        const { liquidityPoolMock } = await deployTricryptoLiquidityPoolMock(
            wethAddress,
            staging,
        );
        liquidityPoolAddress = liquidityPoolMock.address;
    }
    if (rewardTokenAddress == ethers.constants.AddressZero) {
        const deployer = (await ethers.getSigners())[0];
        const ERC20Mock = new ERC20Mock__factory(deployer);
        const crvTokenMock = await ERC20Mock.deploy(
            'STGTokenMock',
            'STGM',
            ethers.utils.parseEther('100000'),
            18,
            deployer.address,
        );
        const hasMintRetrictionsCrvToken =
            await crvTokenMock.hasMintRestrictions();
        if (hasMintRetrictionsCrvToken) {
            await crvTokenMock.toggleRestrictions();
        }
        await crvTokenMock.updateMintLimit(ethers.utils.parseEther('1000000'));

        rewardTokenAddress = crvTokenMock.address;
    }

    if (lpGaugeAddress == ethers.constants.AddressZero) {
        const { lpGaugeMock } = await deployTricryptoLpGaugeMock(
            liquidityPoolAddress,
            wethAddress,
            rewardTokenAddress,
            staging,
        );
        lpGaugeAddress = lpGaugeMock.address;
    }
    let tricryptoLPGtter: any;
    if (lpGetterAddress == ethers.constants.AddressZero) {
        const tricryptoLPGetterDeployment = await deployTricryptoLPGetter(
            liquidityPoolAddress,
            wethAddress,
            wbtcAddress,
            usdtAddress,
        );
        lpGetterAddress = tricryptoLPGetterDeployment.tricryptoLPGtter.address;
        tricryptoLPGtter = tricryptoLPGetterDeployment.tricryptoLPGtter;
    }

    if (tricryptoMinterAddress == ethers.constants.AddressZero) {
        const { curveMinterMock } = await deployTricryptoMinter(
            rewardTokenAddress,
            staging,
        );
        tricryptoMinterAddress = curveMinterMock.address;
    }

    const tricryptoLPStrategy = await (
        await ethers.getContractFactory('TricryptoLPStrategy')
    ).deploy(
        yieldBoxAddres,
        wethAddress,
        lpGaugeAddress,
        lpGetterAddress,
        tricryptoMinterAddress,
        swapper,
    );
    await tricryptoLPStrategy.deployed();

    log(
        `Deployed TricryptoLPStrategy ${tricryptoLPStrategy.address} with args [${yieldBoxAddres},${wethAddress},${lpGaugeAddress},${lpGetterAddress},${tricryptoMinterAddress},${swapper}]`,
        staging,
    );
    await verifyEtherscan(
        tricryptoLPStrategy.address,
        [
            yieldBoxAddres,
            wethAddress,
            lpGaugeAddress,
            lpGetterAddress,
            tricryptoMinterAddress,
            swapper,
        ],
        staging,
    );

    return { tricryptoLPStrategy, tricryptoLPGtter };
}

/*
Lido stEth
*/

async function deployStEtEThMock(staging?: boolean) {
    const stEthMock = await (
        await ethers.getContractFactory('StEthMock')
    ).deploy(ethers.utils.parseEther('100000'));
    await stEthMock.deployed();

    log(
        `Deployed StEthMock ${
            stEthMock.address
        } with args [${ethers.utils.parseEther('100000')}]`,
        staging,
    );
    await verifyEtherscan(
        stEthMock.address,
        [ethers.utils.parseEther('100000')],
        staging,
    );

    return { stEthMock };
}

async function deployCurveStEthPoolMock(
    stEthAddress: string,
    staging?: boolean,
) {
    if (stEthAddress == ethers.constants.AddressZero) {
        const { stEthMock } = await deployStEtEThMock(staging);
        stEthAddress = stEthMock.address;
    }
    const curveStEthPoolMock = await (
        await ethers.getContractFactory('CurveEthStEthPoolMock')
    ).deploy(stEthAddress);
    await curveStEthPoolMock.deployed();

    log(
        `Deployed CurveEthStEthPoolMock ${curveStEthPoolMock.address} with args [${stEthAddress}]`,
        staging,
    );
    await verifyEtherscan(curveStEthPoolMock.address, [stEthAddress], staging);

    return { curveStEthPoolMock };
}

async function registerLidoStEthStrategy(
    wethAddress: string,
    yieldBoxAddres: string,
    stEthAddress: string,
    curveSthEThPoolAddress: string,
    staging?: boolean,
) {
    if (stEthAddress == ethers.constants.AddressZero) {
        const { stEthMock } = await deployStEtEThMock(staging);
        stEthAddress = stEthMock.address;
    }
    if (curveSthEThPoolAddress == ethers.constants.AddressZero) {
        const { curveStEthPoolMock } = await deployCurveStEthPoolMock(
            stEthAddress,
        );
        curveSthEThPoolAddress = curveStEthPoolMock.address;
    }

    const OracleMock = new OracleMock__factory((await ethers.getSigners())[0]);
    const mockOracle = await OracleMock.deploy(
        'WETHUSD0Mock',
        'WSM',
        (1e18).toString(),
    );
    await mockOracle.deployed();
    log(`Deployed mock oracle at ${mockOracle.address}`, staging);

    const lidoEthStrategy = await (
        await ethers.getContractFactory('LidoEthStrategy')
    ).deploy(
        yieldBoxAddres,
        wethAddress,
        stEthAddress,
        curveSthEThPoolAddress,
        mockOracle.address,
        ethers.utils.toUtf8Bytes(''),
    );
    await lidoEthStrategy.deployed();

    log(
        `Deployed LidoEthStrategy ${lidoEthStrategy.address} with args [${yieldBoxAddres},${wethAddress},${stEthAddress},${curveSthEThPoolAddress}]`,
        staging,
    );
    await verifyEtherscan(
        lidoEthStrategy.address,
        [yieldBoxAddres, wethAddress, stEthAddress, curveSthEThPoolAddress],
        staging,
    );

    return { lidoEthStrategy };
}

/*
Compound
*/

async function deployCToken(wethAddress: string, staging?: boolean) {
    const comptrollerMock = await (
        await ethers.getContractFactory('ComptrollerMock')
    ).deploy();
    await comptrollerMock.deployed();

    const cTokenMock = await (
        await ethers.getContractFactory('CTokenMock')
    ).deploy(wethAddress, comptrollerMock.address);
    await cTokenMock.deployed();

    log(
        `Deployed CTokenMock ${cTokenMock.address} with args [${wethAddress}, ${comptrollerMock.address}]`,
        staging,
    );

    await verifyEtherscan(
        cTokenMock.address,
        [wethAddress, comptrollerMock.address],
        staging,
    );

    return { cTokenMock };
}

async function registerCompoundStrategy(
    yieldBoxAddres: string,
    wethAddress: string,
    cTokenAddress: string,
    swapperAddress: string,
    staging?: boolean,
) {
    if (cTokenAddress == ethers.constants.AddressZero) {
        const { cTokenMock } = await deployCToken(wethAddress, staging);
        cTokenAddress = cTokenMock.address;
    }

    const compoundStrategy = await (
        await ethers.getContractFactory('CompoundStrategy')
    ).deploy(yieldBoxAddres, wethAddress, cTokenAddress, swapperAddress);
    await compoundStrategy.deployed();

    log(
        `Deployed CompoundStrategy ${compoundStrategy.address} with args [${yieldBoxAddres},${wethAddress},${cTokenAddress}, ${swapperAddress}]`,
        staging,
    );

    await verifyEtherscan(
        compoundStrategy.address,
        [yieldBoxAddres, wethAddress, cTokenAddress, swapperAddress],
        staging,
    );
    return { compoundStrategy };
}

/*
Balancer
*/

async function deployStablePoolMock(staging?: boolean) {
    const stablePoolMock = await (
        await ethers.getContractFactory('BalancerPoolMock')
    ).deploy();
    await stablePoolMock.deployed();

    log(
        `Deployed BalancerPoolMock ${stablePoolMock.address} with no arguments`,
        staging,
    );

    await verifyEtherscan(stablePoolMock.address, [], staging);

    return { stablePoolMock };
}

async function deployGaugeMock(stablePoolAddress: string, staging?: boolean) {
    if (stablePoolAddress == ethers.constants.AddressZero) {
        const { stablePoolMock } = await deployStablePoolMock(staging);
        stablePoolAddress = stablePoolMock.address;
    }

    const rewardTokenInitialBalance = ethers.utils.parseEther('100000000');

    const deployer = (await ethers.getSigners())[0];
    const ERC20Mock = new ERC20Mock__factory(deployer);
    const rewardToken1 = await ERC20Mock.deploy(
        'RewardToken1Mock',
        'ONEM',
        rewardTokenInitialBalance,
        18,
        deployer.address,
    );
    await rewardToken1.updateMintLimit(rewardTokenInitialBalance.mul(10));
    log(
        `Deployed RewardToken1 ${rewardToken1.address} with args [${rewardTokenInitialBalance}]`,
        staging,
    );
    await verifyEtherscan(
        rewardToken1.address,
        [rewardTokenInitialBalance],
        staging,
    );

    const rewardToken2 = await ERC20Mock.deploy(
        'RewardToken2Mock',
        'TWOM',
        rewardTokenInitialBalance,
        18,
        deployer.address,
    );
    await rewardToken2.updateMintLimit(rewardTokenInitialBalance.mul(10));
    log(
        `Deployed RewardToken2 ${rewardToken2.address} with args [${rewardTokenInitialBalance}]`,
        staging,
    );
    await verifyEtherscan(
        rewardToken2.address,
        [rewardTokenInitialBalance],
        staging,
    );

    const gaugeMock = await (
        await ethers.getContractFactory('BalancerGaugeMock')
    ).deploy(stablePoolAddress, rewardToken1.address, rewardToken2.address);
    await gaugeMock.deployed();
    log(
        `Deployed BalancerGaugeMock ${gaugeMock.address} with args [${stablePoolAddress},${rewardToken1.address},${rewardToken2.address}]`,
        staging,
    );
    await verifyEtherscan(
        gaugeMock.address,
        [stablePoolAddress, rewardToken1.address, rewardToken2.address],
        staging,
    );

    return { gaugeMock, rewardToken1, rewardToken2 };
}
async function deployBalancerVaultMock(
    stablePoolAddress: string,
    wethAddress: string,
    staging?: boolean,
) {
    if (stablePoolAddress == ethers.constants.AddressZero) {
        const { stablePoolMock } = await deployStablePoolMock(staging);
        stablePoolAddress = stablePoolMock.address;
    }

    const vaultMock = await (
        await ethers.getContractFactory('BalancerVaultMock')
    ).deploy(stablePoolAddress, wethAddress);
    await vaultMock.deployed();

    log(
        `Deployed BalancerVaultMock ${vaultMock.address} with args [${stablePoolAddress},${wethAddress}]`,
        staging,
    );

    await verifyEtherscan(
        vaultMock.address,
        [stablePoolAddress, wethAddress],
        staging,
    );

    return { vaultMock };
}

async function deployBalancerHelpersMock(staging?: boolean) {
    const balancerHelpersMock = await (
        await ethers.getContractFactory('BalancerHelpersMock')
    ).deploy();
    await balancerHelpersMock.deployed();

    log(
        `Deployed BalancerHelpersMock ${balancerHelpersMock.address} with no args`,
        staging,
    );

    await verifyEtherscan(balancerHelpersMock.address, [], staging);

    return { balancerHelpersMock };
}

async function registerBalancerStrategy(
    wethAddress: string,
    yieldBoxAddres: string,
    stablePoolAddress: string, //lp token
    vaultAddress: string,
    poolId: string,
    balancerTokenAddress: string,
    balancerHelperAddress: string,
    staging?: boolean,
) {
    if (stablePoolAddress == ethers.constants.AddressZero) {
        const { stablePoolMock } = await deployStablePoolMock(staging);
        stablePoolAddress = stablePoolMock.address;
    }

    if (vaultAddress == ethers.constants.AddressZero) {
        const { vaultMock } = await deployBalancerVaultMock(
            stablePoolAddress,
            wethAddress,
            staging,
        );
        vaultAddress = vaultMock.address;
    }

    if (balancerHelperAddress == ethers.constants.AddressZero) {
        const { balancerHelpersMock } = await deployBalancerHelpersMock(
            staging,
        );
        balancerHelperAddress = balancerHelpersMock.address;
    }

    const balancerStrategy = await (
        await ethers.getContractFactory('BalancerStrategy')
    ).deploy(
        yieldBoxAddres,
        wethAddress,
        vaultAddress,
        poolId,
        balancerTokenAddress,
        balancerHelperAddress,
    );
    await balancerStrategy.deployed();
    log(
        `Deployed BalancerStrategy ${balancerStrategy.address} with args [${yieldBoxAddres},${wethAddress},${vaultAddress},${poolId},${balancerTokenAddress}]`,
        staging,
    );
    await verifyEtherscan(
        balancerStrategy.address,
        [
            yieldBoxAddres,
            wethAddress,
            vaultAddress,
            poolId,
            balancerTokenAddress,
        ],
        staging,
    );

    return { balancerStrategy };
}

/*
Convex Tricrypto
*/
async function deployConvexRewardPool(
    lpTokenAddress: string,
    staging?: boolean,
) {
    const deployer = (await ethers.getSigners())[0];
    const ERC20Mock = new ERC20Mock__factory(deployer);
    const cvxTokenMock = await ERC20Mock.deploy(
        'CVXTokenMock',
        'CVXM',
        ethers.utils.parseEther('10000000'),
        18,
        deployer.address,
    );
    await cvxTokenMock.updateMintLimit(ethers.utils.parseEther('100000000'));

    log(
        `Deployed CvxTokenMock ${
            cvxTokenMock.address
        } with args [${ethers.utils.parseEther('10000000')}]`,
        staging,
    );

    await verifyEtherscan(
        cvxTokenMock.address,
        [ethers.utils.parseEther('10000000')],
        staging,
    );

    //--
    const convexRewardPoolMock = await (
        await ethers.getContractFactory('ConvexRewardPoolMock')
    ).deploy(lpTokenAddress, cvxTokenMock.address);
    await convexRewardPoolMock.deployed();

    log(
        `Deployed ConvexRewardPoolMock ${convexRewardPoolMock.address} with args [${lpTokenAddress},${cvxTokenMock.address}]`,
        staging,
    );
    await verifyEtherscan(
        convexRewardPoolMock.address,
        [lpTokenAddress, cvxTokenMock.address],
        staging,
    );
    return { cvxTokenMock, convexRewardPoolMock };
}

async function deployConvexBoosterMock(
    lpTokenAddress: string,
    rewardPoolAddress: string,
    staging?: boolean,
) {
    const deployer = (await ethers.getSigners())[0];
    const ERC20Mock = new ERC20Mock__factory(deployer);
    const receiptTokenMock = await ERC20Mock.deploy(
        'ReceiptTokenMock',
        'RCTM',
        ethers.utils.parseEther('10000000'),
        18,
        deployer.address,
    );
    await receiptTokenMock.updateMintLimit(
        ethers.utils.parseEther('100000000'),
    );

    log(
        `Deployed ReceiptTokenMock ${
            receiptTokenMock.address
        } with args [${ethers.utils.parseEther('10000000')}]`,
        staging,
    );

    await verifyEtherscan(
        receiptTokenMock.address,
        [ethers.utils.parseEther('10000000')],
        staging,
    );

    //--
    const convexBoosterMock = await (
        await ethers.getContractFactory('ConvexBoosterMock')
    ).deploy(lpTokenAddress, receiptTokenMock.address, rewardPoolAddress);
    await convexBoosterMock.deployed();

    log(
        `Deployed ConvexBoosterMock ${receiptTokenMock.address} with args [${lpTokenAddress},${receiptTokenMock.address},${rewardPoolAddress}]`,
        staging,
    );

    await verifyEtherscan(
        receiptTokenMock.address,
        [lpTokenAddress, receiptTokenMock.address, rewardPoolAddress],
        staging,
    );

    return { receiptTokenMock, convexBoosterMock };
}

async function deployConvexZapMock(staging?: boolean) {
    const deployer = (await ethers.getSigners())[0];
    const ERC20Mock = new ERC20Mock__factory(deployer);
    const reward1Mock = await ERC20Mock.deploy(
        'RewardToken1Mock',
        'ONEM',
        ethers.utils.parseEther('10000000'),
        18,
        deployer.address,
    );
    await reward1Mock.updateMintLimit(ethers.utils.parseEther('100000000'));
    log(
        `Deployed Reward1 ${
            reward1Mock.address
        } with args [${ethers.utils.parseEther('10000000')}]`,
        staging,
    );

    await verifyEtherscan(
        reward1Mock.address,
        [ethers.utils.parseEther('10000000')],
        staging,
    );

    //--

    const reward2Mock = await ERC20Mock.deploy(
        'RewardToken2Mock',
        'TWOM',
        ethers.utils.parseEther('10000000'),
        18,
        deployer.address,
    );
    await reward2Mock.updateMintLimit(ethers.utils.parseEther('100000000'));
    log(
        `Deployed Reward2 ${
            reward2Mock.address
        } with args [${ethers.utils.parseEther('10000000')}]`,
        staging,
    );

    await verifyEtherscan(
        reward2Mock.address,
        [ethers.utils.parseEther('10000000')],
        staging,
    );

    //-
    const convexZapMock = await (
        await ethers.getContractFactory('ConvexZapMock')
    ).deploy(reward1Mock.address, reward2Mock.address);
    await convexZapMock.deployed();

    log(
        `Deployed ConvexZapMock ${convexZapMock.address} with args [${reward1Mock.address},${reward2Mock.address}]`,
        staging,
    );

    await verifyEtherscan(
        convexZapMock.address,
        [reward1Mock.address, reward2Mock.address],
        staging,
    );

    return { reward1Mock, reward2Mock, convexZapMock };
}

async function registerConvexStrategy(
    yieldBoxAddress: string,
    wethAddress: string,
    usdtAddress: string,
    wbtcAddress: string,
    curveLiquidityPoolAddress: string,
    lpGetterAddress: string,
    boosterAddress: string,
    rewardPoolAddress: string,
    zapAddress: string,
    swapperAddress: string,
    staging?: boolean,
) {
    if (curveLiquidityPoolAddress == ethers.constants.AddressZero) {
        const { liquidityPoolMock } = await deployTricryptoLiquidityPoolMock(
            wethAddress,
            staging,
        );
        curveLiquidityPoolAddress = liquidityPoolMock.address;
    }

    const liquidityPoolContract = await ethers.getContractAt(
        'ITricryptoLiquidityPool',
        curveLiquidityPoolAddress,
    );
    const lpTokenAddress = await liquidityPoolContract.token();

    let tricryptoLPGtter: any;
    if (lpGetterAddress == ethers.constants.AddressZero) {
        const tricryptoLPGetterDeployment = await deployTricryptoLPGetter(
            curveLiquidityPoolAddress,
            wethAddress,
            wbtcAddress,
            usdtAddress,
        );
        lpGetterAddress = tricryptoLPGetterDeployment.tricryptoLPGtter.address;
        tricryptoLPGtter = tricryptoLPGetterDeployment.tricryptoLPGtter;
    }

    let cvxMock;
    if (rewardPoolAddress == ethers.constants.AddressZero) {
        const { cvxTokenMock, convexRewardPoolMock } =
            await deployConvexRewardPool(lpTokenAddress, staging);
        cvxMock = cvxTokenMock;
        rewardPoolAddress = convexRewardPoolMock.address;
    }

    let receiptToken;
    if (boosterAddress == ethers.constants.AddressZero) {
        const { receiptTokenMock, convexBoosterMock } =
            await deployConvexBoosterMock(
                lpTokenAddress,
                rewardPoolAddress,
                staging,
            );
        receiptToken = receiptTokenMock;
        boosterAddress = convexBoosterMock.address;
    }

    let cvxReward1Token, cvxReward2Token;
    if (zapAddress == ethers.constants.AddressZero) {
        const { reward1Mock, reward2Mock, convexZapMock } =
            await deployConvexZapMock(staging);
        cvxReward1Token = reward1Mock;
        cvxReward2Token = reward2Mock;
        zapAddress = convexZapMock.address;
    }

    const convexTricryptoStrategy = await (
        await ethers.getContractFactory('ConvexTricryptoStrategy')
    ).deploy(
        yieldBoxAddress,
        wethAddress,
        rewardPoolAddress,
        boosterAddress,
        zapAddress,
        lpGetterAddress,
        swapperAddress,
    );
    await convexTricryptoStrategy.deployed();

    log(
        `Deployed ConvexTricryptoStrategy ${convexTricryptoStrategy.address} with args [${yieldBoxAddress},${wethAddress},${rewardPoolAddress},${boosterAddress},${zapAddress},${lpGetterAddress},${swapperAddress}]`,
        staging,
    );

    await verifyEtherscan(
        convexTricryptoStrategy.address,
        [
            yieldBoxAddress,
            wethAddress,
            rewardPoolAddress,
            boosterAddress,
            zapAddress,
            lpGetterAddress,
            swapperAddress,
        ],
        staging,
    );

    return { convexTricryptoStrategy, cvxReward1Token, cvxReward2Token };
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

    log('Deploying AaveStrategy', staging);
    const { aaveStrategy } = await registerAaveStrategy(
        weth.address,
        yieldBox.address,
        ethers.constants.AddressZero, //lending pool
        ethers.constants.AddressZero, //stkAave
        ethers.constants.AddressZero, //receipt
        ethers.constants.AddressZero, //incentives controller
        swapperMock.address, //swapper
        staging,
    );
    log(`Deployed AaveStrategy ${aaveStrategy.address}`, staging);

    log('Deploying AaveV3Strategy', staging);
    const { aaveV3Strategy } = await registerAaveV3Strategy(
        weth.address,
        yieldBox.address,
        ethers.constants.AddressZero, //aave v3 pool
        ethers.constants.AddressZero, //aave v3 pool
        ethers.constants.AddressZero, //stk aave
        uniswapV3SwapperMock.address, //swapper
        staging,
    );
    log(`Deployed AaveV3Strategy ${aaveV3Strategy.address}`, staging);

    log('Deploying YearnStrategy', staging);
    const { yearnStrategy } = await registerYearnStrategy(
        weth.address,
        yieldBox.address,
        ethers.constants.AddressZero,
        staging,
    );
    log(`Deployed YearnStrategy ${yearnStrategy.address}`, staging);

    log('Deploying StargateStrategy', staging);
    const { stargateStrategy } = await registerStargateStrategy(
        yieldBox.address,
        weth.address,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        '0',
        ethers.constants.AddressZero,
        uniswapV3SwapperMock.address,
        weth.address,
        staging,
    );
    log(`Deployed StargateStrategy ${stargateStrategy.address}`, staging);

    log('Deploying TricryptoNativeStrategy', staging);
    const { tricryptoNativeStrategy, tricryptoLPGtter } =
        await registerTricryptoNativeStrategy(
            weth.address,
            usdc.address,
            usdc.address,
            yieldBox.address,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            uniswapV3SwapperMock.address,
            staging,
        );
    log(
        `Deployed TricryptoNativeStrategy ${tricryptoNativeStrategy.address}`,
        staging,
    );

    log('Deploying TricryptoLPStrategy', staging);
    const tricryptoLpStrategyData = await registerTricryptoLPStrategy(
        weth.address,
        usdc.address,
        usdc.address,
        yieldBox.address,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        uniswapV3SwapperMock.address,
        staging,
    );

    const tricryptoLPStrategy = tricryptoLpStrategyData.tricryptoLPStrategy;
    const tricryptoLPStrategyLpGetter =
        tricryptoLpStrategyData.tricryptoLPGtter;

    log(
        `Deployed TricryptoNativeStrTricryptoLPStrategyategy ${tricryptoLPStrategy.address}`,
        staging,
    );

    log('Deploying Lido ETH Strategy', staging);
    const { lidoEthStrategy } = await registerLidoStEthStrategy(
        weth.address,
        yieldBox.address,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        staging,
    );
    log(`Deployed Lido ETH Strategy ${lidoEthStrategy.address}`, staging);

    log('Deploying CompoundStrategy', staging);
    const { compoundStrategy } = await registerCompoundStrategy(
        yieldBox.address,
        weth.address,
        ethers.constants.AddressZero,
        swapperMock.address, //swapper
        staging,
    );
    log(`Deployed CompoundStrategy ${compoundStrategy.address}`, staging);

    log('Deploying BalancerStrategy', staging);
    const { balancerStrategy } = await registerBalancerStrategy(
        weth.address,
        yieldBox.address,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
        weth.address,
        ethers.constants.AddressZero,
        staging,
    );
    log(`Deployed BalancerStrategy ${balancerStrategy.address}`, staging);

    log('Deploying ConvexTricryptoStrategy', staging);
    const { convexTricryptoStrategy, cvxReward1Token, cvxReward2Token } =
        await registerConvexStrategy(
            yieldBox.address,
            weth.address,
            weth.address,
            weth.address,
            ethers.constants.AddressZero, //curve liquidity pool
            ethers.constants.AddressZero, //lp getter
            ethers.constants.AddressZero, //booster
            ethers.constants.AddressZero, //reward pool
            ethers.constants.AddressZero, //zap
            swapperMock.address,
            staging,
        );
    log(
        `Deployed ConvexTricryptoStrategy ${convexTricryptoStrategy.address}`,
        staging,
    );

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
        aaveStrategy,
        aaveV3Strategy,
        yearnStrategy,
        stargateStrategy,
        tricryptoNativeStrategy,
        tricryptoLPStrategy,
        tricryptoLPGtter,
        lidoEthStrategy,
        compoundStrategy,
        balancerStrategy,
        convexTricryptoStrategy,
        cvxReward1Token,
        cvxReward2Token,
        deployTricryptoLPGetter,
        swapperMock,
        uniswapV3SwapperMock,
        wethStrategy,
        usdcStrategy,
        __uniFactory,
        __uniRouter,
        __wethUsdcMockPair,
        uniV2EnvironnementSetup,
        tricryptoLPStrategyLpGetter,
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
        '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20',
        process.env.WETH_ADDRESS!,
    );
    const usdc = await ethers.getContractAt(
        '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20',
        process.env.USDC_ADDRESS!,
    );
    const usdt = await ethers.getContractAt(
        '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20',
        process.env.USDT_ADDRESS!,
    );
    const dai = await ethers.getContractAt(
        '@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20',
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

    log('Deploying AaveStrategy', false);
    const { aaveStrategy } = await registerAaveStrategy(
        weth.address,
        yieldBox.address,
        process.env.AAVE_LENDING_POOL!, //lending pool
        process.env.AAVE_STK!, //stkAave
        process.env.AAVE_RECEIPT_TOKEN!, //receipt
        process.env.AAVE_INCENTIVES_CONTROLLER!, //incentives controller
        swapperMock.address, //swapper
        false,
    );
    log(`Deployed AaveStrategy ${aaveStrategy.address}`, false);

    log('Deploying AaveV3Strategy', false);
    const { aaveV3Strategy } = await registerAaveV3Strategy(
        weth.address,
        yieldBox.address,
        process.env.AAVE_V3_POOL!, //lending pool
        process.env.AAVE_V3_RECEIPT_TOKEN,
        process.env.AAVE_STK!, //stkAave
        swapperMock.address, //swapper
        false,
    );
    log(`Deployed AaveV3Strategy ${aaveStrategy.address}`, false);

    log('Deploying YearnStrategy', false);
    const { yearnStrategy } = await registerYearnStrategy(
        weth.address,
        yieldBox.address,
        process.env.YEARN_ETH_VAULT!,
        false,
    );
    log(`Deployed YearnStrategy ${yearnStrategy.address}`, false);

    log('Deploying StargateStrategy', false);

    const { stargateStrategy } = await registerStargateStrategy(
        yieldBox.address,
        weth.address,
        process.env.STARGATE_ROUTER_ETH!,
        process.env.STARGATE_LP_STAKING!,
        process.env.STARGATE_LP_STAKING_PID!,
        process.env.STARGATE_LP_TOKEN!,
        uniswapV3Swapper.address,
        process.env.STARGATE_UNISWAPV3_POOL!,
        false,
    );
    log(`Deployed StargateStrategy ${stargateStrategy.address}`, false);

    log('Deploying TricryptoNativeStrategy', false);
    const { tricryptoNativeStrategy, tricryptoLPGtter } =
        await registerTricryptoNativeStrategy(
            weth.address,
            process.env.USDT_ADDRESS!,
            process.env.WBTC_ADDRESS!,
            yieldBox.address,
            process.env.TRICRYPTO_LIQUIDITY_POOL!,
            process.env.TRICRYPTO_LP_GAUGE!,
            ethers.constants.AddressZero, //lp getter
            process.env.CRV_ADDRESS!,
            process.env.TRICRYPTO_MINTER!,
            swapperMock.address,
            false,
        );
    log(
        `Deployed TricryptoNativeStrategy ${tricryptoNativeStrategy.address}`,
        false,
    );

    log('Deploying TricryptoLPStrategy', false);
    const { tricryptoLPStrategy } = await registerTricryptoLPStrategy(
        weth.address,
        process.env.USDT_ADDRESS!,
        process.env.WBTC_ADDRESS!,
        yieldBox.address,
        process.env.TRICRYPTO_LIQUIDITY_POOL!,
        process.env.TRICRYPTO_LP_GAUGE!,
        tricryptoLPGtter.address,
        process.env.CRV_ADDRESS!,
        process.env.TRICRYPTO_MINTER!,
        swapperMock.address,
        false,
    );
    log(`Deployed TricryptoLPStrategy ${tricryptoLPStrategy.address}`, false);

    log('Deploying Lido ETH Strategy', false);
    const { lidoEthStrategy } = await registerLidoStEthStrategy(
        weth.address,
        yieldBox.address,
        process.env.LIDO_STETH!, //steth
        process.env.CURVE_STETH_POOL!, //curve steth
        false,
    );
    log(`Deployed Lido ETH Strategy ${lidoEthStrategy.address}`, false);

    log('Deploying CompoundStrategy', false);
    const { compoundStrategy } = await registerCompoundStrategy(
        yieldBox.address,
        weth.address,
        process.env.COMPOUND_ETH!,
        swapperMock.address,
        false,
    );
    log(`Deployed CompoundStrategy ${compoundStrategy.address}`, false);

    log('Deploying BalancerStrategy', false);

    const { balancerStrategy } = await registerBalancerStrategy(
        weth.address,
        yieldBox.address,
        process.env.BALANCER_POOL!, //stable pool
        process.env.BALANCER_BAL_ETH_VAULT!, //vault address
        process.env.BALANCER_POOL_ID!, //pool id
        process.env.BALANCER_TOKEN!,
        process.env.BALANCER_HELPERS!,
        false,
    );
    log(`Deployed BalancerStrategy ${balancerStrategy.address}`, false);

    log('Deploying ConvexTricryptoStrategy', false);
    const { convexTricryptoStrategy, cvxReward1Token, cvxReward2Token } =
        await registerConvexStrategy(
            yieldBox.address,
            weth.address,
            process.env.USDT_ADDRESS!,
            process.env.WBTC_ADDRESS!,
            process.env.TRICRYPTO_LIQUIDITY_POOL!, //curve liquidity pool
            ethers.constants.AddressZero, //lp getter
            process.env.CONVEX_BOOSTER!, //booster
            process.env.CONVEX_TRICRYPTO_REWARD_POOL!, //reward pool
            process.env.CONVEX_ZAP!, //zap
            swapperMock.address,
            false,
        );
    log(
        `Deployed ConvexTricryptoStrategy ${convexTricryptoStrategy.address}`,
        false,
    );

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
        aaveStrategy,
        aaveV3Strategy,
        yearnStrategy,
        stargateStrategy,
        tricryptoLPGtter,
        tricryptoNativeStrategy,
        tricryptoLPStrategy,
        lidoEthStrategy,
        compoundStrategy,
        balancerStrategy,
        convexTricryptoStrategy,
        swapperMock,
        deployTricryptoLPGetter,
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
