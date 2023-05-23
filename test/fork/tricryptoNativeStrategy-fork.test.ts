import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerFork } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('TricryptoNativeStrategy fork test', () => {
    it('should test initial strategy values', async () => {
        const { tricryptoNativeStrategy, tricryptoLPGtter, weth, yieldBox } =
            await loadFixture(registerFork);

        const name = await tricryptoNativeStrategy.name();
        const description = await tricryptoNativeStrategy.description();

        expect(name).eq('Curve-Tricrypto-Native');
        expect(description).eq(
            'Curve-Tricrypto strategy for wrapped native assets',
        );

        const contractAddress = await tricryptoNativeStrategy.contractAddress();
        expect(contractAddress.toLowerCase()).eq(weth.address.toLowerCase());

        const lpGaugeAddress = await tricryptoNativeStrategy.lpGauge();
        expect(lpGaugeAddress.toLowerCase()).to.eq(
            process.env.TRICRYPTO_LP_GAUGE?.toLowerCase(),
        );

        const lpGetterAddress = await tricryptoNativeStrategy.lpGetter();
        expect(lpGetterAddress.toLowerCase()).to.eq(
            tricryptoLPGtter.address.toLowerCase(),
        );

        const minterAddress = await tricryptoNativeStrategy.minter();
        expect(minterAddress.toLowerCase()).to.eq(
            process.env.TRICRYPTO_MINTER?.toLowerCase(),
        );

        const rewardAddress = await tricryptoNativeStrategy.rewardToken();
        expect(rewardAddress.toLowerCase()).to.eq(
            process.env.CRV_ADDRESS?.toLowerCase(),
        );

        const yieldBoxAddress = await tricryptoNativeStrategy.yieldBox();
        expect(yieldBoxAddress.toLowerCase()).to.eq(
            yieldBox.address.toLowerCase(),
        );

        const currentBalance = await tricryptoNativeStrategy.currentBalance();
        expect(currentBalance.eq(0)).to.be.true;

        const queued = await weth.balanceOf(tricryptoNativeStrategy.address);
        expect(queued.eq(0)).to.be.true;
    });

    it('should allow setting the deposit threshold', async () => {
        const { tricryptoNativeStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const currentThreshold = await tricryptoNativeStrategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await tricryptoNativeStrategy.setDepositThreshold(newThreshold);

        const finalThreshold = await tricryptoNativeStrategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should allow setting lp getter', async () => {
        const {
            tricryptoNativeStrategy,
            tricryptoLPGtter,
            deployTricryptoLPGetter,
            weth,
            yieldBox,
        } = await loadFixture(registerFork);

        const currentLpGetter = await tricryptoNativeStrategy.lpGetter();
        expect(currentLpGetter.toLowerCase()).to.eq(
            tricryptoLPGtter.address.toLowerCase(),
        );

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
        await tricryptoNativeStrategy.setTricryptoLPGetter(
            newTricryptoLpGetterDeployment.tricryptoLPGtter.address,
        );

        const finalLpGetter = await tricryptoNativeStrategy.lpGetter();
        expect(finalLpGetter.toLowerCase()).to.eq(
            newTricryptoLpGetterDeployment.tricryptoLPGtter.address.toLowerCase(),
        );
    });

    it('should queue and deposit when threshold is met', async () => {
        const { tricryptoNativeStrategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);

        const lpGaugeAddress = await tricryptoNativeStrategy.lpGauge();
        const lpGaugeContract = await ethers.getContractAt(
            'ITricryptoLPGauge',
            lpGaugeAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            tricryptoNativeStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            tricryptoNativeStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await tricryptoNativeStrategy.setDepositThreshold(amount.mul(3));

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
            tricryptoNativeStrategy.address,
        );
        let lpGaugeBalance = await lpGaugeContract.balanceOf(
            tricryptoNativeStrategy.address,
        );
        expect(strategyWethBalance.gt(0)).to.be.true;
        expect(lpGaugeBalance.eq(0)).to.be.true;
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
        strategyWethBalance = await weth.balanceOf(tricryptoNativeStrategy.address);
        lpGaugeBalance = await lpGaugeContract.balanceOf(
            tricryptoNativeStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(lpGaugeBalance.gt(0)).to.be.true;
    });

    it('should emergency withdraw', async () => {
        const {
            tricryptoNativeStrategy,
            weth,
            yieldBox,
            deployer,
            binanceWallet,
            eoa1,
        } = await loadFixture(registerFork);

        const lpGaugeAddress = await tricryptoNativeStrategy.lpGauge();
        const lpGaugeContract = await ethers.getContractAt(
            'ITricryptoLPGauge',
            lpGaugeAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            tricryptoNativeStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            tricryptoNativeStrategy.address,
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

        let invested = await lpGaugeContract.balanceOf(
            tricryptoNativeStrategy.address,
        );
        let strategyWethBalance = await weth.balanceOf(
            tricryptoNativeStrategy.address,
        );

        expect(strategyWethBalance.eq(0)).true;
        expect(invested.gt(0)).to.be.true;

        await expect(tricryptoNativeStrategy.connect(eoa1).emergencyWithdraw()).to.be
            .reverted;

        await tricryptoNativeStrategy.emergencyWithdraw();

        invested = await lpGaugeContract.balanceOf(tricryptoNativeStrategy.address);
        strategyWethBalance = await weth.balanceOf(tricryptoNativeStrategy.address);
        expect(strategyWethBalance.gt(0)).true;
        expect(invested.eq(0)).to.be.true;
    });
});
