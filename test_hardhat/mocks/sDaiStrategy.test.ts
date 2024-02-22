import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerMocks } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe.only('sDaiStrategy test', () => {
    it('should test initial strategy values', async () => {
        const { dai, tDai, sDai, sDaiStrategy, deployer } = await loadFixture(
            registerMocks,
        );

        const registeredToken = await sDaiStrategy.contractAddress();
        expect(registeredToken).to.eq(tDai.address);

        const registeredSavings = await sDaiStrategy.sDai();
        expect(registeredSavings).to.eq(sDai.address);

        const paused = await sDaiStrategy.paused();
        expect(paused).to.be.false;
    });

    it('should allow setting the deposit threshold', async () => {
        const { sDaiStrategy } = await loadFixture(registerMocks);

        const currentThreshold = await sDaiStrategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await sDaiStrategy.setDepositThreshold(newThreshold);

        const finalThreshold = await sDaiStrategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should queue and deposit when threshold is met', async () => {
        const { sDaiStrategy, sDai, dai, tDai, deployer, yieldBox } =
            await loadFixture(registerMocks);

        await yieldBox.registerAsset(1, tDai.address, sDaiStrategy.address, 0);
        const sDaiStrategyAssetId = await yieldBox.ids(
            1,
            tDai.address,
            sDaiStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await sDaiStrategy.setDepositThreshold(amount.mul(3));

        await dai.mintTo(deployer.address, amount);
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

        await dai.mintTo(deployer.address, amount.mul(3));
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
        const { sDaiStrategy, sDai, dai, tDai, deployer, yieldBox } =
            await loadFixture(registerMocks);

        await yieldBox.registerAsset(1, tDai.address, sDaiStrategy.address, 0);
        const sDaiStrategyAssetId = await yieldBox.ids(
            1,
            tDai.address,
            sDaiStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await sDaiStrategy.setDepositThreshold(amount);

        await dai.mintTo(deployer.address, amount);
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

        let tDaiDeployerBalanceAfter = await tDai.balanceOf(deployer.address);
        expect(tDaiDeployerBalanceAfter.eq(0)).to.be.true;

        let sDaiStrategyBalanceAfter = await sDai.balanceOf(
            sDaiStrategy.address,
        );

        sDaiStrategyBalanceAfter = await sDai.balanceOf(sDaiStrategy.address);
        expect(sDaiStrategyBalanceAfter.gt(0)).to.be.true;
        expect(sDaiStrategyBalanceAfter.lte(amount)).to.be.true;

        await yieldBox.withdraw(
            sDaiStrategyAssetId,
            deployer.address,
            deployer.address,
            amount.div(2),
            0,
        );

        const fees = await sDaiStrategy.feesPending();
        sDaiStrategyBalanceAfter = await sDai.balanceOf(sDaiStrategy.address);
        expect(sDaiStrategyBalanceAfter.gt(0)).to.be.true;
        expect(sDaiStrategyBalanceAfter.sub(fees)).to.be.lte(amount.div(2));

        tDaiDeployerBalanceAfter = await tDai.balanceOf(deployer.address);
        expect(tDaiDeployerBalanceAfter).to.be.equal(amount.div(2).sub(fees));
    });

    it('should withdraw from queue', async () => {
        const { sDaiStrategy, sDai, dai, tDai, deployer, yieldBox } =
            await loadFixture(registerMocks);

        await yieldBox.registerAsset(1, tDai.address, sDaiStrategy.address, 0);
        const sDaiStrategyAssetId = await yieldBox.ids(
            1,
            tDai.address,
            sDaiStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await sDaiStrategy.setDepositThreshold(amount.mul(3));

        await dai.mintTo(deployer.address, amount);
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
});
