import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';
import { deployTricrytoLPStrategy__task } from './tasks/deploy/00-deployTricryptoLP';
import { deployStrategy__task } from './tasks/deploy/01-deployStrategy';
import { updateFeeRecipientOnSDai__task } from './tasks/exec/01-sdai-updateFeeRecipient';
import { rescueEthOnSDai__task } from './tasks/exec/02-sdai-rescueEth';
import { setDepositThresholdOnSDai__task } from './tasks/exec/03-sdai-setDepositThreshold';
import { emergencyWithdrawOnSDai__task } from './tasks/exec/04-sdai-emergencyWithdraw';
import { withdrawFeesOnSDai__task } from './tasks/exec/05-sdai-withdrawFees';
import { setSlipapgeOnGlp__task } from './tasks/exec/07-glp-setSlippage';
import { updatePauseOnGlp__task } from './tasks/exec/11-glp-updatePause';
import { harvestGmxOnGlp__task } from './tasks/exec/08-glp-harvestGmx';
import { setFeeRecipientOnGlp__task } from './tasks/exec/09-glp-setFeeRecipient';
import { emergencyWithdrawOnGlp__task } from './tasks/exec/10-glp-emergencyWithdraw';
import { updatePauseOnSDai__task } from './tasks/exec/06-sdai-updatePause';

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

task(
    'updateFeeRecipientOnSDai',
    'Sets the fee recipient address on sDaiStrategy',
    updateFeeRecipientOnSDai__task,
);

task(
    'rescueEthOnSDai',
    'Rescues native from sDaiStrategy',
    rescueEthOnSDai__task,
);

task(
    'setDepositThresholdOnSDai',
    'Sets the deposit threshold on sDaiStrategy',
    setDepositThresholdOnSDai__task,
);

task(
    'emergencyWithdrawOnSDai',
    'Performs emergency withdraw on sDaiStrategy',
    emergencyWithdrawOnSDai__task,
);

task(
    'withdrawFeesOnSDai',
    'Withdraw fees from sDaiStrategy',
    withdrawFeesOnSDai__task,
);

task(
    'setSlipapgeOnGlp',
    'Sets slipapge percentage on GlpStrategy',
    setSlipapgeOnGlp__task,
);

task(
    'updatePauseOnGlp',
    'Pause or unpause GlpStrategy',
    updatePauseOnGlp__task,
);

task('harvestGmxOnGlp', 'Harvest GMX on GlpStrategy', harvestGmxOnGlp__task);

task(
    'setFeeRecipientOnGlp',
    'Set fee recipient on GlpStrategy',
    setFeeRecipientOnGlp__task,
);

task(
    'emergencyWithdrawOnGlp',
    'Execute emergencyWithdraw on GlpStrategy',
    emergencyWithdrawOnGlp__task,
);

task(
    'updatePauseOnSDai',
    'Pause/unpause sDaiStrategy',
    updatePauseOnSDai__task,
);
