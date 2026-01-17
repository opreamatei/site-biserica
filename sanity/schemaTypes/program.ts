import {defineField, defineType} from 'sanity'

export const programActivity = defineType({
  name: 'programActivity',
  title: 'Activitate program',
  type: 'object',
  fields: [
    defineField({
      name: 'nume',
      title: 'Nume',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ora',
      title: 'Ora',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'nume',
      subtitle: 'ora',
    },
  },
})

export const programDay = defineType({
  name: 'programDay',
  title: 'Zi program',
  type: 'object',
  fields: [
    defineField({
      name: 'dayKey',
      title: 'Zi (cheie)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'data',
      title: 'Data',
      type: 'string',
    }),
    defineField({
      name: 'activitati',
      title: 'Activitati',
      type: 'array',
      of: [{type: 'programActivity'}],
    }),
  ],
  preview: {
    select: {
      title: 'dayKey',
      subtitle: 'data',
    },
  },
})

const program = defineType({
  name: 'program',
  title: 'Program liturgic',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titlu',
      type: 'string',
    }),
    defineField({
      name: 'days',
      title: 'Zile',
      type: 'array',
      of: [{type: 'programDay'}],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare(selection: {title?: string}) {
      return {title: selection.title || 'Program liturgic'}
    },
  },
})

export default program
