/**
 * Device & Installation Service
 * 
 * Manages the unique identity of this installation to support
 * the "One Device, One Installation" policy.
 */

const INSTALLATION_KEY = 'unity_within_installation_id';

/**
 * Generates a high-entropy UUID for this installation.
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Initializes and retrieves the persistent Installation ID for this device.
 */
export function getInstallationId(): string {
    let id = localStorage.getItem(INSTALLATION_KEY);
    
    if (!id) {
        id = generateUUID();
        localStorage.setItem(INSTALLATION_KEY, id);
    }
    
    return id;
}

/**
 * Clears the installation ID (e.g. for complete reset/reinstall simulation).
 */
export function resetInstallationId(): void {
    localStorage.removeItem(INSTALLATION_KEY);
}

/**
 * Helper to get standard headers for API calls including device identity.
 */
export function getDeviceHeaders(): Record<string, string> {
    return {
        'x-installation-id': getInstallationId()
    };
}
