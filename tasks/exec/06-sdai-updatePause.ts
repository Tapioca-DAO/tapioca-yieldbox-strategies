import { HardhatRuntimeEnvironment } from 'hardhat/types';
import _ from 'lodash';
import inquirer from 'inquirer';

export const updatePauseOnSDai__task = async (
    {},
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

    const { status } = await inquirer.prompt({
        type: 'confirm',
        name: 'status',
        message: 'Pause?',
    });

    await (await strat.updatePause(status)).wait(3);
};
