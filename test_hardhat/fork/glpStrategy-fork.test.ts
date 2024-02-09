import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { OracleMock__factory } from '@tapioca-sdk/typechain/tapioca-mocks';
import { GlpStrategy, IERC20 } from '../../typechain';
import { BN, loadNetworkFork } from '../test.utils';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface ProcessEnv {
            FORKING_BLOCK_NUMBER: string;
            BINANCE_WALLET_ADDRESS: string;
            WETH_ADDRES: string;
            GLP_REWARD_ROUTER: string;
            GMX_REWARD_ROUTER: string;
            GMX_VAULT: string;
            STAKED_GLP: string;
        }
    }
}

const { parseEther } = ethers.utils;

function E(n: number | bigint, p: number | bigint = 18) {
    return BN(BigInt(n) * 10n ** BigInt(p));
}

async function become(address: string) {
    await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address],
    });
    return ethers.getSigner(address);
}

let BINANCE_WALLET_ADDRESS: string,
    GLP_REWARD_ROUTER: string,
    GMX_REWARD_ROUTER: string,
    STAKED_GLP: string,
    GMX_VAULT: string;

describe('GlpStrategy fork test - Arbitrum', () => {
    before(function () {
        if (process.env.NETWORK != 'arbitrum') {
            this.skip();
        }
        loadNetworkFork();

        ({
            BINANCE_WALLET_ADDRESS,
            GLP_REWARD_ROUTER,
            GMX_REWARD_ROUTER,
            STAKED_GLP,
            GMX_VAULT,
        } = process.env);
    });

    async function setUp() {
        const me = await become(BINANCE_WALLET_ADDRESS);

        const glpRewardRouter = (
            await ethers.getContractAt('IGmxRewardRouterV2', GLP_REWARD_ROUTER)
        ).connect(me);
        const gmxRewardRouter = (
            await ethers.getContractAt('IGmxRewardRouterV2', GMX_REWARD_ROUTER)
        ).connect(me);

        const sglp = (
            await ethers.getContractAt(
                '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
                STAKED_GLP,
            )
        ).connect(me) as IERC20;

        const fsGLP = (
            await ethers.getContractAt(
                'IGmxRewardTracker',
                await glpRewardRouter.stakedGlpTracker(),
            )
        ).connect(me);

        const vault = (
            await ethers.getContractAt('IGmxVault', GMX_VAULT)
        ).connect(me);

        const weth = (
            await ethers.getContractAt(
                'IWETHToken',
                await gmxRewardRouter.weth(),
            )
        ).connect(me);

        const glpManager = (
            await ethers.getContractAt(
                'IGlpManager',
                await glpRewardRouter.glpManager(),
            )
        ).connect(me);

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

        // If this fails we may have to pick another test account..
        expect(await ethers.provider.getBalance(me.address)).to.be.gte(
            parseEther('0.01'),
        );
        expect(await sglp.balanceOf(me.address)).to.equal(0);
        // expect(await weth.balanceOf(me.address)).to.equal(0);

        // Precision is 30 zeroes; 12 more than usual:
        const xp = E(1, 12);

        // Block 145526897
        // GLP: 1041055094190371419655569666477
        let glpPrice = await glpManager.getPrice(true);
        expect(glpPrice).to.be.lte(
            ethers.BigNumber.from('1041055094190371419655569666477'),
        );
        glpPrice = glpPrice.div(xp);

        // Block 145526897
        // WETH: 1805953396950000000000
        const wethPrice = (await vault.getMaxPrice(weth.address)).div(xp);
        expect(wethPrice).to.be.approximately(
            parseEther('1805'),
            parseEther('2'),
        );

        return {
            glpPrice,
            glpRewardRouter,
            gmxRewardRouter,
            me,
            sglp,
            fsGLP,
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
            glpPrice,
            glpRewardRouter,
            gmxRewardRouter,
            me,
            sglp,
            fsGLP,
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
        expect(await fsGLP.balanceOf(me.address)).to.equal(sglpBal);

        const OracleMock = new OracleMock__factory(
            (await ethers.getSigners())[0],
        );
        const oracle = await OracleMock.deploy(
            'STGETHLP-WETH',
            'STGETHLP',
            (1e18).toString(),
        );

        const deployer = (await ethers.getSigners())[0];
        const strategy = await (
            await ethers.getContractFactory('GlpStrategy')
        ).deploy(
            yieldBox.address,
            gmxRewardRouter.address,
            glpRewardRouter.address,
            sglp.address,
            oracle.address,
            ethers.utils.toUtf8Bytes(''),
            deployer.address,
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

        const amount = await sglp.balanceOf(me.address);

        await sglp.approve(yieldBox.address, amount);

        await yieldBox.depositAsset(assetId, me.address, me.address, amount, 0);

        const shares = await yieldBox.balanceOf(me.address, assetId);

        await compound(strategy, (86400 * 365) / 10, 6);
        await yieldBox.withdraw(assetId, me.address, me.address, 0, shares);

        const amountAfter = await sglp.balanceOf(me.address);
        expect(amountAfter).to.be.gt(amount);

        // console.log('Compounding after GLP withdrawal:');
        // await compound(strategy, (86400 * 365) / 1, 12, false);
    });
});
