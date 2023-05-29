import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { verify, updateDeployments, constants } from './utils';
import _ from 'lodash';
import { TContract } from 'tapioca-sdk/dist/shared';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = await hre.getChainId();
    const contracts: TContract[] = [];

    let yieldBoxAddress = constants[chainId].yieldBox;
    if (
        hre.ethers.utils.isAddress(yieldBoxAddress!) &&
        yieldBoxAddress != hre.ethers.constants.AddressZero
    ) {
        yieldBoxAddress = (await deployments.get('YieldBox')).address;
    }

    console.log('\n Deploying AAVE Strategy');
    const args = [
        constants[chainId].weth,
        yieldBoxAddress,
        constants[chainId].aaveLendingPool,
        constants[chainId].stkAave,
        constants[chainId].aaveReceiptToken,
        constants[chainId].aaveIncentivesController,
        constants[chainId].uniswapV2Router02,
    ];
    await deploy('AaveStrategy', {
        from: deployer,
        log: true,
        args,
    });
    await verify(hre, 'AaveStrategy', args);
    const deployedStrategy = await deployments.get('AaveStrategy');
    contracts.push({
        name: 'AaveStrategy',
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
func.tags = ['AaveStrategy'];
