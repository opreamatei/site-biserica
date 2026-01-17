// bookings.ts

import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'booking',
  title: 'Programari',
  type: 'document',
  fields: [
    defineField({
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{type: 'user'}],
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
      title: 'Ora de start (HH:mm)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'peopleCount',
      title: 'Numar persoane',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.required().min(1).max(10),
    }),
    defineField({
      name: 'durationMinutes',
      title: 'Durata (minute)',
      type: 'number',
      initialValue: 30,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Book-uit', value: 'booked'},
          {title: 'Anulat', value: 'cancelled'},
        ],
        layout: 'radio',
      },
      initialValue: 'booked',
    }),
    defineField({
      name: 'priestId',
      title: 'Preot',
      type: 'string',
      description: 'ID-ul preotului pentru care este programarea.',
    }),
    defineField({
      name: 'eventId',
      title: 'Eveniment',
      type: 'string',
      description: 'ID-ul evenimentului / intervalului alocat.',
    }),
    defineField({
      name: 'eventLabel',
      title: 'Nume eveniment',
      type: 'string',
      description: 'Label-ul evenimentului pentru context rapid.',
    }),
    defineField({
      name: 'createdAt',
      title: 'Creat la',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'cancelledAt',
      title: 'Anulat la',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'user.name',
      subtitle: 'date',
      startTime: 'startTime',
      status: 'status',
    },
    prepare(selection: {title?: string; subtitle?: string; startTime?: string; status?: string}) {
      const {title, subtitle, startTime, status} = selection
      return {
        title: `${title ?? 'User necunoscut'} - ${subtitle ?? ''} ${startTime ?? ''}`,
        subtitle: status,
      }
    },
  },
})
