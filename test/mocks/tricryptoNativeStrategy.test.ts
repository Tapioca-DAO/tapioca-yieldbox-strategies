import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerMocks } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('TricryptoNativeStrategy test', () => {
    it('should test initial strategy values', async () => {
        const { tricryptoNativeStrategy, tricryptoLPGtter, weth, yieldBox } =
            await loadFixture(registerMocks);

        const name = await tricryptoNativeStrategy.name();
        const description = await tricryptoNativeStrategy.description();

        expect(name).eq('Curve-Tricrypto-Native');
        expect(description).eq(
            'Curve-Tricrypto strategy for wrapped native assets',
        );

        const contractAddress = await tricryptoNativeStrategy.contractAddress();
        expect(contractAddress.toLowerCase()).eq(weth.address.toLowerCase());

        const lpGaugeAddress = await tricryptoNativeStrategy.lpGauge();
        expect(lpGaugeAddress).to.not.eq(ethers.constants.AddressZero);

        const lpGetterAddress = await tricryptoNativeStrategy.lpGetter();
        expect(lpGetterAddress).to.not.eq(ethers.constants.AddressZero);

        const yieldBoxAddress = await tricryptoNativeStrategy.yieldBox();
        expect(yieldBoxAddress.toLowerCase()).to.eq(
            yieldBox.address.toLowerCase(),
        );

        // const currentBalance = await tricryptoNativeStrategy.currentBalance();
        // expect(currentBalance.eq(0)).to.be.true;

        const queued = await weth.balanceOf(tricryptoNativeStrategy.address);
        expect(queued.eq(0)).to.be.true;
    });

    it('should allow setting the deposit threshold', async () => {
        const { tricryptoNativeStrategy, weth, yieldBox } = await loadFixture(
            registerMocks,
        );

        const currentThreshold =
            await tricryptoNativeStrategy.depositThreshold();

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
        } = await loadFixture(registerMocks);

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
        const {
            tricryptoNativeStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            timeTravel,
            tricryptoLPGtter,
        } = await loadFixture(registerMocks);

        const lpGaugeAddress = await tricryptoNativeStrategy.lpGauge();
        const lpGaugeContract = await ethers.getContractAt(
            'ITricryptoLPGauge',
            lpGaugeAddress,
        );

        const lpTokenAddress = await tricryptoLPGtter.lpToken();
        const lpTokenContract = await ethers.getContractAt(
            '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
            lpTokenAddress,
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

        await timeTravel(86400);
        await weth.freeMint(amount.mul(10));
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
        strategyWethBalance = await weth.balanceOf(
            tricryptoNativeStrategy.address,
        );
        lpGaugeBalance = await lpGaugeContract.balanceOf(
            tricryptoNativeStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(lpGaugeBalance.gt(0)).to.be.true;
    });

    it('should allow deposits and withdrawals', async () => {
        const {
            tricryptoNativeStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            timeTravel,
            __uniFactory,
            __uniRouter,
            uniV2EnvironnementSetup,
        } = await loadFixture(registerMocks);

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
        expect(wethStrategyAssetId).to.not.eq(wethAssetId);
        const assetsCount = await yieldBox.assetCount();
        const assetInfo = await yieldBox.assets(assetsCount.sub(1));
        expect(assetInfo.tokenType).to.eq(1);
        expect(assetInfo.contractAddress.toLowerCase()).to.eq(
            weth.address.toLowerCase(),
        );
        expect(assetInfo.strategy.toLowerCase()).to.eq(
            tricryptoNativeStrategy.address.toLowerCase(),
        );
        expect(assetInfo.tokenId).to.eq(0);

        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);

        await timeTravel(86400);
        await weth.freeMint(amount);
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

        const lpStakingBalance = await lpGaugeContract.balanceOf(
            await tricryptoNativeStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(lpStakingBalance.gt(0)).to.be.true;

        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);

        const rewardToken = await ethers.getContractAt(
            'ERC20Mock',
            await tricryptoNativeStrategy.rewardToken(),
        );

        if (await rewardToken.hasMintRestrictions()) {
            await rewardToken.toggleRestrictions();
        }

        const wethPairAmount = ethers.BigNumber.from(1e6).mul(
            (1e18).toString(),
        );
        const rewardTokenPairAmount = ethers.BigNumber.from(1e6).mul(
            (1e18).toString(),
        );
        await uniV2EnvironnementSetup(
            deployer.address,
            __uniFactory,
            __uniRouter,
            rewardToken,
            weth,
            rewardTokenPairAmount,
            wethPairAmount,
        );

        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        strategyWethBalance = await weth.balanceOf(
            tricryptoNativeStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).to.be.true;
    });

    it('should withdraw from queue', async () => {
        const {
            tricryptoNativeStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            timeTravel,
        } = await loadFixture(registerMocks);

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

        await timeTravel(86400);
        await weth.freeMint(amount.mul(10));

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

        let strategyWethBalance = await weth.balanceOf(
            tricryptoNativeStrategy.address,
        );

        let lpStakingBalance = await lpGaugeContract.balanceOf(
            await tricryptoNativeStrategy.address,
        );
        expect(strategyWethBalance.gt(0)).to.be.true;
        expect(lpStakingBalance.eq(0)).to.be.true;

        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        strategyWethBalance = await weth.balanceOf(
            tricryptoNativeStrategy.address,
        );
        lpStakingBalance = await lpGaugeContract.balanceOf(
            await tricryptoNativeStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(lpStakingBalance.eq(0)).to.be.true;
    });
});
