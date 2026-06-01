export function getItem(key: string): string | null {
  return localStorage.getItem(key)
}

export async function getItemAsync(key: string): Promise<string | null> {
  return localStorage.getItem(key)
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  localStorage.setItem(key, value)
}

export async function deleteItemAsync(key: string): Promise<void> {
  localStorage.removeItem(key)
}
