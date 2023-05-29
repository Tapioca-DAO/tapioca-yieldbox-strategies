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

    console.log('\n Deploying Stargate Uni V3 Swapper');
    const uniV3SwapperArgs = [constants[chainId].uniswapV3Router];
    await deploy('StargateSwapperV3', {
        from: deployer,
        log: true,
        args: uniV3SwapperArgs,
    });
    await verify(hre, 'StargateSwapperV3', uniV3SwapperArgs);
    const deployedSwapper = await deployments.get('StargateSwapperV3');
    contracts.push({
        name: 'StargateSwapperV3',
        address: deployedSwapper.address,
        meta: { constructorArguments: uniV3SwapperArgs },
    });
    console.log(
        `Done. Deployed on ${
            deployedSwapper.address
        } with args ${JSON.stringify(uniV3SwapperArgs)}`,
    );

    console.log('\n Deploying Stargate Strategy');
    const args = [
        yieldBoxAddress,
        constants[chainId].weth,
        constants[chainId].stargateRouterEth,
        constants[chainId].stargateLpStaking,
        constants[chainId].stargateLpStakingPid,
        constants[chainId].stargateLpToken,
        deployedSwapper,
        constants[chainId].stargateUniswapV3Pool,
    ];
    await deploy('StargateStrategy', {
        from: deployer,
        log: true,
        args,
    });
    await verify(hre, 'StargateStrategy', args);
    const deployedStrategy = await deployments.get('StargateStrategy');
    contracts.push({
        name: 'StargateStrategy',
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
func.tags = ['StargateStrategy'];
