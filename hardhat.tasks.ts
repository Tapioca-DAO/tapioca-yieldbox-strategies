import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';
import { deployTricrytoLPStrategy__task } from './tasks/deploy/00-deployTricryptoLP';
import { deployStrategy__task } from './tasks/deploy/01-deployStrategy';

task(
    'deployTricryptoLPStrategy',
    'Deploy TricryptoLPStrategy',
    deployTricrytoLPStrategy__task,
);

task(
    'deployStrategy',
    'Deploys a swapper contract with a deterministic address, with MulticallV3.',
    deployStrategy__task,
);
