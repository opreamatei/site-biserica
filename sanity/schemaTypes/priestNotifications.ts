import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'priestNotification',
  title: 'Notificari preoti',
  type: 'document',
  fields: [
    defineField({
      name: 'priestId',
      title: 'Preot',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'eventId',
      title: 'Eveniment',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'eventDate',
      title: 'Data eveniment',
      type: 'date',
      options: {dateFormat: 'YYYY-MM-DD'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'eventStartTime',
      title: 'Ora inceput',
      type: 'string',
    }),
    defineField({
      name: 'type',
      title: 'Tip notificare',
      type: 'string',
      options: {
        list: [
          {title: 'Programata', value: 'scheduled'},
          {title: 'Complet', value: 'full'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sentAt',
      title: 'Trimis la',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'recipient',
      title: 'Destinatar',
      type: 'string',
    }),
  ],
})
