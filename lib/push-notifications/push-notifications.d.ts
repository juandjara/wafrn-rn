type Distributor = {
  id: string
  name?: string
  icon?: string
  isInternal?: boolean
  isSaved?: boolean
  isConnected?: boolean
}

export declare function usePushNotifications(): void
export declare function getSavedDistributor(): string | null
export declare function getDistributors(): Distributor[]
export declare function saveDistributor(distributorId: string | null): void
export declare function registerDevice(
  vapidKey: string,
  userId: string,
): void | Promise<unknown>
