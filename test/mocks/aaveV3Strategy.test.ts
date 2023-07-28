import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerMocks } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import _ from 'lodash';

describe('AaveV3Strategy test', () => {
    it('should test initial strategy values', async () => {
        const { aaveV3Strategy, weth, yieldBox } = await loadFixture(
            registerMocks,
        );

        const name = await aaveV3Strategy.name();
        const description = await aaveV3Strategy.description();

        expect(name).eq('AAVE V3');
        expect(description).eq('AAVE V3 strategy for wrapped native assets');

        const contractAddress = await aaveV3Strategy.contractAddress();
        expect(contractAddress.toLowerCase()).eq(weth.address.toLowerCase());

        const aaveV3Pool = await aaveV3Strategy.aaveV3Pool();
        expect(aaveV3Pool).to.not.eq(ethers.constants.AddressZero);

        const yieldBoxAddress = await aaveV3Strategy.yieldBox();
        expect(yieldBoxAddress.toLowerCase()).to.eq(
            yieldBox.address.toLowerCase(),
        );

        const currentBalance = await aaveV3Strategy.currentBalance();
        expect(currentBalance.gt(0)).to.be.true;

        const queued = await weth.balanceOf(aaveV3Strategy.address);
        expect(queued.eq(0)).to.be.true;
    });

    it('should allow setting the deposit threshold', async () => {
        const { aaveV3Strategy, weth, yieldBox } = await loadFixture(
            registerMocks,
        );

        const currentThreshold = await aaveV3Strategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await aaveV3Strategy.setDepositThreshold(newThreshold);

        const finalThreshold = await aaveV3Strategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should queue and deposit when threshold is met', async () => {
        const {
            aaveV3Strategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            timeTravel,
        } = await loadFixture(registerMocks);
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
        await timeTravel(86400);
        await weth.freeMint(amount.mul(10));
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
        let aaveLendingPoolBalance = await weth.balanceOf(
            await aaveV3Strategy.aaveV3Pool(),
        );
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
        aaveLendingPoolBalance = await weth.balanceOf(
            await aaveV3Strategy.aaveV3Pool(),
        );

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
            timeTravel,
            __uniFactory,
            __uniRouter,
            uniV2EnvironnementSetup,
        } = await loadFixture(registerMocks);

        const lendingPoolAddress = await aaveV3Strategy.aaveV3Pool();
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
        await timeTravel(86400);
        await weth.freeMint(amount.mul(1000));
        await weth.transfer(lendingPoolAddress, amount.mul(900)); //to test extra amount received by the strategy

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
        const aaveLendingPoolBalance = await weth.balanceOf(
            await aaveV3Strategy.aaveV3Pool(),
        );
        expect(aaveStrategyWethBalance.eq(0)).to.be.true;
        expect(aaveLendingPoolBalance.gt(amount)).to.be.true; //amount was initially deposited

        await aaveV3Strategy.compound(ethers.utils.toUtf8Bytes('')); //to simulate rewards produced by mocks
        await timeTravel(86400 * 10); //10 days

        const rewardToken = await ethers.getContractAt(
            'ERC20Mock',
            await aaveV3Strategy.rewardToken(),
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

        share = await yieldBox.toShare(wethAaveStrategyAssetId, amount, false);

        const crtBalance = await aaveV3Strategy.currentBalance();
        expect(crtBalance.gt(0)).to.be.true;
        await yieldBox.withdraw(
            wethAaveStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        const finalAaveLendingPoolBalance = await weth.balanceOf(
            await aaveV3Strategy.aaveV3Pool(),
        );
    });

    it('should withdraw from queue', async () => {
        const {
            aaveV3Strategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            timeTravel,
        } = await loadFixture(registerMocks);
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

        await timeTravel(86400);
        await weth.freeMint(amount.mul(10));
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

        let aaveStrategyWethBalance = await weth.balanceOf(
            aaveV3Strategy.address,
        );
        let aaveLendingPoolBalance = await weth.balanceOf(
            await aaveV3Strategy.aaveV3Pool(),
        );
        expect(aaveStrategyWethBalance.gt(0)).to.be.true;
        expect(aaveLendingPoolBalance.eq(0)).to.be.true;

        await yieldBox.withdraw(
            wethAaveStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        aaveStrategyWethBalance = await weth.balanceOf(aaveV3Strategy.address);
        aaveLendingPoolBalance = await weth.balanceOf(
            await aaveV3Strategy.aaveV3Pool(),
        );
        expect(aaveStrategyWethBalance.lt(10)).to.be.true;
        expect(aaveLendingPoolBalance.eq(0)).to.be.true;
    });

    it('should compound rewards', async () => {
        const {
            aaveV3Strategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            timeTravel,
            __uniFactory,
            __uniRouter,
            uniV2EnvironnementSetup,
        } = await loadFixture(registerMocks);
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

        const rewardToken = await ethers.getContractAt(
            'ERC20Mock',
            await aaveV3Strategy.rewardToken(),
        );

        if (await rewardToken.hasMintRestrictions()) {
            await rewardToken.toggleRestrictions();
        }

        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);
        await aaveV3Strategy.setDepositThreshold(amount.div(10000));

        await timeTravel(86400);
        await weth.freeMint(amount.mul(10));
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        const share = await yieldBox.toShare(
            wethAaveStrategyAssetId,
            amount,
            false,
        );
        const stkAave = await aaveV3Strategy.stakedRewardToken();
        const stkAaveContract = await ethers.getContractAt('IStkAave', stkAave);
        let cooldownBefore = (
            await stkAaveContract.stakersCooldowns(aaveV3Strategy.address)
        )[0];
        expect(cooldownBefore).eq(0);

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
        const aaveLendingPoolBalance = await weth.balanceOf(
            await aaveV3Strategy.aaveV3Pool(),
        );
        expect(aaveStrategyWethBalance.eq(0)).to.be.true;
        expect(aaveLendingPoolBalance.gt(0)).to.be.true;

        timeTravel(100 * 86400);

        cooldownBefore = (
            await stkAaveContract.stakersCooldowns(aaveV3Strategy.address)
        )[0];
        expect(cooldownBefore).eq(0);
        await aaveV3Strategy.compound(ethers.utils.toUtf8Bytes(''));
        cooldownBefore = (
            await stkAaveContract.stakersCooldowns(aaveV3Strategy.address)
        )[0];

        const balanceOfStkAave = await stkAaveContract.balanceOf(
            aaveV3Strategy.address,
        );
        if (balanceOfStkAave.eq(0)) {
            expect(cooldownBefore).eq(0);
        } else {
            expect(cooldownBefore).gt(0);
        }

        const aaveStrategyWethBalanceMid = await weth.balanceOf(
            aaveV3Strategy.address,
        );
        const aaveLendingPoolBalanceMid = await weth.balanceOf(
            await aaveV3Strategy.aaveV3Pool(),
        );
        expect(aaveStrategyWethBalanceMid.eq(0)).to.be.true;

        await timeTravel(21 * 86400);
        await aaveV3Strategy.compound(ethers.utils.toUtf8Bytes(''));
        const finalCooldown = (
            await stkAaveContract.stakersCooldowns(aaveV3Strategy.address)
        )[0];
        expect(finalCooldown).eq(cooldownBefore);
        const aaveLendingPoolBalanceFinal = await weth.balanceOf(
            await aaveV3Strategy.aaveV3Pool(),
        );
        expect(aaveLendingPoolBalanceFinal.gt(aaveLendingPoolBalanceMid)).to.be
            .true;

        await timeTravel(100 * 86400);
        await aaveV3Strategy.compound(ethers.utils.toUtf8Bytes(''));
        const newCooldown = (
            await stkAaveContract.stakersCooldowns(aaveV3Strategy.address)
        )[0];
        expect(newCooldown).eq(finalCooldown);
    });
});
