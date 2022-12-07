import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerFork, impersonateAccount } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import _ from 'lodash';
import { defaultAbiCoder } from '@ethersproject/abi';

describe('Strategies time dependent fork tests', () => {
    it('should increase amount in time for AAVE strategy - single user', async () => {
        const {
            aaveStrategy,
            weth,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);

        const lendingPoolAddress = await aaveStrategy.lendingPool();
        const lendingPoolContract = await ethers.getContractAt(
            'ILendingPool',
            lendingPoolAddress,
        );

        await yieldBox.registerAsset(1, weth.address, aaveStrategy.address, 0);

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            aaveStrategy.address,
            0,
        );

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
        await weth.connect(binanceWallet).transfer(deployer.address, amount);

        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);
        const initialWethBalance = await weth.balanceOf(deployer.address);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );
        expect(totalCalculatedInvestedAmount.gt(amount.sub(100))).to.be.true;

        const initialCalculatedInvestedAmount = totalCalculatedInvestedAmount;

        let currentBalance = await aaveStrategy.currentBalance();
        expect(currentBalance.gt(totalCalculatedInvestedAmount.sub(100))).to.be
            .true;

        timeTravel(200 * 86400);
        totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        expect(
            totalCalculatedInvestedAmount.gt(initialCalculatedInvestedAmount),
        ).to.be.true;
        currentBalance = await aaveStrategy.currentBalance();

        expect(currentBalance.gt(totalCalculatedInvestedAmount.sub(100))).to.be
            .true;

        let aaveLendingPoolBalance = (
            await lendingPoolContract.getUserAccountData(aaveStrategy.address)
        )[0];
        expect(
            aaveLendingPoolBalance.gt(totalCalculatedInvestedAmount.sub(100)),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        const withdrawalAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            share,
            false,
        );
        expect(withdrawalAmount.eq(totalCalculatedInvestedAmount)).to.be.true;
        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        const finalStrategyWethBalance = await weth.balanceOf(deployer.address);
        expect(finalStrategyWethBalance.gt(initialWethBalance)).to.be.true;
    });

    it('should increase amount in time for AAVE strategy - multiple users', async () => {
        const {
            aaveStrategy,
            weth,
            yieldBox,
            deployer,
            eoa1,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);

        const lendingPoolAddress = await aaveStrategy.lendingPool();
        const lendingPoolContract = await ethers.getContractAt(
            'ILendingPool',
            lendingPoolAddress,
        );

        await yieldBox.registerAsset(1, weth.address, aaveStrategy.address, 0);
        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            aaveStrategy.address,
            0,
        );

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
        await weth.connect(binanceWallet).transfer(deployer.address, amount);
        await weth.connect(binanceWallet).transfer(eoa1.address, amount);
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);
        await weth
            .connect(eoa1)
            .approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            amount,
            0,
        );

        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox
            .connect(eoa1)
            .depositAsset(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                amount,
                0,
            );

        let deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );

        let eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        let eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        let currentBalance = await aaveStrategy.currentBalance();

        expect(deployerInvestedAmount.gt(amount.sub(100))).to.be.true;
        expect(eoa1InvestedAmount.gt(amount.sub(100))).to.be.true;
        expect(
            currentBalance.gt(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        const initialDeployerInvestedAmount = deployerInvestedAmount;
        const initialEoa1InvestedAmount = eoa1InvestedAmount;

        timeTravel(200 * 86400);

        deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        currentBalance = await aaveStrategy.currentBalance();

        expect(deployerInvestedAmount.gt(initialDeployerInvestedAmount)).to.be
            .true;

        expect(eoa1InvestedAmount.gt(initialEoa1InvestedAmount)).to.be.true;
        expect(
            currentBalance.gt(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);

        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share.div(2),
        );

        share = await yieldBox.balanceOf(eoa1.address, wethStrategyAssetId);

        await yieldBox
            .connect(eoa1)
            .withdraw(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                0,
                share,
            );

        const finalDeployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        expect(finalDeployerInvestedShares.gt(0)).to.be.true;
        expect(finalDeployerInvestedShares.lt(deployerInvestedShares)).to.be
            .true;
        expect(eoa1InvestedShares.eq(0)).to.be.true;
    });

    it('should increase amount in time for YEARN strategy - single user', async () => {
        const {
            yearnStrategy,
            weth,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
            eoa1,
        } = await loadFixture(registerFork);

        const yearnVaultAddress = await yearnStrategy.vault();
        const yearnVaultContract = await ethers.getContractAt(
            'IYearnVault',
            yearnVaultAddress,
        );

        const governanceAddress = await yearnVaultContract.governance();
        await impersonateAccount(governanceAddress);
        let governanceWallet = await ethers.getSigner(governanceAddress);

        await yieldBox.registerAsset(1, weth.address, yearnStrategy.address, 0);
        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            yearnStrategy.address,
            0,
        );

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));
        await weth.connect(binanceWallet).transfer(eoa1.address, amount);

        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);
        const initialWethBalance = await weth.balanceOf(deployer.address);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        let lockedProfitDegradation =
            await yearnVaultContract.lockedProfitDegradation();

        await yearnVaultContract
            .connect(governanceWallet)
            .setLockedProfitDegradation(lockedProfitDegradation.div(10));
        lockedProfitDegradation =
            await yearnVaultContract.lockedProfitDegradation();

        let totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        expect(
            totalCalculatedInvestedAmount.gt(
                amount.sub(ethers.utils.parseEther('1')),
            ),
        ).to.be.true;

        const initialCalculatedInvestedAmount = totalCalculatedInvestedAmount;

        let currentBalance = await yearnStrategy.currentBalance();
        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(ethers.utils.parseEther('1')),
            ),
        ).to.be.true;
        timeTravel(10 * 86400);
        await weth
            .connect(eoa1)
            .approve(yieldBox.address, ethers.constants.MaxUint256);
        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox
            .connect(eoa1)
            .depositAsset(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                0,
                share,
            );
        timeTravel(200 * 86400);

        const eoa1WithdrawalAmount = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        await weth.transfer(yearnStrategy.address, '1000');
        await yieldBox
            .connect(eoa1)
            .withdraw(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                0,
                eoa1WithdrawalAmount.div(2),
            );
        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));
        await weth.approve(yearnVaultAddress, ethers.constants.MaxUint256);
        totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );
        currentBalance = await yearnStrategy.currentBalance();

        expect(
            totalCalculatedInvestedAmount.gt(initialCalculatedInvestedAmount),
        ).to.be.true;

        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(ethers.utils.parseEther('1')),
            ),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        const withdrawalAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            share,
            false,
        );
        expect(withdrawalAmount.eq(totalCalculatedInvestedAmount)).to.be.true;

        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        const finalStrategyWethBalance = await weth.balanceOf(deployer.address);
        expect(finalStrategyWethBalance.gt(initialWethBalance)).to.be.true;

        const stakeRemaining = await yearnStrategy.currentBalance();
        expect(stakeRemaining.gt(0)).to.be.true;
    });

    it('should increase amount in time for Yearn strategy - multiple users', async () => {
        const {
            yearnStrategy,
            weth,
            yieldBox,
            deployer,
            eoa1,
            eoa2,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);

        const yearnVaultAddress = await yearnStrategy.vault();
        const yearnVaultContract = await ethers.getContractAt(
            'IYearnVault',
            yearnVaultAddress,
        );

        const governanceAddress = await yearnVaultContract.governance();
        await impersonateAccount(governanceAddress);
        let governanceWallet = await ethers.getSigner(governanceAddress);

        await yieldBox.registerAsset(1, weth.address, yearnStrategy.address, 0);
        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            yearnStrategy.address,
            0,
        );

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
        await weth.connect(binanceWallet).transfer(deployer.address, amount);
        await weth.connect(binanceWallet).transfer(eoa1.address, amount);
        await weth.connect(binanceWallet).transfer(eoa2.address, amount);
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);
        await weth
            .connect(eoa1)
            .approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            amount,
            0,
        );

        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox
            .connect(eoa1)
            .depositAsset(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                amount,
                0,
            );

        let deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );

        let eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        let eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        let currentBalance = await yearnStrategy.currentBalance();

        expect(deployerInvestedAmount.gt(amount.sub(100))).to.be.true;
        expect(eoa1InvestedAmount.gt(amount.sub(100))).to.be.true;
        expect(
            currentBalance.gt(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        const initialDeployerInvestedAmount = deployerInvestedAmount;
        const initialEoa1InvestedAmount = eoa1InvestedAmount;

        timeTravel(10 * 86400);
        await weth
            .connect(eoa2)
            .approve(yieldBox.address, ethers.constants.MaxUint256);
        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox
            .connect(eoa2)
            .depositAsset(
                wethStrategyAssetId,
                eoa2.address,
                eoa2.address,
                0,
                share,
            );
        timeTravel(200 * 86400);

        deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        currentBalance = await yearnStrategy.currentBalance();

        expect(deployerInvestedAmount.gte(initialDeployerInvestedAmount)).to.be
            .true;

        expect(eoa1InvestedAmount.gte(initialEoa1InvestedAmount)).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);

        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share.div(2),
        );

        share = await yieldBox.balanceOf(eoa1.address, wethStrategyAssetId);

        await yieldBox
            .connect(eoa1)
            .withdraw(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                0,
                share,
            );

        const finalDeployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        expect(finalDeployerInvestedShares.gt(0)).to.be.true;
        expect(finalDeployerInvestedShares.lt(deployerInvestedShares)).to.be
            .true;
        expect(eoa1InvestedShares.eq(0)).to.be.true;
    });

    it('should increase amount in time for COMPOUND strategy - single user', async () => {
        const {
            compoundStrategy,
            weth,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
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

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        const initialWethBalance = await weth.balanceOf(deployer.address);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        expect(
            totalCalculatedInvestedAmount.gt(
                amount.sub(ethers.utils.parseEther('0.1')),
            ),
        ).to.be.true;

        const initialCalculatedInvestedAmount = totalCalculatedInvestedAmount;

        let currentBalance = await compoundStrategy.currentBalance();
        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(
                    ethers.utils.parseEther('0.1'),
                ),
            ),
        ).to.be.true;

        timeTravel(200 * 86400);

        await cTokenContract.accrueInterest();

        totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        expect(
            totalCalculatedInvestedAmount.gt(initialCalculatedInvestedAmount),
        ).to.be.true;
        currentBalance = await compoundStrategy.currentBalance();

        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(
                    ethers.utils.parseEther('0.1'),
                ),
            ),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        const withdrawalAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            share,
            false,
        );

        expect(withdrawalAmount.eq(totalCalculatedInvestedAmount)).to.be.true;

        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        const finalStrategyWethBalance = await weth.balanceOf(deployer.address);
        expect(finalStrategyWethBalance.gt(initialWethBalance)).to.be.true;
    });

    it('should increase amount in time for COMPOUND strategy - multiple users', async () => {
        const {
            compoundStrategy,
            weth,
            yieldBox,
            deployer,
            eoa1,
            eoa2,
            binanceWallet,
            timeTravel,
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

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
        await weth.connect(binanceWallet).transfer(deployer.address, amount);
        await weth.connect(binanceWallet).transfer(eoa1.address, amount);
        await weth.connect(binanceWallet).transfer(eoa2.address, amount);
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);
        await weth
            .connect(eoa1)
            .approve(yieldBox.address, ethers.constants.MaxUint256);
        await weth
            .connect(eoa2)
            .approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            amount,
            0,
        );

        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox
            .connect(eoa1)
            .depositAsset(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                amount,
                0,
            );

        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox
            .connect(eoa2)
            .depositAsset(
                wethStrategyAssetId,
                eoa2.address,
                eoa2.address,
                amount,
                0,
            );

        let deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );

        let eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        let eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        let eoa2InvestedShares = await yieldBox.balanceOf(
            eoa2.address,
            wethStrategyAssetId,
        );
        let eoa2InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa2InvestedShares,
            false,
        );

        let currentBalance = await compoundStrategy.currentBalance();

        expect(deployerInvestedAmount.gt(amount.sub(100))).to.be.true;
        expect(eoa1InvestedAmount.gt(amount.sub(100))).to.be.true;
        expect(
            currentBalance.gt(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        const initialDeployerInvestedAmount = deployerInvestedAmount;
        const initialEoa1InvestedAmount = eoa1InvestedAmount;

        timeTravel(200 * 86400);
        await cTokenContract.accrueInterest();
        await cTokenContract.connect(eoa1).accrueInterest();

        deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        currentBalance = await compoundStrategy.currentBalance();

        expect(deployerInvestedAmount.gt(initialDeployerInvestedAmount)).to.be
            .true;

        expect(eoa1InvestedAmount.gt(initialEoa1InvestedAmount)).to.be.true;
        expect(
            currentBalance.gt(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share.div(2),
        );

        share = await yieldBox.balanceOf(eoa1.address, wethStrategyAssetId);
        await yieldBox
            .connect(eoa1)
            .withdraw(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                0,
                share,
            );

        const finalDeployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        expect(finalDeployerInvestedShares.gt(0)).to.be.true;
        expect(finalDeployerInvestedShares.lt(deployerInvestedShares)).to.be
            .true;
        expect(eoa1InvestedShares.eq(0)).to.be.true;
    });

    it('should increase amount in time for LIDO strategy - single user', async () => {
        const {
            lidoEthStrategy,
            weth,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
            eoa1,
        } = await loadFixture(registerFork);

        const stEthAddress = await lidoEthStrategy.stEth();
        const stEthContract = await ethers.getContractAt(
            'IStEth',
            stEthAddress,
        );

        const curvePoolAddress = await lidoEthStrategy.curveStEthPool();
        const curvePoolContract = await ethers.getContractAt(
            'ICurveEthStEthPool',
            curvePoolAddress,
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

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);

        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        const initialWethBalance = await weth.balanceOf(deployer.address);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        expect(
            totalCalculatedInvestedAmount.gt(
                amount.sub(ethers.utils.parseEther('0.1')),
            ),
        ).to.be.true;

        const initialCalculatedInvestedAmount = totalCalculatedInvestedAmount;

        let currentBalance = await lidoEthStrategy.currentBalance();
        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(
                    ethers.utils.parseEther('0.1'),
                ),
            ),
        ).to.be.true;

        timeTravel(200 * 86400);

        //perform some ETH>stETH swaps to increase curve's pool ratio
        await weth
            .connect(binanceWallet)
            .transfer(eoa1.address, amount.mul(10));

        await weth
            .connect(eoa1)
            .approve(curvePoolAddress, ethers.constants.MaxUint256);

        await curvePoolContract
            .connect(eoa1)
            .exchange(0, 1, ethers.utils.parseEther('150'), 0, {
                value: ethers.utils.parseEther('150'),
            });

        totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        expect(
            totalCalculatedInvestedAmount.gt(initialCalculatedInvestedAmount),
        ).to.be.true;
        currentBalance = await lidoEthStrategy.currentBalance();

        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(
                    ethers.utils.parseEther('0.1'),
                ),
            ),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        const withdrawalAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            share,
            false,
        );

        expect(withdrawalAmount.eq(totalCalculatedInvestedAmount)).to.be.true;
        const calcSwapAmount = await curvePoolContract.get_dy(
            1,
            0,
            withdrawalAmount,
        );
        if (calcSwapAmount.gt(withdrawalAmount)) {
            await yieldBox.withdraw(
                wethStrategyAssetId,
                deployer.address,
                deployer.address,
                0,
                share,
            );
            const finalStrategyWethBalance = await weth.balanceOf(
                deployer.address,
            );
            expect(finalStrategyWethBalance.gt(initialWethBalance)).to.be.true;
        } else {
            await expect(
                yieldBox.withdraw(
                    wethStrategyAssetId,
                    deployer.address,
                    deployer.address,
                    0,
                    share,
                ),
            ).to.be.revertedWith('LidoStrategy: not enough');
        }
    });

    it('should increase amount in time for LIDO strategy - multiple users', async () => {
        const {
            lidoEthStrategy,
            weth,
            yieldBox,
            deployer,
            eoa1,
            eoa2,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);
        const swapError = ethers.utils.parseEther('0.1');

        const stEthAddress = await lidoEthStrategy.stEth();
        const stEthContract = await ethers.getContractAt(
            'IStEth',
            stEthAddress,
        );

        const curvePoolAddress = await lidoEthStrategy.curveStEthPool();
        const curvePoolContract = await ethers.getContractAt(
            'ICurveEthStEthPool',
            curvePoolAddress,
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

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
        await weth.connect(binanceWallet).transfer(deployer.address, amount);
        await weth.connect(binanceWallet).transfer(eoa1.address, amount);
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);
        await weth
            .connect(eoa1)
            .approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            amount,
            0,
        );

        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox
            .connect(eoa1)
            .depositAsset(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                amount,
                0,
            );

        let deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );

        let eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        let eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        let currentBalance = await lidoEthStrategy.currentBalance();
        let currentBalanceShares = await yieldBox.toShare(
            wethStrategyAssetId,
            lidoEthStrategy.currentBalance(),
            false,
        );

        expect(deployerInvestedAmount.gt(amount.sub(swapError))).to.be.true;
        expect(eoa1InvestedAmount.gt(amount.sub(swapError))).to.be.true;
        expect(
            currentBalanceShares
                .add(swapError)
                .gt(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        const initialDeployerInvestedAmount = deployerInvestedAmount;
        const initialEoa1InvestedAmount = eoa1InvestedAmount;

        timeTravel(200 * 86400);

        //perform some ETH>stETH swaps to increase curve's pool ratio
        await weth
            .connect(binanceWallet)
            .transfer(eoa2.address, amount.mul(100));

        await weth
            .connect(eoa2)
            .approve(curvePoolAddress, ethers.constants.MaxUint256);

        await curvePoolContract
            .connect(eoa2)
            .exchange(0, 1, ethers.utils.parseEther('1500'), 0, {
                value: ethers.utils.parseEther('1500'),
            });

        deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        currentBalance = await lidoEthStrategy.currentBalance();

        expect(deployerInvestedAmount.gt(initialDeployerInvestedAmount)).to.be
            .true;

        expect(eoa1InvestedAmount.gt(initialEoa1InvestedAmount)).to.be.true;
        expect(
            currentBalance.gt(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        let withdrawalAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            share,
            false,
        );
        let calcSwapAmount = await curvePoolContract.get_dy(
            1,
            0,
            withdrawalAmount,
        );
        if (calcSwapAmount.gt(withdrawalAmount)) {
            await yieldBox.withdraw(
                wethStrategyAssetId,
                deployer.address,
                deployer.address,
                0,
                share.div(2),
            );
            const finalDeployerInvestedShares = await yieldBox.balanceOf(
                deployer.address,
                wethStrategyAssetId,
            );
            expect(finalDeployerInvestedShares.gt(0)).to.be.true;
            expect(finalDeployerInvestedShares.lt(deployerInvestedShares)).to.be
                .true;
        } else {
            await expect(
                yieldBox.withdraw(
                    wethStrategyAssetId,
                    deployer.address,
                    deployer.address,
                    0,
                    share.div(2),
                ),
            ).to.be.reverted;
        }

        share = await yieldBox.balanceOf(eoa1.address, wethStrategyAssetId);
        withdrawalAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            share,
            false,
        );
        calcSwapAmount = await curvePoolContract.get_dy(1, 0, withdrawalAmount);

        if (calcSwapAmount.gt(withdrawalAmount)) {
            await yieldBox
                .connect(eoa1)
                .withdraw(
                    wethStrategyAssetId,
                    eoa1.address,
                    eoa1.address,
                    0,
                    share,
                );

            eoa1InvestedShares = await yieldBox.balanceOf(
                eoa1.address,
                wethStrategyAssetId,
            );

            expect(eoa1InvestedShares.eq(0)).to.be.true;
        } else {
            await expect(
                yieldBox
                    .connect(eoa1)
                    .withdraw(
                        wethStrategyAssetId,
                        eoa1.address,
                        eoa1.address,
                        0,
                        share,
                    ),
            ).to.be.reverted;
        }
    });

    //skipped as it takes too much to run and sometimes fails (unknown reasons)
    it.skip('should increase amount in time for TRICRYPTO strategy - single user', async () => {
        const {
            tricryptoStrategy,
            weth,
            usdt,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
            eoa1,
        } = await loadFixture(registerFork);

        const lpGaugeAddress = await tricryptoStrategy.lpGauge();
        const lpGaugeContract = await ethers.getContractAt(
            'ITricryptoLPGauge',
            lpGaugeAddress,
        );

        const lpGetterAddress = await tricryptoStrategy.lpGetter();
        const lpGetterContract = await ethers.getContractAt(
            'ITricryptoLPGetter',
            lpGetterAddress,
        );

        const curvePoolAddress = await lpGetterContract.liquidityPool();
        const curvePoolContract = await ethers.getContractAt(
            'ITricryptoLiquidityPool',
            curvePoolAddress,
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

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);

        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        const initialWethBalance = await weth.balanceOf(deployer.address);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        expect(
            totalCalculatedInvestedAmount.gt(
                amount.sub(ethers.utils.parseEther('0.1')),
            ),
        ).to.be.true;

        const initialCalculatedInvestedAmount = totalCalculatedInvestedAmount;

        let currentBalance = await tricryptoStrategy.currentBalance();
        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(
                    ethers.utils.parseEther('0.1'),
                ),
            ),
        ).to.be.true;

        timeTravel(200 * 86400);

        //perform some USDT>WETH swaps to increase curve's pool ratio
        const swapMintAmount = ethers.BigNumber.from((1e18).toString()).mul(
            300,
        );
        await weth
            .connect(binanceWallet)
            .transfer(eoa1.address, swapMintAmount);
        await weth
            .connect(eoa1)
            .approve(curvePoolAddress, ethers.constants.MaxUint256);
        const swapBalance = await weth.balanceOf(eoa1.address);
        expect(swapBalance.eq(swapMintAmount)).to.be.true;

        const witdrawOneCoinBefore =
            await curvePoolContract.calc_withdraw_one_coin(
                ethers.utils.parseEther('1'),
                2,
            );
        await curvePoolContract
            .connect(eoa1)
            .exchange(2, 0, swapMintAmount, '1', false);

        const witdrawOneCoinAfter =
            await curvePoolContract.calc_withdraw_one_coin(
                ethers.utils.parseEther('1'),
                2,
            );
        expect(witdrawOneCoinAfter.gt(witdrawOneCoinBefore)).to.be.true;

        totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        expect(
            totalCalculatedInvestedAmount.gt(initialCalculatedInvestedAmount),
        ).to.be.true;
        currentBalance = await tricryptoStrategy.currentBalance();

        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(
                    ethers.utils.parseEther('0.1'),
                ),
            ),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        let withdrawalAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            share,
            false,
        );

        expect(withdrawalAmount.eq(totalCalculatedInvestedAmount)).to.be.true;

        const totalLPs = await lpGaugeContract.balanceOf(
            tricryptoStrategy.address,
        );
        const obtainable = await curvePoolContract.calc_withdraw_one_coin(
            totalLPs,
            2,
        );
        if (obtainable.gt(withdrawalAmount)) {
            await yieldBox.withdraw(
                wethStrategyAssetId,
                deployer.address,
                deployer.address,
                0,
                share,
            );
            const finalStrategyWethBalance = await weth.balanceOf(
                deployer.address,
            );
            expect(finalStrategyWethBalance.gte(initialWethBalance)).to.be.true;
        } else {
            await expect(
                yieldBox.withdraw(
                    wethStrategyAssetId,
                    deployer.address,
                    deployer.address,
                    0,
                    share,
                ),
            ).to.be.revertedWith('TricryptoStrategy: not enough');
        }
    });

    //skipped as it takes too much to run and sometimes fails (unknown reasons)
    it.skip('should increase amount in time for TRICRYPTO strategy - multiple users', async () => {
        const {
            tricryptoStrategy,
            weth,
            yieldBox,
            deployer,
            eoa1,
            eoa2,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);
        const swapError = ethers.utils.parseEther('0.01');

        const lpGaugeAddress = await tricryptoStrategy.lpGauge();
        const lpGaugeContract = await ethers.getContractAt(
            'ITricryptoLPGauge',
            lpGaugeAddress,
        );

        const lpGetterAddress = await tricryptoStrategy.lpGetter();
        const lpGetterContract = await ethers.getContractAt(
            'ITricryptoLPGetter',
            lpGetterAddress,
        );

        const curvePoolAddress = await lpGetterContract.liquidityPool();
        const curvePoolContract = await ethers.getContractAt(
            'ITricryptoLiquidityPool',
            curvePoolAddress,
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

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
        await weth.connect(binanceWallet).transfer(deployer.address, amount);
        await weth.connect(binanceWallet).transfer(eoa1.address, amount);
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);
        await weth
            .connect(eoa1)
            .approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            amount,
            0,
        );

        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox
            .connect(eoa1)
            .depositAsset(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                amount,
                0,
            );

        let deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );

        let eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        let eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        let currentBalance = await tricryptoStrategy.currentBalance();

        expect(deployerInvestedAmount.add(swapError).gt(amount)).to.be.true;
        expect(eoa1InvestedAmount.add(swapError).gt(amount)).to.be.true;
        expect(
            currentBalance
                .add(swapError)
                .gt(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        const initialDeployerInvestedAmount = deployerInvestedAmount;
        const initialEoa1InvestedAmount = eoa1InvestedAmount;

        timeTravel(200 * 86400);

        //perform some USDT>WETH swaps to increase curve's pool ratio
        const swapMintAmount = ethers.BigNumber.from((1e18).toString()).mul(
            300,
        );
        await weth
            .connect(binanceWallet)
            .transfer(eoa2.address, swapMintAmount);
        await weth
            .connect(eoa2)
            .approve(curvePoolAddress, ethers.constants.MaxUint256);
        const swapBalance = await weth.balanceOf(eoa2.address);
        expect(swapBalance.eq(swapMintAmount)).to.be.true;

        const witdrawOneCoinBefore =
            await curvePoolContract.calc_withdraw_one_coin(
                ethers.utils.parseEther('1'),
                2,
            );
        await curvePoolContract
            .connect(eoa2)
            .exchange(2, 0, swapMintAmount, '1', false);

        const witdrawOneCoinAfter =
            await curvePoolContract.calc_withdraw_one_coin(
                ethers.utils.parseEther('1'),
                2,
            );
        expect(witdrawOneCoinAfter.gt(witdrawOneCoinBefore)).to.be.true;

        deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        currentBalance = await tricryptoStrategy.currentBalance();

        expect(deployerInvestedAmount.gt(initialDeployerInvestedAmount)).to.be
            .true;

        expect(eoa1InvestedAmount.gt(initialEoa1InvestedAmount)).to.be.true;
        expect(
            currentBalance
                .add(swapError)
                .gt(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share.div(2),
            {
                gasLimit: 4000000,
            },
        );

        share = await yieldBox.balanceOf(eoa1.address, wethStrategyAssetId);

        await yieldBox
            .connect(eoa1)
            .withdraw(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                0,
                share,
                {
                    gasLimit: 4000000,
                },
            );

        const finalDeployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        expect(finalDeployerInvestedShares.gt(0)).to.be.true;
        expect(finalDeployerInvestedShares.lt(deployerInvestedShares)).to.be
            .true;
        expect(eoa1InvestedShares.eq(0)).to.be.true;
    });

    it.skip('should increase amount in time for CONVEX-TRICRYPTO strategy - single user', async () => {
        const {
            convexTricryptoStrategy,
            weth,
            usdt,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
            eoa1,
        } = await loadFixture(registerFork);

        const lpToken = await convexTricryptoStrategy.lpToken();
        const lpTokenContract = await ethers.getContractAt(
            'ERC20Mock',
            lpToken,
        );
        const rewardPoolAddress = await convexTricryptoStrategy.rewardPool();
        const rewardPoolContract = await ethers.getContractAt(
            'IConvexRewardPool',
            rewardPoolAddress,
        );

        const lpGetterAddress = await convexTricryptoStrategy.lpGetter();
        const lpGetterContract = await ethers.getContractAt(
            'ITricryptoLPGetter',
            lpGetterAddress,
        );

        const curvePoolAddress = await lpGetterContract.liquidityPool();
        const curvePoolContract = await ethers.getContractAt(
            'ITricryptoLiquidityPool',
            curvePoolAddress,
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            convexTricryptoStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            convexTricryptoStrategy.address,
            0,
        );

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);

        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        const initialWethBalance = await weth.balanceOf(deployer.address);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        expect(
            totalCalculatedInvestedAmount.gt(
                amount.sub(ethers.utils.parseEther('0.1')),
            ),
        ).to.be.true;

        const initialCalculatedInvestedAmount = totalCalculatedInvestedAmount;

        let currentBalance = await convexTricryptoStrategy.currentBalance();
        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(
                    ethers.utils.parseEther('0.1'),
                ),
            ),
        ).to.be.true;

        timeTravel(200 * 86400);

        const swapMintAmount = ethers.BigNumber.from((1e18).toString()).mul(
            300,
        );
        await weth
            .connect(binanceWallet)
            .transfer(eoa1.address, swapMintAmount);
        await weth
            .connect(eoa1)
            .approve(curvePoolAddress, ethers.constants.MaxUint256);
        const swapBalance = await weth.balanceOf(eoa1.address);
        expect(swapBalance.eq(swapMintAmount)).to.be.true;

        const witdrawOneCoinBefore =
            await curvePoolContract.calc_withdraw_one_coin(
                ethers.utils.parseEther('1'),
                2,
            );
        await curvePoolContract
            .connect(eoa1)
            .exchange(2, 0, swapMintAmount, '1', false);

        const witdrawOneCoinAfter =
            await curvePoolContract.calc_withdraw_one_coin(
                ethers.utils.parseEther('1'),
                2,
            );
        expect(witdrawOneCoinAfter.gt(witdrawOneCoinBefore)).to.be.true;

        totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        expect(
            totalCalculatedInvestedAmount.gt(initialCalculatedInvestedAmount),
        ).to.be.true;
        currentBalance = await convexTricryptoStrategy.currentBalance();

        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(
                    ethers.utils.parseEther('0.1'),
                ),
            ),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        let withdrawalAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            share,
            false,
        );

        expect(withdrawalAmount.eq(totalCalculatedInvestedAmount)).to.be.true;

        const totalLPs = await rewardPoolContract.balanceOf(
            convexTricryptoStrategy.address,
        );
        const obtainable = await curvePoolContract.calc_withdraw_one_coin(
            totalLPs,
            2,
        );

        if (obtainable.gt(withdrawalAmount)) {
            await yieldBox.withdraw(
                wethStrategyAssetId,
                deployer.address,
                deployer.address,
                0,
                share,
            );
            const finalStrategyWethBalance = await weth.balanceOf(
                deployer.address,
            );
            expect(finalStrategyWethBalance.gte(initialWethBalance)).to.be.true;
        } else {
            await expect(
                yieldBox.withdraw(
                    wethStrategyAssetId,
                    deployer.address,
                    deployer.address,
                    0,
                    share,
                ),
            ).to.be.revertedWith('ConvexTricryptoStrategy: not enough');
        }
    });

    it('should increase amount in time for BALANCER strategy - single user', async () => {
        const {
            balancerStrategy,
            weth,
            usdt,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
            eoa1,
        } = await loadFixture(registerFork);

        const lpTokenAddress = await balancerStrategy.pool();
        const lpTokenContract = await ethers.getContractAt(
            'IBalancerPool',
            lpTokenAddress,
        );

        const vaultAddress = await balancerStrategy.vault();
        const vaultContract = await ethers.getContractAt(
            'IBalancerVault',
            vaultAddress,
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

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);

        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        const initialWethBalance = await weth.balanceOf(deployer.address);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        expect(
            totalCalculatedInvestedAmount.gt(
                amount.sub(ethers.utils.parseEther('0.1')),
            ),
        ).to.be.true;

        const initialCalculatedInvestedAmount = totalCalculatedInvestedAmount;

        let currentBalance = await balancerStrategy.currentBalance();

        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(
                    ethers.utils.parseEther('0.1'),
                ),
            ),
        ).to.be.true;

        timeTravel(200 * 86400);

        // //add more BAL into the pool to increase WETH ratio
        const balAmount = ethers.BigNumber.from((1e18).toString()).mul(100000);
        const balToken = await ethers.getContractAt(
            'ERC20',
            process.env.BALANCER_TOKEN!,
        );

        totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        currentBalance = await balancerStrategy.currentBalance();

        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(
                    ethers.utils.parseEther('0.1'),
                ),
            ),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        let withdrawalAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            share,
            false,
        );

        expect(withdrawalAmount.eq(totalCalculatedInvestedAmount)).to.be.true;

        let obtainable = await balancerStrategy.callStatic.updateCache();
        obtainable = obtainable.add(
            await weth.balanceOf(balancerStrategy.address),
        );

        if (obtainable.gte(withdrawalAmount)) {
            await yieldBox.withdraw(
                wethStrategyAssetId,
                deployer.address,
                deployer.address,
                0,
                share,
            );
            const finalStrategyWethBalance = await weth.balanceOf(
                deployer.address,
            );
            const stratRemainingWeth = await weth.balanceOf(
                balancerStrategy.address,
            );
            expect(stratRemainingWeth.eq(0)).to.be.true;
            // expect(finalStrategyWethBalance.gte(initialWethBalance)).to.be.true;
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

    it('should increase amount in time for BALANCER strategy - multiple users', async () => {
        const {
            balancerStrategy,
            weth,
            yieldBox,
            deployer,
            eoa1,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);
        const swapError = ethers.utils.parseEther('0.1');

        const lpTokenAddress = await balancerStrategy.pool();
        const lpTokenContract = await ethers.getContractAt(
            'IBalancerPool',
            lpTokenAddress,
        );

        const vaultAddress = await balancerStrategy.vault();
        const vaultContract = await ethers.getContractAt(
            'IBalancerVault',
            vaultAddress,
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

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
        await weth.connect(binanceWallet).transfer(deployer.address, amount);
        await weth.connect(binanceWallet).transfer(eoa1.address, amount);
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);
        await weth
            .connect(eoa1)
            .approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            amount,
            0,
        );

        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox
            .connect(eoa1)
            .depositAsset(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                amount,
                0,
            );

        let deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );

        let eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        let eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        let currentBalance = await balancerStrategy.currentBalance();

        expect(deployerInvestedAmount.add(swapError).gt(amount)).to.be.true;
        expect(eoa1InvestedAmount.add(swapError).gt(amount)).to.be.true;
        expect(
            currentBalance
                .add(swapError)
                .gt(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        const initialDeployerInvestedAmount = deployerInvestedAmount;
        const initialEoa1InvestedAmount = eoa1InvestedAmount;

        timeTravel(200 * 86400);

        deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        currentBalance = await balancerStrategy.currentBalance();

        expect(deployerInvestedAmount.gte(initialDeployerInvestedAmount)).to.be
            .true;

        expect(eoa1InvestedAmount.gte(initialEoa1InvestedAmount)).to.be.true;
        expect(
            currentBalance.gte(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);

        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share.div(2),
        );

        share = await yieldBox.balanceOf(eoa1.address, wethStrategyAssetId);

        await yieldBox
            .connect(eoa1)
            .withdraw(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                0,
                share,
            );

        const finalDeployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        expect(finalDeployerInvestedShares.gt(0)).to.be.true;
        expect(finalDeployerInvestedShares.lt(deployerInvestedShares)).to.be
            .true;
        expect(eoa1InvestedShares.eq(0)).to.be.true;
    });

    it('should increase amount in time for STARGATE strategy - single user', async () => {
        const {
            stargateStrategy,
            weth,
            usdt,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
            eoa1,
        } = await loadFixture(registerFork);

        const stgNative = await stargateStrategy.stgNative();
        const stgNativeContract = await ethers.getContractAt(
            '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
            stgNative,
        );

        const routerEth = await stargateStrategy.addLiquidityRouter();
        const routerEthContract = await ethers.getContractAt(
            'IRouterETH',
            routerEth,
        );

        const lpStakingContract = await ethers.getContractAt(
            'ILPStaking',
            await stargateStrategy.lpStaking(),
        );
        const lpStakingPid = await stargateStrategy.lpStakingPid();

        const poolInfo = await lpStakingContract.poolInfo(
            await stargateStrategy.lpStakingPid(),
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            stargateStrategy.address,
            0,
        );

        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            stargateStrategy.address,
            0,
        );

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);

        await weth
            .connect(binanceWallet)
            .transfer(deployer.address, amount.mul(10));
        const initialWethBalance = await weth.balanceOf(deployer.address);

        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        let totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        expect(
            totalCalculatedInvestedAmount.gt(
                amount.sub(ethers.utils.parseEther('0.1')),
            ),
        ).to.be.true;

        const initialCalculatedInvestedAmount = totalCalculatedInvestedAmount;

        let currentBalance = await stargateStrategy.currentBalance();

        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(
                    ethers.utils.parseEther('0.1'),
                ),
            ),
        ).to.be.true;

        const lpStakingOwner = await lpStakingContract.owner();
        await impersonateAccount(lpStakingOwner);
        const lpStakingSigner = await ethers.getSigner(lpStakingOwner);

        await lpStakingContract
            .connect(lpStakingSigner)
            .setStargatePerBlock(
                ethers.BigNumber.from((1e18).toString()).mul(20000),
            );

        const modifiedStgPerBlock = await lpStakingContract.stargatePerBlock();
        expect(
            modifiedStgPerBlock.eq(
                ethers.BigNumber.from((1e18).toString()).mul(20000),
            ),
        ).to.be.true;
        timeTravel(200 * 86400);

        //others deposit to the strategy
        await weth
            .connect(binanceWallet)
            .transfer(eoa1.address, amount.mul(250));

        const wethContract = await ethers.getContractAt(
            'INative',
            weth.address,
        );

        await wethContract.connect(eoa1).withdraw(amount.mul(250));
        await routerEthContract
            .connect(eoa1)
            .addLiquidityETH({ value: amount.mul(250) });
        const toStake = await stgNativeContract.balanceOf(eoa1.address);

        await stgNativeContract
            .connect(eoa1)
            .approve(lpStakingContract.address, ethers.constants.MaxUint256);
        await lpStakingContract.connect(eoa1).deposit(lpStakingPid, toStake);

        await lpStakingContract.updatePool(lpStakingPid);
        timeTravel(10 * 86400);
        const lpStaked = (
            await lpStakingContract
                .connect(eoa1)
                .userInfo(lpStakingPid, eoa1.address)
        )[0];

        totalCalculatedInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        totalCalculatedInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            totalCalculatedInvestedShares,
            false,
        );

        currentBalance = await stargateStrategy.currentBalance();

        expect(
            currentBalance.gt(
                totalCalculatedInvestedAmount.sub(
                    ethers.utils.parseEther('0.1'),
                ),
            ),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        let withdrawalAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            share,
            false,
        );

        expect(withdrawalAmount.eq(totalCalculatedInvestedAmount)).to.be.true;

        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        const finalStrategyWethBalance = await weth.balanceOf(deployer.address);
        expect(finalStrategyWethBalance.gte(initialWethBalance)).to.be.true;
    });

    it('should increase amount in time for STARGATE strategy - multiple users', async () => {
        const {
            stargateStrategy,
            weth,
            yieldBox,
            deployer,
            eoa1,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);
        const swapError = await ethers.utils.parseEther('0.01');

        const stgNative = await stargateStrategy.stgNative();
        const stgNativeContract = await ethers.getContractAt(
            '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
            stgNative,
        );

        const routerEth = await stargateStrategy.addLiquidityRouter();
        const routerEthContract = await ethers.getContractAt(
            'IRouterETH',
            routerEth,
        );

        const lpStakingContract = await ethers.getContractAt(
            'ILPStaking',
            await stargateStrategy.lpStaking(),
        );
        const lpStakingPid = await stargateStrategy.lpStakingPid();

        const poolInfo = await lpStakingContract.poolInfo(
            await stargateStrategy.lpStakingPid(),
        );

        await yieldBox.registerAsset(
            1,
            weth.address,
            stargateStrategy.address,
            0,
        );
        const wethStrategyAssetId = await yieldBox.ids(
            1,
            weth.address,
            stargateStrategy.address,
            0,
        );

        const amount = ethers.BigNumber.from((1e18).toString()).mul(1);
        await weth.connect(binanceWallet).transfer(deployer.address, amount);
        await weth.connect(binanceWallet).transfer(eoa1.address, amount);
        await weth.approve(yieldBox.address, ethers.constants.MaxUint256);
        await weth
            .connect(eoa1)
            .approve(yieldBox.address, ethers.constants.MaxUint256);

        let share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.depositAsset(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            amount,
            0,
        );

        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox
            .connect(eoa1)
            .depositAsset(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                amount,
                0,
            );

        let deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        let deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );

        let eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        let eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        let currentBalance = await stargateStrategy.currentBalance();

        expect(deployerInvestedAmount.add(swapError).gt(amount)).to.be.true;
        expect(eoa1InvestedAmount.add(swapError).gt(amount)).to.be.true;
        expect(
            currentBalance
                .add(swapError)
                .gt(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        const initialDeployerInvestedAmount = deployerInvestedAmount;
        const initialEoa1InvestedAmount = eoa1InvestedAmount;

        timeTravel(200 * 86400);
        await lpStakingContract.updatePool(lpStakingPid);

        deployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        deployerInvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            deployerInvestedShares,
            false,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        eoa1InvestedAmount = await yieldBox.toAmount(
            wethStrategyAssetId,
            eoa1InvestedShares,
            false,
        );

        currentBalance = await stargateStrategy.currentBalance();

        expect(deployerInvestedAmount.gt(initialDeployerInvestedAmount)).to.be
            .true;

        expect(eoa1InvestedAmount.gt(initialEoa1InvestedAmount)).to.be.true;
        expect(
            currentBalance.gt(deployerInvestedAmount.add(eoa1InvestedAmount)),
        ).to.be.true;

        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share.div(2),
        );
        return;

        share = await yieldBox.balanceOf(eoa1.address, wethStrategyAssetId);
        await yieldBox
            .connect(eoa1)
            .withdraw(
                wethStrategyAssetId,
                eoa1.address,
                eoa1.address,
                0,
                share,
            );

        const finalDeployerInvestedShares = await yieldBox.balanceOf(
            deployer.address,
            wethStrategyAssetId,
        );
        eoa1InvestedShares = await yieldBox.balanceOf(
            eoa1.address,
            wethStrategyAssetId,
        );
        expect(finalDeployerInvestedShares.gt(0)).to.be.true;
        expect(finalDeployerInvestedShares.lt(deployerInvestedShares)).to.be
            .true;
        expect(eoa1InvestedShares.eq(0)).to.be.true;
    });
});
