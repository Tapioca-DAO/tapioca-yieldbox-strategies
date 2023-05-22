import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerFork } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { delay } from 'lodash';

describe('ConvexStrategy fork test', () => {
    it('should test initial strategy values', async () => {
        const { convexTricryptoStrategy, weth } = await loadFixture(
            registerFork,
        );

        const name = await convexTricryptoStrategy.name();
        const description = await convexTricryptoStrategy.description();

        expect(name).eq('Convex-Tricrypto');
        expect(description).eq(
            'Convex-Tricrypto strategy for wrapped native assets',
        );

        const contractAddress = await convexTricryptoStrategy.contractAddress();
        expect(contractAddress.toLowerCase()).eq(weth.address.toLowerCase());

        const boosterAddress = await convexTricryptoStrategy.booster();
        expect(boosterAddress.toLowerCase()).to.eq(
            process.env.CONVEX_BOOSTER?.toLowerCase(),
        );

        const zapAddress = await convexTricryptoStrategy.zap();
        expect(zapAddress.toLowerCase()).to.eq(
            process.env.CONVEX_ZAP?.toLowerCase(),
        );

        const rewardPoolAddress = await convexTricryptoStrategy.rewardPool();
        expect(rewardPoolAddress.toLowerCase()).to.eq(
            process.env.CONVEX_TRICRYPTO_REWARD_POOL?.toLowerCase(),
        );

        const currentBalance = await convexTricryptoStrategy.currentBalance();
        expect(currentBalance.eq(0)).to.be.true;

        const queued = await weth.balanceOf(convexTricryptoStrategy.address);
        expect(queued.eq(0)).to.be.true;
    });

    it('should allow setting the deposit threshold', async () => {
        const { convexTricryptoStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const currentThreshold =
            await convexTricryptoStrategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await convexTricryptoStrategy.setDepositThreshold(newThreshold);

        const finalThreshold = await convexTricryptoStrategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should allow setting swapper', async () => {
        const { convexTricryptoStrategy, swapperMock } = await loadFixture(
            registerFork,
        );

        await convexTricryptoStrategy.setMultiSwapper(swapperMock.address);
        const finalSwapper = await convexTricryptoStrategy.swapper();
        expect(finalSwapper.toLowerCase()).eq(
            swapperMock.address.toLowerCase(),
        );
        expect(finalSwapper.toLowerCase()).to.eq(
            swapperMock.address.toLowerCase(),
        );
    });

    it('should queue and deposit when threshold is met', async () => {
        const {
            convexTricryptoStrategy,
            weth,
            yieldBox,
            deployer,
            binanceWallet,
        } = await loadFixture(registerFork);

        const lpToken = await convexTricryptoStrategy.lpToken();
        const lpTokenContract = await ethers.getContractAt(
            'ERC20Mock',
            lpToken,
        );
        const rewardPoolAddress = await convexTricryptoStrategy.rewardPool();
        const rewardPoolContract = await ethers.getContractAt(
            'IConvexRewardPool',
            rewardPoolAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            convexTricryptoStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            convexTricryptoStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await convexTricryptoStrategy.setDepositThreshold(amount.mul(3));

        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        const share = await yieldBox.toShare(
            wethStrategyAssetId,
            amount.mul(4),
            false,
        );

        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        const strategyWethBalance = await weth.balanceOf(
            convexTricryptoStrategy.address,
        );
        const poolBalance = await rewardPoolContract.balanceOf(
            convexTricryptoStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(poolBalance.gt(0)).to.be.true;
    });

    it('should allow setting lp getter', async () => {
        const { convexTricryptoStrategy, deployTricryptoLPGetter, weth } =
            await loadFixture(registerFork);

        const liquidityPoolMock = await (
            await ethers.getContractFactory('TricryptoLiquidityPoolMock')
        ).deploy(weth.address);
        await liquidityPoolMock.deployed();
        const newTricryptoLpGetterDeployment = await deployTricryptoLPGetter(
            liquidityPoolMock.address,
            weth.address,
            weth.address,
            weth.address,
        );
        await convexTricryptoStrategy.setTricryptoLPGetter(
            newTricryptoLpGetterDeployment.tricryptoLPGtter.address,
        );

        const finalLpGetter = await convexTricryptoStrategy.lpGetter();
        expect(finalLpGetter.toLowerCase()).to.eq(
            newTricryptoLpGetterDeployment.tricryptoLPGtter.address.toLowerCase(),
        );
    });

    it.skip('should allow deposits and withdrawals', async () => {
        //someimes fails randomly due to pool's ratio
        const {
            convexTricryptoStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            eoa1,
            timeTravel,
        } = await loadFixture(registerFork);

        await convexTricryptoStrategy.setDepositThreshold(
            ethers.utils.parseEther('0.1'),
        );

        const lpToken = await convexTricryptoStrategy.lpToken();
        const lpTokenContract = await ethers.getContractAt(
            'ERC20Mock',
            lpToken,
        );
        const rewardPoolAddress = await convexTricryptoStrategy.rewardPool();
        const rewardPoolContract = await ethers.getContractAt(
            'IConvexRewardPool',
            rewardPoolAddress,
        );

        const lpGetterAddress = await convexTricryptoStrategy.lpGetter();
        const lpGetterContract = await ethers.getContractAt(
            'ITricryptoLPGetter',
            lpGetterAddress,
        );

        const curvePoolAddress = await lpGetterContract.liquidityPool();
        const curvePoolContract = await ethers.getContractAt(
            'ITricryptoLiquidityPool',
            curvePoolAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            convexTricryptoStrategy.address,
            0,
        );

        const strategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            convexTricryptoStrategy.address,
            0,
        );
        expect(strategyAssetId).to.not.eq(wethAssetId);
        const assetsCount = await yieldBox.assetCount();
        const assetInfo = await yieldBox.assets(assetsCount.sub(1));
        expect(assetInfo.tokenType).to.eq(1);
        expect(assetInfo.contractAddress.toLowerCase()).to.eq(
            weth.address.toLowerCase(),
        );
        expect(assetInfo.strategy.toLowerCase()).to.eq(
            convexTricryptoStrategy.address.toLowerCase(),
        );
        expect(assetInfo.tokenId).to.eq(0);

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));

        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(strategyAssetId, amount, false);
        await yieldBox.depositAsset(
            strategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        const strategyWethBalance = await weth.balanceOf(
            convexTricryptoStrategy.address,
        );
        let poolBalance = await rewardPoolContract.balanceOf(
            convexTricryptoStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(poolBalance.gt(0)).to.be.true;

        timeTravel(100 * 86400);

        const swapMintAmount = ethers.BigNumber.from((1e18).toString()).mul(
            300,
        );
        await weth
            .connect(binanceWallet)
            .transfer(eoa1.address, swapMintAmount);
        await weth
            .connect(eoa1)
            .approve(curvePoolAddress, ethers.constants.MaxUint256);
        const swapBalance = await weth.balanceOf(eoa1.address);
        expect(swapBalance.eq(swapMintAmount)).to.be.true;

        const witdrawOneCoinBefore =
            await curvePoolContract.calc_withdraw_one_coin(
                ethers.utils.parseEther('1'),
                2,
            );
        await curvePoolContract
            .connect(eoa1)
            .exchange(2, 0, swapMintAmount, '1', false);

        const witdrawOneCoinAfter =
            await curvePoolContract.calc_withdraw_one_coin(
                ethers.utils.parseEther('1'),
                2,
            );
        expect(witdrawOneCoinAfter.gt(witdrawOneCoinBefore)).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, strategyAssetId);
        const withdrawalAmount = await yieldBox.toAmount(
            strategyAssetId,
            share,
            false,
        );

        const totalLPs = await rewardPoolContract.balanceOf(
            convexTricryptoStrategy.address,
        );

        const obtainable = await curvePoolContract.calc_withdraw_one_coin(
            totalLPs,
            2,
        );

        if (obtainable.gte(withdrawalAmount)) {
            await yieldBox.withdraw(
                strategyAssetId,
                deployer.address,
                deployer.address,
                0,
                share,
            );
            poolBalance = poolBalance = await rewardPoolContract.balanceOf(
                convexTricryptoStrategy.address,
            );
            expect(poolBalance.lte(10)).to.be.true;
        } else {
            await expect(
                yieldBox.withdraw(
                    strategyAssetId,
                    deployer.address,
                    deployer.address,
                    0,
                    share,
                ),
            ).to.be.revertedWith('ConvexTricryptoStrategy: not enough');
        }
    });

    it('should withdraw from queue', async () => {
        const {
            convexTricryptoStrategy,
            weth,
            yieldBox,
            deployer,
            binanceWallet,
        } = await loadFixture(registerFork);

        const lpToken = await convexTricryptoStrategy.lpToken();
        const lpTokenContract = await ethers.getContractAt(
            'ERC20Mock',
            lpToken,
        );
        const rewardPoolAddress = await convexTricryptoStrategy.rewardPool();
        const rewardPoolContract = await ethers.getContractAt(
            'IConvexRewardPool',
            rewardPoolAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            convexTricryptoStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            convexTricryptoStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await convexTricryptoStrategy.setDepositThreshold(amount.mul(3));

        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let strategyWethBalance = await weth.balanceOf(
            convexTricryptoStrategy.address,
        );
        let poolBalance = await rewardPoolContract.balanceOf(
            convexTricryptoStrategy.address,
        );
        expect(strategyWethBalance.gt(0)).to.be.true;
        expect(poolBalance.eq(0)).to.be.true;

        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        strategyWethBalance = await weth.balanceOf(
            convexTricryptoStrategy.address,
        );
        poolBalance = poolBalance = await rewardPoolContract.balanceOf(
            convexTricryptoStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(poolBalance.eq(0)).to.be.true;
    });

    it.skip('should compound rewards', async () => {
        const {
            convexTricryptoStrategy,
            weth,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);

        const lpToken = await convexTricryptoStrategy.lpToken();
        const lpTokenContract = await ethers.getContractAt(
            'ERC20Mock',
            lpToken,
        );
        const rewardPoolAddress = await convexTricryptoStrategy.rewardPool();
        const rewardPoolContract = await ethers.getContractAt(
            'IConvexRewardPool',
            rewardPoolAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            convexTricryptoStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            convexTricryptoStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await convexTricryptoStrategy.setDepositThreshold(amount.div(10000));

        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        const share = await yieldBox.toShare(
            wethStrategyAssetId,
            amount,
            false,
        );
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let strategyWethBalance = await weth.balanceOf(
            convexTricryptoStrategy.address,
        );
        let poolBalance = await rewardPoolContract.balanceOf(
            convexTricryptoStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(poolBalance.gt(0)).to.be.true;

        await timeTravel(100 * 86400);

        const abiCoder = new ethers.utils.AbiCoder();
        const extras = abiCoder.encode(
            ['uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
            [0, 0, 0, 0, 0],
        );

        const crvTokenAddress = await convexTricryptoStrategy.rewardToken();
        const claimData = abiCoder.encode(
            [
                'address[]',
                'address[]',
                'address[]',
                'address[]',
                'address[]',
                'bytes',
            ],
            [
                [rewardPoolAddress, rewardPoolAddress],
                [],
                [],
                [crvTokenAddress, '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b'],
                [],
                extras,
            ],
        );

        await convexTricryptoStrategy.compound(claimData);

        const midPoolBalance = poolBalance;
        strategyWethBalance = await weth.balanceOf(
            convexTricryptoStrategy.address,
        );
        poolBalance = await rewardPoolContract.balanceOf(
            convexTricryptoStrategy.address,
        );
        expect(strategyWethBalance.gt(0)).to.be.true;
        expect(poolBalance.eq(midPoolBalance)).to.be.true;

        await timeTravel(100 * 86400);

        await convexTricryptoStrategy.compound(claimData);

        const prevGaugeBalance = poolBalance;
        strategyWethBalance = await weth.balanceOf(
            convexTricryptoStrategy.address,
        );
        poolBalance = await rewardPoolContract.balanceOf(
            convexTricryptoStrategy.address,
        );
        expect(poolBalance.gte(prevGaugeBalance)).to.be.true;
    });

    it('should emergency withdraw', async () => {
        const {
            convexTricryptoStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            eoa1,
        } = await loadFixture(registerFork);

        const lpToken = await convexTricryptoStrategy.lpToken();
        const lpTokenContract = await ethers.getContractAt(
            'ERC20Mock',
            lpToken,
        );
        const rewardPoolAddress = await convexTricryptoStrategy.rewardPool();
        const rewardPoolContract = await ethers.getContractAt(
            'IConvexRewardPool',
            rewardPoolAddress,
        );

        const lpGetterAddress = await convexTricryptoStrategy.lpGetter();
        const lpGetterContract = await ethers.getContractAt(
            'ITricryptoLPGetter',
            lpGetterAddress,
        );

        const curvePoolAddress = await lpGetterContract.liquidityPool();
        const curvePoolContract = await ethers.getContractAt(
            'ITricryptoLiquidityPool',
            curvePoolAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            convexTricryptoStrategy.address,
            0,
        );

        const strategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            convexTricryptoStrategy.address,
            0,
        );

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));

        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        const share = await yieldBox.toShare(strategyAssetId, amount, false);
        await yieldBox.depositAsset(
            strategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let invested = await rewardPoolContract.balanceOf(
            convexTricryptoStrategy.address,
        );
        let strategyWethBalance = await weth.balanceOf(
            convexTricryptoStrategy.address,
        );

        expect(strategyWethBalance.eq(0)).true;
        expect(invested.gt(0)).to.be.true;

        await expect(convexTricryptoStrategy.connect(eoa1).emergencyWithdraw())
            .to.be.reverted;

        await convexTricryptoStrategy.emergencyWithdraw();

        invested = await rewardPoolContract.balanceOf(
            convexTricryptoStrategy.address,
        );
        strategyWethBalance = await weth.balanceOf(
            convexTricryptoStrategy.address,
        );
        expect(strategyWethBalance.gt(0)).true;
        expect(invested.eq(0)).to.be.true;
    });
});
