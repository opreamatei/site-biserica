import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Programari',

  projectId: 'emkh2o8m',
  dataset: 'dev',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
