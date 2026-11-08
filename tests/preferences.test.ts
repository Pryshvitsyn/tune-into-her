import {beforeEach,describe,expect,it,vi} from 'vitest';

import {defaultPreferences,loadPreferences,savePreferences} from '../src/storage/preferences';
const storage=vi.hoisted(()=>({getItem:vi.fn(),setItem:vi.fn()}));
vi.mock('@react-native-async-storage/async-storage',()=>({default:storage}));
beforeEach(()=>vi.clearAllMocks());
describe('persisted appearance',()=>{
 it('defaults new installs to 08:00 without overwriting a saved reminder time',async()=>{expect(defaultPreferences).toMatchObject({reminderHour:8,reminderMinute:0});storage.getItem.mockResolvedValue(JSON.stringify({reminderHour:9,reminderMinute:15}));expect(await loadPreferences()).toMatchObject({reminderHour:9,reminderMinute:15});});
 it('migrates old preferences to light without losing language',async()=>{storage.getItem.mockResolvedValue(JSON.stringify({language:'ru',onboardingComplete:true}));expect(await loadPreferences()).toMatchObject({theme:'light',language:'ru',onboardingComplete:true});});
 it('persists dark appearance through reload',async()=>{storage.setItem.mockImplementation(async (_key,value)=>{storage.getItem.mockResolvedValue(value);});await savePreferences({...defaultPreferences,theme:'dark'});expect((await loadPreferences())?.theme).toBe('dark');});
 it('handles malformed or invalid saved settings',async()=>{for(const value of ['{bad','null','[]']){storage.getItem.mockResolvedValue(value);expect(await loadPreferences()).toBeNull();}storage.getItem.mockResolvedValue(JSON.stringify({theme:'purple',language:'unknown'}));expect(await loadPreferences()).toMatchObject({theme:'light',language:'en'});});
});
