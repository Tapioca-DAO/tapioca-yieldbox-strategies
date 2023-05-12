import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerFork } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('YearnStrategy fork test', () => {
    it('should test initial strategy values', async () => {
        const { yearnStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const name = await yearnStrategy.name();
        const description = await yearnStrategy.description();

        expect(name).eq('Yearn');
        expect(description).eq('Yearn strategy for wrapped native assets');

        const contractAddress = await yearnStrategy.contractAddress();
        expect(contractAddress.toLowerCase()).eq(weth.address.toLowerCase());

        const vaultAddress = await yearnStrategy.vault();
        expect(vaultAddress.toLowerCase()).to.eq(
            process.env.YEARN_ETH_VAULT?.toLowerCase(),
        );

        const yieldBoxAddress = await yearnStrategy.yieldBox();
        expect(yieldBoxAddress.toLowerCase()).to.eq(
            yieldBox.address.toLowerCase(),
        );

        const currentBalance = await yearnStrategy.currentBalance();
        expect(currentBalance.eq(0)).to.be.true;

        const queued = await weth.balanceOf(yearnStrategy.address);
        expect(queued.eq(0)).to.be.true;
    });

    it('should allow setting the deposit threshold', async () => {
        const { yearnStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const currentThreshold = await yearnStrategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await yearnStrategy.setDepositThreshold(newThreshold);

        const finalThreshold = await yearnStrategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should queue and deposit when threshold is met', async () => {
        const {
            yearnStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
        } = await loadFixture(registerFork);

        const yearnVaultAddress = await yearnStrategy.vault();
        const yearnVaultContract = await ethers.getContractAt(
            'IYearnVault',
            yearnVaultAddress,
        );

        await yieldBox.registerAsset(1, weth.address, yearnStrategy.address, 0);

        const wethYearnStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            yearnStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await yearnStrategy.setDepositThreshold(amount.mul(3));

        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(
            wethYearnStrategyAssetId,
            amount,
            false,
        );
        await yieldBox.depositAsset(
            wethYearnStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let strategyWethBalance = await weth.balanceOf(yearnStrategy.address);
        let poolBalance = await yearnVaultContract.balanceOf(
            yearnStrategy.address,
        );
        expect(strategyWethBalance.gt(0)).to.be.true;
        expect(poolBalance.eq(0)).to.be.true;

        share = await yieldBox.toShare(
            wethYearnStrategyAssetId,
            amount.mul(3),
            false,
        );
        await yieldBox.depositAsset(
            wethYearnStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share.mul(3),
        );
        strategyWethBalance = await weth.balanceOf(yearnStrategy.address);
        poolBalance = await yearnVaultContract.balanceOf(yearnStrategy.address);
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(poolBalance.gt(0)).to.be.true;
    });

    it('should allow deposits and withdrawals', async () => {
        const {
            yearnStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
        } = await loadFixture(registerFork);

        await yieldBox.registerAsset(1, weth.address, yearnStrategy.address, 0);

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            yearnStrategy.address,
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
            yearnStrategy.address.toLowerCase(),
        );
        expect(assetInfo.tokenId).to.eq(0);

        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
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

        const strategyWethBalance = await weth.balanceOf(yearnStrategy.address);
        const poolBalance = await yearnStrategy.currentBalance();
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(poolBalance.lte(amount)).to.be.true;
        expect(poolBalance.gte(amount.sub(100))).to.be.true;
        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        const vaultFinalPoolBalance = await yearnStrategy.currentBalance();
        expect(vaultFinalPoolBalance.lte(100)).to.be.true;
    });

    it('should withdraw from queue', async () => {
        const { yearnStrategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);

        const yearnVaultAddress = await yearnStrategy.vault();
        const yearnVaultContract = await ethers.getContractAt(
            'IYearnVault',
            yearnVaultAddress,
        );

        await yieldBox.registerAsset(1, weth.address, yearnStrategy.address, 0);

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            yearnStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await yearnStrategy.setDepositThreshold(amount.mul(3));

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

        let aaveStrategyWethBalance = await weth.balanceOf(
            yearnStrategy.address,
        );
        let aaveLendingPoolBalance = await yearnVaultContract.balanceOf(
            yearnStrategy.address,
        );
        expect(aaveStrategyWethBalance.gt(0)).to.be.true;
        expect(aaveLendingPoolBalance.eq(0)).to.be.true;

        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        aaveStrategyWethBalance = await weth.balanceOf(yearnStrategy.address);
        aaveLendingPoolBalance = await yearnVaultContract.balanceOf(
            yearnStrategy.address,
        );
        expect(aaveStrategyWethBalance.lt(100)).to.be.true;
        expect(aaveLendingPoolBalance.eq(0)).to.be.true;
    });

    it('should emergency withdraw', async () => {
        const {
            yearnStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            eoa1,
        } = await loadFixture(registerFork);
        const yearnVaultAddress = await yearnStrategy.vault();
        const yearnVaultContract = await ethers.getContractAt(
            'IYearnVault',
            yearnVaultAddress,
        );

        await yieldBox.registerAsset(1, weth.address, yearnStrategy.address, 0);

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            yearnStrategy.address,
            0,
        );

        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
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

        let invested = await yearnVaultContract.balanceOf(
            yearnStrategy.address,
        );
        let strategyWethBalance = await weth.balanceOf(yearnStrategy.address);
        expect(strategyWethBalance.eq(0)).true;
        expect(invested.gt(0)).to.be.true;

        await expect(yearnStrategy.connect(eoa1).emergencyWithdraw()).to.be
            .reverted;

        await yearnStrategy.emergencyWithdraw();

        invested = await yearnVaultContract.balanceOf(yearnStrategy.address);
        strategyWethBalance = await weth.balanceOf(yearnStrategy.address);
        expect(strategyWethBalance.gt(0)).true;
        expect(invested.lt(10)).to.be.true;
    });
});
