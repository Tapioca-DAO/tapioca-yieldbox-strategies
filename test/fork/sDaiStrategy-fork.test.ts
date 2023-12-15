import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadNetworkFork, registerFork } from '../test.utils';

describe('sDaiStrategy-fork test', () => {
    before(function () {
        if (process.env.NETWORK != 'ethereum') {
            this.skip();
        }
        loadNetworkFork();
    });

    it('should test initial strategy values', async () => {
        const { tDai, sDaiStrategy } = await loadFixture(registerFork);

        const registeredToken = await sDaiStrategy.contractAddress();
        expect(registeredToken.toLowerCase()).to.eq(tDai.address.toLowerCase());

        const registeredSavings = await sDaiStrategy.sDai();
        expect(registeredSavings.toLowerCase()).to.eq(
            process.env.SDAI!.toLowerCase(),
        );

        const paused = await sDaiStrategy.paused();
        expect(paused).to.be.false;
    });

    it('should allow setting the deposit threshold', async () => {
        const { sDaiStrategy } = await loadFixture(registerFork);

        const currentThreshold = await sDaiStrategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await sDaiStrategy.setDepositThreshold(newThreshold);

        const finalThreshold = await sDaiStrategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should queue and deposit when threshold is met', async () => {
        const {
            dai,
            tDai,
            sDaiStrategy,
            deployer,
            timeTravel,
            yieldBox,
            binanceWallet,
        } = await loadFixture(registerFork);

        const sDai = await ethers.getContractAt(
            'ISavingsDai',
            await sDaiStrategy.sDai(),
        );

        await yieldBox.registerAsset(1, tDai.address, sDaiStrategy.address, 0);
        const sDaiStrategyAssetId = await yieldBox.ids(
            1,
            tDai.address,
            sDaiStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await sDaiStrategy.setDepositThreshold(amount.mul(3));

        await dai.connect(binanceWallet).transfer(deployer.address, amount);
        await dai.approve(tDai.address, amount);
        await tDai.wrap(deployer.address, deployer.address, amount);

        const tDaiDeployerBalanceBefore = await tDai.balanceOf(
            deployer.address,
        );
        expect(tDaiDeployerBalanceBefore.eq(amount)).to.be.true;

        const sDaiStrategyBalanceBefore = await sDai.balanceOf(
            sDaiStrategy.address,
        );
        expect(sDaiStrategyBalanceBefore.eq(0)).to.be.true;

        await tDai.approve(yieldBox.address, amount);
        await yieldBox.depositAsset(
            sDaiStrategyAssetId,
            deployer.address,
            deployer.address,
            amount,
            0,
        );

        const queued = await tDai.balanceOf(sDaiStrategy.address);
        expect(queued.eq(amount)).to.be.true;

        let sDaiStrategyBalanceAfter = await sDai.balanceOf(
            sDaiStrategy.address,
        );
        expect(sDaiStrategyBalanceBefore.eq(0)).to.be.true;
        await dai
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(3));
        await dai.approve(tDai.address, amount.mul(3));
        await tDai.wrap(deployer.address, deployer.address, amount.mul(3));

        await tDai.approve(yieldBox.address, amount.mul(3));
        await yieldBox.depositAsset(
            sDaiStrategyAssetId,
            deployer.address,
            deployer.address,
            amount.mul(3),
            0,
        );

        sDaiStrategyBalanceAfter = await sDai.balanceOf(sDaiStrategy.address);
        expect(sDaiStrategyBalanceAfter.gt(0)).to.be.true;
        expect(sDaiStrategyBalanceAfter.lte(amount.mul(4))).to.be.true;
    });

    it('should allow deposits and withdrawals', async () => {
        const {
            dai,
            tDai,
            sDaiStrategy,
            deployer,
            timeTravel,
            yieldBox,
            binanceWallet,
        } = await loadFixture(registerFork);

        const sDai = await ethers.getContractAt(
            'ISavingsDai',
            await sDaiStrategy.sDai(),
        );

        await yieldBox.registerAsset(1, tDai.address, sDaiStrategy.address, 0);
        const sDaiStrategyAssetId = await yieldBox.ids(
            1,
            tDai.address,
            sDaiStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await sDaiStrategy.setDepositThreshold(amount.mul(3));

        await dai.connect(binanceWallet).transfer(deployer.address, amount);
        await dai.approve(tDai.address, amount);
        await tDai.wrap(deployer.address, deployer.address, amount);

        const tDaiDeployerBalanceBefore = await tDai.balanceOf(
            deployer.address,
        );
        expect(tDaiDeployerBalanceBefore.eq(amount)).to.be.true;

        const sDaiStrategyBalanceBefore = await sDai.balanceOf(
            sDaiStrategy.address,
        );
        expect(sDaiStrategyBalanceBefore.eq(0)).to.be.true;

        await tDai.approve(yieldBox.address, amount);
        await yieldBox.depositAsset(
            sDaiStrategyAssetId,
            deployer.address,
            deployer.address,
            amount,
            0,
        );

        const queued = await tDai.balanceOf(sDaiStrategy.address);
        expect(queued.eq(amount)).to.be.true;

        let sDaiStrategyBalanceAfter = await sDai.balanceOf(
            sDaiStrategy.address,
        );
        expect(sDaiStrategyBalanceBefore.eq(0)).to.be.true;
        await dai
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(3));
        await dai.approve(tDai.address, amount.mul(3));
        await tDai.wrap(deployer.address, deployer.address, amount.mul(3));

        await tDai.approve(yieldBox.address, amount.mul(3));
        await yieldBox.depositAsset(
            sDaiStrategyAssetId,
            deployer.address,
            deployer.address,
            amount.mul(3),
            0,
        );

        sDaiStrategyBalanceAfter = await sDai.balanceOf(sDaiStrategy.address);
        expect(sDaiStrategyBalanceAfter.gt(0)).to.be.true;
        expect(sDaiStrategyBalanceAfter.lte(amount.mul(4))).to.be.true;

        await timeTravel(100 * 86400); //skip 100 days
        const previewWithdraw = await sDai.previewRedeem(
            sDaiStrategyBalanceAfter,
        );
        expect(previewWithdraw.gte(amount.mul(4))).to.be.true;

        const balanceOfYb = await yieldBox.balanceOf(
            deployer.address,
            sDaiStrategyAssetId,
        );

        const daiBefore = await tDai.balanceOf(deployer.address);
        await yieldBox.withdraw(
            sDaiStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            balanceOfYb,
        );
        const daiAfter = await tDai.balanceOf(deployer.address);
        expect(daiAfter.sub(daiBefore).gte(amount.mul(4))).to.be.true;
    });

    it('should withdraw from queue', async () => {
        const {
            dai,
            tDai,
            sDaiStrategy,
            deployer,
            timeTravel,
            yieldBox,
            binanceWallet,
        } = await loadFixture(registerFork);

        const sDai = await ethers.getContractAt(
            'ISavingsDai',
            await sDaiStrategy.sDai(),
        );

        await yieldBox.registerAsset(1, tDai.address, sDaiStrategy.address, 0);
        const sDaiStrategyAssetId = await yieldBox.ids(
            1,
            tDai.address,
            sDaiStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await sDaiStrategy.setDepositThreshold(amount.mul(3));

        await dai.connect(binanceWallet).transfer(deployer.address, amount);
        await dai.approve(tDai.address, amount);
        await tDai.wrap(deployer.address, deployer.address, amount);

        const tDaiDeployerBalanceBefore = await tDai.balanceOf(
            deployer.address,
        );
        expect(tDaiDeployerBalanceBefore.eq(amount)).to.be.true;

        const sDaiStrategyBalanceBefore = await sDai.balanceOf(
            sDaiStrategy.address,
        );
        expect(sDaiStrategyBalanceBefore.eq(0)).to.be.true;

        await tDai.approve(yieldBox.address, amount);
        await yieldBox.depositAsset(
            sDaiStrategyAssetId,
            deployer.address,
            deployer.address,
            amount,
            0,
        );

        let sDaiStrategyBalanceAfter = await sDai.balanceOf(
            sDaiStrategy.address,
        );

        sDaiStrategyBalanceAfter = await sDai.balanceOf(sDaiStrategy.address);
        expect(sDaiStrategyBalanceAfter.eq(0)).to.be.true;

        const queuedBefore = await tDai.balanceOf(sDaiStrategy.address);
        expect(queuedBefore.eq(amount)).to.be.true;

        await yieldBox.withdraw(
            sDaiStrategyAssetId,
            deployer.address,
            deployer.address,
            amount.div(2),
            0,
        );

        const queuedAfter = await tDai.balanceOf(sDaiStrategy.address);
        expect(queuedAfter.eq(amount.div(2))).to.be.true;

        sDaiStrategyBalanceAfter = await sDai.balanceOf(sDaiStrategy.address);
        expect(sDaiStrategyBalanceAfter.eq(0)).to.be.true;
    });

    it('should handle fees', async () => {
        const { dai, tDai, sDaiStrategy, deployer, yieldBox, binanceWallet } =
            await loadFixture(registerFork);

        const sDai = await ethers.getContractAt(
            'ISavingsDai',
            await sDaiStrategy.sDai(),
        );

        await yieldBox.registerAsset(1, tDai.address, sDaiStrategy.address, 0);
        const sDaiStrategyAssetId = await yieldBox.ids(
            1,
            tDai.address,
            sDaiStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);

        await dai.connect(binanceWallet).transfer(deployer.address, amount);
        await dai.approve(tDai.address, amount);
        await tDai.wrap(deployer.address, deployer.address, amount);

        await tDai.approve(yieldBox.address, amount);
        await yieldBox.depositAsset(
            sDaiStrategyAssetId,
            deployer.address,
            deployer.address,
            amount,
            0,
        );

        await yieldBox.withdraw(
            sDaiStrategyAssetId,
            deployer.address,
            deployer.address,
            amount,
            0,
        );

        const pendingFees = await sDaiStrategy.feesPending();
        expect(pendingFees).to.be.equal(
            amount.mul(await sDaiStrategy.FEE_BPS()).div(10000),
        );

        // "Burn" current holdings
        const [, _void] = await ethers.getSigners();
        await tDai.transfer(
            _void.address,
            await tDai.balanceOf(deployer.address),
        );
        expect(await tDai.balanceOf(deployer.address)).to.be.equal(0);

        expect(await sDaiStrategy.feeRecipient()).to.be.equal(deployer.address);
        await sDaiStrategy.withdrawFees(pendingFees);

        expect(await sDaiStrategy.feesPending()).to.be.approximately(0, 1);
        expect(await tDai.balanceOf(deployer.address)).to.be.approximately(
            pendingFees,
            1,
        );
    });
});
