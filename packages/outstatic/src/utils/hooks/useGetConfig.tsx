import { GET_FILE } from '@/graphql/queries/file'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { useQuery } from '@tanstack/react-query'
import { ConfigType } from '../metadata/types'
import { CONFIG_JSON_PATH } from '../constants'
import { ConfigSchema } from '../schemas/config-schema'

export const useGetConfig = ({
  enabled = true
}: {
  enabled?: boolean
} = {}) => {
  const { repoOwner, repoSlug, repoBranch, session, gqlClient } = useOutstatic()

  const filePath = `${repoBranch}:${CONFIG_JSON_PATH}`

  return useQuery({
    queryKey: ['config', { filePath }],
    queryFn: async (): Promise<ConfigType | null> => {
      const owner = repoOwner || session?.user?.login
      if (!owner) {
        throw new Error('Repository owner is not defined')
      }
      const { repository } = await gqlClient.request(GET_FILE, {
        owner,
        name: repoSlug,
        filePath
      })

      if (!repository?.object) return null

      const { text } = repository.object as {
        text: string
      }

      try {
        const config = ConfigSchema.parse(JSON.parse(text))
        return config
      } catch (error) {
        console.error('Failed to parse config:', error)
        return null
      }
    },
    meta: {
      errorMessage: `Failed to fetch config.`
    },
    enabled
  })
}
