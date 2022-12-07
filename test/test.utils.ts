import { time } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, BigNumberish } from 'ethers';
import hre, { ethers, getChainId, network } from 'hardhat';
import { any } from 'hardhat/internal/core/params/argumentTypes';

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

const gasPrice = 72000000000; //55gwei
const log = (message: string, staging?: boolean) =>
    staging && console.log(message);

async function resetVM() {
    await ethers.provider.send('hardhat_reset', []);
}

const timeTravel = async (seconds: number) => {
    await time.increase(seconds);
};

function BN(n: BigNumberish) {
    return ethers.BigNumber.from(n.toString());
}

export async function setBalance(addr: string, ether: number) {
    await ethers.provider.send('hardhat_setBalance', [
        addr,
        ethers.utils.hexStripZeros(ethers.utils.parseEther(String(ether))._hex),
    ]);
}

async function registerERC20Tokens(staging?: boolean) {
    const supplyStart = ethers.BigNumber.from((1e18).toString()).mul(1e9);

    // Deploy USDC and WETH
    const usdc = await (
        await ethers.getContractFactory('ERC20Mock')
    ).deploy(supplyStart, { gasPrice: gasPrice });
    await usdc.deployed();
    log(`Deployed USDC ${usdc.address} with args [${supplyStart}]`, staging);

    const weth = await (
        await ethers.getContractFactory('WETH9Mock')
    ).deploy({ gasPrice: gasPrice });
    await weth.deployed();
    log(`Deployed WETH ${weth.address} with no arguments`, staging);

    await verifyEtherscan(usdc.address, [supplyStart], staging);
    await verifyEtherscan(weth.address, [], staging);

    return { usdc, weth };
}

async function registerYieldBox(wethAddress: string, staging?: boolean) {
    // Deploy URIBuilder
    const uriBuilder = await (
        await ethers.getContractFactory('YieldBoxURIBuilder')
    ).deploy({ gasPrice: gasPrice });
    await uriBuilder.deployed();
    log(
        `Deployed YieldBoxURIBuilder ${uriBuilder.address} with no arguments`,
        staging,
    );

    // Deploy yieldBox
    const yieldBox = await (
        await ethers.getContractFactory('YieldBox')
    ).deploy(ethers.constants.AddressZero, uriBuilder.address, {
        gasPrice: gasPrice,
    });
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

async function registerSwapperMock(staging?: boolean) {
    const swapperMock = await (
        await ethers.getContractFactory('SwapperMock')
    ).deploy({
        gasPrice: gasPrice,
    });
    await swapperMock.deployed();
    log(
        `Deployed MultiSwapper ${swapperMock.address} with no arguments`,
        staging,
    );

    await verifyEtherscan(swapperMock.address, [], staging);

    return { swapperMock };
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
    ).deploy(assetAddress, { gasPrice: gasPrice });
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
    ).deploy({ gasPrice: gasPrice });
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
    ).deploy(stkAaveTokenAddress, { gasPrice: gasPrice });
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
    ).deploy(assetAddress, { gasPrice: gasPrice });
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
    ).deploy(yieldBoxAddres, wethAddress, vaultAddress, { gasPrice: gasPrice });
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
    ).deploy(wethAddress, { gasPrice: gasPrice });
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

    const lpTokenMock = await (
        await ethers.getContractFactory('ERC20Mock')
    ).deploy(ethers.utils.parseEther('100000'), { gasPrice: gasPrice });
    await lpTokenMock.deployed();

    const stargateRouterETHMock = await (
        await ethers.getContractFactory('RouterETHMock')
    ).deploy(stargateRouterMockAddress, lpTokenMock.address, {
        gasPrice: gasPrice,
    });
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
        const stgTokenMock = await (
            await ethers.getContractFactory('ERC20Mock')
        ).deploy(ethers.utils.parseEther('100000'), { gasPrice: gasPrice });
        await stgTokenMock.deployed();

        stgRewardAddress = stgTokenMock.address;
    }

    const lpStakingMock = await (
        await ethers.getContractFactory('LPStakingMock')
    ).deploy(lpTokenAddress, stgRewardAddress, { gasPrice: gasPrice });
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
        ).deploy({ gasPrice: gasPrice });
        await stargateUniV3SwapperMock.deployed();
        log(
            `Deployed StargateSwapperV3Mock ${stargateUniV3SwapperMock.address} with no arguments`,
            staging,
        );
        await verifyEtherscan(stargateUniV3SwapperMock.address, [], staging);

        swapperAddress = stargateUniV3SwapperMock.address;
    }

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
        {
            gasPrice: gasPrice,
        },
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
        const crvTokenMock = await (
            await ethers.getContractFactory('ERC20Mock')
        ).deploy(ethers.utils.parseEther('100000'), { gasPrice: gasPrice });
        await crvTokenMock.deployed();

        rewardTokenAddress = crvTokenMock.address;
    }

    const curveMinterMock = await (
        await ethers.getContractFactory('CurveMinterMock')
    ).deploy(rewardTokenAddress, { gasPrice: gasPrice });
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
    ).deploy(lpTokenAddress, rewardAddress, { gasPrice: gasPrice });
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
    ).deploy(wethAddress, { gasPrice: gasPrice });
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
    ).deploy(liquidityPoolAddress, usdtAddress, wbtcAddress, wethAddress, {
        gasPrice: gasPrice,
    });
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

async function registerTricryptoStrategy(
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
        const crvTokenMock = await (
            await ethers.getContractFactory('ERC20Mock')
        ).deploy(ethers.utils.parseEther('100000'), { gasPrice: gasPrice });
        await crvTokenMock.deployed();

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

    const tricryptoStrategy = await (
        await ethers.getContractFactory('TricryptoStrategy')
    ).deploy(
        yieldBoxAddres,
        wethAddress,
        lpGaugeAddress,
        lpGetterAddress,
        tricryptoMinterAddress,
        swapper,
        {
            gasPrice: gasPrice,
        },
    );
    await tricryptoStrategy.deployed();

    log(
        `Deployed TricryptoStrategy ${tricryptoStrategy.address} with args [${yieldBoxAddres},${wethAddress},${lpGaugeAddress},${lpGetterAddress},${tricryptoMinterAddress},${swapper}]`,
        staging,
    );
    await verifyEtherscan(
        tricryptoStrategy.address,
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

    return { tricryptoStrategy, tricryptoLPGtter };
}

/*
Lido stEth
*/

async function deployStEtEThMock(staging?: boolean) {
    const stEthMock = await (
        await ethers.getContractFactory('StEthMock')
    ).deploy(ethers.utils.parseEther('100000'), { gasPrice: gasPrice });
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
    ).deploy(stEthAddress, { gasPrice: gasPrice });
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

    const lidoEthStrategy = await (
        await ethers.getContractFactory('LidoEthStrategy')
    ).deploy(
        yieldBoxAddres,
        wethAddress,
        stEthAddress,
        curveSthEThPoolAddress,
        { gasPrice: gasPrice },
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
    const cTokenMock = await (
        await ethers.getContractFactory('CTokenMock')
    ).deploy(wethAddress, {
        gasPrice: gasPrice,
    });
    await cTokenMock.deployed();

    log(
        `Deployed CTokenMock ${cTokenMock.address} with args [${wethAddress}]`,
        staging,
    );

    await verifyEtherscan(cTokenMock.address, [wethAddress], staging);

    return { cTokenMock };
}

async function registerCompoundStrategy(
    yieldBoxAddres: string,
    wethAddress: string,
    cTokenAddress: string,
    staging?: boolean,
) {
    if (cTokenAddress == ethers.constants.AddressZero) {
        const { cTokenMock } = await deployCToken(wethAddress, staging);
        cTokenAddress = cTokenMock.address;
    }

    const compoundStrategy = await (
        await ethers.getContractFactory('CompoundStrategy')
    ).deploy(yieldBoxAddres, wethAddress, cTokenAddress, {
        gasPrice: gasPrice,
    });
    await compoundStrategy.deployed();

    log(
        `Deployed CompoundStrategy ${compoundStrategy.address} with args [${yieldBoxAddres},${wethAddress},${cTokenAddress}]`,
        staging,
    );

    await verifyEtherscan(
        compoundStrategy.address,
        [yieldBoxAddres, wethAddress, cTokenAddress],
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
    ).deploy({
        gasPrice: gasPrice,
    });
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
    const rewardToken1 = await (
        await ethers.getContractFactory('ERC20Mock')
    ).deploy(rewardTokenInitialBalance, {
        gasPrice: gasPrice,
    });
    await rewardToken1.deployed();
    log(
        `Deployed RewardToken1 ${rewardToken1.address} with args [${rewardTokenInitialBalance}]`,
        staging,
    );
    await verifyEtherscan(
        rewardToken1.address,
        [rewardTokenInitialBalance],
        staging,
    );

    const rewardToken2 = await (
        await ethers.getContractFactory('ERC20Mock')
    ).deploy(rewardTokenInitialBalance, {
        gasPrice: gasPrice,
    });
    await rewardToken2.deployed();
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
    ).deploy(stablePoolAddress, rewardToken1.address, rewardToken2.address, {
        gasPrice: gasPrice,
    });
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
    ).deploy(stablePoolAddress, wethAddress, {
        gasPrice: gasPrice,
    });
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
    ).deploy({
        gasPrice: gasPrice,
    });
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
        {
            gasPrice: gasPrice,
        },
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
    const cvxTokenMock = await (
        await ethers.getContractFactory('ERC20Mock')
    ).deploy(ethers.utils.parseEther('10000000'), {
        gasPrice: gasPrice,
    });
    await cvxTokenMock.deployed();

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
    ).deploy(lpTokenAddress, cvxTokenMock.address, {
        gasPrice: gasPrice,
    });
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
    const receiptTokenMock = await (
        await ethers.getContractFactory('ERC20Mock')
    ).deploy(ethers.utils.parseEther('10000000'), {
        gasPrice: gasPrice,
    });
    await receiptTokenMock.deployed();

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
    ).deploy(lpTokenAddress, receiptTokenMock.address, rewardPoolAddress, {
        gasPrice: gasPrice,
    });
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
    const reward1Mock = await (
        await ethers.getContractFactory('ERC20Mock')
    ).deploy(ethers.utils.parseEther('10000000'), {
        gasPrice: gasPrice,
    });
    await reward1Mock.deployed();

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

    const reward2Mock = await (
        await ethers.getContractFactory('ERC20Mock')
    ).deploy(ethers.utils.parseEther('10000000'), {
        gasPrice: gasPrice,
    });
    await reward2Mock.deployed();

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
    ).deploy(reward1Mock.address, reward2Mock.address, {
        gasPrice: gasPrice,
    });
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
        {
            gasPrice: gasPrice,
        },
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

export async function registerMocks(staging?: boolean) {
    /**
     * INITIAL SETUP
     */
    const deployer = (await ethers.getSigners())[0];

    log('Deploying Tokens', staging);
    const { usdc, weth } = await registerERC20Tokens(staging);
    log(
        `Deployed Tokens  USDC: ${usdc.address}, WETH: ${weth.address}`,
        staging,
    );

    log('Deploying YieldBox', staging);
    const { yieldBox, uriBuilder } = await registerYieldBox(
        weth.address,
        staging,
    );
    log(`Deployed YieldBox ${yieldBox.address}`, staging);

    log('Deploying SwapperMock', staging);
    const { swapperMock } = await registerSwapperMock(staging);
    log(`Deployed SwapperMock ${swapperMock.address}`, staging);

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
        ethers.constants.AddressZero,
        weth.address,
        staging,
    );
    log(`Deployed StargateStrategy ${stargateStrategy.address}`, staging);

    log('Deploying TricryptoStrategy', staging);
    const { tricryptoStrategy, tricryptoLPGtter } =
        await registerTricryptoStrategy(
            weth.address,
            usdc.address,
            usdc.address,
            yieldBox.address,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            swapperMock.address,
            staging,
        );
    log(`Deployed TricryptoStrategy ${tricryptoStrategy.address}`, staging);

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

    await (
        await yieldBox.registerAsset(
            1,
            weth.address,
            ethers.constants.AddressZero,
            0,
            { gasPrice: gasPrice },
        )
    ).wait();
    const wethAssetId = await yieldBox.ids(
        1,
        weth.address,
        ethers.constants.AddressZero,
        0,
    );
    await (
        await yieldBox.registerAsset(
            1,
            usdc.address,
            ethers.constants.AddressZero,
            0,
            { gasPrice: gasPrice },
        )
    ).wait();
    const usdcAssetId = await yieldBox.ids(
        1,
        usdc.address,
        ethers.constants.AddressZero,
        0,
    );

    const initialSetup = {
        deployer,
        usdc,
        weth,
        usdcAssetId,
        wethAssetId,
        yieldBox,
        aaveStrategy,
        yearnStrategy,
        stargateStrategy,
        tricryptoStrategy,
        tricryptoLPGtter,
        lidoEthStrategy,
        compoundStrategy,
        balancerStrategy,
        convexTricryptoStrategy,
        cvxReward1Token,
        cvxReward2Token,
        deployTricryptoLPGetter,
        swapperMock,
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
    let binanceWallet;
    await impersonateAccount(process.env.BINANCE_WALLET_ADDRESS!);
    binanceWallet = await ethers.getSigner(process.env.BINANCE_WALLET_ADDRESS!);

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
    const weth = await ethers.getContractAt('ERC20', process.env.WETH_ADDRESS!);
    const usdc = await ethers.getContractAt('ERC20', process.env.USDC_ADDRESS!);
    const usdt = await ethers.getContractAt('ERC20', process.env.USDT_ADDRESS!);

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

    await (
        await yieldBox.registerAsset(
            1,
            weth.address,
            ethers.constants.AddressZero,
            0,
        )
    ).wait();
    const wethAssetId = await yieldBox.ids(
        1,
        weth.address,
        ethers.constants.AddressZero,
        0,
    );
    await (
        await yieldBox.registerAsset(
            1,
            usdc.address,
            ethers.constants.AddressZero,
            0,
        )
    ).wait();
    const usdcAssetId = await yieldBox.ids(
        1,
        usdc.address,
        ethers.constants.AddressZero,
        0,
    );

    log('Deploying SwapperMock', false);
    const { swapperMock } = await registerSwapperMock(false);
    log(`Deployed SwapperMock ${swapperMock.address}`, false);

    log('Deploying AaveStrategy', false);
    const { aaveStrategy } = await registerAaveStrategy(
        weth.address,
        yieldBox.address,
        process.env.AAVE_LENDING_POOL!, //lending pool
        process.env.AAVE_STK!, //stkAave
        process.env.AAVE_RECEIPT_TOKEN!, //receipt
        process.env.AAVE_INCENTIVES_CONTROLLER!, //incentives controller
        process.env.UNISWAP_V2_ROUTER!, //swapper
        false,
    );
    log(`Deployed AaveStrategy ${aaveStrategy.address}`, false);

    log('Deploying YearnStrategy', false);
    const { yearnStrategy } = await registerYearnStrategy(
        weth.address,
        yieldBox.address,
        process.env.YEARN_ETH_VAULT!,
        false,
    );
    log(`Deployed YearnStrategy ${yearnStrategy.address}`, false);

    log('Deploying StargateStrategy', false);
    const stargateUniV3Swapper = await (
        await ethers.getContractFactory('StargateSwapperV3')
    ).deploy(process.env.UNISWAP_V3_ROUTER!);
    await stargateUniV3Swapper.deployed();

    log(
        `Deployed StargateSwapperV3 ${
            stargateUniV3Swapper.address
        } with args [${process.env.UNISWAP_V3_ROUTER!}]`,
        false,
    );

    await verifyEtherscan(
        stargateUniV3Swapper.address,
        [process.env.UNISWAP_V3_ROUTER!],
        false,
    );

    const { stargateStrategy } = await registerStargateStrategy(
        yieldBox.address,
        weth.address,
        process.env.STARGATE_ROUTER_ETH!,
        process.env.STARGATE_LP_STAKING!,
        process.env.STARGATE_LP_STAKING_PID!,
        process.env.STARGATE_LP_TOKEN!,
        stargateUniV3Swapper.address,
        process.env.STARGATE_UNISWAPV3_POOL!,
        false,
    );
    log(`Deployed StargateStrategy ${stargateStrategy.address}`, false);

    log('Deploying TricryptoStrategy', false);
    const { tricryptoStrategy, tricryptoLPGtter } =
        await registerTricryptoStrategy(
            weth.address,
            process.env.USDT_ADDRESS!,
            process.env.WBTC_ADDRESS!,
            yieldBox.address,
            process.env.TRICRYPTO_LIQUIDITY_POOL!,
            process.env.TRICRYPTO_LP_GAUGE!,
            ethers.constants.AddressZero, //lp getter
            process.env.CRV_ADDRESS!,
            process.env.TRICRYPTO_MINTER!,
            process.env.UNISWAP_V2_ROUTER!,
            false,
        );
    log(`Deployed TricryptoStrategy ${tricryptoStrategy.address}`, false);

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
            process.env.UNISWAP_V2_ROUTER!,
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
        usdcAssetId,
        wethAssetId,
        yieldBox,
        aaveStrategy,
        yearnStrategy,
        stargateStrategy,
        tricryptoLPGtter,
        tricryptoStrategy,
        lidoEthStrategy,
        compoundStrategy,
        balancerStrategy,
        convexTricryptoStrategy,
        swapperMock,
        deployTricryptoLPGetter,
        eoa1,
        eoa2,
    };

    const utilFuncs = {
        BN,
        timeTravel,
    };

    return { ...initialSetup, ...utilFuncs, verifyEtherscanQueue };
}
