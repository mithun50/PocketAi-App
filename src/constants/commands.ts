// Terminal commands for setup wizard

export const TERMUX_FDROID_URL = 'https://f-droid.org/en/packages/com.termux/';

export const SETUP_COMMANDS = {
  // Step 1: Update and install git
  installGit: 'pkg update && pkg install -y git curl',

  // Step 2: Clone PocketAI
  cloneRepo: 'git clone https://github.com/mithun50/PocketAi.git',

  // Step 3: Run setup
  runSetup: 'cd PocketAi && ./setup.sh',

  // Step 4: Activate environment
  activateEnv: 'source ~/.pocketai_env',

  // Step 5: Install a model
  installModel: (model: string) => `pai install ${model}`,

  // Step 6: Start API
  startApi: 'pai api start',

  // Combined first-time setup
  fullSetup: `pkg update && pkg install -y git curl
git clone https://github.com/mithun50/PocketAi.git
cd PocketAi && ./setup.sh`,

  // Daily startup
  dailyStart: 'source ~/.pocketai_env && pai api start',
};

export const RECOMMENDED_MODELS = [
  { name: 'qwen3', description: 'Qwen3 0.6B - Best tiny 2025', size: '400MB', ram: '512MB' },
  { name: 'llama3.2', description: 'Llama 3.2 1B - Best small 2025', size: '700MB', ram: '1GB' },
  { name: 'smollm2', description: 'SmolLM2 360M - Ultra light', size: '270MB', ram: '400MB' },
];
