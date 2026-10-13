const openApi = {
  openapi: '3.0.3',
  info: { title: 'ProjectPool API', version: '1.0.0', description: 'Project discovery, student submissions, saved ideas, and moderation.' },
  servers: [{ url: '/api' }],
  paths: {
    '/health': { get: { summary: 'Check API and database health', responses: { 200: { description: 'Health status' } } } },
    '/projects': {
      get: { summary: 'Search and browse approved projects', parameters: [{ in: 'query', name: 'q', schema: { type: 'string' } }, { in: 'query', name: 'category', schema: { type: 'string' } }, { in: 'query', name: 'difficulty', schema: { type: 'string' } }, { in: 'query', name: 'tag', schema: { type: 'string' } }], responses: { 200: { description: 'Paginated catalog' } } },
      post: { summary: 'Submit a project for review', security: [{ cookieAuth: [] }], responses: { 201: { description: 'Submission created' }, 401: { description: 'Authentication required' } } },
    },
    '/projects/analytics': { get: { summary: 'Get catalog and submission analytics', responses: { 200: { description: 'Category, difficulty, activity, saved, and status metrics' } } } },
    '/projects/moderation': { get: { summary: 'Get pending submissions', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Pending submissions' }, 403: { description: 'Moderator role required' } } } },
    '/projects/moderation/bulk': { patch: { summary: 'Bulk approve or reject pending submissions', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Number of updated submissions' } } } },
    '/projects/{id}/progress': { get: { summary: 'Get the signed-in user’s milestone progress for an approved project', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Completed milestone indexes' } } }, put: { summary: 'Save project milestone progress', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Updated completed milestone indexes' } } } },
    '/projects/{id}/corrections': { post: { summary: 'Report outdated or incorrect project information', responses: { 201: { description: 'Correction report submitted' } } } },
    '/projects/corrections': { get: { summary: 'List correction reports', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Correction report queue' } } } },
    '/projects/corrections/{reportId}': { patch: { summary: 'Update a correction report status', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Updated report' } } } },
    '/collections': { get: { summary: 'List the signed-in user’s collections', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Project collections' } } }, post: { summary: 'Create a private project collection', security: [{ cookieAuth: [] }], responses: { 201: { description: 'Created collection' } } } },
    '/collections/{collectionId}': { patch: { summary: 'Update a collection or its share visibility', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Updated collection' } } }, delete: { summary: 'Delete a collection', security: [{ cookieAuth: [] }], responses: { 204: { description: 'Collection deleted' } } } },
    '/collections/{collectionId}/projects/{projectId}': { post: { summary: 'Add an approved project to a collection', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Updated collection' } } }, delete: { summary: 'Remove a project from a collection', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Updated collection' } } } },
    '/collections/shared/{shareId}': { get: { summary: 'Get a publicly shared project collection', responses: { 200: { description: 'Shared collection and approved projects' }, 404: { description: 'Share link unavailable' } } } },
    '/users/me': { get: { summary: 'Get current user', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Current user profile' } } }, patch: { summary: 'Update profile and recommendation interests', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Updated profile' } } } },
    '/users/saved': { get: { summary: 'List saved projects', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Saved project list' } } } },
  },
  components: { securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: 'projectpool_session' } } },
}

export default openApi