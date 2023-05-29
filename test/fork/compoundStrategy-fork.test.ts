import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerFork } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import _ from 'lodash';

describe.skip('CompoundStrategy fork test', () => {
    before(function () {
        if (process.env.NODE_ENV != 'mainnet') {
            this.skip();
        }
    });

    it('should test initial strategy values', async () => {
        const { compoundStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const name = await compoundStrategy.name();
        const description = await compoundStrategy.description();

        expect(name).eq('Compound');
        expect(description).eq('Compound strategy for wrapped native assets');

        const contractAddress = await compoundStrategy.contractAddress();
        expect(contractAddress.toLowerCase()).eq(weth.address.toLowerCase());

        const cTokenAddress = await compoundStrategy.cToken();
        expect(cTokenAddress).to.eq(process.env.COMPOUND_ETH!);

        const yieldBoxAddress = await compoundStrategy.yieldBox();
        expect(yieldBoxAddress.toLowerCase()).to.eq(
            yieldBox.address.toLowerCase(),
        );

        const currentBalance = await compoundStrategy.currentBalance();
        expect(currentBalance.eq(0)).to.be.true;

        const queued = await weth.balanceOf(compoundStrategy.address);
        expect(queued.eq(0)).to.be.true;
    });

    it('should allow setting the deposit threshold', async () => {
        const { compoundStrategy } = await loadFixture(registerFork);

        const currentThreshold = await compoundStrategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await compoundStrategy.setDepositThreshold(newThreshold);

        const finalThreshold = await compoundStrategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should queue and deposit when threshold is met', async () => {
        const { compoundStrategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);

        const cTokenAddress = await compoundStrategy.cToken();
        const cTokenContract = await ethers.getContractAt(
            'ICToken',
            cTokenAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            compoundStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            compoundStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await compoundStrategy.setDepositThreshold(amount.mul(3));

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
            compoundStrategy.address,
        );
        let poolBalance = await cTokenContract.balanceOf(
            compoundStrategy.address,
        );
        expect(strategyWethBalance.gt(0)).to.be.true;
        expect(poolBalance.eq(0)).to.be.true;

        share = await yieldBox.toShare(
            wethStrategyAssetId,
            amount.mul(3),
            false,
        );
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share.mul(3),
        );
        strategyWethBalance = await weth.balanceOf(compoundStrategy.address);
        poolBalance = await cTokenContract.balanceOf(compoundStrategy.address);
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(poolBalance.gt(0)).to.be.true;
    });

    it('should allow deposits and withdrawals', async () => {
        const {
            compoundStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
        } = await loadFixture(registerFork);

        const cTokenAddress = await compoundStrategy.cToken();
        const cTokenContract = await ethers.getContractAt(
            'ICToken',
            cTokenAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            compoundStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            compoundStrategy.address,
            0,
        );
        expect(wethStrategyAssetId).to.not.eq(wethAssetId);
        const assetsCount = await yieldBox.assetCount();
        const assetInfo = await yieldBox.assets(assetsCount.sub(1));
        expect(assetInfo.tokenType).to.eq(1);
        expect(assetInfo.contractAddress.toLowerCase()).to.eq(
            weth.address.toLowerCase(),
        );
        expect(assetInfo.strategy.toLowerCase()).to.eq(
            compoundStrategy.address.toLowerCase(),
        );
        expect(assetInfo.tokenId).to.eq(0);

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
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

        const strategyWethBalance = await weth.balanceOf(
            compoundStrategy.address,
        );
        const poolBalance = await cTokenContract.balanceOf(
            compoundStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(poolBalance.lte(amount)).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        const vaultFinalPoolBalance = await cTokenContract.balanceOf(
            compoundStrategy.address,
        );
        expect(vaultFinalPoolBalance.lte(10)).to.be.true;
    });

    it('should withdraw from queue', async () => {
        const { compoundStrategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);

        const cTokenAddress = await compoundStrategy.cToken();
        const cTokenContract = await ethers.getContractAt(
            'ICToken',
            cTokenAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            compoundStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            compoundStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await compoundStrategy.setDepositThreshold(amount.mul(3));

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
            compoundStrategy.address,
        );
        let poolBalance = await cTokenContract.balanceOf(
            compoundStrategy.address,
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

        strategyWethBalance = await weth.balanceOf(compoundStrategy.address);
        poolBalance = await cTokenContract.balanceOf(compoundStrategy.address);
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(poolBalance.eq(0)).to.be.true;
    });

    it('should emergency withdraw', async () => {
        const {
            compoundStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            eoa1,
        } = await loadFixture(registerFork);

        const cTokenAddress = await compoundStrategy.cToken();
        const cTokenContract = await ethers.getContractAt(
            'ICToken',
            cTokenAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            compoundStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            compoundStrategy.address,
            0,
        );
        expect(wethStrategyAssetId).to.not.eq(wethAssetId);

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
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

        let invested = await cTokenContract.balanceOf(compoundStrategy.address);
        let strategyWethBalance = await weth.balanceOf(
            compoundStrategy.address,
        );

        expect(strategyWethBalance.eq(0)).true;
        expect(invested.gt(0)).to.be.true;

        await expect(compoundStrategy.connect(eoa1).emergencyWithdraw()).to.be
            .reverted;

        await compoundStrategy.emergencyWithdraw();

        invested = await cTokenContract.balanceOf(compoundStrategy.address);
        strategyWethBalance = await weth.balanceOf(compoundStrategy.address);
        expect(strategyWethBalance.gt(0)).true;
        expect(invested.eq(0)).to.be.true;
    });
});
