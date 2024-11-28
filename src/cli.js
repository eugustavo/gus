#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('node:path');
const { execSync } = require('node:child_process');
const ora = require('ora');
const axios = require('axios');

const AVAILABLE_COMPONENTS = ['toast', 'badge', 'select', 'separator', 'alert-dialog'];
const COMPONENTS_REQUIRING_ICONS = ['toast', 'select'];

const CONFIG_FILE = 'gus.config.json';

const DEFAULT_CONFIG = {
  baseUrl: 'https://raw.githubusercontent.com/eugustavo/albatroz/refs/heads/main/src/components',
  packageManager: null,
  dependencies: {
    'lucide-react-native': false,
    'react-native-reanimated': false,
    'react-native-gesture-handler': false
  }
};

const formatComponentName = (name) => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const downloadComponent = async (componentName, baseUrl) => {
  try {
    const normalizedName = componentName.toLowerCase();
    const response = await axios.get(`${baseUrl}/${normalizedName}.tsx`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error('Component not found in repository');
    }
    throw error;
  }
};

const checkExpoProject = () => {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (!dependencies.expo) {
      console.error(chalk.red('\nError: This is not an Expo project, at this moment, we only support Expo projects.'));
      console.log(chalk.gray('\nPlease create a new project using:'));
      console.log(chalk.blue('\n  npx create-expo-app@latest'));
      process.exit(1);
    }

    const requiredDeps = ['react-native-reanimated', 'react-native-gesture-handler'];
    const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);

    return {
      hasExpo: true,
      missingDeps
    };
  } catch (error) {
    console.error(chalk.red('\nError: Could not find package.json'));
    console.log(chalk.yellow('\nPlease make sure you are in the root of your project.'));
    process.exit(1);
  }
};

const checkDependency = (dependency) => {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    return !!dependencies[dependency];
  } catch (error) {
    return false;
  }
};

const installDependency = async (dependency, config) => {
  const packageManager = config.packageManager;
  const installCommand = {
    npm: 'npm install',
    yarn: 'yarn add',
    pnpm: 'pnpm add'
  }[packageManager];

  execSync(`${installCommand} ${dependency}`, { stdio: 'pipe' });
};

const askForPackageManager = async () => {
  const { packageManager } = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager do you want to use for installing dependencies?',
      choices: ['npm', 'yarn', 'pnpm']
    }
  ]);

  return packageManager;
};

const ensureIconLibrary = async (config) => {
  if (!config.dependencies['lucide-react-native']) {
    try {
      await installDependency('lucide-react-native', config);
      config.dependencies['lucide-react-native'] = true;
      saveConfig(config);
    } catch (error) {
      spinner.fail(chalk.red('Failed to install lucide-react-native'));
      throw error;
    }
  }
  return config;
};

const readConfig = () => {
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
};

const saveConfig = (config) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
};

const addComponent = async (componentName, config) => {
  const spinner = ora('Adding component...').start();

  try {
    const normalizedName = componentName.toLowerCase();
    
    if (!AVAILABLE_COMPONENTS.includes(normalizedName)) {
      spinner.fail(chalk.red('Component not available'));
      console.log(chalk.blue('\nAvailable components:'));
      AVAILABLE_COMPONENTS.forEach(comp => {
        console.log(chalk.yellow(`  - ${formatComponentName(comp)}`));
      });
      return;
    }

    // Check and install required dependencies
    spinner.text = 'Checking dependencies...';
    const { missingDeps } = checkExpoProject();
    
    for (const dep of missingDeps) {
      spinner.text = `Installing ${dep}...`;
      await installDependency(dep, config);
      config.dependencies[dep] = true;
    }

    if (COMPONENTS_REQUIRING_ICONS.includes(normalizedName)) {
      spinner.text = 'Checking icon library dependency...';
      config = await ensureIconLibrary(config);
    }

    spinner.text = 'Downloading component...';
    const componentContent = await downloadComponent(componentName, config.baseUrl);
    const componentPath = path.join(process.cwd(), 'src', 'components', 'ui');
    const formattedName = formatComponentName(componentName);

    await fs.ensureDir(componentPath);
    await fs.writeFile(
      path.join(componentPath, `${formattedName}.tsx`),
      componentContent
    );

    saveConfig(config);
    
    spinner.succeed(chalk.green(`Component ${formattedName.toLowerCase()} added successfully!`));
    console.log(chalk.gray(`\nLocation: src/components/ui/${formattedName}.tsx`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed to add component ${formatComponentName(componentName)}`));
    console.error(chalk.red('\nError details:'), error.message);
  }
};

const initializeProject = async () => {
  const spinner = ora('Initializing Gus UI...').start();

  try {
    const { missingDeps } = checkExpoProject();
    
    const config = { ...DEFAULT_CONFIG };
    
    if (!config.packageManager) {
      spinner.stop();
      config.packageManager = await askForPackageManager();
      spinner.start();
    }

    // Install missing dependencies if any
    for (const dep of missingDeps) {
      spinner.text = `Installing ${dep}...`;
      await installDependency(dep, config);
      config.dependencies[dep] = true;
    }

    // Update dependency status
    config.dependencies['lucide-react-native'] = checkDependency('lucide-react-native');
    config.dependencies['react-native-reanimated'] = checkDependency('react-native-reanimated');
    config.dependencies['react-native-gesture-handler'] = checkDependency('react-native-gesture-handler');

    saveConfig(config);
    
    spinner.succeed(chalk.green('Project initialized successfully!'));
    return true;
  } catch (error) {
    spinner.fail(chalk.red('Failed to initialize project'));
    console.error(chalk.red('\nError details:'), error.message);
    process.exit(1);
  }
};

program
  .name('@gus/ui')
  .description('CLI for Gus UI components')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize Gus UI in your project')
  .action(async () => {
    await initializeProject();
  });

program
  .command('add [component]')
  .description('Add a component to your project')
  .action(async (component) => {
    try {
      if (!fs.existsSync(CONFIG_FILE)) {
        console.error(chalk.red('\nError: Project not initialized'));
        console.log(chalk.yellow('\nPlease run init command first:'));
        console.log(chalk.blue('\n  npx gus init'));
        return;
      }

      const config = readConfig();

      if (!component) {
        console.log(chalk.blue('\nAvailable components:'));
        AVAILABLE_COMPONENTS.forEach(comp => {
          console.log(chalk.yellow(`  - ${formatComponentName(comp)}`));
        });
        console.log(chalk.gray('\nUsage:'));
        console.log(chalk.yellow('  npx gus add <component>'));
        return;
      }

      await addComponent(component, config);
    } catch (error) {
      console.error(chalk.red('\nError:'), error.message);
    }
  });

program.on('command:*', () => {
  console.error(chalk.red('\nError: Invalid command'));
  console.log(chalk.gray('\nAvailable commands:'));
  console.log(chalk.yellow('  - init'));
  console.log(chalk.yellow('  - add [component]'));
  process.exit(1);
});

program.parse(process.argv);