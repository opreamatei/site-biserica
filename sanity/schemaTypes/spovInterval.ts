import {defineField, defineType} from 'sanity'

const spovInterval = defineType({
  name: 'spovInterval',
  title: 'Interval spovedanie',
  type: 'document',
  fields: [
    defineField({
      name: 'priestId',
      title: 'Preot (ID)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Data',
      type: 'date',
      options: {dateFormat: 'YYYY-MM-DD'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startTime',
      title: 'Ora inceput (HH:mm)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endTime',
      title: 'Ora sfarsit (HH:mm)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Eticheta',
      type: 'string',
    }),
    defineField({
      name: 'durationMinutes',
      title: 'Durata (minute)',
      type: 'number',
    }),
  ],
  preview: {
    select: {
      title: 'label',
      date: 'date',
      startTime: 'startTime',
      priestId: 'priestId',
    },
    prepare(selection: {
      title?: string
      date?: string
      startTime?: string
      priestId?: string
    }) {
      const {title, date, startTime, priestId} = selection
      return {
        title: title || 'Interval spovedanie',
        subtitle: `${date ?? ''} ${startTime ?? ''} (${priestId ?? '-'})`,
      }
    },
  },
})

export default spovInterval
