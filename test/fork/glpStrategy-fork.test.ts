import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { BN, setBalance } from '../test.utils';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {
    GlpStrategy,
    IERC20,
    IGmxRewardDistributor,
    IGmxRewardRouterV2,
    IGmxRewardTracker,
    IGmxVault,
    IGlpManager,
    IWETH,
    YieldBox,
    YieldBoxURIBuilder,
} from '../typechain';
import { OracleMock__factory } from '../../gitsub_tapioca-sdk/src/typechain/tapioca-mocks';

const { formatUnits, parseEther } = ethers.utils;

function E(n: number | bigint, p: number | bigint = 18) {
    return BN(BigInt(n) * 10n ** BigInt(p));
}

async function become(address: string): SignerWithAddress {
    await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address],
    });
    return ethers.getSigner(address);
}

const {
    BINANCE_WALLET_ADDRESS,
    GLP_REWARD_ROUTER,
    GMX_REWARD_ROUTER,
    STAKED_GLP,
    GMX_VAULT,
} = process.env;

const BORING_IERC20 =
    '@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol:IERC20';

describe('GlpStrategy fork test', () => {
    before(function () {
        if (process.env.NODE_ENV != 'arbitrum') {
            this.skip();
        }
    });

    async function setUp() {
        const me = await become(BINANCE_WALLET_ADDRESS);

        const glpRewardRouter = (
            await ethers.getContractAt<IGmxRewardRouterV2>(
                'IGmxRewardRouterV2',
                GLP_REWARD_ROUTER,
            )
        ).connect(me);
        const gmxRewardRouter = (
            await ethers.getContractAt<IGmxRewardRouterV2>(
                'IGmxRewardRouterV2',
                GMX_REWARD_ROUTER,
            )
        ).connect(me);

        const gmx = (
            await ethers.getContractAt<IERC20>(
                BORING_IERC20,
                await gmxRewardRouter.gmx(),
            )
        ).connect(me);
        const esgmx = (
            await ethers.getContractAt<IERC20>(
                BORING_IERC20,
                await gmxRewardRouter.esGmx(),
            )
        ).connect(me);
        const sglp = (
            await ethers.getContractAt<IERC20>(BORING_IERC20, STAKED_GLP)
        ).connect(me);
        const glpManager = (
            await ethers.getContractAt<IGlpManager>(
                'IGlpManager',
                await glpRewardRouter.glpManager(),
            )
        ).connect(me);

        const feeGlpTracker = (
            await ethers.getContractAt<IGmxRewardTracker>(
                'IGmxRewardTracker',
                await glpRewardRouter.feeGlpTracker(),
            )
        ).connect(me);
        const stakedGlpTracker = (
            await ethers.getContractAt<IGmxRewardTracker>(
                'IGmxRewardTracker',
                await glpRewardRouter.stakedGlpTracker(),
            )
        ).connect(me);
        const vault = (
            await ethers.getContractAt<IGmxVault>('IGmxVault', GMX_VAULT)
        ).connect(me);
        const weth = (
            await ethers.getContractAt<IWETHToken>(
                'IWETHToken',
                await gmxRewardRouter.weth(),
            )
        ).connect(me);

        // Test only? GLP is not currently giving out esGMX! But we want to
        // handle the situation anyway:
        await (async () => {
            const sGlpDist = await ethers.getContractAt<IGmxRewardDistributor>(
                'IGmxRewardDistributor',
                await stakedGlpTracker.distributor(),
            );
            const admin = await become(await sGlpDist.admin());
            await sGlpDist
                .connect(admin)
                .setTokensPerInterval(100_000_000_000_000n);
        })();

        // Deploy YieldBox
        const uriBuilder = await (
            await ethers.getContractFactory('YieldBoxURIBuilder')
        ).deploy();
        await uriBuilder.deployed();
        let yieldBox = await (
            await ethers.getContractFactory('YieldBox')
        ).deploy(weth.address, uriBuilder.address);
        await yieldBox.deployed();
        yieldBox = yieldBox.connect(me);

        expect(vault.address).to.equal(await glpManager.vault());
        expect(await feeGlpTracker.rewardToken()).to.equal(weth.address);
        expect(await stakedGlpTracker.rewardToken()).to.equal(esgmx.address);

        // If this fails we may have to pick another test account..
        // TODO: Ensure the test account has never intereacted with GMX before?
        expect(await ethers.provider.getBalance(me.address)).to.be.gte(
            parseEther('0.01'),
        );
        expect(await sglp.balanceOf(me.address)).to.equal(0);
        // expect(await weth.balanceOf(me.address)).to.equal(0);

        // Precision is 30 zeroes; 12 more than usual:
        const xp = E(1, 12);

        const glpPrice = (await glpManager.getPrice(true)).div(xp);
        expect(glpPrice).to.be.lte(parseEther('1.0'));
        expect(glpPrice).to.be.gte(parseEther('0.95'));

        // Per the GLP vault. Not sure if this is in USDG or USDC/USD:
        const wethPrice = (await vault.getMaxPrice(weth.address)).div(xp);
        expect(wethPrice).to.be.lte(parseEther('1700'));
        expect(wethPrice).to.be.gte(parseEther('1600'));

        return {
            esgmx,
            feeGlpTracker,
            glpManager,
            glpPrice,
            glpRewardRouter,
            gmx,
            gmxRewardRouter,
            me,
            sglp,
            stakedGlpTracker,
            weth,
            wethPrice,
            yieldBox,
        };
    }

    async function compound(
        strat: GlpStrategy,
        t: number,
        n: number,
        harvestFirst = true,
    ) {
        if (harvestFirst) {
            await strat.harvest();
        }
        const r = t % n;
        const interval = (t - r) / n;
        for (let i = 0; i < r; i++) {
            await time.increase(interval + 1);
            await strat.harvest();
        }
        for (let i = r; i < n; i++) {
            await time.increase(interval);
            await strat.harvest();
        }
    }

    it('Should set up the strategy', async () => {
        const {
            esgmx,
            feeGlpTracker,
            glpManager,
            glpPrice,
            glpRewardRouter,
            gmx,
            gmxRewardRouter,
            me,
            sglp,
            stakedGlpTracker,
            weth,
            wethPrice,
            yieldBox,
        } = await loadFixture(setUp);

        // Get (and auto-stake) GLP token:
        const ethBuyin = parseEther('0.01');
        const minUsdg = wethPrice.mul(ethBuyin).div(E(1)).mul(99).div(100);
        const minGlp = minUsdg.mul(E(1)).div(glpPrice);
        await glpRewardRouter.mintAndStakeGlpETH(minUsdg, minGlp, {
            value: ethBuyin,
        });

        const sglpBal = await sglp.balanceOf(me.address);
        expect(sglpBal).to.be.gt(parseEther('17'));
        expect(await stakedGlpTracker.balanceOf(me.address)).to.equal(sglpBal);

        const OracleMock = new OracleMock__factory(
            (await ethers.getSigners())[0],
        );
        const oracle = await OracleMock.deploy(
            'STGETHLP-WETH',
            'STGETHLP',
            (1e18).toString(),
        );

        const strategy = await (
            await ethers.getContractFactory('GlpStrategy')
        ).deploy(
            yieldBox.address,
            gmxRewardRouter.address,
            glpRewardRouter.address,
            sglp.address,
            oracle.address,
            ethers.utils.toUtf8Bytes(''),
            oracle.address,
            ethers.utils.toUtf8Bytes(''),
            oracle.address,
            ethers.utils.toUtf8Bytes(''),
        );
        await strategy.deployed();
        await strategy.setSlippage(1000);
        // Drum rolls..
        const TOKEN_TYPE_ERC20 = 1;
        await yieldBox.registerAsset(
            TOKEN_TYPE_ERC20,
            sglp.address,
            strategy.address,
            0,
        );
        const assetId = await yieldBox.ids(
            TOKEN_TYPE_ERC20,
            sglp.address,
            strategy.address,
            0,
        );
        let n = 1;
        const dump = async () => {
            console.log('Dump', n++, {
                sglp: formatUnits(await sglp.balanceOf(strategy.address)),
                esgmx: formatUnits(await esgmx.balanceOf(strategy.address)),
                gmx: formatUnits(await gmx.balanceOf(strategy.address)),
            });
        };

        await sglp.approve(yieldBox.address, parseEther('10'));
        await yieldBox.depositAsset(
            assetId,
            me.address,
            me.address,
            parseEther('10'),
            0,
        );

        const shares = await yieldBox.balanceOf(me.address, assetId);
        // console.log('Deposit', { shares });
        // await dump();

        // NOTE: Rewards stop coming if the distributor runs out of tokens.
        //       Testing over large time frames may trigger this
        // TODO: Include a test case that triggers this specific situation. One
        //       way is for the esGMX reward distributor to be empty
        await compound(strategy, (86400 * 365) / 10, 6);
        await yieldBox.withdraw(
            assetId,
            me.address,
            me.address,
            0,
            shares.div(2),
        );
        // console.log('Compounding after GLP withdrawal:');
        await compound(strategy, (86400 * 365) / 1, 12, false);
        // await dump();

        // Should fail..
        // WETH: more than 1600
        // GMX: ~70 at the time?
        // So one GMX is less than 1/20 and more than 1/30 WETH:
        await strategy.harvestGmx(1, 30); // Succeed
    });
});
