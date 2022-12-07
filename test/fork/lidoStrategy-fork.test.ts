import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerFork } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('LidoStrategy fork test', () => {
    it('should test initial strategy values', async () => {
        const { lidoEthStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const name = await lidoEthStrategy.name();
        const description = await lidoEthStrategy.description();

        expect(name).eq('Lido-ETH');
        expect(description).eq('Lido-ETH strategy for wrapped native assets');

        const contractAddress = await lidoEthStrategy.contractAddress();
        expect(contractAddress.toLowerCase()).eq(weth.address.toLowerCase());

        const stEthAddress = await lidoEthStrategy.stEth();
        expect(stEthAddress.toLowerCase()).to.eq(
            process.env.LIDO_STETH?.toLowerCase(),
        );

        const curveStEthPool = await lidoEthStrategy.curveStEthPool();
        expect(curveStEthPool.toLowerCase()).to.eq(
            process.env.CURVE_STETH_POOL?.toLowerCase(),
        );

        const yieldBoxAddress = await lidoEthStrategy.yieldBox();
        expect(yieldBoxAddress.toLowerCase()).to.eq(
            yieldBox.address.toLowerCase(),
        );

        const currentBalance = await lidoEthStrategy.currentBalance();
        expect(currentBalance.eq(0)).to.be.true;

        const queued = await weth.balanceOf(lidoEthStrategy.address);
        expect(queued.eq(0)).to.be.true;
    });

    it('should allow setting the deposit threshold', async () => {
        const { lidoEthStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const currentThreshold = await lidoEthStrategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await lidoEthStrategy.setDepositThreshold(newThreshold);

        const finalThreshold = await lidoEthStrategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should queue and deposit when threshold is met', async () => {
        const { lidoEthStrategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);

        const stEthAddress = await lidoEthStrategy.stEth();
        const stEthContract = await ethers.getContractAt(
            'IStEth',
            stEthAddress,
        );

        const curveStEthPoolAddress = await lidoEthStrategy.curveStEthPool();

        await yieldBox.registerAsset(
            1,
            weth.address,
            lidoEthStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            lidoEthStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await lidoEthStrategy.setDepositThreshold(amount.mul(3));
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

        let strategyWethBalance = await weth.balanceOf(lidoEthStrategy.address);
        let stEthBalance = await stEthContract.balanceOf(
            lidoEthStrategy.address,
        );
        expect(strategyWethBalance.gt(0)).to.be.true;
        expect(stEthBalance.eq(0)).to.be.true;
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
        strategyWethBalance = await weth.balanceOf(lidoEthStrategy.address);
        stEthBalance = await stEthContract.balanceOf(lidoEthStrategy.address);
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(stEthBalance.gt(0)).to.be.true;
    });

    it('should allow deposits and withdrawals', async () => {
        const {
            lidoEthStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);

        const stEthAddress = await lidoEthStrategy.stEth();
        const stEthContract = await ethers.getContractAt(
            'IStEth',
            stEthAddress,
        );

        const curveStEthPoolAddress = await lidoEthStrategy.curveStEthPool();

        await yieldBox.registerAsset(
            1,
            weth.address,
            lidoEthStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            lidoEthStrategy.address,
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
            lidoEthStrategy.address.toLowerCase(),
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

        timeTravel(100 * 86400);
        let strategyWethBalance = await weth.balanceOf(lidoEthStrategy.address);
        let stEthBalance = await stEthContract.balanceOf(
            lidoEthStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(stEthBalance.gt(0)).to.be.true;
        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId); // await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await expect(
            yieldBox.withdraw(
                wethStrategyAssetId,
                deployer.address,
                deployer.address,
                0,
                share,
            ),
        ).to.be.revertedWith('LidoStrategy: not enough');
    });

    it('should withdraw from queue', async () => {
        const {
            lidoEthStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
        } = await loadFixture(registerFork);

        const stEthAddress = await lidoEthStrategy.stEth();
        const stEthContract = await ethers.getContractAt(
            'IStEth',
            stEthAddress,
        );

        const curveStEthPoolAddress = await lidoEthStrategy.curveStEthPool();

        await yieldBox.registerAsset(
            1,
            weth.address,
            lidoEthStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            lidoEthStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);

        await lidoEthStrategy.setDepositThreshold(amount.mul(3));

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

        let strategyWethBalance = await weth.balanceOf(lidoEthStrategy.address);
        let stEthBalance = await stEthContract.balanceOf(
            lidoEthStrategy.address,
        );

        expect(strategyWethBalance.gt(0)).to.be.true;
        expect(stEthBalance.eq(0)).to.be.true;

        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        strategyWethBalance = await weth.balanceOf(lidoEthStrategy.address);
        stEthBalance = await stEthContract.balanceOf(lidoEthStrategy.address);
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(stEthBalance.eq(0)).to.be.true;
    });

    it('should emergency withdraw', async () => {
        const {
            lidoEthStrategy,
            weth,
            yieldBox,
            deployer,
            binanceWallet,
            eoa1,
        } = await loadFixture(registerFork);

        const stEthAddress = await lidoEthStrategy.stEth();
        const stEthContract = await ethers.getContractAt(
            'IStEth',
            stEthAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            lidoEthStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            lidoEthStrategy.address,
            0,
        );

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

        let invested = await stEthContract.balanceOf(lidoEthStrategy.address);
        let strategyWethBalance = await weth.balanceOf(lidoEthStrategy.address);
        expect(strategyWethBalance.eq(0)).true;
        expect(invested.gt(0)).to.be.true;

        await expect(lidoEthStrategy.connect(eoa1).emergencyWithdraw()).to.be
            .reverted;

        await lidoEthStrategy.emergencyWithdraw();

        invested = await stEthContract.balanceOf(lidoEthStrategy.address);
        strategyWethBalance = await weth.balanceOf(lidoEthStrategy.address);
        expect(strategyWethBalance.gt(0)).true;
        expect(invested.lt(10)).to.be.true;
    });
});
