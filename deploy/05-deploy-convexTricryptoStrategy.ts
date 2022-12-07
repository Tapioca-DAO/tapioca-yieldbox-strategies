import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {
    verify,
    updateDeployments,
    constants,
    getYieldBox,
    getTricryptoLPGetter,
} from './utils';
import _ from 'lodash';
import { TContract } from 'tapioca-sdk/dist/shared';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = await hre.getChainId();
    const contracts: TContract[] = [];

    let yieldBoxAddress = getYieldBox(chainId, deployments, hre);
    let tricryptoLpGetterAddress = getTricryptoLPGetter(
        chainId,
        deployments,
        hre,
    );

    console.log('\n Deploying Convex-Tricrypto Strategy');
    const args = [
        yieldBoxAddress,
        constants[chainId].weth,
        constants[chainId].usdt,
        constants[chainId].wbtc,
        constants[chainId].tricryptoLiquidityPool,
        tricryptoLpGetterAddress,
        constants[chainId].convexBooster,
        constants[chainId].convexTricryptoRewardPool,
        constants[chainId].convexZap,
        constants[chainId].uniswapV2Router02,
    ];
    await deploy('ConvexTricryptoStrategy', {
        from: deployer,
        log: true,
        args,
    });
    await verify(hre, 'ConvexTricryptoStrategy', args);
    const deployedStrategy = await deployments.get('ConvexTricryptoStrategy');
    contracts.push({
        name: 'ConvexTricryptoStrategy',
        address: deployedStrategy.address,
        meta: { constructorArguments: args },
    });
    console.log(
        `Done. Deployed on ${
            deployedStrategy.address
        } with args ${JSON.stringify(args)}`,
    );

    await updateDeployments(contracts, chainId);
};

export default func;
func.tags = ['ConvexTricryptoStrategy'];
