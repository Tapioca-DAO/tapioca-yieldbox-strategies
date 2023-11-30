import { HardhatRuntimeEnvironment } from 'hardhat/types';
import _ from 'lodash';
import inquirer from 'inquirer';

export const setDepositThresholdOnSDai__task = async (
    taskArgs: {},
    hre: HardhatRuntimeEnvironment,
) => {
    const tag = await hre.SDK.hardhatUtils.askForTag(hre, 'local');
    const dep = await hre.SDK.hardhatUtils.getLocalContract(
        hre,
        'sDaiStrategy',
        tag,
    );
    const strat = await hre.ethers.getContractAt(
        'sDaiStrategy',
        dep.contract.address,
    );

    const { amount } = await inquirer.prompt({
        type: 'input',
        name: 'amount',
        message: 'Rescue amount',
    });

    await (await strat.setDepositThreshold(amount)).wait(3);
};
