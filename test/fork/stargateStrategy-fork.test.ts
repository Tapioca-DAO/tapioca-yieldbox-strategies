import { expect } from 'chai';
import { ethers } from 'hardhat';
import { registerFork } from '../test.utils';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('StargateStrategy fork test', () => {
    it('should test initial strategy values', async () => {
        const { stargateStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const name = await stargateStrategy.name();
        const description = await stargateStrategy.description();

        expect(name).eq('Stargate');
        expect(description).eq('Stargate strategy for wrapped native assets');

        const contractAddress = await stargateStrategy.contractAddress();
        expect(contractAddress.toLowerCase()).eq(weth.address.toLowerCase());

        const routerEth = await stargateStrategy.addLiquidityRouter();
        expect(routerEth.toLowerCase()).to.eq(
            process.env.STARGATE_ROUTER_ETH?.toLowerCase(),
        );

        const addLiquidityRouterContract = await ethers.getContractAt(
            'IRouterETH',
            routerEth,
        );

        const router = await stargateStrategy.router();
        expect(router.toLowerCase()).to.eq(
            (await addLiquidityRouterContract.stargateRouter()).toLowerCase(),
        );

        const lpStaking = await stargateStrategy.lpStaking();
        expect(lpStaking.toLowerCase()).to.eq(
            process.env.STARGATE_LP_STAKING?.toLowerCase(),
        );

        const yieldBoxAddress = await stargateStrategy.yieldBox();
        expect(yieldBoxAddress.toLowerCase()).to.eq(
            yieldBox.address.toLowerCase(),
        );

        const queued = await weth.balanceOf(stargateStrategy.address);
        expect(queued.eq(0)).to.be.true;
    });

    it('should allow setting the deposit threshold', async () => {
        const { stargateStrategy, weth, yieldBox } = await loadFixture(
            registerFork,
        );

        const currentThreshold = await stargateStrategy.depositThreshold();

        const newThreshold = ethers.BigNumber.from((1e18).toString()).mul(10);
        await stargateStrategy.setDepositThreshold(newThreshold);

        const finalThreshold = await stargateStrategy.depositThreshold();

        expect(currentThreshold).to.not.eq(finalThreshold);
    });

    it('should queue and deposit when threshold is met', async () => {
        const {
            stargateStrategy,
            weth,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);

        const routerEth = await stargateStrategy.addLiquidityRouter();
        const lpStakingContract = await ethers.getContractAt(
            'ILPStaking',
            await stargateStrategy.lpStaking(),
        );
        const lpStakingPid = await stargateStrategy.lpStakingPid();

        const poolInfo = await lpStakingContract.poolInfo(
            await stargateStrategy.lpStakingPid(),
        );
        const lpToken = await ethers.getContractAt(
            '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
            poolInfo[0],
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
        await stargateStrategy.setDepositThreshold(amount.mul(3));

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
            stargateStrategy.address,
        );

        let lpStakingBalance = (
            await lpStakingContract.userInfo(
                lpStakingPid,
                stargateStrategy.address,
            )
        )[0];

        expect(strategyWethBalance.gt(0)).to.be.true;
        expect(lpStakingBalance.eq(0)).to.be.true;

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
            share,
        );
        strategyWethBalance = await weth.balanceOf(stargateStrategy.address);

        timeTravel(100 * 86400);

        lpStakingBalance = lpStakingBalance = (
            await lpStakingContract.userInfo(
                lpStakingPid,
                stargateStrategy.address,
            )
        )[0];
        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(lpStakingBalance.gt(0)).to.be.true;
    });

    it('should allow deposits and withdrawals', async () => {
        const {
            stargateStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            timeTravel,
        } = await loadFixture(registerFork);

        const routerEth = await stargateStrategy.addLiquidityRouter();
        const lpStakingContract = await ethers.getContractAt(
            'ILPStaking',
            await stargateStrategy.lpStaking(),
        );
        const lpStakingPid = await stargateStrategy.lpStakingPid();

        const poolInfo = await lpStakingContract.poolInfo(
            await stargateStrategy.lpStakingPid(),
        );
        const lpToken = await ethers.getContractAt(
            '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
            poolInfo[0],
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
        expect(wethStrategyAssetId).to.not.eq(wethAssetId);
        const assetsCount = await yieldBox.assetCount();
        const assetInfo = await yieldBox.assets(assetsCount.sub(1));
        expect(assetInfo.tokenType).to.eq(1);
        expect(assetInfo.contractAddress.toLowerCase()).to.eq(
            weth.address.toLowerCase(),
        );
        expect(assetInfo.strategy.toLowerCase()).to.eq(
            stargateStrategy.address.toLowerCase(),
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

        let strategyWethBalance = await weth.balanceOf(
            stargateStrategy.address,
        );

        let lpStakingBalance = (
            await lpStakingContract.userInfo(
                lpStakingPid,
                stargateStrategy.address,
            )
        )[0];

        expect(strategyWethBalance.eq(0)).to.be.true;
        expect(lpStakingBalance.gt(0)).to.be.true;
        timeTravel(100 * 86400);
        share = await yieldBox.balanceOf(deployer.address, wethStrategyAssetId);
        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );
        strategyWethBalance = await weth.balanceOf(stargateStrategy.address);
        expect(strategyWethBalance.eq(0)).to.be.true;
    });

    it('should withdraw from queue', async () => {
        const { stargateStrategy, weth, yieldBox, deployer, binanceWallet } =
            await loadFixture(registerFork);

        const routerEth = await stargateStrategy.addLiquidityRouter();
        const lpStakingContract = await ethers.getContractAt(
            'ILPStaking',
            await stargateStrategy.lpStaking(),
        );
        const lpStakingPid = await stargateStrategy.lpStakingPid();

        const poolInfo = await lpStakingContract.poolInfo(
            await stargateStrategy.lpStakingPid(),
        );
        const lpToken = await ethers.getContractAt(
            '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
            poolInfo[0],
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
        const amount = ethers.BigNumber.from((1e18).toString()).mul(10);

        await stargateStrategy.setDepositThreshold(amount.mul(3));

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
            stargateStrategy.address,
        );

        let lpStakingBalance = (
            await lpStakingContract.userInfo(
                lpStakingPid,
                stargateStrategy.address,
            )
        )[0];
        expect(strategyWethBalance.gt(0)).to.be.true;
        expect(lpStakingBalance.eq(0)).to.be.true;

        share = await yieldBox.toShare(wethStrategyAssetId, amount, false);
        await yieldBox.withdraw(
            wethStrategyAssetId,
            deployer.address,
            deployer.address,
            0,
            share,
        );

        const finalStrategyWethBalance = await weth.balanceOf(
            stargateStrategy.address,
        );
        lpStakingBalance = (
            await lpStakingContract.userInfo(
                lpStakingPid,
                stargateStrategy.address,
            )
        )[0];
        expect(finalStrategyWethBalance.lt(strategyWethBalance)).to.be.true;
        expect(lpStakingBalance.eq(0)).to.be.true;
    });

    it('should emergency withdraw', async () => {
        const {
            stargateStrategy,
            weth,
            wethAssetId,
            yieldBox,
            deployer,
            binanceWallet,
            eoa1,
        } = await loadFixture(registerFork);

        const routerEth = await stargateStrategy.addLiquidityRouter();
        const lpStakingContract = await ethers.getContractAt(
            'ILPStaking',
            await stargateStrategy.lpStaking(),
        );
        const lpStakingPid = await stargateStrategy.lpStakingPid();

        const poolInfo = await lpStakingContract.poolInfo(
            await stargateStrategy.lpStakingPid(),
        );
        const lpToken = await ethers.getContractAt(
            '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
            poolInfo[0],
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
        expect(wethStrategyAssetId).to.not.eq(wethAssetId);
        const assetsCount = await yieldBox.assetCount();
        const assetInfo = await yieldBox.assets(assetsCount.sub(1));
        expect(assetInfo.tokenType).to.eq(1);
        expect(assetInfo.contractAddress.toLowerCase()).to.eq(
            weth.address.toLowerCase(),
        );
        expect(assetInfo.strategy.toLowerCase()).to.eq(
            stargateStrategy.address.toLowerCase(),
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

        let invested = (
            await lpStakingContract.userInfo(
                lpStakingPid,
                stargateStrategy.address,
            )
        )[0];
        let strategyWethBalance = await weth.balanceOf(
            stargateStrategy.address,
        );
        expect(strategyWethBalance.eq(0)).true;
        expect(invested.gt(0)).to.be.true;

        await expect(stargateStrategy.connect(eoa1).emergencyWithdraw()).to.be
            .reverted;

        await stargateStrategy.emergencyWithdraw();

        invested = (
            await lpStakingContract.userInfo(
                lpStakingPid,
                stargateStrategy.address,
            )
        )[0];
        strategyWethBalance = await weth.balanceOf(stargateStrategy.address);
        expect(strategyWethBalance.gt(0)).true;
        expect(invested.lt(10)).to.be.true;
    });
});
