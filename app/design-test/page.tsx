'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function DesignTestPage() {
  const { tier, setTier, accessibilityMode, setAccessibilityMode } = useTheme();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-primary">
        AetherLearn Design System Test
      </h1>

      {/* Age Tier Selector */}
      <section className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Age Tier: {tier}</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setTier('tier1')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              tier === 'tier1'
                ? 'bg-primary text-white'
                : 'bg-neutral-light text-neutral-dark hover:bg-neutral-medium'
            }`}
          >
            Tier 1 (5-8)
          </button>
          <button
            onClick={() => setTier('tier2')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              tier === 'tier2'
                ? 'bg-primary text-white'
                : 'bg-neutral-light text-neutral-dark hover:bg-neutral-medium'
            }`}
          >
            Tier 2 (9-13)
          </button>
          <button
            onClick={() => setTier('tier3')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              tier === 'tier3'
                ? 'bg-primary text-white'
                : 'bg-neutral-light text-neutral-dark hover:bg-neutral-medium'
            }`}
          >
            Tier 3 (14+)
          </button>
        </div>
      </section>

      {/* Accessibility Mode Selector */}
      <section className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">
          Accessibility Mode: {accessibilityMode}
        </h2>
        <div className="flex gap-4 flex-wrap">
          {(['default', 'dyslexia', 'focus', 'calm', 'high-contrast'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setAccessibilityMode(mode)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                accessibilityMode === mode
                  ? 'bg-primary text-white'
                  : 'bg-neutral-light text-neutral-dark hover:bg-neutral-medium'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Color Palette */}
      <section className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-6 bg-primary text-white rounded-lg shadow">Primary</div>
          <div className="p-6 bg-primary-light text-white rounded-lg shadow">Primary Light</div>
          <div className="p-6 bg-accent-warm text-white rounded-lg shadow">Accent Warm</div>
          <div className="p-6 bg-accent-coral text-white rounded-lg shadow">Accent Coral</div>
          <div className="p-6 bg-success text-white rounded-lg shadow">Success</div>
          <div className="p-6 bg-warning text-white rounded-lg shadow">Warning</div>
          <div className="p-6 bg-error text-white rounded-lg shadow">Error</div>
          <div className="p-6 bg-neutral-light text-neutral-dark rounded-lg shadow border">Neutral</div>
        </div>
      </section>

      {/* Typography Scale */}
      <section className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Typography Scale</h2>
        <div className="space-y-4">
          <p className="text-tier1-heading font-bold">Tier 1 Heading (32px)</p>
          <p className="text-tier1-body">Tier 1 Body (20px, line-height 1.75)</p>
          <p className="text-tier2-heading font-bold">Tier 2 Heading (28px)</p>
          <p className="text-tier2-body">Tier 2 Body (18px, line-height 1.6)</p>
          <p className="text-tier3-heading font-bold">Tier 3 Heading (24px)</p>
          <p className="text-tier3-body">Tier 3 Body (16px, line-height 1.5)</p>
        </div>
      </section>

      {/* Button Variants */}
      <section className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Button Variants</h2>
        <div className="flex gap-4 flex-wrap">
          <button className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
            Primary
          </button>
          <button className="px-6 py-3 bg-success hover:bg-success-dark text-white rounded-lg transition">
            Success
          </button>
          <button className="px-6 py-3 bg-warning hover:bg-warning-dark text-white rounded-lg transition">
            Warning
          </button>
          <button className="px-6 py-3 bg-error hover:bg-error-dark text-white rounded-lg transition">
            Error
          </button>
          <button className="px-6 py-3 bg-neutral-light hover:bg-neutral-medium text-neutral-dark rounded-lg transition">
            Neutral
          </button>
        </div>
      </section>
    </div>
  );
}
