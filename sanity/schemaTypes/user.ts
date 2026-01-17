import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'user',
  title: 'Utilizatori',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nume',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'role',
      title: 'Rol',
      type: 'string',
      options: {
        list: [
          {title: 'User', value: 'user'},
          {title: 'Admin', value: 'admin'},
          {title: 'Dev', value: 'dev'},
        ],
      },
      initialValue: 'user',
    }),
    defineField({
      name: 'allocatedMinutes',
      title: 'Durata rezervare (minute)',
      type: 'number',
      initialValue: 15,
      description: 'Doar admin/dev. Cat timp blocheaza un booking al acestui utilizator.',
    }),
    defineField({
      name: 'priestId',
      title: 'Preot alocat',
      type: 'string',
      description: 'ID-ul preotului ales la creare cont (din fisierul de config).',
    }),
    defineField({
      name: 'passwordHash',
      title: 'Parola (hash)',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'createdAt',
      title: 'Creat la',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'resetToken',
      title: 'Token resetare',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'resetTokenExpires',
      title: 'Expira token resetare',
      type: 'datetime',
      hidden: true,
    }),
  ],
})
