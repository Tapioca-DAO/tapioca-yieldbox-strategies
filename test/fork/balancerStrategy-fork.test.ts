import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerFork } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import _ from 'lodash';

describe.skip('BalancerStrategy fork test', () => {
    before(function () {
        if (process.env.NODE_ENV != 'mainnet') {
            this.skip();
        }
    });

    it('should test initial strategy values', async () => {
        const { balancerStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const name = await balancerStrategy.name();
        const description = await balancerStrategy.description();

        expect(name).eq('Balancer');
        expect(description).eq('Balancer strategy for wrapped native assets');

        const contractAddress = await balancerStrategy.contractAddress();
        expect(contractAddress.toLowerCase()).eq(weth.address.toLowerCase());

        const yieldBoxAddress = await balancerStrategy.yieldBox();
        expect(yieldBoxAddress.toLowerCase()).to.eq(
            yieldBox.address.toLowerCase(),
        );

        const currentBalance = await balancerStrategy.currentBalance();
        expect(currentBalance.eq(0)).to.be.true;

        const vaultAddress = await balancerStrategy.vault();
        expect(vaultAddress.toLowerCase()).eq(
            process.env.BALANCER_BAL_ETH_VAULT?.toLowerCase(),
        );

        const poolAddress = await balancerStrategy.pool();
        expect(poolAddress.toLowerCase()).eq(
            process.env.BALANCER_POOL?.toLowerCase(),
        );

        const helperAddress = await balancerStrategy.helpers();
        expect(helperAddress.toLowerCase()).eq(
            process.env.BALANCER_HELPERS?.toLowerCase(),
        );

        const queued = await weth.balanceOf(balancerStrategy.address);
        expect(queued.eq(0)).to.be.true;
    });

    it('should allow setting the deposit threshold', async () => {
        const { balancerStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const currentThreshold = await balancerStrategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await balancerStrategy.setDepositThreshold(newThreshold);

        const finalThreshold = await balancerStrategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should queue and deposit when threshold is met', async () => {
        const { balancerStrategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);

        const lpTokenAddress = await balancerStrategy.pool();
        const lpTokenContract = await ethers.getContractAt(
            'IBalancerPool',
            lpTokenAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            balancerStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            balancerStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await balancerStrategy.setDepositThreshold(amount.mul(3));

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
            balancerStrategy.address,
        );
        let poolBalance = await lpTokenContract.balanceOf(
            balancerStrategy.address,
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
        strategyWethBalance = await weth.balanceOf(balancerStrategy.address);
        poolBalance = await lpTokenContract.balanceOf(balancerStrategy.address);
        expect(strategyWethBalance.lte(amount)).to.be.true;
        expect(poolBalance.gt(0)).to.be.true;
    });

    it('should allow deposits and withdrawals', async () => {
        const {
            balancerStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);

        const lpTokenAddress = await balancerStrategy.pool();
        const lpTokenContract = await ethers.getContractAt(
            'IBalancerPool',
            lpTokenAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            balancerStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            balancerStrategy.address,
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
            balancerStrategy.address.toLowerCase(),
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

        const strategyWethBalance = await weth.balanceOf(
            balancerStrategy.address,
        );
        const poolBalance = await lpTokenContract.balanceOf(
            balancerStrategy.address,
        );
        expect(strategyWethBalance.lt(amount)).to.be.true;
        expect(poolBalance.gt(0)).to.be.true;

        timeTravel(100 * 86400);

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        const withdrawalAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            share,
            false,
        );

        const wethStratBalance = await weth.balanceOf(balancerStrategy.address);
        const obtainable = (
            await balancerStrategy.callStatic.updateCache()
        ).add(wethStratBalance);

        if (obtainable.gte(withdrawalAmount)) {
            await yieldBox.withdraw(
                wethStrategyAssetId,
                deployer.address,
                deployer.address,
                0,
                share,
            );
            const vaultFinalPoolBalance = await lpTokenContract.balanceOf(
                balancerStrategy.address,
            );
            expect(vaultFinalPoolBalance.lte(poolBalance)).to.be.true;
        } else {
            await expect(
                yieldBox.withdraw(
                    wethStrategyAssetId,
                    deployer.address,
                    deployer.address,
                    0,
                    share,
                ),
            ).to.be.revertedWith('BalancerStrategy: not enough');
        }
    });

    it('should withdraw from queue', async () => {
        const { balancerStrategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);

        const lpTokenAddress = await balancerStrategy.pool();
        const lpTokenContract = await ethers.getContractAt(
            'IBalancerPool',
            lpTokenAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            balancerStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            balancerStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await balancerStrategy.setDepositThreshold(amount.mul(3));

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
            balancerStrategy.address,
        );
        let poolBalance = await lpTokenContract.balanceOf(
            balancerStrategy.address,
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

        strategyWethBalance = await weth.balanceOf(balancerStrategy.address);
        poolBalance = await lpTokenContract.balanceOf(balancerStrategy.address);
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(poolBalance.eq(0)).to.be.true;
    });

    it('should emergency withdraw', async () => {
        const {
            balancerStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            eoa1,
        } = await loadFixture(registerFork);

        const lpTokenAddress = await balancerStrategy.pool();
        const lpTokenContract = await ethers.getContractAt(
            'IBalancerPool',
            lpTokenAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            balancerStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            balancerStrategy.address,
            0,
        );
        expect(wethStrategyAssetId).to.not.eq(wethAssetId);

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

        let invested = await balancerStrategy.callStatic.updateCache();
        let strategyWethBalance = await weth.balanceOf(
            balancerStrategy.address,
        );
        expect(invested.gt(0)).to.be.true;

        await expect(balancerStrategy.connect(eoa1).emergencyWithdraw()).to.be
            .reverted;

        await balancerStrategy.emergencyWithdraw();

        invested = await balancerStrategy.callStatic.updateCache();
        strategyWethBalance = await weth.balanceOf(balancerStrategy.address);
        expect(strategyWethBalance.gt(0)).true;
        expect(invested.eq(0)).to.be.true;
    });
});
