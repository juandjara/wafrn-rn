export function getItem(key: string): string | null {
  if (typeof localStorage === 'undefined') {
    return null
  }
  return localStorage.getItem(key)
}

export async function getItemAsync(key: string): Promise<string | null> {
  if (typeof localStorage === 'undefined') {
    return null
  }
  return localStorage.getItem(key)
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (typeof localStorage === 'undefined') {
    return
  }
  localStorage.setItem(key, value)
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (typeof localStorage === 'undefined') {
    return
  }
  localStorage.removeItem(key)
}
