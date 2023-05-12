import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerFork } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('TricryptoStrategy fork test', () => {
    it('should test initial strategy values', async () => {
        const { tricryptoStrategy, tricryptoLPGtter, weth, yieldBox } =
            await loadFixture(registerFork);

        const name = await tricryptoStrategy.name();
        const description = await tricryptoStrategy.description();

        expect(name).eq('Curve-Tricrypto');
        expect(description).eq(
            'Curve-Tricrypto strategy for wrapped native assets',
        );

        const contractAddress = await tricryptoStrategy.contractAddress();
        expect(contractAddress.toLowerCase()).eq(weth.address.toLowerCase());

        const lpGaugeAddress = await tricryptoStrategy.lpGauge();
        expect(lpGaugeAddress.toLowerCase()).to.eq(
            process.env.TRICRYPTO_LP_GAUGE?.toLowerCase(),
        );

        const lpGetterAddress = await tricryptoStrategy.lpGetter();
        expect(lpGetterAddress.toLowerCase()).to.eq(
            tricryptoLPGtter.address.toLowerCase(),
        );

        const minterAddress = await tricryptoStrategy.minter();
        expect(minterAddress.toLowerCase()).to.eq(
            process.env.TRICRYPTO_MINTER?.toLowerCase(),
        );

        const rewardAddress = await tricryptoStrategy.rewardToken();
        expect(rewardAddress.toLowerCase()).to.eq(
            process.env.CRV_ADDRESS?.toLowerCase(),
        );

        const yieldBoxAddress = await tricryptoStrategy.yieldBox();
        expect(yieldBoxAddress.toLowerCase()).to.eq(
            yieldBox.address.toLowerCase(),
        );

        const currentBalance = await tricryptoStrategy.currentBalance();
        expect(currentBalance.eq(0)).to.be.true;

        const queued = await weth.balanceOf(tricryptoStrategy.address);
        expect(queued.eq(0)).to.be.true;
    });

    it('should allow setting the deposit threshold', async () => {
        const { tricryptoStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const currentThreshold = await tricryptoStrategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await tricryptoStrategy.setDepositThreshold(newThreshold);

        const finalThreshold = await tricryptoStrategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should allow setting lp getter', async () => {
        const {
            tricryptoStrategy,
            tricryptoLPGtter,
            deployTricryptoLPGetter,
            weth,
            yieldBox,
        } = await loadFixture(registerFork);

        const currentLpGetter = await tricryptoStrategy.lpGetter();
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
        await tricryptoStrategy.setTricryptoLPGetter(
            newTricryptoLpGetterDeployment.tricryptoLPGtter.address,
        );

        const finalLpGetter = await tricryptoStrategy.lpGetter();
        expect(finalLpGetter.toLowerCase()).to.eq(
            newTricryptoLpGetterDeployment.tricryptoLPGtter.address.toLowerCase(),
        );
    });

    it('should queue and deposit when threshold is met', async () => {
        const { tricryptoStrategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);

        const lpGaugeAddress = await tricryptoStrategy.lpGauge();
        const lpGaugeContract = await ethers.getContractAt(
            'ITricryptoLPGauge',
            lpGaugeAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            tricryptoStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            tricryptoStrategy.address,
            0,
        );
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await tricryptoStrategy.setDepositThreshold(amount.mul(3));

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
            tricryptoStrategy.address,
        );
        let lpGaugeBalance = await lpGaugeContract.balanceOf(
            tricryptoStrategy.address,
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
        strategyWethBalance = await weth.balanceOf(tricryptoStrategy.address);
        lpGaugeBalance = await lpGaugeContract.balanceOf(
            tricryptoStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(lpGaugeBalance.gt(0)).to.be.true;
    });

    it('should emergency withdraw', async () => {
        const {
            tricryptoStrategy,
            weth,
            yieldBox,
            deployer,
            binanceWallet,
            eoa1,
        } = await loadFixture(registerFork);

        const lpGaugeAddress = await tricryptoStrategy.lpGauge();
        const lpGaugeContract = await ethers.getContractAt(
            'ITricryptoLPGauge',
            lpGaugeAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            tricryptoStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            tricryptoStrategy.address,
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
            tricryptoStrategy.address,
        );
        let strategyWethBalance = await weth.balanceOf(
            tricryptoStrategy.address,
        );

        expect(strategyWethBalance.eq(0)).true;
        expect(invested.gt(0)).to.be.true;

        await expect(tricryptoStrategy.connect(eoa1).emergencyWithdraw()).to.be
            .reverted;

        await tricryptoStrategy.emergencyWithdraw();

        invested = await lpGaugeContract.balanceOf(tricryptoStrategy.address);
        strategyWethBalance = await weth.balanceOf(tricryptoStrategy.address);
        expect(strategyWethBalance.gt(0)).true;
        expect(invested.eq(0)).to.be.true;
    });
});
