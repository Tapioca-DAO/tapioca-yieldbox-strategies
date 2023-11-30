import { HardhatRuntimeEnvironment } from 'hardhat/types';
import _ from 'lodash';
import inquirer from 'inquirer';

export const rescueEthOnSDai__task = async (
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

    const { amount } = await inquirer.prompt({
        type: 'input',
        name: 'amount',
        message: 'Rescue amount',
    });
    const { to } = await inquirer.prompt({
        type: 'input',
        name: 'to',
        message: 'Receiver address',
    });

    await (await strat.rescueEth(amount, to)).wait(3);
};
