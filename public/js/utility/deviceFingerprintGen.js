// Best practice: Avoid raw PII; hash everything before sending.
async function generateDeviceFingerprint() {
    const components = {
        userAgent: navigator.userAgent, // Stable, high entropy
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency?.toString(),
        deviceMemory: navigator.deviceMemory?.toString(),
        touchSupport: [
            'ontouchstart' in window,
            navigator.maxTouchPoints > 0,
        ].includes(true).toString(),
    };

    // Optional: Stable plugin list — low value, consider removing for GDPR
    if (navigator.plugins) {
        components.plugins = Array.from(navigator.plugins)
            .map(p => p.name)
            .sort()
            .join(','); // Sorted for consistency
    }

    // Join all component values deterministically
    const rawFingerprint = Object.entries(components)
        .sort(([a], [b]) => a.localeCompare(b)) // sort keys for consistent hash
        .map(([, value]) => value)
        .join('||');

    const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(rawFingerprint)
    );

    // Convert buffer to hex string
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
