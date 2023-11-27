import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { loadVM } from '../utils';
import { buildSDaiStrategy } from '../deployBuilds/01-buildSDaiStrategy';
import inquirer from 'inquirer';
import { buildGlpStrategy } from '../deployBuilds/02-buildGlpStrategy';

// hh deployStrategy --network goerli
export const deployStrategy__task = async (
    {},
    hre: HardhatRuntimeEnvironment,
) => {
    const tag = await hre.SDK.hardhatUtils.askForTag(hre, 'local');
    const signer = (await hre.ethers.getSigners())[0];
    const chainInfo = hre.SDK.utils.getChainBy(
        'chainId',
        await hre.getChainId(),
    );
    console.log(
        '[+] Deploying on',
        chainInfo?.name,
        'with tag',
        tag,
        'and signer',
        signer.address,
    );

    const deployType = ['sDaiStrategy', 'GlpStrategy'] as const;
    const { buildToDeploy }: { buildToDeploy: typeof deployType[number] } =
        await inquirer.prompt({
            message: '[+] Build to deploy: ',
            name: 'buildToDeploy',
            type: 'list',
            choices: deployType,
        });

    const VM = await loadVM(hre, tag);
    // Build contracts
    if (buildToDeploy === 'sDaiStrategy') {
        const { feeRecipient } = await inquirer.prompt({
            type: 'input',
            name: 'feeRecipient',
            message: 'Fees receiver',
            default: signer.address,
        });
        const { feeBps } = await inquirer.prompt({
            type: 'input',
            name: 'feeBps',
            message: 'Fees bps',
            default: 0,
        });
        const { toftAddress } = await inquirer.prompt({
            type: 'input',
            name: 'toftAddress',
            message: 'tDai address',
            default: 0,
        });
        VM.add(
            await buildSDaiStrategy(
                hre,
                tag,
                toftAddress,
                feeRecipient,
                feeBps,
            ),
        );
    }
    if (buildToDeploy === 'GlpStrategy') {
        const { wethUsdgOracleAddress } = await inquirer.prompt({
            type: 'input',
            name: 'wethUsdgOracleAddress',
            message: 'WETH/USDG oracle address',
            default: hre.ethers.constants.AddressZero,
        });

        const { wethUsdgOracleData } = await inquirer.prompt({
            type: 'input',
            name: 'wethUsdgOracleData',
            message: 'WETH/USDG oracle data',
            default: '0x',
        });

        const { wethGlpOracleAddress } = await inquirer.prompt({
            type: 'input',
            name: 'wethGlpOracleAddress',
            message: 'WETH/GLP oracle address',
            default: hre.ethers.constants.AddressZero,
        });

        const { wethGlpOracleData } = await inquirer.prompt({
            type: 'input',
            name: 'wethGlpOracleData',
            message: 'WETH/GLP oracle data',
            default: '0x',
        });

        const { gmxGlpOracleAddress } = await inquirer.prompt({
            type: 'input',
            name: 'gmxGlpOracleAddress',
            message: 'GMX/GLP oracle address',
            default: hre.ethers.constants.AddressZero,
        });

        const { gmxGlpOracleData } = await inquirer.prompt({
            type: 'input',
            name: 'gmxGlpOracleData',
            message: 'GMX/GLP oracle data',
            default: '0x',
        });

        const { toftAddress } = await inquirer.prompt({
            type: 'input',
            name: 'toftAddress',
            message: 'tGMX address',
            default: 0,
        });

        VM.add(
            await buildGlpStrategy(
                hre,
                tag,
                toftAddress,
                wethUsdgOracleAddress,
                wethUsdgOracleData,
                wethGlpOracleAddress,
                wethGlpOracleData,
                gmxGlpOracleAddress,
                gmxGlpOracleData,
            ),
        );
    }

    const isLocal = hre.network.config.tags.includes('local');

    // Add and execute
    await VM.execute(isLocal ? 0 : 3);
    if (!isLocal) {
        VM.save();
        await VM.verify();
    }

    console.log('[+] Stack deployed! 🎉');
};
