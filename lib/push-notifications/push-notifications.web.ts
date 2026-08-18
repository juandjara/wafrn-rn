export function usePushNotifications() {
  // Dummy file to make editor happy
}

type Distributor = {
  id: string;
  name?: string;
  icon?: string;
  isInternal?: boolean;
  isSaved?: boolean;
  isConnected?: boolean;
};

export function getSavedDistributor(): string | null {
  return null
}

export function getDistributors(): Distributor[] {
  return []
}

// explicit noop
export function saveDistributor(distributorId: string | null) {}

// explicit noop
export function registerDevice(vapidKey: string, userId: string) {}

