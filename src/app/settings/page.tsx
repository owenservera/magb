// src/app/settings/page.tsx
'use client';

import { ApiKeyManager } from '@/components/settings/ApiKeyManager';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useAppStore } from '@/stores/app-store';

export default function SettingsPage() {
  const {
    defaultLanguage,
    setDefaultLanguage,
    showVitalityIndicators,
    setShowVitalityIndicators,
    codeFontSize,
    setCodeFontSize,
    theme,
    setTheme,
  } = usePreferencesStore();

  const { darkMode, setDarkMode } = useAppStore();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure your preferences and API access
        </p>
      </div>

      {/* API Key */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">API Access</h2>
        <ApiKeyManager onSave={(configs) => {
          // For backward compatibility, set the active provider's key as the main API key
          const active = configs.find((c) => c.isActive);
          if (active) {
            import('@/lib/api-client').then(({ api }) => {
              api.setApiKey(active.key);
            });
          }
        }} />
      </section>

      {/* Display Preferences */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Display</h2>
        
        <div className="space-y-2">
          <label htmlFor="theme-select" className="block text-sm font-medium">Theme</label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="vitality-toggle" className="text-sm font-medium">Show Vitality Indicators</label>
            <p className="text-xs text-muted-foreground">
              Display health badges on knowledge items
            </p>
          </div>
          <button
            type="button"
            id="vitality-toggle"
            onClick={() => setShowVitalityIndicators(!showVitalityIndicators)}
            className={`w-12 h-6 rounded-full transition-colors ${
              showVitalityIndicators ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                showVitalityIndicators ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Code Preferences */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Code Display</h2>
        
        <div className="space-y-2">
          <label htmlFor="language-select" className="block text-sm font-medium">
            Default Implementation Language
          </label>
          <select
            id="language-select"
            value={defaultLanguage}
            onChange={(e) => setDefaultLanguage(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
            <option value="c">C</option>
            <option value="java">Java</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="font-size-slider" className="block text-sm font-medium">
            Code Font Size: {codeFontSize}px
          </label>
          <input
            id="font-size-slider"
            type="range"
            min={12}
            max={20}
            value={codeFontSize}
            onChange={(e) => setCodeFontSize(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>12px</span>
            <span>20px</span>
          </div>
        </div>
      </section>
    </div>
  );
}
