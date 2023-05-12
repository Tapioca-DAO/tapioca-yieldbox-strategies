import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerFork } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import _ from 'lodash';

describe('AaveStrategy fork test', () => {
    it('should test initial strategy values', async () => {
        const { aaveStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const name = await aaveStrategy.name();
        const description = await aaveStrategy.description();

        expect(name).eq('AAVE');
        expect(description).eq('AAVE strategy for wrapped native assets');

        const contractAddress = await aaveStrategy.contractAddress();
        expect(contractAddress.toLowerCase()).eq(weth.address.toLowerCase());

        const lendingPoolAddress = await aaveStrategy.lendingPool();
        expect(lendingPoolAddress.toLowerCase()).to.eq(
            process.env.AAVE_LENDING_POOL?.toLowerCase(),
        );

        const stkAaveAddress = await aaveStrategy.stakedRewardToken();
        expect(stkAaveAddress.toLowerCase()).to.eq(
            process.env.AAVE_STK?.toLowerCase(),
        );

        const rewardTokenAddress = await aaveStrategy.rewardToken();
        expect(rewardTokenAddress.toLowerCase()).to.eq(
            process.env.AAVE_TOKEN?.toLowerCase(),
        );

        const receiptToken = await aaveStrategy.receiptToken();
        expect(receiptToken.toLowerCase()).to.eq(
            process.env.AAVE_RECEIPT_TOKEN?.toLowerCase(),
        );

        const incentivesController = await aaveStrategy.incentivesController();
        expect(incentivesController.toLowerCase()).to.eq(
            process.env.AAVE_INCENTIVES_CONTROLLER?.toLowerCase(),
        );

        const yieldBoxAddress = await aaveStrategy.yieldBox();
        expect(yieldBoxAddress.toLowerCase()).to.eq(
            yieldBox.address.toLowerCase(),
        );

        const currentBalance = await aaveStrategy.currentBalance();
        expect(currentBalance.eq(0)).to.be.true;

        const queued = await weth.balanceOf(aaveStrategy.address);
        expect(queued.eq(0)).to.be.true;
    });

    it('should allow setting the deposit threshold', async () => {
        const { aaveStrategy } = await loadFixture(registerFork);

        const currentThreshold = await aaveStrategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await aaveStrategy.setDepositThreshold(newThreshold);

        const finalThreshold = await aaveStrategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should queue and deposit when threshold is met', async () => {
        const { aaveStrategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);
        await yieldBox.registerAsset(1, weth.address, aaveStrategy.address, 0);

        const lendingPoolAddress = await aaveStrategy.lendingPool();
        const lendingPoolContract = await ethers.getContractAt(
            'ILendingPool',
            lendingPoolAddress,
        );

        const wethAaveStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            aaveStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await aaveStrategy.setDepositThreshold(amount.mul(3));

        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));

        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(
            wethAaveStrategyAssetId,
            amount,
            false,
        );
        await yieldBox.depositAsset(
            wethAaveStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let aaveStrategyWethBalance = await weth.balanceOf(
            aaveStrategy.address,
        );
        let aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveStrategy.address)
        )[0];
        expect(aaveStrategyWethBalance.gt(0)).to.be.true;
        expect(aaveLendingPoolBalance.eq(0)).to.be.true;
        share = await yieldBox.toShare(
            wethAaveStrategyAssetId,
            amount.mul(3),
            false,
        );
        await yieldBox.depositAsset(
            wethAaveStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share.mul(3),
        );
        aaveStrategyWethBalance = await weth.balanceOf(aaveStrategy.address);
        aaveLendingPoolBalance = aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveStrategy.address)
        )[0];
        expect(aaveStrategyWethBalance.eq(0)).to.be.true;
        expect(aaveLendingPoolBalance.gt(0)).to.be.true;
    });

    it('should allow deposits and withdrawals', async () => {
        const {
            aaveStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);

        const lendingPoolAddress = await aaveStrategy.lendingPool();
        const lendingPoolContract = await ethers.getContractAt(
            'ILendingPool',
            lendingPoolAddress,
        );

        await yieldBox.registerAsset(1, weth.address, aaveStrategy.address, 0);

        const wethAaveStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            aaveStrategy.address,
            0,
        );
        expect(wethAaveStrategyAssetId).to.not.eq(wethAssetId);
        const assetsCount = await yieldBox.assetCount();
        const assetInfo = await yieldBox.assets(assetsCount.sub(1));
        expect(assetInfo.tokenType).to.eq(1);
        expect(assetInfo.contractAddress.toLowerCase()).to.eq(
            weth.address.toLowerCase(),
        );
        expect(assetInfo.strategy.toLowerCase()).to.eq(
            aaveStrategy.address.toLowerCase(),
        );
        expect(assetInfo.tokenId).to.eq(0);

        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await weth.connect(binanceWallet).transfer(deployer.address, amount);

        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(
            wethAaveStrategyAssetId,
            amount,
            false,
        );
        await yieldBox.depositAsset(
            wethAaveStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        const aaveStrategyWethBalance = await weth.balanceOf(
            aaveStrategy.address,
        );
        const aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveStrategy.address)
        )[0];
        expect(aaveStrategyWethBalance.eq(0)).to.be.true;
        expect(aaveLendingPoolBalance.eq(amount)).to.be.true; //amount was initially deposited

        await aaveStrategy.compound(ethers.utils.toUtf8Bytes('')); //to simulate rewards produced by mocks
        await timeTravel(86400 * 10); //10 days

        share = await yieldBox.toShare(wethAaveStrategyAssetId, amount, false);
        await yieldBox.withdraw(
            wethAaveStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        const finalAaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveStrategy.address)
        )[0];
        expect(finalAaveLendingPoolBalance.lte(aaveLendingPoolBalance)).to.be
            .true; //should be less than provided amount as something extra was given on withdrawal
    });

    it('should withdraw from queue', async () => {
        const { aaveStrategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);

        const lendingPoolAddress = await aaveStrategy.lendingPool();
        const lendingPoolContract = await ethers.getContractAt(
            'ILendingPool',
            lendingPoolAddress,
        );

        await yieldBox.registerAsset(1, weth.address, aaveStrategy.address, 0);

        const wethAaveStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            aaveStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await aaveStrategy.setDepositThreshold(amount.mul(3));
        await weth.connect(binanceWallet).transfer(deployer.address, amount);

        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(
            wethAaveStrategyAssetId,
            amount,
            false,
        );
        await yieldBox.depositAsset(
            wethAaveStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let aaveStrategyWethBalance = await weth.balanceOf(
            aaveStrategy.address,
        );
        let aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveStrategy.address)
        )[0];
        expect(aaveStrategyWethBalance.gt(0)).to.be.true;
        expect(aaveLendingPoolBalance.eq(0)).to.be.true;

        share = await yieldBox.balanceOf(
            deployer.address,
            wethAaveStrategyAssetId,
        );
        await yieldBox.withdraw(
            wethAaveStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        aaveStrategyWethBalance = await weth.balanceOf(aaveStrategy.address);
        aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveStrategy.address)
        )[0];
        expect(aaveStrategyWethBalance.eq(0)).to.be.true;
        expect(aaveLendingPoolBalance.eq(0)).to.be.true;
    });

    it('should compound rewards', async () => {
        const {
            aaveStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);

        const lendingPoolAddress = await aaveStrategy.lendingPool();
        const lendingPoolContract = await ethers.getContractAt(
            'ILendingPool',
            lendingPoolAddress,
        );

        await yieldBox.registerAsset(1, weth.address, aaveStrategy.address, 0);

        const wethAaveStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            aaveStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await aaveStrategy.setDepositThreshold(amount.div(10000));
        await weth.connect(binanceWallet).transfer(deployer.address, amount);
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        const share = await yieldBox.toShare(
            wethAaveStrategyAssetId,
            amount,
            false,
        );
        await yieldBox.depositAsset(
            wethAaveStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        const aaveStrategyWethBalance = await weth.balanceOf(
            aaveStrategy.address,
        );
        const aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveStrategy.address)
        )[0];
        expect(aaveStrategyWethBalance.eq(0)).to.be.true;
        expect(aaveLendingPoolBalance.gte(amount)).to.be.true;

        const stkAave = await aaveStrategy.stakedRewardToken();
        const stkAaveContract = await ethers.getContractAt('IStkAave', stkAave);

        let unclaimedStkAave = await stkAaveContract.stakerRewardsToClaim(
            aaveStrategy.address,
        );
        let strategyBalanceOfStkAave = await stkAaveContract.balanceOf(
            aaveStrategy.address,
        );

        let cooldownBefore = await stkAaveContract.stakersCooldowns(
            aaveStrategy.address,
        );
        expect(cooldownBefore.eq(0)).to.be.true;
        await aaveStrategy.compound(ethers.utils.toUtf8Bytes(''));
        cooldownBefore = await stkAaveContract.stakersCooldowns(
            aaveStrategy.address,
        );
        if (unclaimedStkAave.add(strategyBalanceOfStkAave).gt(0)) {
            expect(cooldownBefore.gt(0)).to.be.true;
        }

        const aaveStrategyWethBalanceMid = await weth.balanceOf(
            aaveStrategy.address,
        );
        const aaveLendingPoolBalanceMid = (
            await lendingPoolContract.getUserAccountData(aaveStrategy.address)
        )[0];
        expect(aaveStrategyWethBalanceMid.eq(0)).to.be.true;
        expect(aaveLendingPoolBalanceMid.gt(aaveLendingPoolBalance)).to.be.true;

        await timeTravel(10 * 86400);

        await aaveStrategy.compound(ethers.utils.toUtf8Bytes(''));
        const finalCooldown = await stkAaveContract.stakersCooldowns(
            aaveStrategy.address,
        );
        expect(finalCooldown.eq(cooldownBefore)).to.be.true;
        const aaveLendingPoolBalanceFinal = (
            await lendingPoolContract.getUserAccountData(aaveStrategy.address)
        )[0];
        expect(aaveLendingPoolBalanceFinal.gt(aaveLendingPoolBalanceMid)).to.be
            .true;

        await timeTravel(100 * 86400);
        await aaveStrategy.compound(ethers.utils.toUtf8Bytes(''));

        unclaimedStkAave = await stkAaveContract.stakerRewardsToClaim(
            aaveStrategy.address,
        );
        strategyBalanceOfStkAave = await stkAaveContract.balanceOf(
            aaveStrategy.address,
        );

        if (unclaimedStkAave.add(strategyBalanceOfStkAave).gt(0)) {
            const newCooldown = await stkAaveContract.stakersCooldowns(
                aaveStrategy.address,
            );
            expect(newCooldown.gt(finalCooldown)).to.be.true;
        }
    });

    it('should emergency withdraw', async () => {
        const {
            aaveStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            eoa1,
        } = await loadFixture(registerFork);

        const lendingPoolAddress = await aaveStrategy.lendingPool();
        const lendingPoolContract = await ethers.getContractAt(
            'ILendingPool',
            lendingPoolAddress,
        );

        await yieldBox.registerAsset(1, weth.address, aaveStrategy.address, 0);

        const wethAaveStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            aaveStrategy.address,
            0,
        );

        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await weth.connect(binanceWallet).transfer(deployer.address, amount);

        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        const share = await yieldBox.toShare(
            wethAaveStrategyAssetId,
            amount,
            false,
        );
        await yieldBox.depositAsset(
            wethAaveStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        let invested = (
            await lendingPoolContract.getUserAccountData(aaveStrategy.address)
        )[0];
        let strategyWethBalance = await weth.balanceOf(aaveStrategy.address);

        expect(strategyWethBalance.eq(0)).true;
        expect(invested.gt(0)).to.be.true;

        await expect(aaveStrategy.connect(eoa1).emergencyWithdraw()).to.be
            .reverted;

        await aaveStrategy.emergencyWithdraw();

        invested = (
            await lendingPoolContract.getUserAccountData(aaveStrategy.address)
        )[0];
        strategyWethBalance = await weth.balanceOf(aaveStrategy.address);
        expect(strategyWethBalance.gt(0)).true;
        expect(invested.eq(0)).to.be.true;
    });
});
