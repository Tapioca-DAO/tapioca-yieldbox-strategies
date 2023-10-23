import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerFork } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import _ from 'lodash';

describe.skip('AaveV3Strategy fork test', () => {
    before(function () {
        if (process.env.NODE_ENV != 'mainnet') {
            this.skip();
        }
    });

    it('should test initial strategy values', async () => {
        const { aaveV3Strategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const name = await aaveV3Strategy.name();
        const description = await aaveV3Strategy.description();

        expect(name).eq('AAVE V3');
        expect(description).eq('AAVE V3 strategy for wrapped native assets');

        const contractAddress = await aaveV3Strategy.contractAddress();
        expect(contractAddress.toLowerCase()).eq(weth.address.toLowerCase());

        const lendingPoolAddress = await aaveV3Strategy.aaveV3Pool();
        expect(lendingPoolAddress.toLowerCase()).to.eq(
            process.env.AAVE_V3_POOL?.toLowerCase(),
        );

        const stkAaveAddress = await aaveV3Strategy.stakedRewardToken();
        expect(stkAaveAddress.toLowerCase()).to.eq(
            process.env.AAVE_STK?.toLowerCase(),
        );

        const rewardTokenAddress = await aaveV3Strategy.rewardToken();
        expect(rewardTokenAddress.toLowerCase()).to.eq(
            process.env.AAVE_TOKEN?.toLowerCase(),
        );

        const receiptToken = await aaveV3Strategy.receiptToken();
        expect(receiptToken.toLowerCase()).to.eq(
            process.env.AAVE_V3_RECEIPT_TOKEN?.toLowerCase(),
        );

        const yieldBoxAddress = await aaveV3Strategy.yieldBox();
        expect(yieldBoxAddress.toLowerCase()).to.eq(
            yieldBox.address.toLowerCase(),
        );

        const currentBalance = await aaveV3Strategy.currentBalance();
        expect(currentBalance.eq(0)).to.be.true;

        const queued = await weth.balanceOf(aaveV3Strategy.address);
        expect(queued.eq(0)).to.be.true;
    });

    it('should allow setting the deposit threshold', async () => {
        const { aaveV3Strategy } = await loadFixture(registerFork);

        const currentThreshold = await aaveV3Strategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await aaveV3Strategy.setDepositThreshold(newThreshold);

        const finalThreshold = await aaveV3Strategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should queue and deposit when threshold is met', async () => {
        const { aaveV3Strategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);
        await yieldBox.registerAsset(
            1,
            weth.address,
            aaveV3Strategy.address,
            0,
        );

        const lendingPoolAddress = await aaveV3Strategy.aaveV3Pool();
        const lendingPoolContract = await ethers.getContractAt(
            'IAaveV3Pool',
            lendingPoolAddress,
        );

        const wethAaveStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            aaveV3Strategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await aaveV3Strategy.setDepositThreshold(amount.mul(3));

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
            aaveV3Strategy.address,
        );
        let aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveV3Strategy.address)
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
        aaveStrategyWethBalance = await weth.balanceOf(aaveV3Strategy.address);
        aaveLendingPoolBalance = aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveV3Strategy.address)
        )[0];
        expect(aaveStrategyWethBalance.eq(0)).to.be.true;
        expect(aaveLendingPoolBalance.gt(0)).to.be.true;
    });

    it('should allow deposits and withdrawals', async () => {
        const {
            aaveV3Strategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);

        const lendingPoolAddress = await aaveV3Strategy.aaveV3Pool();
        const lendingPoolContract = await ethers.getContractAt(
            'IAaveV3Pool',
            lendingPoolAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            aaveV3Strategy.address,
            0,
        );

        const wethAaveStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            aaveV3Strategy.address,
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
            aaveV3Strategy.address.toLowerCase(),
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
            aaveV3Strategy.address,
        );
        const aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveV3Strategy.address)
        )[0];
        expect(aaveStrategyWethBalance.eq(0)).to.be.true;
        expect(aaveLendingPoolBalance.gt(0)).to.be.true; //amount was initially deposited

        await aaveV3Strategy.compound(ethers.utils.toUtf8Bytes('')); //to simulate rewards produced by mocks
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
            await lendingPoolContract.getUserAccountData(aaveV3Strategy.address)
        )[0];
        expect(finalAaveLendingPoolBalance.lte(aaveLendingPoolBalance)).to.be
            .true; //should be less than provided amount as something extra was given on withdrawal
    });

    it('should withdraw from queue', async () => {
        const { aaveV3Strategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);

        const lendingPoolAddress = await aaveV3Strategy.aaveV3Pool();
        const lendingPoolContract = await ethers.getContractAt(
            'IAaveV3Pool',
            lendingPoolAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            aaveV3Strategy.address,
            0,
        );

        const wethAaveStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            aaveV3Strategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await aaveV3Strategy.setDepositThreshold(amount.mul(3));
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
            aaveV3Strategy.address,
        );
        let aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveV3Strategy.address)
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

        aaveStrategyWethBalance = await weth.balanceOf(aaveV3Strategy.address);
        aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveV3Strategy.address)
        )[0];
        expect(aaveStrategyWethBalance.eq(0)).to.be.true;
        expect(aaveLendingPoolBalance.eq(0)).to.be.true;
    });

    it('should compound rewards', async () => {
        const {
            aaveV3Strategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);

        const lendingPoolAddress = await aaveV3Strategy.aaveV3Pool();
        const lendingPoolContract = await ethers.getContractAt(
            'IAaveV3Pool',
            lendingPoolAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            aaveV3Strategy.address,
            0,
        );

        const wethAaveStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            aaveV3Strategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await aaveV3Strategy.setDepositThreshold(amount.div(10000));
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
            aaveV3Strategy.address,
        );
        const aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveV3Strategy.address)
        )[0];
        expect(aaveStrategyWethBalance.eq(0)).to.be.true;
        expect(aaveLendingPoolBalance.gt(0)).to.be.true;

        const stkAave = await aaveV3Strategy.stakedRewardToken();
        const stkAaveContract = await ethers.getContractAt('IStkAave', stkAave);

        let unclaimedStkAave = await stkAaveContract.stakerRewardsToClaim(
            aaveV3Strategy.address,
        );
        let strategyBalanceOfStkAave = await stkAaveContract.balanceOf(
            aaveV3Strategy.address,
        );

        let cooldownBefore = (
            await stkAaveContract.stakersCooldowns(aaveV3Strategy.address)
        )[0];
        expect(cooldownBefore).eq(0);
        await aaveV3Strategy.compound(ethers.utils.toUtf8Bytes(''));
        cooldownBefore = (
            await stkAaveContract.stakersCooldowns(aaveV3Strategy.address)
        )[0];
        if (unclaimedStkAave.add(strategyBalanceOfStkAave).gt(0)) {
            expect(cooldownBefore).gt(0);
        }

        const aaveStrategyWethBalanceMid = await weth.balanceOf(
            aaveV3Strategy.address,
        );
        const aaveLendingPoolBalanceMid = (
            await lendingPoolContract.getUserAccountData(aaveV3Strategy.address)
        )[0];
        expect(aaveStrategyWethBalanceMid).eq(0);
        expect(aaveLendingPoolBalanceMid.gt(aaveLendingPoolBalance)).to.be.true;

        await timeTravel(10 * 86400);

        await aaveV3Strategy.compound(ethers.utils.toUtf8Bytes(''));
        const finalCooldown = (
            await stkAaveContract.stakersCooldowns(aaveV3Strategy.address)
        )[0];
        expect(finalCooldown).eq(cooldownBefore);
        const aaveLendingPoolBalanceFinal = (
            await lendingPoolContract.getUserAccountData(aaveV3Strategy.address)
        )[0];
        expect(aaveLendingPoolBalanceFinal.gt(aaveLendingPoolBalanceMid)).to.be
            .true;

        await timeTravel(100 * 86400);
        await aaveV3Strategy.compound(ethers.utils.toUtf8Bytes(''));

        unclaimedStkAave = await stkAaveContract.stakerRewardsToClaim(
            aaveV3Strategy.address,
        );
        strategyBalanceOfStkAave = await stkAaveContract.balanceOf(
            aaveV3Strategy.address,
        );

        if (unclaimedStkAave.add(strategyBalanceOfStkAave).gt(0)) {
            const newCooldown = (
                await stkAaveContract.stakersCooldowns(aaveV3Strategy.address)
            )[0];
            expect(newCooldown).gt(finalCooldown);
        }
    });

    it('should emergency withdraw', async () => {
        const {
            aaveV3Strategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            eoa1,
        } = await loadFixture(registerFork);

        const lendingPoolAddress = await aaveV3Strategy.aaveV3Pool();
        const lendingPoolContract = await ethers.getContractAt(
            'IAaveV3Pool',
            lendingPoolAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            aaveV3Strategy.address,
            0,
        );

        const wethAaveStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            aaveV3Strategy.address,
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
            await lendingPoolContract.getUserAccountData(aaveV3Strategy.address)
        )[0];
        let strategyWethBalance = await weth.balanceOf(aaveV3Strategy.address);

        expect(strategyWethBalance.eq(0)).true;
        expect(invested.gt(0)).to.be.true;

        await expect(aaveV3Strategy.connect(eoa1).emergencyWithdraw()).to.be
            .reverted;

        await aaveV3Strategy.emergencyWithdraw();

        invested = (
            await lendingPoolContract.getUserAccountData(aaveV3Strategy.address)
        )[0];
        strategyWethBalance = await weth.balanceOf(aaveV3Strategy.address);
        expect(strategyWethBalance.gt(0)).true;
        expect(invested.eq(0)).to.be.true;
    });
});
