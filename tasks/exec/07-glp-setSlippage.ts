import { HardhatRuntimeEnvironment } from 'hardhat/types';
import _ from 'lodash';
import inquirer from 'inquirer';

export const setSlipapgeOnGlp__task = async (
    taskArgs: {},
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

    const { amount } = await inquirer.prompt({
        type: 'input',
        name: 'amount',
        message: 'Slippage amount',
    });

    await (await strat.setSlippage(amount)).wait(3);
};
