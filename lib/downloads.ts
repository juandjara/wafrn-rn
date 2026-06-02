import { useToasts } from './toasts'
import { useMutation } from '@tanstack/react-query'
import { downloadToDevice } from './files'

export type DownloadToGalleryPayload = {
  url: string
  mime: string
}

export function useDownloadToGalleryMutation() {
  const { showToastSuccess, showToastError } = useToasts()
  return useMutation<void, Error, DownloadToGalleryPayload>({
    mutationKey: ['download-to-gallery'],
    mutationFn: ({ url, mime }) => downloadToDevice(url, mime),
    onSuccess: () => showToastSuccess('Downloaded to gallery'),
    onError: (error) => {
      console.error('Error downloading file:', error)
      showToastError('Failed to download')
    },
  })
}
