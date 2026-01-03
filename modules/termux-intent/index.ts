import { NativeModule, requireNativeModule } from 'expo-modules-core';

interface TermuxIntentModule extends NativeModule {
  runCommand(command: string): Promise<boolean>;
}

export default requireNativeModule<TermuxIntentModule>('TermuxIntent');
