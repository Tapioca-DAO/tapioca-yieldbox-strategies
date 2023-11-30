import { HardhatRuntimeEnvironment } from 'hardhat/types';
import _ from 'lodash';
import inquirer from 'inquirer';

export const harvestGmxOnGlp__task = async (
    {},
    hre: HardhatRuntimeEnvironment,
) => {
    const tag = await hre.SDK.hardhatUtils.askForTag(hre, 'local');
    const dep = await hre.SDK.hardhatUtils.getLocalContract(
        hre,
        'GlpStrategy',
        tag,
    );
    const strat = await hre.ethers.getContractAt(
        'GlpStrategy',
        dep.contract.address,
    );

    const { priceNum } = await inquirer.prompt({
        type: 'input',
        name: 'priceNum',
        message: 'Price numerator',
    });

    const { priceDenom } = await inquirer.prompt({
        type: 'input',
        name: 'priceDenom',
        message: 'Price denominator',
    });

    await (await strat.harvestGmx(priceNum, priceDenom)).wait(3);
};
