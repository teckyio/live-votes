import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('poll'))) {
    await knex.schema.createTable('poll', table => {
      table.increments('id')
      table.text('question').notNullable()
      table.timestamps(false, true)
    })
  }
  await knex.raw('delete from `vote_option`')
  await knex.raw(
    'alter table `vote_option` add column `poll_id` integer not null references `poll`(`id`)',
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `vote_option` drop column `poll_id`')
  await knex.schema.dropTableIfExists('poll')
}
