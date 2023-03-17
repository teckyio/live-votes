import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

  if (!(await knex.schema.hasTable('vote_option'))) {
    await knex.schema.createTable('vote_option', table => {
      table.increments('id')
      table.text('title').notNullable()
      table.integer('votes').notNullable()
      table.timestamps(false, true)
    })
  }
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('vote_option')
}
